




























const n = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);


export const CLEAN_KINDS = Object.freeze(['limpa', 'ak', 'aa']);


export function cleanCanastras(line) {
  const c = line && typeof line === 'object' && line.canastras && typeof line.canastras === 'object' ? line.canastras : {};
  return CLEAN_KINDS.reduce((sum, k) => sum + n(c[k]), 0);
}


export function cleanRecord(record) {
  const r = record && typeof record === 'object' ? record : {};
  const mediumWins = n(r.mediumWins);
  const hardWins = n(r.hardWins);
  const cleanGames = n(r.cleanGames);
  const won = Math.max(n(r.won), mediumWins + hardWins);
  const played = Math.max(n(r.played), won, cleanGames);
  return { played, won, mediumWins, hardWins, cleanGames, lostInRow: n(r.lostInRow) };
}

export const WORDS = Object.freeze({
  en: {
    goal: 'Next goal', prizes: 'Your prizes', open: 'See prizes', close: 'Hide prizes',
    count: '{n} of {m} prizes', yours: '{name}, yours', along: '{name}, {have} of {need}',
    newPrize: 'New prize, {name}.', playOn: 'Play on, and try a game to 3000 on {hard}.',
    firstGame: 'Finish a game against the computer.', firstWin: 'Win a game against the computer.',
    wins: 'Win {need} games. You have won {n}.', winLevel: 'Win a game on {level}.',
    clean: 'Close a clean canastra, seven cards with no wild card.', games: 'Play {need} games. You have played {n}.',
    tipEasier: 'Try {easy} for a gentler game.',
    tipPile: 'Take the pile when its top card fits one of your jogos.',
    tipClean: 'Build a clean canastra first. Your team cannot go out without one.',
    names: ['First game', 'First win', 'Three wins', '{medium} win', '{clean}', 'Ten wins', '{hard} win', 'Twenty-five games'],
  },
  es: {
    goal: 'Próxima meta', prizes: 'Tus premios', open: 'Ver premios', close: 'Ocultar premios',
    count: '{n} de {m} premios', yours: '{name}, tuyo', along: '{name}, {have} de {need}',
    newPrize: 'Premio nuevo: {name}.', playOn: 'Sigue jugando y prueba una partida a 3000 en {hard}.',
    firstGame: 'Termina una partida contra la computadora.', firstWin: 'Gana una partida contra la computadora.',
    wins: 'Gana {need} partidas. Llevas {n}.', winLevel: 'Gana una partida en {level}.',
    clean: 'Cierra una canasta limpia: siete cartas sin comodín.', games: 'Juega {need} partidas. Llevas {n} jugadas.',
    tipEasier: 'Prueba {easy} para una partida más tranquila.',
    tipPile: 'Levanta el pozo cuando su carta de arriba encaje en uno de tus juegos.',
    tipClean: 'Cierra primero una canasta limpia. Sin ella, tu equipo no puede salir.',
    names: ['Primera partida', 'Primera victoria', 'Tres victorias', 'Victoria en {medium}', '{clean}', 'Diez victorias', 'Victoria en {hard}', 'Veinticinco partidas'],
  },
  pt: {
    goal: 'Próxima meta', prizes: 'Seus prêmios', open: 'Ver prêmios', close: 'Esconder prêmios',
    count: '{n} de {m} prêmios', yours: '{name}, seu', along: '{name}, {have} de {need}',
    newPrize: 'Prêmio novo: {name}.', playOn: 'Continue jogando e experimente uma partida a 3000 no {hard}.',
    firstGame: 'Termine uma partida contra o computador.', firstWin: 'Vença uma partida contra o computador.',
    wins: 'Vença {need} partidas. Você venceu {n}.', winLevel: 'Vença uma partida no {level}.',
    clean: 'Feche uma canastra limpa: sete cartas sem curinga.', games: 'Jogue {need} partidas. Você jogou {n}.',
    tipEasier: 'Experimente o {easy} para uma partida mais leve.',
    tipPile: 'Pegue o lixo quando a carta de cima encaixar num dos seus jogos.',
    tipClean: 'Feche primeiro uma canastra limpa. Sem ela, sua dupla não pode bater.',
    names: ['Primeira partida', 'Primeira vitória', 'Três vitórias', 'Vitória no {medium}', '{clean}', 'Dez vitórias', 'Vitória no {hard}', 'Vinte e cinco partidas'],
  },
  tl: {
    goal: 'Susunod na layunin', prizes: 'Mga premyo mo', open: 'Tingnan ang premyo', close: 'Itago ang premyo',
    count: '{n} sa {m} premyo', yours: '{name}, sa iyo na', along: '{name}, {have} sa {need}',
    newPrize: 'Bagong premyo: {name}.', playOn: 'Maglaro pa, at subukan ang laro hanggang 3000 sa {hard}.',
    firstGame: 'Tapusin ang isang laro laban sa computer.', firstWin: 'Manalo ng isang laro laban sa computer.',
    wins: 'Manalo ng {need} laro. Nanalo ka na ng {n}.', winLevel: 'Manalo ng isang laro sa {level}.',
    clean: 'Bumuo ng malinis na canastra: pitong baraha na walang wild.', games: 'Maglaro ng {need} laro. Nakapaglaro ka na ng {n}.',
    tipEasier: 'Subukan ang {easy} para sa mas magaang laro.',
    tipPile: 'Kunin ang tapunan kapag bagay ang nasa ibabaw sa isa sa mga jogo mo.',
    tipClean: 'Unahin ang malinis na canastra. Kung wala nito, hindi makalalabas ang koponan mo.',
    names: ['Unang laro', 'Unang panalo', 'Tatlong panalo', 'Panalo sa {medium}', '{clean}', 'Sampung panalo', 'Panalo sa {hard}', "Dalawampu't limang laro"],
  },
  ja: {
    goal: '次の目標', prizes: 'あなたの賞', open: '賞を見る', close: '賞を閉じる',
    count: '{m}個中{n}個の賞', yours: '{name}（獲得）', along: '{name}（{have}/{need}）',
    newPrize: '新しい賞：{name}', playOn: 'これからも遊ぼう。{hard}で3000点のゲームに挑もう。',
    firstGame: 'コンピュータとのゲームを最後まで遊ぼう。', firstWin: 'コンピュータとのゲームに1回勝とう。',
    wins: '{need}回勝とう。今は{n}回。', winLevel: '{level}で1回勝とう。',
    clean: 'ワイルドなしの7枚で、きれいなカナストラを完成させよう。', games: '{need}回ゲームをしよう。今は{n}回。',
    tipEasier: '{easy}でゆったり遊んでみよう。',
    tipPile: '捨て札の一番上が自分の役に合うときは、捨て札を取ろう。',
    tipClean: 'まずきれいなカナストラを作ろう。それがないとチームは上がれません。',
    names: ['初ゲーム', '初勝利', '3勝', '{medium}で勝利', '{clean}', '10勝', '{hard}で勝利', '25回ゲーム'],
  },
  ko: {
    goal: '다음 목표', prizes: '내 상', open: '상 보기', close: '상 닫기',
    count: '상 {m}개 중 {n}개', yours: '{name}, 획득', along: '{name}, {have}/{need}',
    newPrize: '새 상: {name}', playOn: '계속 즐기면서 {hard}에서 3000점 게임에 도전해 보세요.',
    firstGame: '컴퓨터와 게임 한 번을 끝까지 해 보세요.', firstWin: '컴퓨터를 한 번 이겨 보세요.',
    wins: '{need}번 이겨 보세요. 지금 {n}번이에요.', winLevel: '{level}에서 한 번 이겨 보세요.',
    clean: '와일드 없이 일곱 장으로 깨끗한 카나스트라를 완성해 보세요.', games: '{need}번 게임해 보세요. 지금 {n}번이에요.',
    tipEasier: '{easy}에서 편하게 해 보세요.',
    tipPile: '버린 카드 맨 위 카드가 내 조합에 맞으면 가져오세요.',
    tipClean: '먼저 깨끗한 카나스트라를 만드세요. 그게 없으면 팀이 나갈 수 없어요.',
    names: ['첫 게임', '첫 승리', '3승', '{medium} 승리', '{clean}', '10승', '{hard} 승리', '25번 게임'],
  },
  id: {
    goal: 'Target berikutnya', prizes: 'Hadiahmu', open: 'Lihat hadiah', close: 'Tutup hadiah',
    count: '{n} dari {m} hadiah', yours: '{name}, milikmu', along: '{name}, {have} dari {need}',
    newPrize: 'Hadiah baru: {name}.', playOn: 'Main terus, dan coba permainan sampai 3000 di {hard}.',
    firstGame: 'Selesaikan satu permainan melawan komputer.', firstWin: 'Menangkan satu permainan melawan komputer.',
    wins: 'Menangkan {need} permainan. Kamu sudah menang {n}.', winLevel: 'Menangkan satu permainan di {level}.',
    clean: 'Tutup canastra bersih: tujuh kartu tanpa kartu wild.', games: 'Mainkan {need} permainan. Kamu sudah main {n}.',
    tipEasier: 'Coba {easy} untuk permainan yang lebih santai.',
    tipPile: 'Ambil buangan saat kartu teratasnya cocok dengan salah satu jogo-mu.',
    tipClean: 'Tutup canastra bersih dulu. Tanpa itu, timmu tidak bisa keluar.',
    names: ['Permainan pertama', 'Menang pertama', 'Tiga kemenangan', 'Menang di {medium}', '{clean}', 'Sepuluh kemenangan', 'Menang di {hard}', 'Dua puluh lima permainan'],
  },
  vi: {
    goal: 'Mục tiêu tiếp theo', prizes: 'Giải thưởng của bạn', open: 'Xem giải thưởng', close: 'Ẩn giải thưởng',
    count: '{n} trên {m} giải', yours: '{name}, đã có', along: '{name}, {have} trên {need}',
    newPrize: 'Giải mới: {name}.', playOn: 'Cứ chơi tiếp, và thử một trận đến 3000 ở mức {hard}.',
    firstGame: 'Chơi hết một trận với máy.', firstWin: 'Thắng một trận với máy.',
    wins: 'Thắng {need} trận. Bạn đã thắng {n}.', winLevel: 'Thắng một trận ở mức {level}.',
    clean: 'Hoàn thành một canastra sạch: bảy lá, không có lá wild.', games: 'Chơi {need} trận. Bạn đã chơi {n}.',
    tipEasier: 'Thử mức {easy} để trận đấu nhẹ nhàng hơn.',
    tipPile: 'Lấy chồng bài bỏ khi lá trên cùng hợp với một bộ của bạn.',
    tipClean: 'Hãy làm một canastra sạch trước. Không có nó, đội bạn không thể hết bài.',
    names: ['Trận đầu tiên', 'Lần thắng đầu', 'Ba lần thắng', 'Thắng mức {medium}', '{clean}', 'Mười lần thắng', 'Thắng mức {hard}', 'Hai mươi lăm trận'],
  },
});

const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));






export const PRIZES = Object.freeze([
  { id: 'first-game', need: 1, have: (r) => r.played, goal: (W) => W.firstGame },
  { id: 'first-win', need: 1, have: (r) => r.won, goal: (W) => W.firstWin },
  { id: 'three-wins', need: 3, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'medium', need: 1, have: (r) => r.mediumWins, goal: (W) => fill(W.winLevel, { level: W.medium }) },
  { id: 'clean', need: 1, have: (r) => r.cleanGames, goal: (W) => W.clean },
  { id: 'ten-wins', need: 10, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'hard', need: 1, have: (r) => r.hardWins, goal: (W) => fill(W.winLevel, { level: W.hard }) },
  { id: 'twenty-five', need: 25, have: (r) => r.played, goal: (W, r, p) => fill(W.games, { need: p.need, n: r.played }) },
]);





export function progressWords(lang, page = {}) {
  const W = WORDS[lang] ?? WORDS.en;
  const lv = {
    easy: page.easy ?? 'Easy', medium: page.medium ?? 'Medium', hard: page.hard ?? 'Hard',
    clean: page.can_limpa ?? 'Clean canastra',
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
  if (game.clean) r.cleanGames += 1;
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
  return [level !== 'easy' ? W.tipEasier : W.tipPile, W.tipClean];
}
