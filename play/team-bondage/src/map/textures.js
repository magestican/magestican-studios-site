// Procedural canvas textures for voxel materials. Deliberately simple so
// they hold up as tiny 64x64 tiles on cube faces at any distance -- we ship
// no external art assets. Marked `# PLACEHOLDER ART` per DESIGN_PRINCIPLES.md.

import * as THREE from 'three';

const SIZE = 64;

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = SIZE; c.height = SIZE;
  return c;
}

function toTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.NearestFilter;   // keep the pixel look
  t.minFilter = THREE.LinearMipMapNearestFilter;
  return t;
}

// Deterministic PRNG so textures are stable across builds.
function seedRng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) / 4294967296);
  };
}

// -- Grass: green noise + a few paler blades --------------------------------
export function makeGrassTexture() {
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(11);
  const base = { r: 0x5a, g: 0xa6, b: 0x4b };
  const img = g.createImageData(SIZE, SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const j = (rng() - 0.5) * 30;
    img.data[i]   = clamp(base.r + j);
    img.data[i+1] = clamp(base.g + j * 1.2);
    img.data[i+2] = clamp(base.b + j * 0.7);
    img.data[i+3] = 255;
  }
  g.putImageData(img, 0, 0);
  // Scatter a few brighter blade strokes.
  g.strokeStyle = 'rgba(180, 220, 130, 0.65)';
  g.lineWidth = 1;
  for (let i = 0; i < 18; i++) {
    const x = Math.floor(rng() * SIZE), y = Math.floor(rng() * SIZE);
    g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - 2 - Math.floor(rng() * 3)); g.stroke();
  }
  return toTexture(c);
}

// -- Wood: brown base + horizontal grain lines ------------------------------
export function makeWoodTexture() {
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(23);
  g.fillStyle = '#8a5a2b';
  g.fillRect(0, 0, SIZE, SIZE);
  for (let y = 0; y < SIZE; y++) {
    const brightness = 0.85 + (rng() - 0.5) * 0.15;
    g.fillStyle = `rgba(${Math.floor(0x8a * brightness)}, ${Math.floor(0x5a * brightness)}, ${Math.floor(0x2b * brightness)}, 1)`;
    g.fillRect(0, y, SIZE, 1);
  }
  // Add a few darker grain streaks
  g.strokeStyle = 'rgba(45, 25, 10, 0.35)';
  g.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const y = Math.floor(rng() * SIZE);
    g.beginPath();
    g.moveTo(0, y);
    // wavy line
    for (let x = 0; x < SIZE; x += 4) g.lineTo(x, y + Math.sin(x * 0.3) * 1.5);
    g.stroke();
  }
  // Knot
  g.fillStyle = 'rgba(50, 25, 8, 0.55)';
  g.beginPath(); g.ellipse(SIZE * 0.7, SIZE * 0.3, 5, 3, 0, 0, Math.PI * 2); g.fill();
  return toTexture(c);
}

// -- Stone: gray blocky patchwork -------------------------------------------
export function makeStoneTexture() {
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(37);
  const base = { r: 0x6d, g: 0x70, b: 0x76 };
  const img = g.createImageData(SIZE, SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const j = (rng() - 0.5) * 24;
    img.data[i]   = clamp(base.r + j);
    img.data[i+1] = clamp(base.g + j);
    img.data[i+2] = clamp(base.b + j);
    img.data[i+3] = 255;
  }
  g.putImageData(img, 0, 0);
  // A grid of darker mortar lines every 16px.
  g.strokeStyle = 'rgba(0,0,0,0.35)';
  g.lineWidth = 1;
  for (let i = 16; i < SIZE; i += 16) {
    g.beginPath(); g.moveTo(0, i); g.lineTo(SIZE, i); g.stroke();
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, SIZE); g.stroke();
  }
  return toTexture(c);
}

// -- Hay: yellow straw with darker straws -----------------------------------
export function makeHayTexture() {
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(71);
  g.fillStyle = '#d7b83d';
  g.fillRect(0, 0, SIZE, SIZE);
  // Random straw lines
  g.lineWidth = 1;
  for (let i = 0; i < 60; i++) {
    const x = Math.floor(rng() * SIZE);
    const y = Math.floor(rng() * SIZE);
    const len = 6 + Math.floor(rng() * 12);
    const angle = rng() * Math.PI;
    const dx = Math.cos(angle) * len;
    const dy = Math.sin(angle) * len;
    g.strokeStyle = rng() < 0.5 ? 'rgba(150,110,30,0.7)' : 'rgba(240,220,120,0.8)';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx, y + dy); g.stroke();
  }
  return toTexture(c);
}

// -- Blood-splattered variant of any base texture ---------------------------
// V2 (2026-08-21): the old version washed the WHOLE texture 55% red, which
// read as "someone put a red filter on the game", not gore. Now the base
// texture stays fully visible and blood sits ON it: a few big impact
// splats with radiating droplets + long gravity drips, and one smeared
// handprint-ish streak. Deliberately uneven — most of the surface is clean.
export function makeBloodTinted(baseTexture) {
  const src = baseTexture.image;
  const c = makeCanvas(); const g = c.getContext('2d');
  g.drawImage(src, 0, 0, SIZE, SIZE);
  const rng = seedRng(89);

  const BLOOD_DARK  = (a) => `rgba(96, 8, 8, ${a})`;
  const BLOOD_FRESH = (a) => `rgba(150, 18, 14, ${a})`;

  // 3 major impact splats.
  for (let i = 0; i < 3; i++) {
    const x = rng() * SIZE, y = rng() * SIZE * 0.7;   // impacts hit high, drips run low
    const r = 5 + rng() * 8;
    // Core blot — irregular, built from overlapping circles.
    for (let b = 0; b < 5; b++) {
      g.fillStyle = BLOOD_FRESH(0.75 + rng() * 0.2);
      g.beginPath();
      g.arc(x + (rng() - 0.5) * r, y + (rng() - 0.5) * r * 0.7, r * (0.45 + rng() * 0.4), 0, Math.PI * 2);
      g.fill();
    }
    // Radiating droplets — direction-biased so the splat has energy.
    const dir = rng() * Math.PI * 2;
    for (let d = 0; d < 9; d++) {
      const a = dir + (rng() - 0.5) * 1.6;
      const dist = r + rng() * r * 2.2;
      g.fillStyle = BLOOD_FRESH(0.5 + rng() * 0.4);
      g.beginPath();
      g.arc(x + Math.cos(a) * dist, y + Math.sin(a) * dist, 0.8 + rng() * 2.0, 0, Math.PI * 2);
      g.fill();
    }
    // Gravity drips: 2-3 long thin runs downward with a bead at the end.
    for (let d = 0; d < 2 + Math.floor(rng() * 2); d++) {
      const dx = x + (rng() - 0.5) * r * 1.5;
      const len = 8 + rng() * 18;
      g.strokeStyle = BLOOD_DARK(0.7);
      g.lineWidth = 1.2 + rng() * 1.2;
      g.beginPath(); g.moveTo(dx, y + r * 0.4); g.lineTo(dx + (rng() - 0.5) * 2, y + r * 0.4 + len); g.stroke();
      g.fillStyle = BLOOD_DARK(0.8);
      g.beginPath(); g.arc(dx, y + r * 0.4 + len, 1.6 + rng(), 0, Math.PI * 2); g.fill();
    }
  }

  // One dragged smear (diagonal streak, fading).
  {
    const x = rng() * SIZE * 0.6 + SIZE * 0.2, y = rng() * SIZE * 0.5 + SIZE * 0.2;
    const ang = -0.4 + rng() * 0.8;
    g.save();
    g.translate(x, y); g.rotate(ang);
    const grad = g.createLinearGradient(0, 0, 26, 0);
    grad.addColorStop(0, BLOOD_DARK(0.6));
    grad.addColorStop(1, BLOOD_DARK(0.0));
    g.fillStyle = grad;
    g.fillRect(0, -3, 26, 6);
    g.restore();
  }
  return toTexture(c);
}

// -- Dirt: warm brown noise -------------------------------------------------
export function makeDirtTexture() {
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(53);
  const base = { r: 0x7a, g: 0x5c, b: 0x3d };
  const img = g.createImageData(SIZE, SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const j = (rng() - 0.5) * 22;
    img.data[i]   = clamp(base.r + j);
    img.data[i+1] = clamp(base.g + j * 0.9);
    img.data[i+2] = clamp(base.b + j * 0.7);
    img.data[i+3] = 255;
  }
  g.putImageData(img, 0, 0);
  return toTexture(c);
}

// -- Metal: grey with scratch wear + a couple of dents ----------------------
// Used by the first-person viewmodels (art/knowledge/craft/
// silhouette-readability.md: wear marks are what separate a "tool a farmer
// has swung a thousand times" from a grey box).
export function makeMetalTexture() {
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(71);
  const base = { r: 0xa6, g: 0xac, b: 0xb8 };
  const img = g.createImageData(SIZE, SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const j = (rng() - 0.5) * 26;
    img.data[i]   = clamp(base.r + j);
    img.data[i+1] = clamp(base.g + j);
    img.data[i+2] = clamp(base.b + j * 1.1);
    img.data[i+3] = 255;
  }
  g.putImageData(img, 0, 0);
  // Long scratches along the tool's length -- bright, thin, uneven.
  g.lineWidth = 1;
  for (let i = 0; i < 14; i++) {
    const y = Math.floor(rng() * SIZE);
    const len = 8 + Math.floor(rng() * 34);
    const x = Math.floor(rng() * (SIZE - len));
    g.strokeStyle = rng() > 0.45 ? 'rgba(240,246,255,0.42)' : 'rgba(38,42,50,0.38)';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y + (rng() > 0.5 ? 1 : 0)); g.stroke();
  }
  // Dents: small dark blotches with a bright top edge (a dent catches light).
  for (let i = 0; i < 5; i++) {
    const x = 4 + rng() * (SIZE - 8), y = 4 + rng() * (SIZE - 8);
    const r = 2 + rng() * 3;
    g.fillStyle = 'rgba(46,50,58,0.40)';
    g.beginPath(); g.ellipse(x, y, r, r * 0.7, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = 'rgba(236,243,255,0.32)';
    g.beginPath(); g.ellipse(x, y - r * 0.6, r * 0.8, r * 0.28, 0, 0, Math.PI * 2); g.fill();
  }
  return toTexture(c);
}

function clamp(v) { return Math.max(0, Math.min(255, v | 0)); }
