

import { CANVAS } from './choreography.js';
import { buildAnimeFigure, drawAnime, KITS } from './anime.js';
import { drawSky, drawPlane, drawShafts, STAGE_WIDTH } from './stage.js';
import { FX as FX_COLOURS } from './palette.js';



export const STAGE_OFFSET_X = (STAGE_WIDTH - CANVAS.width) / 2;

export function renderFrame(ctx, stage, pose) {
  const { width, height } = CANVAS;
  const cam = pose.camera;
  const view = { camX: cam.x, camY: cam.y, zoom: cam.zoom, width, height, offsetX: STAGE_OFFSET_X };

  
  drawSky(ctx, width, height);

  
  
  
  
  
  
  
  
  drawPlane(ctx, stage, 'far', view);
  drawShafts(ctx, stage, view);
  drawPlane(ctx, stage, 'mid', view);
  drawPlane(ctx, stage, 'ground', view);

  
  const pair = [[pose.a, KITS.light], [pose.b, KITS.dark]].filter(([s]) => s);
  pair.sort((p, q) => (p[0].feet - p[0].top) - (q[0].feet - q[0].top));
  for (const [spec, kit] of pair) {
    const other = pair.find((p) => p[0] !== spec);
    const shapes = buildAnimeFigure({ ...spec, kit, lookAt: other ? other[0].cx : undefined });
    drawAnime(ctx, shapes, Math.max(0.8, (spec.feet - spec.top) / 90));
  }

  if (pose.fx) drawEffect(ctx, pose);

  
  drawPlane(ctx, stage, 'near', view);
}











function drawEffect(ctx, pose) {
  const a = pose.a; const b = pose.b;
  if (!a && !b) return;
  const ax = a ? a.cx : b.cx;
  const bx = b ? b.cx : a.cx;
  const x = (ax + bx) / 2;
  
  
  const mid = (s) => s.top + (s.feet - s.top) * 0.45;
  const y = a && b ? (mid(a) + mid(b)) / 2 : mid(a || b);
  const k = (a ? a.feet - a.top : 90) / 90;

  if (pose.fx === 'burst') {
    const r = 30 * k;

    
    ctx.save();
    ctx.strokeStyle = FX_COLOURS.speed;
    ctx.globalAlpha = 0.55;
    ctx.lineCap = 'butt';
    for (let i = 0; i < 14; i += 1) {
      const ang = (i / 14) * Math.PI * 2 + 0.31;
      const inner = r * (1.25 + (i % 3) * 0.22);
      const outer = inner + r * (1.1 + (i % 4) * 0.5);
      ctx.lineWidth = Math.max(0.8, (i % 3 === 0 ? 2.2 : 1.1) * k);
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(ang) * inner, y + Math.sin(ang) * inner);
      ctx.lineTo(x + Math.cos(ang) * outer, y + Math.sin(ang) * outer);
      ctx.stroke();
    }
    ctx.restore();

    
    ctx.save();
    ctx.strokeStyle = FX_COLOURS.ring;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = Math.max(1, 1.8 * k);
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.5, r * 1.02, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    
    const spikes = 12;
    ctx.fillStyle = FX_COLOURS.burst;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i += 1) {
      const ang = (i / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      const rad = i % 2 === 0 ? r * 1.32 : r * 0.46;
      const px = x + Math.cos(ang) * rad;
      const py = y + Math.sin(ang) * rad * 0.92;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 0.72);
    g.addColorStop(0, FX_COLOURS.burstCore);
    g.addColorStop(0.55, FX_COLOURS.burst);
    g.addColorStop(1, 'rgba(248, 244, 230, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  
  
  ctx.save();
  ctx.fillStyle = FX_COLOURS.slash;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(x - 36 * k, y - 28 * k);
  ctx.quadraticCurveTo(x + 8 * k, y - 2 * k, x + 32 * k, y + 32 * k);
  ctx.quadraticCurveTo(x + 2 * k, y + 6 * k, x - 32 * k, y - 19 * k);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = FX_COLOURS.speed;
  ctx.globalAlpha = 0.45;
  ctx.lineWidth = Math.max(0.8, 1.2 * k);
  for (let i = -2; i <= 2; i += 1) {
    const off = i * 7 * k;
    ctx.beginPath();
    ctx.moveTo(x - 44 * k + off, y - 30 * k + off);
    ctx.lineTo(x + 16 * k + off, y + 22 * k + off);
    ctx.stroke();
  }
  ctx.restore();
}
