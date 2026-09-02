





























export const INTRO = Object.freeze({
  fadeTime: 1.1,   
  skipFade: 0.45,  
});








export const INTRO_SHOTS = Object.freeze([
  {
    id: 'title',
    dur: 4.2,
    cam: { from: [0, 1.6, 6], to: [0, 1.6, 6], look: [0, 1.2, 0], fov: 60 },
    cues: [
      { at: 0.7, kind: 'caption', text: 'LUNA-9 SMALLHOLDING - THE MOON' },
    ],
  },
  {
    id: 'moonFarm',
    dur: 12.0,
    
    
    cam: { from: [-4.2, 1.7, 8.5], to: [-1.6, 1.55, 6.2], look: [0.6, 1.0, 0], fov: 58 },
    cues: [
      { at: 0.6, kind: 'sfx', effect: 'chickIdle', gain: 0.8 },
      { at: 2.2, kind: 'xander', text: 'Morning, ladies. Eggs by nine. No excuses.' },
      
      
      
      { at: 3.6, kind: 'act', act: 'feed' },
      { at: 4.1, kind: 'sfx', effect: 'stepGrain', gain: 0.5, rate: 1.35 },
      { at: 5.0, kind: 'sfx', effect: 'chickIdle', gain: 0.75, rate: 0.96 },
      { at: 6.4, kind: 'sfx', effect: 'chickIdle', gain: 0.7, rate: 1.06 },
      { at: 8.2, kind: 'xander', text: 'Quiet shift. Earth looks good from here.' },
      { at: 9.4, kind: 'act', act: 'feed' },
      { at: 9.9, kind: 'sfx', effect: 'stepGrain', gain: 0.45, rate: 1.28 },
    ],
  },
  {
    id: 'call',
    dur: 14.5,
    cam: { from: [2.6, 1.5, 5.6], to: [2.1, 1.45, 4.2], look: [1.2, 1.1, 0.4], fov: 56 },
    cues: [
      { at: 0.3, kind: 'act', act: 'toRadio' },   
      { at: 0.5, kind: 'sfx', effect: 'liftChime', rate: 1.4, gain: 0.8 },
      { at: 1.3, kind: 'sfx', effect: 'liftChime', rate: 1.4, gain: 0.8 },
      { at: 2.2, kind: 'agency', voxId: 'agency1', text: 'Agency dispatch calling Luna-9. Come in, Xander.' },
      { at: 6.0, kind: 'xander', text: 'It is my day off.' },
      { at: 7.8, kind: 'agency', voxId: 'agency2', text: 'Hesper-4 has stopped reporting. You are the nearest certified hand. It is a one man job.' },
      { at: 13.0, kind: 'xander', text: 'Of course it is. Of course I am.' },
    ],
  },
  {
    id: 'ship',
    dur: 11.0,
    cam: { from: [-5.5, 1.4, 7], to: [-3.8, 2.6, 9.5], look: [0, 4.5, 0], fov: 62 },
    cues: [
      { at: 0.3, kind: 'act', act: 'walk' },        
      { at: 5.2, kind: 'act', act: 'board' },
      { at: 6.2, kind: 'sfx', effect: 'liftLoop', gain: 1.0, rate: 0.6 },
      { at: 6.8, kind: 'act', act: 'ignite' },
      { at: 6.9, kind: 'sfx', effect: 'hiss' },
      { at: 7.0, kind: 'sfx', effect: 'settle', rate: 0.6, gain: 0.9 },
      { at: 7.6, kind: 'sfx', effect: 'liftLoop', gain: 0.8, rate: 0.75 },
    ],
  },
  {
    id: 'transit',
    dur: 13.5,
    cam: { from: [0, 0.4, 10], to: [1.8, 0.7, 7.6], look: [0, 0.6, 0], fov: 55 },
    cues: [
      { at: 0.9, kind: 'sfx', effect: 'blip' },
      { at: 1.2, kind: 'xander', text: 'Hesper-4 control, requesting approach.' },
      { at: 4.2, kind: 'sfx', effect: 'static' },
      { at: 6.1, kind: 'sfx', effect: 'blip' },
      { at: 6.4, kind: 'xander', text: 'Hesper-4 control. Requesting approach.' },
      { at: 9.4, kind: 'sfx', effect: 'static' },
      { at: 11.4, kind: 'caption', text: 'Nobody answered.' },
    ],
  },
  {
    id: 'crash',
    dur: 6.5,
    cam: { from: [0, 3.2, 9], to: [0, 1.1, 3.2], look: [0, 0.8, -4], fov: 70 },
    cues: [
      { at: 0.2, kind: 'sfx', effect: 'liftChime', rate: 2.1, gain: 1.0 },
      { at: 0.9, kind: 'sfx', effect: 'liftChime', rate: 2.1, gain: 1.0 },
      { at: 1.0, kind: 'act', act: 'shake' },
      { at: 1.6, kind: 'sfx', effect: 'liftChime', rate: 2.1, gain: 1.0 },
      { at: 2.2, kind: 'sfx', effect: 'hiss' },
      { at: 3.0, kind: 'sfx', effect: 'liftLoop', rate: 0.45, gain: 1.0 },
      { at: 4.2, kind: 'sfx', effect: 'liftLoop', rate: 0.6, gain: 0.7 },
      { at: 5.6, kind: 'act', act: 'impact' },      
    ],
  },
  {
    id: 'wreck',
    dur: 11.5,
    cam: { from: [4.6, 1.9, 6.4], to: [3.2, 1.5, 4.6], look: [0, 0.7, 0], fov: 58 },
    cues: [
      { at: 0.8, kind: 'sfx', effect: 'spark', gain: 0.8 },
      { at: 1.5, kind: 'sfx', effect: 'creak', gain: 0.8, rate: 0.85 },
      { at: 2.0, kind: 'act', act: 'rise' },        
      { at: 3.4, kind: 'sfx', effect: 'spark', gain: 0.7 },
      { at: 5.9, kind: 'act', act: 'step' },        
      { at: 6.2, kind: 'xander', text: 'Venus. Wonderful.' },
      { at: 7.3, kind: 'sfx', effect: 'creak', gain: 0.6, rate: 0.78 },
      { at: 8.4, kind: 'sfx', effect: 'spark', gain: 0.6 },
      { at: 9.6, kind: 'caption', text: 'HESPER-4 STOCK STATION - VENUS' },
    ],
  },
]);

export function introLength() {
  return INTRO_SHOTS.reduce((a, s) => a + s.dur, 0);
}

export function createIntro() {
  return {
    shot: 0,       
    tShot: 0,      
    t: 0,          
    fired: 0,      
    leaving: -1,   
    done: false,
  };
}






export function stepIntro(state, dt, skipPressed = false) {
  if (state.done) return { state, events: [] };
  const n = { ...state };
  const events = [];

  if (skipPressed && n.leaving < 0) n.leaving = 0;
  if (n.leaving >= 0) {
    n.leaving += dt;
    if (n.leaving >= INTRO.skipFade) n.done = true;
    return { state: n, events };
  }

  n.t += dt;
  n.tShot += dt;
  const shot = INTRO_SHOTS[n.shot];
  while (n.fired < shot.cues.length && shot.cues[n.fired].at <= n.tShot) {
    events.push({ ...shot.cues[n.fired], shotId: shot.id });
    n.fired += 1;
  }
  if (n.tShot >= shot.dur) {
    if (n.shot + 1 >= INTRO_SHOTS.length) n.done = true;
    else {
      n.shot += 1;
      n.tShot = 0;
      n.fired = 0;
      events.push({ kind: 'shotStart', shotId: INTRO_SHOTS[n.shot].id });
    }
  }
  return { state: n, events };
}






export function introFade(state) {
  if (state.done) return 1;
  if (state.leaving >= 0) return Math.min(1, state.leaving / INTRO.skipFade);
  const shot = INTRO_SHOTS[state.shot];
  const f = INTRO.fadeTime;
  const in_ = Math.min(1, state.tShot / f);
  const out = Math.min(1, (shot.dur - state.tShot) / f);
  return 1 - Math.max(0, Math.min(in_, out));
}


export function introCam(state) {
  const shot = INTRO_SHOTS[Math.min(state.shot, INTRO_SHOTS.length - 1)];
  const k = Math.min(1, shot.dur > 0 ? state.tShot / shot.dur : 1);
  
  const e = k * k * (3 - 2 * k);
  const lerp3 = (a, b) => a.map((v, i) => v + (b[i] - v) * e);
  return {
    eye: lerp3(shot.cam.from, shot.cam.to),
    look: shot.cam.look.slice(),
    fov: shot.cam.fov,
    shotId: shot.id,
  };
}
