
































import { SeededRng } from '../../../../web-engine/rng/seededRng.js';




export const STRIP = Object.freeze({ W: 2048, H: 1024 });



export const HORIZON = 0.5;









export const SKY_GRADIENT = Object.freeze([
  Object.freeze({ at: 0.00, hex: '#a8c4e0' }),   
  Object.freeze({ at: 0.35, hex: '#c8dcf5' }),
  Object.freeze({ at: 0.55, hex: '#e6ecf5' }),   
  Object.freeze({ at: 0.75, hex: '#8ec5ff' }),   
  Object.freeze({ at: 1.00, hex: '#3a5a89' }),   
]);





export const SUN_DIR = Object.freeze({ x: 0.6, y: 1.0, z: 0.4 });



export function sunStripXY(strip = STRIP) {
  const { x, y, z } = SUN_DIR;
  const len = Math.hypot(x, y, z);
  const u = Math.atan2(z / len, x / len) / (Math.PI * 2) + 0.5;
  const v = Math.asin(y / len) / Math.PI + 0.5;
  return { x: u * strip.W, y: (1 - v) * strip.H };
}





export const BRAWL_CYCLE_S = 3.2;



















export const CLOUD_LAYERS = Object.freeze([
  Object.freeze({
    name: 'far',
    seed: 0x51c1ee,
    count: 30,
    driftPeriodS: 1900,
    
    
    
    
    
    
    band: Object.freeze([0.435, 0.487]),
    size: Object.freeze([54, 96]),
    aspect: 0.30,
    alpha: 0.72,
    
    
    
    hazeFade: 0.45,
    tone: Object.freeze({ crown: '#dfeaf7', body: '#c0d2e9', shade: '#a8bed8' }),
  }),
  Object.freeze({
    name: 'mid',
    seed: 0x3d0cd5,
    count: 14,
    driftPeriodS: 900,
    band: Object.freeze([0.375, 0.452]),
    size: Object.freeze([96, 148]),
    aspect: 0.34,
    alpha: 0.84,
    hazeFade: false,
    tone: Object.freeze({ crown: '#eef6ff', body: '#d3e3f6', shade: '#a2bad6' }),
  }),
  Object.freeze({
    name: 'near',
    seed: 0x0eab17,
    count: 7,
    driftPeriodS: 420,
    band: Object.freeze([0.290, 0.395]),
    size: Object.freeze([158, 224]),
    aspect: 0.38,
    alpha: 0.94,
    hazeFade: false,
    
    
    
    tone: Object.freeze({ crown: '#f9fcff', body: '#dfeafa', shade: '#a3bcda' }),
  }),
]);




export const CLOUD_FORM = Object.freeze({
  basePuffs: Object.freeze([4, 6]),   
  crownPuffs: Object.freeze([1, 2]),  
  
  
  
  profileMin: 0.44,
  profilePower: 0.62,
  
  
  widthRatio: Object.freeze([1.30, 1.95]),
  jitter: 0.16,
  tilt: 0.22,                         
  
  
  
  
  
  
  
  
  
  
  crownOffset: 0.16,
  shadeOffset: 0.09,
  shadeDrop: 0.20,     
  crownShrink: 0.84,
});







export function cloudField(layer, strip = STRIP) {
  const rng = new SeededRng(layer.seed);
  const sun = sunStripXY(strip);
  const clouds = [];

  for (let i = 0; i < layer.count; i++) {
    
    
    
    const cell = strip.W / layer.count;
    const x = (i + 0.5) * cell + rng.rangeF(-0.38, 0.38) * cell;
    const w = rng.rangeF(layer.size[0], layer.size[1]);
    const h = w * layer.aspect * rng.rangeF(0.86, 1.14);
    const baseY = rng.rangeF(layer.band[0], layer.band[1]) * strip.H;

    
    
    let d = sun.x - x;
    if (d > strip.W / 2) d -= strip.W;
    if (d < -strip.W / 2) d += strip.W;
    const lit = d >= 0 ? 1 : -1;

    const n = rng.rangeI(CLOUD_FORM.basePuffs[0], CLOUD_FORM.basePuffs[1]);
    const puffs = [];
    let tallest = { dx: 0, ry: 0 };
    for (let p = 0; p < n; p++) {
      const u = (p + 0.5) / n;
      const arc = Math.pow(Math.sin(u * Math.PI), CLOUD_FORM.profilePower);
      const profile = CLOUD_FORM.profileMin + (1 - CLOUD_FORM.profileMin) * arc;
      const ry = h * 0.5 * profile * rng.rangeF(1 - CLOUD_FORM.jitter, 1 + CLOUD_FORM.jitter);
      const rx = ry * rng.rangeF(CLOUD_FORM.widthRatio[0], CLOUD_FORM.widthRatio[1]);
      const dx = (u - 0.5) * w + rng.rangeF(-0.06, 0.06) * w;
      puffs.push({ dx, dy: -ry * 0.78, rx, ry, rot: rng.rangeF(-1, 1) * CLOUD_FORM.tilt, crown: false });
      if (ry > tallest.ry) tallest = { dx, ry };
    }
    
    
    const crowns = rng.rangeI(CLOUD_FORM.crownPuffs[0], CLOUD_FORM.crownPuffs[1]);
    for (let c = 0; c < crowns; c++) {
      
      
      
      
      
      
      const ry = tallest.ry * rng.rangeF(0.55, 0.72);
      puffs.push({
        
        
        
        
        dx: tallest.dx + rng.rangeF(-0.35, 0.35) * tallest.ry,
        dy: -tallest.ry * rng.rangeF(1.40, 1.65) - ry * 0.2,
        rx: ry * rng.rangeF(1.25, 1.70),
        ry,
        rot: rng.rangeF(-1, 1) * CLOUD_FORM.tilt,
        crown: true,
      });
    }

    clouds.push({ x, baseY, w, h, lit, puffs });
  }
  return clouds;
}




export function layerOffset(layer, t, strip = STRIP) {
  const px = (t / layer.driftPeriodS) * strip.W;
  return ((px % strip.W) + strip.W) % strip.W;
}
