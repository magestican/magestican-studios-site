
















import { createProjection, projectPath, project, minimapSize } from 'arbelo/minimap';
import { PALETTE, hex } from '../palette.js';

export function createMinimap(canvas, path) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const size = minimapSize(window.innerWidth, window.innerHeight);
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const proj = createProjection(path.bounds, { w: size, h: size, pad: 12 });

  
  const base = document.createElement('canvas');
  base.width = size * dpr;
  base.height = size * dpr;
  const bctx = base.getContext('2d');
  bctx.scale(dpr, dpr);
  const pts = projectPath(proj, path, { step: 1 });

  
  
  
  bctx.lineJoin = 'round';
  bctx.lineCap = 'round';
  bctx.strokeStyle = 'rgba(28,26,23,0.85)';
  bctx.lineWidth = 7;
  strokePolyline(bctx, pts);
  bctx.strokeStyle = hex(PALETTE.roadLight);
  bctx.lineWidth = 4;
  strokePolyline(bctx, pts);

  
  
  const start = project(proj, path.pts[0].x, path.pts[0].z);
  bctx.strokeStyle = hex(PALETTE.ceiling);
  bctx.lineWidth = 2.5;
  bctx.beginPath();
  bctx.moveTo(start.x - 4, start.y - 4);
  bctx.lineTo(start.x + 4, start.y + 4);
  bctx.stroke();

  return { canvas, ctx, base, proj, size, dpr };
}

function strokePolyline(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.closePath();
  ctx.stroke();
}









export function drawMinimap(mm, blips, hazards = []) {
  const { ctx, size } = mm;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(mm.base, 0, 0, size, size);

  for (const h of hazards) {
    const p = project(mm.proj, h.x, h.z);
    ctx.fillStyle = 'rgba(183,58,42,0.8)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const b of blips) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.isPlayer ? 5 : 3.4, 0, Math.PI * 2);
    ctx.fillStyle = hex(b.tint ?? PALETTE.ceiling);
    ctx.fill();
    
    
    
    ctx.lineWidth = b.isPlayer ? 2 : 1;
    ctx.strokeStyle = b.isPlayer ? hex(PALETTE.night) : 'rgba(28,26,23,0.55)';
    ctx.stroke();
  }
}


export function resizeMinimap(mm, path) {
  return createMinimap(mm.canvas, path);
}
