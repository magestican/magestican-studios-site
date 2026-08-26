















const PAD_X = 7;
const PAD_Y = 5;
const RADIUS = 6;
const FONT = '9px system-ui, -apple-system, "Segoe UI", sans-serif';


export function revealed(text, i, n) {
  
  const t = Math.min(1, (i / Math.max(1, n)) / 0.55);
  return text.slice(0, Math.ceil(text.length * t));
}


export function bubbleAlpha(i, n) {
  const IN = 5;
  const OUT = 7;
  if (i < IN) return i / IN;
  if (i > n - OUT) return Math.max(0, (n - i) / OUT);
  return 1;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}









export function drawBubble(ctx, speaker, say, ink = '#17141d', fill = '#fdfcf8') {
  if (!speaker || !say) return null;
  const alpha = bubbleAlpha(say.i, say.n);
  if (alpha <= 0) return null;
  const text = revealed(say.text, say.i, say.n);
  if (!text) return null;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.font = FONT;
  ctx.textBaseline = 'top';
  const w = ctx.measureText(say.text).width + PAD_X * 2;
  const h = 11 + PAD_Y * 2;

  
  
  const cx = speaker.cx + (speaker.facing > 0 ? 14 : -14);
  const x = Math.max(4, Math.min(ctx.canvas.width - w - 4, cx - w / 2));
  const y = speaker.top - h - 16;

  ctx.lineJoin = 'round';
  ctx.fillStyle = fill;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.6;
  roundRect(ctx, x, y, w, h, RADIUS);
  ctx.fill();
  ctx.stroke();

  
  
  const tx = Math.max(x + 8, Math.min(x + w - 8, speaker.cx));
  ctx.beginPath();
  ctx.moveTo(tx - 4, y + h - 1);
  ctx.lineTo(tx + 4, y + h - 1);
  ctx.lineTo(speaker.cx + (speaker.facing > 0 ? 2 : -2), speaker.top - 4);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.stroke();
  
  ctx.beginPath();
  ctx.moveTo(tx - 3.4, y + h - 1.4);
  ctx.lineTo(tx + 3.4, y + h - 1.4);
  ctx.strokeStyle = fill;
  ctx.lineWidth = 2.2;
  ctx.stroke();

  ctx.fillStyle = ink;
  ctx.fillText(text, x + PAD_X, y + PAD_Y);
  ctx.restore();
  return { x, y, w, h };
}
