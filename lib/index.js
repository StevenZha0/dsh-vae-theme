/**
 * dsh-vae-theme —— 《庐州月 · 许嵩》DSH Web 界面主题（Host 半）
 *
 * 职责：
 *   1. 把内置的主题预设（theme.tczp）与页面运行时装（runtime.js）作为静态资源提供；
 *   2. 通过 webServer.tapIndex 在 index.html 的 <head> 注入经典（非 defer）脚本，
 *      先于应用模块执行，把主题写入 dsh-theme-customizer 的 localStorage 配置键，
 *      并把预设写入其 IndexedDB 预设库；
 *   3. 额外提供 /vae-theme-apply 一键应用页与 /vae-theme-status 自检接口。
 *
 * 自包含：主题与脚本随包分发，不依赖任何工作区路径。
 */
import { readFileSync } from 'node:fs'

/** 本包内静态资源（随包分发，路径基于 import.meta.url）。 */
const THEME_URL = new URL('./theme.tczp', import.meta.url)
const RUNTIME_URL = new URL('./runtime.js', import.meta.url)

/** 种子版本由「配置内容哈希」导出：主题一改版本号就变，浏览器必定重新写入。 */
const SEED_PATH = '/vae-theme-seed.js'
const PRESET_ID = 'vae-luzhou-1'
const PRESET_NAME = '庐州月 · 许嵩'
/** 历史预设 id（含已废弃的「现场版」），种子写入时一并清理。 */
const STALE_IDS = ['vae-luzhou-2', 'vae-luzhou-3', 'vae-luzhou-4', 'vae-luzhou-5']

/** djb2 字符串哈希（36 进制）；仅用于版本号，不用于任何安全用途。 */
function hash32(str) {
  let h = 5381
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0
  return h.toString(36)
}

export const name = 'vae-theme'

/**
 * 必须等 webServer 就绪后再挂载。
 *
 * bundle 层的加载顺序不保证 webServer 已经提供；若本插件执行过早，
 * ctx.get('webServer') 会是 undefined，于是静默退出、四条路由全部缺失
 * （表现：/vae-theme-status 与 /vae-theme-seed.js 都返回 404）。
 * 声明 inject 后 Cordis 会等待该服务，并在其出现后重新激活本插件。
 */
export const inject = ['webServer']

/** 防止「inject 重新激活」与「兜底轮询」两条路径重复挂载。 */
let mounted = false

/** 需要 webServer 才能工作；缺失时安静退出而不是抛错拖垮整个 profile。 */
export function apply(ctx) {
  const webServer = ctx.get('webServer')
  if (webServer === undefined) {
    if (mounted) return
    /* 兜底：万一 inject 未被生效，轮询等待 webServer 出现（最多约 15 秒）。
       此时尚未注册任何东西，等到了再调用一次 apply 即可。 */
    let tries = 0
    const timer = setInterval(() => {
      tries++
      if (ctx.get('webServer') !== undefined) {
        clearInterval(timer)
        try { apply(ctx) } catch (error) {
          log(ctx, 'error', `等待 webServer 后挂载失败：${String((error && error.message) || error)}`)
        }
      } else if (tries > 75) {
        clearInterval(timer)
        log(ctx, 'warn', '等待 webServer 超时，主题注入未启用')
      }
    }, 200)
    try { ctx.effect(() => () => clearInterval(timer), 'vae-theme: wait webServer') } catch (e) {}
    return
  }
  if (mounted) return
  mounted = true

  let theme = null
  let themeText = null
  let runtime = null
  let seedVersion = null
  let loadError = null
  let servedSeedCount = 0
  let lastSeedAt = null
  /** 浏览器回传的真实 DOM 尺寸报告（用于校准竖排歌词定位）。 */
  let pageReport = null
  let pageReportAt = null
  /** 启动信标环形缓冲：回答"运行时装有没有执行、执行到哪一步" */
  const beacons = []
  /** 完整实测报告环形缓冲 */
  const reports = []
  /* ── 查看桥（agent-bridge）──
     要解决的问题：AI 侧看不到浏览器里真实渲染出来的东西（无头浏览器打开 DSH 只是个空壳），
     而"把这段脚本粘到控制台"每问一次就要打扰用户一次，不能作为常规通道。
     做法：运行时装本来就被注进页面，让**页面自己**来取命令、跑完把结果送回本机路由。
     于是"执行页面代码"这件事不再需要用户做任何操作。
     边界：只接受来自本机同源页面的请求；命令由 AI 侧写入；结果只存在内存里。 */
  const bridgeOut = []          // 待页面领取的命令
  const bridgeIn = new Map()    // 已回收的结果 id -> 结果
  const bridgeLog = []          // 领过命令但迟迟没回的，也记一笔便于排查
  const routes = {}

  function load() {
    if (theme !== null && runtime !== null) return
    try {
      themeText = readFileSync(THEME_URL, 'utf8')
      theme = JSON.parse(themeText)
      if (!theme || typeof theme !== 'object' || !theme.areas) throw new Error('主题配置结构非法')
      runtime = readFileSync(RUNTIME_URL, 'utf8')
      /* 版本号 = 配置全文哈希 + 各区域图片/透明度指纹 + 运行时装长度 */
      const fingerprint = Object.keys(theme.areas).map((k) => {
        const area = theme.areas[k] || {}
        const image = area.image
        return `${k}:${image && image.dataURI ? hash32(image.dataURI) : 'none'}:${area.opacity || 0}`
      }).join('|')
      seedVersion = `vae-${hash32(themeText)}-${hash32(fingerprint + runtime.length)}`
      loadError = null
      log(ctx, 'info', `已载入主题（${Object.keys(theme.areas).length} 区域）+ 运行时装 ${Math.round(runtime.length / 1024)}KB；seedVersion=${seedVersion}`)
    } catch (error) {
      loadError = String((error && error.message) || error)
      log(ctx, 'error', `加载主题资源失败：${loadError}`)
      throw error
    }
  }

  function presetSeed() {
    return (
      '(function(){\n' +
      '  var CFG = ' + JSON.stringify(theme) + ';\n' +
      '  var KEY = "theme-customizer-config-v1", MARK = "vae-theme-seed", VER = ' + JSON.stringify(seedVersion) + ';\n' +
      '  var FXKEY = "vae-theme-fx-v1";\n' +
      '  var ID = ' + JSON.stringify(PRESET_ID) + ', NAME = ' + JSON.stringify(PRESET_NAME) + ';\n' +
      '  var STALE = ' + JSON.stringify(STALE_IDS) + ';\n' +
      '  window.__VAE_SEED_OK__ = false;\n' +
      '  window.__VAE_SEED_ERR__ = null;\n' +
      '  window.__VAE_SEED_BYTES__ = 0;\n' +
      '  try {\n' +
      '    var payload = JSON.stringify(CFG);\n' +
      '    window.__VAE_SEED_BYTES__ = payload.length;\n' +
      '    if (window.localStorage.getItem(MARK) !== VER) {\n' +
      '      window.localStorage.setItem(KEY, payload);\n' +
      '      /* 动态素材必须存进**自己的键**：theme-customizer-config-v1 归定制器所有，\n' +
      '         它加载时会规范化并写回，只保留自己认识的字段 —— vaeFx 会被丢掉，\n' +
      '         于是"服务端有资源、浏览器里没有"，动效时有时无。 */\n' +
      '      if (CFG.vaeFx) window.localStorage.setItem(FXKEY, JSON.stringify(CFG.vaeFx));\n' +
      '      window.localStorage.setItem("theme-customizer-last-applied", ID);\n' +
      '      window.localStorage.setItem(MARK, VER);\n' +
      '    }\n' +
      '    window.__VAE_SEED_OK__ = true;\n' +
      '    try {\n' +
      '      var r = window.indexedDB.open("theme-customizer-presets", 1);\n' +
      '      r.onupgradeneeded = function(){ var d = r.result; if (!d.objectStoreNames.contains("presets")) d.createObjectStore("presets", { keyPath: "id" }); };\n' +
      '      r.onsuccess = function(){\n' +
      '        try {\n' +
      '          var d = r.result, t = d.transaction("presets", "readwrite"), s = t.objectStore("presets");\n' +
      '          for (var i = 0; i < STALE.length; i++) { try { s.delete(STALE[i]); } catch (e) {} }\n' +
      '          s.put({ id: ID, name: NAME, savedAt: Date.now(), data: CFG });\n' +
      '        } catch (e) {}\n' +
      '      };\n' +
      '    } catch (e) {}\n' +
      '  } catch (e) {\n' +
      '    window.__VAE_SEED_ERR__ = String((e && e.name) || "") + ": " + String((e && e.message) || e);\n' +
      '  }\n' +
      '})();\n'
    )
  }

  function applyPage() {
    return (
      '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">' +
      '<title>正在应用《庐州月 · 许嵩》主题…</title>' +
      '<style>html,body{margin:0;height:100%}' +
      'body{background:#0B1016;color:#DCE5EA;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:18px;font-family:"Microsoft YaHei",system-ui,sans-serif}' +
      'h1{font-family:"STXingkai","KaiTi",serif;font-size:54px;font-weight:400;letter-spacing:.16em;margin:0}' +
      'p{color:#8FA5B3;font-size:13px;margin:0;letter-spacing:.12em}' +
      '.bar{width:220px;height:2px;background:rgba(220,229,234,.12);overflow:hidden;border-radius:2px}' +
      '.bar i{display:block;height:100%;width:40%;background:#B23A2E;animation:sl 1.1s ease-in-out infinite}' +
      '@keyframes sl{0%{transform:translateX(-100%)}100%{transform:translateX(350%)}}</style></head><body>' +
      '<h1>庐州月</h1><div class="bar"><i></i></div>' +
      '<p id="st">正在写入主题配置…</p>' +
      '<script src="' + SEED_PATH + '"><\/script>' +
      '<script>(function(){var ok=window.__VAE_SEED_OK__===true;' +
      'document.getElementById("st").textContent=ok?"配置已写入，正在进入界面…":"写入失败，请返回首页手动刷新";' +
      'window.setTimeout(function(){window.location.replace("/")},ok?700:2600)})();<\/script></body></html>'
    )
  }

  function registerRoute(path, handler, label) {
    try {
      const dispose = webServer.register({ kind: 'exact', path, handler })
      ctx.effect(() => dispose, `vae-theme: ${label}`)
      routes[label] = 'registered'
    } catch (error) {
      routes[label] = 'skipped'
      log(ctx, 'warn', `路由 ${path} 已被占用，跳过`)
    }
  }

  registerRoute(SEED_PATH, async (req, res) => {
    try {
      load()
      const body = presetSeed() + '\n' + runtime
      servedSeedCount += 1
      lastSeedAt = new Date().toISOString()
      res.writeHead(200, {
        'content-type': 'application/javascript; charset=utf-8',
        'content-length': String(Buffer.byteLength(body, 'utf8')),
        'cache-control': 'no-store',
      })
      res.end(body)
    } catch (error) {
      const message = `vae-theme seed error: ${String((error && error.message) || error)}`
      log(ctx, 'error', message)
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
      res.end(message)
    }
  }, 'seed')

  registerRoute('/vae-theme-apply', async (req, res) => {
    try {
      load()
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' })
      res.end(applyPage())
    } catch (error) {
      res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' })
      res.end(`vae-theme apply error: ${String((error && error.message) || error)}`)
    }
  }, 'apply')

  try {
    const disposeTap = webServer.tapIndex((html) => {
      if (typeof html !== 'string') return html
      if (html.indexOf(SEED_PATH) !== -1) return html
      const tag = `<script src="${SEED_PATH}"></script>`
      const head = /<head[^>]*>/i.exec(html)
      if (head) return html.slice(0, head.index + head[0].length) + tag + html.slice(head.index + head[0].length)
      return tag + html
    })
    ctx.effect(() => disposeTap, 'vae-theme: index tap')
    routes.tap = 'registered'
  } catch (error) {
    routes.tap = 'failed'
    log(ctx, 'warn', `index 注入注册失败：${String((error && error.message) || error)}`)
  }

  /* 浏览器把实测尺寸与启动信标 POST 回来。
     信标（{beacon:'ok:water'} 这类）与完整报告混在一起上报，
     所以这里分开存：信标进环形缓冲，完整报告覆盖单个槽位。 */
  registerRoute('/vae-theme-report', async (req, res) => {
    let body = ''
    try {
      for await (const chunk of req) {
        body += chunk
        if (body.length > 200000) break
      }
      const at = new Date().toISOString()
      let isBeacon = false
      try {
        const o = JSON.parse(body)
        isBeacon = !!o && typeof o.beacon === 'string'
      } catch (e) {}
      if (isBeacon) {
        beacons.push({ at, body })
        if (beacons.length > 40) beacons.shift()
      } else {
        pageReport = body
        pageReportAt = at
        reports.push({ at, body })
        if (reports.length > 6) reports.shift()
      }
    } catch (error) {
      log(ctx, 'warn', `读取页面报告失败：${String((error && error.message) || error)}`)
    }
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
    res.end('{"ok":true}')
  }, 'report')

  registerRoute('/vae-theme-status', async (req, res) => {
    const out = {
      plugin: 'dsh-vae-theme (static)',
      theme: PRESET_NAME,
      effects: ['VAE 书法标志替换', '顶部金色艺术字', '输入区玻璃', '全屏雨幕', '动态歌词条'],
      oneClickApply: '/vae-theme-apply',
      routes,
      checks: {},
    }
    try {
      load()
      /* load() 之后才能拿到内容哈希导出的版本号 */
      out.seedVersion = seedVersion
      out.checks.themeLoaded = true
      out.checks.areaCount = Object.keys(theme.areas).length
      out.checks.payloadKB = Math.round(themeText.length / 1024)
      out.checks.runtimeKB = Math.round(runtime.length / 1024)
      out.checks.seedServedCount = servedSeedCount
      out.checks.lastSeedServedAt = lastSeedAt
      /* 自检：逐项核对运行时装里实际存在的功能。
         注意这些 needle 必须与 make-runtime.mjs 里当前的标识保持一致 ——
         曾因沿用旧 id（vae-lyric，现为 vae-vcol）而误报"没有歌词"。 */
      const has = (needle) => runtime.indexOf(needle) !== -1
      out.checks.features = {
        brandMark: has('function brandSwap'),
        railMarkGlyph: has('_railMark'),
        welcomeHeadline: has('function heroSwap'),
        goldNav: has('function goldNav'),
        rain: has('function startRain'),
        nineSliceFrame: has('background-size:36px 36px'),
        chatDivider: has('function chatDivider'),
        rightbarAvoid: has('function rightbarOpen'),
        verticalLyrics: has('vae-vcol'),
        lyricsRandom: has('function pickIndex'),
        lyricLibrary: has('var LYRICS'),
        serifTitle: has('Noto Serif SC'),
      }
      out.checks.featureCount = Object.values(out.checks.features).filter(Boolean).length
      out.checks.featureTotal = Object.keys(out.checks.features).length
      out.checks.runtimeHasLogo = has('vae-brand')
      out.checks.runtimeHasGoldNav = has('vae-gold-nav')
      out.checks.noBackdropBlur = runtime.indexOf('backdrop-filter') === -1
      out.checks.runtimeHasRain = has('vae-rain')
      out.checks.runtimeHasLyric = has('vae-vcol')
      out.checks.indexInjection = webServer
        .applyIndexTaps('<html><head></head><body></body></html>')
        .indexOf(SEED_PATH) !== -1
    } catch (error) {
      out.seedVersion = null
      out.checks.error = String((error && error.message) || error)
    }
    out.verdict = out.checks.themeLoaded && out.checks.indexInjection ? '✅ 已就绪' : '❌ 存在问题'
    /* 浏览器回传的真实 DOM 尺寸（用于校准歌词定位） */
    out.pageReportAt = pageReportAt
    if (pageReport) {
      try { out.pageReport = JSON.parse(pageReport) } catch { out.pageReport = { raw: String(pageReport).slice(0, 4000) } }
    } else {
      out.pageReport = null
    }
    /* 启动信标：一眼看出运行时装执行到哪一步、哪一步失败 */
    out.beaconCount = beacons.length
    out.beacons = beacons.map((b) => {
      try { const o = JSON.parse(b.body); return b.at.slice(11, 19) + ' ' + o.beacon } catch (e) { return b.at.slice(11, 19) + ' ?' }
    })
    out.reportCount = reports.length
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
    res.end(JSON.stringify(out, null, 2))
  }, 'status')

  /* ────────── 查看桥 ──────────
     同一个路径按方法分流，因为 webServer.register 是 exact 匹配、带不了查询串：
       PUT  /vae-theme-bridge  排队一条命令          { expr, id? }
       GET  /vae-theme-bridge  页面来领取命令         -> { id, expr } 或 { idle:true }
       POST /vae-theme-bridge  页面把结果送回来       { id, data, err?, ms? }
       DELETE /vae-theme-bridge 清空队列与收件箱
     GET 与 POST 同路径：浏览器侧靠方法区分，不依赖查询串。 */
  registerRoute('/vae-theme-bridge', async (req, res) => {
    const send = (code, obj) => {
      res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
      res.end(JSON.stringify(obj))
    }
    const method = String((req && req.method) || 'GET').toUpperCase()
    let body = ''
    try {
      for await (const chunk of req) {
        body += chunk
        if (body.length > 4000000) break
      }
    } catch (e) {}

    if (method === 'PUT') {
      let o = null
      try { o = JSON.parse(body || '{}') } catch (e) { return send(400, { ok: false, error: 'body 不是 JSON' }) }
      if (!o || typeof o.expr !== 'string' || !o.expr.trim()) return send(400, { ok: false, error: '缺少 expr' })
      const id = String(o.id || ('c' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36)))
      const item = { id, expr: o.expr, at: Date.now() }
      bridgeOut.push(item)
      if (bridgeOut.length > 20) bridgeOut.shift()
      bridgeLog.push({ id, at: new Date().toISOString(), state: 'queued' })
      if (bridgeLog.length > 60) bridgeLog.shift()
      return send(200, { ok: true, id, queued: bridgeOut.length })
    }

    if (method === 'GET') {
      /* 页面来领取：先进先出，领走即出队（避免同一条被两个标签页重复执行） */
      const item = bridgeOut.shift()
      if (!item) return send(200, { ok: true, idle: true })
      const rec = bridgeLog.find((x) => x.id === item.id)
      if (rec) { rec.state = 'taken'; rec.takenAt = new Date().toISOString() }
      return send(200, { ok: true, id: item.id, expr: item.expr })
    }

    if (method === 'POST') {
      let o = null
      try { o = JSON.parse(body || '{}') } catch (e) { return send(400, { ok: false, error: 'body 不是 JSON' }) }
      if (!o || !o.id) return send(400, { ok: false, error: '缺少 id' })
      bridgeIn.set(String(o.id), { at: new Date().toISOString(), data: o.data, err: o.err || null, ms: o.ms || null })
      /* 只留最近 30 条 */
      while (bridgeIn.size > 30) bridgeIn.delete(bridgeIn.keys().next().value)
      const rec = bridgeLog.find((x) => x.id === String(o.id))
      if (rec) { rec.state = 'done'; rec.doneAt = new Date().toISOString() }
      return send(200, { ok: true })
    }

    if (method === 'DELETE') {
      bridgeOut.length = 0
      bridgeIn.clear()
      bridgeLog.length = 0
      return send(200, { ok: true, cleared: true })
    }
    return send(405, { ok: false, error: 'method not allowed: ' + method })
  }, 'bridge')

  /* 读回结果：队列长度、收件箱、以及每条命令的去向 */
  registerRoute('/vae-theme-bridge-in', async (req, res) => {
    const out = {
      queued: bridgeOut.length,
      queuedIds: bridgeOut.map((x) => x.id),
      inboxCount: bridgeIn.size,
      log: bridgeLog.slice(-20),
      inbox: {},
    }
    for (const [k, v] of bridgeIn) out.inbox[k] = v
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
    res.end(JSON.stringify(out, null, 2))
  }, 'bridge-in')

  // 界面切深色（本主题按深色设计）。设置服务缺失时静默跳过。
  try {
    const settings = ctx.get('settings')
    if (settings !== undefined && typeof settings.update === 'function') {
      Promise.resolve()
        .then(() => settings.update('ui-theme', { preference: 'dark' }))
        .then(() => log(ctx, 'info', '界面主题已切换为 dark'))
        .catch(() => log(ctx, 'info', 'settings.update 未生效（深色可由设置面板手动选择）'))
    }
  } catch (error) {
    log(ctx, 'warn', `切换深色模式失败：${String((error && error.message) || error)}`)
  }

  log(ctx, 'info', `已挂载（seedVersion 由内容哈希导出）：seed/apply/status 路由 + index 注入`)
}

/** 优先用 Cordis logger，缺失时退回 console。 */
function log(ctx, level, message) {
  try {
    const logger = ctx && ctx.logger
    if (logger && typeof logger[level] === 'function') {
      logger[level](`[vae-theme] ${message}`)
      return
    }
  } catch (error) { /* 忽略 */ }
  const sink = level === 'error' ? console.error : console.log
  sink(`[vae-theme] ${message}`)
}
