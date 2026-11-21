





















export const SFX_TAKES = Object.freeze({
  shot: 4, absorb: 5, flipEmber: 3, flipIris: 3, release: 2, full: 2, pop: 4, crash: 3, bossDown: 2, bomb: 2,
  hurt: 3, link: 2, hit1: 2, hit2: 2, hit3: 2, hit4: 2, hit5: 2,
});





export const SFX_GAIN = Object.freeze({ shot: 0.8 });


const HEAVY = new Set([2, 4, 5]);


export function killCue(kind, boss = false) {
  if (boss) return 'bossDown';
  return HEAVY.has(kind) ? 'crash' : 'pop';
}

export const HIT_RUNGS = 5;






export function hitTickCue(hp, hp0) {
  if (!(hp0 > 0)) return 'hit1';
  const done = Math.min(1, Math.max(0, 1 - hp / hp0));
  return `hit${Math.min(HIT_RUNGS, 1 + Math.floor(done * HIT_RUNGS))}`;
}






export function createHitGate(minMs = 60) {
  let pending = null, last = -Infinity;
  const rung = (c) => Number(c.slice(3));
  return {
    offer(cue) { if (!pending || rung(cue) > rung(pending)) pending = cue; },
    take(now) {
      if (!pending || now - last < minMs) return null;
      const c = pending; pending = null; last = now;
      return c;
    },
  };
}


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
