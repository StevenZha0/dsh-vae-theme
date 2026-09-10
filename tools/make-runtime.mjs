// 生成页面运行时装 v2：
//  ① 左上角标志 → 唯一的「VAE」书法字（JS 精确替换 + 侧边栏内水平居中）
//  ② 顶部导航栏 → 居中金色艺术字「音乐纯粹，爱V绝对」
//  ③ 金丝边框强制贴边（覆盖插件默认 cover）
//  ④ 全屏雨幕
//  ⑤ 右下角动态歌词条
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { LYRICS } from './lyrics.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'build')
const logo = JSON.parse(fs.readFileSync(path.join(OUT, 'vae-logo-data.json'), 'utf8'))
const frame = JSON.parse(fs.readFileSync(path.join(ROOT, 'build/frame/frame-data.json'), 'utf8'))

/** 组装九宫格多重背景声明：角固定尺寸、边按固定波长平铺 → 花纹永不随框缩放 */
function nineSlice(prefix) {
  const C = frame.geometry[prefix].corner
  const img = (k) => `url("${frame[`${prefix}_${k}`]}")`
  return {
    image: [img('cTL'), img('cTR'), img('cBL'), img('cBR'), img('eH'), img('eHF'), img('eV'), img('eVF')].join(', '),
    position: 'left top, right top, left bottom, right bottom, left top, right bottom, left top, right top',
    size: `${C}px ${C}px, ${C}px ${C}px, ${C}px ${C}px, ${C}px ${C}px, auto ${C}px, auto ${C}px, ${C}px auto, ${C}px auto`,
    repeat: 'no-repeat, no-repeat, no-repeat, no-repeat, repeat-x, repeat-x, repeat-y, repeat-y',
  }
}
const BIG = nineSlice('big')
const SMALL = nineSlice('small')

const runtime = `/* ══ 庐州月 · 许嵩 — DSH 主题运行时装 v2 ══
   ① VAE 书法标志（单例，侧边栏内居中）
   ② 顶部导航栏金色艺术字「音乐纯粹，爱V绝对」
   ③ 输入区半透明深色玻璃
   ④ 全屏雨幕
   ⑤ 动态歌词条
   关闭全部：localStorage.setItem('vae-theme-fx','off') 后刷新
   ═══════════════════════════════════════════ */
(function () {
  if (window.__VAE_THEME_RUNTIME__) return;
  window.__VAE_THEME_RUNTIME__ = true;

  var LOGO = ${JSON.stringify(logo.main)};
  var LOGO_MINI = ${JSON.stringify(logo.mini)};
  var GOLD = ${JSON.stringify(logo.gold)};
  var LYRICS = ${JSON.stringify(LYRICS)};
  var FX_OFF = false;
  try { FX_OFF = window.localStorage.getItem('vae-theme-fx') === 'off'; } catch (e) {}

  /* ────────── 样式 ────────── */
  var css = [
    /* ① 官方品牌元素全部隐藏（含折叠态鲸鱼图标 —— 否则与 VAE 标记重叠） */
    '[class*="_logoRow"] [class*="_brand"]{display:none !important}',
    '[class*="_logoRow"] [class*="_brand"] svg{display:none !important}',
    '[class*="_logoRow"] [class*="_railFish"]{display:none !important}',
    /* VAE 标记：宽度随行宽自适应，窄栏（折叠态）也不会溢出顶到别的图标 */
    '.vae-brand{display:block !important;width:100%;max-width:132px;height:34px;flex:0 0 auto;' +
      'margin:0 auto !important;background-image:url("' + LOGO + '");background-repeat:no-repeat;' +
      'background-position:center;background-size:contain;filter:drop-shadow(0 1px 7px rgba(5,9,14,.6))}',
    '.vae-brand--mini{max-width:30px;height:30px;background-image:url("' + LOGO_MINI + '")}',

    /* ② 顶部导航栏金色艺术字（亮度已调高） */
    '#vae-gold-nav{position:fixed;top:9px;height:38px;z-index:2147481930;pointer-events:none;' +
      'background-image:url("' + GOLD + '");background-repeat:no-repeat;background-position:center;background-size:contain;' +
      'opacity:.88;filter:drop-shadow(0 1px 4px rgba(5,9,14,.6))}',

    /* ③ 金丝边框：九宫格 —— 角固定尺寸、边按固定波长平铺。
       这样输入框无论拉多长多高，花纹大小恒定，而且四边完整环绕。
       选择器刻意加 html body 前缀以压过插件自带的 !important。 */
    'html body [data-composer-card]::before{background-image:${BIG.image} !important;' +
      'background-position:${BIG.position} !important;background-size:${BIG.size} !important;' +
      'background-repeat:${BIG.repeat} !important;border-radius:22px !important}',
    'html body [class*="_newSession"]:not([class*="_newSessionLabel"])::before{background-image:${SMALL.image} !important;' +
      'background-position:${SMALL.position} !important;background-size:${SMALL.size} !important;' +
      'background-repeat:${SMALL.repeat} !important;border-radius:10px !important}',

    /* ④ 雨幕 */
    '#vae-rain{position:fixed;left:0;top:0;width:100%;height:100%;pointer-events:none;' +
      'z-index:2147481900;mix-blend-mode:screen;opacity:.8}',

    /* ⑤ 竖排歌词：对话区右侧留白。
       传统竖排自右向左阅读 → 正文（歌词）在右，出处（落款）在其左。
       两栏用绝对定位钉死左右关系，不依赖块流方向，排法确定。 */
    '.vae-vcol{position:fixed;top:34%;z-index:2147481950;pointer-events:none;opacity:0;' +
      'transition:opacity 1100ms ease}',
    '.vae-vcol.vae-on{opacity:.8}',
    '.vae-vcol .vae-vline{position:absolute;top:0;right:0;white-space:nowrap;' +
      'writing-mode:vertical-rl;text-orientation:upright;' +
      'font-family:"STXingkai","华文行楷","STKaiti","KaiTi",serif;color:#F6FAFC;' +
      'font-size:27px;line-height:1.06;letter-spacing:.14em;' +
      'text-shadow:0 1px 10px rgba(4,8,12,.85),0 0 26px rgba(4,8,12,.7),' +
      '0 0 3px rgba(246,250,252,.45)}',
    '.vae-vcol .vae-vline span{display:inline-block;opacity:0;transform:translateX(7px);' +
      'transition:opacity 640ms ease,transform 640ms cubic-bezier(.22,.61,.36,1)}',
    '.vae-vcol .vae-vline span.vae-in{opacity:1;transform:none}',
    /* 副栏（出处）：主栏左侧 44px，且向下错开 28px，如落款。比主栏略暗以保持层次 */
    '.vae-vcol .vae-vsrc{right:44px;top:28px;font-family:"STKaiti","KaiTi",serif;' +
      'font-size:14px;letter-spacing:.34em;color:#CBDCE6;opacity:.86}',

    /* ⑥ 折叠态页脚对齐修复
       56px 轨道是 DSH 的设计（"每个控件一个图标"），但 _footerActions 在折叠态
       仍是横向 flex；叠加第三方（cost-meter）注入的 rail 卡片后总宽超出轨道，
       表现为几个按钮错位、被裁。这里统一归一化：纵向堆叠 + 水平居中 + 不溢出。 */
    '[class*="_collapsed"] [class*="_footArea"]{width:100% !important;align-items:center !important}',
    '[class*="_collapsed"] [class*="_footerActions"]{flex-direction:column !important;' +
      'align-items:center !important;justify-content:center !important;width:100% !important;' +
      'gap:6px !important;overflow:visible !important}',
    '[class*="_collapsed"] [class*="_settingsArea"]{width:100% !important;align-items:center !important;' +
      'justify-content:center !important;flex-direction:column !important}',
    '[class*="_collapsed"] [class*="cm-footer-stack"],[class*="_collapsed"] [class*="cm-peak-rail"]{' +
      'max-width:100% !important;width:auto !important;margin-left:auto !important;' +
      'margin-right:auto !important;align-self:center !important;left:auto !important;right:auto !important}',
    /* 折叠态下额度数字卡片只有 25px 宽，数字会挤成一团 —— 只保留它的图标按钮 */
    '[class*="_collapsed"] [class*="cm-footer-stack"]{display:none !important}',

    '@media (max-width:900px){#vae-gold-nav{display:none}}',
    '@media (prefers-reduced-motion: reduce){#vae-rain{display:none}' +
      '.vae-vcol .vae-vline span{transition:none}}'
  ].join('\\n');

  function injectStyle() {
    if (document.getElementById('vae-theme-fx-style')) return;
    var st = document.createElement('style');
    st.id = 'vae-theme-fx-style';
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* ────────── ① VAE 标志：只在「顶部区域的 logo 行」放置 ──────────
     折叠态下底部侧栏里也有 _railFish 之类的品牌图标，若不加位置限制，
     标记会被注进左下角那一行、和那里的按钮挤在一起。 */
  var BRAND_TOP_LIMIT = 170;   /* 只认这个高度以上的行 */
  function brandSwap() {
    if (FX_OFF) return;
    var rows = document.querySelectorAll('[class*="_logoRow"]');
    /* 先清掉所有行上的残留标记，再决定往哪一行放 —— 顺序很关键 */
    for (var c = 0; c < rows.length; c++) {
      var stale = rows[c].getElementsByClassName('vae-brand');
      for (var s = stale.length - 1; s >= 0; s--) stale[s].parentNode.removeChild(stale[s]);
    }
    var best = null, bestTop = Infinity;
    for (var i = 0; i < rows.length; i++) {
      var row = rows[i];
      if (row.querySelectorAll('[class*="_brand"], [class*="_railFish"]').length === 0) continue;
      var r = null;
      try { r = row.getBoundingClientRect(); } catch (e) {}
      if (!r || r.width <= 0) continue;
      if (r.top > BRAND_TOP_LIMIT) continue;          /* 底部侧栏的行：跳过 */
      if (r.top < bestTop) { bestTop = r.top; best = row; }
    }
    if (!best) return;
    /* 隐藏该行内的官方品牌元素（wordmark 与折叠态鲸鱼图标） */
    var hidden = best.querySelectorAll('[class*="_brand"], [class*="_railFish"]');
    for (var h = 0; h < hidden.length; h++) hidden[h].style.setProperty('display', 'none', 'important');
    /* 去重：只保留一个标记 */
    var marks = best.getElementsByClassName('vae-brand');
    for (var d = marks.length - 1; d >= 1; d--) marks[d].parentNode.removeChild(marks[d]);
    var el = marks[0];
    if (!el) {
      el = document.createElement('div');
      el.setAttribute('role', 'img');
      el.setAttribute('aria-label', 'VAE');
      best.appendChild(el);
    }
    /* 行宽 < 130px（折叠态窄栏）→ 换「许」字小标，避免溢出压到其他图标 */
    var w = 0;
    try { w = best.getBoundingClientRect().width; } catch (e) {}
    el.className = 'vae-brand' + (w > 0 && w < 130 ? ' vae-brand--mini' : '');
    centerBrand(el);
  }

  /* 把 VAE 标记的水平中心对齐到**侧边栏中心**。
     仅靠 CSS 的 margin:0 auto 不够：logoRow 里可能还有未隐藏的同级图标，
     自动外边距只在"剩余空间"里居中，视觉上就会偏。这里实测后显式校正偏移。
     先清零再量自然位置，两步在同一帧内完成，不会产生可见抖动。 */
  function centerBrand(el) {
    try {
      var sb = document.querySelector('[class*="_sidebarCol"]');
      if (!sb || !el) return;
      var sbR = sb.getBoundingClientRect();
      if (!(sbR.width > 60)) return;
      el.style.setProperty('margin-left', '0px', 'important');
      el.style.setProperty('margin-right', '0px', 'important');
      var elR = el.getBoundingClientRect();
      if (!(elR.width > 4)) return;
      var want = sbR.left + sbR.width / 2;
      var now = elR.left + elR.width / 2;
      var dx = Math.round(want - now);
      if (Math.abs(dx) <= 1) return;
      if (dx > 0) el.style.setProperty('margin-left', dx + 'px', 'important');
      else el.style.setProperty('margin-right', (-dx) + 'px', 'important');
    } catch (e) {}
  }

  /* ────────── ② 顶部导航栏金色艺术字 ────────── */
  function sidebarWidth() {
    try {
      var col = document.querySelector('[class*="_sidebarCol"]');
      if (col) {
        var r = col.getBoundingClientRect();
        if (r && r.width > 0 && r.width < 420) return Math.round(r.width);
      }
    } catch (e) {}
    return 0;
  }

  function placeGold() {
    var el = document.getElementById('vae-gold-nav');
    if (!el) return;
    var sbW = sidebarWidth();
    var w = Math.min(430, Math.round((window.innerWidth - sbW) * 0.5));
    el.style.width = w + 'px';
    el.style.left = Math.round(sbW + (window.innerWidth - sbW - w) / 2) + 'px';
  }

  function goldNav() {
    if (FX_OFF) return;
    if (!document.getElementById('vae-gold-nav')) {
      var el = document.createElement('div');
      el.id = 'vae-gold-nav';
      el.setAttribute('aria-hidden', 'true');
      document.body.appendChild(el);
      window.addEventListener('resize', placeGold);
    }
    placeGold();
  }

  /* ────────── ④ 雨幕 ────────── */
  function startRain() {
    if (FX_OFF) return;
    try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
    if (document.getElementById('vae-rain')) return;

    var cv = document.createElement('canvas');
    cv.id = 'vae-rain';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d');
    if (!ctx) return;

    var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    var W = 0, H = 0, drops = [];

    function makeDrop(init) {
      return {
        x: Math.random() * W,
        y: init ? Math.random() * H : -Math.random() * 160,
        len: 15 + Math.random() * 36,
        sp: 2.4 + Math.random() * 5.6,
        a: 0.045 + Math.random() * 0.15,
        w: 0.5 + Math.random() * 0.9,
        drift: 0.32 + Math.random() * 0.5
      };
    }

    function resize() {
      W = window.innerWidth; H = window.innerHeight;
      cv.width = Math.floor(W * DPR); cv.height = Math.floor(H * DPR);
      cv.style.width = W + 'px'; cv.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var n = Math.max(60, Math.min(240, Math.round(W * H / 17000)));
      drops = [];
      for (var i = 0; i < n; i++) drops.push(makeDrop(true));
    }

    var last = 0;
    function frame(ts) {
      if (ts - last >= 33) {
        last = ts;
        ctx.clearRect(0, 0, W, H);
        ctx.lineCap = 'round';
        for (var i = 0; i < drops.length; i++) {
          var d = drops[i];
          ctx.strokeStyle = 'rgba(214,228,236,' + d.a.toFixed(3) + ')';
          ctx.lineWidth = d.w;
          ctx.beginPath();
          ctx.moveTo(d.x, d.y);
          ctx.lineTo(d.x - d.len * 0.16 * d.drift, d.y + d.len);
          ctx.stroke();
          d.y += d.sp;
          d.x -= d.sp * 0.16 * d.drift;
          if (d.y > H + 60 || d.x < -60) {
            var nd = makeDrop(false);
            d.x = nd.x; d.y = nd.y; d.len = nd.len; d.sp = nd.sp; d.a = nd.a;
          }
        }
      }
      requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(frame);
  }

  /* ────────── ⑤ 竖排歌词：单栏立于对话区右侧留白 ────────── */
  function startLyrics() {
    if (FX_OFF) return;
    if (document.getElementById('vae-vcol')) return;

    var box = document.createElement('div');
    box.id = 'vae-vcol';
    box.className = 'vae-vcol';
    box.setAttribute('aria-hidden', 'true');
    /* 两个块在 vertical-rl 下天然左右相邻：主栏在右、副栏在左 */
    var main = document.createElement('div');
    main.className = 'vae-vline';
    var sub = document.createElement('div');
    sub.className = 'vae-vline vae-vsrc';
    box.appendChild(main);
    box.appendChild(sub);
    document.body.appendChild(box);

    var lastIdx = -1;
    /* 纯随机：每次独立均匀抽取。仅有的一条约束是"不连续重复同一条"，
       否则同一句可能连着出现两次，观感上像是卡住了。 */
    function pickIndex() {
      var n = LYRICS.length;
      if (n <= 1) return 0;
      var i = Math.floor(Math.random() * n);
      if (i === lastIdx) i = (i + 1 + Math.floor(Math.random() * (n - 1))) % n;
      lastIdx = i;
      return i;
    }
    var reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    function sidebarW() {
      try {
        var c = document.querySelector('[class*="_sidebarCol"]');
        if (c) { var r = c.getBoundingClientRect(); if (r.width > 0 && r.width < 420) return Math.round(r.width) }
      } catch (e) {}
      return 0
    }

    /* 在中列里找出「正文列」右缘：取所有明显窄于中列、且有足够高度的元素中最靠右的边缘。
       正文列容器必然同时满足这两个条件，比按固定最大宽度去猜可靠得多。 */
    function measureContentRight(col, colRect) {
      var best = 0, bestCls = ''
      try {
        var nodes = col.querySelectorAll('div')
        var limit = Math.min(nodes.length, 1500)
        for (var i = 0; i < limit; i++) {
          var r = nodes[i].getBoundingClientRect()
          if (r.width < 360) continue
          if (r.width > colRect.width * 0.9) continue
          if (r.height < 80) continue
          if (r.right > best) { best = r.right; bestCls = String(nodes[i].className).slice(0, 60) }
        }
      } catch (e) {}
      return { right: best, cls: bestCls }
    }

    var lastDiag = null

    /* 计算正文列右缘 —— place() 与"就绪检测"共用同一套逻辑。 */
    function computeContentRight() {
      var vw = window.innerWidth
      var sbW = sidebarW()
      var midW = vw - sbW
      var colRight = vw
      var colRect = null
      var col = null
      try {
        col = document.querySelector('[class*="_centerCol"]')
        if (col) {
          colRect = col.getBoundingClientRect()
          if (colRect.width > 0) { midW = colRect.width; colRight = colRect.right }
        }
      } catch (e) {}
      var measured = colRect ? measureContentRight(col, colRect) : { right: 0, cls: '' }
      var contentRight = measured.right
      var source = measured.right ? 'measured' : ''
      /* 锚点保险：聊天流容器明显窄于中列时，它本身就是正文列；取两者更靠右者更稳。
         （实测：聊天流 863px vs 中列 1427px；卡片刻度命中 uV2eYG_card） */
      try {
        var cf = document.querySelector('[data-chat-flow]')
        if (cf) {
          var fr = cf.getBoundingClientRect()
          if (fr.width > 300 && fr.width < midW * 0.9 && fr.right > contentRight) {
            contentRight = fr.right
            source = source ? 'measured+chatflow' : 'chatflow'
          }
        }
      } catch (e) {}
      if (!contentRight) {
        var contentW = Math.min(midW - 140, 1340)
        contentRight = colRight - (midW - contentW) / 2
        source = 'formula'
      }
      return {
        right: contentRight, source: source, cls: measured.cls,
        vw: vw, sbW: sbW, midW: midW, colRight: colRight, colRect: colRect,
      }
    }

    function place() {
      var info = computeContentRight()
      var vw = info.vw, sbW = info.sbW, midW = info.midW
      var colRect = info.colRect, colRight = info.colRight
      var contentRight = info.right, source = info.source
      var measured = { cls: info.cls }

      var show = midW >= 1080
      box.style.display = show ? 'block' : 'none'
      if (!show) return

      var gutter = vw - contentRight
      /* 留白正中：左右余量均衡 */
      var right = Math.max(38, Math.min(380, Math.round(gutter / 2 - 30)))
      box.style.right = right + 'px'

      /* 垂直定位：短句以 34% 处为视觉中点居中；
         长句一旦会顶到顶部导航栏，就把**上边缘钉住**，改为仅向下延伸。 */
      var vh = window.innerHeight
      var h = 0
      try { h = main.getBoundingClientRect().height } catch (e) {}
      var minTop = 96                              /* 顶部导航栏（约 84px）下方留 12px */
      var top = Math.round(vh * 0.34 - h / 2)
      var clamped = false
      if (top < minTop) { top = minTop; clamped = true }
      box.style.top = top + 'px'
      box.style.transform = 'none'

      var br = box.getBoundingClientRect()
      lastDiag = {
        vw: vw, vh: window.innerHeight,
        sidebarW: sbW,
        centerLeft: colRect ? Math.round(colRect.left) : null,
        centerRight: Math.round(colRight),
        centerW: Math.round(midW),
        contentRight: Math.round(contentRight),
        gutter: Math.round(gutter),
        right: right,
        source: source,
        matchedCls: measured.cls,
        boxLeft: Math.round(br.left),
        boxRight: Math.round(br.right),
        boxTop: Math.round(br.top),
        boxH: Math.round(br.height),
        topClamped: clamped,
        lyric: (main.textContent || '').slice(0, 24)
      }
    }
    window.addEventListener('resize', place)
    window.addEventListener('resize', function () { window.setTimeout(place, 260) })

    /* 把实测数据回传给 Host，便于精确校准 */
    function sendReport() {
      try {
        var extra = { diag: lastDiag, candidates: [] }
        var col = document.querySelector('[class*="_centerCol"]')
        if (col) {
          var cr = col.getBoundingClientRect()
          extra.center = { left: Math.round(cr.left), right: Math.round(cr.right), w: Math.round(cr.width) }
          var nodes = col.querySelectorAll('div')
          var list = []
          for (var i = 0; i < nodes.length && i < 1500; i++) {
            var r = nodes[i].getBoundingClientRect()
            if (r.width < 300 || r.height < 60) continue
            list.push({ cls: String(nodes[i].className).slice(0, 70), left: Math.round(r.left), right: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) })
          }
          list.sort(function (a, b) { return b.right - a.right })
          extra.candidates = list.slice(0, 10)
        }
        var sb = document.querySelector('[class*="_sidebarCol"]')
        if (sb) { var sr = sb.getBoundingClientRect(); extra.sidebar = { left: Math.round(sr.left), right: Math.round(sr.right), w: Math.round(sr.width) } }
        /* VAE 标记居中诊断：侧边栏中心 vs 标记中心 */
        try {
          var lr = document.querySelector('[class*="_logoRow"]')
          var bm = document.getElementsByClassName('vae-brand')[0]
          if (lr) { var lrr = lr.getBoundingClientRect(); extra.logoRow = { left: Math.round(lrr.left), right: Math.round(lrr.right), w: Math.round(lrr.width), display: getComputedStyle(lr).display, justify: getComputedStyle(lr).justifyContent, childCount: lr.children.length } }
          if (bm && sb) {
            var bmr = bm.getBoundingClientRect()
            var sb2 = sb.getBoundingClientRect()
            extra.brand = { left: Math.round(bmr.left), right: Math.round(bmr.right), w: Math.round(bmr.width), center: Math.round(bmr.left + bmr.width / 2), sidebarCenter: Math.round(sb2.left + sb2.width / 2), offset: Math.round(bmr.left + bmr.width / 2 - (sb2.left + sb2.width / 2)) }
          }
          /* 所有 logoRow / 品牌元素的分布 —— 用于排查折叠态左下角的干扰 */
          extra.logoRows = []
          var rws = document.querySelectorAll('[class*="_logoRow"]')
          for (var ri = 0; ri < rws.length && ri < 8; ri++) {
            var rr = rws[ri].getBoundingClientRect()
            extra.logoRows.push({
              i: ri, top: Math.round(rr.top), left: Math.round(rr.left), w: Math.round(rr.width), h: Math.round(rr.height),
              brands: rws[ri].querySelectorAll('[class*="_brand"], [class*="_railFish"]').length,
              marks: rws[ri].getElementsByClassName('vae-brand').length,
              cls: String(rws[ri].className).slice(0, 60),
            })
          }
          extra.railFish = []
          var rfs = document.querySelectorAll('[class*="_railFish"]')
          for (var fi = 0; fi < rfs.length && fi < 8; fi++) {
            var fr2 = rfs[fi].getBoundingClientRect()
            extra.railFish.push({ top: Math.round(fr2.top), left: Math.round(fr2.left), w: Math.round(fr2.width), hidden: getComputedStyle(rfs[fi]).display === 'none', cls: String(rfs[fi].className).slice(0, 60) })
          }
          /* 左下角区域逐个枚举 —— 折叠态那几个按钮出问题时，这里能看清它们到底是什么 */
          extra.bottomLeft = []
          try {
            var all = document.body.querySelectorAll('*')
            var vh2 = window.innerHeight
            for (var ai = 0; ai < all.length && ai < 8000; ai++) {
              var ar = all[ai].getBoundingClientRect()
              if (ar.width < 6 || ar.height < 6) continue
              if (ar.width > 200 || ar.height > 200) continue
              if (ar.left > 150) continue
              if (ar.top < vh2 - 320) continue
              var ac = all[ai].className
              ac = typeof ac === 'string' ? ac : ''
              var cs = getComputedStyle(all[ai])
              var par = all[ai].parentElement
              var pcs = par ? getComputedStyle(par) : null
              var pcn = par ? par.className : ''
              pcn = typeof pcn === 'string' ? pcn : ''
              extra.bottomLeft.push({
                tag: all[ai].tagName, cls: ac.slice(0, 64),
                left: Math.round(ar.left), top: Math.round(ar.top), w: Math.round(ar.width), h: Math.round(ar.height),
                pos: cs.position, disp: cs.display, ovf: cs.overflow,
                ml: cs.marginLeft, w2: cs.width, fd: cs.flexDirection,
                parent: pcn.slice(0, 56),
                pW: pcs ? pcs.width : '', pFd: pcs ? pcs.flexDirection : '', pAi: pcs ? pcs.alignItems : '',
                pJust: pcs ? pcs.justifyContent : '', pOvf: pcs ? pcs.overflow : '',
              })
              if (extra.bottomLeft.length >= 40) break
            }
          } catch (e) {}
        } catch (e) {}
        var cf = document.querySelector('[data-chat-flow]')
        if (cf) { var fr = cf.getBoundingClientRect(); extra.chatFlow = { left: Math.round(fr.left), right: Math.round(fr.right), w: Math.round(fr.width) } }
        fetch('/vae-theme-report', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(extra)
        }).catch(function () {})
      } catch (e) {}
    }

    function fill(el, text, stagger, base) {
      el.innerHTML = ''
      var spans = []
      for (var i = 0; i < text.length; i++) {
        var sp = document.createElement('span')
        sp.textContent = text.charAt(i) === ' ' ? '\\u00a0' : text.charAt(i)
        sp.style.transitionDelay = reduce ? '0ms' : (base + i * stagger) + 'ms'
        el.appendChild(sp)
        spans.push(sp)
      }
      return spans
    }

    /* 启动时序：必须等布局**稳定**再定稿，否则首帧位置会在几百毫秒后被改一次，
       表现就是"歌词整体横向跳一下"（实测：首帧量不到正文列 → 兜底 right≈38，
       稳定后量到真实值 → right≈105，整列左跳约 67px）。
       判定"稳定" = 连续两次轮询量到同一个正文列右缘。 */
    var stableHits = 0
    var lastCR = -1
    function bootLyrics(tries) {
      var info = computeContentRight()
      var cr = Math.round(info.right)
      /* 只有"真实量到的"值才算数 —— 兜底公式永远返回正数，
         若把它当稳定值，就会锁死在错误位置上。 */
      var isReal = cr > 0 && info.source !== 'formula'
      if (isReal && cr === lastCR) stableHits++
      else stableHits = 0
      lastCR = cr
      if (stableHits < 1 && (tries || 0) < 60) {
        window.setTimeout(function () { bootLyrics((tries || 0) + 1) }, 120)
        return
      }
      place()
      show()
      /* 位置此后不再补算 —— 任何"显示后再改位置"都会肉眼可见地跳一下。
         窗口尺寸变化仍由 resize 监听负责。 */
      /* 诊断期：无条件每 3 秒上报一份（Host 侧保留最近 12 份）。
         不做"签名变化才报" —— 实测发现折叠侧栏并未改变侧边栏列宽/中列宽，
         签名法会漏掉折叠态。前 300 次（约 15 分钟）后自动停。 */
      window.setTimeout(sendReport, 2600)
      var reportTicks = 0
      var reportTimer = window.setInterval(function () {
        reportTicks++
        sendReport()
        if (reportTicks >= 300) window.clearInterval(reportTimer)
      }, 3000)
    }

    function show() {
      var item = LYRICS[pickIndex()]
      var lyric = item[0]
      var src = '—— 《' + item[1] + '》 许嵩'
      /* 长句自动缩字号：保证竖排整列不超过视口高度的 62% */
      var fs = 27
      var maxH = window.innerHeight * 0.62
      if (lyric.length * fs * 1.14 > maxH) {
        fs = Math.max(15, Math.floor(maxH / (lyric.length * 1.14)))
      }
      main.style.fontSize = fs + 'px'
      var s1 = fill(main, lyric, 95, 0)
      var s2 = fill(sub, src, 55, lyric.length * 95 + 320)
      void box.offsetWidth
      place()   /* 内容换了，高度也变了 → 重算居中偏移 */

      box.classList.add('vae-on')
      var k
      for (k = 0; k < s1.length; k++) s1[k].classList.add('vae-in')
      for (k = 0; k < s2.length; k++) s2[k].classList.add('vae-in')

      window.setTimeout(function () {
        box.classList.remove('vae-on')
        var m
        for (m = 0; m < s1.length; m++) { s1[m].style.transitionDelay = reduce ? '0ms' : (m * 22) + 'ms'; s1[m].classList.remove('vae-in') }
        for (m = 0; m < s2.length; m++) { s2[m].style.transitionDelay = reduce ? '0ms' : (m * 18) + 'ms'; s2[m].classList.remove('vae-in') }
      }, 7600)
      window.setTimeout(show, 9200);
    }
    bootLyrics(0);
  }

  /* ────────── 启动 ────────── */
  var scheduled = false;
  function refresh() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      scheduled = false;
      brandSwap();
      goldNav();
    });
  }

  function boot() {
    if (!document.body) { window.setTimeout(boot, 60); return; }
    injectStyle();
    refresh();
    startRain();
    startLyrics();
    try {
      var mo = new MutationObserver(refresh);
      mo.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
    window.addEventListener('resize', placeGold);
    window.addEventListener('resize', refresh);
    /* 侧边栏折叠/展开是带动画的，宽度连续变化 —— 延迟再校正一次 VAE 居中 */
    window.addEventListener('resize', function () {
      window.setTimeout(function () {
        var el = document.getElementsByClassName('vae-brand')[0];
        if (el) centerBrand(el);
      }, 320);
    });
    window.setTimeout(function () {
      var el = document.getElementsByClassName('vae-brand')[0];
      if (el) centerBrand(el);
    }, 700);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
`

fs.writeFileSync(path.join(OUT, 'vae-theme-runtime.js'), runtime, 'utf8')
const size = fs.statSync(path.join(OUT, 'vae-theme-runtime.js')).size
console.log('vae-theme-runtime.js', (size / 1024).toFixed(1) + 'KB')
console.log('歌词条数:', LYRICS.length)
