







import * as THREE from 'three';
import { createCozyLight, cozify, applyLook } from './cozyStage.js';
import { createPixelPass } from './pixelPass.js';
import { ISO_DIR, EYE_DIST } from './isoView.js';

const R = Math.SQRT1_2;

export function createStage(canvas, { viewHeight = 15, shadows = true, hours = 10.5, pixelHeight = 480 } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
  const light = createCozyLight(scene, renderer, { hours, shadows });
  scene.background = light.horizon();
  const pixel = createPixelPass(renderer, { height: pixelHeight });

  const target = new THREE.Vector3();
  const st = {
    THREE, renderer, scene, camera, light, pixel, target, viewHeight, w: 1, h: 1,
    sun: light.day.key, hemi: light.day.hemi,
    resize() {
      st.w = window.innerWidth; st.h = window.innerHeight;
      renderer.setSize(st.w, st.h, false);
      pixel.resize(st.w, st.h);
      const a = st.w / st.h, vh = st.viewHeight;
      camera.left = -vh * a / 2; camera.right = vh * a / 2; camera.top = vh / 2; camera.bottom = -vh / 2;
      camera.updateProjectionMatrix();
    },
    setPixelHeight(h) { pixel.setHeight(h, st.w, st.h); },
    
    setViewHeight(vh) {
      st.viewHeight = vh;
      const a = st.w / st.h;
      camera.left = -vh * a / 2; camera.right = vh * a / 2; camera.top = vh / 2; camera.bottom = -vh / 2;
      camera.updateProjectionMatrix();
    },
    setHours(h) { light.setHours(h); scene.background = light.horizon(); },
    lookAt(x, y, h) {
      target.set(x, h, y);
      camera.position.copy(target).addScaledVector(ISO_DIR, EYE_DIST);
      camera.lookAt(target);
    },
    
    
    look: null,
    setLook(look) {
      st.look = look || null;
      const p = (look && look.post) || {};
      renderer.toneMapping = p.toneMapping ?? THREE.NeutralToneMapping;
      pixel.setDither(p.dither ?? 0.9);
      pixel.setHeight(p.pixelHeight ?? pixelHeight, st.w, st.h);
    },
    
    
    
    prepare(root) { if (st.look) applyLook(root, st.look); else cozify(root); return root; },
    render() {
      
      
      if (st.look) { applyLook(scene, st.look); if (st.look.beforeRender) st.look.beforeRender(st); } else cozify(scene);
      light.apply(target.x, target.y, target.z);
      pixel.render(scene, camera);
    },
    
    toScreen(x, y, h = 0) {
      const v = new THREE.Vector3(x, h, y).project(camera);
      return [(v.x + 1) / 2 * st.w, (1 - v.y) / 2 * st.h];
    },
    pxPerUnit() { return st.h / st.viewHeight; },
    
    screenDirToWorld(sx, sy) {
      const x = sx * R + sy * R, y = -sx * R + sy * R, l = Math.hypot(x, y) || 1;
      return [x / l, y / l];
    },
    
    screenToGround(px, py, h = 0) {
      const ndc = new THREE.Vector3(px / st.w * 2 - 1, 1 - py / st.h * 2, -1).unproject(camera);
      const dir = new THREE.Vector3(); camera.getWorldDirection(dir);
      const t = (h - ndc.y) / dir.y;
      return [ndc.x + dir.x * t, ndc.z + dir.z * t];
    },
  };
  window.addEventListener('resize', () => st.resize());
  st.resize();
  return st;
}
