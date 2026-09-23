


























export const PATH_FIELD = Object.freeze({ size: 512, originM: -48, spanM: 96, maxM: 4 });

export function pathField({ PATHS, pathDistance }, { size, originM, spanM, maxM } = PATH_FIELD) {
  const data = new Uint8Array(size * size).fill(255);
  const boxes = PATHS.map((line) => {
    const xs = line.map((p) => p[0]), zs = line.map((p) => p[1]);
    return [Math.min(...xs) - maxM, Math.min(...zs) - maxM, Math.max(...xs) + maxM, Math.max(...zs) + maxM];
  });
  const texel = spanM / size;
  for (let j = 0; j < size; j++) {
    const z = originM + (j + 0.5) * texel;
    for (let i = 0; i < size; i++) {
      const x = originM + (i + 0.5) * texel;
      if (!boxes.some((b) => x >= b[0] && x <= b[2] && z >= b[1] && z <= b[3])) continue;
      data[j * size + i] = Math.round(Math.min(1, pathDistance(x, z) / maxM) * 255);
    }
  }
  return { data, size, originM, spanM, maxM };
}


export function sampleField({ data, size, originM, spanM, maxM }, x, z) {
  const u = ((x - originM) / spanM) * size - 0.5, v = ((z - originM) / spanM) * size - 0.5;
  const i0 = Math.max(0, Math.min(size - 1, Math.floor(u))), j0 = Math.max(0, Math.min(size - 1, Math.floor(v)));
  const i1 = Math.min(size - 1, i0 + 1), j1 = Math.min(size - 1, j0 + 1);
  const fu = Math.max(0, Math.min(1, u - i0)), fv = Math.max(0, Math.min(1, v - j0));
  const at = (i, j) => data[j * size + i] / 255;
  const top = at(i0, j0) * (1 - fu) + at(i1, j0) * fu, bottom = at(i0, j1) * (1 - fu) + at(i1, j1) * fu;
  return (top * (1 - fv) + bottom * fv) * maxM;
}
