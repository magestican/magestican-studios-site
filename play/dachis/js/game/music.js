


import * as lofi from '../vendor/arbelo/audio/lofi.js';
import { Chiptune } from '../vendor/arbelo/audio/chiptune.js';
import { S } from './state.js';

let chip = null, lofiWasOn = false;
export const music = {
  lofi,
  
  battle(on) {
    try {
      if (on) {
        lofiWasOn = lofi.isOn();
        if (lofiWasOn) lofi.setOn(false);
        if (S.sfx.muted) return;
        if (!chip) chip = new Chiptune({ seed: 1992 });
        chip.start();
      } else {
        if (chip) chip.stop();
        if (lofiWasOn) lofi.setOn(true);
        lofiWasOn = false;
      }
    } catch (e) { console.warn('[music]', e); }
  },
};
