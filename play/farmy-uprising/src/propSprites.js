







































export const PROP_ATLAS_PNG = './assets/sprites/props.png';
export const PROP_ATLAS_JSON = './assets/sprites/props.json';






export async function loadPropAtlas() {
  const res = await fetch(PROP_ATLAS_JSON);
  if (!res.ok) throw new Error(`no prop manifest (HTTP ${res.status})`);
  const manifest = await res.json();
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${PROP_ATLAS_PNG}`));
    img.src = PROP_ATLAS_PNG;
  });
  return { image, manifest };
}


export const propRow = (manifest, id) => (
  manifest && manifest.rows[id] ? manifest.rows[id].row : -1
);
















export function propFacing(manifest, n) {
  const f = (manifest && manifest.facings) || 4;
  return ((n % f) + f) % f;
}






export function propTile(manifest, id, facing = 0) {
  const row = propRow(manifest, id);
  if (row < 0) return null;
  const s = manifest.tile;
  return { sx: propFacing(manifest, facing) * s, sy: row * s, s };
}







export function propPlacement(manifest, id) {
  const r = manifest && manifest.rows[id];
  if (!r) return null;
  return {
    row: r.row,
    worldSize: r.worldSize,
    drawSize: r.drawSize,
    footY: r.footY,
    role: r.role,
    footprint: r.footprint,
  };
}







export function fallbackPropAtlas(ids) {
  const TILE = 64;
  const canvas = document.createElement('canvas');
  canvas.width = TILE * 4;
  canvas.height = TILE * Math.max(1, ids.length);
  const ctx = canvas.getContext('2d');
  for (let r = 0; r < ids.length; r += 1) {
    for (let f = 0; f < 4; f += 1) {
      ctx.save();
      ctx.translate(f * TILE, r * TILE);
      ctx.fillStyle = '#3f7a2e';
      ctx.beginPath();
      ctx.moveTo(TILE / 2, TILE * 0.16);
      ctx.lineTo(TILE * 0.84, TILE * 0.84);
      ctx.lineTo(TILE * 0.16, TILE * 0.84);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#ff00ff';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    }
  }
  return canvas;
}
