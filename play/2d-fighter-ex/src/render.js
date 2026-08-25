

import { CANVAS } from './choreography.js';
import { buildFigure, drawFigure } from './fighter.js';
import { drawStage, STAGE_WIDTH } from './stage.js';
import { FIGHTERS, FX as FX_COLOURS, BIOMES, STAGE_BIOME } from './palette.js';



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

  for (const [spec, kit] of [[pose.a, FIGHTERS.light], [pose.b, FIGHTERS.dark]]) {
    if (!spec) continue;
    drawFigure(ctx, buildFigure({ ...spec, kit }));
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

  if (pose.fx === 'burst') {
    
    const steps = [[46, FX_COLOURS.burst], [28, FX_COLOURS.burstCore]];
    for (const [size, fill] of steps) {
      ctx.fillStyle = fill;
      ctx.fillRect(x - size / 2, y - size / 2, size, size);
    }
    return;
  }

  
  ctx.fillStyle = FX_COLOURS.slash;
  for (let k = 0; k < 7; k += 1) {
    ctx.fillRect(x - 30 + k * 9, y - 24 + k * 7, 9, 9);
  }
}
