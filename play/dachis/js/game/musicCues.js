





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



export function fileFor(cue, canPlay = () => '') {
  if (!CUES.includes(cue)) return '';
  if (canPlay('audio/webm; codecs="opus"')) return 'assets/music/' + cue + '.webm';
  if (canPlay('audio/ogg; codecs="opus"') || canPlay('audio/ogg; codecs="vorbis"')) return 'assets/music/' + cue + '.ogg';
  return '';
}
