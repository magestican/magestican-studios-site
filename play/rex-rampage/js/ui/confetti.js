


const WINDOW_MS = 200;
const LIFE_MS = 1200;
const MAX_LABELS = 6;



export const createConfetti = () => ({  labels: [] });






export function addHit(c, hit, tMs) {
  const key = `${hit.player}|${hit.id}`;
  const open = c.labels.find((l) => l.key === key && tMs - l.born < WINDOW_MS);
  if (open) {
    open.n += hit.n;
    open.text = `${open.name} ${open.n}`;
    open.last = tMs;
    return;
  }
  c.labels.push({ key, n: hit.n, name: hit.name, text: `${hit.name} ${hit.n}`, own: hit.own, pos: hit.pos, born: tMs, last: tMs });
  if (c.labels.length > MAX_LABELS * 4) c.labels.splice(0, c.labels.length - MAX_LABELS * 4);
}


export function liveLabels(c, tMs) {
  c.labels = c.labels.filter((l) => tMs - l.last < LIFE_MS);
  return c.labels.slice(-MAX_LABELS);
}
