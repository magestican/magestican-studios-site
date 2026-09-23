




























import * as THREE from 'three';
import { houseRoomObject } from '../render/houseRoom.js';

export function createInteriorDraw({ scene, season = 'summer', objectFor = houseRoomObject, onProblems = () => {} }) {
  const group = new THREE.Group();
  group.name = 'interior';
  group.visible = false;
  scene.add(group);

  const stats = { species: null, seed: null, shown: false, loading: 0, triangles: 0, builds: 0, key: null, panes: 0 };
  let obj = null;
  let token = 0;
  
  
  
  
  
  const paneMaterial = new THREE.MeshBasicMaterial({ color: 0xbfe2f2, fog: false });
  paneMaterial.name = 'window-sky';
  const panesOf = (root) => {
    let n = 0;
    root.traverse((o) => { if (o.isMesh && o.material && o.material.name === 'glass') { o.material = paneMaterial; n += 1; } });
    return n;
  };

  




  async function show(home) {
    
    const storeys = (home.room && home.room.storeys) || 1, storey = (home.room && home.room.storey) || 0;
    
    const work = (home.room && home.room.work) || null, level = (home.room && home.room.level) || 1;
    const key = work ? `work|${work}|${home.seed}|l${level}` : storeys === 2 ? `${home.species}|${home.seed}|floor${storey}` : `${home.species}|${home.seed}`;
    if (obj && stats.key === key) {
      group.visible = true;
      stats.shown = true;
      return true;
    }
    const mine = ++token;
    stats.loading += 1;
    try {
      const next = await objectFor(home.species, { seed: home.seed, season, lod: 0, ...(storeys === 2 ? { storeys, storey } : {}), ...(work ? { work, level } : {}) });
      if (mine !== token) return false;
      if (obj) group.remove(obj);
      next.position.set(0, 0, 0);
      next.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
      stats.panes = panesOf(next);
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

  
  function sky(rgb) {
    paneMaterial.color.setRGB(rgb[0], rgb[1], rgb[2]);
  }

  return { show, hide, sky, group, stats, paneMaterial };
}
