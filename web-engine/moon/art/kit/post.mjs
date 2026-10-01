


import { sweep, superellipseProfile } from '../../mesh/bevel.mjs';

export function cornerPost({ height, radius = 0.13, detail = 0, rng }) {
  const sides = detail === 0 ? 8 : detail === 1 ? 6 : 4;
  const stations = detail === 0 ? 3 : 2;
  const lx = rng.rangeF(-1, 1) * 0.04, lz = rng.rangeF(-1, 1) * 0.03;
  const path = [];
  for (let i = 0; i < stations; i++) {
    const t = i / (stations - 1);
    path.push([lx * t * t, t * height, lz * t * t]);
  }
  return sweep({
    profile: superellipseProfile(radius, radius * rng.rangeF(0.9, 1.05), 3.2, sides),
    path,
    up: [0, 0, 1],
    scales: (t) => 1.08 - 0.12 * t,
    caps: ['none', detail === 2 ? 'none' : 'round'],
    capSegments: detail === 0 ? 2 : 1,
    capLength: radius * 0.7,
    uvScale: 1,
  });
}
