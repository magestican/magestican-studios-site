










export const EMBER = [1.0, 0.72, 0.22];   
export const IRIS = [0.62, 0.42, 1.0];    
export const HOT = [1.0, 0.97, 0.88];     
export const polColour = (pol) => (pol ? IRIS : EMBER);


export const POINT_CAP = 4096;

export const STREAK_CAP = 1536;


export function makeRng(seed = 1) {
  let a = seed >>> 0 || 1;
  return () => { a ^= a << 13; a ^= a >>> 17; a ^= a << 5; return (a >>> 0) / 4294967296; };
}

function pool(cap) {
  return {
    cap, n: 0,
    x: new Float32Array(cap), z: new Float32Array(cap), vx: new Float32Array(cap), vz: new Float32Array(cap),
    life: new Float32Array(cap), max: new Float32Array(cap), drag: new Float32Array(cap),
    s0: new Float32Array(cap), s1: new Float32Array(cap),
    r: new Float32Array(cap), g: new Float32Array(cap), b: new Float32Array(cap),
    
    r1: new Float32Array(cap), g1: new Float32Array(cap), b1: new Float32Array(cap),
    a0: new Float32Array(cap), len: new Float32Array(cap), pull: new Float32Array(cap),
    tx: new Float32Array(cap), tz: new Float32Array(cap),
    
    ring: new Uint8Array(cap), trail: new Uint8Array(cap), smoke: new Uint8Array(cap),
  };
}

export function createFxCore(seed = 7) {
  const rnd = makeRng(seed);
  const pts = pool(POINT_CAP), str = pool(STREAK_CAP);
  const shake = { t: 0, amp: 0 };

  function add(p, o) {
    
    let i = p.n;
    if (i >= p.cap) { i = (add.rr = ((add.rr || 0) + 1) % p.cap); } else p.n++;
    p.x[i] = o.x; p.z[i] = o.z; p.vx[i] = o.vx || 0; p.vz[i] = o.vz || 0;
    p.life[i] = 0; p.max[i] = o.life; p.drag[i] = o.drag ?? 2;
    p.s0[i] = o.s0; p.s1[i] = o.s1 ?? 0;
    const c0 = o.c0, c1 = o.c1 || o.c0;
    p.r[i] = c0[0]; p.g[i] = c0[1]; p.b[i] = c0[2];
    p.r1[i] = c1[0]; p.g1[i] = c1[1]; p.b1[i] = c1[2];
    p.a0[i] = o.a ?? 1; p.len[i] = o.len || 0; p.pull[i] = o.pull || 0;
    p.tx[i] = o.tx || 0; p.tz[i] = o.tz || 0;
    p.ring[i] = o.ring ? 1 : 0; p.trail[i] = o.trail ? 1 : 0; p.smoke[i] = o.smoke ? 1 : 0;
  }
  const ang = () => rnd() * Math.PI * 2;
  const deep = (c) => [c[0] * 0.55 + 0.25, c[1] * 0.25, c[2] * 0.35];

  




  function explode(x, z, size, pol, { boss = false } = {}) {
    const c = polColour(pol);
    const k = Math.max(0.6, Math.min(4, size / 50));
    add(pts, { x, z, life: 0.22 + 0.06 * k, s0: size * 1.6, s1: size * 0.2, c0: HOT, c1: c, drag: 0 });
    add(pts, { x, z, life: 0.5 + 0.1 * k, s0: size * 0.6, s1: size * 2.2, c0: c, c1: deep(c), a: 0.55, drag: 0 });
    const nStreak = Math.round(28 * k + (boss ? 60 : 0));
    for (let i = 0; i < nStreak; i++) {
      const a = ang(), v = (220 + rnd() * 380) * Math.sqrt(k);
      add(str, { x, z, vx: Math.cos(a) * v, vz: Math.sin(a) * v, life: 0.25 + rnd() * 0.35, drag: 4.5,
        s0: 2.2 + rnd() * 1.6, s1: 0.6, c0: HOT, c1: c, len: 0.045 + rnd() * 0.03 });
    }
    const nEmber = Math.round(40 * k + (boss ? 120 : 0));
    for (let i = 0; i < nEmber; i++) {
      const a = ang(), v = (40 + rnd() * 170) * Math.sqrt(k);
      add(pts, { x: x + Math.cos(a) * rnd() * size * 0.2, z: z + Math.sin(a) * rnd() * size * 0.2,
        vx: Math.cos(a) * v, vz: Math.sin(a) * v + 30, life: 0.5 + rnd() * 0.9, drag: 2.2,
        s0: 4 + rnd() * 9 * Math.sqrt(k), s1: 1, c0: rnd() < 0.3 ? HOT : c, c1: deep(c), a: 0.9 });
    }
    const nChunk = Math.round(7 * k + (boss ? 24 : 0));
    for (let i = 0; i < nChunk; i++) {
      const a = ang(), v = 90 + rnd() * 200;
      add(pts, { x, z, vx: Math.cos(a) * v, vz: Math.sin(a) * v, life: 0.7 + rnd() * 0.6, drag: 1.4,
        s0: 7 + rnd() * 6, s1: 2, c0: c, c1: [0.25, 0.08, 0.06], a: 1, trail: 1 });
    }
    
    
    const nRing = Math.round(36 * Math.sqrt(k) + (boss ? 36 : 0)), vRing = size * 5;
    for (let i = 0; i < nRing; i++) {
      const a = (i / nRing) * Math.PI * 2;
      add(pts, { x: x + Math.cos(a) * size * 0.15, z: z + Math.sin(a) * size * 0.15, vx: Math.cos(a) * vRing,
        vz: Math.sin(a) * vRing, life: 0.32 + 0.04 * k, drag: 5, s0: 6, s1: 2, c0: HOT, c1: c, a: 0.7, ring: 1 });
    }
    shake.amp = Math.max(shake.amp, boss ? 9 : Math.min(4, size / 40));
    shake.t = boss ? 0.6 : 0.18;
  }

  
  function absorb(x, z, sx, sz, pol) {
    const c = polColour(pol);
    for (let i = 0; i < 5; i++) {
      const a = ang(), v = 60 + rnd() * 60;
      add(pts, { x, z, vx: Math.cos(a) * v, vz: Math.sin(a) * v, life: 0.35 + rnd() * 0.15, drag: 1,
        s0: 7, s1: 2, c0: HOT, c1: c, pull: 26, tx: sx, tz: sz });
    }
    add(pts, { x, z, life: 0.18, s0: 18, s1: 4, c0: c, drag: 0, a: 0.8 });
  }

  
  function flip(x, z, pol) {
    const c = polColour(pol);
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2 + rnd() * 0.1, v = 300 + rnd() * 80;
      add(str, { x: x + Math.cos(a) * 14, z: z + Math.sin(a) * 14, vx: Math.cos(a) * v, vz: Math.sin(a) * v,
        life: 0.22, drag: 6, s0: 2.4, s1: 0.5, c0: HOT, c1: c, len: 0.04 });
    }
    add(pts, { x, z, life: 0.3, s0: 30, s1: 110, c0: c, a: 0.5, drag: 0 });
  }

  
  
  function wake(x, z, pol, dt, level = 1) {
    const c = polColour(pol);
    const n = Math.max(1, Math.round(dt * 90));
    const L = Math.max(0.5, level);
    for (let i = 0; i < n; i++) {
      for (const side of [-6, 6]) {
        add(pts, { x: x + side + (rnd() - 0.5) * 2, z: z + 18, vx: (rnd() - 0.5) * 20, vz: (160 + rnd() * 80) * L,
          life: 0.16 + rnd() * 0.1, drag: 3, s0: 7 * Math.sqrt(L), s1: 1.5, c0: HOT, c1: c, a: 0.85 });
      }
    }
  }

  




  function thrust(x, z, nx, nz, len, level, pol, dt) {
    const c = polColour(pol);
    const tx = x - nx * len * 0.5, tz = z - nz * len * 0.5;
    const n = Math.max(1, Math.round(dt * 60 * level));
    const k = Math.max(0.9, len / 30);
    for (let i = 0; i < n + 1; i++) {
      const v = (110 + rnd() * 70) * level;
      add(pts, { x: tx + (rnd() - 0.5) * 3, z: tz + (rnd() - 0.5) * 3, vx: -nx * v + (rnd() - 0.5) * 16,
        vz: -nz * v + (rnd() - 0.5) * 16, life: 0.14 + rnd() * 0.1, drag: 2.5, s0: 10 * k * Math.sqrt(level), s1: 2,
        c0: HOT, c1: c, a: 0.9 });
    }
    
    add(pts, { x: tx, z: tz, life: dt * 1.5, s0: (14 + rnd() * 6) * k * Math.sqrt(level), s1: 9 * k, c0: HOT, c1: c, a: 0.85, drag: 0 });
  }

  
  function muzzle(x, z, pol, dx = 0, dz = 1) {
    const c = polColour(pol);
    add(pts, { x, z, life: 0.07, s0: 22, s1: 6, c0: HOT, c1: c, a: 0.9, drag: 0 });
    for (let i = 0; i < 3; i++) {
      const a = Math.atan2(dz, dx) + (rnd() - 0.5) * 0.9, v = 180 + rnd() * 120;
      add(str, { x, z, vx: Math.cos(a) * v, vz: Math.sin(a) * v, life: 0.08 + rnd() * 0.05, drag: 6,
        s0: 1.6, s1: 0.4, c0: HOT, c1: c, len: 0.03 });
    }
  }

  
  function hit(x, z, pol) {
    const c = polColour(pol);
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 2 + (rnd() - 0.5) * 1.6, v = 150 + rnd() * 150;
      add(str, { x, z, vx: Math.cos(a) * v, vz: Math.sin(a) * v, life: 0.14 + rnd() * 0.08, drag: 5,
        s0: 1.8, s1: 0.5, c0: HOT, c1: c, len: 0.035 });
    }
    add(pts, { x, z, life: 0.08, s0: 14, s1: 6, c0: HOT, drag: 0, a: 0.8 });
  }

  const shed = []; 
  



  function chain(x, z, count, pol) {
    const c = polColour(pol), k = Math.min(10, Math.max(1, count));
    const nRay = 20 + 5 * k;
    for (let i = 0; i < nRay; i++) {
      const a = (i / nRay) * Math.PI * 2, v = 260 + 18 * k + rnd() * 60;
      add(str, { x, z, vx: Math.cos(a) * v, vz: Math.sin(a) * v, life: 0.3 + 0.02 * k, drag: 4,
        s0: 2.6, s1: 0.6, c0: HOT, c1: c, len: 0.05 });
    }
    const nMote = 20 + 8 * k;
    for (let i = 0; i < nMote; i++) {
      const a = (i / nMote) * Math.PI * 6, r0 = 6 + i * 0.9, v = 70 + rnd() * 40;
      add(pts, { x: x + Math.cos(a) * r0, z: z + Math.sin(a) * r0, vx: -Math.sin(a) * v, vz: Math.cos(a) * v - 90,
        life: 0.6 + rnd() * 0.4, drag: 1.6, s0: 6 + rnd() * 4, s1: 1, c0: rnd() < 0.4 ? HOT : c, c1: c, a: 0.95 });
    }
    add(pts, { x, z, life: 0.28, s0: 40 + 6 * k, s1: 150 + 10 * k, c0: HOT, c1: c, a: 0.6, drag: 0 });
  }

  







  function bomb(x, z, pol) {
    const c = polColour(pol), o = polColour(pol ? 0 : 1);
    add(pts, { x, z, life: 0.35, s0: 120, s1: 900, c0: HOT, c1: c, a: 0.75, drag: 0 });
    add(pts, { x, z, life: 0.6, s0: 60, s1: 420, c0: c, c1: deep(c), a: 0.6, drag: 0 });
    const nRing = 180, vRing = 1900;
    for (let i = 0; i < nRing; i++) {
      const a = (i / nRing) * Math.PI * 2;
      add(pts, { x: x + Math.cos(a) * 20, z: z + Math.sin(a) * 20, vx: Math.cos(a) * vRing, vz: Math.sin(a) * vRing,
        life: 0.9, drag: 1.5, s0: 14, s1: 6, c0: HOT, c1: c, a: 0.85, ring: 1 });
    }
    const nRay = 96;
    for (let i = 0; i < nRay; i++) {
      const a = (i / nRay) * Math.PI * 2 + rnd() * 0.04, v = 900 + rnd() * 300;
      add(str, { x, z, vx: Math.cos(a) * v, vz: Math.sin(a) * v, life: 0.5 + rnd() * 0.2, drag: 2.5,
        s0: 3.2, s1: 0.8, c0: HOT, c1: o, len: 0.06 });
    }
    for (let i = 0; i < 90; i++) {
      const a = ang(), v = 80 + rnd() * 320;
      add(pts, { x, z, vx: Math.cos(a) * v, vz: Math.sin(a) * v, life: 0.6 + rnd() * 0.6, drag: 2,
        s0: 6 + rnd() * 10, s1: 1, c0: rnd() < 0.5 ? HOT : c, c1: rnd() < 0.5 ? c : o, a: 0.9 });
    }
    shake.amp = Math.max(shake.amp, 12);
    shake.t = 0.6;
  }

  
  function cancel(x, z, pol) {
    const c = polColour(pol);
    add(pts, { x, z, life: 0.16, s0: 16, s1: 4, c0: HOT, c1: c, a: 0.9, drag: 0 });
    add(pts, { x, z, vx: (rnd() - 0.5) * 60, vz: -240 - rnd() * 120, life: 0.55 + rnd() * 0.25, drag: 0.6,
      s0: 7, s1: 2, c0: HOT, c1: c, a: 0.95 });
  }

  




  function hull(x, z, size, pol) {
    add(pts, { x, z, life: 0.07, s0: size * 1.25, s1: size * 0.9, c0: HOT, c1: polColour(pol), a: 0.55, drag: 0 });
  }

  
  const hold = { t: 0 };
  function hitstop(sec) { hold.t = Math.max(hold.t, sec); }

  function stepPool(p, dt) {
    let w = 0;
    for (let i = 0; i < p.n; i++) {
      const life = p.life[i] + dt;
      if (life >= p.max[i]) continue;
      const f = Math.exp(-p.drag[i] * dt);
      let vx = p.vx[i] * f, vz = p.vz[i] * f;
      if (p.pull[i]) { vx += (p.tx[i] - p.x[i]) * p.pull[i] * dt; vz += (p.tz[i] - p.z[i]) * p.pull[i] * dt; }
      
      if (p.trail[i] && rnd() < 0.75) shed.push(p.x[i], p.z[i], p.r[i], p.g[i], p.b[i]);
      if (w !== i) for (const key of KEYS) p[key][w] = p[key][i];
      p.life[w] = life; p.vx[w] = vx; p.vz[w] = vz;
      p.x[w] = p.x[w] + vx * dt; p.z[w] = p.z[w] + vz * dt;
      w++;
    }
    p.n = w;
  }

  function step(dtReal) {
    const shakeDt = dtReal;
    let dt = dtReal;
    if (hold.t > 0) { hold.t = Math.max(0, hold.t - dtReal); dt = dtReal * 0.06; } 
    stepPool(pts, dt);
    stepPool(str, dt);
    for (let i = 0; i < shed.length; i += 5) {
      const col = [shed[i + 2], shed[i + 3], shed[i + 4]];
      add(pts, { x: shed[i] + (rnd() - 0.5) * 3, z: shed[i + 1] + (rnd() - 0.5) * 3, vz: 25, life: 0.3 + rnd() * 0.15,
        drag: 2, s0: 5, s1: 9, c0: col, c1: deep(col), a: 0.4, smoke: 1 });
    }
    shed.length = 0;
    if (shake.t > 0) { shake.t = Math.max(0, shake.t - shakeDt); if (!shake.t) shake.amp = 0; }
  }

  
  function shakeOffset() {
    if (!shake.t) return [0, 0];
    const a = shake.amp * Math.min(1, shake.t / 0.15);
    return [(rnd() - 0.5) * 2 * a, (rnd() - 0.5) * 2 * a];
  }

  
  function look(p, i) {
    const k = p.life[i] / p.max[i];
    const size = p.s0[i] + (p.s1[i] - p.s0[i]) * k;
    const a = p.a0[i] * (1 - k) * (1 - k * 0.3);
    const ck = Math.min(1, k * 1.6);
    return [size, p.r[i] + (p.r1[i] - p.r[i]) * ck, p.g[i] + (p.g1[i] - p.g[i]) * ck, p.b[i] + (p.b1[i] - p.b[i]) * ck, a];
  }

  return { pts, str, explode, absorb, flip, wake, thrust, muzzle, hit, chain, bomb, cancel, hull, hitstop, step, look, shakeOffset, shake };
}

const KEYS = ['x', 'z', 'vx', 'vz', 'life', 'max', 'drag', 's0', 's1', 'r', 'g', 'b', 'r1', 'g1', 'b1', 'a0', 'len', 'pull', 'tx', 'tz', 'ring', 'trail', 'smoke'];
