


import { dachiPortrait, castPortrait, aerowingPortrait, blitSharp } from './portraitRender.js';
import { quantise } from '../../engine/ui/pixelLayer.js';
import { G } from '../state.js';
import { KUMABO } from '../data/species.js';

const low = document.createElement('canvas'), lctx = low.getContext('2d', { willReadFrequently: true });
let token = 0;

function subject(p, px) {
  if (p === 'kid') return castPortrait('kid', { gender: G.gender }, px);
  if (p === 'elder') return castPortrait('elder', {}, px);
  if (p === 'kumabo') return dachiPortrait(KUMABO, { bandage: !G.flags.initiated }, px);
  if (p === 'priest') return dachiPortrait(G.priestSp || 65, { hat: true }, px);
  if (p === 'aerowing') return aerowingPortrait(1, px);
  if (typeof p === 'number') return dachiPortrait(p, {}, px);
  return null;
}

function compose(canvas, p, e) {
  const px = low.width;
  const g = lctx.createRadialGradient(px / 2, px * 0.4, 2, px / 2, px / 2, px * 0.7);
  g.addColorStop(0, '#fff8e6'); g.addColorStop(1, '#f0c98a');
  lctx.fillStyle = g; lctx.fillRect(0, 0, px, px);
  quantise(lctx, px, px);
  if (e && e.ready) lctx.drawImage(e.canvas, 0, 0);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  blitSharp(ctx, low, 0, 0, canvas.width, canvas.height);
}

export function paintPortrait(canvas, p) {
  const px = Math.round(canvas.width / 1.5);
  if (low.width !== px) low.width = low.height = px;
  const e = subject(p, px), mine = ++token;
  compose(canvas, p, e);
  if (e && !e.ready) e.when(() => { if (token === mine) compose(canvas, p, e); });
}

export function paintChoiceIcon(canvas, spId) {
  dachiPortrait(spId, {}, Math.round(canvas.width / 1.5)).when((e) => blitSharp(canvas.getContext('2d'), e.canvas, 0, 0, canvas.width, canvas.height));
}
