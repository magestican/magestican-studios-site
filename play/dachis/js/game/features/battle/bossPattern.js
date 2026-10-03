





export const OPEN_TIME = 1.8, OPEN_MULT = 1.6, GUARD_MULT = 0.3;
export const BOSS_PATTERNS = {
  ashlo: { move: 0, tell: 1.3, first: 4, every: 8, text: 'scrapes his foot...', sfx: 'stepStone', beats: 2,
    note: 'Ashlo scrapes his foot twice, then charges in a straight line. Step aside and hit him while he turns.' },
  leviathrum: { move: 2, tell: 1.5, first: 5, every: 9, text: 'ping... ping... ping...', sfx: 'blip', beats: 3,
    note: 'Leviathrum pings three times, then drops on you. Get out from under him; he is open when he lands.' },
  bramble: { move: 1, tell: 1.2, first: 4, every: 8, text: 'the air goes sweet...', sfx: 'hex', beats: 1,
    note: 'When the air goes sweet, Mother Bramble is about to rot your friend. Cure it, and strike while she breathes in.' },
  kingshade: { move: 1, tell: 1.6, first: 5, every: 9, text: 'crosses his fists...', sfx: 'guard', beats: 1, guarded: true,
    note: 'Kingshade crosses his fists: do not hit him then. He uncrosses them to bring them down. Dodge, then hit.' },
};
export const patternOf = (bossId) => BOSS_PATTERNS[bossId] || null;

export const patternDamageMult = (p, { tellT = 0, open = 0 } = {}) =>
  !p ? 1 : (tellT > 0 && p.guarded ? GUARD_MULT : open > 0 ? OPEN_MULT : 1);

export const tellBeats = (p) => Array.from({ length: p.beats }, (_, i) => (p.tell * 0.75 * i) / Math.max(1, p.beats - 1));



const READS = {
  ashlo: [ 
    (n) => `${n} is brave. ${n} is not ready. The Magma Hall, under the tube. Go and get hot.`,
    (n) => `Close. Close is how people get burned. More time in the Magma Hall. Go.`,
    (n) => `${n} will do. Do not make me come down that mountain after you.`],
  leviathrum: [ 
    (n) => `${n}? Look at it. Skin and fins. The far end of the Kelp Maze, and eat something first.`,
    (n) => `Better. Not fed, but better. The sparky ones in the maze will finish the job. He cannot stand a spark.`,
    (n) => `Now that is a dachi that has eaten. Go on, then. And come back for supper. Both of you.`],
  bramble: [ 
    (n) => `${n}... how many summers is that one? Not enough. Down in the roots of the Mother Tree, the dark ones... where was I. The roots.`,
    (n) => `Nearly. I had one like ${n}, fifty summers back. Nearly is when she got me. Mind the roots.`,
    (n) => `Hm. Hm. Yes. Go on, then. I will count while you are gone.`],
  kingshade: [ 
    (n) => `${n} against the king? I would not bet a fig on it. Up the cliff at the end of the jetty - the wind there owes me nothing. Use it.`,
    (n) => `Better odds. Not good odds. Another hour on the Gale Ledges and I might put a fig on ${n}.`,
    (n) => `I will put two figs on ${n}. Do not make me lose them.`],
};
export const READ_SHORT = 4, READ_CLOSE = 2;
export function partyRead(boss, leadName, short) {
  const r = READS[boss]; if (!r) return null;
  return r[short >= READ_SHORT ? 0 : short >= READ_CLOSE ? 1 : 2](leadName);
}
