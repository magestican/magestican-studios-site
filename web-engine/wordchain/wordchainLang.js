





















export const LANGS = Object.freeze(['en', 'es', 'pt', 'tl', 'ja', 'ko', 'id', 'vi']);


export const LINKS = Object.freeze({
  vi: Object.freeze(['syllable']),
  ja: Object.freeze(['kana']),
  ko: Object.freeze(['hangul']),
  id: Object.freeze(['two', 'letter']),
  en: Object.freeze(['letter', 'two']),
  es: Object.freeze(['letter', 'two']),
  pt: Object.freeze(['letter', 'two']),
  tl: Object.freeze(['letter', 'two']),
});

export const defaultLink = (lang) => (LINKS[lang] ?? LINKS.en)[0];
export const isLink = (lang, link) => !!LINKS[lang]?.includes(link);


const VI_LETTERS = /^[a-zàáảãạăằắẳẵặâầấẩẫậbcdđeèéẻẽẹêềếểễệghiìíỉĩịklmnoòóỏõọôồốổỗộơờớởỡợpqrstuùúủũụưừứửữựvxyỳýỷỹỵ]+$/;
const VI_TONES = { '̀': 1, '́': 2, '̉': 3, '̃': 4, '̣': 5 };


export function viSyllableKey(syllable) {
  let tone = 0;
  const bare = String(syllable).toLowerCase().normalize('NFD').replace(/[̣̀́̃̉]/g, (m) => {
    tone = VI_TONES[m];
    return '';
  }).normalize('NFC');
  return `${bare}${tone}`;
}


const KANA = /^[ぁ-ゖァ-ヺー]+$/;
const SMALL = Object.freeze({ ぁ: 'あ', ぃ: 'い', ぅ: 'う', ぇ: 'え', ぉ: 'お', ゃ: 'や', ゅ: 'ゆ', ょ: 'よ', ゎ: 'わ', っ: 'つ' });

export const toHiragana = (s) => String(s).replace(/[ァ-ヶ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0x60));


function morae(r) {
  const out = [];
  for (const c of r) {
    if (out.length && c !== 'っ' && SMALL[c]) out[out.length - 1] += c;
    else out.push(c);
  }
  return out;
}

export const jaHead = (r) => morae(r)[0] ?? '';


export function jaTails(r) {
  const m = morae(String(r).replace(/ー+$/, ''));
  const last = m[m.length - 1] ?? '';
  if (last.length === 2) return [last, SMALL[last[1]]];
  if (SMALL[last]) return [SMALL[last]];
  return [last];
}


const HANGUL = /^[가-힣]+$/;
const Y_VOWELS = new Set([2, 6, 7, 12, 17, 20]);     
const N_TO_O = new Set([6, 7, 12, 17, 20]);          


export function dueum(syllable) {
  const code = syllable.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return syllable;
  const ini = Math.floor(code / 588);
  const med = Math.floor((code % 588) / 28);
  const fin = code % 28;
  let to = ini;
  if (ini === 5) to = Y_VOWELS.has(med) ? 11 : 2;    
  else if (ini === 2 && N_TO_O.has(med)) to = 11;    
  if (to === ini) return syllable;
  return String.fromCharCode(0xac00 + (to * 21 + med) * 28 + fin);
}


const LATIN = /^\p{Script=Latin}+$/u;


export const fold = (s) => String(s).toLowerCase().replace(/ñ/g, '\u0001').normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'ñ');







export function normalise(lang, text) {
  const s = String(text ?? '').normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!s) return null;
  if (lang === 'vi') {
    const parts = s.split(' ');
    return parts.length === 2 && parts.every((p) => VI_LETTERS.test(p)) ? s : null;
  }
  if (lang === 'ja') {
    const r = toHiragana(s);
    return KANA.test(r) && morae(r).length >= 2 && !SMALL[r[0]] && r[0] !== 'ー' ? r : null;
  }
  if (lang === 'ko') return HANGUL.test(s) && s.length >= 2 ? s : null;
  return LATIN.test(s) && s.length >= 2 ? s : null;
}


export function keyOf(lang, text) {
  const s = normalise(lang, text);
  if (s === null) return null;
  if (lang === 'vi') return s.split(' ').map(viSyllableKey).join(' ');
  return s;
}

function checkLink(lang, link) {
  if (!isLink(lang, link)) throw new Error(`${lang} has no link rule "${link}"`);
}


export function head(lang, link, word) {
  checkLink(lang, link);
  if (lang === 'vi') return viSyllableKey(word.split(' ')[0]);
  if (lang === 'ja') return jaHead(word);
  if (lang === 'ko') return word[0];
  const f = fold(word);
  return link === 'two' ? f.slice(0, 2) : f[0];
}


export function tails(lang, link, word) {
  checkLink(lang, link);
  if (lang === 'vi') { const p = word.split(' '); return [viSyllableKey(p[p.length - 1])]; }
  if (lang === 'ja') return jaTails(word);
  if (lang === 'ko') {
    const last = word[word.length - 1];
    const alt = dueum(last);
    return alt === last ? [last] : [last, alt];
  }
  const f = fold(word);
  return [link === 'two' ? f.slice(-2) : f.slice(-1)];
}


export function links(lang, link, prev, next) {
  const a = normalise(lang, prev);
  const b = normalise(lang, next);
  if (a === null || b === null) return false;
  return tails(lang, link, a).includes(head(lang, link, b));
}


export function endsGame(lang, link, word) {
  checkLink(lang, link);
  return lang === 'ja' && /ん$/.test(String(word).replace(/ー+$/, ''));
}
