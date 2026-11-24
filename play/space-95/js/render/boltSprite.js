




import * as THREE from 'three';
import { v } from '../site/assetUrl.js';
import { spriteTint } from './unify.js';


const BOLT_DIR = null;
export const BOLT_POSES = ['idle', 'move', 'rise', 'fall', 'curious', 'worried'];

const BOLT_HEIGHT = 0.78;

const FILL = 0.92;





export function boltPose(m) {
  if (m.hurt || m.mood === 'worried') return 'worried';
  if (m.vy > 1.2) return 'rise';
  if (m.vy < -1.6) return 'fall';
  if (Math.abs(m.vx) > 0.6) return 'move';
  if (m.mood === 'curious') return 'curious';
  return 'idle';
}


export function boltFrames(sheet) {
  const byName = new Map(sheet.frames.map((f) => [f.name, f]));
  for (const p of BOLT_POSES) if (!byName.has(p)) throw new Error(`Bolt sheet has no ${p} pose`);
  return byName;
}





export function createBoltSprite(placeholder) {
  const api = { ready: false, update() {} };
  if (!BOLT_DIR) return api;
  fetch(v(`${BOLT_DIR}sheet.json`))
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`no Bolt sheet (${r.status})`))))
    .then((sheet) => {
      const frames = boltFrames(sheet);
      const [cw, ch] = sheet.cell;
      const tex = new THREE.TextureLoader().load(v(`${BOLT_DIR}sheet.png`), () => {
        for (const child of placeholder.group.children) if (child.userData.boltPart) child.visible = false;
        api.ready = true;
      });
      tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshBasicMaterial({ color: spriteTint(), map: tex, transparent: true, alphaTest: 0.05, depthWrite: false });
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      const cellH = BOLT_HEIGHT / FILL;
      quad.scale.set((cellH * cw) / ch, cellH, 1);
      quad.position.set(0, 0.05, 0.02); 
      quad.visible = false;
      placeholder.group.add(quad);
      let px = NaN;
      let py = NaN;
      let vx = 0;
      let vy = 0;
      api.update = (dt, x, y, mood, hurt = false) => {
        if (!api.ready) return;
        quad.visible = true;
        if (Number.isFinite(px) && dt > 0) {
          const k = Math.min(1, dt * 10); 
          vx += ((x - px) / dt - vx) * k;
          vy += ((y - py) / dt - vy) * k;
        }
        px = x;
        py = y;
        const f = frames.get(boltPose({ vx, vy, mood, hurt }));
        const img = tex.image;
        if (!f || !img?.width) return;
        tex.repeat.set(f.w / img.width, f.h / img.height);
        tex.offset.set(f.x / img.width, 1 - (f.y + f.h) / img.height);
      };
    })
    .catch(() => {}); 
  return api;
}
