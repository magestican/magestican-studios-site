


















import { createLobbyMusic } from '../../../web-engine/audio/lobbyMusic.js';
import { createAudioUnlock } from './iosUnlock.js';

export const MUSIC_KEY = 'magestican:v1:music';
export const TRACK_IDS = Object.freeze(['main', 'local']);
export const trackKey = (game) => `magestican:v1:track:${game}`;
export const LEVEL = 0.34;






export function initialTrack({ saved = null, lang = '', homeLang = null, ids = TRACK_IDS } = {}) {
  if (ids.includes(saved)) return saved;
  if (homeLang && String(lang).toLowerCase().split('-')[0] === homeLang) return 'local';
  return 'main';
}













export function createTrackMusic({
  game, manifestUrl, lang = globalThis.document?.documentElement?.lang ?? '', homeLang = null,
  storage = null, createPlayer = createLobbyMusic, trackIds = TRACK_IDS,
  makeContext = () => {
    const Ctor = globalThis.AudioContext || globalThis.webkitAudioContext;
    return Ctor ? new Ctor() : null;
  },
} = {}) {
  const store = () => storage ?? globalThis.localStorage;
  const get = (k) => { try { return store()?.getItem(k) ?? null; } catch { return null; } };
  const set = (k, v) => { try { store()?.setItem(k, v); } catch {  } };

  let ctx = null;
  let master = null;
  let on = false;
  const ids = Object.freeze([...trackIds]);
  let track = initialTrack({ saved: get(trackKey(game)), lang, homeLang, ids });
  const players = new Map();

  function ensureContext() {
    if (ctx) return ctx;
    ctx = makeContext();
    if (!ctx) return null;
    master = ctx.createGain();
    master.gain.value = LEVEL;
    master.connect(ctx.destination);
    return ctx;
  }

  const unlock = createAudioUnlock({ ensureContext, currentContext: () => ctx, isMuted: () => !on });

  function player(id) {
    if (!players.has(id)) {
      
      players.set(id, createPlayer({ ctx, destination: master, manifestUrl, gain: 1, trackId: id }));
    }
    return players.get(id);
  }

  function startCurrent() {
    
    
    const id = track;
    const p = player(id);
    Promise.resolve(p.play()).then(() => { if (!on || track !== id) p.stop({ fade: 0.05 }); }, () => {});
  }

  function setOn(value) {
    const want = !!value;
    set(MUSIC_KEY, want ? 'on' : 'off');
    if (want === on) return on;
    if (!want) {
      on = false;
      for (const p of players.values()) p.stop();
      return on;
    }
    if (!ensureContext()) return false;
    on = true;
    unlock.unlock();
    try { ctx.resume?.(); } catch {  }
    startCurrent();
    return on;
  }

  
  function setTrack(id) {
    if (!ids.includes(id)) return track;
    set(trackKey(game), id);
    if (id === track) return track;
    if (on) players.get(track)?.stop();
    track = id;
    if (on) startCurrent();
    return track;
  }

  
  function duck(depth = 0.32, ms = 300) {
    if (!on || !master || !ctx) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(LEVEL * depth, now + 0.03);
    master.gain.linearRampToValueAtTime(LEVEL, now + 0.03 + ms / 1000);
  }

  return {
    isOn: () => on,
    setOn,
    toggle: () => setOn(!on),
    wasOn: () => get(MUSIC_KEY) === 'on',
    duck,
    track: () => track,
    setTrack,
    trackIds: () => [...ids],
    nextTrack: () => setTrack(ids[(ids.indexOf(track) + 1) % ids.length]),
    state: () => ({
      on, track, context: ctx ? ctx.state : 'none',
      player: players.get(track)?.state?.() ?? null,
    }),
  };
}
