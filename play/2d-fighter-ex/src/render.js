

import { CANVAS } from './choreography.js';
import { CELL, REF_BODY_PX, FEET_ROW, FRAMES_LIGHT, FRAMES_DARK } from './bakeManifest.js';
import { FRAMES } from './choreography.js';
import { drawSky, drawPlane, drawShafts, drawTrain, STAGE_WIDTH } from './stage.js';
import { FX } from './palette.js';


const MOOD_FILTERS = {
  dark: 'brightness(0.72) saturate(0.85)',
  juvenile: 'brightness(1.12) saturate(1.1)',
  angry: 'saturate(1.3) hue-rotate(-12deg) contrast(1.08)',
};

export const STAGE_OFFSET_X = (STAGE_WIDTH - CANVAS.width) / 2;

export function renderFrame(ctx, stage, pose, mood = 'none') {
  const { width, height } = CANVAS;
  const cam = pose.camera;
  const view = { camX: cam.x, camY: cam.y, zoom: cam.zoom, width, height, offsetX: STAGE_OFFSET_X };

  drawSky(ctx, width, height);
  drawPlane(ctx, stage, 'far', view);
  
  
  drawPlane(ctx, stage, 'rail', view);
  drawTrain(ctx, (pose.index || 0) / FRAMES.length, view);
  drawShafts(ctx, stage, view);
  drawPlane(ctx, stage, 'mid', view);
  drawPlane(ctx, stage, 'ground', view);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const drawSprite = (spec, atlas, index, frameIdx, alpha) => {
    if (!atlas || !frameIdx) return;
    const cellPos = frameIdx[index + 1];
    if (!cellPos) return;
    
    
    
    
    const h = spec.feet - spec.top;
    const scale = h / REF_BODY_PX;
    const size = CELL * scale;
    ctx.save();
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    if (alpha !== undefined) ctx.filter = 'brightness(0.1)';
    else if (mood !== 'none') ctx.filter = MOOD_FILTERS[mood] || 'none';
    ctx.imageSmoothingEnabled = true;
    
    
    
    ctx.translate(spec.cx, spec.feet);
    if (spec.facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(atlas, cellPos[0], cellPos[1], CELL, CELL,
      -size / 2, -FEET_ROW * scale, size, size);
    ctx.restore();
  };

  const sprites = pose.sprites || {};
  if (pose.ghost) {
    if (pose.ghost.a) drawSprite(pose.ghost.a, sprites.light, pose.index, FRAMES_LIGHT, pose.ghost.alpha);
    if (pose.ghost.b) drawSprite(pose.ghost.b, sprites.dark, pose.index, FRAMES_DARK, pose.ghost.alpha);
  }

  
  const pair = [
    [pose.a, sprites.light, FRAMES_LIGHT, 0],
    [pose.b, sprites.dark, FRAMES_DARK, 1],
  ].filter(([s]) => s);
  pair.sort((p, q) => {
    const dh = (p[0].feet - p[0].top) - (q[0].feet - q[0].top);
    return Math.abs(dh) > 0.5 ? dh : p[3] - q[3];
  });
  for (const [spec, atlas, frameIdx] of pair) {
    drawSprite(spec, atlas, pose.index, frameIdx);
  }

  if (pose.fx) drawEffect(ctx, pose);
  drawPlane(ctx, stage, 'near', view);
}







function drawEffect(ctx, pose) {
  const a = pose.a; const b = pose.b;
  if (!a && !b) return;
  const x = ((a ? a.cx : b.cx) + (b ? b.cx : a.cx)) / 2;
  const mid = (s) => s.top + (s.feet - s.top) * 0.44;
  const y = a && b ? (mid(a) + mid(b)) / 2 : mid(a || b);
  const k = (a ? a.feet - a.top : 90) / 90;

  if (pose.fx === 'burst') {
    const r = 30 * k;

    ctx.save();
    
    ctx.fillStyle = FX.impactLine;
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < 10; i += 1) {
      const ang = (i / 10) * Math.PI * 2 + 0.22;
      const spread = 0.055;
      const inner = r * 0.85;
      const outer = r * (2.0 + (i % 3) * 0.45);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(ang - spread) * inner, y + Math.sin(ang - spread) * inner);
      ctx.lineTo(x + Math.cos(ang) * outer, y + Math.sin(ang) * outer);
      ctx.lineTo(x + Math.cos(ang + spread) * inner, y + Math.sin(ang + spread) * inner);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    
    ctx.fillStyle = FX.rim;
    ctx.beginPath();
    for (let i = 0; i < 24; i += 1) {
      const ang = (i / 24) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 === 0 ? r * 1.42 : r * 0.52;
      const px = x + Math.cos(ang) * rad;
      const py = y + Math.sin(ang) * rad * 0.9;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    
    ctx.fillStyle = FX.burst;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.92, r * 0.84, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = FX.core;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 0.52, r * 0.46, 0, 0, Math.PI * 2);
    ctx.fill();

    
    ctx.strokeStyle = FX.ring;
    ctx.globalAlpha = 0.6;
    ctx.lineWidth = Math.max(1, 1.6 * k);
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.95, r * 1.25, 0, 0, Math.PI * 2);
    ctx.stroke();

    
    ctx.strokeStyle = FX.speed;
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 16; i += 1) {
      const ang = (i / 16) * Math.PI * 2 + 0.4;
      const i0 = r * (1.6 + (i % 3) * 0.3);
      const i1 = i0 + r * (0.9 + (i % 4) * 0.4);
      ctx.lineWidth = Math.max(0.7, (i % 3 === 0 ? 1.9 : 0.9) * k);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(ang) * i0, y + Math.sin(ang) * i0);
      ctx.lineTo(x + Math.cos(ang) * i1, y + Math.sin(ang) * i1);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  
  ctx.save();
  ctx.fillStyle = FX.slash;
  ctx.beginPath();
  ctx.moveTo(x - 40 * k, y - 30 * k);
  ctx.quadraticCurveTo(x + 10 * k, y - 2 * k, x + 36 * k, y + 34 * k);
  ctx.quadraticCurveTo(x + 2 * k, y + 4 * k, x - 34 * k, y - 20 * k);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = FX.impactLine;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = Math.max(0.7, 1.1 * k);
  for (let i = -3; i <= 3; i += 1) {
    const off = i * 8 * k;
    ctx.beginPath();
    ctx.moveTo(x - 48 * k + off, y - 34 * k + off);
    ctx.lineTo(x + 20 * k + off, y + 26 * k + off);
    ctx.stroke();
  }
  ctx.restore();
}
