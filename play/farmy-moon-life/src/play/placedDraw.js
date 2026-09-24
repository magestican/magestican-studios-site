














import * as THREE from 'three';
import { decorAnchors, decorObject } from '../render/decor.js';

export const PLACED = Object.freeze({
  
  
  drawM: 14,
  maxShown: 24,
  
  lod1M: 9,
  lod2M: 18,
  
  ghostLift: 0.01,
});

const lodFor = (d, cfg) => (d < cfg.lod1M ? 0 : d < cfg.lod2M ? 1 : 2);










export function createPlacedDraw({
  scene, season, heightAt, objectFor = decorObject, cfg = PLACED,
  select = () => true, name = 'placed', onProblems = () => {}, parts = null,
}) {
  const group = new THREE.Group();
  group.name = name;
  scene.add(group);
  const ghostGroup = new THREE.Group();
  ghostGroup.name = `${name}-ghost`;
  scene.add(ghostGroup);

  const slots = new Map(); 
  const stats = { drawn: 0, loading: 0, placed: 0, changes: 0, ghost: null, ghostOk: null };
  let triangles = 0;
  let ghostKey = null, ghostToken = 0, ghostObj = null;

  function clear(slot) {
    if (!slot.obj) return;
    if (parts) parts.release(slot.obj);
    group.remove(slot.obj);
    triangles -= slot.obj.userData.triangles || 0;
    slot.obj = null;
  }

  function show(id, p, want) {
    let slot = slots.get(id);
    if (!slot) {
      slot = { want: null, token: 0, obj: null };
      slots.set(id, slot);
    }
    if (slot.want === want) return;
    stats.changes += 1;
    slot.want = want;
    const token = ++slot.token;
    clear(slot);
    if (want === null) return;
    stats.loading += 1;
    Promise.resolve(objectFor(p.item, { season, lod: want.lod }))
      .then((obj) => {
        if (!obj || token !== slot.token) return;
        obj.position.set(p.spot.x, heightAt(p.spot.x, p.spot.z), p.spot.z);
        obj.rotation.y = p.spot.rotY || 0;
        group.add(obj);
        if (parts) parts.adopt(obj); 
        slot.obj = obj;
        triangles += obj.userData.triangles || 0;
      })
      .catch((e) => onProblems([`placed ${p.item} ${id}: ${e && e.message ? e.message : e}`]))
      .finally(() => { stats.loading -= 1; });
  }

  
  function update(world, focus) {
    const list = (world.placed || []).filter((p) => p.spot && select(p));
    stats.placed = list.length;
    
    const near = list
      .map((p) => ({ p, d: Math.hypot(p.spot.x - focus.x, p.spot.z - focus.z) }))
      .sort((a, b) => a.d - b.d)
      .slice(0, cfg.maxShown);
    const wanted = new Map();
    for (const { p, d } of near) {
      
      
      const reach = cfg.drawM + decorAnchors(p.item).r * 4;
      if (d <= reach) wanted.set(p.id, { lod: lodFor(d, cfg), key: `${p.item}|${p.spot.x}|${p.spot.z}|${p.spot.rotY || 0}` });
    }
    for (const { p } of near) {
      const want = wanted.get(p.id) || null;
      const slot = slots.get(p.id);
      const same = slot && slot.want && want && slot.want.lod === want.lod && slot.want.key === want.key;
      if (!same) show(p.id, p, want);
    }
    
    for (const [id, slot] of slots) {
      if (wanted.has(id)) continue;
      if (slot.want !== null) {
        stats.changes += 1;
        slot.want = null;
        slot.token += 1;
        clear(slot);
      }
      if (!list.some((p) => p.id === id)) slots.delete(id);
    }
    let drawn = 0;
    for (const slot of slots.values()) if (slot.obj) drawn += 1;
    stats.drawn = drawn;
  }

  





  function ghost(item, spot, ok = true) {
    stats.ghost = item;
    stats.ghostOk = item ? Boolean(ok) : null;
    const key = item ? `${item}|${ok ? 'ok' : 'no'}` : null;
    if (key !== ghostKey) {
      ghostKey = key;
      const token = ++ghostToken;
      if (ghostObj) {
        ghostGroup.remove(ghostObj);
        ghostObj = null;
      }
      if (item) {
        Promise.resolve(objectFor(item, { season, lod: 1 }))
          .then((obj) => {
            if (!obj || token !== ghostToken) return;
            obj.traverse((o) => { if (o.isMesh) o.castShadow = false; });
            ghostGroup.add(obj);
            ghostObj = obj;
          })
          .catch((e) => onProblems([`ghost ${item}: ${e && e.message ? e.message : e}`]));
      }
    }
    if (!ghostObj || !spot) {
      ghostGroup.visible = false;
      return;
    }
    ghostGroup.visible = true;
    ghostObj.position.set(spot.x, heightAt(spot.x, spot.z) + cfg.ghostLift, spot.z);
    ghostObj.rotation.y = spot.rotY || 0;
    
    
    const k = ok ? 1 : 0.35;
    ghostObj.scale.set(1, k, 1);
  }

  return { update, ghost, stats, group, get triangles() { return triangles; } };
}
