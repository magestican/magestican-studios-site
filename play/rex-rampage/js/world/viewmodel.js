


import { THREE } from '../vendor/three-vendor.js';

export const FLASH_R = 0.1;

export const FLASH_KICK = 0.2;
const KICK_DECAY = 12;
const SPOT = new THREE.Vector3();

function gunMesh() {
  const g = new THREE.Group();
  const metal = new THREE.MeshLambertMaterial({ color: 0x2b2f33 });
  const grip = new THREE.MeshLambertMaterial({ color: 0x6b4a2e });
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.08, 0.36), metal);
  slide.position.z = -0.12;
  const handle = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.08), grip);
  handle.position.set(0, -0.1, 0.02);
  handle.rotation.x = -0.25;
  
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(FLASH_R, 8, 6),
    new THREE.MeshBasicMaterial({ color: 0xffd26a, fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  flash.position.z = -0.4;
  flash.renderOrder = 12;
  flash.visible = false;
  g.add(slide, handle, flash);
  g.userData.flash = flash;
  g.userData.greybox = [slide, handle];
  return g;
}


export function createViewmodels(camera) {
  const guns = { left: gunMesh(), right: gunMesh() };
  const kick = { left: 0, right: 0 };
  for (const [side, g] of Object.entries(guns)) {
    g.visible = false;
    g.position.set(side === 'right' ? 0.22 : -0.22, -0.2, -0.45);
    camera.add(g);
  }
  return {
    
    muzzle(side) {
      const g = guns[side];
      if (!g?.visible) return null;
      return g.userData.flash.getWorldPosition(SPOT).clone();
    },
    
    setModel(model) {
      if (!model) return;
      for (const g of Object.values(guns)) {
        const m = model.clone();
        m.rotation.y = Math.PI / 2; 
        m.position.set(0, -0.17, 0.08);
        g.add(m);
        for (const b of g.userData.greybox) b.visible = false;
        g.userData.flash.position.z = -0.34; 
      }
    },
    



    update(state, events, dt) {
      for (const ev of events) if (ev.type === 'shot' && ev.side) kick[ev.side] = 1;
      for (const side of  (['left', 'right'])) {
        const g = guns[side];
        const s = state[side];
        g.visible = !!(s.ndc || s.up);
        if (!g.visible) continue;
        kick[side] = Math.max(0, kick[side] - dt * KICK_DECAY);
        const x = s.ndc ? s.ndc.x : 0;
        const y = s.ndc ? s.ndc.y : 1;
        const base = side === 'right' ? 0.22 : -0.22;
        g.position.set(base + x * 0.12, -0.2 + y * 0.08 + (s.up ? 0.12 : 0), -0.45 + kick[side] * 0.04);
        g.rotation.set(s.up ? 1.2 : y * 0.45 + kick[side] * 0.25, -x * 0.6, 0);
        const f = g.userData.flash;
        f.visible = kick[side] > FLASH_KICK;
        if (f.visible) f.scale.setScalar(0.7 + 0.8 * kick[side] + 0.3 * Math.random());
      }
    },
  };
}
