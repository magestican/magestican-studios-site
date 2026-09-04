



























export const CHALLENGER = 1;








export const SUPPORT_MIN = 0.5;
export const SUPPORT_MAX = 0.7;


export const MAX_BOTS = 3;








function spread(n) {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}









export function strengthsFor(count, seed = 0) {
  const out = [];
  for (let i = 0; i < Math.max(0, Math.min(MAX_BOTS, count)); i += 1) {
    if (i === 0) { out.push(CHALLENGER); continue; }
    const at = spread(seed * 31 + i);
    out.push(SUPPORT_MIN + at * (SUPPORT_MAX - SUPPORT_MIN));
  }
  return out;
}













export function ceilingFor(level = 0) {
  
  
  
  
  const at = Number.isFinite(level) ? Math.max(0, Math.min(1, level)) : 0;
  return 0.35 + at * 0.5;
}















export function pickRanked(count, strength, random = Math.random) {
  if (count <= 0) return -1;
  if (count === 1) return 0;
  const s = Math.max(0, Math.min(1, strength));
  
  
  
  
  
  const top = Math.max(0, 1 - s);
  const reach = Math.max(1, Math.round(count * (0.08 + top * 0.55)));
  const at = Math.floor(random() * reach);
  return Math.max(0, Math.min(count - 1, at));
}








export function considers(strength, random = Math.random) {
  return random() < Math.max(0, Math.min(1, strength));
}









export function describeBot(index, strength) {
  const kind = strength >= CHALLENGER ? 'the challenger' : 'for company';
  return { name: `Bot ${index + 1}`, bot: true, kind, strength };
}
