




























const n = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);


export const BRIGHT_YAKU = Object.freeze(['goko', 'shiko', 'ameShiko', 'sanko']);


export function scoredBright(history, me) {
  return (Array.isArray(history) ? history : []).some((h) => h && h.winner === me
    && Array.isArray(h.yaku) && h.yaku.some((id) => BRIGHT_YAKU.includes(id)));
}


export function cleanRecord(record) {
  const r = record && typeof record === 'object' ? record : {};
  const mediumWins = n(r.mediumWins);
  const hardWins = n(r.hardWins);
  const brightGames = n(r.brightGames);
  const won = Math.max(n(r.won), mediumWins + hardWins);
  const played = Math.max(n(r.played), won, brightGames);
  return { played, won, mediumWins, hardWins, brightGames, lostInRow: n(r.lostInRow) };
}

export const WORDS = Object.freeze({
  en: {
    goal: 'Next goal', prizes: 'Your prizes', open: 'See prizes', close: 'Hide prizes',
    count: '{n} of {m} prizes', yours: '{name}, yours', along: '{name}, {have} of {need}',
    newPrize: 'New prize, {name}.', playOn: 'Play on, and try a long game on {hard}.',
    firstGame: 'Finish a game against the computer.', firstWin: 'Win a game against the computer.',
    wins: 'Win {need} games. You have won {n}.', winLevel: 'Win a game on {level}.',
    bright: 'Win a month with three bright cards or more.', games: 'Play {need} games. You have played {n}.',
    tipEasier: 'Try {easy} for a gentler game.',
    tipBrights: 'Look for bright cards in {pine}, {cherry}, {pampas}, {willow} and {paulownia}.',
    tipStop: "Stop and score while ahead. After {koikoi}, the computer's win counts double.",
    names: ['First game', 'First win', 'Three wins', '{medium} win', 'Bright yaku', 'Ten wins', '{hard} win', 'Twenty-five games'],
  },
  es: {
    goal: 'Próxima meta', prizes: 'Tus premios', open: 'Ver premios', close: 'Ocultar premios',
    count: '{n} de {m} premios', yours: '{name}, tuyo', along: '{name}, {have} de {need}',
    newPrize: 'Premio nuevo: {name}.', playOn: 'Sigue jugando y prueba una partida larga en {hard}.',
    firstGame: 'Termina una partida contra la computadora.', firstWin: 'Gana una partida contra la computadora.',
    wins: 'Gana {need} partidas. Llevas {n}.', winLevel: 'Gana una partida en {level}.',
    bright: 'Gana un mes con tres cartas de luz o más.', games: 'Juega {need} partidas. Llevas {n} jugadas.',
    tipEasier: 'Prueba {easy} para una partida más tranquila.',
    tipBrights: 'Busca las cartas de luz: {pine}, {cherry}, {pampas}, {willow} y {paulownia} tienen una cada uno.',
    tipStop: 'Si vas ganando, para y anota. Después de un {koikoi}, el mes que gana la computadora vale el doble.',
    names: ['Primera partida', 'Primera victoria', 'Tres victorias', 'Victoria en {medium}', 'Yaku de luces', 'Diez victorias', 'Victoria en {hard}', 'Veinticinco partidas'],
  },
  pt: {
    goal: 'Próxima meta', prizes: 'Seus prêmios', open: 'Ver prêmios', close: 'Esconder prêmios',
    count: '{n} de {m} prêmios', yours: '{name}, seu', along: '{name}, {have} de {need}',
    newPrize: 'Prêmio novo: {name}.', playOn: 'Continue jogando e experimente uma partida longa no {hard}.',
    firstGame: 'Termine uma partida contra o computador.', firstWin: 'Vença uma partida contra o computador.',
    wins: 'Vença {need} partidas. Você venceu {n}.', winLevel: 'Vença uma partida no {level}.',
    bright: 'Vença um mês com três cartas de luz ou mais.', games: 'Jogue {need} partidas. Você jogou {n}.',
    tipEasier: 'Experimente o {easy} para uma partida mais leve.',
    tipBrights: 'Fique de olho nas cartas de luz: {pine}, {cherry}, {pampas}, {willow} e {paulownia} têm uma cada.',
    tipStop: 'Se estiver na frente, pare e marque. Depois de um {koikoi}, o mês que o computador vence vale o dobro.',
    names: ['Primeira partida', 'Primeira vitória', 'Três vitórias', 'Vitória no {medium}', 'Yaku de luzes', 'Dez vitórias', 'Vitória no {hard}', 'Vinte e cinco partidas'],
  },
  tl: {
    goal: 'Susunod na layunin', prizes: 'Mga premyo mo', open: 'Tingnan ang premyo', close: 'Itago ang premyo',
    count: '{n} sa {m} premyo', yours: '{name}, sa iyo na', along: '{name}, {have} sa {need}',
    newPrize: 'Bagong premyo: {name}.', playOn: 'Maglaro pa, at subukan ang mahabang laro sa {hard}.',
    firstGame: 'Tapusin ang isang laro laban sa computer.', firstWin: 'Manalo ng isang laro laban sa computer.',
    wins: 'Manalo ng {need} laro. Nanalo ka na ng {n}.', winLevel: 'Manalo ng isang laro sa {level}.',
    bright: 'Manalo ng isang buwan gamit ang tatlo o higit pang maliwanag na baraha.', games: 'Maglaro ng {need} laro. Nakapaglaro ka na ng {n}.',
    tipEasier: 'Subukan ang {easy} para sa mas magaang laro.',
    tipBrights: 'Abangan ang maliwanag na baraha: may tig-isa ang {pine}, {cherry}, {pampas}, {willow} at {paulownia}.',
    tipStop: 'Kapag lamang ka, huminto at kumuha ng puntos. Pagkatapos ng {koikoi}, doble ang buwang mapanalunan ng computer.',
    names: ['Unang laro', 'Unang panalo', 'Tatlong panalo', 'Panalo sa {medium}', 'Maliwanag na yaku', 'Sampung panalo', 'Panalo sa {hard}', "Dalawampu't limang laro"],
  },
  ja: {
    goal: '次の目標', prizes: 'あなたの賞', open: '賞を見る', close: '賞を閉じる',
    count: '{m}個中{n}個の賞', yours: '{name}（獲得）', along: '{name}（{have}/{need}）',
    newPrize: '新しい賞：{name}', playOn: 'これからも遊ぼう。{hard}で長い対戦に挑もう。',
    firstGame: 'コンピュータと1回の対戦を最後まで遊ぼう。', firstWin: 'コンピュータとの対戦に1回勝とう。',
    wins: '{need}回勝とう。今は{n}回。', winLevel: '{level}で1回勝とう。',
    bright: '光札3枚以上の役で1か月勝とう。', games: '{need}回対戦しよう。今は{n}回。',
    tipEasier: '{easy}でゆったり遊んでみよう。',
    tipBrights: '光札を探そう。{pine}・{cherry}・{pampas}・{willow}・{paulownia}に1枚ずつあります。',
    tipStop: 'リードしたら上がって点を取ろう。{koikoi}の後にコンピュータが勝つと、その月は倍になります。',
    names: ['初対戦', '初勝利', '3勝', '{medium}で勝利', '光の役', '10勝', '{hard}で勝利', '25回対戦'],
  },
  ko: {
    goal: '다음 목표', prizes: '내 상', open: '상 보기', close: '상 닫기',
    count: '상 {m}개 중 {n}개', yours: '{name}, 획득', along: '{name}, {have}/{need}',
    newPrize: '새 상: {name}', playOn: '계속 즐기면서 {hard}에서 긴 대전에 도전해 보세요.',
    firstGame: '컴퓨터와 대전 한 번을 끝까지 해 보세요.', firstWin: '컴퓨터를 한 번 이겨 보세요.',
    wins: '{need}번 이겨 보세요. 지금 {n}번이에요.', winLevel: '{level}에서 한 번 이겨 보세요.',
    bright: '광 패 세 장 이상의 역으로 한 달을 이겨 보세요.', games: '{need}번 대전해 보세요. 지금 {n}번이에요.',
    tipEasier: '{easy}에서 편하게 해 보세요.',
    tipBrights: '광 패를 노리세요. {pine}, {cherry}, {pampas}, {willow}, {paulownia}에 한 장씩 있어요.',
    tipStop: '앞서 있을 때는 멈추고 점수를 받으세요. {koikoi} 뒤에 컴퓨터가 이기면 그 달은 두 배예요.',
    names: ['첫 대전', '첫 승리', '3승', '{medium} 승리', '광 역', '10승', '{hard} 승리', '25번 대전'],
  },
  id: {
    goal: 'Target berikutnya', prizes: 'Hadiahmu', open: 'Lihat hadiah', close: 'Tutup hadiah',
    count: '{n} dari {m} hadiah', yours: '{name}, milikmu', along: '{name}, {have} dari {need}',
    newPrize: 'Hadiah baru: {name}.', playOn: 'Main terus, dan coba permainan panjang di {hard}.',
    firstGame: 'Selesaikan satu permainan melawan komputer.', firstWin: 'Menangkan satu permainan melawan komputer.',
    wins: 'Menangkan {need} permainan. Kamu sudah menang {n}.', winLevel: 'Menangkan satu permainan di {level}.',
    bright: 'Menangkan satu bulan dengan tiga kartu terang atau lebih.', games: 'Mainkan {need} permainan. Kamu sudah main {n}.',
    tipEasier: 'Coba {easy} untuk permainan yang lebih santai.',
    tipBrights: 'Cari kartu terang: {pine}, {cherry}, {pampas}, {willow} dan {paulownia} masing-masing punya satu.',
    tipStop: 'Kalau kamu unggul, berhenti dan ambil skor. Setelah {koikoi}, bulan yang dimenangkan komputer dihitung dua kali.',
    names: ['Permainan pertama', 'Menang pertama', 'Tiga kemenangan', 'Menang di {medium}', 'Yaku terang', 'Sepuluh kemenangan', 'Menang di {hard}', 'Dua puluh lima permainan'],
  },
  vi: {
    goal: 'Mục tiêu tiếp theo', prizes: 'Giải thưởng của bạn', open: 'Xem giải thưởng', close: 'Ẩn giải thưởng',
    count: '{n} trên {m} giải', yours: '{name}, đã có', along: '{name}, {have} trên {need}',
    newPrize: 'Giải mới: {name}.', playOn: 'Cứ chơi tiếp, và thử một ván dài ở mức {hard}.',
    firstGame: 'Chơi hết một ván với máy.', firstWin: 'Thắng một ván với máy.',
    wins: 'Thắng {need} ván. Bạn đã thắng {n}.', winLevel: 'Thắng một ván ở mức {level}.',
    bright: 'Thắng một tháng với ba lá sáng trở lên.', games: 'Chơi {need} ván. Bạn đã chơi {n}.',
    tipEasier: 'Thử mức {easy} để ván bài nhẹ nhàng hơn.',
    tipBrights: 'Để ý các lá sáng: {pine}, {cherry}, {pampas}, {willow} và {paulownia} mỗi tháng có một lá.',
    tipStop: 'Khi đang dẫn, hãy dừng và lấy điểm. Sau khi gọi {koikoi}, tháng nào máy thắng sẽ được nhân đôi.',
    names: ['Ván đầu tiên', 'Trận thắng đầu', 'Ba trận thắng', 'Thắng mức {medium}', 'Yaku sáng', 'Mười trận thắng', 'Thắng mức {hard}', 'Hai mươi lăm ván'],
  },
  'zh-Hant': {
    goal: '下一個目標', prizes: '你的獎章', open: '查看獎章', close: '收起獎章',
    count: '{m}個獎章中的{n}個', yours: '{name}（已獲得）', along: '{name}（{have}/{need}）',
    newPrize: '新獎章：{name}', playOn: '繼續玩，試試在{hard}打一場長對局。',
    firstGame: '和電腦打完一場對局。', firstWin: '贏電腦一場。',
    wins: '贏{need}場。你已經贏了{n}場。', winLevel: '在{level}贏一場。',
    bright: '用三張以上的光札贏下一個月。', games: '打{need}場。你已經打了{n}場。',
    tipEasier: '試試{easy}，玩得輕鬆一點。',
    tipBrights: '留意光札：{pine}、{cherry}、{pampas}、{willow}和{paulownia}各有一張。',
    tipStop: '領先時就結束並得分。喊了{koikoi}之後，電腦贏的那個月會加倍。',
    names: ['第一場', '首勝', '三勝', '{medium}勝利', '光札役', '十勝', '{hard}勝利', '二十五場'],
  },
  'zh-Hans': {
    goal: '下一个目标', prizes: '你的奖章', open: '查看奖章', close: '收起奖章',
    count: '{m}个奖章中的{n}个', yours: '{name}（已获得）', along: '{name}（{have}/{need}）',
    newPrize: '新奖章：{name}', playOn: '继续玩，试试在{hard}打一场长对局。',
    firstGame: '和电脑打完一场对局。', firstWin: '赢电脑一场。',
    wins: '赢{need}场。你已经赢了{n}场。', winLevel: '在{level}赢一场。',
    bright: '用三张以上的光札赢下一个月。', games: '打{need}场。你已经打了{n}场。',
    tipEasier: '试试{easy}，玩得轻松一点。',
    tipBrights: '留意光札：{pine}、{cherry}、{pampas}、{willow}和{paulownia}各有一张。',
    tipStop: '领先时就结束并得分。喊了{koikoi}之后，电脑赢的那个月会加倍。',
    names: ['第一场', '首胜', '三胜', '{medium}胜利', '光札役', '十胜', '{hard}胜利', '二十五场'],
  },
});

const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));






export const PRIZES = Object.freeze([
  { id: 'first-game', need: 1, have: (r) => r.played, goal: (W) => W.firstGame },
  { id: 'first-win', need: 1, have: (r) => r.won, goal: (W) => W.firstWin },
  { id: 'three-wins', need: 3, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'medium', need: 1, have: (r) => r.mediumWins, goal: (W) => fill(W.winLevel, { level: W.medium }) },
  { id: 'bright', need: 1, have: (r) => r.brightGames, goal: (W) => W.bright },
  { id: 'ten-wins', need: 10, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'hard', need: 1, have: (r) => r.hardWins, goal: (W) => fill(W.winLevel, { level: W.hard }) },
  { id: 'twenty-five', need: 25, have: (r) => r.played, goal: (W, r, p) => fill(W.games, { need: p.need, n: r.played }) },
]);





export function progressWords(lang, page = {}) {
  const W = WORDS[lang] ?? WORDS.en;
  const lv = {
    easy: page.easy ?? 'Easy', medium: page.medium ?? 'Medium', hard: page.hard ?? 'Hard',
    koikoi: page.koikoi ?? 'Koi-koi',
    pine: page.m1 ?? 'Pine', cherry: page.m3 ?? 'Cherry', pampas: page.m8 ?? 'Pampas grass',
    willow: page.m11 ?? 'Willow', paulownia: page.m12 ?? 'Paulownia',
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
  if (game.bright) r.brightGames += 1;
  if (game.result === 'won') {
    r.won += 1;
    if (game.level === 'medium') r.mediumWins += 1;
    if (game.level === 'hard') r.hardWins += 1;
    r.lostInRow = 0;
  } else if (game.result === 'lost') {
    r.lostInRow += 1;
  }
  return r;
}


export const HELP_AFTER = 2;







export function helpLines(W, record, level) {
  if (cleanRecord(record).lostInRow < HELP_AFTER) return [];
  return [level !== 'easy' ? W.tipEasier : W.tipBrights, W.tipStop];
}
