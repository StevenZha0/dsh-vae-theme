// 生成「VAE」书法艺术字标记（替换左上角 DeepSeek Harness 标志）
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'build')
const moon = '#DCE5EA'

// 主标记：行楷「VAE」+ 一道飞白笔触
async function mark(width, height, fontSize, x, y, extra = '') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width * 2}" height="${height * 2}">
    <defs>
      <linearGradient id="ink" x1="0" y1="0" x2="0.35" y2="1">
        <stop offset="0" stop-color="#FFFFFF"/>
        <stop offset="0.45" stop-color="${moon}"/>
        <stop offset="1" stop-color="#A8BEC9"/>
      </linearGradient>
      <filter id="brush" x="-12%" y="-30%" width="124%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.016 0.05" numOctaves="3" seed="88" result="t"/>
        <feDisplacementMap in="SourceGraphic" in2="t" scale="5" xChannelSelector="R" yChannelSelector="G" result="d"/>
        <feGaussianBlur in="d" stdDeviation="0.35"/>
      </filter>
    </defs>
    <g filter="url(#brush)" font-family="STXingkai" fill="url(#ink)">
      <text x="${x * 2}" y="${y * 2}" font-size="${fontSize * 2}" letter-spacing="${fontSize * 0.06}" text-anchor="start">VAE</text>
    </g>
    ${extra}
  </svg>`
  return sharp(Buffer.from(svg)).png().toBuffer()
}

/** 按墨迹自动裁切，再对称留白到目标宽高比。
 *  背景图用 background-position:center 居中的是**整张画布** ——
 *  画布内容不居中，字看起来就会偏。这里保证墨迹严格居中。 */
async function centerInk(buf, targetAspect, marginRatio = 0.06) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H, channels: C } = info
  let minX = W, maxX = -1, minY = H, maxY = -1
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * C + 3] > 24) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return buf
  const w = maxX - minX + 1
  const h = maxY - minY + 1
  const m = Math.max(2, Math.round(h * marginRatio))
  let W2 = w + m * 2
  let H2 = h + m * 2
  if (W2 / H2 < targetAspect) W2 = Math.round(H2 * targetAspect)
  else H2 = Math.round(W2 / targetAspect)
  const dx = Math.round((W2 - w) / 2)
  const dy = Math.round((H2 - h) / 2)
  const cropped = await sharp(buf).extract({ left: minX, top: minY, width: w, height: h }).png().toBuffer()
  return sharp(cropped)
    .extend({
      left: dx, right: W2 - w - dx, top: dy, bottom: H2 - h - dy,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png().toBuffer()
}

async function save(name, buf) {
  fs.writeFileSync(path.join(OUT, name), buf)
  const m = await sharp(buf).metadata()
  console.log(`  ${name}  ${m.width}x${m.height}  ${(buf.length / 1024).toFixed(1)}KB  base64 ${(buf.length * 1.34 / 1024).toFixed(0)}KB`)
  return buf
}

/** 复核：墨迹中心与画布中心的偏差 */
async function checkCentered(label, buf) {
  const { data, info } = await sharp(buf).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const { width: W, height: H, channels: C } = info
  let minX = W, maxX = -1, minY = H, maxY = -1
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * C + 3] > 24) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  const offX = (minX + maxX) / 2 - (W - 1) / 2
  const offY = (minY + maxY) / 2 - (H - 1) / 2
  const ok = Math.abs(offX) <= 1 && Math.abs(offY) <= 1
  console.log(`  ${label}: 画布 ${W}x${H}  墨迹 x ${minX}–${maxX}  水平偏差 ${offX.toFixed(1)}px  垂直偏差 ${offY.toFixed(1)}px  ${ok ? '✓ 居中' : '✗ 仍偏'}`)
  return ok
}

console.log('生成 VAE 标记…')
// 展开态：横向 VAE（显示尺寸约 132x34，宽高比 3.88）
const main = await centerInk(await mark(150, 40, 30, 16, 30), 3.88)
await save('vae-logo.png', main)

// 收起态：单个「嵩」字小标（无印章框，纯书法字）
const miniSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
  <defs><linearGradient id="ink" x1="0" y1="0" x2="0.3" y2="1">
    <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.5" stop-color="${moon}"/><stop offset="1" stop-color="#A8BEC9"/>
  </linearGradient></defs>
  <g font-family="STXingkai" fill="url(#ink)">
    <text x="36" y="48" font-size="44" text-anchor="middle">嵩</text>
  </g>
</svg>`
const mini = await centerInk(await sharp(Buffer.from(miniSvg)).png().toBuffer(), 1)
await save('vae-logo-mini.png', mini)

// 顶部导航栏金色艺术字
const goldSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1560" height="180">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="0.25" y2="1">
      <stop offset="0"    stop-color="#FFFDF4"/>
      <stop offset="0.22" stop-color="#FFF8D2"/>
      <stop offset="0.44" stop-color="#FFE794"/>
      <stop offset="0.60" stop-color="#F4CC60"/>
      <stop offset="0.78" stop-color="#FFF6D8"/>
      <stop offset="1"    stop-color="#E0B646"/>
    </linearGradient>
    <filter id="soft" x="-6%" y="-40%" width="112%" height="180%">
      <feGaussianBlur stdDeviation="1.1"/>
    </filter>
  </defs>
  <g font-family="STXingkai" font-size="88" letter-spacing="10" text-anchor="middle">
    <text x="780" y="122" fill="#2A1E05" opacity="0.55" filter="url(#soft)">音乐纯粹，爱V绝对</text>
    <text x="778" y="118" fill="url(#gold)">音乐纯粹，爱V绝对</text>
  </g>
</svg>`
/* 金色导航字：保持原始画布 1560x180 不裁切。
   原因：运行时用 background-size:contain 渲染，若裁到墨迹，同样的展示盒会把字放大。 */
const gold = await sharp(Buffer.from(goldSvg)).png().toBuffer()
await save('vae-gold-nav.png', gold)

console.log('\n居中复核：')
await checkCentered('vae-logo.png     ', main)
await checkCentered('vae-logo-mini.png', mini)
await checkCentered('vae-gold-nav.png ', gold)

// 供 runtime 使用的 base64 数据
fs.writeFileSync(path.join(OUT, 'vae-logo-data.json'), JSON.stringify({
  main: 'data:image/png;base64,' + main.toString('base64'),
  mini: 'data:image/png;base64,' + mini.toString('base64'),
  gold: 'data:image/png;base64,' + gold.toString('base64'),
}), 'utf8')

// 预览：黑底上看效果
const preview = await sharp({ create: { width: 700, height: 190, channels: 3, background: '#0B1016' } })
  .composite([
    { input: await sharp(main).resize(200).toBuffer(), left: 26, top: 24 },
    { input: await sharp(mini).resize(50).toBuffer(), left: 250, top: 34 },
    { input: await sharp(gold).resize(400).toBuffer(), left: 270, top: 110 },
  ]).jpeg({ quality: 92 }).toBuffer()
fs.writeFileSync(path.join(OUT, 'prev-logo.jpg'), preview)
console.log('  prev-logo.jpg')
