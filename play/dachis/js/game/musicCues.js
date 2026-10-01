





export const LOOPS = ['menu', 'town', 'field', 'battle', 'boss'];
export const STINGERS = ['victory', 'defeat'];
export const CUES = [...LOOPS, ...STINGERS];

export const TOWNS = ['kazan', 'shrine'];




export function cueFor({ mode, battle = null, sec = null } = {}) {
  if (battle) {
    if (battle.state === 'end') return battle.result === 'lose' ? 'defeat' : battle.result === 'win' || battle.result === 'capture' ? 'victory' : 'stop';
    return battle.boss ? 'boss' : 'battle';
  }
  if (mode === 'title' || mode === 'cutscene') return 'menu';
  if (mode === 'world') return TOWNS.includes(sec) ? 'town' : 'field';
  return null;
}
export const isLoop = (cue) => LOOPS.includes(cue);



export function preloadFor(cue) {
  if (cue === 'menu') return ['menu'];
  if (cue === 'town' || cue === 'field') return ['town', 'field'];
  if (cue === 'battle' || cue === 'boss' || STINGERS.includes(cue)) return ['battle', 'boss', 'victory', 'defeat'];
  return [];
}




export const AMBIENCE = {
  kazan: { wind: 0.5, rumble: 0.7, birds: 0.25 },
  slope: { wind: 0.8, rumble: 0.3, birds: 0.35 },
  jungle: { bugs: 0.8, birds: 0.7, wind: 0.2 },
  road: { wind: 0.5, birds: 0.6, bugs: 0.3 },
  coast: { surf: 0.9, wind: 0.5, birds: 0.3 },
  shrine: { chimes: 0.7, wind: 0.4, birds: 0.3 },
  coral: { surf: 0.6, wind: 0.2, bugs: 0.2 },
  verdant: { bugs: 0.7, birds: 0.8, wind: 0.3 },
};
export const AMBIENCE_LAYERS = ['wind', 'surf', 'bugs', 'birds', 'rumble', 'chimes'];
export function ambienceFor(mode, sec) {
  const mix = mode === 'world' || mode === 'menu' ? AMBIENCE[sec] : null;
  const out = {};
  for (const l of AMBIENCE_LAYERS) out[l] = (mix && mix[l]) || 0;
  return out;
}



export function fileFor(cue, canPlay = () => '') {
  if (!CUES.includes(cue)) return '';
  if (canPlay('audio/webm; codecs="opus"')) return 'assets/music/' + cue + '.webm';
  if (canPlay('audio/ogg; codecs="opus"') || canPlay('audio/ogg; codecs="vorbis"')) return 'assets/music/' + cue + '.ogg';
  return '';
}
