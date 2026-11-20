













import { activeLanguage, t, useLanguage } from '../../../web-engine/i18n/tr.js';
import { JA_FAMILY } from '../../../web-engine/i18n/jaFamily.js';
import { translateStudioBar } from '../../../web-engine/i18n/studioBar.js';
import { JA } from './ja.js';
import { ES } from './es.js';


export const LANGS = Object.freeze([
  Object.freeze({ code: 'en', name: 'English' }),
  Object.freeze({ code: 'ja', name: '日本語' }),
  Object.freeze({ code: 'es', name: 'Español' }),
]);


export const pageKey = (s) => String(s).replace(/\s+/g, ' ').trim();

const LABELS = ['aria-label', 'title', 'placeholder'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT']);


export function translatePage(doc = globalThis.document) {
  if (!doc?.body || activeLanguage() === 'en') return;
  for (const el of doc.querySelectorAll('[data-t-html]')) {
    const key = pageKey(el.innerHTML);
    const line = t(key);
    if (line !== key) el.innerHTML = line; 
  }
  const walker = doc.createTreeWalker(doc.body, 4 );
  const nodes = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n);
  for (const n of nodes) {
    if (skipped(n.parentElement)) continue;
    const key = pageKey(n.nodeValue);
    if (!key) continue;
    const line = t(key);
    if (line === key) continue;
    const [, lead, , tail] = /^(\s*)([\s\S]*?)(\s*)$/.exec(n.nodeValue);
    n.nodeValue = `${lead}${line}${tail}`;
  }
  for (const el of doc.body.querySelectorAll(LABELS.map((a) => `[${a}]`).join(','))) {
    for (const a of LABELS) if (el.hasAttribute(a)) el.setAttribute(a, t(pageKey(el.getAttribute(a))));
  }
}


function skipped(el) {
  for (let e = el; e; e = e.parentElement) {
    if (SKIP.has(e.tagName) || e.hasAttribute('data-t-html') || e.getAttribute('translate') === 'no') return true;
  }
  return false;
}


export function mountPicker(box, { doc = globalThis.document, store = globalThis.localStorage, loc = globalThis.location } = {}) {
  if (!box) return;
  const now = activeLanguage();
  box.replaceChildren(...LANGS.map(({ code, name }) => {
    const b = doc.createElement('button');
    b.type = 'button';
    b.lang = code;
    b.textContent = name;
    b.setAttribute('aria-pressed', String(code === now));
    b.addEventListener('click', () => {
      if (code === now) return;
      try { store.setItem('ms-lang', code); } catch {  }
      const url = new URL(loc.href);
      url.searchParams.set('lang', code);
      loc.replace(url.href);
    });
    return b;
  }));
}

useLanguage({ ja: { ...JA_FAMILY, ...JA }, es: ES });
translateStudioBar();
translatePage();
