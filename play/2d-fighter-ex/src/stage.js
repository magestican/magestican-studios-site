


















import { SeededRng } from '../../../web-engine/rng/seededRng.js';
import { ANIME, mix } from './palette.js';

export const STAGE_WIDTH = 1440;
export const STAGE_HEIGHT = 271;


export const GROUND_Y = 205;


export const PARALLAX = Object.freeze({
  sky: 0.0, far: 0.25, mid: 0.55, ground: 1.0, near: 1.35,
});













export const SKY = Object.freeze({
  high: mix(ANIME.accent, ANIME.shadow, 0.38),
  low: mix(ANIME.secondary, ANIME.accent, 0.42),
  haze: mix(ANIME.secondary, ANIME.primary, 0.62),
  shaft: mix(ANIME.secondary, ANIME.highlight, 0.5),
});






export const FOLIAGE = Object.freeze({
  far: mix(ANIME.accent, ANIME.secondary, 0.34),
  mid: mix(ANIME.accent, ANIME.shadow, 0.62),
  midLit: mix(ANIME.accent, ANIME.shadow, 0.48),
  trunk: mix(ANIME.primary, ANIME.shadow, 0.68),
  near: mix(ANIME.accent, ANIME.shadow, 0.88),
});



export const GROUND = Object.freeze({
  lit: mix(ANIME.primary, ANIME.shadow, 0.22),
  path: mix(ANIME.primary, ANIME.shadow, 0.38),
  shade: mix(ANIME.primary, ANIME.shadow, 0.56),
  edge: mix(ANIME.primary, ANIME.shadow, 0.72),
});

function seededFrom(seed) {
  if (typeof seed === 'number') return new SeededRng(seed || 1);
  return new SeededRng(1).child(String(seed));
}






export function buildStage(seed = 'fighter-ex') {
  const rng = seededFrom(seed);
  const planes = { far: [], mid: [], ground: [], near: [] };

  
  
  const farTop = 96;
  const pts = [[-200, STAGE_HEIGHT]];
  for (let x = -200; x <= STAGE_WIDTH + 200; x += 26) {
    pts.push([x, farTop + rng.rangeI(-14, 16)]);
  }
  pts.push([STAGE_WIDTH + 200, STAGE_HEIGHT]);
  planes.far.push({ t: 'poly', fill: FOLIAGE.far, pts });

  
  for (let x = -160; x < STAGE_WIDTH + 160; x += rng.rangeI(70, 140)) {
    const h = rng.rangeI(96, 150);
    const baseY = GROUND_Y - rng.rangeI(0, 10);
    const tw = rng.rangeI(7, 13);
    planes.mid.push({ t: 'rect', fill: FOLIAGE.trunk, x: x - tw / 2, y: baseY - h, w: tw, h });
    const cy = baseY - h;
    const blobs = rng.rangeI(3, 5);
    for (let k = 0; k < blobs; k += 1) {
      planes.mid.push({
        t: 'ellipse', fill: k % 2 ? FOLIAGE.mid : FOLIAGE.midLit,
        cx: x + rng.rangeI(-30, 30), cy: cy + rng.rangeI(-26, 22),
        rx: rng.rangeI(26, 46), ry: rng.rangeI(18, 30),
      });
    }
  }

  
  planes.ground.push({ t: 'rect', fill: GROUND.lit, x: -200, y: GROUND_Y, w: STAGE_WIDTH + 400, h: 18 });
  planes.ground.push({ t: 'rect', fill: GROUND.path, x: -200, y: GROUND_Y + 18, w: STAGE_WIDTH + 400, h: 22 });
  planes.ground.push({ t: 'rect', fill: GROUND.shade, x: -200, y: GROUND_Y + 40, w: STAGE_WIDTH + 400, h: STAGE_HEIGHT });
  for (let x = -160; x < STAGE_WIDTH + 160; x += rng.rangeI(18, 46)) {
    planes.ground.push({
      t: 'tuft', fill: GROUND.edge, x, y: GROUND_Y + rng.rangeI(0, 3),
      w: rng.rangeI(7, 15), h: rng.rangeI(4, 9),
    });
  }

  
  for (let x = -200; x < STAGE_WIDTH + 200; x += rng.rangeI(90, 200)) {
    planes.near.push({
      t: 'tuft', fill: FOLIAGE.near, x, y: STAGE_HEIGHT - rng.rangeI(0, 10),
      w: rng.rangeI(40, 90), h: rng.rangeI(18, 34),
    });
  }

  
  const shafts = [];
  for (let k = 0; k < 4; k += 1) {
    shafts.push({ x: rng.rangeI(-100, STAGE_WIDTH), w: rng.rangeI(26, 70), lean: rng.rangeF(0.25, 0.5) });
  }

  return { planes, shafts, seed: String(seed) };
}


export function stageColours() {
  return [...Object.values(SKY), ...Object.values(FOLIAGE), ...Object.values(GROUND)];
}

function tuft(ctx, s) {
  ctx.fillStyle = s.fill;
  ctx.beginPath();
  ctx.moveTo(s.x - s.w / 2, s.y);
  ctx.quadraticCurveTo(s.x - s.w * 0.2, s.y - s.h, s.x, s.y - s.h * 0.6);
  ctx.quadraticCurveTo(s.x + s.w * 0.2, s.y - s.h * 1.2, s.x + s.w * 0.45, s.y - s.h * 0.3);
  ctx.quadraticCurveTo(s.x + s.w * 0.3, s.y - s.h * 0.1, s.x + s.w / 2, s.y);
  ctx.closePath();
  ctx.fill();
}

function drawShapes(ctx, shapes) {
  for (const s of shapes) {
    if (s.t === 'rect') {
      ctx.fillStyle = s.fill;
      ctx.fillRect(s.x, s.y, s.w, s.h);
    } else if (s.t === 'ellipse') {
      ctx.fillStyle = s.fill;
      ctx.beginPath();
      ctx.ellipse(s.cx, s.cy, s.rx, s.ry, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (s.t === 'poly') {
      ctx.fillStyle = s.fill;
      ctx.beginPath();
      ctx.moveTo(s.pts[0][0], s.pts[0][1]);
      for (let i = 1; i < s.pts.length; i += 1) ctx.lineTo(s.pts[i][0], s.pts[i][1]);
      ctx.closePath();
      ctx.fill();
    } else if (s.t === 'tuft') {
      tuft(ctx, s);
    }
  }
}


export function drawSky(ctx, width, height) {
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, SKY.high);
  g.addColorStop(0.62, SKY.low);
  g.addColorStop(1, SKY.haze);
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
  ctx.globalAlpha = 0.10;
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
