// Fast chiptune loop delivered via HTMLAudioElement + loop=true.
//
// Why not raw Web Audio scheduling?
//   * On iOS Safari, an AudioContext is muted by the physical silent switch;
//     HTMLAudioElement plays through the media session, so background music
//     survives the silent switch AND survives a tab backgrounding.
//   * <audio> with a base64/data-URI src also loads reliably on iOS without
//     needing to await OfflineAudioContext.startRendering (which sometimes
//     fails silently on iOS if the tab hasn't been touched recently).
//
// The music is a WAV rendered ONCE by OfflineAudioContext at start-time,
// then handed to <audio loop playsinline>. If the offline render fails, we
// fall back to Web Audio scheduling so at least SOMETHING plays in the
// foreground.

const NOTE = {
  A2: 110.00, C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.00,
  A3: 220.00, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.00, A4: 440.00, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99,
};

const BPM = 168;
const BEAT = 60 / BPM;

function melody() {
  return [
    [NOTE.A4, 0.5], [NOTE.E5, 0.5], [NOTE.C5, 0.5], [NOTE.E5, 0.5],
    [NOTE.B4, 0.5], [NOTE.D5, 0.5], [NOTE.A4, 0.5], [NOTE.C5, 0.5],
    [NOTE.A4, 0.5], [NOTE.E5, 0.5], [NOTE.C5, 0.5], [NOTE.G5, 0.5],
    [NOTE.E5, 0.5], [NOTE.C5, 0.5], [NOTE.A4, 1.0],
    [NOTE.A4, 0.25], [NOTE.B4, 0.25], [NOTE.C5, 0.25], [NOTE.D5, 0.25],
    [NOTE.E5, 0.5],  [NOTE.D5, 0.5],  [NOTE.C5, 0.5],  [NOTE.B4, 0.5],
    [NOTE.E5, 0.5], [NOTE.D5, 0.5], [NOTE.C5, 0.5], [NOTE.A4, 0.5],
    [NOTE.G4, 0.5], [NOTE.A4, 0.5], [NOTE.E4, 1.0],
  ];
}
function bass() {
  const roots = [NOTE.A2, NOTE.C3, NOTE.G3, NOTE.E3];
  const out = [];
  for (let bar = 0; bar < 8; bar++) {
    const r = roots[bar % 4];
    for (let e = 0; e < 8; e++) out.push([r, 0.5]);
  }
  return out;
}
const totalBeats = (seq) => seq.reduce((s, [, b]) => s + b, 0);

export class Chiptune {
  constructor() {
    this.muted = localStorage.getItem('tb.muted') === '1';
    this._audio = null;
    this._url = null;
    // Rendering starts eagerly (not gesture-gated) so the WAV is ready to
    // play the moment we get a gesture.
    this._renderPromise = this._render().catch((err) => {
      console.warn('Chiptune render failed:', err);
      return null;
    });
    // Fallback Web Audio scheduling if HTMLAudio never fires.
    this._fallbackCtx = null;
    this._fallbackMaster = null;
    this._fallbackPlaying = false;
    this.started = false;
  }

  async start() {
    if (this.started) return;
    this.started = true;
    const url = await this._renderPromise;
    if (url) {
      const a = new Audio(url);
      a.loop = true;
      a.setAttribute('playsinline', '');
      a.volume = this.muted ? 0 : 0.35;
      this._audio = a;
      try { await a.play(); return; } catch (err) {
        console.warn('HTMLAudio play refused:', err);
      }
    }
    // Fallback: Web Audio scheduling.
    this._startFallback();
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
      // Play one bar (4 beats) at _fallbackNextAt, then advance.
      if (!this._barIdx) this._barIdx = 0;
      const bar = this._barIdx++;
      const roots = [NOTE.A2, NOTE.C3, NOTE.G3, NOTE.E3];
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
    const mel = melody(); const bs = bass();
    const dur = Math.max(totalBeats(mel), totalBeats(bs)) * BEAT + 0.2;
    const sampleRate = 44100;
    const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    if (!Offline) throw new Error('no OfflineAudioContext');
    const ctx = new Offline(2, Math.ceil(dur * sampleRate), sampleRate);
    const master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
    _scheduleVoice(ctx, master, mel, 'square', 0.16);
    _scheduleVoice(ctx, master, bs,  'sawtooth', 0.22);
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

  // Public status used by "Tap to enable sound" UI in game.js.
  get isPlaying() {
    if (this._audio) return !this._audio.paused;
    return this._fallbackPlaying;
  }
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
