






import { HOME, regionById } from './regions.js';
import { sectionById, toUV } from './sections.js';
import { PERCHES, perchesOpen, visited as perchVisited } from './travel.js';
import { MINI, miniXY, objectiveXY } from '../hud/transit.js';

export const WORLD_PLACES = [
  { region: HOME, name: 'Kazan Isle', at: [0.52, 0.56], r: 0.29, glyph: 'volcano' },
  
  { region: 'testbed', name: 'Testbed', at: [0.93, 0.42], r: 0.06, glyph: 'meadow' },
  
  { region: 'ember-tube', name: 'Ember Tube', at: [0.86, 0.2], r: 0.1, glyph: 'volcano' },
  
  { region: 'kazan-village', name: 'Kazan Village', at: [0.52, 0.17], r: 0.08, glyph: 'volcano' },
  
  { region: 'shrine-village', name: 'Shrine Village', at: [0.52, 0.93], r: 0.07, glyph: 'meadow' },
  
  { region: 'tomo-coast', name: 'Tomo Coast', at: [0.9, 0.62], r: 0.08, glyph: 'meadow' },
  
  { region: 'shellhaven', name: 'Shellhaven', at: [0.86, 0.86], r: 0.07, glyph: 'meadow' },
  { region: 'kelp-maze', name: 'The Kelp Maze', at: [0.95, 0.78], r: 0.045, glyph: 'meadow' },
  { region: 'drowned-temple', name: 'The Drowned Temple', at: [0.72, 0.95], r: 0.045, glyph: 'meadow' },
  
  { region: 'hollowroot', name: 'Hollowroot', at: [0.1, 0.62], r: 0.07, glyph: 'meadow' },
  { region: 'thornfield', name: 'Thornfield', at: [0.1, 0.78], r: 0.06, glyph: 'meadow' },
  { region: 'mother-hollow', name: 'The Mother Tree', at: [0.2, 0.7], r: 0.045, glyph: 'meadow' },
  
  { region: 'vinegate', name: 'Vinegate Landing', at: [0.1, 0.44], r: 0.07, glyph: 'meadow' },
  { region: 'canopy-walk', name: 'The Canopy Walk', at: [0.18, 0.34], r: 0.045, glyph: 'meadow' },
  { region: 'ruin-steps', name: 'The Ruin Steps', at: [0.18, 0.2], r: 0.05, glyph: 'meadow' },
  { region: 'obsidian-court', name: 'The Obsidian Court', at: [0.08, 0.12], r: 0.05, glyph: 'meadow' },
  { region: 'fig-terraces', name: 'The Fig Terraces', at: [0.09, 0.27], r: 0.05, glyph: 'meadow' },
  { region: 'gale-ledges', name: 'The Gale Ledges', at: [0.025, 0.5], r: 0.025, glyph: 'meadow' }, 
  
  { region: 'minehead', name: 'Minehead Camp', at: [0.1, 0.93], r: 0.055, glyph: 'volcano' },
  { region: 'lantern-shaft', name: 'The Lantern Shaft', at: [0.25, 0.92], r: 0.045, glyph: 'meadow' },
  { region: 'deep-seam', name: 'The Deep Seam', at: [0.21, 0.82], r: 0.035, glyph: 'meadow' },
];
export const placeOf = (region) => WORLD_PLACES.find((p) => p.region === region) || null;


export function regionsVisited(flags = {}, region = HOME) {
  return new Set([HOME, region, ...Object.keys(flags.regions || {})]);
}



function boxOf(region) {
  const R = regionById(region);
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
  for (const id of (R ? R.sections : [])) {
    const s = sectionById(id); if (!s) continue;
    u0 = Math.min(u0, s.rect.u[0]); u1 = Math.max(u1, s.rect.u[1]); v0 = Math.min(v0, s.rect.v[0]); v1 = Math.max(v1, s.rect.v[1]);
  }
  const span = Math.max(u1 - u0, v1 - v0) || 1;
  return { u: (u0 + u1) / 2, v: (v0 + v1) / 2, span };
}
export function localUV(region, x, y) {
  if (region === HOME) { const [a, b] = miniXY(x, y); return [a / MINI, b / MINI]; }
  const b = boxOf(region), [u, v] = toUV(x, y);
  return [0.5 + (u - b.u) / b.span, 0.5 + (v - b.v) / b.span];
}

export function worldUV(region, x, y) {
  const p = placeOf(region); if (!p) return null;
  const [a, b] = localUV(region, x, y);
  return [p.at[0] + (a - 0.5) * 2 * p.r, p.at[1] + (b - 0.5) * 2 * p.r];
}



export function worldPage(flags = {}, region = HOME, opts = {}) {
  const seen = regionsVisited(flags, region), open = new Set(perchesOpen(flags, opts).map((p) => p.id));
  const places = WORLD_PLACES.filter((p) => seen.has(p.region) && regionById(p.region)).map((p) => ({
    ...p, here: p.region === region,
    perches: PERCHES.filter((q) => q.region === p.region).map((q) => ({
      id: q.id, name: q.name, uv: worldUV(p.region, q.at.x, q.at.y), visited: perchVisited(flags, q.id), open: open.has(q.id),
    })),
  }));
  
  const o = objectiveXY(flags);
  const x = o ? { region: HOME, sec: o.sec, uv: worldUV(HOME, ...o.xy) } : null;
  const key = places.map((p) => p.region + (p.here ? '*' : '') + p.perches.map((q) => +q.visited + +q.open).join('')).join('|') + '/' + (x ? x.sec : '-');
  return { places, x, key };
}
