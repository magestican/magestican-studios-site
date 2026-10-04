






import { ES_419 } from './es419.js';

export const LANGS = [
  { id: 'en', name: 'English' },
  { id: 'es-419', name: 'Español (Latinoamérica)' },
];
const TABLES = { 'es-419': ES_419 };
export const LANG_KEY = 'dachis.lang';

let lang = 'en';
let C = null; 
const listeners = new Set();

const esc = (s) => s.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/[{}]/g, (c) => '\\' + c);
const SLOT = /\{(\d)\}/g;

export function compile(table) {
  const exact = new Map(), upper = new Map(), pats = [];
  for (const [k, v] of Object.entries(table)) {
    if (/\{\d\}/.test(k)) {
      const order = [];
      const src = k.split(SLOT).map((p, i) => (i % 2 ? (order.push(+p), '([\\s\\S]+?)') : esc(p))).join('');
      pats.push({ re: new RegExp('^' + src + '$'), reI: new RegExp('^' + src + '$', 'i'), order, out: v, lit: k.replace(SLOT, '').length });
    } else { exact.set(k, v); if (!upper.has(k.toUpperCase())) upper.set(k.toUpperCase(), v.toUpperCase()); }
  }
  pats.sort((a, b) => b.lit - a.lit); 
  return { exact, upper, pats, memo: new Map() };
}

function look(s, depth) {
  const hit = C.exact.get(s);
  if (hit !== undefined) return hit;
  const up = s === s.toUpperCase() && /[A-Z]/.test(s) ? C.upper.get(s) : undefined;
  if (up !== undefined) return up;
  if (depth > 2) return null;
  const caps = s === s.toUpperCase() && /[A-Z]/.test(s);
  for (const p of C.pats) {
    const m = (caps ? p.reI : p.re).exec(s);
    if (!m) continue;
    const out = p.out.replace(SLOT, (_, n) => { const v = m[p.order.indexOf(+n) + 1]; return v == null ? '' : trIn(v, depth + 1); });
    return caps ? out.toUpperCase() : out;
  }
  return null;
}
function trIn(s, depth) {
  const a = s.match(/^\s*/)[0], z = s.slice(a.length).match(/\s*$/)[0], core = s.slice(a.length, s.length - z.length);
  if (!core || !/[A-Za-z]/.test(core)) return s;
  const r = look(core, depth);
  if (r == null) { if (depth === 0 && typeof window !== 'undefined' && window.__i18nMiss) window.__i18nMiss.add(core); return s; }
  return a + r + z;
}


export function tr(s) {
  if (!C || typeof s !== 'string') return s;
  let r = C.memo.get(s);
  if (r === undefined) { r = trIn(s, 0); if (C.memo.size > 4000) C.memo.clear(); C.memo.set(s, r); }
  return r;
}

export const tf = (key, ...a) => tr(key).replace(SLOT, (_, n) => String(a[+n] ?? ''));

export const getLang = () => lang;
export function setLang(id, { save = true } = {}) {
  if (!LANGS.some((l) => l.id === id)) id = 'en';
  lang = id; C = TABLES[id] ? compile(TABLES[id]) : null;
  if (save) { try { localStorage.setItem(LANG_KEY, id); } catch (e) {  } }
  if (typeof document !== 'undefined') document.documentElement.lang = id === 'en' ? 'en' : 'es';
  for (const f of listeners) f(id);
}
export const onLangChange = (f) => { listeners.add(f); return () => listeners.delete(f); };


export function pickInitial(stored, navLangs) {
  if (stored && LANGS.some((l) => l.id === stored)) return stored;
  return (navLangs || []).some((l) => /^es\b/i.test(l)) ? 'es-419' : 'en';
}
