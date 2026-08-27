




















import * as THREE from 'three';
import { PALETTE } from '../palette.js';

const SIZE = 128;

function seedRng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

function canvas(size = SIZE) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
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


function wrapDraw(x, y, size, fn) {
  const dxs = x < size / 2 ? [0, size] : [0, -size];
  const dys = y < size / 2 ? [0, size] : [0, -size];
  for (const dx of dxs) for (const dy of dys) fn(x + dx, y + dy);
}









export function makeRoadTexture() {
  const c = canvas(); const g = c.getContext('2d');
  const rng = seedRng(0x5eed01);
  g.fillStyle = css(PALETTE.road);
  g.fillRect(0, 0, SIZE, SIZE);

  
  for (let i = 0; i < 7; i += 1) {
    const y = rng() * SIZE;
    const h = 8 + rng() * 26;
    g.globalAlpha = 0.10 + rng() * 0.12;
    g.fillStyle = rng() > 0.5 ? css(PALETTE.roadLight) : css(PALETTE.roadDark);
    g.fillRect(0, y, SIZE, h);
    g.fillRect(0, y - SIZE, SIZE, h);
  }
  g.globalAlpha = 1;

  
  for (const cx of [SIZE * 0.3, SIZE * 0.7]) {
    g.strokeStyle = css(PALETTE.roadDark);
    g.globalAlpha = 0.55;
    g.lineWidth = 11;
    g.beginPath();
    g.moveTo(cx, 0);
    
    
    
    for (let y = 0; y <= SIZE; y += 8) {
      const wob = Math.sin((y / SIZE) * Math.PI * 2) * 3.2;
      g.lineTo(cx + wob, y);
    }
    g.stroke();
    
    
    g.strokeStyle = css(PALETTE.roadLight);
    g.globalAlpha = 0.35;
    g.lineWidth = 2.5;
    g.beginPath();
    g.moveTo(cx + 6, 0);
    for (let y = 0; y <= SIZE; y += 8) {
      const wob = Math.sin((y / SIZE) * Math.PI * 2) * 3.2;
      g.lineTo(cx + 6 + wob, y);
    }
    g.stroke();
  }
  g.globalAlpha = 1;

  
  for (let i = 0; i < 420; i += 1) {
    const x = rng() * SIZE; const y = rng() * SIZE;
    const r = 0.5 + rng() * 1.6;
    g.fillStyle = rng() > 0.45 ? css(PALETTE.roadLight) : css(PALETTE.roadDark);
    g.globalAlpha = 0.25 + rng() * 0.4;
    wrapDraw(x, y, SIZE, (px, py) => {
      g.beginPath(); g.arc(px, py, r, 0, Math.PI * 2); g.fill();
    });
  }
  g.globalAlpha = 1;
  return toTexture(c, 1);
}






export function makeGrassTexture(theme = 'summer') {
  
  
  
  
  
  
  
  
  
  
  
  
  const THEMES = {
    summer: { base: PALETTE.grass, light: PALETTE.grassLight, dark: PALETTE.grassDark, accent: PALETTE.stubble, seed: 0x51101 },
    
    
    
    
    mud:    { base: 0x546b38, light: 0x67804a, dark: PALETTE.mud, accent: 0x7d6a55, seed: 0x51103 },
    snow:   { base: 0xe2eef8, light: PALETTE.snowCrest, dark: PALETTE.snowHollow, accent: PALETTE.stubble, seed: 0x51102 },
  };
  const t = THEMES[theme] ?? THEMES.summer;
  const light = t.light;
  const dark = t.dark;
  const c = canvas(); const g = c.getContext('2d');
  const rng = seedRng(t.seed);
  g.fillStyle = css(t.base);
  g.fillRect(0, 0, SIZE, SIZE);

  for (let i = 0; i < 150; i += 1) {
    const x = rng() * SIZE; const y = rng() * SIZE;
    const r = 3 + rng() * 9;
    g.fillStyle = rng() > 0.5 ? css(light) : css(dark);
    g.globalAlpha = 0.16 + rng() * 0.22;
    wrapDraw(x, y, SIZE, (px, py) => {
      g.beginPath(); g.ellipse(px, py, r, r * (0.6 + rng() * 0.5), rng() * 3.14, 0, Math.PI * 2); g.fill();
    });
  }
  g.globalAlpha = 1;
  
  
  
  for (let i = 0; i < 90; i += 1) {
    const x = rng() * SIZE; const y = rng() * SIZE;
    g.strokeStyle = css(t.accent);
    g.globalAlpha = 0.18 + rng() * 0.22;
    g.lineWidth = 1;
    const len = 2 + rng() * 5;
    const a = rng() * Math.PI;
    wrapDraw(x, y, SIZE, (px, py) => {
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len);
      g.stroke();
    });
  }
  g.globalAlpha = 1;
  return toTexture(c, 1);
}







export function makeSkyTexture(kind = 'day') {
  const W = 512; const H = 256;
  const c = canvas(); c.width = W; c.height = H;
  const g = c.getContext('2d');
  const rng = seedRng(kind === 'snow' ? 0x5c1103 : kind === 'overcast' ? 0x5c1102 : 0x5c1101);

  const top = kind === 'overcast' ? 0x6b7789 : kind === 'snow' ? 0x8fb6df : PALETTE.skyTop;
  const horizon = kind === 'overcast' ? 0xb6bcc2 : kind === 'snow' ? PALETTE.snow : PALETTE.skyHaze;
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, css(top));
  grad.addColorStop(0.62, css(horizon));
  grad.addColorStop(1, css(kind === 'snow' ? 0xdfe9f3 : 0xd9e6c9));
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const count = kind === 'overcast' ? 14 : 8;
  for (let i = 0; i < count; i += 1) {
    const cx = ((i + rng() * 0.7) / count) * W;
    const cy = 26 + rng() * (H * 0.26);
    const w = 26 + rng() * 44;
    const h = w * (0.26 + rng() * 0.14);
    const puffs = 3 + Math.floor(rng() * 3);
    const shade = kind === 'snow' ? '#a8bccf' : kind === 'overcast' ? '#9aa2ab' : '#c3b199';
    
    
    
    for (const pass of ['under', 'top']) {
      for (let p = 0; p < puffs; p += 1) {
        const px = cx + (p - (puffs - 1) / 2) * (w / puffs) + (rng() - 0.5) * 8;
        const pr = h * (0.75 + rng() * 0.5);
        const py = cy + (pass === 'under' ? pr * 0.42 : 0);
        g.globalAlpha = pass === 'under' ? 0.5 : (kind === 'overcast' ? 0.72 : 0.92);
        g.fillStyle = pass === 'under' ? shade : css(PALETTE.cloud);
        for (const dx of [0, W, -W]) {
          g.beginPath();
          g.ellipse(px + dx, py, pr * 1.35, pr * (pass === 'under' ? 0.6 : 0.82), 0, 0, Math.PI * 2);
          g.fill();
        }
      }
    }
  }
  g.globalAlpha = 1;

  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
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
  g.globalAlpha = 1;
  return toTexture(c, 1);
}
