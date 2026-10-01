


























import {
  buildSong, midiToHz, VOICES, VOICE_NAMES, openingTrackFor, nextTrackName,
} from '../../../../web-engine/audio/songSpec.js';
import { settingsFor, trackFor, shouldSwitchTrack } from '../../../../web-engine/audio/scenarioMusic.js';
import { SeededRng } from '../../../../web-engine/rng/seededRng.js';


















const MUSIC_LEVEL_TAG = 0.52;
const MUSIC_LEVEL_SYNTH = 0.34;




const DUCK_DEPTH = 0.28;
const DUCK_RELEASE_MS = 320;













const MUTE_KEY = 'tb.muted';





function readMutePref() {
  try { return localStorage.getItem(MUTE_KEY) === '1'; } catch { return false; }
}
function writeMutePref(muted) {
  try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch {  }
}

export class Chiptune {
  
  
  
  
  
  
  constructor({ seed = 0, map } = {}) {
    
    
    
    
    this.muted = readMutePref();
    this._songKey = `${map || ''}#${seed}`;
    this._map = map;
    this._seed = seed;
    
    
    this._track = openingTrackFor(map);
    this._rotRng = new SeededRng((seed || 1) * 7919 + 13).child('tracks');
    this.song = buildSong({ seed, map, track: this._track });
    this._audio = null;
    
    
    this._scenario = 'play';
    this._scenarioGain = 1;
    this._brightness = 0.72;
    this._url = null;
    
    
    this._renderPromise = this._render().catch((err) => {
      console.warn('Chiptune render failed:', err);
      return null;
    });
    
    this._fallbackCtx = null;
    this._fallbackMaster = null;
    this._fallbackPlaying = false;
    this.started = false;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  reseed({ seed = 0, map } = {}) {
    const key = `${map || ''}#${seed}`;
    if (key === this._songKey) return false;
    this._songKey = key;
    this._map = map;
    this._seed = seed;
    this._track = openingTrackFor(map);
    this.song = buildSong({ seed, map, track: this._track });
    if (this.started) return false;          
    this._renderPromise = this._render().catch((err) => {
      console.warn('Chiptune re-render failed:', err);
      return null;
    });
    return true;
  }

  
  
  
  
  
  
  
  async start() {
    
    if (this._fallbackCtx && this._fallbackCtx.state === 'suspended') {
      try { await this._fallbackCtx.resume(); } catch (_) {}
      if (this._fallbackCtx.state === 'running') return;
    }
    if (this.isPlaying) return;
    
    
    if (this._audio) {
      try { await this._audio.play(); return; } catch (_) {}
    }
    
    
    
    const url = this._url || await this._renderPromise;
    if (url && !this._audio) {
      const a = new Audio(url);
      
      
      
      
      
      
      a.loop = false;
      a.addEventListener('ended', () => this._advanceTrack());
      a.setAttribute('playsinline', '');
      a.volume = this.muted ? 0 : MUSIC_LEVEL_TAG;
      this._audio = a;
      try { await a.play(); return; } catch (err) {
        console.warn('HTMLAudio play refused (will retry on next tap):', err);
        return;   
      }
    }
    if (!url && !this._fallbackCtx) this._startFallback();
  }

  
  
  
  
  
  
  
  
  
  async _advanceTrack() {
    const next = this._nextUrl ? this._nextTrackName : this._track;
    const url = this._nextUrl || this._url;
    this._track = next;
    this._nextUrl = null;
    if (this._audio && url) {
      this._audio.src = url;
      this._audio.currentTime = 0;
      try { await this._audio.play(); } catch (_) {}
    }
    this._prefetchNext();
  }

  
  _prefetchNext() {
    if (this._prefetching) return;
    this._prefetching = true;
    const name = nextTrackName(this._track, this._rotRng);
    this._nextTrackName = name;
    const song = buildSong({ seed: this._seed, map: this._map, track: name });
    Promise.resolve()
      .then(() => this._renderSong(song))
      .then((url) => { this._nextUrl = url; })
      .catch((err) => console.warn('Chiptune prefetch failed:', err))
      .finally(() => { this._prefetching = false; });
  }

  _startFallback() {
    if (this._fallbackPlaying) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this._fallbackCtx = new Ctx();
    this._fallbackMaster = this._fallbackCtx.createGain();
    this._fallbackMaster.gain.value = this.muted ? 0 : MUSIC_LEVEL_SYNTH;
    this._fallbackMaster.connect(this._fallbackCtx.destination);
    if (this._fallbackCtx.state === 'suspended') {
      this._fallbackCtx.resume().catch(() => {});
    }
    this._fallbackPlaying = true;
    this._fallbackNextAt = this._fallbackCtx.currentTime + 0.05;
    this._fallbackPump();
  }

  
  
  
  
  
  _fallbackPump() {
    if (!this._fallbackPlaying || !this._fallbackCtx) return;
    const beat = this.song.beatSec;
    const riff = this.song.riff;
    const riffBeats = riff.reduce((s, [, b]) => s + b, 0);
    while (this._fallbackNextAt < this._fallbackCtx.currentTime + 2.0) {
      let t = this._fallbackNextAt;
      for (const [midi, beats] of riff) {
        if (midi != null) {
          this._fbNote(midiToHz(midi), t, beats * beat * VOICES.guitar.gate,
            VOICES.guitar.wave, VOICES.guitar.gain);
          this._fbNote(midiToHz(midi - 12), t, beats * beat * VOICES.bass.gate,
            VOICES.bass.wave, VOICES.bass.gain);
        }
        t += beats * beat;
      }
      
      
      for (let b = 0; b < riffBeats; b++) {
        this._fbKick(this._fallbackNextAt + b * beat);
      }
      this._fallbackNextAt += riffBeats * beat;
    }
    setTimeout(() => this._fallbackPump(), 500);
  }

  _fbNote(freq, when, dur, type, peakGain) {
    const osc = this._fallbackCtx.createOscillator();
    const gain = this._fallbackCtx.createGain();
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, when);
    gain.gain.linearRampToValueAtTime(peakGain, when + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain).connect(this._fallbackMaster);
    osc.start(when); osc.stop(when + dur + 0.05);
  }

  _fbKick(when) {
    const ctx = this._fallbackCtx;
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, when);
    osc.frequency.exponentialRampToValueAtTime(42, when + 0.09);
    g.gain.setValueAtTime(0.5, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.12);
    osc.connect(g).connect(this._fallbackMaster);
    osc.start(when); osc.stop(when + 0.14);
  }

  
  
  
  
  async _render() { return this._renderSong(this.song); }

  async _renderSong(song) {
    const beat = song.beatSec;
    const dur = song.durationSec + 0.4;
    const sampleRate = 44100;
    const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!Offline) throw new Error('no OfflineAudioContext');
    const ctx = new Offline(2, Math.ceil(dur * sampleRate), sampleRate);
    
    
    
    
    const master = ctx.createGain();
    
    
    
    
    
    
    
    
    
    
    
    master.gain.value = 0.78 * (song.gainScale ?? 1);
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1.5;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.15;
    master.connect(limiter).connect(ctx.destination);

    
    
    
    
    
    const ampBus = ctx.createGain(); ampBus.gain.value = 1.0;
    const shaper = ctx.createWaveShaper(); shaper.curve = _distortionCurve(90);
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const bright = Math.max(0, Math.min(1, this._brightness ?? 0.72));
    lowpass.frequency.value = 1500 + bright * 1900;
    lowpass.Q.value = 0.7;
    ampBus.connect(shaper).connect(lowpass).connect(master);

    
    const leadBus = ctx.createGain(); leadBus.gain.value = 1.0;
    leadBus.connect(master);
    const delay = ctx.createDelay(1.0); delay.delayTime.value = beat * 0.75;
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    const wet = ctx.createGain(); wet.gain.value = 0.25;
    leadBus.connect(delay); delay.connect(fb).connect(delay);
    delay.connect(wet).connect(master);

    const buses = { amp: ampBus, lead: leadBus, clean: master };
    for (const name of VOICE_NAMES) {
      const voice = VOICES[name];
      _scheduleVoice(ctx, buses[voice.bus], song.voices[name], voice, beat);
    }
    _scheduleDrums(ctx, master, song.drums, beat);

    const buffer = await ctx.startRendering();
    const wav = _bufferToWav(buffer);
    const blob = new Blob([wav], { type: 'audio/wav' });
    this._url = URL.createObjectURL(blob);
    return this._url;
  }

  stop() {
    if (this._audio) this._audio.pause();
    this._fallbackPlaying = false;
  }

  setMuted(muted) {
    this.muted = muted;
    writeMutePref(muted);
    this._duckUntil = 0;
    this._applyLevel();
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  duck(seconds = 1.1, depth = DUCK_DEPTH) {
    const ms = Math.max(0, Number(seconds) || 0) * 1000 + DUCK_RELEASE_MS;
    this._duckDepth = Math.max(0, Math.min(1, depth));
    this._duckUntil = Math.max(this._duckUntil || 0, Date.now() + ms);
    this._applyLevel();
    clearTimeout(this._duckTimer);
    this._duckTimer = setTimeout(() => {
      this._duckUntil = 0;
      this._applyLevel();
    }, Math.max(0, this._duckUntil - Date.now()));
  }

  
  _applyLevel() {
    const ducked = (this._duckUntil || 0) > Date.now();
    const k = this.muted ? 0 : (ducked ? (this._duckDepth ?? DUCK_DEPTH) : 1);
    
    
    
    
    
    const scen = this._scenarioGain ?? 1;
    if (this._audio) {
      this._audio.volume = Math.max(0, Math.min(1, MUSIC_LEVEL_TAG * k * scen));
    }
    if (this._fallbackMaster) {
      const g = this._fallbackMaster.gain;
      const target = MUSIC_LEVEL_SYNTH * k;
      
      
      if (typeof g.setTargetAtTime === 'function' && this._fallbackCtx) {
        g.setTargetAtTime(target, this._fallbackCtx.currentTime, 0.05);
      } else {
        g.value = target;
      }
    }
  }

  toggleMuted() { this.setMuted(!this.muted); return this.muted; }

  









  setScenario(name) {
    if (name === this._scenario) return;
    const from = this._scenario;
    this._scenario = name;
    const s = settingsFor(name);
    this._scenarioGain = s.gain;
    this._brightness = s.brightness;
    this._applyLevel();
    if (shouldSwitchTrack(from, name) && this._audio) {
      
      
      
      
      
      const want = trackFor(name, this._map, this._track);
      this._nextTrackName = want;
      this._nextUrl = null;
      this._prefetching = true;
      const song = buildSong({ seed: this._seed, map: this._map, track: want });
      Promise.resolve()
        .then(() => this._renderSong(song))
        .then((url) => {
          this._nextUrl = url;
          this._prefetching = false;
          if (this._scenario === name) this._advanceTrack();
        })
        .catch(() => { this._prefetching = false; });
    }
  }

  
  get isDucked() { return (this._duckUntil || 0) > Date.now(); }

  
  
  
  get isPlaying() {
    if (this._audio && !this._audio.paused) return true;
    return this._fallbackPlaying
      && !!this._fallbackCtx
      && this._fallbackCtx.state === 'running';
  }
}






function _scheduleDrums(ctx, dest, events, beat) {
  const noiseBuf = (() => {
    const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 1.2), ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return b;
  })();
  const noise = (when, dur, filterType, freq, gainPeak) => {
    const src = ctx.createBufferSource(); src.buffer = noiseBuf;
    const f = ctx.createBiquadFilter(); f.type = filterType; f.frequency.value = freq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gainPeak, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    src.connect(f).connect(g).connect(dest);
    src.start(when); src.stop(when + dur + 0.02);
  };
  const kick = (when, gain) => {
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = 'sine';
    
    
    osc.frequency.setValueAtTime(150, when);
    osc.frequency.exponentialRampToValueAtTime(42, when + 0.095);
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.12);
    osc.connect(g).connect(dest);
    osc.start(when); osc.stop(when + 0.14);
  };
  for (const e of events) {
    const when = e.beat * beat;
    switch (e.drum) {
      case 'kick':    kick(when, e.gain); break;
      case 'snare':
        
        
        
        
        noise(when, 0.09, 'bandpass', 1900, e.gain);
        for (const [hz, lvl] of [[186, 0.5], [278, 0.3]]) {
          const b = ctx.createOscillator();
          const bg = ctx.createGain();
          b.type = 'triangle';
          b.frequency.setValueAtTime(hz, when);
          b.frequency.exponentialRampToValueAtTime(hz * 0.72, when + 0.07);
          bg.gain.setValueAtTime(e.gain * lvl, when);
          bg.gain.exponentialRampToValueAtTime(0.001, when + 0.09);
          b.connect(bg).connect(dest);
          b.start(when); b.stop(when + 0.10);
        }
        break;
      case 'hat':     noise(when, 0.025, 'highpass', 7500, e.gain); break;
      case 'openhat': noise(when, 0.18, 'highpass', 6500, e.gain); break;
      case 'crash':   noise(when, 0.90, 'highpass', 4200, e.gain); break;
      default: break;
    }
  }
}


function _distortionCurve(amount) {
  const n = 4096;
  const curve = new Float32Array(n);
  const k = amount;
  const deg = Math.PI / 180;
  for (let i = 0; i < n; i++) {
    const x = i * 2 / n - 1;
    curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
  }
  return curve;
}










export function _scheduleVoice(ctx, dest, seq, voice, beat) {
  
  
  
  
  
  
  
  
  let out = dest;
  if (voice.pan) {
    try {
      const pan = ctx.createStereoPanner();
      pan.pan.value = Math.max(-1, Math.min(1, voice.pan));
      pan.connect(dest);
      out = pan;
    } catch (_) {  }
  }

  const unison = Math.max(1, voice.unison | 0 || 1);
  const detune = voice.detune ?? 0;
  const attack = voice.attack ?? 0.004;
  const release = voice.release ?? 0.04;

  let t = 0;
  for (const [midi, beats] of seq) {
    if (midi != null) {
      const dur = beats * beat * voice.gate;
      const hz = midiToHz(midi);

      
      
      
      
      
      const onBeat = Math.abs(t / beat - Math.round(t / beat)) < 0.02;
      const level = voice.gain * (onBeat ? 1 + (voice.accent ?? 0) : 1);

      
      
      
      
      let sink = out;
      if (voice.cutoff) {
        const f = ctx.createBiquadFilter();
        f.type = 'lowpass';
        f.Q.value = voice.q ?? 1;
        const top = voice.cutoff + (voice.cutoffEnv ?? 0);
        f.frequency.setValueAtTime(top, t);
        f.frequency.exponentialRampToValueAtTime(
          Math.max(60, voice.cutoff), t + Math.max(0.02, dur * 0.6));
        f.connect(out);
        sink = f;
      }

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(level, t + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur + release);
      gain.connect(sink);

      
      
      
      
      for (let u = 0; u < unison; u += 1) {
        const osc = ctx.createOscillator();
        osc.type = voice.wave;
        osc.frequency.value = hz;
        if (unison > 1 && detune) {
          osc.detune.value = -detune + (2 * detune * u) / (unison - 1);
        }
        
        
        const uG = ctx.createGain();
        uG.gain.value = 1 / unison;
        osc.connect(uG);

        
        
        
        
        
        
        
        
        
        if (voice.wide && unison > 1) {
          try {
            const wp = ctx.createStereoPanner();
            wp.pan.value = -voice.wide + (2 * voice.wide * u) / (unison - 1);
            uG.connect(wp).connect(gain);
          } catch (_) { uG.connect(gain); }
        } else {
          uG.connect(gain);
        }
        osc.start(t);
        osc.stop(t + dur + release + 0.05);
      }

      
      
      
      
      if (voice.sub) {
        const sub = ctx.createOscillator();
        sub.type = 'sine';
        sub.frequency.value = hz / 2;
        const sg = ctx.createGain();
        sg.gain.value = voice.sub;
        sub.connect(sg).connect(gain);
        sub.start(t);
        sub.stop(t + dur + release + 0.05);
      }
    }
    t += beats * beat;
  }
}

function _bufferToWav(buffer) {
  const numCh = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const samples = buffer.length;
  const bpS = 2;
  const dataSize = samples * numCh * bpS;
  const bufLen = 44 + dataSize;
  const out = new ArrayBuffer(bufLen);
  const view = new DataView(out);
  const write = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  write(0, 'RIFF'); view.setUint32(4, bufLen - 8, true);
  write(8, 'WAVE'); write(12, 'fmt '); view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); view.setUint16(22, numCh, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * numCh * bpS, true);
  view.setUint16(32, numCh * bpS, true); view.setUint16(34, 16, true);
  write(36, 'data'); view.setUint32(40, dataSize, true);
  let offset = 44;
  const chans = [];
  for (let c = 0; c < numCh; c++) chans.push(buffer.getChannelData(c));
  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < numCh; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return new Uint8Array(out);
}
