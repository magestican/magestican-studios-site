












export const CHAR_SCALE = 0.78; 
export const VIEW_ZOOM = 0.9; 

export const BODY_R = { kid: 0.22, dachi: 0.2, elder: 0.26 };


export const GAP = 0.62;





export const BATTLE_AIR = 0.12;              
export const FIGHTER_R = [0.28, 0.36, 0.45]; 
export const BOSS_R = 0.62;                  
export const fighterR = (stage, boss = false) => (boss ? BOSS_R : FIGHTER_R[Math.max(0, Math.min(2, stage - 1))]);

export const reachPlus = (ra, rb) => Math.max(0, ra + rb + BATTLE_AIR - 0.8);







export const SEE_PAD = 0.18;
export const seeWindow = (tall, half = 0) => ({ mid: tall * 0.5, r: Math.max(tall * 0.62, Math.hypot(half, tall * 0.5)) + SEE_PAD });


export const BOSS_TALL_K = 4.2, BOSS_HALF_K = 2.36;
export const bossBody = (bossScale) => ({ tall: bossScale * CHAR_SCALE * BOSS_TALL_K, half: bossScale * CHAR_SCALE * BOSS_HALF_K });







export const BOSS_REF_HALF = bossBody(0.62).half; 
export const bossGroundR = (half) => BOSS_R * half / BOSS_REF_HALF;
export const lairBody = (x, y, half) => { const r = bossGroundR(half); return { kind: 'boss', fixed: true, x, y, r, pad: Math.max(0, r - BODY_R.dachi) }; };


export const SEE_NPC_NEAR = 7;



export function seeOrder({ core = [], bosses = [], npcs = [] }, max, from) {
  const out = core.slice(0, max);
  for (const b of bosses) if (out.length < max) out.push(b);
  if (out.length >= max || !npcs.length) return out;
  const near = [];
  for (const n of npcs) { const d = Math.hypot(n.x - from.x, n.y - from.y); if (d < SEE_NPC_NEAR) near.push([d, n]); }
  near.sort((a, b) => a[0] - b[0]);
  for (const [, n] of near) { if (out.length >= max) break; out.push(n); }
  return out;
}

export const FOLLOW = 1.3;







export function pushApart(bodies, { gap = GAP, k = 1, ok = () => true, skip = () => false, turn = false } = {}) {
  let pushed = 0;
  const mass = (o) => (o.fixed ? Infinity : o.m ?? 1);
  for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
    const a = bodies[i], b = bodies[j], ma = mass(a), mb = mass(b);
    if ((ma === Infinity && mb === Infinity) || skip(a, b)) continue;
    let dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy);
    const g = gap + (a.pad || 0) + (b.pad || 0);
    if (d >= g) continue;
    if (d < 1e-6) { dx = 1e-6; dy = 0; d = 0; } 
    const over = (g - d) * k, u0 = dx / Math.max(d, 1e-6), v0 = dy / Math.max(d, 1e-6);
    const sa = ma === Infinity ? 0 : mb === Infinity ? 1 : mb / (ma + mb), sb = mb === Infinity ? 0 : ma === Infinity ? 1 : ma / (ma + mb);
    const push = (ux, uy) => {
      const ax = a.x - ux * over * sa, ay = a.y - uy * over * sa, bx = b.x + ux * over * sb, by = b.y + uy * over * sb;
      const okA = sa && ok(ax, ay), okB = sb && ok(bx, by);
      if (okA) { a.x = ax; a.y = ay; }
      if (okB) { b.x = bx; b.y = by; }
      
      
      if (!okA && okB && mb !== Infinity && sa) { const cx = b.x + ux * over * sa, cy = b.y + uy * over * sa; if (ok(cx, cy)) { b.x = cx; b.y = cy; } }
      if (!okB && okA && ma !== Infinity && sb) { const cx = a.x - ux * over * sb, cy = a.y - uy * over * sb; if (ok(cx, cy)) { a.x = cx; a.y = cy; } }
      return okA || okB;
    };
    
    
    if (!push(u0, v0) && turn) push(-v0, u0) || push(v0, -u0);
    pushed++;
  }
  return pushed;
}


export function minGap(bodies) {
  let min = Infinity, pair = null;
  for (let i = 0; i < bodies.length; i++) for (let j = i + 1; j < bodies.length; j++) {
    const d = Math.hypot(bodies[i].x - bodies[j].x, bodies[i].y - bodies[j].y);
    if (d < min) { min = d; pair = [i, j]; }
  }
  return { min, pair };
}
