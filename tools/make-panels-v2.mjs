// 面板资产 v5
//  ① 输入区：金丝边框改为 7:1 画幅（配合运行时 background-size:100% 100%，金边永远贴边）
//  ② 新会话按钮：金丝边框 5.14:1，与按钮实际比例接近
//  ③ Cordis 面板 / ④ 浮窗面板：改为《庐州月》水墨长卷的裁切，与整体统一（不再用早期竹影图）
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'build/assets')
fs.mkdirSync(OUT, { recursive: true })

const G = { g1: '#F7E7B0', g2: '#E3C46A', g3: '#C9A03C', moon: '#DCE5EA', moonSoft: '#9FB6C2' }
const svg = (w, h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`)

/** 卷草纹带 */
function filigree(x0, y, width, amp, opacity, mirror = false) {
  const unit = 44
  const n = Math.max(2, Math.floor(width / unit))
  let s = `<g fill="none" stroke="${G.g2}" stroke-width="1" opacity="${opacity}" stroke-linecap="round">`
  for (let i = 0; i < n; i++) {
    const x = x0 + i * unit
    const dir = (i % 2 === 0 ? 1 : -1) * (mirror ? -1 : 1)
    s += `<path d="M ${x} ${y} C ${x + unit * 0.22} ${y - amp * dir}, ${x + unit * 0.30} ${y - amp * 1.5 * dir}, ${x + unit * 0.50} ${y}"/>`
    s += `<path d="M ${x + unit * 0.50} ${y} C ${x + unit * 0.70} ${y + amp * 1.5 * dir}, ${x + unit * 0.78} ${y + amp * dir}, ${x + unit} ${y}"/>`
    s += `<path d="M ${x + unit * 0.30} ${y - amp * 0.55 * dir} q 8 ${-amp * 0.8 * dir} 16 ${-amp * 0.2 * dir}" stroke-width="0.8"/>`
    s += `<circle cx="${x + unit * 0.5}" cy="${y}" r="1.4" fill="${G.g1}" stroke="none" opacity="0.9"/>`
  }
  return s + '</g>'
}

/** 回纹角饰 */
function cornerKey(size, opacity, flipX = false, flipY = false) {
  const t = (x, y) => `${(flipX ? size - x : x).toFixed(1)} ${(flipY ? size - y : y).toFixed(1)}`
  return `<g fill="none" stroke="${G.g2}" stroke-width="1.15" opacity="${opacity}" stroke-linecap="square">
    <path d="M ${t(2, size - 2)} L ${t(2, 2)} L ${t(size - 2, 2)}"/>
    <path d="M ${t(9, size - 9)} L ${t(9, 9)} L ${t(size - 9, 9)}" opacity="0.72"/>
    <path d="M ${t(16, size - 16)} L ${t(16, 16)} L ${t(size * 0.34, 16)}" opacity="0.55"/>
    <circle cx="${t(size - 7, 7).split(' ')[0]}" cy="${t(size - 7, 7).split(' ')[1]}" r="1.3" fill="${G.g1}" stroke="none" opacity="${opacity}"/>
  </g>`
}

/** 金丝边框（四边都贴边，配合 100% 100% 拉伸） */
function goldFrame(W, H, R, opts = {}) {
  const { filigreeOpacity = 0.5, cornerOpacity = 0.72, bandInset = 24, cornerSize = 46 } = opts
  const inset = bandInset
  return svg(W, H, `
  <defs>
    <linearGradient id="goldEdge" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0"   stop-color="${G.g1}" stop-opacity="0.95"/>
      <stop offset="0.45" stop-color="${G.g2}" stop-opacity="0.70"/>
      <stop offset="1"   stop-color="${G.g3}" stop-opacity="0.50"/>
    </linearGradient>
    <linearGradient id="topGlow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${G.g1}" stop-opacity="0.13"/><stop offset="1" stop-color="${G.g1}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="card"><rect x="0" y="0" width="${W}" height="${H}" rx="${R}"/></clipPath>
  </defs>
  <g clip-path="url(#card)">
    <rect x="0" y="0" width="${W}" height="${H * 0.5}" fill="url(#topGlow)"/>
    <rect x="1.4" y="1.4" width="${W - 2.8}" height="${H - 2.8}" rx="${R - 1.4}" fill="none" stroke="url(#goldEdge)" stroke-width="2.4"/>
    <rect x="5.5" y="5.5" width="${W - 11}" height="${H - 11}" rx="${R - 5.5}" fill="none" stroke="${G.g2}" stroke-width="0.8" opacity="0.5"/>
    <rect x="${W * 0.24}" y="2.2" width="${W * 0.52}" height="1.8" rx="0.9" fill="${G.g1}" opacity="0.88"/>
    ${filigree(inset + 14, inset, W - (inset + 14) * 2, 5.5, filigreeOpacity)}
    ${filigree(inset + 14, H - inset, W - (inset + 14) * 2, 5.5, filigreeOpacity * 0.85, true)}
    <g transform="translate(8,8)">${cornerKey(cornerSize, cornerOpacity)}</g>
    <g transform="translate(${W - 8 - cornerSize},8)">${cornerKey(cornerSize, cornerOpacity, true, false)}</g>
    <g transform="translate(8,${H - 8 - cornerSize})">${cornerKey(cornerSize, cornerOpacity * 0.8, false, true)}</g>
    <g transform="translate(${W - 8 - cornerSize},${H - 8 - cornerSize})">${cornerKey(cornerSize, cornerOpacity * 0.8, true, true)}</g>
  </g>`)
}

// ══════════ ① 输入区 7:1 ══════════
const CP_W = 1400, CP_H = 200
await sharp(goldFrame(CP_W, CP_H, 22, { bandInset: 22, cornerSize: 44 }))
  .webp({ quality: 94, effort: 6, alphaQuality: 100 }).toFile(path.join(OUT, 'composer.webp'))
console.log(`[1/4] composer.webp  ${CP_W}x${CP_H}  比例 ${(CP_W / CP_H).toFixed(2)}:1`)

// ══════════ ② 新会话按钮 5.14:1 ══════════
const NS_W = 720, NS_H = 140
await sharp(goldFrame(NS_W, NS_H, 12, { bandInset: 18, cornerSize: 34, filigreeOpacity: 0.34, cornerOpacity: 0.6 }))
  .webp({ quality: 94, effort: 6, alphaQuality: 100 }).toFile(path.join(OUT, 'newSession.webp'))
console.log(`[2/4] newSession.webp  ${NS_W}x${NS_H}  比例 ${(NS_W / NS_H).toFixed(2)}:1`)

// ══════════ ③④ Cordis / 浮窗：改用庐州月长卷裁切 ══════════
const SCROLL = path.join(ROOT, 'build/scroll-plain.png')

function safeCalligraphy(w, h, chars, opts) {
  const { x, y, size, gap, opacity = 0.9, sub = null, frame = true } = opts
  let s = `<g font-family="STXingkai" fill="${G.moon}">`
  for (let i = 0; i < chars.length; i++) {
    s += `<text x="${x}" y="${y + i * gap}" font-size="${size}" text-anchor="middle" opacity="${opacity}">${chars[i]}</text>`
  }
  s += '</g>'
  if (sub) {
    s += `<line x1="${x - size * 0.42}" y1="${y + chars.length * gap - gap * 0.1}" x2="${x + size * 0.42}" y2="${y + chars.length * gap - gap * 0.1}" stroke="${G.moonSoft}" stroke-width="1.2" opacity="0.32"/>`
    s += `<text x="${x}" y="${y + chars.length * gap + size * 0.5}" font-family="STKaiti" font-size="${Math.round(size * 0.32)}" fill="${G.moonSoft}" opacity="0.62" text-anchor="middle">${sub}</text>`
  }
  if (frame) {
    const m = Math.round(Math.min(w, h) * 0.055)
    s += `<rect x="${m}" y="${m}" width="${w - m * 2}" height="${h - m * 2}" fill="none" stroke="${G.moonSoft}" stroke-width="1.1" opacity="0.15"/>`
  }
  return s
}

// ③ Cordis 面板 1080×900：取群山与雾的段落
const CO_W = 1080, CO_H = 900
const coBase = await sharp(SCROLL).extract({ left: 900, top: 760, width: 1500, height: 1250 })
  .resize(CO_W, CO_H, { fit: 'cover', position: 'center' })
  .modulate({ brightness: 1.04 })
  .png().toBuffer()
await sharp(coBase).composite([{
  input: svg(CO_W, CO_H, safeCalligraphy(CO_W, CO_H, '呼吸之野', { x: 168, y: 236, size: 88, gap: 112, sub: '巡演现场' })),
}]).webp({ quality: 88, effort: 6 }).toFile(path.join(OUT, 'cordis.webp'))
console.log(`[3/4] cordis.webp  ${CO_W}x${CO_H}  ← 长卷裁切`)

// ④ 浮窗面板 900×1030：取月与山的段落
const FL_W = 900, FL_H = 1030
const flBase = await sharp(SCROLL).extract({ left: 2180, top: 260, width: 1240, height: 1420 })
  .resize(FL_W, FL_H, { fit: 'cover', position: 'center' })
  .modulate({ brightness: 1.03 })
  .png().toBuffer()
await sharp(flBase).composite([{
  input: svg(FL_W, FL_H, safeCalligraphy(FL_W, FL_H, '寻雾启示', { x: 152, y: 250, size: 86, gap: 112, sub: '庐州月 · 许嵩' })),
}]).webp({ quality: 88, effort: 6 }).toFile(path.join(OUT, 'float.webp'))
console.log(`[4/4] float.webp    ${FL_W}x${FL_H}  ← 长卷裁切`)

console.log('\n=== 更新后的资产 ===')
for (const f of fs.readdirSync(OUT).sort()) {
  const s = fs.statSync(path.join(OUT, f)).size
  const m = await sharp(path.join(OUT, f)).metadata()
  console.log(`  ${f.padEnd(18)} ${String(m.width) + 'x' + m.height}  ${(s / 1024).toFixed(0)}KB  alpha=${m.hasAlpha}`)
}
await sharp(path.join(OUT, 'composer.webp')).flatten({ background: '#0E1620' }).resize(1200).jpeg({ quality: 94 }).toFile(path.join(ROOT, 'build/prev-composer.jpg'))
await sharp(path.join(OUT, 'newSession.webp')).flatten({ background: '#0E1620' }).resize(760).jpeg({ quality: 94 }).toFile(path.join(ROOT, 'build/prev-ns.jpg'))
await sharp(path.join(OUT, 'cordis.webp')).resize(760).jpeg({ quality: 92 }).toFile(path.join(ROOT, 'build/prev-cordis.jpg'))
await sharp(path.join(OUT, 'float.webp')).resize(660).jpeg({ quality: 92 }).toFile(path.join(ROOT, 'build/prev-float.jpg'))
