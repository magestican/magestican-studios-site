

































































export const MS_PER_DAY = 86400000;





const MIN_DAY = 0;
const MAX_DAY = 200000;

function usable(day) {
  return Number.isInteger(day) && day >= MIN_DAY && day <= MAX_DAY ? day : null;
}












export function localDayNumber(nowMs, tzOffsetMinutes) {
  const t = Number(nowMs);
  if (!Number.isFinite(t)) return null;
  if (tzOffsetMinutes == null) {
    const d = new Date(t);
    const y = d.getFullYear();
    if (!Number.isFinite(y)) return null;
    return usable(Date.UTC(y, d.getMonth(), d.getDate()) / MS_PER_DAY);
  }
  const off = Number(tzOffsetMinutes);
  if (!Number.isFinite(off)) return null;
  
  
  
  
  
  const shifted = new Date(t - off * 60000);
  return usable(Date.UTC(
    shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate(),
  ) / MS_PER_DAY);
}


export function utcDayNumber(nowMs) {
  const t = Number(nowMs);
  if (!Number.isFinite(t)) return null;
  const d = new Date(t);
  const y = d.getUTCFullYear();
  if (!Number.isFinite(y)) return null;
  return usable(Date.UTC(y, d.getUTCMonth(), d.getUTCDate()) / MS_PER_DAY);
}














export function dayNumberToMs(day) {
  const d = usable(day);
  return d === null ? null : d * MS_PER_DAY;
}


export function msToDayNumber(ms) {
  const v = Number(ms);
  if (!Number.isFinite(v) || v % MS_PER_DAY !== 0) return null;
  return usable(v / MS_PER_DAY);
}





export function dayNumberToKey(day) {
  const d = usable(day);
  if (d === null) return null;
  const at = new Date(d * MS_PER_DAY);
  const pad = (n) => String(n).padStart(2, '0');
  return `${at.getUTCFullYear()}-${pad(at.getUTCMonth() + 1)}-${pad(at.getUTCDate())}`;
}







export function daysBetween(from, to) {
  const a = usable(from);
  const b = usable(to);
  if (a === null || b === null) return null;
  return b - a;
}
