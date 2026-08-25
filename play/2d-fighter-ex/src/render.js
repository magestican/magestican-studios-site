

import { CANVAS } from './choreography.js';
import { buildAnimeFigure, drawAnime, KITS } from './anime.js';
import { drawStage, STAGE_WIDTH } from './stage.js';
import { FX as FX_COLOURS, BIOMES, STAGE_BIOME } from './palette.js';



export const STAGE_OFFSET_X = (STAGE_WIDTH - CANVAS.width) / 2;

export function renderFrame(ctx, cells, pose) {
  const { width, height } = CANVAS;
  const cam = pose.camera;

  ctx.fillStyle = BIOMES[STAGE_BIOME].wall;
  ctx.fillRect(0, 0, width, height);

  
  
  
  
  
  
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(cam.zoom, cam.zoom);
  ctx.translate(-width / 2, -height / 2);
  ctx.translate(-cam.x, -cam.y);
  ctx.translate(-STAGE_OFFSET_X, 0);
  drawStage(ctx, cells);
  ctx.restore();

  
  
  
  const pair = [[pose.a, KITS.light], [pose.b, KITS.dark]].filter(([s]) => s);
  pair.sort((p, q) => (p[0].feet - p[0].top) - (q[0].feet - q[0].top));
  for (const [spec, kit] of pair) {
    const other = pair.find((p) => p[0] !== spec);
    const shapes = buildAnimeFigure({ ...spec, kit, lookAt: other ? other[0].cx : undefined });
    drawAnime(ctx, shapes, Math.max(0.8, (spec.feet - spec.top) / 90));
  }

  if (pose.fx) drawEffect(ctx, pose);
}

function drawEffect(ctx, pose) {
  
  
  const a = pose.a; const b = pose.b;
  if (!a && !b) return;
  const ax = a ? a.cx : b.cx;
  const bx = b ? b.cx : a.cx;
  const x = (ax + bx) / 2;
  
  
  const mid = (s) => s.top + (s.feet - s.top) * 0.45;
  const y = a && b ? (mid(a) + mid(b)) / 2 : mid(a || b);
  const scale = ((a ? a.feet - a.top : 90) / 90);

  if (pose.fx === 'burst') {
    
    
    const r = 30 * scale;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, FX_COLOURS.burstCore);
    g.addColorStop(0.45, FX_COLOURS.burst);
    g.addColorStop(1, 'rgba(248, 244, 230, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.strokeStyle = FX_COLOURS.burstCore;
    ctx.lineWidth = Math.max(1, 1.6 * scale);
    for (let k = 0; k < 8; k += 1) {
      const ang = (k / 8) * Math.PI * 2 + 0.2;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(ang) * r * 0.5, y + Math.sin(ang) * r * 0.5);
      ctx.lineTo(x + Math.cos(ang) * r * 1.15, y + Math.sin(ang) * r * 1.15);
      ctx.stroke();
    }
    return;
  }

  
  ctx.fillStyle = FX_COLOURS.slash;
  ctx.beginPath();
  ctx.moveTo(x - 34 * scale, y - 26 * scale);
  ctx.quadraticCurveTo(x + 6 * scale, y, x + 30 * scale, y + 30 * scale);
  ctx.quadraticCurveTo(x + 2 * scale, y + 6 * scale, x - 30 * scale, y - 18 * scale);
  ctx.closePath();
  ctx.fill();
}
