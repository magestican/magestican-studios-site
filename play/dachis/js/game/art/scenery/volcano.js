








import { S, form, lin, createParticles } from './kit.js';
import { fbm3 } from '../../../vendor/fml/moon/noise.js';
import { bridgeFrame } from '../../features/world/functional.js';

const ASH = lin('#8c8478'), ASH_DK = lin('#6a6258'), SULFUR = lin('#f2d43a'), SULFUR_HI = lin('#fff28a'), THROAT = lin('#1c1418');
const CRUST = lin('#2e262a'), CRUST_HI = lin('#4a3e42'), CRACK = lin('#ff7a1a');
const lumps = (s, amp, seed) => (x, y, z) => (fbm3(x * s, y * s, z * s, { seed, octaves: 2 }) - 0.5) * amp;

function vent() {
  const mound = S.displace(S.ellipsoid([0, 0.02, 0], [0.5, 0.2, 0.44]), lumps(6, 0.07, 31), 0.04);
  const throat = S.roundCylinder([0, 0.2, 0], 0.12, 0.16, 0.16, 0.03);
  const body = S.paint(S.intersect(0.02, S.subtract(0.05, mound, throat), S.plane([0, -1, 0], 0.02)), {
    material: 'soil',
    color: (x, y, z) => {
      const r = Math.hypot(x, z), g = fbm3(x * 8, y * 8, z * 8, { seed: 33, octaves: 2 });
      if (r < 0.15 && y < 0.17) return THROAT; 
      if (r < 0.3 + g * 0.12) return g > 0.55 ? SULFUR_HI : SULFUR; 
      return g > 0.5 ? ASH : ASH_DK;
    },
  });
  
  const knobs = [0.4, 2.5, 4.4].map((a) => S.ellipsoid([Math.cos(a) * 0.24, 0.15, Math.sin(a) * 0.24], [0.07, 0.06, 0.07]));
  return S.union(0.02, body, S.paint(S.union(0.02, ...knobs), { color: SULFUR_HI, material: 'gem' }));
}
export const ventForm = () => form('volcano-vent', vent, { min: [-0.62, -0.05, -0.58], max: [0.62, 0.32, 0.58], cell: 0.02, tris: 360 });

function flow() {
  
  const ropes = (x, y, z) => Math.sin(z * 18 + Math.sin(x * 6) * 1.5) * 0.018 + (fbm3(x * 5, y * 5, z * 5, { seed: 41, octaves: 2 }) - 0.5) * 0.06;
  const tongue = S.displace(S.ellipsoid([0, 0, 0], [0.42, 0.11, 1.0]), ropes, 0.04);
  return S.paint(S.intersect(0.02, tongue, S.plane([0, -1, 0], 0.01)), {
    material: 'stone',
    color: (x, y, z) => {
      const c = fbm3(x * 7, z * 7, 3, { seed: 43, octaves: 3 });
      if (Math.abs(c - 0.5) < 0.025 && y > 0.04) return CRACK; 
      return Math.sin(z * 18 + Math.sin(x * 6) * 1.5) > 0.6 ? CRUST_HI : CRUST;
    },
  });
}
export const flowForm = () => form('volcano-flow', flow, { min: [-0.55, -0.05, -1.12], max: [0.55, 0.2, 1.12], cell: 0.025, tris: 420 });



function tubemouth() {
  const rock = S.displace(S.ellipsoid([0, 0.2, -0.15], [1.15, 1.3, 0.8]), lumps(3, 0.22, 71), 0.06);
  const arch = S.union(0.06, S.roundBox([0, 0.42, 0.3], [0.44, 0.44, 0.8], 0.06), S.ellipsoid([0, 0.86, 0.3], [0.44, 0.34, 0.8]));
  return S.paint(S.intersect(0.03, S.subtract(0.06, rock, arch), S.plane([0, -1, 0], 0.02)), {
    material: 'stone',
    color: (x, y, z) => {
      const inside = Math.abs(x) < 0.5 && y < 1.24 && z < 0.62;
      if (inside) return z < -0.2 && y < 0.5 ? CRACK : THROAT;
      if (Math.abs(x) < 0.55 && y > 1.1 && y < 1.32 && z > 0.2 && fbm3(x * 9, y * 9, z * 9, { seed: 73, octaves: 2 }) > 0.62) return SULFUR;
      return fbm3(x * 5, y * 5, z * 5, { seed: 75, octaves: 2 }) > 0.55 ? CRUST_HI : CRUST;
    },
  });
}
export const tubemouthForm = () => form('volcano-tubemouth', tubemouth, { min: [-1.4, -0.05, -1.05], max: [1.4, 1.6, 0.75], cell: 0.03, tris: 900 });

const SLAB = lin('#5e5458'), SLAB_HI = lin('#8a7c74'), FOOT = lin('#3e3438'), INK = lin('#1c1418');
function bridge() {
  const slabs = [-0.62, 0, 0.62].map((z) => S.displace(S.roundBox([0, -0.1, z], [0.62, 0.1, 0.3], 0.04), lumps(9, 0.04, 61 + Math.round(z * 10)), 0.02));
  const deck = S.paint(S.union(0.01, ...slabs), { material: 'stone', color: (x, y, z) => (y < -0.15 ? INK : Math.abs(x) > 0.56 || Math.abs(((z + 0.31) / 0.62) % 1) < 0.06 ? INK : fbm3(x * 8, 1, z * 8, { seed: 63 }) > 0.55 ? SLAB_HI : SLAB) });
  const feet = S.paint(S.union(0.03, S.roundBox([0, -0.5, -0.82], [0.66, 0.45, 0.2], 0.05), S.roundBox([0, -0.5, 0.82], [0.66, 0.45, 0.2], 0.05)), { material: 'stone', color: FOOT });
  const curbs = S.paint(S.union(0.02, S.roundBox([-0.7, 0.07, 0], [0.08, 0.09, 0.98], 0.03), S.roundBox([0.7, 0.07, 0], [0.08, 0.09, 0.98], 0.03)), { material: 'stone', color: (x, y) => (y > 0.13 ? SLAB_HI : FOOT) });
  return S.union(0.01, deck, feet, curbs);
}
export const bridgeForm = () => form('volcano-bridge', bridge, { min: [-0.9, -1.0, -1.3], max: [0.9, 0.22, 1.3], cell: 0.025, tris: 520 });

export function placeVolcano(batch, W) {
  for (const o of W.objects) {
    if (o.kind === 'vent') batch.add(ventForm(), { x: o.x, h: W.groundAt(o.x, o.y) - 0.04, y: o.y, rot: o.rot || 0, s: o.s || 1 });
    else if (o.kind === 'bridge') { const f = bridgeFrame(W, o); batch.add(bridgeForm(), { x: o.x, h: f.h, y: o.y, rot: o.rot || 0, tilt: [f.pitch, 0] }); } 
    else if (o.kind === 'tubemouth') batch.add(tubemouthForm(), { x: o.x, h: W.groundAt(o.x, o.y) - 0.1, y: o.y, rot: o.rot || 0 });
    else if (o.kind === 'flow') batch.add(flowForm(), { x: o.x, h: W.groundAt(o.x, o.y) - 0.03, y: o.y, rot: o.rot || 0, s: [o.s || 1, 1, o.s || 1] });
  }
}


export function createVentSteam(scene, W) {
  const list = W.objects.filter((o) => o.kind === 'vent');
  if (!list.length) return { update() {} };
  const PER = 8, steam = createParticles(scene, list.length * PER, { mode: 'soft', soft: true, name: 'vent-steam' });
  const TINT = lin('#fff8d8');
  return {
    update(t) {
      list.forEach((o, s) => {
        const h = W.groundAt(o.x, o.y) + 0.15;
        for (let k = 0; k < PER; k++) {
          const ph = (t * 0.18 + k / PER + s * 0.37) % 1, a = k * 2.39;
          steam.set(s * PER + k, o.x + Math.cos(a) * 0.1 + ph * 0.35, h + ph * 1.6, o.y + Math.sin(a) * 0.1 - ph * 0.15,
            0.3 + ph * 0.7, 0.34 * Math.sin(ph * Math.PI), TINT);
        }
      });
      steam.commit();
    },
  };
}
