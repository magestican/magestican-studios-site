



import { HOUSES, TITANS } from '../../../web-engine/titan-bash/titans.js';
import { cleanPaint, cleanEmblem } from '../../../web-engine/titan-bash/rewards.js';

const HOUSE_IDS = new Set(HOUSES.map((h) => h.id));


export function cleanPick(msg) {
  if (!msg || typeof msg !== 'object') return null;
  const out = {};
  if (typeof msg.house === 'string' && HOUSE_IDS.has(msg.house)) out.house = msg.house;
  if (typeof msg.titan === 'string' && Object.prototype.hasOwnProperty.call(TITANS, msg.titan)) out.titan = msg.titan;
  if (typeof msg.rookie === 'boolean') out.rookie = msg.rookie;
  if (typeof msg.ready === 'boolean') out.ready = msg.ready;
  
  if ('paint' in msg && cleanPaint(msg.paint) !== undefined) out.paint = cleanPaint(msg.paint);
  if ('emblem' in msg && cleanEmblem(msg.emblem) !== undefined) out.emblem = cleanEmblem(msg.emblem);
  return Object.keys(out).length ? out : null;
}


export function takenHouses(humans, control) {
  return humans.filter((h) => h.control !== control && h.house).map((h) => h.house);
}






export function applyPick(humans, control, pick) {
  const h = humans.find((x) => x.control === control);
  if (!h || !pick) return { ok: false, changed: false };
  let changed = false; let refused;
  if (pick.house && pick.house !== h.house) {
    if (takenHouses(humans, control).includes(pick.house)) refused = 'house';
    else { h.house = pick.house; h.ready = false; changed = true; }
  }
  if (pick.titan && pick.titan !== h.titan) { h.titan = pick.titan; h.ready = false; changed = true; }
  if (pick.rookie !== undefined && pick.rookie !== !!h.rookie) { h.rookie = pick.rookie; changed = true; }
  if (pick.ready !== undefined && pick.ready !== !!h.ready) { h.ready = pick.ready; changed = true; }
  for (const k of ['paint', 'emblem']) if (pick[k] !== undefined && pick[k] !== (h[k] ?? null)) { h[k] = pick[k]; changed = true; }
  return { ok: !refused, ...(refused ? { refused } : {}), changed };
}


export function hostPhone(humans) {
  return humans.find((h) => h.control.startsWith('phone'))?.control ?? null;
}


export const mayStart = (humans, control) => control !== null && control === hostPhone(humans);


export function readyCount(humans) {
  const phones = humans.filter((h) => h.control.startsWith('phone'));
  return { ready: phones.filter((h) => h.ready).length, phones: phones.length };
}


export function newRound(humans) { for (const h of humans) h.ready = false; }
