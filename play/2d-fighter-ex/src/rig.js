






























const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);












export function solveTwoBone(rx, ry, tx, ty, upper, lower, bend) {
  let dx = tx - rx;
  let dy = ty - ry;
  let d = Math.hypot(dx, dy);
  const reach = upper + lower;
  if (d < 1e-4) { dx = 0; dy = 1; d = 1e-4; }
  if (d > reach) {
    
    const k = reach / d;
    return { jx: rx + dx * (upper / reach), jy: ry + dy * (upper / reach),
             ex: rx + dx * k, ey: ry + dy * k, straight: true };
  }
  
  const a = (upper * upper - lower * lower + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, upper * upper - a * a));
  const mx = rx + (dx * a) / d;
  const my = ry + (dy * a) / d;
  return {
    jx: mx + (bend * h * dy) / d,
    jy: my - (bend * h * dx) / d,
    ex: tx, ey: ty, straight: false,
  };
}






export function buildSkeleton({ cx, feet, top, facing = 1, headX, hands, feetPts, figure = {} }) {
  const h = Math.max(28, feet - top);
  const f = facing >= 0 ? 1 : -1;

  
  
  const headH = h * 0.235 * (figure.headRatio || 1);
  const headW = headH * 0.82;
  const neckY = top + headH * 0.94;
  const chestY = neckY + h * 0.045;
  const hipY = top + headH + (h - headH) * 0.46;
  const shoulderW = h * 0.21;
  const hipW = h * 0.145;

  
  
  const upperArm = h * 0.155;
  const foreArm = h * 0.150;
  const thigh = h * 0.195;
  const shin = h * 0.185;

  const shoulder = { L: [cx - shoulderW * 0.5, chestY], R: [cx + shoulderW * 0.5, chestY] };
  const hip = { L: [cx - hipW * 0.5, hipY], R: [cx + hipW * 0.5, hipY] };

  const restHand = [[cx - shoulderW * 0.8, chestY + h * 0.20], [cx + shoulderW * 0.8, chestY + h * 0.20]];
  const restFoot = [[cx - hipW * 0.7, feet], [cx + hipW * 0.7, feet]];
  const hp = hands && hands.length === 2 ? hands : restHand;
  const fp = feetPts && feetPts.length === 2 ? feetPts : restFoot;

  
  
  const nearIsRight = f > 0;
  const sideOf = (i) => (i === (nearIsRight ? 1 : 0) ? 'near' : 'far');

  const arms = [0, 1].map((i) => {
    const root = i === 0 ? shoulder.L : shoulder.R;
    
    const bend = (i === 0 ? -1 : 1) * (f > 0 ? 1 : -1) * -1;
    const s = solveTwoBone(root[0], root[1], hp[i][0], hp[i][1], upperArm, foreArm, bend);
    return { side: sideOf(i), root, elbow: [s.jx, s.jy], hand: [s.ex, s.ey], straight: s.straight };
  });

  const legs = [0, 1].map((i) => {
    const root = i === 0 ? hip.L : hip.R;
    
    
    const bend = (i === 0 ? 1 : -1) * (f > 0 ? 1 : -1);
    const target = [fp[i][0], Math.max(fp[i][1], root[1] + (thigh + shin) * 0.25)];
    const s = solveTwoBone(root[0], root[1], target[0], target[1], thigh, shin, bend);
    return { side: sideOf(i), root, knee: [s.jx, s.jy], ankle: [s.ex, s.ey], straight: s.straight };
  });

  
  const leanRaw = headX === undefined ? 0 : headX - cx;
  const lean = clamp(leanRaw, -headW * 0.42, headW * 0.42);

  
  
  
  
  
  
  
  
  
  
  
  
  const footMid = [(fp[0][0] + fp[1][0]) / 2, (fp[0][1] + fp[1][1]) / 2];
  const headPt = [cx + lean, top + headH * 0.5];
  let ang = Math.atan2(headPt[0] - footMid[0], footMid[1] - headPt[1]);
  if (!Number.isFinite(ang)) ang = 0;
  
  ang = clamp(ang, -1.4, 1.4);
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const pivot = [cx, hipY];
  const rot = (p) => {
    const dx = p[0] - pivot[0];
    const dy = p[1] - pivot[1];
    return [pivot[0] + dx * ca - dy * sa, pivot[1] + dx * sa + dy * ca];
  };

  for (const a of arms) {
    a.root = rot(a.root); a.elbow = rot(a.elbow); a.hand = rot(a.hand);
  }
  for (const l of legs) {
    l.root = rot(l.root); l.knee = rot(l.knee); l.ankle = rot(l.ankle);
  }
  const headR = rot(headPt);
  const neckR = rot([cx + lean * 0.35, neckY]);
  const chestR = rot([cx, chestY]);

  return {
    h, f, headH, headW, angle: ang,
    
    
    
    rot,
    local: {
      head: headPt, neck: [cx + lean * 0.35, neckY], chest: [cx, chestY],
      hips: [cx, hipY], shoulderW, hipW,
    },
    head: { cx: headR[0], cy: headR[1], w: headW, h: headH },
    neck: neckR,
    chest: chestR,
    hips: [cx, hipY],
    shoulderW, hipW, feet,
    arms, legs,
    widths: {
      upperArm: Math.max(2.4, h * 0.052),
      foreArm: Math.max(2.0, h * 0.044),
      thigh: Math.max(3.0, h * 0.070),
      shin: Math.max(2.6, h * 0.058),
    },
  };
}


export function reachError(sk, targets) {
  let worst = 0;
  sk.arms.forEach((a, i) => {
    if (!targets.hands || !targets.hands[i]) return;
    const d = Math.hypot(a.hand[0] - targets.hands[i][0], a.hand[1] - targets.hands[i][1]);
    worst = Math.max(worst, d / sk.h);
  });
  return worst;
}
