



import { CELL_HP, C_BEAD, C_CATH, C_EMPTY, C_GLASS, C_IRON, C_LEAD, C_MIRROR, C_SUN, FIELD_H, FIELD_W, PH_CLEAR,
  PH_DONE, PH_FAIL } from './sim/sim.js';
import { WINDOWS, ACTS } from './sim/windows.js';
import { X_MAX, pack } from './sim/input.js';


export const TINT_NAMES = ['Rose', 'Moss', 'Cobalt'];
export const TINT_HEX = [0xff4f7b, 0x5fd36a, 0x3f8cff];
export const TINT_CSS = ['#ff4f7b', '#5fd36a', '#3f8cff'];

export const tintRgb = (i) => {
  const h = TINT_HEX[i] ?? 0xffc860;
  return [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
};


export function emberRgb(tint, heat) {
  const [r, g, b] = tintRgb(tint);
  const w = Math.min(1, Math.max(0, heat) / 4) * 0.75;
  return [r + (1 - r) * w, g + (1 - g) * w, b + (1 - b) * w];
}




export function crackStage(t, hp) {
  if (t === C_EMPTY || t === C_IRON) return 0;
  const max = CELL_HP[t] || 1;
  if (max <= 1 || hp >= max) return 0;
  const lost = (max - hp) / max; 
  return lost >= 0.66 ? 3 : lost >= 0.33 ? 2 : 1;
}


export const CELL_KIND = { [C_GLASS]: 1, [C_CATH]: 2, [C_LEAD]: 3, [C_IRON]: 4, [C_MIRROR]: 5, [C_SUN]: 6, [C_BEAD]: 7 };







export class EventFeed {
  constructor(keep = 240) { this.seen = new Map(); this.keep = keep; }
  take(s) {
    const out = [];
    for (const e of s.ev) {
      
      if (e.t < s.tick - this.keep) continue;
      const key = `${e.k}|${e.t}|${e.x}|${e.y}|${e.a}`;
      if (this.seen.has(key)) continue;
      this.seen.set(key, e.t);
      out.push(e);
    }
    for (const [k, t] of this.seen) if (t < s.tick - this.keep) this.seen.delete(k);
    return out;
  }
  reset() { this.seen.clear(); }
}


export const FEEL = {
  sun:       { stop: 5, shake: 10 },
  bossdown:  { stop: 18, shake: 26 },
  guardbreak:{ stop: 3, shake: 6 },
  bosshit:   { stop: 2, shake: 5 },
  bossland:  { stop: 6, shake: 20 }, 
  echobreak: { stop: 8, shake: 14 },
  breach:    { stop: 10, shake: 22 },
  ring:      { stop: 0, shake: 9 },
  lost:      { stop: 0, shake: 7 },
  break:     { stop: 0, shake: 1.5 },
};

export function feelFor(events) {
  let stop = 0, shake = 0;
  for (const e of events) {
    const f = FEEL[e.k];
    if (!f) continue;
    stop = Math.max(stop, f.stop);
    shake += f.shake;
  }
  return { stop, shake: Math.min(shake, 30) };
}



export function fitField(w, h, top = 0, bottom = 0) {
  
  
  
  const room = Math.max(1, h - top - bottom);
  const scale = Math.min(w / FIELD_W, room / FIELD_H);
  const fw = Math.floor(FIELD_W * scale), fh = Math.floor(FIELD_H * scale);
  return { scale, w: fw, h: fh, x: Math.floor((w - fw) / 2), y: top + Math.floor((room - fh) / 2), top, bottom };
}


export const HUD_BAND = 100;







export function tintBar(fs) {
  const gap = Math.max(12, Math.round(12 * fs));
  const size = Math.max(44, Math.round(44 * fs));
  const pad = Math.max(6, Math.round(6 * fs));
  const below = Math.max(12, Math.round(12 * fs));
  const border = 1; 
  return { gap, size, pad, border, below, band: gap + size + 2 * pad + 2 * border + below };
}

export const TINT_BAND = tintBar(1).band;
export function fitWithHud(w, h) {
  const fsOf = (f) => Math.max(0.8, Math.min(1.6, f.w / 390));
  let f = fitField(w, h, HUD_BAND, TINT_BAND);
  let fs = fsOf(f);
  f = fitField(w, h, Math.round(HUD_BAND * fs), tintBar(fs).band);
  
  fs = fsOf(f);
  f = fitField(w, h, Math.round(HUD_BAND * fs), tintBar(fs).band);
  return { ...f, fs };
}


export const KEY_SPEED = 14; 


export const DRAG_GAIN = 1.4;






export class Controls {
  constructor() {
    this.x = FIELD_W / 2;
    this.tint = 0;
    this.keys = new Set();
    this.launchT = 0;   
    this.nextT = 0;
    this.pointerDown = false;
    this.drag = null;   
  }
  key(code, down) {
    if (down) {
      if (!this.keys.has(code)) {
        if (code === 'KeyQ') this.cycle(-1);
        if (code === 'KeyE') this.cycle(1);
        if (code === 'Space') this.launchT = 6;
      }
      this.keys.add(code);
    } else this.keys.delete(code);
  }
  cycle(d) { this.tint = (this.tint + d + 3) % 3; }
  setTint(i) { this.tint = ((i % 3) + 3) % 3; }
  
  pointer(fx) { this.x = Math.max(0, Math.min(FIELD_W, fx)); }
  




  dragStart(fx) { this.drag = { fx, x: this.x }; }
  dragTo(fx) {
    if (!this.drag) return;
    const want = this.drag.x + (fx - this.drag.fx) * DRAG_GAIN;
    this.pointer(want);
    
    if (want !== this.x) this.drag = { fx, x: this.x };
  }
  dragEnd() { this.drag = null; }
  tap() { this.launchT = 6; }
  next() { this.nextT = 8; }
  
  frame() {
    const left = this.keys.has('KeyA') || this.keys.has('ArrowLeft');
    const right = this.keys.has('KeyD') || this.keys.has('ArrowRight');
    if (left !== right) this.x = Math.max(0, Math.min(FIELD_W, this.x + (right ? KEY_SPEED : -KEY_SPEED)));
    const launch = this.launchT > 0 || this.keys.has('Space');
    const next = this.nextT > 0 || this.keys.has('Enter');
    if (this.launchT > 0) this.launchT--;
    if (this.nextT > 0) this.nextT--;
    const fire = this.keys.has('KeyF') || this.pointerDown;
    return pack({ x: Math.round((this.x / FIELD_W) * X_MAX), tint: this.tint, launch, fire, next });
  }
}


export const SCR_TITLE = 'title', SCR_PLAY = 'play', SCR_PAUSE = 'pause', SCR_TALLY = 'tally', SCR_FAIL = 'fail',
  SCR_END = 'end', SCR_SELECT = 'select', SCR_SETTINGS = 'settings';

export function screenFor(phase, paused) {
  if (phase === PH_DONE) return SCR_END;
  if (phase === PH_CLEAR) return SCR_TALLY;
  if (phase === PH_FAIL) return SCR_FAIL;
  return paused ? SCR_PAUSE : SCR_PLAY;
}


export function windowLabel(wi) {
  const w = WINDOWS[wi];
  if (!w) return { act: '', name: '' };
  const first = WINDOWS.findIndex((x) => x.act === w.act);
  const n = wi - first + 1;
  return { act: `${ACTS[w.act].name} · ${w.boss ? 'Rose window' : `Window ${n}`}`, name: w.name, boss: !!w.boss };
}


export const SCR_STORY = 'story';


export const fieldShown = (scr) => scr !== SCR_STORY;


export function scenesBefore(wi) {
  const w = WINDOWS[wi];
  if (!w) return [];
  const out = [];
  if (wi === WINDOWS.findIndex((x) => x.act === w.act)) {
    if (w.act === 0) out.push('prologue');
    out.push(`act-${w.act + 1}`);
  }
  if (w.boss) out.push(`boss-${w.act + 1}`);
  return out;
}


export class StoryReader {
  constructor(story, ids) {
    this.lines = [];
    for (const id of ids) {
      const sc = story.scenes[id];
      if (!sc) continue;
      sc.lines.forEach((l, i) => this.lines.push({ ...l, scene: id, title: sc.title, first: i === 0 }));
    }
    this.i = 0;
  }
  get line() { return this.lines[this.i] ?? null; }
  get done() { return this.i >= this.lines.length; }
  next() { if (this.i < this.lines.length) this.i++; return this.line; }
  skip() { this.i = this.lines.length; return null; }
}






export function portraitFor(who, manifest) {
  const f = manifest?.portraits?.[who];
  return typeof f === 'string' && /^(?:[a-z0-9_-]+\/){0,3}[a-z0-9_-]+\.(?:webp|png)$/.test(f) ? f : null;
}



export function parseLaunch(search) {
  const q = new URLSearchParams(search);
  const raw = q.get('w');
  let stage = null;
  if (raw !== null && /^\d+$/.test(raw)) stage = Math.max(0, Math.min(WINDOWS.length - 1, Number(raw) - 1));
  const m = q.get('mode');
  const mode = m === 'gentle' || m === 'hard' ? m : 'normal';
  return { stage, mode };
}


export const PROGRESS_KEY = 'gbk-progress';
export function emptyProgress() { return { stars: new Array(WINDOWS.length).fill(0), reached: 0, mode: 'normal' }; }
export function readProgress(storage) {
  try {
    const o = JSON.parse(storage.getItem(PROGRESS_KEY) || 'null');
    if (!o || !Array.isArray(o.stars)) return emptyProgress();
    const p = emptyProgress();
    for (let i = 0; i < p.stars.length; i++) p.stars[i] = Math.max(0, Math.min(3, o.stars[i] | 0));
    p.reached = Math.max(0, Math.min(WINDOWS.length - 1, o.reached | 0));
    if (o.mode === 'gentle' || o.mode === 'hard') p.mode = o.mode;
    return p;
  } catch { return emptyProgress(); }
}
export function writeProgress(storage, p) {
  try { storage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch {  }
}

export function recordClear(p, wi, stars) {
  const q = { ...p, stars: p.stars.slice() };
  q.stars[wi] = Math.max(q.stars[wi] || 0, stars);
  q.reached = Math.max(q.reached, Math.min(WINDOWS.length - 1, wi + 1));
  return q;
}

export const unlocked = (p, wi) => wi <= p.reached;




export const SETTINGS_KEY = 'gbk-settings';


export const VOL_STEP = 10;
export const defaultSettings = (reduceMotion = false) => ({ shake: !reduceMotion, story: true, music: 100, sfx: 100 });
const volOf = (v, d) => (Number.isInteger(v) && v >= 0 && v <= 100 && v % VOL_STEP === 0 ? v : d);

export const stepVolume = (v, dir) => Math.max(0, Math.min(100, volOf(v, 100) + Math.sign(dir) * VOL_STEP));

export const volumeGain = (v) => (volOf(v, 100) / 100) ** 2;
export function readSettings(storage, reduceMotion = false) {
  const d = defaultSettings(reduceMotion);
  try {
    const o = JSON.parse(storage.getItem(SETTINGS_KEY) || 'null');
    if (!o || typeof o !== 'object') return d;
    return { shake: typeof o.shake === 'boolean' ? o.shake : d.shake, story: typeof o.story === 'boolean' ? o.story : d.story,
      music: volOf(o.music, d.music), sfx: volOf(o.sfx, d.sfx) };
  } catch { return d; }
}
export function writeSettings(storage, st) {
  try { storage.setItem(SETTINGS_KEY, JSON.stringify(st)); } catch {  }
}

export const storyScenes = (ids, st) => (st.story ? ids : ids.filter((id) => id === 'ending'));

export const ERASE_MS = 4000;
export function eraseTap(armedAt, now) {
  if (armedAt !== null && now - armedAt <= ERASE_MS) return { erase: true, armedAt: null };
  return { erase: false, armedAt: now };
}




export function launchHintShown(s, seat) {
  if (!s || seat === null || seat === undefined) return false;
  return s.tick - s.wt < 600 && s.embers.some((e) => e.own === seat && e.held);
}

export { FIELD_W, FIELD_H };
