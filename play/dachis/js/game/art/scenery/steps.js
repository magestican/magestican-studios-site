



import { S, form, lin, jit } from './kit.js';
import { fbm3 } from '../../../vendor/fml/moon/noise.js';






const TREAD = lin('#c99a6a'), NOSE = lin('#e6c49a'), RISER = lin('#6b4630'), INK = lin('#1c1418');


const B_TREAD = lin('#5e5458'), B_DUST = lin('#7c706a'), B_NOSE = lin('#b0a294'), B_FACE = lin('#3e3438');
const HW = 0.44, HD = 0.27;

function slabNode() {
  const body = S.roundBox([0, -0.17, 0], [HW, 0.17, HD], 0.05);
  return S.paint(body, {
    material: 'stone',
    color: (x, y, z) => {
      if (y < -0.03) return y < -0.1 ? INK : RISER; 
      if (z > HD - 0.07 || Math.abs(x) > HW - 0.06) return INK; 
      if (z > HD - 0.14) return NOSE; 
      return TREAD;
    },
  });
}
export const slabForm = () => form('step-slab', slabNode, { min: [-0.6, -0.4, -0.35], max: [0.6, 0.05, 0.35], cell: 0.025, tris: 520 });

function basaltSlabNode() {
  const rough = (x, y, z) => (fbm3(x * 9, y * 9, z * 9, { seed: 77, octaves: 2 }) - 0.5) * 0.05;
  const body = S.displace(S.roundBox([0, -0.17, 0], [HW + 0.04, 0.17, HD], 0.04), rough, 0.03);
  return S.paint(body, {
    material: 'stone',
    color: (x, y, z) => {
      const g = fbm3(x * 11, y * 11, z * 11, { seed: 79, octaves: 2 });
      if (y < -0.03) return y < -0.27 ? INK : B_FACE; 
      if (z > HD - 0.06 || Math.abs(x) > HW - 0.02) return INK; 
      if (z > HD - 0.13) return B_NOSE; 
      return g > 0.55 ? B_DUST : B_TREAD; 
    },
  });
}
export const basaltSlabForm = () => form('step-basalt', basaltSlabNode, { min: [-0.62, -0.42, -0.37], max: [0.62, 0.07, 0.37], cell: 0.025, tris: 560 });

export function placeSteps(batch, W) {
  const f = slabForm(), fb = basaltSlabForm();
  for (const o of W.objects) {
    if (o.kind !== 'step') continue;
    const dx = Math.sin(o.rot), dy = Math.cos(o.rot);
    const top = W.groundAt(o.x - dx * 0.26, o.y - dy * 0.26) + 0.03;
    
    
    const drop = top - W.groundAt(o.x + dx * 0.3, o.y + dy * 0.3);
    batch.add(o.flavor === 'basalt' ? fb : f, { x: o.x, h: top, y: o.y, rot: o.rot, s: [1, Math.max(1 + jit(o.i, 2) * 0.2, (drop + 0.08) / 0.34), 1] });
  }
}
