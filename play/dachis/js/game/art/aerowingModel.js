









import * as S from '../../vendor/fml/moon/mesh/sdf.js';
import { lin, fur, metal, glow, buildArrays, faceDecals, ell, vivid } from './dachiModel.js';





const BODY = lin('#f06418'), WING = lin('#e04a18'), TIP = lin('#ffd88a'), CREST = vivid(lin('#e0102a')), BEAK = lin('#ffc81a');
const BELLY = lin('#fff0c8'), BRASS = lin('#6a3a12'), BONE = lin('#f6efdc'), FLAME = lin('#ffb040'), TALON = lin('#3a2418');
export const AEROWING_FRAMES = [0.62, 0.12, -0.42]; 

export function aerowingNode(frame = 1) {
  const a = AEROWING_FRAMES[frame] ?? AEROWING_FRAMES[1], parts = [];
  
  const bodyC = [0, 0, -0.1];
  const belly = (x, y, z) => ((z > 0.15 && y < 0.35 && Math.abs(x) < 0.55) ? BELLY : BODY);
  parts.push(fur(ell(bodyC, [0.72, 0.66, 0.86]), belly));
  
  const hc = [0, 0.95, 0.42], hr = 0.82;
  parts.push(fur(ell(hc, [hr, hr * 0.95, hr * 0.92]), BODY));
  
  parts.push(fur(S.transform(S.roundCone([0, 0, 0], [0, -0.06, 0.36], 0.2, 0.06), { translate: [0, hc[1] - 0.3, hc[2] + hr * 0.82], scale: [1.35, 0.8, 1] }), BEAK));
  
  
  for (const [x, len, tilt] of [[-0.24, 0.75, -0.5], [0, 0.5, 0], [0.24, 0.75, 0.5]]) {
    const b = [x, hc[1] + hr * 0.8, hc[2] + 0.05];
    parts.push(fur(S.roundCone(b, [x + tilt * 0.8, b[1] + len * 0.62, b[2] - len * 0.75], 0.14, 0.04), CREST));
  }
  for (const sx of [-1, 1]) parts.push(fur(S.roundCone([sx * 0.52, hc[1] + 0.52, hc[2] - 0.1], [sx * 0.85, hc[1] + 0.95, hc[2] - 0.35], 0.1, 0.03), BONE));
  
  for (const sx of [-1, 1]) {
    const s = [sx * 0.55, 0.22, -0.12], d = [sx * Math.cos(a), Math.sin(a), 0], p = [sx * Math.sin(a), -Math.cos(a), 0];
    const at = (u, v) => [s[0] + d[0] * u + p[0] * v, s[1] + d[1] * u + p[1] * v, s[2]];
    const ang = Math.atan2(d[1], d[0]);
    const tipP = at(2.35, 0);
    parts.push(metal(S.union(0.05, S.capsule(s, at(1.1, -0.05), 0.11), S.capsule(at(1.1, -0.05), tipP, 0.08), S.sphere(at(1.1, -0.05), 0.13)), BRASS));
    const mem = S.transform(ell([0, 0, 0], [1.15, 0.55, 0.1]), { translate: at(1.15, 0.38), rotate: [0, 0, ang] });
    parts.push(fur(mem, WING));
    for (let k = 0; k < 3; k++) {
      const u = 1.35 + k * 0.42, root = at(u, 0.3), tip = at(u + 0.35 - k * 0.05, 0.95 + (2 - k) * 0.12);
      parts.push(fur(S.capsule(root, tip, 0.13 - k * 0.015), k === 2 ? TIP : mix3(WING, TIP, k * 0.35)));
    }
  }
  
  const tail = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8; tail.push([-0.5 * t - 0.3 * t * t, -0.2 - 0.9 * t + 0.35 * t * t, -0.7 - 0.9 * t]); }
  parts.push(fur(S.union(0.06, ...tail.slice(1).map((q, i) => S.capsule(tail[i], q, 0.22 - i * 0.018))), BODY));
  const end = tail[tail.length - 1];
  parts.push(glow(S.roundCone(end, [end[0] - 0.15, end[1] + 0.45, end[2] - 0.2], 0.2, 0.05), FLAME));
  
  for (const sx of [-1, 1]) {
    const hip = [sx * 0.32, -0.45, 0.15], ankle = [sx * 0.36, -0.95, 0.3];
    parts.push(fur(S.capsule(hip, ankle, 0.13), TALON));
    for (const tx of [-0.1, 0, 0.1]) parts.push(fur(S.capsule(ankle, [ankle[0] + tx, ankle[1] - 0.18, ankle[2] + 0.12], 0.06), TALON));
  }
  const node = S.union(0.06, ...parts);
  
  node.box = { min: [-3.1, -2.1, -2.2], max: [3.1, 2.6, 1.7], free: true };
  node.decals = faceDecals({ c: hc, r: hr * 0.96 }, AERO_FACE, { iris: lin('#e0402a'), beak: true });
  return node;
}
const AERO_FACE = { eyeDir: [0.42, 0.18, 0.89], eyeK: 0.95, blushDir: [0.7, -0.14, 0.7] };
const mix3 = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

export const aerowingKey = (frame = 1) => `aerowing-${frame}`;
export function aerowingArrays({ frame = 1 } = {}) {
  return buildArrays(aerowingKey(frame), aerowingNode(frame), 'Aerowing', undefined, { tris: 2800 });
}
