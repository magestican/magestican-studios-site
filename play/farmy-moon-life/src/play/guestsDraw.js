

















import * as THREE from 'three';
import { guestFits } from 'moon/play/guests.mjs';
import { FADE_S, fadeAt, guestBeat, guestLift, guestStand } from 'moon/play/guestStand.mjs';
import { EMPTY_LEDGER, applyLine, guestFace } from 'moon/play/guestTalk.mjs';
import { guestObject } from '../render/guest.js';

export function createGuestDraw({ scene, heightAt, objectFor = guestObject }) {
  const group = new THREE.Group();
  group.name = 'guest';
  scene.add(group);
  let cur = null;      
  let token = 0;
  let clock = 0;       
  
  
  const left = [];
  const stats = { kind: null, shown: false, cost: 0, loading: false, clip: null, x: null, z: null, why: null, held: false, leaving: false, face: null, lift: 0, fade: 1, left };

  function clear() {
    token += 1;
    if (cur) { group.remove(cur.v.object); if (cur.v.dispose) cur.v.dispose(); }
    cur = null;
    Object.assign(stats, { kind: null, shown: false, cost: 0, loading: false, clip: null, x: null, z: null, why: null, held: false, leaving: false, face: null, lift: 0 });
  }

  
  async function show(guest, at, season) {
    const key = guest ? `${guest.kind}|${guest.planet}|${guest.day}` : null;
    if (cur && cur.key === key) return;
    if (cur && cur.leftAt !== null && !guest) return; 
    clear();
    if (!guest) return;
    const mine = token;
    stats.loading = true;
    stats.kind = guest.kind;
    const v = await objectFor(guest.kind, { seed: guest.day % 97 + 1, season });
    if (mine !== token) return;
    stats.loading = false;
    const stand = guestStand(at, guest.spot);
    v.object.visible = false;
    group.add(v.object);
    cur = { key, v, stand, t: 0, kind: guest.kind, held: null, ledger: EMPTY_LEDGER, leftAt: null };
    stats.cost = v.cost;
  }

  
  function positionOf() {
    if (!cur || !stats.shown || cur.leftAt !== null) return null;
    const o = cur.v.object;
    return { x: o.position.x, z: o.position.z, y: o.position.y, height: cur.v.height_m || 1 };
  }

  
  function hold(at) { if (cur) { cur.held = at; stats.held = true; } }
  function release() { if (cur) { cur.held = null; stats.held = false; } }
  
  function lineMood(mood) { if (cur) cur.ledger = applyLine(cur.ledger, mood, clock); }

  
  function leave() {
    if (!cur || cur.leftAt !== null) return;
    cur.leftAt = clock;
    cur.held = null;
    stats.leaving = true;
    left.push({ kind: cur.kind, at: Math.round(clock * 1000) / 1000 });
  }

  
  function update(dt, frameDraws) {
    clock += dt;
    if (!cur) return;
    const o = cur.v.object;
    
    
    
    
    
    const a = cur.leftAt === null ? 1 : fadeAt(clock - cur.leftAt);
    o.scale.setScalar(Math.max(0.001, a));
    stats.fade = a;
    if (cur.leftAt !== null && clock - cur.leftAt >= FADE_S) { left[left.length - 1].gone = Math.round(clock * 1000) / 1000; clear(); return; }
    let pose;
    if (cur.held) {
      pose = { x: o.position.x, z: o.position.z, heading: Math.atan2(cur.held.x - o.position.x, cur.held.z - o.position.z), speed: 0 };
    } else {
      cur.t += dt;
      pose = guestBeat(cur.stand, cur.t);
    }
    const lift = guestLift(cur.kind, clock);
    o.position.set(pose.x, heightAt(pose.x, pose.z) + lift, pose.z);
    o.rotation.y = pose.heading;
    const without = stats.shown ? frameDraws - cur.v.cost : frameDraws;
    stats.shown = guestFits(without, cur.v.cost);
    stats.why = stats.shown ? null : `frame ${without} + ${cur.v.cost} > budget`;
    o.visible = stats.shown;
    if (o.visible) {
      cur.v.update(dt, { speed: pose.speed });
      const f = guestFace(cur.kind, cur.ledger, clock);
      stats.face = cur.v.face ? cur.v.face(f.expression, clock, { intensity: f.intensity }) : null;
    }
    Object.assign(stats, { clip: pose.speed > 0 ? 'walk' : 'idle', x: pose.x, z: pose.z, lift });
  }

  return { show, update, clear, hold, release, lineMood, leave, positionOf, stats, group };
}
