




import { G, S } from '../../state.js';
import { toast } from '../../../engine/ui/dialog.js';
import { lampsToLight } from './regionMaps/lanternShaft.js';
import { fromUV } from './sections.js';

let fade = 0;

export function darkPass(ctx, dt) {
  const W = S.W, D = W && W.dark;
  if (!D || G.region !== W.region) { fade = 0; return; }
  const lit = (G.flags.lit = G.flags.lit || {});
  D.lit = lit; 
  const shut = (D.gates || []).filter((g) => !g.lamps.every((id) => lit[id]));
  if (G.mode === 'world') {
    const now = lampsToLight(D.lamps, lit, G.player.x, G.player.y, D.catch);
    for (const id of now) lit[id] = true;
    if (now.length) {
      S.sfx.play('lanternCatch'); 
      const n = D.lamps.filter((l) => lit[l.id]).length;
      if (n === 1) toast('The lantern catches. It will stay lit.', 1800);
      else if (n === D.lamps.length) toast('Every lantern here is lit.', 2200);
      
      for (const g of shut) if (g.lamps.every((id) => lit[id])) { S.sfx.play('guard'); toast('Somewhere ahead, a chain drops.', 2200); }
    }
  }
  fade = G.mode === 'battle' ? Math.max(0, fade - dt * 4) : Math.min(1, fade + dt / 0.6);
  if (fade <= 0) return;
  const w = innerWidth, h = innerHeight, k = S.stage.pxPerUnit(), t = performance.now() / 1000;
  ctx.save();
  
  ctx.globalAlpha = fade;
  ctx.fillStyle = 'rgb(6,5,14)'; ctx.globalAlpha = fade * 0.93; ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'destination-out';
  const hole = (x, y, r, a = 1) => {
    const [sx, sy] = S.stage.toScreen(x, y, 0.4), g = ctx.createRadialGradient(sx, sy, r * 0.25, sx, sy, r);
    g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.6, `rgba(0,0,0,${a * 0.75})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
  };
  hole(G.player.x, G.player.y, D.kid * k * (1 + Math.sin(t * 2.1) * 0.03));
  const litLamps = D.lamps.filter((l) => lit[l.id]);
  for (const l of litLamps) hole(l.x, l.y, D.lamp * k * (1 + Math.sin(t * 7 + l.x) * 0.025));
  ctx.globalCompositeOperation = 'source-over';
  
  for (const l of litLamps) {
    const [sx, sy] = S.stage.toScreen(l.x, l.y, 0.6), g = ctx.createRadialGradient(sx, sy, 0, sx, sy, D.lamp * k * 0.8);
    g.addColorStop(0, 'rgba(255,190,90,0.22)'); g.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = g; ctx.globalAlpha = fade; ctx.beginPath(); ctx.arc(sx, sy, D.lamp * k * 0.8, 0, Math.PI * 2); ctx.fill();
  }
  for (const l of D.lamps) if (!lit[l.id]) {
    const [sx, sy] = S.stage.toScreen(l.x, l.y, 0.7);
    ctx.globalAlpha = fade * (0.55 + Math.sin(t * 3 + l.y) * 0.25); ctx.fillStyle = '#ff9a3a';
    ctx.beginPath(); ctx.arc(sx, sy, Math.max(2, k * 0.07), 0, Math.PI * 2); ctx.fill();
  }
  
  for (const g of (D.gates || [])) if (!g.lamps.every((id) => lit[id])) {
    const [ax, ay] = S.stage.toScreen(...uvPost(g, -1.6), 0.7), [bx, by] = S.stage.toScreen(...uvPost(g, 1.6), 0.7);
    ctx.globalAlpha = fade; ctx.strokeStyle = '#8a8496'; ctx.lineWidth = Math.max(2, k * 0.06); ctx.setLineDash([k * 0.12, k * 0.06]);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + k * 0.3, bx, by); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.restore();
}

const uvPost = (g, du) => fromUV(g.u + du, g.v);
