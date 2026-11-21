
















export const POLARITY = Object.freeze({
  ember: Object.freeze({ id: 'ember', core: [255, 246, 222], hot: [255, 255, 255], outline: [240, 120, 20] }),
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















export const SIGNATURE_MAX_PX = 16;
export const SIGNATURE_IDS = Object.freeze(['cinder', 'shuttle', 'rivet', 'binary', 'spark']);


function unevenCapsule(x, y, r1, r2, h) {
  x = Math.abs(x);
  const b = (r1 - r2) / h, a = Math.sqrt(1 - b * b);
  const k = -b * x + a * y;
  if (k < 0) return Math.hypot(x, y) - r1;
  if (k > a * h) return Math.hypot(x, y - h) - r2;
  return a * x + b * y - r1;
}

function hexagon(x, y, r, e = 0) {
  y -= Math.max(-e, Math.min(e, y));
  let px = Math.abs(x), py = Math.abs(y);
  const kx = -0.866025404, ky = 0.5, kz = 0.577350269;
  const d = 2 * Math.min(kx * py + ky * px, 0); 
  py -= d * kx; px -= d * ky;
  const cx = Math.max(-kz * r, Math.min(kz * r, py));
  const qx = py - cx, qy = px - r;
  return Math.hypot(qx, qy) * Math.sign(qy);
}


function sigSdf(sig, base, x, y, w, h) {
  const body = sdf(base.shape, x, y, w, h);
  const hw = w / 2, hh = h / 2;
  if (sig === 'cinder') {
    const tail = Math.min(hw + 1, SIGNATURE_MAX_PX / 2 - hh + 1.5);
    return Math.min(body, unevenCapsule(x, -y, hw * 0.8, 0.7, hh + tail - 0.7));
  }
  if (sig === 'shuttle') {
    const tip = Math.min(hw * 1.75, SIGNATURE_MAX_PX / 2);
    return Math.min(body, unevenCapsule(y, Math.abs(x), Math.min(hw, hh) * 0.6, 0.6, tip - 0.6));
  }
  if (sig === 'rivet') return hexagon(x, y, base.shape === 'diamond' ? hw * 0.8 : hw, Math.max(0, hh - hw));
  if (sig === 'binary') {
    const r = Math.max(1.6, Math.min(hw * 0.5, 2.4));
    return Math.min(body, Math.hypot(x, y + hh + r * 0.6) - r);
  }
  if (sig === 'spark') {
    const out = Math.min(hw + 4, SIGNATURE_MAX_PX / 2 * Math.SQRT2 - 1), r1 = Math.max(1.2, hw * 0.45);
    let d = body;
    for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      
      const ux = (x * dy - y * dx) / Math.SQRT2, uy = (x * dx + y * dy) / Math.SQRT2;
      d = Math.min(d, unevenCapsule(ux, uy, r1, 0.5, out - 0.5));
    }
    return d;
  }
  throw new Error(`unknown signature ${sig}`);
}


function sigBox(sig, base) {
  let mx = 0, my = 0;
  for (let y = -12; y <= 12; y += 0.25) for (let x = -12; x <= 12; x += 0.25) {
    if (sigSdf(sig, base, x, y, base.w, base.h) < 0.5) { mx = Math.max(mx, Math.abs(x)); my = Math.max(my, Math.abs(y)); }
  }
  return [Math.max(base.w, 2 * Math.ceil(mx)), Math.max(base.h, 2 * Math.ceil(my))];
}


export const SIGNATURES = Object.freeze(SIGNATURE_IDS.map((sig) => Object.freeze(BULLET_TYPES.slice(0, 4).map((base) => {
  const [w, h] = sigBox(sig, base);
  return Object.freeze({ id: `${sig}-${base.id}`, sig, base, shape: 'signature', w, h, hot: base.hot || sig === 'cinder' });
}))));


function shapeSdf(t, x, y, scale) {
  
  if (t.shape === 'signature') return sigSdf(t.sig, t.base, x / scale, y / scale, t.base.w, t.base.h) * scale;
  return sdf(t.shape, x, y, t.w * scale, t.h * scale);
}


export function hitCover(t, r) {
  let inside = 0, n = 0;
  for (let y = -r; y <= r; y += 0.25) for (let x = -r; x <= r; x += 0.25) {
    if (x * x + y * y > r * r) continue;
    n++; if (shapeSdf(t, x, y, 1) < 0) inside++;
  }
  return inside / n;
}

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
  const t = typeof type === 'string' ? [...BULLET_TYPES, ...SIGNATURES.flat()].find((b) => b.id === type) : type;
  const p = typeof polarity === 'string' ? POLARITY[polarity] : polarity;
  if (!t || !p) throw new Error('rasterBullet: unknown type or polarity');
  const W = Math.ceil(t.w * scale) + 2, H = Math.ceil(t.h * scale) + 2; 
  const data = new Uint8ClampedArray(W * H * 4);
  const zone = new Uint8Array(W * H);
  const ow = OUTLINE_PX * scale;
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const x = i + 0.5 - W / 2, y = j + 0.5 - H / 2;
      const d = shapeSdf(t, x, y, scale);
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
