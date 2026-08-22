














const NOTE = {
  F2: 87.31, G2: 98.00, A2: 110.00, C3: 130.81, D3: 146.83, E3: 164.81,
  F3: 174.61, G3: 196.00, A3: 220.00, C4: 261.63, D4: 293.66, E4: 329.63,
  F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33,
  E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00,
};

const BPM = 150;
const BEAT = 60 / BPM;








function melody() {
  const rest2bars = [[null, 4], [null, 4]];
  const verse4 = [
    
    [NOTE.A4, 0.5], [NOTE.C5, 0.5], [NOTE.E5, 0.5], [NOTE.C5, 0.5],
    [NOTE.A4, 0.5], [NOTE.C5, 0.5], [NOTE.E5, 1.0],
    
    [NOTE.F4, 0.5], [NOTE.A4, 0.5], [NOTE.C5, 0.5], [NOTE.A4, 0.5],
    [NOTE.F4, 0.5], [NOTE.A4, 0.5], [NOTE.C5, 1.0],
    
    [NOTE.E5, 0.5], [NOTE.D5, 0.5], [NOTE.C5, 0.5], [NOTE.D5, 0.5],
    [NOTE.E5, 0.5], [NOTE.G5, 0.5], [NOTE.E5, 1.0],
    
    [NOTE.D5, 0.5], [NOTE.B4, 0.5], [NOTE.G4, 0.5], [NOTE.B4, 0.5],
    [NOTE.D5, 0.5], [NOTE.B4, 0.5], [NOTE.D5, 1.0],
  ];
  const hook4 = [
    
    [NOTE.E5, 0.25], [NOTE.E5, 0.25], [NOTE.E5, 0.5], [NOTE.C5, 0.5],
    [NOTE.E5, 0.5], [NOTE.A5, 1.0], [NOTE.G5, 0.5], [NOTE.E5, 0.5],
    
    [NOTE.F5, 0.5], [NOTE.E5, 0.5], [NOTE.C5, 0.5], [NOTE.A4, 0.5],
    [NOTE.F5, 0.5], [NOTE.E5, 0.5], [NOTE.C5, 1.0],
    
    [NOTE.G5, 0.5], [NOTE.E5, 0.5], [NOTE.C5, 0.5], [NOTE.E5, 0.5],
    [NOTE.G5, 0.5], [NOTE.A5, 0.5], [NOTE.G5, 1.0],
    
    [NOTE.B4, 0.25], [NOTE.C5, 0.25], [NOTE.D5, 0.5], [NOTE.G5, 0.5],
    [NOTE.F5, 0.5], [NOTE.D5, 0.5], [NOTE.B4, 0.5], [NOTE.G4, 1.0],
  ];
  const outro = [
    [NOTE.A4, 0.5], [NOTE.C5, 0.5], [NOTE.E5, 0.5], [NOTE.A5, 0.5],
    [NOTE.G5, 0.5], [NOTE.E5, 0.5], [NOTE.C5, 0.5], [NOTE.A4, 0.5],
    [NOTE.A4, 2.0], [null, 2.0],
  ];
  return [...rest2bars, ...verse4, ...verse4, ...hook4, ...hook4, ...outro];
}


const CHORDS = {
  Am: [NOTE.A2, NOTE.A3, NOTE.E3],
  F:  [NOTE.F2, NOTE.F3, NOTE.C3],
  C:  [NOTE.C3, NOTE.C4, NOTE.G3],
  G:  [NOTE.G2, NOTE.G3, NOTE.D3],
};
const PROG = ['Am', 'F', 'C', 'G'];
function chordAtBar(bar) {
  if (bar < 2 || bar >= 18) return CHORDS.Am;     
  return CHORDS[PROG[(bar - 2) % 4]];
}


function bass() {
  const out = [];
  for (let bar = 0; bar < 20; bar++) {
    const [root, oct, fifth] = chordAtBar(bar);
    const pat = [root, root, oct, root, root, root, oct, fifth];
    for (const n of pat) out.push([n, 0.5]);
  }
  return out;
}




function harmony() {
  const out = [];
  for (let bar = 0; bar < 20; bar++) {
    if (bar < 10 || bar >= 18) { out.push([null, 4]); continue; }
    const [, oct] = chordAtBar(bar);
    const third = oct * Math.pow(2, 3 / 12);   
    const fifth = oct * Math.pow(2, 7 / 12);
    const top   = oct * 2;
    const arp = [oct, third, fifth, top, fifth, third, oct, fifth];
    for (const n of arp) out.push([n, 0.5]);
  }
  return out;
}

const totalBeats = (seq) => seq.reduce((s, [, b]) => s + b, 0);

export class Chiptune {
  constructor() {
    this.muted = localStorage.getItem('tb.muted') === '1';
    this._audio = null;
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
      a.loop = true;
      a.setAttribute('playsinline', '');
      a.volume = this.muted ? 0 : 0.35;
      this._audio = a;
      try { await a.play(); return; } catch (err) {
        console.warn('HTMLAudio play refused (will retry on next tap):', err);
        return;   
      }
    }
    if (!url && !this._fallbackCtx) this._startFallback();
  }

  _startFallback() {
    if (this._fallbackPlaying) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    this._fallbackCtx = new Ctx();
    this._fallbackMaster = this._fallbackCtx.createGain();
    this._fallbackMaster.gain.value = this.muted ? 0 : 0.20;
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
    while (this._fallbackNextAt < this._fallbackCtx.currentTime + 2.0) {
      
      if (!this._barIdx) this._barIdx = 0;
      const bar = this._barIdx++;
      const roots = [NOTE.A2, NOTE.F2, NOTE.C3, NOTE.G2];   
      const root = roots[bar % 4];
      for (let e = 0; e < 8; e++) {
        this._fbNote(root, this._fallbackNextAt + e * (BEAT / 2), (BEAT / 2) * 0.92, 'sawtooth', 0.20);
      }
      const mel = melody();
      let t = this._fallbackNextAt;
      let idxOff = (bar % 4) * 8;
      let left = 4;
      while (left > 0 && idxOff < mel.length) {
        const [n, b] = mel[idxOff++];
        if (b > left) break;
        if (n) this._fbNote(n, t, b * BEAT * 0.9, 'square', 0.16);
        t += b * BEAT;
        left -= b;
      }
      this._fallbackNextAt += 4 * BEAT;
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

  async _render() {
    const mel = melody(); const bs = bass(); const harm = harmony();
    const BARS = 20;
    const dur = BARS * 4 * BEAT + 0.4;
    const sampleRate = 44100;
    const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!Offline) throw new Error('no OfflineAudioContext');
    const ctx = new Offline(2, Math.ceil(dur * sampleRate), sampleRate);
    const master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    
    const ampBus = ctx.createGain(); ampBus.gain.value = 1.0;
    const shaper = ctx.createWaveShaper(); shaper.curve = _distortionCurve(50);
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass'; lowpass.frequency.value = 2200; lowpass.Q.value = 0.7;
    ampBus.connect(shaper).connect(lowpass).connect(master);
    
    const leadBus = ctx.createGain(); leadBus.gain.value = 1.0;
    leadBus.connect(master);
    const delay = ctx.createDelay(1.0); delay.delayTime.value = BEAT * 0.75;
    const fb = ctx.createGain(); fb.gain.value = 0.28;
    const wet = ctx.createGain(); wet.gain.value = 0.25;
    leadBus.connect(delay); delay.connect(fb).connect(delay);
    delay.connect(wet).connect(master);

    _scheduleVoice(ctx, leadBus, mel,  'square',   0.16);   
    _scheduleVoice(ctx, ampBus,  bs,   'sawtooth', 0.22);   
    _scheduleVoice(ctx, master,  harm, 'triangle', 0.12);   
    _scheduleDrums(ctx, master, BARS);
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
    localStorage.setItem('tb.muted', muted ? '1' : '0');
    if (this._audio) this._audio.volume = muted ? 0 : 0.35;
    if (this._fallbackMaster) this._fallbackMaster.gain.value = muted ? 0 : 0.20;
  }

  toggleMuted() { this.setMuted(!this.muted); return this.muted; }

  
  
  
  get isPlaying() {
    if (this._audio && !this._audio.paused) return true;
    return this._fallbackPlaying
      && !!this._fallbackCtx
      && this._fallbackCtx.state === 'running';
  }
}





function _scheduleDrums(ctx, dest, bars) {
  const noiseBuf = (() => {
    const b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * 0.3), ctx.sampleRate);
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
  const kick = (when) => {
    const osc = ctx.createOscillator(); const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(130, when);
    osc.frequency.exponentialRampToValueAtTime(45, when + 0.11);
    g.gain.setValueAtTime(0.5, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.13);
    osc.connect(g).connect(dest);
    osc.start(when); osc.stop(when + 0.15);
  };
  for (let bar = 0; bar < bars; bar++) {
    const t0 = bar * 4 * BEAT;
    kick(t0); kick(t0 + 2 * BEAT);
    if (bar % 4 === 3) kick(t0 + 3.5 * BEAT);            
    if (bar >= 1) {                                        
      noise(t0 + 1 * BEAT, 0.10, 'bandpass', 1800, 0.30); 
      noise(t0 + 3 * BEAT, 0.10, 'bandpass', 1800, 0.30);
    }
    for (let e = 0; e < 8; e++) {                          
      noise(t0 + e * BEAT * 0.5, 0.03, 'highpass', 7000, e % 2 ? 0.10 : 0.15);
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

function _scheduleVoice(ctx, dest, seq, type, peakGain) {
  let t = 0;
  for (const [note, beats] of seq) {
    if (note != null) {
      const dur = beats * BEAT * 0.92;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type; osc.frequency.value = note;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(peakGain, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(dest);
      osc.start(t); osc.stop(t + dur + 0.05);
    }
    t += beats * BEAT;
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
