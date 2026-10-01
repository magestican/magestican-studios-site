































export const SFX_CAP = 12;
export const FADE_S = 0.09;
const START_S = 0.01;     

export function createSfx({ audio, cues, patches, cap = SFX_CAP, seed = 7 }) {
  if (!cues || !patches) throw new Error('createSfx needs the cue and patch tables from web-engine/moon/audio');
  const counts = { plays: 0, skipped: 0, faded: 0, unknown: 0 };
  const live = [];          
  let noise = null;
  let s = (seed >>> 0) || 7;
  const rand = () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);

  function noiseBuffer(ctx) {
    if (noise && noise.sampleRate === ctx.sampleRate) return noise;
    noise = ctx.createBuffer(1, Math.round(ctx.sampleRate * 0.3), ctx.sampleRate);
    const d = noise.getChannelData(0);
    let n = 90210;
    for (let i = 0; i < d.length; i++) { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; d[i] = (n / 4294967296) * 2 - 1; }
    return noise;
  }

  
  function prune(now) {
    for (let i = live.length - 1; i >= 0; i--) if (live[i].endsAt <= now) live.splice(i, 1);
  }

  
  function fade(v, now) {
    try {
      v.out.gain.cancelScheduledValues(now);
      v.out.gain.setValueAtTime(v.out.gain.value, now);
      v.out.gain.linearRampToValueAtTime(0.0001, now + FADE_S);
    } catch {  }
    counts.faded += 1;
  }

  





  function makeRoom(now, priority) {
    while (live.length >= cap) {
      let i = live.findIndex((v) => v.priority <= priority);
      if (i < 0) i = 0;
      fade(live.splice(i, 1)[0], now);
    }
  }

  function layerNodes(ctx, out, layer, at, detune) {
    const dur = layer.attack + layer.decay;
    const end = at + dur;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0.0001, at);
    env.gain.exponentialRampToValueAtTime(layer.gain, at + layer.attack);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    env.connect(out);

    let src;
    if (layer.noise) {
      src = ctx.createBufferSource();
      src.buffer = noiseBuffer(ctx);
    } else {
      src = ctx.createOscillator();
      src.type = layer.wave;
      src.frequency.setValueAtTime(layer.f0, at);
      if (layer.f1 !== layer.f0) src.frequency.exponentialRampToValueAtTime(layer.f1, end);
      if (detune) src.detune.setValueAtTime(detune, at);
    }

    if (layer.filter) {
      const bq = ctx.createBiquadFilter();
      bq.type = layer.filter.type;
      bq.frequency.value = layer.filter.f;
      bq.Q.value = layer.filter.q;
      src.connect(bq);
      bq.connect(env);
    } else {
      src.connect(env);
    }
    src.start(at);
    src.stop(end + 0.02);
    return end;
  }

  





  function play(id, { gain = 1 } = {}) {
    const cue = cues[id];
    const patch = cue && patches[cue.patch];
    if (!patch) { counts.unknown += 1; return false; }
    const ctx = audio.ctx;
    const bus = audio.sfx;
    if (!ctx || !bus || audio.muted) { counts.skipped += 1; return false; }

    const now = ctx.currentTime;
    prune(now);
    makeRoom(now, cue.priority);

    const out = ctx.createGain();
    out.gain.value = cue.gain * gain;
    out.connect(bus);

    const detune = cue.spread ? Math.round((rand() * 2 - 1) * cue.spread) : 0;
    const at = now + START_S;
    let endsAt = at;
    for (const layer of patch.layers) endsAt = Math.max(endsAt, layerNodes(ctx, out, layer, at + layer.at, detune));

    live.push({ out, startedAt: at, endsAt: endsAt + 0.02, priority: cue.priority, cue: id });
    counts.plays += 1;
    return true;
  }

  return {
    play,
    get state() { return { ...counts, live: live.length }; },
    get live() { return live.length; },
  };
}
