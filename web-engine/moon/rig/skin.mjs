

























export const DEFAULT_BLEND = 0.03;




export function partWeights(positions, parts, { from = 0, to = positions.length / 3, parents = null } = {}) {
  const count = Math.max(0, to - from);
  const nb = Math.max(parents ? parents.length : 0, parts.reduce((m, p) => Math.max(m, p.bone + 1), 0));
  const indices = new Array(count * 4).fill(0);
  const weights = new Array(count * 4).fill(0);
  const d = new Float64Array(parts.length);
  const wb = new Float64Array(nb);
  const topB = new Int32Array(5), topW = new Float64Array(5);
  for (let v = 0; v < count; v++) {
    const o = (from + v) * 3;
    const x = positions[o], y = positions[o + 1], z = positions[o + 2];
    let dmin = Infinity;
    for (let p = 0; p < parts.length; p++) {
      d[p] = parts[p].node.d(x, y, z);
      if (d[p] < dmin) dmin = d[p];
    }
    wb.fill(0);
    let nearest = -1;
    for (let p = 0; p < parts.length; p++) {
      if (d[p] === dmin && nearest < 0) nearest = parts[p].bone;
      const e = (d[p] - dmin) / (parts[p].blend || DEFAULT_BLEND);
      if (e > 4) continue;
      const w = Math.exp(-e * e);
      if (w > wb[parts[p].bone]) wb[parts[p].bone] = w;
    }
    if (parents) {
      for (let b = 0; b < nb; b++) {
        if (b !== nearest && b !== parents[nearest] && parents[b] !== nearest) wb[b] = 0;
      }
    }
    
    topW.fill(0); topB.fill(0);
    for (let b = 0; b < nb; b++) {
      const w = wb[b];
      if (w <= topW[4]) continue;
      let j = 4;
      while (j > 0 && topW[j - 1] < w) { topW[j] = topW[j - 1]; topB[j] = topB[j - 1]; j--; }
      topW[j] = w; topB[j] = b;
    }
    let sum = 0;
    for (let j = 0; j < 4; j++) sum += Math.max(0, topW[j] - topW[4]);
    for (let j = 0; j < 4; j++) {
      indices[v * 4 + j] = topB[j];
      
      weights[v * 4 + j] = sum > 1e-12 ? Math.max(0, topW[j] - topW[4]) / sum : 0.25;
    }
  }
  return { indices, weights };
}

export function rigidWeights(count, bone) {
  const indices = new Array(count * 4).fill(0);
  const weights = new Array(count * 4).fill(0);
  for (let v = 0; v < count; v++) { indices[v * 4] = bone; weights[v * 4] = 1; }
  return { indices, weights };
}




export function setSkin(group, start, { indices, weights }) {
  const n = group.positions.length / 3;
  if (!group.skinIndices) { group.skinIndices = []; group.skinWeights = []; }
  while (group.skinIndices.length < n * 4) { group.skinIndices.push(0); group.skinWeights.push(0); }
  for (let i = 0; i < indices.length; i++) {
    group.skinIndices[start * 4 + i] = indices[i];
    group.skinWeights[start * 4 + i] = weights[i];
  }
  return group;
}



export function deform(positions, skinIndices, skinWeights, mats, out = new Float64Array(positions.length)) {
  const n = positions.length / 3;
  for (let v = 0; v < n; v++) {
    const x = positions[v * 3], y = positions[v * 3 + 1], z = positions[v * 3 + 2];
    let px = 0, py = 0, pz = 0;
    for (let k = v * 4; k < v * 4 + 4; k++) {
      const w = skinWeights[k];
      if (w === 0) continue;
      const o = skinIndices[k] * 12;
      px += w * (mats[o] * x + mats[o + 1] * y + mats[o + 2] * z + mats[o + 3]);
      py += w * (mats[o + 4] * x + mats[o + 5] * y + mats[o + 6] * z + mats[o + 7]);
      pz += w * (mats[o + 8] * x + mats[o + 9] * y + mats[o + 10] * z + mats[o + 11]);
    }
    out[v * 3] = px; out[v * 3 + 1] = py; out[v * 3 + 2] = pz;
  }
  return out;
}

const triNormal = (P, a, b, c) => {
  const ux = P[b * 3] - P[a * 3], uy = P[b * 3 + 1] - P[a * 3 + 1], uz = P[b * 3 + 2] - P[a * 3 + 2];
  const wx = P[c * 3] - P[a * 3], wy = P[c * 3 + 1] - P[a * 3 + 1], wz = P[c * 3 + 2] - P[a * 3 + 2];
  return [uy * wz - uz * wy, uz * wx - ux * wz, ux * wy - uy * wx];
};










export function deformationReport(group, mats, { minRestArea = 2e-6, strict = { minAreaRatio: 0.25, maxAreaRatio: 4, maxFoldDeg: 120 } } = {}) {
  const P = group.positions, I = group.indices, si = group.skinIndices, sw = group.skinWeights;
  const Q = deform(P, si, sw, mats);
  const M = new Float64Array(9);
  const report = { minAreaRatio: Infinity, maxAreaRatio: 0, maxFoldDeg: 0, counted: 0, skipped: 0, worstArea: -1, worstFold: -1, badShare: 0, badCount: 0 };
  let total = 0, bad = 0;
  for (let f = 0; f < I.length; f += 3) {
    const a = I[f], b = I[f + 1], c = I[f + 2];
    const rn = triNormal(P, a, b, c);
    const rl = Math.hypot(rn[0], rn[1], rn[2]);
    if (rl / 2 < minRestArea) { report.skipped++; continue; }
    const pn = triNormal(Q, a, b, c);
    const pl = Math.hypot(pn[0], pn[1], pn[2]);
    M.fill(0);
    for (const v of [a, b, c]) {
      for (let k = v * 4; k < v * 4 + 4; k++) {
        const w = sw[k] / 3;
        if (w === 0) continue;
        const o = si[k] * 12;
        M[0] += w * mats[o]; M[1] += w * mats[o + 1]; M[2] += w * mats[o + 2];
        M[3] += w * mats[o + 4]; M[4] += w * mats[o + 5]; M[5] += w * mats[o + 6];
        M[6] += w * mats[o + 8]; M[7] += w * mats[o + 9]; M[8] += w * mats[o + 10];
      }
    }
    const ex = M[0] * rn[0] + M[1] * rn[1] + M[2] * rn[2];
    const ey = M[3] * rn[0] + M[4] * rn[1] + M[5] * rn[2];
    const ez = M[6] * rn[0] + M[7] * rn[1] + M[8] * rn[2];
    const el = Math.hypot(ex, ey, ez) || 1;
    const cos = pl > 0 ? (pn[0] * ex + pn[1] * ey + pn[2] * ez) / (pl * el) : -1;
    const fold = (Math.acos(Math.max(-1, Math.min(1, cos))) * 180) / Math.PI;
    const ratio = pl / rl;
    report.counted++;
    total += rl;
    if (ratio < strict.minAreaRatio || ratio > strict.maxAreaRatio || fold > strict.maxFoldDeg) { bad += rl; report.badCount++; }
    if (ratio < report.minAreaRatio) { report.minAreaRatio = ratio; if (ratio < 1) report.worstArea = f / 3; }
    if (ratio > report.maxAreaRatio) { report.maxAreaRatio = ratio; if (ratio > 1 && !(report.minAreaRatio < 1 / ratio)) report.worstArea = f / 3; }
    if (fold > report.maxFoldDeg) { report.maxFoldDeg = fold; report.worstFold = f / 3; }
  }
  report.badShare = total > 0 ? bad / total : 0;
  return report;
}
