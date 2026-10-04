



import { S, form, lin, jit } from './kit.js';






const TREAD = lin('#c99a6a'), NOSE = lin('#e6c49a'), RISER = lin('#6b4630'), INK = lin('#1c1418');
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

export function placeSteps(batch, W) {
  const f = slabForm();
  for (const o of W.objects) {
    if (o.kind !== 'step') continue;
    const dx = Math.sin(o.rot), dy = Math.cos(o.rot);
    const top = W.groundAt(o.x - dx * 0.26, o.y - dy * 0.26) + 0.03;
    batch.add(f, { x: o.x, h: top, y: o.y, rot: o.rot, s: [1, 1 + jit(o.i, 2) * 0.2, 1] });
  }
}
