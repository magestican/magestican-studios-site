










import { linear } from '../palette/seasons.mjs';

export const NIGHT_AMBIENT_FLOOR = 0.1;

export const INK_LUMINANCE = luminance(linear('#1d1b2e'));

export const SUNRISE = 5.5;
export const SUNSET = 20.25;


const K = (h, o) => ({ h, ...o });
const KEYS = [
  K(0, { zenith: '#262c66', horizon: '#56478a', below: '#2c2757', fog: '#3f3a78', fogDensity: 0.011, hemiSky: '#8a86d8', hemiGround: '#4a4270', hemiIntensity: 1.35, shadeTint: '#c9c2ff', rim: '#8f9cff', rimIntensity: 0.22, exposure: 1.0, stars: 1 }),
  K(4.5, { zenith: '#283070', horizon: '#6a5696', below: '#2e2a5c', fog: '#4a4282', fogDensity: 0.011, hemiSky: '#8e8ad8', hemiGround: '#4c4472', hemiIntensity: 1.35, shadeTint: '#c9c2ff', rim: '#909cff', rimIntensity: 0.22, exposure: 1.0, stars: 1 }),
  K(6.25, { zenith: '#8aa6dc', horizon: '#ffc4a6', below: '#b99ac4', fog: '#f0c2b6', fogDensity: 0.008, hemiSky: '#c2c4ef', hemiGround: '#9a8478', hemiIntensity: 1.2, shadeTint: '#b6aef5', rim: '#ffd6c0', rimIntensity: 0.2, exposure: 1.1, stars: 0.15 }),
  K(9, { zenith: '#76bcec', horizon: '#dff2f4', below: '#bcdcec', fog: '#d4ecf2', fogDensity: 0.006, hemiSky: '#d2e8ff', hemiGround: '#a6b882', hemiIntensity: 1.25, shadeTint: '#aea6f0', rim: '#e6f4ff', rimIntensity: 0.18, exposure: 1.0, stars: 0 }),
  K(13, { zenith: '#6ab6ee', horizon: '#e6f5f2', below: '#c2e0ee', fog: '#daeff2', fogDensity: 0.0055, hemiSky: '#d6ecff', hemiGround: '#aabd86', hemiIntensity: 1.25, shadeTint: '#aca4f0', rim: '#eaf6ff', rimIntensity: 0.18, exposure: 1.0, stars: 0 }),
  K(16.5, { zenith: '#76b0e4', horizon: '#f6ead0', below: '#cfd8e6', fog: '#eee6d4', fogDensity: 0.006, hemiSky: '#dce6fa', hemiGround: '#b0b47e', hemiIntensity: 1.2, shadeTint: '#b0a6ee', rim: '#fff0da', rimIntensity: 0.2, exposure: 1.0, stars: 0 }),
  K(18.5, { zenith: '#8a8ccc', horizon: '#ffb67c', below: '#c99cb4', fog: '#f4b896', fogDensity: 0.0075, hemiSky: '#e2c2e2', hemiGround: '#aa8c70', hemiIntensity: 1.4, shadeTint: '#b0a0f0', rim: '#ffc79a', rimIntensity: 0.28, exposure: 1.12, stars: 0 }),
  K(19.75, { zenith: '#434a96', horizon: '#c07ea4', below: '#5c4a86', fog: '#7a64a0', fogDensity: 0.009, hemiSky: '#9a8cd0', hemiGround: '#5a4a6a', hemiIntensity: 1.25, shadeTint: '#beb2ff', rim: '#c9a0ff', rimIntensity: 0.26, exposure: 1.15, stars: 0.35 }),
  K(21.5, { zenith: '#262c66', horizon: '#56478a', below: '#2c2757', fog: '#3f3a78', fogDensity: 0.011, hemiSky: '#8a86d8', hemiGround: '#4a4270', hemiIntensity: 1.35, shadeTint: '#c9c2ff', rim: '#8f9cff', rimIntensity: 0.22, exposure: 1.0, stars: 1 }),
];

const SUN_KEYS = [
  [SUNRISE, '#ff9a6a', 0], [6.5, '#ffc29a', 1.3], [9, '#fff0d8', 2.6], [13, '#fff4e2', 2.9],
  [16.5, '#ffe2b2', 2.6], [18.5, '#ffb066', 2.35], [19.75, '#ff8c6a', 0.55], [SUNSET, '#ff8070', 0],
];
const MOON_KEYS = [
  [SUNSET, '#9fb0ff', 0], [21.5, '#a9b6ff', 0.75], [24, '#a9b6ff', 0.8], [28, '#a9b6ff', 0.75], [24 + SUNRISE, '#b0b4ff', 0],
];
const MOON_DIR = normalize([-0.35, 0.82, 0.45]);


const EMISSIVE_KEYS = {
  glass: [[0, 1], [6.5, 1], [8, 0], [16.75, 0], [18.25, 1], [24, 1]],
  'lamp-glow': [[0, 1], [6, 1], [7.25, 0], [18.25, 0], [19.5, 1], [24, 1]],
  fire: [[0, 1], [6.5, 1], [8.5, 0.45], [17, 0.45], [19, 1], [24, 1]],
};
const BLOOM_KEYS = [[0, 0.85], [6, 0.8], [7.5, 0], [17.5, 0], [19.5, 0.8], [24, 0.85]];

export function wrapHours(h) {
  return ((h % 24) + 24) % 24;
}

export function luminance([r, g, b]) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function normalize(v) {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}

const smooth = (t) => t * t * (3 - 2 * t);
const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function bracket(keys, h, hourOf) {
  for (let i = 0; i < keys.length - 1; i++) {
    const a = hourOf(keys[i]), b = hourOf(keys[i + 1]);
    if (h >= a && h <= b) return [keys[i], keys[i + 1], b === a ? 0 : smooth((h - a) / (b - a))];
  }
  return [keys[keys.length - 1], keys[keys.length - 1], 0];
}

function scalarAt(keys, h) {
  const [a, b, t] = bracket(keys, h, (k) => k[0]);
  return a[1] + (b[1] - a[1]) * t;
}

function sunDirection(h) {
  const f = Math.min(1, Math.max(0, (h - SUNRISE) / (SUNSET - SUNRISE)));
  
  
  const elev = (7 + 51 * Math.sin(Math.PI * f)) * (Math.PI / 180);
  
  
  const az = Math.PI * f;
  const horiz = normalize([Math.cos(az) + 0.45, 0, 0.35 + 0.65 * Math.sin(az)]);
  return normalize([horiz[0] * Math.cos(elev), Math.sin(elev), horiz[2] * Math.cos(elev)]);
}

export function dayCycle(hours) {
  const h = wrapHours(hours);
  const [a, b, t] = bracket(KEYS, h, (k) => k.h);
  const col = (key) => mix3(linear(a[key]), linear(b[key]), t);
  const num = (key) => a[key] + (b[key] - a[key]) * t;

  const sunUp = h >= SUNRISE && h <= SUNSET;
  let keyColor, keyIntensity, keyDirection;
  if (sunUp) {
    const [sa, sb, st] = bracket(SUN_KEYS, h, (k) => k[0]);
    keyColor = mix3(linear(sa[1]), linear(sb[1]), st);
    keyIntensity = sa[2] + (sb[2] - sa[2]) * st;
    keyDirection = sunDirection(h);
  } else {
    const hm = h < SUNRISE ? h + 24 : h;
    const [ma, mb, mt] = bracket(MOON_KEYS, hm, (k) => k[0]);
    keyColor = mix3(linear(ma[1]), linear(mb[1]), mt);
    keyIntensity = ma[2] + (mb[2] - ma[2]) * mt;
    keyDirection = MOON_DIR;
  }

  const hemiSky = col('hemiSky');
  const hemiIntensity = num('hemiIntensity');
  const emissive = {};
  for (const [id, keys] of Object.entries(EMISSIVE_KEYS)) emissive[id] = scalarAt(keys, h);

  return {
    hours: h,
    sunUp,
    keyDirection,
    keyColor,
    keyIntensity,
    hemiSky,
    hemiGround: col('hemiGround'),
    hemiIntensity,
    skyZenith: col('zenith'),
    skyHorizon: col('horizon'),
    skyBelow: col('below'),
    fogColor: col('fog'),
    fogDensity: num('fogDensity'),
    shadeTint: col('shadeTint'),
    rimColor: col('rim'),
    rimIntensity: num('rimIntensity'),
    exposure: num('exposure'),
    stars: num('stars'),
    emissive,
    bloom: scalarAt(BLOOM_KEYS, h),
    
    wrap: sunUp ? 0.45 : 0.6,
  };
}



export function ambientLuminance(c) {
  return c.hemiIntensity * luminance(c.hemiSky) + c.keyIntensity * luminance(c.keyColor) * Math.max(0, c.keyDirection[1]);
}
