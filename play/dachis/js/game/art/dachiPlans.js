


















export const SWING = { quadruped: 0.95, fish: 0.95, bug: 0.95, bird: 0.6, ghost: 0.5, serpent: 0.5 }; 

export function planLayout(plan, K) {
  const E = K.ell;
  if (plan === 'quadruped') return { 
    parts: [E([0, 0.98, -0.35], [0.62, 0.52, 1.0]), E([0, 1.85, 0.55], [1.0, 0.9, 0.92]), E([0, 1.5, 1.32], [0.32, 0.22, 0.26])], hp: [1, 2], k: 0.22,
    chest: E([0, 0.98, -0.35], [0.62, 0.52, 1.0]), head: { c: [0, 1.85, 0.55], r: 0.95 }, snout: [0, 1.5, 1.32],
    legs: [[0.34, 0.2], [0.34, -0.95]], legTop: 0.95, tail: [0, 1.05, -1.3], wing: [0.35, 1.35, -0.4],
    belly: [0, 0.82, 0.25], neck: 1.3, low: 0.95, back: [0, 1.4, -0.8], chestC: [0, 0.98, -0.35], ribR: [0.62, 0.9],
  };
  if (plan === 'fish') return { 
    parts: [E([0, 1.15, -0.45], [0.72, 0.72, 1.05]), E([0, 1.3, 0.38], [1.02, 0.94, 0.95])], hp: [1], k: 0.35,
    chest: E([0, 1.15, -0.45], [0.72, 0.72, 1.05]), head: { c: [0, 1.3, 0.38], r: 0.96 },
    feet: [], tail: [0, 1.2, -1.3], wing: [0.5, 1.55, -0.4],
    belly: [0, 0.85, 0.2], neck: 1.0, low: 0.9, back: [0, 1.95, -0.6], chestC: [0, 1.1, -0.4], ribR: [0.72, 0.95],
  };
  if (plan === 'bird') return { 
    parts: [E([0, 1.0, -0.15], [0.74, 0.7, 0.78]), E([0, 1.95, 0.14], [0.98, 0.9, 0.9])], hp: [1], k: 0.28,
    chest: E([0, 1.0, -0.15], [0.74, 0.7, 0.78]), head: { c: [0, 1.95, 0.14], r: 0.94 },
    feet: [], tail: [0, 0.95, -0.85], wing: [0.62, 1.25, -0.3],
    belly: [0, 0.95, 0.55], neck: 1.4, low: 0.75, back: [0, 1.25, -0.75], chestC: [0, 1.0, -0.15], ribR: [0.74, 0.78],
  };
  if (plan === 'serpent') { 
    const pts = coil(), segs = [];
    for (let i = 1; i < pts.length; i++) segs.push(K.S.roundCone(pts[i - 1].p, pts[i].p, pts[i - 1].r, pts[i].r));
    const neck = K.S.roundCone([0, 0.42, 0.55], [0, 1.25, 0.5], 0.44, 0.5);
    return {
      parts: [K.S.union(0.12, ...segs), neck, E([0, 1.78, 0.5], [1.0, 0.9, 0.92])], hp: [1, 2], k: 0.18,
      chest: neck, head: { c: [0, 1.78, 0.5], r: 0.95 }, coilTail: pts.slice(-4),
      feet: [], tail: pts[pts.length - 1].p, wing: [0.4, 1.45, -0.2],
      belly: [0, 0.75, 0.75], neck: 1.2, low: 0.5, back: [0, 1.3, -0.4], chestC: [0, 0.8, 0.5], ribR: [0.45, 0.45],
    };
  }
  if (plan === 'bug') return { 
    parts: [E([0, 0.72, -0.45], [0.85, 0.55, 1.0]), E([0, 1.55, 0.46], [1.0, 0.9, 0.92])], hp: [1], k: 0.22,
    chest: E([0, 0.72, -0.45], [0.85, 0.55, 1.0]), head: { c: [0, 1.55, 0.46], r: 0.95 },
    feet: [], tail: [0, 0.6, -1.35], wing: [0.45, 1.15, -0.5],
    belly: [0, 0.5, 0.3], neck: 1.05, low: 0.6, back: [0, 1.3, -0.8], chestC: [0, 0.72, -0.4], ribR: [0.85, 0.95],
  };
  if (plan === 'biped') return { 
    parts: [E([0, 1.02, 0], [0.6, 0.72, 0.52]), E([0, 2.22, 0.1], [1.02, 0.92, 0.94])], hp: [1], k: 0.22,
    chest: E([0, 1.02, 0], [0.6, 0.72, 0.52]), head: { c: [0, 2.22, 0.1], r: 0.96 },
    feet: [], tail: [0, 0.8, -0.5], wing: [0.36, 1.5, -0.45],
    belly: [0, 0.95, 0.45], neck: 1.6, low: 0.9, back: [0, 1.3, -0.5], chestC: [0, 1.05, 0], ribR: [0.62, 0.55],
  };
  if (plan === 'plant') return { 
    parts: [E([0, 0.72, 0], [0.82, 0.6, 0.78]), E([0, 1.66, 0.08], [1.0, 0.9, 0.92])], hp: [1], k: 0.3,
    chest: E([0, 0.72, 0], [0.82, 0.6, 0.78]), head: { c: [0, 1.66, 0.08], r: 0.95 },
    feet: [], tail: [0, 0.5, -0.7], wing: [0.45, 1.25, -0.45],
    belly: [0, 0.65, 0.7], neck: 1.1, low: 0.55, back: [0, 1.0, -0.7], chestC: [0, 0.72, 0], ribR: [0.82, 0.78],
  };
  if (plan === 'ghost') return { 
    parts: [E([0, 2.0, 0.05], [1.05, 0.96, 0.98]), K.S.union(0.12, K.S.roundCone([0, 1.6, -0.05], [-0.2, 1.05, -0.4], 0.82, 0.6),
      K.S.roundCone([-0.2, 1.05, -0.4], [-0.6, 0.72, -0.8], 0.6, 0.36), K.S.roundCone([-0.6, 0.72, -0.8], [-1.05, 0.8, -1.1], 0.36, 0.15),
      K.S.roundCone([-1.05, 0.8, -1.1], [-1.3, 1.12, -1.15], 0.15, 0.05))], hp: [0], k: 0.3,
    chest: E([0, 1.45, -0.1], [0.8, 0.6, 0.7]), head: { c: [0, 2.02, 0.08], r: 0.97 },
    arms: [[0.95, 1.55, 0.2]], feet: [], tail: [-1.05, 0.8, -1.1], wing: [0.5, 2.1, -0.5],
    belly: [0, 1.45, 0.6], neck: 1.6, low: 1.3, back: [0, 2.0, -0.8], chestC: [0, 1.45, -0.1], ribR: [0.8, 0.7],
  };
  return null; 
}


function coil() {
  const out = [], n = 12;
  for (let i = 0; i <= n; i++) {
    const t = i / n, a = t * Math.PI * 2.1, R = 0.85 + t * 0.45;
    out.push({ p: [Math.sin(a) * R, 0.38 + Math.max(0, t - 0.8) * 2.4, Math.cos(a) * R - 0.35], r: 0.44 - t * 0.32 });
  }
  return out;
}




export function planParts(plan, full, ly, h, col, acc, st, K) {
  const { S, fur, lin, light, dark, add, norm, LEAF } = K, E = K.ell;
  const out = { organic: [], details: [], limbs: [], tail: null, noFeet: false, noArms: false, wings: 0, beak: null };
  const g = full ? 1 + (st - 2) * 0.2 : 0.55, fin = K.mix(K.deep(acc), acc, 0.45), finDark = dark(fin, 0.2);
  const r = h.r;
  if (plan === 'fish') {
    out.noArms = true; out.noFeet = full;
    for (const sgn of [-1, 1]) { 
      const c = full ? [sgn * 0.8, 0.95, 0.05] : [sgn * (r * 0.95), h.c[1] - 0.35 * r, h.c[2] + 0.1];
      out.limbs.push({ sgn, arm: true, own: true, node: fur(K.S.transform(E([0, 0, 0], [0.5 * g + 0.1, 0.1, 0.32 * g + 0.08]), { translate: c, rotate: [0.2, sgn * 0.5, sgn * -0.6] }), fin) });
    }
    const tp = full ? [0, 1.25, -1.45] : add(ly.tail, [0, 0.2, -0.15]), s = full ? g : 0.6;
    
    
    const lobe = (q) => K.S.transform(E([0, 0, 0], [0.09, 0.72 * s, 0.2 * s]), { translate: add(tp, [0, q * 0.4 * s, -0.36 * s]), rotate: [-q * 0.95, 0, 0] }); 
    const tailNode = fur(S.union(0.1, E(add(tp, [0, 0, 0.2 * s]), [0.16 * s + 0.05, 0.22 * s, 0.5 * s]), lobe(1), lobe(-1)), (x, y, z) => (z < tp[2] - 0.2 * s ? fin : col));
    if (full) out.tail = tailNode; else out.organic.push(tailNode);
    const dp = full ? [0, 1.95, -0.55] : add(h.c, [0, 0.72 * r, -0.55 * r]); 
    out.organic.push(fur(K.S.transform(E([0, 0, 0], [0.08, 0.45 * (full ? g : 0.6), 0.42 * (full ? g : 0.6)]), { translate: dp, rotate: [-0.5, 0, 0] }), finDark));
  } else if (plan === 'bird') {
    out.noArms = full; out.noFeet = full; out.wings = full ? 1.12 * g : 0.5;
    
    const b0 = add(h.c, norm([0, -0.2, 1]), r * 0.92), s = full ? 1.25 : 0.8;
    
    const bill = (dy, R) => K.S.transform(E([0, 0, 0], R), { translate: add(b0, [0, dy, 0.16 * s]), rotate: [0.3, 0, 0] });
    out.beak = [fur(S.union(0.02, bill(0, [0.3 * s, 0.09 * s, 0.3 * s]), bill(-0.08 * s, [0.22 * s, 0.07 * s, 0.22 * s])), lin('#ff8a10'))];
    const tb = full ? [0, 1.0, -0.8] : add(ly.tail, [0, 0.1, 0]), tl = full ? g : 0.55; 
    const feathers = [-0.5, 0, 0.5].map((a) => K.S.transform(E([0, 0, 0], [0.16 * tl, 0.62 * tl, 0.06]), { translate: add(tb, [Math.sin(a) * 0.4 * tl, 0.5 * tl, -0.25 * tl]), rotate: [-0.6, 0, -a] }));
    out.organic.push(fur(S.union(0.05, ...feathers), (x, y) => (y > tb[1] + 0.8 * tl ? light(acc, 0.3) : acc)));
    if (full) { 
      for (const sgn of [-1, 1]) {
        const hip = [sgn * 0.3, 0.5, -0.05], ank = [sgn * 0.32, 0.1, 0.05];
        const toes = [-0.45, 0, 0.45].map((a) => S.capsule(ank, add(ank, [Math.sin(a) * 0.22, -0.04, Math.cos(a) * 0.24]), 0.055));
        out.limbs.push({ sgn, arm: false, own: true, node: fur(S.union(0.03, S.capsule(hip, ank, 0.075), ...toes), lin('#f0a030')) });
      }
    }
  } else if (plan === 'serpent') {
    if (full) {
      out.noArms = true; out.noFeet = true;
      const t = ly.coilTail; 
      out.tail = fur(S.union(0.06, ...t.slice(1).map((q, i) => S.roundCone(t[i].p, q.p, t[i].r, q.r))), col);
    } else { 
      const c = add(ly.tail, [0, -0.2, -0.3]), pts = [];
      for (let i = 0; i <= 7; i++) { const a = (i / 7) * Math.PI * 1.7; pts.push([Math.sin(a) * 0.45, Math.max(0.12, c[1] - 0.2) + (i > 5 ? (i - 5) * 0.2 : 0), c[2] - 0.45 + Math.cos(a) * 0.45]); }
      out.tail = fur(S.union(0.05, ...pts.slice(1).map((q, i) => S.roundCone(pts[i], q, 0.2 - i * 0.018, 0.2 - (i + 1) * 0.018))), col);
    }
  } else if (plan === 'bug') {
    const shellC = full ? [0, 1.0, -0.55] : add(ly.back, [0, 0.05, 0.1]), R = full ? [1.0, 0.66, 1.12] : [0.62, 0.42, 0.62], shellCol = K.mix(K.deep(acc), acc, 0.35);
    const cut = shellC[1] - R[1] * 0.1;
    out.details.push(fur(S.intersect(0.03, E(shellC, R), S.field((x, y) => cut - y)), (x, y, z) => {
      if (Math.abs(x) < 0.05) return dark(shellCol, 0.6); 
      const sx = Math.abs(x) - R[0] * 0.45, sz = z - shellC[2];
      return Math.hypot(sx, (sz % 0.5 + 0.5) % 0.5 - 0.25) < 0.14 ? dark(shellCol, 0.55) : shellCol; 
    }));
    if (full) {
      out.noFeet = true;
      for (const sgn of [-1, 1]) for (const z of [0.15, -0.45, -1.02]) 
        out.limbs.push({ sgn, arm: z > 0, node: S.roundCone([sgn * 0.62, 0.5, z], [sgn * 0.98, 0.08, z + 0.12], 0.16, 0.11) });
    }
  } else if (plan === 'plant') {
    const n = full ? 6 : 4, y = full ? 0.22 : 0.18, rad = full ? 0.95 : 0.72, s = full ? g : 0.62;
    const leaves = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.3;
      leaves.push(K.S.transform(E([0, 0, 0], [0.3 * s + 0.05, 0.07, 0.62 * s]), { translate: [Math.sin(a) * rad, y, Math.cos(a) * rad], rotate: [-0.35, a, 0] }));
    }
    out.details.push(fur(S.union(0.04, ...leaves), (x, yy, z) => (Math.abs(Math.atan2(x, z) * 3 % 1) < 0.08 ? dark(LEAF, 0.3) : LEAF)));
    if (full) { out.noArms = true; 
      for (const sgn of [-1, 1]) out.limbs.push({ sgn, arm: true, own: true, node: fur(K.S.transform(E([0, 0, 0], [0.42, 0.09, 0.2]), { translate: [sgn * 0.95, 0.95, 0.15], rotate: [0, 0, sgn * 0.6] }), LEAF) });
    }
  } else if (plan === 'ghost') {
    out.noFeet = true;
    if (!full) { 
      const b = [0, 0.3, -0.2];
      out.organic.push(fur(S.union(0.08, S.roundCone(b, add(b, [-0.3, 0.05, -0.55]), 0.4, 0.2), S.roundCone(add(b, [-0.3, 0.05, -0.55]), add(b, [-0.6, 0.3, -0.8]), 0.2, 0.06)), col));
    }
  } else if (plan === 'biped' && full) {
    out.noArms = true; out.noFeet = true;
    for (const sgn of [-1, 1]) {
      out.limbs.push({ sgn, arm: true, node: S.union(0.06, S.roundCone([sgn * 0.52, 1.35, 0.05], [sgn * 0.82, 0.8, 0.22], 0.2, 0.16), K.S.sphere([sgn * 0.84, 0.74, 0.25], 0.21)) });
      out.limbs.push({ sgn, arm: false, node: S.union(0.06, S.roundCone([sgn * 0.3, 0.55, 0], [sgn * 0.32, 0.14, 0.04], 0.24, 0.2), E([sgn * 0.33, 0.1, 0.14], [0.24, 0.13, 0.32])) });
    }
  } else if (plan === 'quadruped' && !full && ly.feet && ly.feet.length) { 
    const f = ly.feet[0];
    for (const sgn of [-1, 1]) out.limbs.push({ sgn, arm: false, node: E([sgn * f[0] * 0.9, f[1] + 0.04, f[2] - 0.62], [0.24, 0.14, 0.27]) });
  }
  return out;
}
