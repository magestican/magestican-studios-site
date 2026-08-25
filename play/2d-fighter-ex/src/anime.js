



















import { ANIME, LINE, KITS } from './palette.js';

const HEAD_RATIO = 0.30;   
const IRIS_RATIO = 0.68;   

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);







export function buildAnimeFigure({
  cx, feet, top, facing = 1, headX, hands, feetPts, kit, lookAt,
}) {
  const h = Math.max(24, feet - top);
  const f = facing >= 0 ? 1 : -1;
  const out = [];

  const headH = h * HEAD_RATIO;
  const headW = headH * 0.86;
  const headCx = headX === undefined ? cx : headX;
  const headCy = top + headH * 0.5;

  const neckY = top + headH * 0.92;
  const hipY = top + headH + (h - headH) * 0.46;
  const bodyW = h * 0.23;

  const shoulderY = neckY + h * 0.04;
  const shoulderL = cx - bodyW * 0.52;
  const shoulderR = cx + bodyW * 0.52;
  const hipL = cx - bodyW * 0.34;
  const hipR = cx + bodyW * 0.34;

  const limbW = Math.max(2.8, h * 0.060);
  const legW = Math.max(3.0, h * 0.070);
  const armMax = h * 0.42;
  const legMax = h * 0.45;

  const reach = (x0, y0, p, max) => {
    let dx = p[0] - x0;
    let dy = p[1] - y0;
    const len = Math.hypot(dx, dy) || 1;
    if (len > max) { dx *= max / len; dy *= max / len; }
    return [x0 + dx, y0 + dy];
  };

  
  const far = shade(kit.limb, -0.18);
  const fp = feetPts && feetPts.length ? feetPts : [[cx - legW, feet], [cx + legW, feet]];
  const hp = hands && hands.length ? hands : [[cx - bodyW, hipY - h * 0.1], [cx + bodyW, hipY - h * 0.1]];

  const legFar = reach(hipL, hipY, fp[0], legMax);
  out.push(capsule(hipL, hipY, legFar[0], legFar[1], legW, far));
  const armFar = reach(shoulderL, shoulderY, hp[0], armMax);
  out.push(capsule(shoulderL, shoulderY, armFar[0], armFar[1], limbW, far));
  out.push(circle(armFar[0], armFar[1], limbW * 0.62, shade(kit.skin, -0.15)));

  
  const torsoTop = neckY;
  out.push({
    t: 'poly', fill: kit.top, line: LINE,
    pts: [
      [cx - bodyW * 0.46, torsoTop],
      [cx + bodyW * 0.46, torsoTop],
      [cx + bodyW * 0.56, torsoTop + (hipY - torsoTop) * 0.55],
      [cx + bodyW * 0.40, hipY],
      [cx - bodyW * 0.40, hipY],
      [cx - bodyW * 0.56, torsoTop + (hipY - torsoTop) * 0.55],
    ],
  });
  
  out.push({
    t: 'poly', fill: kit.legs, line: LINE,
    pts: [
      [cx - bodyW * 0.42, hipY - h * 0.02],
      [cx + bodyW * 0.42, hipY - h * 0.02],
      [cx + bodyW * 0.38, hipY + h * 0.06],
      [cx - bodyW * 0.38, hipY + h * 0.06],
    ],
  });

  
  const legNear = reach(hipR, hipY, fp[Math.min(1, fp.length - 1)], legMax);
  out.push(capsule(hipR, hipY, legNear[0], legNear[1], legW, kit.legs));
  out.push(capsule(legNear[0], legNear[1], legNear[0] + f * legW * 0.9, legNear[1], legW * 0.8, kit.shoe));
  const armNear = reach(shoulderR, shoulderY, hp[Math.min(1, hp.length - 1)], armMax);
  out.push(capsule(shoulderR, shoulderY, armNear[0], armNear[1], limbW, kit.limb));
  out.push(circle(armNear[0], armNear[1], limbW * 0.68, kit.skin));

  
  
  out.push({ t: 'ellipse', cx: headCx, cy: headCy, rx: headW * 0.5, ry: headH * 0.5, fill: kit.skin, line: LINE });

  
  out.push({
    t: 'poly', fill: kit.hair, line: LINE,
    pts: [
      [headCx - headW * 0.52, headCy + headH * 0.06],
      [headCx - headW * 0.50, headCy - headH * 0.34],
      [headCx - headW * 0.22, headCy - headH * 0.54],
      [headCx + headW * 0.22, headCy - headH * 0.54],
      [headCx + headW * 0.50, headCy - headH * 0.34],
      [headCx + headW * 0.52, headCy + headH * 0.06],
      [headCx + headW * 0.30, headCy - headH * 0.10],
      [headCx + headW * 0.05, headCy - headH * 0.20],
      [headCx - headW * 0.24, headCy - headH * 0.08],
    ],
  });

  
  const eyeY = headCy + headH * 0.10;
  const eyeH = headH * 0.30;
  const eyeW = eyeH * 0.72;
  
  const gap = eyeW * 1.15;
  
  const look = lookAt === undefined ? f : Math.sign(lookAt - cx) || f;

  for (const side of [-1, 1]) {
    const ex = headCx + side * gap * 0.5 + f * headW * 0.04;
    
    out.push({ t: 'ellipse', cx: ex, cy: eyeY, rx: eyeW * 0.5, ry: eyeH * 0.5, fill: ANIME.secondary, line: null });
    
    const irisR = eyeH * 0.5 * IRIS_RATIO;
    const ix = ex + look * eyeW * 0.10;
    out.push({ t: 'ellipse', cx: ix, cy: eyeY + eyeH * 0.04, rx: irisR * 0.82, ry: irisR, fill: kit.iris, line: null });
    out.push({ t: 'ellipse', cx: ix, cy: eyeY + eyeH * 0.08, rx: irisR * 0.42, ry: irisR * 0.52, fill: shade(kit.iris, -0.55), line: null });
    
    out.push(circle(ix - irisR * 0.42, eyeY - irisR * 0.42, irisR * 0.40, ANIME.highlight));
    out.push(circle(ix + irisR * 0.40, eyeY + irisR * 0.46, irisR * 0.17, ANIME.highlight));
    
    out.push({
      t: 'lid', x: ex, y: eyeY - eyeH * 0.44, w: eyeW, thick: Math.max(1, eyeH * 0.16), fill: LINE,
    });
  }

  
  for (const side of [-1, 1]) {
    const ex = headCx + side * gap * 0.5 + f * headW * 0.04;
    out.push({
      t: 'brow', x: ex, y: eyeY - eyeH * 0.86, w: eyeW * 0.9,
      tilt: side * -0.30, thick: Math.max(1, eyeH * 0.13), fill: kit.hair,
    });
  }

  
  out.push({
    t: 'lid', x: headCx + f * headW * 0.06, y: headCy + headH * 0.34,
    w: headW * 0.16, thick: Math.max(1, headH * 0.045), fill: LINE,
  });

  return out;

  function capsule(x0, y0, x1, y1, w, fill) {
    return { t: 'capsule', x0, y0, x1, y1, r: w * 0.5, fill, line: LINE };
  }
  function circle(x, y, r, fill) {
    return { t: 'ellipse', cx: x, cy: y, rx: r, ry: r, fill, line: null };
  }
}


export function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const v = amount >= 0 ? c + (255 - c) * amount : c * (1 + amount);
    return clamp(Math.round(v), 0, 255);
  });
  return `#${ch.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}


export function drawAnime(ctx, shapes, lineScale = 1) {
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (const s of shapes) {
    if (s.t === 'capsule') {
      ctx.strokeStyle = s.fill;
      ctx.lineWidth = s.r * 2;
      ctx.beginPath();
      ctx.moveTo(s.x0, s.y0);
      ctx.lineTo(s.x1, s.y1);
      ctx.stroke();
    } else if (s.t === 'ellipse') {
      ctx.fillStyle = s.fill;
      ctx.beginPath();
      ctx.ellipse(s.cx, s.cy, Math.max(0.4, s.rx), Math.max(0.4, s.ry), 0, 0, Math.PI * 2);
      ctx.fill();
      if (s.line) { ctx.strokeStyle = s.line; ctx.lineWidth = lineScale; ctx.stroke(); }
    } else if (s.t === 'poly') {
      ctx.fillStyle = s.fill;
      ctx.beginPath();
      ctx.moveTo(s.pts[0][0], s.pts[0][1]);
      for (let i = 1; i < s.pts.length; i += 1) ctx.lineTo(s.pts[i][0], s.pts[i][1]);
      ctx.closePath();
      ctx.fill();
      if (s.line) { ctx.strokeStyle = s.line; ctx.lineWidth = lineScale; ctx.stroke(); }
    } else if (s.t === 'lid') {
      ctx.strokeStyle = s.fill;
      ctx.lineWidth = s.thick;
      ctx.beginPath();
      ctx.moveTo(s.x - s.w * 0.5, s.y);
      ctx.lineTo(s.x + s.w * 0.5, s.y);
      ctx.stroke();
    } else if (s.t === 'brow') {
      ctx.strokeStyle = s.fill;
      ctx.lineWidth = s.thick;
      ctx.beginPath();
      ctx.moveTo(s.x - s.w * 0.5, s.y - s.w * 0.5 * s.tilt);
      ctx.lineTo(s.x + s.w * 0.5, s.y + s.w * 0.5 * s.tilt);
      ctx.stroke();
    }
  }
}

export { KITS };
