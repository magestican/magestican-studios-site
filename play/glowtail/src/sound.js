








export const BITE_RUNGS = 8;


export const SFX_TAKES = Object.freeze({
  ...Object.fromEntries(Array.from({ length: BITE_RUNGS }, (_, i) => [`bite${i + 1}`, 1])),
  shoalBite: 3,
  encircle1: 1, encircle2: 1, encircle3: 1,
  shoal: 1, descend: 1, death: 1, surface: 1,
  nearMiss: 1, 
  flinch: 1, 
});


export const MENU_CUES = Object.freeze(['tap', 'start', 'pause', 'resume', 'back', 'focus']);


export const FOCUS_GAP_MS = 70;







export function focusMoveCue({ from = null, to = null, via = null, since = Infinity } = {}) {
  if (!to || to === from) return null;
  if (via !== 'key' && via !== 'pad') return null;
  if (since < FOCUS_GAP_MS) return null;
  return 'focus';
}


export const MUSIC_TRACKS = Object.freeze(['menu', 'shallows', 'kelp', 'reef', 'abyss', 'trench']);

export function biteCue(streak) {
  const s = Math.max(1, Math.min(BITE_RUNGS, Math.floor(Number(streak) || 1)));
  return `bite${s}`;
}


export function encircleCue(count) {
  const n = Number(count) || 0;
  return n >= 7 ? 'encircle3' : n >= 4 ? 'encircle2' : 'encircle1';
}

function cueFor(e) {
  switch (e.type) {
    case 'bite': return e.kind === 'shoal' ? 'shoalBite' : biteCue(e.streak);
    case 'encircle': return encircleCue(e.count);
    case 'shoal': return 'shoal';
    case 'descend': return 'descend';
    case 'death': return 'death';
    case 'surface': return 'surface';
    case 'nearMiss': return 'nearMiss';
    
    
    case 'flinch': return 'flinch';
    default: return null; 
  }
}





export function cuesFor(events) {
  const out = [];
  const slot = new Map();
  for (const e of events || []) {
    const c = cueFor(e);
    if (!c) continue;
    const kind = c.replace(/\d+$/, '');
    if (slot.has(kind)) out[slot.get(kind)] = c;
    else { slot.set(kind, out.length); out.push(c); }
  }
  return out;
}


export function trackFor({ running = false, mode = 'dive', depthIndex = 0 } = {}) {
  if (!running) return 'menu';
  if (mode === 'classic') return 'shallows';
  const i = Math.max(0, Math.min(MUSIC_TRACKS.length - 2, Math.floor(Number(depthIndex) || 0)));
  return MUSIC_TRACKS[i + 1];
}


export function followSound(music, soundOn) {
  if (!music) return false;
  if (music.isOn() !== !!soundOn) music.setOn(!!soundOn);
  return music.isOn();
}
