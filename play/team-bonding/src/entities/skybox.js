



















import * as THREE from 'three';
import {
  STRIP, HORIZON, SKY_GRADIENT, CLOUD_LAYERS, CLOUD_FORM,
  cloudField, layerOffset,
} from '../map/skyPaintSpec.js';

const W = STRIP.W;   
const H = STRIP.H;


const LAYER_H = Math.ceil(HORIZON * H) + 4;
const ANIMATE_FPS = 5;    




const RENDERED_PNG = '/play/team-bonding/assets/hand-drawn/sky/panorama.png';




let BANKS = null;
const banks = () => (BANKS ??= CLOUD_LAYERS.map((layer) => ({ layer, strip: bakeCloudBank(layer) })));




export function paintSkyPanorama(canvas, t, sky = null) {
  paint(canvas, t, banks(), sky);
}




export function buildSkybox(sky = null) {
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  paintSkyPanorama(canvas, 0, sky);
  const tex = new THREE.CanvasTexture(canvas);
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace ?? tex.colorSpace;

  
  const start = performance.now();
  setInterval(() => {
    const t = (performance.now() - start) / 1000;
    paintSkyPanorama(canvas, t, sky);
    tex.needsUpdate = true;
  }, 1000 / ANIMATE_FPS);

  
  
  
  
  
  void RENDERED_PNG;

  return tex;
}

function paint(canvas, t, banks, sky) {
  const g = canvas.getContext('2d');
  
  
  
  const stops = sky?.gradient ?? SKY_GRADIENT;
  const grad = g.createLinearGradient(0, 0, 0, H);
  for (const stop of stops) grad.addColorStop(stop.at, stop.hex);
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  scrollCloudBanks(g, t, banks, sky?.cloudAlpha ?? 1);
}






function bakeCloudBank(layer) {
  const c = document.createElement('canvas');
  c.width = W; c.height = LAYER_H;
  const g = c.getContext('2d');
  for (const cloud of cloudField(layer)) {
    
    
    for (const wrap of [-W, 0, W]) {
      const x = cloud.x + wrap;
      if (x < -cloud.w * 1.5 || x > W + cloud.w * 1.5) continue;
      drawCloud(g, cloud, layer, x);
    }
  }
  if (layer.hazeFade) {
    
    
    
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





function drawCloud(g, cloud, layer, x) {
  const { baseY, w, h, lit, puffs } = cloud;
  g.save();
  g.translate(x, baseY);
  
  
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
  
  pass(-lit * h * CLOUD_FORM.shadeOffset, h * CLOUD_FORM.shadeDrop, 1.0, layer.tone.shade);
  pass(0, 0, 1.0, layer.tone.body);
  
  
  pass(lit * h * CLOUD_FORM.crownOffset, -h * 0.12, CLOUD_FORM.crownShrink, layer.tone.crown);
  g.restore();
}



function scrollCloudBanks(g, t, banks, cloudAlpha = 1) {
  if (!banks) return;
  for (const { layer, strip } of banks) {
    const off = layerOffset(layer, t);
    
    
    
    g.globalAlpha = layer.alpha * cloudAlpha;
    g.drawImage(strip, off - W, 0);
    g.drawImage(strip, off, 0);
    g.globalAlpha = 1;
  }
}
