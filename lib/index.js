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

/** 需要 webServer 才能工作；缺失时安静退出而不是抛错拖垮整个 profile。 */
export function apply(ctx) {
  const webServer = ctx.get('webServer')
  if (webServer === undefined) {
    log(ctx, 'warn', 'webServer 服务不可用，主题注入未启用')
    return
  }

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
      '  var ID = ' + JSON.stringify(PRESET_ID) + ', NAME = ' + JSON.stringify(PRESET_NAME) + ';\n' +
      '  var STALE = ' + JSON.stringify(STALE_IDS) + ';\n' +
      '  window.__VAE_SEED_OK__ = false;\n' +
      '  try {\n' +
      '    if (window.localStorage.getItem(MARK) !== VER) {\n' +
      '      window.localStorage.setItem(KEY, JSON.stringify(CFG));\n' +
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
      '  } catch (e) {}\n' +
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

  /* 浏览器把真实 DOM 尺寸 POST 回来，用于校准竖排歌词定位 */
  registerRoute('/vae-theme-report', async (req, res) => {
    let body = ''
    try {
      for await (const chunk of req) {
        body += chunk
        if (body.length > 60000) break
      }
      pageReport = body
      pageReportAt = new Date().toISOString()
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
    res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
    res.end(JSON.stringify(out, null, 2))
  }, 'status')

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
