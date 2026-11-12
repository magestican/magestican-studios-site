
























export const STORE_KEY = 'splatbarn-record-v1';

const n = (v) => (Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);


export function cleanRecord(record) {
  const r = record && typeof record === 'object' ? record : {};
  const flagWins = n(r.flagWins);
  const hillWins = n(r.hillWins);
  const won = Math.max(n(r.won), flagWins + hillWins);
  const splatRounds = n(r.splatRounds);
  const played = Math.max(n(r.played), won, splatRounds);
  return { played, won, splatRounds, flagWins, hillWins, lostInRow: n(r.lostInRow) };
}


export const SPLATS_FOR_PRIZE = 5;

export const WORDS = Object.freeze({
  en: {
    goal: 'Next goal', prizes: 'Your prizes', open: 'See prizes', close: 'Hide prizes',
    count: '{n} of {m} prizes', yours: '{name}, yours', along: '{name}, {have} of {need}',
    newPrize: 'New prize, {name}.', playOn: 'Play on, and try a full match of bots.',
    firstRound: 'Finish a round against the bots.',
    firstWin: 'Win a round against the bots.',
    splats: 'Get five splats in one round.',
    flagWin: 'Win a round of Capture the Flag or One Flag.',
    hillWin: 'Win a round of King of the Hill.',
    wins: 'Win {need} rounds. You have won {n}.',
    rounds: 'Finish {need} rounds. You have played {n}.',
    tipFlag: 'Grab the flag, then run it home to your base.',
    tipHill: 'Stand on the hill to score. Bring a friend.',
    tipTeam: 'Keep close to your team. Lone animals get splatted first.',
    tipMove: 'Keep moving. Shots slide past a moving target.',
    names: ['First round', 'First win', 'Five splats', 'Flag win', 'Three wins', 'Hill win', 'Ten wins', 'Twenty-five rounds'],
  },
});

const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));





export const PRIZES = Object.freeze([
  { id: 'first-round', need: 1, have: (r) => r.played, goal: (W) => W.firstRound },
  { id: 'first-win', need: 1, have: (r) => r.won, goal: (W) => W.firstWin },
  { id: 'five-splats', need: 1, have: (r) => r.splatRounds, goal: (W) => W.splats },
  { id: 'flag-win', need: 1, have: (r) => r.flagWins, goal: (W) => W.flagWin },
  { id: 'three-wins', need: 3, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'hill-win', need: 1, have: (r) => r.hillWins, goal: (W) => W.hillWin },
  { id: 'ten-wins', need: 10, have: (r) => r.won, goal: (W, r, p) => fill(W.wins, { need: p.need, n: r.won }) },
  { id: 'twenty-five', need: 25, have: (r) => r.played, goal: (W, r, p) => fill(W.rounds, { need: p.need, n: r.played }) },
]);


export function progressWords(lang) {
  return WORDS[lang] ?? WORDS.en;
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

const FLAG_MODES = new Set(['ctf', 'oneflag']);











export function roundOutcome({ rows, winner = null, mode, hosting = false, startIds = null } = {}) {
  if (!hosting) return null;
  const all = Array.isArray(rows) ? rows.filter((r) => r && typeof r === 'object') : [];
  const me = all.find((r) => r.isMe);
  if (!me || !me.team) return null;
  if (all.some((r) => r !== me && !r.bot)) return null;
  if (!startIds || !new Set(startIds).has(me.id)) return null;
  const won = !!winner && winner === me.team;
  return { won, splats: n(me.kills), mode: String(mode ?? '') };
}





export function recordAfter(record, round) {
  const r = cleanRecord(record);
  if (!round) return r;
  r.played += 1;
  if (round.splats >= SPLATS_FOR_PRIZE) r.splatRounds += 1;
  if (round.won) {
    r.won += 1;
    if (FLAG_MODES.has(round.mode)) r.flagWins += 1;
    if (round.mode === 'koth') r.hillWins += 1;
    r.lostInRow = 0;
  } else {
    r.lostInRow += 1;
  }
  return r;
}


export const HELP_AFTER = 2;





export function helpLines(W, record, mode) {
  if (cleanRecord(record).lostInRow < HELP_AFTER) return [];
  const first = FLAG_MODES.has(mode) ? W.tipFlag : (mode === 'koth' ? W.tipHill : W.tipTeam);
  return [first, W.tipMove];
}
