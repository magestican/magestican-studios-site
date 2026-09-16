










import * as THREE from 'three';
import { CUSTOMER, live, walkerPose } from 'moon/play/customers.mjs';
import { customerLookFor, customerLooks, customerName } from 'moon/play/people.mjs';
import { villagerObject } from '../render/villager.js';

export const CUSTOMERS_DRAW = Object.freeze({
  
  spareLooks: 1,
  
  lod: 1,
});

export async function createCustomersDraw({ scene, season, worldSeed = 1, heightAt, count = CUSTOMER.maxWalkers, cfg = CUSTOMERS_DRAW }) {
  const pool = [];
  for (const look of customerLooks(count + cfg.spareLooks, { worldSeed })) {
    const pc = await villagerObject(look.species, { seed: look.seed, season, lod: cfg.lod, build: look.build });
    pc.object.visible = false;
    pc.object.name = `customer-${look.key}`;
    scene.add(pc.object);
    pool.push({ pc, look, visit: null, name: '' });
  }
  const triangles = pool.reduce((n, p) => n + (p.pc.object.userData.triangles || 0), 0);
  let shown = [];

  
  function update(visits, route, now, dt) {
    const walking = route ? live(visits, now) : [];
    const ids = new Set(walking.map((v) => v.id));
    for (const slot of pool) if (slot.visit && !ids.has(slot.visit)) slot.visit = null;
    for (const v of walking) {
      if (pool.some((slot) => slot.visit === v.id)) continue;
      const free = pool.map((slot, i) => (slot.visit ? -1 : i)).filter((i) => i >= 0);
      const i = customerLookFor(v.id, free);
      if (i === null) continue;
      pool[i].visit = v.id;
      pool[i].name = customerName(v.id, pool[i].look.build);
    }
    shown = [];
    for (const slot of pool) {
      const v = slot.visit && walking.find((w) => w.id === slot.visit);
      if (!v) { slot.pc.object.visible = false; continue; }
      const pose = walkerPose(v, route, now);
      const o = slot.pc.object;
      o.visible = pose.scale > 0.001;
      o.position.set(pose.x, heightAt(pose.x, pose.z), pose.z);
      o.rotation.y = pose.heading;
      o.scale.setScalar(Math.max(0.001, pose.scale));
      slot.pc.update(dt, { speed: pose.speed });
      shown.push({
        id: v.id, name: slot.name, species: slot.look.species, build: slot.look.build || null, seed: slot.look.seed,
        x: pose.x, z: pose.z, phase: pose.phase, good: v.good, coins: v.coins, triangles: o.userData.triangles || 0,
      });
    }
  }

  return {
    update,
    get shown() { return shown; },
    
    get triangles() { return triangles; },
    
    get drawnTriangles() { return shown.reduce((n, c) => n + c.triangles, 0); },
    worldPosition(id, out = new THREE.Vector3()) {
      const slot = pool.find((s) => s.visit === id);
      return slot ? out.copy(slot.pc.object.position) : null;
    },
  };
}
