// 金丝边框「九宫格」素材 + Cordis 面板专属水墨背景
//
// 为什么用九宫格：单张图 + cover / 100% 拉伸，都会让花纹随框尺寸缩放。
// 拆成「四角固定图 + 四边平铺条」后，角饰尺寸恒定、边纹按固定波长平铺，
// 因此输入框无论拉多长多高，金丝都是同一粗细、同一密度，并且四边完整环绕。
//
// 设计原则（按用户反馈收敛）：
//   · 整圈只有「一根贴边金丝 +（可选）一条紧贴边的细辫纹」，不再有平行辅助线
//   · 角饰 36px（输入区）/ 22px（按钮），短输入框不会被边框吃掉
//   · 新会话按钮不要波浪，只留金框
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'build/assets')
const FR = path.join(ROOT, 'build/frame')
fs.mkdirSync(OUT, { recursive: true })
fs.mkdirSync(FR, { recursive: true })

const G = { g1: '#F9EDBC', g2: '#E3C46A', g3: '#C9A03C', moon: '#DCE5EA', moonSoft: '#9FB6C2' }
const svg = (w, h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`)

const UNIT = 44
const EDGE_LEN = UNIT * 4

/** 卷草纹：从 y 出发回到 y，保证可无缝平铺 */
function wave(x0, y, len, amp, opacity, stroke = 1.15, color = G.g2) {
  const n = Math.round(len / UNIT)
  const parts = [`<g fill="none" stroke="${color}" stroke-width="${stroke}" opacity="${opacity}" stroke-linecap="round">`]
  for (let i = 0; i < n; i++) {
    const x = x0 + i * UNIT
    const dir = i % 2 === 0 ? 1 : -1
    parts.push(`<path d="M ${x} ${y} C ${x + 9} ${y - amp * dir}, ${x + 13} ${y - amp * 1.6 * dir}, ${x + 22} ${y}"/>`)
    parts.push(`<path d="M ${x + 22} ${y} C ${x + 31} ${y + amp * 1.6 * dir}, ${x + 35} ${y + amp * dir}, ${x + 44} ${y}"/>`)
    parts.push(`<path d="M ${x + 13} ${y - amp * 0.7 * dir} q 7 ${-amp * 0.9 * dir} 14 ${-amp * 0.25 * dir}" stroke-width="${(stroke * 0.75).toFixed(2)}"/>`)
    parts.push(`<circle cx="${x + 22}" cy="${y}" r="1.5" fill="${G.g1}" stroke="none" opacity="0.95"/>`)
  }
  parts.push('</g>')
  return parts.join('')
}

const goldLine = (x, y, w, h, op = 0.9) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${Math.min(w, h) / 2}" fill="${G.g1}" opacity="${op}"/>`

/** 纵向边条：波浪旋转 90° 后沿 +y 延伸，平移到 x = band */
function edgeV(flip, C, band, len, amp, braid, braidOn) {
  const parts = [
    `<g transform="${flip ? `translate(${C},0) scale(-1,1)` : ''}">`,
    goldLine(0.5, 0, Math.max(1, C * 0.038), len, 0.85),
  ]
  if (braidOn) parts.push(`<g transform="translate(${band},0) rotate(90)">${wave(0, 0, len, amp, 0.82, braid, G.g1)}</g>`)
  parts.push('</g>')
  return sharp(svg(C, len, parts.join(''))).png().toBuffer()
}

/** 生成一整套九宫格；braidOn=false 时只留贴边金框 */
async function frameSet(C, len, radius, braidOn = true) {
  const bandY = 7
  const amp = Math.max(2.4, C * 0.085)
  const hair = Math.max(1, C * 0.04)
  const braid = Math.max(0.75, C * 0.026)

  const eH = async (flip) => {
    const parts = [
      `<g transform="${flip ? `translate(0,${C}) scale(1,-1)` : ''}">`,
      goldLine(0, 0.5, len, hair, 0.85),
    ]
    if (braidOn) parts.push(wave(0, bandY, len, amp, 0.82, braid, G.g1))
    parts.push('</g>')
    return sharp(svg(len, C, parts.join(''))).png().toBuffer()
  }

  const cor = async (fx, fy) => {
    const r = Math.min(radius, C * 0.62)
    const tr = fx && fy ? `translate(${C},${C}) scale(-1,-1)` : fx ? `translate(${C},0) scale(-1,1)` : fy ? `translate(0,${C}) scale(1,-1)` : ''
    const arc = `M 0 ${C} L 0 ${r} A ${r} ${r} 0 0 1 ${r} 0 L ${C} 0`
    return sharp(svg(C, C, `
      <g transform="${tr}">
        <path d="${arc}" fill="none" stroke="${G.g1}" stroke-width="${hair}" opacity="0.9" stroke-linecap="round"/>
        <g fill="none" stroke="${G.g2}" stroke-width="${(C / 90).toFixed(2)}" opacity="0.42" stroke-linecap="square">
          <path d="M ${C * 0.30} ${C * 0.30} L ${C * 0.30} ${C * 0.54} M ${C * 0.30} ${C * 0.30} L ${C * 0.54} ${C * 0.30}" opacity="0.55"/>
        </g>
        <circle cx="${C * 0.24}" cy="${C * 0.24}" r="${(C / 26).toFixed(2)}" fill="${G.g1}" stroke="none" opacity="0.72"/>
      </g>`)).png().toBuffer()
  }

  return {
    C, len,
    cTL: await cor(false, false), cTR: await cor(true, false),
    cBL: await cor(false, true), cBR: await cor(true, true),
    eH: await eH(false), eHF: await eH(true),
    eV: await edgeV(false, C, bandY, len, amp, braid, braidOn),
    eVF: await edgeV(true, C, bandY, len, amp, braid, braidOn),
  }
}

console.log('生成九宫格边框素材…')
const BIG = await frameSet(36, EDGE_LEN, 22, true)
const SMALL = await frameSet(22, 120, 10, false)

const data = { geometry: { big: { corner: BIG.C, edgeLen: BIG.len }, small: { corner: SMALL.C, edgeLen: SMALL.len } } }
for (const [name, set] of [['big', BIG], ['small', SMALL]]) {
  for (const k of ['cTL', 'cTR', 'cBL', 'cBR', 'eH', 'eHF', 'eV', 'eVF']) {
    fs.writeFileSync(path.join(FR, `${name}-${k}.png`), set[k])
    data[`${name}_${k}`] = 'data:image/png;base64,' + set[k].toString('base64')
  }
}
fs.writeFileSync(path.join(FR, 'frame-data.json'), JSON.stringify(data), 'utf8')
console.log(`  大套 角${BIG.C} 边长${BIG.len} 含辫纹 ／ 小套 角${SMALL.C} 边长${SMALL.len} 仅金框`)
console.log('  frame-data.json', (fs.statSync(path.join(FR, 'frame-data.json')).size / 1024).toFixed(0) + 'KB')

{
  const raw = await sharp(SMALL.eV).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { data: d, info } = raw
  const cols = new Array(info.width).fill(0)
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (d[(y * info.width + x) * info.channels + 3] > 20) cols[x]++
  const active = cols.map((c, x) => (c > 0 ? x : -1)).filter((x) => x >= 0)
  console.log(`  纵向边条有内容列范围 ${Math.min(...active)}–${Math.max(...active)}（画布宽 ${info.width}）`)
}

{
  const W = 900, H = 300, C = BIG.C, L = BIG.len
  const BW = C * 2 + Math.ceil((W - C * 2) / L) * L
  const BH = C * 2 + Math.ceil((H - C * 2) / L) * L
  const comps = [
    { input: BIG.cTL, left: 0, top: 0 }, { input: BIG.cTR, left: BW - C, top: 0 },
    { input: BIG.cBL, left: 0, top: BH - C }, { input: BIG.cBR, left: BW - C, top: BH - C },
  ]
  for (let x = C; x < BW - C; x += L) {
    comps.push({ input: BIG.eH, left: x, top: 0 })
    comps.push({ input: BIG.eHF, left: x, top: BH - C })
  }
  for (let y = C; y < BH - C; y += L) {
    comps.push({ input: BIG.eV, left: 0, top: y })
    comps.push({ input: BIG.eVF, left: BW - C, top: y })
  }
  await sharp({ create: { width: BW, height: BH, channels: 4, background: { r: 11, g: 18, b: 26, alpha: 0.55 } } })
    .composite(comps).extract({ left: 0, top: 0, width: W, height: H })
    .flatten({ background: '#0E1620' }).jpeg({ quality: 95 }).toFile(path.join(ROOT, 'build/prev-frame-9slice.jpg'))
  console.log('  九宫格拼合预览 -> prev-frame-9slice.jpg')
}

// ══════════════════════════════════════════════════════════
console.log('\n绘制 Cordis 面板专属水墨背景…')
const CW = 1080, CH = 900

let seed = 778899
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }

function ridge(baseY, amp, roughness, phase, N = 150, envPow = 0.55) {
  const pts = []
  for (let i = 0; i <= N; i++) {
    const t = i / N, x = -40 + (CW + 80) * t
    let y = 0, a = amp, f = roughness
    for (let o = 0; o < 5; o++) {
      y += a * Math.sin((t * f + phase + o * 1.7) * Math.PI * 2) * (0.5 + 0.5 * Math.sin(t * 3.1 + o * 1.3))
      a *= 0.5; f *= 2.11
    }
    pts.push([x, baseY - y * Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t))), envPow)])
  }
  return pts
}
const curve = (pts) => {
  let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length; i++) {
    const [px, py] = pts[i - 1], [cx, cy] = pts[i]
    d += ` Q ${px.toFixed(1)} ${py.toFixed(1)} ${((px + cx) / 2).toFixed(1)} ${((py + cy) / 2).toFixed(1)}`
  }
  return d
}
const ridgePath = (pts, closeY) => `${curve(pts)} L ${pts.at(-1)[0].toFixed(1)} ${closeY} L ${pts[0][0].toFixed(1)} ${closeY} Z`

function cun(pts, count, len, color, opacity) {
  let out = ''
  for (let i = 0; i < count; i++) {
    const idx = Math.min(pts.length - 2, Math.floor(rnd() * pts.length))
    const [x0, y0] = pts[idx], [x1, y1] = pts[idx + 1]
    const dx = x1 - x0, dy = y1 - y0, L2 = Math.hypot(dx, dy) || 1
    const px = x0 + (rnd() - 0.5) * 18, py = y0 + rnd() * 44
    const sl = len * (0.5 + rnd() * 0.85)
    const ex = px + (dx / L2) * sl * 0.95 + (rnd() - 0.5) * 6
    const ey = py + Math.abs(dy / L2) * sl * 0.55 + sl * 0.42
    out += `<path d="M ${px.toFixed(1)} ${py.toFixed(1)} Q ${((px + ex) / 2).toFixed(1)} ${((py + ey) / 2).toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" stroke="${color}" stroke-width="${(0.6 + rnd() * 1.2).toFixed(2)}" fill="none" opacity="${(opacity * (0.3 + rnd() * 0.7)).toFixed(3)}" stroke-linecap="round"/>`
  }
  return out
}

const HZ = 700
const mC = [
  ridge(HZ - 118, 60, 0.95, 0.2),
  ridge(HZ - 74, 50, 1.4, 0.7),
  ridge(HZ - 26, 38, 2.1, 1.4),
  ridge(HZ + 22, 26, 3.2, 2.3),
]

let moss = ''
for (const L of [
  { pts: mC[1], count: 16, r: 2.4, op: 0.30, c: '#42637A' },
  { pts: mC[2], count: 20, r: 3.0, op: 0.42, c: '#22394A' },
  { pts: mC[3], count: 22, r: 3.4, op: 0.50, c: '#0B1A23' },
]) {
  for (let i = 0; i < L.count; i++) {
    const [x, y] = L.pts[Math.floor(rnd() * L.pts.length)]
    const n = 4 + Math.floor(rnd() * 7)
    for (let k = 0; k < n; k++) {
      moss += `<circle cx="${(x + (rnd() - 0.5) * 34).toFixed(1)}" cy="${(y + rnd() * 12).toFixed(1)}" r="${(L.r * (0.5 + rnd())).toFixed(2)}" fill="${L.c}" opacity="${(L.op * (0.4 + rnd() * 0.6)).toFixed(2)}"/>`
    }
  }
}

let reeds = ''
for (let i = 0; i < 26; i++) {
  const x = CW * 0.72 + rnd() * (CW * 0.28)
  const top = CH - 90 - rnd() * 240
  const bend = (rnd() - 0.5) * 80
  const op = (0.30 + rnd() * 0.38).toFixed(2)
  const tipX = x + bend
  reeds += `<path d="M ${x.toFixed(0)} ${CH} Q ${(x + bend * 0.26).toFixed(0)} ${((CH + top) / 2).toFixed(0)} ${tipX.toFixed(0)} ${top.toFixed(0)}" stroke="#020508" stroke-width="${(1.1 + rnd() * 2).toFixed(1)}" fill="none" opacity="${op}" stroke-linecap="round"/>`
  reeds += `<ellipse cx="${(tipX + 5).toFixed(0)}" cy="${(top - 14).toFixed(0)}" rx="5" ry="21" fill="#020508" opacity="${op}" transform="rotate(${(-16 + rnd() * 32).toFixed(0)} ${(tipX + 5).toFixed(0)} ${(top - 14).toFixed(0)})"/>`
}

let ripple = ''
for (let i = 0; i < 90; i++) {
  const t = Math.pow(rnd(), 1.6)
  const y = HZ + 60 + t * (CH - HZ - 70)
  const w = 14 + rnd() * (40 + t * 190)
  ripple += `<rect x="${(rnd() * CW).toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${(0.6 + rnd() * 0.9).toFixed(1)}" rx="0.5" fill="${G.moon}" opacity="${((0.02 + rnd() * 0.05) * (0.35 + t * 0.9)).toFixed(3)}"/>`
}

const MX = CW * 0.80, MY = 290, MR = 64

const panel = `<svg xmlns="http://www.w3.org/2000/svg" width="${CW}" height="${CH}">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#070D14"/><stop offset="0.22" stop-color="#0C1826"/>
    <stop offset="0.46" stop-color="#18303F"/><stop offset="0.60" stop-color="#2C4F66"/>
    <stop offset="0.665" stop-color="#3A607A"/><stop offset="0.72" stop-color="#22414F"/>
    <stop offset="1" stop-color="#070E15"/>
  </linearGradient>
  <linearGradient id="waterC" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1A2D3A"/><stop offset="0.4" stop-color="#0E1D27"/><stop offset="1" stop-color="#04080C"/>
  </linearGradient>
  <linearGradient id="mistC" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${G.moon}" stop-opacity="0"/><stop offset="0.45" stop-color="#9FBECF" stop-opacity="0.42"/>
    <stop offset="1" stop-color="${G.moon}" stop-opacity="0"/>
  </linearGradient>
  <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.28"/>
    <stop offset="0.14" stop-color="${G.moon}" stop-opacity="0.13"/>
    <stop offset="0.5" stop-color="${G.moonSoft}" stop-opacity="0.04"/>
    <stop offset="1" stop-color="${G.moonSoft}" stop-opacity="0"/>
  </radialGradient>
  <linearGradient id="crescentBody" x1="0.1" y1="0.1" x2="0.9" y2="0.9">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.55" stop-color="#EFF6F9"/><stop offset="1" stop-color="#C6D8E2"/>
  </linearGradient>
  <mask id="crescent">
    <rect width="${CW}" height="${CH}" fill="#000"/>
    <circle cx="${MX}" cy="${MY}" r="${MR}" fill="#fff"/>
    <circle cx="${MX + MR * 0.50}" cy="${MY - MR * 0.38}" r="${MR * 0.94}" fill="#000"/>
  </mask>
  <linearGradient id="g0" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7C9CB2" stop-opacity="0.30"/><stop offset="1" stop-color="#4A6C82" stop-opacity="0.16"/></linearGradient>
  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5C7F96" stop-opacity="0.52"/><stop offset="1" stop-color="#2A4658" stop-opacity="0.42"/></linearGradient>
  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#33536A" stop-opacity="0.88"/><stop offset="1" stop-color="#0E1F29" stop-opacity="0.94"/></linearGradient>
  <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#12222C" stop-opacity="1"/><stop offset="1" stop-color="#04090E" stop-opacity="1"/></linearGradient>
  <filter id="paper" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.018 0.05" numOctaves="4" seed="91" result="t"/>
    <feColorMatrix in="t" type="saturate" values="0"/><feGaussianBlur stdDeviation="1.2"/>
  </filter>
  <filter id="ink" x="-6%" y="-6%" width="112%" height="112%">
    <feTurbulence type="fractalNoise" baseFrequency="0.009 0.024" numOctaves="3" seed="31" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="16" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="0.8"/>
  </filter>
  <filter id="inkFar" x="-8%" y="-8%" width="116%" height="116%">
    <feTurbulence type="fractalNoise" baseFrequency="0.006 0.018" numOctaves="3" seed="13" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="28" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="3.2"/>
  </filter>
  <filter id="haze" x="-12%" y="-12%" width="124%" height="124%">
    <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.012" numOctaves="3" seed="47" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="48" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="15"/>
  </filter>
  <filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="14"/></filter>
  <radialGradient id="vig" cx="0.5" cy="0.5" r="0.58">
    <stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.44"/>
  </radialGradient>
</defs>

<rect width="${CW}" height="${CH}" fill="url(#sky)"/>
<ellipse cx="${MX}" cy="${MY}" rx="430" ry="380" fill="url(#halo)"/>
<g filter="url(#glow)" opacity="0.5" mask="url(#crescent)"><circle cx="${MX}" cy="${MY}" r="${MR}" fill="${G.moon}"/></g>
<g mask="url(#crescent)"><circle cx="${MX}" cy="${MY}" r="${MR}" fill="url(#crescentBody)" opacity="0.96"/></g>

<g filter="url(#haze)" opacity="0.44">
  <ellipse cx="${CW * 0.34}" cy="${CH * 0.17}" rx="${CW * 0.34}" ry="18" fill="url(#mistC)"/>
  <ellipse cx="${CW * 0.78}" cy="${CH * 0.235}" rx="${CW * 0.26}" ry="14" fill="url(#mistC)"/>
</g>

<path d="${ridgePath(mC[0], HZ + 80)}" fill="url(#g0)"/>
<g filter="url(#inkFar)"><path d="${ridgePath(mC[1], HZ + 80)}" fill="url(#g1)"/></g>
<g filter="url(#inkFar)" opacity="0.26"><path d="${curve(mC[1])}" stroke="#A8C2D2" stroke-width="1.8" fill="none"/></g>
<g filter="url(#haze)" opacity="0.5">
  <ellipse cx="${CW * 0.28}" cy="${HZ - 56}" rx="${CW * 0.30}" ry="11" fill="url(#mistC)"/>
  <ellipse cx="${CW * 0.70}" cy="${HZ - 42}" rx="${CW * 0.26}" ry="9" fill="url(#mistC)"/>
</g>
<g filter="url(#ink)">
  <path d="${ridgePath(mC[2], HZ + 80)}" fill="url(#g2)"/>
  <rect width="${CW}" height="${CH}" filter="url(#paper)" opacity="0.07"/>
  ${cun(mC[2], 190, 22, '#050C12', 0.34)}
</g>
<g filter="url(#haze)" opacity="0.42">
  <ellipse cx="${CW * 0.36}" cy="${HZ - 6}" rx="${CW * 0.28}" ry="10" fill="url(#mistC)"/>
</g>
<g filter="url(#ink)">
  <path d="${ridgePath(mC[3], HZ + 80)}" fill="url(#g3)"/>
  ${cun(mC[3], 150, 18, '#03070C', 0.40)}
</g>
<g filter="url(#ink)">${moss}</g>

<rect x="0" y="${HZ + 46}" width="${CW}" height="${CH - HZ - 46}" fill="url(#waterC)"/>
<g filter="url(#inkFar)" opacity="0.9">${ripple}</g>
<g filter="url(#haze)" opacity="0.5">
  <ellipse cx="${CW * 0.32}" cy="${HZ + 62}" rx="${CW * 0.32}" ry="16" fill="url(#mistC)"/>
  <ellipse cx="${CW * 0.80}" cy="${HZ + 48}" rx="${CW * 0.24}" ry="13" fill="url(#mistC)"/>
</g>
<g stroke="#020508" fill="none" stroke-linecap="round" opacity="0.9">${reeds}</g>

<text x="${CW * 0.49}" y="320" font-family="STXingkai" font-size="78" fill="${G.moon}" text-anchor="middle" letter-spacing="6" opacity="0.94">呼吸之野</text>
<rect x="42" y="42" width="${CW - 84}" height="${CH - 84}" fill="none" stroke="${G.moonSoft}" stroke-width="1" opacity="0.12"/>
<rect width="${CW}" height="${CH}" fill="url(#vig)"/>
</svg>`

await sharp(Buffer.from(panel)).png().toBuffer()
  .then((b) => sharp(b).webp({ quality: 90, effort: 6 }).toFile(path.join(OUT, 'cordis.webp')))
await sharp(path.join(OUT, 'cordis.webp')).resize(760).jpeg({ quality: 92 }).toFile(path.join(ROOT, 'build/prev-cordis.jpg'))
console.log(`  cordis.webp ${CW}x${CH}  ← 月牙 + 横排题字`)
