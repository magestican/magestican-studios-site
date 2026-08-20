// Fast, addictive chiptune loop.
//
// Rendered ONCE via an OfflineAudioContext into a WAV buffer, then handed to
// an <audio> element with loop=true. This lets iOS Safari keep playing when
// the tab is backgrounded (Web Audio's AudioContext is suspended in the
// background, but an <audio> element with real audio data can continue).
//
// The tune itself: 168 BPM, driving 8th- and 16th-note melody over
// straight-eighth bass. Loop is ~11 seconds so the hook keeps returning
// before it gets stale.

const NOTE = {
  A2: 110.00, C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.00,
  A3: 220.00, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
};

const BPM = 168;
const BEAT = 60 / BPM;

function melody() {
  return [
    // hookA
    [NOTE.A4, 0.5], [NOTE.E5, 0.5], [NOTE.C5, 0.5], [NOTE.E5, 0.5],
    [NOTE.B4, 0.5], [NOTE.D5, 0.5], [NOTE.A4, 0.5], [NOTE.C5, 0.5],
    // hookA'
    [NOTE.A4, 0.5], [NOTE.E5, 0.5], [NOTE.C5, 0.5], [NOTE.G5, 0.5],
    [NOTE.E5, 0.5], [NOTE.C5, 0.5], [NOTE.A4, 1.0],
    // hookB: 16ths climb
    [NOTE.A4, 0.25], [NOTE.B4, 0.25], [NOTE.C5, 0.25], [NOTE.D5, 0.25],
    [NOTE.E5, 0.5],  [NOTE.D5, 0.5],  [NOTE.C5, 0.5],  [NOTE.B4, 0.5],
    // hookC: descent
    [NOTE.E5, 0.5], [NOTE.D5, 0.5], [NOTE.C5, 0.5], [NOTE.A4, 0.5],
    [NOTE.G4, 0.5], [NOTE.A4, 0.5], [NOTE.E4, 1.0],
  ];
}

function bass() {
  const roots = [NOTE.A2, NOTE.C3, NOTE.G3, NOTE.E3];
  const out = [];
  for (let bar = 0; bar < 8; bar++) {
    const r = roots[bar % 4];
    for (let e = 0; e < 4; e++) out.push([r, 0.5]);
  }
  return out;
}

function totalBeats(seq) { return seq.reduce((s, [, b]) => s + b, 0); }

export class Chiptune {
  constructor() {
    this.muted = localStorage.getItem('tb.muted') === '1';
    this._audio = null;
    this._rendering = null;
  }

  ensureContext() { /* kept for API parity with earlier version */ }

  async start() {
    if (this._audio && !this._audio.paused) return;
    if (!this._audio) {
      if (!this._rendering) this._rendering = renderLoopWav();
      const url = await this._rendering;
      const a = new Audio(url);
      a.loop = true;
      a.volume = this.muted ? 0 : 0.28;
      a.setAttribute('playsinline', '');
      a.crossOrigin = 'anonymous';
      this._audio = a;
    }
    try { await this._audio.play(); } catch { /* browser refused: needs another gesture */ }
  }

  stop() { if (this._audio) this._audio.pause(); }

  setMuted(muted) {
    this.muted = muted;
    localStorage.setItem('tb.muted', muted ? '1' : '0');
    if (this._audio) this._audio.volume = muted ? 0 : 0.28;
  }

  toggleMuted() { this.setMuted(!this.muted); return this.muted; }

  // Legacy `ctx` accessor - the game.js audio-start dance touches it. Keep
  // it as `null`ish so the code paths still short-circuit safely.
  get ctx() { return this._audio ? { state: this._audio.paused ? 'suspended' : 'running', resume: () => this._audio.play() } : null; }
}

// -- Offline render ---------------------------------------------------------

async function renderLoopWav() {
  const mel = melody();
  const bs  = bass();
  const dur = Math.max(totalBeats(mel), totalBeats(bs)) * BEAT + 0.15;
  const sampleRate = 44100;
  const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const ctx = new Offline(2, Math.ceil(dur * sampleRate), sampleRate);
  const master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
  scheduleVoice(ctx, master, mel, 'square', 0.15);
  scheduleVoice(ctx, master, bs,  'sawtooth', 0.20);
  const buffer = await ctx.startRendering();
  const wav = bufferToWav(buffer);
  const blob = new Blob([wav], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

function scheduleVoice(ctx, dest, seq, type, peakGain) {
  let t = 0;
  for (const [note, beats] of seq) {
    if (note != null) {
      const dur = beats * BEAT * 0.92;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = note;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(peakGain, t + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(dest);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    }
    t += beats * BEAT;
  }
}

// Convert AudioBuffer -> 16-bit PCM WAV as Uint8Array.
function bufferToWav(buffer) {
  const numCh = buffer.numberOfChannels;
  const sr = buffer.sampleRate;
  const samples = buffer.length;
  const bytesPerSample = 2;
  const dataSize = samples * numCh * bytesPerSample;
  const bufLen = 44 + dataSize;
  const out = new ArrayBuffer(bufLen);
  const view = new DataView(out);
  const writeStr = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };
  writeStr(0, 'RIFF');
  view.setUint32(4, bufLen - 8, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);       // fmt chunk size
  view.setUint16(20, 1, true);        // PCM
  view.setUint16(22, numCh, true);
  view.setUint32(24, sr, true);
  view.setUint32(28, sr * numCh * bytesPerSample, true);
  view.setUint16(32, numCh * bytesPerSample, true);
  view.setUint16(34, 16, true);       // bits per sample
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);
  let offset = 44;
  const chans = [];
  for (let c = 0; c < numCh; c++) chans.push(buffer.getChannelData(c));
  for (let i = 0; i < samples; i++) {
    for (let c = 0; c < numCh; c++) {
      let s = Math.max(-1, Math.min(1, chans[c][i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      offset += 2;
    }
  }
  return new Uint8Array(out);
}
