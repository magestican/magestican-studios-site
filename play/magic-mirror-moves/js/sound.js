









export const VARIANTS = 3;
export const COSTUMES = ['wizard', 'princess', 'ghost', 'fairy', 'dragon', 'ice_queen', 'astronaut', 'robot'];
export const SHARED = ['hit', 'combo', 'power_up', 'event_start', 'event_won', 'event_lost', 'finale', 'costume', 'click'];

export const NAMES = [...SHARED, ...COSTUMES.flatMap((c) => [`${c}_cast`, `${c}_wand`]), 'robot_stomp'];


export const MOVE_PITCH = { arms_up: 3, star: 5, flap: 1, jump: -2, squat: -4, twirl: 2, wand: 0, boo: -3, crown: 4 };




export function castCue(move, costume) {
  const c = COSTUMES.includes(costume) ? costume : 'wizard';
  if (move === 'wand') return { name: `${c}_wand` };
  if (move === 'jump' && c === 'robot') return { name: 'robot_stomp' };
  return { name: `${c}_cast`, rate: 2 ** ((MOVE_PITCH[move] ?? 0) / 12) };
}








export function cuesForGame(ev, costume) {
  if (ev.type === 'hit') {
    const cues = [castCue(String(ev.move), costume), { name: 'hit', gain: 0.5 }];
    if (ev.name) cues.push({ name: 'combo' });
    else if (ev.power) cues.push({ name: 'power_up' });
    return cues;
  }
  if (ev.type === 'finale') return [{ name: 'power_up' }];
  if (ev.type === 'end') return [{ name: 'finale' }];
  return [];
}


export function cuesForWorld(ev) {
  if (ev.type === 'event_start') return [{ name: 'event_start' }];
  if (ev.type === 'event_hit') return [{ name: 'hit', rate: 2 ** ((Number(ev.count) * 2) / 12) }];
  if (ev.type === 'event_end') return [{ name: ev.success ? 'event_won' : 'event_lost' }];
  return [];
}


export function namesFor(costume) {
  return [...SHARED, `${costume}_cast`, `${costume}_wand`, ...(costume === 'robot' ? ['robot_stomp'] : [])];
}

const BASE = new URL('../assets/sound/', import.meta.url);


export function createSound(win, onPlay = (_n) => {}) {
  
  let ctx = null;
  
  let out = null;
  let muted = false;
  let played = 0;
  let ext = '';
  
  const buffers = new Map();
  
  const turn = new Map();
  
  const lastAt = new Map();

  async function getTake(name, n, e) {
    const res = await win.fetch(new URL(`${name}/${name}_0${n}.${e}`, BASE));
    if (!res.ok) throw new Error(`${name}: ${res.status}`);
    return ctx.decodeAudioData(await res.arrayBuffer());
  }

  async function loadOne(name) {
    const out = [];
    for (let n = 1; n <= VARIANTS; n++) {
      try {
        out.push(await getTake(name, n, ext));
      } catch {
        if (ext === 'm4a') continue;
        ext = 'm4a'; 
        out.push(await getTake(name, n, ext).catch(() => null));
      }
    }
    return out.filter(Boolean);
  }

  return {
    
    unlock() {
      if (ctx || !win.AudioContext) {
        if (ctx?.state === 'suspended') ctx.resume();
        return;
      }
      ctx = new win.AudioContext();
      out = ctx.createGain();
      out.gain.value = muted ? 0 : 1;
      out.connect(ctx.destination);
      const probe = win.document?.createElement?.('audio');
      ext = probe?.canPlayType?.('audio/ogg; codecs=opus') ? 'ogg' : 'm4a';
    },
    
    preload(names) {
      if (!ctx) return;
      for (const n of names) if (!buffers.has(n)) buffers.set(n, loadOne(n));
    },
    
    play(cues) {
      if (!ctx || muted) return;
      const now = ctx.currentTime;
      for (const cue of cues) {
        if (now - (lastAt.get(cue.name) ?? -1) < 0.08) continue; 
        lastAt.set(cue.name, now);
        if (!buffers.has(cue.name)) buffers.set(cue.name, loadOne(cue.name));
        buffers.get(cue.name).then((list) => {
          if (!list.length || muted) return;
          const i = (turn.get(cue.name) ?? 0) % list.length; 
          turn.set(cue.name, i + 1);
          const src = ctx.createBufferSource();
          src.buffer = list[i];
          src.playbackRate.value = cue.rate ?? 1;
          const g = ctx.createGain();
          g.gain.value = cue.gain ?? 1;
          src.connect(g).connect(out);
          src.start();
          onPlay(++played);
        });
      }
    },
    setMuted(m) {
      muted = !!m;
      if (out) out.gain.value = muted ? 0 : 1;
    },
    get muted() {
      return muted;
    },
    get played() {
      return played;
    },
  };
}
