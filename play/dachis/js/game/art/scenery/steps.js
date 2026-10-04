



import { S, form, lin, jit } from './kit.js';

const STONE = lin('#cfc5b8'), EDGE = lin('#a89e94');

function slabNode() {
  
  
  const body = S.roundBox([0, -0.17, 0], [0.56, 0.17, 0.27], 0.07);
  return S.paint(body, {
    material: 'stone',
    
    color: (x, y) => {
      const joint = Math.abs(((x + 0.56) / 1.12) * 3 % 1 - 0.5) > 0.46 ? 0.82 : 1;
      const c = y > -0.02 ? STONE : EDGE;
      return [c[0] * joint, c[1] * joint, c[2] * joint];
    },
  });
}
export const slabForm = () => form('step-slab', slabNode, { min: [-0.7, -0.4, -0.35], max: [0.7, 0.05, 0.35], cell: 0.03, tris: 420 });

export function placeSteps(batch, W) {
  const f = slabForm();
  for (const o of W.objects) {
    if (o.kind !== 'step') continue;
    const dx = Math.sin(o.rot), dy = Math.cos(o.rot);
    const top = W.groundAt(o.x - dx * 0.26, o.y - dy * 0.26) + 0.03;
    batch.add(f, { x: o.x, h: top, y: o.y, rot: o.rot, s: [1, 1 + jit(o.i, 2) * 0.2, 1] });
  }
}
