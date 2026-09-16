







import * as THREE from 'three';
import { MeshData, compose, translate, rotateY, scale } from 'moon/mesh/meshData.mjs';
import { SHELF, shelvesView, shelvesSignature, toPlacementFrame } from 'moon/play/shelves.mjs';
import { itemMeshData } from '../render/items.js';
import { toObject3D } from '../render/toMesh.js';


const LOD = 1;

export function createShelvesDraw({ scene, season, onProblems = () => {} }) {
  const root = new THREE.Group();
  root.name = 'shelves';
  scene.add(root);
  const cache = new Map();
  let merged = null, triangles = 0, rebuilds = 0, drawn = '', running = null, queued = null;

  const dataFor = (good, variant) => {
    const key = `${good}|${variant}`;
    if (!cache.has(key)) {
      const data = itemMeshData(good, { seed: 1 + variant, season, lod: LOD });
      onProblems(data.validate());
      cache.set(key, data);
    }
    return cache.get(key);
  };

  async function build({ placement, view, sig }) {
    const data = new MeshData('shelf-goods');
    for (const shelf of view) {
      shelf.spots.forEach((spot, i) => {
        const w = toPlacementFrame(placement, spot);
        
        const turn = ((i * 7 + shelf.index * 3) % 5 - 2) * 0.12;
        
        data.append(dataFor(shelf.good, i % 3), compose(translate(w.x, w.y, w.z), compose(rotateY(w.rotY + turn), scale(spot.scale || 1))));
      });
    }
    const obj = data.triangleCount ? await toObject3D(data) : new THREE.Group();
    obj.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
    if (merged) {
      root.remove(merged);
      merged.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
    }
    merged = obj;
    root.add(obj);
    triangles = data.triangleCount;
    rebuilds += 1;
    drawn = sig;
  }

  
  function show(shelves, anchors, placement) {
    
    const heightOf = (good) => { const b = dataFor(good, 0).bounds(); return b.max[1] - b.min[1]; };
    const view = shelvesView(shelves, anchors.shelves, SHELF, heightOf);
    const sig = `${shelvesSignature(view)}#${anchors.shelves.length}`;
    if (sig === drawn && !running) return { view, changed: false };
    queued = { placement, view, sig };
    if (!running) {
      running = (async () => {
        while (queued) {
          const next = queued;
          queued = null;
          await build(next);
        }
      })().finally(() => { running = null; });
    }
    return { view, changed: true };
  }

  return {
    root, show,
    get ready() { return !running; },
    get triangles() { return triangles; },
    get stats() { return { rebuilds, triangles, drawn, ready: !running }; },
  };
}
