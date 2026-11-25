




export const MIX = Object.freeze({
  
  menu: Object.freeze({ music: 0.5, sfx: 0.3, ambience: 0.5, ui: 1 }),
  
  stinger: Object.freeze({ music: 0.32, sfx: 1, ambience: 0.7, ui: 1 }),
  attack: 0.04,
  release: 0.45,
});







export function duckGains({ menu, stinger }) {
  
  const out = {};
  for (const bus of Object.keys(MIX.menu)) {
    const m = menu ?  (MIX.menu)[bus] : 1;
    const s = stinger ?  (MIX.stinger)[bus] : 1;
    out[bus] = Math.min(m, s);
  }
  return out;
}


export const isStinger = (name) => name.startsWith('sting_');





export const ROOMS = Object.freeze({
  open: Object.freeze({ send: 0.06, delay: 0.05, feedback: 0.15, tone: 5000 }), 
  canopy: Object.freeze({ send: 0.1, delay: 0.07, feedback: 0.25, tone: 4200 }), 
  hall: Object.freeze({ send: 0.16, delay: 0.09, feedback: 0.38, tone: 3600 }), 
  cave: Object.freeze({ send: 0.24, delay: 0.12, feedback: 0.5, tone: 2400 }), 
});


const SHIFT_ROOM = Object.freeze({
  1: 'open',
  2: 'canopy',
  3: 'open',
  4: 'cave',
  5: 'open',
  6: 'open',
  7: 'open',
  8: 'hall',
  9: 'open',
  10: 'canopy',
  11: 'hall',
  12: 'hall',
  13: 'hall',
  14: 'open',
  15: 'canopy',
  16: 'cave',
  17: 'open',
  18: 'hall',
  19: 'open',
  20: 'open',
});


export function roomFor(id) {
  const kind =  (SHIFT_ROOM)[id];
  return ROOMS[kind ?? 'open'];
}
