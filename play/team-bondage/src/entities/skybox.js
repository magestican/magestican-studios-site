// Spherical (equirectangular) skybox — the sky itself: gradient, horizon
// haze, and three parallax cloud banks wrapped around a huge inside-out
// sphere. All the numbers live in map/skyPaintSpec.js as pure data so the art
// rules are asserted by tests.
//
// The bull-vs-horse BRAWL used to be painted here too, at the top of this
// strip. It is now real geometry — see entities/skyBrawl.js and the note at
// the top of entities/skyBrawlSpec.js for why a painted fight could never
// read as a fight. What that removal takes with it:
//
//   * the 12 fps repaint. Repainting 4096x2048 and re-uploading it to the GPU
//     twelve times a second existed ONLY to animate the fighters; the clouds
//     drift on periods of 420-1900 s, so at 12 fps the near bank moved 0.8 px
//     per repaint and the far bank 0.16 px. Five is still smooth for weather
//     and is 40 % of the texture bandwidth.
//   * the "THE SKY BRAWL" banner, which was a caption explaining a picture.
//     There is no longer a picture to caption.
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
const ANIMATE_FPS = 5;    // clouds only now; see the header note on why 12 was the brawl's number, not the weather's.

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
export function paintSkyPanorama(canvas, t, sky = null) {
  paint(canvas, t, banks(), sky);
}

// `sky` is one of mapSpec.js's SKIES entries — its five-stop gradient and its
// cloud alpha. Passing nothing paints the farm sky, which is what every caller
// did before maps existed.
export function buildSkybox(sky = null) {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  paintSkyPanorama(canvas, 0, sky);
  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace ?? tex.colorSpace;

  // Re-blit the drifting cloud banks. Nothing else on this canvas moves.
  const start = performance.now();
  setInterval(() => {
    const t = (performance.now() - start) / 1000;
    paintSkyPanorama(canvas, t, sky);
    tex.needsUpdate = true;
  }, 1000 / ANIMATE_FPS);

  // The Blender-rendered PNG hot-swap was disabled 2026-08-20 — Bryan
  // said "the skybox still isn't fitting". The canvas-painted equirect
  // sky is the authoritative background: it's designed for the projection
  // and matches the game palette. Leaving RENDERED_PNG as a reference for a
  // future re-enable.
  void RENDERED_PNG;

  return tex;
}

function paint(canvas, t, banks, sky) {
  const g = canvas.getContext('2d');
  // Sky gradient down the equirectangular strip: top row is the zenith,
  // ~0.55 is the horizon haze, 0.75 is the colour the world's fog dissolves
  // into, and the bottom is behind the map.
  const stops = sky?.gradient ?? SKY_GRADIENT;
  const grad = g.createLinearGradient(0, 0, 0, H);
  for (const stop of stops) grad.addColorStop(stop.at, stop.hex);
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  scrollCloudBanks(g, t, banks, sky?.cloudAlpha ?? 1);
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
function scrollCloudBanks(g, t, banks, cloudAlpha = 1) {
  if (!banks) return;
  for (const { layer, strip } of banks) {
    const off = layerOffset(layer, t);
    // The map scales the whole weather deck. On the alpine sky you are LEVEL
    // with the cloud base, so there is much less of it above you; over the
    // polar floe the air is too cold and dry to hold much at all.
    g.globalAlpha = layer.alpha * cloudAlpha;
    g.drawImage(strip, off - W, 0);
    g.drawImage(strip, off, 0);
    g.globalAlpha = 1;
  }
}
