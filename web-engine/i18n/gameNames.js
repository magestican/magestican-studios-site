

















































export const GAME_NAMES = Object.freeze({
  'farmy-chess': { en: 'Rookwise', es: 'Rookwise: Ajedrez', pt: 'Rookwise: Xadrez', ja: 'Rookwise チェス', ko: 'Rookwise 체스', id: 'Rookwise: Catur', vi: 'Rookwise: Cờ Vua' },
  'farmy-checkers': { en: 'Jumpline', es: 'Jumpline: Damas', pt: 'Jumpline: Damas', ja: 'Jumpline チェッカー', ko: 'Jumpline 체커', id: 'Jumpline: Catur Dam', vi: 'Jumpline: Cờ Đam' },
  'farmy-ludo': { en: 'Pawnrush', es: 'Pawnrush: Parchís', pt: 'Pawnrush: Ludo', ja: 'Pawnrush ルドー', ko: 'Pawnrush 루도', id: 'Pawnrush: Ludo', vi: 'Pawnrush: Cờ Cá Ngựa' },
  farmykart: { en: 'Skidline', es: 'Skidline: Carreras de Karts', pt: 'Skidline: Corrida de Kart', ja: 'Skidline カートレース', ko: 'Skidline 카트 레이싱', id: 'Skidline: Balap Kart', vi: 'Skidline: Đua Xe' },
  'farmy-scrabble': { en: 'Letterloft', es: 'Letterloft: Fichas de Letras', pt: 'Letterloft: Tabuleiro de Palavras', ja: 'Letterloft 単語ボードゲーム', ko: 'Letterloft 단어 보드게임', id: 'Letterloft: Susun Kata', vi: 'Letterloft: Xếp Chữ' },
  'farmy-crosswords': { en: 'Wordhaus', es: 'Wordhaus: Crucigramas', pt: 'Wordhaus: Palavras Cruzadas', ja: 'Wordhaus クロスワード', ko: 'Wordhaus 십자말풀이', id: 'Wordhaus: Teka-Teki Silang', vi: 'Wordhaus: Ô Chữ' },
  'farmy-five': { en: 'Guessling', es: 'Guessling: Adivina la Palabra', pt: 'Guessling: Adivinhe a Palavra', ja: 'Guessling 単語当て', ko: 'Guessling 단어 맞추기', id: 'Guessling: Tebak Kata', vi: 'Guessling: Đoán Chữ' },
  'farmy-hive': { en: 'Honeyword', es: 'Honeyword: Panal de Letras', pt: 'Honeyword: Colmeia de Letras', ja: 'Honeyword ハチの巣パズル', ko: 'Honeyword 벌집 퍼즐', id: 'Honeyword: Rangkai Kata', vi: 'Honeyword: Ghép Chữ' },
  'farmy-herds': { en: 'Clusterly', es: 'Clusterly: Grupos de Palabras', pt: 'Clusterly: Grupos de Palavras', ja: 'Clusterly 仲間分け', ko: 'Clusterly 단어 묶기', id: 'Clusterly: Kelompok Kata', vi: 'Clusterly: Nhóm Từ' },
  'farmy-furrows': { en: 'Gridseek', es: 'Gridseek: Sopa de Letras', pt: 'Gridseek: Caça-Palavras', ja: 'Gridseek 単語探し', ko: 'Gridseek 단어 찾기', id: 'Gridseek: Cari Kata', vi: 'Gridseek: Tìm Chữ' },
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
