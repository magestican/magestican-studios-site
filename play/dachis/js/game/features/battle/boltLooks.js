











export const BOLT_SHAPES = {
  Ember: 'fireball', Tide: 'drop', Leaf: 'leaf', Spark: 'lightning', Stone: 'rock', Frost: 'shard',
  Gale: 'crescent', Shadow: 'tendrils', Light: 'star', Metal: 'gear', Beast: 'claws', Spirit: 'wisp',
};
export const boltShape = (type) => BOLT_SHAPES[type] || 'orb';

const INK = '#1c1830', WHITE = '#ffffff';

export const BOLT_SCALE = 1.7; 
export function drawBolt(L, type, px, py, dx, dy, u, t, col) {
  u *= BOLT_SCALE;
  const nx = -dy, ny = dx;
  
  const P = (a, b, spin = 0, cx = 0) => {
    const c = Math.cos(spin), s = Math.sin(spin), ra = a * c - b * s + cx, rb = a * s + b * c;
    return [px + (dx * ra + nx * rb) * u, py + (dy * ra + ny * rb) * u];
  };
  const shape = boltShape(type);
  if (shape === 'fireball') {
    for (let i = 0; i < 3; i++) {
      const f = Math.sin(t * 40 + i * 2.1) * 0.12, off = (i - 1) * 0.13;
      L.poly([P(0.02, off - 0.13), P(0.02, off + 0.13), P(-0.62 - f - (i === 1 ? 0.18 : 0), off * 1.6)], i === 1 ? '#ff6a1a' : '#ffb03a');
    }
    L.disc(...P(0, 0), u * 0.21 + 1, col); L.disc(...P(0.04, 0), u * 0.12, '#ffe36a'); L.disc(...P(0.06, 0), Math.max(1, u * 0.05), WHITE);
  } else if (shape === 'drop') {
    L.poly([P(0.27, 0), P(0.08, 0.17), P(-0.12, 0.14), P(-0.42, 0), P(-0.12, -0.14), P(0.08, -0.17)], col);
    L.disc(...P(0.1, -0.06), Math.max(1, u * 0.05), WHITE);
    for (let i = 0; i < 3; i++) { const k = (t * 3 + i / 3) % 1; L.disc(...P(-0.55 - k * 0.5, (i - 1) * 0.18 * (1 + k)), Math.max(1, u * 0.06 * (1 - k)), col); }
  } else if (shape === 'leaf') {
    const leaf = (cx, sz, spin) => {
      const pts = []; for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; pts.push(P(Math.cos(a) * 0.3 * sz, Math.sin(a) * 0.12 * sz * (Math.cos(a) > 0 ? 1 : 0.7), spin, cx)); }
      L.poly(pts, col); const [a0, a1] = [P(-0.3 * sz, 0, spin, cx), P(0.3 * sz, 0, spin, cx)]; L.line(a0[0], a0[1], a1[0], a1[1], '#e8ffd0', 1);
    };
    leaf(0, 1.45, t * 16); leaf(-0.75, 0.7, -t * 20 + 1); leaf(-1.25, 0.5, t * 22 + 2);
  } else if (shape === 'lightning') {
    const seed = Math.floor(t * 30), pts = [P(0.3, 0)];
    for (let i = 1; i <= 5; i++) pts.push(P(0.3 - i * 0.24, (i % 2 ? 1 : -1) * (0.1 + ((seed * 7 + i * 13) % 5) * 0.025)));
    for (let i = 0; i + 1 < pts.length; i++) { L.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], col, 3); }
    for (let i = 0; i + 1 < pts.length; i++) { L.line(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], WHITE, 1); }
    const fork = pts[2], tip = P(-0.2, (seed % 2 ? 0.34 : -0.34)); L.line(fork[0], fork[1], tip[0], tip[1], col, 1);
  } else if (shape === 'rock') {
    const R = [0.26, 0.2, 0.28, 0.22, 0.25, 0.19], pts = R.map((r, i) => { const a = i / R.length * Math.PI * 2; return P(Math.cos(a) * r, Math.sin(a) * r, t * 9); });
    L.poly(pts, INK); L.poly(R.map((r, i) => { const a = i / R.length * Math.PI * 2; return P(Math.cos(a) * (r - 0.04), Math.sin(a) * (r - 0.04), t * 9); }), col);
    L.disc(...P(-0.05, -0.07, t * 9), Math.max(1, u * 0.05), '#f2e6cf');
    for (let i = 0; i < 2; i++) L.disc(...P(-0.5 - i * 0.28, (i ? 1 : -1) * 0.12), Math.max(1, u * 0.07), col);
  } else if (shape === 'shard') {
    L.poly([P(0.45, 0), P(0.02, 0.11), P(-0.42, 0), P(0.02, -0.11)], col);
    const [a, b] = [P(-0.3, 0), P(0.38, 0)]; L.line(a[0], a[1], b[0], b[1], WHITE, 1);
    for (let i = 0; i < 3; i++) { const k = (t * 2.5 + i / 3) % 1, [sx, sy] = P(-0.55 - k * 0.6, Math.sin(i * 2.4) * 0.2), g = Math.max(1, Math.round(u * 0.08 * (1 - k))); L.rect(sx - g, sy, g * 2 + 1, 1, WHITE); L.rect(sx, sy - g, 1, g * 2 + 1, WHITE); }
  } else if (shape === 'crescent') {
    for (let r = 0; r < 2; r++) {
      const rad = 0.3 - r * 0.1, spin = t * 18 + r * 1.3;
      for (let i = 0; i < 9; i++) { const a0 = i / 12 * Math.PI * 2, a1 = (i + 1) / 12 * Math.PI * 2; const p0 = P(Math.cos(a0) * rad, Math.sin(a0) * rad, spin), p1 = P(Math.cos(a1) * rad, Math.sin(a1) * rad, spin); L.line(p0[0], p0[1], p1[0], p1[1], r ? WHITE : col, r ? 1 : 3); }
    }
    for (let i = 0; i < 2; i++) { const [a, b] = [P(-0.35, (i ? 1 : -1) * 0.2), P(-0.85, (i ? 1 : -1) * 0.26)]; L.line(a[0], a[1], b[0], b[1], WHITE, 1); }
  } else if (shape === 'tendrils') {
    for (let i = 0; i < 3; i++) {
      let prev = P(0, (i - 1) * 0.1);
      for (let j = 1; j <= 6; j++) { const p = P(-j * 0.14, (i - 1) * 0.1 + Math.sin(t * 14 + j * 0.9 + i * 2) * 0.09 * j / 3); L.line(prev[0], prev[1], p[0], p[1], j < 4 ? col : '#2a1840', 2); prev = p; }
    }
    L.disc(...P(0, 0), u * 0.22 + 1, '#2a1840'); L.disc(...P(0, 0), u * 0.13, col); L.disc(...P(0.05, 0), Math.max(1, u * 0.05), '#ff4a6a');
  } else if (shape === 'star') {
    const pts = []; for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, r = i % 2 ? 0.08 : 0.38; pts.push(P(Math.cos(a) * r, Math.sin(a) * r, t * 7)); }
    L.poly(pts, col); L.disc(...P(0, 0), u * 0.1, WHITE);
    const [a, b] = [P(-0.2, 0), P(-0.9, 0)]; L.alpha(0.6); L.line(a[0], a[1], b[0], b[1], col, 2); L.alpha(1);
  } else if (shape === 'gear') {
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2, w = 0.08; L.poly([P(0.17, -w, a + t * 14), P(0.31, -w * 0.7, a + t * 14), P(0.31, w * 0.7, a + t * 14), P(0.17, w, a + t * 14)], col); }
    L.disc(...P(0, 0), u * 0.21, col); L.disc(...P(0, 0), u * 0.08 + 1, INK); L.disc(...P(-0.08, -0.08), Math.max(1, u * 0.04), WHITE);
  } else if (shape === 'claws') {
    for (let i = -1; i <= 1; i++) {
      let prev = P(-0.55, i * 0.15);
      for (let j = 1; j <= 5; j++) { const a = -0.55 + j * 0.17, p = P(a, i * 0.15 + Math.sin(j / 5 * Math.PI) * 0.06); L.line(prev[0], prev[1], p[0], p[1], col, 3); L.line(prev[0], prev[1], p[0], p[1], WHITE, 1); prev = p; }
    }
  } else if (shape === 'wisp') {
    const f = Math.sin(t * 22) * 0.08;
    L.poly([P(0.12, -0.17), P(0.12, 0.17), P(-0.35, 0.1 + f), P(-0.7, f * 2), P(-0.35, -0.1 + f)], col);
    L.disc(...P(0.05, 0), u * 0.19, col);
    L.disc(...P(0.08, -0.07), Math.max(1, u * 0.04), INK); L.disc(...P(0.08, 0.07), Math.max(1, u * 0.04), INK);
  } else { L.disc(px, py, u * 0.2 + 1, col); L.disc(px, py, Math.max(1, u * 0.09), WHITE); }
}
