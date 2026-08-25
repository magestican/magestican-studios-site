












import { SeededRng } from '../../../web-engine/rng/seededRng.js';
import { CEL, mix } from './palette.js';
import { roughen, seedOf, noise1 } from './handdrawn.js';

export const STAGE_WIDTH = 1600;
export const STAGE_HEIGHT = 271;
export const GROUND_Y = 205;

export const PARALLAX = Object.freeze({
  sky: 0.0, far: 0.22, mid: 0.52, ground: 1.0, near: 1.32,
});

export const SKY = Object.freeze({
  high: mix(CEL.navy, CEL.sky, 0.35),
  mid: CEL.sky,
  low: mix(CEL.sky, CEL.cream, 0.55),
  glow: mix(CEL.cream, CEL.mustard, 0.35),
  shaft: CEL.highlight,
});

export const FOLIAGE = Object.freeze({
  
  far: mix(CEL.moss, CEL.sky, 0.58),
  midLit: mix(CEL.moss, CEL.mustard, 0.30),
  mid: CEL.moss,
  midShade: mix(CEL.moss, CEL.ink, 0.34),
  near: mix(CEL.moss, CEL.ink, 0.62),
});

export const BARK = Object.freeze({
  lit: mix(CEL.bark, CEL.mustard, 0.22),
  base: CEL.bark,
  shade: mix(CEL.bark, CEL.ink, 0.38),
});

export const GROUND = Object.freeze({
  lit: mix(CEL.bark, CEL.mustard, 0.42),
  base: mix(CEL.bark, CEL.mustard, 0.18),
  path: mix(CEL.bark, CEL.ink, 0.18),
  shade: mix(CEL.bark, CEL.ink, 0.42),
  edge: mix(CEL.moss, CEL.ink, 0.30),
});

function seededFrom(seed) {
  if (typeof seed === 'number') return new SeededRng(seed || 1);
  return new SeededRng(1).child(String(seed));
}


function tree(rng, x, baseY, scale, tone, barkTone) {
  const shapes = [];
  const th = 96 * scale;
  const tw = 11 * scale;
  const topY = baseY - th;

  
  const lean = rng.rangeF(-0.14, 0.14) * th;
  shapes.push({
    t: 'poly', fill: barkTone.base, line: null,
    pts: [
      [x - tw * 0.5, baseY], [x + tw * 0.5, baseY],
      [x + lean + tw * 0.20, topY], [x + lean - tw * 0.20, topY],
    ],
  });
  shapes.push({
    t: 'poly', fill: barkTone.shade, line: null,
    pts: [
      [x - tw * 0.5, baseY], [x - tw * 0.12, baseY],
      [x + lean - tw * 0.05, topY], [x + lean - tw * 0.20, topY],
    ],
  });
  
  shapes.push({
    t: 'poly', fill: barkTone.shade, line: null,
    pts: [
      [x - tw * 1.15, baseY + 3 * scale], [x - tw * 0.5, baseY - 12 * scale],
      [x + tw * 0.5, baseY - 12 * scale], [x + tw * 1.15, baseY + 3 * scale],
    ],
  });

  
  const branches = rng.rangeI(3, 5);
  const clumps = [];
  for (let i = 0; i < branches; i += 1) {
    const t = 0.35 + (i / branches) * 0.6;
    const bx = x + lean * t;
    const by = baseY - th * t;
    const dir = i % 2 === 0 ? -1 : 1;
    const len = (26 + rng.rangeI(0, 22)) * scale;
    const rise = (14 + rng.rangeI(0, 16)) * scale;
    const ex = bx + dir * len;
    const ey = by - rise;
    const bw = tw * (0.34 - i * 0.04);
    shapes.push({
      t: 'poly', fill: barkTone.base, line: null,
      pts: [
        [bx, by + bw], [ex, ey + bw * 0.55],
        [ex, ey - bw * 0.55], [bx, by - bw],
      ],
    });
    clumps.push([ex, ey, (18 + rng.rangeI(0, 12)) * scale]);
  }
  clumps.push([x + lean, topY - 6 * scale, (24 + rng.rangeI(0, 12)) * scale]);

  
  for (const [cx0, cy0, r] of clumps) {
    for (const [dx, dy, rr, fill] of [
      [0, 0, r, tone.mid],
      [-r * 0.35, -r * 0.30, r * 0.72, tone.midLit],
      [r * 0.30, r * 0.22, r * 0.66, tone.midShade],
    ]) {
      const cx = cx0 + dx;
      const cy = cy0 + dy;
      const pts = [];
      const lobes = 7;
      for (let k = 0; k < lobes * 2; k += 1) {
        const a = (k / (lobes * 2)) * Math.PI * 2 - Math.PI / 2;
        const rad = rr * (k % 2 === 0 ? 1 : 0.74);
        pts.push([cx + Math.cos(a) * rad, cy + Math.sin(a) * rad * 0.78]);
      }
      shapes.push({ t: 'poly', fill, line: null, pts });
    }
  }
  return shapes;
}

export const EXTRA = Object.freeze({
  mountain: mix(CEL.sky, CEL.navy, 0.45),
  mountainSnow: mix(CEL.sky, CEL.highlight, 0.55),
  cloud: mix(CEL.cream, CEL.highlight, 0.45),
  cloudShade: mix(CEL.cream, CEL.sky, 0.35),
  rock: mix(CEL.bark, CEL.navy, 0.35),
  rockLit: mix(CEL.bark, CEL.cream, 0.30),
  bush: mix(CEL.moss, CEL.ink, 0.18),
  bushLit: mix(CEL.moss, CEL.mustard, 0.42),
  leaf: mix(CEL.rust, CEL.mustard, 0.45),
});

export function buildStage(seed = 'fighter-ex') {
  const rng = seededFrom(seed);
  const planes = { far: [], mid: [], ground: [], near: [] };

  
  
  
  for (const [off, tone, top] of [[0, EXTRA.mountain, 46], [420, mix(EXTRA.mountain, SKY.mid, 0.45), 62]]) {
    const ridge = [[-260, STAGE_HEIGHT]];
    let y = top + rng.rangeI(0, 14);
    for (let x = -260; x <= STAGE_WIDTH + 260; x += 46) {
      y = Math.max(top - 26, Math.min(top + 40, y + rng.rangeI(-16, 16)));
      ridge.push([x + off % 46, y]);
    }
    ridge.push([STAGE_WIDTH + 260, STAGE_HEIGHT]);
    planes.far.push({ t: 'poly', fill: tone, line: null, pts: ridge });
    
    const peaks = ridge.slice(1, -1).filter((p) => p[1] < top - 8).slice(0, 3);
    for (const [px, py] of peaks) {
      planes.far.push({
        t: 'poly', fill: EXTRA.mountainSnow, line: null,
        pts: [[px - 16, py + 10], [px, py - 2], [px + 16, py + 10], [px + 6, py + 8], [px - 6, py + 8]],
      });
    }
  }

  
  for (let k = 0; k < 5; k += 1) {
    const cx = rng.rangeI(-200, STAGE_WIDTH + 200);
    const cy = rng.rangeI(18, 64);
    const w = rng.rangeI(50, 110);
    const lobes = [[0, 0, w * 0.5], [-w * 0.32, 4, w * 0.3], [w * 0.3, 3, w * 0.34], [0, -w * 0.16, w * 0.32]];
    for (const [dx, dy, r] of lobes) {
      const pts = [];
      for (let i = 0; i <= 10; i += 1) {
        const a = Math.PI + (i / 10) * Math.PI;
        pts.push([cx + dx + Math.cos(a) * r, cy + dy + Math.sin(a) * r * 0.62]);
      }
      pts.push([cx + dx + r, cy + dy + 2], [cx + dx - r, cy + dy + 2]);
      planes.far.push({ t: 'poly', fill: EXTRA.cloud, line: null, pts });
    }
    planes.far.push({
      t: 'poly', fill: EXTRA.cloudShade, line: null,
      pts: [[cx - w * 0.55, cy + 4], [cx + w * 0.55, cy + 4], [cx + w * 0.44, cy + 9], [cx - w * 0.44, cy + 9]],
    });
  }

  
  const farTop = 92;
  const pts = [[-260, STAGE_HEIGHT]];
  for (let x = -260; x <= STAGE_WIDTH + 260; x += 20) {
    pts.push([x, farTop + Math.sin(x * 0.031) * 9 + rng.rangeI(-8, 10)]);
  }
  pts.push([STAGE_WIDTH + 260, STAGE_HEIGHT]);
  planes.far.push({ t: 'poly', fill: FOLIAGE.far, line: null, pts });

  
  for (let x = -180; x < STAGE_WIDTH + 180; x += rng.rangeI(96, 168)) {
    const scale = rng.rangeF(0.85, 1.25);
    planes.mid.push(...tree(rng, x, GROUND_Y - rng.rangeI(0, 8), scale, FOLIAGE, BARK));
  }

  
  planes.ground.push({ t: 'rect', fill: GROUND.lit, x: -260, y: GROUND_Y, w: STAGE_WIDTH + 520, h: 12 });
  planes.ground.push({ t: 'rect', fill: GROUND.base, x: -260, y: GROUND_Y + 12, w: STAGE_WIDTH + 520, h: 16 });
  planes.ground.push({ t: 'rect', fill: GROUND.path, x: -260, y: GROUND_Y + 28, w: STAGE_WIDTH + 520, h: 20 });
  planes.ground.push({ t: 'rect', fill: GROUND.shade, x: -260, y: GROUND_Y + 48, w: STAGE_WIDTH + 520, h: STAGE_HEIGHT });
  
  for (let x = -200; x < STAGE_WIDTH + 200; x += rng.rangeI(12, 30)) {
    const n = rng.rangeI(3, 5);
    const bw = rng.rangeI(6, 13);
    const bh = rng.rangeI(5, 11);
    const blades = [];
    for (let k = 0; k < n; k += 1) {
      const bx = x + (k - n / 2) * (bw / n);
      blades.push([[bx, GROUND_Y + 2], [bx + rng.rangeI(-3, 3), GROUND_Y - bh], [bx + 1.6, GROUND_Y + 2]]);
    }
    planes.ground.push({ t: 'blades', fill: GROUND.edge, blades });
  }

  
  for (let x = -200; x < STAGE_WIDTH + 200; x += rng.rangeI(180, 340)) {
    const w = rng.rangeI(14, 34);
    const hR = rng.rangeI(8, 16);
    const y = GROUND_Y + rng.rangeI(6, 22);
    planes.ground.push({
      t: 'poly', fill: EXTRA.rock, line: null,
      pts: [[x - w * 0.5, y], [x - w * 0.34, y - hR], [x + w * 0.10, y - hR * 1.25],
            [x + w * 0.42, y - hR * 0.6], [x + w * 0.5, y]],
    });
    planes.ground.push({
      t: 'poly', fill: EXTRA.rockLit, line: null,
      pts: [[x - w * 0.34, y - hR], [x + w * 0.10, y - hR * 1.25], [x + w * 0.16, y - hR * 0.8], [x - w * 0.2, y - hR * 0.72]],
    });
  }

  
  for (let x = -200; x < STAGE_WIDTH + 200; x += rng.rangeI(140, 300)) {
    const w = rng.rangeI(26, 54);
    const hB = rng.rangeI(10, 20);
    const base = GROUND_Y + rng.rangeI(0, 4);
    for (const [tone, k] of [[EXTRA.bush, 1], [EXTRA.bushLit, 0.66]]) {
      const pts = [[x - w * 0.5 * k, base]];
      const lobes = 5;
      for (let i = 0; i <= lobes; i += 1) {
        const t = i / lobes;
        pts.push([x - w * 0.5 * k + w * k * t, base - Math.sin(t * Math.PI) * hB * k - (i % 2) * 3]);
      }
      pts.push([x + w * 0.5 * k, base]);
      planes.ground.push({ t: 'poly', fill: tone, line: null, pts });
    }
  }

  
  
  for (let x = -180; x < STAGE_WIDTH + 180; x += rng.rangeI(26, 70)) {
    const y = GROUND_Y + rng.rangeI(4, 40);
    const r = rng.rangeF(1.6, 3.4);
    const a = rng.rangeF(0, Math.PI);
    planes.ground.push({
      t: 'poly', fill: EXTRA.leaf, line: null,
      pts: [[x - Math.cos(a) * r * 1.6, y - Math.sin(a) * r * 1.6],
            [x + Math.sin(a) * r, y - Math.cos(a) * r],
            [x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 1.6],
            [x - Math.sin(a) * r, y + Math.cos(a) * r]],
    });
  }

  
  for (let x = -260; x < STAGE_WIDTH + 260; x += rng.rangeI(120, 240)) {
    const n = rng.rangeI(6, 10);
    const blades = [];
    for (let k = 0; k < n; k += 1) {
      const bx = x + rng.rangeI(-40, 40);
      const bh = rng.rangeI(20, 42);
      blades.push([[bx, STAGE_HEIGHT + 6], [bx + rng.rangeI(-14, 14), STAGE_HEIGHT - bh], [bx + 5, STAGE_HEIGHT + 6]]);
    }
    planes.near.push({ t: 'blades', fill: FOLIAGE.near, blades });
  }

  const shafts = [];
  for (let k = 0; k < 5; k += 1) {
    shafts.push({ x: rng.rangeI(-120, STAGE_WIDTH), w: rng.rangeI(20, 56), lean: rng.rangeF(0.22, 0.46) });
  }
  return { planes, shafts, seed: String(seed) };
}

export function stageColours() {
  return [...Object.values(SKY), ...Object.values(FOLIAGE), ...Object.values(BARK), ...Object.values(GROUND), ...Object.values(EXTRA)];
}

function drawShapes(ctx, shapes) {
  for (const s of shapes) {
    if (s.t === 'rect') {
      ctx.fillStyle = s.fill;
      ctx.fillRect(s.x, s.y, s.w, s.h);
    } else if (s.t === 'poly') {
      
      
      
      
      const pts = roughen(s.pts, { amp: 1.6, step: 11, seed: seedOf(s.pts) });
      ctx.fillStyle = s.fill;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      ctx.fill();
    } else if (s.t === 'blades') {
      ctx.fillStyle = s.fill;
      ctx.beginPath();
      for (const b of s.blades) {
        ctx.moveTo(b[0][0], b[0][1]);
        ctx.quadraticCurveTo(b[1][0], b[1][1], b[2][0], b[2][1]);
        ctx.closePath();
      }
      ctx.fill();
    }
  }
}

export function drawSky(ctx, width, height) {
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, SKY.high);
  g.addColorStop(0.45, SKY.mid);
  g.addColorStop(0.78, SKY.low);
  g.addColorStop(1, SKY.glow);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}

export function drawPlane(ctx, stage, name, { camX, camY, zoom, width, height, offsetX }) {
  const rate = PARALLAX[name];
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-width / 2, -height / 2);
  ctx.translate(-camX * rate, -camY * rate);
  ctx.translate(-offsetX, 0);
  drawShapes(ctx, stage.planes[name]);
  ctx.restore();
}

export function drawShafts(ctx, stage, { camX, width, height, offsetX }) {
  ctx.save();
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = SKY.shaft;
  for (const s of stage.shafts) {
    const x = s.x - camX * PARALLAX.mid - offsetX;
    ctx.beginPath();
    ctx.moveTo(x, -10);
    ctx.lineTo(x + s.w, -10);
    ctx.lineTo(x + s.w + height * s.lean, height);
    ctx.lineTo(x + height * s.lean, height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
