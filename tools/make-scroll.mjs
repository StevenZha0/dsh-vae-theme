// 《庐州月》水墨长卷 v7 —— 参照经典国风水墨重制
// 要点（据参考图 r0–r11 归纳）：
//   · 淡墨分层：远山淡、近山浓，层间用云带留白隔开
//   · 皴法：沿山脊坡向的短笔，而不是直挺竖线
//   · 点叶树丛：山脊与近岸的树用簇点/松针表现 —— 这是"像水墨"的关键
//   · 大量留白：水面不画满，靠雾气与云带制造空灵感
//   · 去掉建筑与人物（此前为简笔线条，是最刺眼的败笔）
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'build')
fs.mkdirSync(OUT, { recursive: true })

const W = 3840, H = 2400, HZ = 1560
const S = 0.75
const MW = Math.round(W * S), MH = Math.round(H * S), MHZ = Math.round(HZ * S)

const C = {
  moon: '#E6EEF3', moonSoft: '#A8BFCC',
  inkDeep: '#05090D', ink: '#0B141B', ink2: '#152531', ink3: '#24404F',
  mist: '#3E5F76', mistLit: '#5A7E93',
}
const MOON = { x: 0.735, y: 0.185, r: 150 }

let seed = 20260910
const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff }

function ridge({ x0, x1, baseY, amp, roughness, octaves = 6, phase = 0, N = 190, envPow = 0.55 }) {
  const pts = []
  for (let i = 0; i <= N; i++) {
    const t = i / N, x = x0 + (x1 - x0) * t
    let y = 0, a = amp, f = roughness
    for (let o = 0; o < octaves; o++) {
      y += a * Math.sin((t * f + phase + o * 1.7) * Math.PI * 2) * (0.5 + 0.5 * Math.sin(t * 3.1 + o * 1.3))
      a *= 0.5; f *= 2.11
    }
    const env = Math.pow(Math.sin(Math.PI * Math.min(1, Math.max(0, t))), envPow)
    pts.push([x, baseY - y * env])
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

// ── 皴法：沿坡向的短笔，且必须是「加墨」（比山体更深），否则会变成白色划痕 ──
function cunStrokes(pts, count, len, color, opacity, spread = 1) {
  let out = ''
  for (let i = 0; i < count; i++) {
    const idx = Math.min(pts.length - 2, Math.floor(rnd() * pts.length))
    const [x0, y0] = pts[idx]
    const [x1, y1] = pts[idx + 1]
    const dx = x1 - x0, dy = y1 - y0
    const L = Math.hypot(dx, dy) || 1
    const tx = dx / L, ty = dy / L
    const px = x0 + (rnd() - 0.5) * 22 * spread
    const py = y0 + rnd() * 54 * spread
    const sl = len * (0.5 + rnd() * 0.85)
    // 顺着山脊切线写，再往下带一点 —— 披麻皴的走向
    const ex = px + tx * sl * 0.95 + (rnd() - 0.5) * 7
    const ey = py + Math.abs(ty) * sl * 0.55 + sl * 0.42
    const mx = px + (ex - px) * 0.5 + (rnd() - 0.5) * 5
    const my = py + (ey - py) * 0.5
    out += `<path d="M ${px.toFixed(1)} ${py.toFixed(1)} Q ${mx.toFixed(1)} ${my.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}" stroke="${color}" stroke-width="${(0.7 + rnd() * 1.4).toFixed(2)}" fill="none" opacity="${(opacity * (0.3 + rnd() * 0.7)).toFixed(3)}" stroke-linecap="round"/>`
  }
  return out
}

// ── 点叶树 ──
function dotTree(x, baseY, h, color, opacity) {
  let s = ''
  // 冠部淡墨团块：给树以"墨量"，避免只剩稀疏点子像枯枝
  s += `<ellipse cx="${(x + h * 0.05).toFixed(1)}" cy="${(baseY - h * 0.72).toFixed(1)}" rx="${(h * 0.46).toFixed(1)}" ry="${(h * 0.34).toFixed(1)}" fill="${color}" opacity="${(opacity * 0.34).toFixed(3)}"/>`
  s += `<path d="M ${x.toFixed(1)} ${baseY.toFixed(1)} Q ${(x + h * 0.06).toFixed(1)} ${(baseY - h * 0.4).toFixed(1)} ${(x + h * 0.03).toFixed(1)} ${(baseY - h * 0.72).toFixed(1)}" stroke="${color}" stroke-width="${(h * 0.042).toFixed(2)}" fill="none" stroke-linecap="round" opacity="${opacity}"/>`
  s += `<path d="M ${(x + h * 0.02).toFixed(1)} ${(baseY - h * 0.34).toFixed(1)} L ${(x - h * 0.24).toFixed(1)} ${(baseY - h * 0.58).toFixed(1)}" stroke="${color}" stroke-width="${(h * 0.026).toFixed(2)}" fill="none" stroke-linecap="round" opacity="${(opacity * 0.85).toFixed(2)}"/>`
  s += `<path d="M ${(x + h * 0.04).toFixed(1)} ${(baseY - h * 0.46).toFixed(1)} L ${(x + h * 0.28).toFixed(1)} ${(baseY - h * 0.66).toFixed(1)}" stroke="${color}" stroke-width="${(h * 0.026).toFixed(2)}" fill="none" stroke-linecap="round" opacity="${(opacity * 0.85).toFixed(2)}"/>`
  const n = 54 + Math.floor(rnd() * 40)
  for (let i = 0; i < n; i++) {
    const a = rnd() * Math.PI * 2
    const r = Math.pow(rnd(), 0.5) * h * 0.48
    const px = x + h * 0.05 + Math.cos(a) * r * 1.2
    const py = baseY - h * 0.74 + Math.sin(a) * r * 0.7
    s += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(h * 0.026 * (0.6 + rnd() * 0.9)).toFixed(2)}" fill="${color}" opacity="${(opacity * (0.45 + rnd() * 0.55)).toFixed(2)}"/>`
  }
  return s
}

// ── 松树 ──
function pineTree(x, baseY, h, color, opacity) {
  let s = `<ellipse cx="${(x + h * 0.02).toFixed(1)}" cy="${(baseY - h * 0.58).toFixed(1)}" rx="${(h * 0.40).toFixed(1)}" ry="${(h * 0.32).toFixed(1)}" fill="${color}" opacity="${(opacity * 0.26).toFixed(3)}"/>`
  s += `<path d="M ${x.toFixed(1)} ${baseY.toFixed(1)} Q ${(x + h * 0.05).toFixed(1)} ${(baseY - h * 0.5).toFixed(1)} ${(x + h * 0.02).toFixed(1)} ${(baseY - h).toFixed(1)}" stroke="${color}" stroke-width="${(h * 0.05).toFixed(2)}" fill="none" stroke-linecap="round" opacity="${opacity}"/>`
  const layers = 6
  for (let i = 1; i <= layers; i++) {
    const t = i / (layers + 1)
    const y = baseY - h * t
    const w = h * 0.50 * (1 - t * 0.45)
    const n = 7 + Math.floor(rnd() * 5)
    for (let k = 0; k < n; k++) {
      const u = n === 1 ? 0 : (k / (n - 1)) - 0.5
      const x0 = x + h * 0.02 + u * w * 2
      const x1 = x0 + u * h * 0.14
      s += `<path d="M ${x0.toFixed(1)} ${y.toFixed(1)} Q ${((x0 + x1) / 2).toFixed(1)} ${(y - h * 0.055).toFixed(1)} ${x1.toFixed(1)} ${(y - h * 0.105).toFixed(1)}" stroke="${color}" stroke-width="${(h * 0.017).toFixed(2)}" fill="none" opacity="${(opacity * 0.9).toFixed(2)}" stroke-linecap="round"/>`
    }
  }
  return s
}

// ══════════ 山体层 ══════════
const m = [
  ridge({ x0: -60, x1: MW + 60, baseY: MHZ - 150, amp: 74, roughness: 0.92, phase: 0.15 }),
  ridge({ x0: -60, x1: MW + 60, baseY: MHZ - 106, amp: 64, roughness: 1.38, phase: 0.62 }),
  ridge({ x0: -60, x1: MW + 60, baseY: MHZ - 52, amp: 50, roughness: 2.0, phase: 1.28 }),
  ridge({ x0: -60, x1: MW + 60, baseY: MHZ + 2, amp: 34, roughness: 3.0, phase: 2.2 }),
  ridge({ x0: -60, x1: MW + 60, baseY: MHZ + 46, amp: 20, roughness: 4.4, phase: 3.4 }),
]

// 山脊点苔：国画里最克制也最地道的细节 —— 成簇的墨点，而不是具象的树
let ridgeMoss = ''
for (const L of [
  { pts: m[1], count: 12, r: 2.2, op: 0.22, color: '#5E8298' },
  { pts: m[2], count: 26, r: 3.0, op: 0.32, color: '#3A5A70' },
  { pts: m[3], count: 34, r: 3.8, op: 0.44, color: '#1E3442' },
  { pts: m[4], count: 40, r: 4.4, op: 0.54, color: '#0B1A23' },
]) {
  for (let i = 0; i < L.count; i++) {
    const t = 0.05 + rnd() * 0.9
    const idx = Math.min(L.pts.length - 1, Math.floor(t * L.pts.length))
    const [x, y] = L.pts[idx]
    if (y >= MHZ + 46) continue
    const n = 5 + Math.floor(rnd() * 9)
    for (let k = 0; k < n; k++) {
      const dx = (rnd() - 0.5) * 44
      const dy = rnd() * 15
      ridgeMoss += `<circle cx="${(x + dx).toFixed(1)}" cy="${(y + dy).toFixed(1)}" r="${(L.r * (0.5 + rnd())).toFixed(2)}" fill="${L.color}" opacity="${(L.op * (0.4 + rnd() * 0.6)).toFixed(2)}"/>`
    }
  }
}
// 近水处少量矮树，仅在最靠近的一层，尺度很小
let shoreTrees = ''
for (let i = 0; i < 5; i++) {
  const t = 0.12 + rnd() * 0.76
  const idx = Math.min(m[4].length - 1, Math.floor(t * m[4].length))
  const [x, y] = m[4][idx]
  if (y >= MHZ + 46) continue
  shoreTrees += dotTree(x, y + 3, 34 + rnd() * 22, '#0A1620', 0.6)
}

const layerB = `<svg xmlns="http://www.w3.org/2000/svg" width="${MW}" height="${MH}">
<defs>
  <linearGradient id="mistBand" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.moon}" stop-opacity="0"/>
    <stop offset="0.45" stop-color="#9FBECF" stop-opacity="0.46"/>
    <stop offset="1" stop-color="${C.moon}" stop-opacity="0"/>
  </linearGradient>
  ${m.map((_, i) => `<clipPath id="c${i}"><path d="${ridgePath(m[i], MHZ + 70)}"/></clipPath>`).join('')}
  <linearGradient id="g0" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8FAFC4" stop-opacity="0.30"/><stop offset="0.5" stop-color="#6C8FA5" stop-opacity="0.20"/><stop offset="1" stop-color="#4A6C82" stop-opacity="0.14"/></linearGradient>
  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6E90A6" stop-opacity="0.48"/><stop offset="0.45" stop-color="#42637A" stop-opacity="0.42"/><stop offset="1" stop-color="#2A4658" stop-opacity="0.36"/></linearGradient>
  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3A5A70" stop-opacity="0.86"/><stop offset="0.42" stop-color="#1E3A4A" stop-opacity="0.88"/><stop offset="1" stop-color="#0E1F29" stop-opacity="0.92"/></linearGradient>
  <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14242E" stop-opacity="1"/><stop offset="1" stop-color="#060E14" stop-opacity="1"/></linearGradient>
  <linearGradient id="g4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0A141B" stop-opacity="1"/><stop offset="1" stop-color="#03070A" stop-opacity="1"/></linearGradient>
  <filter id="paper" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.016 0.045" numOctaves="4" seed="93" result="t"/>
    <feColorMatrix in="t" type="saturate" values="0"/><feGaussianBlur stdDeviation="1.4"/>
  </filter>
  <filter id="ink" x="-5%" y="-5%" width="110%" height="110%">
    <feTurbulence type="fractalNoise" baseFrequency="0.008 0.022" numOctaves="3" seed="3" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="16" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="0.8"/>
  </filter>
  <filter id="inkFar" x="-6%" y="-6%" width="112%" height="112%">
    <feTurbulence type="fractalNoise" baseFrequency="0.0055 0.016" numOctaves="3" seed="11" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="28" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="3.4"/>
  </filter>
  <filter id="softMist" x="-12%" y="-12%" width="124%" height="124%">
    <feTurbulence type="fractalNoise" baseFrequency="0.0032 0.011" numOctaves="3" seed="23" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="52" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="18"/>
  </filter>
</defs>

<g filter="url(#softMist)" opacity="0.42">
  <ellipse cx="${MW * 0.36}" cy="${MH * 0.155}" rx="${MW * 0.34}" ry="22" fill="url(#mistBand)"/>
  <ellipse cx="${MW * 0.78}" cy="${MH * 0.215}" rx="${MW * 0.26}" ry="17" fill="url(#mistBand)"/>
</g>

<g clip-path="url(#c0)"><rect width="${MW}" height="${MH}" fill="url(#g0)"/></g>

<g clip-path="url(#c1)" filter="url(#inkFar)">
  <rect width="${MW}" height="${MH}" fill="url(#g1)"/>
  <rect width="${MW}" height="${MH}" filter="url(#paper)" opacity="0.06"/>
</g>
<g filter="url(#inkFar)" opacity="0.30"><path d="${curve(m[1])}" stroke="#A8C2D2" stroke-width="2.4" fill="none"/></g>

<g filter="url(#softMist)" opacity="0.5">
  <ellipse cx="${MW * 0.30}" cy="${MHZ - 78}" rx="${MW * 0.30}" ry="15" fill="url(#mistBand)"/>
  <ellipse cx="${MW * 0.72}" cy="${MHZ - 60}" rx="${MW * 0.26}" ry="13" fill="url(#mistBand)"/>
</g>

<g clip-path="url(#c2)" filter="url(#ink)">
  <rect width="${MW}" height="${MH}" fill="url(#g2)"/>
  <rect width="${MW}" height="${MH}" filter="url(#paper)" opacity="0.07"/>
  ${cunStrokes(m[2], 420, 34, '#040A10', 0.40)}
</g>


<g filter="url(#softMist)" opacity="0.42">
  <ellipse cx="${MW * 0.24}" cy="${MHZ - 6}" rx="${MW * 0.26}" ry="13" fill="url(#mistBand)"/>
  <ellipse cx="${MW * 0.66}" cy="${MHZ + 6}" rx="${MW * 0.24}" ry="11" fill="url(#mistBand)"/>
</g>

<g clip-path="url(#c3)" filter="url(#ink)">
  <rect width="${MW}" height="${MH}" fill="url(#g3)"/>
  <rect width="${MW}" height="${MH}" filter="url(#paper)" opacity="0.08"/>
  ${cunStrokes(m[3], 360, 30, '#03070C', 0.46)}
</g>


<g clip-path="url(#c4)" filter="url(#ink)">
  <rect width="${MW}" height="${MH}" fill="url(#g4)"/>
  <rect width="${MW}" height="${MH}" filter="url(#paper)" opacity="0.05"/>
  ${cunStrokes(m[4], 130, 20, '#020508', 0.34)}
</g>

<g filter="url(#ink)">${ridgeMoss}${shoreTrees}</g>

<g filter="url(#softMist)" opacity="0.36">
  <ellipse cx="${MW * 0.44}" cy="${MHZ + 46}" rx="${MW * 0.40}" ry="16" fill="url(#mistBand)"/>
</g>
</svg>`

// ══════════ 天幕 ══════════
const MX = W * MOON.x, MY = H * MOON.y, MR = MOON.r
const layerSky = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs>
  <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#060B11"/><stop offset="0.18" stop-color="#0A1420"/>
    <stop offset="0.40" stop-color="#152A3C"/><stop offset="0.56" stop-color="#33586F"/>
    <stop offset="0.625" stop-color="#4A7288"/><stop offset="0.665" stop-color="#39607A"/>
    <stop offset="0.72" stop-color="#1C3A4C"/><stop offset="1" stop-color="#070D14"/>
  </linearGradient>
  <radialGradient id="halo" cx="0.5" cy="0.5" r="0.5">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity="0.40"/>
    <stop offset="0.05" stop-color="#F4F8FA" stop-opacity="0.30"/>
    <stop offset="0.12" stop-color="${C.moon}" stop-opacity="0.20"/>
    <stop offset="0.28" stop-color="${C.moonSoft}" stop-opacity="0.09"/>
    <stop offset="0.56" stop-color="${C.moonSoft}" stop-opacity="0.03"/>
    <stop offset="1" stop-color="${C.moonSoft}" stop-opacity="0"/>
  </radialGradient>
  <radialGradient id="moonBody" cx="0.37" cy="0.31" r="0.82">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.36" stop-color="#F6FAFC"/>
    <stop offset="0.7" stop-color="#E2ECF1"/><stop offset="1" stop-color="#C2D4DE"/>
  </radialGradient>
  <radialGradient id="corner" cx="0.5" cy="0.5" r="0.56">
    <stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.44"/>
  </radialGradient>
  <linearGradient id="vign" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000" stop-opacity="0.34"/><stop offset="0.20" stop-color="#000" stop-opacity="0"/>
    <stop offset="0.80" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.42"/>
  </linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#sky)"/>
<ellipse cx="${MX}" cy="${MY}" rx="1420" ry="1240" fill="url(#halo)"/>
<circle cx="${MX}" cy="${MY}" r="${MR}" fill="url(#moonBody)" opacity="0.98"/>
<g opacity="0.07" fill="#7C96A6">
  <ellipse cx="${MX - 47}" cy="${MY - 40}" rx="52" ry="43"/>
  <ellipse cx="${MX + 41}" cy="${MY + 35}" rx="30" ry="25"/>
  <ellipse cx="${MX - 15}" cy="${MY + 64}" rx="20" ry="16"/>
  <ellipse cx="${MX + 58}" cy="${MY - 63}" rx="15" ry="12"/>
  <ellipse cx="${MX - 70}" cy="${MY + 10}" rx="17" ry="13"/>
</g>
<circle cx="${MX}" cy="${MY}" r="${MR}" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.28"/>
</svg>`

// ══════════ 前景 ══════════
const PLAIN = process.argv[2] === 'plain'
const textLayer = PLAIN ? `
<g font-family="STXingkai" fill="${C.moon}" opacity="0.20">
  ${'庐州月'.split('').map((c, i) => `<text x="${W - 118}" y="${286 + i * 92}" font-size="74" text-anchor="middle">${c}</text>`).join('')}
</g>` : `
<g font-family="STXingkai" fill="${C.moon}">
${'庐州月'.split('').map((ch, i) => `<text x="430" y="${452 + i * 262}" font-size="210" text-anchor="middle" opacity="0.94">${ch}</text>`).join('')}
</g>`

let ripples = ''
for (let i = 0; i < 210; i++) {
  const t = Math.pow(rnd(), 1.7)
  const y = HZ + 130 + t * (H - HZ - 150)
  const w = 20 + rnd() * (60 + t * 340)
  const x = rnd() * W
  const op = (0.020 + rnd() * 0.055) * (0.35 + t * 0.9)
  ripples += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${(0.6 + rnd() * 1.0).toFixed(1)}" rx="0.5" fill="${C.moon}" opacity="${op.toFixed(3)}"/>`
}

let reflect = ''
for (let i = 0; i < 52; i++) {
  const y = HZ + 126 + i * 15 + (rnd() - 0.5) * 8
  const t = i / 52
  const w = (300 - i * 5.2) * (0.28 + 0.72 * Math.abs(Math.sin(i * 1.63 + 0.5)))
  if (w <= 5) continue
  const jitter = (rnd() - 0.5) * 120
  reflect += `<rect x="${(MX - w / 2 + jitter).toFixed(0)}" y="${y.toFixed(0)}" width="${w.toFixed(0)}" height="${(1.0 + t * 2.0).toFixed(1)}" rx="1" fill="${C.moon}" opacity="${(0.20 * (1 - t * 0.9)).toFixed(3)}"/>`
}

// 右下角：一小丛低矮芦苇（与左侧呼应）+ 一层极淡岸影
// —— 不放树/建筑，避免任何"简笔画"观感
const PB_R = W + 40, PB_Y = H - 96
let bank = `<path d="M ${W * 0.76} ${H} Q ${W * 0.86} ${PB_Y + 34} ${W * 0.94} ${PB_Y + 6} Q ${W} ${PB_Y - 12} ${PB_R} ${PB_Y + 22} L ${PB_R} ${H} Z" fill="#04080C" opacity="0.72"/>`
let rightReeds = ''
for (let i = 0; i < 34; i++) {
  const x = W * 0.80 + rnd() * (W * 0.20)
  const top = H - 120 - rnd() * 300
  const bend = (rnd() - 0.5) * 90
  const sw = (1.2 + rnd() * 2.2).toFixed(1)
  const op = (0.28 + rnd() * 0.38).toFixed(2)
  const tipX = x + bend
  rightReeds += `<path d="M ${x.toFixed(0)} ${H} Q ${(x + bend * 0.26).toFixed(0)} ${((H + top) / 2).toFixed(0)} ${tipX.toFixed(0)} ${top.toFixed(0)}" stroke-width="${sw}" opacity="${op}"/>`
  rightReeds += `<ellipse cx="${(tipX + 6).toFixed(0)}" cy="${(top - 16).toFixed(0)}" rx="5.5" ry="23" fill="#020508" stroke="none" opacity="${op}" transform="rotate(${(-18 + rnd() * 36).toFixed(0)} ${(tipX + 6).toFixed(0)} ${(top - 16).toFixed(0)})"/>`
}

let reeds = ''
for (let i = 0; i < 62; i++) {
  const x = 20 + rnd() * 560
  const top = H - 260 - rnd() * 760
  const bend = (rnd() - 0.5) * 170
  const sw = (1.4 + rnd() * 3.0).toFixed(1)
  const op = (0.42 + rnd() * 0.45).toFixed(2)
  const tipX = x + bend
  reeds += `<path d="M ${x.toFixed(0)} ${H} Q ${(x + bend * 0.26).toFixed(0)} ${((H + top) / 2).toFixed(0)} ${tipX.toFixed(0)} ${top.toFixed(0)}" stroke-width="${sw}" opacity="${op}"/>`
  reeds += `<ellipse cx="${(tipX + 7).toFixed(0)}" cy="${(top - 20).toFixed(0)}" rx="6.5" ry="27" fill="#020508" stroke="none" opacity="${op}" transform="rotate(${(-18 + rnd() * 36).toFixed(0)} ${(tipX + 7).toFixed(0)} ${(top - 20).toFixed(0)})"/>`
}
// 左下角一小丛礁石（压住芦苇根部，尺度克制）
let leftRock = `<path d="M -40 ${H} L -40 ${H - 86} Q 60 ${H - 148} 168 ${H - 74} Q 248 ${H - 24} 318 ${H} Z" fill="#04080C" opacity="0.88"/>`
leftRock += cunStrokes([[-40, H - 86], [60, H - 148], [168, H - 74], [248, H - 24], [318, H]], 34, 22, '#010406', 0.36)
leftRock += dotTree(78, H - 118, 132, '#03070A', 0.88)
leftRock += pineTree(214, H - 66, 108, '#03070A', 0.85)

const BX = W * 0.40, BY = HZ + 250
const boat = `<g opacity="0.62">
  <path d="M ${BX - 54} ${BY} Q ${BX} ${BY + 15} ${BX + 54} ${BY} Q ${BX} ${BY + 5} ${BX - 54} ${BY} Z" fill="#050A0E"/>
  <path d="M ${BX - 20} ${BY - 3} Q ${BX} ${BY - 34} ${BX + 22} ${BY - 3} Z" fill="#050A0E"/>
  <path d="M ${BX - 54} ${BY + 8} Q ${BX} ${BY + 20} ${BX + 54} ${BY + 8}" stroke="#0A141B" stroke-width="2" fill="none" opacity="0.5"/>
</g>`

let birds = '<g stroke="#0A141B" fill="none" stroke-linecap="round" opacity="0.7">'
for (let i = 0; i < 11; i++) {
  const bx = MX - 780 + rnd() * 520
  const by = MY - 240 + rnd() * 260
  const s = 11 + rnd() * 8
  birds += `<path d="M ${bx - s} ${by} Q ${bx - s * 0.45} ${by - s * 0.6} ${bx} ${by - s * 0.05} Q ${bx + s * 0.45} ${by - s * 0.6} ${bx + s} ${by}" stroke-width="${(1.6 + rnd() * 1.2).toFixed(1)}"/>`
}
birds += '</g>'

let splash = ''
for (let i = 0; i < 70; i++) splash += `<circle cx="${(rnd() * W).toFixed(0)}" cy="${(600 + rnd() * 1500).toFixed(0)}" r="${(0.6 + rnd() * 3.2).toFixed(1)}" fill="#03060A" opacity="${(0.04 + rnd() * 0.16).toFixed(2)}"/>`

const layerFront = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs>
  <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#1B2E3B"/><stop offset="0.22" stop-color="#122330"/>
    <stop offset="0.62" stop-color="#08131B"/><stop offset="1" stop-color="#03070A"/>
  </linearGradient>
  <linearGradient id="mist2" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${C.moon}" stop-opacity="0"/><stop offset="0.5" stop-color="${C.moon}" stop-opacity="0.15"/>
    <stop offset="1" stop-color="${C.moon}" stop-opacity="0"/>
  </linearGradient>
  <filter id="wisp" x="-14%" y="-32%" width="128%" height="164%">
    <feTurbulence type="fractalNoise" baseFrequency="0.0028 0.011" numOctaves="3" seed="41" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="54" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="15"/>
  </filter>
  <filter id="softwater" x="-4%" y="-4%" width="108%" height="108%">
    <feTurbulence type="fractalNoise" baseFrequency="0.0048 0.019" numOctaves="2" seed="77" result="t"/>
    <feDisplacementMap in="SourceGraphic" in2="t" scale="12" xChannelSelector="R" yChannelSelector="G" result="d"/>
    <feGaussianBlur in="d" stdDeviation="2.2"/>
  </filter>
  <radialGradient id="corner2" cx="0.5" cy="0.5" r="0.56">
    <stop offset="0.5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.42"/>
  </radialGradient>
  <linearGradient id="vign2" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#000" stop-opacity="0.32"/><stop offset="0.20" stop-color="#000" stop-opacity="0"/>
    <stop offset="0.80" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.40"/>
  </linearGradient>
</defs>

<rect x="0" y="${HZ + 96}" width="${W}" height="${H - HZ - 96}" fill="url(#water)"/>
<g filter="url(#softwater)">${reflect}</g>
<g filter="url(#softwater)" opacity="0.9">${ripples}</g>
${boat}
<!-- 水线留白：前景剪影的亮底 -->
<g filter="url(#wisp)" opacity="0.62">
  <ellipse cx="${W * 0.20}" cy="${HZ + 150}" rx="${W * 0.30}" ry="30" fill="url(#mist2)"/>
  <ellipse cx="${W * 0.82}" cy="${H - 210}" rx="${W * 0.22}" ry="34" fill="url(#mist2)"/>
</g>
<g filter="url(#wisp)" opacity="0.40">
  <ellipse cx="${W * 0.30}" cy="${HZ + 168}" rx="${W * 0.34}" ry="26" fill="url(#mist2)"/>
  <ellipse cx="${W * 0.72}" cy="${HZ + 146}" rx="${W * 0.28}" ry="21" fill="url(#mist2)"/>
</g>
${birds}
${splash}
<g stroke="#020508" fill="none" stroke-linecap="round">${reeds}</g>
${rightReeds}
${leftRock}
${bank}
${textLayer}
<rect width="${W}" height="${H}" fill="url(#corner2)"/>
<rect width="${W}" height="${H}" fill="url(#vign2)"/>
</svg>`

const t0 = Date.now()
const [bufSky, bufB, bufFront] = await Promise.all([
  sharp(Buffer.from(layerSky)).png().toBuffer(),
  sharp(Buffer.from(layerB)).png().toBuffer(),
  sharp(Buffer.from(layerFront)).png().toBuffer(),
])
const bUp = await sharp(bufB).resize(W, H, { kernel: 'lanczos3' }).png().toBuffer()
console.log('layers', ((Date.now() - t0) / 1000).toFixed(1) + 's')

async function tile(kind) {
  const s = 640
  const conf = kind === 'paper' ? { freq: '0.055 0.07', oct: 3, seed: 19 } : { freq: '0.85', oct: 2, seed: 7 }
  const t = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}"><filter id="f"><feTurbulence type="fractalNoise" baseFrequency="${conf.freq}" numOctaves="${conf.oct}" seed="${conf.seed}" result="n"/><feColorMatrix in="n" type="saturate" values="0"/></filter><rect width="${s}" height="${s}" filter="url(#f)"/></svg>`)).png().toBuffer()
  const cols = Math.ceil(W / s), rows = Math.ceil(H / s), comps = []
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) comps.push({ input: t, left: c * s, top: r * s })
  return sharp({ create: { width: cols * s, height: rows * s, channels: 3, background: '#808080' } }).composite(comps)
    .extract({ left: 0, top: 0, width: W, height: H }).png().toBuffer()
}
const [paperRaw, grainRaw] = await Promise.all([tile('paper'), tile('grain')])

function blend(raw, tex, mode, strength) {
  const out = Buffer.allocUnsafe(raw.length)
  for (let i = 0; i < raw.length; i++) {
    const a = raw[i] / 255, t = tex[i] / 255
    let r
    if (mode === 'soft-light') {
      r = t <= 0.5 ? a - (1 - 2 * t) * a * (1 - a)
        : a + (2 * t - 1) * ((a <= 0.25 ? ((16 * a - 12) * a + 4) * a : Math.sqrt(a)) - a)
    } else {
      r = a <= 0.5 ? 2 * a * t : 1 - 2 * (1 - a) * (1 - t)
    }
    out[i] = Math.max(0, Math.min(255, Math.round((a + (r - a) * strength) * 255)))
  }
  return out
}

const base = await sharp(bufSky)
  .composite([{ input: bUp, blend: 'over' }, { input: bufFront, blend: 'over' }])
  .removeAlpha().raw().toBuffer()
const paperN = await sharp(paperRaw).removeAlpha().raw().toBuffer()
const grainN = await sharp(grainRaw).removeAlpha().raw().toBuffer()
if (paperN.length !== base.length || grainN.length !== base.length) throw new Error('纹理通道不匹配')

let mixed = blend(base, paperN, 'soft-light', 0.08)
mixed = blend(mixed, grainN, 'overlay', 0.028)

const final = await sharp(mixed, { raw: { width: W, height: H, channels: 3 } }).png({ compressionLevel: 6 }).toBuffer()
fs.writeFileSync(path.join(OUT, PLAIN ? 'scroll-plain.png' : 'scroll.png'), final)
await sharp(final).resize(1500).jpeg({ quality: 88 }).toFile(path.join(OUT, PLAIN ? 'preview-scroll-plain.jpg' : 'preview-scroll.jpg'))
await sharp(final).extract({ left: 2200, top: 1020, width: 1300, height: 812 }).jpeg({ quality: 92 }).toFile(path.join(OUT, 'crop-detail.jpg'))
console.log('DONE', PLAIN ? 'PLAIN' : 'FULL', (final.length / 1048576).toFixed(2) + 'MB', ((Date.now() - t0) / 1000).toFixed(1) + 's')
