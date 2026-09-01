





























import { buildPath } from '../../../../web-engine/kart/trackPath.js';
import { trackRails, railMetres } from '../../../../web-engine/kart/trackGround.js';
import { drivableWater } from '../../../../web-engine/kart/trackHazards.js';
import { createProjection, project, spanIndices } from '../../../../web-engine/kart/minimap.js';
import { undulateTrack } from '../../../../web-engine/kart/trackUndulation.js';
import {
  fitPreviewCamera, projectPreview, roadPixels, northIsUp,
} from '../../../../web-engine/kart/trackPreview.js';




const CACHE = new Map();

function pathOf(track) {
  let p = CACHE.get(track.id);
  if (!p) {
    
    
    
    
    const control = undulateTrack(track, { seed: track.id.length });
    p = buildPath(control, { defaultWidth: track.defaultWidth, branches: track.shortcuts });
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
    
    
    boatShare: zones.reduce((a, z) => a + (drivableWater(z) ? (z.to - z.from) : 0), 0),
    lava: zones.some((z) => z.kind === 'lava'),
    
    
    
    
    
    
    
    
    
    slippery: (track.surfaceGrip ?? 1) < 1,
    shortcuts: (track.shortcuts ?? []).length,
  };
}
























export function trackBadges(track) {
  const f = trackFacts(track);
  const out = [];
  
  
  
  
  
  
  
  if (f.boatShare >= 0.12) out.push('long boat run');
  if (f.lava) out.push('lava');
  if (f.slippery) out.push('slippery');
  return out.slice(0, 3);
}


export function factsLine(track) {
  const f = trackFacts(track);
  return `${f.metres} m · ${f.laps} laps · ${f.dropM} m drop · ${f.railM} m rail`;
}






























export const PREVIEW_CARD = Object.freeze({ w: 281.25, h: 180 });












const RIBBON_STEP = 4;


function leftNormal(path, i) {
  const t = path.tangents[i];
  const l = Math.hypot(t.x, t.z) || 1;
  
  
  
  
  
  return { x: -t.z / l, z: t.x / l };
}


function roadEdges(path) {
  const out = [];
  for (let i = 0; i < path.count; i += 1) {
    const p = path.pts[i];
    const n = leftNormal(path, i);
    const half = (p.width ?? 0) / 2;
    out.push({
      l: { x: p.x + n.x * half, y: p.y ?? 0, z: p.z + n.z * half },
      r: { x: p.x - n.x * half, y: p.y ?? 0, z: p.z - n.z * half },
    });
  }
  return out;
}

function everyNth(n, step) {
  const idx = [];
  for (let i = 0; i < n; i += step) idx.push(i);
  return idx;
}



























export function trackPreviewShape(track, {
  w = PREVIEW_CARD.w, h = PREVIEW_CARD.h, elevationDeg, fovDeg,
} = {}) {
  const path = pathOf(track);
  const edges = roadEdges(path);
  
  
  
  
  const fitPoints = [];
  for (const e of edges) { fitPoints.push(e.l, e.r); }
  const cam = fitPreviewCamera(fitPoints, {
    w,
    h,
    ...(elevationDeg == null ? {} : { elevationDeg }),
    ...(fovDeg == null ? {} : { fovDeg }),
  });

  const idx = everyNth(path.count, RIBBON_STEP);
  const proj = (p) => {
    const q = projectPreview(cam, p.x, p.y, p.z);
    return { x: q.x, y: q.y };
  };
  const left = idx.map((i) => proj(edges[i].l));
  const right = idx.map((i) => proj(edges[i].r));

  
  
  
  
  
  
  const ribbon = left.concat([...right].reverse());

  
  
  
  
  
  
  
  
  
  
  const glide = (track.glides ?? [])[0] ?? null;
  const span = new Set(glide ? spanIndices(path, glide.from, glide.to) : []);
  const inSpanK = [];
  for (let k = 0; k < idx.length; k += 1) if (span.has(idx[k])) inSpanK.push(k);
  const chasm = inSpanK.length > 1
    ? inSpanK.map((k) => left[k]).concat([...inSpanK].reverse().map((k) => right[k]))
    : [];

  
  
  const startLine = { a: proj(edges[0].l), b: proj(edges[0].r) };

  let minWidth = Infinity;
  for (const p of path.pts) minWidth = Math.min(minWidth, p.width ?? Infinity);

  return {
    w,
    h,
    ribbon,
    chasm,
    startLine,
    start: proj(path.pts[0]),
    
    
    
    roadPx: roadPixels(minWidth, cam),
    northUp: northIsUp(cam),
    cam,
  };
}
