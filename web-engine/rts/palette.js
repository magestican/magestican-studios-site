










































export const RELATION = Object.freeze({
  MINE: 'mine', ALLY: 'ally', ENEMY: 'enemy', NEUTRAL: 'neutral',
});










export const GROUND = Object.freeze({
  mine: Object.freeze([56, 196, 88]),
  ally: Object.freeze([62, 132, 214]),
  neutral: Object.freeze([148, 146, 136]),
  





  enemies: Object.freeze([
    Object.freeze([214, 58, 44]),
    Object.freeze([242, 140, 26]),
    Object.freeze([166, 77, 255]),
  ]),
});


export const GROUND_EDGE = Object.freeze({
  mine: '#7ff0a0',
  ally: '#8ec0ff',
  neutral: '#c2bfb0',
  enemies: Object.freeze(['#ff8a78', '#ffc06a', '#d0a0ff']),
});



















export const FACTION_COLOUR = Object.freeze({
  herd: '#7cff3a',
  yield: '#ff9a1f',
});

export const ALTERNATES = Object.freeze([
  '#22e5c8', '#b46bff', '#4aa8ff', '#ff4fd8',
]);


export function rgbOf(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}


export const hexInt = (hex) => parseInt(hex.replace('#', ''), 16);










export function channelGap(a, b) {
  const x = rgbOf(a);
  const y = rgbOf(b);
  return Math.max(Math.abs(x[0] - y[0]), Math.abs(x[1] - y[1]), Math.abs(x[2] - y[2]));
}


















function seatCount(factions) {
  if (Array.isArray(factions)) return factions.length;
  if (!factions || typeof factions !== 'object') return 0;
  let n = 0;
  for (const k of Object.keys(factions)) {
    const i = Number(k);
    if (Number.isInteger(i) && i >= n) n = i + 1;
  }
  return n;
}










export function playerColours(factions, custom = {}) {
  const out = [];
  const used = {};
  let alt = 0;
  const n = seatCount(factions);
  for (let seat = 0; seat < n; seat += 1) {
    const f = factions[seat];
    used[f] = (used[f] || 0) + 1;
    if (used[f] === 1) {
      out.push(custom[f] || FACTION_COLOUR[f] || FACTION_COLOUR.yield);
    } else {
      out.push(ALTERNATES[alt % ALTERNATES.length]);
      alt += 1;
    }
  }
  return out;
}


export function playerColour(seat, factions, custom = {}) {
  return playerColours(factions, custom)[seat] || FACTION_COLOUR.yield;
}







export function relationOf(owner, viewer, teams = null) {
  if (owner === null || owner === undefined) return RELATION.NEUTRAL;
  if (owner === viewer) return RELATION.MINE;
  if (teams && teams[owner] !== undefined && teams[owner] === teams[viewer]) return RELATION.ALLY;
  return RELATION.ENEMY;
}








export function enemyRank(owner, viewer, factions, teams = null) {
  let rank = 0;
  const n = seatCount(factions);
  for (let seat = 0; seat < n; seat += 1) {
    if (seat === owner) return rank;
    if (relationOf(seat, viewer, teams) === RELATION.ENEMY) rank += 1;
  }
  return rank;
}






export function groundColour(owner, viewer, factions, teams = null) {
  const relation = relationOf(owner, viewer, teams);
  if (relation === RELATION.ENEMY) {
    const r = enemyRank(owner, viewer, factions, teams);
    return {
      relation,
      rgb: GROUND.enemies[Math.min(r, GROUND.enemies.length - 1)],
      edge: GROUND_EDGE.enemies[Math.min(r, GROUND_EDGE.enemies.length - 1)],
    };
  }
  return { relation, rgb: GROUND[relation], edge: GROUND_EDGE[relation] };
}


export function washStyle(owner, viewer, factions, alpha, teams = null) {
  const c = groundColour(owner, viewer, factions, teams);
  return `rgba(${c.rgb[0]},${c.rgb[1]},${c.rgb[2]},${alpha})`;
}


















export const WASH_ALPHA = 0.26;






















export const NEUTRAL_WASH_ALPHA = 0.10;


export const washAlphaFor = (relation) => (
  relation === RELATION.NEUTRAL ? NEUTRAL_WASH_ALPHA : WASH_ALPHA
);
