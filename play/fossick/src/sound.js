





import { createGameSfx } from '../../shared/audio/gameSfx.js';
import { CHALK, LIMESTONE, FLINT, SLATE } from './structure.js';


export const TAKES = Object.freeze({
  dig_chalk: 3, dig_limestone: 3, dig_flint: 3, dig_slate: 3,
  chip: 4, clack: 4, knock: 4, snap: 4, crack: 3, creak: 3,
  collapse: 2, freed: 2, stamp: 2, drawer: 3,
});

const DIG = Object.freeze({ [CHALK]: 'dig_chalk', [LIMESTONE]: 'dig_limestone', [FLINT]: 'dig_flint', [SLATE]: 'dig_slate' });



export const TOUCH_FROM = 0.12;



export const MIN_GAP_MS = Object.freeze({ clack: 70, knock: 70, snap: 60, chip: 40, creak: 1400 });


export function soundFor(e) {
  switch (e.type) {
    case 'dig': return DIG[e.mat] ?? 'dig_limestone';
    case 'clack': case 'knock': return e.strength >= TOUCH_FROM ? e.type : null;
    case 'burst': return 'knock';
    case 'chip': case 'snap': case 'crack': case 'creak': case 'collapse': case 'freed': return e.type;
    default: return null;
  }
}


export function createBenchSound(
  sfx = createGameSfx(new URL('../assets/sfx/', import.meta.url), Object.keys(TAKES), TAKES),
  now = () => performance.now(),
) {
  const last = new Map();
  const play = (name) => {
    const gap = MIN_GAP_MS[name] ?? 0;
    const t = now();
    if (gap && last.has(name) && t - last.get(name) < gap) return false;
    last.set(name, t);
    sfx.play(name);
    return true;
  };
  return {
    play,
    
    events(list) {
      for (const e of list) { const name = soundFor(e); if (name) play(name); }
    },
  };
}
