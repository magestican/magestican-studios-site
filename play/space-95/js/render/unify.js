





import { ART_BIOME } from './biomeArt.js';






export const ARTIST_OUTLINE_RGB = [0.3, 0.13, 0.34];
export const BLOOM = { threshold: 0.84, intensity: 0.16 };


export const OUTLINE = ARTIST_OUTLINE_RGB.reduce((h, c) => (h << 8) | Math.round(c * 255), 0);





export const CONTACT = { color: OUTLINE, opacity: 0.45, maxDrop: 6, minScale: 0.45, width: 1.3, depth: 0.42 };






export function groundBelow(world, x, y, maxDrop = CONTACT.maxDrop) {
  if (!world || typeof world.solid !== 'function' || typeof world.oneWay !== 'function') return null;
  const T = world.tile;
  const c = Math.floor(x / T);
  const top = Math.ceil(y / T - 1e-6) - 1;
  const bottom = Math.floor((y - maxDrop) / T);
  for (let r = top; r >= Math.max(0, bottom); r--) {
    if (world.solid(c, r) || world.oneWay(c, r)) {
      const g = (r + 1) * T;
      return y - g <= maxDrop + 1e-9 ? g : null;
    }
  }
  return null;
}


export function contactShadow(height) {
  if (height === null || height === undefined || height > CONTACT.maxDrop) return { scale: 0, opacity: 0 };
  const k = Math.max(0, height) / CONTACT.maxDrop;
  return { scale: 1 - (1 - CONTACT.minScale) * k, opacity: CONTACT.opacity * (1 - k) };
}





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
