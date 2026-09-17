



















import { activityAt, compileMumble, revealAt } from 'moon/voice/mumble.mjs';
import { voiceOf } from 'moon/voice/voices.mjs';


const START_S = 0.03;
const LEVEL = 0.5;

export function createVoice({ audio, now = () => performance.now() / 1000 }) {
  let line = null;
  let noise = null;
  const counts = { lines: 0, syllables: 0, skipped: 0 };

  function noiseBuffer(ctx) {
    if (noise && noise.sampleRate === ctx.sampleRate) return noise;
    noise = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.25), ctx.sampleRate);
    const d = noise.getChannelData(0);
    
    let s = 22222;
    for (let i = 0; i < d.length; i++) { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; d[i] = (s / 4294967296) * 2 - 1; }
    return noise;
  }

  function syllable(ctx, bus, v, e, T) {
    const end = T + e.dur;
    const osc = ctx.createOscillator();
    osc.type = v.wave;
    osc.frequency.setValueAtTime(e.f0, T);
    osc.frequency.linearRampToValueAtTime(e.f0End, end);
    const stops = [osc];
    if (v.vibrato) {
      const lfo = ctx.createOscillator();
      const depth = ctx.createGain();
      lfo.frequency.value = v.vibrato.rateHz;
      depth.gain.value = e.f0 * v.vibrato.depth;
      lfo.connect(depth);
      depth.connect(osc.frequency);
      stops.push(lfo);
    }
    const env = ctx.createGain();
    const peak = LEVEL * e.amp;
    env.gain.setValueAtTime(0.0001, T);
    env.gain.exponentialRampToValueAtTime(peak, T + 0.008);
    env.gain.setValueAtTime(peak, T + e.dur * 0.55);
    env.gain.exponentialRampToValueAtTime(0.0001, end + 0.025);
    env.connect(bus);
    for (const [f, q, g] of [[e.f1, 5, 1], [e.f2, 8, 0.55]]) {
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = f;
      bp.Q.value = q;
      const gain = ctx.createGain();
      gain.gain.value = g;
      osc.connect(bp);
      bp.connect(gain);
      gain.connect(env);
    }
    const body = ctx.createBiquadFilter();
    body.type = 'lowpass';
    body.frequency.value = e.f0 * 2.5;
    const bodyGain = ctx.createGain();
    bodyGain.gain.value = 0.18;
    osc.connect(body);
    body.connect(bodyGain);
    bodyGain.connect(env);

    if (e.burst && v.onset) {
      const o = v.onset;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = o.kind === 'purr' ? 'lowpass' : 'bandpass';
      filter.frequency.value = o.band;
      filter.Q.value = o.kind === 'click' ? 2.5 : 1.1;
      const ng = ctx.createGain();
      ng.gain.setValueAtTime(o.gain * e.amp * LEVEL, T);
      ng.gain.exponentialRampToValueAtTime(0.0001, T + o.dur);
      src.connect(filter);
      if (o.kind === 'purr' && o.rateHz) {
        
        const am = ctx.createGain();
        am.gain.value = 0.5;
        const flutter = ctx.createOscillator();
        flutter.type = 'square';
        flutter.frequency.value = o.rateHz;
        const fg = ctx.createGain();
        fg.gain.value = 0.5;
        flutter.connect(fg);
        fg.connect(am.gain);
        filter.connect(am);
        am.connect(ng);
        flutter.start(T);
        flutter.stop(T + o.dur + 0.02);
      } else {
        filter.connect(ng);
      }
      ng.connect(bus);
      src.start(T);
      src.stop(T + o.dur + 0.02);
    }
    for (const s of stops) { s.start(T); s.stop(end + 0.04); }
  }

  function silence() {
    if (!line || !line.bus) return;
    const { bus } = line;
    const ctx = audio.ctx;
    line.bus = null;
    try {
      bus.gain.cancelScheduledValues(ctx.currentTime);
      bus.gain.setTargetAtTime(0, ctx.currentTime, 0.01);
      setTimeout(() => { try { bus.disconnect(); } catch {  } }, 120);
    } catch {  }
  }

  function say(text, voiceId = 'cat') {
    silence();
    const v = voiceOf(voiceId);
    const compiled = compileMumble(text, v);
    line = { text, v, compiled, startS: now(), counted: 0, finished: false, bus: null };
    counts.lines += 1;
    const ctx = audio.ctx;
    if (ctx && !audio.muted) {
      const bus = ctx.createGain();
      bus.gain.value = v.gain;
      
      bus.connect(audio.voice || audio.master);
      line.bus = bus;
      line.audible = true;
      const T0 = ctx.currentTime + START_S;
      for (const e of compiled.events) syllable(ctx, bus, v, e, T0 + e.at);
    } else {
      line.audible = false;
    }
    return compiled;
  }

  const elapsed = () => (line ? now() - line.startS - START_S : 0);

  function update() {
    if (!line || line.finished) return;
    const t = elapsed();
    const { events } = line.compiled;
    while (line.counted < events.length && events[line.counted].at <= t) {
      if (line.audible && !audio.muted) counts.syllables += 1; else counts.skipped += 1;
      line.counted += 1;
    }
  }

  function finish() {
    if (!line || line.finished) return;
    update();
    line.finished = true;
    silence();
  }

  function stop() {
    finish();
    line = null;
  }

  return {
    say,
    update,
    finish,
    stop,
    revealed: () => (!line ? 0 : line.finished ? line.text.length : revealAt(line.compiled, line.text.length, elapsed())),
    activity: () => (!line || line.finished ? 0 : activityAt(line.compiled, elapsed())),
    get typing() { return Boolean(line && !line.finished && elapsed() < line.compiled.total); },
    get state() {
      return {
        unlocked: audio.unlocked, muted: audio.muted, ...counts,
        speaking: Boolean(line && !line.finished && elapsed() < line.compiled.total),
        voice: line ? line.v.id : null,
      };
    },
  };
}
