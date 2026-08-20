// Spherical (equirectangular) skybox - a giant painted canvas wrapped
// around a huge inside-out sphere so the horizon naturally warps toward
// the poles. Way more legible than a cube because the top-of-screen text
// is now BIG (the sky-brawl painting is painted top-third of the canvas
// which the equirectangular projection maps to the whole zenith cap).
//
// The animation ticks the whole canvas 6x/sec: fighters shake, VS wobbles,
// dust puffs pulse.
//
// # PLACEHOLDER ART - to be replaced with a hand-drawn 4096x2048 panorama.

import * as THREE from 'three';

const W = 2048;   // equirectangular width; height = W/2
const H = 1024;
const ANIMATE_FPS = 6;

// Try the Blender-rendered PNG first. If it fails to load, fall back to
// the animated canvas painting (which at least ensures something is on
// the sky). See docs/features/rendered-skybox.md.
const RENDERED_PNG = '/play/team-bondage/assets/hand-drawn/sky/panorama.png';

export function buildSkybox() {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  paint(canvas, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace ?? tex.colorSpace;

  // Animated canvas fallback: repaint the wrestling scene every 166ms.
  const start = performance.now();
  const interval = setInterval(() => {
    const t = (performance.now() - start) / 1000;
    paint(canvas, t);
    tex.needsUpdate = true;
  }, 1000 / ANIMATE_FPS);

  // The Blender-rendered PNG hot-swap was disabled 2026-08-20 — Bryan
  // said "the skybox still isn't fitting". The canvas-painted equirect
  // sky is now the authoritative background: it's designed for the
  // projection, matches the game palette, and has the animated brawl.
  // Leaving the RENDERED_PNG constant as a reference for future re-enable.
  void RENDERED_PNG;

  return tex;
}

function paint(canvas, t) {
  const g = canvas.getContext('2d');
  // Sky gradient across the equirectangular strip: top row = sky zenith
  // (blue), middle = horizon (cream/blue), bottom = ground haze.
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0.00, '#a8c4e0');
  grad.addColorStop(0.35, '#c8dcf5');
  grad.addColorStop(0.55, '#e6ecf5');
  grad.addColorStop(0.75, '#8ec5ff');
  grad.addColorStop(1.00, '#3a5a89');
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  paintClouds(g, 22, 0.5);

  // Sky-brawl - compact overhead feature. Equirectangular textures near the
  // top of the strip get stretched horizontally as they wrap to the pole,
  // so a small drawing here reads as a modest-sized thing directly above
  // you (not a canvas-filling monstrosity).
  const brawlCX = W / 2;
  const brawlCY = H * 0.14;             // near top -> nearly overhead
  const brawlR  = H * 0.10;             // small so it reads as a real object
  const bullX   = brawlCX - brawlR * 1.7;
  const horseX  = brawlCX + brawlR * 1.7;

  // Wrestling shake - bigger amplitudes so the fight is actually visible.
  const shake = Math.sin(t * 4.0) * 22;
  const rockBull  = Math.sin(t * 3.2) * 0.22;
  const rockHorse = Math.cos(t * 3.4) * 0.28;
  const bounceBull  = Math.sin(t * 5.0) * 12;
  const bounceHorse = Math.cos(t * 5.5) * 14;

  // Ring rope (small oval).
  g.save();
  g.translate(brawlCX, brawlCY);
  g.strokeStyle = 'rgba(183,58,42,0.55)';
  g.lineWidth = 8;
  g.beginPath();
  g.ellipse(0, 0, brawlR * 3.0, brawlR * 1.6, 0, 0, Math.PI * 2);
  g.stroke();
  g.restore();

  drawBull(g,  bullX + shake, brawlCY + bounceBull, brawlR, rockBull);
  drawHorse(g, horseX - shake, brawlCY + bounceHorse, brawlR, rockHorse);

  // Small "VS" between them.
  g.save();
  g.translate(brawlCX, brawlCY);
  g.rotate(-0.06 + Math.sin(t*2.4) * 0.03);
  g.font = 'bold 100px Georgia, serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(28, 26, 23, 0.18)';
  g.fillText('VS', 3, 3);
  g.fillStyle = '#b73a2a';
  g.fillText('VS', 0, 0);
  g.restore();

  // Small ka-pow puff.
  paintDustPuff(g, brawlCX, brawlCY + brawlR * 0.9, 30 + Math.sin(t*6)*8);

  // Banner underneath - no more studio credit up here; that lives in the
  // settings menu now.
  g.save();
  g.translate(brawlCX, brawlCY + brawlR * 2.4);
  g.font = 'italic bold 44px Georgia, serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(255,255,255,0.75)';
  const textW = g.measureText('THE SKY BRAWL').width;
  g.fillRect(-textW / 2 - 20, -25, textW + 40, 50);
  g.fillStyle = '#1c1a17';
  g.fillText('THE SKY BRAWL', 0, 0);
  g.restore();
}

// -- Painting helpers ------------------------------------------------------

function drawBull(g, cx, cy, scale, rock) {
  g.save();
  g.translate(cx, cy);
  g.rotate(rock);
  g.fillStyle = 'rgba(0,0,0,0.20)';
  g.beginPath();
  g.ellipse(0, scale * 0.60, scale * 1.05, scale * 0.15, 0, 0, Math.PI * 2);
  g.fill();
  // Shoulder hump
  g.fillStyle = '#2a1c12';
  g.beginPath();
  g.ellipse(-scale * 0.20, -scale * 0.35, scale * 0.45, scale * 0.30, 0, 0, Math.PI * 2);
  g.fill();
  // Body
  g.fillStyle = '#3d2a1e';
  g.beginPath();
  g.ellipse(0, 0, scale * 1.15, scale * 0.62, 0, 0, Math.PI * 2);
  g.fill();
  // Biceps
  g.fillStyle = '#4a3323';
  g.beginPath();
  g.ellipse(scale * 0.55, scale * 0.20, scale * 0.24, scale * 0.30, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(-scale * 0.60, scale * 0.15, scale * 0.30, scale * 0.32, 0, 0, Math.PI * 2);
  g.fill();
  // Legs
  g.fillStyle = '#3d2a1e';
  g.fillRect(-scale * 0.68, scale * 0.28, scale * 0.20, scale * 0.42);
  g.fillRect(-scale * 0.28, scale * 0.28, scale * 0.20, scale * 0.42);
  g.fillRect(scale * 0.30,  scale * 0.25, scale * 0.22, scale * 0.35);
  g.fillRect(scale * 0.65,  scale * 0.25, scale * 0.22, scale * 0.35);
  // Head
  g.beginPath();
  g.ellipse(scale * 0.92, -scale * 0.08, scale * 0.34, scale * 0.32, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#786246';
  g.beginPath();
  g.ellipse(scale * 1.16, scale * 0.02, scale * 0.14, scale * 0.11, 0, 0, Math.PI * 2);
  g.fill();
  // Horns
  g.fillStyle = '#f6f1e6';
  g.beginPath();
  g.moveTo(scale * 0.78, -scale * 0.36);
  g.lineTo(scale * 0.50, -scale * 0.68);
  g.lineTo(scale * 0.90, -scale * 0.42);
  g.closePath(); g.fill();
  g.beginPath();
  g.moveTo(scale * 1.05, -scale * 0.32);
  g.lineTo(scale * 1.25, -scale * 0.68);
  g.lineTo(scale * 0.98, -scale * 0.38);
  g.closePath(); g.fill();
  // Nose ring
  g.strokeStyle = '#c8a165'; g.lineWidth = scale * 0.03;
  g.beginPath(); g.arc(scale * 1.14, scale * 0.09, scale * 0.05, 0, Math.PI * 2); g.stroke();
  // Angry glowing eye
  g.fillStyle = '#f4c95d';
  g.beginPath(); g.arc(scale * 1.02, -scale * 0.14, scale * 0.05, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#b73a2a'; g.lineWidth = scale * 0.04;
  g.beginPath();
  g.moveTo(scale * 0.88, -scale * 0.28);
  g.lineTo(scale * 1.08, -scale * 0.14);
  g.stroke();
  // Steam huffs
  g.fillStyle = 'rgba(255,255,255,0.7)';
  g.beginPath(); g.arc(scale * 1.28, scale * 0.05, scale * 0.05, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(scale * 1.36, scale * 0.10, scale * 0.04, 0, Math.PI * 2); g.fill();
  // Tail
  g.strokeStyle = '#3d2a1e'; g.lineWidth = scale * 0.06;
  g.beginPath();
  g.moveTo(-scale * 1.10, -scale * 0.05);
  g.lineTo(-scale * 1.40, scale * 0.20);
  g.stroke();
  g.restore();
}

function drawHorse(g, cx, cy, scale, rock) {
  g.save();
  g.translate(cx, cy);
  g.rotate(rock);
  g.fillStyle = 'rgba(0,0,0,0.20)';
  g.beginPath();
  g.ellipse(0, scale * 0.55, scale * 0.9, scale * 0.14, 0, 0, Math.PI * 2);
  g.fill();
  // Body
  g.fillStyle = '#7a4d2b';
  g.beginPath();
  g.ellipse(0, 0, scale, scale * 0.45, 0, 0, Math.PI * 2);
  g.fill();
  // Rear legs
  g.fillRect(-scale * 0.05, scale * 0.15, scale * 0.10, scale * 0.55);
  g.fillRect(scale * 0.25,  scale * 0.15, scale * 0.10, scale * 0.55);
  // Front kicking legs
  g.save();
  g.translate(-scale * 0.55, scale * 0.05);
  g.rotate(-1.05);
  g.fillRect(-scale * 0.05, 0, scale * 0.10, scale * 0.60);
  g.restore();
  g.save();
  g.translate(-scale * 0.35, scale * 0.05);
  g.rotate(-0.85);
  g.fillRect(-scale * 0.05, 0, scale * 0.10, scale * 0.55);
  g.restore();
  // Head + neck
  g.beginPath();
  g.moveTo(-scale * 0.65, -scale * 0.05);
  g.lineTo(-scale * 1.10, -scale * 0.60);
  g.lineTo(-scale * 0.78, -scale * 0.66);
  g.lineTo(-scale * 0.55, -scale * 0.20);
  g.closePath(); g.fill();
  // Mane
  g.fillStyle = '#3d2a1e';
  g.beginPath();
  g.moveTo(-scale * 0.65, -scale * 0.05);
  g.quadraticCurveTo(-scale * 0.20, -scale * 0.42, scale * 0.10, -scale * 0.10);
  g.lineTo(scale * 0.10, 0);
  g.quadraticCurveTo(-scale * 0.20, -scale * 0.20, -scale * 0.55, -scale * 0.02);
  g.closePath(); g.fill();
  // Spiky forelock
  const baseFx = -scale * 0.95, baseFy = -scale * 0.55;
  g.fillStyle = '#3d2a1e';
  for (let i = 0; i < 5; i++) {
    const off = (i - 2) * scale * 0.05;
    g.beginPath();
    g.moveTo(baseFx + off, baseFy);
    g.lineTo(baseFx + off + scale * 0.02, baseFy - scale * 0.28 - (i % 2) * scale * 0.05);
    g.lineTo(baseFx + off + scale * 0.05, baseFy);
    g.closePath(); g.fill();
  }
  g.fillStyle = '#b73a2a';
  g.beginPath();
  g.moveTo(baseFx - scale * 0.005, baseFy - scale * 0.22);
  g.lineTo(baseFx + scale * 0.015, baseFy - scale * 0.32);
  g.lineTo(baseFx + scale * 0.035, baseFy - scale * 0.22);
  g.closePath(); g.fill();
  // Eye
  g.fillStyle = '#f4c95d';
  g.beginPath(); g.arc(-scale * 0.94, -scale * 0.45, scale * 0.045, 0, Math.PI * 2); g.fill();
  // Tail
  g.fillStyle = '#3d2a1e';
  g.beginPath();
  g.moveTo(scale, -scale * 0.05);
  g.quadraticCurveTo(scale * 1.40, scale * 0.05, scale * 1.20, scale * 0.40);
  g.quadraticCurveTo(scale * 1.05, scale * 0.15, scale * 0.95, scale * 0.10);
  g.closePath(); g.fill();
  g.restore();
}

function paintClouds(g, count, alpha) {
  g.fillStyle = `rgba(255,255,255,${alpha})`;
  for (let i = 0; i < count; i++) {
    const x = Math.random() * W;
    const y = H * 0.35 + Math.random() * H * 0.3;
    const r = 50 + Math.random() * 150;
    g.beginPath();
    g.ellipse(x, y, r, r * 0.5, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(x + r * 0.5, y - r * 0.1, r * 0.7, r * 0.4, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(x - r * 0.5, y + r * 0.1, r * 0.6, r * 0.35, 0, 0, Math.PI * 2);
    g.fill();
  }
}

function paintDustPuff(g, cx, cy, size) {
  g.fillStyle = 'rgba(200,180,140,0.65)';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const dx = Math.cos(a) * size * 0.9;
    const dy = Math.sin(a) * size * 0.3;
    g.beginPath();
    g.ellipse(cx + dx, cy + dy, size * 0.5, size * 0.28, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.save();
  g.translate(cx, cy);
  g.rotate(-0.15);
  g.font = 'bold 90px "Comic Sans MS", "Segoe UI", sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#1c1a17';
  g.fillText('POW!', 5, 5);
  g.fillStyle = '#f4c95d';
  g.fillText('POW!', 0, 0);
  g.restore();
}
