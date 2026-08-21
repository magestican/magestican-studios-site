// Procedural canvas textures for voxel materials. Deliberately simple so
// they hold up as tiny 64x64 tiles on cube faces at any distance -- we ship
// no external art assets. Marked `# PLACEHOLDER ART` per DESIGN_PRINCIPLES.md.

import * as THREE from 'three';
import { BARN_PAINT, BARN_PALETTE } from './barnPaintSpec.js';
import { GROUND_PAINT, GROUND_PALETTE } from './groundPaintSpec.js';

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

// -- Snow: wind-packed sastrugi, blue hollows, crystal glint ---------------
// This tile is the single largest surface in the game — it is under the
// player in every frame — and until 2026-08-21 it painted an actual GREEN
// FIELD (`makeGrassTexture`, #5aa64b). The theme became a snow farm; the
// texture never did. See groundPaintSpec.js for why setting the palette
// entry to snow-white didn't fix it (a tint darkens a hue, it can't replace
// one) and why these tiles are tinted WHITE by voxelMesh.js.
//
// Reading at 10 m is entirely about the BIG features. Per-pixel noise is
// gone by the second mip level; what survives is the ripple bands, the
// scoured hollows and the lit edge crest, so those carry the whole read.
export function makeSnowTexture() {
  const spec = GROUND_PAINT.snow;
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(spec.seed);
  const field = hexRgb(spec.field);

  // Field + per-pixel jitter. Snow's shade is BLUE, so the blue channel
  // jitters least — a darker pixel lands cooler, never grey (color.md).
  const img = g.createImageData(SIZE, SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const j = (rng() - 0.5) * spec.noise;
    img.data[i]   = clamp(field.r + j);
    img.data[i+1] = clamp(field.g + j * 0.8);
    img.data[i+2] = clamp(field.b + j * 0.45);
    img.data[i+3] = 255;
  }
  g.putImageData(img, 0, 0);

  // Scoured hollows FIRST (broad soft dishes of blue shade) so the ripples
  // and glints above them still read inside a hollow.
  for (let i = 0; i < spec.hollows; i++) {
    const x = rng() * SIZE, y = rng() * SIZE;
    const r = SIZE * (0.10 + rng() * 0.16);
    const grad = g.createRadialGradient(x, y, 0, x, y, r);
    grad.addColorStop(0, rgba(spec.hollow, spec.hollowAlpha));
    grad.addColorStop(1, rgba(spec.hollow, 0));
    g.fillStyle = grad;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }

  // Sastrugi: wind-carved ripple bands. Each is a LIT crest with a cool
  // shadow tucked under its lower edge — one-sided highlights read as
  // lighting, a symmetric band reads as a stripe.
  for (let i = 0; i < spec.ripples; i++) {
    const y = rng() * SIZE;
    const rows = spec.rippleRows * (0.7 + rng() * 0.7);
    const phase = rng() * 6.28;
    const wander = (x) => Math.sin(x * 0.11 + phase) * spec.rippleWander
                        + Math.sin(x * 0.31 + phase * 2) * (spec.rippleWander * 0.4);
    for (let x = 0; x < SIZE; x++) {
      const yy = y + wander(x);
      g.fillStyle = rgba(spec.crest, 0.42 + rng() * 0.18);
      g.fillRect(x, Math.round(yy), 1, Math.max(1, Math.round(rows * 0.55)));
      g.fillStyle = rgba(spec.hollow, 0.26 + rng() * 0.12);
      g.fillRect(x, Math.round(yy + rows * 0.55), 1, Math.max(1, Math.round(rows * 0.45)));
    }
  }

  // Trodden-in grit — a working farm, not a ski postcard. Also the cheapest
  // insurance against the tile averaging out to pure white.
  for (let i = 0; i < spec.grit; i++) {
    g.fillStyle = rgba(GROUND_PALETTE.grit, 0.18 + rng() * 0.22);
    g.beginPath();
    g.arc(rng() * SIZE, rng() * SIZE, 0.6 + rng() * 1.4, 0, Math.PI * 2);
    g.fill();
  }

  // Crystal glint: single bright pixels. Close-range life only — these are
  // gone by the first mip and that is fine.
  for (let i = 0; i < spec.glints; i++) {
    g.fillStyle = rgba(GROUND_PALETTE.glint, 0.55 + rng() * 0.45);
    g.fillRect(Math.floor(rng() * SIZE), Math.floor(rng() * SIZE), 1, 1);
  }

  drawEdgeCrest(g, rng, spec);
  return toTexture(c);
}

// -- Ice: a cracked, wind-polished pan -------------------------------------
// The exposed-ice patches scattered through the snow had NO texture entry at
// all, so they rendered as a flat pale-blue rectangle — the one thing on the
// ground plane that was literally a solid colour. Ice doesn't ripple, it
// CRACKS, and that different signature is what stops the ground reading as
// one undifferentiated pale mush (silhouette-readability.md).
export function makeIceTexture() {
  const spec = GROUND_PAINT.ice;
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(spec.seed);
  const field = hexRgb(spec.field);

  const img = g.createImageData(SIZE, SIZE);
  for (let i = 0; i < img.data.length; i += 4) {
    const j = (rng() - 0.5) * spec.noise;
    img.data[i]   = clamp(field.r + j);
    img.data[i+1] = clamp(field.g + j * 0.9);
    img.data[i+2] = clamp(field.b + j * 0.6);
    img.data[i+3] = 255;
  }
  g.putImageData(img, 0, 0);

  // Wind-polished lanes: soft bright bands sweeping across the pan.
  for (let i = 0; i < spec.sheens; i++) {
    const x = rng() * SIZE, y = rng() * SIZE;
    const ang = rng() * Math.PI;
    g.save();
    g.translate(x, y); g.rotate(ang);
    const w = SIZE * 1.6, h = 4 + rng() * 9;
    const grad = g.createLinearGradient(0, -h / 2, 0, h / 2);
    grad.addColorStop(0,   rgba(spec.crest, 0));
    grad.addColorStop(0.5, rgba(spec.crest, spec.sheenAlpha));
    grad.addColorStop(1,   rgba(spec.crest, 0));
    g.fillStyle = grad;
    g.fillRect(-w / 2, -h / 2, w, h);
    g.restore();
  }

  // Frozen bubbles: a dark ring with a lit top edge, so each reads as a
  // sphere trapped under the surface rather than a dot painted on it.
  for (let i = 0; i < spec.bubbles; i++) {
    const x = 2 + rng() * (SIZE - 4), y = 2 + rng() * (SIZE - 4);
    const r = 0.8 + rng() * 2.2;
    g.strokeStyle = rgba(spec.hollow, 0.45);
    g.lineWidth = 1;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.stroke();
    g.fillStyle = rgba(spec.crest, 0.5);
    g.fillRect(Math.round(x - r * 0.3), Math.round(y - r), 1, 1);
  }

  // Cracks: branching fractures, drawn dark with a bright shoulder on one
  // side — the shoulder is what makes a crack read as depth at distance
  // instead of as a scratch.
  for (let i = 0; i < spec.cracks; i++) {
    // Start OUTSIDE the tile and run right across it: a fracture that ends
    // in mid-air reads as a doodle, one that leaves the frame reads as part
    // of a bigger break in the pan.
    const ang = rng() * Math.PI * 2;
    const cxr = SIZE / 2 + Math.cos(ang + Math.PI) * SIZE * 0.8;
    const cyr = SIZE / 2 + Math.sin(ang + Math.PI) * SIZE * 0.8;
    const spine = drawCrack(g, rng, spec, cxr, cyr, ang, SIZE * 1.6);
    // Branches leave the spine part-way along, at a shallow angle.
    for (let b = 0; b < spec.crackBranches; b++) {
      const at = spine[Math.floor(rng() * spine.length)];
      const lean = (rng() < 0.5 ? -1 : 1) * (0.35 + rng() * 0.5);
      drawCrack(g, rng, spec, at[0], at[1], ang + lean, 8 + rng() * 16);
    }
  }

  drawEdgeCrest(g, rng, spec);
  return toTexture(c);
}

// A crack walks in short straight segments with a kink at each joint — a
// smooth curve reads as a hair, an angular polyline reads as a fracture.
function drawCrack(g, rng, spec, x, y, ang, len) {
  const pts = [[x, y]];
  const steps = Math.max(2, Math.round(len / 5));
  for (let i = 0; i < steps; i++) {
    ang += (rng() - 0.5) * spec.crackWander;
    x += Math.cos(ang) * (len / steps);
    y += Math.sin(ang) * (len / steps);
    pts.push([x, y]);
  }
  // Bright shoulder, offset one pixel, drawn first so the dark line sits on it.
  g.strokeStyle = rgba(spec.crest, spec.crackAlpha * 0.55);
  g.lineWidth = 1;
  g.beginPath(); g.moveTo(pts[0][0] + 1, pts[0][1] + 1);
  for (const [px, py] of pts.slice(1)) g.lineTo(px + 1, py + 1);
  g.stroke();
  g.strokeStyle = rgba(spec.hollow, spec.crackAlpha);
  g.lineWidth = 1;
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
  for (const [px, py] of pts.slice(1)) g.lineTo(px, py);
  g.stroke();
  return pts;
}

// Every cube face maps the FULL 0-1 UV, so one tile == one 1 m voxel top.
// A lit lip right on the tile edge with a cool line just inside turns each
// seam into a raised drift ridge — this is what makes the ground read as
// blocks at 10 m instead of as wallpaper. Kept low-alpha and 1 px: crank it
// and the map turns into graph paper.
function drawEdgeCrest(g, rng, spec) {
  const E = SIZE - 1;
  // Walk an edge in alternating drawn/skipped runs so no seam is a solid
  // rule. `edgeBreakup` is the fraction of the edge that gets drawn.
  const dash = (x, y, horiz, len, style) => {
    g.fillStyle = style;
    let i = 0;
    while (i < len) {
      const run = 3 + Math.floor(rng() * 9);
      if (rng() < spec.edgeBreakup) {
        const n = Math.min(run, len - i);
        if (horiz) g.fillRect(x + i, y, n, 1);
        else       g.fillRect(x, y + i, 1, n);
      }
      i += run;
    }
  };
  const crest = rgba(spec.crest, spec.edgeCrest);
  const hollow = rgba(spec.hollow, spec.edgeHollow);
  dash(0, 0, true,  SIZE, crest);  dash(0, E, true,  SIZE, crest);
  dash(0, 0, false, SIZE, crest);  dash(E, 0, false, SIZE, crest);
  dash(1, 1, true,  SIZE - 2, hollow);  dash(1, E - 1, true,  SIZE - 2, hollow);
  dash(1, 1, false, SIZE - 2, hollow);  dash(E - 1, 1, false, SIZE - 2, hollow);
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

// -- Barn siding: board-and-batten painted planks, weathered per team -------
// The barn walls were FLAT COLOUR until 2026-08-21 — the biggest man-made
// surfaces in the game with no pattern at all. Design notes:
//
//  * One tile = one 1 m voxel face, so the horizontal rhythm is per-course:
//    a pale frost cap along the tile's top edge and a dark damp band along
//    its bottom edge turn every voxel row into a readable board course.
//    That, not the grain, is what makes the wall read at 10 m.
//  * Vertical boards each get their own value (per-element wobble,
//    art/knowledge/styles/hand-drawn.md) — no two boards match.
//  * These tiles carry their own HUE, so voxelMesh.js tints them WHITE.
//    Multiplying a red texture by the red palette hex ships near-black
//    planks (the tint trap, art/knowledge/craft/color.md).
//  * The red and blue barns weather DIFFERENTLY — see barnPaintSpec.js.
export function makeBarnPaintTexture(team) {
  const spec = BARN_PAINT[team];
  if (!spec) throw new Error(`makeBarnPaintTexture: unknown team "${team}"`);
  const c = makeCanvas(); const g = c.getContext('2d');
  const rng = seedRng(spec.seed);

  const paint = hexRgb(spec.paint);
  g.fillStyle = spec.paint;
  g.fillRect(0, 0, SIZE, SIZE);

  // Vertical boards, each faded by its own amount.
  const bw = SIZE / spec.boards;
  for (let b = 0; b < spec.boards; b++) {
    // Centred on 1.0: some boards bleached lighter, some weathered darker.
    // A one-sided `1 - rng()*spread` dragged the WHOLE wall below its
    // palette hue and the barn stopped reading as barn red.
    const v = 1 + (rng() - 0.5) * spec.boardValueSpread;
    g.fillStyle = `rgb(${clamp(paint.r * v)}, ${clamp(paint.g * v)}, ${clamp(paint.b * v)})`;
    g.fillRect(Math.round(b * bw), 0, Math.ceil(bw), SIZE);
    // Batten seam between boards: a dark line with a lit right edge, so the
    // seam reads as a raised strip rather than a scratch.
    const sx = Math.round(b * bw);
    g.fillStyle = 'rgba(28,26,23,0.38)';
    g.fillRect(sx, 0, 1, SIZE);
    g.fillStyle = 'rgba(246,241,230,0.16)';
    g.fillRect(sx + 1, 0, 1, SIZE);
  }

  // Grain: faint vertical streaks that wander a pixel or two.
  g.lineWidth = 1;
  for (let i = 0; i < spec.grainStreaks; i++) {
    const x = Math.floor(rng() * SIZE);
    g.strokeStyle = rng() > 0.5 ? 'rgba(28,26,23,0.22)' : 'rgba(246,241,230,0.13)';
    g.beginPath(); g.moveTo(x, 0);
    for (let y = 0; y < SIZE; y += 8) g.lineTo(x + Math.sin(y * 0.22 + i) * 1.4, y);
    g.stroke();
  }

  // Peels: paint gone, bare sun-bleached board underneath, with a darker
  // lip on the lower edge where the paint curled.
  const peelR = Math.sqrt((spec.peelCoverage * SIZE * SIZE) / (Math.PI * Math.max(1, spec.peels)));
  for (let i = 0; i < spec.peels; i++) {
    const px = rng() * SIZE, py = rng() * SIZE;
    const rx = peelR * (0.7 + rng() * 0.7), ry = peelR * (0.7 + rng() * 0.7);
    g.fillStyle = BARN_PALETTE.bareShadow;
    g.beginPath(); g.ellipse(px, py + 1, rx, ry, rng() * 0.6, 0, Math.PI * 2); g.fill();
    g.fillStyle = BARN_PALETTE.bareWood;
    g.beginPath(); g.ellipse(px, py, rx * 0.88, ry * 0.85, rng() * 0.6, 0, Math.PI * 2); g.fill();
  }

  // Damp/rot band along the bottom of the course.
  const damp = g.createLinearGradient(0, SIZE - spec.dampRows, 0, SIZE);
  damp.addColorStop(0, 'rgba(67,48,42,0)');
  damp.addColorStop(1, 'rgba(67,48,42,0.42)');
  g.fillStyle = damp;
  g.fillRect(0, SIZE - spec.dampRows, SIZE, spec.dampRows);

  // Frost crust along the top of the course + a few drips down the boards.
  const rime = g.createLinearGradient(0, 0, 0, spec.rimeRows);
  rime.addColorStop(0, 'rgba(219,234,246,0.62)');
  rime.addColorStop(1, 'rgba(219,234,246,0)');
  g.fillStyle = rime;
  g.fillRect(0, 0, SIZE, spec.rimeRows);
  const drips = Math.round(spec.rimeRows / 3);
  for (let i = 0; i < drips; i++) {
    const x = Math.floor(rng() * SIZE);
    const len = spec.rimeRows + Math.floor(rng() * spec.rimeRows * 2);
    g.fillStyle = 'rgba(219,234,246,0.30)';
    g.fillRect(x, 0, 1, len);
  }

  // Nail heads on the rails, one per board, top and bottom.
  g.fillStyle = BARN_PALETTE.nail;
  for (let b = 0; b < spec.boards; b++) {
    const x = Math.round((b + 0.5) * bw);
    g.fillRect(x, 3 + spec.rimeRows, 2, 2);
    g.fillRect(x, SIZE - 5 - Math.round(spec.dampRows / 3), 2, 2);
  }
  return toTexture(c);
}

// -- Barn name-plate: the painted "BARN" sign hung over each doorway -------
// Not tiled — one plank read head-on, so it clamps instead of repeating and
// keeps NearestFilter off (text needs the smooth filter to stay legible).
export function makeBarnSignTexture(accentHex) {
  const W = 256, H = 64;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const rng = seedRng(311);

  // Cream plank — never pure white (hand-drawn.md).
  g.fillStyle = '#e8dcc0';
  g.fillRect(0, 0, W, H);
  for (let i = 0; i < 22; i++) {                    // wood grain
    const y = Math.floor(rng() * H);
    g.strokeStyle = rng() > 0.55 ? 'rgba(120,92,56,0.22)' : 'rgba(255,250,235,0.35)';
    g.lineWidth = 1;
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= W; x += 8) g.lineTo(x, y + Math.sin(x * 0.05 + i) * 1.6);
    g.stroke();
  }
  // Team-colour end blocks, so a glance at the sign also reads the team.
  g.fillStyle = accentHex;
  g.fillRect(0, 0, 20, H);
  g.fillRect(W - 20, 0, 20, H);
  // Hand-wobbled dark border.
  g.strokeStyle = '#1c1a17';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(4, 5); g.lineTo(W - 5, 3.5); g.lineTo(W - 3.5, H - 4); g.lineTo(5, H - 3); g.closePath();
  g.stroke();

  // "BARN" — per-letter rotation wobble so it reads hand-painted.
  const word = 'BARN';
  g.font = 'bold 42px Georgia, "Times New Roman", serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const widths = [...word].map((ch) => g.measureText(ch).width + 6);
  const total = widths.reduce((a, b) => a + b, 0);
  let x = W / 2 - total / 2;
  for (let i = 0; i < word.length; i++) {
    const cx = x + widths[i] / 2;
    g.save();
    g.translate(cx, H / 2 + 2);
    g.rotate((rng() - 0.5) * 0.10);
    g.fillStyle = 'rgba(28,26,23,0.30)';          // painted-on shadow
    g.fillText(word[i], 1.5, 2);
    g.fillStyle = '#1c1a17';
    g.fillText(word[i], 0, 0);
    g.restore();
    x += widths[i];
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;   // no colorSpace override — every other texture here is untagged too

}

function rgba(hex, a) {
  const { r, g, b } = hexRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function clamp(v) { return Math.max(0, Math.min(255, v | 0)); }
