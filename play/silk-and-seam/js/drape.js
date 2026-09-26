




import { createCloth, addParticle, addConstraint, addTether, addStitch, finalize, settle, K, dist, hashCloth } from './cloth.js';
import { formOf, UNDER_OF, sdfNormal, formDistance, toDressY } from './form3d.js';
const NR = [0, 0, 0, 1];
import { draft } from './patterns.js';


export const STIFF = { stretch: 1, shear: 0.6, bend: 0.12, seam: 1 };




function buildPanel(c, spec, fab, form) {
  const { nu, nv } = spec, start = c.n, idx = new Int32Array(nu * nv).fill(-1);
  const thick = (spec.layer ?? 1) * 0.25 + 0.25;
  const auto = [];
  
  
  const keep = new Uint8Array(nu * nv).fill(1);
  if (spec.mask) {
    for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const u = i / (nu - 1), v = j / (nv - 1); keep[j * nu + i] = spec.mask(u, v, spec.place(u, v)) ? 1 : 0; }
    const kn = (i, j) => (i >= 0 && j >= 0 && i < nu && j < nv ? keep[j * nu + i] : 0);
    for (let pass = 0; pass < 2; pass++) for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
      if (keep[j * nu + i] && kn(i - 1, j) + kn(i + 1, j) + kn(i, j - 1) + kn(i, j + 1) < 2) keep[j * nu + i] = 0;
    }
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const u = i / (nu - 1), v = j / (nv - 1), p = spec.place(u, v);
    if (!keep[j * nu + i]) continue;
    const k = addParticle(c, p[0], p[1], p[2], { mass: spec.pin && spec.pin(u, v) ? 0 : 1, thick: spec.thickAt ? spec.thickAt(p) : thick, fric: fab.fric, noArms: spec.arms === false });
    idx[j * nu + i] = k;
    
    
    if (spec.support === 'auto') {
      sdfNormal(form, p[0], p[1], p[2], spec.arms !== false, NR);
      
      
      if (NR[1] > 0.5 && toDressY(p[1]) < 200 && formDistance(form, p[0], p[1], p[2], spec.arms !== false) < thick + 0.6) auto.push(k);
    }
  }
  const at = (i, j) => (i < 0 || j < 0 || i >= nu || j >= nv ? -1 : idx[j * nu + i]);
  
  
  
  if (spec.mask) for (let j = 0; j < nv; j++) for (let i = 1; i < nu - 1; i++) {
    const k = at(i, j);
    if (k < 0) continue;
    const dir = [[0, -1], [0, 1], [-1, 0], [1, 0]].find(([di, dj]) => j + dj >= 0 && j + dj < nv && at(i + di, j + dj) < 0);
    if (!dir) continue;
    const u0 = i / (nu - 1), v0 = j / (nv - 1), u1 = (i + dir[0]) / (nu - 1), v1 = (j + dir[1]) / (nv - 1);
    let lo = 0, hi = 1;
    for (let it = 0; it < 12; it++) {
      const t = (lo + hi) / 2, u = u0 + (u1 - u0) * t, v = v0 + (v1 - v0) * t;
      if (spec.mask(u, v, spec.place(u, v))) lo = t; else hi = t;
    }
    if (lo < 0.05) continue;
    const p = spec.place(u0 + (u1 - u0) * lo * 0.97, v0 + (v1 - v0) * lo * 0.97);
    for (let a = 0; a < 3; a++) c.pos[k * 3 + a] = c.prev[k * 3 + a] = c.rest[k * 3 + a] = p[a];
  }
  const rs = (i0, j0, i1, j1) => (spec.rest ? spec.rest(i0 / (nu - 1), j0 / (nv - 1), i1 / (nu - 1), j1 / (nv - 1)) : 1);
  
  const con = (i0, j0, i1, j1, kind, k) => {
    const a = at(i0, j0), b = at(i1, j1);
    if (a >= 0 && b >= 0) addConstraint(c, a, b, kind, k, null, rs(i0, j0, i1, j1), !!spec.gathered && (kind === K.SHEAR || (kind !== K.BEND && j0 === j1)));
  };
  const wrap = spec.wrap;   
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) {
    const i1 = wrap && i === nu - 1 ? 0 : i + 1, i2 = wrap ? (i + 2) % nu : i + 2;
    if (i1 < nu && !(wrap && nu < 3)) con(i, j, i1, j, rs(i, j, i1, j) < 0.99 ? K.BAND : K.STRETCH, fab.stretch);
    con(i, j, i, j + 1, K.STRETCH, fab.stretch);
    if (i1 < nu) { con(i, j, i1, j + 1, K.SHEAR, fab.shear); con(i1, j, i, j + 1, K.SHEAR, fab.shear); }
    if (i2 < nu) con(i, j, i2, j, K.BEND, fab.bend);
    con(i, j, i, j + 2, K.BEND, spec.boned ? 1 : fab.bend);
    if (spec.boned) con(i, j, i, j + 3, K.BEND, 1);          
    if (i1 < nu) {
      const a = at(i, j), b = at(i1, j), d = at(i, j + 1), e = at(i1, j + 1);
      if (a >= 0 && b >= 0 && d >= 0) c.tris.push([a, d, b]);
      if (b >= 0 && d >= 0 && e >= 0) c.tris.push([b, d, e]);
    }
  }
  
  
  for (let q = c.nBandSeen || 0; q < c.cons.length; q++) {
    const [a, b, , , kind] = c.cons[q];
    if (kind === K.BAND) { c.fric[a] = Math.max(c.fric[a], fab.fric * 3); c.fric[b] = Math.max(c.fric[b], fab.fric * 3); }
  }
  c.nBandSeen = c.cons.length;
  
  
  if (spec.tether === 'top') for (let i = 0; i < nu; i++) {
    let len = 0, prev = at(i, 0);
    const a = prev;
    for (let j = 1; j < nv; j++) {
      const v = at(i, j); if (v < 0 || a < 0) continue;
      len += dist(c, prev, v) * rs(i, j - 1, i, j); prev = v;
      addTether(c, v, a, len * 1.01);
    }
  }
  
  const upper = [];
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) if (at(i, j) >= 0 && at(i, j - 1) < 0) upper.push(at(i, j));
  const raw = (name) => {
    const out = [];
    if (name === 'left') for (let j = 0; j < nv; j++) out.push(at(0, j));
    if (name === 'right') for (let j = 0; j < nv; j++) out.push(at(nu - 1, j));
    return out;
  };
  const edge = (name) => {
    const out = [];
    if (name === 'top') for (let i = 0; i < nu; i++) out.push(at(i, 0));
    if (name === 'bottom') for (let i = 0; i < nu; i++) out.push(at(i, nv - 1));
    if (name === 'left') for (let j = 0; j < nv; j++) out.push(at(0, j));
    if (name === 'right') for (let j = 0; j < nv; j++) out.push(at(nu - 1, j));
    return out.filter((v) => v >= 0);
  };
  const anchors = auto;
  if (spec.anchor) for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) if (at(i, j) >= 0 && spec.anchor(i / (nu - 1), j / (nv - 1))) anchors.push(at(i, j));
  const upperY = upper.map((i) => toDressY(c.pos[i * 3 + 1]));     
  const upperX = upper.map((i) => c.pos[i * 3]);
  const p = { name: spec.name, layer: spec.layer ?? 1, start, count: c.n - start, nu, nv, idx, edge, raw, upper, upperY, upperX, anchors, stand: spec.stand || 0, tether: spec.tether || null, part: spec.part, role: spec.role || null, arms: spec.arms !== false };
  c.panels.push(p);
  return p;
}





function sew(c, a, b, attach = false) {
  const st = [];
  if (a.length === b.length) a.forEach((v, i) => st.push([v, b[i], b[i], 0]));
  else {
    const [s, l] = a.length < b.length ? [a, b] : [b, a];
    const [from, to] = attach ? [s, l] : [l, s];
    const P = (i) => [c.pos[i * 3], c.pos[i * 3 + 1], c.pos[i * 3 + 2]];
    const cum = (e) => { const L = [0]; for (let i = 1; i < e.length; i++) L.push(L[i - 1] + dist(c, e[i - 1], e[i])); return L; };
    const Lt = cum(to), Lf = cum(from);
    from.forEach((v, n) => {
      let seg = 0, t = 0;
      if (!attach) {
        const d = (Lf[n] / (Lf[Lf.length - 1] || 1)) * Lt[Lt.length - 1];
        while (seg < to.length - 2 && Lt[seg + 1] < d) seg++;
        t = Math.min(1, Math.max(0, (d - Lt[seg]) / (Lt[seg + 1] - Lt[seg] || 1)));
      } else {
        let bd = Infinity; const p = P(v);
        for (let q = 0; q < to.length - 1; q++) {
          const A = P(to[q]), B = P(to[q + 1]), ab = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
          const tt = Math.min(1, Math.max(0, ((p[0] - A[0]) * ab[0] + (p[1] - A[1]) * ab[1] + (p[2] - A[2]) * ab[2]) / (ab[0] ** 2 + ab[1] ** 2 + ab[2] ** 2 || 1)));
          const dd = Math.hypot(p[0] - A[0] - ab[0] * tt, p[1] - A[1] - ab[1] * tt, p[2] - A[2] - ab[2] * tt);
          if (dd < bd) { bd = dd; seg = q; t = tt; }
        }
      }
      st.push([v, to[seg], to[Math.min(seg + 1, to.length - 1)], t]);
    });
  }
  for (const s of st) if (s[0] !== s[1] || s[3] > 0) addStitch(c, ...s);
  return st;
}






const MAX_TETHER = 90;
function supportTethers(c, anchors, seams) {
  if (!anchors.length) return;
  const adj = Array.from({ length: c.n }, () => []);
  for (const [i, j, r0, , kind] of c.cons) if (kind === K.STRETCH) { const r = Math.abs(r0); adj[i].push([j, r]); adj[j].push([i, r]); }
  
  
  for (const s of seams) for (const [i, j, k, t] of s.stitches) {
    const L = dist(c, j, k);
    adj[i].push([j, t * L], [k, (1 - t) * L]); adj[j].push([i, t * L]); adj[k].push([i, (1 - t) * L]);
  }
  const D = new Float64Array(c.n).fill(Infinity), src = new Int32Array(c.n).fill(-1);
  const heap = [];   
  const push = (e) => { heap.push(e); let i = heap.length - 1; while (i) { const p = (i - 1) >> 1; if (heap[p][0] <= e[0]) break; heap[i] = heap[p]; i = p; } heap[i] = e; };
  const pop = () => { const top = heap[0], e = heap.pop(); if (heap.length) { let i = 0; for (;;) { let m = 2 * i + 1; if (m >= heap.length) break; if (m + 1 < heap.length && heap[m + 1][0] < heap[m][0]) m++; if (heap[m][0] >= e[0]) break; heap[i] = heap[m]; i = m; } heap[i] = e; } return top; };
  for (const a of anchors) { D[a] = 0; src[a] = a; push([0, a]); }
  while (heap.length) {
    const [dd, u] = pop();
    if (dd > D[u] || dd > MAX_TETHER) continue;
    for (const [v, r] of adj[u]) if (dd + r < D[v]) { D[v] = dd + r; src[v] = src[u]; push([D[v], v]); }
  }
  for (let i = 0; i < c.n; i++) if (src[i] >= 0 && src[i] !== i && D[i] <= MAX_TETHER) addTether(c, i, src[i], D[i] * 1.01);
}




export const FAB_DEFAULT = { stretch: 1, shear: 0.6, bend: 0.12, fric: 1.5 };


export function buildGarment(design, body = design.body || 'classic', fab = FAB_DEFAULT) {
  const form = formOf(body, UNDER_OF[design.skirt] || null);
  const d = draft(design, form);
  const c = createCloth(d.capacity || 6000);
  const byName = {};
  for (const spec of d.panels) byName[spec.name] = buildPanel(c, spec, { ...fab, ...(spec.fab || {}) }, form);
  const seams = [];
  for (const s of d.seams) {
    const A = byName[s.a[0]], B = byName[s.b[0]];
    if (!A || !B) continue;
    let ea = typeof s.a[1] === 'function' ? s.a[1](A) : A.edge(s.a[1]);
    let eb = typeof s.b[1] === 'function' ? s.b[1](B) : B.edge(s.b[1]);
    if (s.byRow) {       
      const ra = A.raw(s.a[1]), rb = B.raw(s.b[1]);
      ea = []; eb = [];
      ra.forEach((v, j) => { if (v >= 0 && rb[j] >= 0) { ea.push(v); eb.push(rb[j]); } });
    }
    seams.push({ name: s.name || `${s.a[0]}:${s.a[1]}-${s.b[0]}:${s.b[1]}`, stitches: sew(c, ea, eb, s.attach) });
  }
  supportTethers(c, Object.values(byName).flatMap((p) => p.anchors), seams);
  finalize(c);
  return { cloth: c, form, seams, panels: byName, draft: d };
}


export function drape(design, body, opts = {}) {
  const t0 = now();
  const g = buildGarment(design, body, opts.fab);
  const t1 = now();
  const r = settle(g.cloth, { form: g.form, iters: opts.iters ?? 8, substeps: opts.substeps ?? 8, steps: opts.steps ?? 36, damping: opts.damping ?? 0.9, arms: true });
  const t2 = now();
  return { ...g, build: t1 - t0, settleMs: t2 - t1, steps: r.steps, moved: r.moved, hash: hashCloth(g.cloth) };
}
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
