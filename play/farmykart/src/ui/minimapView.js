


















































import {
  createProjection, projectPath, project, minimapSize,
  projectRoadEdges, projectBranchEdges, projectHazardBands,
} from 'arbelo/minimap';
import { SeededRng } from 'arbelo/rng';
import { PALETTE, hex } from '../palette.js';

const INK = hex(PALETTE.night);
const PAPER = hex(PALETTE.ceiling);


function mix(a, b, t, alpha = 1) {
  const ch = (shift) => {
    const x = (a >> shift) & 0xff;
    const y = (b >> shift) & 0xff;
    return Math.round(x + (y - x) * t);
  };
  return `rgba(${ch(16)}, ${ch(8)}, ${ch(0)}, ${alpha})`;
}

















const THEME = {
  summer: { ground: PALETTE.grass, tuft: PALETTE.grassDark },
  mud: { ground: PALETTE.mudDark, tuft: PALETTE.hedgeMud },
  snow: { ground: PALETTE.snowHollow, tuft: PALETTE.ice },
};


const HAZARD_PAINT = {
  water: { fill: PALETTE.water, lip: PALETTE.snowHollow },
  lava: { fill: PALETTE.lava, lip: PALETTE.lavaHot },
  fire: { fill: PALETTE.barnRed, lip: PALETTE.gold },
};


function hashOf(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function strokePolyline(ctx, pts, { close = false } = {}) {
  if (!pts.length) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
  if (close) ctx.closePath();
  ctx.stroke();
}








function ribbonPath(ctx, a, b, { close = false } = {}) {
  ctx.beginPath();
  ctx.moveTo(a[0].x, a[0].y);
  for (let i = 1; i < a.length; i += 1) ctx.lineTo(a[i].x, a[i].y);
  if (close) ctx.lineTo(b[b.length - 1].x, b[b.length - 1].y);
  for (let i = b.length - 1; i >= 0; i -= 1) ctx.lineTo(b[i].x, b[i].y);
  ctx.closePath();
}


function frame(ctx, size, r) {
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.lineTo(size - r, 0);
  ctx.quadraticCurveTo(size, 0, size, r);
  ctx.lineTo(size, size - r);
  ctx.quadraticCurveTo(size, size, size - r, size);
  ctx.lineTo(r, size);
  ctx.quadraticCurveTo(0, size, 0, size - r);
  ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0);
  ctx.closePath();
}








export function createMinimap(canvas, path, track = null, { size: forced = 0 } = {}) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const size = forced || minimapSize(window.innerWidth, window.innerHeight);
  canvas.style.width = `${size}px`;
  canvas.style.height = `${size}px`;
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  
  
  const proj = createProjection(path.bounds, { w: size, h: size, pad: 14 });

  
  const base = document.createElement('canvas');
  base.width = size * dpr;
  base.height = size * dpr;
  const b = base.getContext('2d');
  b.scale(dpr, dpr);
  drawTerrain(b, size, proj, path, track);

  
  
  
  
  
  
  
  
  
  
  const card = canvas.parentElement;
  const label = card ? card.querySelector('#minimap-name') : null;
  if (label && track && track.name) {
    label.textContent = track.name;
    label.style.width = `${size}px`;
    
    
    
    
    
    
    
    
    
    
    
    
    const px = Math.max(7.5, Math.min(11, size * 0.085));
    label.style.fontSize = `${px.toFixed(2)}px`;
    label.style.letterSpacing = `${(px < 9 ? 0.04 : 0.1).toFixed(2)}em`;
  }

  return { canvas, ctx, base, proj, size, dpr, theme: (track && track.theme) || 'summer' };
}







function drawTerrain(ctx, size, proj, path, track) {
  const theme = THEME[track && track.theme] ?? THEME.summer;
  ctx.save();
  frame(ctx, size, 6);
  ctx.clip();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  
  
  
  const g = ctx.createLinearGradient(0, 0, size * 0.6, size);
  g.addColorStop(0, mix(theme.ground, PALETTE.ceiling, 0.74));
  g.addColorStop(1, mix(theme.ground, PALETTE.ceiling, 0.52));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);

  
  
  
  
  
  const rng = new SeededRng(hashOf((track && track.id) || 'sunflower'));
  ctx.fillStyle = mix(theme.tuft, PALETTE.ceiling, 0.45);
  ctx.globalAlpha = 0.32;
  for (let i = 0; i < Math.round(size * 1.4); i += 1) {
    const x = rng.next() * size;
    const y = rng.next() * size;
    ctx.fillRect(x, y, 1 + rng.next() * 1.6, 1);
  }
  ctx.globalAlpha = 1;

  
  
  
  
  
  
  
  for (const zone of path.hazards ?? []) {
    const paint = HAZARD_PAINT[zone.kind];
    if (!paint) continue;
    const bands = projectHazardBands(proj, path, zone, { step: 1 });
    
    
    
    
    
    if (zone.kind === 'fire') {
      for (const band of bands) {
        if (band.inner.length < 2) continue;
        
        
        
        
        
        
        
        ctx.save();
        ctx.setLineDash([2.5, 2.5]);
        ctx.lineWidth = 1.8;
        ctx.strokeStyle = hex(PALETTE.barnRed);
        strokePolyline(ctx, band.inner);
        ctx.restore();
      }
      continue;
    }
    for (const band of bands) {
      if (band.inner.length < 2) continue;
      ribbonPath(ctx, band.inner, band.outer, { close: true });
      if (band.deep) {
        
        
        
        const mid = Math.floor(band.inner.length / 2);
        const grad = ctx.createLinearGradient(
          band.inner[mid].x, band.inner[mid].y, band.outer[mid].x, band.outer[mid].y,
        );
        grad.addColorStop(0, mix(paint.fill, PALETTE.night, 0.42));
        grad.addColorStop(0.45, mix(paint.fill, PALETTE.night, 0.05));
        grad.addColorStop(1, mix(paint.fill, PALETTE.ceiling, 0.18));
        ctx.fillStyle = grad;
      } else {
        ctx.fillStyle = mix(paint.fill, PALETTE.ceiling, 0.26);
      }
      ctx.fill();

      if (band.deep) {
        
        
        
        
        
        
        
        
        
        
        ctx.strokeStyle = INK;
        ctx.lineWidth = 1.3;
        strokePolyline(ctx, band.inner);
        ctx.lineWidth = 1;
        ctx.strokeStyle = 'rgba(28,26,23,0.70)';
        for (let i = 1; i < band.inner.length - 1; i += 4) {
          const q = band.inner[i];
          const o = band.outer[i];
          const dx = o.x - q.x;
          const dy = o.y - q.y;
          const len = Math.hypot(dx, dy) || 1;
          
          
          const t = Math.min(4.6, len * 0.34);
          ctx.beginPath();
          ctx.moveTo(q.x, q.y);
          ctx.lineTo(q.x + (dx / len) * t, q.y + (dy / len) * t);
          ctx.stroke();
        }
      } else {
        ctx.strokeStyle = mix(paint.fill, PALETTE.night, 0.35);
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  for (const t of (track && track.terrain) || []) {
    if (t.kind !== 'volcano') continue;
    const c = project(proj, t.x, t.z);
    const rOut = t.radius * proj.scale;
    const rIn = Math.max(2.5, (t.craterRadius ?? t.radius * 0.4) * proj.scale * 0.72);
    
    
    
    
    
    
    const wash = ctx.createRadialGradient(c.x, c.y, rOut * 0.12, c.x, c.y, rOut);
    wash.addColorStop(0, mix(PALETTE.rockLip, PALETTE.ceiling, 0.24));
    wash.addColorStop(0.55, mix(PALETTE.rock, PALETTE.ceiling, 0.04));
    wash.addColorStop(0.86, mix(PALETTE.rock, PALETTE.ceiling, 0.10, 0.72));
    wash.addColorStop(1, mix(PALETTE.rock, PALETTE.ceiling, 0.20, 0));
    ctx.fillStyle = wash;
    ctx.beginPath();
    ctx.arc(c.x, c.y, rOut, 0, Math.PI * 2);
    ctx.fill();
    
    
    const shade = ctx.createLinearGradient(
      c.x - rOut * 0.75, c.y - rOut * 0.75, c.x + rOut * 0.75, c.y + rOut * 0.75,
    );
    shade.addColorStop(0, 'rgba(255,255,255,0.34)');
    shade.addColorStop(0.5, 'rgba(255,255,255,0)');
    shade.addColorStop(1, 'rgba(28,26,23,0.30)');
    ctx.save();
    ctx.beginPath();
    ctx.arc(c.x, c.y, rOut * 0.97, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = shade;
    ctx.fillRect(c.x - rOut, c.y - rOut, rOut * 2, rOut * 2);
    ctx.restore();
    
    
    const RIDGE = [0.15, 0.95, 1.7, 2.55, 3.5, 4.35, 5.4];
    for (let i = 0; i < RIDGE.length; i += 1) {
      const a2 = RIDGE[i];
      const ca = Math.cos(a2);
      const sa = Math.sin(a2);
      ctx.strokeStyle = ca + sa < 0 ? 'rgba(28,26,23,0.14)' : 'rgba(28,26,23,0.30)';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.moveTo(c.x + ca * rIn * 1.25, c.y + sa * rIn * 1.25);
      ctx.lineTo(c.x + ca * rOut * (i % 2 ? 0.86 : 0.95), c.y + sa * rOut * (i % 2 ? 0.86 : 0.95));
      ctx.stroke();
    }
    
    
    ctx.beginPath();
    ctx.arc(c.x, c.y, rIn, 0, Math.PI * 2);
    ctx.fillStyle = mix(PALETTE.lava, PALETTE.lavaHot, 0.30);
    ctx.fill();
    ctx.lineWidth = Math.max(1.4, rIn * 0.34);
    ctx.strokeStyle = mix(PALETTE.lavaCrust, PALETTE.night, 0.30);
    ctx.stroke();
  }

  
  
  
  
  
  
  
  
  
  
  
  for (const br of path.branches ?? []) {
    const e = projectBranchEdges(proj, br, { step: 1 });
    if (e.left.length < 2) continue;
    ribbonPath(ctx, e.left, e.right, { close: true });
    ctx.fillStyle = mix(PALETTE.shortcut, PALETTE.ceiling, 0.12);
    ctx.fill();
    ctx.save();
    ctx.setLineDash([3.5, 2.5]);
    ctx.strokeStyle = 'rgba(28,26,23,0.80)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();
    
    for (const k of [0, e.left.length - 1]) {
      ctx.beginPath();
      ctx.moveTo(e.left[k].x, e.left[k].y);
      ctx.lineTo(e.right[k].x, e.right[k].y);
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = hex(PALETTE.gatePost);
      ctx.stroke();
      ctx.lineWidth = 0.9;
      ctx.strokeStyle = INK;
      ctx.stroke();
    }
  }

  
  
  
  const edges = projectRoadEdges(proj, path, { step: 1 });
  ribbonPath(ctx, edges.left, edges.right);
  ctx.fillStyle = mix(PALETTE.road, PALETTE.ceiling, 0.08);
  ctx.fill('evenodd');
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  strokePolyline(ctx, edges.left, { close: true });
  strokePolyline(ctx, edges.right, { close: true });

  const centre = projectPath(proj, path, { step: 1 });
  ctx.save();
  ctx.setLineDash([3, 4]);
  ctx.strokeStyle = mix(PALETTE.roadLight, PALETTE.ceiling, 0.34);
  ctx.lineWidth = 1;
  strokePolyline(ctx, centre, { close: true });
  ctx.restore();

  
  
  
  
  const p0 = path.pts[0];
  const t0 = path.tangents[0];
  const half = ((p0.width ?? 16) / 2) * 1.04;
  const a = project(proj, p0.x + t0.z * half, p0.z - t0.x * half);
  const c2 = project(proj, p0.x - t0.z * half, p0.z + t0.x * half);
  const span = Math.hypot(c2.x - a.x, c2.y - a.y) || 1;
  const ux = (c2.x - a.x) / span;
  const uy = (c2.y - a.y) / span;
  const cells = Math.max(4, Math.round(span / 2.6));
  const cell = span / cells;
  
  
  const tx = -uy;
  const ty = ux;
  const thick = Math.max(2.4, cell * 1.1);
  for (let i = 0; i < cells; i += 1) {
    ctx.fillStyle = i % 2 ? INK : PAPER;
    const x0 = a.x + ux * cell * i;
    const y0 = a.y + uy * cell * i;
    ctx.beginPath();
    ctx.moveTo(x0 - tx * thick * 0.5, y0 - ty * thick * 0.5);
    ctx.lineTo(x0 + ux * cell - tx * thick * 0.5, y0 + uy * cell - ty * thick * 0.5);
    ctx.lineTo(x0 + ux * cell + tx * thick * 0.5, y0 + uy * cell + ty * thick * 0.5);
    ctx.lineTo(x0 + tx * thick * 0.5, y0 + ty * thick * 0.5);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = INK;
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.moveTo(a.x - tx * thick * 0.5, a.y - ty * thick * 0.5);
  ctx.lineTo(c2.x - tx * thick * 0.5, c2.y - ty * thick * 0.5);
  ctx.moveTo(a.x + tx * thick * 0.5, a.y + ty * thick * 0.5);
  ctx.lineTo(c2.x + tx * thick * 0.5, c2.y + ty * thick * 0.5);
  ctx.stroke();

  
  
  
  
  const v = ctx.createRadialGradient(
    size / 2, size / 2, size * 0.34, size / 2, size / 2, size * 0.75,
  );
  v.addColorStop(0, 'rgba(28,26,23,0)');
  v.addColorStop(1, 'rgba(28,26,23,0.20)');
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, size, size);
  ctx.restore();

  
  ctx.strokeStyle = 'rgba(28,26,23,0.55)';
  ctx.lineWidth = 1.2;
  frame(ctx, size, 6);
  ctx.stroke();
}









export function drawMinimap(mm, blips, hazards = []) {
  const { ctx, size } = mm;
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(mm.base, 0, 0, size, size);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  
  
  
  for (const h of hazards) {
    const p = project(mm.proj, h.x, h.z);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 3.4);
    ctx.lineTo(p.x + 3.4, p.y);
    ctx.lineTo(p.x, p.y + 3.4);
    ctx.lineTo(p.x - 3.4, p.y);
    ctx.closePath();
    ctx.fillStyle = hex(PALETTE.barnRed);
    ctx.fill();
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  const unit = mm.size / 150;
  const botR = Math.max(5.4, Math.min(8.4, 7.2 * unit));
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const b of blips) {
    const r = b.isPlayer ? botR * 1.2 : botR;

    
    
    
    ctx.beginPath();
    ctx.arc(b.x + 0.5 * unit, b.y + 1.3 * unit, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(28,26,23,0.26)';
    ctx.fill();

    if (b.isPlayer) {
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const halo = ctx.createRadialGradient(b.x, b.y, r * 0.75, b.x, b.y, r * 2.3);
      halo.addColorStop(0, 'rgba(244,201,93,0.95)');
      halo.addColorStop(0.6, 'rgba(244,201,93,0.45)');
      halo.addColorStop(1, 'rgba(244,201,93,0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r * 2.3, 0, Math.PI * 2);
      ctx.fill();

      const ang = b.dir ? Math.atan2(b.dir.y, b.dir.x) : -Math.PI / 2;
      
      
      
      ctx.beginPath();
      ctx.moveTo(b.x + Math.cos(ang) * r * 1.95, b.y + Math.sin(ang) * r * 1.95);
      ctx.arc(b.x, b.y, r, ang - 1.01, ang + 1.01, true);
      ctx.closePath();
      ctx.fillStyle = hex(b.tint ?? PALETTE.ceiling);
      ctx.fill();
      ctx.lineWidth = Math.max(1.8, 2.4 * unit);
      ctx.strokeStyle = INK;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fillStyle = hex(b.tint ?? PALETTE.ceiling);
      ctx.fill();
      ctx.lineWidth = Math.max(1.2, 1.5 * unit);
      ctx.strokeStyle = 'rgba(28,26,23,0.75)';
      ctx.stroke();
    }

    if (b.position != null) {
      
      
      
      
      ctx.font = `700 ${(r * (b.isPlayer ? 1.34 : 1.39)).toFixed(1)}px ui-monospace, monospace`;
      ctx.fillStyle = INK;
      ctx.fillText(String(b.position), b.x, b.y + 0.5);
    }
  }
}


export function resizeMinimap(mm, path, track = null) {
  return createMinimap(mm.canvas, path, track);
}
