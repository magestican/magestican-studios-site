











































export const RENDER_RATE = 22050;






export const AFTER_FRAMES = 60;


const FLOOR = 0.0001;


function noiseBuffer(ctx, length, seed) {
  const buf = ctx.createBuffer(1, length, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let n = (seed >>> 0) || 1;
  for (let i = 0; i < d.length; i += 1) { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; d[i] = (n / 4294967296) * 2 - 1; }
  return buf;
}

const sumDepth = (lfos) => lfos.reduce((s, l) => s + l.depth, 0);







function lfoOnto(ctx, param, hz, depth, at, until) {
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(hz, at);
  const g = ctx.createGain();
  g.gain.value = depth;
  o.connect(g);
  g.connect(param);
  o.start(at);
  if (Number.isFinite(until)) o.stop(until);
  return o;
}










export async function renderTexture(id, {
  beds,
  mix,
  rate = RENDER_RATE,
  Offline = (typeof globalThis === 'undefined' ? null : (globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext)),
  clock = (typeof performance === 'undefined' ? Date : performance),
} = {}) {
  if (!beds || !mix) throw new Error('renderTexture needs the ambience and mix tables from web-engine/moon/audio');
  if (!Offline) throw new Error('renderTexture needs an OfflineAudioContext');
  const spec = beds.TEXTURES[id];
  if (!spec) throw new Error(`no such texture: ${id}`);
  const t0 = clock.now();
  const loop = Math.round(rate * spec.seconds);
  const blend = Math.round(rate * beds.BLEND_S);
  const length = loop + blend;
  const total = length / rate;
  const ctx = new Offline(1, length, rate);

  
  
  const level = ctx.createGain();
  level.gain.value = Math.max(0.05, 1 - sumDepth(spec.lfo));
  level.connect(ctx.destination);
  for (const l of spec.lfo) lfoOnto(ctx, level.gain, l.hz, l.depth, 0, total);

  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx, length, spec.seed);
  for (const layer of spec.layers) {
    const bq = ctx.createBiquadFilter();
    bq.type = layer.filter;
    bq.frequency.value = layer.f;
    bq.Q.value = layer.q;
    const g = ctx.createGain();
    g.gain.value = layer.gain;
    src.connect(bq);
    bq.connect(g);
    g.connect(level);
  }
  
  
  
  if (spec.pops && beds.texturePops) {
    const gate = ctx.createGain();
    gate.gain.setValueAtTime(0, 0);
    for (const at of beds.texturePops(id)) {
      gate.gain.setValueAtTime(0, at);
      gate.gain.linearRampToValueAtTime(spec.pops.gain, at + spec.pops.attack_s);
      gate.gain.linearRampToValueAtTime(0, at + spec.pops.dur_s);
    }
    src.connect(gate);
    gate.connect(ctx.destination);
  }
  src.start(0);
  src.stop(total);

  const rendered = await ctx.startRendering();
  const data = rendered.getChannelData(0);
  const blended = beds.blendLoop(data, loop, blend);
  
  
  mix.normalizePeak(data, beds.bedPeak(id), loop);
  return {
    id,
    buffer: rendered,
    loopSamples: loop,
    loopSeconds: loop / rate,
    rate,
    blended,
    peak: mix.peakOf(data, loop),
    ms: Math.round(clock.now() - t0),
  };
}









const CHIRP_AHEAD_S = 1.5;





const RESITE_EVERY_S = 2;
const PLACE_TAU_S = 0.2;

export function createAmbience({
  audio,
  beds,
  mix,
  rate = RENDER_RATE,
  fadeS,
  afterFrames = AFTER_FRAMES,
  render = renderTexture,
  Offline,
  seed = 20260919,
  
  
  
  
  
  isGrass = null,
} = {}) {
  if (!beds || !mix) throw new Error('createAmbience needs the ambience and mix tables from web-engine/moon/audio');
  const fade = fadeS ?? beds.FADE_S;
  const textures = new Map();       
  const ms = {};                    
  const counts = { renders: 0, errors: 0, starts: 0, stops: 0, phrases: 0, chirps: 0 };
  const live = new Map();           
  let targets = beds.bedsFor({});
  let lastFireM = Infinity;         
  let rendering = false;
  let renderedAll = false;
  let lastError = '';

  
  const rand = beds.lcg(seed);
  const voices = [beds.birdVoice(rand), beds.birdVoice(rand)];
  let nextPhraseAt = 0;

  async function renderAll() {
    rendering = true;
    for (const id of beds.TEXTURE_IDS) {
      try {
        const entry = await render(id, { beds, mix, rate, Offline });
        textures.set(id, entry);
        ms[id] = entry.ms;
        counts.renders += 1;
      } catch (e) {
        counts.errors += 1;
        lastError = String((e && e.message) || e);
      }
    }
    rendering = false;
    renderedAll = true;
  }

  
  function startTexture(id, ctx, bus, now) {
    const entry = textures.get(id);
    if (!entry) return null;
    const level = ctx.createGain();
    level.gain.setValueAtTime(FLOOR, now);
    level.connect(bus);
    const sources = [];
    let into = level;
    if (id === 'wind') {
      const gust = ctx.createGain();
      gust.gain.value = Math.max(0.05, 1 - sumDepth(beds.GUST));
      for (const g of beds.GUST) sources.push(lfoOnto(ctx, gust.gain, g.hz, g.depth, now, Infinity));
      gust.connect(level);
      into = gust;
    }
    const src = ctx.createBufferSource();
    src.buffer = entry.buffer;
    src.loop = true;
    src.loopStart = 0;
    
    
    src.loopEnd = entry.loopSeconds;
    src.connect(into);
    src.start(now);
    sources.push(src);
    return { level, sources, target: 0, silentSince: null };
  }

  








  function startCrickets(ctx, bus, now) {
    const level = ctx.createGain();
    level.gain.setValueAtTime(FLOOR, now);
    level.connect(bus);
    const sources = [];
    const voices = [];
    for (const c of beds.CRICKETS) {
      const shape = ctx.createGain();
      
      
      shape.gain.setValueAtTime(0, now);
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(c.hz, now);
      o.connect(shape);
      shape.connect(level);
      o.start(now);
      sources.push(o);
      
      
      voices.push({ spec: c, gain: shape, peak: c.gain, at: now + 0.35 * (voices.length + 1), index: 0, chirps: 0 });
    }
    return { level, sources, voices, positional: false, target: 0, silentSince: null };
  }

  




















  function startCricketField(ctx, bus, now, pool, at) {
    if (!ctx.createStereoPanner) return null;
    const level = ctx.createGain();
    level.gain.setValueAtTime(FLOOR, now);
    level.connect(bus);
    const sources = [];
    const voices = [];
    pool.forEach((spot, i) => {
      const c = beds.CRICKETS[spot.spec] || beds.CRICKETS[0];
      const place = ctx.createGain();
      place.gain.setValueAtTime(0, now);
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(0, now);
      const shape = ctx.createGain();
      shape.gain.setValueAtTime(0, now);
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(c.hz, now);
      o.connect(shape);
      shape.connect(panner);
      panner.connect(place);
      place.connect(level);
      o.start(now);
      sources.push(o);
      voices.push({ spec: c, gain: shape, peak: 1, place, panner, at: now + 0.35 * (i + 1), index: 0, chirps: 0 });
    });
    return { level, sources, voices, positional: true, pool, at, checkedAt: 0, field: [], target: 0, silentSince: null };
  }

  







  function startWaterField(ctx, bus, now, pool, at) {
    const entry = textures.get('water');
    if (!ctx.createStereoPanner || !entry) return null;
    const level = ctx.createGain();
    level.gain.setValueAtTime(FLOOR, now);
    level.connect(bus);
    const sources = [];
    const voices = [];
    pool.forEach((spot, i) => {
      const place = ctx.createGain();
      place.gain.setValueAtTime(0, now);
      const panner = ctx.createStereoPanner();
      panner.pan.setValueAtTime(0, now);
      const src = ctx.createBufferSource();
      src.buffer = entry.buffer;
      src.loop = true;
      src.loopStart = 0;
      src.loopEnd = entry.loopSeconds;
      src.connect(panner);
      panner.connect(place);
      place.connect(level);
      src.start(now, (entry.loopSeconds * i) / Math.max(1, pool.length));
      sources.push(src);
      voices.push({ place, panner });
    });
    return { level, sources, voices, positional: true, pool, at, checkedAt: now, field: [], target: 0, silentSince: null };
  }

  
  function placeWater(v, where, now) {
    if (!v || !v.positional) return;
    const field = beds.waterField(v.pool, where);
    v.field = field;
    for (let i = 0; i < v.voices.length && i < field.length; i += 1) {
      try {
        v.voices[i].place.gain.setTargetAtTime(field[i].gain, now, PLACE_TAU_S);
        v.voices[i].panner.pan.setTargetAtTime(field[i].pan, now, PLACE_TAU_S);
      } catch {  }
    }
  }

  




  function placeCrickets(v, where, now) {
    if (!v || !v.positional) return;
    const field = beds.cricketField(v.pool, where);
    v.field = field;
    for (let i = 0; i < v.voices.length && i < field.length; i += 1) {
      const voice = v.voices[i];
      const s = field[i];
      try {
        voice.place.gain.setTargetAtTime(s.gain, now, PLACE_TAU_S);
        voice.panner.pan.setTargetAtTime(s.pan, now, PLACE_TAU_S);
      } catch {  }
    }
  }

  





  function chirp(v, until) {
    if (!v || !v.voices) return 0;
    let laid = 0;
    for (const voice of v.voices) {
      const c = voice.spec;
      
      
      
      
      
      
      
      
      const behind = until - CHIRP_AHEAD_S;
      if (voice.at < behind - c.gapS) voice.at = behind;
      
      
      for (let n = 0; n < 16 && voice.at < until; n += 1) {
        let t = voice.at;
        for (let i = 0; i < c.pulses; i += 1) {
          voice.gain.gain.setValueAtTime(0, t);
          voice.gain.gain.linearRampToValueAtTime(voice.peak === undefined ? c.gain : voice.peak, t + beds.CHIRP_ATTACK_S);
          voice.gain.gain.linearRampToValueAtTime(0, t + beds.CHIRP_ATTACK_S + beds.CHIRP_DECAY_S);
          t += 1 / c.pulseHz;
        }
        voice.at += beds.chirpGap(c, voice.index);
        voice.index += 1;
        voice.chirps += 1;
        laid += 1;
      }
    }
    return laid;
  }

  
  function setLevel(id, v, target, now) {
    if (Math.abs(target - v.target) < 0.01 && !(target === 0 && v.target !== 0)) return false;
    v.target = target;
    const to = Math.max(FLOOR, target * beds.bedPeak(id));
    try {
      v.level.gain.cancelScheduledValues(now);
      v.level.gain.setValueAtTime(Math.max(FLOOR, v.level.gain.value), now);
      v.level.gain.linearRampToValueAtTime(to, now + fade);
    } catch {  }
    v.silentSince = target <= 0 ? now : null;
    return true;
  }

  
  function sweep(now) {
    for (const [id, v] of live) {
      if (v.silentSince === null || now - v.silentSince < fade + beds.SILENT_STOP_S) continue;
      stopBed(v, now);   
      live.delete(id);
    }
  }

  





  function stopBed(v, now) {
    if (!v) return;
    for (const s of v.sources) { try { s.stop(now); } catch {  } }
    try { v.level.disconnect(); } catch {  }
    counts.stops += 1;
  }

  
  function waterState() {
    const v = live.get('water');
    if (!v) return { live: false, positional: false, sources: [] };
    return {
      live: true,
      positional: !!v.positional,
      sources: (v.field || []).map((s) => ({ pan: s.pan, gain: s.gain, distanceM: s.distanceM, x: s.x, z: s.z })),
    };
  }

  
  function cricketState() {
    const v = live.get('crickets');
    if (!v) return { live: false, positional: false, sources: [] };
    return {
      live: true,
      positional: !!v.positional,
      at: v.at ? { ...v.at } : null,
      sources: (v.field || []).map((s) => ({ pan: s.pan, gain: s.gain, distanceM: s.distanceM, x: s.x, z: s.z })),
    };
  }

  
  function phrase(ctx, bus, now, density) {
    const voice = voices[rand() < 0.5 ? 0 : 1];
    const notes = beds.chirpPhrase(rand, voice);
    const peak = beds.bedPeak('birds') * density * (0.7 + rand() * 0.3);
    for (const n of notes) {
      const at = now + 0.02 + n.at;
      const g = ctx.createGain();
      g.gain.setValueAtTime(FLOOR, at);
      g.gain.exponentialRampToValueAtTime(Math.max(FLOOR * 2, peak * n.gain), at + 0.008);
      g.gain.exponentialRampToValueAtTime(FLOOR, at + n.dur);
      g.connect(bus);
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(n.hz0, at);
      o.frequency.exponentialRampToValueAtTime(n.hz1, at + n.dur);
      o.connect(g);
      o.start(at);
      o.stop(at + n.dur + 0.02);
    }
    counts.phrases += 1;
    counts.chirps += notes.length;
    nextPhraseAt = now + beds.phraseGap(rand, density);
  }

  return {
    




    tick({ frames = Infinity, season = 'summer', night = false, weather = 'clear', waterM = Infinity,
      x = 0, z = 0, heading = 0, tier = null, waterSources = null, fireM = Infinity } = {}) {
      targets = beds.bedsFor({ season, night, weather, waterM, fireM });
      lastFireM = fireM;
      if (frames < afterFrames) return false;
      if (!renderedAll && !rendering) renderAll();

      const ctx = audio && audio.ctx;
      const bus = audio && audio.ambience;
      if (!ctx || !bus) return false;
      const now = ctx.currentTime;
      let changed = false;
      try {
        sweep(now);
        
        
        const wantWaterField = beds.fieldsArePositional(tier) && Array.isArray(waterSources)
          && !!ctx.createStereoPanner && textures.has('water');
        for (const id of beds.TEXTURE_IDS) {
          if (id === 'water' && wantWaterField) continue;
          let v = live.get(id);
          if (v && v.positional) continue;   
          if (!v) {
            if (!(targets[id] > 0) || !textures.has(id)) continue;
            v = startTexture(id, ctx, bus, now);
            if (!v) continue;
            live.set(id, v);
            counts.starts += 1;
            changed = true;
          }
          if (setLevel(id, v, targets[id], now)) changed = true;
        }
        
        
        const wantField = beds.cricketsArePositional(tier);
        const where = { x, z, heading };
        let water = live.get('water');
        if (water && !!water.positional !== wantWaterField) {
          
          stopBed(water, now);
          live.delete('water');
          water = null;
          changed = true;
        }
        if (wantWaterField) {
          if (water && now - water.checkedAt > RESITE_EVERY_S) {
            water.checkedAt = now;
            const next = beds.siteWater({ x, z, sources: waterSources });
            if (next.length === water.pool.length) water.pool = next;
            else { stopBed(water, now); live.delete('water'); water = null; changed = true; }
          }
          if (!water && targets.water > 0) {
            const pool = beds.siteWater({ x, z, sources: waterSources });
            water = pool.length ? startWaterField(ctx, bus, now, pool, { x, z }) : null;
            if (water) { live.set('water', water); counts.starts += 1; changed = true; }
          }
          if (water) {
            if (setLevel('water', water, targets.water > 0 ? 1 : 0, now)) changed = true;
            placeWater(water, where, now);
          }
        }
        let crickets = live.get('crickets');
        
        
        
        if (crickets && crickets.positional !== wantField && !(wantField && !crickets.pool)) {
          stopBed(crickets, now);
          live.delete('crickets');
          crickets = null;
        }
        if (!crickets && targets.crickets > 0) {
          const pool = wantField ? beds.siteCrickets({ x, z, seed: seed + 1, isGrass }) : [];
          crickets = (pool.length ? startCricketField(ctx, bus, now, pool, { x, z }) : null) || startCrickets(ctx, bus, now);
          live.set('crickets', crickets);
          counts.starts += 1;
          changed = true;
        }
        if (crickets && setLevel('crickets', crickets, targets.crickets, now)) changed = true;
        if (crickets && targets.crickets > 0) {
          
          
          
          
          
          
          
          
          
          const flatButWanted = wantField && !crickets.positional;
          if ((crickets.positional || flatButWanted) && now - (crickets.checkedAt || 0) > RESITE_EVERY_S) {
            crickets.checkedAt = now;
            if (beds.poolIsStale(crickets.pool, crickets.at, where)) {
              const next = beds.siteCrickets({ x, z, seed: seed + 1, isGrass });
              if (next.length && next.length === (crickets.pool || []).length) {
                crickets.pool = next;
                crickets.at = { x, z };
              } else if (next.length !== (crickets.pool || []).length) {
                
                
                stopBed(crickets, now);
                live.delete('crickets');
                crickets = null;
                changed = true;
              }
            }
          }
          if (crickets && crickets.positional) placeCrickets(crickets, where, now);
        }
        
        
        if (crickets && targets.crickets > 0) chirp(crickets, now + CHIRP_AHEAD_S);
        if (targets.birds > 0 && now >= nextPhraseAt) { phrase(ctx, bus, now, targets.birds); changed = true; }
      } catch (e) {
        counts.errors += 1;
        lastError = String((e && e.message) || e);
      }
      return changed;
    },

    
    get state() {
      return {
        targets: { ...targets },
        live: [...live.keys()],
        rendered: [...textures.keys()],
        rendering,
        rate,
        ms: { ...ms },
        nextPhraseAt,
        ...counts,
        
        
        
        crickets: cricketState(),
        water: waterState(),
        fireM: Number.isFinite(lastFireM) ? Math.round(lastFireM * 100) / 100 : null,
        error: lastError,
      };
    },

    
    prepare(id) {
      if (!beds.TEXTURES[id]) return Promise.resolve(null);
      if (textures.has(id)) return Promise.resolve(textures.get(id));
      return render(id, { beds, mix, rate, Offline })
        .then((entry) => { textures.set(id, entry); ms[id] = entry.ms; counts.renders += 1; return entry; })
        .catch((e) => { counts.errors += 1; lastError = String((e && e.message) || e); return null; });
    },

    
    stop() {
      const now = audio && audio.ctx ? audio.ctx.currentTime : 0;
      for (const v of live.values()) {
        for (const s of v.sources) { try { s.stop(now); } catch {  } }
      }
      live.clear();
      return true;
    },
  };
}
