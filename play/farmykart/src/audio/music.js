






















const LOOKAHEAD = 0.35;

const TICK = 90;





























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


const SCALES = {
  major: [0, 2, 4, 7, 9],          
  dorian: [0, 2, 3, 5, 7, 10],     
  lydian: [0, 2, 4, 6, 7, 11],     
};

const midi = (n) => 440 * (2 ** ((n - 69) / 12));





const THEMES = {
  




  summer: {
    bpm: 138,
    root: 50,                       
    scale: 'major',
    
    
    chords: [0, 0, 3, 4],
    lead: 'pluck',
    bass: 'walk',
    leadOctave: 2,
    density: 0.85,
  },
  



  mud: {
    bpm: 112,
    root: 45,                       
    scale: 'dorian',
    chords: [0, 0, 5, 4],
    lead: 'reed',
    bass: 'root',
    leadOctave: 2,
    density: 0.55,
  },
  




  snow: {
    bpm: 124,
    root: 52,                       
    scale: 'lydian',
    chords: [0, 4, 2, 5],
    lead: 'bell',
    bass: 'pad',
    leadOctave: 3,
    density: 0.45,
  },
};


const themeFor = (theme) => THEMES[theme] ?? (theme === 'overcast' ? THEMES.mud : THEMES.summer);









function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
}


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

const VOICES = {
  pluck: { type: 'triangle', dur: 0.16, gain: 0.085, glide: 0 },
  reed: { type: 'square', dur: 0.34, gain: 0.045, glide: 0.05 },
  bell: { type: 'sine', dur: 0.9, gain: 0.075, glide: 0 },
};

export function createMusic(audio) {
  if (!audio.ctx) return null;
  const ctx = audio.ctx;
  const out = ctx.createGain();
  out.gain.value = 0;
  
  
  
  
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 3200;
  out.connect(tone).connect(audio.master);
  return { out, tone, ticker: null, step: 0, next: 0, theme: null, rand: rng(1), intensity: 0 };
}








export function startMusic(audio, theme, seed = 0x9e3779b9) {
  if (!audio.ctx) return;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  try {
    if (new URLSearchParams(location.search).has('nomusic')) return;
  } catch {  }
  if (!audio.music) audio.music = createMusic(audio);
  const m = audio.music;
  if (!m) return;
  stopMusic(audio, { fade: 0 });

  m.theme = themeFor(theme);
  m.rand = rng(seed);
  m.step = 0;
  m.next = audio.ctx.currentTime + 0.08;
  m.intensity = 0;
  m.out.gain.cancelScheduledValues(audio.ctx.currentTime);
  m.out.gain.setValueAtTime(0.0001, audio.ctx.currentTime);
  if (!audio.muted) {
    m.out.gain.exponentialRampToValueAtTime(0.5, audio.ctx.currentTime + 1.2);
  }

  m.ticker = createTicker(() => schedule(audio), TICK);
}






function schedule(audio) {
  const m = audio.music;
  if (!m || !m.theme || !audio.ctx) return;
  const ctx = audio.ctx;
  const th = m.theme;
  const stepDur = 60 / th.bpm / 4;
  const scale = SCALES[th.scale];

  
  
  
  
  
  
  
  
  if (m.next < ctx.currentTime - 0.5) {
    m.next = ctx.currentTime + 0.05;
  }

  
  
  
  const MAX_STEPS = 64;
  let emitted = 0;

  while (m.next < ctx.currentTime + LOOKAHEAD && emitted < MAX_STEPS) {
    emitted += 1;
    const at = m.next;
    const step = m.step % 64;
    const bar = Math.floor(step / 16);
    const beat = step % 16;
    const chord = th.chords[bar % th.chords.length];

    
    if (th.bass === 'walk' && beat % 4 === 0) {
      
      
      
      const nextChord = th.chords[(bar + 1) % th.chords.length];
      const deg = beat === 12 ? (chord + nextChord) / 2 : chord + (beat === 8 ? 2 : 0);
      note(ctx, m.out, {
        freq: midi(th.root + scale[Math.round(deg) % scale.length] - 12),
        at, dur: 0.18, type: 'triangle', gain: 0.12,
      });
    } else if (th.bass === 'root' && beat % 8 === 0) {
      note(ctx, m.out, {
        freq: midi(th.root + scale[chord % scale.length] - 12),
        at, dur: 0.5, type: 'sine', gain: 0.14,
      });
    } else if (th.bass === 'pad' && beat === 0) {
      
      note(ctx, m.out, {
        freq: midi(th.root + scale[chord % scale.length]),
        at, dur: 1.8, type: 'sine', gain: 0.05,
      });
    }

    
    
    
    if (beat % 4 === 2) {
      for (const offset of [0, 2]) {
        note(ctx, m.out, {
          freq: midi(th.root + scale[(chord + offset) % scale.length]),
          at, dur: 0.12, type: 'triangle', gain: 0.035,
        });
      }
    }

    
    const voice = VOICES[th.lead] ?? VOICES.pluck;
    
    const density = th.density + m.intensity * 0.25;
    if (m.rand() < density && beat % 2 === 0) {
      
      
      
      const leap = m.rand() < 0.25;
      const deg = leap
        ? Math.floor(m.rand() * scale.length)
        : (chord + Math.floor(m.rand() * 3)) % scale.length;
      note(ctx, m.out, {
        freq: midi(th.root + scale[deg] + 12 * th.leadOctave),
        at,
        dur: voice.dur,
        type: voice.type,
        gain: voice.gain * (0.8 + m.intensity * 0.4),
        glide: voice.glide,
      });
    }

    m.next += stepDur;
    m.step += 1;
  }
}







export function setMusicIntensity(audio, intensity) {
  const m = audio.music;
  if (!m || !audio.ctx) return;
  m.intensity = Math.max(0, Math.min(1, intensity));
  
  
  m.tone.frequency.setTargetAtTime(3000 + m.intensity * 3500, audio.ctx.currentTime, 0.4);
}


export function duckMusic(audio, seconds = 0.9) {
  const m = audio.music;
  if (!m || !audio.ctx || audio.muted) return;
  const t = audio.ctx.currentTime;
  m.out.gain.cancelScheduledValues(t);
  m.out.gain.setValueAtTime(Math.max(0.0001, m.out.gain.value), t);
  m.out.gain.exponentialRampToValueAtTime(0.12, t + 0.08);
  m.out.gain.exponentialRampToValueAtTime(0.5, t + seconds);
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


export function setMusicMuted(audio, muted) {
  const m = audio?.music;
  if (!m || !audio.ctx) return;
  const t = audio.ctx.currentTime;
  m.out.gain.cancelScheduledValues(t);
  m.out.gain.setTargetAtTime(muted ? 0.0001 : 0.5, t, 0.15);
}
