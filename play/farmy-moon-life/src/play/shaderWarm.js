









































import * as THREE from 'three';
import { WARM_WAIT_MS, programSettled, waitForPrograms, within } from './warmWait.js';

const SHADOW_SIDE = { [THREE.FrontSide]: THREE.BackSide, [THREE.BackSide]: THREE.FrontSide, [THREE.DoubleSide]: THREE.DoubleSide };

export function createShaderWarm({ renderer, camera, scene, target = () => null }) {
  const stats = { runs: 0, ms: 0, programsAdded: 0, last: null, log: [] };
  
  
  let chain = Promise.resolve();
  let depthTarget = null;
  const plainDepth = new THREE.MeshDepthMaterial();
  const proxied = new Set();
  let proxyGeometry = null;

  function bound(into, fn) {
    const before = renderer.getRenderTarget();
    renderer.setRenderTarget(into);
    try { return fn(); } finally { renderer.setRenderTarget(before); }
  }

  
  
  function compileNow(root, into, alone, eye) {
    return bound(into, () => renderer.compileAsync(root, eye, alone || root === scene ? null : scene));
  }

  
  
  function shadowJobs(root, eye) {
    if (!renderer.shadowMap.enabled) return [];
    const reps = new Map();
    root.traverse((o) => {
      if (!o.castShadow || !(o.isMesh || o.isLine || o.isPoints) || !o.material) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
        if (!m) continue;
        const depth = o.customDepthMaterial || plainDepth;
        const side = m.shadowSide !== null && m.shadowSide !== undefined ? m.shadowSide : SHADOW_SIDE[m.side];
        const g = o.geometry || {};
        const key = [depth.uuid, side, m.alphaToCoverage ? 0.5 : m.alphaTest, m.map && m.alphaTest > 0 ? 1 : 0, m.alphaMap ? 1 : 0,
          m.displacementMap ? 1 : 0, o.isSkinnedMesh ? 1 : 0, o.isInstancedMesh ? 1 : 0, o.isBatchedMesh ? 1 : 0,
          Object.keys(g.morphAttributes || {}).join('+'), g.attributes && g.attributes.normal ? 1 : 0,
          g.attributes && g.attributes.color ? g.attributes.color.itemSize : 0, o.isLine ? 1 : 0, o.isPoints ? 1 : 0].join('|');
        if (!reps.has(key)) reps.set(key, { o, m, depth, side });
      }
    });
    depthTarget ||= new THREE.WebGLRenderTarget(1, 1);
    const jobs = [];
    const fog = scene.fog;
    for (const { o, m, depth, side } of reps.values()) {
      
      Object.assign(depth, {
        visible: m.visible, wireframe: m.wireframe, side, alphaMap: m.alphaMap,
        alphaTest: m.alphaToCoverage === true ? 0.5 : m.alphaTest, map: m.map,
        clipShadows: m.clipShadows, clippingPlanes: m.clippingPlanes, clipIntersection: m.clipIntersection,
        displacementMap: m.displacementMap, displacementScale: m.displacementScale, displacementBias: m.displacementBias,
      });
      const own = o.material;
      const kids = o.children;
      o.material = depth;
      o.children = [];   
      scene.fog = null;
      try {
        jobs.push(bound(depthTarget, () => renderer.compileAsync(o, eye, scene)));
      } finally {
        scene.fog = fog;
        o.material = own;
        o.children = kids;
      }
    }
    return jobs;
  }

  
  
  
  function warm(root, label, { into, alone = false, camera: eye = camera, shadows = !alone, setup = null } = {}) {
    const run = chain.then(async () => {
      const t0 = performance.now();
      const before = renderer.info.programs.length;
      const undo = setup ? setup() : null;
      const jobs = [];
      try {
        jobs.push(compileNow(root, into === undefined ? target() : into, alone, eye));
        if (shadows) jobs.push(...shadowJobs(root, eye));
      } finally {
        if (undo) undo();
      }
      
      
      
      const made = renderer.info.programs.slice(before);
      const added = made.length;
      
      
      
      
      
      
      
      
      
      
      
      
      const waited = await within(Promise.all([...jobs, waitForPrograms(made)]), WARM_WAIT_MS + 50, 'capped');
      if (waited === 'capped') stats.capped = (stats.capped || 0) + 1;
      
      
      
      
      
      
      let touchMax = 0;
      for (const p of made) {
        const u0 = performance.now();
        if (p.program === undefined || !programSettled(p)) continue; 
        try { p.getUniforms(); p.getAttributes(); } catch {  }
        touchMax = Math.max(touchMax, performance.now() - u0);
        await new Promise((r) => setTimeout(r, 0));
      }
      const ms = performance.now() - t0;
      const last = { label, ms: Math.round(ms), added, touchMax: Math.round(touchMax) };
      
      if (added && added <= 4) last.keys = made.map((p) => String(p.cacheKey));
      Object.assign(stats, { runs: stats.runs + 1, ms: stats.ms + ms, programsAdded: stats.programsAdded + added, last });
      stats.log.push(last);
      if (stats.log.length > 60) stats.log.shift();
      return { ms, programsAdded: added };
    });
    chain = run.catch(() => {});
    return run;
  }

  
  function warmMaterials(materials, label) {
    const fresh = materials.filter((m) => m && !proxied.has(m));
    if (!fresh.length) return Promise.resolve({ ms: 0, programsAdded: 0 });
    if (!proxyGeometry) {
      proxyGeometry = new THREE.BufferGeometry();
      proxyGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.01, 0, 0, 0, 0.01, 0], 3));
      proxyGeometry.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
      proxyGeometry.setAttribute('color', new THREE.Float32BufferAttribute([1, 1, 1, 1, 1, 1, 1, 1, 1], 3));
      proxyGeometry.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1], 2));
    }
    const group = new THREE.Group();
    for (const m of fresh) {
      proxied.add(m);
      const mesh = new THREE.Mesh(proxyGeometry, m);
      if (m.userData && m.userData.depthMaterial) mesh.customDepthMaterial = m.userData.depthMaterial;
      mesh.castShadow = true;
      group.add(mesh);
    }
    return warm(group, label);
  }

  return { warm, warmMaterials, stats };
}
