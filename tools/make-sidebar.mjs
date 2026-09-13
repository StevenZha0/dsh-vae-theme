// 只重出侧边栏资产 —— 去掉此前烧进图里的题字（庐州月 / 一缕青丝一生珍藏 / 许嵩·庐州）
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'build/assets')

const P = { ink: '#0B1016', moon: '#DCE5EA' }

async function inkTexture(w, h, { freq, oct, seed, strength, base }) {
  const t = await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <filter id="f"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${oct}" seed="${seed}" result="n"/>
    <feColorMatrix in="n" type="saturate" values="0"/></filter>
    <rect width="${w}" height="${h}" filter="url(#f)"/></svg>`)).removeAlpha().raw().toBuffer()
  const b = await sharp({ create: { width: w, height: h, channels: 3, background: base } }).raw().toBuffer()
  const out = Buffer.allocUnsafe(w * h * 3)
  for (let i = 0; i < out.length; i++) {
    const a = b[i] / 255, x = t[i] / 255
    out[i] = Math.max(0, Math.min(255, Math.round((a + (x - a) * strength) * 255)))
  }
  return sharp(out, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer()
}

async function duotone(input, w, h, opts) {
  const { dark, light, contrast, lift, gamma, position } = opts
  const raw = await sharp(input).resize(w, h, { fit: 'cover', position }).greyscale().raw().toBuffer()
  const out = Buffer.allocUnsafe(w * h * 3)
  for (let i = 0, p = 0; i < raw.length; i++, p += 3) {
    let v = Math.min(1, Math.max(0, (raw[i] / 255 - 0.5) * contrast + 0.5 + lift))
    v = Math.pow(v, gamma)
    out[p] = Math.round(dark[0] + (light[0] - dark[0]) * v)
    out[p + 1] = Math.round(dark[1] + (light[1] - dark[1]) * v)
    out[p + 2] = Math.round(dark[2] + (light[2] - dark[2]) * v)
  }
  return sharp(out, { raw: { width: w, height: h, channels: 3 } }).png().toBuffer()
}

const SB_W = 520, SB_H = 1800
const svg = (w, h, body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${body}</svg>`)

const sbBg = await inkTexture(SB_W, SB_H, { freq: '0.010 0.026', oct: 4, seed: 17, strength: 0.14, base: P.ink })
let sbPortrait = await duotone(path.join(ROOT, 'raw/web/5be2be1c7a38.jpg'), SB_W, SB_H, {
  dark: [8, 13, 18], light: [206, 219, 227], contrast: 1.34, lift: -0.04, gamma: 1.02, position: 'top',
})
const sbMask = svg(SB_W, SB_H, `<defs>
  <linearGradient id="gv" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#fff" stop-opacity="0.86"/><stop offset="0.16" stop-color="#fff" stop-opacity="1"/>
    <stop offset="0.70" stop-color="#fff" stop-opacity="0.92"/><stop offset="1" stop-color="#fff" stop-opacity="0.08"/>
  </linearGradient>
  <linearGradient id="gh" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#fff" stop-opacity="0.92"/><stop offset="0.82" stop-color="#fff" stop-opacity="1"/>
    <stop offset="1" stop-color="#fff" stop-opacity="0.55"/>
  </linearGradient>
  <mask id="m"><rect width="${SB_W}" height="${SB_H}" fill="url(#gv)"/>
    <rect width="${SB_W}" height="${SB_H}" fill="url(#gh)" style="mix-blend-mode:multiply"/></mask>
</defs><rect width="${SB_W}" height="${SB_H}" fill="#fff" mask="url(#m)"/>`)
sbPortrait = await sharp(sbPortrait).ensureAlpha().composite([{ input: sbMask, blend: 'dest-in' }]).png().toBuffer()

// 注意：不再叠加任何题字（用户要求去掉）。画面只有墨底 + 墨调肖像。
await sharp(await sharp(sbBg).composite([{ input: sbPortrait }]).png().toBuffer())
  .webp({ quality: 86, effort: 6 }).toFile(path.join(OUT, 'sidebar.webp'))

const m = await sharp(path.join(OUT, 'sidebar.webp')).metadata()
console.log(`sidebar.webp ${m.width}x${m.height}`, (fs.statSync(path.join(OUT, 'sidebar.webp')).size / 1024).toFixed(0) + 'KB', '（已移除全部题字）')
await sharp(path.join(OUT, 'sidebar.webp')).resize(260).jpeg({ quality: 92 }).toFile(path.join(ROOT, 'build/prev-sidebar.jpg'))
