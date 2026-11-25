



























export const ARTIST_TILES = Object.freeze([
  'grass_rain',
  'road_summer', 'road_mud', 'road_snow',
  'fence_wood', 'barn_planks',
]);











export const PENDING_TILES = Object.freeze(['grass_summer', 'grass_mud', 'grass_snow', 'kart_paint']);

const BASE = new URL('../../assets/textures/kartzoom_world/tiles/', import.meta.url);
export const tileUrl = (name) => new URL(`${name}.webp`, BASE).href;



export const GROUND_TILE = { summer: 'grass_rain', mud: 'grass_mud', snow: 'grass_snow', rain: 'grass_rain' };
export const ROAD_TILE = { summer: 'road_summer', mud: 'road_mud', snow: 'road_snow', rain: 'road_summer' };








export const LAYER = Object.freeze({
  ground: { op: 'soft-light', alpha: 0.85, repeats: [8, 8], normal: 1 },
  road: { op: 'soft-light', alpha: 0.8, repeats: [2, 1], normal: 1 },
  barn: { op: 'soft-light', alpha: 0.7, repeats: [1, 1], normal: 0 },
  paint: { op: 'multiply', alpha: 0.45, repeats: [1, 1], normal: 0 },
});

const OUT_HIGH = 1024;
const OUT_MEDIUM = 512;

function defaultLoad(url) {
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  return img.decode().then(() => img);
}

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}















export async function layerTile(texture, name, how, opts = {}) {
  const quality = opts.quality ?? 'high';
  if (quality === 'low') return false;
  if (PENDING_TILES.includes(name)) return false;
  if (!ARTIST_TILES.includes(name)) throw new Error(`artistTiles: no tile '${name}'`);
  const src = texture?.image;
  if (!src || !src.width) return false;
  const load = opts.load ?? (typeof Image === 'function' ? defaultLoad : null);
  const mk = opts.canvas ?? (typeof document === 'object' ? makeCanvas : null);
  if (!load || !mk) return false;
  let img;
  try { img = await load(tileUrl(name)); } catch { return false; }
  if (!img || !img.width) return false;

  const side = quality === 'high' ? OUT_HIGH : OUT_MEDIUM;
  
  const w = side;
  const h = Math.max(1, Math.round(side * (src.height / src.width)));
  const out = mk(w, h);
  const g = out.getContext('2d');
  g.imageSmoothingEnabled = true;
  g.drawImage(src, 0, 0, w, h);
  g.globalCompositeOperation = how.op;
  g.globalAlpha = how.alpha;
  const [ru, rv] = how.repeats;
  const tw = w / ru; const th = h / rv;
  
  for (let y = 0; y < rv; y += 1) for (let x = 0; x < ru; x += 1) g.drawImage(img, x * tw, y * th, tw, th);
  g.globalCompositeOperation = 'source-over';
  g.globalAlpha = 1;

  
  
  
  
  
  texture.dispose?.();
  texture.image = out;
  texture.needsUpdate = true;
  if (opts.normalMap && how.normal) {
    const fresh = opts.deriveNormal ? opts.deriveNormal(texture, how.normal) : null;
    if (fresh) {
      opts.normalMap.dispose?.();
      opts.normalMap.image = fresh.image;
      opts.normalMap.needsUpdate = true;
      fresh.dispose?.();
    }
  }
  return true;
}

