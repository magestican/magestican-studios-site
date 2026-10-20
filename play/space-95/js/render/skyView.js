















import * as THREE from 'three';

const PINK = 0xff2fa0;
const MAX_RINGS = 6;
const MAX_DARTS = 40;
const MAX_PEAS = 40;

const lam = (color, emissive = 0x000000) => new THREE.MeshLambertMaterial({ color, emissive });
const basic = (color, opacity = 1) =>
  new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1, side: THREE.DoubleSide });


function planeMesh() {
  const g = new THREE.Group();
  const body = new THREE.Group(); 
  body.name = 'planeBody';
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.6, 6, 14), lam(0xf4f7fb, 0x1a2028));
  hull.rotation.z = Math.PI / 2;
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.3, 14), lam(0x2fe0d0, 0x0a2a28));
  stripe.rotation.z = Math.PI / 2;
  stripe.position.x = 0.2;
  const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), basic(0x9fe6ff, 0.75));
  canopy.position.set(0.25, 0.32, 0);
  const wingMat = lam(0xe2b97a, 0x2a1e0c); 
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.08, 3.2), wingMat);
  wing.position.set(0.1, -0.05, 0);
  const tailWing = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 1.3), wingMat);
  tailWing.position.set(-1.1, 0.05, 0);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.55, 0.06), wingMat);
  fin.position.set(-1.1, 0.35, 0);
  const prop = new THREE.Group();
  prop.name = 'prop';
  prop.position.x = 1.35;
  const screw = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.45, 8), lam(0xc89a5a, 0x2a1c0c));
  screw.rotation.z = -Math.PI / 2;
  screw.position.x = 0.15;
  const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.3, 0.12), basic(0xf0e0c0, 0.55));
  prop.add(screw, blade);
  
  const bolt = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), lam(0xf4f4f8, 0x202024));
  bolt.position.set(-0.75, 0.45, 0);
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.13, 12), new THREE.MeshBasicMaterial({ color: 0x2fe0d0 }));
  face.position.set(-0.75, 0.47, 0.22);
  body.add(hull, stripe, canopy, wing, tailWing, fin, prop, bolt, face);
  g.add(body);
  return g;
}





export function skyEntityView(e, g) {
  if (e.kind === 'ace') {
    const leader = e.role === 'leader' || e.leader === true;
    const dfly = new THREE.Group();
    dfly.name = 'ace';
    dfly.position.y = (e.h ?? 0.8) / 2;
    const bodyMat = lam(leader ? 0xd8323c : 0x2a7fd8, leader ? 0x300a0c : 0x0a1a30);
    const thorax = new THREE.Mesh(new THREE.SphereGeometry(0.3, 14, 10), bodyMat);
    thorax.scale.set(1.3, 1, 1);
    const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 1.6, 8), bodyMat);
    tail.rotation.z = Math.PI / 2;
    tail.position.x = -1.05;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), bodyMat);
    head.position.x = 0.45;
    const goggles = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.04, 6, 12), lam(0x5a4430));
    goggles.position.set(0.55, 0.12, 0.15);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.1, 10), new THREE.MeshBasicMaterial({ color: 0xbfe9ff }));
    lens.position.set(0.56, 0.12, 0.2);
    const wings = new THREE.Group();
    wings.name = 'aceWings';
    const wingMat = basic(0xe8f4ff, 0.55);
    for (const [x, s] of [
      [0.15, 1],
      [-0.2, -1],
    ]) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 1.5), wingMat);
      w.position.set(x, 0.15, 0);
      w.rotation.x = s * 0.4;
      wings.add(w);
    }
    dfly.add(thorax, tail, head, goggles, lens, wings);
    if (leader) {
      const scarf = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.14), basic(0xfff2c8));
      scarf.position.set(-0.3, 0.32, 0.1);
      scarf.name = 'scarf';
      dfly.add(scarf);
    }
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.9, 1.1, 28),
      new THREE.MeshBasicMaterial({ color: PINK, transparent: true, opacity: 0, depthWrite: false }),
    );
    halo.name = 'aceTele';
    halo.position.set(0, (e.h ?? 0.8) / 2, 0.5);
    g.add(dfly, halo);
    return true;
  }
  if (e.kind === 'glasswing') {
    const b = new THREE.Group();
    b.name = 'glasswing';
    b.position.y = 0.4;
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6), lam(0x2a2030));
    body.rotation.z = Math.PI / 2;
    const wings = new THREE.Group();
    wings.name = 'gwWings';
    const clear = basic(0xf2fbff, 0.35);
    const rim = basic(0xff8a3c, 0.9);
    for (const s of [1, -1]) {
      const w = new THREE.Mesh(new THREE.CircleGeometry(0.45, 16), clear);
      w.position.set(0.05, s * 0.3, 0);
      const r = new THREE.Mesh(new THREE.RingGeometry(0.42, 0.47, 16), rim);
      r.position.copy(w.position);
      wings.add(w, r);
    }
    b.add(body, wings);
    g.add(b);
    return true;
  }
  return false;
}





export function createSky(scene, level, h) {
  if (level.mode !== 'plane') return null;
  const group = new THREE.Group();
  scene.add(group);
  const plane = planeMesh();
  group.add(plane);

  
  for (const z of level.softs ?? []) {
    const w = z.x1 - z.x0;
    const ht = z.y1 - z.y0;
    const cx = (z.x0 + z.x1) / 2;
    const cy = (z.y0 + z.y1) / 2;
    if (z.skin === 'fluff') {
      const mat = basic(0xffffff, 0.8);
      const n = Math.max(3, Math.round((w * ht) / 3));
      for (let i = 0; i < n; i++) {
        
        const kx = (0.5 + i * 0.7548776662) % 1;
        const ky = (0.5 + i * 0.5698402909) % 1;
        const puff = new THREE.Mesh(new THREE.SphereGeometry(0.35 + 0.25 * ((kx + ky) % 1), 10, 8), mat);
        puff.position.set(z.x0 + w * kx, z.y0 + ht * ky, -0.1);
        group.add(puff);
      }
    } else {
      const sheet = new THREE.Mesh(new THREE.PlaneGeometry(w, ht), z.skin === 'fur' ? lam(0x8a6a4a, 0x1a120a) : lam(0xf2d9e6, 0x2a2228));
      sheet.position.set(cx, cy, -0.15);
      group.add(sheet);
      if (z.skin === 'cloth') {
        const peg = new THREE.Mesh(new THREE.BoxGeometry(w + 0.6, 0.06, 0.06), lam(0xdddddd));
        peg.position.set(cx, z.y1 + 0.05, -0.1);
        group.add(peg);
      }
    }
  }

  
  const fin = (level.entities ?? []).find((e) => e.kind === 'finish' && e.landing);
  let strip = null;
  if (fin) {
    const L = fin.landing;
    strip = new THREE.Mesh(new THREE.BoxGeometry(L.x1 - L.x0, 0.12, 2.6), lam(0x8a8f99, 0x101010));
    strip.position.set((L.x0 + L.x1) / 2, L.y + 0.06, 0);
    group.add(strip);
    for (let x = L.x0 + 1; x < L.x1; x += 2) {
      const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.14), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      dash.rotation.x = -Math.PI / 2;
      dash.position.set(x, L.y + 0.13, 0.6);
      group.add(dash);
    }
  }
  const stripLight = new THREE.MeshBasicMaterial({ color: 0x39e07a });

  
  const pool = (n, make) =>
    Array.from({ length: n }, () => {
      const m = make();
      m.visible = false;
      group.add(m);
      return m;
    });
  const rings = pool(MAX_RINGS, () => new THREE.Mesh(new THREE.TorusGeometry(1, 0.06, 6, 40), basic(0xffffff, 0.7)));
  const darts = pool(MAX_DARTS, () => new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 6), new THREE.MeshBasicMaterial({ color: PINK })));
  const peas = pool(MAX_PEAS, () => new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), new THREE.MeshBasicMaterial({ color: 0xd8ff6a })));

  return {
    
    update(s, dt) {
      const pl = s.plane;
      h.jo.group.visible = false;
      h.bolt.group.visible = false;
      if (!pl) {
        plane.visible = false;
        return;
      }
      plane.visible = !(pl.iframes > 0 && Math.floor(s.time * 16) % 2 === 0) || (pl.rollT ?? 0) > 0;
      plane.position.set(pl.x, pl.y, 0.4);
      plane.rotation.z = pl.heading ?? 0;
      const body = plane.getObjectByName('planeBody');
      const rollK = (pl.rollT ?? 0) > 0 ? 1 - pl.rollT / 0.4 : 0;
      body.rotation.x = rollK * Math.PI * 2 * (pl.rollSide ?? 1);
      plane.getObjectByName('prop').rotation.x += dt * (pl.stage === 'landed' ? 2 : 45);
      
      const now = s.time;
      const live = (pl.rings ?? []).filter((r) => r.until === undefined || r.until > now);
      rings.forEach((m, i) => {
        const r = live[i];
        m.visible = !!r;
        if (!r) return;
        m.position.set(r.x, r.y, 0.3);
        m.scale.setScalar(r.r ?? 2.75);
        const life = (r.until ?? now + 1) - (r.born ?? now - 1);
        m.material.opacity = 0.75 * Math.max(0, Math.min(1, ((r.until ?? now + 1) - now) / Math.max(0.1, life)));
      });
      const place = (meshes, list, orient) =>
        meshes.forEach((m, i) => {
          const d = list?.[i];
          m.visible = !!d;
          if (!d) return;
          m.position.set(d.x, d.y, 0.45);
          if (orient) m.rotation.z = Math.atan2(d.vy ?? 0, d.vx ?? 1) - Math.PI / 2;
        });
      place(darts, pl.darts, true);
      place(peas, pl.peas, false);
      if (strip && fin) {
        const open = s.entities.find((e) => e.id === fin.id)?.alive;
        strip.material = open ? stripLight : strip.material;
      }
      
      for (const e of s.entities) {
        const v = h.views.get(e.id);
        if (!v || !e.alive) continue;
        if (e.kind === 'ace') {
          v.scale.x = 1;
          const d = v.getObjectByName('ace');
          const dir = e.dir ?? Math.atan2(e.vy ?? 0, e.vx ?? 1);
          const spun = (e.spun ?? 0) > 0 || e.stage === 'downed';
          d.rotation.z = spun ? s.time * 14 : dir;
          d.rotation.x = Math.cos(dir) < 0 ? Math.PI : 0; 
          const w = v.getObjectByName('aceWings');
          w.rotation.y = Math.sin(s.time * 60 + (e.id?.length ?? 0)) * 0.5;
          const tele = v.getObjectByName('aceTele');
          const t = e.fire && e.fire.t < e.fire.tel;
          tele.material.opacity = t ? 0.5 + 0.4 * Math.sin(s.time * 20) : 0;
        } else if (e.kind === 'glasswing') {
          v.scale.x = 1;
          const w = v.getObjectByName('gwWings');
          w.scale.y = 0.35 + 0.65 * Math.abs(Math.sin(s.time * 9));
          const near = Math.hypot(e.x - pl.x, e.y - pl.y) < 10;
          for (const m of w.children)
            m.material.opacity = m.material.color.getHex() === 0xff8a3c ? (near ? 0.9 : 0.35) : near ? 0.35 : 0.12;
        }
      }
    },
    
    onEvent(e) {
      const t = e.type;
      if (t === 'scrape') {
        h.kick(0.1);
        for (let i = 0; i < 4; i++) h.spark(e.x + Math.cos(i * 1.6) * 0.5, e.y + Math.sin(i * 1.6) * 0.5, 0xffe2a8, 0.4, 0.1);
      }
      if (t === 'graze')
        for (let i = 0; i < 5; i++) h.spark(e.x + Math.cos(i * 1.26) * 0.7, e.y + 0.4 + Math.sin(i * 1.26) * 0.7, 0xffffff, 0.5, 0.12);
      if (t === 'turret') h.spark(e.x, e.y + 0.4, 0x2fe0d0, 0.4, 0.14);
      if (t === 'fluffStick' || t === 'softZip' || t === 'softBump')
        for (let i = 0; i < 5; i++) h.spark(e.x + Math.cos(i) * 0.8, e.y + Math.sin(i) * 0.8, 0xffffff, 0.7, 0.12);
      if (t === 'dartHit' || t === 'aceDown') h.kick(0.08);
      if (t === 'touchdown') h.kick(0.06);
    },
  };
}
