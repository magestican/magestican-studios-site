























const n = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);


export function cleanRecord(record) {
  const r = record && typeof record === 'object' ? record : {};
  const won = n(r.won);
  const hardWins = Math.min(n(r.hardWins), won);
  return {
    played: Math.max(n(r.played), won), won, hardWins, longest: n(r.longest), lostInRow: n(r.lostInRow),
  };
}

export const WORDS = Object.freeze({
  en: {
    goal: 'Next goal', prizes: 'Your prizes', open: 'See prizes', close: 'Hide prizes',
    count: '{n} of {m} prizes', yours: '{name}, yours', along: '{name}, {have} of {need}',
    newPrize: 'New prize, {name}.', playOn: 'Play on as long as you like.',
    firstGame: 'Finish a game against the computer.', firstWin: 'Win a game against the computer.',
    chain: 'Make a chain of {need} words in one game.', longest: 'Your longest is {n}.',
    wins: 'Win {need} games. You have won {n}.', hardWin: 'Win a game on the {hard} level.',
    games: 'Play {need} games. You have played {n}.',
    tipEasier: 'Try the {easy} level, or a longer timer.', tipWord: 'Find a word that many words can follow.',
    names: ['First game', 'First win', 'Ten-word chain', 'Three wins', 'Hard win', 'Twenty-word chain', 'Ten wins', 'Twenty-five games'],
  },
  es: {
    goal: 'Próxima meta', prizes: 'Tus premios', open: 'Ver premios', close: 'Ocultar premios',
    count: '{n} de {m} premios', yours: '{name}, tuyo', along: '{name}, {have} de {need}',
    newPrize: 'Premio nuevo: {name}.', playOn: 'Sigue jugando todo lo que quieras.',
    firstGame: 'Termina una partida contra la computadora.', firstWin: 'Gana una partida contra la computadora.',
    chain: 'Haz una cadena de {need} palabras en una partida.', longest: 'Tu cadena más larga tiene {n}.',
    wins: 'Gana {need} partidas. Llevas {n} ganadas.', hardWin: 'Gana una partida en el nivel {hard}.',
    games: 'Juega {need} partidas. Llevas {n} jugadas.',
    tipEasier: 'Prueba el nivel {easy} o más tiempo.', tipWord: 'Busca una palabra a la que puedan seguir muchas.',
    names: ['Primera partida', 'Primera victoria', 'Cadena de diez', 'Tres victorias', 'Victoria en {hard}', 'Cadena de veinte', 'Diez victorias', 'Veinticinco partidas'],
  },
  pt: {
    goal: 'Próxima meta', prizes: 'Seus prêmios', open: 'Ver prêmios', close: 'Esconder prêmios',
    count: '{n} de {m} prêmios', yours: '{name}, seu', along: '{name}, {have} de {need}',
    newPrize: 'Prêmio novo: {name}.', playOn: 'Continue jogando quanto quiser.',
    firstGame: 'Termine uma partida contra o computador.', firstWin: 'Vença uma partida contra o computador.',
    chain: 'Faça uma corrente de {need} palavras numa partida.', longest: 'A sua mais longa tem {n}.',
    wins: 'Vença {need} partidas. Você venceu {n}.', hardWin: 'Vença uma partida no nível {hard}.',
    games: 'Jogue {need} partidas. Você jogou {n}.',
    tipEasier: 'Experimente o nível {easy} ou mais tempo.', tipWord: 'Procure uma palavra que muitas outras possam seguir.',
    names: ['Primeira partida', 'Primeira vitória', 'Corrente de dez', 'Três vitórias', 'Vitória no {hard}', 'Corrente de vinte', 'Dez vitórias', 'Vinte e cinco partidas'],
  },
  tl: {
    goal: 'Susunod na layunin', prizes: 'Mga premyo mo', open: 'Tingnan ang premyo', close: 'Itago ang premyo',
    count: '{n} sa {m} premyo', yours: '{name}, sa iyo na', along: '{name}, {have} sa {need}',
    newPrize: 'Bagong premyo: {name}.', playOn: "Maglaro pa hangga't gusto mo.",
    firstGame: 'Tapusin ang isang laro laban sa computer.', firstWin: 'Manalo ng isang laro laban sa computer.',
    chain: 'Gumawa ng dugtungan na {need} salita sa isang laro.', longest: 'Ang pinakamahaba mo ay {n}.',
    wins: 'Manalo ng {need} laro. Nanalo ka na ng {n}.', hardWin: 'Manalo ng isang laro sa {hard}.',
    games: 'Maglaro ng {need} laro. Nakapaglaro ka na ng {n}.',
    tipEasier: 'Subukan ang {easy}, o mas mahabang oras.', tipWord: 'Humanap ng salitang masusundan ng maraming salita.',
    names: ['Unang laro', 'Unang panalo', 'Sampung salita', 'Tatlong panalo', 'Panalo sa {hard}', 'Dalawampung salita', 'Sampung panalo', "Dalawampu't limang laro"],
  },
  ja: {
    goal: '次の目標', prizes: 'あなたの賞', open: '賞を見る', close: '賞を閉じる',
    count: '{m}個中{n}個の賞', yours: '{name}（獲得）', along: '{name}（{have}/{need}）',
    newPrize: '新しい賞：{name}', playOn: '好きなだけ遊び続けよう。',
    firstGame: 'コンピューターと1ゲーム最後まで遊ぼう。', firstWin: 'コンピューターに1回勝とう。',
    chain: '1ゲームで{need}語つなげよう。', longest: '最長は{n}語。',
    wins: '{need}回勝とう。今は{n}勝。', hardWin: '「{hard}」で1回勝とう。',
    games: '{need}ゲーム遊ぼう。今は{n}ゲーム。',
    tipEasier: '「{easy}」か、長めの制限時間を試そう。', tipWord: '後に続く言葉が多い言葉を探そう。',
    names: ['初ゲーム', '初勝利', '10語しりとり', '3勝', '{hard}で勝利', '20語しりとり', '10勝', '25ゲーム'],
  },
  ko: {
    goal: '다음 목표', prizes: '내 상', open: '상 보기', close: '상 닫기',
    count: '상 {m}개 중 {n}개', yours: '{name}, 획득', along: '{name}, {have}/{need}',
    newPrize: '새 상: {name}', playOn: '원하는 만큼 계속 즐기세요.',
    firstGame: '컴퓨터와 한 판을 끝까지 해 보세요.', firstWin: '컴퓨터를 한 번 이겨 보세요.',
    chain: '한 판에 {need}단어를 이어 보세요.', longest: '최고 기록은 {n}단어예요.',
    wins: '{need}번 이겨 보세요. 지금 {n}승이에요.', hardWin: '{hard} 단계에서 한 번 이겨 보세요.',
    games: '{need}판을 해 보세요. 지금 {n}판이에요.',
    tipEasier: '{easy} 단계나 더 긴 시간을 골라 보세요.', tipWord: '뒤에 올 단어가 많은 단어를 찾아보세요.',
    names: ['첫 판', '첫 승리', '열 단어 잇기', '3승', '{hard} 승리', '스무 단어 잇기', '10승', '25판'],
  },
  id: {
    goal: 'Target berikutnya', prizes: 'Hadiahmu', open: 'Lihat hadiah', close: 'Tutup hadiah',
    count: '{n} dari {m} hadiah', yours: '{name}, milikmu', along: '{name}, {have} dari {need}',
    newPrize: 'Hadiah baru: {name}.', playOn: 'Main terus sesukamu.',
    firstGame: 'Selesaikan satu permainan melawan komputer.', firstWin: 'Menangkan satu permainan melawan komputer.',
    chain: 'Buat rantai {need} kata dalam satu permainan.', longest: 'Rantai terpanjangmu {n} kata.',
    wins: 'Menangkan {need} permainan. Kamu sudah menang {n}.', hardWin: 'Menangkan satu permainan di level {hard}.',
    games: 'Mainkan {need} permainan. Kamu sudah main {n}.',
    tipEasier: 'Coba level {easy}, atau waktu yang lebih lama.', tipWord: 'Cari kata yang bisa disambung banyak kata.',
    names: ['Permainan pertama', 'Menang pertama', 'Rantai sepuluh', 'Tiga kemenangan', 'Menang di {hard}', 'Rantai dua puluh', 'Sepuluh kemenangan', 'Dua puluh lima main'],
  },
  vi: {
    goal: 'Mục tiêu tiếp theo', prizes: 'Giải thưởng của bạn', open: 'Xem giải thưởng', close: 'Ẩn giải thưởng',
    count: '{n} trên {m} giải', yours: '{name}, đã có', along: '{name}, {have} trên {need}',
    newPrize: 'Giải mới: {name}.', playOn: 'Cứ chơi tiếp bao lâu tùy thích.',
    firstGame: 'Chơi hết một ván với máy.', firstWin: 'Thắng máy một ván.',
    chain: 'Nối {need} từ trong một ván.', longest: 'Chuỗi dài nhất của bạn là {n}.',
    wins: 'Thắng {need} ván. Bạn đã thắng {n}.', hardWin: 'Thắng một ván ở mức {hard}.',
    games: 'Chơi {need} ván. Bạn đã chơi {n}.',
    tipEasier: 'Thử mức {easy}, hoặc thời gian dài hơn.', tipWord: 'Tìm từ mà nhiều từ có thể nối tiếp.',
    names: ['Ván đầu tiên', 'Thắng lần đầu', 'Chuỗi mười từ', 'Ba lần thắng', 'Thắng mức {hard}', 'Chuỗi hai mươi từ', 'Mười lần thắng', 'Hai mươi lăm ván'],
  },
});

const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));






export const PRIZES = Object.freeze([
  { id: 'first-game', need: 1, have: (r) => r.played, goal: (W) => W.firstGame },
  { id: 'first-win', need: 1, have: (r) => r.won, goal: (W) => W.firstWin },
  { id: 'ten-chain', need: 10, have: (r) => r.longest, chain: true },
  { id: 'three-wins', need: 3, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'hard-win', need: 1, have: (r) => r.hardWins, goal: (W) => W.hardWin },
  { id: 'twenty-chain', need: 20, have: (r) => r.longest, chain: true },
  { id: 'ten-wins', need: 10, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'twenty-five', need: 25, have: (r) => r.played, goal: (W, r, p) => fill(W.games, { need: p.need, n: r.played }) },
]);





export function progressWords(lang, levels = {}) {
  const W = WORDS[lang] ?? WORDS.en;
  const lv = { easy: levels.easy ?? 'Easy', hard: levels.hard ?? 'Hard' };
  const out = {};
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
  if (!p) return W.playOn;
  if (p.chain) {
    const ask = fill(W.chain, { need: p.need });
    return r.longest ? `${ask} ${fill(W.longest, { n: r.longest })}` : ask;
  }
  return p.goal(W, r, p);
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
  if (game.won) r.won += 1;
  if (game.won && game.vsBot && game.level === 'hard') r.hardWins += 1;
  r.longest = Math.max(r.longest, n(game.length));
  if (game.vsBot) r.lostInRow = game.won ? 0 : r.lostInRow + 1;
  return r;
}


export const HELP_AFTER = 2;






export function helpLines(W, record) {
  if (cleanRecord(record).lostInRow < HELP_AFTER) return [];
  return [W.tipEasier, W.tipWord];
}
