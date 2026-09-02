









































export const FADE_IN = 2.5;

export const FADE_OUT = 0.8;







export function loopEndSeconds(manifest, buffer) {
  const rate = manifest?.sampleRate;
  const samples = manifest?.loopSamples;
  if (!(rate > 0) || !(samples > 0)) return buffer?.duration ?? 0;
  const end = samples / rate;
  
  
  
  if (buffer && end > buffer.duration + 1e-6) return buffer.duration;
  return end;
}








export function trackFrom(manifest, id = null) {
  const tracks = manifest?.tracks;
  if (!Array.isArray(tracks) || !tracks.length) return null;
  if (id) return tracks.find((t) => t.id === id) ?? null;
  return tracks[0];
}











export function createLobbyMusic({ ctx, destination, manifestUrl, gain = 0.34, trackId = null }) {
  const st = {
    
    url: String(manifestUrl),
    fileUrl: null,
    track: null,
    loaded: false,
    playing: false,
    muted: false,
    error: null,
    loopEnd: 0,
    gain,
  };
  let buffer = null;
  let source = null;
  let bus = null;
  let loading = null;

  const now = () => (ctx ? ctx.currentTime : 0);

  function ensureBus() {
    if (bus || !ctx) return bus;
    bus = ctx.createGain();
    bus.gain.value = 0;
    bus.connect(destination ?? ctx.destination);
    return bus;
  }

  async function load() {
    if (loading) return loading;
    loading = (async () => {
      try {
        const res = await fetch(st.url, { cache: 'force-cache' });
        if (!res.ok) throw new Error(`manifest ${res.status} at ${st.url}`);
        const manifest = await res.json();
        const track = trackFrom(manifest, trackId);
        if (!track) throw new Error(`no tracks in ${st.url}`);
        st.track = track.id;
        
        
        const fileUrl = new URL(track.file, st.url).href;
        st.fileUrl = fileUrl;
        const audioRes = await fetch(fileUrl, { cache: 'force-cache' });
        if (!audioRes.ok) throw new Error(`${track.file} ${audioRes.status} at ${fileUrl}`);
        buffer = await ctx.decodeAudioData(await audioRes.arrayBuffer());
        st.loopEnd = loopEndSeconds(manifest, buffer);
        st.loaded = true;
      } catch (err) {
        
        
        st.error = String(err && err.message ? err.message : err);
      }
    })();
    return loading;
  }

  function start() {
    ensureBus();
    source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.loopStart = 0;
    
    source.loopEnd = st.loopEnd;
    source.connect(bus);
    source.start();
    st.playing = true;
    const target = st.muted ? 0 : st.gain;
    bus.gain.cancelScheduledValues(now());
    bus.gain.setValueAtTime(bus.gain.value, now());
    bus.gain.linearRampToValueAtTime(target, now() + FADE_IN);
    return true;
  }

  return {
    
    async play() {
      if (!ctx) return false;
      await load();
      if (!st.loaded || st.playing) return st.playing;
      try {
        return start();
      } catch (err) {
        
        
        
        
        
        st.error = `play: ${err && err.message ? err.message : err}`;
        st.playing = false;
        return false;
      }
    },


    
    stop({ fade = FADE_OUT } = {}) {
      if (!st.playing || !bus) return;
      const t = now();
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(bus.gain.value, t);
      bus.gain.linearRampToValueAtTime(0, t + fade);
      const dying = source;
      source = null;
      st.playing = false;
      
      
      try { dying.stop(t + fade + 0.05); } catch {  }
    },

    
    setMuted(muted) {
      st.muted = !!muted;
      if (!bus) return;
      const t = now();
      bus.gain.cancelScheduledValues(t);
      bus.gain.setValueAtTime(bus.gain.value, t);
      bus.gain.linearRampToValueAtTime(st.muted || !st.playing ? 0 : st.gain, t + 0.25);
    },

    
    state() {
      return { ...st, busGain: bus ? Number(bus.gain.value.toFixed(4)) : null };
    },
  };
}
