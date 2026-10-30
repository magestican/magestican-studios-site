



export const FLUSH_MS = 200;





export const createLedger = () => ({});

const good = (n) => typeof n === 'number' && Number.isFinite(n) && n > 0;





export function mergeReport(ledger, playerId, report) {
  if (!ledger[playerId]) ledger[playerId] = { name: '', score: 0, dmg: {} };
  const mine = ledger[playerId];
  let grew = false;
  for (const [id, n] of Object.entries(report?.dmg ?? {})) {
    if (good(n) && n > (mine.dmg[id] ?? 0)) {
      mine.dmg[id] = n;
      grew = true;
    }
  }
  if (good(report?.score) && report.score > mine.score) {
    mine.score = report.score;
    grew = true;
  }
  if (typeof report?.name === 'string' && report.name) mine.name = report.name;
  return grew;
}








export function takeNew(ledger, seen, me, has) {
  const out = [];
  for (const [player, r] of Object.entries(ledger)) {
    if (player === me) continue;
    if (!seen[player]) seen[player] = {};
    const s = seen[player];
    for (const [id, total] of Object.entries(r.dmg)) {
      const n = total - (s[id] ?? 0);
      if (n <= 0 || !has(id)) continue;
      s[id] = total;
      out.push({ player, name: r.name, id, n });
    }
  }
  return out;
}


export const createOutbox = (name) => ({ name, score: 0, dmg:  ({}), dirty: false, last: -Infinity });


export function record(o, enemyId, n) {
  if (!good(n)) return;
  o.dmg[enemyId] = (o.dmg[enemyId] ?? 0) + n;
  o.dirty = true;
}


export function setScore(o, points) {
  if (points !== o.score) {
    o.score = points;
    o.dirty = true;
  }
}





export function flush(o, nowMs) {
  if (!o.dirty || nowMs - o.last < FLUSH_MS) return null;
  o.dirty = false;
  o.last = nowMs;
  return { name: o.name, score: o.score, dmg: { ...o.dmg } };
}
