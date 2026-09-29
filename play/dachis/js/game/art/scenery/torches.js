



import { S, form, lin, createParticles } from './kit.js';

const WOOD = lin('#7a4e2c'), ROPE = lin('#d8c08a'), IRON = lin('#4a4450'), CORE = lin('#ffd070');
const TOP = 1.02;

function torchNode() {
  const post = S.paint(S.roundCone([0, 0, 0], [0, 0.92, 0], 0.06, 0.045), { color: WOOD, material: 'wood' });
  const ropes = S.paint(S.union(0.005, S.torus([0, 0.35, 0], 0.058, 0.014), S.torus([0, 0.8, 0], 0.05, 0.014)), { color: ROPE, material: 'wood' });
  
  const bowl = S.subtract(0.01, S.roundCylinder([0, 0.95, 0], 0.07, 0.13, 0.06, 0.02), S.roundCylinder([0, 1.0, 0], 0.05, 0.11, 0.05, 0.02));
  const prongs = S.union(0.01, ...[0, 1, 2, 3].map((k) => {
    const a = k * Math.PI / 2 + 0.4, x = Math.sin(a) * 0.12, z = Math.cos(a) * 0.12;
    return S.capsule([x, 0.98, z], [x * 1.25, 1.12, z * 1.25], 0.012);
  }));
  const iron = S.paint(S.union(0.01, bowl, prongs), { color: IRON, material: 'metal' });
  const core = S.paint(S.roundCone([0, 0.99, 0], [0, 1.1, 0], 0.075, 0.02), { color: CORE, material: 'fire' });
  return S.union(0.01, post, ropes, iron, core);
}
export const torchForm = () => form('torch', torchNode, { min: [-0.25, -0.05, -0.25], max: [0.25, 1.25, 0.25], cell: 0.022, tris: 320 });

export function placeTorches(batch, W) {
  const f = torchForm();
  for (const o of W.objects) if (o.kind === 'torch') batch.add(f, { x: o.x, h: W.groundAt(o.x, o.y), y: o.y, rot: o.x * 3 });
}

const FLAME = [lin('#ffd070'), lin('#ff9a30'), lin('#f06018'), lin('#b02810')];
const lerpC = (t) => {
  const f = Math.min(0.999, Math.max(0, t)) * (FLAME.length - 1), i = Math.floor(f), k = f - i;
  const a = FLAME[i], b = FLAME[i + 1];
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
};

export function createTorchFire(scene, W) {
  const spots = W.objects.filter((o) => o.kind === 'torch').map((o) => [o.x, W.groundAt(o.x, o.y) + TOP, o.y]);
  const PER = 14, EMB = 3;
  const flames = createParticles(scene, spots.length * PER, { name: 'torch-flames' });
  const glows = createParticles(scene, spots.length, { soft: true, name: 'torch-glows' });
  const embers = createParticles(scene, spots.length * EMB, { name: 'torch-embers' });
  const GLOW = lin('#ff9a40');
  return {
    update(t) {
      spots.forEach(([x, h, y], s) => {
        for (let k = 0; k < PER; k++) {
          const ph = ((t * 1.9 + k / PER + s * 0.37) % 1), seed = k * 7.1 + s * 3.3;
          const sway = Math.sin(t * 5 + seed) * 0.03 * ph;
          flames.set(s * PER + k, x + Math.sin(seed) * 0.05 * (1 - ph) + sway, h + ph * 0.34, y + Math.cos(seed) * 0.05 * (1 - ph),
            0.17 * (1 - ph * 0.7), 0.7 - ph * 0.4, lerpC(ph));
        }
        const flick = 0.85 + Math.sin(t * 11 + s) * 0.08 + Math.sin(t * 6.3 + s * 2) * 0.07;
        glows.set(s, x, h + 0.12, y, 1.6 * flick, 0.5 * flick, GLOW);
        for (let k = 0; k < EMB; k++) {
          const ph = ((t * 0.45 + k / EMB + s * 0.21) % 1), seed = k * 5.7 + s;
          embers.set(s * EMB + k, x + Math.sin(seed + ph * 3) * 0.15 * ph, h + 0.3 + ph * 0.9, y + Math.cos(seed * 1.3) * 0.12 * ph,
            0.035, 1 - ph, lerpC(0.3 + ph * 0.6));
        }
      });
      flames.commit(); glows.commit(); embers.commit();
    },
  };
}
