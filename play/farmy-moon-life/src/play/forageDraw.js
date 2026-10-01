
















import * as THREE from 'three';
import { forageIsReady } from 'moon/economy/world.mjs';
import { batchSpots, spotYaw } from 'moon/play/forageBatch.mjs';
import { forageMeshCached, foragePrimed, primeForage } from '../render/forage.js';
import { toObject3D } from '../render/toMesh.js';



export const FORAGE_DRAW_M = 12;






export function createForageDraw({ scene, season, spots, heightAt, meshFor = forageMeshCached, prime: primeIn = null, isMade = foragePrimed, drawM = FORAGE_DRAW_M, onProblems = () => {} }) {
  const group = new THREE.Group();
  group.name = 'forage';
  scene.add(group);
  const slots = spots.map((spot) => ({ spot, want: null }));
  let prime = primeIn;
  const stats = { drawn: 0, loading: 0, ready: 0, changes: 0, shown: [], batches: 0, waited: 0 };

  
  async function primeAll(from = { x: 0, z: 0 }) {
    if (!prime) return 0;
    const order = [...spots].sort((a, b) => Math.hypot(a.x - from.x, a.z - from.z) - Math.hypot(b.x - from.x, b.z - from.z));
    let n = 0;
    for (const stage of ['ready', 'picked']) {
      for (const s of order) if (await prime(s.type, { seed: s.id + 1, season, stage }, { background: true })) n += 1;
    }
    return n;
  }
  let triangles = 0;
  let batch = null;   
  let token = 0;

  async function rebuild() {
    const mine = ++token;
    stats.loading += 1;
    try {
      
      
      
      
      if (prime) {
        const missing = slots.filter((slot) => slot.want !== null && !isMade(slot.spot.type, { seed: slot.spot.id + 1, season, stage: slot.want }));
        if (missing.length) {
          stats.waited += 1;
          await Promise.all(missing.map((slot) => prime(slot.spot.type, { seed: slot.spot.id + 1, season, stage: slot.want })));
          if (mine !== token) return;
        }
      }
      const pieces = [];
      for (const slot of slots) {
        if (slot.want === null) continue;
        const s = slot.spot;
        pieces.push({ data: meshFor(s.type, { seed: s.id + 1, season, stage: slot.want }), x: s.x, y: heightAt(s.x, s.z), z: s.z, yaw: spotYaw(s.id) });
      }
      const data = batchSpots(pieces);
      const obj = data.triangleCount ? await toObject3D(data) : null;
      if (mine !== token) return;
      if (batch) {
        group.remove(batch);
        batch.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      }
      batch = obj;
      triangles = data.triangleCount;
      stats.drawn = pieces.length;
      stats.batches += 1;
      if (obj) {
        obj.name = 'forage-batch';
        obj.userData.triangles = triangles;
        group.add(obj);
      }
    } catch (e) {
      onProblems([`forage batch: ${e && e.message ? e.message : e}`]);
    } finally {
      stats.loading -= 1;
    }
  }

  
  function update(world, t, focus) {
    let ready = 0, changed = false;
    for (const slot of slots) {
      const s = slot.spot;
      const isReady = forageIsReady(world.forage[s.id], t);
      if (isReady) ready += 1;
      const near = Math.hypot(s.x - focus.x, s.z - focus.z) <= drawM;
      const want = near ? (isReady ? 'ready' : 'picked') : null;
      if (want !== slot.want) {
        stats.changes += 1;
        slot.want = want;
        changed = true;
      }
    }
    stats.ready = ready;
    if (changed) rebuild();
  }

  
  
  return { update, primeAll, enablePrime: (fn = primeForage) => { prime = fn; }, stats, group, get triangles() { return triangles; } };
}
