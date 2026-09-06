


































































export const IDLE_ATLAS_PNG = './assets/sprites/idle.png';
export const IDLE_ATLAS_JSON = './assets/sprites/idle.json';











export async function loadIdleAtlas() {
  const res = await fetch(IDLE_ATLAS_JSON);
  if (!res.ok) throw new Error(`no idle manifest (HTTP ${res.status})`);
  const manifest = await res.json();
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${IDLE_ATLAS_PNG}`));
    img.src = IDLE_ATLAS_PNG;
  });
  return { image, manifest };
}











export const idleColumns = (manifest) => manifest.facings * manifest.stored;


export const idleRowCount = (manifest) => Object.keys(manifest.rows).length;













export const idleRowOf = (manifest, id) => (manifest.rows[id] ? manifest.rows[id].row : -1);


export const hasIdleFrames = (manifest, id) => !!(manifest && manifest.rows[id]);






















export function idleFrame(manifest, cyc) {
  const { order } = manifest;
  const n = order.length;
  return order[Math.floor(Math.max(0, cyc) * n) % n];
}








export function idleColumn(manifest, facing, frame) {
  return facing * manifest.stored + (frame - 1);
}
