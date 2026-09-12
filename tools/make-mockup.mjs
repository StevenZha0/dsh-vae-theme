// 按主题实际透明度 / 配色 / 九宫格拼合出 DSH 界面效果模拟图，用于验证可读性与观感
// 注：本文件含中文，一律用 write/edit 工具修改；不要用 PowerShell 读写源码（会按 ANSI 处理而乱码）
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const A = path.join(ROOT, 'build/assets')
const OUT = path.join(ROOT, 'build')
const cfg = JSON.parse(fs.readFileSync(path.join(OUT, 'vae-theme.tczp'), 'utf8'))
const frame = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/frame/frame-data.json'), 'utf8'))

const W = 1680, H = 1050
const SB = 268

const veil = (hex, op) => ({
  r: parseInt(hex.slice(1, 3), 16),
  g: parseInt(hex.slice(3, 5), 16),
  b: parseInt(hex.slice(5, 7), 16),
  alpha: op,
})

// 1. 主区背景
const mainW = W - SB, mainH = H
const appArea = cfg.areas.app
const appImg = await sharp(path.join(A, 'app.webp')).resize(mainW, mainH, { fit: 'cover', position: 'center' }).toBuffer()
const appVeil = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${mainW}" height="${mainH}"><rect width="${mainW}" height="${mainH}" fill="${appArea.bottomColor}" fill-opacity="${appArea.opacity}"/></svg>`)
const mainLayer = await sharp(appImg).composite([{ input: appVeil }]).png().toBuffer()

// 2. 侧边栏
const sbArea = cfg.areas.sidebar
const sbImg = await sharp(path.join(A, 'sidebar.webp')).resize(SB, H, { fit: 'cover', position: 'top' }).ensureAlpha(1 - sbArea.opacity).png().toBuffer()
const sbLayer = await sharp({ create: { width: SB, height: H, channels: 4, background: { ...veil(sbArea.bottomColor, 1), alpha: 1 } } })
  .composite([{ input: sbImg, blend: 'over' }]).png().toBuffer()

// 九宫格拼合（与运行时同一套素材与几何）
const piece = (k) => Buffer.from(frame[k].split(',')[1], 'base64')
async function nineSlice(prefix, cw, ch) {
  const C = frame.geometry[prefix].corner, L = frame.geometry[prefix].edgeLen
  const comps = [
    { input: piece(`${prefix}_cTL`), left: 0, top: 0 },
    { input: piece(`${prefix}_cTR`), left: cw - C, top: 0 },
    { input: piece(`${prefix}_cBL`), left: 0, top: ch - C },
    { input: piece(`${prefix}_cBR`), left: cw - C, top: ch - C },
  ]
  for (let x = C; x < cw - C; x += L) {
    const w = Math.min(L, cw - C - x)
    comps.push({ input: await sharp(piece(`${prefix}_eH`)).extract({ left: 0, top: 0, width: w, height: C }).png().toBuffer(), left: x, top: 0 })
    comps.push({ input: await sharp(piece(`${prefix}_eHF`)).extract({ left: 0, top: 0, width: w, height: C }).png().toBuffer(), left: x, top: ch - C })
  }
  for (let y = C; y < ch - C; y += L) {
    const h = Math.min(L, ch - C - y)
    comps.push({ input: await sharp(piece(`${prefix}_eV`)).extract({ left: 0, top: 0, width: C, height: h }).png().toBuffer(), left: 0, top: y })
    comps.push({ input: await sharp(piece(`${prefix}_eVF`)).extract({ left: 0, top: 0, width: C, height: h }).png().toBuffer(), left: cw - C, top: y })
  }
  return sharp({ create: { width: cw, height: ch, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(comps).png().toBuffer()
}

// 3. 输入区（半透明底 + 九宫格金框）
const CP = { x: 360, y: 840, w: 1180, h: 130, r: 22 }
const cpArea = cfg.areas.composer
const cpLayer = await sharp({ create: { width: CP.w, height: CP.h, channels: 4, background: veil(cpArea.bottomColor, 1 - (cpArea.bottomOpacity || 0)) } })
  .composite([{ input: await nineSlice('big', CP.w, CP.h) }])
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${CP.w}" height="${CP.h}"><rect width="${CP.w}" height="${CP.h}" rx="${CP.r}" fill="#fff"/></svg>`), blend: 'dest-in' }])
  .png().toBuffer()

// 4. 新会话按钮（半透明底 + 小九宫格）
const NS = { x: 16, y: 74, w: 236, h: 46, r: 10 }
const ns = cfg.newSession
const nsLayer = await sharp({ create: { width: NS.w, height: NS.h, channels: 4, background: veil(ns.bottomColor, 1 - (ns.bottomOpacity || 0)) } })
  .composite([{ input: await nineSlice('small', NS.w, NS.h) }])
  .composite([{ input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${NS.w}" height="${NS.h}"><rect width="${NS.w}" height="${NS.h}" rx="${NS.r}" fill="#fff"/></svg>`), blend: 'dest-in' }])
  .png().toBuffer()

// 5. 界面文字
const C = cfg.colors
const bd = (hex, op) => {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${(1 - op).toFixed(2)})`
}
const bMain = bd(cfg.borders.main.color, cfg.borders.main.opacity)
const bComp = bd(cfg.borders.composer.color, cfg.borders.composer.opacity)

const ui = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <line x1="${SB}" y1="0" x2="${SB}" y2="${H}" stroke="${bMain}" stroke-width="1"/>
  <text x="30" y="103" font-family="Microsoft YaHei" font-size="14.5" fill="${ns.textColor}">新会话</text>
  <g font-family="Microsoft YaHei" font-size="13.5" fill="${C.aux}">
    <text x="30" y="164">会话</text><text x="30" y="196">工作区</text><text x="30" y="228">技能</text>
  </g>
  <g font-family="Microsoft YaHei" font-size="12.5" fill="${C.faded}">
    <text x="30" y="300">今日</text><text x="30" y="326">庐州月主题制作</text>
    <text x="30" y="352">水墨长卷素材整理</text><text x="30" y="378">专辑封面搜集</text>
  </g>
  <g font-family="Microsoft YaHei">
    <text x="${SB + 30}" y="44" font-size="14" fill="${C.main}">庐州月 · 许嵩 主题制作</text>
    <text x="${SB + 30}" y="66" font-size="11.5" fill="${C.faded}">deepseek-flash · 推理强度 max</text>
  </g>
  <line x1="${SB}" y1="84" x2="${W}" y2="84" stroke="${bMain}" stroke-width="1"/>
  <g font-family="Microsoft YaHei">
    <text x="${SB + 34}" y="192" font-size="11.5" fill="${C.faded}">思考中 · 3.2s</text>
    <text x="${SB + 34}" y="218" font-size="13.5" fill="${C.process}">我先确认主题素材的体积是否落在 localStorage 限额内，再写入配置。</text>
    <text x="${SB + 34}" y="268" font-size="13.5" fill="${C.main}">《庐州月》水墨长卷已作为主界面背景：</text>
    <text x="${SB + 34}" y="294" font-size="13.5" fill="${C.main}">侧边栏用许嵩的墨调肖像，设置面板换成专辑墙。</text>
    <text x="${SB + 34}" y="336" font-size="12.5" fill="${C.aux}">pwsh</text>
    <rect x="${SB + 34}" y="348" width="560" height="86" rx="10" fill="${cfg.convBgs.code}" stroke="${bMain}" stroke-width="1"/>
    <text x="${SB + 50}" y="374" font-size="12" fill="${C.process}" font-family="Consolas, monospace">node make-theme.mjs</text>
    <text x="${SB + 50}" y="396" font-size="12" fill="${C.aux}" font-family="Consolas, monospace">配置体积: 0.43MB / 限额约 5MB</text>
    <text x="${SB + 50}" y="418" font-size="12" fill="${C.accent}" font-family="Consolas, monospace">字段校验通过</text>
    <text x="${SB + 34}" y="470" font-size="13.5" fill="${C.main}">行内代码示例：<tspan fill="${C.accent}">theme-customizer-config-v1</tspan></text>
    <rect x="${SB + 140}" y="456" width="228" height="19" rx="4" fill="${cfg.convBgs.inline}"/>
    <text x="${SB + 34}" y="516" font-size="13.5" fill="${C.main}">链接与强调色：</text>
    <text x="${SB + 150}" y="516" font-size="13.5" fill="${C.accent}">查看主题预设 .tczp</text>
    <text x="${SB + 34}" y="566" font-size="12" fill="${C.faded}">辅助色 ${C.aux}　弱化色 ${C.faded}</text>
  </g>
  <text x="382" y="876" font-size="14.5" font-family="Microsoft YaHei" fill="${C.faded}">输入消息，或按 / 调用命令…</text>
  <text x="${CP.x + CP.w - 30}" y="878" font-size="12" font-family="Microsoft YaHei" fill="${C.aux}" text-anchor="end">deepseek-flash</text>
  <line x1="${CP.x}" y1="${CP.y + CP.h - 34}" x2="${CP.x + CP.w}" y2="${CP.y + CP.h - 34}" stroke="${bComp}" stroke-width="1"/>
  <g font-family="Microsoft YaHei" font-size="11.5" fill="${C.faded}">
    <text x="382" y="${CP.y + CP.h - 12}">轮数 12</text><text x="452" y="${CP.y + CP.h - 12}">步数 38</text>
    <text x="522" y="${CP.y + CP.h - 12}">tok/s 62</text><text x="610" y="${CP.y + CP.h - 12}">缓存命中 94%</text>
  </g>
  <text x="${W - 40}" y="${CP.y + CP.h - 12}" font-size="11.5" font-family="Microsoft YaHei" fill="${C.faded}" text-anchor="end">设置 · 主题</text>
</svg>`)

// 6. 特效：雨幕 + 竖排歌词（主栏在右、副栏在其左）
const vtext = (chars, x, y0, size, gap, fill, opacity) =>
  `<g font-family="STXingkai" fill="${fill}" opacity="${opacity}">` +
  chars.split('').map((c, i) => `<text x="${x}" y="${y0 + i * gap}" font-size="${size}" text-anchor="middle">${c}</text>`).join('') +
  '</g>'

let rain = ''
let rs = 424242
const rr = () => { rs = (rs * 1103515245 + 12345) & 0x7fffffff; return rs / 0x7fffffff }
for (let i = 0; i < 430; i++) {
  const x = rr() * W, y = rr() * H
  const len = 15 + rr() * 36
  const op = 0.045 + rr() * 0.15
  rain += `<line x1="${x.toFixed(0)}" y1="${y.toFixed(0)}" x2="${(x - len * 0.09).toFixed(0)}" y2="${(y + len).toFixed(0)}" stroke="rgb(214,228,236)" stroke-width="${(0.5 + rr() * 0.9).toFixed(2)}" opacity="${op.toFixed(3)}" stroke-linecap="round"/>`
}

const lyric = '三月一路烟霞莺飞草长'
/* 与运行时同一套垂直定位：短句以 34% 为中点居中；长句顶部钉在导航栏下方，仅向下延伸。
   副栏（出处）在主栏顶部下方 28px。 */
const lyricTop = Math.max(96, Math.round(H * 0.34 - (lyric.length * 34) / 2))
const fx = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <g>${rain}</g>
  ${vtext(lyric, W - 150, lyricTop, 27, 34, '#F6FAFC', 0.8)}
  ${vtext('——《庐州月》许嵩', W - 190, lyricTop + 28, 14, 22, '#CBDCE6', 0.69)}
</svg>`)

// 组装
const logoBuf = await sharp(path.join(ROOT, 'build/vae-logo.png')).resize(112).png().toBuffer()
const goldBuf = await sharp(path.join(ROOT, 'build/vae-gold-nav.png')).resize(370).ensureAlpha(0.88).png().toBuffer()

const composed = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 8, g: 13, b: 18, alpha: 1 } } })
  .composite([
    { input: mainLayer, left: SB, top: 0 },
    { input: sbLayer, left: 0, top: 0 },
    { input: nsLayer, left: NS.x, top: NS.y },
    { input: cpLayer, left: CP.x, top: CP.y },
    { input: ui },
    { input: fx },
    { input: goldBuf, left: Math.round(SB + (W - SB - 370) / 2), top: 9 },
    { input: logoBuf, left: 74, top: 16 },
  ])
  .png().toBuffer()

fs.writeFileSync(path.join(OUT, 'mockup.png'), composed)
await sharp(composed).jpeg({ quality: 90 }).toFile(path.join(OUT, 'mockup.jpg'))
console.log('mockup written（九宫格金框 / 竖排歌词 / 金色导航字 / 雨幕）', `${W}x${H}`)
