// 把运动参数图降到 1/4 分辨率。
// 参数是"逐株"的（株距约 12 图像像素），全分辨率毫无必要：
// 3840x1100 的 PNG 有 678KB，1/4 后只剩几十 KB，着色器用线性过滤照样平滑。
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = path.join(ROOT, 'build', 'reeds-motion.png')
if (!fs.existsSync(src)) { console.error('缺少 build/reeds-motion.png'); process.exit(1) }

const before = fs.statSync(src).size
const meta = await sharp(src).metadata()
const w = Math.round(meta.width / 4), h = Math.round(meta.height / 4)

await sharp(src)
  .resize(w, h, { kernel: 'nearest' })   /* 用 nearest：这是数据不是图像，不要插值出中间值 */
  .png({ compressionLevel: 9, palette: false })
  .toFile(path.join(ROOT, 'build', 'reeds-motion-small.png'))

fs.renameSync(path.join(ROOT, 'build', 'reeds-motion-small.png'), src)
const after = fs.statSync(src).size
console.log(`运动参数图 ${meta.width}x${meta.height} -> ${w}x${h}   ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`)
