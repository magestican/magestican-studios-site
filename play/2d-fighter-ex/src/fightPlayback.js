
















import { fight, FPS, GROUND, BODY_H } from './fightScript.js';
import { MOVE_ROT } from './moveManifest.js';

const TICK_MS = 1000 / FPS;

const lerp = (a, b, t) => a + (b - a) * t;


export function totalMs() {
  return fight().ticks.length * TICK_MS;
}


export function cursorAt(ms) {
  const total = fight().ticks.length;
  const raw = ms / TICK_MS;
  const wrapped = ((raw % total) + total) % total;
  const index = Math.floor(wrapped);
  return { index, into: wrapped - index, total };
}


export function sceneAt(ms) {
  const { index } = cursorAt(ms);
  const { marks } = fight();
  let cur = marks[0];
  for (const m of marks) if (m.at <= index) cur = m;
  return cur ? cur.name : '';
}

















const TRAIL_MAX = 7;          
const TRAIL_SPEED_ON = 1.1;   
const TRAIL_SPEED_FULL = 7.0; 










export function trailAt(ticks, index, side, rate) {
  const now = ticks[index] && ticks[index][side];
  if (!now) return [];

  const back = Math.max(1, Math.min(6, Math.round(1 / Math.max(0.12, rate))));
  const prev = ticks[(index - back + ticks.length) % ticks.length][side];
  if (!prev) return [];
  const speed = Math.hypot(now.x - prev.x, now.y - prev.y) / back;
  if (speed < TRAIL_SPEED_ON) return [];

  const strength = Math.min(1, (speed - TRAIL_SPEED_ON)
    / (TRAIL_SPEED_FULL - TRAIL_SPEED_ON));
  const count = Math.max(2, Math.round(TRAIL_MAX * strength));

  const out = [];
  for (let k = 1; k <= count; k += 1) {
    const at = index - k * back;
    if (at < 0) break;
    const s = ticks[at][side];
    if (!s) break;
    
    
    const fade = 1 - k / (count + 1);
    out.push({ ...s, alpha: 0.34 * strength * fade * fade });
  }
  return out;
}













const SCENE_ZOOM = {
  approach: 0.96,
  'feel-out': 1.0,
  'flurry-1': 1.06,
  jump: 0.94,
  'flurry-2': 1.08,
  standoff: 1.12,
  'slow-motion': 1.20,
  'flurry-3': 1.10,
  flight: 0.88,
  finale: 1.16,
};

const BLUR = 22;          

let camTrack = null;
function cameraTrack() {
  if (camTrack) return camTrack;
  const { ticks, marks } = fight();
  const raw = new Float64Array(ticks.length);
  let mi = 0;
  for (let i = 0; i < ticks.length; i += 1) {
    while (mi + 1 < marks.length && marks[mi + 1].at <= i) mi += 1;
    raw[i] = SCENE_ZOOM[marks[mi] ? marks[mi].name : ''] ?? 1;
  }
  
  for (let i = 0; i < ticks.length; i += 1) {
    if (ticks[i].shake) raw[i] = 1.34;
  }
  const out = new Float64Array(ticks.length);
  for (let i = 0; i < ticks.length; i += 1) {
    let sum = 0;
    let n = 0;
    for (let k = -BLUR; k <= BLUR; k += 1) {
      const j = i + k;
      if (j < 0 || j >= ticks.length) continue;
      sum += raw[j];
      n += 1;
    }
    out[i] = sum / n;
  }
  camTrack = out;
  return out;
}



function drawableOf(s, next, t, side, ticks, index, rate) {
  if (!s) return null;
  
  const x = next ? lerp(s.x, next.x, t) : s.x;
  const y = next ? lerp(s.y, next.y, t) : s.y;
  const rot = (MOVE_ROT[s.pose] || 0) * (s.facing < 0 ? -1 : 1);
  return {
    pose: s.pose,
    cx: x,
    
    
    feet: GROUND - y,
    top: GROUND - y - BODY_H,
    height: y,
    facing: s.facing,
    rot,
    ghosts: trailAt(ticks, index, side, rate).map((g) => ({
      pose: g.pose,
      cx: g.x,
      feet: GROUND - g.y,
      top: GROUND - g.y - BODY_H,
      facing: g.facing,
      rot: (MOVE_ROT[g.pose] || 0) * (g.facing < 0 ? -1 : 1),
      alpha: g.alpha,
    })),
  };
}


export function stateAt(ms) {
  const { ticks } = fight();
  const { index, into } = cursorAt(ms);
  const cur = ticks[index];
  const next = ticks[(index + 1) % ticks.length];
  const rate = cur.rate ?? 1;

  return {
    index,
    into,
    rate,
    scene: sceneAt(ms),
    
    
    
    
    camera: { zoom: cameraTrack()[index], x: 0, y: 0, closeup: false },
    a: drawableOf(cur.a, next && next.a, into, 'a', ticks, index, rate),
    b: drawableOf(cur.b, next && next.b, into, 'b', ticks, index, rate),
    
    hit: cur.hit || null,
    land: cur.land || null,
    charge: cur.charge || null,
    say: cur.say || null,
    shake: cur.shake || 0,
    
    
    fade: cur.fade || 0,
  };
}
