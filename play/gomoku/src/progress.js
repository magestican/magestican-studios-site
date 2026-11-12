


























const n = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);


export function cleanRecord(record) {
  const r = record && typeof record === 'object' ? record : {};
  const mediumWins = n(r.mediumWins);
  const hardWins = n(r.hardWins);
  const whiteWins = n(r.whiteWins);
  const won = Math.max(n(r.won), mediumWins + hardWins, whiteWins);
  return {
    played: Math.max(n(r.played), won), won, mediumWins, hardWins, whiteWins, lostInRow: n(r.lostInRow),
  };
}

export const WORDS = Object.freeze({
  en: {
    goal: 'Next goal', prizes: 'Your prizes', open: 'See prizes', close: 'Hide prizes',
    count: '{n} of {m} prizes', yours: '{name}, yours', along: '{name}, {have} of {need}',
    newPrize: 'New prize, {name}.', playOn: 'Play on, and try {hard} as {white}.',
    firstGame: 'Finish a game against the computer.', firstWin: 'Win a game against the computer.',
    wins: 'Win {need} games. You have won {n}.', winLevel: 'Win a game on {level}.',
    winWhite: 'Win a game as {white}. {white} moves second.', games: 'Play {need} games. You have played {n}.',
    tipEasier: 'Try {easy} for a gentler game.', tipBlock: 'Stop a row of three before it becomes four.',
    tipUndo: 'Use {undo} to take a move back and try another.',
    names: ['First game', 'First win', 'Three wins', '{medium} win', '{white} win', 'Ten wins', '{hard} win', 'Twenty-five games'],
  },
  es: {
    goal: 'Próxima meta', prizes: 'Tus premios', open: 'Ver premios', close: 'Ocultar premios',
    count: '{n} de {m} premios', yours: '{name}, tuyo', along: '{name}, {have} de {need}',
    newPrize: 'Premio nuevo: {name}.', playOn: 'Sigue jugando y prueba {hard} con {white}.',
    firstGame: 'Termina una partida contra la computadora.', firstWin: 'Gana una partida contra la computadora.',
    wins: 'Gana {need} partidas. Llevas {n}.', winLevel: 'Gana una partida en {level}.',
    winWhite: 'Gana una partida con {white}. Las {white} juegan después.', games: 'Juega {need} partidas. Llevas {n} jugadas.',
    tipEasier: 'Prueba {easy} para una partida más tranquila.', tipBlock: 'Bloquea una fila de tres antes de que sea de cuatro.',
    tipUndo: 'Usa {undo} para deshacer una jugada y probar otra.',
    names: ['Primera partida', 'Primera victoria', 'Tres victorias', 'Victoria en {medium}', 'Victoria con {white}', 'Diez victorias', 'Victoria en {hard}', 'Veinticinco partidas'],
  },
  pt: {
    goal: 'Próxima meta', prizes: 'Seus prêmios', open: 'Ver prêmios', close: 'Esconder prêmios',
    count: '{n} de {m} prêmios', yours: '{name}, seu', along: '{name}, {have} de {need}',
    newPrize: 'Prêmio novo: {name}.', playOn: 'Continue jogando e experimente o {hard} com {white}.',
    firstGame: 'Termine uma partida contra o computador.', firstWin: 'Vença uma partida contra o computador.',
    wins: 'Vença {need} partidas. Você venceu {n}.', winLevel: 'Vença uma partida no {level}.',
    winWhite: 'Vença uma partida com {white}. As {white} jogam depois.', games: 'Jogue {need} partidas. Você jogou {n}.',
    tipEasier: 'Experimente o {easy} para uma partida mais leve.', tipBlock: 'Bloqueie uma fila de três antes que vire quatro.',
    tipUndo: 'Use {undo} para voltar uma jogada e tentar outra.',
    names: ['Primeira partida', 'Primeira vitória', 'Três vitórias', 'Vitória no {medium}', 'Vitória com {white}', 'Dez vitórias', 'Vitória no {hard}', 'Vinte e cinco partidas'],
  },
  tl: {
    goal: 'Susunod na layunin', prizes: 'Mga premyo mo', open: 'Tingnan ang premyo', close: 'Itago ang premyo',
    count: '{n} sa {m} premyo', yours: '{name}, sa iyo na', along: '{name}, {have} sa {need}',
    newPrize: 'Bagong premyo: {name}.', playOn: 'Maglaro pa, at subukan ang {hard} bilang {white}.',
    firstGame: 'Tapusin ang isang laro laban sa computer.', firstWin: 'Manalo ng isang laro laban sa computer.',
    wins: 'Manalo ng {need} laro. Nanalo ka na ng {n}.', winLevel: 'Manalo ng isang laro sa {level}.',
    winWhite: 'Manalo ng isang laro bilang {white}. Pangalawang tumitira ang {white}.', games: 'Maglaro ng {need} laro. Nakapaglaro ka na ng {n}.',
    tipEasier: 'Subukan ang {easy} para sa mas magaang laro.', tipBlock: 'Harangan ang hanay na tatlo bago ito maging apat.',
    tipUndo: 'Gamitin ang {undo} para bawiin ang tira at sumubok ng iba.',
    names: ['Unang laro', 'Unang panalo', 'Tatlong panalo', 'Panalo sa {medium}', 'Panalo bilang {white}', 'Sampung panalo', 'Panalo sa {hard}', "Dalawampu't limang laro"],
  },
  ja: {
    goal: '次の目標', prizes: 'あなたの賞', open: '賞を見る', close: '賞を閉じる',
    count: '{m}個中{n}個の賞', yours: '{name}（獲得）', along: '{name}（{have}/{need}）',
    newPrize: '新しい賞：{name}', playOn: 'これからも打とう。{white}で{hard}に挑もう。',
    firstGame: 'コンピュータと1局打ち終えよう。', firstWin: 'コンピュータに1局勝とう。',
    wins: '{need}局勝とう。今は{n}局。', winLevel: '{level}で1局勝とう。',
    winWhite: '{white}で1局勝とう。{white}は後手。', games: '{need}局打とう。今は{n}局。',
    tipEasier: '{easy}でゆったり打ってみよう。', tipBlock: '三が四になる前に止めよう。',
    tipUndo: '{undo}で一手戻して、別の手を打ってみよう。',
    names: ['初対局', '初勝利', '3勝', '{medium}で勝利', '{white}で勝利', '10勝', '{hard}で勝利', '25局'],
  },
  ko: {
    goal: '다음 목표', prizes: '내 상', open: '상 보기', close: '상 닫기',
    count: '상 {m}개 중 {n}개', yours: '{name}, 획득', along: '{name}, {have}/{need}',
    newPrize: '새 상: {name}', playOn: '계속 두면서 {white}으로 {hard}에 도전해 보세요.',
    firstGame: '컴퓨터와 한 판을 끝까지 둬 보세요.', firstWin: '컴퓨터를 한 판 이겨 보세요.',
    wins: '{need}판을 이겨 보세요. 지금 {n}판이에요.', winLevel: '{level}에서 한 판 이겨 보세요.',
    winWhite: '{white}으로 한 판 이겨 보세요. {white}은 나중에 둬요.', games: '{need}판을 둬 보세요. 지금 {n}판이에요.',
    tipEasier: '{easy}에서 편하게 둬 보세요.', tipBlock: '삼이 사가 되기 전에 막아 보세요.',
    tipUndo: '{undo}로 한 수 물리고 다른 수를 둬 보세요.',
    names: ['첫 대국', '첫 승리', '3승', '{medium} 승리', '{white} 승리', '10승', '{hard} 승리', '25판'],
  },
  id: {
    goal: 'Target berikutnya', prizes: 'Hadiahmu', open: 'Lihat hadiah', close: 'Tutup hadiah',
    count: '{n} dari {m} hadiah', yours: '{name}, milikmu', along: '{name}, {have} dari {need}',
    newPrize: 'Hadiah baru: {name}.', playOn: 'Main terus, dan coba {hard} sebagai {white}.',
    firstGame: 'Selesaikan satu permainan melawan komputer.', firstWin: 'Menangkan satu permainan melawan komputer.',
    wins: 'Menangkan {need} permainan. Kamu sudah menang {n}.', winLevel: 'Menangkan satu permainan di {level}.',
    winWhite: 'Menangkan satu permainan sebagai {white}. {white} jalan kedua.', games: 'Mainkan {need} permainan. Kamu sudah main {n}.',
    tipEasier: 'Coba {easy} untuk permainan yang lebih santai.', tipBlock: 'Blokir deretan tiga sebelum menjadi empat.',
    tipUndo: 'Pakai {undo} untuk membatalkan langkah dan coba yang lain.',
    names: ['Permainan pertama', 'Menang pertama', 'Tiga kemenangan', 'Menang di {medium}', 'Menang sebagai {white}', 'Sepuluh kemenangan', 'Menang di {hard}', 'Dua puluh lima permainan'],
  },
  vi: {
    goal: 'Mục tiêu tiếp theo', prizes: 'Giải thưởng của bạn', open: 'Xem giải thưởng', close: 'Ẩn giải thưởng',
    count: '{n} trên {m} giải', yours: '{name}, đã có', along: '{name}, {have} trên {need}',
    newPrize: 'Giải mới: {name}.', playOn: 'Cứ chơi tiếp, và thử mức {hard} khi cầm quân {white}.',
    firstGame: 'Chơi hết một ván với máy.', firstWin: 'Thắng một ván với máy.',
    wins: 'Thắng {need} ván. Bạn đã thắng {n}.', winLevel: 'Thắng một ván ở mức {level}.',
    winWhite: 'Thắng một ván khi cầm quân {white}. Quân {white} đi sau.', games: 'Chơi {need} ván. Bạn đã chơi {n}.',
    tipEasier: 'Thử mức {easy} để ván cờ nhẹ nhàng hơn.', tipBlock: 'Chặn hàng ba trước khi nó thành hàng bốn.',
    tipUndo: 'Dùng {undo} để đi lại một nước và thử nước khác.',
    names: ['Ván đầu tiên', 'Trận thắng đầu', 'Ba trận thắng', 'Thắng mức {medium}', 'Thắng khi cầm quân {white}', 'Mười trận thắng', 'Thắng mức {hard}', 'Hai mươi lăm ván'],
  },
});

const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));






export const PRIZES = Object.freeze([
  { id: 'first-game', need: 1, have: (r) => r.played, goal: (W) => W.firstGame },
  { id: 'first-win', need: 1, have: (r) => r.won, goal: (W) => W.firstWin },
  { id: 'three-wins', need: 3, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'medium', need: 1, have: (r) => r.mediumWins, goal: (W) => fill(W.winLevel, { level: W.medium }) },
  { id: 'white', need: 1, have: (r) => r.whiteWins, goal: (W) => W.winWhite },
  { id: 'ten-wins', need: 10, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'hard', need: 1, have: (r) => r.hardWins, goal: (W) => fill(W.winLevel, { level: W.hard }) },
  { id: 'twenty-five', need: 25, have: (r) => r.played, goal: (W, r, p) => fill(W.games, { need: p.need, n: r.played }) },
]);





export function progressWords(lang, page = {}) {
  const W = WORDS[lang] ?? WORDS.en;
  const lv = {
    easy: page.easy ?? 'Easy', medium: page.medium ?? 'Medium', hard: page.hard ?? 'Hard',
    white: page.white ?? 'White', undo: page.undo ?? 'Undo',
  };
  const out = { ...lv };
  for (const [k, v] of Object.entries(W)) out[k] = Array.isArray(v) ? v.map((s) => fill(s, lv)) : fill(v, lv);
  return out;
}


export function earnedPrizes(record) {
  const r = cleanRecord(record);
  return PRIZES.filter((p) => p.have(r) >= p.need).map((p) => p.id);
}

const nameOf = (W, p) => W.names[PRIZES.indexOf(p)];


export function newPrizes(W, before, after) {
  const had = new Set(earnedPrizes(before));
  const now = earnedPrizes(after);
  return PRIZES.filter((p) => !had.has(p.id) && now.includes(p.id)).map((p) => nameOf(W, p));
}


export const prizeCount = (W, record) => fill(W.count, { n: earnedPrizes(record).length, m: PRIZES.length });

const nextPrize = (r) => PRIZES.find((p) => p.have(r) < p.need) ?? null;


export function nextGoal(W, record) {
  const r = cleanRecord(record);
  const p = nextPrize(r);
  return p ? p.goal(W, r, p) : W.playOn;
}


export function goalFill(W, record) {
  const r = cleanRecord(record);
  const p = nextPrize(r);
  return { share: p ? Math.min(p.have(r), p.need) / p.need : 1, text: prizeCount(W, r) };
}


export function prizeLines(W, record) {
  const r = cleanRecord(record);
  return PRIZES.map((p) => {
    const have = Math.min(p.have(r), p.need);
    const name = nameOf(W, p);
    return have >= p.need ? fill(W.yours, { name }) : fill(W.along, { name, have, need: p.need });
  });
}







export function recordAfter(record, game) {
  const r = cleanRecord(record);
  if (!game) return r;
  r.played += 1;
  if (game.result === 'won') {
    r.won += 1;
    if (game.level === 'medium') r.mediumWins += 1;
    if (game.level === 'hard') r.hardWins += 1;
    if (game.white) r.whiteWins += 1;
    r.lostInRow = 0;
  } else if (game.result === 'lost') {
    r.lostInRow += 1;
  }
  return r;
}


export const HELP_AFTER = 2;






export function helpLines(W, record, level) {
  if (cleanRecord(record).lostInRow < HELP_AFTER) return [];
  return level === 'easy' ? [W.tipUndo, W.tipBlock] : [W.tipEasier, W.tipBlock];
}
