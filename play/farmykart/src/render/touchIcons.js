


































const INK = '#1c1a17';
const PAPER = '#f6f1e6';
const PAPER_LIT = '#fdfaf3';
const PAPER_SHADE = '#ded4bd';
const GOLD = '#f4c95d';
const GOLD_DEEP = '#d9a93a';
const BARN = '#b73a2a';
const IRON = '#35302a';













function inked(ctx, size, colour, draw, { weight = 0.055, outline = true } = {}) {
  ctx.beginPath();
  draw();
  ctx.fillStyle = colour;
  ctx.fill();
  if (outline) {
    ctx.lineWidth = Math.max(1.25, size * weight);
    ctx.strokeStyle = INK;
    ctx.stroke();
  }
}


function paperFace(ctx, x0, y0, x1, y1, lit) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  if (lit) {
    g.addColorStop(0, '#ffe9a8');
    g.addColorStop(0.5, GOLD);
    g.addColorStop(1, GOLD_DEEP);
  } else {
    g.addColorStop(0, '#fbf7ef');
    g.addColorStop(0.46, PAPER);
    g.addColorStop(1, '#ece5d5');
  }
  return g;
}



























export function drawSteeringWheel(ctx, size, { lit = false } = {}) {
  const s = size;
  ctx.clearRect(0, 0, s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const P = (u) => s * u;
  const cx = P(0.5);
  const cy = P(0.5);
  
  
  
  
  
  
  
  const R_OUT = P(0.385);
  const R_IN = P(0.272);
  const HUB = P(0.118);
  const ink = (colour, draw, opts) => inked(ctx, s, colour, draw, opts);

  
  
  const band = (a0, a1, rIn = R_IN, rOut = R_OUT) => {
    ctx.arc(cx, cy, rOut, a0, a1);
    ctx.arc(cx, cy, rIn, a1, a0, true);
    ctx.closePath();
  };

  
  
  
  const spoke = (angle) => {
    const wHub = P(0.085);
    const wRim = P(0.055);
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    const nx = -sa;
    const ny = ca;
    const x0 = cx + ca * HUB * 0.6;
    const y0 = cy + sa * HUB * 0.6;
    const x1 = cx + ca * (R_IN + P(0.03));
    const y1 = cy + sa * (R_IN + P(0.03));
    ctx.moveTo(x0 + nx * wHub, y0 + ny * wHub);
    ctx.lineTo(x1 + nx * wRim, y1 + ny * wRim);
    ctx.lineTo(x1 - nx * wRim, y1 - ny * wRim);
    ctx.lineTo(x0 - nx * wHub, y0 - ny * wHub);
    ctx.closePath();
  };
  for (const a of [Math.PI, 0, Math.PI / 2]) {
    ink(PAPER_SHADE, () => spoke(a));
  }

  
  
  
  ctx.beginPath();
  band(0, Math.PI * 2);
  ctx.fillStyle = paperFace(ctx, 0, P(0.1), 0, P(0.9), false);
  ctx.fill('evenodd');
  ctx.lineWidth = Math.max(1.5, s * 0.055);
  ctx.strokeStyle = INK;
  ctx.stroke();

  
  
  
  const GRIP = 0.42; 
  for (const centre of [-Math.PI * 0.78, -Math.PI * 0.22]) {
    ink(lit ? GOLD : '#b6a888',
      () => band(centre - GRIP, centre + GRIP, R_IN + P(0.008), R_OUT - P(0.008)),
      { weight: 0.038 });
  }

  
  
  ink(BARN, () => {
    ctx.moveTo(cx - P(0.075), cy - R_OUT + P(0.02));
    ctx.lineTo(cx + P(0.075), cy - R_OUT + P(0.02));
    ctx.lineTo(cx, cy - P(0.468));
    ctx.closePath();
  }, { weight: 0.04 });

  
  
  ink(lit ? PAPER_LIT : GOLD, () => ctx.arc(cx, cy, HUB, 0, Math.PI * 2));
  ink(INK, () => ctx.arc(cx, cy, HUB * 0.34, 0, Math.PI * 2), { outline: false });
}




















export function drawPedal(ctx, w, h, { pressed = false } = {}) {
  ctx.clearRect(0, 0, w, h);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const unit = Math.min(w, h);
  const ink = (colour, draw, opts) => inked(ctx, unit, colour, draw, opts);
  const r = unit * 0.16;

  
  
  
  ink(IRON, () => ctx.roundRect(w * 0.06, h - unit * 0.20, w * 0.88, unit * 0.20, r * 0.5));

  
  
  
  
  
  
  
  const taper = Math.min(w * 0.10, unit * 0.22);
  const drop = pressed ? unit * 0.20 : 0;
  const top = h * 0.02 + drop;
  const bot = h - unit * 0.26 + drop;
  const halfTop = w * 0.47;
  const halfBot = w * 0.47 - (pressed ? taper * 0.35 : taper);
  const cx = w * 0.5;

  
  
  
  if (!pressed) {
    ink('rgba(28,26,23,0.9)', () => {
      ctx.roundRect(cx - halfBot, top + unit * 0.19, halfBot * 2, bot - top, r);
    }, { outline: false });
  }

  const pad = () => {
    ctx.moveTo(cx - halfTop + r, top);
    ctx.lineTo(cx + halfTop - r, top);
    ctx.quadraticCurveTo(cx + halfTop, top, cx + halfTop - r * 0.4, top + r);
    ctx.lineTo(cx + halfBot, bot - r);
    ctx.quadraticCurveTo(cx + halfBot, bot, cx + halfBot - r, bot);
    ctx.lineTo(cx - halfBot + r, bot);
    ctx.quadraticCurveTo(cx - halfBot, bot, cx - halfBot, bot - r);
    ctx.lineTo(cx - halfTop + r * 0.4, top + r);
    ctx.quadraticCurveTo(cx - halfTop, top, cx - halfTop + r, top);
    ctx.closePath();
  };
  ctx.beginPath();
  pad();
  ctx.fillStyle = paperFace(ctx, 0, top, 0, bot, pressed);
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, unit * 0.055);
  ctx.strokeStyle = INK;
  ctx.stroke();

  
  
  ctx.strokeStyle = INK;
  ctx.lineWidth = Math.max(1.5, unit * 0.05);
  const treadTop = bot - (bot - top) * 0.36;
  for (let i = 0; i < 3; i += 1) {
    const y = treadTop + i * (bot - top) * 0.12;
    const k = halfBot * 0.58;
    ctx.beginPath();
    ctx.moveTo(cx - k, y);
    ctx.lineTo(cx + k, y);
    ctx.stroke();
  }

  
  
  
  const a = Math.min(w * 0.30, (bot - top) * 0.34);
  const ay = top + (bot - top) * 0.30;
  ink(INK, () => {
    ctx.moveTo(cx, ay - a * 0.72);
    ctx.lineTo(cx + a * 0.82, ay + a * 0.22);
    ctx.lineTo(cx + a * 0.34, ay + a * 0.22);
    ctx.lineTo(cx + a * 0.34, ay + a * 0.80);
    ctx.lineTo(cx - a * 0.34, ay + a * 0.80);
    ctx.lineTo(cx - a * 0.34, ay + a * 0.22);
    ctx.lineTo(cx - a * 0.82, ay + a * 0.22);
    ctx.closePath();
  }, { outline: false });
}













export function drawDriftIcon(ctx, size) {
  const s = size;
  ctx.clearRect(0, 0, s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const P = (u) => s * u;
  const ink = (colour, draw, opts) => inked(ctx, s, colour, draw, opts);

  
  
  
  
  
  
  
  
  
  
  

  
  
  ctx.strokeStyle = '#453a2c';
  for (const off of [0, 0.14]) {
    ctx.lineWidth = Math.max(2.5, s * 0.085);
    ctx.beginPath();
    ctx.moveTo(P(0.03), P(0.84 + off * 0.4));
    ctx.quadraticCurveTo(P(0.34), P(0.86 + off), P(0.62), P(0.60 + off));
    ctx.stroke();
  }

  
  
  
  for (const [x, y, rr] of [[0.20, 0.68, 0.095], [0.09, 0.83, 0.070], [0.35, 0.84, 0.058]]) {
    ink(GOLD, () => {
      const n = 4;
      for (let i = 0; i < n * 2; i += 1) {
        const ang = (Math.PI * i) / n - Math.PI / 2;
        const rad = P(i % 2 ? rr * 0.40 : rr);
        const px = P(x) + Math.cos(ang) * rad;
        const py = P(y) + Math.sin(ang) * rad;
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.closePath();
    }, { weight: 0.03 });
  }

  
  
  
  ctx.save();
  ctx.translate(P(0.52), P(0.44));
  ctx.rotate(-0.55);
  const k = (u) => s * u;
  
  
  
  
  
  
  
  for (const [wx, wy] of [[-0.17, -0.235], [0.17, -0.235], [-0.17, 0.235], [0.17, 0.235]]) {
    ink('#2f2b26', () => ctx.roundRect(k(wx) - k(0.085), k(wy) - k(0.058),
      k(0.17), k(0.116), k(0.045)), { weight: 0.028 });
  }
  ink(BARN, () => ctx.roundRect(-k(0.27), -k(0.185), k(0.54), k(0.37), k(0.10)));
  
  
  
  ink(PAPER, () => ctx.arc(-k(0.03), 0, k(0.105), 0, Math.PI * 2), { weight: 0.042 });
  ctx.restore();
}










export function drawItemBoxIcon(ctx, size) {
  const s = size;
  ctx.clearRect(0, 0, s, s);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  const P = (u) => s * u;
  const ink = (colour, draw, opts) => inked(ctx, s, colour, draw, opts);
  const poly = (pts) => {
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(P(x), P(y)) : ctx.moveTo(P(x), P(y))));
    ctx.closePath();
  };

  
  ink('#ffe9a8', () => poly([[0.50, 0.10], [0.88, 0.30], [0.50, 0.50], [0.12, 0.30]]));
  ink(GOLD_DEEP, () => poly([[0.12, 0.30], [0.50, 0.50], [0.50, 0.90], [0.12, 0.70]]));
  ink(GOLD, () => poly([[0.88, 0.30], [0.88, 0.70], [0.50, 0.90], [0.50, 0.50]]));

  
  
  
  ctx.save();
  ctx.translate(P(0.665), P(0.61));
  ctx.transform(1, 0.36, 0, 1, 0, 0);
  ctx.strokeStyle = INK;
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
}
