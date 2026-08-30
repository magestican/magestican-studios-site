





















































import {
  buildKartSong, finalLapVariant, swungBeat, asNotes, chordAt,
} from '../../../../web-engine/audio/kartSongSpec.js';
import { noiseBuffer } from './sfx.js';


const LOOKAHEAD = 0.35;

const TICK = 90;














const MUSIC_LEVEL = 0.5;





























const TIMER_SOURCE = `
  let id = 0;
  self.onmessage = (e) => {
    if (e.data && e.data.interval) {
      clearInterval(id);
      id = setInterval(() => self.postMessage('tick'), e.data.interval);
    } else {
      clearInterval(id);
      id = 0;
    }
  };
`;









function createTicker(onTick, interval) {
  try {
    if (typeof Worker === 'function' && typeof Blob === 'function' && typeof URL?.createObjectURL === 'function') {
      const url = URL.createObjectURL(new Blob([TIMER_SOURCE], { type: 'application/javascript' }));
      const worker = new Worker(url);
      
      
      URL.revokeObjectURL(url);
      worker.onmessage = onTick;
      worker.postMessage({ interval });
      return {
        kind: 'worker',
        stop() { try { worker.postMessage('stop'); worker.terminate(); } catch {  } },
      };
    }
  } catch {  }
  const id = setInterval(onTick, interval);
  return { kind: 'interval', stop() { clearInterval(id); } };
}

const midiToHz = (n) => 440 * (2 ** ((n - 69) / 12));



















const PATCHES = {
  
  pluck: { type: 'triangle', gain: 0.085, gate: 0.55, release: 0.10, glide: 0 },
  reed: { type: 'square', gain: 0.048, gate: 0.85, release: 0.06, glide: 0.05 },
  bell: { type: 'sine', gain: 0.080, gate: 1.00, release: 0.55, glide: 0 },
  brass: { type: 'sawtooth', gain: 0.050, gate: 0.72, release: 0.08, glide: 0 },
  
  chop: { type: 'triangle', gain: 0.032, gate: 0.35, release: 0.04, glide: 0 },
  shimmer: { type: 'sine', gain: 0.030, gate: 0.90, release: 0.30, glide: 0 },
  stab: { type: 'square', gain: 0.026, gate: 0.60, release: 0.03, glide: 0 },
  pulse: { type: 'sawtooth', gain: 0.022, gate: 0.45, release: 0.04, glide: 0 },
  
  boomchuck: { type: 'triangle', gain: 0.120, gate: 0.55, release: 0.06, glide: 0 },
  walk: { type: 'triangle', gain: 0.115, gate: 0.70, release: 0.06, glide: 0 },
  pad: { type: 'sine', gain: 0.100, gate: 0.95, release: 0.20, glide: 0 },
  pump: { type: 'square', gain: 0.090, gate: 0.50, release: 0.04, glide: 0 },
  stomp: { type: 'triangle', gain: 0.115, gate: 0.60, release: 0.05, glide: 0 },
};


function note(ctx, dest, { freq, at, dur, type = 'triangle', gain = 0.1, glide = 0 }) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq * (glide ? 0.94 : 1), at);
  if (glide) osc.frequency.exponentialRampToValueAtTime(freq, at + glide);
  
  
  
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(dest);
  osc.start(at);
  osc.stop(at + dur + 0.05);
}


















function drum(ctx, dest, audio, { kind, at, gain = 0.4 }) {
  const noise = (freq, q, dur, type = 'bandpass', g0 = gain) => {
    const buf = noiseBuffer(audio);
    if (!buf) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = 1;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(g0, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g).connect(dest);
    
    
    src.start(at, Math.random() * 0.9, dur + 0.02);
    src.stop(at + dur + 0.05);
  };

  switch (kind) {
    
    
    
    case 'kick': {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, at);
      osc.frequency.exponentialRampToValueAtTime(45, at + 0.06);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(gain, at + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.12);
      osc.connect(g).connect(dest);
      osc.start(at);
      osc.stop(at + 0.18);
      break;
    }
    case 'snare':
      noise(1900, 0.7, 0.13);
      break;
    
    
    
    
    
    case 'clap':
      noise(1400, 1.2, 0.02, 'bandpass', gain * 0.7);
      noise(1400, 1.2, 0.02, 'bandpass', gain * 0.85);
      noise(1500, 1.0, 0.16, 'bandpass', gain);
      break;
    case 'hat':
      noise(9000, 0.9, 0.035, 'highpass');
      break;
    case 'openhat':
      noise(8000, 0.8, 0.24, 'highpass');
      break;
    case 'shaker':
      noise(6500, 0.6, 0.045, 'highpass');
      break;
    case 'crash':
      noise(5000, 0.4, 1.10, 'highpass');
      break;
    
    
    
    case 'stick':
      noise(2600, 3.0, 0.030, 'bandpass');
      break;
    default:
      break;
  }
}





export function createMusic(audio) {
  if (!audio.ctx) return null;
  const ctx = audio.ctx;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const out = ctx.createGain();
  out.gain.value = 0;
  out.connect(audio.master);
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 3200;
  tone.connect(out);
  const kit = ctx.createBiquadFilter();
  kit.type = 'lowpass';
  kit.frequency.value = 11000;
  kit.connect(out);
  return {
    out,
    tone,
    kit,
    ticker: null,
    song: null,
    base: null,
    bar: 0,
    barStart: 0,
    intensity: 0,
    pendingLift: false,
    level: MUSIC_LEVEL,
  };
}













export function startMusic(audio, opts, legacySeed) {
  if (!audio.ctx) return;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  try {
    if (new URLSearchParams(location.search).has('nomusic')) return;
  } catch {  }
  if (!audio.music) audio.music = createMusic(audio);
  const m = audio.music;
  if (!m) return;
  stopMusic(audio, { fade: 0 });

  const sel = typeof opts === 'string' ? { theme: opts, seed: legacySeed } : (opts || {});
  
  
  
  
  
  
  
  
  
  
  try {
    m.base = buildKartSong({ trackId: sel.trackId, theme: sel.theme });
  } catch (err) {
    try { console.warn('farmykart: no music for this circuit -', err && err.message); } catch {  }
    return;
  }
  m.song = m.base;
  m.bar = 0;
  m.barStart = audio.ctx.currentTime + 0.08;
  m.intensity = 0;
  m.pendingLift = false;
  m.level = MUSIC_LEVEL * (m.base.gainScale ?? 1);
  m.out.gain.cancelScheduledValues(audio.ctx.currentTime);
  m.out.gain.setValueAtTime(0.0001, audio.ctx.currentTime);
  if (!audio.muted) {
    m.out.gain.exponentialRampToValueAtTime(m.level, audio.ctx.currentTime + 1.2);
  }

  m.ticker = createTicker(() => schedule(audio), TICK);
}
















const MAX_BARS_PER_TICK = 2;
















function schedule(audio) {
  const m = audio.music;
  if (!m || !m.song || !audio.ctx) return;
  const ctx = audio.ctx;

  
  
  
  
  
  
  
  
  if (m.barStart < ctx.currentTime - 0.5) {
    m.barStart = ctx.currentTime + 0.05;
  }

  
  
  
  
  let emitted = 0;
  while (m.barStart < ctx.currentTime + LOOKAHEAD && emitted < MAX_BARS_PER_TICK) {
    emitted += 1;
    
    
    
    
    if (m.pendingLift && !m.song.finalLap) {
      m.song = finalLapVariant(m.base);
      m.pendingLift = false;
    }
    emitBar(ctx, audio, { voices: m.tone, drums: m.kit }, m.song, m.bar, m.barStart, m.intensity);
    m.barStart += m.song.beatsPerBar * m.song.beatSec;
    m.bar += 1;
  }
}


function emitBar(ctx, audio, buses, song, barIndex, at, intensity) {
  const dest = buses.voices;
  const bar = song.barEvents[barIndex % song.bars];
  const beatSec = song.beatSec;
  const swing = song.swing;
  
  
  const leadBoost = 0.85 + intensity * 0.35;

  for (const voice of ['lead', 'comp', 'bass']) {
    const patch = PATCHES[song.voices[voice]] ?? PATCHES.pluck;
    let beat = 0;
    for (const [notes, beats] of bar[voice]) {
      const list = asNotes(notes);
      if (list.length) {
        const t = at + swungBeat(beat, swing) * beatSec;
        const span = (at + swungBeat(beat + beats, swing) * beatSec) - t;
        const dur = span * patch.gate + patch.release;
        const gain = patch.gain * (voice === 'lead' ? leadBoost : 1);
        for (const midi of list) {
          note(ctx, dest, {
            freq: midiToHz(midi), at: t, dur, type: patch.type, gain, glide: patch.glide,
          });
        }
      }
      beat += beats;
    }
  }

  for (const d of bar.drums) {
    drum(ctx, buses.drums, audio, {
      kind: d.drum,
      at: at + swungBeat(d.at, swing) * beatSec,
      gain: d.gain,
    });
  }
}



















export function renderSongBars(ctx, audio, dest, song, { bars = song.bars, at = 0, intensity = 0 } = {}) {
  
  
  
  
  const buses = (dest && dest.voices) ? dest : { voices: dest, drums: dest };
  const barSec = song.beatsPerBar * song.beatSec;
  for (let b = 0; b < bars; b += 1) {
    emitBar(ctx, audio, buses, song, b, at + b * barSec, intensity);
  }
  return bars * barSec;
}












export function setMusicIntensity(audio, intensity) {
  const m = audio.music;
  if (!m || !audio.ctx) return;
  m.intensity = Math.max(0, Math.min(1, intensity));
  
  
  m.tone.frequency.setTargetAtTime(3000 + m.intensity * 3500, audio.ctx.currentTime, 0.4);
  if (m.intensity >= 1 && m.base && !m.song?.finalLap) {
    m.pendingLift = true;
    fanfare(audio, m);
  }
}


















function fanfare(audio, m) {
  const ctx = audio.ctx;
  if (!ctx || audio.muted || !m.base) return;
  const t = ctx.currentTime + 0.02;
  const tonic = m.base.root + 2 + 24;        
  const beat = m.base.beatSec;
  [0, 4, 7, 12].forEach((interval, i) => {
    note(ctx, m.tone, {
      freq: midiToHz(tonic + interval),
      at: t + i * beat * 0.25,
      dur: i === 3 ? 0.55 : 0.16,
      type: 'square',
      gain: 0.075,
    });
  });
  
  
  
  for (let i = 0; i < 4; i += 1) {
    drum(ctx, m.kit, audio, { kind: 'snare', at: t + i * beat * 0.25, gain: 0.22 + i * 0.06 });
  }
  drum(ctx, m.kit, audio, { kind: 'crash', at: t + beat, gain: 0.26 });
}























export function playVictorySting(audio, opts = {}) {
  if (!audio?.ctx || audio.muted) return;
  const ctx = audio.ctx;
  const song = buildKartSong({ trackId: opts.trackId, theme: opts.theme });
  const beat = 60 / song.bpm;
  const bar = beat * 4;
  const out = ctx.createGain();
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  out.gain.value = 0.6;
  out.connect(audio.master);
  const fake = { ctx, master: audio.master, muted: false, noise: audio.noise };

  
  
  
  
  
  const fifthDegree = song.mode === 'mixolydian' ? 6 : 4;
  const cadence = [
    { degree: 0, quality: 'maj', bar: 0 },
    { degree: 3, quality: 'add9', bar: 1 },
    { degree: fifthDegree, quality: 'maj', bar: 2 },
    { degree: 0, quality: 'maj6', bar: 3 },
  ];
  const t0 = ctx.currentTime + 0.03;
  for (const c of cadence) {
    const notes = chordAt(song.root, song.mode, c.degree, c.quality, { octave: 1 });
    const at = t0 + c.bar * bar;
    const last = c.bar === 3;
    for (const midi of notes) {
      note(ctx, out, {
        freq: midiToHz(midi), at, dur: last ? bar * 1.4 : bar * 0.85,
        type: 'triangle', gain: 0.06,
      });
    }
    
    note(ctx, out, {
      freq: midiToHz(notes[0] - 12), at, dur: last ? bar * 1.2 : bar * 0.8,
      type: 'sine', gain: 0.10,
    });
    drum(ctx, out, fake, { kind: 'kick', at, gain: 0.55 });
    if (!last) drum(ctx, out, fake, { kind: 'clap', at: at + beat * 2, gain: 0.38 });
    else drum(ctx, out, fake, { kind: 'crash', at, gain: 0.28 });
  }
  return bar * 4 + 1;
}


export function duckMusic(audio, seconds = 0.9) {
  const m = audio.music;
  if (!m || !audio.ctx || audio.muted) return;
  const t = audio.ctx.currentTime;
  m.out.gain.cancelScheduledValues(t);
  m.out.gain.setValueAtTime(Math.max(0.0001, m.out.gain.value), t);
  m.out.gain.exponentialRampToValueAtTime(0.12, t + 0.08);
  m.out.gain.exponentialRampToValueAtTime(m.level, t + seconds);
}

export function stopMusic(audio, { fade = 0.6 } = {}) {
  const m = audio?.music;
  if (!m) return;
  m.ticker?.stop();
  m.ticker = null;
  if (!audio.ctx) return;
  const t = audio.ctx.currentTime;
  m.out.gain.cancelScheduledValues(t);
  m.out.gain.setValueAtTime(Math.max(0.0001, m.out.gain.value), t);
  if (fade > 0) m.out.gain.exponentialRampToValueAtTime(0.0001, t + fade);
  else m.out.gain.setValueAtTime(0.0001, t);
}


export const musicClock = (audio) => audio?.music?.ticker?.kind ?? 'stopped';











export const musicNow = (audio) => {
  const m = audio?.music;
  if (!m?.song) return null;
  return {
    name: m.song.name,
    trackId: m.song.trackId,
    bpm: m.song.bpm,
    mode: m.song.mode,
    bar: m.bar % m.song.bars,
    finalLap: !!m.song.finalLap,
  };
};


export function setMusicMuted(audio, muted) {
  const m = audio?.music;
  if (!m || !audio.ctx) return;
  const t = audio.ctx.currentTime;
  m.out.gain.cancelScheduledValues(t);
  m.out.gain.setTargetAtTime(muted ? 0.0001 : m.level, t, 0.15);
}
