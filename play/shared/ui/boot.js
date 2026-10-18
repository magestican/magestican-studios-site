




























(function () {
  'use strict';
  var d = document;
  var html = d.documentElement;
  var me = d.currentScript;
  var data = (me && me.dataset) || {};
  var LANGS = ['en', 'es', 'pt', 'tl', 'ja', 'ko', 'id', 'vi'];
  var LOADING = {
    en: 'Loading...', es: 'Cargando...', pt: 'Carregando...', tl: 'Naglo-load...',
    ja: '\u8aad\u307f\u8fbc\u307f\u4e2d...', ko: '\ubd88\ub7ec\uc624\ub294 \uc911...', id: 'Memuat...', vi: '\u0110ang t\u1ea3i...',
  };
  var NAMES = {
    truco: { en: 'Trucowise', es: 'Trucowise: Truco Argentino', pt: 'Trucowise: Truco', tl: 'Trucowise: Truco', ja: 'Trucowise \u30c8\u30a5\u30eb\u30fc\u30b3', ko: 'Trucowise \ud2b8\ub8e8\ucf54', id: 'Trucowise: Truco', vi: 'Trucowise: Truco' },
    buraco: { en: 'Buracowise', es: 'Buracowise: Burako', pt: 'Buracowise: Buraco', tl: 'Buracowise: Buraco', ja: 'Buracowise \u30d6\u30e9\u30fc\u30b3', ko: 'Buracowise \ubd80\ub77c\ucf54', id: 'Buracowise: Buraco', vi: 'Buracowise: Buraco' },
    gomoku: { en: 'Gomowise', es: 'Gomowise: Gomoku', pt: 'Gomowise: Gomoku', tl: 'Gomowise: Gomoku', ja: 'Gomowise \u4e94\u76ee\u4e26\u3079', ko: 'Gomowise \uc624\ubaa9', id: 'Gomowise: Gomoku', vi: 'Gomowise: C\u1edd Caro' },
    minesweeper: { en: 'Sweepwise', es: 'Sweepwise: Buscaminas', pt: 'Sweepwise: Campo Minado', tl: 'Sweepwise: Minesweeper', ja: 'Sweepwise \u30de\u30a4\u30f3\u30b9\u30a4\u30fc\u30d1\u30fc', ko: 'Sweepwise \uc9c0\ub8b0\ucc3e\uae30', id: 'Sweepwise: Minesweeper', vi: 'Sweepwise: D\u00f2 M\u00ecn' },
    'word-chain': { en: 'Relaywise', es: 'Relaywise: Palabras Encadenadas', pt: 'Relaywise: Palavras Encadeadas', tl: 'Relaywise: Word Chain', ja: 'Relaywise \u3057\u308a\u3068\u308a', ko: 'Relaywise \ub05d\ub9d0\uc787\uae30', id: 'Relaywise: Sambung Kata', vi: 'Relaywise: N\u1ed1i T\u1eeb' },
  };

  function norm(s) {
    var c = String(s || '').toLowerCase().split('-')[0];
    if (c === 'fil') c = 'tl';
    if (c === 'in') c = 'id';
    return LANGS.indexOf(c) >= 0 ? c : null;
  }
  function pageLang() {
    try { var q = norm(new URLSearchParams(location.search).get('lang')); if (q) return q; } catch (e) {  }
    try { var s = norm(localStorage.getItem('ms-lang')); if (s) return s; } catch (e) {  }
    var list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language];
    for (var i = 0; i < list.length; i++) {
      if (String(list[i]).toLowerCase().indexOf('en') === 0) return 'en';
      if (norm(list[i])) return norm(list[i]);
    }
    return 'en';
  }
  var lang = pageLang();
  var names = NAMES[data.game] || {};
  var name = names[lang] || names.en || '';
  
  var q = function (s) { return '"' + String(s).replace(/["\\\n\r]/g, '') + '"'; };
  var lines = function (a, b) { return '"' + String(a).replace(/["\\\n\r]/g, '') + '\\A ' + String(b).replace(/["\\\n\r]/g, '') + '"'; };

  
  function level() {
    var levels = String(data.levels || '').split(',').filter(Boolean);
    if (!levels.length) return null;
    var pick = function (v) { return levels.indexOf(v) >= 0 ? v : null; };
    try { var p = pick(new URLSearchParams(location.search).get('level')); if (p) return p; } catch (e) {  }
    try {
      var raw = JSON.parse(localStorage.getItem(data.levelKey || ''));
      var v = pick(raw && typeof raw === 'object' ? raw.level : raw);
      if (v) return v;
    } catch (e) {  }
    return pick(data.levelDefault) || levels[0];
  }
  function preload(href, extra) {
    var l = d.createElement('link');
    l.rel = 'preload';
    l.as = 'image';
    l.href = href;
    if (extra) l.setAttribute('fetchpriority', extra);
    d.head.appendChild(l);
  }

  var lvl = level();
  var img = 'none';
  if (lvl) {
    var tall = window.matchMedia && window.matchMedia('(max-aspect-ratio: 4/5)').matches;
    var file = './assets/levels/' + lvl + (tall ? '-tall' : '-wide') + '.webp';
    preload(file, 'high');
    try { img = 'url(' + q(new URL(file, location.href).href) + ')'; } catch (e) { img = 'url(' + q(file) + ')'; }
  }
  
  
  if (data.deck) preload(data.deck + ((window.devicePixelRatio || 1) > 1.5 ? 'deck@2x.webp' : 'deck.webp'));

  
  
  
  
  
  
  
  
  
  
  var KITS = { minesweeper: 'stone', gomoku: 'wood', truco: 'wood', buraco: 'wood', 'word-chain': 'parchment' };
  var kit = data.kit || KITS[data.game] || '';
  if (/^(stone|wood|parchment)$/.test(kit) && me && me.src) {
    html.setAttribute('data-kit', kit);
    var sheets = ['skins.css', 'kit.css'];
    for (var k = 0; k < sheets.length; k++) {
      var ln = d.createElement('link');
      ln.rel = 'stylesheet';
      ln.href = new URL('kit/' + sheets[k], me.src).href;
      d.head.appendChild(ln);
    }
  }

  var loadingWord = LOADING[lang] || LOADING.en;
  html.style.setProperty('--mg-boot-text', name ? lines(name, loadingWord) : q(loadingWord));
  html.style.setProperty('--mg-boot-img', img);
  html.style.setProperty('--mg-boot-p', '0.08');
  html.classList.add('mg-boot');

  var css = ''
    + 'html.mg-boot body > :not(.studio-bar), html.mg-boot .studio-back { visibility: hidden !important; }'
    + 'html.mg-boot body::before, html.mg-boot-out body::before { content: ""; position: fixed; z-index: 50;'
    + '  left: 0; right: 0; bottom: 0; top: 52px; pointer-events: none;'
    + '  background: linear-gradient(rgba(251,245,228,.25), rgba(251,245,228,.25)), var(--mg-boot-img) center / cover no-repeat, #FBF5E4; }'
    + 'html.mg-boot body::after, html.mg-boot-out body::after { content: var(--mg-boot-text); position: fixed; z-index: 51;'
    + '  left: 50%; top: 45%; transform: translate(-50%, -50%); box-sizing: border-box; width: min(320px, calc(100vw - 32px));'
    + '  padding: 20px 24px 40px; border-radius: 16px; white-space: pre-line; text-align: center; pointer-events: none;'
    + '  font: 700 22px/1.35 Georgia, "Times New Roman", serif; color: #17150F;'
    + '  box-shadow: 0 6px 24px rgba(0,0,0,.28); background-color: rgba(255,253,246,.95);'
    + '  background-image: linear-gradient(#1B6B3A, #1B6B3A), linear-gradient(#E9D3A8, #E9D3A8);'
    + '  background-repeat: no-repeat; background-position: 24px calc(100% - 18px), 24px calc(100% - 18px);'
    + '  background-size: calc((100% - 48px) * var(--mg-boot-p)) 8px, calc(100% - 48px) 8px; }'
    + 'html.mg-boot-out body::before, html.mg-boot-out body::after { opacity: 0; transition: opacity .25s ease; }'
    + '@media (max-width: 560px) { html.mg-boot body::before, html.mg-boot-out body::before { top: 44px; }'
    + '  html.mg-boot body::after, html.mg-boot-out body::after { font-size: 20px; } }'
    + '@media (prefers-reduced-motion: reduce) { html.mg-boot-out body::before, html.mg-boot-out body::after { transition: none; } }';
  var st = d.createElement('style');
  st.id = 'mg-boot-style';
  st.textContent = css;
  d.head.appendChild(st);

  
  var seen = 0;
  var obs = null;
  function bump(n) {
    seen += n;
    var p = 0.08 + 0.84 * (1 - Math.exp(-seen / 28));
    html.style.setProperty('--mg-boot-p', p.toFixed(3));
  }
  try {
    obs = new PerformanceObserver(function (list) { bump(list.getEntries().length); });
    obs.observe({ type: 'resource', buffered: true });
  } catch (e) {  }

  var finished = false;
  var RETRY = 'mg-boot-retried';
  function done() {
    if (finished) return;
    finished = true;
    clearTimeout(watchdog);
    try { if (obs) obs.disconnect(); } catch (e) {  }
    try { sessionStorage.removeItem(RETRY); } catch (e) {  }
    html.style.setProperty('--mg-boot-p', '1');
    html.classList.add('mg-boot-out');
    html.classList.remove('mg-boot');
    setTimeout(function () { html.classList.remove('mg-boot-out'); }, 320);
    for (var i = 0; i < waiters.length; i++) { try { waiters[i](); } catch (e) {  } }
    waiters = [];
  }
  function giveUp() {
    if (finished) return;
    var retried = false;
    try { retried = sessionStorage.getItem(RETRY) === '1'; sessionStorage.setItem(RETRY, '1'); } catch (e) { retried = true; }
    if (!retried) { location.reload(); return; }
    done();
  }
  var waiters = [];
  var watchdog = setTimeout(giveUp, Number(data.timeout) || 25000);
  
  window.addEventListener('error', function (e) {
    var t = e && e.target;
    if (t && t.tagName === 'SCRIPT' && !finished) giveUp();
  }, true);

  window.mgBoot = {
    done: done,
    get finished() { return finished; },
    
    after: function (fn) { if (finished) fn(); else waiters.push(fn); },
    lang: lang,
  };
}());
