


















export const SWING = { quadruped: 0.95, fish: 0.95, bug: 0.95, bird: 0.6, ghost: 0.5, serpent: 0.5, strider: 0.95, turtle: 0.9, snail: 0.9, frog: 0.5, ray: 0.7 }; 

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
  
  if (plan === 'crab') return { 
    parts: [E([0, 0.78, -0.25], [1.12, 0.46, 0.8]), E([0, 1.62, 0.32], [0.98, 0.88, 0.9])], hp: [1], k: 0.2,
    chest: E([0, 0.78, -0.25], [1.12, 0.46, 0.8]), head: { c: [0, 1.62, 0.32], r: 0.94 },
    feet: [], tail: [0, 0.7, -1.0], wing: [0.5, 1.2, -0.5],
    belly: [0, 0.6, 0.45], neck: 1.15, low: 0.62, back: [0, 1.15, -0.6], chestC: [0, 0.78, -0.25], ribR: [1.1, 0.8],
  };
  if (plan === 'bat') return { 
    parts: [E([0, 1.75, -0.1], [0.58, 0.62, 0.52]), E([0, 2.62, 0.12], [0.98, 0.88, 0.9])], hp: [1], k: 0.25,
    chest: E([0, 1.75, -0.1], [0.58, 0.62, 0.52]), head: { c: [0, 2.62, 0.12], r: 0.94 },
    feet: [], tail: [0, 1.3, -0.5], wing: [0.5, 2.0, -0.2],
    belly: [0, 1.7, 0.4], neck: 2.1, low: 1.4, back: [0, 2.0, -0.5], chestC: [0, 1.75, -0.1], ribR: [0.58, 0.52],
  };
  if (plan === 'turtle') return { 
    parts: [E([0, 0.95, -0.4], [0.95, 0.5, 1.0]), E([0, 1.5, 0.75], [0.96, 0.86, 0.9])], hp: [1], k: 0.18,
    chest: E([0, 0.95, -0.4], [0.95, 0.5, 1.0]), head: { c: [0, 1.5, 0.75], r: 0.92 },
    feet: [], tail: [0, 0.75, -1.35], wing: [0.5, 1.6, -0.5],
    belly: [0, 0.6, 0.2], neck: 1.15, low: 0.7, back: [0, 1.55, -0.5], chestC: [0, 0.95, -0.4], ribR: [0.95, 1.0],
  };
  if (plan === 'strider') return { 
    parts: [E([0, 2.0, -0.35], [0.6, 0.42, 0.95]), K.S.roundCone([0, 2.15, 0.35], [0, 2.75, 0.75], 0.3, 0.26), E([0, 3.0, 0.95], [0.92, 0.84, 0.86])], hp: [2], k: 0.2,
    chest: E([0, 2.0, -0.35], [0.6, 0.42, 0.95]), head: { c: [0, 3.0, 0.95], r: 0.9 }, snout: [0, 2.75, 1.7],
    feet: [], tail: [0, 2.05, -1.25], wing: [0.35, 2.3, -0.4],
    belly: [0, 1.8, 0.1], neck: 2.6, low: 1.85, back: [0, 2.35, -0.7], chestC: [0, 2.0, -0.35], ribR: [0.6, 0.9],
  };
  
  if (plan === 'snail') return { 
    parts: [E([0, 0.34, -0.15], [0.62, 0.34, 1.3]), E([0, 1.42, 0.8], [0.96, 0.88, 0.9])], hp: [1], k: 0.25,
    chest: E([0, 0.34, -0.15], [0.62, 0.34, 1.3]), head: { c: [0, 1.42, 0.8], r: 0.92 },
    feet: [], tail: [0, 0.3, -1.4], wing: [0.45, 1.6, -0.5],
    belly: [0, 0.4, 0.6], neck: 1.0, low: 0.45, back: [0, 1.5, -0.55], chestC: [0, 0.4, -0.1], ribR: [0.62, 1.2],
  };
  if (plan === 'frog') return { 
    parts: [E([0, 0.66, -0.3], [1.0, 0.56, 0.82]), E([0, 1.38, 0.42], [1.02, 0.86, 0.94])], hp: [1], k: 0.28,
    chest: E([0, 0.66, -0.3], [1.0, 0.56, 0.82]), head: { c: [0, 1.42, 0.42], r: 0.95 },
    feet: [], tail: [0, 0.55, -1.0], wing: [0.5, 1.2, -0.5],
    belly: [0, 0.55, 0.3], neck: 1.0, low: 0.5, back: [0, 1.1, -0.7], chestC: [0, 0.66, -0.3], ribR: [0.86, 0.78],
  };
  if (plan === 'octopus') return { 
    parts: [E([0, 1.45, 0.12], [1.0, 0.9, 0.94]), E([0, 2.05, -0.55], [0.78, 0.86, 0.72])], hp: [0], k: 0.3,
    chest: E([0, 2.05, -0.55], [0.78, 0.86, 0.72]), head: { c: [0, 1.45, 0.12], r: 0.95 },
    feet: [], tail: [0, 2.3, -1.1], wing: [0.5, 2.0, -0.6],
    belly: [0, 0.8, 0.6], neck: 0.9, low: 0.7, back: [0, 2.3, -0.6], chestC: [0, 2.05, -0.55], ribR: [0.78, 0.72],
  };
  if (plan === 'ray') return { 
    parts: [E([0, 1.25, -0.35], [0.7, 0.3, 0.9]), E([0, 1.7, 0.5], [0.98, 0.84, 0.9])], hp: [1], k: 0.3,
    chest: E([0, 1.25, -0.35], [0.7, 0.3, 0.9]), head: { c: [0, 1.7, 0.5], r: 0.92 },
    feet: [], tail: [0, 1.2, -1.3], wing: [0.5, 1.5, -0.4],
    belly: [0, 1.0, 0.3], neck: 1.3, low: 1.0, back: [0, 1.5, -0.6], chestC: [0, 1.25, -0.35], ribR: [0.7, 0.9],
  };
  if (plan === 'jelly') return { 
    
    parts: [E([0, 2.75, 0.0], [1.08, 0.92, 1.04]), E([0, 2.03, 0.0], [1.12, 0.24, 1.08])], hp: [0], k: 0.25,
    chest: E([0, 2.03, 0.0], [1.12, 0.24, 1.08]), head: { c: [0, 2.75, 0.06], r: 0.98 },
    feet: [], tail: [0, 1.85, -0.6], wing: [0.5, 2.85, -0.5],
    belly: [0, 2.05, 0.7], neck: 2.25, low: 2.0, back: [0, 2.75, -0.85], chestC: [0, 2.07, 0], ribR: [0.84, 0.6],
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
  } else if (plan === 'crab') { 
    out.noArms = true; out.noFeet = full;
    const shell = K.mix(K.deep(acc), acc, 0.3), sc = full ? g : 0.5;
    for (const sgn of [-1, 1]) {
      const sh = full ? [sgn * 0.82, 0.86, 0.3] : [sgn * r * 0.85, h.c[1] - 0.45 * r, h.c[2] + 0.2];
      const el = add(sh, [sgn * 0.42 * sc, 0.12 * sc, 0.4 * sc]), cl = add(el, [sgn * 0.06 * sc, 0.06 * sc, 0.36 * sc]);
      const jaw = (dy, R) => K.S.transform(E([0, 0, 0], R), { translate: add(cl, [0, dy, 0.18 * sc]), rotate: [dy > 0 ? -0.35 : 0.35, 0, 0] });
      out.limbs.push({ sgn, arm: true, own: true, node: fur(S.union(0.06, S.roundCone(sh, el, 0.16 * sc + 0.04, 0.13 * sc + 0.03), S.roundCone(el, cl, 0.13 * sc + 0.03, 0.2 * sc + 0.04),
        jaw(0.1 * sc, [0.16 * sc + 0.04, 0.09 * sc + 0.02, 0.34 * sc + 0.06]), jaw(-0.08 * sc, [0.13 * sc + 0.03, 0.07 * sc + 0.02, 0.28 * sc + 0.05])), shell) });
      if (full) for (const z of [0.05, -0.3, -0.65]) { 
        const hip = [sgn * 0.98, 0.72, z], knee = [sgn * 1.42, 0.86, z - 0.05], foot = [sgn * 1.62, 0.06, z - 0.12];
        out.limbs.push({ sgn, arm: false, node: S.union(0.04, S.roundCone(hip, knee, 0.11, 0.09), S.roundCone(knee, foot, 0.09, 0.04)) });
      }
    }
  } else if (plan === 'bat') { 
    out.noArms = full; out.noFeet = full; out.wings = full ? 1.7 * g : 0.7;
    if (full) for (const sgn of [-1, 1]) out.limbs.push({ sgn, arm: false, node: S.union(0.03, S.roundCone([sgn * 0.2, 1.2, -0.05], [sgn * 0.22, 0.85, 0.02], 0.09, 0.06), S.roundCone([sgn * 0.22, 0.85, 0.02], [sgn * 0.22, 0.88, 0.16], 0.06, 0.035)) });
  } else if (plan === 'turtle') { 
    const shellC = full ? [0, 1.12, -0.45] : add(ly.back, [0, 0.1, 0.05]), R = full ? [1.12, 0.92, 1.18] : [0.6, 0.45, 0.62], shellCol = K.mix(K.deep(acc), acc, 0.45);
    const cut = shellC[1] - R[1] * 0.25;
    out.details.push(fur(S.intersect(0.04, E(shellC, R), S.field((x, y) => cut - y)), (x, y, z) => {
      const px = x / R[0], pz = (z - shellC[2]) / R[2], cell = (Math.floor(px * 2.2 + 5) + Math.floor(pz * 2.2 + 5)) % 2;
      if (y < cut + 0.1) return dark(shellCol, 0.45); 
      const gx = Math.abs((px * 2.2 % 1 + 1) % 1 - 0.5), gz = Math.abs((pz * 2.2 % 1 + 1) % 1 - 0.5);
      return gx > 0.44 || gz > 0.44 ? dark(shellCol, 0.6) : cell ? shellCol : light(shellCol, 0.12); 
    }));
    if (full) {
      out.noFeet = true;
      for (const sgn of [-1, 1]) for (const z of [0.25, -1.0]) out.limbs.push({ sgn, arm: z > 0, node: S.union(0.06, S.roundCone([sgn * 0.75, 0.62, z], [sgn * 0.95, 0.12, z + (z > 0 ? 0.12 : -0.1)], 0.26, 0.22), E([sgn * 0.97, 0.08, z + (z > 0 ? 0.18 : -0.12)], [0.26, 0.1, 0.3])) });
    }
  } else if (plan === 'strider' && full) { 
    out.noArms = true; out.noFeet = true;
    for (const sgn of [-1, 1]) for (const z of [0.25, -0.95]) {
      const hip = [sgn * 0.36, 1.85, z], knee = [sgn * 0.42, 1.0, z + (z > 0 ? -0.12 : 0.12)], hoof = [sgn * 0.4, 0.08, z];
      out.limbs.push({ sgn, arm: z > 0, node: S.union(0.04, S.roundCone(hip, knee, 0.13, 0.08), S.roundCone(knee, hoof, 0.08, 0.06), E(add(hoof, [0, 0.02, 0.04]), [0.11, 0.07, 0.14])) });
    }
  } else if (plan === 'strider') { 
    for (const sgn of [-1, 1]) out.limbs.push({ sgn, arm: false, node: S.roundCone([sgn * 0.3, 0.45, -0.1], [sgn * 0.34, 0.02, -0.05], 0.1, 0.06) });
  } else if (plan === 'jelly') { 
    out.noArms = true; out.noFeet = true;
    const n = full ? 9 : 5, base = full ? 1.97 : h.c[1] - 0.7 * r, len = full ? Math.min(1.85, 1.55 * g) : 0.6, rad = full ? 0.62 : 0.42 * r, th = full ? 0.15 : 0.1;
    const strands = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.4, pts = [];
      for (let j = 0; j <= 5; j++) { const s = j / 5; pts.push([Math.sin(a) * rad * (1 - s * 0.3) + Math.sin(s * 5 + i) * 0.08, base - s * len, Math.cos(a) * rad * (1 - s * 0.3) + Math.cos(s * 5 + i) * 0.08]); }
      for (let j = 1; j < pts.length; j++) strands.push(S.roundCone(pts[j - 1], pts[j], th * (1 - j * 0.14), th * (1 - (j + 1) * 0.14)));
    }
    out.organic.push(fur(S.union(0.04, ...strands), (x, y) => (y < base - len * 0.6 ? light(acc, 0.2) : acc)));
    if (full) for (const sgn of [-1, 1]) { 
      const p0 = [sgn * 0.35, 1.95, 0.5], p1 = [sgn * 0.55, 1.2, 0.85], p2 = [sgn * 0.5, 0.45, 1.0], p3 = [sgn * 0.32, 0.55, 1.25];
      out.limbs.push({ sgn, arm: true, own: true, node: fur(S.union(0.05, S.roundCone(p0, p1, 0.11, 0.08), S.roundCone(p1, p2, 0.08, 0.06), S.roundCone(p2, p3, 0.06, 0.04)), acc) });
    }
  } else if (plan === 'snail') { 
    const sc = full ? [0, 1.55, -0.6] : add(ly.back, [0, 0.12, 0.0]), R = full ? [0.55 * g + 0.08, 1.08 * g, 1.08 * g] : [0.32, 0.5, 0.5], shellCol = K.mix(K.deep(acc), acc, 0.25);
    out.details.push(fur(E(sc, R), (x, y, z) => { 
      const dy = (y - sc[1]) / R[1], dz = (z - sc[2]) / R[2], rr = Math.hypot(dy, dz), a = Math.atan2(dy, dz) / (Math.PI * 2);
      const band = ((rr * 1.7 - a) % 1 + 1) % 1;
      return rr < 0.14 ? dark(shellCol, 0.7) : band < 0.22 ? dark(shellCol, 0.7) : band < 0.6 ? shellCol : light(shellCol, 0.2);
    }));
    
    for (const sgn of [-1, 1]) {
      const pts = [];
      for (let i = 0; i <= 14; i++) { const s = i / 14, a = s * Math.PI * 3.4, q = 0.85 * (1 - s * 0.85); pts.push([sc[0] + sgn * R[0] * Math.sqrt(Math.max(0.05, 1 - q * q)) * 0.98, sc[1] + Math.sin(a) * q * R[1], sc[2] + Math.cos(a) * q * R[2]]); }
      const w = full ? 0.11 : 0.06;
      out.details.push(fur(S.union(0.02, ...pts.slice(1).map((p, i) => S.roundCone(pts[i], p, w, w))), dark(shellCol, 0.55)));
    }
    if (full) {
      out.noFeet = true; out.noArms = true;
      for (const sgn of [-1, 1]) { 
        const s0 = add(h.c, [sgn * 0.3 * r, 0.78 * r, 0.05]), s1 = add(s0, [sgn * 0.2, 0.62 * g, 0.12]);
        out.limbs.push({ sgn, arm: true, node: S.union(0.04, S.roundCone(s0, s1, 0.09, 0.06), K.S.sphere(s1, 0.12)) });
      }
    }
  } else if (plan === 'frog') { 
    const sc = full ? 1 : 0.5;
    for (const sgn of [-1, 1]) {
      
      
      const th = full ? [sgn * 1.15, 0.6, -0.4] : [sgn * r * 0.92, h.c[1] - 0.7 * r, h.c[2] - 0.4 * r], kn = add(th, [sgn * 0.38 * sc, 0.42 * sc, 0.45 * sc]);
      const ft = full ? [sgn * 1.5, 0.08, 0.2] : add(th, [sgn * 0.2, -0.25, 0.25]), foot = ft[1] < 0.08 ? [ft[0], 0.08, ft[2]] : ft;
      const toes = [-0.45, 0, 0.45].map((a) => S.roundCone(foot, add(foot, [Math.sin(a) * 0.3 * sc * sgn, -0.01, Math.cos(a) * 0.38 * sc + 0.05]), 0.08 * sc + 0.02, 0.06 * sc + 0.02));
      out.limbs.push({ sgn, arm: false, node: S.union(0.08, E(th, [0.42 * sc + 0.04, 0.46 * sc + 0.04, 0.6 * sc + 0.06]), S.roundCone(th, kn, 0.26 * sc + 0.03, 0.15 * sc + 0.03), S.roundCone(kn, foot, 0.14 * sc + 0.02, 0.1 * sc + 0.02), ...toes) });
      if (full) {
        const sh = [sgn * 0.55, 0.75, 0.3], hd = [sgn * 0.85, 0.08, 0.85];
        const fingers = [-0.5, 0, 0.5].map((a) => S.capsule(hd, add(hd, [Math.sin(a) * 0.2 * sgn, 0, Math.cos(a) * 0.2]), 0.05));
        out.limbs.push({ sgn, arm: true, node: S.union(0.04, S.roundCone(sh, hd, 0.12, 0.08), ...fingers) });
      }
    }
    if (full) { out.noFeet = true; out.noArms = true; }
  } else if (plan === 'octopus') { 
    out.noArms = true; out.noFeet = true;
    const n = full ? 8 : 4, base = full ? 0.72 : Math.max(0.25, h.c[1] - 0.8 * r), reach = full ? 1.45 * g : 0.75, th = full ? 0.2 : 0.14;
    const arms = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (full ? 0.2 : 0.8), pts = [];
      for (let j = 0; j <= 6; j++) {
        const s = j / 6, R = 0.35 + s * reach, curl = s > 0.75 ? (s - 0.75) * 4 : 0;
        pts.push([Math.sin(a + s * 0.5) * R, Math.max(th * (1 - s * 0.6), base * (1 - s) ** 2) + curl * 0.35, Math.cos(a + s * 0.5) * R]);
      }
      for (let j = 1; j < pts.length; j++) arms.push(S.roundCone(pts[j - 1], pts[j], th * (1 - (j - 1) * 0.12), th * (1 - j * 0.12)));
    }
    out.organic.push(fur(S.union(0.06, ...arms), (x, y) => (y < 0.12 ? light(acc, 0.25) : col))); 
  } else if (plan === 'ray') { 
    out.noArms = true; out.noFeet = true; out.noWings = true; 
    const s = full ? g : 0.45, y0 = full ? 1.22 : h.c[1] - 0.55 * r, z0 = full ? -0.3 : h.c[2] - 0.3;
    for (const sgn of [-1, 1]) {
      const fin = K.S.transform(E([0, 0, 0], [1.05 * s, 0.07 + 0.04 * s, 0.62 * s]), { translate: [sgn * (full ? 1.15 : 0.75) * (full ? 1 : 1), y0, z0 - 0.15 * s], rotate: [0, sgn * 0.45, sgn * -0.12] });
      out.limbs.push({ sgn, arm: true, own: true, node: fur(fin, (x, y, z) => (Math.abs(x) > (full ? 1.7 : 1.0) * s ? light(acc, 0.2) : y > y0 ? acc : light(acc, 0.35))) });
    }
    const t0 = full ? [0, 1.2, -1.1] : add(ly.tail, [0, 0.1, 0]), pts = [t0];
    for (let i = 1; i <= (full ? 6 : 3); i++) pts.push(add(t0, [Math.sin(i * 0.7) * 0.08, -0.05 * i * s + Math.max(0, i - 4) * 0.08, -0.38 * i * s]));
    const tail = S.union(0.03, ...pts.slice(1).map((p, i) => S.roundCone(pts[i], p, 0.1 * s * (1 - i * 0.13) + 0.02, 0.1 * s * (1 - (i + 1) * 0.13) + 0.02)));
    const tip = pts[pts.length - 1], barb = K.S.transform(E([0, 0, 0], [0.14 * s + 0.03, 0.04, 0.22 * s + 0.04]), { translate: tip, rotate: [0, 0.7, 0] });
    const tailNode = fur(full ? S.union(0.03, tail, barb) : tail, (x, y, z) => (full && z < tip[2] + 0.3 ? dark(acc, 0.3) : col)); 
    if (full) out.tail = tailNode; else out.organic.push(tailNode);
  } else if (plan === 'quadruped' && !full && ly.feet && ly.feet.length) { 
    const f = ly.feet[0];
    for (const sgn of [-1, 1]) out.limbs.push({ sgn, arm: false, node: E([sgn * f[0] * 0.9, f[1] + 0.04, f[2] - 0.62], [0.24, 0.14, 0.27]) });
  }
  return out;
}
