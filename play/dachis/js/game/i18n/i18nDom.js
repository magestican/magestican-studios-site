






import { tr, getLang, setLang, onLangChange, pickInitial, LANG_KEY, langInfo } from './i18n.js';

const ORIG = new WeakMap(); 
const ATTRS = ['title', 'aria-label', 'placeholder'];
const SKIP = '#dlgText, [data-noi18n], script, style';

function doText(n) {
  const p = n.parentElement;
  if (!p || p.closest(SKIP)) return;
  let r = ORIG.get(n);
  if (!r || n.data !== r.out) { r = { en: n.data, out: n.data }; ORIG.set(n, r); }
  const t = getLang() === 'en' ? r.en : tr(r.en);
  if (t !== n.data) { r.out = t; n.data = t; } else r.out = n.data;
}
function doAttrs(el) {
  if (el.closest(SKIP)) return;
  for (const a of ATTRS) {
    if (!el.hasAttribute(a)) continue;
    const key = 'i18n' + a.replace(/-./g, (c) => c[1].toUpperCase()).replace(/^./, (c) => c.toUpperCase());
    const cur = el.getAttribute(a);
    if (el.dataset[key + 'Out'] !== cur) el.dataset[key] = cur; 
    const t = getLang() === 'en' ? el.dataset[key] : tr(el.dataset[key]);
    el.dataset[key + 'Out'] = t;
    if (t !== cur) el.setAttribute(a, t);
  }
}
function walk(root) {
  if (root.nodeType === 3) { doText(root); return; }
  if (root.nodeType !== 1) return;
  doAttrs(root);
  const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  for (let n = it.nextNode(); n; n = it.nextNode()) { if (n.nodeType === 3) doText(n); else doAttrs(n); }
}



function patchDialogs() {
  for (const f of ['confirm', 'alert']) {
    const was = window[f];
    window[f] = (msg) => was.call(window, getLang() === 'en' ? msg : tr(String(msg)));
  }
}



const CJK_FACE = { hk: '"Dachis HK"', jp: '"Dachis JP"' };
const GENERIC = /,?\s*(cursive|sans-serif|serif|system-ui|monospace|fantasy)\s*$/i;
export function withCjk(font, cjk) {
  let face = CJK_FACE[cjk];
  if (!face || !font || font.includes('Dachis ')) return font;
  
  if (/Bangers|Permanent Marker|Sedgwick|Impact|Comic Sans/i.test(font)) face = face.replace(/"$/, ' Display"');
  const m = GENERIC.exec(font);
  return m ? font.slice(0, m.index) + `, ${face}, ${m[1]}` : `${font}, ${face}`;
}
function patchFont() {
  const P = CanvasRenderingContext2D.prototype, d = Object.getOwnPropertyDescriptor(P, 'font');
  Object.defineProperty(P, 'font', { configurable: true, enumerable: d.enumerable, get: d.get,
    set(v) { const cjk = langInfo().cjk; d.set.call(this, cjk ? withCjk(String(v), cjk) : v); } });
}

function loadCjk() {
  const cjk = langInfo().cjk;
  if (!cjk || !document.fonts) return;
  const display = CJK_FACE[cjk].replace(/"$/, ' Display"');
  for (const f of [`400 16px ${CJK_FACE[cjk]}`, `800 16px ${CJK_FACE[cjk]}`, `16px ${display}`]) document.fonts.load(f, '的のー').catch(() => {});
}
function patchCanvas() {
  patchFont();
  const P = CanvasRenderingContext2D.prototype;
  for (const f of ['fillText', 'strokeText', 'measureText']) {
    const was = P[f];
    P[f] = function (text, ...rest) { return was.call(this, getLang() === 'en' ? text : tr(String(text)), ...rest); };
  }
}


const CSS_WORDS = { '--t-story': 'STORY', '--t-thinks': 'thinks...', '--t-loading': 'LOADING...' };
function cssWords() {
  for (const [v, en] of Object.entries(CSS_WORDS)) document.documentElement.style.setProperty(v, JSON.stringify(getLang() === 'en' ? en : tr(en)));
}

let started = false;
export function startI18n() {
  if (started) return; started = true;
  let stored = null; try { stored = localStorage.getItem(LANG_KEY); } catch (e) {  }
  const qs = new URLSearchParams(location.search), q = qs.get('lang'); 
  if (qs.has('i18nMiss')) window.__i18nMiss = new Set(); 
  setLang(q || pickInitial(stored, navigator.languages || [navigator.language]), { save: !!q });
  patchCanvas(); patchDialogs();
  cssWords(); loadCjk();
  walk(document.body);
  new MutationObserver((ms) => {
    for (const m of ms) {
      if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doAttrs(m.target);
      else for (const n of m.addedNodes) walk(n);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  onLangChange(() => { cssWords(); loadCjk(); walk(document.body); });
}
