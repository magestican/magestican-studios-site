
























const n = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);


export const FAST_MS = 60000;







export function cleanRecord(record, best) {
  const r = record && typeof record === 'object' ? record : {};
  const b = best && typeof best === 'object' ? best : {};
  const timed = (lv) => (n(b[lv]) ? 1 : 0);
  const beginnerWins = Math.max(n(r.beginnerWins), timed('beginner'));
  const intermediateWins = Math.max(n(r.intermediateWins), timed('intermediate'));
  const expertWins = Math.max(n(r.expertWins), timed('expert'));
  const won = Math.max(n(r.won), beginnerWins + intermediateWins + expertWins);
  return {
    played: Math.max(n(r.played), won), won, beginnerWins, intermediateWins, expertWins,
    lostInRow: n(r.lostInRow), beginnerMs: n(b.beginner) || n(r.beginnerMs),
  };
}


export function recordToSave(record) {
  const { played, won, beginnerWins, intermediateWins, expertWins, lostInRow } = cleanRecord(record);
  return { played, won, beginnerWins, intermediateWins, expertWins, lostInRow };
}

export const WORDS = Object.freeze({
  en: {
    goal: 'Next goal', prizes: 'Your prizes', open: 'See prizes', close: 'Hide prizes',
    count: '{n} of {m} prizes', yours: '{name}, yours', along: '{name}, {have} of {need}',
    newPrize: 'New prize, {name}.', playOn: 'Play on and beat your best times.',
    firstGame: 'Finish a board on any level.', winLevel: 'Win a board on {level}.', winMiddle: 'Win a board on the middle level.',
    wins: 'Win {need} boards. You have won {n}.', fast: 'Win {beginner} in under {s} seconds.',
    yourBest: 'Your best is {t} s.', games: 'Play {need} boards. You have played {n}.',
    tipFlag: 'Use Flag mode to mark a mine you are sure of.', tipEasier: 'Try {beginner}, which has fewer mines.',
    tipNumber: 'Find a number with all its flags placed, then press it.',
    names: ['First board', '{beginner} cleared', 'Three clears', 'Under a minute', '{intermediate} cleared', 'Ten clears', '{expert} cleared', 'Twenty-five boards'],
  },
  es: {
    goal: 'Próxima meta', prizes: 'Tus premios', open: 'Ver premios', close: 'Ocultar premios',
    count: '{n} de {m} premios', yours: '{name}, tuyo', along: '{name}, {have} de {need}',
    newPrize: 'Premio nuevo: {name}.', playOn: 'Sigue jugando y mejora tus récords.',
    firstGame: 'Termina un tablero en cualquier nivel.', winLevel: 'Despeja un tablero en {level}.', winMiddle: 'Despeja un tablero en {intermediate}.',
    wins: 'Despeja {need} tableros. Llevas {n}.', fast: 'Despeja {beginner} en menos de {s} segundos.',
    yourBest: 'Tu récord es {t} s.', games: 'Juega {need} tableros. Llevas {n} jugados.',
    tipFlag: 'Usa el modo Bandera para marcar una mina segura.', tipEasier: 'Prueba {beginner}, que tiene menos minas.',
    tipNumber: 'Busca un número con todas sus banderas puestas y tócalo.',
    names: ['Primer tablero', '{beginner} despejado', 'Tres despejados', 'Menos de un minuto', '{intermediate} despejado', 'Diez despejados', '{expert} despejado', 'Veinticinco tableros'],
  },
  pt: {
    goal: 'Próxima meta', prizes: 'Seus prêmios', open: 'Ver prêmios', close: 'Esconder prêmios',
    count: '{n} de {m} prêmios', yours: '{name}, seu', along: '{name}, {have} de {need}',
    newPrize: 'Prêmio novo: {name}.', playOn: 'Continue jogando e bata seus recordes.',
    firstGame: 'Termine um tabuleiro em qualquer nível.', winLevel: 'Limpe um tabuleiro no {level}.', winMiddle: 'Limpe um tabuleiro no {intermediate}.',
    wins: 'Limpe {need} tabuleiros. Você limpou {n}.', fast: 'Limpe o {beginner} em menos de {s} segundos.',
    yourBest: 'Seu recorde é {t} s.', games: 'Jogue {need} tabuleiros. Você jogou {n}.',
    tipFlag: 'Use o modo Bandeira para marcar uma mina certa.', tipEasier: 'Experimente o {beginner}, que tem menos minas.',
    tipNumber: 'Procure um número com todas as bandeiras postas e toque nele.',
    names: ['Primeiro tabuleiro', '{beginner} limpo', 'Três limpos', 'Menos de um minuto', '{intermediate} limpo', 'Dez limpos', '{expert} limpo', 'Vinte e cinco tabuleiros'],
  },
  tl: {
    goal: 'Susunod na layunin', prizes: 'Mga premyo mo', open: 'Tingnan ang premyo', close: 'Itago ang premyo',
    count: '{n} sa {m} premyo', yours: '{name}, sa iyo na', along: '{name}, {have} sa {need}',
    newPrize: 'Bagong premyo: {name}.', playOn: 'Maglaro pa at talunin ang best time mo.',
    firstGame: 'Tapusin ang isang board sa kahit anong level.', winLevel: 'Linisin ang isang board sa {level}.', winMiddle: 'Linisin ang isang board sa {intermediate}.',
    wins: 'Linisin ang {need} board. Nakalinis ka na ng {n}.', fast: 'Linisin ang {beginner} nang wala pang {s} segundo.',
    yourBest: 'Ang best mo ay {t} s.', games: 'Maglaro ng {need} board. Nakapaglaro ka na ng {n}.',
    tipFlag: 'Gamitin ang Flag mode para markahan ang siguradong mina.', tipEasier: 'Subukan ang {beginner}, mas kaunti ang mina.',
    tipNumber: 'Humanap ng numerong kumpleto na ang flag, saka ito i-tap.',
    names: ['Unang board', '{beginner}, nalinis', 'Tatlong nalinis', 'Wala pang isang minuto', '{intermediate}, nalinis', 'Sampung nalinis', '{expert}, nalinis', "Dalawampu't limang board"],
  },
  ja: {
    goal: '次の目標', prizes: 'あなたの賞', open: '賞を見る', close: '賞を閉じる',
    count: '{m}個中{n}個の賞', yours: '{name}（獲得）', along: '{name}（{have}/{need}）',
    newPrize: '新しい賞：{name}', playOn: 'ベストタイムを更新し続けよう。',
    firstGame: 'どのレベルでも1面を最後まで遊ぼう。', winLevel: '{level}を1面クリアしよう。', winMiddle: '{intermediate}を1面クリアしよう。',
    wins: '{need}面クリアしよう。今は{n}面。', fast: '{beginner}を{s}秒以内にクリアしよう。',
    yourBest: 'ベストは{t}秒。', games: '{need}面遊ぼう。今は{n}面。',
    tipFlag: '旗モードで、確かな地雷に旗を立てよう。', tipEasier: '地雷が少ない{beginner}を試そう。',
    tipNumber: '旗がそろった数字を探して、タップしよう。',
    names: ['初プレイ', '{beginner}クリア', '3面クリア', '1分以内', '{intermediate}クリア', '10面クリア', '{expert}クリア', '25面プレイ'],
  },
  ko: {
    goal: '다음 목표', prizes: '내 상', open: '상 보기', close: '상 닫기',
    count: '상 {m}개 중 {n}개', yours: '{name}, 획득', along: '{name}, {have}/{need}',
    newPrize: '새 상: {name}', playOn: '계속 즐기며 최고 기록을 깨 보세요.',
    firstGame: '아무 단계에서 한 판을 끝까지 해 보세요.', winLevel: '{level} 한 판을 깨 보세요.', winMiddle: '{intermediate} 한 판을 깨 보세요.',
    wins: '{need}판을 깨 보세요. 지금 {n}판이에요.', fast: '{beginner}을 {s}초 안에 깨 보세요.',
    yourBest: '최고 기록은 {t}초예요.', games: '{need}판을 해 보세요. 지금 {n}판이에요.',
    tipFlag: '깃발 모드로 확실한 지뢰에 표시하세요.', tipEasier: '지뢰가 적은 {beginner}을 해 보세요.',
    tipNumber: '깃발이 다 꽂힌 숫자를 찾아 눌러 보세요.',
    names: ['첫 판', '{beginner} 클리어', '3판 클리어', '1분 안에', '{intermediate} 클리어', '10판 클리어', '{expert} 클리어', '25판 플레이'],
  },
  id: {
    goal: 'Target berikutnya', prizes: 'Hadiahmu', open: 'Lihat hadiah', close: 'Tutup hadiah',
    count: '{n} dari {m} hadiah', yours: '{name}, milikmu', along: '{name}, {have} dari {need}',
    newPrize: 'Hadiah baru: {name}.', playOn: 'Main terus dan pecahkan rekormu.',
    firstGame: 'Selesaikan satu papan di level mana saja.', winLevel: 'Bersihkan satu papan di {level}.', winMiddle: 'Bersihkan satu papan di {intermediate}.',
    wins: 'Bersihkan {need} papan. Kamu sudah {n}.', fast: 'Bersihkan {beginner} dalam kurang dari {s} detik.',
    yourBest: 'Rekormu {t} dtk.', games: 'Mainkan {need} papan. Kamu sudah main {n}.',
    tipFlag: 'Pakai mode Bendera untuk menandai ranjau yang pasti.', tipEasier: 'Coba {beginner}, ranjaunya lebih sedikit.',
    tipNumber: 'Cari angka yang benderanya sudah lengkap, lalu ketuk.',
    names: ['Papan pertama', '{beginner} bersih', 'Tiga papan bersih', 'Kurang dari semenit', '{intermediate} bersih', 'Sepuluh papan bersih', '{expert} bersih', 'Dua puluh lima papan'],
  },
  vi: {
    goal: 'Mục tiêu tiếp theo', prizes: 'Giải thưởng của bạn', open: 'Xem giải thưởng', close: 'Ẩn giải thưởng',
    count: '{n} trên {m} giải', yours: '{name}, đã có', along: '{name}, {have} trên {need}',
    newPrize: 'Giải mới: {name}.', playOn: 'Cứ chơi tiếp và phá kỷ lục của bạn.',
    firstGame: 'Chơi hết một bàn ở mức bất kỳ.', winLevel: 'Dò sạch một bàn ở mức {level}.', winMiddle: 'Dò sạch một bàn ở mức {intermediate}.',
    wins: 'Dò sạch {need} bàn. Bạn đã sạch {n}.', fast: 'Dò sạch mức {beginner} dưới {s} giây.',
    yourBest: 'Kỷ lục của bạn là {t} giây.', games: 'Chơi {need} bàn. Bạn đã chơi {n}.',
    tipFlag: 'Dùng chế độ Cờ để cắm cờ lên mìn chắc chắn.', tipEasier: 'Thử mức {beginner}, ít mìn hơn.',
    tipNumber: 'Tìm số đã cắm đủ cờ quanh nó, rồi chạm vào.',
    names: ['Bàn đầu tiên', '{beginner} sạch', 'Ba bàn sạch', 'Dưới một phút', '{intermediate} sạch', 'Mười bàn sạch', '{expert} sạch', 'Hai mươi lăm bàn'],
  },
});

const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));






export const PRIZES = Object.freeze([
  { id: 'first-board', need: 1, have: (r) => r.played, goal: (W) => W.firstGame },
  { id: 'beginner', need: 1, have: (r) => r.beginnerWins, goal: (W) => fill(W.winLevel, { level: W.beginner }) },
  { id: 'three-clears', need: 3, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  {
    id: 'fast', need: 1, have: (r) => (r.beginnerMs && r.beginnerMs < FAST_MS ? 1 : 0),
    goal: (W, r) => {
      const ask = fill(W.fast, { s: FAST_MS / 1000 });
      return r.beginnerMs ? `${ask} ${fill(W.yourBest, { t: (r.beginnerMs / 1000).toFixed(1) })}` : ask;
    },
  },
  { id: 'intermediate', need: 1, have: (r) => r.intermediateWins, goal: (W) => W.winMiddle },
  { id: 'ten-clears', need: 10, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'expert', need: 1, have: (r) => r.expertWins, goal: (W) => fill(W.winLevel, { level: W.expert }) },
  { id: 'twenty-five', need: 25, have: (r) => r.played, goal: (W, r, p) => fill(W.games, { need: p.need, n: r.played }) },
]);





export function progressWords(lang, levels = {}) {
  const W = WORDS[lang] ?? WORDS.en;
  const lv = {
    beginner: levels.beginner ?? 'Beginner', intermediate: levels.intermediate ?? 'Intermediate', expert: levels.expert ?? 'Expert',
  };
  const out = { ...lv };
  for (const [k, v] of Object.entries(W)) out[k] = Array.isArray(v) ? v.map((s) => fill(s, lv)) : fill(v, lv);
  return out;
}


export function earnedPrizes(record, best) {
  const r = cleanRecord(record, best);
  return PRIZES.filter((p) => p.have(r) >= p.need).map((p) => p.id);
}

const nameOf = (W, p) => W.names[PRIZES.indexOf(p)];


export function newPrizes(W, before, after) {
  const had = new Set(earnedPrizes(before.record, before.best));
  const now = earnedPrizes(after.record, after.best);
  return PRIZES.filter((p) => !had.has(p.id) && now.includes(p.id)).map((p) => nameOf(W, p));
}


export const prizeCount = (W, record, best) => fill(W.count, { n: earnedPrizes(record, best).length, m: PRIZES.length });

const nextPrize = (r) => PRIZES.find((p) => p.have(r) < p.need) ?? null;


export function nextGoal(W, record, best) {
  const r = cleanRecord(record, best);
  const p = nextPrize(r);
  return p ? p.goal(W, r, p) : W.playOn;
}






export function goalFill(W, record, best) {
  const r = cleanRecord(record, best);
  const p = nextPrize(r);
  return { share: p ? Math.min(p.have(r), p.need) / p.need : 1, text: prizeCount(W, r) };
}


export function prizeLines(W, record, best) {
  const r = cleanRecord(record, best);
  return PRIZES.map((p) => {
    const have = Math.min(p.have(r), p.need);
    const name = nameOf(W, p);
    return have >= p.need ? fill(W.yours, { name }) : fill(W.along, { name, have, need: p.need });
  });
}

const LEVEL_FIELD = { beginner: 'beginnerWins', intermediate: 'intermediateWins', expert: 'expertWins' };






export function recordAfter(record, game) {
  const r = recordToSave(record);
  if (!game) return r;
  r.played += 1;
  if (game.won) {
    r.won += 1;
    const f = LEVEL_FIELD[game.level];
    if (f) r[f] += 1;
    r.lostInRow = 0;
  } else {
    r.lostInRow += 1;
  }
  return r;
}


export const HELP_AFTER = 2;






export function helpLines(W, record, level) {
  if (cleanRecord(record).lostInRow < HELP_AFTER) return [];
  return level === 'beginner' ? [W.tipFlag, W.tipNumber] : [W.tipEasier, W.tipFlag];
}
