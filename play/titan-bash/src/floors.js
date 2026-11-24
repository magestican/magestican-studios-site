














export const FLOORS = Object.freeze({});


export const TILE_UNITS = 12;


export const DIM = 0.5;

const images = {};
export function loadFloors(baseUrl, floors = FLOORS) {
  return Promise.all(Object.entries(floors).map(async ([arena, dir]) => {
    try {
      const img = new Image(); img.src = new URL(`${dir}/texture.png`, baseUrl).href; await img.decode();
      images[arena] = img;
    } catch {  }
  }));
}

const patterns = new WeakMap();

export function floorPattern(ctx, arena, scale, x0, y0) {
  const img = images[arena]; if (!img) return null;
  let byCtx = patterns.get(ctx);
  if (!byCtx) { byCtx = {}; patterns.set(ctx, byCtx); }
  if (!byCtx[arena]) byCtx[arena] = ctx.createPattern(img, 'repeat');
  const p = byCtx[arena];
  const k = (TILE_UNITS * scale) / img.naturalWidth;
  if (p.setTransform && typeof DOMMatrix !== 'undefined') p.setTransform(new DOMMatrix([k, 0, 0, k, x0, y0]));
  return p;
}
