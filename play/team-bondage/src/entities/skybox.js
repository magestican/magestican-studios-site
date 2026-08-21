// Spherical (equirectangular) skybox - a giant painted canvas wrapped
// around a huge inside-out sphere so the horizon naturally warps toward
// the poles. Way more legible than a cube because the top-of-screen text
// is now BIG (the sky-brawl painting is painted top-third of the canvas
// which the equirectangular projection maps to the whole zenith cap).
//
// The animation ticks the whole canvas 6x/sec: fighters shake, VS wobbles,
// dust puffs pulse.
//
// The clouds are three PARALLAX BANKS baked once into their own strips and
// scrolled at their own rates (far barely moves, near overtakes it). All the
// numbers live in map/skyPaintSpec.js as pure data so the art rules are
// asserted by tests; see that file's header for what the old field got wrong.
//
// # PLACEHOLDER ART - to be replaced with a hand-drawn 4096x2048 panorama.

import * as THREE from 'three';
import {
  STRIP, HORIZON, SKY_GRADIENT, CLOUD_LAYERS, CLOUD_FORM,
  cloudField, layerOffset,
} from '../map/skyPaintSpec.js';

const W = STRIP.W;   // equirectangular width; height = W/2
const H = STRIP.H;
// Baked cloud strips only need the sky half — everything below the horizon
// row is behind the map, so blitting it is 500 rows of wasted fill per frame.
const LAYER_H = Math.ceil(HORIZON * H) + 4;
const ANIMATE_FPS = 12;   // was 6 — Bryan 2026-08-20 "the sky box animals still aren't fighting"; smoother = more visibly in motion.

// Try the Blender-rendered PNG first. If it fails to load, fall back to
// the animated canvas painting (which at least ensures something is on
// the sky). See docs/features/rendered-skybox.md.
const RENDERED_PNG = '/play/team-bondage/assets/hand-drawn/sky/panorama.png';

// The cloud banks, baked ONCE and kept. The old field re-rolled every puff
// position inside the repaint, which runs 12x a second, so the sky was white
// noise rather than weather; baking is what makes drift possible at all.
let BANKS = null;
const banks = () => (BANKS ??= CLOUD_LAYERS.map((layer) => ({ layer, strip: bakeCloudBank(layer) })));

// Paint the whole equirectangular panorama at time `t` (seconds). Exported so
// art/preview/sky.html can render the sky at chosen times — which is how the
// drift and the parallax get LOOKED at before they ship.
export function paintSkyPanorama(canvas, t) {
  paint(canvas, t, banks());
}

export function buildSkybox() {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  paintSkyPanorama(canvas, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace ?? tex.colorSpace;

  // Animated canvas fallback: repaint the wrestling scene every 166ms.
  const start = performance.now();
  const interval = setInterval(() => {
    const t = (performance.now() - start) / 1000;
    paintSkyPanorama(canvas, t);
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

function paint(canvas, t, banks) {
  const g = canvas.getContext('2d');
  // Sky gradient across the equirectangular strip: top row = sky zenith
  // (blue), middle = horizon (cream/blue), bottom = ground haze.
  const grad = g.createLinearGradient(0, 0, 0, H);
  for (const stop of SKY_GRADIENT) grad.addColorStop(stop.at, stop.hex);
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  scrollCloudBanks(g, t, banks);

  // Sky-brawl V3 (2026-08-21): classic cartoon fight language so the fight
  // is UNDENIABLE. Lives at the top of the strip — look up to see it.
  //   0-20%   APPROACH — both charge inward with speed lines.
  //   20-75%  FIGHT CLOUD — animals vanish inside a rolling dust ball with
  //           limbs + horns + stars flying out and POW/BAM/THUNK bursts.
  //   75-100% SEPARATE — both stagger out dazed, stars circling heads.
  const brawlCX = W / 2;
  const brawlCY = H * 0.14;
  const brawlR  = H * 0.20;
  const restX   = brawlR * 2.0;
  const CYCLE   = 3.2;
  const phase   = (t % CYCLE) / CYCLE;  // 0..1

  // Ring rope (behind everything).
  g.save();
  g.translate(brawlCX, brawlCY);
  g.strokeStyle = 'rgba(183,58,42,0.55)';
  g.lineWidth = 8;
  g.beginPath();
  g.ellipse(0, 0, brawlR * 3.0, brawlR * 1.6, 0, 0, Math.PI * 2);
  g.stroke();
  g.restore();

  if (phase < 0.20) {
    // -- APPROACH: charge with speed lines. --
    const p = phase / 0.20;
    const ease = p * p;                          // accelerate into the hit
    const sep = 1.0 - ease * 0.9;
    const bullX  = brawlCX - restX * sep;
    const horseX = brawlCX + restX * sep;
    g.strokeStyle = 'rgba(255,255,255,0.5)';
    g.lineWidth = 4;
    for (let i = 0; i < 4; i++) {
      const ly = brawlCY + (i - 1.5) * brawlR * 0.35;
      g.beginPath(); g.moveTo(bullX - brawlR * (1.6 + i * 0.3), ly);
      g.lineTo(bullX - brawlR * 1.1, ly); g.stroke();
      g.beginPath(); g.moveTo(horseX + brawlR * (1.6 + i * 0.3), ly);
      g.lineTo(horseX + brawlR * 1.1, ly); g.stroke();
    }
    drawBull(g,  bullX, brawlCY, brawlR, -0.15 * ease);
    drawHorse(g, horseX, brawlCY, brawlR, 0.15 * ease);
  } else if (phase < 0.75) {
    // -- FIGHT CLOUD: the animals are INSIDE the ball. --
    drawFightCloud(g, brawlCX, brawlCY, brawlR * 1.6, t);
    // Word burst every ~0.45s, thrown to golden-angle scattered offsets.
    const burstIdx = Math.floor(t / 0.45);
    const burstPhase = (t % 0.45) / 0.45;
    if (burstPhase < 0.6) {
      const words = ['POW!', 'BAM!', 'THUNK!', 'BOK!', 'WHAM!'];
      const word = words[burstIdx % words.length];
      const ang = (burstIdx * 2.399) % (Math.PI * 2);
      const bx = brawlCX + Math.cos(ang) * brawlR * 1.4;
      const by = brawlCY + Math.sin(ang) * brawlR * 0.8;
      const pop = Math.sin(burstPhase * Math.PI);   // grow then shrink
      g.save();
      g.translate(bx, by);
      g.rotate((burstIdx % 2 ? 1 : -1) * 0.15);
      g.font = `bold ${Math.round(60 + pop * 50)}px "Comic Sans MS", "Segoe UI", sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#1c1a17'; g.fillText(word, 4, 4);
      g.fillStyle = burstIdx % 2 ? '#f4c95d' : '#ff7b5a';
      g.fillText(word, 0, 0);
      g.restore();
    }
  } else {
    // -- SEPARATE: stagger out, dazed, stars over heads. --
    const p = (phase - 0.75) / 0.25;
    const sep = 0.15 + p * 0.85;
    const wobble = (1 - p) * 0.25;
    const bullX  = brawlCX - restX * sep;
    const horseX = brawlCX + restX * sep;
    drawBull(g,  bullX, brawlCY + Math.sin(t * 9) * 6 * (1 - p), brawlR, Math.sin(t * 7) * wobble);
    drawHorse(g, horseX, brawlCY + Math.cos(t * 9) * 6 * (1 - p), brawlR, Math.cos(t * 7) * wobble);
    // Dazed stars circling each head.
    for (const [hx, hy] of [[bullX + brawlR * 0.9, brawlCY - brawlR * 0.5],
                            [horseX - brawlR * 0.9, brawlCY - brawlR * 0.6]]) {
      for (let s = 0; s < 3; s++) {
        const a = t * 4 + s * (Math.PI * 2 / 3);
        drawStar(g, hx + Math.cos(a) * brawlR * 0.4,
                    hy + Math.sin(a) * brawlR * 0.15, 9, '#f4c95d');
      }
    }
  }

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

// Classic cartoon fight ball: rolling dust cloud with limbs, a horn and
// stars flying out. `t` drives the rotation so the whole thing tumbles.
function drawFightCloud(g, cx, cy, r, t) {
  g.save();
  g.translate(cx, cy);
  const spin = t * 3.0;
  // Protruding limbs FIRST (so cloud lumps overlap their bases).
  const limbs = [
    { a: 0.4,  len: 1.25, w: 0.16, color: '#3d2a1e' },   // bull leg
    { a: 1.9,  len: 1.15, w: 0.13, color: '#7a4d2b' },   // horse leg
    { a: 3.3,  len: 1.30, w: 0.15, color: '#3d2a1e' },   // bull leg 2
    { a: 4.6,  len: 1.10, w: 0.12, color: '#7a4d2b' },   // horse leg 2
  ];
  for (const L of limbs) {
    const a = L.a + spin;
    g.save();
    g.rotate(a);
    g.fillStyle = L.color;
    g.fillRect(r * 0.45, -r * L.w / 2, r * (L.len - 0.45), r * L.w);
    // Hoof cap.
    g.fillStyle = '#1a1512';
    g.fillRect(r * (L.len - 0.12), -r * L.w * 0.6, r * 0.12, r * L.w * 1.2);
    g.restore();
  }
  // A horn poking out (bull's).
  g.save();
  g.rotate(2.6 + spin);
  g.fillStyle = '#f6f1e6';
  g.beginPath();
  g.moveTo(r * 0.5, -r * 0.06);
  g.lineTo(r * 0.95, -r * 0.22);
  g.lineTo(r * 0.55, r * 0.08);
  g.closePath(); g.fill();
  g.restore();
  // The dust ball itself: two rings of overlapping puffs, counter-rotating.
  for (const [count, rr, size, tint, dir] of [
    [9, 0.72, 0.42, 'rgba(226,216,200,0.95)',  1],
    [7, 0.40, 0.50, 'rgba(240,233,220,0.95)', -1],
  ]) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + spin * dir * 0.5;
      const px = Math.cos(a) * r * rr;
      const py = Math.sin(a) * r * rr * 0.75;
      g.fillStyle = tint;
      g.beginPath();
      g.ellipse(px, py, r * size, r * size * 0.8, a, 0, Math.PI * 2);
      g.fill();
    }
  }
  // Core.
  g.fillStyle = 'rgba(235,227,212,0.98)';
  g.beginPath(); g.ellipse(0, 0, r * 0.55, r * 0.45, 0, 0, Math.PI * 2); g.fill();
  // Stars ejected from the tumble.
  for (let s = 0; s < 5; s++) {
    const a = spin * 1.4 + s * (Math.PI * 2 / 5);
    const d = r * (1.05 + 0.18 * Math.sin(t * 5 + s));
    drawStar(g, Math.cos(a) * d, Math.sin(a) * d * 0.8, r * 0.10, s % 2 ? '#f4c95d' : '#ffffff');
  }
  g.restore();
}

// 4-point cartoon star.
function drawStar(g, x, y, size, color) {
  g.save();
  g.translate(x, y);
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(0, -size);
  g.quadraticCurveTo(size * 0.15, -size * 0.15, size, 0);
  g.quadraticCurveTo(size * 0.15, size * 0.15, 0, size);
  g.quadraticCurveTo(-size * 0.15, size * 0.15, -size, 0);
  g.quadraticCurveTo(-size * 0.15, -size * 0.15, 0, -size);
  g.closePath(); g.fill();
  g.restore();
}

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

// -- Clouds: three parallax banks -----------------------------------------
// All the numbers are in map/skyPaintSpec.js. Here we only bake and scroll.

// Bake one bank into its own transparent strip. Called once per layer at
// startup, never inside the repaint — that is the whole point.
function bakeCloudBank(layer) {
  const c = document.createElement('canvas');
  c.width = W; c.height = LAYER_H;
  const g = c.getContext('2d');
  for (const cloud of cloudField(layer)) {
    // Draw a wrapped copy of anything near an edge so the strip tiles
    // seamlessly when it scrolls past its own join.
    for (const wrap of [-W, 0, W]) {
      const x = cloud.x + wrap;
      if (x < -cloud.w * 1.5 || x > W + cloud.w * 1.5) continue;
      drawCloud(g, cloud, layer, x);
    }
  }
  if (layer.hazeFade) {
    // The far bank dissolves into the horizon haze instead of stopping on a
    // line — distance is the reason it is pale, so it should also be the
    // reason it disappears.
    g.globalCompositeOperation = 'destination-in';
    const fade = g.createLinearGradient(0, layer.band[0] * H, 0, HORIZON * H);
    fade.addColorStop(0, 'rgba(255,255,255,1)');
    fade.addColorStop(1, `rgba(255,255,255,${layer.hazeFade})`);
    g.fillStyle = fade;
    g.fillRect(0, 0, W, LAYER_H);
    g.globalCompositeOperation = 'source-over';
  }
  return c;
}

// One cumulus: a flat base with billows piled on it, in three tones.
// A single flat tone has no form (craft/color.md, "value before hue") — the
// shade slab and the sun-side crown are what turn a cluster of ellipses into
// something with a lit top and a heavy underside.
function drawCloud(g, cloud, layer, x) {
  const { baseY, w, h, lit, puffs } = cloud;
  g.save();
  g.translate(x, baseY);
  // Clip to the base line: a cumulus sits FLAT on its condensation level,
  // and that hard bottom edge against a soft top is most of the silhouette.
  g.beginPath();
  g.rect(-w * 1.2, -h * 2.6, w * 2.4, h * 2.6);
  g.clip();

  const pass = (ox, oy, scale, fill) => {
    g.fillStyle = fill;
    for (const p of puffs) {
      g.save();
      g.translate(p.dx + ox, p.dy + oy);
      g.rotate(p.rot);
      g.beginPath();
      g.ellipse(0, 0, p.rx * scale, p.ry * scale, 0, 0, Math.PI * 2);
      g.fill();
      g.restore();
    }
  };
  // Away-from-sun and mostly DOWN: the shaded flank and the heavy base.
  pass(-lit * h * CLOUD_FORM.shadeOffset, h * CLOUD_FORM.shadeDrop, 1.0, layer.tone.shade);
  pass(0, 0, 1.0, layer.tone.body);
  // Toward the sun and up, slightly shrunk: the lit crown. Kept close enough
  // to stay one continuous cap over the billows.
  pass(lit * h * CLOUD_FORM.crownOffset, -h * 0.12, CLOUD_FORM.crownShrink, layer.tone.crown);
  g.restore();
}

// Scroll every bank across the strip. Each is blitted twice (offset - W and
// offset) so its wrap join is always off the edge of the sky.
function scrollCloudBanks(g, t, banks) {
  if (!banks) return;
  for (const { layer, strip } of banks) {
    const off = layerOffset(layer, t);
    g.globalAlpha = layer.alpha;
    g.drawImage(strip, off - W, 0);
    g.drawImage(strip, off, 0);
    g.globalAlpha = 1;
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
  // (word-burst now drawn separately during IMPACT phase in paint() so we
  // don't stamp POW twice on the dust puff.)
}
