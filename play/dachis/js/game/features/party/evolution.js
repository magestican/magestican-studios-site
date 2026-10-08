
import { G, S, saveGame } from '../../state.js';
import { speciesById } from '../../data/species.js';
import { canEvolve, evolve } from '../battle/rules.js';
import { dachiPortrait, blitSharp } from '../../art/portraitRender.js';
import { GROWTH } from '../../art/dachiPlans.js';
import { growthLine, bodyLine } from './growthLines.js';
import { KID } from '../story/scenes.js';

const $ = id => document.getElementById(id);

export function checkEvolutions() {
  const d = G.party.concat(G.box).find(canEvolve);
  if (!d) return;
  const from = speciesById(d.sp), to = speciesById(from.evolvesTo);
  playEvolution(from, to, ok => {
    if (ok) {
      evolve(d);
      G.dex.seen[to.id] = G.dex.caught[to.id] = 1; saveGame();
      
      const grew = to.stage >= 3 ? growthLine(GROWTH[to.look && to.look.plan]) : to.stage === 2 ? bodyLine(to.look && to.look.plan) : null;
      S.dialog.say([{ text: `Congratulations! ${from.name} evolved into ${to.name}!`, portrait: to.id }, ...(grew ? [{ ...KID(), text: grew }] : [])], () => checkEvolutions());
    } else { d.noEvolve = true; checkEvolutions(); }
  });
}

function playEvolution(from, to, cb) {
  const prev = G.mode; G.mode = 'evolve';
  $('evolve').classList.remove('hidden');
  const c = $('evoCanvas'), ctx = c.getContext('2d');
  $('evoText').textContent = `What? ${from.name} is evolving!`;
  S.sfx.play('evolve');
  let t = 0, stop = false;
  
  
  const a = dachiPortrait(from.id, {}, 171, 'fixed'), b = dachiPortrait(to.id, {}, 171, 'fixed');
  const finish = ok => {
    if (stop) return; stop = true;
    $('evolve').classList.add('hidden'); G.mode = prev === 'evolve' ? 'world' : prev; S.evolveCancel = null;
    cb(ok);
  };
  S.evolveCancel = () => finish(false);
  $('evoCancel').onclick = () => finish(false);
  const loop = () => {
    if (stop) return;
    t += 1 / 60;
    ctx.clearRect(0, 0, 256, 256);
    const g = ctx.createRadialGradient(128, 140, 10, 128, 140, 140);
    g.addColorStop(0, `rgba(255,255,220,${0.6 + 0.3 * Math.sin(t * 8)})`); g.addColorStop(1, 'rgba(255,200,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256);
    blitSharp(ctx, (t < 3 && Math.sin(t * t * 6) > 0 ? a : b).canvas, 0, 0, 256, 256);
    if (t < 3) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = `rgba(255,255,255,${Math.min(0.9, t / 3)})`; ctx.fillRect(0, 0, 256, 256); ctx.globalCompositeOperation = 'source-over'; }
    if (t >= 3.4) { finish(true); return; }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}
