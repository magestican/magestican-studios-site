

















































export const GAME_NAMES = Object.freeze({
  'farmy-chess': { en: 'Rookwise', es: 'Rookwise: Ajedrez', pt: 'Rookwise: Xadrez', ja: 'Rookwise チェス', ko: 'Rookwise 체스', id: 'Rookwise: Catur', vi: 'Rookwise: Cờ Vua' },
  'farmy-checkers': { en: 'Jumpwise', es: 'Jumpwise: Damas', pt: 'Jumpwise: Damas', ja: 'Jumpwise チェッカー', ko: 'Jumpwise 체커', id: 'Jumpwise: Catur Dam', vi: 'Jumpwise: Cờ Đam' },
  'farmy-ludo': { en: 'Pawnrush', es: 'Pawnrush: Parchís', pt: 'Pawnrush: Ludo', ja: 'Pawnrush ルドー', ko: 'Pawnrush 루도', id: 'Pawnrush: Ludo', vi: 'Pawnrush: Cờ Cá Ngựa' },
  farmykart: { en: 'Kartzoom', es: 'Kartzoom: Carreras de Karts', pt: 'Kartzoom: Corrida de Kart', ja: 'Kartzoom カートレース', ko: 'Kartzoom 카트 레이싱', id: 'Kartzoom: Balap Kart', vi: 'Kartzoom: Đua Xe' },
  'farmy-scrabble': { en: 'Letterloft', es: 'Letterloft: Fichas de Letras', pt: 'Letterloft: Tabuleiro de Palavras', ja: 'Letterloft 単語ボードゲーム', ko: 'Letterloft 단어 보드게임', id: 'Letterloft: Susun Kata', vi: 'Letterloft: Xếp Chữ' },
  'farmy-crosswords': { en: 'Wordnook', es: 'Wordnook: Crucigramas', pt: 'Wordnook: Palavras Cruzadas', ja: 'Wordnook クロスワード', ko: 'Wordnook 십자말풀이', id: 'Wordnook: Teka-Teki Silang', vi: 'Wordnook: Ô Chữ' },
  'farmy-five': { en: 'Guesswise', es: 'Guesswise: Adivina la Palabra', pt: 'Guesswise: Adivinhe a Palavra', ja: 'Guesswise 単語当て', ko: 'Guesswise 단어 맞추기', id: 'Guesswise: Tebak Kata', vi: 'Guesswise: Đoán Chữ' },
  'farmy-hive': { en: 'Combword', es: 'Combword: Panal de Letras', pt: 'Combword: Colmeia de Letras', ja: 'Combword ハチの巣パズル', ko: 'Combword 벌집 퍼즐', id: 'Combword: Rangkai Kata', vi: 'Combword: Ghép Chữ' },
  'farmy-herds': { en: 'Groupseek', es: 'Groupseek: Grupos de Palabras', pt: 'Groupseek: Grupos de Palavras', ja: 'Groupseek 仲間分け', ko: 'Groupseek 단어 묶기', id: 'Groupseek: Kelompok Kata', vi: 'Groupseek: Nhóm Từ' },
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
