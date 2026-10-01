



















import * as THREE from 'three';
import { itemClockSeconds, ITEM_SOON_MS, padScaleFor, PAD_BASE_W, PAD_ASPECT }
  from '../../../../web-engine/ui/itemClock.js';

const CANVAS_W = 128;
const CANVAS_H = 64;





const SPRITE_Y = 1.35;   

function hexCss(tint) {
  return `#${(tint >>> 0 & 0xffffff).toString(16).padStart(6, '0')}`;
}







function padRing(tint) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.85, 1.15, 24),
    new THREE.MeshBasicMaterial({
      color: tint, transparent: true, opacity: 0.22,
      side: THREE.DoubleSide, depthWrite: false,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  return ring;
}

export function createPickupPad(tint) {
  const group = new THREE.Group();
  const ring = padRing(tint);
  group.add(ring);

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W; canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');
  const tex = new THREE.CanvasTexture(canvas);
  
  
  
  
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: tex, transparent: true, depthWrite: false,
  }));
  sprite.scale.set(PAD_BASE_W, PAD_BASE_W * PAD_ASPECT, 1);
  sprite.position.y = SPRITE_Y;
  group.add(sprite);

  group.visible = false;
  let lastText = null;

  
  
  
  
  function paint(text, urgent) {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    
    
    ctx.fillStyle = 'rgba(6,10,16,0.66)';
    roundRect(ctx, 6, 8, CANVAS_W - 12, CANVAS_H - 16, 10);
    ctx.fill();
    ctx.strokeStyle = urgent ? '#ffd76a' : hexCss(tint);
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = urgent ? '#ffd76a' : '#e8edf5';
    ctx.font = 'bold 34px -apple-system, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, CANVAS_W / 2, CANVAS_H / 2);
    tex.needsUpdate = true;
  }

  return {
    group,
    
    
    
    
    
    
    faceCamera(cameraPos) {
      if (!cameraPos || !group.visible) return;
      const k = padScaleFor(group.position.distanceTo(cameraPos));
      sprite.scale.set(PAD_BASE_W * k, PAD_BASE_W * PAD_ASPECT * k, 1);
    },
    
    
    
    setRemaining(remainingMs) {
      if (remainingMs == null || remainingMs <= 0) {
        group.visible = false;
        lastText = null;
        return;
      }
      group.visible = true;
      const urgent = remainingMs <= ITEM_SOON_MS;
      const text = `${itemClockSeconds(remainingMs)}`;
      
      
      
      ring.material.opacity = urgent ? 0.55 : 0.22;
      if (text !== lastText) { lastText = text; paint(text, urgent); }
    },
    dispose() {
      tex.dispose();
      sprite.material.dispose();
      ring.geometry.dispose();
      ring.material.dispose();
    },
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
