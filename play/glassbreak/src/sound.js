










export const SFX_TAKES = Object.freeze({
  paddle: 4, wall: 4, crack: 4, clank: 3, break: 6, sun: 3, launch: 3, lost: 2, capsule: 3, shield: 2,
  moth: 4, shoot: 3, breach: 2, bell: 2, bellwarn: 2, bosshit: 4, bossdown: 1, clear: 1, fail: 1,
  kilnroar: 2, spiregroan: 2,
});
export const SFX_NAMES = Object.freeze(Object.keys(SFX_TAKES));


export const SFX_GAINS = Object.freeze({ paddle: 0.8, wall: 0.7, shoot: 0.8 });


const EVENT_CUE = Object.freeze({
  paddle: 'paddle', wall: 'wall', crack: 'crack', echo: 'crack', clank: 'clank', solder: 'clank', stun: 'clank',
  hit: 'clank', break: 'break', echobreak: 'break', sun: 'sun',
  launch: 'launch', lost: 'lost', capsule: 'capsule', lantern: 'capsule', shield: 'shield', shieldsave: 'shield',
  kill: 'moth', enemydown: 'moth', mothburn: 'moth', shoot: 'shoot', bossshoot: 'shoot', lance: 'shoot',
  breach: 'breach', bossphase: 'breach', ring: 'bell', bellwarn: 'bellwarn',
  
  
  refirewarn: 'kilnroar', refire: 'clank', surgewarn: 'spiregroan', surge: 'breach', surgestop: 'sun',
  
  bossenter: 'bellwarn', bossland: 'breach',
  bosshit: 'bosshit', guardbreak: 'bosshit', bossdown: 'bossdown',
  clear: 'clear', done: 'clear', fail: 'fail',
  
  
  catch: 'capsule', kindle: 'sun', flare: 'launch',
});

export const EVENT_CUES = EVENT_CUE;




export const SILENT_EVENTS = Object.freeze(['enter', 'join', 'leave', 'window', 'latch', 'seek', 'regrow', 'draft', 'punch']);


export function cueFor(e) {
  return (e && EVENT_CUE[e.k]) || null;
}


export const DUCK_CUES = Object.freeze(new Set(['sun', 'bossdown', 'clear', 'fail', 'bell', 'breach', 'kilnroar', 'spiregroan']));





export function createCuePlayer(play, now = () => performance.now(), gapMs = 45, perFrame = 4) {
  const last = new Map();
  return (events) => {
    let n = 0;
    const played = [];
    for (const e of events) {
      if (n >= perFrame) break;
      const cue = cueFor(e);
      if (!cue) continue;
      const at = now();
      if (at - (last.get(cue) ?? -Infinity) < gapMs) continue;
      last.set(cue, at);
      play(cue, e);
      played.push(cue);
      n++;
    }
    return played;
  };
}



export const MENU_CUES = Object.freeze(['tap', 'back', 'toggleOn', 'toggleOff', 'open', 'focus']);
const BACK_IDS = new Set(['selectBack', 'lobbyLeave', 'pauseTitle', 'failTitle', 'endTitle', 'storySkip']);
const OPEN_IDS = new Set(['start', 'coopStart', 'next', 'resume']);


export function menuCue(id, soundOn, isTint = false) {
  if (isTint) return null;
  if (id === 'sound' || id === 'soundPause') return soundOn ? 'toggleOn' : 'toggleOff';
  if (BACK_IDS.has(id)) return 'back';
  if (OPEN_IDS.has(id)) return 'open';
  return 'tap';
}


export const MUSIC_TRACKS = Object.freeze(['main', 'boss']);







export function musicFor({ inRun = false, boss = false } = {}) {
  return inRun && boss ? 'boss' : 'main';
}


export function followTrack(music, id) {
  if (!music || music.track() === id) return false;
  music.setTrack(id);
  return true;
}


export function followSound(music, soundOn) {
  if (!music) return false;
  if (music.isOn() !== !!soundOn) music.setOn(!!soundOn);
  return music.isOn();
}







export function scaledGains(names, base = {}, level = () => 1) {
  const o = {};
  for (const n of names) {
    Object.defineProperty(o, n, { enumerable: true, get: () => (Object.prototype.hasOwnProperty.call(base, n) ? base[n] : 1) * level() });
  }
  return o;
}





export function musicVolume(createPlayer, level = 1) {
  const nodes = new Set();
  let g = level;
  return {
    createPlayer(o) {
      const node = o.ctx.createGain();
      node.gain.value = g;
      node.connect(o.destination);
      nodes.add(node);
      return createPlayer({ ...o, destination: node });
    },
    set(v) {
      g = v;
      for (const n of nodes) n.gain.value = g;
      return g;
    },
    level: () => g,
  };
}
