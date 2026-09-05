













import { UNITS } from '../../../web-engine/rts/roster.js';

export const ATLAS_PNG = './assets/sprites/units.png';
export const ATLAS_JSON = './assets/sprites/units.json';






export async function loadAtlas() {
  const res = await fetch(ATLAS_JSON);
  if (!res.ok) throw new Error(`no sprite manifest (HTTP ${res.status})`);
  const manifest = await res.json();
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${ATLAS_PNG}`));
    img.src = ATLAS_PNG;
  });
  return { image, manifest };
}


export const rowOf = (manifest, id) => (manifest.rows[id] ? manifest.rows[id].row : 0);


export const rowCount = (manifest) => Object.keys(manifest.rows).length;
















export function unitScale(unitId, manifest) {
  const row = manifest && manifest.rows[unitId];
  const world = row ? row.worldSize : 2;
  const spec = UNITS[unitId];
  
  
  
  
  const readable = 18 + Math.sqrt(world) * 11;
  return spec && spec.tier === 3 ? readable * 1.12 : readable;
}










export function fallbackAtlas(ids) {
  const TILE = 64;
  const canvas = document.createElement('canvas');
  canvas.width = TILE * 8;
  canvas.height = TILE * Math.max(1, ids.length);
  const ctx = canvas.getContext('2d');
  for (let r = 0; r < ids.length; r += 1) {
    const spec = UNITS[ids[r]];
    for (let f = 0; f < 8; f += 1) {
      ctx.save();
      ctx.translate(f * TILE, r * TILE);
      ctx.fillStyle = spec && spec.faction === 'herd' ? '#7d9b4e' : '#8b9099';
      ctx.beginPath();
      ctx.ellipse(TILE / 2, TILE / 2, TILE * 0.34, TILE * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
  }
  return canvas;
}
