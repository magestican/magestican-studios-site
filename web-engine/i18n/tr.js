














import { gameLang } from './gameNames.js';

let active = null;
let activeCode = 'en';

export function fillSlots(line, values = {}) {
  return String(line).replace(/\{(\w+)\}/g, (all, key) => (key in values ? String(values[key]) : all));
}


export function t(english, values) {
  return fillSlots(active?.[english] ?? english, values);
}


export const tv = t;


export function useLanguage(dicts, lang = gameLang(), doc = globalThis.document) {
  active = dicts[lang] ?? null;
  activeCode = active ? lang : 'en';
  if (doc?.documentElement) doc.documentElement.lang = activeCode;
  return activeCode;
}

export const activeLanguage = () => activeCode;


const CJK = '\\u3040-\\u30ff\\u3400-\\u9fff\\uf900-\\ufaff\\uff00-\\uffef';

const NO_START = '、。，．・：；？！）」』】〉》ー々ぁぃぅぇぉっゃゅょァィゥェォッャュョ!?.,:;)';
const NO_END = '（「『【〈《(';
const TOKENS = new RegExp(`\\s+|[${NO_END}]*[${CJK}][${NO_START}]*|[^\\s${CJK}]+`, 'g');







export function wrapLines(string, fits) {
  const out = [];
  let line = '';
  let gap = '';
  for (const token of String(string ?? '').match(TOKENS) ?? []) {
    if (/^\s/.test(token)) { gap = line ? ' ' : ''; continue; }
    const next = `${line}${gap}${token}`;
    if (line && !fits(next)) {
      out.push(line);
      line = token;
    } else {
      line = next;
    }
    gap = '';
  }
  if (line) out.push(line);
  return out;
}


export function wrappedLines(source) {
  const lines = new Set();
  for (const m of source.matchAll(/(?<![\w.$])t\(\s*(?:'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\$]|\\.)*)`)/g)) {
    lines.add((m[1] ?? m[2] ?? m[3]).replace(/\\(['"`\\])/g, '$1'));
  }
  return lines;
}


export function badCalls(source) {
  return [...source.matchAll(/(?<![\w.$])t\(\s*(?!['"`\s])[^)\n]{0,40}|(?<![\w.$])t\(\s*`[^`]*\$\{[^`]*`/g)].map((m) => m[0]);
}


export function untranslated(sources, dict) {
  const wrapped = new Set(sources.flatMap((source) => [...wrappedLines(source)]));
  return {
    missing: [...wrapped].filter((line) => !dict[line]),
    unused: Object.keys(dict).filter((line) => !wrapped.has(line)),
    bad: sources.flatMap(badCalls),
  };
}
