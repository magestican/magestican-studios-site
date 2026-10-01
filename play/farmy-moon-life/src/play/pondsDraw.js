
















import * as THREE from 'three';
import { MeshData, IDENTITY, compose, translate } from 'moon/mesh/meshData.mjs';
import { lathe, emit } from 'moon/mesh/bevel.mjs';
import { RIPPLE, surfaceRamp } from 'moon/art/kit/water.mjs';
import { hex, vc } from 'moon/art/kit/shade.mjs';
import { toObject3D } from '../render/toMesh.js';

const WATER_COLOR = hex('#4a7f94');
const SIDES = 10;
const SURFACE_DROP_M = 0.02;

const disposeTree = (obj) => obj.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
const meshCount = (obj) => { let n = 0; if (obj) obj.traverse((o) => { if (o.isMesh) n++; }); return n; };

export function createPondsDraw({ scene }) {
  const root = new THREE.Group();
  root.name = 'ponds';
  scene.add(root);
  let obj = null, triangles = 0, signature = '', count = 0;

  function build(ponds, frozen) {
    const data = new MeshData('ponds');
    for (const p of ponds) {
      const y = p.y - SURFACE_DROP_M;
      const skin = lathe({ points: [[p.r, y], [p.r * 0.6, y - 0.01], [0, y - 0.02]], sides: SIDES, phase: 0 });
      const ramp = surfaceRamp(skin.p.map((q) => Math.hypot(q[0], q[2])), p.r);
      emit(data, 'water', skin, {
        matrix: compose(IDENTITY, translate(p.x, 0, p.z)),
        color: vc(WATER_COLOR, { groundAO: 0, underside: 0.15 }),
        ripple: frozen ? 0 : (q, n, uv, tag, i) => RIPPLE.pool * ramp[i],
      });
    }
    return data;
  }

  
  function sync(ponds, { season = 'summer' } = {}) {
    const frozen = season === 'winter';
    const sig = `${frozen}|${ponds.map((p) => `${p.x.toFixed(2)},${p.z.toFixed(2)},${p.r.toFixed(2)},${p.y.toFixed(3)}`).join(';')}`;
    if (sig === signature) return;
    signature = sig;
    count = ponds.length;
    const data = build(ponds, frozen);
    const next = data.triangleCount ? toObject3D(data) : Promise.resolve(new THREE.Group());
    next.then((made) => {
      made.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
      if (obj) { root.remove(obj); disposeTree(obj); }
      obj = made;
      root.add(made);
      triangles = data.triangleCount;
    });
  }

  function dispose() {
    if (obj) disposeTree(obj);
    scene.remove(root);
  }

  return {
    root, sync, dispose,
    get stats() { return { count, triangles, drawCalls: meshCount(obj) }; },
  };
}
