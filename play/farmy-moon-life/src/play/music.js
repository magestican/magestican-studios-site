
















































export const RENDER_RATE = 22050;


export const FADE_S = 2.5;







export const AFTER_FRAMES = 30;
















const ENVELOPE = Object.freeze({
  pluck: { attack: 0.006, decayScale: 1.6, decayMin: 0.35, decayMax: 2 },
  pad: { attack: 0.5, sustain: true, release: 0.9 },
  bass: { attack: 0.014, decayScale: 1.2, decayMin: 0.25, decayMax: 1.2 },
  shaker: { attack: 0.003, decayScale: 1, decayMin: 0.08, decayMax: 0.12 },
});

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const FLOOR = 0.0001;         


function noiseBuffer(ctx) {
  const buf = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.25), ctx.sampleRate);
  const d = buf.getChannelData(0);
  let n = 20260919;
  for (let i = 0; i < d.length; i += 1) { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; d[i] = (n / 4294967296) * 2 - 1; }
  return buf;
}







function pluckWave(ctx) {
  try {
    const imag = new Float32Array([0, 1, 0.4, 0.22, 0.1, 0.05, 0.02]);
    return ctx.createPeriodicWave(new Float32Array(imag.length), imag, { disableNormalization: false });
  } catch { return null; }      
}






function envelope(ctx, at, peak, attack, decay, holdUntil = 0) {
  const g = ctx.createGain();
  const top = Math.max(peak, FLOOR * 2);
  const held = Math.max(holdUntil, at + attack);
  g.gain.setValueAtTime(FLOOR, at);
  g.gain.exponentialRampToValueAtTime(top, at + attack);
  if (held > at + attack) g.gain.setValueAtTime(top, held);
  g.gain.exponentialRampToValueAtTime(FLOOR, held + decay);
  return g;
}












export const REVERB_S = 1.2;
export const REVERB_WET = 0.32;
const SEND = Object.freeze({ pluck: 0.5, pad: 0.4, bass: 0, shaker: 0 });

function impulse(ctx, seconds, seed = 424242) {
  const n = Math.max(1, Math.round(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  const tau = n / 5;                        
  let r = (seed >>> 0) || 1;
  let y = 0;
  for (let i = 0; i < n; i += 1) {
    r = (Math.imul(r, 1664525) + 1013904223) >>> 0;
    const x = ((r / 4294967296) * 2 - 1) * Math.exp(-i / tau);
    y += 0.22 * (x - y);                    
    d[i] = y;
  }
  return buf;
}







export const LATE_MAX_S = 0.012;
const hashOf = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i += 1) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const lcg = (seed) => { let s = (seed >>> 0) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); };







const TINE = Object.freeze({ ratio: 3.93, gain: 0.2, attack: 0.002, decay: 0.05 });






export function buildGraph(ctx, arr, score, { room = true } = {}) {
  const spb = 60 / arr.bpm;
  const out = ctx.createGain();
  out.gain.value = 1;
  out.connect(ctx.destination);

  
  
  let verb = null;
  const returnOf = () => {
    if (verb) return verb;
    verb = ctx.createConvolver();
    verb.buffer = impulse(ctx, REVERB_S);
    const wet = ctx.createGain();
    wet.gain.value = REVERB_WET;
    verb.connect(wet);
    wet.connect(out);
    return verb;
  };

  const rand = lcg(hashOf(String(arr.id || 'arrangement')));
  let wave;                     
  let noise = null;
  let end = 0;

  for (const track of arr.tracks) {
    const env = ENVELOPE[track.instrument];
    if (!env) continue;                 
    
    
    
    const trackOut = ctx.createGain();
    trackOut.gain.value = 1;
    trackOut.connect(out);
    if (room && SEND[track.instrument] > 0) {
      const send = ctx.createGain();
      send.gain.value = SEND[track.instrument];
      trackOut.connect(send);
      send.connect(returnOf());
    }
    let bus = trackOut;
    if (track.instrument === 'pad') {
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 1500;
      lp.Q.value = 0.6;
      lp.connect(trackOut);
      bus = lp;
    } else if (track.instrument === 'shaker') {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 5200;
      bp.Q.value = 0.9;
      bp.connect(trackOut);
      bus = bp;
      noise = noise || noiseBuffer(ctx);
    }
    const human = track.instrument === 'pluck' || track.instrument === 'bass';

    for (const n of track.notes) {
      const at = n.at * spb + (human ? rand() * LATE_MAX_S : 0);
      const durS = n.dur * spb;
      const peak = Math.min(1, human ? n.gain * (0.88 + rand() * 0.14) : n.gain);
      const attack = Math.min(env.attack, durS * 0.5);
      
      
      const holdUntil = env.sustain ? at + durS : 0;
      const decay = env.sustain ? env.release : clamp(durS * env.decayScale, env.decayMin, env.decayMax);
      const stop = Math.max(holdUntil, at + attack) + decay;
      const g = envelope(ctx, at, peak, attack, decay, holdUntil);
      g.connect(bus);

      if (track.instrument === 'shaker') {
        const src = ctx.createBufferSource();
        src.buffer = noise;
        src.connect(g);
        src.start(at);
        src.stop(stop + 0.02);
      } else if (track.instrument === 'pad') {
        
        
        for (const cents of [-7, 7]) {
          const o = ctx.createOscillator();
          o.type = 'triangle';
          o.frequency.setValueAtTime(score.midiToHz(n.midi), at);
          o.detune.setValueAtTime(cents, at);
          o.connect(g);
          o.start(at);
          o.stop(stop + 0.02);
        }
      } else {
        const hz = score.midiToHz(n.midi);
        const o = ctx.createOscillator();
        if (track.instrument === 'pluck') {
          if (wave === undefined) wave = pluckWave(ctx);
          if (wave) o.setPeriodicWave(wave); else o.type = 'triangle';
        } else {
          o.type = 'sine';
        }
        o.frequency.setValueAtTime(hz, at);
        o.connect(g);
        o.start(at);
        o.stop(stop + 0.02);
        if (track.instrument === 'pluck') {
          
          const tg = envelope(ctx, at, peak * TINE.gain, TINE.attack, TINE.decay);
          tg.connect(bus);
          const t = ctx.createOscillator();
          t.type = 'sine';
          t.frequency.setValueAtTime(hz * TINE.ratio, at);
          t.connect(tg);
          t.start(at);
          t.stop(at + TINE.attack + TINE.decay + 0.02);
        }
      }
      if (stop > end) end = stop;
    }
  }
  
  return verb ? end + REVERB_S : end;
}









export async function renderArrangement(arr, {
  score,
  mix,
  rate = RENDER_RATE,
  Offline = (typeof globalThis === 'undefined' ? null : (globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext)),
  clock = (typeof performance === 'undefined' ? Date : performance),
  
  
  
  room = true,
} = {}) {
  if (!score || !mix) throw new Error('renderArrangement needs the score and mix tables from web-engine/moon/audio');
  if (!Offline) throw new Error('renderArrangement needs an OfflineAudioContext');
  const t0 = clock.now();
  const loop = score.loopSamplesOf(arr, rate);
  
  
  
  
  
  
  const headroom = Math.ceil(rate * 4.5);
  const ctx = new Offline(1, loop + headroom, rate);
  buildGraph(ctx, arr, score, { room });
  const rendered = await ctx.startRendering();
  const data = rendered.getChannelData(0);
  const folded = score.foldTail(data, loop);
  
  
  mix.normalizePeak(data, mix.CEILING.music, loop);
  return {
    id: arr.id,
    buffer: rendered,
    loopSamples: loop,
    
    loopSeconds: score.loopSecondsOf(arr, rate),
    rate,
    folded,
    peak: mix.peakOf(data, loop),
    ms: Math.round(clock.now() - t0),
  };
}










export function createMusic({
  audio,
  score,
  mix,
  rate = RENDER_RATE,
  fadeS = FADE_S,
  afterFrames = AFTER_FRAMES,
  render = renderArrangement,
  Offline,
} = {}) {
  if (!score || !mix) throw new Error('createMusic needs the score and mix tables from web-engine/moon/audio');
  const ready = new Map();          
  const ms = {};                    
  const counts = { renders: 0, errors: 0, fades: 0, starts: 0 };
  const live = [];                  
  let want = null;
  let rendering = null;
  let lastError = '';

  
  
  
  function stopFaded(now) {
    for (let i = live.length - 1; i >= 0; i -= 1) {
      if (live[i].until <= now) {
        
        
        
        try { live[i].src.stop(now); } catch {  }
        live.splice(i, 1);
      }
    }
  }

  function ramp(gain, to, seconds, ctx) {
    const now = ctx.currentTime;
    gain.gain.cancelScheduledValues(now);
    gain.gain.setValueAtTime(Math.max(gain.gain.value, FLOOR), now);
    gain.gain.linearRampToValueAtTime(to, now + seconds);
  }

  
  function crossFadeTo(entry) {
    const ctx = audio.ctx;
    const bus = audio.music;
    if (!ctx || !bus) return false;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(FLOOR, now);
    gain.gain.linearRampToValueAtTime(1, now + fadeS);
    gain.connect(bus);

    const src = ctx.createBufferSource();
    src.buffer = entry.buffer;
    src.loop = true;
    src.loopStart = 0;
    
    
    
    src.loopEnd = entry.loopSeconds;
    src.connect(gain);
    src.start(now);

    for (const old of live) {
      ramp(old.gain, FLOOR, fadeS, ctx);
      old.until = now + fadeS + 0.2;
      counts.fades += 1;
    }
    live.push({ id: entry.id, src, gain, until: Infinity });
    counts.starts += 1;
    return true;
  }

  async function renderOne(id, arr) {
    rendering = id;
    try {
      const entry = await render(arr, { score, mix, rate, Offline });
      ready.set(id, entry);
      ms[id] = entry.ms;
      counts.renders += 1;
    } catch (e) {
      counts.errors += 1;
      lastError = String((e && e.message) || e);
    } finally {
      rendering = null;
    }
  }

  return {
    



    tick({ frames = Infinity, season = 'summer', night = false } = {}) {
      const arr = score.arrangementFor(season, night);
      want = arr.id;
      if (frames < afterFrames) return false;
      if (!ready.has(want) && rendering === null) renderOne(want, arr);

      const ctx = audio && audio.ctx;
      if (!ctx || !audio.music) return false;
      stopFaded(ctx.currentTime);
      const playing = live.length ? live[live.length - 1].id : null;
      if (playing === want) return false;
      const entry = ready.get(want);
      if (!entry) return false;
      try { return crossFadeTo(entry); } catch (e) {
        counts.errors += 1;
        lastError = String((e && e.message) || e);
        return false;
      }
    },

    
    get state() {
      const entry = ready.get(want);
      return {
        want,
        playing: live.length ? live[live.length - 1].id : null,
        live: live.length,
        rendering,
        rendered: [...ready.keys()],
        loopSeconds: entry ? entry.loopSeconds : 0,
        bufferSeconds: entry ? entry.buffer.duration : 0,
        peak: entry ? entry.peak : 0,
        rate,
        ms: { ...ms },
        ...counts,
        error: lastError,
      };
    },

    
    prepare(id) {
      const arr = score.ARRANGEMENTS[id];
      if (!arr) return Promise.resolve(null);
      if (ready.has(id)) return Promise.resolve(ready.get(id));
      return renderOne(id, arr).then(() => ready.get(id) || null);
    },

    
    stop() {
      const now = audio && audio.ctx ? audio.ctx.currentTime : 0;
      for (const v of live) {
        try { v.src.stop(now); } catch {  }
      }
      live.length = 0;
      return true;
    },
  };
}
