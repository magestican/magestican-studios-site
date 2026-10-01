





























export function createSheet(ctx, baseUrl) {
  
  let status = 'idle';
  let buffer = null;
  let index = null;
  let error = null;
  let promise = null;

  
  const missing = new Set();

  async function load(jsonName) {
    status = 'loading';
    try {
      const metaRes = await fetch(`${baseUrl}/${jsonName}`, { cache: 'force-cache' });
      if (!metaRes.ok) throw new Error(`${jsonName} ${metaRes.status}`);
      index = await metaRes.json();
      const audioRes = await fetch(`${baseUrl}/${index.sheet}`, { cache: 'force-cache' });
      if (!audioRes.ok) throw new Error(`${index.sheet} ${audioRes.status}`);
      const bytes = await audioRes.arrayBuffer();
      
      
      
      
      if (bytes.byteLength < 4096) throw new Error(`${index.sheet} is only ${bytes.byteLength} bytes`);
      buffer = await ctx.decodeAudioData(bytes);
      status = 'ready';
    } catch (e) {
      error = e;
      status = 'failed';
    }
    return status;
  }

  return {
    get status() { return status; },
    get error() { return error; },
    get index() { return index; },
    get missing() { return [...missing]; },
    
    get byEffect() { return (index && (index.effects || index.clips)) || null; },
    get duration() { return buffer ? buffer.duration : 0; },

    
    ready(jsonName) {
      if (!promise) promise = load(jsonName);
      return promise;
    },

    













    play(id, { dest, gain = 1, when = 0, loop = false, rate = 1, offset = 0 } = {}) {
      if (status !== 'ready' || !buffer) return null;
      const table = index.effects || index.clips;
      const slice = table && table[id];
      if (!slice) { missing.add(id); return null; }

      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.playbackRate.value = rate;
      const g = ctx.createGain();
      g.gain.value = gain;
      src.connect(g).connect(dest || ctx.destination);

      const t = when || ctx.currentTime;
      if (loop) {
        
        
        
        
        src.loop = true;
        src.loopStart = slice.start;
        src.loopEnd = slice.start + slice.dur;
        
        
        
        
        
        
        
        
        const into = offset > 0 ? offset % slice.dur : 0;
        src.start(t, slice.start + into);
      } else {
        src.start(t, slice.start, slice.dur);
      }
      return src;
    },

    
    durationOf(id) {
      const table = index && (index.effects || index.clips);
      const slice = table && table[id];
      return slice ? slice.dur : 0;
    },

    has(id) {
      const table = index && (index.effects || index.clips);
      return !!(table && table[id]);
    },
  };
}








export function createStems(ctx, baseUrl, names) {
  let status = 'idle';
  const buffers = Object.create(null);
  const nodes = Object.create(null);
  const gains = Object.create(null);
  








  let started = 0;
  let stopped = 0;
  let error = null;
  let promise = null;

  async function load() {
    status = 'loading';
    try {
      await Promise.all(names.map(async (n) => {
        const res = await fetch(`${baseUrl}/${n}.webm`, { cache: 'force-cache' });
        if (!res.ok) throw new Error(`${n}.webm ${res.status}`);
        const bytes = await res.arrayBuffer();
        if (bytes.byteLength < 4096) throw new Error(`${n}.webm is only ${bytes.byteLength} bytes`);
        buffers[n] = await ctx.decodeAudioData(bytes);
      }));
      status = 'ready';
    } catch (e) {
      error = e;
      status = 'failed';
    }
    return status;
  }

  return {
    get status() { return status; },
    get error() { return error; },
    get gains() { return gains; },
    
    get live() { return started - stopped; },
    ready() { if (!promise) promise = load(); return promise; },

    







    start(dest, when = 0) {
      if (status !== 'ready') return false;
      
      
      
      
      
      
      
      
      
      
      for (const n of Object.keys(nodes)) {
        try { nodes[n].stop(); } catch {  }
        stopped += 1;
        delete nodes[n];
        delete gains[n];
      }
      const t = when || ctx.currentTime + 0.05;
      for (const n of names) {
        const src = ctx.createBufferSource();
        src.buffer = buffers[n];
        src.loop = true;
        const g = ctx.createGain();
        g.gain.value = 0;
        src.connect(g).connect(dest);
        src.start(t);
        started += 1;
        nodes[n] = src;
        gains[n] = g;
      }
      return true;
    },

    
    setGain(name, value, seconds = 0.5) {
      const g = gains[name];
      if (!g) return;
      const now = ctx.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.linearRampToValueAtTime(Math.max(0, value), now + seconds);
    },

    stop() {
      for (const n of Object.keys(nodes)) {
        try { nodes[n].stop(); } catch {  }
        stopped += 1;
        delete nodes[n];
      }
    },
  };
}
