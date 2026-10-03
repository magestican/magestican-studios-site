





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
