




















import { createLobbyMusic } from '../../../../web-engine/audio/lobbyMusic.js';

export const MENU_TRACK_ID = 'kartzoom-menu';
export const RACE_TRACK_ID = 'kartzoom-race';



export const RACE_GAIN = 0.28;




export const MUSIC_MANIFEST = new URL('../../assets/music/music.json', import.meta.url);
















export const LIFT_GAIN = 1.22;      
export const LIFT_SHELF_DB = 4;     
export const LIFT_SHELF_HZ = 2800;
export const LIFT_RAMP = 1.5;       
export const DUCK_LEVEL = 0.4;      
export const DUCK_ATTACK = 0.06;
export const DUCK_HOLD = 0.15;

function shapeChain(audio) {
  if (audio.raceBedShape) return audio.raceBedShape;
  const ctx = audio.ctx;
  if (typeof ctx.createGain !== 'function' || typeof ctx.createBiquadFilter !== 'function') return null;
  const duck = ctx.createGain();
  const lift = ctx.createGain();
  const tone = ctx.createBiquadFilter();
  tone.type = 'highshelf';
  tone.frequency.value = LIFT_SHELF_HZ;
  tone.gain.value = 0;
  duck.connect(lift);
  lift.connect(tone);
  tone.connect(audio.master);
  audio.raceBedShape = { input: duck, duck, lift, tone, lifted: false };
  return audio.raceBedShape;
}

function hold(param, t) {
  param.cancelScheduledValues(t);
  param.setValueAtTime(param.value, t);
}

function resetShape(s, t) {
  s.lifted = false;
  s.lift.gain.cancelScheduledValues(t);
  s.lift.gain.setValueAtTime(1, t);
  s.tone.gain.cancelScheduledValues(t);
  s.tone.gain.setValueAtTime(0, t);
}


export function liftRaceBed(audio) {
  const s = audio?.raceBedShape;
  if (!s || s.lifted) return;
  s.lifted = true;
  const t = audio.ctx.currentTime;
  hold(s.lift.gain, t);
  s.lift.gain.linearRampToValueAtTime(LIFT_GAIN, t + LIFT_RAMP);
  hold(s.tone.gain, t);
  s.tone.gain.linearRampToValueAtTime(LIFT_SHELF_DB, t + LIFT_RAMP);
}


export function duckRaceBed(audio, seconds = 0.9) {
  const s = audio?.raceBedShape;
  if (!s) return;
  const t = audio.ctx.currentTime;
  const g = s.duck.gain;
  hold(g, t);
  g.linearRampToValueAtTime(DUCK_LEVEL, t + DUCK_ATTACK);
  g.linearRampToValueAtTime(DUCK_LEVEL, t + Math.min(seconds * 0.5, DUCK_ATTACK + DUCK_HOLD));
  g.linearRampToValueAtTime(1, t + seconds);
}

export function raceBed(audio, make = createLobbyMusic) {
  if (!audio?.ctx || !audio.master) return null;
  if (!audio.raceBed) {
    const shape = shapeChain(audio);
    audio.raceBed = make({
      ctx: audio.ctx,
      
      
      destination: shape ? shape.input : audio.master,
      manifestUrl: MUSIC_MANIFEST,
      trackId: RACE_TRACK_ID,
      gain: RACE_GAIN,
    });
  }
  audio.raceBed.setMuted?.(!!audio.muted);
  return audio.raceBed;
}


export function startRaceBed(audio, make) {
  const bed = raceBed(audio, make);
  if (!bed) return null;
  
  if (audio.raceBedShape) resetShape(audio.raceBedShape, audio.ctx.currentTime);
  Promise.resolve(bed.play()).catch(() => {});
  return bed;
}


export function raceBedState(audio) {
  const s = audio?.raceBedShape;
  return {
    bed: audio?.raceBed?.state ? audio.raceBed.state() : null,
    shape: s ? {
      lifted: s.lifted,
      lift: Number(s.lift.gain.value.toFixed(3)),
      shelfDb: Number(s.tone.gain.value.toFixed(2)),
      duck: Number(s.duck.gain.value.toFixed(3)),
    } : null,
  };
}


export function stopRaceBed(audio) {
  audio?.raceBed?.stop?.();
}
