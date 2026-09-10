// 生成《庐州月 · 许嵩》完整主题配置（.tczp + localStorage 配置 + 注入脚本）
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ASSETS = path.join(ROOT, 'build/assets')
const OUT = path.join(ROOT, 'build')
const THEME_ID = 'vae-luzhou-1'
const THEME_NAME = '庐州月 · 许嵩'

const uri = (f, label) => {
  const b = fs.readFileSync(path.join(ASSETS, f))
  return { dataURI: `data:image/webp;base64,${b.toString('base64')}`, fileName: label, fit: 'cover' }
}

const IMG = {
  app: uri('app.webp', '庐州月-主界面.webp'),
  sidebar: uri('sidebar.webp', '许嵩-侧边栏.webp'),
  composer: uri('composer.webp', '庐州月-输入区.webp'),
  details: uri('details.webp', '专辑墙-设置界面.webp'),
  float: uri('float.webp', '寻雾启示-浮窗.webp'),
  cordis: uri('cordis.webp', '呼吸之野-Cordis.webp'),
  newSession: uri('newSession.webp', '许嵩-新会话按钮.webp'),
}

const emptyArea = () => ({ mode: 'none', color: '#ffffff', opacity: 0, image: null, bottomColor: null, bottomEnabled: false, bottomOpacity: 0 })

// ── 配色（夜墨 / 月白 / 黛青 / 朱砂）──
const C = {
  ink: '#080D12',        // 夜墨（最底）
  ink2: '#0B1016',       // 墨
  ink3: '#101A22',       // 淡墨
  panel: '#0C141B',      // 面板底
  dai: '#22343F',        // 黛青
  dai2: '#16232C',       // 深黛
  moon: '#E2EAEF',       // 月白（正文）
  moonDim: '#AFC2CD',    // 月白·辅助
  zhu: '#B23A2E',        // 朱砂
  zhuLit: '#C9705C',     // 朱砂·提亮（强调文字）
}

const theme = {
  v: 1,
  opacitySem: 4,
  appBottomVersion: 1,

  areas: {
    // 主界面：水墨长卷（显示区域不包含侧边栏 → 长卷紧贴侧边栏右侧铺开）
    app: {
      mode: 'image', color: '#ffffff', opacity: 0.10, image: IMG.app,
      bottomEnabled: true, bottomColor: C.ink, bottomOpacity: 0,
      includeSidebar: false,
      collapsedSidebar: {
        mode: 'image', color: '#ffffff', opacity: 0.10, image: IMG.app,
        bottomEnabled: true, bottomColor: C.ink, bottomOpacity: 0,
      },
    },
    // 侧边栏：许嵩墨调肖像 + 竖排题字
    sidebar: {
      mode: 'image', color: '#ffffff', opacity: 0.46, image: IMG.sidebar,
      bottomEnabled: true, bottomColor: C.ink2, bottomOpacity: 0,
      collapsed: { ...emptyArea(), bottomEnabled: true, bottomColor: C.ink2, bottomOpacity: 0 },
    },
    conversation: emptyArea(),
    // 输入区：水面墨带
    composer: {
      mode: 'image', color: '#ffffff', opacity: 0.05, image: IMG.composer,
      bottomEnabled: true, bottomColor: C.ink, bottomOpacity: 0.46,
    },
    // 设置界面：专辑墙海报
    details: {
      mode: 'image', color: '#ffffff', opacity: 0.22, image: IMG.details,
      bottomEnabled: true, bottomColor: C.ink2, bottomOpacity: 0.06,
    },
    // 浮窗面板：《寻雾启示》
    float: {
      mode: 'image', color: '#ffffff', opacity: 0.28, image: IMG.float,
      bottomEnabled: true, bottomColor: C.ink2, bottomOpacity: 0.06,
    },
    // Cordis 插件界面：《呼吸之野》
    cordis: {
      mode: 'image', color: '#ffffff', opacity: 0.28, image: IMG.cordis,
      bottomEnabled: true, bottomColor: C.ink2, bottomOpacity: 0.06,
    },
  },

  // 文字五类（亮暗共用 → 本主题面向深色模式设计）
  colors: {
    main: C.moon,
    process: '#8FA5B3',
    aux: C.moonDim,
    faded: '#6B7F8C',
    accent: C.zhuLit,
  },

  cordisEntry: true,

  floatModules: { background: true, borders: true, colors: true, layout: true, presets: true },
  floatShowReset: true,
  floatPos: { x: 80, y: 80, width: 560, height: 660 },
  floatVisible: false,

  // 新会话按钮：墨带 + 朱砂印（文字/图标由官方渲染）
  newSession: {
    showText: true, showIcon: true,
    mode: 'image', color: '#ffffff', opacity: 0.06, image: IMG.newSession,
    bottomEnabled: true, bottomColor: '#0C141B', bottomOpacity: 0.45,
    iconColor: C.moon, textColor: C.moon,
  },

  brand: { color: C.moon, opacity: 0, collapsed: { color: C.zhuLed || C.moon, opacity: 0 } },
  brandHarness: { color: null, opacity: 0 },

  // 新会话欢迎页四项
  hero: {
    fish: { color: C.zhu, opacity: 0 },
    title: { color: C.moon, opacity: 0 },
    badge: { color: '#9FB6C2', opacity: 0 },
    badgeBg: { color: '#16232C', opacity: 0 },
  },

  // 框线（数值大 = 透明）
  borders: {
    main: { color: '#2A3B47', opacity: 0.42 },
    cordis: { color: '#22323D', opacity: 0.50 },
    composer: { color: '#33485A', opacity: 0.38 },
    details: { color: '#2A3B47', opacity: 0.48 },
    float: { color: '#2A3B47', opacity: 0.48 },
    newSession: { color: '#33485A', opacity: 0.34 },
  },

  detailsPos: null,
  detailsDragEnabled: true,
  showOpacityHint: true,
  composerStatsExpanded: false,
  composerFixedHeight: false,
  composerRows: 4,
  composerStatsItems: { turns: true, steps: true, llm: true, tool: true, ttft: true, tps: true, cache: true, input: true, output: true },

  // 对话区细节
  convBgs: {
    bubble: '#16232C', inline: '#1B2B35', code: '#0A1016',
    scrollbar: '#33475A', chatScroll: '#24343F',
    todoCollapsed: '#101A22', todoExpanded: '#101A22',
    addBtn: '#16232C', cmdMenu: '#0E161D', toBottom: '#16232C',
    sliderColor: C.zhu, sliderTrackColor: '#243440', scrollColor: '#24343F',
    addBtnOpacity: 0, cmdMenuOpacity: 0, sliderOpacity: 0, sliderTrackOpacity: 0, scrollOpacity: 0,
    bubbleOpacity: 0, inlineOpacity: 0, codeOpacity: 0, scrollbarOpacity: 0, chatScrollOpacity: 0,
    todoCollapsedOpacity: 0, todoExpandedOpacity: 0, toBottomOpacity: 0,
  },
}

// ── 体积与合法性校验 ──
const json = JSON.stringify(theme)
const bytes = Buffer.byteLength(json, 'utf8')
const LIMIT = 5 * 1024 * 1024
console.log('配置体积:', (bytes / 1048576).toFixed(2) + 'MB', '/ 限额约 5MB', bytes < LIMIT ? '✅' : '❌ 超限')

const problems = []
const HEX = /^#[0-9a-f]{6}$/i
for (const [k, a] of Object.entries(theme.areas)) {
  if (!a || typeof a !== 'object') problems.push(`areas.${k} 非对象`)
  if (!['none', 'color', 'image', 'transparent'].includes(a.mode)) problems.push(`areas.${k}.mode 非法: ${a.mode}`)
  if (a.mode === 'image' && !(a.image && a.image.dataURI && a.image.fit)) problems.push(`areas.${k}.image 不完整`)
  if (typeof a.opacity !== 'number' || a.opacity < 0 || a.opacity > 1) problems.push(`areas.${k}.opacity 越界`)
}
for (const [k, v] of Object.entries(theme.colors)) if (v != null && !HEX.test(v)) problems.push(`colors.${k} 非 #rrggbb: ${v}`)
for (const [k, b] of Object.entries(theme.borders)) {
  if (b.color != null && !HEX.test(b.color)) problems.push(`borders.${k}.color 非 #rrggbb`)
  if (typeof b.opacity !== 'number' || b.opacity < 0 || b.opacity > 1) problems.push(`borders.${k}.opacity 越界`)
}
for (const key of ['fish', 'title', 'badge', 'badgeBg']) {
  const it = theme.hero[key]
  if (it.color != null && !HEX.test(it.color)) problems.push(`hero.${key}.color 非 #rrggbb`)
}
if (theme.brand.color && !HEX.test(theme.brand.color)) problems.push('brand.color 非 #rrggbb')
for (const [k, v] of Object.entries(theme.newSession)) {
  if (k.endsWith('Color') && v != null && !HEX.test(v)) problems.push(`newSession.${k} 非 #rrggbb: ${v}`)
}
if (Object.keys(theme.areas).length !== 7) problems.push('区域数量应为 7')

console.log(problems.length ? '❌ 校验问题:\n  ' + problems.join('\n  ') : '✅ 字段校验通过')

// ── 输出 .tczp 预设 ──
fs.writeFileSync(path.join(OUT, 'vae-theme.tczp'), json, 'utf8')
fs.writeFileSync(path.join(OUT, 'theme-config.json'), JSON.stringify({ ...theme, areas: Object.fromEntries(Object.entries(theme.areas).map(([k, a]) => [k, { ...a, image: a.image ? { ...a.image, dataURI: `<<${a.image.fileName} ${(a.image.dataURI.length / 1024).toFixed(0)}KB base64>>` } : null }])) }, null, 2), 'utf8')

// ── 输出注入脚本（由 DSH Host 路由提供，页面加载早期写入 localStorage）──
const seed = `/* 庐州月 · 许嵩 — DSH 主题注入 (${THEME_ID}) */
(function () {
  var KEY = 'theme-customizer-config-v1';
  var MARK = 'vae-theme-seed';
  var VER = '${THEME_ID}';
  try {
    if (window.localStorage.getItem(MARK) === VER) return;
    var CFG = ${json};
    window.localStorage.setItem(KEY, JSON.stringify(CFG));
    window.localStorage.setItem('theme-customizer-last-applied', VER);
    window.localStorage.setItem(MARK, VER);
    try {
      var req = window.indexedDB.open('theme-customizer-presets', 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains('presets')) db.createObjectStore('presets', { keyPath: 'id' });
      };
      req.onsuccess = function () {
        try {
          var db = req.result;
          var tx = db.transaction('presets', 'readwrite');
          tx.objectStore('presets').put({ id: VER, name: '${THEME_NAME}', savedAt: Date.now(), data: CFG });
        } catch (e) {}
      };
    } catch (e) {}
  } catch (e) {}
})();
`
fs.writeFileSync(path.join(OUT, 'vae-theme-seed.js'), seed, 'utf8')

console.log('✅ 输出:')
console.log('  build/vae-theme.tczp      ', (fs.statSync(path.join(OUT, 'vae-theme.tczp')).size / 1048576).toFixed(2) + 'MB')
console.log('  build/vae-theme-seed.js   ', (fs.statSync(path.join(OUT, 'vae-theme-seed.js')).size / 1048576).toFixed(2) + 'MB')
console.log('  build/theme-config.json   （图片以占位符替换，便于阅读）')
