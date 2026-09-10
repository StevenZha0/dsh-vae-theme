// 离线验证 dsh-vae-theme 静态插件：用假 ctx / 假 webServer 实际调用 apply，
// 并真实执行三个路由处理器，确认不会在 profile 启动时抛错。
const mod = await import('file:///C:/Users/17919/.dsh/profiles/web/local-plugins/dsh-vae-theme/lib/index.js')

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
for (const key of ['vae-rain', 'vae-lyric', '_logoRow', 'theme-customizer-config-v1', 'vae-luzhou-static-1', 'data:image/webp;base64']) {
  console.log(`   含 ${key.padEnd(30)}:`, res1.body.includes(key))
}

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
