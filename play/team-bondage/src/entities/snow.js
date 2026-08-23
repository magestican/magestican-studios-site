








import * as THREE from 'three';
import {
  EYE, FIELD, FLAKE_CLASSES, TOTAL_FLAKES, classCounts, makeField, stepFlake,
} from './snowSpec.js';

export class SnowSystem {
  constructor(scene, playerPos, grid = null, seed = 0x5106f) {
    this.scene = scene;
    this.playerPos = playerPos;
    
    
    
    
    
    
    
    
    
    
    
    this._solidAt = grid
      ? (x, y, z) => grid.inBounds(x, y, z) && grid.isSolid(x, y, z)
      : null;
    this._flakes = makeField(seed, TOTAL_FLAKES);
    const counts = classCounts(TOTAL_FLAKES);

    
    
    
    this.meshes = FLAKE_CLASSES.map((cls, i) => {
      const geo = paintedFlake(cls);
      const mat = new THREE.MeshBasicMaterial({
        vertexColors: true,      
        transparent: true,
        opacity: cls.opacity,
        depthWrite: false,       
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
      
      
      const dx = f.x - ex, dy = f.y - ey, dz = f.z - ez;
      d.scale.setScalar(dx * dx + dy * dy + dz * dz < hold2 ? 0 : 1);
      d.position.set(f.x, f.y, f.z);
      
      
      
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
