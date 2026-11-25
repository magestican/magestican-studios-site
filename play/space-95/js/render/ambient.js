







import * as THREE from 'three';


export const FRONT_CLEAR = 0.45;

const mote = (kind, color, count, size, opacity, drift = [0.2, 0.05], sway = 0.3) => ({
  kind,
  color,
  count,
  size,
  opacity,
  drift,
  sway,
  depth: 27,
});
const bokeh = (color, count = 12, opacity = 0.2) => ({
  kind: 'bokeh',
  color,
  count,
  size: 0.5,
  opacity,
  drift: [0.12, 0.02],
  sway: 0.15,
  depth: 6,
});


export const AMBIENT = {
  orchard: { mid: mote('pollen', 0xfff0a0, 60, 0.16, 0.85), front: bokeh(0xfff4c8) },
  canopy: { mid: mote('leafDust', 0xd8f070, 56, 0.14, 0.8, [0.3, -0.08]), front: bokeh(0xe6ffb0) },
  antTrail: { mid: mote('dust', 0xe8c890, 50, 0.12, 0.7, [0.4, 0.02], 0.2), front: bokeh(0xffe2b0) },
  vault: { mid: mote('soilFall', 0xb08058, 46, 0.12, 0.75, [0.02, -0.5], 0.1), front: bokeh(0xd8a878, 10, 0.12) },
  stripecat: { mid: mote('fluff', 0xfff6ee, 40, 0.2, 0.8, [0.15, 0.1], 0.5), front: bokeh(0xffe6d0) },
  orchardDusk: { mid: mote('dusklight', 0xffb070, 44, 0.15, 0.85, [0.1, 0.12]), front: bokeh(0xffc89a, 12, 0.14) },
  hive: { mid: mote('honeyGlint', 0xffc840, 48, 0.13, 0.9, [0.08, 0.18], 0.25), front: bokeh(0xffd870) },
  puddle: { mid: mote('rain', 0x6f86c8, 80, 0.12, 0.85, [-0.3, -3.2], 0), front: bokeh(0xd8e4ff, 12, 0.12) },
  desk: { mid: mote('lampDust', 0xfff2d8, 44, 0.11, 0.7, [0.06, 0.04], 0.2), front: bokeh(0xffd8a8) },
  machine: { mid: mote('spark', 0x80f0ff, 40, 0.1, 0.95, [0.05, 0.7], 0.15), front: bokeh(0xa8c8ff, 10, 0.14) },
  
  train: { mid: { ...mote('crumb', 0xf0d8a0, 40, 0.14, 0.6, [0.3, -0.2], 0.2), depth: 30 }, front: bokeh(0xfff0c0, 10, 0.12) },
  nightGarden: { mid: mote('firefly', 0xd8ff70, 34, 0.18, 0.95, [0.05, 0.08], 0.6), front: bokeh(0xb8a8ff, 10, 0.12) },
  silkGorge: { mid: mote('silkSeed', 0xffffff, 40, 0.15, 0.8, [0.45, 0.06], 0.45), front: bokeh(0xfff0e8) },
  deepBurrow: { mid: mote('burrowFall', 0x8a6040, 44, 0.12, 0.8, [0, -0.7], 0.1), front: bokeh(0xc89060, 10, 0.12) },
  gardenSky: { mid: mote('wisp', 0xf0faff, 36, 0.26, 0.6, [0.6, 0], 0.2), front: bokeh(0xffffff, 12, 0.14) },
  kitchen: { mid: mote('flour', 0xfffaf0, 50, 0.1, 0.7, [0.08, -0.1], 0.3), front: bokeh(0xffe8c0) },
  stampede: { mid: mote('kickedDust', 0xe0c080, 56, 0.14, 0.7, [-0.8, 0.15], 0.2), front: bokeh(0xffe0a0, 12, 0.14) },
  sovereign: { mid: mote('sunbeam', 0xffe8a0, 50, 0.12, 0.85, [0.1, 0.06], 0.3), front: bokeh(0xfff2c8) },
};


const SHIFT = [
  'orchard',
  'canopy',
  'antTrail',
  'vault',
  'stripecat',
  'canopy',
  'orchardDusk',
  'hive',
  'puddle',
  'canopy',
  'desk',
  'machine',
  'train',
  'nightGarden',
  'silkGorge',
  'deepBurrow',
  'gardenSky',
  'kitchen',
  'stampede',
  'sovereign',
];

export const ambientFor = (id) => AMBIENT[SHIFT[id - 1]] ?? null;


export function ambientField(layer, seed) {
  let a = seed >>> 0 || 1;
  const rnd = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = new Float32Array(layer.count * 3);
  for (let i = 0; i < layer.count; i++) {
    let v = rnd() * 2 - 1;
    
    if (layer.kind === 'bokeh') v = Math.sign(v || 1) * (FRONT_CLEAR + Math.abs(v) * (1 - FRONT_CLEAR));
    out[i * 3] = rnd() * 2 - 1;
    out[i * 3 + 1] = v;
    out[i * 3 + 2] = rnd();
  }
  return out;
}

let dot = null;

function dotTexture() {
  if (dot || typeof document === 'undefined') return dot;
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.45, 'rgba(255,255,255,0.55)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 32, 32);
  dot = new THREE.CanvasTexture(c);
  return dot;
}

const wrap = (x, w) => ((((x + w / 2) % w) + w) % w) - w / 2;





export function createAmbient(scene, camera, level, { reduceMotion = false } = {}) {
  const spec = ambientFor(level.id);
  if (!spec) return null;
  if (!camera.parent) scene.add(camera); 
  const layers = ['mid', 'front'].map((name, k) => {
    const L = spec[name];
    const field = ambientField(L, level.id * 31 + k * 977);
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(L.count * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: L.color,
      
      size: ((L.kind === 'bokeh' ? 1 : 2) * L.size) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)),
      map: dotTexture(),
      transparent: true,
      opacity: L.opacity,
      depthWrite: false,
      fog: false,
    });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    pts.renderOrder = name === 'front' ? 10 : -1;
    camera.add(pts);
    return { L, field, pos, geo, mat, pts };
  });
  return {
    
    update(time) {
      const t = reduceMotion ? 0 : time;
      const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      for (const { L, field, pos, geo, mat } of layers) {
        const halfH = L.depth * tanH * 1.1;
        const W = 2 * halfH * camera.aspect * 1.15;
        for (let i = 0; i < L.count; i++) {
          const ph = field[i * 3 + 2] * Math.PI * 2;
          const sw = Math.sin(t * 0.9 + ph) * L.sway;
          pos[i * 3] = wrap(field[i * 3] * (W / 2) + L.drift[0] * t + sw - camera.position.x, W);
          const y = field[i * 3 + 1] * halfH + L.drift[1] * t + Math.cos(t * 0.7 + ph) * L.sway * 0.5 - camera.position.y;
          
          pos[i * 3 + 1] = L.kind === 'bokeh' ? field[i * 3 + 1] * halfH + Math.cos(t * 0.5 + ph) * L.sway : wrap(y, 2 * halfH);
          pos[i * 3 + 2] = -L.depth;
        }
        geo.attributes.position.needsUpdate = true;
        if (L.kind === 'firefly' && !reduceMotion) mat.opacity = L.opacity * (0.6 + 0.4 * Math.sin(time * 2.3));
      }
    },
  };
}
