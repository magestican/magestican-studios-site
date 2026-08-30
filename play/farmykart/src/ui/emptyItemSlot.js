














































const INK = '#1c1a17';







export function drawGhostItemBox(ctx, size) {
  const s = size;
  ctx.clearRect(0, 0, s, s);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = INK;

  const P = (u) => s * u;
  const poly = (pts) => {
    ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(P(x), P(y)) : ctx.moveTo(P(x), P(y))));
    ctx.closePath();
    ctx.stroke();
  };

  
  
  
  
  ctx.lineWidth = Math.max(1.25, s * 0.055);

  
  
  poly([[0.50, 0.10], [0.88, 0.30], [0.50, 0.50], [0.12, 0.30]]);
  poly([[0.12, 0.30], [0.50, 0.50], [0.50, 0.90], [0.12, 0.70]]);
  poly([[0.88, 0.30], [0.88, 0.70], [0.50, 0.90], [0.50, 0.50]]);

  
  
  
  ctx.save();
  ctx.translate(P(0.665), P(0.61));
  ctx.transform(1, 0.36, 0, 1, 0, 0);
  ctx.lineWidth = Math.max(1.6, s * 0.062);
  ctx.beginPath();
  ctx.arc(0, -P(0.075), P(0.075), Math.PI * 0.92, Math.PI * 0.30, false);
  ctx.lineTo(0, P(0.055));
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, P(0.135), P(0.028), 0, Math.PI * 2);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.restore();

  ctx.restore();
}
