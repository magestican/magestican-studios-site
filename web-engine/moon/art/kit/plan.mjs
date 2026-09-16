







export const rotY = (x, z, a) => [x * Math.cos(a) + z * Math.sin(a), -x * Math.sin(a) + z * Math.cos(a)];



export function boxRect(cx, cz, [lx0, lx1, lz0, lz1], a = 0) {
  const pts = [[lx0, lz0], [lx1, lz0], [lx1, lz1], [lx0, lz1]].map(([x, z]) => rotY(x, z, a));
  const xs = pts.map((p) => p[0]), zs = pts.map((p) => p[1]);
  return [cx + Math.min(...xs), cx + Math.max(...xs), cz + Math.min(...zs), cz + Math.max(...zs)];
}

export function unionRects(rects) {
  return rects.reduce((u, r) => [Math.min(u[0], r[0]), Math.max(u[1], r[1]), Math.min(u[2], r[2]), Math.max(u[3], r[3])], [Infinity, -Infinity, Infinity, -Infinity]);
}


export function frameOf(rects) {
  const [x0, x1, z0, z1] = unionRects(rects);
  return { ox: -(x0 + x1) / 2, oz: -(z0 + z1) / 2, hx: (x1 - x0) / 2, hz: (z1 - z0) / 2 };
}

export const round3 = (v) => Math.round(v * 1000) / 1000;

export function levelOf(stages, stage) {
  const i = stages.indexOf(stage);
  if (i < 0) throw new Error(`unknown stage '${stage}' (stages: ${stages.join(', ')})`);
  return i + 1;
}
