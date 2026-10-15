














import { normalise, keyOf, head, tails, fold } from './wordchainLang.js';






const LOADERS = Object.freeze({
  en: () => import('./data/en.js'),
  es: () => import('./data/es.js'),
  pt: () => import('./data/pt.js'),
  tl: () => import('./data/tl.js'),
  ja: () => import('./data/ja.js'),
  ko: () => import('./data/ko.js'),
  id: () => import('./data/id.js'),
  vi: () => import('./data/vi.js'),
});


export async function loadDict(lang) {
  const mod = await (LOADERS[lang] ?? LOADERS.en)();
  return createDict(mod.LANG, mod);
}

export function createDict(lang, { WORDS, COMMON = '' }) {
  const words = [];
  const surface = [];
  const byKey = new Map();
  const bySurface = new Map();
  const byFold = new Map();
  for (const line of String(WORDS).split('\n')) {
    if (!line) continue;
    const sp = lang === 'ja' ? line.indexOf(' ') : -1;
    const word = sp > 0 ? line.slice(0, sp) : line;
    const written = sp > 0 ? line.slice(sp + 1) : null;
    const key = keyOf(lang, word);
    if (key === null || byKey.has(key)) continue;
    const i = words.length;
    words.push(word);
    surface.push(written);
    byKey.set(key, i);
    if (written) bySurface.set(written, [...(bySurface.get(written) ?? []), i]);
    if (lang !== 'ja' && lang !== 'ko' && lang !== 'vi') {
      
      
      const f = fold(word);
      byFold.set(f, byFold.has(f) ? -1 : i);
    }
  }
  const common = new Set();
  for (const w of String(COMMON).split('\n')) {
    const i = byKey.get(keyOf(lang, w));
    if (i !== undefined) common.add(i);
  }
  return { lang, words, surface, byKey, bySurface, byFold, common, heads: new Map() };
}


export function lookup(dict, text) {
  const raw = String(text ?? '').normalize('NFC').trim();
  const key = keyOf(dict.lang, raw);
  if (key !== null && dict.byKey.has(key)) return [dict.byKey.get(key)];
  if (dict.lang === 'ja') return dict.bySurface.get(raw) ?? [];
  if (key !== null && dict.byFold.size) {
    const i = dict.byFold.get(fold(key));
    if (i !== undefined && i >= 0) return [i];
  }
  return [];
}


function headIndex(dict, link) {
  let idx = dict.heads.get(link);
  if (idx) return idx;
  idx = new Map();
  dict.words.forEach((w, i) => {
    const h = headOf(dict, link, i);
    if (!idx.has(h)) idx.set(h, []);
    idx.get(h).push(i);
  });
  dict.heads.set(link, idx);
  return idx;
}




function cached(dict, kind, link, i, fn) {
  const name = `${kind}:${link}`;
  let arr = dict.cache?.get(name);
  if (!arr) {
    if (!dict.cache) dict.cache = new Map();
    arr = new Array(dict.words.length);
    dict.cache.set(name, arr);
  }
  return arr[i] ?? (arr[i] = fn(dict.lang, link, dict.words[i]));
}
export const headOf = (dict, link, i) => cached(dict, 'h', link, i, head);
export const tailsOf = (dict, link, i) => cached(dict, 't', link, i, tails);


export function startingWith(dict, link, heads) {
  const idx = headIndex(dict, link);
  const out = [];
  for (const h of heads) for (const i of idx.get(h) ?? []) out.push(i);
  return out;
}


export const followers = (dict, link, i, used = new Set()) => startingWith(dict, link, tailsOf(dict, link, i)).filter((j) => !used.has(j));







export function continuations(dict, link, i, used = new Set()) {
  const idx = headIndex(dict, link);
  const hs = tailsOf(dict, link, i);
  let n = 0;
  for (const h of hs) n += idx.get(h)?.length ?? 0;
  for (const j of used) if (hs.includes(headOf(dict, link, j))) n--;
  return n;
}






export function isKiller(dict, link, i) {
  let n = continuations(dict, link, i);
  if (tailsOf(dict, link, i).includes(headOf(dict, link, i))) n -= 1;
  return n <= 0;
}


export function display(dict, i) {
  const w = dict.words[i];
  const s = dict.surface[i];
  return s ? `${s} (${w})` : w;
}


export const shapeOf = (lang, text) => normalise(lang, text);
