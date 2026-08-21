// Falling voxel snow. THREE.Points isn't voxel-y enough, so we spawn small
// BoxGeometry instances via InstancedMesh — one mesh per size class, three
// draw calls total.
//
// This file is only the THREE binding. Every number, and the whole simulation
// step, lives in snowSpec.js as pure data + pure functions so the art rules
// are asserted by tests (the repo has no node_modules, so nothing importing
// three can be tested here).

import * as THREE from 'three';
import {
  EYE, FIELD, FLAKE_CLASSES, TOTAL_FLAKES, classCounts, makeField, stepFlake,
} from './snowSpec.js';

export class SnowSystem {
  constructor(scene, playerPos, grid = null, seed = 0x5106f) {
    this.scene = scene;
    this.playerPos = playerPos;
    // Optional voxel grid: without it snow falls through barn roofs.
    //
    // The `inBounds` guard is not optional and it is not defensive noise.
    // voxelGrid.get() returns STONE outside the array ("out of bounds =
    // solid", so the world has walls) and the map is only 12 voxels TALL,
    // while snow respawns at 20 m. Testing isSolid() alone therefore reports
    // every flake above the map — which is most of them — as having landed,
    // and since the respawn ceiling is also out of bounds each one lands
    // again on the very next frame. The first cut of this shipped exactly
    // that and deleted the entire snowfall in one frame; the contact sheet
    // came back with a completely empty sky.
    this._solidAt = grid
      ? (x, y, z) => grid.inBounds(x, y, z) && grid.isSolid(x, y, z)
      : null;
    this._flakes = makeField(seed, TOTAL_FLAKES);
    const counts = classCounts(TOTAL_FLAKES);

    // One mesh per class: each class needs its own cube size, face tones and
    // opacity, and per-instance opacity is not a thing without a custom
    // shader. Three draw calls is a rounding error.
    this.meshes = FLAKE_CLASSES.map((cls, i) => {
      const geo = paintedFlake(cls);
      const mat = new THREE.MeshBasicMaterial({
        vertexColors: true,      // the three tones are IN the geometry
        transparent: true,
        opacity: cls.opacity,
        depthWrite: false,       // 1500 transparent cubes: blend, don't fight
        fog: true,
      });
      const mesh = new THREE.InstancedMesh(geo, mat, counts[i]);
      mesh.frustumCulled = false;
      mesh.renderOrder = 2;
      mesh.name = `snow-${cls.name}`;
      scene.add(mesh);
      return mesh;
    });

    this._dummy = new THREE.Object3D();
    this._t = 0;
    this._writeMatrices();
  }

  update(dt) {
    this._t += dt;
    const px = this.playerPos.x, pz = this.playerPos.z;
    for (const f of this._flakes) stepFlake(f, dt, this._t, px, pz, Math.random, this._solidAt);
    this._writeMatrices();
  }

  _writeMatrices() {
    const d = this._dummy;
    const ex = this.playerPos.x, ez = this.playerPos.z;
    const ey = (this.playerPos.y ?? 0) + EYE.offsetY;
    const hold2 = EYE.holdOut * EYE.holdOut;
    for (const f of this._flakes) {
      // Scale-to-zero rather than a separate cull list: an InstancedMesh
      // draws every slot, and a zero-scale matrix costs nothing to rasterise.
      const dx = f.x - ex, dy = f.y - ey, dz = f.z - ez;
      d.scale.setScalar(dx * dx + dy * dy + dz * dz < hold2 ? 0 : 1);
      d.position.set(f.x, f.y, f.z);
      // The tilt is not decoration: an axis-aligned white cube over an
      // axis-aligned white ground catches the sun at the same angle the
      // ground does and disappears into it. See snowSpec.js header.
      d.rotation.set(f.rx, f.ry, f.rz);
      d.updateMatrix();
      this.meshes[f.cls].setMatrixAt(f.slot, d.matrix);
    }
    for (const m of this.meshes) m.instanceMatrix.needsUpdate = true;
  }

  dispose() {
    for (const m of this.meshes) {
      this.scene.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    }
  }
}

// A flake is PAINTED, not lit — see the tones section of snowSpec.js. Opposite
// faces share a tone, so a cube seen from any corner shows one crest, one body
// and one shade face: it always has a face brighter than the snow field behind
// it and a face darker than the pale sky above it, whichever way it is
// tumbling. BoxGeometry lays its 24 vertices out as +X, -X, +Y, -Y, +Z, -Z,
// four each, which is the pairing this relies on.
function paintedFlake(cls) {
  const geo = new THREE.BoxGeometry(cls.size, cls.size, cls.size);
  const pairs = [cls.tones.crest, cls.tones.crest, cls.tones.body,
                 cls.tones.body, cls.tones.shade, cls.tones.shade];
  const colors = new Float32Array(24 * 3);
  const c = new THREE.Color();
  for (let face = 0; face < 6; face++) {
    c.set(pairs[face]);
    for (let v = 0; v < 4; v++) {
      const i = (face * 4 + v) * 3;
      colors[i] = c.r; colors[i + 1] = c.g; colors[i + 2] = c.b;
    }
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

export { FIELD, FLAKE_CLASSES };
