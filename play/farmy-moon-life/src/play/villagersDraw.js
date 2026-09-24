










































import { villagerPose, badgeState } from 'moon/play/village.mjs';
import { greetFor, pairFor, pairMeet, followFor, followPoint, catchUp, isTeleport, noticedBy, CATCH_UP } from 'moon/play/activities.mjs';

const level = (v) => { const b = badgeState(v); return b.level * b.heartsOf + b.hearts; };
import { animStepS } from 'moon/play/animRate.mjs';
import { villagerGesture } from 'moon/play/gestures.mjs';
import { seatClip, seatedRootY, eatClipFor } from 'moon/rig/clips.mjs';
import { villagerBuild } from 'moon/play/people.mjs';
import { faceAt, faceInfluences } from 'moon/rig/face.mjs';
import { faceMeter } from './faceMeter.js';
import { PERSONALITIES, personalityOf } from 'moon/play/personality.mjs';
import { EMPTY_LEDGER, applyEvent, applyLine, moodNow } from 'moon/play/moods.mjs';
import { villagerObject } from '../render/villager.js';
import { villagerSource } from '../render/villagerSource.js';
import { NO_SHADOW_MATERIALS } from 'moon/mesh/meshData.mjs';

const materialOf = (m) => m.name.slice(m.name.lastIndexOf('/') + 1);

export const VILLAGERS_DRAW = Object.freeze({
  
  
  catchUpMps: CATCH_UP.mps,
  turnPerS: 9,
  fadeS: 0.5,
  drawM: 30,
  shadowM: 3.5,
  lod1M: 9.5,
  lod2M: 11,
  
  seedBase: 11,
});


const LODS = [1, 2];



















export function villagerSpecs(world, { season, playerSeed, cfg = VILLAGERS_DRAW } = {}) {
  const out = [];
  let i = 0;
  for (const v of world.villagers) {
    i += 1;
    let seed = cfg.seedBase + i - 1;
    if (seed === playerSeed) seed += 20;
    const build = villagerBuild(v, world.villagers);
    for (const lod of LODS) out.push({ id: v.id, species: v.species, seed, season, lod, build });
  }
  return out;
}

export async function createVillagersDraw({ scene, season, playerSeed, heightAt, village, cfg = VILLAGERS_DRAW, source = null }) {
  const slots = new Map();
  
  
  const ledgers = new Map();
  const faces = new Map();
  const meshes = source || villagerSource();
  let shown = [], held = null;
  
  
  
  let animS = 0;
  
  
  let fullPoses = 0;
  
  let waves = 0;
  
  
  
  let pair = null, lastPairHour = null, pairs = 0, follows = 0, snaps = 0, notices = 0;
  let lastT = null, forceTeleport = false, realS = 0;

  
  
  function missing(world) {
    const by = new Map();
    for (const spec of villagerSpecs(world, { season, playerSeed, cfg })) {
      if (slots.has(spec.id)) continue;
      if (!by.has(spec.id)) by.set(spec.id, { v: world.villagers.find((w) => w.id === spec.id), seed: spec.seed, build: spec.build, specs: [] });
      by.get(spec.id).specs.push(spec);
    }
    return [...by.values()];
  }

  async function sync(world) {
    const todo = missing(world);
    
    
    
    
    
    
    meshes.prefetch(todo.flatMap((t) => t.specs));
    for (const { v, seed, build } of todo) {
      const lods = [];
      for (const lod of LODS) {
        const pc = await villagerObject(v.species, { seed, season, lod, build, source: meshes });
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
        
        
        animAcc: 0, animDist: 0, poses: 0, gestureKey: null,
      });
    }
  }

  function castShadows(s, on) {
    if (s.shadow === on) return;
    s.shadow = on;
    for (const m of s.lods[s.lod].meshes) m.castShadow = on && !NO_SHADOW_MATERIALS.includes(materialOf(m));
  }

  
  
  
  
  
  
  
  
  
  
  
  
  function update(world, t, dt, { animDt = dt, focus = null, activity = 0, poseFor = null, raining = false, useFor = null, player = null } = {}) {
    shown = [];
    animS += animDt;
    realS += dt; 
    let nearest = null, nearestD = cfg.shadowM;
    const drawn = [];
    const jump = isTeleport({ lastT, t, dt, forced: forceTeleport });
    lastT = t;
    forceTeleport = false;
    const poses = new Map();
    for (const v of world.villagers) {
      if (slots.has(v.id)) poses.set(v.id, (poseFor && poseFor(v, t)) || villagerPose(village, world, v, t, { activities: true, raining }));
    }
    
    
    if (pair && (realS >= pair.untilS || [pair.a, pair.b].some((id) => { const p = poses.get(id); return !p || p.inside || (held && held.id === id); }))) pair = null;
    if (!pair && !poseFor && !jump) {
      const cand = [];
      for (const [id, p] of poses) {
        const s = slots.get(id);
        if (s.x !== null && s.visible && !(held && held.id === id)) cand.push({ id, x: s.x, z: s.z, doing: p.doing });
      }
      const pf = pairFor(cand, t / 3_600_000, lastPairHour, { seed: world.seed || 0 });
      if (pf) {
        const A = slots.get(pf.a), B = slots.get(pf.b);
        const meet = pairMeet({ x: A.x, z: A.z }, { x: B.x, z: B.z });
        pair = { a: pf.a, b: pf.b, chatS: pf.chatS, untilS: realS + 30, met: new Set(), at: { [pf.a]: meet.a, [pf.b]: meet.b } };
        lastPairHour = pf.hour;
        pairs += 1;
      }
    }
    for (const v of world.villagers) {
      const s = slots.get(v.id);
      if (!s) continue;
      const pose = poses.get(v.id);
      const isHeld = Boolean(held && held.id === v.id && s.x !== null);
      let tx = pose.x, tz = pose.z, th = pose.heading, moved = 0;
      const pairing = pair && pair.at[v.id] && !isHeld ? pair.at[v.id] : null;
      
      const free = Boolean(player) && !isHeld && !pairing && !pose.inside && pose.speed === 0 && !pose.use && pose.doing !== 'working';
      const fol = followFor({ personality: personalityOf(v), hearts: level(v), distM: player && s.x !== null ? Math.hypot(s.x - player.x, s.z - player.z) : Infinity, nowS: realS, free, state: s.follow || null });
      s.follow = fol.state;
      const following = fol.following && player && s.x !== null;
      if (following && !s.wasFollowing) follows += 1;
      s.wasFollowing = following;
      const use = !isHeld && !pairing && !following && useFor ? useFor(v, pose) : null;
      if (use) { tx = use.at.x; tz = use.at.z; th = use.heading; }
      if (pairing) { tx = pairing.x; tz = pairing.z; th = pairing.heading; }
      if (following) { const f = followPoint(player, s); tx = f.x; tz = f.z; th = f.heading; }
      if (isHeld) { tx = s.x; tz = s.z; th = Math.atan2(held.x - s.x, held.z - s.z); }
      const stepTo = catchUp(s, { x: tx, z: tz }, dt, { teleport: jump || !s.visible });
      if (stepTo.snapped) {
        if (s.x !== null && Math.hypot(tx - s.x, tz - s.z) > 1e-3) snaps += 1;
        s.x = stepTo.x; s.z = stepTo.z; s.heading = th;
      } else if (stepTo.moved > 0) {
        
        if (Math.hypot(tx - stepTo.x, tz - stepTo.z) > 0.05) th = Math.atan2(tx - s.x, tz - s.z);
        s.x = stepTo.x; s.z = stepTo.z;
        moved = stepTo.moved;
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
        
        
        
        
        
        
        s.lods[lod].locomotion.adopt(s.lods[s.lod].locomotion.state);
        s.lod = lod;
        s.shadow = null;
      }
      const pc = s.lods[s.lod];
      const o = pc.object;
      o.visible = s.scale > 0.001 && fromFocus <= cfg.drawM;
      s.visible = o.visible;
      if (o.visible && !isHeld && fromFocus < nearestD) { nearestD = fromFocus; nearest = s; }
      
      
      
      const arrived = use && Math.hypot(use.at.x - s.x, use.at.z - s.z) < 0.05;
      
      
      
      
      const onMeet = pairing && Math.hypot(pairing.x - s.x, pairing.z - s.z) < 0.05;
      
      if (onMeet && !pair.met.has(v.id)) { pair.met.add(v.id); if (pair.met.size === 2) pair.untilS = realS + pair.chatS; }
      const own = onMeet && pc.clips.chat ? 'chat'
        : !use && !isHeld && !pairing && !following && pose.speed === 0 && pose.use == null && pose.clip && pose.clip !== 'sit'
          && pc.clips[pose.clip] && pc.clips[pose.clip].loop ? pose.clip : null;
      
      const seatC = arrived && use.kind === 'seat' ? seatClip(pc.rig, use.seatY) : null;
      const seated = seatC && pose.wants === 'eat' && pc.clips[eatClipFor(seatC)] ? eatClipFor(seatC) : seatC;
      const clip = arrived ? (seated || use.clip) : own;
      if (clip !== pc.using) pc.use(clip);
      
      if (clip) s.rise = use && use.kind === 'seat' ? seatedRootY(pc.rig, pc.clips[clip], use.seatY) : 0;
      o.position.set(s.x, heightAt(s.x, s.z) + (s.rise || 0) * pc.useWeight, s.z);
      o.rotation.y = s.heading;
      
      s.bob += ((isHeld ? activity : 0) - s.bob) * Math.min(1, dt * 20);
      const k = s.scale;
      o.scale.set(k * (1 - 0.03 * s.bob), k * (1 + 0.06 * s.bob), k * (1 - 0.03 * s.bob));
      const speed = dt > 0 ? moved / dt : 0;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const step = animStepS(fromFocus, { near: isHeld });
      if (!o.visible) {
        
        
        s.animAcc = 0;
        s.animDist = 0;
      } else {
        fullPoses += 1;
        s.animAcc += animDt;
        s.animDist += dt > 0 ? moved * (animDt / dt) : 0;
        if (s.animAcc >= step) {
          
          
          
          
          pc.update(s.animAcc, { speed: s.animAcc > 0 ? s.animDist / s.animAcc : 0, faceYaw: isHeld ? err : 0 });
          s.poses += 1;
          s.animAcc = 0;
          s.animDist = 0;
          
          
          
          
          
          
          
          
          
          
          
          
          const faceT0 = faceMeter.start(); 
          const life = pc.locomotion.state.life;
          const personality = PERSONALITIES[personalityOf(v)];
          
          
          
          
          const mood = moodNow(ledgers.get(v.id) || EMPTY_LEDGER, t / 1000, { raining, nowMs: t, tzOffsetMin: world.tzOffsetMin || 0, personality: pose.mood ? { ...personality, baseline: pose.mood } : personality });
          const face = faceAt({ expression: mood, intensity: personality.intensity, since: 10, blink: life ? life.blink : 0, talking: isHeld, activity: isHeld ? activity : 0 });
          const infl = faceInfluences(face);
          for (const m of pc.meshes) {
            if (!m.morphTargetInfluences) continue;
            for (let i = 0; i < infl.length; i++) m.morphTargetInfluences[i] = infl[i];
          }
          faces.set(v.id, { expression: mood, lidsClose: face.lidsClose || 0, mouthO: face.mouthO || 0 });
          faceMeter.stop(faceT0);
        }
      }
      
      
      
      
      const gesture = isHeld || use ? null : villagerGesture(v, pose, animS);
      if (gesture && gesture.key !== s.gestureKey && s.gestureKey !== null && o.visible && !pc.busy) pc.act(gesture.clip);
      s.gestureKey = gesture ? gesture.key : null;
      
      
      if (!isHeld && !(use && use.kind === 'seat') && o.visible && focus && !pc.busy && pc.clips.wave
        && greetFor({ distM: fromFocus, hearts: level(v), lastWaveS: s.waveS ?? null, nowS: animS })) {
        pc.act('wave');
        s.waveS = animS;
        waves += 1;
      }
      drawn.push({ s, isHeld });
      shown.push({
        id: v.id, species: v.species, build: s.build, x: s.x, z: s.z, y: o.position.y, heading: s.heading, speed,
        doing: isHeld ? 'talking' : pose.doing, place: pose.place, inside: pose.inside && s.scale < 0.001,
        clip: pc.using, use: use ? use.id : null, activity: pose.activity || null, mood: pose.mood || null,
        following: Boolean(following), pairing: Boolean(pairing), wants: pose.wants || null,
        visible: o.visible, height: s.height, lod: LODS[s.lod], bob: s.bob, shadow: false,
        
        
        animStepS: step, gesture: pc.action, poses: s.poses,
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
    
    moodEvent(id, kind, tMs) { ledgers.set(id, applyEvent(ledgers.get(id) || EMPTY_LEDGER, kind, tMs / 1000)); },
    
    lineMood(id, mood, tMs) { ledgers.set(id, applyLine(ledgers.get(id) || EMPTY_LEDGER, mood, tMs / 1000)); },
    
    get faces() { return Object.fromEntries(faces); },
    get shown() { return shown; },
    






    get waves() { return waves; },
    
    get life() { return { pairs, follows, snaps, notices, pair: pair ? { a: pair.a, b: pair.b, at: pair.at } : null }; },
    
    teleport() { forceTeleport = true; },
    
    forcePair(a, b, chatS = 15) {
      const A = slots.get(a), B = slots.get(b);
      if (!A || !B || A.x === null || B.x === null) return null;
      const meet = pairMeet({ x: A.x, z: A.z }, { x: B.x, z: B.z });
      pair = { a, b, chatS, untilS: realS + 30, met: new Set(), at: { [a]: meet.a, [b]: meet.b } };
      pairs += 1;
      return { a: meet.a, b: meet.b, apartM: Math.hypot(A.x - B.x, A.z - B.z) };
    },
    
    notice(at, tMs) {
      const ids = noticedBy(shown, at);
      for (const id of ids) ledgers.set(id, applyEvent(ledgers.get(id) || EMPTY_LEDGER, 'placedNear', tMs / 1000));
      notices += ids.length;
      return ids;
    },
    get poses() {
      let done = 0;
      for (const s2 of slots.values()) done += s2.poses;
      return { done, full: fullPoses };
    },
    
    get drawnTriangles() { return shown.reduce((n, v) => n + v.triangles, 0); },
    positionOf(id) {
      const v = shown.find((x) => x.id === id);
      return v ? { x: v.x, z: v.z, y: v.y, height: v.height, visible: v.visible, inside: v.inside } : null;
    },
    




    gesture(id, clip) {
      const s = slots.get(id);
      if (!s || !clip) return false;
      const pc = s.lods[s.lod];
      if (!pc.clips[clip] || pc.clips[clip].loop) return false;
      pc.act(clip);
      return true;
    },
    
    clipOf(id) {
      const s = slots.get(id);
      if (!s) return null;
      const pc = s.lods[s.lod];
      return pc.action || pc.using || null;
    },
    
    objectOf(id) {
      const s = slots.get(id);
      return s ? s.lods[s.lod].object : null;
    },
  };
}
