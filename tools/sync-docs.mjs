// 把生成出来的预览图同步到 docs/，避免改了生成器却忘了更新文档配图
//
// 用法：
//   node tools/sync-docs.mjs                    # 从 ./build 取图
//   node tools/sync-docs.mjs --from <目录>       # 从指定目录取图
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DOCS = path.join(ROOT, 'docs')

/* --from 指定预览图所在目录，默认 ./build */
let BUILD = path.join(ROOT, 'build')
const fi = process.argv.indexOf('--from')
if (fi !== -1 && process.argv[fi + 1]) BUILD = path.resolve(process.argv[fi + 1])

/** docs 文件名 → build 里的来源文件 */
const MAP = {
  '效果预览.jpg': 'mockup.jpg',
  '七区域资产预览.jpg': 'assets-preview.jpg',
  '主视觉-庐州月长卷.jpg': 'preview-scroll-plain.jpg',
  '输入区-金丝边框.jpg': 'prev-frame-9slice.jpg',
  'Cordis面板-专属水墨.jpg': 'prev-cordis.jpg',
  '侧边栏-无题字.jpg': 'prev-sidebar.jpg',
  '金丝边框-九宫格验证.jpg': 'prev-nineslice-proof.jpg',
  'VAE艺术字与金色导航字.jpg': 'prev-logo.jpg',
}

const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 12)

let copied = 0
let missing = 0
for (const [doc, src] of Object.entries(MAP)) {
  const sp = path.join(BUILD, src)
  const dp = path.join(DOCS, doc)
  if (!fs.existsSync(sp)) { console.log('  源文件缺失  ' + src); missing++; continue }
  if (fs.existsSync(dp) && sha(sp) === sha(dp)) { console.log('  已是最新    ' + doc); continue }
  fs.copyFileSync(sp, dp)
  console.log('  已更新      ' + doc + '   （源 ' + src + '）')
  copied++
}
console.log('')
console.log('更新 ' + copied + ' 个，源缺失 ' + missing + ' 个')
if (missing) console.log('提示：源文件需先在项目根目录跑对应的 make-*.mjs 生成。')
