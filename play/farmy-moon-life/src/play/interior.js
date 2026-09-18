




























import * as THREE from 'three';
import { houseRoomObject } from '../render/houseRoom.js';

export function createInteriorDraw({ scene, season = 'summer', objectFor = houseRoomObject, onProblems = () => {} }) {
  const group = new THREE.Group();
  group.name = 'interior';
  group.visible = false;
  scene.add(group);

  const stats = { species: null, seed: null, shown: false, loading: 0, triangles: 0, builds: 0, key: null };
  let obj = null;
  let token = 0;

  




  async function show(home) {
    const key = `${home.species}|${home.seed}`;
    if (obj && stats.key === key) {
      group.visible = true;
      stats.shown = true;
      return true;
    }
    const mine = ++token;
    stats.loading += 1;
    try {
      const next = await objectFor(home.species, { seed: home.seed, season, lod: 0 });
      if (mine !== token) return false;
      if (obj) group.remove(obj);
      next.position.set(0, 0, 0);
      next.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
      group.add(next);
      obj = next;
      stats.key = key;
      stats.species = home.species;
      stats.seed = home.seed;
      stats.triangles = next.userData.triangles || 0;
      stats.builds += 1;
      group.visible = true;
      stats.shown = true;
      return true;
    } catch (e) {
      onProblems([`house room ${key}: ${e && e.message ? e.message : e}`]);
      return false;
    } finally {
      stats.loading -= 1;
    }
  }

  function hide() {
    group.visible = false;
    stats.shown = false;
  }

  return { show, hide, group, stats };
}
