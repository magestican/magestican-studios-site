






export function createHints(input) {
  let list = [];
  const h = {
    begin() { list = []; },
    
    add(t) { list.push(t); return t; },
    hit(px, py) {
      let best = null, bd = Infinity;
      for (const t of list) {
        if (!t.onTap) continue;
        const d = Math.hypot(px - t.x, py - t.y);
        if (d < Math.max(28, t.r * 1.2) && d - (t.priority || 0) * 100 < bd) { bd = d - (t.priority || 0) * 100; best = t; }
      }
      return best;
    },
    draw(ctx, time) {
      for (const t of list) {
        const pulse = 0.5 + 0.5 * Math.sin(time * 5 + t.x * 0.01);
        const color = t.color || '#ffe46a';
        if (t.icon !== 'bang' && t.r) {
          ctx.save(); ctx.globalAlpha = 0.35 + pulse * 0.45; ctx.strokeStyle = color; ctx.lineWidth = 3;
          ctx.beginPath(); ctx.ellipse(t.x, t.y, t.r * (1 + pulse * 0.12), t.r * 0.5 * (1 + pulse * 0.12), 0, 0, Math.PI * 2); ctx.stroke();
          ctx.restore();
        }
        const by = (t.bubbleY ?? t.y - (t.r || 20) * 0.5 - 34) - Math.abs(Math.sin(time * 4)) * 5;
        if (t.icon === 'bang') drawBang(ctx, t.x, by, color);
        const g = t.action ? input.glyph(t.action) : null;
        const gx = t.x, gy = t.icon === 'bang' ? by - 30 : by;
        if (g) drawKey(ctx, gx, gy, g, input.mode === 'pad');
        else if (input.mode === 'touch' && t.onTap) drawFinger(ctx, gx, gy, time);
        if (t.label) {
          ctx.font = 'bold 13px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center';
          ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(20,16,40,0.9)'; ctx.fillStyle = '#fff';
          const ly = gy - 22; ctx.strokeText(t.label, gx, ly); ctx.fillText(t.label, gx, ly); ctx.textAlign = 'left';
        }
      }
    },
  };
  return h;
}

function drawKey(ctx, x, y, g, round) {
  ctx.save();
  ctx.font = 'bold 14px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = Math.max(24, ctx.measureText(g).width + 12);
  ctx.fillStyle = round ? '#2f7d3b' : '#fdfaf0'; ctx.strokeStyle = '#1c1830'; ctx.lineWidth = 2;
  ctx.beginPath();
  if (round) ctx.arc(x, y, 13, 0, Math.PI * 2); else ctx.roundRect(x - w / 2, y - 12, w, 24, 6);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = round ? '#fff' : '#1c1830'; ctx.fillText(g, x, y + 1);
  ctx.restore();
}
function drawFinger(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y + Math.sin(t * 6) * 3);
  ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1c1830'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.roundRect(-4, -14, 8, 18, 4); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-9, -2, 18, 14, 6); ctx.fill(); ctx.stroke();
  ctx.restore();
}
export function drawBang(ctx, x, y, color = '#ffe46a') {
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = color; ctx.strokeStyle = '#1c1830'; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(13, 4); ctx.lineTo(-13, 4); ctx.closePath();
  ctx.beginPath(); ctx.arc(0, -4, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#1c1830'; ctx.font = '900 18px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('!', 0, -3);
  ctx.restore();
}
