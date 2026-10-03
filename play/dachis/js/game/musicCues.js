








export const INTRO_MOODS = ['alley', 'spiral', 'fall', 'wonder']; 
export const INTRO_CUES = INTRO_MOODS.map((m) => 'intro-' + m);
export const LOOPS = ['menu', 'town', 'field', 'battle', 'boss', 'cave', ...INTRO_CUES];
export const STINGERS = ['victory', 'defeat'];
export const CUES = [...LOOPS, ...STINGERS];

export const TOWNS = ['kazan', 'village', 'shrine', 'shrine-village', 'shellhaven', 'hollowroot', 'vinegate']; 


export const CAVES = { 'ember-a': 'cave', 'ember-b': 'cave', 'temple-porch': 'cave', 'temple-nave': 'cave', 'temple-sanctum': 'cave', 'tree-vault': 'cave', 'tree-heart': 'cave', 'tree-roots': 'cave' }; 




export function cueFor({ mode, battle = null, sec = null, mood = null } = {}) {
  if (battle) {
    if (battle.state === 'end') return battle.result === 'lose' ? 'defeat' : battle.result === 'win' || battle.result === 'capture' ? 'victory' : 'stop';
    return battle.boss ? 'boss' : 'battle';
  }
  if (mode === 'cutscene' && INTRO_MOODS.includes(mood)) return 'intro-' + mood;
  if (mode === 'title' || mode === 'cutscene') return 'menu';
  if (mode === 'world') return TOWNS.includes(sec) ? 'town' : CAVES[sec] || 'field';
  if (mode === 'travel') return 'field'; 
  return null;
}
export const isLoop = (cue) => LOOPS.includes(cue);



export function preloadFor(cue) {
  if (cue === 'menu') return ['menu'];
  if (INTRO_CUES.includes(cue)) { const i = INTRO_CUES.indexOf(cue); return INTRO_CUES.slice(i, i + 2); } 
  if (cue === 'town' || cue === 'field') return ['town', 'field'];
  if (cue === 'cave') return ['cave', 'field']; 
  if (cue === 'battle' || cue === 'boss' || STINGERS.includes(cue)) return ['battle', 'boss', 'victory', 'defeat'];
  return [];
}




export const AMBIENCE = {
  kazan: { wind: 0.5, rumble: 0.7, birds: 0.25 },
  village: { wind: 0.5, rumble: 0.7, birds: 0.25 },
  'ember-a': { rumble: 0.8, wind: 0.25 },
  'ember-b': { rumble: 1, wind: 0.15 },
  slope: { wind: 0.8, rumble: 0.3, birds: 0.35 },
  jungle: { bugs: 0.8, birds: 0.7, wind: 0.2 },
  road: { wind: 0.5, birds: 0.6, bugs: 0.3 },
  coast: { surf: 0.9, wind: 0.5, birds: 0.3 },
  'tomo-coast': { surf: 0.9, wind: 0.5, birds: 0.3 },
  shrine: { chimes: 0.7, wind: 0.4, birds: 0.3 },
  'shrine-village': { chimes: 0.7, wind: 0.4, birds: 0.3 },
  coral: { surf: 0.6, wind: 0.2, bugs: 0.2 },
  shellhaven: { surf: 0.5, chimes: 0.35, wind: 0.1 },
  'kelp-maze': { surf: 0.7, bugs: 0.15 },
  hollowroot: { wind: 0.6, birds: 0.7, chimes: 0.2 },
  'tree-vault': { chimes: 0.3, wind: 0.2 }, 'tree-heart': { chimes: 0.4, bugs: 0.2 }, 'tree-roots': { wind: 0.15, chimes: 0.2 }, 
  vinegate: { surf: 0.35, bugs: 0.7, birds: 0.6 }, 
  'thorn-upper': { bugs: 0.6, birds: 0.5, wind: 0.3 }, 'thorn-lower': { bugs: 0.8, wind: 0.4, birds: 0.3 }, 
  'temple-porch': { surf: 0.4, chimes: 0.2 }, 'temple-nave': { surf: 0.3, chimes: 0.3 }, 'temple-sanctum': { chimes: 0.6, surf: 0.2 }, 
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
