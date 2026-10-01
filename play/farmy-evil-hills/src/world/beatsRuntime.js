





































import * as THREE from 'three';
import { beatsFor } from '../../../../web-engine/horror/beats.js';
import { openingFor, openingTimeline } from '../../../../web-engine/horror/acts.js';
import {
  progressAt, routePointAt, wallPointAt, runAt, insideLevel, corners,
} from '../../../../web-engine/horror/level.js';
import { say, PA_LINES } from '../../../../web-engine/horror/barks.js';
import { endGrapple } from '../../../../web-engine/horror/health.js';
import { chickenPose, PORKER, COW } from '../../../../web-engine/horror/creatureAnim.js';
import { HALL_H } from '../constants.js';
import { applyChickenPose, CREATURE_FACE } from '../creatures/rigs.js';
import { sfxSheet, voxSheet } from '../audio/sheets.js';
import { audio } from '../audio/unlock.js';
import { creakSfx } from '../audio/synth.js';
import { paVoice, PA_KINDS } from '../audio/mumble.js';
import { tape } from '../audio/music.js';
import { FLASH_MATS } from './textures.js';
import { cue, hazardList, playerHasControl } from './hazardsRuntime.js';





const S = { rt: null };
const rtOf = (ctx) => (S.rt && S.rt.ctx === ctx ? S.rt : null);




const ANCHOR_PASS_M = 6;

const calm = () => typeof window !== 'undefined' && window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;














function startLight(ctx, rt, kind, seconds) {
  const bases = new Map();
  for (const m of FLASH_MATS) if (m.uniforms && m.uniforms.uDim) bases.set(m, m.uniforms.uDim.value);
  rt.light = { kind, left: seconds, total: seconds, bases, at: rt.t };
  rt.lightEvents.push({ kind, seconds, at: +rt.t.toFixed(2) });
}

function stepLight(ctx, rt, dt) {
  const L = rt.light;
  if (!L) return;
  L.left -= dt;
  const over = L.left <= 0;
  const square = Math.sin(rt.t * 9 * Math.PI * 2) > -0.2;
  const flickerOn = calm() ? false : square;
  for (const [m, base] of L.bases) {
    let v = base;
    if (!over) {
      if (L.kind === 'out') v = Math.min(base, 0.2);
      else if (L.kind === 'emergency' || L.kind === 'drop') v = Math.min(base, L.kind === 'drop' ? 0.2 : 0.35);
      else if (L.kind === 'flicker') v = flickerOn ? base : Math.min(base, 0.25);
    }
    m.uniforms.uDim.value = v;
  }
  for (const st of ctx.strips) {
    if (!st.mat || !st.mat.uniforms || !st.mat.uniforms.uAlpha) continue;
    let a = 1;
    if (!over) {
      if (L.kind === 'out' || L.kind === 'drop') a = 0.03;
      else if (L.kind === 'emergency') a = 0.3;
      else if (L.kind === 'flicker') a = flickerOn ? 1 : 0.15;
    }
    st.mat.uniforms.uAlpha.value = a;
  }
  if (over) rt.light = null;
}










function speakPA(ctx, { speaker = null, trigger = null } = {}) {
  const b = ctx.barks;
  let line = null;
  if (trigger) {
    const pool = PA_LINES.filter((l) => l.trigger === trigger);
    if (pool.length) {
      line = pool[Math.floor(b.rnd() * pool.length)];
      b.current = { text: line.text, until: b.t + 4.2, who: 'pa', speaker: line.speaker, id: line.id };
      b.quietUntil = Math.max(b.quietUntil, b.t + 4.8);
    }
  }
  if (!line) line = say(b, null, { who: 'pa', force: true, speaker });
  const dur = line ? voxSheet.speak(line.id) : 0;
  if (dur > 0) {
    if (b.current) b.current.until = b.t + dur + 0.4;
    b.quietUntil = Math.max(b.quietUntil, b.t + dur + 0.8);
  } else if (!line) {
    paVoice(PA_KINDS[Math.floor(Math.random() * PA_KINDS.length)]);
  }
  return line;
}





const PROFILE = { porker: PORKER, cow: COW };


function spawnApparition(ctx, kind, x, z) {
  const b = ctx.addChicken(z, x, kind);
  b.apparition = true;
  b.anim.state = 'dormant';
  b.idleIn = 1e9;
  if (b.shade) b.shade.position.set(x, 0.01, z);
  return b;
}


function driveApparition(b, x, z, vx, vz, walkT) {
  b.x = x; b.z = z;
  b.mesh.position.set(x, 0, z);
  
  
  b.mesh.rotation.z = Math.atan2(vx, vz) + Math.PI + CREATURE_FACE;
  b.mesh.rotation.y = 0;
  const prof = PROFILE[b.kind] || {};
  applyChickenPose(b.rig, chickenPose({ ...b.anim, state: 'stalk', gait: (walkT * 1.6) % 1, t: walkT }, { ...prof }));
  if (b.shade) b.shade.position.set(x, 0.01, z);
}



function despawnApparition(b) {
  b.alive = false;
  b.apparition = false;
  b.mesh.visible = false;
  if (b.shade) b.shade.visible = false;
}



function bodyRig(ctx, kind, x, z) {
  const b = ctx.addChicken(z, x, kind);
  if (ctx.birds[ctx.birds.length - 1] === b) ctx.birds.pop();
  if (b.shade) b.shade.visible = false;
  return b;
}





const sideFor = (progress) => ((Math.floor(progress * 7.31) % 2) ? 1 : -1);


function wallFor(ctx, progress) {
  const deck = ctx.deck;
  const first = sideFor(progress);
  for (const side of [first, -first]) {
    const w = wallPointAt(deck, progress, side);
    if (insideLevel(deck, w.x - w.nx * 0.2, w.z - w.nz * 0.2, 0.05)) continue;    
    if (!insideLevel(deck, w.x + w.nx * 0.8, w.z + w.nz * 0.8, 0.3)) continue;    
    if (deck.rooms.some((m) => Math.hypot(m.door.x - w.x, m.door.z - w.z) < 2.0)) continue;
    return w;
  }
  return null;
}

function buildHookBody(ctx, e) {
  const { x, z } = e.beat;
  const hook = new THREE.Group();
  hook.position.set(x, HALL_H - 0.02, z);
  const chain = ctx.introPaint(new THREE.BoxGeometry(0.04, 0.5, 0.04).toNonIndexed(), 0x6a6e72);
  chain.position.y = -0.25;
  const bar = ctx.introPaint(new THREE.BoxGeometry(0.16, 0.05, 0.06).toNonIndexed(), 0x8a8e92);
  bar.position.y = -0.5;
  hook.add(chain, bar);
  const body = bodyRig(ctx, 'porker', x, z);
  ctx.deckGroup.remove(body.mesh);
  
  body.mesh.rotation.x = Math.PI / 2;
  body.mesh.rotation.z = 0;
  body.mesh.position.set(0, -0.52, 0);
  hook.add(body.mesh);
  const yaw = yawAt(ctx, e.beat.progress);
  hook.rotation.y = yaw + Math.PI / 2;
  ctx.deckGroup.add(hook);
  e.piece = { hook, amp: 0.05, phase: Math.random() * 6 };
}

function yawAt(ctx, progress) {
  const p = routePointAt(ctx.deck, progress);
  return Math.atan2(p.dir.x, p.dir.z);
}

function buildGrilleWindow(ctx, e) {
  const w = wallFor(ctx, e.beat.progress);
  if (!w) return;
  const g = new THREE.Group();
  g.position.set(w.x, 0, w.z);
  g.rotation.y = Math.atan2(w.nx, w.nz);
  
  
  
  const W = 2.6; const D = 0.65;
  for (const sx of [-1, 1]) {
    const side = ctx.introPaint(new THREE.BoxGeometry(0.06, 2.1, D).toNonIndexed(), 0x4b524d);
    side.position.set(sx * (W / 2), 1.05, D / 2);
    g.add(side);
  }
  const top = ctx.introPaint(new THREE.BoxGeometry(W + 0.12, 0.12, D).toNonIndexed(), 0x4b524d);
  top.position.set(0, 2.1, D / 2);
  const sill = ctx.introPaint(new THREE.BoxGeometry(W + 0.12, 0.3, D).toNonIndexed(), 0x4b524d);
  sill.position.set(0, 0.15, D / 2);
  g.add(top, sill);
  const dark = new THREE.Mesh(new THREE.PlaneGeometry(W, 1.8),
    new THREE.MeshBasicMaterial({ color: 0x06090a, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }));
  dark.position.set(0, 1.2, D);
  g.add(dark);
  for (let i = 0; i <= 8; i += 1) {
    const bar = ctx.introPaint(new THREE.BoxGeometry(0.04, 1.8, 0.04).toNonIndexed(), 0x6f7377);
    bar.position.set(-W / 2 + (W * i) / 8, 1.2, D + 0.02);
    g.add(bar);
  }
  ctx.deckGroup.add(g);
  
  for (const t of [-0.9, 0, 0.9]) {
    ctx.solidProps.push({ x: w.x + w.nx * (D / 2) + -w.nz * t, z: w.z + w.nz * (D / 2) + w.nx * t, r: 0.62 });
  }
  const pig = bodyRig(ctx, 'porker', w.x + w.nx * 0.32, w.z + w.nz * 0.32);
  pig.mesh.visible = false;
  e.piece = { g, w, pig, D };
}

function buildLockerPiece(ctx, e) {
  const { x, z } = e.beat;
  let best = null; let bd = 8;
  for (const l of ctx.lockers) {
    const d = Math.hypot(l.x - x, l.z - z);
    if (d < bd) { bd = d; best = l; }
  }
  if (best) { e.piece = { locker: best, built: false, home: { x: best.mesh.position.x, z: best.mesh.position.z } }; return; }
  const w = wallFor(ctx, e.beat.progress);
  if (!w) return;
  const cab = ctx.introPaint(new THREE.BoxGeometry(0.42, 2.0, 0.72).toNonIndexed(), 0x4a5348);
  cab.position.set(w.x + w.nx * 0.24, 1.0, w.z + w.nz * 0.24);
  cab.rotation.y = Math.atan2(w.nx, w.nz) + Math.PI / 2;
  ctx.deckGroup.add(cab);
  e.piece = { locker: { mesh: cab, door: null, x: cab.position.x, z: cab.position.z }, built: true, home: { x: cab.position.x, z: cab.position.z } };
}

function buildDuctPiece(ctx, e) {
  const t = e.beat.target;
  const w = wallFor(ctx, t ? t.progress : e.beat.progress);
  if (!w) return;
  
  
  const g = new THREE.Group();
  g.position.set(w.x, 0, w.z);
  g.rotation.y = Math.atan2(w.nx, w.nz);
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.4), new THREE.MeshBasicMaterial({ color: 0x050807 }));
  hole.position.set(0, 0.24, 0.02);
  const frame = ctx.introPaint(new THREE.BoxGeometry(0.72, 0.06, 0.06).toNonIndexed(), 0x565a5e);
  frame.position.set(0, 0.47, 0.05);
  const sill = ctx.introPaint(new THREE.BoxGeometry(0.72, 0.05, 0.08).toNonIndexed(), 0x565a5e);
  sill.position.set(0, 0.03, 0.05);
  const grille = new THREE.Group();
  for (let li = 0; li < 5; li += 1) {
    const louvre = ctx.introPaint(new THREE.BoxGeometry(0.62, 0.045, 0.03).toNonIndexed(), 0x6f7377);
    louvre.position.set(0, 0.09 + li * 0.075, 0.06);
    louvre.rotation.x = 0.5;
    grille.add(louvre);
  }
  g.add(hole, frame, sill, grille);
  ctx.deckGroup.add(g);
  e.piece = { g, grille, w, fly: null };
}

function buildIntercom(ctx, e) {
  const w = wallFor(ctx, e.beat.progress);
  if (!w) return;
  const g = new THREE.Group();
  g.position.set(w.x, 1.5, w.z);
  g.rotation.y = Math.atan2(w.nx, w.nz);
  const box = ctx.introPaint(new THREE.BoxGeometry(0.28, 0.38, 0.1).toNonIndexed(), 0x565a5e);
  box.position.z = 0.05;
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.18), new THREE.MeshBasicMaterial({ color: 0x0a0c0c }));
  mesh.position.set(0, -0.04, 0.102);
  const lampMat = new THREE.MeshBasicMaterial({ color: 0x300808 });
  const lamp = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05), lampMat);
  lamp.position.set(0.08, 0.13, 0.102);
  g.add(box, mesh, lamp);
  ctx.deckGroup.add(g);
  e.piece = { g, lampMat, w };
}

function buildFixturePiece(ctx, e) {
  const { x, z } = e.beat;
  let best = null; let bd = 8;
  for (const st of ctx.strips) {
    if (!st.mesh) continue;
    const d = Math.hypot(st.mesh.position.x - x, st.mesh.position.z - z);
    if (d < bd) { bd = d; best = st; }
  }
  if (!best) return;
  e.piece = { strip: best, homeY: best.mesh.position.y, homeRy: best.mesh.rotation.y };
}

function buildDrip(ctx, e) {
  const { x, z } = e.beat;
  const mat = new THREE.MeshBasicMaterial({ color: 0xa8c0cc, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide });
  const a = new THREE.Mesh(new THREE.PlaneGeometry(0.09, HALL_H), mat);
  a.position.set(x, HALL_H / 2, z);
  const b = a.clone(); b.rotation.y = Math.PI / 2;
  const splashMat = new THREE.MeshBasicMaterial({ color: 0x5a6c78, transparent: true, opacity: 0, depthWrite: false });
  const splash = new THREE.Mesh(new THREE.CircleGeometry(0.45, 12), splashMat);
  splash.rotation.x = -Math.PI / 2; splash.position.set(x, 0.011, z);
  ctx.deckGroup.add(a, b, splash);
  e.piece = { a, b, mat, splash, splashMat };
}

function buildDragTrail(ctx, e) {
  const m = e.beat.room;
  if (!m || !ctx.decals) return;
  const cx = (m.x0 + m.x1) / 2; const cz = (m.z0 + m.z1) / 2;
  const inside = { x: m.door.x + (cx - m.door.x) * 0.4, z: m.door.z + (cz - m.door.z) * 0.4 };
  const from = { x: e.beat.x, z: e.beat.z };
  for (let k = 0; k <= 7; k += 1) {
    const f = k / 7;
    ctx.decals.put(from.x + (inside.x - from.x) * f, from.z + (inside.z - from.z) * f, 0.5, 0.35);
  }
  e.piece = { placed: true };
}

function buildPiece(ctx, e) {
  const b = e.beat;
  switch (b.setPiece || b.fx || b.decal || null) {
    case 'hookBody': buildHookBody(ctx, e); break;
    case 'grilleWindow': buildGrilleWindow(ctx, e); break;
    case 'locker': buildLockerPiece(ctx, e); break;
    case 'duct': buildDuctPiece(ctx, e); break;
    case 'intercom': buildIntercom(ctx, e); break;
    case 'lightFixture': buildFixturePiece(ctx, e); break;
    case 'ceilingDrip': buildDrip(ctx, e); break;
    case 'dragTrail': buildDragTrail(ctx, e); break;
    default: break;
  }
}





function fire(ctx, rt, e) {
  const b = e.beat;
  e.fired = true; e.firedAt = +rt.t.toFixed(2); e.t = 0;
  rt.firedCount += 1;
  const p = e.piece || {};
  const tgt = b.target || { x: b.x, z: b.z };
  
  
  
  
  
  switch (b.id) {
    case 'hookBody':
      p.amp = 0.3;
      cue('chainRattle', { x: b.x, z: b.z, gain: 0.9, fallback: () => creakSfx(b.x, b.z) });
      break;
    case 'chickenCrossing': {
      
      
      const c = corners(ctx.deck).find((q) => q.index === (b.target && b.target.corner));
      const next = c ? ctx.deck.runs[c.runAfter] : null;
      const len = next ? Math.hypot(next.x1 - next.x0, next.z1 - next.z0) : 1;
      const d = next ? { x: (next.x1 - next.x0) / len, z: (next.z1 - next.z0) / len } : { x: 1, z: 0 };
      const from = { x: tgt.x - d.x * 1.15, z: tgt.z - d.z * 1.15 };
      e.perf = { b: spawnApparition(ctx, 'chicken', from.x, from.z), from, d, dist: 2.3 };
      
      
      cue('chickCrawl', { x: tgt.x, z: tgt.z, gain: 0.6, fallback: (dest) => sfxSheet.play('chickIdle', { dest, rate: 1.35, gain: 0.5 }) });
      cue('chickCrawl', { x: tgt.x, z: tgt.z, gain: 0.55, when: 0.45, optional: true });
      cue('chickCrawl', { x: tgt.x, z: tgt.z, gain: 0.5, when: 0.9, optional: true });
      break;
    }
    case 'lightsDropPA':
      startLight(ctx, rt, 'out', b.seconds);
      speakPA(ctx, { trigger: b.pa, speaker: null });
      break;
    case 'porkerAtWindow':
      if (p.pig) { p.pig.mesh.visible = true; e.perf = { walk: 0 }; }
      
      cue('porkerIdle', { x: b.x, z: b.z, gain: 0.45, rate: 0.85 });
      break;
    case 'lockerRattle':
      
      cue('doorLeaf', { x: b.x, z: b.z, gain: 0.75, rate: 1.3, fallback: () => { creakSfx(b.x, b.z); sfxSheet.play('settle', { rate: 1.6, gain: 0.6 }); } });
      break;
    case 'cowSilhouette': {
      const run = ctx.deck.runs[b.run];
      const next = ctx.deck.runs[b.run + 1] || run;
      const len = Math.hypot(next.x1 - next.x0, next.z1 - next.z0) || 1;
      const d = { x: (next.x1 - next.x0) / len, z: (next.z1 - next.z0) / len };
      const rl = Math.hypot(run.x1 - run.x0, run.z1 - run.z0) || 1;
      const face = { x: -(run.x1 - run.x0) / rl, z: -(run.z1 - run.z0) / rl };   
      e.perf = { b: spawnApparition(ctx, 'cow', tgt.x, tgt.z), from: { x: tgt.x, z: tgt.z }, d, face, dist: 2.4 };
      cue('cowIdle', { x: tgt.x, z: tgt.z, gain: 0.45, rate: 0.72 });
      break;
    }
    case 'grilleFalls':
      if (p.grille) p.fly = { vy: 1.2, vz: 2.2, t: 0 };
      cue('debrisFall', { x: tgt.x, z: tgt.z, gain: 1.0 });
      
      cue('doorLeaf', { x: tgt.x, z: tgt.z, gain: 0.6, rate: 1.5, when: 0.35, fallback: (dest) => sfxSheet.play('settle', { dest, rate: 1.2, gain: 0.7, when: 0.35 }) });
      break;
    case 'dripStream':
      
      
      
      dripPatter(b.x, b.z, b.ramp || 6);
      break;
    case 'tannoyMusic':
      e.perf = { music: tape.audible ? 'paused' : 'played' };
      if (tape.audible) tape.pause(); else tape.playSide(0);
      reflectTape();
      break;
    case 'survivorIntercom':
      if (p.lampMat) p.lampMat.color.setHex(0xff4a3a);
      speakPA(ctx, { trigger: b.pa, speaker: 'survivor' });
      break;
    case 'brownout':
      startLight(ctx, rt, 'emergency', b.seconds);
      
      
      
      cue('metalGroan', { x: b.x, z: b.z, gain: 0.9, rate: 0.6, fallback: (dest) => sfxSheet.play('settle', { dest, rate: 0.5, gain: 0.9 }) });
      cue('elecLoop', { x: b.x, z: b.z, gain: 0.55, rate: 0.72, optional: true });
      break;
    case 'doorSlamBehind':
      
      
      cue('doorLeaf', { x: tgt.x, z: tgt.z, gain: 1.1, fallback: (dest) => sfxSheet.play('doorClose', { dest, rate: 0.75, gain: 1.1 }) });
      ctx.shake = Math.max(ctx.shake, 0.18);
      break;
    case 'ceilingSteps': {
      const q = routePointAt(ctx.deck, b.progress);
      e.perf = { steps: 0, next: 0, dir: q.dir };
      break;
    }
    case 'dragTrail':
      break;
    case 'paCallsName':
      speakPA(ctx, { trigger: b.pa, speaker: 'host' });
      e.perf = { wails: 0 };
      break;
    case 'fixtureSwing':
      cue('creak', { x: b.x, z: b.z, gain: 0.8, rate: 0.8, fallback: () => creakSfx(b.x, b.z) });
      break;
    default: break;
  }
}


function dripPatter(x, z, ramp) {
  let t = 0; let gap = 1.1; let i = 0;
  while (t < ramp + 3 && i < 24) {
    cue('toeWet', {
      x, z, gain: 0.35 + 0.3 * Math.min(1, t / ramp), rate: 1.1 + 0.2 * (i % 3), when: t,
      
      
      optional: i > 0, fallback: i === 0 ? (dest) => sfxSheet.play('settle', { dest, rate: 2.4, gain: 0.3 }) : null,
    });
    t += gap; gap = Math.max(0.16, gap * 0.82); i += 1;
  }
}

function reflectTape() {
  const el = typeof document !== 'undefined' ? document.getElementById('tapeMini') : null;
  if (!el) return;
  el.classList.toggle('on', tape.audible);
  const cap = document.getElementById('tapeCap');
  if (cap) cap.textContent = tape.audible ? tape.sideName : 'OFF';
}

function perform(ctx, rt, e, dt) {
  const b = e.beat; const p = e.piece || {}; const t = e.t;
  const dur = b.duration || b.seconds || 0;
  switch (b.id) {
    case 'hookBody': {
      const k = Math.max(0, 1 - t / 4);
      p.amp += ((0.05 + 0.25 * k) - p.amp) * Math.min(1, dt * 3);
      p.hook.rotation.z = Math.sin(rt.t * 2.6 + p.phase) * p.amp;
      p.hook.rotation.x = Math.cos(rt.t * 1.9 + p.phase) * p.amp * 0.4;
      if (t >= 4) e.done = true;
      break;
    }
    case 'chickenCrossing': {
      const q = e.perf; if (!q) { e.done = true; break; }
      const k = Math.min(1, t / b.duration);
      driveApparition(q.b, q.from.x + q.d.x * q.dist * k, q.from.z + q.d.z * q.dist * k, q.d.x, q.d.z, t * 2.2);
      if (k >= 1) { despawnApparition(q.b); e.done = true; }
      break;
    }
    case 'porkerAtWindow': {
      const q = e.perf; if (!q || !p.pig) { e.done = true; break; }
      const k = Math.min(1, t / b.duration);
      const w = p.w;
      const tx = -w.nz; const tz = w.nx;                 
      const u = -0.75 + 1.5 * k;
      const x = w.x + w.nx * 0.32 + tx * u; const z = w.z + w.nz * 0.32 + tz * u;
      driveApparition(p.pig, x, z, tx, tz, t * 1.4);
      if (k >= 1) { p.pig.mesh.visible = false; e.done = true; }
      break;
    }
    case 'lockerRattle': {
      const l = p.locker; if (!l) { e.done = true; break; }
      const k = t < b.duration ? 1 : 0;
      const j = k * 0.018 * (Math.sin(rt.t * 47) + Math.sin(rt.t * 31));
      l.mesh.position.x = p.home.x + j; l.mesh.position.z = p.home.z + j * 0.6;
      if (l.door) l.door.rotation.y = k * 0.06 * Math.sin(rt.t * 41);
      if (t >= b.duration) { l.mesh.position.x = p.home.x; l.mesh.position.z = p.home.z; if (l.door) l.door.rotation.y = 0; e.done = true; }
      break;
    }
    case 'cowSilhouette': {
      const q = e.perf; if (!q) { e.done = true; break; }
      const k = Math.min(1, t / b.duration);
      
      
      const x = q.from.x + q.d.x * q.dist * k; const z = q.from.z + q.d.z * q.dist * k;
      driveApparition(q.b, x, z, q.face.x, q.face.z, t * 1.1);
      if (k >= 1) { despawnApparition(q.b); e.done = true; }
      break;
    }
    case 'grilleFalls': {
      const f = p.fly; if (!f || !p.grille) { e.done = true; break; }
      f.t += dt;
      p.grille.position.z += f.vz * dt * 0.25;
      p.grille.position.y += f.vy * dt;
      p.grille.rotation.x += dt * 5;
      f.vy -= dt * 9;
      if (p.grille.position.y < -0.05) { p.grille.position.y = -0.05; p.fly = null; e.done = true; }
      break;
    }
    case 'dripStream': {
      if (!p.mat) { e.done = true; break; }
      const ramp = Math.min(1, t / (b.ramp || 6));
      const tail = t > b.duration - 1 ? Math.max(0, b.duration - t) : 1;
      const o = 0.55 * ramp * tail;
      p.mat.opacity = o * (0.85 + 0.15 * Math.sin(rt.t * 23));
      p.a.scale.x = p.b.scale.x = 0.6 + ramp * 0.9;
      p.splashMat.opacity = o * 0.7;
      p.splash.scale.setScalar(0.5 + ramp);
      if (t >= b.duration) { p.mat.opacity = 0; p.splashMat.opacity = 0; e.done = true; }
      break;
    }
    case 'tannoyMusic':
      if (t >= b.seconds) {
        if (e.perf && e.perf.music === 'paused') tape.resume(); else tape.off();
        reflectTape();
        e.done = true;
      }
      break;
    case 'survivorIntercom':
      if (p.lampMat) p.lampMat.color.setHex(Math.sin(rt.t * 8) > 0 ? 0xff4a3a : 0x802020);
      if (t >= b.duration) { if (p.lampMat) p.lampMat.color.setHex(0x300808); e.done = true; }
      break;
    case 'ceilingSteps': {
      const q = e.perf; if (!q) { e.done = true; break; }
      if (t >= q.next && q.steps < 7) {
        
        
        
        const x = b.x + q.dir.x * (2 + q.steps * 1.6); const z = b.z + q.dir.z * (2 + q.steps * 1.6);
        cue('stepDeck', { x, z, gain: 0.9 - q.steps * 0.08, rate: 0.7, optional: q.steps > 0 });
        q.steps += 1; q.next = t + 0.55;
      }
      if (t >= b.duration) e.done = true;
      break;
    }
    case 'paCallsName': {
      const q = e.perf; if (!q) { e.done = true; break; }
      if (q.wails < 2 && t >= 3 * (q.wails + 1)) { paVoice(PA_KINDS[0]); q.wails += 1; }
      if (t >= b.duration) e.done = true;
      break;
    }
    case 'fixtureSwing': {
      const s = p.strip; if (!s) { e.done = true; break; }
      const k = Math.max(0, 1 - t / b.duration);
      s.mesh.rotation.y = p.homeRy + Math.sin(rt.t * 4.2) * 0.22 * k;
      s.mesh.position.y = p.homeY - Math.abs(Math.sin(rt.t * 4.2)) * 0.06 * k;
      if (t >= b.duration) { s.mesh.rotation.y = p.homeRy; s.mesh.position.y = p.homeY; e.done = true; }
      break;
    }
    default:
      if (t >= Math.max(dur, 0.5)) e.done = true;
      break;
  }
}





function buildOpening(ctx, seed) {
  const rule = openingFor(seed);
  if (!rule) return null;
  const gi = ctx.gateMeshes.findIndex((m) => m.gate && m.gate.scripted);
  return {
    rule, gi, gate: gi >= 0 ? ctx.gateMeshes[gi].gate : null, timeline: openingTimeline(seed),
    control: false, t: 0, telegraphedAt: null, bird: null, awakeAt: null, runAtEncounter: null,
    lightAt: null, cornerLightAt: null,
  };
}

function stepOpening(ctx, rt, dt) {
  const op = rt.opening;
  if (!op) return;
  const p = ctx.player;
  if (!op.control) {
    
    
    
    if (p.dead || !playerHasControl(ctx)) return;
    op.control = true;
    op.t = 0;
    const le = op.rule.lightEvent;
    if (le && le.at === 'control' && op.rule.telegraph.kind !== 'brownout') {
      startLight(ctx, rt, le.kind, le.seconds);
      op.lightAt = 0;
    }
    return;
  }
  op.t += dt;
  const o = op.rule;
  
  
  
  
  if (op.telegraphedAt === null && op.t >= o.telegraph.at) {
    op.telegraphedAt = +op.t.toFixed(2);
    if (o.telegraph.kind === 'brownout') {
      startLight(ctx, rt, 'emergency', (o.lightEvent && o.lightEvent.seconds) || 6);
      op.lightAt = +op.t.toFixed(2);
    }
    if (op.gi >= 0) ctx.beginEntrance(op.gi, op.gate.species);
  }
  if (op.telegraphedAt !== null && !op.bird) {
    const en = ctx.entrances.find((q) => q.gm && q.gm.gate && q.gm.gate.scripted);
    if (en) op.bird = en.b;
  }
  
  
  if (op.bird && !op.bird.entering && op.awakeAt === null) {
    op.awakeAt = +op.t.toFixed(2);
    if (op.bird.anim && op.bird.alive) {
      op.bird.anim = { ...op.bird.anim, state: 'alert', t: 0 };
      op.bird.lastSeen = { x: p.x, z: p.z };
    }
    op.runAtEncounter = runAt(ctx.deck, p.x, p.z);
  }
  
  const le = o.lightEvent;
  if (le && le.at === 'firstCornerAfterFirstEncounter' && op.awakeAt !== null && op.cornerLightAt === null) {
    if (runAt(ctx.deck, p.x, p.z) !== op.runAtEncounter) {
      op.cornerLightAt = +op.t.toFixed(2);
      startLight(ctx, rt, le.kind, le.seconds);
    }
  }
}






export function buildBeats(ctx, seed) {
  
  
  
  
  const rt = {
    ctx, level: seed, t: 0, beats: [], firedCount: 0, light: null, lightEvents: [],
    wasSafe: false, primed: false, opening: null,
  };
  S.rt = rt;
  if (!ctx.isBoss) {
    const placed = beatsFor(seed, ctx.deck, { hazards: hazardList(ctx) });
    for (const beat of placed) {
      const e = { beat, fired: false, firedAt: null, done: false, t: 0, piece: null, perf: null };
      buildPiece(ctx, e);
      rt.beats.push(e);
    }
    rt.opening = buildOpening(ctx, seed);
  }
  return rt;
}


export function stepBeats(ctx, dt) {
  const rt = rtOf(ctx);
  if (!rt) return;
  rt.t += dt;
  const p = ctx.player;
  const nowSafe = !!ctx.inSafe;
  if (!rt.primed) { rt.primed = true; rt.wasSafe = nowSafe; }
  const entered = nowSafe && !rt.wasSafe;
  const left = !nowSafe && rt.wasSafe;
  rt.wasSafe = nowSafe;
  if (!p.dead && rt.beats.length && playerHasControl(ctx)) {
    const prog = progressAt(ctx.deck, p.x, p.z);
    for (const e of rt.beats) {
      if (e.fired) continue;
      const b = e.beat;
      let go = false;
      if (typeof b.at === 'number') {
        go = b.trigger === 'pass'
          ? Math.hypot(p.x - b.x, p.z - b.z) <= (b.reach || 2)
          : prog >= b.progress;
      } else if (b.at === 'onEnter:safe') go = entered || prog >= b.progress + ANCHOR_PASS_M;
      else if (b.at === 'onLeave:safe') go = left || prog >= b.progress + ANCHOR_PASS_M;
      if (go) fire(ctx, rt, e);
    }
  }
  for (const e of rt.beats) {
    if (!e.fired || e.done) continue;
    e.t += dt;
    perform(ctx, rt, e, dt);
  }
  
  
  for (const e of rt.beats) {
    if (e.beat.id === 'hookBody' && e.piece && !e.fired) {
      e.piece.hook.rotation.z = Math.sin(rt.t * 2.6 + e.piece.phase) * e.piece.amp;
    }
  }
  stepOpening(ctx, rt, dt);
  stepLight(ctx, rt, dt);
}






export function beatsDebug(ctx) {
  const rt = rtOf(ctx);
  if (!rt) return [];
  return rt.beats.map((e) => ({
    id: e.beat.id, kind: e.beat.kind, trigger: e.beat.trigger, reach: e.beat.reach || null,
    at: typeof e.beat.at === 'number' ? +e.beat.at.toFixed(3) : e.beat.at,
    progress: +e.beat.progress.toFixed(1), x: +e.beat.x.toFixed(2), z: +e.beat.z.toFixed(2), run: e.beat.run,
    target: e.beat.target ? { x: +e.beat.target.x.toFixed(2), z: +e.beat.target.z.toFixed(2) } : null,
    piece: !!e.piece, fired: e.fired, firedAt: e.firedAt, done: e.done,
  }));
}


export function openingDebug(ctx) {
  const rt = rtOf(ctx);
  if (!rt || !rt.opening) return null;
  const op = rt.opening;
  const o = op.rule;
  return {
    rattleAt: o.telegraph.at, telegraph: o.telegraph.kind,
    firstSpecies: o.first.species, firstVia: o.first.via, firstAhead: o.first.ahead,
    firstAt: op.timeline ? +op.timeline.firstAwakeAt.toFixed(2) : null,
    porkerNotBeforeRun: o.porkerNotBeforeRun, lightEvent: o.lightEvent,
    gate: op.gate ? { x: +op.gate.x.toFixed(2), z: +op.gate.z.toFixed(2), kind: op.gate.kind, ahead: +op.gate.ahead.toFixed(1), index: op.gi } : null,
    control: op.control, t: +op.t.toFixed(2),
    telegraphedAt: op.telegraphedAt, awakeAt: op.awakeAt, lightAt: op.lightAt, cornerLightAt: op.cornerLightAt,
    bird: op.bird ? { kind: op.bird.kind, state: op.bird.anim ? op.bird.anim.state : null, entering: !!op.bird.entering, alive: !!op.bird.alive } : null,
    lightEvents: rt.lightEvents.slice(), lightNow: rt.light ? rt.light.kind : null,
  };
}


export function beatsFired(ctx) {
  const rt = rtOf(ctx);
  return rt ? rt.firedCount : 0;
}





export function forceBeat(id) {
  const rt = S.rt;
  if (!rt) return null;
  const e = rt.beats.find((q) => q.beat.id === id);
  if (!e || e.fired) return null;
  fire(rt.ctx, rt, e);
  return beatsDebug(rt.ctx).find((q) => q.id === id) || null;
}














export function quietDeck() {
  const rt = S.rt;
  if (!rt) return null;
  const ctx = rt.ctx;
  const p = ctx.player;
  let retired = 0;
  for (const b of ctx.birds) {
    if (!b.alive || b.apparition) continue;
    b.alive = false;
    b.latched = false;
    b.mesh.visible = false;
    if (b.shade) b.shade.visible = false;
    retired += 1;
  }
  
  
  
  
  
  
  let released = false;
  if (p.latchedBy || p.struggle) {
    p.latchedBy = null;
    p.struggle = null;
    endGrapple(p.vitals);
    released = true;
  }
  ctx.openingPending = [];
  ctx.director = null;
  
  
  
  ctx.entrances.length = 0;
  if (rt.opening) {
    rt.opening.control = true;
    if (rt.opening.telegraphedAt === null) rt.opening.telegraphedAt = -1;
    if (rt.opening.awakeAt === null) rt.opening.awakeAt = -1;
  }
  return { retired, released, pending: 0 };
}
