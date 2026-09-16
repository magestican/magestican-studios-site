








import * as S from '../../../mesh/sdf.mjs';
import { linear } from '../../../palette/seasons.mjs';

export const FRUIT_COLOR = Object.freeze({
  apple: '#de3b36', peach: '#ff9d62', cherry: '#b01c3a', orchard: '#f07a3e',
});
const GREEN = '#5aa84a', BROWN = '#6b4a34';



function dome(c, rx, ry, rz, hex, material) {
  return S.paint(S.ellipsoid(c, [rx, ry, rz * 1.35]), { material, color: linear(hex) });
}

function leaf(s, at, angle, material) {
  return S.paint(S.transform(S.ellipsoid([0, 0, 0], [0.24 * s, 0.1 * s, 0.09 * s]), { translate: at, rotate: [0, 0, angle] }), { material, color: linear(GREEN) });
}

export function fruitMarkLocal(variant, s, material) {
  const k = s * 0.02;
  if (variant === 'apple') {
    return S.union(k, dome([0, -0.06 * s, 0], 0.46 * s, 0.42 * s, 0.16 * s, FRUIT_COLOR.apple, material),
      S.paint(S.capsule([0.02 * s, 0.3 * s, 0.08 * s], [0.07 * s, 0.5 * s, 0.08 * s], 0.045 * s), { material, color: linear(BROWN) }),
      leaf(s, [0.27 * s, 0.45 * s, 0.07 * s], 0.5, material));
  }
  if (variant === 'peach') {
    const body = S.displace(dome([0, -0.04 * s, 0], 0.47 * s, 0.46 * s, 0.17 * s, FRUIT_COLOR.peach, material),
      (x, y, z) => 0.05 * s * Math.exp(-(((x - 0.1 * s) / (0.07 * s)) ** 2)) * (y > -0.2 * s ? 1 : 0.4), 0.05 * s);
    return S.union(k, body, leaf(s, [-0.26 * s, 0.44 * s, 0.07 * s], -0.45, material));
  }
  if (variant === 'cherry') {
    const stem = S.paint(S.union(k, S.capsule([-0.24 * s, -0.08 * s, 0.1 * s], [0.08 * s, 0.46 * s, 0.07 * s], 0.035 * s),
      S.capsule([0.24 * s, -0.16 * s, 0.1 * s], [0.08 * s, 0.46 * s, 0.07 * s], 0.035 * s)), { material, color: linear(GREEN) });
    return S.union(k, dome([-0.24 * s, -0.24 * s, 0], 0.26 * s, 0.25 * s, 0.14 * s, FRUIT_COLOR.cherry, material),
      dome([0.25 * s, -0.31 * s, 0], 0.23 * s, 0.22 * s, 0.13 * s, FRUIT_COLOR.cherry, material),
      stem, leaf(s, [0.3 * s, 0.44 * s, 0.07 * s], 0.3, material));
  }
  if (variant === 'orchard') {
    return S.union(k, dome([-0.2 * s, -0.04 * s, 0], 0.32 * s, 0.3 * s, 0.14 * s, FRUIT_COLOR.apple, material),
      dome([0.22 * s, -0.12 * s, 0.01 * s], 0.3 * s, 0.3 * s, 0.15 * s, FRUIT_COLOR.peach, material),
      leaf(s, [0.02 * s, 0.34 * s, 0.08 * s], 0.2, material));
  }
  throw new Error(`no fruit mark for '${variant}'`);
}


export function fruitMarkOn(surface, guess, variant, s, material, { up = [0, 1, 0], sink = 0.04 } = {}) {
  const at = S.projectToSurface(surface, guess, 6);
  const n = S.normalAt(surface, at[0], at[1], at[2]);
  const f = S.frameFromNormal(n, up);
  const o = [at[0] - n[0] * s * sink, at[1] - n[1] * s * sink, at[2] - n[2] * s * sink];
  return { node: S.place(fruitMarkLocal(variant, s, material), o, f.X, f.Y, f.Z), at, n };
}
