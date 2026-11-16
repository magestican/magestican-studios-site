










export const SFX_TAKES = Object.freeze({
  shot: 4, absorb: 5, flipEmber: 3, flipIris: 3, release: 2, full: 2, pop: 4, boom: 2, hurt: 3, link: 2,
});


export const MENU_CUES = Object.freeze(['tap', 'back', 'toggleOn', 'toggleOff', 'open']);


export const MUSIC_TRACKS = Object.freeze(['main']);


export function flipCue(pol) {
  if (pol === 'ember') return 'flipEmber';
  if (pol === 'iris') return 'flipIris';
  return null;
}


export function soundToggleCue(soundOn) {
  return soundOn ? 'toggleOn' : 'toggleOff';
}






export function createFlipWatch(initial = null) {
  let last = initial;
  return (pol) => {
    if (pol === last) return null;
    const first = last === null;
    last = pol;
    return first ? null : flipCue(pol);
  };
}


export function followSound(music, soundOn) {
  if (!music) return false;
  if (music.isOn() !== !!soundOn) music.setOn(!!soundOn);
  return music.isOn();
}
