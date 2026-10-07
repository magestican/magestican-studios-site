






















export const GAME_NAMES = Object.freeze({
  'farmy-chess': { en: 'Farmy Chess', es: 'Ajedrez Farmy', pt: 'Xadrez Farmy', ja: 'ファーミーチェス', ko: '파미 체스', id: 'Catur Farmy', vi: 'Cờ Vua Farmy' },
  'farmy-checkers': { en: 'Farmy Checkers', es: 'Damas Farmy', pt: 'Damas Farmy', ja: 'ファーミーチェッカー', ko: '파미 체커', id: 'Dam Farmy', vi: 'Cờ Đam Farmy' },
  'farmy-ludo': { en: 'Farmy Ludo', es: 'Parchís Farmy', pt: 'Ludo Farmy', ja: 'ファーミールド', ko: '파미 루도', id: 'Ludo Farmy', vi: 'Cờ Cá Ngựa Farmy' },
  farmykart: { en: 'Farmy Kart', es: 'Karts Farmy', pt: 'Kart Farmy', ja: 'ファーミーカート', ko: '파미 카트', id: 'Kart Farmy', vi: 'Đua Xe Farmy' },
  'farmy-scrabble': { en: 'Farmy Tiles', es: 'Fichas Farmy', pt: 'Peças Farmy', ja: 'ファーミータイル', ko: '파미 타일', id: 'Ubin Kata Farmy', vi: 'Ô Chữ Ghép Farmy' },
  'farmy-crosswords': { en: 'Farmy Crosswords', es: 'Crucigramas Farmy', pt: 'Palavras Cruzadas Farmy', ja: 'ファーミークロスワード', ko: '파미 낱말 퍼즐', id: 'Teka-Teki Silang Farmy', vi: 'Ô Chữ Farmy' },
  'farmy-five': { en: 'Farmy Five', es: 'Cinco Letras Farmy', pt: 'Cinco Letras Farmy', ja: 'ファーミー5文字', ko: '파미 다섯 글자', id: 'Lima Huruf Farmy', vi: 'Năm Chữ Farmy' },
  'farmy-hive': { en: 'Farmy Hive', es: 'Panal Farmy', pt: 'Colmeia Farmy', ja: 'ファーミーハイブ', ko: '파미 벌집', id: 'Sarang Lebah Farmy', vi: 'Tổ Ong Farmy' },
  'farmy-herds': { en: 'Farmy Herds', es: 'Grupos Farmy', pt: 'Grupos Farmy', ja: 'ファーミー仲間分け', ko: '파미 묶음', id: 'Kelompok Farmy', vi: 'Nhóm Từ Farmy' },
  'farmy-furrows': { en: 'Farmy Furrows', es: 'Sopa de Letras Farmy', pt: 'Caça-Palavras Farmy', ja: 'ファーミー単語探し', ko: '파미 단어 찾기', id: 'Cari Kata Farmy', vi: 'Tìm Chữ Farmy' },
});

export const NAME_LANGS = Object.freeze(['en', 'es', 'pt', 'tl', 'ja', 'ko', 'id', 'vi']);


export function gameLang(loc = globalThis.location, store = globalThis.localStorage, nav = globalThis.navigator) {
  const norm = (s) => {
    let c = String(s || '').toLowerCase().split('-')[0];
    if (c === 'fil') c = 'tl';
    if (c === 'in') c = 'id';
    return NAME_LANGS.includes(c) ? c : null;
  };
  try {
    const q = loc && new URLSearchParams(loc.search).get('lang');
    if (norm(q)) return norm(q);
  } catch {  }
  try {
    const saved = store && store.getItem('ms-lang');
    if (norm(saved)) return norm(saved);
  } catch {  }
  for (const l of (nav && (nav.languages || [nav.language])) || []) {
    if (String(l).toLowerCase().startsWith('en')) return 'en';
    if (norm(l)) return norm(l);
  }
  return 'en';
}


export function localGameName(id, lang = gameLang()) {
  const row = GAME_NAMES[id];
  if (!row) return null;
  return row[lang] || row.en;
}





export function applyGameName(id, doc = globalThis.document, lang = gameLang()) {
  const row = GAME_NAMES[id];
  if (!row || !doc) return row ? row.en : null;
  const local = row[lang] || row.en;
  if (local === row.en) return local;
  if (doc.title) doc.title = doc.title.split(row.en).join(local);
  for (const el of doc.querySelectorAll('[data-game-name]')) el.textContent = local;
  if (doc.documentElement && lang !== 'en') doc.documentElement.setAttribute('data-name-lang', lang);
  return local;
}
