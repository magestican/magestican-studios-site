




import { G, S, saveGame } from '../../state.js';
import { toast } from '../../../engine/ui/dialog.js';
import { Batch } from '../../art/scenery/kit.js';
import { spanForm } from '../../art/scenery/frost.js';
import { applyLook } from '../../../engine/iso/cozyStage.js';
import { deckOpen, deckH } from './deckRules.js';

export const WINCH_R = 1.6, SPAN = 1.6;
let built = null; 

const decksOf = () => { const W = S.W; return W && W.decks && G.region === W.region ? W.decks : null; };
export function winchNear(x, y) {
  const W = S.W, w = W && W.winch;
  if (!w || G.region !== W.region || G.flags[w.flag]) return null;
  return Math.hypot(w.x - x, w.y - y) < WINCH_R ? w : null;
}
export function windWinch(w) {
  G.flags[w.flag] = true;
  S.sfx.play('mirrorTurn');
  toast('The drum creaks round and round... the high bridge swings up out of the canyon and catches on the far posts.', 3200);
  saveGame();
}

function spans(dk) {
  const b = new Batch('deck-' + dk.id), [ax, ay] = dk.a, [bx, by] = dk.b, L = Math.hypot(bx - ax, by - ay), n = Math.ceil(L / SPAN), rot = Math.atan2(bx - ax, by - ay);
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n;
    b.add(spanForm(), { x: ax + (bx - ax) * t, h: deckH(dk, t), y: ay + (by - ay) * t, rot, s: [1, 1, L / n / SPAN] });
  }
  const g = b.toGroup(); if (S.stage.look) applyLook(g, S.stage.look); S.stage.scene.add(g);
  return g;
}
function dispose() {
  if (!built) return;
  for (const g of Object.values(built.groups)) { S.stage.scene.remove(g); g.traverse((o) => o.geometry && o.geometry.dispose()); }
  built = null;
}

export function updateDecks() {
  const decks = decksOf();
  if (!decks) { if (built) dispose(); return; }
  if (!built || built.W !== S.W) { dispose(); built = { W: S.W, groups: {} }; }
  for (const dk of decks) if (deckOpen(dk, G.flags) && !built.groups[dk.id]) built.groups[dk.id] = spans(dk);
}
