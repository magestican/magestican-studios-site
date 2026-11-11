







const RECENT = 3;

export const emptySkyline = () => ({ lit: {}, recent: [] });


export function readSkyline(raw) {
  const sky = emptySkyline();
  if (!raw || typeof raw !== 'object') return sky;
  for (const [id, best] of Object.entries(raw.lit ?? {})) {
    if (Number.isInteger(best) && best >= 0) sky.lit[id] = best;
  }
  if (Array.isArray(raw.recent)) {
    sky.recent = raw.recent
      .filter((r) => r && typeof r.rival === 'string' && typeof r.won === 'boolean')
      .slice(-RECENT)
      .map(({ rival, won }) => ({ rival, won }));
  }
  return sky;
}


export function recordResult(sky, { towerId, rival, won, rivals }) {
  const lit = { ...sky.lit };
  const rank = rivals.indexOf(rival);
  if (won && rank >= 0) lit[towerId] = Math.max(lit[towerId] ?? -1, rank);
  const recent = [...sky.recent, { rival, won: !!won }].slice(-RECENT);
  return { lit, recent };
}

const isLit = (sky, id) => id in sky.lit;


export function nextTower(sky, city, group) {
  const at = Math.max(0, city.findIndex(([g]) => g === group));
  const order = [...city.slice(at), ...city.slice(0, at)];
  for (const [, ids] of order) {
    const id = ids.find((t) => !isLit(sky, t));
    if (id) return id;
  }
  return null;
}

export const meters = (sky, city) => city.map(([group, ids]) => ({
  group, lit: ids.filter((id) => isLit(sky, id)).length, total: ids.length,
}));


export const PRIZES = (city) => [
  { id: 'first' },
  ...city.map(([group]) => ({ id: `size-${group}`, group })),
  { id: 'foreman' },
  { id: 'all' },
];

export function prizesFor(sky, city, rivals) {
  const ids = Object.keys(sky.lit);
  const top = rivals.length - 1;
  const earned = (p) => {
    if (p.id === 'first') return ids.length > 0;
    if (p.id === 'foreman') return Object.values(sky.lit).some((best) => best >= top);
    if (p.id === 'all') return city.every(([, towers]) => towers.every((t) => isLit(sky, t)));
    const towers = city.find(([g]) => g === p.group)?.[1] ?? [];
    return towers.length > 0 && towers.every((t) => isLit(sky, t));
  };
  return PRIZES(city).filter(earned).map((p) => p.id);
}

export function newPrizes(before, after, city, rivals) {
  const had = new Set(prizesFor(before, city, rivals));
  return prizesFor(after, city, rivals).filter((id) => !had.has(id));
}





export function rivalAdvice(sky, rival, rivals) {
  const at = rivals.indexOf(rival);
  const tail = (n) => sky.recent.slice(-n);
  const run = (n, won) => tail(n).length === n && tail(n).every((r) => r.rival === rival && r.won === won);
  if (at >= 0 && at < rivals.length - 1 && run(2, true)) return { kind: 'up', rival: rivals[at + 1] };
  if (at > 0 && run(3, false)) return { kind: 'down', rival: rivals[at - 1] };
  return null;
}
