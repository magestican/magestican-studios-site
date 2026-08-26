






















import { SeededRng } from '../../../web-engine/rng/seededRng.js';
import { CEL, mix } from './palette.js';
import { roughen, seedOf, noise1 } from './handdrawn.js';



function seededFrom(seed) {
  if (typeof seed === 'number') return new SeededRng(seed || 1);
  return new SeededRng(1).child(String(seed));
}

export const STAGE_WIDTH = 1600;
export const STAGE_HEIGHT = 271;
export const GROUND_Y = 205;

export const PARALLAX = Object.freeze({
  sky: 0,
  far: 0.18,
  rail: 0.34,
  mid: 0.56,
  ground: 1.0,
  near: 1.34,
});




export const SKY = Object.freeze({
  high: '#8FA8C8',
  mid: '#AFC2DA',
  low: '#D2DBEA',
  glow: '#E4E0D6',
  shaft: '#FFFFFF',
});

export const SNOW = Object.freeze({
  lit: '#E6EAE7',
  base: '#D3DBD8',
  shade: '#95B3DF',
  rock: '#6E7A88',
});

export const CONCRETE = Object.freeze({
  lit: '#CFD4D9',
  base: '#A8ADB2',
  shade: '#6E7378',
  deep: '#363330',
  ink: '#2E2D2A',
});

export const CITY = Object.freeze({
  vermilion: '#C7520D',
  vermilionDeep: '#8E3A09',
  sign: '#F2E6CF',
  signInk: '#22201E',
  steel: '#95A2B3',
  steelDeep: '#5E6873',
  glass: '#3E5468',
  glassLit: '#C8A24A',
  pine: '#3C5142',
  pineLit: '#587A5C',
  bamboo: '#7E8E52',
});


const HAZE = { far: 0.62, rail: 0.34, mid: 0.16, ground: 0, near: 0 };
const haze = (hex, plane) => mix(hex, SKY.low, HAZE[plane] || 0);






function danchi(rng, x, w, h, plane) {
  const out = [];
  const top = GROUND_Y - h;
  const body = haze(CONCRETE.base, plane);
  out.push({ t: 'poly', fill: body, pts: [[x, GROUND_Y], [x, top], [x + w, top], [x + w, GROUND_Y]] });
  
  
  out.push({
    t: 'poly', fill: haze(CONCRETE.lit, plane),
    pts: [[x, GROUND_Y], [x, top], [x + w * 0.22, top], [x + w * 0.22, GROUND_Y]],
  });
  out.push({
    t: 'poly', fill: haze(CONCRETE.shade, plane),
    pts: [[x + w * 0.84, GROUND_Y], [x + w * 0.84, top], [x + w, top], [x + w, GROUND_Y]],
  });

  
  
  const floors = Math.max(3, Math.round(h / 13));
  for (let f = 0; f < floors; f += 1) {
    const fy = top + 5 + (f * (h - 8)) / floors;
    out.push({ t: 'rect', fill: haze(CONCRETE.deep, plane), x: x + 2, y: fy, w: w - 4, h: 2.2 });
    const bays = Math.max(2, Math.round(w / 15));
    for (let b = 0; b < bays; b += 1) {
      const bx = x + 3 + (b * (w - 6)) / bays;
      const bw = (w - 6) / bays - 2.5;
      if (bw < 2) continue;
      
      const lit = rng.rangeI(0, 100) < 16;
      out.push({
        t: 'rect', fill: haze(lit ? CITY.glassLit : CITY.glass, plane),
        x: bx, y: fy - 4.2, w: bw, h: 4.0,
      });
    }
  }
  
  const tw = Math.min(14, w * 0.3);
  out.push({ t: 'rect', fill: haze(CONCRETE.shade, plane), x: x + w * 0.18, y: top - 7, w: tw, h: 5 });
  out.push({ t: 'rect', fill: haze(CONCRETE.deep, plane), x: x + w * 0.18 + 1, y: top - 2, w: 2, h: 2 });
  out.push({ t: 'rect', fill: haze(CONCRETE.deep, plane), x: x + w * 0.18 + tw - 3, y: top - 2, w: 2, h: 2 });
  out.push({ t: 'rect', fill: haze(CONCRETE.base, plane), x: x + w * 0.62, y: top - 5, w: w * 0.2, h: 5 });
  return out;
}


function verticalSign(rng, x, y, h, plane) {
  const out = [];
  const w = 7;
  const board = rng.rangeI(0, 100) < 45 ? CITY.vermilion : CITY.sign;
  const glyph = board === CITY.vermilion ? CITY.sign : CITY.signInk;
  out.push({ t: 'rect', fill: haze(CONCRETE.deep, plane), x: x - 1, y: y - 1, w: w + 2, h: h + 2 });
  out.push({ t: 'rect', fill: haze(board, plane), x, y, w, h });
  
  
  
  const n = Math.max(2, Math.floor(h / 8));
  for (let i = 0; i < n; i += 1) {
    const gy = y + 2 + i * (h - 3) / n;
    out.push({ t: 'rect', fill: haze(glyph, plane), x: x + 1.5, y: gy, w: w - 3, h: 1.4 });
    out.push({ t: 'rect', fill: haze(glyph, plane), x: x + 2.6, y: gy + 1.8, w: 1.3, h: 2.6 });
    if (i % 2 === 0) {
      out.push({ t: 'rect', fill: haze(glyph, plane), x: x + 1.5, y: gy + 3.4, w: w - 3, h: 1.2 });
    }
  }
  return out;
}


function pine(rng, x, base, h, plane) {
  const out = [];
  const trunkW = Math.max(2, h * 0.055);
  out.push({
    t: 'poly', fill: haze(mix(CONCRETE.deep, CITY.pine, 0.35), plane),
    pts: [[x - trunkW, base], [x - trunkW * 0.5, base - h * 0.7],
          [x + trunkW * 0.4, base - h * 0.7], [x + trunkW, base]],
  });
  
  
  const pads = rng.rangeI(3, 5);
  for (let p = 0; p < pads; p += 1) {
    const t = p / (pads - 1 || 1);
    const py = base - h * (0.42 + t * 0.58);
    const pw = h * (0.44 - t * 0.20);
    const lean = noise1(p * 2.3 + x * 0.01, 21) * pw * 0.2;
    const pts = [];
    for (let i = 0; i <= 12; i += 1) {
      const a = Math.PI + (i / 12) * Math.PI;
      pts.push([x + lean + Math.cos(a) * pw, py + Math.sin(a) * pw * 0.30]);
    }
    pts.push([x + lean + pw * 0.8, py + 2.5], [x + lean - pw * 0.8, py + 2.5]);
    out.push({ t: 'poly', fill: haze(p === pads - 1 ? CITY.pineLit : CITY.pine, plane), pts });
  }
  return out;
}


function torii(x, base, h, plane) {
  const w = h * 0.85;
  const postW = Math.max(2, h * 0.075);
  const v = haze(CITY.vermilion, plane);
  const vd = haze(CITY.vermilionDeep, plane);
  return [
    { t: 'poly', fill: v, pts: [[x - w / 2, base], [x - w / 2 + postW * 0.4, base - h], [x - w / 2 + postW * 1.2, base - h], [x - w / 2 + postW, base]] },
    { t: 'poly', fill: v, pts: [[x + w / 2 - postW, base], [x + w / 2 - postW * 1.2, base - h], [x + w / 2 - postW * 0.4, base - h], [x + w / 2, base]] },
    { t: 'poly', fill: vd, pts: [[x - w * 0.62, base - h], [x + w * 0.62, base - h], [x + w * 0.58, base - h + postW * 0.9], [x - w * 0.58, base - h + postW * 0.9]] },
    { t: 'rect', fill: v, x: x - w * 0.42, y: base - h + postW * 1.8, w: w * 0.84, h: postW * 0.7 },
  ];
}


function vending(rng, x, base, plane) {
  const w = 11;
  const h = 19;
  const y = base - h;
  const face = rng.rangeI(0, 100) < 50 ? CITY.vermilion : '#2F6EA8';
  return [
    { t: 'rect', fill: haze(CONCRETE.deep, plane), x: x - 1, y: y - 1, w: w + 2, h: h + 1 },
    { t: 'rect', fill: haze(face, plane), x, y, w, h },
    { t: 'rect', fill: haze(CITY.sign, plane), x: x + 1, y: y + 2, w: w - 2, h: 8 },
    { t: 'rect', fill: haze(CITY.glassLit, plane), x: x + 1.5, y: y + 11, w: w - 3, h: 2 },
    { t: 'rect', fill: haze(CONCRETE.ink, plane), x: x + 1.5, y: y + 14.5, w: w - 3, h: 2.5 },
  ];
}





export const RAIL_Y = 108;          
export const TRAIN_CARS = 5;
export const CAR_W = 62;
export const CAR_H = 22;








export function trainX(progress) {
  const len = TRAIN_CARS * CAR_W + 24;
  const from = -len - 40;
  const to = STAGE_WIDTH + 40;
  const t = Math.max(0, Math.min(1, (progress - 0.12) / 0.76));
  return from + (to - from) * t;
}

export function trainVisible(progress) {
  const x = trainX(progress);
  return x > -(TRAIN_CARS * CAR_W + 60) && x < STAGE_WIDTH + 60;
}


export function drawTrain(ctx, progress, { camX, camY, zoom, width, height, offsetX }) {
  if (!trainVisible(progress)) return;
  const rate = PARALLAX.rail;
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-width / 2, -height / 2);
  ctx.translate(-camX * rate, -camY * rate);
  ctx.translate(-offsetX, 0);

  const x0 = trainX(progress);
  const y = RAIL_Y - CAR_H;
  for (let c = 0; c < TRAIN_CARS; c += 1) {
    const cx = x0 + c * (CAR_W + 3);
    
    ctx.fillStyle = haze(CITY.steel, 'rail');
    ctx.fillRect(cx, y, CAR_W, CAR_H);
    
    
    ctx.fillStyle = haze(CITY.steelDeep, 'rail');
    ctx.fillRect(cx, y, CAR_W, 3);
    ctx.fillRect(cx, y + CAR_H - 4, CAR_W, 4);
    
    ctx.fillStyle = haze(CITY.vermilion, 'rail');
    ctx.fillRect(cx, y + CAR_H * 0.52, CAR_W, 3);
    
    ctx.fillStyle = haze(CITY.glass, 'rail');
    for (let w = 0; w < 5; w += 1) {
      const wx = cx + 5 + w * 11.5;
      if (w === 2) continue;                       
      ctx.fillRect(wx, y + 5, 8.5, 7);
    }
    ctx.fillStyle = haze(mix(CITY.glass, CITY.sign, 0.3), 'rail');
    ctx.fillRect(cx + 27, y + 4.5, 7, 10);         
    
    ctx.fillStyle = haze(CONCRETE.ink, 'rail');
    ctx.fillRect(cx + 8, y + CAR_H, 12, 3);
    ctx.fillRect(cx + CAR_W - 20, y + CAR_H, 12, 3);
  }
  ctx.restore();
}





export function buildStage(seed = 'fighter-ex', season = 'spring') {
  const rng = seededFrom(seed);
  const cfg = seasonOf(season);
  const planes = { far: [], rail: [], mid: [], ground: [], near: [] };

  
  for (const [tone, top, snowY] of [
    [haze(SNOW.rock, 'far'), 40, 58],
    [haze(mix(SNOW.rock, SKY.mid, 0.4), 'far'), 58, 74],
  ]) {
    const ridge = [[-260, GROUND_Y]];
    let y = top + rng.rangeI(0, 10);
    for (let x = -260; x <= STAGE_WIDTH + 260; x += 44) {
      y = Math.max(top - 22, Math.min(top + 34, y + rng.rangeI(-14, 14)));
      ridge.push([x, y]);
    }
    ridge.push([STAGE_WIDTH + 260, GROUND_Y]);
    planes.far.push({ t: 'poly', fill: tone, pts: ridge });
    
    
    for (let i = 1; i < ridge.length - 1; i += 1) {
      const [px, py] = ridge[i];
      if (py > snowY - 6) continue;
      planes.far.push({
        t: 'poly', fill: haze(SNOW.base, 'far'),
        pts: [[px - 22, py + 14], [px, py - 1], [px + 22, py + 14], [px + 9, py + 11], [px - 9, py + 11]],
      });
      planes.far.push({
        t: 'poly', fill: haze(SNOW.lit, 'far'),
        pts: [[px - 8, py + 8], [px, py - 1], [px + 7, py + 8]],
      });
    }
  }
  
  for (let x = -120; x < STAGE_WIDTH + 120; x += rng.rangeI(26, 70)) {
    const h = rng.rangeI(26, 74);
    const w = rng.rangeI(12, 30);
    planes.far.push({
      t: 'rect', fill: haze(CONCRETE.base, 'far'), x, y: GROUND_Y - h, w, h,
    });
    if (rng.rangeI(0, 100) < 30) {
      planes.far.push({ t: 'rect', fill: haze(CONCRETE.shade, 'far'), x: x + w * 0.4, y: GROUND_Y - h - 8, w: 2, h: 8 });
    }
  }

  
  planes.rail.push({
    t: 'rect', fill: haze(CONCRETE.base, 'rail'),
    x: -200, y: RAIL_Y, w: STAGE_WIDTH + 400, h: 9,
  });
  planes.rail.push({
    t: 'rect', fill: haze(CONCRETE.shade, 'rail'),
    x: -200, y: RAIL_Y + 9, w: STAGE_WIDTH + 400, h: 3,
  });
  
  
  for (let x = -180; x < STAGE_WIDTH + 200; x += 96) {
    planes.rail.push({ t: 'rect', fill: haze(CONCRETE.base, 'rail'), x, y: RAIL_Y + 12, w: 13, h: GROUND_Y - RAIL_Y - 12 });
    planes.rail.push({ t: 'rect', fill: haze(CONCRETE.shade, 'rail'), x: x + 9, y: RAIL_Y + 12, w: 4, h: GROUND_Y - RAIL_Y - 12 });
    planes.rail.push({ t: 'rect', fill: haze(CONCRETE.deep, 'rail'), x: x - 2, y: RAIL_Y + 12, w: 17, h: 3 });
  }
  
  for (let x = -160; x < STAGE_WIDTH + 200; x += 64) {
    planes.rail.push({ t: 'rect', fill: haze(CITY.steelDeep, 'rail'), x, y: RAIL_Y - 26, w: 1.6, h: 26 });
    planes.rail.push({ t: 'rect', fill: haze(CITY.steelDeep, 'rail'), x, y: RAIL_Y - 26, w: 9, h: 1.4 });
  }

  
  let x = -140;
  while (x < STAGE_WIDTH + 140) {
    const w = rng.rangeI(46, 96);
    const h = rng.rangeI(52, 92);
    planes.mid.push(...danchi(rng, x, w, h, 'mid'));
    x += w + rng.rangeI(6, 22);
  }
  
  for (let i = 0; i < 6; i += 1) {
    planes.mid.push(...pine(rng, rng.rangeI(-100, STAGE_WIDTH + 100), GROUND_Y, rng.rangeI(34, 58), 'mid'));
  }

  
  planes.ground.push({ t: 'rect', fill: CONCRETE.shade, x: -300, y: GROUND_Y, w: STAGE_WIDTH + 600, h: STAGE_HEIGHT });
  planes.ground.push({ t: 'rect', fill: CONCRETE.base, x: -300, y: GROUND_Y, w: STAGE_WIDTH + 600, h: 9 });
  planes.ground.push({ t: 'rect', fill: CONCRETE.lit, x: -300, y: GROUND_Y + 9, w: STAGE_WIDTH + 600, h: 2 });
  
  planes.ground.push({ t: 'rect', fill: CONCRETE.deep, x: -300, y: GROUND_Y + 11, w: STAGE_WIDTH + 600, h: 1.6 });
  for (let sx = -280; sx < STAGE_WIDTH + 300; sx += 34) {
    planes.ground.push({ t: 'rect', fill: mix(CITY.sign, CONCRETE.base, 0.35), x: sx, y: GROUND_Y + 34, w: 16, h: 2 });
  }
  
  let sx = -160;
  while (sx < STAGE_WIDTH + 160) {
    const w = rng.rangeI(54, 104);
    const h = rng.rangeI(30, 52);
    const top = GROUND_Y - h;
    planes.ground.push({ t: 'poly', fill: CONCRETE.base, pts: [[sx, GROUND_Y], [sx, top], [sx + w, top], [sx + w, GROUND_Y]] });
    planes.ground.push({ t: 'rect', fill: CONCRETE.deep, x: sx, y: top, w, h: 3 });
    
    planes.ground.push({
      t: 'rect', fill: rng.rangeI(0, 100) < 40 ? CITY.steelDeep : CITY.glass,
      x: sx + 4, y: GROUND_Y - h * 0.55, w: w - 8, h: h * 0.55,
    });
    
    if (rng.rangeI(0, 100) < 42) {
      planes.ground.push({
        t: 'poly', fill: CITY.vermilion,
        pts: [[sx + 2, GROUND_Y - h * 0.58], [sx + w - 2, GROUND_Y - h * 0.58],
              [sx + w - 6, GROUND_Y - h * 0.58 + 7], [sx + 6, GROUND_Y - h * 0.58 + 7]],
      });
    }
    
    const signs = rng.rangeI(1, 3);
    for (let i = 0; i < signs; i += 1) {
      planes.ground.push(...verticalSign(rng, sx + 6 + i * 14, top + 4, rng.rangeI(18, 30), 'ground'));
    }
    if (rng.rangeI(0, 100) < 30) planes.ground.push(...vending(rng, sx + w - 16, GROUND_Y, 'ground'));
    sx += w + rng.rangeI(10, 30);
  }
  
  for (let i = 0; i < 5; i += 1) {
    planes.ground.push(...pine(rng, rng.rangeI(-120, STAGE_WIDTH + 120), GROUND_Y + 4, rng.rangeI(30, 46), 'ground'));
  }
  planes.ground.push(...torii(rng.rangeI(200, STAGE_WIDTH - 200), GROUND_Y + 2, 46, 'ground'));
  
  
  for (let bx = -280; cfg.kerbSnow && bx < STAGE_WIDTH + 300; bx += rng.rangeI(40, 120)) {
    const bw = rng.rangeI(26, 70);
    planes.ground.push({
      t: 'poly', fill: SNOW.base,
      pts: [[bx, GROUND_Y + 12], [bx + bw * 0.2, GROUND_Y + 5], [bx + bw * 0.7, GROUND_Y + 4],
            [bx + bw, GROUND_Y + 12]],
    });
    planes.ground.push({
      t: 'poly', fill: SNOW.lit,
      pts: [[bx + bw * 0.2, GROUND_Y + 6], [bx + bw * 0.55, GROUND_Y + 4.5], [bx + bw * 0.6, GROUND_Y + 7]],
    });
  }

  
  for (let px = -100; px < STAGE_WIDTH + 200; px += rng.rangeI(300, 460)) {
    const top = 6;
    planes.near.push({ t: 'rect', fill: CONCRETE.shade, x: px, y: top, w: 3.4, h: STAGE_HEIGHT - top });
    for (let a = 0; a < 3; a += 1) {
      const ay = top + 10 + a * 13;
      planes.near.push({ t: 'rect', fill: CONCRETE.deep, x: px - 8, y: ay, w: 20, h: 1.6 });
    }
    
    planes.near.push({ t: 'rect', fill: CITY.steelDeep, x: px + 4.5, y: top + 26, w: 6, h: 10 });
  }
  
  for (let c = 0; c < 5; c += 1) {
    const y0 = 14 + c * 6;
    const pts = [];
    for (let cx = -200; cx <= STAGE_WIDTH + 200; cx += 40) {
      pts.push([cx, y0 + Math.sin(cx * 0.006 + c) * 3.5 + 2]);
    }
    const back = pts.slice().reverse().map(([bx, by]) => [bx, by + 1.4]);
    planes.near.push({ t: 'poly', fill: CONCRETE.deep, pts: pts.concat(back) });
  }

  
  const shafts = [];
  for (let i = 0; i < 4; i += 1) {
    shafts.push({ x: rng.rangeI(-100, STAGE_WIDTH), w: rng.rangeI(20, 54), lean: 0.34 });
  }
  return { planes, shafts };
}


















export const SEASONS = Object.freeze({
  spring: {
    label: 'sakura',
    particle: 'petal',
    kerbSnow: false,
    shaftAlpha: 0.10,
    sky: { high: '#8FA8C8', mid: '#B9C7DA', low: '#DCDDE4', glow: '#F0E2DE' },
    petal: '#E8B7C4',
    petalDeep: '#C98CA0',
  },
  winter: {
    label: 'snowfall',
    particle: 'snow',
    kerbSnow: true,
    shaftAlpha: 0.07,
    sky: { high: '#8FA8C8', mid: '#AFC2DA', low: '#D2DBEA', glow: '#E4E0D6' },
    petal: '#E6EAE7',
    petalDeep: '#C6D2DD',
  },
});

export function seasonOf(name) {
  return SEASONS[name] || SEASONS.spring;
}









export function drawFalling(ctx, season, timeMs, { width, height, camX, camY }) {
  const cfg = seasonOf(season);
  const t = timeMs / 1000;
  const isPetal = cfg.particle === 'petal';
  const count = isPetal ? 46 : 70;
  ctx.save();
  for (let i = 0; i < count; i += 1) {
    const seed = i * 12.9898;
    const rnd = (k) => {
      const v = Math.sin(seed * (k + 1)) * 43758.5453;
      return v - Math.floor(v);
    };
    const speed = (isPetal ? 22 : 34) * (0.55 + rnd(1) * 0.9);
    const drift = isPetal ? 26 * (rnd(2) - 0.5) : 9 * (rnd(2) - 0.5);
    const depth = 0.35 + rnd(5) * 0.9;         
    const x0 = rnd(3) * (width + 120) - 60;
    const y0 = rnd(4) * (height + 80);
    const y = ((y0 + t * speed) % (height + 80)) - 40;
    const sway = Math.sin(t * (isPetal ? 1.9 : 0.7) + i) * (isPetal ? 11 : 3);
    const x = ((x0 + t * drift + sway - camX * 0.06 * depth) % (width + 120) + width + 120)
      % (width + 120) - 60;
    const size = (isPetal ? 3.1 : 1.9) * depth;
    ctx.globalAlpha = 0.35 + depth * 0.5;
    ctx.fillStyle = i % 3 === 0 ? cfg.petalDeep : cfg.petal;
    if (isPetal) {
      
      const a = Math.sin(t * 2.3 + i) * 0.9;
      ctx.save();
      ctx.translate(x, y - camY * 0.04 * depth);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(-size, 0);
      ctx.quadraticCurveTo(0, -size * 0.95, size, 0);
      ctx.quadraticCurveTo(0, size * 0.5, -size, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    } else {
      ctx.fillRect(x, y - camY * 0.04 * depth, size, size);
    }
  }
  ctx.restore();
}















export const SHADOW_DIR = 1;        
export function drawShadow(ctx, spec, groundY, fill) {
  if (!spec) return;
  const h = spec.feet - spec.top;
  const lift = Math.max(0, groundY - spec.feet);
  
  
  const k = Math.max(0, 1 - lift / (h * 1.5));
  if (k <= 0.02) return;
  const rx = h * 0.23 * (0.55 + k * 0.45);
  const ry = rx * 0.30;
  const cx = spec.cx + SHADOW_DIR * h * 0.06 + SHADOW_DIR * lift * 0.16;
  ctx.save();
  ctx.globalAlpha = 0.42 * k;
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(cx, groundY + 2, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function stageColours() {
  return [
    ...Object.values(SKY), ...Object.values(SNOW),
    ...Object.values(CONCRETE), ...Object.values(CITY),
  ];
}

function drawShapes(ctx, shapes) {
  for (const s of shapes) {
    if (s.t === 'rect') {
      ctx.fillStyle = s.fill;
      ctx.fillRect(s.x, s.y, s.w, s.h);
    } else if (s.t === 'poly') {
      
      
      
      
      const pts = roughen(s.pts, { amp: 0.55, step: 14, seed: seedOf(s.pts) });
      ctx.fillStyle = s.fill;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      ctx.fill();
    }
  }
}

export function drawSky(ctx, width, height, season = 'spring') {
  
  
  const sky = seasonOf(season).sky;
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, sky.high);
  g.addColorStop(0.45, sky.mid);
  g.addColorStop(0.78, sky.low);
  g.addColorStop(1, sky.glow);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}

export function drawPlane(ctx, stage, name, { camX, camY, zoom, width, height, offsetX }) {
  const rate = PARALLAX[name];
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(zoom, zoom);
  ctx.translate(-width / 2, -height / 2);
  ctx.translate(-camX * rate, -camY * rate);
  ctx.translate(-offsetX, 0);
  drawShapes(ctx, stage.planes[name]);
  ctx.restore();
}

export function drawShafts(ctx, stage, { camX, width, height, offsetX }, season = 'spring') {
  ctx.save();
  ctx.globalAlpha = seasonOf(season).shaftAlpha;
  ctx.fillStyle = SKY.shaft;
  for (const s of stage.shafts) {
    const x = s.x - camX * PARALLAX.mid - offsetX;
    ctx.beginPath();
    ctx.moveTo(x, -10);
    ctx.lineTo(x + s.w, -10);
    ctx.lineTo(x + s.w + height * s.lean, height);
    ctx.lineTo(x + height * s.lean, height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
