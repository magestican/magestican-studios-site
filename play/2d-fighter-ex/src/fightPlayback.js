
















import { fight, FPS, GROUND, BODY_H } from './fightScript.js';
import { MOVE_ROT } from './moveManifest.js';
import { CANVAS } from './choreography.js';

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





















const HIT_HOLD = 10;        
const WORD_HOLD = 16;       














const WORD_GAP = 24;        
const WORD_POWER = 0.75;    

let wordTrack = null;
function words() {
  if (wordTrack) return wordTrack;
  const { ticks } = fight();
  const out = [];
  let last = -WORD_GAP;
  for (let i = 0; i < ticks.length; i += 1) {
    const h = ticks[i].hit;
    if (!h) continue;
    if ((h.power || 0) < WORD_POWER && !h.big) continue;
    
    
    
    if (i - last < (h.big ? WORD_HOLD : WORD_GAP)) continue;
    last = i;
    out.push({ at: i, x: h.x, power: h.power || 1, big: !!h.big });
  }
  wordTrack = out;
  return out;
}


function impactAt(index) {
  const { ticks } = fight();
  for (let k = 0; k < HIT_HOLD; k += 1) {
    const at = index - k;
    if (at < 0) break;
    const h = ticks[at].hit;
    if (h) return { ...h, age: k / HIT_HOLD, fresh: k === 0 };
  }
  return null;
}


function wordAt(index) {
  for (const w of words()) {
    if (index >= w.at && index - w.at < WORD_HOLD) {
      return { ...w, age: (index - w.at) / WORD_HOLD };
    }
  }
  return null;
}


export function wordTimes() {
  return words().map((w) => w.at);
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








































const JOURNEY = [
  [0.00, 0], [0.07, -240], [0.16, 170], [0.27, -330], [0.37, 70],
  [0.48, 360], [0.58, -60], [0.69, -350], [0.79, 210], [0.88, -150],
  [0.95, 60], [1.00, 0],
];







const FOLLOW = 0.012;






const EDGE = 54;

let travel = null;
function travelTrack() {
  if (travel) return travel;
  const { ticks } = fight();
  const n = ticks.length;
  const world = new Float64Array(n);
  const cam = new Float64Array(n);
  const off = new Float64Array(n);

  
  
  let w = 0;
  for (let i = 0; i < n; i += 1) {
    const f = n > 1 ? i / (n - 1) : 0;
    while (w + 1 < JOURNEY.length - 1 && JOURNEY[w + 1][0] <= f) w += 1;
    const [f0, x0] = JOURNEY[w];
    const [f1, x1] = JOURNEY[w + 1];
    const u = f1 > f0 ? Math.min(1, Math.max(0, (f - f0) / (f1 - f0))) : 0;
    world[i] = x0 + (x1 - x0) * (u * u * (3 - 2 * u));
  }

  let c = world[0];
  for (let i = 0; i < n; i += 1) {
    c += (world[i] - c) * FOLLOW;
    cam[i] = c;
    const want = world[i] - c;

    
    
    
    const xs = [];
    if (ticks[i].a) xs.push(ticks[i].a.x);
    if (ticks[i].b) xs.push(ticks[i].b.x);
    if (!xs.length) { off[i] = want; continue; }
    const lo = EDGE - Math.min(...xs);
    const hi = (CANVAS.width - EDGE) - Math.max(...xs);
    off[i] = lo > hi ? 0 : Math.min(hi, Math.max(lo, want));
  }

  
  
  
  
  
  const smooth = new Float64Array(n);
  const B = 16;
  for (let i = 0; i < n; i += 1) {
    let sum = 0;
    let k = 0;
    for (let j = i - B; j <= i + B; j += 1) {
      if (j < 0 || j >= n) continue;
      sum += off[j];
      k += 1;
    }
    smooth[i] = sum / k;
  }

  travel = { world, cam, off: smooth };
  return travel;
}


export function travelAt(index) {
  const t = travelTrack();
  const i = Math.min(Math.max(0, index), t.cam.length - 1);
  return { cam: t.cam[i], off: t.off[i], world: t.world[i] };
}



function drawableOf(s, next, t, side, ticks, index, rate, shift = 0) {
  if (!s) return null;
  
  const x = (next ? lerp(s.x, next.x, t) : s.x) + shift;
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
      cx: g.x + shift,
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
  const trip = travelAt(index);

  return {
    index,
    into,
    rate,
    scene: sceneAt(ms),
    
    
    
    
    camera: { zoom: cameraTrack()[index], x: trip.cam, y: 0, closeup: false },
    a: drawableOf(cur.a, next && next.a, into, 'a', ticks, index, rate, trip.off),
    b: drawableOf(cur.b, next && next.b, into, 'b', ticks, index, rate, trip.off),
    
    
    hit: impactAt(index),
    word: wordAt(index),
    land: cur.land || null,
    charge: cur.charge || null,
    say: cur.say || null,
    shake: cur.shake || 0,
    
    
    fade: cur.fade || 0,
  };
}
