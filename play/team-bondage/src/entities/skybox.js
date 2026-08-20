// A silly skybox: a giant bull vs a giant horse fighting overhead. Painted
// procedurally onto canvas faces of a cube texture so we ship no assets.
// Marked `# PLACEHOLDER ART` per DESIGN_PRINCIPLES.md - replace with a hand
// -drawn sky panorama when the art pipeline is ready.

import * as THREE from 'three';

const FACE_SIZE = 1024;   // px per cube face; higher = crisper text overhead

// Painted onto a THREE.CubeTexture. Faces in order: +X, -X, +Y, -Y, +Z, -Z.
export function buildSkybox() {
  const px = paintSky();
  const nx = paintSky();
  const pz = paintSky();
  const nz = paintSky();
  const py = paintBullVsHorse();
  const ny = paintCloudFloor();

  const cube = new THREE.CubeTexture([px, nx, py, ny, pz, nz]);
  cube.needsUpdate = true;
  cube.encoding = THREE.SRGBColorSpace ?? cube.encoding;
  return cube;
}

// Simple sky gradient with some scattered clouds.
function paintSky() {
  const c = doc(FACE_SIZE); const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, FACE_SIZE);
  grad.addColorStop(0, '#c8dcf5');
  grad.addColorStop(1, '#79a4dc');
  g.fillStyle = grad; g.fillRect(0, 0, FACE_SIZE, FACE_SIZE);
  paintClouds(g, 10, 0.5);
  return c;
}

// Bottom face - just clouds fading to lower haze.
function paintCloudFloor() {
  const c = doc(FACE_SIZE); const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, FACE_SIZE);
  grad.addColorStop(0, '#79a4dc');
  grad.addColorStop(1, '#3a5a89');
  g.fillStyle = grad; g.fillRect(0, 0, FACE_SIZE, FACE_SIZE);
  paintClouds(g, 6, 0.35);
  return c;
}

// TOP FACE: bull vs horse fighting. Look straight up in-game to see it.
function paintBullVsHorse() {
  const c = doc(FACE_SIZE); const g = c.getContext('2d');
  // Sky gradient background so it looks like they're up in the clouds.
  const grad = g.createLinearGradient(0, 0, 0, FACE_SIZE);
  grad.addColorStop(0, '#e6ecf5');
  grad.addColorStop(0.5, '#c8dcf5');
  grad.addColorStop(1, '#a8c4e0');
  g.fillStyle = grad; g.fillRect(0, 0, FACE_SIZE, FACE_SIZE);
  paintClouds(g, 8, 0.55);

  // Big VS in the centre.
  g.save();
  g.translate(FACE_SIZE / 2, FACE_SIZE / 2);
  g.rotate(-0.06);
  g.font = 'bold 220px Georgia, serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillStyle = 'rgba(28, 26, 23, 0.15)';
  g.fillText('VS', 8, 8);
  g.fillStyle = '#b73a2a';
  g.fillText('VS', 0, 0);
  g.restore();

  // BULL on the left half (facing right, charging).
  drawBull(g, FACE_SIZE * 0.28, FACE_SIZE * 0.55, FACE_SIZE * 0.28);
  // HORSE on the right half (facing left, rearing up).
  drawHorse(g, FACE_SIZE * 0.72, FACE_SIZE * 0.55, FACE_SIZE * 0.28);

  // Motion streaks + dust puffs to sell the fight.
  paintDustPuff(g, FACE_SIZE * 0.5, FACE_SIZE * 0.72, 90);

  // Title banner along the bottom.
  g.fillStyle = 'rgba(255,255,255,0.55)';
  const bh = 120;
  g.fillRect(0, FACE_SIZE - bh, FACE_SIZE, bh);
  g.fillStyle = '#1c1a17';
  g.font = 'italic 700 68px Georgia, serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText('THE SKY BRAWL OF THE CENTURY', FACE_SIZE / 2, FACE_SIZE - bh / 2 - 8);
  g.font = '30px "Segoe UI", sans-serif';
  g.fillText('brought to you by Magestican Studios', FACE_SIZE / 2, FACE_SIZE - 30);

  return c;
}

// -- primitive silhouettes: not going for anatomy, going for legibility ----

function drawBull(g, cx, cy, scale) {
  g.save();
  g.translate(cx, cy);
  // Shadow
  g.fillStyle = 'rgba(0,0,0,0.18)';
  g.beginPath();
  g.ellipse(0, scale * 0.55, scale * 0.9, scale * 0.15, 0, 0, Math.PI * 2);
  g.fill();

  // Body (dark brown)
  g.fillStyle = '#3d2a1e';
  g.beginPath();
  g.ellipse(0, 0, scale, scale * 0.5, 0, 0, Math.PI * 2);
  g.fill();

  // Legs
  g.fillRect(-scale * 0.55, scale * 0.2, scale * 0.12, scale * 0.45);
  g.fillRect(-scale * 0.20, scale * 0.2, scale * 0.12, scale * 0.45);
  g.fillRect(scale * 0.35, scale * 0.15, scale * 0.12, scale * 0.30);
  g.fillRect(scale * 0.60, scale * 0.15, scale * 0.12, scale * 0.30);

  // Head + snout (charging right)
  g.beginPath();
  g.ellipse(scale * 0.85, -scale * 0.05, scale * 0.30, scale * 0.28, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#786246';
  g.beginPath();
  g.ellipse(scale * 1.06, scale * 0.02, scale * 0.12, scale * 0.10, 0, 0, Math.PI * 2);
  g.fill();

  // Horns (white)
  g.fillStyle = '#f6f1e6';
  g.beginPath();
  g.moveTo(scale * 0.75, -scale * 0.35);
  g.lineTo(scale * 0.55, -scale * 0.55);
  g.lineTo(scale * 0.85, -scale * 0.40);
  g.closePath(); g.fill();
  g.beginPath();
  g.moveTo(scale * 1.00, -scale * 0.30);
  g.lineTo(scale * 1.15, -scale * 0.55);
  g.lineTo(scale * 0.95, -scale * 0.35);
  g.closePath(); g.fill();

  // Eye
  g.fillStyle = '#f4c95d';
  g.beginPath(); g.arc(scale * 0.98, -scale * 0.10, scale * 0.04, 0, Math.PI * 2); g.fill();

  // Angry brow
  g.strokeStyle = '#f4c95d'; g.lineWidth = scale * 0.03;
  g.beginPath();
  g.moveTo(scale * 0.85, -scale * 0.20);
  g.lineTo(scale * 1.00, -scale * 0.12);
  g.stroke();

  // Tail
  g.strokeStyle = '#3d2a1e'; g.lineWidth = scale * 0.05;
  g.beginPath();
  g.moveTo(-scale * 0.95, -scale * 0.05);
  g.lineTo(-scale * 1.25, scale * 0.15);
  g.stroke();

  g.restore();
}

function drawHorse(g, cx, cy, scale) {
  g.save();
  g.translate(cx, cy);
  // Shadow
  g.fillStyle = 'rgba(0,0,0,0.18)';
  g.beginPath();
  g.ellipse(0, scale * 0.55, scale * 0.85, scale * 0.14, 0, 0, Math.PI * 2);
  g.fill();

  // Body (chestnut)
  g.fillStyle = '#7a4d2b';
  g.beginPath();
  g.ellipse(0, 0, scale, scale * 0.42, 0, 0, Math.PI * 2);
  g.fill();

  // Legs
  g.fillRect(-scale * 0.05, scale * 0.15, scale * 0.10, scale * 0.50);
  g.fillRect(scale * 0.20, scale * 0.15, scale * 0.10, scale * 0.50);
  // Rearing front legs
  g.save();
  g.translate(-scale * 0.55, scale * 0.05);
  g.rotate(-0.9);
  g.fillRect(-scale * 0.05, 0, scale * 0.10, scale * 0.60);
  g.restore();
  g.save();
  g.translate(-scale * 0.35, scale * 0.05);
  g.rotate(-0.7);
  g.fillRect(-scale * 0.05, 0, scale * 0.10, scale * 0.55);
  g.restore();

  // Head + neck (facing left)
  g.beginPath();
  g.moveTo(-scale * 0.65, -scale * 0.05);
  g.lineTo(-scale * 1.05, -scale * 0.55);
  g.lineTo(-scale * 0.75, -scale * 0.60);
  g.lineTo(-scale * 0.55, -scale * 0.20);
  g.closePath(); g.fill();

  // Mane
  g.fillStyle = '#3d2a1e';
  g.beginPath();
  g.moveTo(-scale * 0.65, -scale * 0.05);
  g.quadraticCurveTo(-scale * 0.20, -scale * 0.40, scale * 0.10, -scale * 0.10);
  g.lineTo(scale * 0.10, scale * 0);
  g.quadraticCurveTo(-scale * 0.20, -scale * 0.20, -scale * 0.55, -scale * 0.02);
  g.closePath(); g.fill();

  // Eye
  g.fillStyle = '#f4c95d';
  g.beginPath(); g.arc(-scale * 0.90, -scale * 0.42, scale * 0.04, 0, Math.PI * 2); g.fill();

  // Tail
  g.fillStyle = '#3d2a1e';
  g.beginPath();
  g.moveTo(scale, -scale * 0.05);
  g.quadraticCurveTo(scale * 1.35, scale * 0.05, scale * 1.15, scale * 0.35);
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
}

function doc(size) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  return c;
}
