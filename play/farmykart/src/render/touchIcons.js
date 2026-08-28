


































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

  
  
  
  const CX = 0.55;
  const CY = 0.44;
  const YAW = -0.85;              
  const VX = 0.94;                
  const VY = -0.34;
  const ca = Math.cos(YAW);
  const sa = Math.sin(YAW);
  
  const kart = (x, y) => ({ x: CX + x * ca - y * sa, y: CY + x * sa + y * ca });
  const rearL = kart(-0.17, -0.235);
  const rearR = kart(-0.17, 0.235);

  
  
  
  
  
  
  
  
  
  
  const mark = (from) => {
    const LEN = 0.68;
    
    
    const headX = from.x + VX * 0.04;
    const headY = from.y + VY * 0.04;
    const tipX = headX - VX * LEN;
    const tipY = headY - VY * LEN;
    
    const cxp = (headX + tipX) / 2 + 0.055;
    const cyp = (headY + tipY) / 2 + 0.060;
    const N = 14;
    const left = [];
    const right = [];
    for (let i = 0; i <= N; i += 1) {
      const t = i / N;
      const u = 1 - t;
      
      const px = u * u * tipX + 2 * u * t * cxp + t * t * headX;
      const py = u * u * tipY + 2 * u * t * cyp + t * t * headY;
      const dx = 2 * u * (cxp - tipX) + 2 * t * (headX - cxp);
      const dy = 2 * u * (cyp - tipY) + 2 * t * (headY - cyp);
      const len = Math.hypot(dx, dy) || 1;
      
      
      
      
      
      
      
      const w = (0.048 + 0.010 * t) * s;
      const nx = (-dy / len) * w;
      const ny = (dx / len) * w;
      left.push([P(px) + nx, P(py) + ny]);
      right.push([P(px) - nx, P(py) - ny]);
    }
    ctx.beginPath();
    ctx.moveTo(left[0][0], left[0][1]);
    for (let i = 1; i <= N; i += 1) ctx.lineTo(left[i][0], left[i][1]);
    for (let i = N; i >= 0; i -= 1) ctx.lineTo(right[i][0], right[i][1]);
    ctx.closePath();
    const g = ctx.createLinearGradient(P(tipX), P(tipY), P(headX), P(headY));
    g.addColorStop(0, 'rgba(38,32,26,0.10)');
    g.addColorStop(0.45, 'rgba(38,32,26,0.62)');
    g.addColorStop(1, 'rgba(38,32,26,0.92)');
    ctx.fillStyle = g;
    ctx.fill();
  };
  mark(rearL);
  mark(rearR);

  
  
  
  
  
  const puff = (from, spread) => {
    const blobs = [
      [from.x - VX * 0.13 - 0.02, from.y - VY * 0.13 - 0.05, 0.085 * spread],
      [from.x - VX * 0.26 + 0.01, from.y - VY * 0.26 - 0.10, 0.062 * spread],
      [from.x - VX * 0.20 - 0.06, from.y - VY * 0.20 + 0.02, 0.052 * spread],
    ];
    const w = Math.max(1.2, s * 0.026);
    for (const colour of [INK, '#cabfa8']) {
      ctx.beginPath();
      for (const [bx, by, br] of blobs) {
        const rr = P(br) + (colour === INK ? w : 0);
        ctx.moveTo(P(bx) + rr, P(by));
        ctx.arc(P(bx), P(by), rr, 0, Math.PI * 2);
      }
      ctx.fillStyle = colour;
      ctx.fill();
    }
  };
  puff(rearL, 1.0);
  puff(rearR, 1.15);

  
  
  
  ctx.save();
  ctx.translate(P(CX), P(CY));
  ctx.rotate(YAW);
  const k = (u) => s * u;
  
  
  
  
  
  
  
  
  
  
  
  
  for (const [wx, wy, steer] of [
    [-0.17, -0.235, 0], [0.17, -0.235, 0.38],
    [-0.17, 0.235, 0], [0.17, 0.235, 0.38],
  ]) {
    ctx.save();
    ctx.translate(k(wx), k(wy));
    ctx.rotate(steer);
    ink('#2f2b26', () => ctx.roundRect(-k(0.085), -k(0.058),
      k(0.17), k(0.116), k(0.045)), { weight: 0.028 });
    ctx.restore();
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
