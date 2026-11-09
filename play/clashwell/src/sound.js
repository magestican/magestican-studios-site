














export const MENU_CUES = Object.freeze(['tap', 'back', 'toggleOn', 'toggleOff', 'open']);
const BACK_IDS = new Set(['select-back', 'leave-room', 'quit', 'to-title']);


export function menuCue(id, soundOn) {
  if (id === 'pad' || String(id).startsWith('pad-')) return null;
  if (id === 'sound' || id === 'sound-title') return soundOn ? 'toggleOn' : 'toggleOff';
  if (BACK_IDS.has(id)) return 'back';
  if (id === 'pick-fighter') return 'open';
  return 'tap';
}






export const MUSIC_TRACKS = Object.freeze(['main']);


export function followSound(music, soundOn) {
  if (!music) return false;
  if (music.isOn() !== !!soundOn) music.setOn(!!soundOn);
  return music.isOn();
}


export const SILENT_EVENTS = Object.freeze(['over']);

const chainCue = (steps) => (steps >= 4 ? 'chain4' : `chain${steps}`);


export function cueFor(e, mine) {
  const ownHands = mine === null || e.player === mine;
  switch (e.type) {
    case 'lock':
      if (!ownHands) return null;
      if (e.steps.length === 0) return mine === null ? null : 'lock';
      return e.steps.length === 1 ? 'clear' : chainCue(e.steps.length);
    case 'rise': return ownHands ? 'rise' : null;
    case 'fire': return e.kind === 'heavy' ? 'heavy' : 'light';
    case 'clash': return 'clash';
    case 'land': return 'hit';
    case 'squeeze': return 'squeeze';
    case 'round': return e.winner === null ? null : 'ko';
    case 'start': return 'start';
    default: return null;
  }
}


export function pieceCue(before, after) {
  if (!before || !after) return null;
  if (after.rot !== before.rot) return 'turn';
  return after.x !== before.x ? 'move' : null;
}





export function createCuePlayer(play, now = () => performance.now(), gapMs = 50) {
  const last = new Map();
  return (cue) => {
    if (!cue) return false;
    const at = now();
    if (at - (last.get(cue) ?? -Infinity) < gapMs) return false;
    last.set(cue, at);
    return play(cue);
  };
}
