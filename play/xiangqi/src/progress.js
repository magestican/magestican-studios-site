




























const n = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);


export function cleanRecord(record) {
  const r = record && typeof record === 'object' ? record : {};
  const mediumWins = n(r.mediumWins);
  const hardWins = n(r.hardWins);
  const blackWins = n(r.blackWins);
  const won = Math.max(n(r.won), mediumWins + hardWins, blackWins);
  return {
    played: Math.max(n(r.played), won), won, mediumWins, hardWins, blackWins, lostInRow: n(r.lostInRow),
  };
}

export const WORDS = Object.freeze({
  en: {
    goal: 'Next goal', prizes: 'Your prizes', open: 'See prizes', close: 'Hide prizes',
    count: '{n} of {m} prizes', yours: '{name}, yours', along: '{name}, {have} of {need}',
    newPrize: 'New prize, {name}.', playOn: 'Play on, and try {hard} as {black}.',
    firstGame: 'Finish a game against the computer.', firstWin: 'Win a game against the computer.',
    wins: 'Win {need} games. You have won {n}.', winLevel: 'Win a game on {level}.',
    winBlack: 'Choose {black} and win a game.', games: 'Play {need} games. You have played {n}.',
    tipEasier: 'Try {easy} for a gentler game.', tipGuide: 'Turn on {guide} to see where each piece can go.',
    tipChariot: 'Bring a {chariot} out early. It is your strongest piece.',
    tipGeneral: 'Keep both {advisor} pieces beside your {general}.',
    names: ['First game', 'First win', 'Three wins', '{medium} win', 'Black win', 'Ten wins', '{hard} win', 'Twenty-five games'],
  },
  es: {
    goal: 'Próxima meta', prizes: 'Tus premios', open: 'Ver premios', close: 'Ocultar premios',
    count: '{n} de {m} premios', yours: '{name}, tuyo', along: '{name}, {have} de {need}',
    newPrize: 'Premio nuevo: {name}.', playOn: 'Sigue jugando y prueba {hard} con {black}.',
    firstGame: 'Termina una partida contra la computadora.', firstWin: 'Gana una partida contra la computadora.',
    wins: 'Gana {need} partidas. Llevas {n}.', winLevel: 'Gana una partida en {level}.',
    winBlack: 'Elige {black} y gana una partida.', games: 'Juega {need} partidas. Llevas {n} jugadas.',
    tipEasier: 'Prueba {easy} para una partida más tranquila.', tipGuide: 'Activa {guide} para ver adónde va cada pieza.',
    tipChariot: 'Saca pronto un {chariot}. Es tu pieza más fuerte.',
    tipGeneral: 'Deja los dos {advisor} junto a tu {general}.',
    names: ['Primera partida', 'Primera victoria', 'Tres victorias', 'Victoria en {medium}', 'Victoria con negras', 'Diez victorias', 'Victoria en {hard}', 'Veinticinco partidas'],
  },
  pt: {
    goal: 'Próxima meta', prizes: 'Seus prêmios', open: 'Ver prêmios', close: 'Esconder prêmios',
    count: '{n} de {m} prêmios', yours: '{name}, seu', along: '{name}, {have} de {need}',
    newPrize: 'Prêmio novo: {name}.', playOn: 'Continue jogando e experimente o {hard} com {black}.',
    firstGame: 'Termine uma partida contra o computador.', firstWin: 'Vença uma partida contra o computador.',
    wins: 'Vença {need} partidas. Você venceu {n}.', winLevel: 'Vença uma partida no {level}.',
    winBlack: 'Escolha {black} e vença uma partida.', games: 'Jogue {need} partidas. Você jogou {n}.',
    tipEasier: 'Experimente o {easy} para uma partida mais leve.', tipGuide: 'Ligue o {guide} para ver aonde cada peça vai.',
    tipChariot: 'Tire cedo uma {chariot}. É a sua peça mais forte.',
    tipGeneral: 'Mantenha os dois {advisor} ao lado do seu {general}.',
    names: ['Primeira partida', 'Primeira vitória', 'Três vitórias', 'Vitória no {medium}', 'Vitória com as pretas', 'Dez vitórias', 'Vitória no {hard}', 'Vinte e cinco partidas'],
  },
  tl: {
    goal: 'Susunod na layunin', prizes: 'Mga premyo mo', open: 'Tingnan ang premyo', close: 'Itago ang premyo',
    count: '{n} sa {m} premyo', yours: '{name}, sa iyo na', along: '{name}, {have} sa {need}',
    newPrize: 'Bagong premyo: {name}.', playOn: 'Maglaro pa, at subukan ang {hard} bilang {black}.',
    firstGame: 'Tapusin ang isang laro laban sa computer.', firstWin: 'Manalo ng isang laro laban sa computer.',
    wins: 'Manalo ng {need} laro. Nanalo ka na ng {n}.', winLevel: 'Manalo ng isang laro sa {level}.',
    winBlack: 'Piliin ang {black} at manalo ng isang laro.', games: 'Maglaro ng {need} laro. Nakapaglaro ka na ng {n}.',
    tipEasier: 'Subukan ang {easy} para sa mas magaang laro.', tipGuide: 'Buksan ang {guide} para makita kung saan pupunta ang bawat piyesa.',
    tipChariot: 'Ilabas agad ang isang {chariot}. Ito ang pinakamalakas mong piyesa.',
    tipGeneral: 'Panatilihin ang dalawang {advisor} sa tabi ng iyong {general}.',
    names: ['Unang laro', 'Unang panalo', 'Tatlong panalo', 'Panalo sa {medium}', 'Panalo bilang Itim', 'Sampung panalo', 'Panalo sa {hard}', "Dalawampu't limang laro"],
  },
  ja: {
    goal: '次の目標', prizes: 'あなたの賞', open: '賞を見る', close: '賞を閉じる',
    count: '{m}個中{n}個の賞', yours: '{name}（獲得）', along: '{name}（{have}/{need}）',
    newPrize: '新しい賞：{name}', playOn: 'これからも指そう。{black}で{hard}に挑もう。',
    firstGame: 'コンピュータと1局指し終えよう。', firstWin: 'コンピュータに1局勝とう。',
    wins: '{need}局勝とう。今は{n}局。', winLevel: '{level}で1局勝とう。',
    winBlack: '{black}を選んで1局勝とう。', games: '{need}局指そう。今は{n}局。',
    tipEasier: '{easy}でゆったり指してみよう。', tipGuide: '{guide}をオンにすると、駒の動ける所が見えます。',
    tipChariot: '{chariot}を早めに出そう。いちばん強い駒です。',
    tipGeneral: '2枚の{advisor}を{general}のそばに置いて守ろう。',
    names: ['初対局', '初勝利', '3勝', '{medium}で勝利', '黒で勝利', '10勝', '{hard}で勝利', '25局'],
  },
  ko: {
    goal: '다음 목표', prizes: '내 상', open: '상 보기', close: '상 닫기',
    count: '상 {m}개 중 {n}개', yours: '{name}, 획득', along: '{name}, {have}/{need}',
    newPrize: '새 상: {name}', playOn: '계속 두면서 {black}으로 {hard}에 도전해 보세요.',
    firstGame: '컴퓨터와 한 판을 끝까지 둬 보세요.', firstWin: '컴퓨터를 한 판 이겨 보세요.',
    wins: '{need}판을 이겨 보세요. 지금 {n}판이에요.', winLevel: '{level}에서 한 판 이겨 보세요.',
    winBlack: '{black}을 골라 한 판 이겨 보세요.', games: '{need}판을 둬 보세요. 지금 {n}판이에요.',
    tipEasier: '{easy}에서 편하게 둬 보세요.', tipGuide: '{guide}을 켜면 말이 갈 수 있는 곳이 보여요.',
    tipChariot: '{chariot}를 일찍 꺼내세요. 가장 강한 말이에요.',
    tipGeneral: '두 {advisor}를 {general} 곁에 두어 지키세요.',
    names: ['첫 대국', '첫 승리', '3승', '{medium} 승리', '검정 승리', '10승', '{hard} 승리', '25판'],
  },
  id: {
    goal: 'Target berikutnya', prizes: 'Hadiahmu', open: 'Lihat hadiah', close: 'Tutup hadiah',
    count: '{n} dari {m} hadiah', yours: '{name}, milikmu', along: '{name}, {have} dari {need}',
    newPrize: 'Hadiah baru: {name}.', playOn: 'Main terus, dan coba {hard} sebagai {black}.',
    firstGame: 'Selesaikan satu permainan melawan komputer.', firstWin: 'Menangkan satu permainan melawan komputer.',
    wins: 'Menangkan {need} permainan. Kamu sudah menang {n}.', winLevel: 'Menangkan satu permainan di {level}.',
    winBlack: 'Pilih {black} dan menangkan satu permainan.', games: 'Mainkan {need} permainan. Kamu sudah main {n}.',
    tipEasier: 'Coba {easy} untuk permainan yang lebih santai.', tipGuide: 'Nyalakan {guide} untuk melihat ke mana tiap bidak bisa melangkah.',
    tipChariot: 'Keluarkan satu {chariot} lebih awal. Itu bidak terkuatmu.',
    tipGeneral: 'Simpan kedua {advisor} di samping {general} kamu.',
    names: ['Permainan pertama', 'Menang pertama', 'Tiga kemenangan', 'Menang di {medium}', 'Menang sebagai Hitam', 'Sepuluh kemenangan', 'Menang di {hard}', 'Dua puluh lima permainan'],
  },
  vi: {
    goal: 'Mục tiêu tiếp theo', prizes: 'Giải thưởng của bạn', open: 'Xem giải thưởng', close: 'Ẩn giải thưởng',
    count: '{n} trên {m} giải', yours: '{name}, đã có', along: '{name}, {have} trên {need}',
    newPrize: 'Giải mới: {name}.', playOn: 'Cứ chơi tiếp, và thử mức {hard} khi cầm {black}.',
    firstGame: 'Chơi hết một ván với máy.', firstWin: 'Thắng một ván với máy.',
    wins: 'Thắng {need} ván. Bạn đã thắng {n}.', winLevel: 'Thắng một ván ở mức {level}.',
    winBlack: 'Chọn {black} và thắng một ván.', games: 'Chơi {need} ván. Bạn đã chơi {n}.',
    tipEasier: 'Thử mức {easy} để ván cờ nhẹ nhàng hơn.', tipGuide: 'Bật {guide} để thấy mỗi quân đi được đâu.',
    tipChariot: 'Ra {chariot} sớm. Đó là quân mạnh nhất của bạn.',
    tipGeneral: 'Giữ cả hai {advisor} bên cạnh {general}.',
    names: ['Ván đầu tiên', 'Trận thắng đầu', 'Ba trận thắng', 'Thắng mức {medium}', 'Thắng khi cầm Đen', 'Mười trận thắng', 'Thắng mức {hard}', 'Hai mươi lăm ván'],
  },
  'zh-Hant': {
    goal: '下一個目標', prizes: '你的獎章', open: '查看獎章', close: '收起獎章',
    count: '{m}個獎章中的{n}個', yours: '{name}（已獲得）', along: '{name}（{have}/{need}）',
    newPrize: '新獎章：{name}', playOn: '繼續下棋，試試執{black}挑戰{hard}。',
    firstGame: '和電腦下完一局。', firstWin: '贏電腦一局。',
    wins: '贏{need}局。你已經贏了{n}局。', winLevel: '在{level}贏一局。',
    winBlack: '選擇{black}並贏一局。', games: '下{need}局。你已經下了{n}局。',
    tipEasier: '試試{easy}，下得輕鬆一點。', tipGuide: '打開{guide}，就能看到每個棋子能走到哪裡。',
    tipChariot: '早點出{chariot}。它是你最強的棋子。',
    tipGeneral: '把兩個{advisor}留在{general}身旁。',
    names: ['第一局', '首勝', '三勝', '{medium}勝利', '黑方勝利', '十勝', '{hard}勝利', '二十五局'],
  },
  'zh-Hans': {
    goal: '下一个目标', prizes: '你的奖章', open: '查看奖章', close: '收起奖章',
    count: '{m}个奖章中的{n}个', yours: '{name}（已获得）', along: '{name}（{have}/{need}）',
    newPrize: '新奖章：{name}', playOn: '继续下棋，试试执{black}挑战{hard}。',
    firstGame: '和电脑下完一局。', firstWin: '赢电脑一局。',
    wins: '赢{need}局。你已经赢了{n}局。', winLevel: '在{level}赢一局。',
    winBlack: '选择{black}并赢一局。', games: '下{need}局。你已经下了{n}局。',
    tipEasier: '试试{easy}，下得轻松一点。', tipGuide: '打开{guide}，就能看到每个棋子能走到哪里。',
    tipChariot: '早点出{chariot}。它是你最强的棋子。',
    tipGeneral: '把两个{advisor}留在{general}身旁。',
    names: ['第一局', '首胜', '三胜', '{medium}胜利', '黑方胜利', '十胜', '{hard}胜利', '二十五局'],
  },
});

const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));






export const PRIZES = Object.freeze([
  { id: 'first-game', need: 1, have: (r) => r.played, goal: (W) => W.firstGame },
  { id: 'first-win', need: 1, have: (r) => r.won, goal: (W) => W.firstWin },
  { id: 'three-wins', need: 3, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'medium', need: 1, have: (r) => r.mediumWins, goal: (W) => fill(W.winLevel, { level: W.medium }) },
  { id: 'black', need: 1, have: (r) => r.blackWins, goal: (W) => W.winBlack },
  { id: 'ten-wins', need: 10, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'hard', need: 1, have: (r) => r.hardWins, goal: (W) => fill(W.winLevel, { level: W.hard }) },
  { id: 'twenty-five', need: 25, have: (r) => r.played, goal: (W, r, p) => fill(W.games, { need: p.need, n: r.played }) },
]);





export function progressWords(lang, page = {}) {
  const W = WORDS[lang] ?? WORDS.en;
  const lv = {
    easy: page.easy ?? 'Easy', medium: page.medium ?? 'Medium', hard: page.hard ?? 'Hard',
    black: page.sideBlack ?? 'Black (second)', guide: page.guide ?? 'Move guide',
    general: page.n_K ?? 'General', advisor: page.n_A ?? 'Advisor', chariot: page.n_R ?? 'Chariot',
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
    if (game.black) r.blackWins += 1;
    r.lostInRow = 0;
  } else if (game.result === 'lost') {
    r.lostInRow += 1;
  }
  return r;
}


export const HELP_AFTER = 2;







export function helpLines(W, record, level, guideOn) {
  if (cleanRecord(record).lostInRow < HELP_AFTER) return [];
  const first = level !== 'easy' ? W.tipEasier : guideOn ? W.tipChariot : W.tipGuide;
  return [first, W.tipGeneral];
}
