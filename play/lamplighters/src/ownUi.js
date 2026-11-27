




import { useOwnUiSounds } from '../../../web-engine/brand/uiSound.js';


export const SHARED_TO_OWN = Object.freeze({
  tap: ['ui', 'tap'], back: ['ui', 'back'], toggleOn: ['ui', 'toggleOn'], toggleOff: ['ui', 'toggleOff'],
  open: ['ui', 'open'], sheet: ['ui', 'open'], tick: ['ui', 'focus'], share: ['ui', 'tap'], error: ['ui', 'error'],
  
  xp: ['sfx', 'close'], levelUp: ['sfx', 'close'], badge: ['sfx', 'close'], trophy: ['sfx', 'close'],
});


export function installOwnUi(players, register = useOwnUiSounds) {
  const route = (name) => {
    const to = SHARED_TO_OWN[name];
    if (to) players[to[0]]?.play(to[1]);
  };
  register(route);
  return route;
}
