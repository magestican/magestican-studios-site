











import * as THREE from 'three';

const AZURE = 0x3d8bff;
const lam = (color, emissive = 0x000000) => new THREE.MeshLambertMaterial({ color, emissive });
const glass = (color, opacity) => new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false });

const SKIN = {
  door: 0x9a6a3e,
  flap: 0x8a8a96,
  lintel: 0x9a6a3e,
  sheet: 0xf2c6d8,
  crumb: 0xe0b86a,
  beads: 0xe8a0d0, 
  peg: 0x6fc3e8, 
  rug: 0xb8484a,
  hurdle: 0xb8484a,
  chair: 0x6a4a32,
  stool: 0xc89a5a,
  pot: 0xc0603a,
  pole: 0xd8d8d8,
  sprinkler: 0x4a8ac8,
  gnome: 0x3a7ad8,
  flowers: 0xe86aa0,
};





export function rideEntityView(e, g) {
  if (e.kind === 'obstacle') {
    const m = new THREE.Mesh(new THREE.BoxGeometry(e.w, e.h, 1.6), lam(SKIN[e.skin] ?? 0xb8484a));
    m.position.y = e.h / 2;
    g.add(m);
    return true;
  }
  if (e.kind === 'perchBug') {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.5, 4, 10), lam(0xffd34d, 0x332200));
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.35;
    const trail = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.4), glass(AZURE, 0.5));
    trail.position.set(-1.3, 0.35, -0.1);
    g.add(body, trail);
    return true;
  }
  if (e.kind === 'maneWave') return true; 
  return false;
}


function ruuma(w) {
  const g = new THREE.Group();
  const fur = lam(0xe8913a, 0x2a1406);
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(2.6, w - 5.2, 6, 20), fur);
  body.rotation.z = Math.PI / 2;
  body.position.y = -2.6;
  g.add(body);
  const stripeMat = lam(0x3a2414);
  for (let i = 0; i < 9; i++) {
    const st = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4.2, 5.4), stripeMat);
    st.position.set(-w / 2 + 3 + i * ((w - 6) / 8), -2.4, 0);
    st.rotation.z = 0.25;
    g.add(st);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(3, 18, 14), fur);
  head.position.set(w / 2 + 1.5, -1.6, 0); 
  const ear = new THREE.Mesh(new THREE.ConeGeometry(0.9, 1.6, 8), fur);
  ear.position.set(w / 2 + 2.2, 1.3, 0.8);
  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(1.4, 14, 10), lam(0xf6e2c4));
  muzzle.position.set(w / 2 + 3.8, -2.3, 0.6);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.3, 7, 8), fur);
  tail.position.set(-w / 2 - 2.5, -0.5, 0);
  tail.rotation.z = 1.1;
  g.add(head, ear, muzzle, tail);
  const legMat = lam(0xd07a2e);
  for (const x of [-w / 2 + 2.5, -w / 2 + 6, w / 2 - 6, w / 2 - 2.5]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.7, 4.2, 8), legMat);
    leg.position.set(x, -6.4, 0.4);
    g.add(leg);
  }
  return g;
}





export function createRide(scene, level, _ctx) {
  if (!level.ride) return null;
  const lane = level.rafts.find((d) => d.id === level.ride);
  const w = lane?.w ?? 26;
  const body = ruuma(w);
  scene.add(body);
  const ridge = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), glass(0xfff2d8, 0.85));
  ridge.scale.set(2.2, 0.9, 2);
  ridge.visible = false;
  scene.add(ridge);
  const house = new THREE.Color(0xe8c8a0);
  const garden = scene.background?.isColor ? scene.background.clone() : null;
  const baseBg = scene.background;
  return {
    
    update(s) {
      const deck = s.rafts?.list.find((r) => r.lane === level.ride);
      body.visible = !!deck;
      
      if (deck) body.position.set(deck.x, deck.y, -3);
      const w8 = s.entities.find((e) => e.kind === 'maneWave' && e.state === 'run');
      ridge.visible = !!(w8 && deck);
      if (ridge.visible) ridge.position.set(w8.crest, deck.y + 0.3, 0.2);
      
      scene.background = s.player.x < 420 ? house : (garden ?? baseBg);
    },
    onEvent() {},
  };
}
