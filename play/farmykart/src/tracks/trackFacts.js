





























import { buildPath } from '../../../../web-engine/kart/trackPath.js';
import { trackRails, railMetres } from '../../../../web-engine/kart/trackGround.js';
import { drivableWater } from '../../../../web-engine/kart/trackHazards.js';
import { createProjection, project, spanIndices } from '../../../../web-engine/kart/minimap.js';




const CACHE = new Map();

function pathOf(track) {
  let p = CACHE.get(track.id);
  if (!p) {
    p = buildPath(track.control, { defaultWidth: track.defaultWidth, branches: track.shortcuts });
    p.hazards = track.hazards ?? null;
    p.terrain = track.terrain ?? null;
    CACHE.set(track.id, p);
  }
  return p;
}








export function trackFacts(track) {
  const path = pathOf(track);
  const rails = trackRails(path, track);
  const glide = (track.glides ?? [])[0] ?? null;
  const zones = track.hazards ?? [];
  return {
    id: track.id,
    metres: Math.round(path.length),
    laps: track.laps ?? 3,
    dropM: glide ? Math.round(glide.drop) : 0,
    over: glide ? glide.over : null,
    railM: Math.round(railMetres(rails)),
    railCount: rails.spans.length,
    
    
    
    boat: zones.some((z) => drivableWater(z)),
    lava: zones.some((z) => z.kind === 'lava'),
    
    
    
    
    
    
    
    
    
    slippery: (track.surfaceGrip ?? 1) < 1,
    shortcuts: (track.shortcuts ?? []).length,
  };
}
























export function trackBadges(track) {
  const f = trackFacts(track);
  const out = [];
  if (f.boat) out.push('boat water');
  if (f.lava) out.push('lava');
  if (f.slippery) out.push('slippery');
  return out.slice(0, 3);
}


export function factsLine(track) {
  const f = trackFacts(track);
  return `${f.metres} m · ${f.laps} laps · ${f.dropM} m drop · ${f.railM} m rail`;
}






export const THUMB = Object.freeze({ w: 100, h: 64, padX: 7, padY: 6 });




























export function trackOutline(track) {
  const path = pathOf(track);
  const proj = createProjection(path.bounds, {
    w: THUMB.w, h: THUMB.h, pad: Math.min(THUMB.padX, THUMB.padY),
  });
  const outline = path.pts.map((p) => project(proj, p.x, p.z));
  const glide = (track.glides ?? [])[0] ?? null;
  const chasm = glide
    ? spanIndices(path, glide.from, glide.to).map((i) => outline[i])
    : [];
  return { outline, chasm, start: outline[0] };
}
