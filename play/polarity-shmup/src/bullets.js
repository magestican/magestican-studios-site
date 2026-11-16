











export const POLARITY = Object.freeze({
  ember: Object.freeze({ id: 'ember', core: [255, 196, 64], hot: [255, 244, 200], outline: [46, 20, 4] }),
  iris: Object.freeze({ id: 'iris', core: [92, 40, 176], hot: [168, 120, 255], outline: [244, 236, 255] }),
});



export const BULLET_TYPES = Object.freeze([
  Object.freeze({ id: 'pellet', shape: 'circle', w: 8, h: 8 }),
  Object.freeze({ id: 'orb', shape: 'circle', w: 12, h: 12, hot: true }),
  Object.freeze({ id: 'needle', shape: 'capsule', w: 6, h: 14 }),
  Object.freeze({ id: 'diamond', shape: 'diamond', w: 10, h: 10 }),
  Object.freeze({ id: 'shot', shape: 'capsule', w: 5, h: 14, hot: true }), 
]);

export const OUTLINE_PX = 2;


function sdf(shape, x, y, w, h) {
  if (shape === 'circle') return Math.hypot(x, y) - w / 2;
  if (shape === 'capsule') {
    const r = w / 2;
    const half = Math.max(0, h / 2 - r);
    const cy = Math.max(-half, Math.min(half, y));
    return Math.hypot(x, y - cy) - r;
  }
  if (shape === 'diamond') {
    
    const a = w / 2, b = h / 2;
    return ((Math.abs(x) / a + Math.abs(y) / b) - 1) * (a * b) / Math.hypot(a, b);
  }
  throw new Error(`unknown bullet shape ${shape}`);
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];






export function rasterBullet(type, polarity, scale = 1) {
  const t = typeof type === 'string' ? BULLET_TYPES.find((b) => b.id === type) : type;
  const p = typeof polarity === 'string' ? POLARITY[polarity] : polarity;
  if (!t || !p) throw new Error('rasterBullet: unknown type or polarity');
  const W = Math.ceil(t.w * scale) + 2, H = Math.ceil(t.h * scale) + 2; 
  const data = new Uint8ClampedArray(W * H * 4);
  const zone = new Uint8Array(W * H);
  const ow = OUTLINE_PX * scale;
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const x = i + 0.5 - W / 2, y = j + 0.5 - H / 2;
      const d = sdf(t.shape, x, y, t.w * scale, t.h * scale);
      const a = clamp01(0.5 - d);
      if (a <= 0) continue;
      const inner = clamp01(-(d + ow) + 0.5); 
      let rgb = mix(p.outline, p.core, inner);
      if (t.hot) {
        const centre = clamp01(1 - Math.hypot(x / (t.w * scale), y / (t.h * scale)) * 3.2);
        rgb = mix(rgb, p.hot, centre * inner);
      }
      const k = (j * W + i) * 4;
      data[k] = rgb[0]; data[k + 1] = rgb[1]; data[k + 2] = rgb[2]; data[k + 3] = Math.round(a * 255);
      zone[j * W + i] = a < 0.99 ? 0 : inner > 0.99 ? 2 : inner < 0.01 ? 1 : 0;
    }
  }
  return { w: W, h: H, data, zone };
}


export function srgbToLinear(c) {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}
export function luminance(r, g, b) {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}
export function contrastRatio(la, lb) {
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}


export const CONTRAST_MIN = 2.5;
