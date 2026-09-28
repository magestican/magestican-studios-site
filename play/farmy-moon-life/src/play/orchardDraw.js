














import * as THREE from 'three';
import { MeshData, compose, translate, rotateY } from 'moon/mesh/meshData.mjs';
import { generate as generateTree } from 'moon/art/tree.mjs';



import { generate as generatePine } from 'moon/art/pine.mjs';
import { artStageOfPine } from 'moon/world/wild.mjs';
import { heightAt as homeHeightAt } from 'moon/world/moonLayout.mjs';
import { toppleAt } from 'moon/play/orchard.mjs';
import { sheds, leafColours } from 'moon/play/leaves.mjs';
import { appendTree, captureRest, setFruit } from 'moon/play/orchardRanges.mjs';
import { toObject3D } from '../render/toMesh.js';








const bearing = (v) => (v.fruit ? v : { ...v, fruit: true });

const shapeKey = (v) => `${v.id}:${v.kind}|${v.seed}|${v.stage}|${v.lod}@${v.x},${v.z},${v.rotY}`;


const SLICE_MS = 6;
const yieldFrame = () => new Promise((r) => setTimeout(r, 0));



function arraysOf(obj) {
  const arrays = {};
  obj.traverse((o) => {
    if (!o.isMesh || o.isShadowCaster) return;
    const mat = o.name.slice(o.name.indexOf('/') + 1);
    const pos = o.geometry.attributes.position;
    const sway = o.geometry.attributes.fmlSway || null;
    arrays[mat] = { position: pos.array, sway: sway ? sway.array : null, attrs: { position: pos, sway } };
  });
  return arrays;
}

function upload(arrays, written) {
  for (const w of written) {
    const { position, sway } = arrays[w.material].attrs;
    position.addUpdateRange(w.start * 3, w.count * 3);
    position.needsUpdate = true;
    if (sway) {
      sway.addUpdateRange(w.start, w.count);
      sway.needsUpdate = true;
    }
  }
}

const disposeTree = (obj) => obj.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });











export function createOrchardDraw({
  scene, season, heightAt = homeHeightAt, seasonNow = null, onProblems = () => {},
}) {
  const groundAt = (x, z) => (typeof heightAt === 'function' ? heightAt(x, z) : homeHeightAt(x, z));
  const seasonAt = () => (seasonNow ? seasonNow() : season);
  const root = new THREE.Group();
  root.name = 'orchard';
  scene.add(root);
  const cache = new Map();
  const crowns = new Map();   
  const falling = [];
  let shed = [];              
  let merged = null, triangles = 0, rebuilds = 0, wanted = '', drawn = '', queued = null, running = null;

  function dataFor(v) {
    const s = seasonAt();
    const key = `${v.kind}|${v.seed}|${v.stage}|${v.fruit ? 1 : 0}|${v.lod}|${s}`;
    let data = cache.get(key);
    if (!data) {
      
      
      
      
      
      
      
      
      if (v.kind === 'pine' && v.stage !== 'stump') {
        data = generatePine({ seed: v.seed, season: s, stage: artStageOfPine(v.stage), lod: v.lod });
      } else {
        const kind = v.kind === 'pine' ? 'apple' : v.kind;
        data = generateTree({ seed: v.seed, season: s, stage: v.stage, lod: v.lod, kind, fruit: v.fruit });
      }
      onProblems(data.validate());
      cache.set(key, data);
      
      
      const b = data.bounds();
      crowns.set(key, { height: b.max[1] - b.min[1], radius: Math.max(b.max[0] - b.min[0], b.max[2] - b.min[2]) / 2 });
    }
    return data;
  }

  let cost = { append: 0, upload: 0, trees: 0 };
  let warmed = 0;
  const signature = (view) => view.map((v) => `${v.id}:${v.key}@${v.x},${v.z}`).join(';');

  
  let layout = null;
  let patches = 0, lastPatchMs = 0;

  async function build(view) {
    const data = new MeshData('orchard');
    const t0 = performance.now();
    
    
    
    const sliced = Boolean(layout) && view.some((v) => layout.ids.has(v.id));
    const season = seasonAt();
    const trees = [];
    let since = performance.now(), yielded = 0;
    for (const v of view) {
      const range = appendTree(data, dataFor(bearing(v)), compose(translate(v.x, groundAt(v.x, v.z), v.z), rotateY(v.rotY)));
      trees.push({ shape: shapeKey(v), fruit: Boolean(v.fruit), range });
      if (sliced && performance.now() - since >= SLICE_MS) {
        yielded += performance.now() - since;
        await yieldFrame();
        since = performance.now();
      }
    }
    const t1 = performance.now();
    const obj = data.triangleCount ? await toObject3D(data) : new THREE.Group();
    const arrays = arraysOf(obj);
    for (const t of trees) {
      captureRest(arrays, t.range);
      if (!t.fruit) setFruit(arrays, t.range, false);
    }
    cost = { append: Math.round(sliced ? yielded + (t1 - since) : t1 - t0), upload: Math.round(performance.now() - t1), trees: view.length, sliced };
    obj.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
    if (merged) {
      root.remove(merged);
      disposeTree(merged);
    }
    merged = obj;
    root.add(obj);
    layout = { trees, season, arrays, ids: new Set(view.map((v) => v.id)) };
    triangles = data.triangleCount;
    rebuilds += 1;
    shed = sourcesOf(view);
  }

  





  function patch(view) {
    if (!layout || running || !merged || layout.season !== seasonAt() || view.length !== layout.trees.length) return false;
    const flips = [];
    for (let k = 0; k < view.length; k++) {
      const v = view[k], t = layout.trees[k];
      if (shapeKey(v) !== t.shape) return false;
      if (Boolean(v.fruit) !== t.fruit) flips.push([t, Boolean(v.fruit)]);
    }
    const t0 = performance.now();
    for (const [t, fruit] of flips) {
      upload(layout.arrays, setFruit(layout.arrays, t.range, fruit));
      t.fruit = fruit;
    }
    shed = sourcesOf(view);
    patches += 1;
    lastPatchMs = Math.round((performance.now() - t0) * 100) / 100;
    return true;
  }

  
  
  
  
  
  function sourcesOf(view) {
    const s = seasonAt();
    const colours = leafColours(s);
    const out = [];
    for (const v of view) {
      if (!sheds(v.kind, v.stage)) continue;
      
      
      const c = crowns.get(`${v.kind}|${v.seed}|${v.stage}|1|${v.lod}|${s}`) || crowns.get(`${v.kind}|${v.seed}|${v.stage}|0|${v.lod}|${s}`);
      if (!c) continue;
      const floor = groundAt(v.x, v.z);
      out.push({ x: v.x, y: floor + c.height * 0.72, z: v.z, r: c.radius * 0.8, h: c.height * 0.2, kind: v.kind, stage: v.stage, season: s, floor, colours });
    }
    return out;
  }

  




















  async function warm(view, budgetMs = 6) {
    let made = 0;
    let since = performance.now();
    for (const v of view) {
      dataFor(bearing(v));
      made += 1;
      if (performance.now() - since >= budgetMs) {
        await new Promise((r) => setTimeout(r, 0));
        since = performance.now();
      }
    }
    warmed += made;
    return made;
  }

  



  function show(view) {
    wanted = signature(view);
    if (patch(view)) {
      drawn = wanted;
      return Promise.resolve();
    }
    queued = view;
    if (!running) {
      running = (async () => {
        while (queued) {
          const next = queued;
          queued = null;
          await build(next);
          drawn = signature(next);
        }
      })().finally(() => { running = null; });
    }
    return running;
  }

  
  async function topple(v, yaw) {
    const entry = { startS: null, outer: new THREE.Group(), inner: new THREE.Group(), obj: null };
    falling.push(entry);
    
    
    
    const data = dataFor(bearing(v));
    const obj = await toObject3D(data);
    if (!v.fruit && data.fruitSpans) setFruit(arraysOf(obj), { fruit: data.fruitSpans }, false);
    obj.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
    obj.rotation.y = v.rotY - yaw;
    entry.inner.add(obj);
    entry.outer.add(entry.inner);
    entry.outer.position.set(v.x, groundAt(v.x, v.z), v.z);
    entry.outer.rotation.y = yaw;
    root.add(entry.outer);
    entry.obj = obj;
  }

  function update(nowS) {
    for (let i = falling.length - 1; i >= 0; i--) {
      const f = falling[i];
      if (!f.obj) continue;
      if (f.startS === null) f.startS = nowS;
      const p = toppleAt(nowS - f.startS);
      f.inner.rotation.x = p.angleRad;
      f.inner.scale.setScalar(Math.max(0.001, p.scale));
      if (p.done) {
        root.remove(f.outer);
        disposeTree(f.obj);
        falling.splice(i, 1);
      }
    }
  }

  return {
    root, show, warm, topple, update,
    
    sources: () => shed,
    
    
    
    
    sourcesOf,
    get stats() { return { rebuilds, triangles, wanted, drawn, ready: wanted === drawn && !running, falling: falling.length, cached: cache.size, cost, warmed, patches, lastPatchMs }; },
    get triangles() { return triangles; },
  };
}
