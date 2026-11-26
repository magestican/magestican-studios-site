








import * as THREE from 'three';
import { trackPoint } from './race.js';
import { PICKUPS } from '../../../web-engine/rc/pickups.js';
import { PHASE } from '../../../web-engine/rc/worldEvents.js';
import { SIM_SCALE } from '../../../web-engine/rc/rcTuning.js';

const PAD_SCALE = 2.6; 
const WATER = 0x5fb8ff;
const GUM = 0xff5fa2;

export function buildItems(scene, race, models) {
  const track = race.track;
  const length = track.path.length / SIM_SCALE; 
  
  const ringGeo = new THREE.RingGeometry(0.07, 0.1, 24);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xffd23f, transparent: true, opacity: 0.85, depthWrite: false });
  const pads = race.pickups.pads.map((p, i) => {
    const pt = trackPoint(track, p.s, p.side);
    const g = new THREE.Group();
    const box = models.get('toy_block').box;
    const block = models.get('toy_block').root.clone(true);
    block.position.set(-(box.min.x + box.max.x) / 2, -(box.min.y + box.max.y) / 2, -(box.min.z + box.max.z) / 2);
    const spin = new THREE.Group();
    spin.add(block);
    spin.scale.setScalar(PAD_SCALE);
    g.add(spin);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.004;
    g.add(ring);
    g.position.set(pt.x, pt.y, pt.z);
    scene.add(g);
    return { g, spin, ring, phase: i * 0.7, half: ((box.max.y - box.min.y) / 2) * PAD_SCALE };
  });

  
  const world = race.world.list.map((e) => {
    const mat = new THREE.MeshBasicMaterial({ color: WATER, transparent: true, opacity: 0, depthWrite: false });
    const mesh = new THREE.Mesh(stripGeometry(track, e.s0, e.span, e.side ?? 0, e.half), mat);
    mesh.renderOrder = 2;
    scene.add(mesh);
    let spray = null;
    if (e.sweep) {
      const n = 90;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
      spray = new THREE.Points(geo, new THREE.PointsMaterial({
        color: 0xd8f0ff, size: 0.025, transparent: true, opacity: 0.9, depthWrite: false,
      }));
      spray.visible = false;
      spray.userData.seed = Array.from({ length: n }, (_, k) => [Math.sin(k * 12.9898) * 0.5 + 0.5, (k * 0.618) % 1]);
      scene.add(spray);
    }
    return { e, mesh, spray };
  });

  
  const live = new Map();
  const discGeo = new THREE.CircleGeometry(1, 28);
  const blobGeo = new THREE.SphereGeometry(0.045, 14, 10);
  function meshFor(h) {
    let o;
    if (h.id === 'marble') {
      const box = models.get('marble').box;
      const inner = models.get('marble').root.clone(true);
      inner.position.set(-(box.min.x + box.max.x) / 2, -(box.min.y + box.max.y) / 2, -(box.min.z + box.max.z) / 2);
      o = new THREE.Group();
      o.add(inner);
      o.scale.setScalar(3.5); 
      o.userData.lift = ((box.max.y - box.min.y) / 2) * 3.5;
    } else if (h.id === 'gum') {
      o = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({ color: GUM }));
      o.scale.setScalar(PICKUPS.gum.radius);
      o.rotation.x = -Math.PI / 2;
      o.userData.lift = 0.003;
    } else if (h.id === 'band') {
      
      o = new THREE.Group();
      o.add(models.get('rubber_band').root.clone(true));
      o.userData.lift = 0.03;
    } else if (h.id === 'fan') {
      
      
      
      o = new THREE.Group();
      const fan = models.get('desk_fan').root.clone(true);
      const blades = fan.getObjectByName('blades');
      const pivot = new THREE.Group();
      if (blades) {
        const hub = new THREE.Box3().setFromObject(blades).getCenter(new THREE.Vector3());
        blades.parent.add(pivot);
        pivot.position.copy(hub);
        pivot.add(blades);
        blades.position.sub(hub);
      }
      const gust = new THREE.Mesh(new THREE.PlaneGeometry(1, PICKUPS.fan.zone * 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, depthWrite: false }));
      gust.rotation.x = -Math.PI / 2;
      gust.position.y = 0.004;
      gust.renderOrder = 3;
      o.add(fan, gust);
      o.userData = { blades: pivot, gust, lift: 0 };
    } else {
      o = new THREE.Group();
      const blob = new THREE.Mesh(blobGeo, new THREE.MeshStandardMaterial({
        color: WATER, transparent: true, opacity: 0.85, roughness: 0.15,
      }));
      const patch = new THREE.Mesh(discGeo, new THREE.MeshBasicMaterial({
        color: WATER, transparent: true, opacity: 0.5, depthWrite: false,
      }));
      patch.rotation.x = -Math.PI / 2;
      patch.scale.setScalar(PICKUPS.balloon.radius);
      patch.position.y = 0.004;
      patch.renderOrder = 3;
      o.add(blob, patch);
      o.userData = { blob, patch, lift: 0 };
    }
    scene.add(o);
    return o;
  }

  function draw(clock) {
    pads.forEach((p, i) => {
      const ready = race.pickups.pads[i].ready;
      p.g.visible = ready;
      p.spin.rotation.y = clock * 2.2 + p.phase;
      p.spin.rotation.x = 0.35;
      p.spin.position.y = p.half + 0.03 + Math.sin(clock * 3 + p.phase) * 0.012;
    });
    const seen = new Set();
    for (const h of race.pickups.hazards) {
      seen.add(h);
      let o = live.get(h);
      if (!o) { o = meshFor(h); live.set(h, o); }
      const pt = trackPoint(track, h.s, h.side);
      o.position.set(pt.x, pt.y + o.userData.lift, pt.z);
      if (h.id === 'marble') o.rotation.set(clock * 18, -pt.heading, 0);
      if (h.id === 'fan') {
        
        o.rotation.y = pt.heading;
        o.userData.blades.rotation.x = clock * 30;
        o.userData.gust.material.opacity = 0.18 * Math.min(1, (PICKUPS.fan.life - h.age) / 1.5) * (0.7 + 0.3 * Math.sin(clock * 14));
      }
      if (h.id === 'balloon') {
        const P = PICKUPS.balloon;
        const { blob, patch } = o.userData;
        blob.visible = !h.landed;
        patch.visible = h.landed;
        if (!h.landed) {
          const t = Math.min(1, h.age / P.flight);
          blob.position.y = 0.05 + Math.sin(t * Math.PI) * 0.22;
        } else {
          patch.material.opacity = 0.5 * Math.min(1, (P.life - h.age) / 1.5);
        }
      }
    }
    for (const [h, o] of live) {
      if (seen.has(h)) continue;
      scene.remove(o);
      live.delete(h);
    }
    for (const w of world) {
      const { e } = w;
      
      let op = 0;
      if (e.phase === PHASE.WARN) op = 0.18 * Math.min(1, e.t / e.warn) * (0.6 + 0.4 * Math.sin(clock * 9));
      else if (e.phase === PHASE.ON) op = e.sweep ? 0.22 : 0.42;
      w.mesh.material.opacity = op;
      w.mesh.visible = op > 0.01;
      if (w.spray) {
        w.spray.visible = e.phase !== PHASE.IDLE;
        if (w.spray.visible) sprayAt(w.spray, track, e, clock, length);
      }
    }
  }
  return { draw };
}


function stripGeometry(track, s0, span, side, half) {
  const steps = Math.max(4, Math.ceil(span / 0.25));
  const pos = [];
  const idx = [];
  for (let i = 0; i <= steps; i += 1) {
    const s = s0 + (span * i) / steps;
    const a = trackPoint(track, s, side - half);
    const b = trackPoint(track, s, side + half);
    pos.push(a.x, a.y + 0.005, a.z, b.x, b.y + 0.005, b.z);
    if (i < steps) { const k = i * 2; idx.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}


function sprayAt(points, track, e, clock, length) {
  const at = trackPoint(track, ((e.arc % length) + length) % length, e.side ?? 0);
  const arr = points.geometry.attributes.position.array;
  const seed = points.userData.seed;
  const strength = e.phase === PHASE.WARN ? Math.min(1, e.t / e.warn) * 0.5 : 1;
  for (let k = 0; k < seed.length; k += 1) {
    const [a, ph] = seed[k];
    const t = (clock * 1.1 + ph) % 1;
    const ang = a * Math.PI * 2;
    const r = t * 0.9 * strength;
    arr[k * 3] = at.x + Math.cos(ang) * r;
    arr[k * 3 + 1] = at.y + 0.04 + (0.5 * strength) * 4 * t * (1 - t);
    arr[k * 3 + 2] = at.z + Math.sin(ang) * r;
  }
  points.geometry.attributes.position.needsUpdate = true;
}
