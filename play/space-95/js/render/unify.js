




import { ART_BIOME } from './biomeArt.js';





export const OUTLINE = 0x4a2a6e;





export const GRADE = {
  default: { key: 0xfff4e0, strength: 0.06 },
  orchard: { key: 0xfff1d6, strength: 0.08 },
  orchardDusk: { key: 0xffb27a, strength: 0.18 },
  canopy: { key: 0xeeffd8, strength: 0.08 },
  antTrail: { key: 0xffe6c0, strength: 0.1 },
  vault: { key: 0xe4dcff, strength: 0.12 },
  stripecat: { key: 0xfff0dc, strength: 0.08 },
  hive: { key: 0xffd98a, strength: 0.14 },
  puddle: { key: 0xd8f0ff, strength: 0.1 },
  desk: { key: 0xfff6e6, strength: 0.06 },
  machine: { key: 0xd4ecff, strength: 0.12 },
  nightGarden: { key: 0xa9bcff, strength: 0.2 },
  silkGorge: { key: 0xf0e2ff, strength: 0.1 },
  deepBurrow: { key: 0xffcf9e, strength: 0.18 },
  gardenSky: { key: 0xfff8ee, strength: 0.05 },
  kitchen: { key: 0xfff2e0, strength: 0.06 },
  stampede: { key: 0xffe0bc, strength: 0.1 },
  sovereign: { key: 0xffdcec, strength: 0.1 },
};


export function gradeFor(id) {
  return GRADE[ART_BIOME[id]] ?? GRADE.default;
}


export function tintOf(g) {
  let out = 0;
  for (const shift of [16, 8, 0]) {
    const k = (g.key >> shift) & 255;
    const c = Math.round(255 + (k - 255) * g.strength);
    out |= c << shift;
  }
  return out;
}

let current = tintOf(GRADE.default);


export function setShiftGrade(id) {
  current = tintOf(gradeFor(id));
}


export function spriteTint() {
  return current;
}
