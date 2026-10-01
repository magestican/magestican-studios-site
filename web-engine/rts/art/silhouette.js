
























































































































export const THRESHOLD = 0.74;








export const HERD_SPREAD = Object.freeze({ median: 0.439, worst: 0.639, tolerance: 0.06 });


export const TILT = (48 * Math.PI) / 180;















export const FACINGS = 8;















export function project(x, y, z, tilt = TILT) {
  return [x, y * Math.cos(tilt) + z * Math.sin(tilt)];
}


export function spin(x, y, a) {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [x * c - y * s, x * s + y * c];
}
















export function silhouette(parts, facing = 0, n = 48, facings = FACINGS) {
  const a = (facing * Math.PI * 2) / facings;

  
  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;
  const flat = [];
  for (const p of parts) {
    const pos = p.mesh.positions;
    const uv = new Float64Array((pos.length / 3) * 2);
    for (let i = 0, j = 0; i < pos.length; i += 3, j += 2) {
      const [rx, ry] = spin(pos[i], pos[i + 1], a);
      const [u, v] = project(rx, ry, pos[i + 2]);
      uv[j] = u;
      uv[j + 1] = v;
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
    }
    flat.push({ uv, idx: p.mesh.indices });
  }
  if (!Number.isFinite(minU)) return { n, bits: new Uint8Array(n * n), area: 0 };

  const cu = (minU + maxU) / 2;
  const cv = (minV + maxV) / 2;
  
  
  const half = (Math.max(maxU - minU, maxV - minV) / 2) * 1.04 || 1;
  const scale = n / (half * 2);

  const bits = new Uint8Array(n * n);

  
  for (const { uv, idx } of flat) {
    for (let t = 0; t < idx.length; t += 3) {
      const i0 = idx[t] * 2;
      const i1 = idx[t + 1] * 2;
      const i2 = idx[t + 2] * 2;
      
      
      
      const x0 = (uv[i0] - cu + half) * scale;
      const y0 = (half - (uv[i0 + 1] - cv)) * scale;
      const x1 = (uv[i1] - cu + half) * scale;
      const y1 = (half - (uv[i1 + 1] - cv)) * scale;
      const x2 = (uv[i2] - cu + half) * scale;
      const y2 = (half - (uv[i2 + 1] - cv)) * scale;

      const area2 = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0);
      if (area2 === 0) continue;            
      const inv = 1 / area2;

      const lo = (v) => Math.max(0, Math.floor(v));
      const hi = (v) => Math.min(n - 1, Math.ceil(v));
      const px0 = lo(Math.min(x0, x1, x2));
      const px1 = hi(Math.max(x0, x1, x2));
      const py0 = lo(Math.min(y0, y1, y2));
      const py1 = hi(Math.max(y0, y1, y2));

      for (let py = py0; py <= py1; py += 1) {
        const cy = py + 0.5;
        for (let px = px0; px <= px1; px += 1) {
          const cx = px + 0.5;
          
          
          const w0 = ((x1 - cx) * (y2 - cy) - (x2 - cx) * (y1 - cy)) * inv;
          const w1 = ((x2 - cx) * (y0 - cy) - (x0 - cx) * (y2 - cy)) * inv;
          const w2 = 1 - w0 - w1;
          if (w0 >= -1e-9 && w1 >= -1e-9 && w2 >= -1e-9) bits[py * n + px] = 1;
        }
      }
    }
  }

  let area = 0;
  for (let i = 0; i < bits.length; i += 1) area += bits[i];
  return { n, bits, area };
}








export function iou(a, b) {
  if (a.n !== b.n) throw new Error(`mask sizes differ: ${a.n} vs ${b.n}`);
  let inter = 0;
  let union = 0;
  for (let i = 0; i < a.bits.length; i += 1) {
    const x = a.bits[i];
    const y = b.bits[i];
    if (x & y) inter += 1;
    if (x | y) union += 1;
  }
  return union === 0 ? 1 : inter / union;
}








export function silhouetteSet(parts, n = 48, facings = FACINGS) {
  const out = [];
  for (let f = 0; f < facings; f += 1) out.push(silhouette(parts, f, n, facings));
  return out;
}


















export function similarity(setA, setB) {
  let sum = 0;
  let max = 0;
  let worstFacing = 0;
  for (let f = 0; f < setA.length; f += 1) {
    const v = iou(setA[f], setB[f]);
    sum += v;
    if (v > max) { max = v; worstFacing = f; }
  }
  return { mean: sum / setA.length, max, worstFacing };
}











export function confusionPairs(setsById, opts = {}) {
  const ids = Object.keys(setsById).sort();
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const allow = new Set((opts.allow || []).map((p) => [...p].sort().join('\u0000')));
  const out = [];
  for (let i = 0; i < ids.length; i += 1) {
    for (let j = i + 1; j < ids.length; j += 1) {
      if (allow.has([ids[i], ids[j]].sort().join('\u0000'))) continue;
      const s = similarity(setsById[ids[i]], setsById[ids[j]]);
      out.push({ a: ids[i], b: ids[j], ...s });
    }
  }
  
  
  out.sort((p, q) => (q.mean - p.mean) || p.a.localeCompare(q.a) || p.b.localeCompare(q.b));
  return out;
}


export function printMask(m) {
  const rows = [];
  for (let y = 0; y < m.n; y += 1) {
    let s = '';
    for (let x = 0; x < m.n; x += 1) s += m.bits[y * m.n + x] ? '#' : '.';
    rows.push(s);
  }
  return rows.join('\n');
}
