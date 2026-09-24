





















import * as THREE from 'three';
import { itemObject } from '../render/items.js';
import { CARRY_LIFT, containerObject } from '../render/container.js';
import { stepPart, REST } from 'moon/play/parts.mjs';








export const FIND_DRAW_M = 11;
export const FIND_DRAW_MAX = 8;


export const CARRY_BOB_M = 0.025;
export const CARRY_SPIN_PER_S = Math.PI * 0.35;
const HALO_RADIUS_M = 0.5;
const HALO_COLOUR = 0xfff0c0;

export function createFindsDraw({ scene, season, drawM = FIND_DRAW_M, drawMax = FIND_DRAW_MAX, onProblems = () => {} }) {
  const group = new THREE.Group();
  group.name = 'finds';
  scene.add(group);

  const haloGeometry = new THREE.CircleGeometry(HALO_RADIUS_M, 20);
  const haloMaterial = new THREE.MeshBasicMaterial({
    color: HALO_COLOUR, transparent: true, opacity: 0.2, depthWrite: false, blending: THREE.AdditiveBlending, fog: false,
  });

  
  
  let slots = [];
  let planetToken = 0;
  let triangles = 0;
  
  const stats = { planet: null, drawn: 0, loading: 0, ready: 0, taken: 0, changes: 0, lid: 0 };
  const lidAxis = new THREE.Vector3();
  const lidOf = (box) => {
    let bone = null;
    box.traverse((o) => { if (!bone && o.userData.part && o.userData.part.name === 'lid') bone = o; });
    return bone;
  };

  function drop(slot) {
    if (slot.box) stats.drawn -= 1;
    for (const key of ['box', 'carry', 'halo']) {
      const obj = slot[key];
      if (!obj) continue;
      group.remove(obj);
      triangles -= obj.userData.triangles || 0;
      if (key === 'halo') obj.material.dispose();
      slot[key] = null;
    }
  }

  function clear() {
    for (const slot of slots) drop(slot);
    slots = [];
    triangles = 0;
    stats.drawn = 0;
    stats.loading = 0;
  }

  
  
  function build(slot, state) {
    if (slot.want === state) return;
    
    
    
    if (slot.want === 'full' && state === 'empty' && slot.box && slot.find.container === 'chest' && lidOf(slot.box)) {
      slot.want = state;
      slot.lid = { bone: lidOf(slot.box), state: REST };
      if (slot.halo) { group.remove(slot.halo); slot.halo.material.dispose(); slot.halo = null; }
      return;
    }
    slot.lid = null;
    slot.want = state;
    stats.changes += 1;
    const token = ++slot.token;
    const planet = planetToken;
    drop(slot);
    if (state === null) return;
    const f = slot.find;
    const open = f.container === 'chest' && state === 'empty';
    stats.loading += 1;
    containerObject(f.container, { style: f.style, season, open })
      .then(async (box) => {
        if (token !== slot.token || planet !== planetToken) return;
        box.position.set(f.x, f.y, f.z);
        box.rotation.y = f.rotY;
        box.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
        group.add(box);
        slot.box = box;
        triangles += box.userData.triangles || 0;
        stats.loading -= 1;
        stats.drawn += 1;

        
        if (state === 'full' && f.container !== 'chest') {
          const item = await itemObject(f.good, { seed: 1 + (f.id % 3), season });
          if (token !== slot.token || planet !== planetToken) return;
          const lift = (box.userData.top || 0.4) * (CARRY_LIFT[f.container] ?? 1);
          item.position.set(f.x, f.y + lift, f.z);
          item.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
          group.add(item);
          slot.carry = item;
          slot.carryLift = lift;
          triangles += item.userData.triangles || 0;
        }
        
        
        if (state === 'full' && f.treasure) {
          const halo = new THREE.Mesh(haloGeometry, haloMaterial.clone());
          halo.position.set(f.x, f.y + 0.02, f.z);
          halo.rotation.x = -Math.PI / 2;
          halo.frustumCulled = false;
          group.add(halo);
          slot.halo = halo;
        }
      })
      .catch((e) => {
        stats.loading -= 1;
        onProblems([`find ${f.kind} ${f.id} in a ${f.container}: ${e && e.message ? e.message : e}`]);
      });
  }

  return {
    group,
    get triangles() { return triangles; },
    get stats() {
      return {
        ...stats,
        shown: slots.filter((s) => s.box).map((s) => s.find.id),
        full: slots.filter((s) => s.want === 'full').map((s) => s.find.id),
      };
    },

    




    show(planetId, finds) {
      planetToken += 1;
      clear();
      stats.planet = planetId;
      if (planetId === null) { stats.ready = 0; stats.taken = 0; return; }
      slots = finds.map((find) => ({
        find, want: undefined, token: 0, box: null, carry: null, halo: null, carryLift: 0,
        phase: (find.id * 2.39996) % (Math.PI * 2),
      }));
      stats.ready = finds.filter((f) => f.ready).length;
      stats.taken = finds.length - stats.ready;
    },

    





    refresh(finds) {
      if (finds.length !== slots.length) return false;
      let ready = 0;
      for (let i = 0; i < slots.length; i++) {
        if (slots[i].find.id !== finds[i].id) return false;
        slots[i].find = finds[i];
        if (finds[i].ready) ready += 1;
      }
      stats.ready = ready;
      stats.taken = finds.length - ready;
      return true;
    },

    



    update(seconds, focus) {
      
      
      
      const ranked = focus
        ? slots
          .map((slot) => ({ slot, d: Math.hypot(slot.find.x - focus.x, slot.find.z - focus.z) }))
          .filter((e) => e.d <= drawM)
          .sort((a, b) => a.d - b.d)
          .slice(0, drawMax)
        : slots.map((slot) => ({ slot, d: 0 }));
      const near = new Set(ranked.map((e) => e.slot));
      for (const slot of slots) {
        const f = slot.find;
        build(slot, near.has(slot) ? (f.ready ? 'full' : 'empty') : null);
        if (slot.carry) {
          slot.carry.position.y = f.y + slot.carryLift + Math.sin(seconds * 2 + slot.phase) * CARRY_BOB_M;
          slot.carry.rotation.y = slot.phase + seconds * CARRY_SPIN_PER_S;
        }
        if (slot.lid) {
          const { bone, state: prev } = slot.lid;
          const p = bone.userData.part;
          slot.lid.state = stepPart(p.clip, prev, { t: seconds, dt: Math.min(0.1, Math.max(0, seconds - (slot.lid.t ?? seconds))), open: 1 });
          slot.lid.t = seconds;
          bone.quaternion.setFromAxisAngle(lidAxis.set(p.axis[0], p.axis[1], p.axis[2]), slot.lid.state.angle);
          stats.lid = Math.max(stats.lid, slot.lid.state.angle);
        }
        if (slot.halo) slot.halo.material.opacity = 0.14 + 0.1 * (0.5 + 0.5 * Math.sin(seconds * 2 + slot.phase));
      }
    },

    dispose() {
      clear();
      scene.remove(group);
      haloGeometry.dispose();
      haloMaterial.dispose();
    },
  };
}
