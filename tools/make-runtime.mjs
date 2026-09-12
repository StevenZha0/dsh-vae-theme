// 生成页面运行时装 v2：
//  ① 左上角标志 → 唯一的「VAE」书法字（JS 精确替换 + 侧边栏内水平居中）
//  ② 顶部导航栏 → 居中金色艺术字「音乐纯粹，爱V绝对」
//  ③ 金丝边框强制贴边（覆盖插件默认 cover）
//  ④ 全屏雨幕
//  ⑤ 右下角动态歌词条
import fs from 'node:fs'
import path from 'node:path'
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
    /* 折叠态的官方图标 _railMark 不能隐藏 —— 它就在折叠按钮里，藏了就什么都不剩。
       改为「就地换字形」：藏掉里面的鲸鱼 svg，给 span 本身铺上「嵩」字图。
       注意：logoRow 定宽 35px 且 overflow:hidden，往里追加节点会被裁掉，所以不动 DOM。
       悬停时 DSH 会隐藏 railMark、显示 panelIcon，这个行为保留。 */
    '[class*="_railMark"] svg{display:none !important}',
    '[class*="_railMark"]{width:24px !important;height:24px !important;flex:0 0 auto !important;' +
      'background-image:url("' + LOGO_MINI + '") !important;background-repeat:no-repeat !important;' +
      'background-position:center !important;background-size:contain !important;' +
      'filter:drop-shadow(0 1px 5px rgba(5,9,14,.65))}',
    /* VAE 标记：宽度随行宽自适应，窄栏（折叠态）也不会溢出顶到别的图标 */
    '.vae-brand{display:block !important;width:100%;max-width:132px;height:34px;flex:0 0 auto;' +
      'margin:0 auto !important;background-image:url("' + LOGO + '");background-repeat:no-repeat;' +
      'background-position:center;background-size:contain;filter:drop-shadow(0 1px 7px rgba(5,9,14,.6))}',
    '.vae-brand--mini{max-width:30px;height:30px;background-image:url("' + LOGO_MINI + '")}', /* 折叠态改由 _railMark 承载，此类保留兼容 */

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

    /* ④-b 动态水带：z-index:-1 —— 层级在 html 背景之上、应用内容之下。
       放正值会盖住聊天正文，放 0 会被应用容器压住。 */
    '#vae-water{position:fixed;left:0;pointer-events:none;z-index:-1}',
    /* 关键：定制器把背景同时写在 html 与 body 上。
       html 的背景会传播到画布（最底层）；而 **body 自己的背景是以「元素背景」
       身份在正常流里绘制的 —— 它位于负 z-index 之上，会把水带画布整个盖住**。
       清掉 body 的背景即可：html 的背景已覆盖整个视口，视觉完全一致，
       但负 z-index 的画布就能透出来。 */
    'html body{background-image:none !important;background-color:transparent !important}',

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

    /* ⑥ 新会话欢迎页：隐藏鲸鱼 logo 与「预览版」徽标（标题文案由 heroSwap() 改写） */
    '[class*="_fishHitbox"]{display:none !important}',
    '[class*="_fish"]{display:none !important}',
    '[class*="_previewBadge"]{display:none !important}',
    /* 标题字体：思源宋体。
       宋体的撇捺有锋芒（不像黑体那样"干燥"），但没有楷体的书写体势（不"端着"），
       正好落在中间地带；且它是开源字体（SIL OFL），不涉及字体授权问题。
       未安装时依次回退到华文中宋 / 宋体。 */
    '[class*="_headline"] [class*="_titleGroup"]{' +
      'font-family:"Noto Serif SC","Source Han Serif SC","STZhongsong","华文中宋","SimSun",serif !important;' +
      'font-weight:400 !important;font-size:27px !important;letter-spacing:.06em}',

    /* ⑦ 主界面背景兜底：强制等比
       定制器在 includeSidebar=false 时会输出
       background-size: (vw−侧栏宽)px 100% —— 宽度写死、高度 100%，
       属不等比拉伸，且侧栏展开/收起两态比例不同，收放一次就回不到原状。
       这里统一压成 cover。 */
    'html, body{background-size:cover, cover !important;background-position:center !important}',

    /* ⑧ 输入区上方的分隔线与对话内容裁切
       输入框是半透明玻璃，滚上来的对话文字会透过它与输入内容重叠。
       不做模糊（会糊掉背景长卷），改为给滚动容器加 CSS mask：
       正文在分隔线处淡出，背景图自然透出，视觉上等于"越线即隐藏"。 */
    '#vae-chat-divider{position:fixed;height:1px;pointer-events:none;z-index:2147481920;' +
      'background:linear-gradient(90deg,rgba(220,229,234,0) 0%,rgba(220,229,234,.15) 14%,' +
      'rgba(220,229,234,.15) 86%,rgba(220,229,234,0) 100%);opacity:0;transition:opacity 400ms ease}',
    '#vae-chat-divider.vae-on{opacity:1}',

    /* ⑧ 折叠态页脚对齐修复
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
     官方标志的类名随状态变化：
       展开态 = _brand（宽版 wordmark）
       折叠态 = _railMark（轨道上的图标）
     旧版 DSH 还有 _railFish，一并保留兼容。
     再加位置限制：底部侧栏里也可能有品牌图标，不加限制会把标记注进左下角。 */
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
      if (row.querySelectorAll('[class*="_brand"], [class*="_railFish"], [class*="_railMark"]').length === 0) continue;
      var r = null;
      try { r = row.getBoundingClientRect(); } catch (e) {}
      if (!r || r.width <= 0) continue;
      if (r.top > BRAND_TOP_LIMIT) continue;          /* 底部侧栏的行：跳过 */
      if (r.top < bestTop) { bestTop = r.top; best = row; }
    }
    if (!best) return;
    var w = 0;
    try { w = best.getBoundingClientRect().width; } catch (e) {}

    /* 折叠态（窄轨道）：不追加任何节点。
       官方图标 _railMark 由 CSS 就地换成「嵩」字；
       logoRow 定宽且 overflow:hidden，追加节点会被裁掉，什么都看不见。 */
    if (w > 0 && w < 130) return;

    /* 展开态：隐藏官方 wordmark，放入 VAE 标记 */
    var hidden = best.querySelectorAll('[class*="_brand"], [class*="_railFish"], [class*="_railMark"]');
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
    el.className = 'vae-brand';
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

  /* 右侧栏是否展开。展开时顶部的金色艺术字会与右栏内容重叠，需要让位。
     两条独立信号，任一成立即判定为展开：
       ① 右栏列自身可见且有宽度
       ② 中列右缘与窗口右缘之间出现明显空隙（三栏布局：侧栏 | 中列 | 右栏）
     不使用"内部任意 _panel/_body 有尺寸"这类兜底 —— 那种元素常年存在，会误判为一直展开。 */
  function rightbarOpen() {
    try {
      var rb = document.querySelector('[class*="_rightbarCol"]');
      if (rb) {
        var cs = getComputedStyle(rb);
        var r = rb.getBoundingClientRect();
        if (cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 60) return true;
      }
      var col = document.querySelector('[class*="_centerCol"]');
      if (col) {
        var c = col.getBoundingClientRect();
        if (c.width > 0 && window.innerWidth - c.right > 60) return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  function placeGold() {
    var el = document.getElementById('vae-gold-nav');
    if (!el) return;
    /* 右栏展开 → 隐藏；收回 → 恢复。
       恢复时清空 inline display 而非写 'block'，以免压过窄屏的媒体查询。 */
    if (rightbarOpen()) {
      el.style.display = 'none';
      return;
    }
    el.style.display = '';
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

  /* ────────── ④-b 动态水带 ──────────
     把长卷的水面交给 GPU 做逐像素位移：涟漪与月影本就是同一批像素，
     位移它们等于同时扰动两者 —— 这正是「余波荡漾 + 倒影被晕开」。

     为什么是 WebGL 而不是 Canvas 2D：
       Canvas 2D 只能**逐条带平移**，相邻条带的偏移量跳变，必然出现台阶。
       实测芦苇被剪成横向拖影、水面也做不出二维扭曲。
       片元着色器逐像素采样，位移随位置连续变化 —— 平滑弯曲、二维涟漪。 */
  function startWater() {
    if (FX_OFF) return;
    try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
    try { if (window.localStorage.getItem('vae-theme-water') === 'off') return; } catch (e) {}
    if (document.getElementById('vae-water')) return;

    /* 动态素材存在**自己的键**里。不能放 theme-customizer-config-v1 ——
       那个键归定制器所有，它加载时会规范化并写回、只保留自己认识的字段，
       vaeFx 会被丢掉（曾因此导致动效时有时无，且极难察觉）。 */
    var fx = null;
    try {
      var fxRaw = window.localStorage.getItem('vae-theme-fx-v1');
      if (fxRaw) {
        var fxParsed = JSON.parse(fxRaw);
        if (fxParsed && fxParsed.water && fxParsed.water.dataURI) fx = fxParsed.water;
      }
    } catch (e) {}
    /* 兼容旧键 */
    if (!fx) {
      try {
        var cfg0 = JSON.parse(window.localStorage.getItem('theme-customizer-config-v1') || 'null');
        if (cfg0 && cfg0.vaeFx && cfg0.vaeFx.water && cfg0.vaeFx.water.dataURI) fx = cfg0.vaeFx.water;
      } catch (e) {}
    }
    if (!fx) return;

    if (startWaterGL(fx)) return;      /* 首选 GPU 路径 */
    startWater2D(fx);                  /* 无 WebGL 时回退到条带位移 */
  }

  /* ────────── ④-b-1 WebGL 片元着色器路径 ────────── */
  function startWaterGL(fx) {
    var cv = document.createElement('canvas');
    cv.id = 'vae-water';
    cv.setAttribute('aria-hidden', 'true');

    var gl = null;
    try { gl = cv.getContext('webgl', { alpha: true, antialias: false, depth: false, stencil: false }) } catch (e) {}
    if (!gl) { try { gl = cv.getContext('experimental-webgl') } catch (e) {} }
    if (!gl) return false;

    var g = fx.geometry || {};
    var bandW = g.imageW || 3840, bandH = g.bandH || 1100;

    /* ── 着色器 ──
       顶点：一个铺满裁剪空间的四边形，vQ 是 0..1 的画布坐标（y 向上）。
       片元：分三层采样同坐标系的贴图 —— 底图（含远山与水面）做位移，
             芦苇按悬臂梁弯曲，静置前景原样。 */
    var VS = [
      'attribute vec2 aPos;',
      'varying vec2 vQ;',
      'void main(){ vQ = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }',
    ].join('\\n');

    var FS = [
      'precision mediump float;',
      'varying vec2 vQ;',
      'uniform sampler2D uBase;',
      'uniform sampler2D uReeds;',
      'uniform sampler2D uStatic;',
      'uniform sampler2D uMotion;',   /* 每株芦苇的 相位/株高/摆幅 */
      'uniform float uT;',
      'uniform float uWl;',        /* 水线在画布内的归一化高度（vQ.y 体系） */
      'uniform float uAmpNear;',
      'uniform float uAmpFar;',
      'uniform float uSway;',      /* 芦苇摆动像素幅度 */
      'uniform float uBloom;',     /* 倒影晕开强度 */
      'uniform vec2 uU;',          /* 贴图 u 范围 */
      'uniform vec2 uV;',          /* 贴图 v 范围 */
      'uniform vec2 uRes;',        /* 画布尺寸（CSS px），用于把像素换算成 uv */
      'float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
      'float noise(vec2 p){',
      '  vec2 i = floor(p), f = fract(p);',
      '  vec2 u = f * f * (3.0 - 2.0 * f);',
      '  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),',
      '             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);',
      '}',
      'void main(){',
      '  vec2 uv = vec2(mix(uU.x, uU.y, vQ.x), mix(uV.x, uV.y, vQ.y));',
      /* 水面：只在水平面以下，振幅随深度增长 */
      '  float below = step(vQ.y, uWl);',
      '  float d = clamp((uWl - vQ.y) / max(uWl, 1e-4), 0.0, 1.0);',
      '  float amp = mix(uAmpFar, uAmpNear, d) / uRes.x;',
      /* 三个分量：两个正弦（长波 + 短波）+ 两个八度的噪声（二维扭曲，条带法做不到） */
      '  float w = sin(uT * 0.85 + d * 5.0) * 0.55 + sin(uT * 1.60 - d * 10.5) * 0.22;',
      '  w += (noise(vec2(uv.x * 7.0, uv.y * 34.0 - uT * 0.35)) - 0.5) * 1.30;',
      '  w += (noise(vec2(uv.x * 19.0, uv.y * 90.0 + uT * 0.80)) - 0.5) * 0.55;',
      '  float dx = w * amp * below;',
      '  vec4 base = texture2D(uBase, vec2(uv.x + dx, uv.y));',
      /* 倒影晕开：同一水面换个位移再采一次，亮部被抬得更多 —— 用真实像素，不画形状 */
      '  float bx = 0.0035 * sin(uT * 0.50);',
      '  float by = 0.0016 * sin(uT * 0.62);',
      '  vec4 b2 = texture2D(uBase, vec2(uv.x + dx * 1.9 + bx, uv.y + by));',
      '  base.rgb += b2.rgb * uBloom * below;',
      /* 芦苇：每株绕**自己的根**、按**自己的高度**弯曲。
         之前只用"离图底的绝对高度"uv.y 算弯曲，而画面里芦苇高矮差很大
         （200–920px）—— 矮株 bend 只有 0.05 几乎冻住、高株到 0.73 摆得厉害，
         同一丛里有动有不动，看起来就是"扭曲"，不像整片随风。
         现在从运动参数图取每株的相位与株高：
           R = 相位，G = 株高（相对整图），B = 摆幅系数，A = 有参数覆盖 */
      '  vec4 mm = texture2D(uMotion, uv);',
      '  float stalkH = max(mm.g, 0.06);',
      '  float bend = pow(clamp(uv.y / stalkH, 0.0, 1.0), 1.75);',
      '  float stalk = mm.r * 6.2831;',
      '  float ampScale = 0.35 + 0.65 * mm.b;',
      '  float lag = clamp(uv.y / stalkH, 0.0, 1.0) * 0.30;',
      '  float gust = 0.70 + 0.30 * sin(uT * 0.21 + uv.x * 2.3);',
      '  float swing = sin(uT * 0.30 - lag + stalk) * 0.66',
      '              + sin(uT * 0.53 - lag * 1.6 + stalk * 1.7 + 1.3) * 0.26;',
      '  float dxr = swing * gust * ampScale * uSway * bend / uRes.x;',
      '  vec4 r = texture2D(uReeds, vec2(uv.x + dxr, uv.y));',
      '  base.rgb = mix(base.rgb, r.rgb, r.a);',
      /* 静置前景（礁石 / 岸影 / 题字）：原样叠上 */
      '  vec4 s = texture2D(uStatic, uv);',
      '  base.rgb = mix(base.rgb, s.rgb, s.a);',
      '  gl_FragColor = vec4(base.rgb, 1.0);',
      '}',
    ].join('\\n');

    function compile(type, src) {
      var sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) return null;
      return sh;
    }
    var vs = compile(gl.VERTEX_SHADER, VS);
    var fs = compile(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) return false;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return false;
    gl.useProgram(prog);

    /* 全屏四边形 */
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var aPos = gl.getAttribLocation(prog, 'aPos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    var U = {};
    ['uBase', 'uReeds', 'uStatic', 'uMotion', 'uT', 'uWl', 'uAmpNear', 'uAmpFar', 'uSway', 'uBloom', 'uU', 'uV', 'uRes']
      .forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });

    /* 贴图：FLIP_Y 打开后 v=0 对应图像底边，与画布 vQ.y=0 在下方一致 */
    function upload(img) {
      var t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return t;
    }
    function bindTex(unit, loc, img) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, upload(img));
      gl.uniform1i(loc, unit);
    }

    var iWater = new Image(), iReeds = new Image(), iStatic = new Image(), iMotion = new Image();
    var okBase = false, okReeds = false, okStatic = false, okMotion = false;
    iWater.onload = function () { bindTex(0, U.uBase, iWater); okBase = true; };
    iReeds.onload = function () { bindTex(1, U.uReeds, iReeds); okReeds = true; };
    iStatic.onload = function () { bindTex(2, U.uStatic, iStatic); okStatic = true; };
    iMotion.onload = function () { bindTex(3, U.uMotion, iMotion); okMotion = true; };
    iWater.src = fx.dataURI;
    if (fx.reedsURI) iReeds.src = fx.reedsURI;
    if (fx.staticURI) iStatic.src = fx.staticURI;
    if (fx.motionURI) iMotion.src = fx.motionURI;

    gl.uniform1f(U.uAmpNear, g.ampNear || 16);
    gl.uniform1f(U.uAmpFar, g.ampFar || 4);
    /* 芦苇梢部的横向摆幅（CSS px）。修正 bend 方向后摆动集中在梢部，
       同样的数值看起来比之前明显得多；再配合调慢的频率，14 仍然偏大，收到 9。 */
    gl.uniform1f(U.uSway, 9.0);
    /* 倒影晕开的相加强度。不宜大 —— 底光 + bloom 双重相加会把倒影推成过曝的白墙。 */
    gl.uniform1f(U.uBloom, 0.045);
    gl.uniform1i(U.uReeds, 1);
    gl.uniform1i(U.uStatic, 2);
    gl.uniform1i(U.uMotion, 3);
    gl.uniform1i(U.uBase, 0);
    /* 未就绪的层用 1x1 图占位，避免采样到未定义纹理。
       注意运动参数图的占位必须是**白色**（a=255）：着色器用它判断
       "这里有没有芦苇"，用全透明占位会让整片芦苇消失。 */
    var emptyTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, emptyTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 0]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    var whiteTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, whiteTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, emptyTex);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, emptyTex);
    gl.activeTexture(gl.TEXTURE3);
    gl.bindTexture(gl.TEXTURE_2D, whiteTex);

    document.body.appendChild(cv);

    var DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    var V = { on: false, top: 0, w: 0, h: 0 };
    var uvBot = 0, uvTop = 1;      /* 画布覆盖的贴图 v 范围，供自检核对 */

    function layout() {
      var vw = window.innerWidth, vh = window.innerHeight;
      var s = Math.max(vw / g.imageW, vh / g.imageH);   /* 复刻 cover */
      var DW = g.imageW * s, DH = g.imageH * s;
      var DX = (vw - DW) / 2, DY = (vh - DH) / 2;
      var y0 = Math.max(0, DY + g.bandTop * s);
      var y1 = Math.min(vh, DY + g.imageH * s);
      if (!(y1 - y0 > 8)) { V.on = false; cv.style.display = 'none'; return; }
      V.on = true; V.top = y0; V.w = vw; V.h = y1 - y0;

      cv.style.display = 'block';
      cv.style.top = Math.round(y0) + 'px';
      cv.style.width = vw + 'px';
      cv.style.height = V.h + 'px';
      cv.width = Math.max(1, Math.floor(vw * DPR));
      cv.height = Math.max(1, Math.floor(V.h * DPR));
      gl.viewport(0, 0, cv.width, cv.height);

      /* 画布覆盖的是水带图的一个子矩形，换算成贴图 uv 范围。
         FLIP_Y 打开后 v=0 对应图像底边，vQ.y=0 在画布下方，两者同向。 */
      var srcX = (0 - DX) / s, srcW = vw / s;
      var srcY = (y0 - DY) / s - g.bandTop, srcH = V.h / s;
      srcY = Math.max(0, Math.min(srcY, bandH));
      srcH = Math.max(1, Math.min(srcH, bandH - srcY));
      var u0 = srcX / bandW, u1 = (srcX + srcW) / bandW;
      var vBot = 1 - (srcY + srcH) / bandH, vTop = 1 - srcY / bandH;
      uvBot = vBot; uvTop = vTop;
      gl.uniform2f(U.uU, u0, u1);
      gl.uniform2f(U.uV, vBot, vTop);
      gl.uniform2f(U.uRes, vw, V.h);
      /* 水线：水带图内 y = waterLine 的那一行，换算到 vQ.y */
      var wlV = 1 - (g.waterLine || 0) / bandH;
      var wlQ = (wlV - vBot) / Math.max(vTop - vBot, 1e-4);
      gl.uniform1f(U.uWl, Math.max(0, Math.min(1, wlQ)));
    }

    /* 抓帧必须**在绘制之后、同一帧内**完成：
       WebGL 的绘图缓冲在合成后即被清空，事后再 drawImage 只会得到一张空图
       （此前诊断图一直是全黑，就是这个原因，害我误判了好几轮）。 */
    var wantCap = false, capThumb = null, capReed = null;

    /* 连拍：隔 380ms 抓一帧，共 4 帧，纵向拼成一条。
       摆动是否自然，单帧和差分都看不出来，必须看**运动过程**本身。 */
    var wantStrip = false, stripFrames = [], stripOut = null, stripArmed = false;
    function grab(w) {
      var th = Math.max(1, Math.round(V.h * w / V.w));
      var t = document.createElement('canvas');
      t.width = w; t.height = th;
      var c = t.getContext('2d');
      c.fillStyle = '#000';
      c.fillRect(0, 0, w, th);
      c.drawImage(cv, 0, 0, w, th);
      return t;
    }
    function stepStrip() {
      if (!wantStrip) return;
      wantStrip = false;
      stripFrames.push(grab(340));
      if (stripFrames.length < 4) {
        window.setTimeout(function () { wantStrip = true; }, 380);
        return;
      }
      try {
        var w = stripFrames[0].width, h = stripFrames[0].height;
        var t = document.createElement('canvas');
        t.width = w; t.height = h * 4 + 6;
        var c = t.getContext('2d');
        c.fillStyle = '#555';
        c.fillRect(0, 0, t.width, t.height);
        for (var i = 0; i < 4; i++) c.drawImage(stripFrames[i], 0, i * (h + 2));
        stripOut = t.toDataURL('image/jpeg', 0.74);
      } catch (e) { stripOut = 'err:' + String((e && e.message) || e); }
      stripFrames = [];
      stripArmed = false;
    }
    function captureFrame() {
      try {
        var tw = 260, th = Math.max(1, Math.round(V.h * tw / V.w));
        var t2 = document.createElement('canvas');
        t2.width = tw; t2.height = th;
        var c2 = t2.getContext('2d');
        c2.fillStyle = '#0a141c';
        c2.fillRect(0, 0, tw, th);
        c2.drawImage(cv, 0, 0, tw, th);
        capThumb = t2.toDataURL('image/jpeg', 0.62);
        var sw2 = Math.max(1, Math.round(cv.width * 0.34)), sh2 = cv.height;
        var dw3 = 560, dh3 = Math.max(1, Math.round(sh2 * dw3 / sw2));
        var t3 = document.createElement('canvas');
        t3.width = dw3; t3.height = dh3;
        var c3 = t3.getContext('2d');
        c3.fillStyle = '#0a141c';
        c3.fillRect(0, 0, dw3, dh3);
        c3.drawImage(cv, 0, 0, sw2, sh2, 0, 0, dw3, dh3);
        capReed = t3.toDataURL('image/jpeg', 0.72);
      } catch (e) { capThumb = 'err:' + String((e && e.message) || e); }
    }

    var last = 0, drawErr = null;
    function frame(ts) {
      window.requestAnimationFrame(frame);          /* 先排下一帧，draw 抛错也不会断 */
      if (!V.on || ts - last < 33 || document.hidden) return;
      last = ts;
      try {
        if (!okBase) return;
        gl.uniform1f(U.uT, ts * 0.001);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        if (wantCap) { wantCap = false; captureFrame(); }
        stepStrip();
      } catch (err) {
        drawErr = String((err && err.message) || err);
      }
    }

    window.__VAE_WATER_DIAG__ = function () {
      /* 请求下一帧抓图与双帧差分；本次返回上一轮的结果（差一拍，无妨） */
      wantCap = true;
      if (!stripArmed) { stripArmed = true; wantStrip = true; }
      return {
        mode: 'webgl', on: V.on, top: Math.round(V.top), h: Math.round(V.h), w: Math.round(V.w),
        buf: cv.width + 'x' + cv.height,
        img: { water: okBase, reeds: okReeds, static: okStatic },
        err: drawErr, thumb: capThumb, reedThumb: capReed, motionThumb: stripOut,
        /* 芦苇弯曲的高度基准：核对"根部是否真的不动" */
        uvBot: uvBot, uvTop: uvTop,
      };
    };

    window.addEventListener('resize', layout);
    layout();
    window.requestAnimationFrame(frame);
    return true;
  }

  /* ────────── ④-b-2 Canvas 2D 回退路径（无 WebGL 时）──────────
     逐条带平移。条带之间偏移量跳变会有台阶，效果不如 GPU 路径，
     但胜在兼容性。 */
  function startWater2D(fx) {
    var cv = document.createElement('canvas');
    cv.id = 'vae-water';
    cv.setAttribute('aria-hidden', 'true');
    document.body.appendChild(cv);
    var ctx = cv.getContext('2d');
    if (!ctx) { cv.parentNode.removeChild(cv); return; }

    var g = fx.geometry || { imageW: 3840, imageH: 2400, bandTop: 1656, bandH: 744, ampNear: 7, ampFar: 2.2 };
    var DPR = Math.min(window.devicePixelRatio || 1, 1.5);

    var imgWater = new Image(), imgReeds = new Image(), imgStatic = new Image();
    var okWater = false, okReeds = false, okStatic = false;
    imgWater.onload = function () { okWater = true; };
    imgReeds.onload = function () { okReeds = true; };
    imgStatic.onload = function () { okStatic = true; };
    imgWater.src = fx.dataURI;
    if (fx.reedsURI) imgReeds.src = fx.reedsURI;
    if (fx.staticURI) imgStatic.src = fx.staticURI;

    /* 视口内的水带几何，全部用 CSS px（setTransform 已按 DPR 缩放） */
    var V = { on: false, top: 0, w: 0, h: 0, s: 1, srcX: 0, srcY: 0, srcW: 0, srcH: 0 };

    function layout() {
      var vw = window.innerWidth, vh = window.innerHeight;
      /* 复刻 cover：s = max(vw/IW, vh/IH)，居中 */
      var s = Math.max(vw / g.imageW, vh / g.imageH);
      var DW = g.imageW * s, DH = g.imageH * s;
      var DX = (vw - DW) / 2, DY = (vh - DH) / 2;
      var y0 = Math.max(0, DY + g.bandTop * s);
      var y1 = Math.min(vh, DY + g.imageH * s);
      if (!(y1 - y0 > 8)) { V.on = false; cv.style.display = 'none'; return; }
      V.on = true;
      V.top = y0; V.h = y1 - y0; V.w = vw; V.s = s;
      V.srcX = (0 - DX) / s; V.srcW = vw / s;
      /* 水带图是「只有 bandH 高」的切片，不是整幅长卷 ——
         源坐标必须减去 bandTop，否则矩形整体落在图外，什么都画不出来。 */
      V.srcY = (y0 - DY) / s - g.bandTop; V.srcH = V.h / s;
      cv.style.display = 'block';
      cv.style.top = Math.round(y0) + 'px';
      cv.style.width = vw + 'px';
      cv.style.height = V.h + 'px';
      cv.width = Math.max(1, Math.floor(vw * DPR));
      cv.height = Math.max(1, Math.floor(V.h * DPR));
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    var SW = 8;    /* 水面条带高度 */
    var RW = 12;   /* 芦苇条带高度 */

    /* 取一条带在「水带图」内的纵向范围（并夹到图内） */
    function slice(cssY, cssH) {
      var sy = V.srcY + cssY / V.s;
      if (sy < 0) sy = 0;
      var sh = Math.min(cssH / V.s, g.bandH - sy);
      return sh > 0.05 ? { sy: sy, sh: sh } : null;
    }

    var frac = function (v) { return v - Math.floor(v); };

    /* 倒影晕开 —— 全程使用画面里**真实的像素**，不画任何形状。
       月亮在水面的倒影本身就是水带图里那几道竖纹；把水面层再叠一次，
       纵向错开一两像素、横向换一个相位、用 lighter 相加：
       亮部（月影竖纹）被抬得比暗部更多，读起来就是倒影在波光里「晕开」。

       曾先后试过手绘"涟漪亮线"和"月光柱"，那两样都是凭空造出来的东西，
       既不是画面里有的、也不符合倒影的物理，已全部删除。 */
    function reflectionBloom(t, W, H, wl) {
      if (!okWater) return;
      var sh = H - wl;
      if (sh <= 4) return;
      var amp = g.ampFar || 3;
      var off = Math.sin(t * 0.50) * amp * 2.2;
      var dy = Math.sin(t * 0.62) * 3.2;
      var s1 = slice(wl, sh);
      if (!s1) return;
      var prev = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.085 + 0.045 * Math.sin(t * 0.8);
      ctx.drawImage(imgWater, V.srcX, s1.sy, V.srcW, s1.sh, -off, wl + dy, W, sh);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = prev;
    }

    function draw(t) {
      var W = V.w, H = V.h;
      ctx.clearRect(0, 0, W, H);

      /* 水线在画布内的 y（CSS px）。waterLine 是水带图内的图像像素，
         换算到屏幕要**乘** V.s（屏幕尺寸 = 图像尺寸 × s）。
         位移只作用在这条线以下 —— 山体、雾带、月亮绝不能跟着晃。 */
      var wl = (g.waterLine || 0) * V.s;
      if (!(wl >= 0)) wl = 0;
      if (wl > H) wl = H;

      /* ① 底图：整段不透明重绘（盖住静态底图，避免芦苇重影）。
            水线以上原样绘制，水线以下才做逐条带横向位移。 */
      if (okWater) {
        var aN = g.ampNear || 12, aF = g.ampFar || 3;
        for (var y = 0; y < H; y += SW) {
          var off = 0;
          if (y + SW > wl) {
            var p = H > wl ? (y - wl) / (H - wl) : 0;
            if (p < 0) p = 0;
            var amp = aF + (aN - aF) * p;
            /* 低频大波让竖长的月影被拉散 —— 读起来就是"倒影被水波晕开" */
            off = Math.sin(t * 0.85 + p * 5.0) * amp
                + Math.sin(t * 1.60 - p * 10.5) * amp * 0.40
                + Math.sin(t * 0.42 + p * 2.1) * amp * 0.55;
          }
          var s1 = slice(y, SW);
          if (!s1) break;
          ctx.drawImage(imgWater, V.srcX, s1.sy, V.srcW, s1.sh, -off, y, W, SW + 0.6);
        }
      }

      /* ①-b 倒影晕开：用画面真实像素叠加，不画任何形状 */
      reflectionBloom(t, W, H, wl);

      /* ② 芦苇：根部（画面下方）不动，越往上摆幅越大 */
      if (okReeds) {
        /* 摆动只作用在芦苇身上：根部（画面下方）不动，越往上摆幅越大。
           改用平方增长（悬臂梁的挠曲形状），读起来是"弯"而不是"剪切"。 */
        for (var ry = 0; ry < H; ry += RW) {
          var rp = (ry + RW / 2) / H;
          var ramp = Math.max(0, 1 - rp);
          ramp = ramp * ramp;
          var roff = Math.sin(t * 0.62 + rp * 2.4) * 12.0 * ramp
                   + Math.sin(t * 1.05 + rp * 4.8) * 4.0 * ramp;
          var s2 = slice(ry, RW);
          if (!s2) break;
          ctx.drawImage(imgReeds, V.srcX, s2.sy, V.srcW, s2.sh, -roff, ry, W, RW + 0.6);
        }
      }

      /* ③ 静置前景（礁石 / 岸影 / 题字）：原样重绘，不参与任何位移 */
      if (okStatic) {
        var s3 = slice(0, H);
        if (s3) ctx.drawImage(imgStatic, V.srcX, s3.sy, V.srcW, s3.sh, 0, 0, W, H);
      }
    }

    var last = 0;
    var drawErr = null;
    function frame(ts) {
      /* 先排下一帧：draw() 里一旦抛异常，循环也不会断 */
      window.requestAnimationFrame(frame);
      if (V.on && ts - last >= 33 && !document.hidden) {   /* ≈30fps；后台标签页不浪费电 */
        last = ts;
        try {
          draw(ts * 0.001);
        } catch (err) {
          drawErr = String((err && err.message) || err);
        }
      }
    }
    /* 供自检接口读取。thumb 是画布缩略图 —— 有了它，
       Host 端能直接"看到"画布到底渲染成了什么样，不必再靠猜。 */
    window.__VAE_WATER_DIAG__ = function () {
      var thumb = null;
      try {
        var tw = 260, th = Math.max(1, Math.round(V.h * tw / V.w));
        var t2 = document.createElement('canvas');
        t2.width = tw; t2.height = th;
        var c2 = t2.getContext('2d');
        /* 垫一层深色底，否则透明区在 JPEG 里全黑、看不出层次 */
        c2.fillStyle = '#0a141c';
        c2.fillRect(0, 0, tw, th);
        c2.drawImage(cv, 0, 0, tw, th);
        thumb = t2.toDataURL('image/jpeg', 0.62);
      } catch (e) { thumb = 'err:' + String((e && e.message) || e); }
      return {
        mode: 'canvas2d',
        on: V.on, top: Math.round(V.top), h: Math.round(V.h), w: Math.round(V.w),
        scale: +V.s.toFixed(4), srcY: +V.srcY.toFixed(1), srcH: +V.srcH.toFixed(1),
        bandH: g.bandH, imageH: g.imageH,
        buf: cv.width + 'x' + cv.height,
        img: { water: okWater, reeds: okReeds, static: okStatic },
        err: drawErr,
        thumb: thumb,
      };
    };
    window.addEventListener('resize', layout);
    layout();
    window.requestAnimationFrame(frame);
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
              brands: rws[ri].querySelectorAll('[class*="_brand"], [class*="_railFish"], [class*="_railMark"]').length,
              marks: rws[ri].getElementsByClassName('vae-brand').length,
              cls: String(rws[ri].className).slice(0, 60),
            })
          }
          extra.railFish = []
          var rfs = document.querySelectorAll('[class*="_railFish"], [class*="_railMark"]')
          for (var fi = 0; fi < rfs.length && fi < 8; fi++) {
            var fr2 = rfs[fi].getBoundingClientRect()
            extra.railFish.push({ top: Math.round(fr2.top), left: Math.round(fr2.left), w: Math.round(fr2.width), hidden: getComputedStyle(rfs[fi]).display === 'none', cls: String(rfs[fi].className).slice(0, 60) })
          }
          /* 右侧栏与金色导航字的联动诊断 */
          try {
            var rbEl = document.querySelector('[class*="_rightbarCol"]')
            var ccEl = document.querySelector('[class*="_centerCol"]')
            var gnEl = document.getElementById('vae-gold-nav')
            extra.rightbar = {
              exists: !!rbEl,
              rbW: rbEl ? Math.round(rbEl.getBoundingClientRect().width) : null,
              rbDisplay: rbEl ? getComputedStyle(rbEl).display : null,
              centerColRight: ccEl ? Math.round(ccEl.getBoundingClientRect().right) : null,
              innerWidth: window.innerWidth,
              gapRight: ccEl ? Math.round(window.innerWidth - ccEl.getBoundingClientRect().right) : null,
              open: rightbarOpen(),
              navDisplay: gnEl ? (gnEl.style.display || '(css)') : 'no-nav',
            }
          } catch (e) {}
          /* 种子写入诊断：写失败会被 try/catch 静默吞掉，
             结果是"服务端资源是新的、浏览器里还是旧的"，且毫无提示。 */
          try {
            var lsGet = function (k) { try { return window.localStorage.getItem(k) } catch (e) { return null } }
            var cfgRaw = lsGet('theme-customizer-config-v1')
            var fxRaw2 = lsGet('vae-theme-fx-v1')
            var fxOk = false
            try { fxOk = !!(JSON.parse(fxRaw2 || 'null') || {}).water } catch (e) {}
            extra.seed = {
              ok: window.__VAE_SEED_OK__ === true,
              err: window.__VAE_SEED_ERR__ || null,
              payloadBytes: window.__VAE_SEED_BYTES__ || 0,
              mark: lsGet('vae-theme-seed'),
              cfgChars: cfgRaw ? cfgRaw.length : 0,
              /* 自己的键 —— 这才是动态素材的实际来源 */
              fxChars: fxRaw2 ? fxRaw2.length : 0,
              fxHasWater: fxOk,
            }
          } catch (e) {}
          /* 动态水带诊断：配置是否到位、画布在不在、几何算得对不对、有没有抛错 */
          try {
            var wcv2 = document.getElementById('vae-water')
            var wr2 = wcv2 ? wcv2.getBoundingClientRect() : null
            var cfgW = null
            try {
              var ccx = JSON.parse(window.localStorage.getItem('theme-customizer-config-v1') || 'null')
              cfgW = !!(ccx && ccx.vaeFx && ccx.vaeFx.water)
            } catch (e) {}
            extra.water = {
              cfgHasWater: cfgW,
              hasCanvas: !!wcv2,
              zIndex: wcv2 ? getComputedStyle(wcv2).zIndex : null,
              display: wcv2 ? getComputedStyle(wcv2).display : null,
              rect: wr2 ? [Math.round(wr2.left), Math.round(wr2.top), Math.round(wr2.width), Math.round(wr2.height)] : null,
              diag: (typeof window.__VAE_WATER_DIAG__ === 'function') ? window.__VAE_WATER_DIAG__() : 'no-diag',
            }
          } catch (e) {}
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

  /* ────────── ⑥ 新会话欢迎页：去掉鲸鱼 logo 与「预览版」徽标，改写标题 ──────────
     标题文案来自 DSH 的 i18n 键 hero.headline（"探索未至之境"），
     这里直接替换承载它的文本节点。鲸鱼与徽标由 CSS 隐藏。 */
  var HERO_TEXT = '快写一段提示词雅俗共赏~';
  function heroSwap() {
    if (FX_OFF) return;
    var host = document.querySelector('[class*="_titleGroup"]')
      || document.querySelector('[class*="_headline"]');
    if (!host) return;
    /* 找出承载标题的节点：跳过鲸鱼与预览版徽标 */
    var target = null;
    for (var i = 0; i < host.childNodes.length; i++) {
      var n = host.childNodes[i];
      if (n.nodeType === 3) {
        if (n.nodeValue && n.nodeValue.replace(/\s/g, '')) { target = n; break; }
      } else if (n.nodeType === 1) {
        var c = String(n.className || '');
        if (c.indexOf('previewBadge') !== -1 || c.indexOf('fish') !== -1) continue;
        if ((n.textContent || '').replace(/\s/g, '')) { target = n; break; }
      }
    }
    if (!target) return;
    if (target.nodeType === 3) {
      if (target.nodeValue !== HERO_TEXT) target.nodeValue = HERO_TEXT;
    } else if (target.textContent !== HERO_TEXT) {
      target.textContent = HERO_TEXT;
    }
  }

  /* ────────── ⑦ 输入区上方的分隔线 + 对话内容裁切 ──────────
     半透明输入框挡不住滚上来的对话文字，会与输入内容重叠。
     做法：给**对话内容本身**（[data-chat-flow]）加 mask，让它在分隔线处淡出。
     注意 mask 只能加在"不含输入框"的元素上 —— 若加在其滚动祖先上，
     输入框会被一起隐藏（踩过这个坑）。
     内容会滚动，所以 mask 的位置要随滚动重算，才能让裁切线固定在屏幕上。 */
  var dividerState = '';
  var maskBound = false;

  function findFlowScroller(flow) {
    var el = flow.parentElement;
    while (el && el !== document.body) {
      try {
        var s = getComputedStyle(el);
        if (/(auto|scroll|overlay)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 8) return el;
      } catch (e) {}
      el = el.parentElement;
    }
    return null;
  }

  function applyFlowMask(flow, lineY) {
    if (!flow) return;
    /* 线在 flow 自身坐标系中的位置 = 线的视口 y − flow 的视口顶 */
    var fr = flow.getBoundingClientRect();
    var maskY = lineY - fr.top;
    var key = Math.round(maskY) + '|' + Math.round(fr.height);
    if (key === dividerState) return;
    dividerState = key;
    if (!(maskY > 0) || maskY > fr.height) {
      flow.style.maskImage = '';
      flow.style.webkitMaskImage = '';
      return;
    }
    var fadeFrom = Math.max(0, maskY - 14);
    var grad = 'linear-gradient(to bottom,#000 ' + Math.round(fadeFrom) + 'px,' +
      'rgba(0,0,0,0) ' + Math.round(maskY) + 'px)';
    flow.style.maskImage = grad;
    flow.style.webkitMaskImage = grad;
  }

  function chatDivider() {
    if (FX_OFF) return;
    var line = document.getElementById('vae-chat-divider');
    var stack = document.querySelector('[class*="_composerStack"]')
      || document.querySelector('[data-composer-card]')
      || document.querySelector('[data-composer-seat]');
    var flow = document.querySelector('[data-chat-flow]');

    /* 新会话欢迎页（没有对话内容）不画线、不加 mask */
    if (!stack || !flow || !(flow.getBoundingClientRect().height > 0)) {
      if (line) line.classList.remove('vae-on');
      if (flow) { flow.style.maskImage = ''; flow.style.webkitMaskImage = ''; }
      dividerState = '';
      return;
    }
    var sr = stack.getBoundingClientRect();
    if (!(sr.width > 120) || !(sr.top > 40)) {
      if (line) line.classList.remove('vae-on');
      return;
    }

    /* 分隔线：贴在输入区整体上沿上方 14px，两端渐隐 */
    var lineY = Math.round(sr.top - 14);
    if (!line) {
      line = document.createElement('div');
      line.id = 'vae-chat-divider';
      line.setAttribute('aria-hidden', 'true');
      document.body.appendChild(line);
    }
    line.style.left = Math.round(sr.left) + 'px';
    line.style.width = Math.round(sr.width) + 'px';
    line.style.top = lineY + 'px';
    line.classList.add('vae-on');

    /* 内容滚动时裁切线要固定在屏幕上，故随滚动重算（capture 可捕获任意内层滚动） */
    if (!maskBound) {
      maskBound = true;
      var onScroll = function () {
        if (scheduled) return;
        scheduled = true;
        window.requestAnimationFrame(function () {
          scheduled = false;
          var f = document.querySelector('[data-chat-flow]');
          var l = document.getElementById('vae-chat-divider');
          if (f && l) applyFlowMask(f, parseFloat(l.style.top) || 0);
        });
      };
      window.addEventListener('scroll', onScroll, true);
      window.addEventListener('resize', onScroll);
    }
    applyFlowMask(flow, lineY);
  }

  /* ────────── 启动 ────────── */
  var scheduled = false;
  function refresh() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(function () {
      scheduled = false;
      brandSwap();
      heroSwap();
      goldNav();
      chatDivider();
    });
  }

  /* 启动信标：把「运行时装是否执行、执行到哪一步失败」回传给 Host。
     没有它就只能猜 —— 曾出现 startWater() 抛错导致后面的 startLyrics()
     连同周期上报一起没执行，表现为"页面上什么都没发生"。 */
  function beacon(stage) {
    try {
      fetch('/vae-theme-report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ beacon: stage, t: Date.now() }),
      }).catch(function () {});
    } catch (e) {}
  }

  function boot() {
    if (!document.body) { window.setTimeout(boot, 60); return; }
    beacon('runtime-start');
    /* 各步隔离：任何一项出错都不再拖垮其余功能与后续上报 */
    var steps = [
      ['style', injectStyle],
      ['refresh', refresh],
      ['rain', startRain],
      ['water', startWater],
      ['lyrics', startLyrics],
    ];
    for (var si = 0; si < steps.length; si++) {
      try {
        steps[si][1]();
        beacon('ok:' + steps[si][0]);
      } catch (e) {
        beacon('fail:' + steps[si][0] + ' | ' + String((e && e.message) || e));
      }
    }
    try {
      var mo = new MutationObserver(refresh);
      mo.observe(document.body, { childList: true, subtree: true });
    } catch (e) {}
    window.addEventListener('resize', placeGold);
    window.addEventListener('resize', refresh);
    /* 兜底轮询：右栏开合若只改 class/style（不增删节点），MutationObserver 收不到，
       这里以 300ms 为周期校准一次，保证状态最终一致。开销仅两次 getBoundingClientRect。 */
    window.setInterval(function () {
      try { placeGold(); } catch (e) {}
    }, 300);
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
