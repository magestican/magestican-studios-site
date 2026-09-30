

import { U } from '../../../engine/core/util.js';
import { toast } from '../../../engine/ui/dialog.js';
import { G, S, saveGame } from '../../state.js';
import { CHAR_SCALE } from '../world/crowd.js';

export const ITEMS = {
  tonic: { name: 'Berry Tonic', icon: 'cup', text: 'Restores half the HP of your fighting dachi. In battle: T.' },
  seal: { name: 'Heart Seal', icon: 'heart', text: 'Lets you start the befriending ritual at ANY hp.' },
  candy: { name: 'Spirit Candy', icon: 'sparkle', text: 'Training treat: gives XP to all your companions. Use it from the Items menu.' },
};

export function spotUnderKid() {
  const p = G.player;
  return S.W.spots.find(s => !G.flags.taken[s.id] && U.dist(p.x, p.y, s.x, s.y) < 0.6) || null;
}

export function pickUp(spot) {
  G.flags.taken[spot.id] = 1;
  G.items[spot.item] = (G.items[spot.item] || 0) + 1;
  S.sfx.play('pickup');
  toast(`Found a ${ITEMS[spot.item].name}!`);
  saveGame();
}


export function hintPickup(spot) {
  const p = G.player;
  const [x, headY] = S.stage.toScreen(p.x, p.y, S.W.groundAt(p.x, p.y) + 1.75 * CHAR_SCALE); 
  S.hints.add({ x, y: headY - 14, r: 0, icon: 'bang', bubbleY: headY - 14, action: 'action', label: 'Pick up', onTap: () => pickUp(spot), priority: 2 });
}
