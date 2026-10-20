





















import * as THREE from 'three';

const PINK = 0xff2fa0;
const AZURE = 0x3d8bff;
const STONE = 0x8d877c;
const RUBBLE = 0xa09482; 
const MAX_RUBBLE = 900;

const lam = (color, emissive = 0x000000) => new THREE.MeshLambertMaterial({ color, emissive });
const additive = (color, opacity) =>
  new THREE.MeshBasicMaterial({ color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false });


const isBurrow = (level) =>
  (level.entities ?? []).some((e) => e.kind === 'tower' || e.kind === 'nymph' || (e.kind === 'boss' && e.type === 'duchessMounted'));


function screw() {
  const g = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.75, 10), lam(0xc89a5a, 0x2a1c0c));
  g.add(cone);
  const thread = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.035, 4, 12), lam(0x8a6230));
  for (let i = 0; i < 3; i++) {
    const t = thread.clone();
    t.rotation.x = Math.PI / 2 + 0.35;
    t.position.y = -0.22 + i * 0.2;
    t.scale.setScalar(1 - i * 0.28);
    g.add(t);
  }
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.18, 10), lam(0x6d7a8c));
  hub.position.y = -0.46;
  g.add(hub);
  return g;
}





export function burrowEntityView(e, g) {
  if (e.kind === 'tower') {
    const stones = new THREE.Group();
    stones.name = 'stones';
    const geo = new THREE.SphereGeometry(0.47, 16, 12);
    for (let i = 0; i < e.n; i++) {
      const s = new THREE.Mesh(geo, lam(i % 2 ? STONE : 0x9a9488, 0x14120f));
      s.scale.set(1.08, 0.86, 0.95);
      s.rotation.z = i * 0.7;
      stones.add(s);
    }
    g.add(stones);
    return true;
  }
  if (e.kind === 'nymph') {
    const body = new THREE.Group();
    body.name = 'nymphBody';
    const abd = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), lam(0xb88458, 0x2a160a));
    abd.scale.set(1.3, 0.8, 0.8);
    abd.position.set(-0.12, 0.28, 0);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 12, 10), lam(0xc89468, 0x2a160a));
    head.position.set(0.3, 0.32, 0);
    const spade = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), lam(0x8a5a34));
    spade.scale.set(1.3, 0.7, 0.8);
    spade.position.set(0.42, 0.16, 0.12);
    
    const funnel = new THREE.Mesh(
      new THREE.ConeGeometry(0.18, 0.3, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: AZURE, side: THREE.DoubleSide }),
    );
    funnel.rotation.z = Math.PI / 2;
    funnel.position.set(0.68, 0.34, 0);
    funnel.name = 'funnel';
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), additive(AZURE, 0.6));
    glow.position.set(0.4, 0.35, 0.3);
    glow.name = 'nymphGlow';
    body.add(abd, head, spade, funnel);
    g.add(body, glow);
    return true;
  }
  if (e.kind === 'boss' && e.type === 'duchessMounted') {
    
    const trowel = new THREE.Group();
    trowel.name = 'trowel';
    const fur = lam(0x6e4a32, 0x1a0e06);
    const back = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), fur);
    back.scale.set(2.5, 1.55, 1.3);
    back.position.y = 1.6;
    const shield = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), lam(0x8a5e3e, 0x1e1008));
    shield.scale.set(1.15, 1.05, 1.15);
    shield.position.set(1.7, 2.0, 0);
    const face = new THREE.Mesh(new THREE.SphereGeometry(0.75, 16, 12), lam(0xa47452, 0x1e1008));
    face.position.set(2.55, 1.5, 0.2);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x140c08 });
    for (const z of [0.45, -0.1]) {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), eyeMat);
      eye.position.set(3.05, 1.75, z);
      trowel.add(eye);
    }
    const mittens = new THREE.Group();
    mittens.name = 'mittens';
    for (const z of [0.7, -0.6]) {
      const mit = new THREE.Mesh(new THREE.SphereGeometry(0.6, 14, 10), lam(0x5a3a24, 0x140a04));
      mit.scale.set(1.1, 0.8, 0.6);
      mit.position.set(2.9, 0.55, z);
      mittens.add(mit);
    }
    const legs = new THREE.Group();
    legs.name = 'legs';
    for (const x of [-1.4, -0.4, 0.6]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 1.0, 6), lam(0x4a3020));
      leg.position.set(x, 0.45, 0.6);
      legs.add(leg);
    }
    const tails = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.9, 6), lam(0x4a3020));
    tails.rotation.z = Math.PI / 2 + 0.4;
    tails.position.set(-2.7, 1.9, 0);
    trowel.add(back, shield, face, mittens, legs, tails);
    
    const rider = new THREE.Group();
    rider.name = 'rider';
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.8, 18, 12), lam(0x6a3fa0, 0x140828));
    body.scale.set(0.9, 1.05, 0.8);
    body.position.y = 0.9;
    const headR = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 10), lam(0x7d52b4, 0x140828));
    headR.position.set(0.35, 1.85, 0);
    const tiara = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.28, 0.24, 6, 1, true), lam(0xd9d2f0, 0x302848));
    tiara.position.set(0.35, 2.32, 0);
    const crop = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.2, 5), lam(0x2a1a10));
    crop.name = 'crop';
    crop.position.set(0.9, 1.3, 0.3);
    crop.rotation.z = -0.9;
    rider.add(body, headR, tiara, crop);
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(2.6, 3.1, 40),
      new THREE.MeshBasicMaterial({ color: PINK, transparent: true, opacity: 0, depthWrite: false }),
    );
    halo.position.set(0, 2.2, 0.6);
    halo.name = 'halo';
    g.add(trowel, rider, halo);
    return true;
  }
  return false;
}





export function createBurrow(scene, level, h) {
  if (!isBurrow(level)) return null;
  const T = level.world.tile;
  const group = new THREE.Group();
  scene.add(group);

  
  const rubbleGeo = new THREE.BoxGeometry(T * 0.98, T * 0.98, 2.2);
  const rubbleMesh = new THREE.InstancedMesh(rubbleGeo, lam(RUBBLE, 0x3a3226), MAX_RUBBLE);
  rubbleMesh.count = 0;
  rubbleMesh.frustumCulled = false;
  group.add(rubbleMesh);
  const initial = new Set(h.soil.cells.map(([c, r]) => r * 100000 + c));
  let dirty = true;
  let scanT = 0;
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const sc = new THREE.Vector3(1, 1, 1);
  const pos = new THREE.Vector3();
  function rescan(world) {
    let n = 0;
    for (let r = 0; r < world.height && n < MAX_RUBBLE; r++)
      for (let c = 0; c < world.width && n < MAX_RUBBLE; c++) {
        if (!world.soil(c, r) || initial.has(r * 100000 + c)) continue;
        
        const j = ((c * 73856093) ^ (r * 19349663)) & 255;
        q.setFromEuler(new THREE.Euler(0, 0, (j / 255 - 0.5) * 0.3));
        sc.setScalar(0.9 + (j % 16) / 100);
        pos.set(c * T + T / 2, r * T + T / 2, -1.1 + 0.3);
        rubbleMesh.setMatrixAt(n++, m4.compose(pos, q, sc));
      }
    rubbleMesh.count = n;
    rubbleMesh.instanceMatrix.needsUpdate = true;
  }

  
  const drill = screw();
  drill.visible = false;
  group.add(drill);
  let spin = 0;
  let stagger = 0;
  let crumbT = 0;

  
  const ridge = new THREE.Group();
  const mound = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), lam(0x8a5a38, 0x1a0e06));
  mound.scale.set(1.8, 0.7, 1);
  ridge.add(mound);
  ridge.visible = false;
  group.add(ridge);

  const towerOf = (e) => e.kind === 'tower';
  return {
    
    update(s, dt) {
      const world = s.world;
      h.soil.sync(world);
      scanT += dt;
      if (dirty || scanT > 0.5) {
        rescan(world);
        dirty = false;
        scanT = 0;
      }
      
      const p = s.player;
      const mode = p.drilling;
      stagger = Math.max(0, stagger - dt);
      drill.visible = !!mode || stagger > 0;
      if (drill.visible) {
        const jx = h.jo.group.position.x;
        const jy = h.jo.group.position.y;
        const up = mode === 'up' || mode === 'brace';
        spin += dt * (mode === 'brace' ? 0 : mode ? 40 : 8);
        const shake = stagger > 0 ? Math.sin(stagger * 90) * 0.06 : 0;
        if (up) {
          drill.position.set(jx + shake, jy + 1.55, 0.5);
          drill.rotation.set(0, spin, 0);
        } else {
          drill.position.set(jx + (p.facing ?? 1) * 0.75 + shake, jy + 0.6, 0.5);
          drill.rotation.set(spin, 0, -(p.facing ?? 1) * (Math.PI / 2));
        }
      }
      
      for (const e of s.entities) {
        const v = h.views.get(e.id);
        if (!v || !e.alive) continue;
        if (towerOf(e)) {
          const stones = v.getObjectByName('stones');
          const shown =
            !e.removed &&
            (e.state === 'rest' || e.state === 'wobble' || e.state === 'fall' || (e.state === 'settled' && !e.rubble?.length));
          stones.visible = shown;
          v.scale.x = 1;
          if (!shown) continue;
          const wob = e.state === 'wobble' ? Math.sin(s.time * 70) * 0.06 : 0;
          stones.children.forEach((m, i) => {
            const st = e.stones[i];
            if (!st) return;
            m.position.set(st.x - v.position.x + wob * (i + 1) * 0.3, st.y - v.position.y, -0.75);
          });
        } else if (e.kind === 'nymph') {
          const body = v.getObjectByName('nymphBody');
          const glow = v.getObjectByName('nymphGlow');
          const sing = e.state === 'sing';
          body.position.y += ((sing ? 0 : -0.55) - body.position.y) * Math.min(1, dt * 10);
          body.scale.y = sing ? 1 + Math.sin(s.time * 26) * 0.05 : 1;
          glow.material.opacity = sing ? (e.scanned ? 0.25 : 0.45 + 0.2 * Math.sin(s.time * 5)) : 0;
          v.getObjectByName('funnel').visible = sing;
        } else if (e.kind === 'boss' && e.type === 'duchessMounted') {
          v.scale.x = 1;
          const tw = e.trowel;
          const rd = e.rider;
          const trowel = v.getObjectByName('trowel');
          const rider = v.getObjectByName('rider');
          if (tw) {
            const mood = tw.mood;
            const under = mood === 'tunnel' || mood === 'dive' || (e.under && mood !== 'erupt');
            trowel.visible = !under;
            trowel.position.set(tw.x - v.position.x, tw.y - v.position.y + (mood === 'erupt' ? 0.6 : 0), 0);
            trowel.scale.x = tw.facing < 0 ? -1 : 1;
            const wiggle = mood === 'stuck' || mood === 'dig' ? Math.sin(s.time * 24) * 0.12 : 0;
            const dizzy = mood === 'dizzy' || mood === 'tripped' || mood === 'wobble' ? Math.sin(s.time * 9) * 0.1 : 0;
            trowel.rotation.z = wiggle + dizzy + (mood === 'stuck' ? -0.12 * (tw.facing < 0 ? -1 : 1) : 0);
            const mitts = trowel.getObjectByName('mittens');
            mitts.position.x = mood === 'paw' || mood === 'rush' || mood === 'dig' ? Math.sin(s.time * 30) * 0.18 : 0;
            const legs = trowel.getObjectByName('legs');
            legs.position.y = mood === 'rush' ? Math.abs(Math.sin(s.time * 28)) * 0.15 : 0;
            ridge.visible = under && !!e.ridge;
            if (e.ridge) ridge.position.set(e.ridge.x, e.arena.y0, -0.2); 
          }
          if (rd) {
            rider.visible = !e.riderGone;
            rider.position.set(rd.x - v.position.x, rd.y - v.position.y, 0.35);
            rider.scale.x = (tw?.facing ?? -1) < 0 ? -1 : 1;
            rider.rotation.z =
              rd.mood === 'dizzy' || rd.mood === 'ouch' ? Math.sin(s.time * 11) * 0.15 : rd.mood === 'thrown' ? s.time * 8 : 0;
            if (rd.mood === 'fin') rider.position.y -= 1.2; 
            const crop = rider.getObjectByName('crop');
            crop.rotation.z = rd.mood === 'crop' || rd.mood === 'fan' ? -0.9 + Math.sin(s.time * 16) * 0.6 : -0.9;
          }
          const halo = v.getObjectByName('halo');
          if (halo && tw) halo.position.set(tw.x - v.position.x, tw.y - v.position.y + 2.2, 0.6);
        }
      }
      if (ridge.visible) {
        mound.scale.y = 0.7 + Math.sin(s.time * 20) * 0.06;
        crumbT += dt;
        if (crumbT > 0.08) {
          crumbT = 0;
          h.spark(ridge.position.x + (Math.random() - 0.5) * 2, ridge.position.y + 0.6, 0x8a5a38, 0.4, 0.1);
        }
      }
    },
    
    onEvent(e) {
      const t = e.type;
      if (t === 'rubble' || t === 'towerRefill' || t === 'heapBuilt' || t === 'tunnelTrip' || t === 'bossPhase' || t === 'respawn')
        dirty = true;
      if (t === 'drillBore' && Math.random() < 0.5)
        h.spark(e.x + (Math.random() - 0.5) * 0.6, e.y + 0.4 + Math.random() * 0.6, 0x9b6a45, 0.45, 0.1);
      if (t === 'drillBreach') {
        for (let i = 0; i < 6; i++) h.spark(e.x - 0.75 + i * 0.3, e.y, 0x9b6a45, 0.6, 0.13);
        h.kick(0.05);
      }
      if (t === 'drillRefuse') {
        stagger = 0.25;
        for (let i = 0; i < 4; i++) h.spark(e.x + Math.cos(i * 1.7) * 0.4, e.y + 0.6 + Math.sin(i * 1.7) * 0.3, 0xb8c0cc, 0.35, 0.09);
        h.kick(0.06);
      }
      if (t === 'drillDown') stagger = 0.15;
      if (t === 'towerTopple') h.kick(0.04);
      if (t === 'towerLand') {
        h.kick(0.1);
        for (let i = 0; i < 7; i++) h.spark(e.x - 1.8 + i * 0.6, e.y + 0.2, 0xc8b49a, 0.7, 0.16);
      }
      if (t === 'collapseHit')
        for (let i = 0; i < 5; i++) h.spark(e.x + Math.cos(i * 1.26) * 0.7, e.y + 1.1 + Math.sin(i * 1.26) * 0.5, 0xffffff, 0.6, 0.12);
      if (t === 'stoneBurst')
        for (let i = 0; i < 6; i++) h.spark(e.x + Math.cos(i) * 0.6, e.y + 0.5 + Math.sin(i) * 0.5, 0xd8ccb8, 0.5, 0.13);
      if (t === 'towerTrickle') for (let i = 0; i < 3; i++) h.spark(e.x - 0.3 + i * 0.3, e.y + 0.3, 0xc8b49a, 0.8, 0.08);
      if (t === 'erupt') {
        h.kick(0.12);
        for (let i = 0; i < 9; i++)
          h.spark(e.x + Math.cos(i * 0.7) * 1.4, e.y + 0.6 + Math.abs(Math.sin(i * 0.7)) * 1.6, 0x8a5a38, 0.7, 0.16);
      }
      if (t === 'spadeStuck' || t === 'tunnelTrip' || t === 'reinsSnap') h.kick(0.1);
      if (t === 'mountDizzy' || t === 'tunnelTrip')
        for (let i = 0; i < 4; i++) h.spark(e.x + Math.cos(i * 1.6) * 0.8, e.y + 3.2, 0xffffff, 0.9, 0.12);
      
      if (t === 'rushLine') {
        const len = 12;
        const bar = new THREE.Mesh(
          new THREE.PlaneGeometry(len, 0.14),
          new THREE.MeshBasicMaterial({ color: PINK, transparent: true, depthWrite: false }),
        );
        bar.position.set(e.x + (e.dir ?? 1) * (len / 2), e.y + 0.5, 0.4);
        h.tele(bar, 0.9);
      }
      if (t === 'tunnelLine') {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.55, 0.7, 32),
          new THREE.MeshBasicMaterial({ color: PINK, transparent: true, side: THREE.DoubleSide, depthWrite: false }),
        );
        ring.scale.set(2.4, 0.4, 1);
        ring.position.set(e.target, e.y + 0.08, 0.4);
        h.tele(ring, 1.0);
      }
    },
  };
}
