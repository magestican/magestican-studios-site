








import { createProjection, project, projectRacers } from '../../../web-engine/kart/minimap.js';
import { SIM_SCALE } from '../../../web-engine/rc/rcTuning.js';
import { PHASE } from '../../../web-engine/rc/worldEvents.js';
import { trackPoint } from './race.js';

const LIFTED = 0.05; 


export function minimapModel(track, size) {
  const { path } = track;
  const proj = createProjection(path.bounds, { w: size, h: size, pad: Math.max(6, size * 0.08) });
  const runs = [];
  let cur = null;
  const step = Math.max(1, Math.floor(path.count / 160));
  for (let i = 0; i <= path.count; i += step) {
    const p = path.pts[i % path.count];
    const lifted = (p.roadY ?? p.y ?? 0) / SIM_SCALE > LIFTED;
    const pt = project(proj, p.x, p.z);
    if (!cur || cur.lifted !== lifted) {
      if (cur) cur.pts.push(pt); 
      cur = { lifted, pts: [] };
      runs.push(cur);
    }
    cur.pts.push(pt);
  }
  const start = path.pts[0] && project(proj, ...xz(track, track.startS));
  return { proj, runs, start, size };
}

function xz(track, s) {
  
  const { path } = track;
  let i = 0;
  while (i < path.count - 1 && path.s[i + 1] <= s) i += 1;
  return [path.pts[i].x, path.pts[i].z];
}


export function minimapBlips(model, race, playerId, tints) {
  return projectRacers(model.proj, race.racers.map((r, i) => ({
    id: r.id, x: r.kart.x, z: r.kart.z, heading: r.kart.heading, tint: tints[i % tints.length],
  })), playerId);
}


export function wetRuns(model, race) {
  const out = [];
  for (const e of race.world.list) {
    if (e.phase !== PHASE.ON) continue;
    const pts = [];
    const n = Math.max(2, Math.ceil(e.span / 0.5));
    for (let k = 0; k <= n; k += 1) {
      const p = trackPoint(race.track, e.s0 + (e.span * k) / n, e.side ?? 0);
      pts.push(project(model.proj, p.x * SIM_SCALE, p.z * SIM_SCALE));
    }
    out.push(pts);
  }
  return out;
}

const hex = (c) => `#${c.toString(16).padStart(6, '0')}`;


export function drawMinimap(ctx, model, race, playerId, tints, wet = []) {
  const { size } = model;
  ctx.clearRect(0, 0, size, size);
  const lw = Math.max(3, size * 0.045);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  for (const r of model.runs) line(ctx, r.pts, '#2a1d14', lw + 3);
  for (const r of model.runs) line(ctx, r.pts, r.lifted ? '#ff8a1f' : '#fff4dd', lw);
  for (const w of wet) line(ctx, w, 'rgba(95,184,255,0.95)', lw);
  if (model.start) {
    ctx.fillStyle = '#2a1d14';
    ctx.fillRect(model.start.x - lw, model.start.y - lw, lw * 2, lw * 2);
  }
  for (const b of minimapBlips(model, race, playerId, tints)) {
    if (b.isPlayer) {
      const d = b.dir ?? { x: 0, y: -1 };
      const len = Math.hypot(d.x, d.y) || 1;
      const ux = d.x / len; const uy = d.y / len;
      const r = size * 0.07;
      ctx.beginPath();
      ctx.moveTo(b.x + ux * r, b.y + uy * r);
      ctx.lineTo(b.x - ux * r * 0.7 - uy * r * 0.7, b.y - uy * r * 0.7 + ux * r * 0.7);
      ctx.lineTo(b.x - ux * r * 0.7 + uy * r * 0.7, b.y - uy * r * 0.7 - ux * r * 0.7);
      ctx.closePath();
      ctx.fillStyle = hex(b.tint);
      ctx.strokeStyle = '#2a1d14';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(b.x, b.y, Math.max(2.5, size * 0.03), 0, Math.PI * 2);
      ctx.fillStyle = hex(b.tint);
      ctx.strokeStyle = '#2a1d14';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
    }
  }
}

function line(ctx, pts, colour, width) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.strokeStyle = colour;
  ctx.lineWidth = width;
  ctx.stroke();
}
