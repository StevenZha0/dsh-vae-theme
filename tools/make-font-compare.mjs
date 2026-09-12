// 渲染欢迎页标题的字体候选对比图（主题暗底 + 真实字号）
import sharp from 'sharp'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'build')
const TEXT = '快写一段提示词雅俗共赏'

const FONTS = [
  { label: 'Microsoft YaHei　微软雅黑', family: 'Microsoft YaHei', note: '当前默认（作对照）' },
  { label: 'STXingkai　华文行楷', family: 'STXingkai, 华文行楷', note: '刚换上的（作对照）' },
  { label: 'Noto Serif SC　思源宋体', family: 'Noto Serif SC', note: '开源宋体，笔画有锋芒但不端着' },
  { label: 'STZhongsong　华文中宋', family: 'STZhongsong, 华文中宋', note: '宋体加粗感，稳而不燥' },
  { label: 'STFangsong　华文仿宋', family: 'STFangsong, 华文仿宋', note: '仿宋，有笔意但比楷体收敛' },
  { label: 'FangSong　仿宋', family: 'FangSong, 仿宋', note: '系统仿宋，更瘦更文气' },
  { label: 'DengXian　等线', family: 'DengXian, 等线', note: '人文黑体，比雅黑柔和' },
  { label: 'STXihei　华文细黑', family: 'STXihei, 华文细黑', note: '细黑，清瘦干净' },
  { label: 'STXinwei　华文新魏', family: 'STXinwei, 华文新魏', note: '魏碑笔意，介于楷与宋之间' },
  { label: 'Noto Sans SC　思源黑体', family: 'Noto Sans SC', note: '开源黑体，字面匀称' },
  { label: 'LiSu　隶书', family: 'LiSu, 隶书', note: '隶书，古意明显' },
  { label: 'YouYuan　幼圆', family: 'YouYuan, 幼圆', note: '圆体，柔和轻松' },
]

const W = 1180
const ROW = 74
const PAD = 40
const H = PAD * 2 + ROW * FONTS.length + 26

let rows = ''
FONTS.forEach((f, i) => {
  const y = PAD + i * ROW
  rows += `<line x1="${PAD}" y1="${y - 16}" x2="${W - PAD}" y2="${y - 16}" stroke="#1b2733" stroke-width="1"/>`
  rows += `<text x="${PAD}" y="${y + 2}" font-family="Microsoft YaHei" font-size="12.5" fill="#7f96a5">${f.label}</text>`
  rows += `<text x="${PAD}" y="${y + 20}" font-family="Microsoft YaHei" font-size="11" fill="#4f6474">${f.note}</text>`
  rows += `<text x="${W - PAD}" y="${y + 14}" font-family="${f.family}" font-size="29" fill="#DCE5EA" text-anchor="end">${TEXT}</text>`
})

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#0B1016"/>
  <text x="${PAD}" y="${PAD - 10}" font-family="Microsoft YaHei" font-size="15" fill="#CBDCE6">欢迎页标题字体候选 · 29px · 主题暗底</text>
  ${rows}
  <text x="${PAD}" y="${H - 16}" font-family="Microsoft YaHei" font-size="11.5" fill="#4f6474">同一句话、同一字号下对比；右侧为实际观感</text>
</svg>`

await sharp(Buffer.from(svg)).png().toBuffer()
  .then((b) => sharp(b).jpeg({ quality: 94 }).toFile(path.join(OUT, 'prev-fonts.jpg')))
console.log('字体对比图 -> build/prev-fonts.jpg  ' + W + 'x' + H)
