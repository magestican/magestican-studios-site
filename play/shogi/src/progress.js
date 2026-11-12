



























const n = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);


export function cleanRecord(record) {
  const r = record && typeof record === 'object' ? record : {};
  const mediumWins = n(r.mediumWins);
  const hardWins = n(r.hardWins);
  const goteWins = n(r.goteWins);
  const won = Math.max(n(r.won), mediumWins + hardWins, goteWins);
  return {
    played: Math.max(n(r.played), won), won, mediumWins, hardWins, goteWins, lostInRow: n(r.lostInRow),
  };
}

export const WORDS = Object.freeze({
  en: {
    goal: 'Next goal', prizes: 'Your prizes', open: 'See prizes', close: 'Hide prizes',
    count: '{n} of {m} prizes', yours: '{name}, yours', along: '{name}, {have} of {need}',
    newPrize: 'New prize, {name}.', playOn: 'Play on, and try {hard} as {gote}.',
    firstGame: 'Finish a game against the computer.', firstWin: 'Win a game against the computer.',
    wins: 'Win {need} games. You have won {n}.', winLevel: 'Win a game on {level}.',
    winGote: 'Choose {gote} and win a game.', games: 'Play {need} games. You have played {n}.',
    tipEasier: 'Try {easy} for a gentler game.', tipGuide: 'Turn on {guide} to see where each piece can go.',
    tipDrop: 'Drop a piece you captured where it helps. It is yours now.',
    tipKing: 'Keep a gold and a silver beside your king.',
    names: ['First game', 'First win', 'Three wins', '{medium} win', 'Gote win', 'Ten wins', '{hard} win', 'Twenty-five games'],
  },
  es: {
    goal: 'Próxima meta', prizes: 'Tus premios', open: 'Ver premios', close: 'Ocultar premios',
    count: '{n} de {m} premios', yours: '{name}, tuyo', along: '{name}, {have} de {need}',
    newPrize: 'Premio nuevo: {name}.', playOn: 'Sigue jugando y prueba {hard} con {gote}.',
    firstGame: 'Termina una partida contra la computadora.', firstWin: 'Gana una partida contra la computadora.',
    wins: 'Gana {need} partidas. Llevas {n}.', winLevel: 'Gana una partida en {level}.',
    winGote: 'Elige {gote} y gana una partida.', games: 'Juega {need} partidas. Llevas {n} jugadas.',
    tipEasier: 'Prueba {easy} para una partida más tranquila.', tipGuide: 'Activa {guide} para ver adónde va cada pieza.',
    tipDrop: 'Una pieza que capturas es tuya. Suéltala donde ayude.',
    tipKing: 'Deja un general de oro y uno de plata junto a tu rey.',
    names: ['Primera partida', 'Primera victoria', 'Tres victorias', 'Victoria en {medium}', 'Victoria con gote', 'Diez victorias', 'Victoria en {hard}', 'Veinticinco partidas'],
  },
  pt: {
    goal: 'Próxima meta', prizes: 'Seus prêmios', open: 'Ver prêmios', close: 'Esconder prêmios',
    count: '{n} de {m} prêmios', yours: '{name}, seu', along: '{name}, {have} de {need}',
    newPrize: 'Prêmio novo: {name}.', playOn: 'Continue jogando e experimente o {hard} com {gote}.',
    firstGame: 'Termine uma partida contra o computador.', firstWin: 'Vença uma partida contra o computador.',
    wins: 'Vença {need} partidas. Você venceu {n}.', winLevel: 'Vença uma partida no {level}.',
    winGote: 'Escolha {gote} e vença uma partida.', games: 'Jogue {need} partidas. Você jogou {n}.',
    tipEasier: 'Experimente o {easy} para uma partida mais leve.', tipGuide: 'Ligue o {guide} para ver aonde cada peça vai.',
    tipDrop: 'Uma peça capturada é sua. Solte-a onde ajudar.',
    tipKing: 'Mantenha um general de ouro e um de prata ao lado do rei.',
    names: ['Primeira partida', 'Primeira vitória', 'Três vitórias', 'Vitória no {medium}', 'Vitória com gote', 'Dez vitórias', 'Vitória no {hard}', 'Vinte e cinco partidas'],
  },
  tl: {
    goal: 'Susunod na layunin', prizes: 'Mga premyo mo', open: 'Tingnan ang premyo', close: 'Itago ang premyo',
    count: '{n} sa {m} premyo', yours: '{name}, sa iyo na', along: '{name}, {have} sa {need}',
    newPrize: 'Bagong premyo: {name}.', playOn: 'Maglaro pa, at subukan ang {hard} bilang {gote}.',
    firstGame: 'Tapusin ang isang laro laban sa computer.', firstWin: 'Manalo ng isang laro laban sa computer.',
    wins: 'Manalo ng {need} laro. Nanalo ka na ng {n}.', winLevel: 'Manalo ng isang laro sa {level}.',
    winGote: 'Piliin ang {gote} at manalo ng isang laro.', games: 'Maglaro ng {need} laro. Nakapaglaro ka na ng {n}.',
    tipEasier: 'Subukan ang {easy} para sa mas magaang laro.', tipGuide: 'Buksan ang {guide} para makita kung saan pupunta ang bawat piyesa.',
    tipDrop: 'Sa iyo na ang piyesang nakuha mo. Ilapag ito kung saan ito makatutulong.',
    tipKing: 'Maglagay ng gold at silver sa tabi ng iyong hari.',
    names: ['Unang laro', 'Unang panalo', 'Tatlong panalo', 'Panalo sa {medium}', 'Panalo bilang gote', 'Sampung panalo', 'Panalo sa {hard}', "Dalawampu't limang laro"],
  },
  ja: {
    goal: '次の目標', prizes: 'あなたの賞', open: '賞を見る', close: '賞を閉じる',
    count: '{m}個中{n}個の賞', yours: '{name}（獲得）', along: '{name}（{have}/{need}）',
    newPrize: '新しい賞：{name}', playOn: 'これからも指そう。{gote}で{hard}に挑もう。',
    firstGame: 'コンピュータと1局指し終えよう。', firstWin: 'コンピュータに1局勝とう。',
    wins: '{need}局勝とう。今は{n}局。', winLevel: '{level}で1局勝とう。',
    winGote: '{gote}を選んで1局勝とう。', games: '{need}局指そう。今は{n}局。',
    tipEasier: '{easy}でゆったり指してみよう。', tipGuide: '{guide}をオンにすると、駒の動ける所が見えます。',
    tipDrop: '取った駒は自分の駒。役に立つ所に打とう。',
    tipKing: '玉のそばに金と銀を置いて守ろう。',
    names: ['初対局', '初勝利', '3勝', '{medium}で勝利', '後手で勝利', '10勝', '{hard}で勝利', '25局'],
  },
  ko: {
    goal: '다음 목표', prizes: '내 상', open: '상 보기', close: '상 닫기',
    count: '상 {m}개 중 {n}개', yours: '{name}, 획득', along: '{name}, {have}/{need}',
    newPrize: '새 상: {name}', playOn: '계속 두면서 {gote}로 {hard}에 도전해 보세요.',
    firstGame: '컴퓨터와 한 판을 끝까지 둬 보세요.', firstWin: '컴퓨터를 한 판 이겨 보세요.',
    wins: '{need}판을 이겨 보세요. 지금 {n}판이에요.', winLevel: '{level}에서 한 판 이겨 보세요.',
    winGote: '{gote}를 골라 한 판 이겨 보세요.', games: '{need}판을 둬 보세요. 지금 {n}판이에요.',
    tipEasier: '{easy}에서 편하게 둬 보세요.', tipGuide: '{guide}을 켜면 말이 갈 수 있는 곳이 보여요.',
    tipDrop: '잡은 말은 내 말이에요. 도움이 되는 곳에 내려놓으세요.',
    tipKing: '왕 옆에 금장과 은장을 두어 지키세요.',
    names: ['첫 대국', '첫 승리', '3승', '{medium} 승리', '후수 승리', '10승', '{hard} 승리', '25판'],
  },
  id: {
    goal: 'Target berikutnya', prizes: 'Hadiahmu', open: 'Lihat hadiah', close: 'Tutup hadiah',
    count: '{n} dari {m} hadiah', yours: '{name}, milikmu', along: '{name}, {have} dari {need}',
    newPrize: 'Hadiah baru: {name}.', playOn: 'Main terus, dan coba {hard} sebagai {gote}.',
    firstGame: 'Selesaikan satu permainan melawan komputer.', firstWin: 'Menangkan satu permainan melawan komputer.',
    wins: 'Menangkan {need} permainan. Kamu sudah menang {n}.', winLevel: 'Menangkan satu permainan di {level}.',
    winGote: 'Pilih {gote} dan menangkan satu permainan.', games: 'Mainkan {need} permainan. Kamu sudah main {n}.',
    tipEasier: 'Coba {easy} untuk permainan yang lebih santai.', tipGuide: 'Nyalakan {guide} untuk melihat ke mana tiap bidak bisa melangkah.',
    tipDrop: 'Bidak yang kamu tangkap jadi milikmu. Taruh di tempat yang membantu.',
    tipKing: 'Simpan jenderal emas dan perak di samping rajamu.',
    names: ['Permainan pertama', 'Menang pertama', 'Tiga kemenangan', 'Menang di {medium}', 'Menang sebagai gote', 'Sepuluh kemenangan', 'Menang di {hard}', 'Dua puluh lima permainan'],
  },
  vi: {
    goal: 'Mục tiêu tiếp theo', prizes: 'Giải thưởng của bạn', open: 'Xem giải thưởng', close: 'Ẩn giải thưởng',
    count: '{n} trên {m} giải', yours: '{name}, đã có', along: '{name}, {have} trên {need}',
    newPrize: 'Giải mới: {name}.', playOn: 'Cứ chơi tiếp, và thử mức {hard} khi đi {gote}.',
    firstGame: 'Chơi hết một ván với máy.', firstWin: 'Thắng một ván với máy.',
    wins: 'Thắng {need} ván. Bạn đã thắng {n}.', winLevel: 'Thắng một ván ở mức {level}.',
    winGote: 'Chọn {gote} và thắng một ván.', games: 'Chơi {need} ván. Bạn đã chơi {n}.',
    tipEasier: 'Thử mức {easy} để ván cờ nhẹ nhàng hơn.', tipGuide: 'Bật {guide} để thấy mỗi quân đi được đâu.',
    tipDrop: 'Quân bạn bắt được là của bạn. Thả nó vào chỗ có ích.',
    tipKing: 'Giữ một Kim tướng và một Ngân tướng bên cạnh vua.',
    names: ['Ván đầu tiên', 'Trận thắng đầu', 'Ba trận thắng', 'Thắng mức {medium}', 'Thắng khi đi sau', 'Mười trận thắng', 'Thắng mức {hard}', 'Hai mươi lăm ván'],
  },
  'zh-Hant': {
    goal: '下一個目標', prizes: '你的獎章', open: '查看獎章', close: '收起獎章',
    count: '{m}個獎章中的{n}個', yours: '{name}（已獲得）', along: '{name}（{have}/{need}）',
    newPrize: '新獎章：{name}', playOn: '繼續下棋，試試以{gote}挑戰{hard}。',
    firstGame: '和電腦下完一局。', firstWin: '贏電腦一局。',
    wins: '贏{need}局。你已經贏了{n}局。', winLevel: '在{level}贏一局。',
    winGote: '選擇{gote}並贏一局。', games: '下{need}局。你已經下了{n}局。',
    tipEasier: '試試{easy}，下得輕鬆一點。', tipGuide: '打開{guide}，就能看到每個棋子能走到哪裡。',
    tipDrop: '吃掉的棋子歸你所有，把它打在有用的地方。',
    tipKing: '在王將旁邊留一枚金將和一枚銀將。',
    names: ['第一局', '首勝', '三勝', '{medium}勝利', '後手勝利', '十勝', '{hard}勝利', '二十五局'],
  },
  'zh-Hans': {
    goal: '下一个目标', prizes: '你的奖章', open: '查看奖章', close: '收起奖章',
    count: '{m}个奖章中的{n}个', yours: '{name}（已获得）', along: '{name}（{have}/{need}）',
    newPrize: '新奖章：{name}', playOn: '继续下棋，试试以{gote}挑战{hard}。',
    firstGame: '和电脑下完一局。', firstWin: '赢电脑一局。',
    wins: '赢{need}局。你已经赢了{n}局。', winLevel: '在{level}赢一局。',
    winGote: '选择{gote}并赢一局。', games: '下{need}局。你已经下了{n}局。',
    tipEasier: '试试{easy}，下得轻松一点。', tipGuide: '打开{guide}，就能看到每个棋子能走到哪里。',
    tipDrop: '吃掉的棋子归你所有，把它打在有用的地方。',
    tipKing: '在王将旁边留一枚金将和一枚银将。',
    names: ['第一局', '首胜', '三胜', '{medium}胜利', '后手胜利', '十胜', '{hard}胜利', '二十五局'],
  },
});

const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));






export const PRIZES = Object.freeze([
  { id: 'first-game', need: 1, have: (r) => r.played, goal: (W) => W.firstGame },
  { id: 'first-win', need: 1, have: (r) => r.won, goal: (W) => W.firstWin },
  { id: 'three-wins', need: 3, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'medium', need: 1, have: (r) => r.mediumWins, goal: (W) => fill(W.winLevel, { level: W.medium }) },
  { id: 'gote', need: 1, have: (r) => r.goteWins, goal: (W) => W.winGote },
  { id: 'ten-wins', need: 10, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'hard', need: 1, have: (r) => r.hardWins, goal: (W) => fill(W.winLevel, { level: W.hard }) },
  { id: 'twenty-five', need: 25, have: (r) => r.played, goal: (W, r, p) => fill(W.games, { need: p.need, n: r.played }) },
]);





export function progressWords(lang, page = {}) {
  const W = WORDS[lang] ?? WORDS.en;
  const lv = {
    easy: page.easy ?? 'Easy', medium: page.medium ?? 'Medium', hard: page.hard ?? 'Hard',
    gote: page.sideGote ?? 'Second (gote)', guide: page.guide ?? 'Move guide',
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
    if (game.gote) r.goteWins += 1;
    r.lostInRow = 0;
  } else if (game.result === 'lost') {
    r.lostInRow += 1;
  }
  return r;
}


export const HELP_AFTER = 2;







export function helpLines(W, record, level, guideOn) {
  if (cleanRecord(record).lostInRow < HELP_AFTER) return [];
  const first = level !== 'easy' ? W.tipEasier : guideOn ? W.tipDrop : W.tipGuide;
  return [first, W.tipKing];
}
