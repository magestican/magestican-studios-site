







import * as THREE from 'three';
import { forageIsReady } from 'moon/economy/world.mjs';
import { forageObject } from '../render/forage.js';



export const FORAGE_DRAW_M = 12;

export function createForageDraw({ scene, season, spots, heightAt, objectFor = forageObject, drawM = FORAGE_DRAW_M, onProblems = () => {} }) {
  const group = new THREE.Group();
  group.name = 'forage';
  scene.add(group);
  const slots = spots.map((spot) => ({ spot, want: null, token: 0, obj: null }));
  const stats = { drawn: 0, loading: 0, ready: 0, changes: 0, shown: [] };
  let triangles = 0;

  function show(slot, stage) {
    slot.want = stage;
    const token = ++slot.token;
    if (slot.obj) {
      group.remove(slot.obj);
      triangles -= slot.obj.userData.triangles || 0;
      slot.obj = null;
    }
    if (stage === null) return;
    stats.loading += 1;
    const s = slot.spot;
    Promise.resolve(objectFor(s.type, { seed: s.id + 1, season, stage }))
      .then((obj) => {
        if (!obj || token !== slot.token) return;
        obj.position.set(s.x, heightAt(s.x, s.z), s.z);
        obj.rotation.y = (s.id * 2.39996) % (Math.PI * 2);
        group.add(obj);
        slot.obj = obj;
        triangles += obj.userData.triangles || 0;
      })
      .catch((e) => onProblems([`forage ${s.type} ${s.id}: ${e && e.message ? e.message : e}`]))
      .finally(() => { stats.loading -= 1; });
  }

  
  function update(world, t, focus) {
    let ready = 0, drawn = 0;
    for (const slot of slots) {
      const s = slot.spot;
      const isReady = forageIsReady(world.forage[s.id], t);
      if (isReady) ready += 1;
      const near = Math.hypot(s.x - focus.x, s.z - focus.z) <= drawM;
      const want = near ? (isReady ? 'ready' : 'picked') : null;
      if (want !== slot.want) {
        stats.changes += 1;
        show(slot, want);
      }
      if (slot.obj) drawn += 1;
    }
    stats.ready = ready;
    stats.drawn = drawn;
  }

  
  
  return { update, stats, group, get triangles() { return triangles; } };
}
