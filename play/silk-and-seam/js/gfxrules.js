



export const TIERS = ['low', 'mid', 'high'];




export const TIER_FX = {
  high: { pixelRatio: 2, shadow: 2048, softShadow: true, post: true, msaa: 4, bloom: true, vignette: true, grain: true, dof: true, budgetMs: 16.7 },
  mid: { pixelRatio: 1.5, shadow: 1024, softShadow: true, post: true, msaa: 2, bloom: true, vignette: true, grain: false, dof: false, budgetMs: 25 },
  low: { pixelRatio: 1, shadow: 512, softShadow: false, post: false, msaa: 0, bloom: false, vignette: false, grain: false, dof: false, budgetMs: 33.4 },
};




export const BENCH = { HIGH_SCORE: 20, LOW_SCORE: 9, MIN_TEXTURE: 4096 };




export const PARTICLES = { low: 3200, mid: 4000, high: 5000 };


export const DRAPE_VERSION = 1;

export const drapeKey = (design, body, tier) => [DRAPE_VERSION, tier, body, design.bodice, design.skirt, design.collar || 'none', design.sleeve || 'none', design.seed ?? ''].join('|');
export const QUALITY = ['auto', 'high', 'low'];



export function pickTier(caps = {}, override = 'auto') {
  if (!caps.webgl2) return 'off';
  if (override === 'high' || override === 'low') return override;
  if (caps.software) return 'low';
  if (caps.maxTexture && caps.maxTexture < BENCH.MIN_TEXTURE) return 'low';
  if (caps.deviceMemory && caps.deviceMemory <= 2) return 'low';
  const s = caps.score;
  if (s == null) return caps.coarse ? 'low' : 'mid';        
  if (s < BENCH.LOW_SCORE) return 'low';
  if (s >= BENCH.HIGH_SCORE && !caps.coarse && !(caps.deviceMemory && caps.deviceMemory < 8)) return 'high';
  return 'mid';
}


export const isSoftwareGL = (name = '') => /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);




export const MOODS = {
  day: {
    hemi: ['#fff4e2', '#b59a7a', 1.1], key: ['#fff1d6', 2.6], rim: ['#ffe0b0', 0.9],
    env: { wall: '#e8d7bd', floor: '#8a6a4a', sky: '#dfeefa', lamp: '#fff0d0', lampOn: 0.2, intensity: 0.55 },
    grade: { exposure: 1.0, tint: [1.02, 1.0, 0.96], lift: [0.01, 0.008, 0.004], sat: 1.04, bloom: 0.22 },
  },
  golden: {
    hemi: ['#ffe2bc', '#9a7454', 0.95], key: ['#ffd49e', 2.6], rim: ['#ffb07a', 1.0],
    env: { wall: '#e9c79c', floor: '#7a5536', sky: '#ffc98a', lamp: '#ffd9a0', lampOn: 0.4, intensity: 0.6 },
    grade: { exposure: 1.02, tint: [1.05, 1.0, 0.91], lift: [0.015, 0.008, 0.0], sat: 1.03, bloom: 0.3 },
  },
  lamp: {
    hemi: ['#8a93c8', '#2a2233', 0.5], key: ['#ffb56b', 2.2], rim: ['#9fb4ff', 1.2],
    env: { wall: '#6a5240', floor: '#3a281c', sky: '#1c2340', lamp: '#ffc47a', lampOn: 1, intensity: 0.45 },
    grade: { exposure: 0.95, tint: [1.04, 0.97, 0.9], lift: [0.012, 0.008, 0.016], sat: 1.0, bloom: 0.45 },
  },
  moon: {
    hemi: ['#7d8cc8', '#1c1a2a', 0.45], key: ['#b8c8ff', 1.4], rim: ['#dfe6ff', 1.0],
    env: { wall: '#48506a', floor: '#22222e', sky: '#28345c', lamp: '#ffc47a', lampOn: 0.15, intensity: 0.4 },
    grade: { exposure: 0.9, tint: [0.9, 0.96, 1.1], lift: [0.004, 0.008, 0.02], sat: 0.85, bloom: 0.35 },
  },
};
export const moodOf = ({ night = false, golden = false, moon = false } = {}) => (moon ? 'moon' : night ? 'lamp' : golden ? 'golden' : 'day');


export function frameStats(ms = []) {
  const a = ms.filter((x) => Number.isFinite(x) && x >= 0).sort((x, y) => x - y);
  if (!a.length) return { n: 0, p50: 0, p95: 0, max: 0, fps: 0 };
  const at = (q) => a[Math.min(a.length - 1, Math.floor(q * a.length))];
  const mean = a.reduce((s, x) => s + x, 0) / a.length;
  return { n: a.length, p50: at(0.5), p95: at(0.95), max: a[a.length - 1], fps: mean > 0 ? Math.round(1000 / mean) : 0 };
}
