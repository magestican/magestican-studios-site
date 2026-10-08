















export const STRIKE_SHAPES = {
  round: 'bonk', quadruped: 'bite', fish: 'slap', bird: 'peck', serpent: 'whip', bug: 'jab', biped: 'punch',
  plant: 'vine', ghost: 'hand', crab: 'pinch', jelly: 'sting', strider: 'stomp', turtle: 'bash', bat: 'slash',
  snail: 'splat', frog: 'tongue', octopus: 'tentacle', ray: 'barb',
};
export const strikeShape = (plan) => STRIKE_SHAPES[plan] || 'bonk';

const INK = '#1c1830', WHITE = '#ffffff';

export function drawStrike(L, plan, px, py, dx, dy, u, k, col, from) {
  const nx = -dy, ny = dx, e = 1 - k, ease = 1 - e * e * e;
  
  const P = (a, b) => [px + (dx * a + nx * b) * u, py + (dy * a + ny * b) * u];
  const seg = (a0, b0, a1, b1, c, w) => { const p = P(a0, b0), q = P(a1, b1); L.line(p[0], p[1], q[0], q[1], c, w); };
  const shape = strikeShape(plan);
  L.alpha(k < 0.6 ? 1 : (1 - k) / 0.4);
  if (shape === 'bonk') { 
    const pts = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, r = (i % 2 ? 0.16 : 0.42) * (0.6 + ease * 0.5); pts.push([px + Math.cos(a) * r * u * 1.3, py + Math.sin(a) * r * u * 0.7]); }
    L.poly(pts, WHITE); L.disc(px, py - u * 0.35 * ease, Math.max(1, u * 0.1), col);
  } else if (shape === 'bite') { 
    const gap = 0.32 * (1 - ease) + 0.04;
    for (const s of [-1, 1]) {
      seg(-0.35, s * gap, 0.35, s * gap, INK, 2);
      for (let i = 0; i < 4; i++) { const a = -0.28 + i * 0.19, t = P(a, s * gap), b = P(a + 0.09, s * (gap - 0.14)), c = P(a + 0.18, s * gap); L.poly([t, b, c], WHITE); }
    }
  } else if (shape === 'slap') { 
    for (let i = 0; i < 7; i++) { const a0 = -0.9 + i * 0.3 * ease, a1 = a0 + 0.3 * ease; seg(Math.sin(a0) * 0.45, Math.cos(a0) * 0.45 - 0.2, Math.sin(a1) * 0.45, Math.cos(a1) * 0.45 - 0.2, i % 2 ? col : WHITE, 3); }
    for (let i = 0; i < 3; i++) L.disc(...P(0.45 + ease * 0.3, (i - 1) * 0.2), Math.max(1, u * 0.06), col);
  } else if (shape === 'peck') { 
    for (let i = 0; i < 3; i++) { const on = Math.min(1, Math.max(0, k * 3 - i)); if (!on) continue; const b = (i - 1) * 0.22; seg(-0.4, b * 1.6, -0.4 + 0.5 * on, b, WHITE, 2); L.rect(...P(0.1, b), 2, 2, '#ffb030'); }
  } else if (shape === 'whip') { 
    let prev = P(-0.6, 0);
    for (let i = 1; i <= 8; i++) { const a = -0.6 + i * 0.15, p = P(a, Math.sin(i * 0.9 + k * 6) * 0.22 * (1 - i / 10)); if (i / 8 <= ease + 0.1) L.line(prev[0], prev[1], p[0], p[1], i < 6 ? col : WHITE, i < 4 ? 3 : 2); prev = p; }
  } else if (shape === 'jab') { 
    const tip = 0.15 + ease * 0.25;
    L.poly([P(tip, 0), P(tip - 0.45, 0.1), P(tip - 0.45, -0.1)], WHITE);
    for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.4, r = 0.15 + ease * 0.35; L.rect(...P(tip + Math.cos(a) * r * 0.6, Math.sin(a) * r), 2, 2, col); }
  } else if (shape === 'punch') { 
    const c = 0.05 + ease * 0.1;
    for (let i = -1; i <= 1; i++) seg(c - 0.75, i * 0.13, c - 0.3, i * 0.13, WHITE, 1);
    L.disc(...P(c, 0), u * 0.2, INK); L.disc(...P(c, 0), Math.max(1, u * 0.16), col);
    for (let i = -1; i <= 1; i += 2) seg(c + 0.05, i * 0.07, c + 0.17, i * 0.07, INK, 1); 
  } else if (shape === 'vine') { 
    let prev = P(-0.7, 0.2);
    for (let i = 1; i <= 7; i++) { const s = i / 7; if (s > ease + 0.05) break; const p = P(-0.7 + s * 1.0, 0.2 - Math.sin(s * Math.PI) * 0.35 + (s > 0.8 ? (s - 0.8) * 1.2 : 0)); L.line(prev[0], prev[1], p[0], p[1], '#3f8f3a', 2); prev = p; }
    for (const s of [0.35, 0.65]) if (ease > s) L.poly([P(-0.7 + s, 0.0), P(-0.62 + s, -0.12), P(-0.54 + s, 0.0), P(-0.62 + s, 0.06)], '#7ee06a');
  } else if (shape === 'hand') { 
    for (let i = 0; i < 4; i++) { const b = -0.2 + i * 0.13, a0 = -0.6 + ease * 0.6; seg(a0, b, a0 + 0.42, b + 0.05, i === 0 ? '#d8d0ff' : WHITE, 2); }
    L.alpha(0.5); L.disc(...P(-0.6 + ease * 0.6, 0), u * 0.22, '#d8d0ff');
  } else if (shape === 'pinch') { 
    const open = 0.5 * (1 - ease) + 0.05;
    for (const s of [-1, 1]) { const root = P(-0.45, 0), mid = P(-0.1, s * (0.18 + open * 0.4)), tip = P(0.2, s * open * 0.3); L.poly([root, mid, tip, P(-0.12, s * (0.08 + open * 0.2))], col); L.line(mid[0], mid[1], tip[0], tip[1], INK, 1); }
    if (k > 0.45) L.rect(...P(0.22, 0), 3, 3, WHITE);
  } else if (shape === 'sting') { 
    const seed = Math.floor(k * 20);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 + seed * 0.2, r0 = 0.12, r1 = 0.2 + ease * 0.32, m = (r0 + r1) / 2; const p0 = [px + Math.cos(a) * r0 * u, py + Math.sin(a) * r0 * u * 0.7], p1 = [px + Math.cos(a + 0.35) * m * u, py + Math.sin(a + 0.35) * m * u * 0.7], p2 = [px + Math.cos(a) * r1 * u, py + Math.sin(a) * r1 * u * 0.7]; L.line(p0[0], p0[1], p1[0], p1[1], col, 1); L.line(p1[0], p1[1], p2[0], p2[1], WHITE, 1); }
  } else if (shape === 'stomp') { 
    L.ring(px, py + u * 0.15, u * (0.2 + ease * 0.5), u * (0.1 + ease * 0.25), '#c8b090', 2);
    L.disc(px, py + u * 0.15, Math.max(1, u * 0.12), INK); L.rect(px - 1, py + u * 0.05, 2, Math.max(2, Math.round(u * 0.12)), '#c8b090');
  } else if (shape === 'bash') { 
    L.disc(px, py, Math.max(2, u * 0.24 * (0.6 + ease * 0.4)), col); L.disc(px - u * 0.05, py - u * 0.07, Math.max(1, u * 0.06), WHITE);
    for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.3, r1 = 0.28 + ease * 0.25; L.line(px + Math.cos(a) * u * 0.26, py + Math.sin(a) * u * 0.18, px + Math.cos(a + 0.2) * u * r1, py + Math.sin(a + 0.2) * u * r1 * 0.7, INK, 1); }
  } else if (shape === 'slash') { 
    const a0 = -1.3, span = 2.6 * ease;
    for (let i = 0; i < 9; i++) { const t0 = a0 + span * i / 9, t1 = a0 + span * (i + 1) / 9, w = i > 2 && i < 7 ? 3 : 2; seg(Math.cos(t0) * 0.35 - 0.2, Math.sin(t0) * 0.55, Math.cos(t1) * 0.35 - 0.2, Math.sin(t1) * 0.55, w > 2 ? col : WHITE, w); }
    seg(0.05, -0.4, 0.05, 0.4 * ease, WHITE, 1);
  } else if (shape === 'splat') { 
    const r = 0.18 + ease * 0.16;
    L.disc(px, py, Math.max(2, u * r), '#b8f0a0'); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; L.disc(px + Math.cos(a) * u * r * 1.2, py + Math.sin(a) * u * r * 0.9, Math.max(1, u * 0.07), '#b8f0a0'); }
    for (let i = -1; i <= 1; i++) L.rect(px + i * u * 0.12, py + u * r, 2, Math.max(2, Math.round(u * 0.25 * ease)), '#8fd878');
  } else if (shape === 'tongue') { 
    const [fx, fy] = from || P(-1.5, 0), out = k < 0.5 ? k * 2 : (1 - k) * 2, tx = fx + (px - fx) * out, ty = fy + (py - fy) * out;
    L.line(fx, fy, tx, ty, '#ff6a8a', 3); L.line(fx, fy, tx, ty, '#ffb0c0', 1); L.disc(tx, ty, Math.max(2, u * 0.07), '#ff6a8a');
  } else if (shape === 'tentacle') { 
    for (const s of [-1, 1]) { let prev = P(-0.5, s * 0.55); for (let i = 1; i <= 6; i++) { const t = i / 6 * ease, p = P(-0.5 + t * 0.6, s * (0.55 - t * 0.5) + s * Math.sin(t * 6) * 0.06); L.line(prev[0], prev[1], p[0], p[1], col, 3 - (i > 3 ? 1 : 0)); prev = p; } L.rect(prev[0] - 1, prev[1] - 1, 2, 2, WHITE); }
  } else if (shape === 'barb') { 
    const a = -0.9 + ease * 1.1;
    seg(-0.9, 0.4, a, -0.05, INK, 2); seg(-0.9, 0.4, a, -0.05, col, 1);
    L.poly([P(a + 0.16, -0.05), P(a - 0.04, 0.06), P(a - 0.04, -0.16)], WHITE);
  }
  L.alpha(1);
}
