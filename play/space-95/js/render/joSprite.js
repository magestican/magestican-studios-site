


import * as THREE from 'three';
import { createAnimator, wantedState } from '../anim/animState.js';
import { v } from '../site/assetUrl.js';

const ART = 'assets/art/jo/';
const GRAPH = 'assets/anim/jo/jo.graph.json';


let markLoaded = () => {};

export const joSpriteLoaded = new Promise((r) => {
  markLoaded = r;
});





export function createJoSprite(parent) {
  const api = { ready: false, update() {} };
  Promise.all([fetch(v(`${ART}jo.sprites.json`)).then((r) => r.json()), fetch(v(GRAPH)).then((r) => r.json())])
    .then(([sheet, graph]) => {
      const loader = new THREE.TextureLoader();
      let left = sheet.atlases.length;
      const settle = () => {
        if (--left <= 0) markLoaded();
      };
      if (!left) markLoaded();
      const textures = sheet.atlases.map((name) => {
        const t = loader.load(ART + name, settle, undefined, settle);
        t.colorSpace = THREE.SRGBColorSpace;
        t.magFilter = THREE.LinearFilter;
        return t;
      });
      
      const clips = {};
      for (const [name, c] of Object.entries(sheet.clips)) {
        clips[name] = {
          fps: c.fps,
          loop: c.loop,
          frame_times: c.frames.map((f) => f.time),
          events: c.frames.flatMap((f) => (f.events ?? []).map((type) => ({ type, frame: f.frame }))),
        };
      }
      const anim = createAnimator(graph, clips, 'idle');
      const mat = new THREE.MeshBasicMaterial({ map: textures[0], transparent: true, alphaTest: 0.05, depthWrite: false });
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      quad.position.z = 0.05;
      parent.add(quad);
      const pxu = sheet.px_per_u;
      const [px, py] = sheet.pivot;
      for (const child of parent.children) if (child.userData.placeholder) child.visible = false;
      api.ready = true;
      api.update = (dt, p, events, extra) => {
        anim.update(dt, extra.punt ? 'punted' : wantedState(p, events));
        const { clip, frame } = anim.frame();
        const c = sheet.clips[clip];
        const f = c?.frames[frame];
        if (!f) return;
        const tex = textures[f.atlas];
        if (mat.map !== tex) {
          mat.map = tex;
          mat.needsUpdate = true;
        }
        const img = tex.image;
        if (img?.width) {
          tex.repeat.set(f.w / img.width, f.h / img.height);
          tex.offset.set(f.x / img.width, 1 - (f.y + f.h) / img.height);
        }
        
        quad.scale.set(f.w / pxu, f.h / pxu, 1);
        quad.position.x = (f.ox + f.w / 2 - px) / pxu;
        quad.position.y = (py - f.oy - f.h / 2) / pxu;
      };
    })
    .catch(() => markLoaded()); 
  return api;
}
