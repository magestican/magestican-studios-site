

























import { unlockedTracks } from './raceStats.js';









export function eligibleTracks(progress, allTracks, { exclude = null } = {}) {
  const open = unlockedTracks(progress ?? {}, allTracks ?? []);
  if (exclude == null) return open;
  const without = open.filter((t) => t.id !== exclude);
  
  
  return without.length ? without : open;
}










function drawIndex(rng, n) {
  if (n <= 0) return -1;
  const raw = typeof rng?.next === 'function' ? Number(rng.next()) : 0;
  const unit = Number.isFinite(raw) ? Math.min(Math.max(raw, 0), 0.9999999999) : 0;
  return Math.min(n - 1, Math.floor(unit * n));
}





export function pickNextTrack(rng, progress, allTracks, { exclude = null } = {}) {
  const pool = eligibleTracks(progress, allTracks, { exclude });
  if (!pool.length) return null;
  const i = drawIndex(rng, pool.length);
  return i < 0 ? null : pool[i];
}









export function rotationSequence(rng, progress, allTracks, length, { startFrom = null } = {}) {
  const out = [];
  let previous = startFrom;
  for (let i = 0; i < Math.max(0, Math.floor(Number(length) || 0)); i += 1) {
    const t = pickNextTrack(rng, progress, allTracks, { exclude: previous });
    if (!t) break;
    out.push(t);
    previous = t.id;
  }
  return out;
}
