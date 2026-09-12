// 离线验证 dsh-vae-theme 静态插件：用假 ctx / 假 webServer 实际调用 apply，
// 并真实执行三个路由处理器，确认不会在 profile 启动时抛错。
const PLUGIN = process.env.VAE_PLUGIN
  || new URL('../lib/index.js', import.meta.url).href
const mod = await import(PLUGIN)

console.log('导出:', Object.keys(mod))

const routes = new Map()
let tap = null
const effects = []
const logs = []

const webServer = {
  register(route) {
    if (routes.has(route.path)) throw new Error(`duplicate route ${route.path}`)
    routes.set(route.path, route.handler)
    return () => routes.delete(route.path)
  },
  tapIndex(fn) { tap = fn; return () => { tap = null } },
  applyIndexTaps(html) { return tap ? tap(html) : html },
}

const ctx = {
  get(name) {
    if (name === 'webServer') return webServer
    if (name === 'settings') return { update: async () => { logs.push('settings.update called') } }
    return undefined
  },
  effect(fn, label) { effects.push(label); const d = fn(); return () => { if (typeof d === 'function') d() } },
  logger: { info: (m) => logs.push('info ' + m), warn: (m) => logs.push('warn ' + m), error: (m) => logs.push('error ' + m) },
}

try {
  mod.apply(ctx)
} catch (e) {
  console.log('❌ apply 抛错:', e.message)
  process.exit(1)
}

console.log('✅ apply 未抛错')
console.log('路由:', [...routes.keys()].join(', '))
console.log('effects:', effects.join(' | '))
console.log('日志:'); logs.forEach(l => console.log('   ', l))

// ── 模拟 res ──
function fakeRes() {
  const r = { status: null, headers: null, body: null }
  r.writeHead = (s, h) => { r.status = s; r.headers = h }
  r.end = (b) => { r.body = b }
  return r
}

console.log('\n--- /vae-theme-seed.js ---')
const res1 = fakeRes()
await routes.get('/vae-theme-seed.js')({}, res1)
console.log('status', res1.status, '| bytes', res1.body.length, '| content-type', res1.headers['content-type'])

/* 逐项核对静态插件实际吐出的运行时装，防止"改了工作区但插件里是旧版" */
const FEATURES = {
  '主题配置写入': 'theme-customizer-config-v1',
  '图片资源内嵌': 'data:image/webp;base64',
  'VAE 标记': 'function brandSwap',
  '折叠态嵩字': '_railMark',
  '欢迎页文案': '快写一段提示词雅俗共赏',
  '欢迎页改写': 'function heroSwap',
  '金色艺术字': 'function goldNav',
  '全屏雨幕': 'function startRain',
  '九宫格边框': 'background-size:36px 36px',
  '边框平铺': 'repeat-x',
  '对话裁切': 'function chatDivider',
  '右侧栏避让': 'function rightbarOpen',
  '竖排歌词': 'vae-vcol',
  '歌词纯随机': 'function pickIndex',
  '歌词库': 'var LYRICS',
  '歌词字号自适应': '长句自动缩字号',
  '思源宋体': 'Noto Serif SC',
  '动态水带': 'function startWater',
  '水带逐行位移': 'ampNear',
  '芦苇摆动层': 'imgReeds',
  '静置前景层': 'imgStatic',
}
let pass = 0, fail = 0
for (const [label, needle] of Object.entries(FEATURES)) {
  const hit = res1.body.includes(needle)
  if (hit) pass++; else fail++
  console.log(`   ${hit ? '✓' : '✗'} ${label}`)
}
const lyricCount = (res1.body.match(/","[^"]+"\],\["/g) || []).length
console.log(`   功能项 ${pass} 通过 / ${fail} 缺失`)

console.log('\n--- /vae-theme-apply ---')
const res2 = fakeRes()
await routes.get('/vae-theme-apply')({}, res2)
console.log('status', res2.status, '| bytes', res2.body.length, '| 含种子引用:', res2.body.includes('/vae-theme-seed.js'), '| 含跳转:', res2.body.includes('location.replace'))

console.log('\n--- /vae-theme-status ---')
const res3 = fakeRes()
await routes.get('/vae-theme-status')({}, res3)
const status = JSON.parse(res3.body)
console.log('status', res3.status, '| verdict', status.verdict)
console.log('areaCount', status.checks.areaCount, '| payloadKB', status.checks.payloadKB, '| runtimeKB', status.checks.runtimeKB)
console.log('logo/rain/lyric:', status.checks.runtimeHasLogo, status.checks.runtimeHasRain, status.checks.runtimeHasLyric, '| indexInjection:', status.checks.indexInjection)

console.log('\n--- index.html 注入模拟 ---')
const injected = webServer.applyIndexTaps('<!doctype html><html lang="en"><head><meta charset="utf-8" /><script type="module" src="./assets/index.js"></script></head><body><div id="root"></div></body></html>')
console.log(injected.slice(0, 160))
console.log('脚本在 module 之前:', injected.indexOf('/vae-theme-seed.js') < injected.indexOf('type="module"'))

console.log('\n--- 幂等性：重复 apply（模拟热重载）---')
try {
  mod.apply(ctx)
  console.log('✅ 重复 apply 未抛错（路由冲突被吞掉）')
} catch (e) {
  console.log('❌ 重复 apply 抛错:', e.message)
}
