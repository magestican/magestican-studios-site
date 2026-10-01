













import { quatFromEuler, quatNlerp, clamp, frac } from './math.mjs';
import { boneIndex, createPose } from './skeleton.mjs';

const hermite = (s) => {
  const s2 = s * s, s3 = s2 * s;
  return [2 * s3 - 3 * s2 + 1, s3 - 2 * s2 + s, -2 * s3 + 3 * s2, s3 - s2];
};


export function keySpan(times, loop, phase) {
  const n = times.length;
  if (n === 1) return { k: [0, 0, 0, 0], c: [0, 1, 0, 0] };
  if (loop) {
    const p = frac(phase);
    let i = n - 1;
    for (let j = 0; j < n; j++) if (times[j] > p) { i = j - 1; break; }
    const at = (k) => times[((k % n) + n) % n] + Math.floor(k / n);
    const wrap = (k) => ((k % n) + n) % n;
    const t0 = at(i), t1 = at(i + 1);
    const h = t1 - t0;
    const [h00, h10, h01, h11] = hermite((p - t0) / h);
    const ka = (h * h10) / (t1 - at(i - 1));
    const kb = (h * h11) / (at(i + 2) - t0);
    return { k: [wrap(i - 1), wrap(i), wrap(i + 1), wrap(i + 2)], c: [-ka, h00 - kb, h01 + ka, kb] };
  }
  const p = clamp(phase, 0, 1);
  let i = 0;
  while (i < n - 2 && times[i + 1] <= p) i++;
  const t0 = times[i], t1 = times[i + 1];
  const h = t1 - t0;
  const [h00, h10, h01, h11] = hermite(clamp((p - t0) / h, 0, 1));
  const ka = i > 0 ? (h * h10) / (t1 - times[i - 1]) : 0;
  const kb = i + 2 < n ? (h * h11) / (times[i + 2] - t0) : 0;
  return { k: [Math.max(i - 1, 0), i, i + 1, Math.min(i + 2, n - 1)], c: [-ka, h00 - kb, h01 + ka, kb] };
}

const resolved = new WeakMap();
function resolve(skeleton, clip) {
  let r = resolved.get(clip);
  if (!r || r.bones !== skeleton.bones) {
    r = {
      bones: skeleton.bones,
      tracks: Object.entries(clip.tracks).map(([name, keys]) => [boneIndex(skeleton, name), keys]),
      hips: clip.hips ? boneIndex(skeleton, 'hips') : -1,
      
      stretch: clip.stretch ? Object.entries(clip.stretch).map(([name, keys]) => [boneIndex(skeleton, name), keys]) : null,
    };
    resolved.set(clip, r);
  }
  return r;
}

export function sampleClip(skeleton, clip, phase, out = createPose(skeleton)) {
  const r = resolve(skeleton, clip);
  const { k, c } = keySpan(clip.times, clip.loop, phase);
  const n = skeleton.bones.length;
  out.q.fill(0);
  out.t.fill(0);
  if (out.s) out.s.fill(1);
  for (let i = 0; i < n; i++) out.q[i * 4 + 3] = 1;
  if (r.stretch && out.s) {
    for (const [i, keys] of r.stretch) out.s[i] = c[0] * keys[k[0]] + c[1] * keys[k[1]] + c[2] * keys[k[2]] + c[3] * keys[k[3]];
  }
  for (const [i, keys] of r.tracks) {
    const a = keys[k[0]], b = keys[k[1]], d = keys[k[2]], e = keys[k[3]];
    quatFromEuler(
      c[0] * a[0] + c[1] * b[0] + c[2] * d[0] + c[3] * e[0],
      c[0] * a[1] + c[1] * b[1] + c[2] * d[1] + c[3] * e[1],
      c[0] * a[2] + c[1] * b[2] + c[2] * d[2] + c[3] * e[2],
      out.q, i * 4,
    );
  }
  if (r.hips >= 0) {
    const a = clip.hips[k[0]], b = clip.hips[k[1]], d = clip.hips[k[2]], e = clip.hips[k[3]];
    for (let j = 0; j < 3; j++) out.t[r.hips * 3 + j] = c[0] * a[j] + c[1] * b[j] + c[2] * d[j] + c[3] * e[j];
  }
  return out;
}

const masks = new WeakMap();
function maskWeights(skeleton, mask) {
  let m = masks.get(mask);
  if (!m || m.bones !== skeleton.bones) {
    m = { bones: skeleton.bones, w: Float64Array.from(skeleton.bones, (b) => mask[b.name] ?? 0) };
    masks.set(mask, m);
  }
  return m.w;
}




export function blendPose(skeleton, out, a, b, w, mask = null) {
  const n = skeleton.bones.length;
  const mw = mask ? maskWeights(skeleton, mask) : null;
  for (let i = 0; i < n; i++) {
    const wi = mw ? w * mw[i] : w;
    quatNlerp(a.q, i * 4, b.q, i * 4, wi, out.q, i * 4);
    for (let j = i * 3; j < i * 3 + 3; j++) out.t[j] = a.t[j] + (b.t[j] - a.t[j]) * wi;
    if (out.s && a.s && b.s) out.s[i] = a.s[i] + (b.s[i] - a.s[i]) * wi;
  }
  return out;
}
