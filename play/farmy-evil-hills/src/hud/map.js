







import { MAP, mapProject } from '../../../../web-engine/horror/minimap.js';
import { progressAt, runRect } from '../../../../web-engine/horror/level.js';
import { HALL_H } from '../constants.js';


































export function drawMap(cv, player, birds, exit, level, deck, bearing, rise = 0) {
  const g = cv.getContext('2d');
  const W = cv.width; const H = cv.height;
  g.clearRect(0, 0, W, H);
  const cx = W / 2; const cy = H * 0.52;
  
  const p = (x, y, z) => mapProject(x, y - rise, z, player, cx, cy, bearing);

  const seg = (a, b, colour, width) => {
    if (!a || !b) return;                 
    g.strokeStyle = colour; g.lineWidth = width || 1;
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  };

  const NEON = '#6ff0d8';
  const MID = 'rgba(111,240,216,0.5)';
  const FAINT = 'rgba(111,240,216,0.22)';
  const GHOST = 'rgba(111,240,216,0.12)';

  const hw = deck.width / 2;
  const H3 = deck.height;

  
  
  
  
  const here = deck.runs[Math.min(deck.runs.length - 1, Math.max(0,
    deck.runs.findIndex((q) => {
      const r = runRect(q);
      return player.x >= r.x0 && player.x <= r.x1 && player.z >= r.z0 && player.z <= r.z1;
    })))] || deck.runs[0];
  {
    const len = Math.hypot(here.x1 - here.x0, here.z1 - here.z0) || 1;
    const dx = (here.x1 - here.x0) / len; const dz = (here.z1 - here.z0) / len;
    const px = -dz; const pz = dx;
    for (const dy of [-MAP.deckGap, MAP.deckGap]) {
      for (const sgn of [-1, 1]) {
        seg(p(here.x0 + px * hw * sgn, dy, here.z0 + pz * hw * sgn),
          p(here.x1 + px * hw * sgn, dy, here.z1 + pz * hw * sgn), GHOST, 1);
      }
      for (let t = 0; t < len; t += 12) {
        const x = here.x0 + dx * t; const z = here.z0 + dz * t;
        seg(p(x - px * hw, dy, z - pz * hw), p(x + px * hw, dy, z + pz * hw), GHOST, 1);
      }
    }
  }

  
  
  
  
  
  
  
  
  
  
  if (deck.bays) {
    const pCar = (x, y, z) => mapProject(x, y, z, player, cx, cy, bearing);
    for (const b of deck.bays) {
      const near2 = Math.hypot((b.x0 + b.x1) / 2 - player.x, (b.z0 + b.z1) / 2 - player.z);
      if (near2 > MAP.range + 8) continue;
      const cs = [[b.x0, b.z0], [b.x1, b.z0], [b.x1, b.z1], [b.x0, b.z1]];
      for (let i = 0; i < 4; i += 1) {
        const a2 = cs[i]; const b2 = cs[(i + 1) % 4];
        
        seg(p(a2[0], 0, a2[1]), p(b2[0], 0, b2[1]), NEON, 1.8);
        seg(p(a2[0], H3 * 0.8, a2[1]), p(b2[0], H3 * 0.8, b2[1]), MID, 1);
      }
      
      const hwc = 1.1;
      const cc = [[b.car.x - hwc, b.car.z - hwc], [b.car.x + hwc, b.car.z - hwc],
        [b.car.x + hwc, b.car.z + hwc], [b.car.x - hwc, b.car.z + hwc]];
      for (let i = 0; i < 4; i += 1) {
        const a3 = cc[i]; const b3 = cc[(i + 1) % 4];
        seg(pCar(a3[0], 0, a3[1]), pCar(b3[0], 0, b3[1]), NEON, 1.2);
        seg(pCar(a3[0], H3 * 0.55, a3[1]), pCar(b3[0], H3 * 0.55, b3[1]), NEON, 1);
      }
    }
  }

  
  
  for (const run of deck.runs) {
    const len = Math.hypot(run.x1 - run.x0, run.z1 - run.z0);
    if (!(len > 0)) continue;
    
    
    const mid = { x: (run.x0 + run.x1) / 2, z: (run.z0 + run.z1) / 2 };
    if (Math.hypot(mid.x - player.x, mid.z - player.z) > MAP.range + len) continue;
    const dx = (run.x1 - run.x0) / len; const dz = (run.z1 - run.z0) / len;
    const px = -dz; const pz = dx;
    const at = (t, sgn) => ({ x: run.x0 + dx * t + px * hw * sgn, z: run.z0 + dz * t + pz * hw * sgn });

    for (const sgn of [-1, 1]) {
      const s0 = at(-hw, sgn); const s1 = at(len + hw, sgn);
      seg(p(s0.x, 0, s0.z), p(s1.x, 0, s1.z), MID, 1.6);
      seg(p(s0.x, H3, s0.z), p(s1.x, H3, s1.z), FAINT, 1);
    }
    for (let t = 0; t <= len; t += 4) {
      const l = at(t, -1); const r = at(t, 1);
      seg(p(l.x, 0, l.z), p(r.x, 0, r.z), FAINT, 1);          
      
      
      if (Math.round(t / 4) % 3 === 0) {
        seg(p(l.x, 0, l.z), p(l.x, H3, l.z), FAINT, 1);
        seg(p(r.x, 0, r.z), p(r.x, H3, r.z), FAINT, 1);
        seg(p(l.x, H3, l.z), p(r.x, H3, r.z), 'rgba(111,240,216,0.12)', 1);
      }
    }
  }

  
  for (const m of deck.rooms) {
    const c = { x: (m.x0 + m.x1) / 2, z: (m.z0 + m.z1) / 2 };
    if (Math.hypot(c.x - player.x, c.z - player.z) > MAP.range + 12) continue;
    const safe = m.kind === 'safe';
    const col = safe ? 'rgba(140,255,190,0.85)' : 'rgba(111,240,216,0.4)';
    const corners = [[m.x0, m.z0], [m.x1, m.z0], [m.x1, m.z1], [m.x0, m.z1]];
    for (let i = 0; i < 4; i += 1) {
      const q = corners[i]; const w2 = corners[(i + 1) % 4];
      seg(p(q[0], 0, q[1]), p(w2[0], 0, w2[1]), col, safe ? 1.5 : 1);
      seg(p(q[0], H3, q[1]), p(w2[0], H3, w2[1]), col, 1);
      seg(p(q[0], 0, q[1]), p(q[0], H3, q[1]), col, 1);
    }
    if (safe) {
      const label = p(c.x, H3 + 0.9, c.z);
      if (label) {
        g.fillStyle = 'rgba(140,255,190,0.95)';
        g.font = 'bold 8px ui-monospace, monospace';
        g.textAlign = 'center';
        g.fillText('SAFE', label[0], label[1]);
      }
    }
  }

  
  for (const b of birds) {
    if (!b.alive) continue;
    if (Math.hypot(b.x - player.x, b.z - player.z) > MAP.range) continue;
    const foot = p(b.x, 0, b.z);
    const top = p(b.x, 0.9, b.z);
    if (!foot || !top) continue;
    seg(foot, top, 'rgba(255,90,74,0.75)', 1);
    g.fillStyle = '#ff5a4a';
    g.fillRect(top[0] - 2.5, top[1] - 2.5, 5, 5);
  }

  
  if (Math.hypot(exit.x - player.x, exit.z - player.z) < MAP.range + 14) {
    const w = 1.1;
    const corners = [
      [exit.x - w, exit.z - 0.8], [exit.x + w, exit.z - 0.8],
      [exit.x + w, exit.z + 0.8], [exit.x - w, exit.z + 0.8],
    ];
    for (let i = 0; i < 4; i += 1) {
      const a2 = corners[i]; const b2 = corners[(i + 1) % 4];
      seg(p(a2[0], 0, a2[1]), p(b2[0], 0, b2[1]), NEON, 1.4);
      seg(p(a2[0], HALL_H, a2[1]), p(b2[0], HALL_H, b2[1]), NEON, 1.4);
      seg(p(a2[0], 0, a2[1]), p(a2[0], HALL_H, a2[1]), NEON, 1.4);
    }
    const label = p(exit.x, HALL_H + 1.1, exit.z);
    if (label) {
      g.fillStyle = NEON;
      g.font = 'bold 9px ui-monospace, monospace';
      g.textAlign = 'center';
      g.fillText('LIFT', label[0], label[1]);
      g.font = '8px ui-monospace, monospace';
      
      
      
      const togo = Math.max(0, progressAt(deck, exit.x, exit.z) - progressAt(deck, player.x, player.z));
      g.fillText(`${Math.round(togo)}m`, label[0], label[1] + 9);
    }
  }

  
  const foot = p(player.x, 0, player.z);
  const head = p(player.x, 1.8, player.z);
  if (foot && head) {
    seg(foot, head, 'rgba(234,255,242,0.5)', 1);
    g.strokeStyle = '#eafff2'; g.lineWidth = 1.6;
    g.beginPath();
    g.moveTo(foot[0], foot[1] - 6);
    g.lineTo(foot[0] - 4.5, foot[1] + 3);
    g.lineTo(foot[0] + 4.5, foot[1] + 3);
    g.closePath(); g.stroke();
  }

  g.strokeStyle = 'rgba(111,240,216,0.55)';
  g.lineWidth = 1;
  g.strokeRect(0.5, 0.5, W - 1, H - 1);
  g.fillStyle = 'rgba(111,240,216,0.8)';
  g.font = '8px ui-monospace, monospace';
  g.textAlign = 'left';
  g.fillText(`DECK ${level}`, 6, 12);
}
