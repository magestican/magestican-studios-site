



import * as THREE from 'three';
import { createAnimator, wantedState } from '../anim/animState.js';
import { v } from '../site/assetUrl.js';
import { currentVariant, loadJoSheet } from './joSheets.js';

const GRAPH = 'assets/anim/jo/jo.graph.json';


let markLoaded = () => {};

export const joSpriteLoaded = new Promise((r) => {
  markLoaded = r;
});


function textures(s, done) {
  const loader = new THREE.TextureLoader();
  let left = s.sheet.atlases.length;
  const settle = () => {
    if (--left <= 0) done();
  };
  if (!left) done();
  return s.sheet.atlases.map(( name) => {
    const t = loader.load(v(s.dir + name), settle, undefined, settle);
    t.colorSpace = THREE.SRGBColorSpace;
    t.magFilter = THREE.LinearFilter;
    return t;
  });
}





export function createJoSprite(parent) {
  const api = { ready: false, update() {} };
  
  const looks = new Map();
  
  const want = (variant) => {
    if (looks.has(variant)) return;
    looks.set(variant,  (null)); 
    loadJoSheet(variant)
      .then((s) => looks.set(variant, { sheet: s.sheet, tex: textures(s, () => {}) }))
      .catch(() => looks.delete(variant));
  };
  const first = currentVariant();
  Promise.all([loadJoSheet(first), fetch(v(GRAPH)).then((r) => r.json())])
    .then(([s, graph]) => {
      looks.set(first, { sheet: s.sheet, tex: textures(s, markLoaded) });
      
      const clips = {};
      for (const [name, c] of Object.entries(s.sheet.clips)) {
        clips[name] = {
          fps: c.fps,
          loop: c.loop,
          frame_times: c.frames.map(( f) => f.time),
          events: c.frames.flatMap(( f) => (f.events ?? []).map((type) => ({ type, frame: f.frame }))),
        };
      }
      const anim = createAnimator(graph, clips, 'idle');
      const mat = new THREE.MeshBasicMaterial({ map: looks.get(first)?.tex[0], transparent: true, alphaTest: 0.05, depthWrite: false });
      const quad = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      quad.position.z = 0.05;
      parent.add(quad);
      for (const child of parent.children) if (child.userData.placeholder) child.visible = false;
      let shown = looks.get(first);
      api.ready = true;
      api.update = (dt, p, events, extra) => {
        anim.update(dt, extra.punt ? 'punted' : wantedState(p, events));
        const variant = currentVariant();
        want(variant);
        
        shown = looks.get(variant) ?? shown;
        if (!shown) return;
        const { sheet } = shown;
        const { clip, frame } = anim.frame();
        const f = sheet.clips[clip]?.frames[frame];
        if (!f) return;
        const tex = shown.tex[f.atlas];
        if (mat.map !== tex) {
          mat.map = tex;
          mat.needsUpdate = true;
        }
        const img = tex.image;
        if (img?.width) {
          tex.repeat.set(f.w / img.width, f.h / img.height);
          tex.offset.set(f.x / img.width, 1 - (f.y + f.h) / img.height);
        }
        
        const pxu = sheet.px_per_u;
        const [px, py] = sheet.pivot;
        quad.scale.set(f.w / pxu, f.h / pxu, 1);
        quad.position.x = (f.ox + f.w / 2 - px) / pxu;
        quad.position.y = (py - f.oy - f.h / 2) / pxu;
      };
    })
    .catch(() => markLoaded()); 
  return api;
}
