





























import { BUILDINGS } from '../../../web-engine/rts/roster.js';

export const BUILDING_ATLAS_PNG = './assets/sprites/buildings.png';
export const BUILDING_ATLAS_JSON = './assets/sprites/buildings.json';






export async function loadBuildingAtlas() {
  const res = await fetch(BUILDING_ATLAS_JSON);
  if (!res.ok) throw new Error(`no building manifest (HTTP ${res.status})`);
  const manifest = await res.json();
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${BUILDING_ATLAS_PNG}`));
    img.src = BUILDING_ATLAS_PNG;
  });
  return { image, manifest };
}


export const rowOf = (manifest, id) => (manifest.rows[id] ? manifest.rows[id].row : 0);









export const facingFor = (manifest, yawSteps) => (
  ((yawSteps % (manifest.facings || 4)) + (manifest.facings || 4)) % (manifest.facings || 4)
);


















export function buildingScale(id, manifest) {
  const row = manifest && manifest.rows[id];
  const world = row ? row.worldSize : 8;
  const spec = BUILDINGS[id];
  
  
  
  const base = Math.min(92, Math.max(46, 30 + Math.sqrt(world) * 15));
  return spec && spec.wall ? base * 0.8 : base;
}










export function fallbackBuildingAtlas(ids) {
  const TILE = 64;
  const canvas = document.createElement('canvas');
  canvas.width = TILE * 4;
  canvas.height = TILE * Math.max(1, ids.length);
  const ctx = canvas.getContext('2d');
  for (let r = 0; r < ids.length; r += 1) {
    const spec = BUILDINGS[ids[r]];
    for (let f = 0; f < 4; f += 1) {
      ctx.save();
      ctx.translate(f * TILE, r * TILE);
      ctx.fillStyle = spec && spec.faction === 'herd' ? '#4f8f3a' : '#b0b6c0';
      ctx.fillRect(TILE * 0.18, TILE * 0.18, TILE * 0.64, TILE * 0.64);
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 3;
      ctx.strokeRect(TILE * 0.18, TILE * 0.18, TILE * 0.64, TILE * 0.64);
      ctx.restore();
    }
  }
  return canvas;
}
