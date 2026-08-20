// Silly animated skybox: a giant BUFFED bull vs a spiky-forelocked horse
// wrestling above the map. Painted procedurally onto canvas faces of a
// CubeTexture so we ship no assets. The top face has an animator that
// re-paints on a slow interval to make the fighters shift and rear.
//
// Marked `# PLACEHOLDER ART` per DESIGN_PRINCIPLES.md - hand-drawn sky
// panorama replaces this before v1.0.

import * as THREE from 'three';

const FACE_SIZE = 1024;
const ANIMATE_FPS = 6;   // sky repaints per second

export function buildSkybox() {
  const px = paintSky();
  const nx = paintSky();
  const pz = paintSky();
  const nz = paintSky();
  const py = document.createElement('canvas');
  py.width = FACE_SIZE; py.height = FACE_SIZE;
  const ny = paintCloudFloor();

  paintBullVsHorse(py, 0);

  const cube = new THREE.CubeTexture([px, nx, py, ny, pz, nz]);
  cube.needsUpdate = true;
  cube.encoding = THREE.SRGBColorSpace ?? cube.encoding;

  // Animate the top face at ~6fps. Doesn't run on interval when tab hidden.
  const start = performance.now();
  setInterval(() => {
    const t = (performance.now() - start) / 1000;
    paintBullVsHorse(py, t);
    cube.needsUpdate = true;
  }, 1000 / ANIMATE_FPS);

  return cube;
}

function paintSky() {
  const c = doc(FACE_SIZE); const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, FACE_SIZE);
  grad.addColorStop(0, '#c8dcf5');
  grad.addColorStop(1, '#79a4dc');
  g.fillStyle = grad; g.fillRect(0, 0, FACE_SIZE, FACE_SIZE);
  paintClouds(g, 10, 0.5);
  return c;
}

function paintCloudFloor() {
  const c = doc(FACE_SIZE); const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, FACE_SIZE);
  grad.addColorStop(0, '#79a4dc');
  grad.addColorStop(1, '#3a5a89');
  g.fillStyle = grad; g.fillRect(0, 0, FACE_SIZE, FACE_SIZE);
  paintClouds(g, 6, 0.35);
  return c;
}

// TOP FACE: animated. t = seconds since scene start.
function paintBullVsHorse(canvas, t) {
  const g = canvas.getContext('2d');
  // Sky
  const grad = g.createLinearGradient(0, 0, 0, FACE_SIZE);
  grad.addColorStop(0, '#e6ecf5');
  grad.addColorStop(0.55, '#c8dcf5');
  grad.addColorStop(1, '#a8c4e0');
  g.fillStyle = grad; g.fillRect(0, 0, FACE_SIZE, FACE_SIZE);
  paintClouds(g, 8, 0.55);

  // Wrestling shake: both fighters bounce toward each other and rock.
  const shake = Math.sin(t * 4.0) * 12;
  const rockBull  = Math.sin(t * 3.2) * 0.10;
  const rockHorse = Math.cos(t * 3.4) * 0.14;

  // BULL: buffed, on left, pushing right.
  drawBull(g,
    FACE_SIZE * 0.30 + shake,
    FACE_SIZE * 0.58 + Math.sin(t * 2.7) * 8,
    FACE_SIZE * 0.32,
    rockBull);
  // HORSE: rearing, on right, pushing left.
  drawHorse(g,
    FACE_SIZE * 0.70 - shake,
    FACE_SIZE * 0.55 + Math.cos(t * 2.9) * 6,
    FACE_SIZE * 0.30,
    rockHorse);

  // BIG "VS" between them.
  g.save();
  g.translate(FACE_SIZE / 2, FACE_SIZE / 2);
  g.rotate(-0.06 + Math.sin(t * 2.4) * 0.03);
  g.font = 'bold 240px Georgia, serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = 'rgba(28, 26, 23, 0.15)';
  g.fillText('VS', 10, 10);
  g.fillStyle = '#b73a2a';
  g.fillText('VS', 0, 0);
  g.restore();

  // Ka-pow bubble that pulses.
  const puffPulse = 80 + Math.sin(t * 6) * 18;
  paintDustPuff(g, FACE_SIZE * 0.5, FACE_SIZE * 0.75, puffPulse);

  // Bottom banner
  g.fillStyle = 'rgba(255,255,255,0.55)';
  const bh = 120;
  g.fillRect(0, FACE_SIZE - bh, FACE_SIZE, bh);
  g.fillStyle = '#1c1a17';
  g.font = 'italic 700 68px Georgia, serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('THE SKY BRAWL OF THE CENTURY', FACE_SIZE / 2, FACE_SIZE - bh / 2 - 8);
  g.font = '30px "Segoe UI", sans-serif';
  g.fillText('brought to you by Magestican Studios', FACE_SIZE / 2, FACE_SIZE - 30);
}

function drawBull(g, cx, cy, scale, rock) {
  g.save();
  g.translate(cx, cy);
  g.rotate(rock);
  // Shadow
  g.fillStyle = 'rgba(0,0,0,0.20)';
  g.beginPath();
  g.ellipse(0, scale * 0.60, scale * 1.05, scale * 0.15, 0, 0, Math.PI * 2);
  g.fill();

  // BULK: hunched shoulder hump behind the neck.
  g.fillStyle = '#2a1c12';
  g.beginPath();
  g.ellipse(-scale * 0.20, -scale * 0.35, scale * 0.45, scale * 0.30, 0, 0, Math.PI * 2);
  g.fill();

  // Body - thicker
  g.fillStyle = '#3d2a1e';
  g.beginPath();
  g.ellipse(0, 0, scale * 1.15, scale * 0.62, 0, 0, Math.PI * 2);
  g.fill();

  // Big biceps front and back
  g.fillStyle = '#4a3323';
  g.beginPath();
  g.ellipse(scale * 0.55, scale * 0.20, scale * 0.24, scale * 0.30, 0, 0, Math.PI * 2);
  g.fill();
  g.beginPath();
  g.ellipse(-scale * 0.60, scale * 0.15, scale * 0.30, scale * 0.32, 0, 0, Math.PI * 2);
  g.fill();

  // Legs (thick pillars)
  g.fillStyle = '#3d2a1e';
  g.fillRect(-scale * 0.68, scale * 0.28, scale * 0.20, scale * 0.42);
  g.fillRect(-scale * 0.28, scale * 0.28, scale * 0.20, scale * 0.42);
  g.fillRect(scale * 0.30,  scale * 0.25, scale * 0.22, scale * 0.35);
  g.fillRect(scale * 0.65,  scale * 0.25, scale * 0.22, scale * 0.35);

  // Head + snout (charging right)
  g.beginPath();
  g.ellipse(scale * 0.92, -scale * 0.08, scale * 0.34, scale * 0.32, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#786246';
  g.beginPath();
  g.ellipse(scale * 1.16, scale * 0.02, scale * 0.14, scale * 0.11, 0, 0, Math.PI * 2);
  g.fill();

  // Horns - bigger, meaner
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

  // Steam huffs from nostrils
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
  // Shadow
  g.fillStyle = 'rgba(0,0,0,0.20)';
  g.beginPath();
  g.ellipse(0, scale * 0.55, scale * 0.9, scale * 0.14, 0, 0, Math.PI * 2);
  g.fill();

  // Body (chestnut)
  g.fillStyle = '#7a4d2b';
  g.beginPath();
  g.ellipse(0, 0, scale, scale * 0.45, 0, 0, Math.PI * 2);
  g.fill();

  // Rear legs (planted)
  g.fillRect(-scale * 0.05, scale * 0.15, scale * 0.10, scale * 0.55);
  g.fillRect(scale * 0.25,  scale * 0.15, scale * 0.10, scale * 0.55);

  // Front legs kicking forward
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

  // Head + neck (facing left)
  g.beginPath();
  g.moveTo(-scale * 0.65, -scale * 0.05);
  g.lineTo(-scale * 1.10, -scale * 0.60);
  g.lineTo(-scale * 0.78, -scale * 0.66);
  g.lineTo(-scale * 0.55, -scale * 0.20);
  g.closePath(); g.fill();

  // MANE (flowing)
  g.fillStyle = '#3d2a1e';
  g.beginPath();
  g.moveTo(-scale * 0.65, -scale * 0.05);
  g.quadraticCurveTo(-scale * 0.20, -scale * 0.42, scale * 0.10, -scale * 0.10);
  g.lineTo(scale * 0.10, 0);
  g.quadraticCurveTo(-scale * 0.20, -scale * 0.20, -scale * 0.55, -scale * 0.02);
  g.closePath(); g.fill();

  // SPIKY FORELOCK - jagged spikes at the front of the head.
  g.fillStyle = '#3d2a1e';
  const baseFx = -scale * 0.95, baseFy = -scale * 0.55;
  for (let i = 0; i < 5; i++) {
    const off = (i - 2) * scale * 0.05;
    g.beginPath();
    g.moveTo(baseFx + off, baseFy);
    g.lineTo(baseFx + off + scale * 0.02, baseFy - scale * 0.28 - (i % 2) * scale * 0.05);
    g.lineTo(baseFx + off + scale * 0.05, baseFy);
    g.closePath(); g.fill();
  }
  // Bright red tip on the tallest spike
  g.fillStyle = '#b73a2a';
  g.beginPath();
  g.moveTo(baseFx - scale * 0.005, baseFy - scale * 0.22);
  g.lineTo(baseFx + scale * 0.015, baseFy - scale * 0.32);
  g.lineTo(baseFx + scale * 0.035, baseFy - scale * 0.22);
  g.closePath(); g.fill();

  // Angry glowing eye
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
    const x = Math.random() * FACE_SIZE;
    const y = Math.random() * FACE_SIZE;
    const r = 40 + Math.random() * 120;
    g.beginPath();
    g.ellipse(x, y, r, r * 0.55, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(x + r * 0.5, y - r * 0.1, r * 0.7, r * 0.45, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(x - r * 0.5, y + r * 0.1, r * 0.6, r * 0.4, 0, 0, Math.PI * 2);
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
  // "POW!" text
  g.save();
  g.translate(cx, cy);
  g.rotate(-0.15);
  g.font = 'bold 60px "Comic Sans MS", "Segoe UI", sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#1c1a17';
  g.fillText('POW!', 3, 3);
  g.fillStyle = '#f4c95d';
  g.fillText('POW!', 0, 0);
  g.restore();
}

function doc(size) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  return c;
}
