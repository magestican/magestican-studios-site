












import { SeededRng } from '../../../web-engine/rng/seededRng.js';
import { CEL, mix } from './palette.js';

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

export function buildStage(seed = 'fighter-ex') {
  const rng = seededFrom(seed);
  const planes = { far: [], mid: [], ground: [], near: [] };

  
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
  return [...Object.values(SKY), ...Object.values(FOLIAGE), ...Object.values(BARK), ...Object.values(GROUND)];
}

function drawShapes(ctx, shapes) {
  for (const s of shapes) {
    if (s.t === 'rect') {
      ctx.fillStyle = s.fill;
      ctx.fillRect(s.x, s.y, s.w, s.h);
    } else if (s.t === 'poly') {
      ctx.fillStyle = s.fill;
      ctx.beginPath();
      ctx.moveTo(s.pts[0][0], s.pts[0][1]);
      for (let i = 1; i < s.pts.length; i += 1) ctx.lineTo(s.pts[i][0], s.pts[i][1]);
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
