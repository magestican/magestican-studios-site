






























const n = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);






export function trucoHandWon(hand, myTeam, teamOf) {
  if (!hand || !hand.over || hand.winner !== myTeam || typeof teamOf !== 'function') return false;
  return (hand.calls || []).some((c) => c && c.type === 'truco' && teamOf(c.seat) === myTeam);
}


export function cleanRecord(record) {
  const r = record && typeof record === 'object' ? record : {};
  const mediumWins = n(r.mediumWins);
  const hardWins = n(r.hardWins);
  const trucoGames = n(r.trucoGames);
  const won = Math.max(n(r.won), mediumWins + hardWins);
  const played = Math.max(n(r.played), won, trucoGames);
  return { played, won, mediumWins, hardWins, trucoGames, lostInRow: n(r.lostInRow) };
}

export const WORDS = Object.freeze({
  en: {
    goal: 'Next goal', prizes: 'Your prizes', open: 'See prizes', close: 'Hide prizes',
    count: '{n} of {m} prizes', yours: '{name}, yours', along: '{name}, {have} of {need}',
    newPrize: 'New prize, {name}.', playOn: 'Play on, and try a game to 30 on {hard}.',
    firstGame: 'Finish a game against the computer.', firstWin: 'Win a game against the computer.',
    wins: 'Win {need} games. You have won {n}.', winLevel: 'Win a game on {level}.',
    truco: 'Win a hand after your team calls {truco}.', games: 'Play {need} games. You have played {n}.',
    tipEasier: 'Try {easy} for a gentler game.',
    tipCalls: 'Say {noquiero} to a call when your cards are low.',
    tipFirst: 'Try to win the first baza. It settles a tied hand.',
    names: ['First game', 'First win', 'Three wins', '{medium} win', '{truco} hand', 'Ten wins', '{hard} win', 'Twenty-five games'],
  },
  es: {
    goal: 'Próxima meta', prizes: 'Tus premios', open: 'Ver premios', close: 'Ocultar premios',
    count: '{n} de {m} premios', yours: '{name}, tuyo', along: '{name}, {have} de {need}',
    newPrize: 'Premio nuevo: {name}.', playOn: 'Seguí jugando y probá una partida a 30 en {hard}.',
    firstGame: 'Terminá una partida contra la computadora.', firstWin: 'Ganá una partida contra la computadora.',
    wins: 'Ganá {need} partidas. Llevás {n}.', winLevel: 'Ganá una partida en {level}.',
    truco: 'Ganá una mano en la que tu equipo cantó {truco}.', games: 'Jugá {need} partidas. Llevás {n} jugadas.',
    tipEasier: 'Probá {easy} para una partida más tranquila.',
    tipCalls: 'Decí {noquiero} a un canto cuando tus cartas son bajas.',
    tipFirst: 'Tratá de ganar la primera baza. Define una mano empatada.',
    names: ['Primera partida', 'Primera victoria', 'Tres victorias', 'Victoria en {medium}', 'Mano de {truco}', 'Diez victorias', 'Victoria en {hard}', 'Veinticinco partidas'],
  },
  pt: {
    goal: 'Próxima meta', prizes: 'Seus prêmios', open: 'Ver prêmios', close: 'Esconder prêmios',
    count: '{n} de {m} prêmios', yours: '{name}, seu', along: '{name}, {have} de {need}',
    newPrize: 'Prêmio novo: {name}.', playOn: 'Continue jogando e experimente uma partida a 30 no {hard}.',
    firstGame: 'Termine uma partida contra o computador.', firstWin: 'Vença uma partida contra o computador.',
    wins: 'Vença {need} partidas. Você venceu {n}.', winLevel: 'Vença uma partida no {level}.',
    truco: 'Vença uma mão depois que sua dupla pedir {truco}.', games: 'Jogue {need} partidas. Você jogou {n}.',
    tipEasier: 'Experimente o {easy} para uma partida mais leve.',
    tipCalls: 'Diga {noquiero} a um pedido quando suas cartas forem baixas.',
    tipFirst: 'Tente ganhar a primeira rodada. Ela decide uma mão empatada.',
    names: ['Primeira partida', 'Primeira vitória', 'Três vitórias', 'Vitória no {medium}', 'Mão de {truco}', 'Dez vitórias', 'Vitória no {hard}', 'Vinte e cinco partidas'],
  },
  tl: {
    goal: 'Susunod na layunin', prizes: 'Mga premyo mo', open: 'Tingnan ang premyo', close: 'Itago ang premyo',
    count: '{n} sa {m} premyo', yours: '{name}, sa iyo na', along: '{name}, {have} sa {need}',
    newPrize: 'Bagong premyo: {name}.', playOn: 'Maglaro pa, at subukan ang laro hanggang 30 sa {hard}.',
    firstGame: 'Tapusin ang isang laro laban sa computer.', firstWin: 'Manalo ng isang laro laban sa computer.',
    wins: 'Manalo ng {need} laro. Nanalo ka na ng {n}.', winLevel: 'Manalo ng isang laro sa {level}.',
    truco: 'Manalo sa isang kamay matapos tumawag ng {truco} ang koponan mo.', games: 'Maglaro ng {need} laro. Nakapaglaro ka na ng {n}.',
    tipEasier: 'Subukan ang {easy} para sa mas magaang laro.',
    tipCalls: 'Sabihin ang {noquiero} sa tawag kapag mababa ang mga baraha mo.',
    tipFirst: 'Subukang manalo sa unang baza. Ito ang nagpapasya sa tablang kamay.',
    names: ['Unang laro', 'Unang panalo', 'Tatlong panalo', 'Panalo sa {medium}', 'Kamay ng {truco}', 'Sampung panalo', 'Panalo sa {hard}', "Dalawampu't limang laro"],
  },
  ja: {
    goal: '次の目標', prizes: 'あなたの賞', open: '賞を見る', close: '賞を閉じる',
    count: '{m}個中{n}個の賞', yours: '{name}（獲得）', along: '{name}（{have}/{need}）',
    newPrize: '新しい賞：{name}', playOn: 'これからも遊ぼう。{hard}で30点のゲームに挑もう。',
    firstGame: 'コンピュータとのゲームを最後まで遊ぼう。', firstWin: 'コンピュータとのゲームに1回勝とう。',
    wins: '{need}回勝とう。今は{n}回。', winLevel: '{level}で1回勝とう。',
    truco: 'チームが{truco}をコールした手に勝とう。', games: '{need}回ゲームをしよう。今は{n}回。',
    tipEasier: '{easy}でゆったり遊んでみよう。',
    tipCalls: '手札が弱いときは、コールに{noquiero}と答えよう。',
    tipFirst: '最初のバサを取ろう。引き分けの手はそれで決まります。',
    names: ['初ゲーム', '初勝利', '3勝', '{medium}で勝利', '{truco}の手', '10勝', '{hard}で勝利', '25回ゲーム'],
  },
  ko: {
    goal: '다음 목표', prizes: '내 상', open: '상 보기', close: '상 닫기',
    count: '상 {m}개 중 {n}개', yours: '{name}, 획득', along: '{name}, {have}/{need}',
    newPrize: '새 상: {name}', playOn: '계속 즐기면서 {hard}에서 30점 게임에 도전해 보세요.',
    firstGame: '컴퓨터와 게임 한 번을 끝까지 해 보세요.', firstWin: '컴퓨터를 한 번 이겨 보세요.',
    wins: '{need}번 이겨 보세요. 지금 {n}번이에요.', winLevel: '{level}에서 한 번 이겨 보세요.',
    truco: '우리 팀이 {truco}를 콜한 판에서 이겨 보세요.', games: '{need}번 게임해 보세요. 지금 {n}번이에요.',
    tipEasier: '{easy}에서 편하게 해 보세요.',
    tipCalls: '카드가 약하면 콜에 {noquiero}로 답하세요.',
    tipFirst: '첫 바사를 이겨 보세요. 비긴 판은 그걸로 정해져요.',
    names: ['첫 게임', '첫 승리', '3승', '{medium} 승리', '{truco} 판', '10승', '{hard} 승리', '25번 게임'],
  },
  id: {
    goal: 'Target berikutnya', prizes: 'Hadiahmu', open: 'Lihat hadiah', close: 'Tutup hadiah',
    count: '{n} dari {m} hadiah', yours: '{name}, milikmu', along: '{name}, {have} dari {need}',
    newPrize: 'Hadiah baru: {name}.', playOn: 'Main terus, dan coba permainan sampai 30 di {hard}.',
    firstGame: 'Selesaikan satu permainan melawan komputer.', firstWin: 'Menangkan satu permainan melawan komputer.',
    wins: 'Menangkan {need} permainan. Kamu sudah menang {n}.', winLevel: 'Menangkan satu permainan di {level}.',
    truco: 'Menangkan satu ronde setelah timmu memanggil {truco}.', games: 'Mainkan {need} permainan. Kamu sudah main {n}.',
    tipEasier: 'Coba {easy} untuk permainan yang lebih santai.',
    tipCalls: 'Jawab {noquiero} pada panggilan saat kartumu lemah.',
    tipFirst: 'Coba menangkan baza pertama. Itu menentukan ronde yang seri.',
    names: ['Permainan pertama', 'Menang pertama', 'Tiga kemenangan', 'Menang di {medium}', 'Ronde {truco}', 'Sepuluh kemenangan', 'Menang di {hard}', 'Dua puluh lima permainan'],
  },
  vi: {
    goal: 'Mục tiêu tiếp theo', prizes: 'Giải thưởng của bạn', open: 'Xem giải thưởng', close: 'Ẩn giải thưởng',
    count: '{n} trên {m} giải', yours: '{name}, đã có', along: '{name}, {have} trên {need}',
    newPrize: 'Giải mới: {name}.', playOn: 'Cứ chơi tiếp, và thử một trận đến 30 ở mức {hard}.',
    firstGame: 'Chơi hết một trận với máy.', firstWin: 'Thắng một trận với máy.',
    wins: 'Thắng {need} trận. Bạn đã thắng {n}.', winLevel: 'Thắng một trận ở mức {level}.',
    truco: 'Thắng một ván sau khi đội bạn gọi {truco}.', games: 'Chơi {need} trận. Bạn đã chơi {n}.',
    tipEasier: 'Thử mức {easy} để trận đấu nhẹ nhàng hơn.',
    tipCalls: 'Đáp {noquiero} khi bài của bạn thấp.',
    tipFirst: 'Cố thắng baza đầu tiên. Nó quyết định ván hòa.',
    names: ['Trận đầu tiên', 'Lần thắng đầu', 'Ba lần thắng', 'Thắng mức {medium}', 'Ván {truco}', 'Mười lần thắng', 'Thắng mức {hard}', 'Hai mươi lăm trận'],
  },
});

const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));






export const PRIZES = Object.freeze([
  { id: 'first-game', need: 1, have: (r) => r.played, goal: (W) => W.firstGame },
  { id: 'first-win', need: 1, have: (r) => r.won, goal: (W) => W.firstWin },
  { id: 'three-wins', need: 3, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'medium', need: 1, have: (r) => r.mediumWins, goal: (W) => fill(W.winLevel, { level: W.medium }) },
  { id: 'truco', need: 1, have: (r) => r.trucoGames, goal: (W) => W.truco },
  { id: 'ten-wins', need: 10, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'hard', need: 1, have: (r) => r.hardWins, goal: (W) => fill(W.winLevel, { level: W.hard }) },
  { id: 'twenty-five', need: 25, have: (r) => r.played, goal: (W, r, p) => fill(W.games, { need: p.need, n: r.played }) },
]);





export function progressWords(lang, page = {}) {
  const W = WORDS[lang] ?? WORDS.en;
  const lv = {
    easy: page.easy ?? 'Easy', medium: page.medium ?? 'Medium', hard: page.hard ?? 'Hard',
    truco: page.call_truco ?? 'Truco', noquiero: page.call_noquiero ?? 'No quiero',
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
  if (game.truco) r.trucoGames += 1;
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
  return [level !== 'easy' ? W.tipEasier : W.tipCalls, W.tipFirst];
}
