















































import * as THREE from 'three';
import { PALETTE } from '../palette.js';

const SIZE = 128;


const GROUND = 256;

function seedRng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function canvas(size = SIZE, height = size) {
  const c = document.createElement('canvas');
  c.width = size; c.height = height;
  return c;
}

function toTexture(c, repeat = 1) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.anisotropy = 4;
  return t;
}

const css = (n) => `#${n.toString(16).padStart(6, '0')}`;


function rgba(n, a) {
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}


function wrapDraw(x, y, size, fn) {
  const dxs = x < size / 2 ? [0, size] : [0, -size];
  const dys = y < size / 2 ? [0, size] : [0, -size];
  for (const dx of dxs) for (const dy of dys) fn(x + dx, y + dy);
}











const ROAD_THEMES = {
  summer: {
    base: PALETTE.road, dark: PALETTE.roadDark, light: PALETTE.roadLight,
    rutAlpha: 0.55, wet: 0, grit: 420, seed: 0x5eed01,
  },
  mud: {
    base: PALETTE.mud, dark: PALETTE.mudWet, light: 0x8a7454,
    
    
    
    rutAlpha: 0.5, wet: 16, grit: 260, seed: 0x5eed02,
  },
  snow: {
    
    
    
    
    
    
    base: 0xc2d2e2, dark: PALETTE.snowRut, light: PALETTE.snowCrest,
    rutAlpha: 0.9, wet: 0, grit: 180, seed: 0x5eed03,
  },
};









export function makeRoadTexture(theme = 'summer') {
  const t = ROAD_THEMES[theme] ?? ROAD_THEMES.summer;
  const S = GROUND;
  const c = canvas(S); const g = c.getContext('2d');
  const rng = seedRng(t.seed);
  g.fillStyle = css(t.base);
  g.fillRect(0, 0, S, S);

  
  for (let i = 0; i < 9; i += 1) {
    const y = rng() * S;
    const h = 16 + rng() * 52;
    g.globalAlpha = 0.10 + rng() * 0.12;
    g.fillStyle = rng() > 0.5 ? css(t.light) : css(t.dark);
    g.fillRect(0, y, S, h);
    g.fillRect(0, y - S, S, h);
  }
  g.globalAlpha = 1;

  
  for (const cx of [S * 0.3, S * 0.7]) {
    g.strokeStyle = css(t.dark);
    g.globalAlpha = t.rutAlpha;
    g.lineWidth = 22;
    g.beginPath();
    g.moveTo(cx, 0);
    
    
    
    for (let y = 0; y <= S; y += 8) {
      const wob = Math.sin((y / S) * Math.PI * 2) * 6.4;
      g.lineTo(cx + wob, y);
    }
    g.stroke();
    
    
    g.strokeStyle = css(t.light);
    g.globalAlpha = 0.35;
    g.lineWidth = 5;
    g.beginPath();
    g.moveTo(cx + 12, 0);
    for (let y = 0; y <= S; y += 8) {
      const wob = Math.sin((y / S) * Math.PI * 2) * 6.4;
      g.lineTo(cx + 12 + wob, y);
    }
    g.stroke();
  }
  g.globalAlpha = 1;

  
  
  
  
  
  for (let i = 0; i < t.wet; i += 1) {
    const x = rng() * S; const y = rng() * S;
    const rx = 6 + rng() * 20;
    const ry = rx * (0.35 + rng() * 0.3);
    const rot = rng() * Math.PI;
    wrapDraw(x, y, S, (px, py) => {
      g.globalAlpha = 0.5;
      g.fillStyle = css(PALETTE.puddle);
      g.beginPath(); g.ellipse(px, py, rx, ry, rot, 0, Math.PI * 2); g.fill();
      
      
      
      
      
      
      g.globalAlpha = 0.2;
      g.fillStyle = css(PALETTE.skyHaze);
      g.beginPath(); g.ellipse(px, py - ry * 0.3, rx * 0.72, ry * 0.34, rot, 0, Math.PI * 2); g.fill();
    });
  }
  g.globalAlpha = 1;

  
  for (let i = 0; i < t.grit; i += 1) {
    const x = rng() * S; const y = rng() * S;
    const r = 0.8 + rng() * 2.6;
    g.fillStyle = rng() > 0.45 ? css(t.light) : css(t.dark);
    g.globalAlpha = 0.25 + rng() * 0.4;
    wrapDraw(x, y, S, (px, py) => {
      g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill();
    });
  }
  g.globalAlpha = 1;

  
  
  
  if (theme === 'snow') {
    g.globalAlpha = 0.16;
    g.fillStyle = css(PALETTE.snowHollow);
    for (let i = 0; i < 26; i += 1) {
      const x = rng() * S; const y = rng() * S;
      const r = 6 + rng() * 18;
      wrapDraw(x, y, S, (px, py) => {
        g.beginPath(); g.ellipse(px, py, r, r * 0.5, rng() * 3, 0, Math.PI * 2); g.fill();
      });
    }
    g.globalAlpha = 1;
  }
  return toTexture(c, 1);
}










export function makeShortcutTexture(theme = 'summer') {
  const S = GROUND;
  const c = canvas(S); const g = c.getContext('2d');
  const rng = seedRng(theme === 'snow' ? 0x5c07c3 : theme === 'mud' ? 0x5c07c2 : 0x5c07c1);
  const base = theme === 'snow' ? PALETTE.packedSnow : theme === 'mud' ? PALETTE.mudDark : PALETTE.shortcut;
  const dark = theme === 'snow' ? PALETTE.snowRut : theme === 'mud' ? PALETTE.mudWet : PALETTE.shortcutDark;
  const tuft = theme === 'snow' ? PALETTE.snowHollow : PALETTE.shortcutTuft;

  g.fillStyle = css(base);
  g.fillRect(0, 0, S, S);

  
  for (const cx of [S * 0.24, S * 0.76]) {
    g.strokeStyle = css(dark);
    g.globalAlpha = 0.62;
    g.lineWidth = 34;
    g.beginPath();
    g.moveTo(cx, 0);
    for (let y = 0; y <= S; y += 8) g.lineTo(cx + Math.sin((y / S) * Math.PI * 2) * 5, y);
    g.stroke();
  }
  g.globalAlpha = 1;

  
  
  
  for (let i = 0; i < 90; i += 1) {
    const x = S * 0.5 + (rng() - 0.5) * S * 0.26;
    const y = rng() * S;
    const r = 3 + rng() * 8;
    g.fillStyle = css(tuft);
    g.globalAlpha = 0.30 + rng() * 0.4;
    wrapDraw(x, y, S, (px, py) => {
      g.beginPath(); g.ellipse(px, py, r, r * 0.7, rng() * 3, 0, Math.PI * 2); g.fill();
    });
  }
  
  
  for (let i = 0; i < 70; i += 1) {
    const x = (rng() > 0.5 ? 4 : S - 4) + (rng() - 0.5) * 20;
    const y = rng() * S;
    const r = 2 + rng() * 6;
    g.fillStyle = css(tuft);
    g.globalAlpha = 0.25 + rng() * 0.35;
    wrapDraw(((x % S) + S) % S, y, S, (px, py) => {
      g.beginPath(); g.ellipse(px, py, r, r * 0.8, 0, 0, Math.PI * 2); g.fill();
    });
  }
  g.globalAlpha = 1;
  return toTexture(c, 1);
}

















const GROUND_THEMES = {
  summer: {
    base: PALETTE.grass, light: PALETTE.grassLight, dark: PALETTE.grassDark,
    accent: PALETTE.stubble, field: PALETTE.crop, fieldDark: PALETTE.cropDark,
    hedge: PALETTE.hedge, seed: 0x51101,
  },
  
  
  
  
  mud: {
    base: 0x546b38, light: 0x67804a, dark: PALETTE.mud,
    accent: 0x7d6a55, field: 0x6a6440, fieldDark: PALETTE.mudDark,
    hedge: PALETTE.hedgeMud, seed: 0x51103,
  },
  snow: {
    base: 0xe2eef8, light: PALETTE.snowCrest, dark: PALETTE.snowHollow,
    accent: PALETTE.stubble, field: 0xdfeaf6, fieldDark: 0xbcd0e4,
    hedge: 0x6f8494, seed: 0x51102,
  },
};















export function makeGrassTexture(theme = 'summer') {
  const t = GROUND_THEMES[theme] ?? GROUND_THEMES.summer;
  const S = GROUND;
  const c = canvas(S); const g = c.getContext('2d');
  const rng = seedRng(t.seed);
  g.fillStyle = css(t.base);
  g.fillRect(0, 0, S, S);

  
  
  
  
  for (let i = 0; i < 7; i += 1) {
    const x = rng() * S; const y = rng() * S;
    const rx = S * (0.18 + rng() * 0.24);
    const ry = rx * (0.5 + rng() * 0.7);
    const rot = rng() * Math.PI;
    const warm = rng() > 0.45;
    g.globalAlpha = 0.13 + rng() * 0.12;
    g.fillStyle = css(warm ? t.field : t.fieldDark);
    wrapDraw(x, y, S, (px, py) => {
      g.beginPath(); g.ellipse(px, py, rx, ry, rot, 0, Math.PI * 2); g.fill();
    });
    
    
    if (warm) {
      const step = 5 + rng() * 5;
      wrapDraw(x, y, S, (px, py) => {
        g.save();
        g.beginPath(); g.ellipse(px, py, rx, ry, rot, 0, Math.PI * 2); g.clip();
        g.globalAlpha = 0.12;
        g.strokeStyle = css(t.fieldDark);
        g.lineWidth = 1.6;
        for (let k = -rx; k < rx; k += step) {
          g.beginPath();
          g.moveTo(px + Math.cos(rot) * k - Math.sin(rot) * ry * 1.3, py + Math.sin(rot) * k + Math.cos(rot) * ry * 1.3);
          g.lineTo(px + Math.cos(rot) * k + Math.sin(rot) * ry * 1.3, py + Math.sin(rot) * k - Math.cos(rot) * ry * 1.3);
          g.stroke();
        }
        g.restore();
      });
    }
  }
  g.globalAlpha = 1;

  
  
  
  g.globalAlpha = 0.3;
  g.strokeStyle = css(t.hedge);
  for (let i = 0; i < 3; i += 1) {
    const vertical = rng() > 0.5;
    const at = rng() * S;
    const wob = 6 + rng() * 10;
    g.lineWidth = 2.5 + rng() * 3;
    g.beginPath();
    for (let k = 0; k <= S; k += 16) {
      const off = Math.sin((k / S) * Math.PI * 2 + i) * wob;
      if (vertical) {
        if (k === 0) g.moveTo(at + off, k); else g.lineTo(at + off, k);
      } else if (k === 0) g.moveTo(k, at + off); else g.lineTo(k, at + off);
    }
    g.stroke();
  }
  g.globalAlpha = 1;

  
  for (let i = 0; i < 320; i += 1) {
    const x = rng() * S; const y = rng() * S;
    const r = 5 + rng() * 16;
    g.fillStyle = rng() > 0.5 ? css(t.light) : css(t.dark);
    g.globalAlpha = 0.14 + rng() * 0.2;
    wrapDraw(x, y, S, (px, py) => {
      g.beginPath(); g.ellipse(px, py, r, r * (0.6 + rng() * 0.5), rng() * 3.14, 0, Math.PI * 2); g.fill();
    });
  }
  g.globalAlpha = 1;
  
  
  
  for (let i = 0; i < 200; i += 1) {
    const x = rng() * S; const y = rng() * S;
    g.strokeStyle = css(t.accent);
    g.globalAlpha = 0.16 + rng() * 0.2;
    g.lineWidth = 1.4;
    const len = 4 + rng() * 10;
    const a = rng() * Math.PI;
    wrapDraw(x, y, S, (px, py) => {
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len);
      g.stroke();
    });
  }
  g.globalAlpha = 1;
  return toTexture(c, 1);
}





const SKY_THEMES = {
  day: {
    high: PALETTE.skyHigh, top: PALETTE.skyTop, horizon: PALETTE.skyHaze,
    warm: PALETTE.skyWarm, floor: 0xd9e6c9, shade: PALETTE.cloudUnder,
    clouds: 16, cirrus: 7, birds: 3, sun: 1, seed: 0x5c1101,
  },
  overcast: {
    high: 0x5a6675, top: 0x6b7789, horizon: 0xb6bcc2,
    warm: 0xcfcabc, floor: 0xbfc3bd, shade: 0x8b939c,
    
    
    
    
    
    clouds: 22, cirrus: 4, birds: 2, sun: 0.35, seed: 0x5c1102,
  },
  snow: {
    high: 0x6d99cc, top: 0x8fb6df, horizon: PALETTE.snow,
    warm: 0xf0eee4, floor: 0xdfe9f3, shade: 0xa8bccf,
    clouds: 18, cirrus: 9, birds: 1, sun: 0.7, seed: 0x5c1103,
  },
};








const SUN_U = 0.585;
const SUN_V = 0.2;







export function makeSkyTexture(kind = 'day') {
  const t = SKY_THEMES[kind] ?? SKY_THEMES.day;
  const W = 1024; const H = 384;
  const c = canvas(W, H);
  const g = c.getContext('2d');
  const rng = seedRng(t.seed);

  
  
  
  
  
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, css(t.high));
  grad.addColorStop(0.3, css(t.top));
  grad.addColorStop(0.66, css(t.horizon));
  grad.addColorStop(0.86, css(t.warm));
  grad.addColorStop(1, css(t.floor));
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);

  
  
  
  
  
  if (t.sun > 0) {
    const sx = SUN_U * W;
    const sy = SUN_V * H;
    for (const [radius, alpha, colour] of [
      [H * 0.62, 0.16 * t.sun, PALETTE.sunGlow],
      [H * 0.22, 0.34 * t.sun, PALETTE.sunGlow],
      [H * 0.055, 0.95 * t.sun, PALETTE.sun],
    ]) {
      for (const dx of [0, W, -W]) {
        const grd = g.createRadialGradient(sx + dx, sy, 0, sx + dx, sy, radius);
        grd.addColorStop(0, rgba(colour, alpha));
        grd.addColorStop(0.55, rgba(colour, alpha * 0.35));
        grd.addColorStop(1, rgba(colour, 0));
        g.fillStyle = grd;
        g.fillRect(sx + dx - radius, sy - radius, radius * 2, radius * 2);
      }
    }
  }

  
  
  
  
  for (let i = 0; i < t.cirrus; i += 1) {
    const cx = rng() * W;
    const cy = 8 + rng() * (H * 0.24);
    const w = 90 + rng() * 200;
    const h = 2.5 + rng() * 5;
    g.globalAlpha = 0.18 + rng() * 0.22;
    g.fillStyle = css(PALETTE.cirrus);
    const lean = (rng() - 0.5) * 0.18;
    for (let k = 0; k < 4; k += 1) {
      const ox = (k - 1.5) * (w / 5);
      for (const dx of [0, W, -W]) {
        g.beginPath();
        g.ellipse(cx + ox + dx, cy + ox * lean, w * (0.28 + rng() * 0.2), h, lean, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  g.globalAlpha = 1;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  for (let i = 0; i < t.clouds; i += 1) {
    const cx = ((i + rng() * 0.7) / t.clouds) * W;
    const band = rng();
    const cy = H * (0.08 + band * 0.36);
    const far = band * band;                       
    
    
    
    
    
    
    const w = (26 + rng() * 40) * (1 - far * 0.45);
    const h = w * (0.26 + rng() * 0.14) * (1 - far * 0.3);
    const puffs = 3 + Math.floor(rng() * 3);
    
    
    
    for (const pass of ['under', 'top']) {
      for (let p = 0; p < puffs; p += 1) {
        const px = cx + (p - (puffs - 1) / 2) * (w / puffs) + (rng() - 0.5) * 14;
        const pr = h * (0.75 + rng() * 0.5);
        const py = cy + (pass === 'under' ? pr * 0.42 : 0);
        g.globalAlpha = (pass === 'under' ? 0.5 : (kind === 'overcast' ? 0.72 : 0.92)) * (1 - far * 0.35);
        g.fillStyle = pass === 'under' ? css(t.shade) : css(PALETTE.cloud);
        for (const dx of [0, W, -W]) {
          g.beginPath();
          g.ellipse(px + dx, py, pr * 1.35, pr * (pass === 'under' ? 0.6 : 0.82), 0, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
  }
  g.globalAlpha = 1;

  
  
  
  
  
  
  g.strokeStyle = css(PALETTE.bird);
  g.lineWidth = 1.6;
  g.lineCap = 'round';
  for (let i = 0; i < t.birds; i += 1) {
    const bx = 60 + rng() * (W - 120);
    const by = H * (0.16 + rng() * 0.3);
    const n = 2 + Math.floor(rng() * 3);
    g.globalAlpha = 0.42 + rng() * 0.2;
    for (let k = 0; k < n; k += 1) {
      const x = bx + (rng() - 0.5) * 46;
      const y = by + (rng() - 0.5) * 22;
      const sp = 3.5 + rng() * 3;
      g.beginPath();
      g.moveTo(x - sp, y);
      g.quadraticCurveTo(x - sp * 0.4, y - sp * 0.75, x, y - sp * 0.15);
      g.quadraticCurveTo(x + sp * 0.4, y - sp * 0.75, x + sp, y);
      g.stroke();
    }
  }
  g.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}






export function makeBarnTexture() {
  const c = canvas(); const g = c.getContext('2d');
  const rng = seedRng(0xba21);
  g.fillStyle = css(PALETTE.barn);
  g.fillRect(0, 0, SIZE, SIZE);
  
  
  const planks = 10;
  for (let i = 0; i < planks; i += 1) {
    const x = (i / planks) * SIZE;
    const w = SIZE / planks;
    g.globalAlpha = 0.10 + rng() * 0.16;
    g.fillStyle = rng() > 0.5 ? '#d4553f' : '#8e2a1d';
    g.fillRect(x, 0, w - 1, SIZE);
    g.globalAlpha = 0.45;
    g.fillStyle = '#5e1d13';
    g.fillRect(x + w - 1.5, 0, 1.5, SIZE);
  }
  
  
  
  g.globalAlpha = 0.9;
  g.fillStyle = css(PALETTE.ceiling);
  g.fillRect(0, SIZE * 0.06, SIZE, 3);
  g.fillRect(0, SIZE * 0.9, SIZE, 4);
  g.globalAlpha = 0.75;
  g.fillStyle = css(PALETTE.barnRoof);
  g.fillRect(SIZE * 0.38, SIZE * 0.5, SIZE * 0.24, SIZE * 0.4);
  g.globalAlpha = 0.9;
  g.strokeStyle = css(PALETTE.ceiling);
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(SIZE * 0.38, SIZE * 0.5); g.lineTo(SIZE * 0.62, SIZE * 0.9);
  g.moveTo(SIZE * 0.62, SIZE * 0.5); g.lineTo(SIZE * 0.38, SIZE * 0.9);
  g.stroke();
  g.globalAlpha = 1;
  return toTexture(c, 1);
}
