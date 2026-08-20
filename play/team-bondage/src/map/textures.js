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

function clamp(v) { return Math.max(0, Math.min(255, v | 0)); }
