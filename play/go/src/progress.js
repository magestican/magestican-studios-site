





















const n = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);


export function cleanRecord(record) {
  const r = record && typeof record === 'object' ? record : {};
  const mediumWins = n(r.mediumWins);
  const hardWins = n(r.hardWins);
  const won = Math.max(n(r.won), mediumWins + hardWins);
  return {
    played: Math.max(n(r.played), won, n(r.bigBoards)), won, mediumWins, hardWins, bigBoards: n(r.bigBoards),
    lostInRow: n(r.lostInRow),
  };
}

export const WORDS = Object.freeze({
  en: {
    goal: 'Next goal', prizes: 'Your prizes', open: 'See prizes', close: 'Hide prizes',
    count: '{n} of {m} prizes', yours: '{name}, yours', along: '{name}, {have} of {need}',
    newPrize: 'New prize, {name}.', playOn: 'Play on, and try {hard} on the biggest board.',
    firstGame: 'Finish a game against the computer.', firstWin: 'Win a game against the computer.',
    wins: 'Win {need} games. You have won {n}.', winLevel: 'Win a game on {level}.',
    bigBoard: 'Finish a game on a bigger board, 13x13 or 19x19.', games: 'Play {need} games. You have played {n}.',
    tipEasier: 'Try {easy} for a gentler game.', tipGuide: 'Use the {guide} to see groups with one liberty left.',
    tipCapture: 'Find a group of theirs with one liberty, then capture it.',
    names: ['First game', 'First win', 'Three wins', '{medium} win', 'Bigger board', 'Ten wins', '{hard} win', 'Twenty-five games'],
  },
  es: {
    goal: 'Próxima meta', prizes: 'Tus premios', open: 'Ver premios', close: 'Ocultar premios',
    count: '{n} de {m} premios', yours: '{name}, tuyo', along: '{name}, {have} de {need}',
    newPrize: 'Premio nuevo: {name}.', playOn: 'Sigue jugando y prueba {hard} en el tablero más grande.',
    firstGame: 'Termina una partida contra la computadora.', firstWin: 'Gana una partida contra la computadora.',
    wins: 'Gana {need} partidas. Llevas {n}.', winLevel: 'Gana una partida en {level}.',
    bigBoard: 'Termina una partida en un tablero más grande, 13x13 o 19x19.', games: 'Juega {need} partidas. Llevas {n} jugadas.',
    tipEasier: 'Prueba {easy} para una partida más tranquila.', tipGuide: 'Usa la {guide} para ver grupos con una sola libertad.',
    tipCapture: 'Busca un grupo rival con una sola libertad y captúralo.',
    names: ['Primera partida', 'Primera victoria', 'Tres victorias', 'Victoria en {medium}', 'Tablero grande', 'Diez victorias', 'Victoria en {hard}', 'Veinticinco partidas'],
  },
  pt: {
    goal: 'Próxima meta', prizes: 'Seus prêmios', open: 'Ver prêmios', close: 'Esconder prêmios',
    count: '{n} de {m} prêmios', yours: '{name}, seu', along: '{name}, {have} de {need}',
    newPrize: 'Prêmio novo: {name}.', playOn: 'Continue jogando e experimente o {hard} no maior tabuleiro.',
    firstGame: 'Termine uma partida contra o computador.', firstWin: 'Vença uma partida contra o computador.',
    wins: 'Vença {need} partidas. Você venceu {n}.', winLevel: 'Vença uma partida no {level}.',
    bigBoard: 'Termine uma partida num tabuleiro maior, 13x13 ou 19x19.', games: 'Jogue {need} partidas. Você jogou {n}.',
    tipEasier: 'Experimente o {easy} para uma partida mais leve.', tipGuide: 'Use o {guide} para ver grupos com uma só liberdade.',
    tipCapture: 'Procure um grupo do adversário com uma só liberdade e capture-o.',
    names: ['Primeira partida', 'Primeira vitória', 'Três vitórias', 'Vitória no {medium}', 'Tabuleiro maior', 'Dez vitórias', 'Vitória no {hard}', 'Vinte e cinco partidas'],
  },
  tl: {
    goal: 'Susunod na layunin', prizes: 'Mga premyo mo', open: 'Tingnan ang premyo', close: 'Itago ang premyo',
    count: '{n} sa {m} premyo', yours: '{name}, sa iyo na', along: '{name}, {have} sa {need}',
    newPrize: 'Bagong premyo: {name}.', playOn: 'Maglaro pa, at subukan ang {hard} sa pinakamalaking board.',
    firstGame: 'Tapusin ang isang laro laban sa computer.', firstWin: 'Manalo ng isang laro laban sa computer.',
    wins: 'Manalo ng {need} laro. Nanalo ka na ng {n}.', winLevel: 'Manalo ng isang laro sa {level}.',
    bigBoard: 'Tapusin ang isang laro sa mas malaking board, 13x13 o 19x19.', games: 'Maglaro ng {need} laro. Nakapaglaro ka na ng {n}.',
    tipEasier: 'Subukan ang {easy} para sa mas magaang laro.', tipGuide: 'Gamitin ang {guide} para makita ang grupong isa na lang ang liberty.',
    tipCapture: 'Humanap ng grupo ng kalaban na isa na lang ang liberty, saka ito kunin.',
    names: ['Unang laro', 'Unang panalo', 'Tatlong panalo', 'Panalo sa {medium}', 'Mas malaking board', 'Sampung panalo', 'Panalo sa {hard}', "Dalawampu't limang laro"],
  },
  ja: {
    goal: '次の目標', prizes: 'あなたの賞', open: '賞を見る', close: '賞を閉じる',
    count: '{m}個中{n}個の賞', yours: '{name}（獲得）', along: '{name}（{have}/{need}）',
    newPrize: '新しい賞：{name}', playOn: 'これからも打とう。19路で{hard}に挑もう。',
    firstGame: 'コンピュータと1局打ち終えよう。', firstWin: 'コンピュータに1局勝とう。',
    wins: '{need}局勝とう。今は{n}局。', winLevel: '{level}で1局勝とう。',
    bigBoard: '13路か19路の盤で1局打ち終えよう。', games: '{need}局打とう。今は{n}局。',
    tipEasier: '{easy}でゆったり打ってみよう。', tipGuide: '{guide}で、アタリの石を確かめよう。',
    tipCapture: 'アタリになった相手の石を取ろう。',
    names: ['初対局', '初勝利', '3勝', '{medium}で勝利', '大きな盤', '10勝', '{hard}で勝利', '25局'],
  },
  ko: {
    goal: '다음 목표', prizes: '내 상', open: '상 보기', close: '상 닫기',
    count: '상 {m}개 중 {n}개', yours: '{name}, 획득', along: '{name}, {have}/{need}',
    newPrize: '새 상: {name}', playOn: '계속 두면서 19줄에서 {hard}에 도전해 보세요.',
    firstGame: '컴퓨터와 한 판을 끝까지 둬 보세요.', firstWin: '컴퓨터를 한 판 이겨 보세요.',
    wins: '{need}판을 이겨 보세요. 지금 {n}판이에요.', winLevel: '{level}에서 한 판 이겨 보세요.',
    bigBoard: '13줄이나 19줄 바둑판에서 한 판을 끝까지 둬 보세요.', games: '{need}판을 둬 보세요. 지금 {n}판이에요.',
    tipEasier: '{easy}에서 편하게 둬 보세요.', tipGuide: '{guide}로 단수에 걸린 돌을 확인하세요.',
    tipCapture: '단수에 걸린 상대 돌을 따내 보세요.',
    names: ['첫 대국', '첫 승리', '3승', '{medium} 승리', '큰 바둑판', '10승', '{hard} 승리', '25판'],
  },
  id: {
    goal: 'Target berikutnya', prizes: 'Hadiahmu', open: 'Lihat hadiah', close: 'Tutup hadiah',
    count: '{n} dari {m} hadiah', yours: '{name}, milikmu', along: '{name}, {have} dari {need}',
    newPrize: 'Hadiah baru: {name}.', playOn: 'Main terus, dan coba {hard} di papan terbesar.',
    firstGame: 'Selesaikan satu permainan melawan komputer.', firstWin: 'Menangkan satu permainan melawan komputer.',
    wins: 'Menangkan {need} permainan. Kamu sudah menang {n}.', winLevel: 'Menangkan satu permainan di {level}.',
    bigBoard: 'Selesaikan satu permainan di papan lebih besar, 13x13 atau 19x19.', games: 'Mainkan {need} permainan. Kamu sudah main {n}.',
    tipEasier: 'Coba {easy} untuk permainan yang lebih santai.', tipGuide: 'Pakai {guide} untuk melihat kelompok yang tinggal satu kebebasan.',
    tipCapture: 'Cari kelompok lawan yang tinggal satu kebebasan, lalu tangkap.',
    names: ['Permainan pertama', 'Menang pertama', 'Tiga kemenangan', 'Menang di {medium}', 'Papan lebih besar', 'Sepuluh kemenangan', 'Menang di {hard}', 'Dua puluh lima permainan'],
  },
  vi: {
    goal: 'Mục tiêu tiếp theo', prizes: 'Giải thưởng của bạn', open: 'Xem giải thưởng', close: 'Ẩn giải thưởng',
    count: '{n} trên {m} giải', yours: '{name}, đã có', along: '{name}, {have} trên {need}',
    newPrize: 'Giải mới: {name}.', playOn: 'Cứ chơi tiếp, và thử mức {hard} trên bàn lớn nhất.',
    firstGame: 'Chơi hết một ván với máy.', firstWin: 'Thắng một ván với máy.',
    wins: 'Thắng {need} ván. Bạn đã thắng {n}.', winLevel: 'Thắng một ván ở mức {level}.',
    bigBoard: 'Chơi hết một ván trên bàn lớn hơn, 13x13 hoặc 19x19.', games: 'Chơi {need} ván. Bạn đã chơi {n}.',
    tipEasier: 'Thử mức {easy} để ván cờ nhẹ nhàng hơn.', tipGuide: 'Dùng {guide} để thấy nhóm quân chỉ còn một khí.',
    tipCapture: 'Tìm nhóm quân đối thủ chỉ còn một khí, rồi bắt nó.',
    names: ['Ván đầu tiên', 'Trận thắng đầu', 'Ba trận thắng', 'Thắng mức {medium}', 'Bàn lớn hơn', 'Mười trận thắng', 'Thắng mức {hard}', 'Hai mươi lăm ván'],
  },
  'zh-Hant': {
    goal: '下一個目標', prizes: '你的獎', open: '查看獎項', close: '收起獎項',
    count: '{m}個獎中的{n}個', yours: '{name}(已獲得)', along: '{name}({have}/{need})',
    newPrize: '新獎項:{name}', playOn: '繼續下吧,在19路挑戰{hard}難度。',
    firstGame: '和電腦下完一局。', firstWin: '贏電腦一局。',
    wins: '贏{need}局。你已贏了{n}局。', winLevel: '在{level}難度贏一局。',
    bigBoard: '在更大的棋盤(13路或19路)下完一局。', games: '下{need}局。你已下了{n}局。',
    tipEasier: '試試{easy}難度,下得輕鬆些。', tipGuide: '用{guide}看看只剩一口氣的棋。',
    tipCapture: '找到只剩一口氣的對方棋子,把它提掉。',
    names: ['第一局', '第一勝', '三勝', '{medium}難度勝', '大棋盤', '十勝', '{hard}難度勝', '二十五局'],
  },
  'zh-Hans': {
    goal: '下一个目标', prizes: '你的奖', open: '查看奖项', close: '收起奖项',
    count: '{m}个奖中的{n}个', yours: '{name}(已获得)', along: '{name}({have}/{need})',
    newPrize: '新奖项:{name}', playOn: '继续下吧,在19路挑战{hard}难度。',
    firstGame: '和电脑下完一局。', firstWin: '赢电脑一局。',
    wins: '赢{need}局。你已赢了{n}局。', winLevel: '在{level}难度赢一局。',
    bigBoard: '在更大的棋盘(13路或19路)下完一局。', games: '下{need}局。你已下了{n}局。',
    tipEasier: '试试{easy}难度,下得轻松些。', tipGuide: '用{guide}看看只剩一口气的棋。',
    tipCapture: '找到只剩一口气的对方棋子,把它提掉。',
    names: ['第一局', '第一胜', '三胜', '{medium}难度胜', '大棋盘', '十胜', '{hard}难度胜', '二十五局'],
  },
});

const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));






export const PRIZES = Object.freeze([
  { id: 'first-game', need: 1, have: (r) => r.played, goal: (W) => W.firstGame },
  { id: 'first-win', need: 1, have: (r) => r.won, goal: (W) => W.firstWin },
  { id: 'three-wins', need: 3, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'medium', need: 1, have: (r) => r.mediumWins, goal: (W) => fill(W.winLevel, { level: W.medium }) },
  { id: 'big-board', need: 1, have: (r) => r.bigBoards, goal: (W) => W.bigBoard },
  { id: 'ten-wins', need: 10, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'hard', need: 1, have: (r) => r.hardWins, goal: (W) => fill(W.winLevel, { level: W.hard }) },
  { id: 'twenty-five', need: 25, have: (r) => r.played, goal: (W, r, p) => fill(W.games, { need: p.need, n: r.played }) },
]);





export function progressWords(lang, page = {}) {
  const W = WORDS[lang] ?? WORDS.en;
  const lv = {
    easy: page.easy ?? 'Easy', medium: page.medium ?? 'Medium', hard: page.hard ?? 'Hard', guide: page.guide ?? 'Move guide',
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
  if (game.size === 13 || game.size === 19) r.bigBoards += 1;
  if (game.won) {
    r.won += 1;
    if (game.level === 'medium') r.mediumWins += 1;
    if (game.level === 'hard') r.hardWins += 1;
    r.lostInRow = 0;
  } else {
    r.lostInRow += 1;
  }
  return r;
}


export const HELP_AFTER = 2;






export function helpLines(W, record, level) {
  if (cleanRecord(record).lostInRow < HELP_AFTER) return [];
  return level === 'easy' ? [W.tipGuide, W.tipCapture] : [W.tipEasier, W.tipGuide];
}
