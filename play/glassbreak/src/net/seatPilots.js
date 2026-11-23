











import { PILOTS } from '../kindlers.js';

export const PILOT_IDS = Object.freeze(PILOTS.map((p) => p.id));


export const emptyPilots = () => PILOT_IDS.map(() => null);

const takenBy = (pilots, id) => pilots.indexOf(id);


export function seatPilot(pilots, seat) {
  if (seat === null || seat < 0 || seat >= pilots.length) return null;
  if (pilots[seat] !== null) return pilots[seat];
  const own = PILOT_IDS[seat];
  pilots[seat] = takenBy(pilots, own) < 0 ? own : PILOT_IDS.find((id) => takenBy(pilots, id) < 0) ?? own;
  return pilots[seat];
}


export function pickPilot(pilots, seat, id) {
  if (seat === null || seat < 0 || seat >= pilots.length || pilots[seat] === null) return false;
  if (!PILOT_IDS.includes(id)) return false;
  const holder = takenBy(pilots, id);
  if (holder >= 0 && holder !== seat) return false;
  pilots[seat] = id;
  return true;
}


export function freePilot(pilots, seat) {
  if (seat !== null && seat >= 0 && seat < pilots.length) pilots[seat] = null;
}


export function pilotsFromWire(list) {
  const out = emptyPilots();
  if (!Array.isArray(list)) return out;
  for (let s = 0; s < out.length; s++) {
    const id = list[s];
    if (PILOT_IDS.includes(id) && !out.includes(id)) out[s] = id;
  }
  return out;
}
