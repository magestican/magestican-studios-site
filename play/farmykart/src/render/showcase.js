



















import * as THREE from 'three';

import {
  createShowcase, nudge, selectId, selectedId, stepShowcase, slotsOf, dragToNudge,
} from 'arbelo/characterShowcase';
import { poseAt, EMOTE_TIME } from 'arbelo/emotes';
import { CHARACTERS, characterById } from 'arbelo/kartTuning';
import { loadDriver } from './kartMesh.js';
import { configureRenderer, surface, paintedSurface } from './materials.js';


import { pageContexts } from '../../../../web-engine/render/contextBudget.js';




import {
  createContextState, contextLost, contextRestored, shouldDraw,
} from '../../../../web-engine/render/contextRecovery.js';
import { PALETTE } from '../palette.js';
import { buildMenuScene } from './menuScene.js';
import {
  STAGE, stageCamera, subjectShiftMetres,
} from '../../../../web-engine/kart/menuStage.js';


const SPACING = 1.65;











function studioLights() {
  const g = new THREE.Group();
  const key = new THREE.DirectionalLight(0xfff2dd, 2.5);
  key.position.set(-3.2, 4.4, 5.0);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  const c = key.shadow.camera;
  c.left = -4; c.right = 4; c.top = 4; c.bottom = -3; c.near = 0.5; c.far = 20;
  key.shadow.bias = -0.0012;
  g.add(key);

  const fill = new THREE.DirectionalLight(0xcfe2ff, 0.85);
  fill.position.set(4.5, 1.6, 2.5);
  g.add(fill);

  
  
  
  const rim = new THREE.DirectionalLight(0xffd9a0, 1.5);
  rim.position.set(0.6, 2.2, -5.0);
  g.add(rim);

  g.add(new THREE.HemisphereLight(0xd8e8ff, 0x6b6357, 1.1));
  return g;
}









function buildStep(place) {
  const height = place === 1 ? 0.62 : place === 2 ? 0.42 : 0.28;
  const g = new THREE.Group();
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(1.25, height, 1.25),
    paintedSurface({ color: place === 1 ? PALETTE.gold : PALETTE.line, flatShading: true }),
  );
  block.position.y = height / 2;
  block.castShadow = true;
  block.receiveShadow = true;
  g.add(block);

  const trim = new THREE.Mesh(
    new THREE.BoxGeometry(1.34, 0.07, 1.34),
    surface({ color: PALETTE.night, flatShading: true }),
  );
  trim.position.y = height;
  g.add(trim);

  g.userData.height = height;
  return g;
}










function buildFigure(character) {
  const root = new THREE.Group();
  const pivot = new THREE.Group();
  root.add(pivot);

  const placeholder = new THREE.Mesh(
    new THREE.BoxGeometry(0.6, 0.8, 0.55),
    paintedSurface({ color: character.tint, flatShading: true }),
  );
  placeholder.position.y = 0.4;
  placeholder.castShadow = true;
  
  
  
  
  
  placeholder.userData.baseScale = 1;
  pivot.add(placeholder);

  loadDriver(character.species).then((scene) => {
    if (!scene) return;                       
    
    
    
    const body = scene.clone(true);
    const bbox = new THREE.Box3().setFromObject(body);
    const height = bbox.max.y - bbox.min.y || 1;
    const fit = 1.15 / height;
    body.userData.baseScale = fit;
    body.scale.setScalar(fit);
    body.position.y = -bbox.min.y * fit;
    
    
    
    body.rotation.y = Math.PI;
    body.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    
    
    
    body.userData.sharedDriver = true;
    pivot.remove(placeholder);
    pivot.add(body);
    root.userData.body = body;
  });

  root.userData.pivot = pivot;
  root.userData.body = placeholder;
  return root;
}












export function createShowcaseView({
  canvas, ids, selected = null, podium = false, places = null, onSelect = null,
  onContext = null, backdrop = false,
}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  
  
  
  
  
  
  
  
  
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  configureRenderer(renderer);
  
  renderer.setClearAlpha(0);

  let disposed = false;
  const scene = new THREE.Scene();

  
  
  
  
  
  
  
  
  
  
  
  const stage = backdrop ? buildMenuScene() : null;
  if (stage) {
    scene.add(stage.group);
    scene.add(stage.lights);
    
    
    
    
    
    scene.add(stage.sky);
    scene.fog = stage.fog;
  } else {
    scene.add(studioLights());
  }

  
  
  
  
  
  
  
  const camera = backdrop
    ? new THREE.PerspectiveCamera(STAGE.fovDeg, 1, 0.1, 1200)
    : new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  if (backdrop) {
    const c = stageCamera(0);
    camera.position.set(c.position.x, c.position.y, c.position.z);
    camera.lookAt(c.target.x, c.target.y, c.target.z);
  } else {
    camera.position.set(0, podium ? 1.15 : 0.86, podium ? 4.3 : 3.5);
    camera.lookAt(0, podium ? 0.86 : 0.58, 0);
  }

  
  
  
  
  
  
  if (!stage) {
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 24),
      new THREE.ShadowMaterial({ opacity: 0.28 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
  }

  const state = createShowcase(ids, selected);
  
  
  const figures = [];
  const steps = [];
  
  
  
  
  
  
  const subjects = new THREE.Group();
  if (stage) subjects.position.y = STAGE.plinthY;
  scene.add(subjects);

  ids.forEach((id, i) => {
    const character = characterById(id) ?? CHARACTERS[0];
    const fig = buildFigure(character);
    figures[i] = fig;
    subjects.add(fig);
    if (podium) {
      const step = buildStep(places ? places[i] : i + 1);
      steps[i] = step;
      subjects.add(step);
    }
  });

  const emotes = new Map();     
  let last = selectedId(state);
  let time = 0;

  function layout() {
    for (const s of slotsOf(state)) {
      const fig = figures[s.at];
      if (!fig) continue;
      const step = steps[s.at];
      
      
      
      
      
      const stepH = step ? step.userData.height * s.scale : 0;

      const em = emotes.get(s.at);
      const pose = poseAt({
        emote: em?.emote ?? null,
        emoteStart: em?.start ?? 0,
        time,
        
        
        
        
        seed: s.at,
      });

      fig.visible = true;
      fig.position.set(
        s.slot * SPACING + pose.sway,
        stepH + pose.bob,
        s.depth,
      );
      fig.scale.setScalar(s.scale);
      
      fig.userData.pivot.rotation.set(pose.tilt, s.spin + pose.turn, pose.roll);
      
      const body = fig.userData.body;
      if (body) {
        const base = body.userData.baseScale ?? 1;
        body.scale.set(pose.stretch * base, pose.squash * base, pose.stretch * base);
      }

      if (step) {
        step.visible = true;
        step.position.set(s.slot * SPACING, 0, s.depth);
        step.scale.setScalar(s.scale);
      }
    }
    
    const shown = new Set(slotsOf(state).map((s) => s.at));
    figures.forEach((fig, i) => { if (!shown.has(i)) fig.visible = false; });
    steps.forEach((step, i) => { if (step && !shown.has(i)) step.visible = false; });
  }

  function resize() {
    const w = canvas.clientWidth || 640;
    const h = canvas.clientHeight || 320;
    if (canvas.width === w && canvas.height === h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    
    
    
    
    
    
    if (stage) {
      stage.layout(w, h);
      subjects.position.x = subjectShiftMetres(w, h);
    }
  }

  














  let visible = true;
  let raf = 0;
  let prev = 0;

  const observer = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver((entries) => {
      const on = entries.some((e) => e.isIntersecting);
      if (on === visible) return;
      visible = on;
      if (visible) { prev = 0; raf = requestAnimationFrame(frame); }
      else cancelAnimationFrame(raf);
    }, { threshold: 0.01 })
    : null;
  observer?.observe(canvas);

  const onVisibility = () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else if (visible && !ctx.lost) { prev = 0; raf = requestAnimationFrame(frame); }
  };
  document.addEventListener('visibilitychange', onVisibility);

  




































  
  
  
  
  
  const clockNow = () => (typeof performance === 'object' && performance.now
    ? performance.now() : Date.now());
  const ctx = createContextState();
  const onContextLost = (e) => {
    
    
    
    
    
    e.preventDefault();
    const d = contextLost(ctx, clockNow());
    cancelAnimationFrame(raf);
    raf = 0;
    if (onContext) onContext({ ...d, state: ctx });
  };
  const onContextRestored = () => {
    const d = contextRestored(ctx, clockNow());
    
    
    
    prev = 0;
    if (visible && !document.hidden && !disposed) raf = requestAnimationFrame(frame);
    if (onContext) onContext({ ...d, state: ctx });
  };
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  function frame(now) {
    if (!visible || document.hidden || !shouldDraw(ctx)) { raf = 0; return; }
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, prev ? (now - prev) / 1000 : 0.016);
    prev = now;
    time += dt;
    stepShowcase(state, dt);
    resize();
    layout();
    if (stage) {
      
      
      
      const c = stageCamera(time);
      camera.position.set(c.position.x, c.position.y, c.position.z);
      camera.lookAt(c.target.x, c.target.y, c.target.z);
    }
    renderer.render(scene, camera);

    const nowSelected = selectedId(state);
    if (nowSelected !== last) {
      last = nowSelected;
      if (onSelect) onSelect(nowSelected);
    }
  }
  raf = requestAnimationFrame(frame);

  
  
  
  
  
  let dragFrom = null;
  const onDown = (e) => { dragFrom = e.clientX; canvas.setPointerCapture?.(e.pointerId); };
  const onUp = (e) => {
    if (dragFrom == null) return;
    const dir = dragToNudge(e.clientX - dragFrom);
    dragFrom = null;
    if (dir) nudge(state, dir);
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', () => { dragFrom = null; });

  const view = {
    
    nudge: (dir) => nudge(state, dir),
    select: (id) => selectId(state, id),
    selected: () => selectedId(state),
    






    emote(index, emoteId) {
      emotes.set(index, { emote: emoteId, start: time });
    },
    emoteSelected(emoteId) {
      const mid = slotsOf(state).find((s) => s.selected);
      if (mid) emotes.set(mid.at, { emote: emoteId, start: time });
    },
    
    emoteCooldown(index) {
      const em = emotes.get(index);
      if (!em) return 0;
      return Math.max(0, EMOTE_TIME - (time - em.start));
    },
    state,
    dispose() {
      
      
      
      
      
      if (disposed) return;
      disposed = true;
      cancelAnimationFrame(raf);
      observer?.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      
      
      
      
      
      
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      
      
      pageContexts.release(canvas.id || canvas);
      
      
      
      
      
      renderer.dispose();
      renderer.forceContextLoss();
      
      
      
      
      
      
      
      scene.traverse((o) => {
        if (!o.isMesh || sharesTheDriverCache(o)) return;
        o.geometry?.dispose();
        for (const m of (Array.isArray(o.material) ? o.material : [o.material])) m?.dispose();
      });
    },
  };
  
  
  pageContexts.acquire(canvas.id || canvas, view.dispose);
  return view;
}












function sharesTheDriverCache(mesh) {
  for (let o = mesh; o; o = o.parent) if (o.userData?.sharedDriver) return true;
  return false;
}
