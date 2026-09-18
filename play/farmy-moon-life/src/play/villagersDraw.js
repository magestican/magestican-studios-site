

































import { villagerPose } from 'moon/play/village.mjs';
import { villagerBuild } from 'moon/play/people.mjs';
import { villagerObject } from '../render/villager.js';

export const VILLAGERS_DRAW = Object.freeze({
  catchUpMps: 2.4,
  snapM: 4,
  turnPerS: 9,
  fadeS: 0.5,
  drawM: 30,
  shadowM: 3.5,
  lod1M: 9.5,
  lod2M: 11,
  
  seedBase: 11,
});


const LODS = [1, 2];

export async function createVillagersDraw({ scene, season, playerSeed, heightAt, village, cfg = VILLAGERS_DRAW }) {
  const slots = new Map();
  let shown = [], held = null;

  async function sync(world) {
    let i = 0;
    for (const v of world.villagers) {
      i += 1;
      if (slots.has(v.id)) continue;
      let seed = cfg.seedBase + i - 1;
      if (seed === playerSeed) seed += 20;
      const build = villagerBuild(v, world.villagers);
      const lods = [];
      for (const lod of LODS) {
        const pc = await villagerObject(v.species, { seed, season, lod, build });
        pc.object.visible = false;
        pc.meshes = [];
        pc.object.traverse((o) => { if (o.isMesh) { o.castShadow = false; pc.meshes.push(o); } });
        scene.add(pc.object);
        lods.push(pc);
      }
      slots.set(v.id, {
        lods, lod: 0, shadow: null, species: v.species, build, seed,
        
        height: lods[0].height_m || lods[0].height || 1,
        x: null, z: null, heading: 0, scale: 0, bob: 0,
      });
    }
  }

  function castShadows(s, on) {
    if (s.shadow === on) return;
    s.shadow = on;
    for (const m of s.lods[s.lod].meshes) m.castShadow = on;
  }

  
  
  
  
  
  function update(world, t, dt, { animDt = dt, focus = null, activity = 0, poseFor = null } = {}) {
    shown = [];
    let nearest = null, nearestD = cfg.shadowM;
    const drawn = [];
    for (const v of world.villagers) {
      const s = slots.get(v.id);
      if (!s) continue;
      const pose = (poseFor && poseFor(v, t)) || villagerPose(village, world, v, t);
      const isHeld = Boolean(held && held.id === v.id && s.x !== null);
      let tx = pose.x, tz = pose.z, th = pose.heading, moved = 0;
      if (isHeld) { tx = s.x; tz = s.z; th = Math.atan2(held.x - s.x, held.z - s.z); }
      if (s.x === null || Math.hypot(tx - s.x, tz - s.z) > cfg.snapM) {
        s.x = tx; s.z = tz; s.heading = th;
      } else {
        const d = Math.hypot(tx - s.x, tz - s.z);
        if (d > 1e-6) {
          const k = Math.min(d, cfg.catchUpMps * dt);
          
          if (d - k > 0.05) th = Math.atan2(tx - s.x, tz - s.z);
          s.x += ((tx - s.x) / d) * k;
          s.z += ((tz - s.z) / d) * k;
          moved = k;
        }
      }
      const err = Math.atan2(Math.sin(th - s.heading), Math.cos(th - s.heading));
      s.heading += err * Math.min(1, dt * cfg.turnPerS);
      const want = pose.inside && !isHeld ? 0 : 1;
      s.scale += Math.sign(want - s.scale) * Math.min(Math.abs(want - s.scale), dt / cfg.fadeS);
      const fromFocus = focus ? Math.hypot(s.x - focus.x, s.z - focus.z) : 0;
      
      const lod = isHeld ? 0 : s.lod === 0 ? (fromFocus > cfg.lod2M ? 1 : 0) : (fromFocus < cfg.lod1M ? 0 : 1);
      if (lod !== s.lod) {
        castShadows(s, false);
        s.lods[s.lod].object.visible = false;
        s.lod = lod;
        s.shadow = null;
      }
      const pc = s.lods[s.lod];
      const o = pc.object;
      o.visible = s.scale > 0.001 && fromFocus <= cfg.drawM;
      if (o.visible && !isHeld && fromFocus < nearestD) { nearestD = fromFocus; nearest = s; }
      o.position.set(s.x, heightAt(s.x, s.z), s.z);
      o.rotation.y = s.heading;
      
      s.bob += ((isHeld ? activity : 0) - s.bob) * Math.min(1, dt * 20);
      const k = s.scale;
      o.scale.set(k * (1 - 0.03 * s.bob), k * (1 + 0.06 * s.bob), k * (1 - 0.03 * s.bob));
      const speed = dt > 0 ? moved / dt : 0;
      if (o.visible) pc.update(animDt, { speed });
      drawn.push({ s, isHeld });
      shown.push({
        id: v.id, species: v.species, build: s.build, x: s.x, z: s.z, y: o.position.y, heading: s.heading, speed,
        doing: isHeld ? 'talking' : pose.doing, place: pose.place, inside: pose.inside && s.scale < 0.001,
        visible: o.visible, height: s.height, lod: LODS[s.lod], bob: s.bob, shadow: false,
        triangles: o.visible ? o.userData.triangles || 0 : 0,
      });
    }
    
    drawn.forEach(({ s, isHeld }, i) => {
      castShadows(s, isHeld || s === nearest);
      shown[i].shadow = s.shadow;
    });
  }

  return {
    sync,
    update,
    hold(id, point) { held = { id, x: point.x, z: point.z }; },
    face(point) { if (held) { held.x = point.x; held.z = point.z; } },
    release() { held = null; },
    get held() { return held ? held.id : null; },
    get shown() { return shown; },
    
    get drawnTriangles() { return shown.reduce((n, v) => n + v.triangles, 0); },
    positionOf(id) {
      const v = shown.find((x) => x.id === id);
      return v ? { x: v.x, z: v.z, y: v.y, height: v.height, visible: v.visible, inside: v.inside } : null;
    },
  };
}
