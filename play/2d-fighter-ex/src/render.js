

import { CANVAS } from './choreography.js';
import { CELL, REF_BODY_PX, FEET_ROW, MOVE_INDEX, MOVE_ROT } from './moveManifest.js';
import { FPS } from './fightScript.js';

const TICK_MS = 1000 / FPS;
import {
  drawSky, drawPlane, drawShafts, drawTrain, drawFalling, drawShadow,
  STAGE_WIDTH, GROUND_Y, seasonOf,
} from './stage.js';
import {
  drawDust, drawCharge, drawClashExtras, drawWord, WORDS,
} from './fx.js';
import { drawBubble } from './dialogue.js';
import { FX } from './palette.js';


const MOOD_FILTERS = {
  dark: 'brightness(0.72) saturate(0.85)',
  juvenile: 'brightness(1.12) saturate(1.1)',
  angry: 'saturate(1.3) hue-rotate(-12deg) contrast(1.08)',
};

export const STAGE_OFFSET_X = (STAGE_WIDTH - CANVAS.width) / 2;
















export const SCENERY = Object.freeze([
  'sky', 'far', 'rail', 'train', 'shafts', 'mid', 'ground', 'near', 'weather',
]);




export const GROUND_FX = Object.freeze(['shadow', 'dust', 'charge']);
export const CHARACTERS = 'fighters';








export const OVERLAY = Object.freeze(['fx', 'word', 'speech']);
export const BEHIND = Object.freeze([...SCENERY, ...GROUND_FX]);
export const LAYERS = Object.freeze([...BEHIND, 'ghost', CHARACTERS, ...OVERLAY]);








export function renderFrame(ctx, stage, pose, mood = 'none', { onLayer, season = 'spring', timeMs = 0, fx = {} } = {}) {
  
  
  
  const layer = (name) => { if (onLayer) onLayer(name); };
  
  
  
  const on = (k) => fx[k] !== false;
  const { width, height } = CANVAS;
  const cam = pose.camera;
  const view = { camX: cam.x, camY: cam.y, zoom: cam.zoom, width, height, offsetX: STAGE_OFFSET_X };

  layer('sky');
  drawSky(ctx, width, height, season);
  layer('far');
  drawPlane(ctx, stage, 'far', view);
  
  
  layer('rail');
  drawPlane(ctx, stage, 'rail', view);
  layer('train');
  drawTrain(ctx, ((pose.index || 0) % 900) / 900, view);
  layer('shafts');
  drawShafts(ctx, stage, view, season);
  layer('mid');
  drawPlane(ctx, stage, 'mid', view);
  layer('ground');
  drawPlane(ctx, stage, 'ground', view);
  
  
  
  layer('near');
  drawPlane(ctx, stage, 'near', view);

  
  layer('weather');
  if (on('weather')) drawFalling(ctx, season, timeMs, { width, height, camX: cam.x, camY: cam.y });

  
  
  
  layer('shadow');
  
  
  
  
  
  
  
  
  
  
  
  
  if (on('shadow')) {
    for (const [spec, who] of [[pose.a, 'light'], [pose.b, 'dark']]) {
      
      
      
      if (spec) drawShadow(ctx, spec, GROUND_Y, FX.shadow);
    }
  }

  
  
  
  layer('dust');
  if (pose.land && on('impact')) {
    drawDust(ctx, { x: pose.land.x, y: GROUND_Y, frame: pose.index }, 0.12);
  }

  
  layer('charge');
  
  
  
  const charge = on('impact') && pose.charge
    ? { t: pose.charge.level, frames: 1 } : null;
  if (charge) {
    const phase = timeMs / 1000;
    for (const spec of [pose.a, pose.b]) drawCharge(ctx, spec, charge.t, phase);
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const drawSprite = (spec, atlas, alpha) => {
    if (!atlas || !spec) return;
    
    
    
    
    const cellPos = MOVE_INDEX[spec.pose];
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
    
    
    
    
    const rot = spec.rot || MOVE_ROT[spec.pose] || 0;
    if (rot) {
      ctx.translate(0, -FEET_ROW * scale * 0.5);
      ctx.rotate((Math.abs(rot) * Math.PI) / 180 * Math.sign(rot));
      ctx.translate(0, FEET_ROW * scale * 0.5);
    }
    ctx.drawImage(atlas, cellPos[0], cellPos[1], CELL, CELL,
      -size / 2, -FEET_ROW * scale, size, size);
    ctx.restore();
  };

  const sprites = pose.sprites || {};

  
  
  
  
  
  
  
  
  
  
  
  layer('ghost');
  for (const [spec, atlas] of [[pose.a, sprites.light], [pose.b, sprites.dark]]) {
    if (!spec || !spec.ghosts) continue;
    
    for (let k = spec.ghosts.length - 1; k >= 0; k -= 1) {
      drawSprite(spec.ghosts[k], atlas, spec.ghosts[k].alpha);
    }
  }

  layer('fighters');
  
  const pair = [
    [pose.a, sprites.light, 0],
    [pose.b, sprites.dark, 1],
  ].filter(([s]) => s);
  pair.sort((p, q) => {
    const dh = (p[0].feet - p[0].top) - (q[0].feet - q[0].top);
    return Math.abs(dh) > 0.5 ? dh : p[2] - q[2];
  });
  for (const [spec, atlas] of pair) {
    drawSprite(spec, atlas);
  }

  
  layer('fx');
  if (pose.hit && on('impact')) {
    ctx.save();
    ctx.globalAlpha = (1 - pose.hit.age) ** 1.6;
    drawEffect(ctx, pose);
    ctx.restore();
    
    
    
    
    
    
    
    
    
    
    const mid = [pose.hit.x, (pose.a ? pose.a.top : height / 2) + 34];
    const decay = (1 - pose.hit.age) ** 1.6;
    ctx.save();
    ctx.globalAlpha = decay;
    drawClashExtras(ctx, mid[0], mid[1],
      Math.min(1.6, (pose.hit.power || 1) * (0.5 + 0.5 * decay)), timeMs / 400);
    ctx.restore();
  }

  
  
  
  layer('word');
  if (on('words') && (pose.word || (charge && charge.t > 0.25))) {
    
    
    
    
    const pair = [pose.a, pose.b].filter(Boolean);
    if (pair.length) {
      const mx = pair.reduce((t, p) => t + p.cx, 0) / pair.length;
      const top = Math.min(...pair.map((p) => p.top));
      if (pose.word) {
        
        
        
        
        
        
        
        
        const a = pose.word.age;
        const pop = a < 0.2 ? 0.6 + 0.4 * (a / 0.2) : 1;
        const fade = a > 0.8 ? (1 - a) / 0.2 : 1;
        ctx.save();
        ctx.globalAlpha = fade;
        drawWord(ctx, WORDS.impact, pose.word.x + 20, top - 12,
          24 * pop * (pose.word.big ? 1.5 : 1),
          { fill: FX.wordFill, line: FX.wordInk, tilt: -0.16 });
        ctx.restore();
      } else {
        drawWord(ctx, WORDS.charge, mx - 46, top - 20, 17,
          { fill: FX.wordFill, line: FX.wordInk, tilt: -0.08 });
      }
    }
  }

  
  
  
  layer('speech');
  if (pose.say) {
    const speaker = pose.say.who === 'a' ? pose.a : pose.b;
    drawBubble(ctx, speaker, pose.say);
  }

  
  
  
  if (pose.fade > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, pose.fade);
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }
}







function drawEffect(ctx, pose) {
  const a = pose.a; const b = pose.b;
  if (!a && !b) return;
  const x = ((a ? a.cx : b.cx) + (b ? b.cx : a.cx)) / 2;
  const mid = (s) => s.top + (s.feet - s.top) * 0.44;
  const y = a && b ? (mid(a) + mid(b)) / 2 : mid(a || b);
  const k = (a ? a.feet - a.top : 90) / 90;

  if (pose.hit && pose.hit.big) {
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
