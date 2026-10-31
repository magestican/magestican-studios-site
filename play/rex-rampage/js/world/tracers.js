



import { THREE } from '../vendor/three-vendor.js';

export const TRACER_S = 0.1;
export const PUFF_S = 0.25;
const UP = new THREE.Vector3(0, 1, 0);


export function createTracers(scene) {
  
  const beam = new THREE.CylinderGeometry(0.07, 0.012, 1, 6, 1, true);
  beam.translate(0, 0.5, 0); 
  const puffGeo = new THREE.SphereGeometry(1, 8, 6);
  
  const live = [];

  function add(mesh, life, grow) {
    mesh.renderOrder = 11;
    scene.add(mesh);
    live.push({ mesh, t: 0, life, grow });
    return mesh;
  }
  const mat = (color, depthTest = true) =>
    new THREE.MeshBasicMaterial({ color, transparent: true, fog: false, depthWrite: false, depthTest, blending: THREE.AdditiveBlending });

  return {
    live,
    
    fire(from, to) {
      const dir = to.clone().sub(from);
      const len = dir.length();
      if (len < 0.05) return null;
      const m = new THREE.Mesh(beam, mat(0xfff0a0));
      m.position.copy(from);
      m.quaternion.setFromUnitVectors(UP, dir.normalize());
      m.scale.set(1, len, 1);
      return add(m, TRACER_S, 0);
    },
    
    impact(at, eye) {
      const p = at.clone().add(eye.clone().sub(at).setLength(0.25));
      const m = new THREE.Mesh(puffGeo, mat(0xffd27a, false));
      m.position.copy(p);
      m.scale.setScalar(0.22);
      return add(m, PUFF_S, 5);
    },
    
    update(dt) {
      for (let i = live.length - 1; i >= 0; i--) {
        const f = live[i];
        f.t += dt;
        const u = f.t / f.life;
        if (f.grow) f.mesh.scale.multiplyScalar(1 + f.grow * dt);
         (f.mesh.material).opacity = Math.max(0, 1 - u);
        if (u >= 1) {
          scene.remove(f.mesh);
           (f.mesh.material).dispose();
          live.splice(i, 1);
        }
      }
    },
  };
}
