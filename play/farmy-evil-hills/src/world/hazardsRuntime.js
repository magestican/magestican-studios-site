

































import * as THREE from 'three';
import {
  HAZARD, placeHazards, stepHazard, interactHazard, shootHazard, footprint, hazardBlockers,
  hazardLive, fireInner,
} from '../../../../web-engine/horror/hazards.js';
import { damage } from '../../../../web-engine/horror/health.js';
import { say } from '../../../../web-engine/horror/barks.js';
import { HALL_H } from '../constants.js';
import { makeLeak, makeWire } from './hazards.js';
import { sfxSheet } from '../audio/sheets.js';
import { audio } from '../audio/unlock.js';
import { sparkSfx, creakSfx, breathSfx } from '../audio/synth.js';







const S = { rt: null };

function rtOf(ctx) {
  return S.rt && S.rt.ctx === ctx ? S.rt : null;
}


export function hazardList(ctx) {
  const rt = rtOf(ctx);
  return rt ? rt.list.map((e) => e.h) : [];
}



const RIDING = new Set(['closing', 'held', 'riding', 'settling', 'arriving']);



const ARM_FIRE_M = 22;










export function playerHasControl(ctx) {
  const bootEl = typeof document !== 'undefined' ? document.getElementById('boot') : null;
  if (bootEl && bootEl.style.display !== 'none') return false;     
  if (ctx.intro && !ctx.intro.done) return false;                   
  if (ctx.ride && RIDING.has(ctx.ride.phase)) return false;         
  return true;
}





const warned = new Set();
function devBuild() {
  const m = typeof document !== 'undefined' && document.querySelector('meta[name="build"]');
  return !m || m.content === 'dev';
}










export function cue(effect, {
  x = null, z = null, gain = 1, rate = 1, when = 0, fallback = null, optional = false,
} = {}) {
  const dest = x !== null ? (audio.at(x, z) || undefined) : undefined;
  const names = sfxSheet.effectNames;
  if (names && !names.includes(effect)) {
    if (!warned.has(effect) && !optional) {
      warned.add(effect);
      if (devBuild()) {
        console.warn(`[feh sfx] sfx.json has no slice '${effect}'`
          + (fallback ? ' - using the fallback until lane R9 renders it' : ' - and there is no fallback: it is SILENT'));
      }
    }
    if (fallback) { fallback(dest); return 'fallback'; }
    return 'missing';
  }
  if (sfxSheet.play(effect, { dest, gain, rate, when })) return 'sheet';
  if (fallback) { fallback(dest); return 'fallback'; }
  return 'quiet';
}


function startLoop(effect, x, z, gain) {
  const names = sfxSheet.effectNames;
  if (names && !names.includes(effect)) {
    if (!warned.has(effect)) {
      warned.add(effect);
      if (devBuild()) console.warn(`[feh sfx] no loop slice '${effect}' in sfx.json - the hazard has no bed until lane R9 renders it`);
    }
    return null;
  }
  const h = sfxSheet.play(effect, { loop: true, dest: audio.at(x, z) || undefined, gain });
  return h && h.stop ? h : null;
}


const hissFallback = (dest, rate = 0.7, gain = 0.9) => {
  if (!sfxSheet.play('breath', { dest, rate, gain })) breathSfx(true);
};





const TEX = {};
function radialTex(key, stops, size = 64, wrap = false) {
  if (TEX[key]) return TEX[key];
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  for (const [at, colour] of stops) grad.addColorStop(at, colour);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c);
  
  
  
  if (wrap) { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; }
  TEX[key] = t;
  return t;
}
const flameTex = () => radialTex('flame', [
  [0, 'rgba(255,240,190,1)'], [0.25, 'rgba(255,170,60,0.95)'], [0.6, 'rgba(230,80,20,0.55)'], [1, 'rgba(120,20,0,0)'],
]);






const hazeTex = () => radialTex('haze', [
  [0, 'rgba(205,215,140,0.85)'], [0.45, 'rgba(175,190,110,0.6)'], [1, 'rgba(140,160,90,0)'],
], 128, true);
const steamTex = () => radialTex('steam', [
  [0, 'rgba(240,244,246,0.85)'], [0.45, 'rgba(210,218,222,0.5)'], [1, 'rgba(180,190,196,0)'],
]);
const arcTex = () => radialTex('arc', [
  [0, 'rgba(255,255,255,1)'], [0.3, 'rgba(200,225,255,0.85)'], [1, 'rgba(120,170,255,0)'],
]);






function rectMesh(corners, y, material) {
  const g = new THREE.BufferGeometry();
  const p = [];
  for (const c of corners) p.push(c.x, y, c.z);
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex([0, 2, 1, 0, 3, 2]);
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, material);
  m.frustumCulled = false;
  return m;
}


function expandRect(h, du, dv) {
  const fp = footprint(h);
  const cx = fp.corners.reduce((n, c) => n + c.x, 0) / 4;
  const cz = fp.corners.reduce((n, c) => n + c.z, 0) / 4;
  return fp.corners.map((c) => {
    const u = (c.x - cx) * h.dir.x + (c.z - cz) * h.dir.z;
    const v = (c.x - cx) * h.lat.x + (c.z - cz) * h.lat.z;
    const u2 = u + Math.sign(u) * du; const v2 = v + Math.sign(v) * dv;
    return { x: cx + h.dir.x * u2 + h.lat.x * v2, z: cz + h.dir.z * u2 + h.lat.z * v2 };
  });
}

const spriteMat = (map, colour, opacity, additive) => new THREE.MeshBasicMaterial({
  map, color: colour, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide,
  blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
});


function standing(w, hgt, x, y, z, yaw, material) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, hgt), material);
  m.position.set(x, y, z);
  m.rotation.y = yaw;
  m.frustumCulled = false;
  return m;
}

const yawOf = (dir) => Math.atan2(dir.x, dir.z);
const at = (h, u, v) => ({ x: h.x + h.dir.x * u + h.lat.x * v, z: h.z + h.dir.z * u + h.lat.z * v });





function buildFire(ctx, e) {
  const h = e.h;
  const g = e.group;
  
  
  
  const scorch = rectMesh(expandRect(h, 0.3, 0.2), 0.008,
    new THREE.MeshBasicMaterial({ color: 0x0a0806, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide }));
  const glow = rectMesh(expandRect(h, 0.5, 0.35), 0.02, spriteMat(flameTex(), 0xff8a2a, 0.4, true));
  g.add(scorch, glow);
  
  
  
  const v = h.side * (h.half + fireInner(h)) / 2;
  const yaw = yawOf(h.dir);
  const flames = [];
  for (const u of [-1.0, 0, 1.0]) {
    const p = at(h, u, v);
    const mat = spriteMat(flameTex(), 0xffa040, 0.85, true);
    const a = standing(1.15, 1.5, p.x, 0.62, p.z, yaw, mat);
    const b = standing(1.15, 1.5, p.x, 0.62, p.z, yaw + Math.PI / 2, mat);
    g.add(a, b);
    flames.push({ a, b, mat, seed: u * 1.7 + h.progress });
  }
  e.fx = { scorch, glow, flames };
}

function buildGas(ctx, e) {
  const h = e.h;
  const g = e.group;
  const yaw = yawOf(h.dir);
  
  
  
  
  const mat = spriteMat(hazeTex(), 0xb8c47a, 0.32, false);
  const along = standing(h.band, HALL_H * 0.92, h.x, HALL_H * 0.46, h.z, yaw + Math.PI / 2, mat);
  const planes = [along];
  for (const u of [-h.band / 3, 0, h.band / 3]) {
    const p = at(h, u, 0);
    planes.push(standing(h.half * 2, HALL_H * 0.92, p.x, HALL_H * 0.46, p.z, yaw, mat));
  }
  for (const p of planes) g.add(p);
  const pool = rectMesh(expandRect(h, 0, 0), 0.01,
    new THREE.MeshBasicMaterial({ color: 0x6a7a30, transparent: true, opacity: 0.3, depthWrite: false, side: THREE.DoubleSide }));
  g.add(pool);
  
  
  const vg = new THREE.Group();
  vg.position.set(h.valve.x, h.valve.y, h.valve.z);
  vg.rotation.y = Math.atan2(h.valve.nx, h.valve.nz);
  const stem = ctx.introPaint(new THREE.BoxGeometry(0.07, 0.07, 0.24).toNonIndexed(), 0x6a6a62);
  stem.position.z = 0.1;
  const wheel = ctx.introPaint(new THREE.TorusGeometry(0.17, 0.028, 6, 12).toNonIndexed(), 0x9a7a32);
  wheel.position.z = 0.22;
  const spoke = ctx.introPaint(new THREE.BoxGeometry(0.3, 0.03, 0.03).toNonIndexed(), 0x9a7a32);
  spoke.position.z = 0.22;
  const spoke2 = spoke.clone(); spoke2.rotation.z = Math.PI / 2;
  wheel.add(spoke, spoke2);
  const pipe = ctx.introPaint(new THREE.BoxGeometry(0.1, 1.2, 0.1).toNonIndexed(), 0x5a5a52);
  pipe.position.set(0, -0.62, 0.06);
  vg.add(stem, wheel, pipe);
  g.add(vg);
  
  
  const jet = makeLeak(h.valve.x + h.valve.nx * 0.15, 0.95, h.valve.z + h.valve.nz * 0.15,
    [h.valve.nx * 0.9, 0.25, h.valve.nz * 0.9]);
  ctx.leaks.push(jet);
  ctx.deckGroup.add(jet.points);
  e.fx = { mat, planes, pool, wheel, jet, spin: 0, drift: 0 };
}

function buildElectric(ctx, e, seed) {
  const h = e.h;
  const g = e.group;
  
  
  
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(h.puddleR, 18),
    new THREE.MeshBasicMaterial({ color: 0x1a2634, transparent: true, opacity: 0.86, depthWrite: false }));
  puddle.rotation.x = -Math.PI / 2; puddle.position.set(h.x, 0.012, h.z);
  const rim = new THREE.Mesh(new THREE.RingGeometry(h.puddleR - 0.07, h.puddleR, 18),
    new THREE.MeshBasicMaterial({ color: 0x4a5c70, transparent: true, opacity: 0.55, depthWrite: false }));
  rim.rotation.x = -Math.PI / 2; rim.position.set(h.x, 0.014, h.z);
  g.add(puddle, rim);
  
  
  const wire = makeWire(h.cable.x, h.cable.z, HALL_H - h.cable.tip, seed);
  ctx.wires.push(wire);
  ctx.deckGroup.add(wire.line);
  
  
  const bg = new THREE.Group();
  bg.position.set(h.box.x, h.box.y, h.box.z);
  bg.rotation.y = Math.atan2(h.box.nx, h.box.nz);
  const body = ctx.introPaint(new THREE.BoxGeometry(0.34, 0.44, 0.14).toNonIndexed(), 0x5c6470);
  body.position.z = 0.07;
  const conduit = ctx.introPaint(new THREE.BoxGeometry(0.05, HALL_H - h.box.y - 0.3, 0.05).toNonIndexed(), 0x3f444a);
  conduit.position.set(0, (HALL_H - h.box.y - 0.3) / 2 + 0.2, 0.05);
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xff3b2f });
  const lamp = new THREE.Mesh(new THREE.PlaneGeometry(0.07, 0.07), lampMat);
  lamp.position.set(0.09, 0.14, 0.145);
  bg.add(body, conduit, lamp);
  g.add(bg);
  
  const arcMat = spriteMat(arcTex(), 0xd8e8ff, 0, true);
  const flash = new THREE.Mesh(new THREE.CircleGeometry(h.puddleR * 1.1, 16), arcMat);
  flash.rotation.x = -Math.PI / 2; flash.position.set(h.x, 0.03, h.z);
  const boltMat = spriteMat(arcTex(), 0xffffff, 0, true);
  const bolt = standing(0.16, h.cable.tip, h.x, h.cable.tip / 2, h.z, yawOf(h.dir), boltMat);
  const bolt2 = standing(0.16, h.cable.tip, h.x, h.cable.tip / 2, h.z, yawOf(h.dir) + Math.PI / 2, boltMat);
  g.add(flash, bolt, bolt2);
  e.fx = { puddle, rim, wire, lampMat, arcMat, boltMat, bolt, bolt2, arcT: 0, box: bg };
}

function buildSteam(ctx, e) {
  const h = e.h;
  const g = e.group;
  
  
  const vg = new THREE.Group();
  vg.position.set(h.vent.x, h.vent.y, h.vent.z);
  vg.rotation.y = Math.atan2(h.vent.nx, h.vent.nz);
  const frame = ctx.introPaint(new THREE.BoxGeometry(0.52, 0.38, 0.09).toNonIndexed(), 0x5a6068);
  frame.position.z = 0.045;
  vg.add(frame);
  for (const y of [-0.1, 0, 0.1]) {
    const slat = ctx.introPaint(new THREE.BoxGeometry(0.44, 0.045, 0.03).toNonIndexed(), 0x7a8088);
    slat.position.set(0, y, 0.1); slat.rotation.x = 0.5;
    vg.add(slat);
  }
  const pipeH = HALL_H - h.vent.y - 0.2;
  const pipe = ctx.introPaint(new THREE.BoxGeometry(0.14, pipeH, 0.14).toNonIndexed(), 0x4c5258);
  pipe.position.set(0, pipeH / 2 + 0.19, 0.08);
  vg.add(pipe);
  g.add(vg);
  
  
  
  const mat = spriteMat(steamTex(), 0xe0e6ea, 0, false);
  const yaw = yawOf(h.dir);
  const nx = h.vent.nx; const nz = h.vent.nz;
  const planes = [];
  for (let k = 0; k < 4; k += 1) {
    const d = 0.4 + k * 0.78;
    const x = h.vent.x + nx * d; const z = h.vent.z + nz * d;
    const a = standing(1.15, 1.35, x, 1.05, z, yaw, mat);
    const b = standing(h.width * 1.2, 1.35, x, 1.05, z, yaw + Math.PI / 2, mat);
    planes.push(a, b);
    g.add(a, b);
  }
  const puffMat = spriteMat(steamTex(), 0xe0e6ea, 0, false);
  const puff = standing(0.6, 0.6, h.vent.x + nx * 0.25, h.vent.y, h.vent.z + nz * 0.25, yaw, puffMat);
  g.add(puff);
  e.fx = { mat, planes, puffMat, puff, vent: vg };
}

function buildOne(ctx, h, seed) {
  const e = {
    h, kind: h.kind, id: h.id, group: new THREE.Group(), fx: null, f: null,
    loop: null, damageTaken: 0, blockN: 0, dwell: 0, near: false,
    armed: false, armedAt: null,     
  };
  switch (h.kind) {
    case 'fire': buildFire(ctx, e); break;
    case 'gas': buildGas(ctx, e); break;
    case 'electric': buildElectric(ctx, e, seed); break;
    case 'steam': buildSteam(ctx, e); break;
    default: break;
  }
  ctx.deckGroup.add(e.group);
  return e;
}












export function buildHazards(ctx, seed) {
  const rt = {
    ctx, level: seed, list: [], t: 0, damageTaken: 0, hurtAt: -9, vision: 1, hint: null,
  };
  S.rt = rt;
  if (!ctx.isBoss) {
    const placed = placeHazards(ctx.deck, seed, seed);
    for (const h of placed) rt.list.push(buildOne(ctx, h, seed));
  }
  applyBlockers(ctx, rt);
  setHaze(0);
  return rt;
}

function applyBlockers(ctx, rt) {
  const blockers = [];
  for (const e of rt.list) for (const c of hazardBlockers(e.h)) blockers.push({ ...c, hazard: e.id });
  ctx.solidProps = ctx.solidProps.filter((s) => !s.hazard).concat(blockers);
  for (const e of rt.list) e.blockN = hazardBlockers(e.h).length;
}





function setHaze(k) {
  const el = typeof document !== 'undefined' ? document.getElementById('haze') : null;
  if (!el) return;
  const v = Math.max(0, Math.min(0.9, k * 1.3)).toFixed(3);
  if (el.style.opacity !== v) el.style.opacity = v;
}





function hurtBark(ctx, rt) {
  if (rt.t - rt.hurtAt < 4) return;
  rt.hurtAt = rt.t;
  say(ctx.barks, 'hurt');
}

function onEvent(ctx, rt, e, ev) {
  const h = e.h;
  switch (ev) {
    case 'arc': {
      
      
      
      const tip = e.fx.wire.tip;
      ctx.sparkAt([tip[0], tip[1], tip[2]]);
      ctx.sparkFlash = 0.34;
      e.fx.arcT = HAZARD.electric.arcSeconds;
      cue('arcBurst', {
        x: h.x, z: h.z, gain: 0.9,
        fallback: (dest) => { if (!sfxSheet.play('spark', { dest, gain: 0.9 })) sparkSfx(h.x, h.z); },
      });
      break;
    }
    case 'shock':
      
      cue('zap', {
        x: ctx.player.x, z: ctx.player.z, gain: 1.0,
        fallback: (dest) => { if (!sfxSheet.play('spark', { dest, gain: 1.0, rate: 0.8 })) sparkSfx(ctx.player.x, ctx.player.z); },
      });
      hurtBark(ctx, rt);
      break;
    case 'hiss': {
      
      
      
      
      const d = Math.hypot(h.vent.x - ctx.player.x, h.vent.z - ctx.player.z);
      if (d < 20 && !e.loop && sfxSheet.ready && audio.running) e.loop = startLoop('steamLoop', h.vent.x, h.vent.z, 0.6);
      if (!e.loop && d < 20) hissFallback(audio.at(h.vent.x, h.vent.z) || undefined);
      break;
    }
    case 'blast':
      cue('steamBurst', {
        x: h.vent.x, z: h.vent.z, gain: 1.0,
        fallback: (dest) => hissFallback(dest, 0.45, 1.3),
      });
      break;
    case 'stop':
      if (e.kind === 'steam' && e.loop) { e.loop.stop(0.5); e.loop = null; }
      break;
    case 'dying':
      if (e.loop) e.loop.gain.gain.setTargetAtTime(0.25, audio.ctx ? audio.ctx.currentTime : 0, 2);
      break;
    case 'out':
    case 'clear':
      if (e.loop) { e.loop.stop(1.0); e.loop = null; }
      if (e.fx && e.fx.jet) e.fx.jet.points.visible = false;
      break;
    default: break;
  }
}

function flicker(t, seed) {
  return 0.72 + 0.28 * Math.sin(t * 23 + seed) * Math.sin(t * 7.3 + seed * 2) + 0.12 * Math.sin(t * 41 + seed * 3);
}

function animate(ctx, rt, e, dt) {
  const f = e.f; const fx = e.fx; const t = rt.t;
  if (!fx) return;
  switch (e.kind) {
    case 'fire': {
      const k = e.h.s.intensity;
      fx.glow.material.opacity = 0.42 * k * flicker(t, 1.1) + (k > 0 ? 0.05 : 0.02);
      for (const fl of fx.flames) {
        const s = k * (0.55 + 0.45 * flicker(t, fl.seed));
        fl.a.scale.set(0.85 + 0.25 * Math.sin(t * 9 + fl.seed), s, 1);
        fl.b.scale.set(0.85 + 0.25 * Math.cos(t * 8 + fl.seed), s, 1);
        fl.a.position.y = fl.b.position.y = 0.62 * s + 0.05;
        fl.mat.opacity = k > 0 ? 0.55 + 0.4 * flicker(t, fl.seed + 0.5) : 0;
        fl.a.visible = fl.b.visible = k > 0.02;
      }
      break;
    }
    case 'gas': {
      const d = e.h.s.density;
      fx.mat.opacity = 0.5 * d * (0.85 + 0.15 * Math.sin(t * 0.9));
      fx.pool.material.opacity = 0.45 * d;
      fx.drift += dt * 0.04;
      hazeTex().offset.set(fx.drift, -fx.drift * 0.6);
      for (let i = 0; i < fx.planes.length; i += 1) {
        fx.planes[i].position.y = HALL_H * 0.46 + Math.sin(t * 0.7 + i) * 0.12;
      }
      if (fx.spin > 0) { fx.spin = Math.max(0, fx.spin - dt); fx.wheel.rotation.z += dt * 9; }
      if (e.h.s.phase !== 'leaking') fx.jet.points.visible = d > 0.35;
      break;
    }
    case 'electric': {
      fx.arcT = Math.max(0, fx.arcT - dt);
      const on = fx.arcT > 0 && e.h.s.phase === 'live';
      fx.arcMat.opacity = on ? (Math.random() > 0.3 ? 0.9 : 0.35) : 0;
      fx.boltMat.opacity = on ? (Math.random() > 0.25 ? 0.95 : 0.3) : 0;
      if (on) {
        fx.bolt.position.x = e.h.x + (Math.random() - 0.5) * 0.12;
        fx.bolt.position.z = e.h.z + (Math.random() - 0.5) * 0.12;
        fx.bolt2.position.copy(fx.bolt.position);
      }
      
      if (e.h.s.phase === 'live') {
        fx.lampMat.color.setHex(0xff3b2f).multiplyScalar(0.75 + 0.25 * Math.sin(t * 5));
      } else fx.lampMat.color.setHex(0x1a0808);
      fx.rim.material.opacity = e.h.s.phase === 'live' ? 0.45 + 0.2 * Math.sin(t * 3) : 0.25;
      break;
    }
    case 'steam': {
      const on = !!(f && f.blast);
      const k = f ? f.k : 0;
      const target = on ? 0.58 * (1 - 0.3 * k) : (e.h.s.phase === 'hiss' ? 0.08 : 0);
      fx.mat.opacity += (target - fx.mat.opacity) * Math.min(1, dt * 14);
      for (let i = 0; i < fx.planes.length; i += 1) {
        const sc = on ? 1 + 0.35 * k + 0.08 * Math.sin(t * 17 + i) : 0.6;
        fx.planes[i].scale.set(sc, sc, 1);
      }
      fx.puffMat.opacity = e.h.s.phase === 'hiss' ? 0.35 + 0.15 * Math.sin(t * 30) : (on ? 0.5 : 0);
      break;
    }
    default: break;
  }
}




function loopIdFor(kind) {
  return { fire: 'fireLoop', gas: 'gasLoop', electric: 'elecLoop', steam: null }[kind] || null;
}

function stepLoops(ctx, e) {
  const id = loopIdFor(e.kind);
  if (!id) return;
  const p = ctx.player;
  const d = Math.hypot(e.h.x - p.x, e.h.z - p.z);
  const live = hazardLive(e.h) && !(e.kind === 'fire' && e.h.s.phase === 'out');
  if (live && !e.loop && d < 14 && sfxSheet.ready && audio.running) {
    e.loop = startLoop(id, e.h.x, e.h.z, e.kind === 'electric' ? 0.5 : 0.7);
    if (!e.loop) e.loopTried = true;
  } else if (e.loop && (!live || d > 19)) {
    e.loop.stop(0.8); e.loop = null;
  }
}



const VALVE_HINT = 'E  -  CLOSE THE VALVE';
const VALVE_HINT_TOUCH = 'STAND HERE  -  CLOSING THE VALVE';
function valveHint(ctx, rt, near) {
  const el = typeof document !== 'undefined' ? document.getElementById('msg') : null;
  if (!el) return;
  const touch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
  const text = touch ? VALVE_HINT_TOUCH : VALVE_HINT;
  if (near && el.textContent === '') { el.textContent = text; rt.hint = text; }
  if (!near && rt.hint && el.textContent === rt.hint) { el.textContent = ''; rt.hint = null; }
}






export function stepHazards(ctx, dt) {
  const rt = rtOf(ctx);
  const p = ctx.player;
  if (p.staggerT > 0) p.staggerT = Math.max(0, p.staggerT - dt);
  if (!rt) { setHaze(0); return; }
  rt.t += dt;
  
  
  
  if (!playerHasControl(ctx)) {
    for (const e of rt.list) animate(ctx, rt, e, dt);
    return;
  }
  const alive = !p.dead;
  let vision = 1;
  let blockersChanged = false;
  let nearValve = false;
  const touch = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
  for (const e of rt.list) {
    
    
    
    
    
    
    
    
    if (e.kind === 'fire' && !e.armed) {
      if (Math.hypot(e.h.x - p.x, e.h.z - p.z) > ARM_FIRE_M) { animate(ctx, rt, e, dt); stepLoops(ctx, e); continue; }
      e.armed = true; e.armedAt = +rt.t.toFixed(2);
    }
    const f = stepHazard(e.h, dt, alive ? { x: p.x, z: p.z } : null);
    e.h = f.h; e.f = f;
    if (f.damage > 0 && alive) {
      damage(p.vitals, f.damage, e.kind);
      rt.damageTaken += f.damage; e.damageTaken += f.damage;
      hurtBark(ctx, rt);
    }
    if (f.stagger > 0) {
      
      
      p.staggerT = Math.max(p.staggerT || 0, f.stagger);
      ctx.shake = Math.max(ctx.shake, 0.55);
      ctx.flinchT = 0;
    }
    if (f.cough) {
      cue('cough', { x: p.x, z: p.z, gain: 0.85, fallback: (dest) => hissFallback(dest, 1.5, 0.9) });
      say(ctx.barks, 'cough');
      ctx.shake = Math.max(ctx.shake, 0.12);
    }
    if (f.vision < vision) vision = f.vision;
    for (const ev of f.events) onEvent(ctx, rt, e, ev);
    const nb = f.blockers.length;
    if ((nb > 0) !== (e.blockN > 0)) blockersChanged = true;
    animate(ctx, rt, e, dt);
    stepLoops(ctx, e);
    
    if (e.kind === 'gas' && e.h.s.phase === 'leaking') {
      const d = Math.hypot(p.x - e.h.valve.x, p.z - e.h.valve.z);
      if (d <= HAZARD.gas.useReach) {
        nearValve = true;
        if (touch) {
          e.dwell += dt;
          if (e.dwell >= 0.8) closeValve(ctx, e);
        }
      } else e.dwell = 0;
    }
  }
  if (blockersChanged) applyBlockers(ctx, rt);
  rt.vision = vision;
  setHaze(1 - vision);
  valveHint(ctx, rt, nearValve);
}

function closeValve(ctx, e) {
  const r = interactHazard(e.h, ctx.player);
  if (!r.ok) return false;
  e.h = r.h;
  e.fx.spin = 1.2;
  cue('metalGroan', { x: e.h.valve.x, z: e.h.valve.z, gain: 0.9, rate: 1.15, fallback: () => creakSfx(e.h.valve.x, e.h.valve.z) });
  return true;
}


export function interactHazards(ctx) {
  const rt = rtOf(ctx);
  if (!rt) return false;
  for (const e of rt.list) {
    if (e.kind !== 'gas' || e.h.s.phase !== 'leaking') continue;
    if (closeValve(ctx, e)) return true;
  }
  return false;
}










export function shootHazards(ctx, from, dir, at2 = null) {
  const rt = rtOf(ctx);
  if (!rt || !from || !dir) return false;
  const range = at2 ? Math.hypot(at2[0] - from[0], at2[2] - from[2]) + 0.4 : 18;
  for (const e of rt.list) {
    if (e.kind !== 'electric' || e.h.s.phase !== 'live') continue;
    const bx = e.h.box.x - from[0]; const bz = e.h.box.z - from[2];
    const t = bx * dir.x + bz * dir.z;
    if (t < 0 || t > range) continue;
    const hit = { x: from[0] + dir.x * t, z: from[2] + dir.z * t, y: from[1] };
    const r = shootHazard(e.h, hit);
    if (!r.hit) continue;
    e.h = r.h;
    
    ctx.sparkAt([e.h.box.x + e.h.box.nx * 0.1, e.h.box.y, e.h.box.z + e.h.box.nz * 0.1]);
    ctx.sparkFlash = 0.34;
    cue('arcBurst', {
      x: e.h.box.x, z: e.h.box.z, gain: 1.0,
      fallback: (dest) => { if (!sfxSheet.play('spark', { dest, gain: 1.0 })) sparkSfx(e.h.box.x, e.h.box.z); },
    });
    if (e.loop) { e.loop.stop(0.3); e.loop = null; }
    return true;
  }
  return false;
}













export function hazardsVision(ctx) {
  const rt = rtOf(ctx);
  return rt ? rt.vision : 1;
}

export function hazardsDebug(ctx) {
  const rt = rtOf(ctx);
  if (!rt) return [];
  return rt.list.map((e) => ({
    id: e.id, kind: e.kind, x: +e.h.x.toFixed(2), z: +e.h.z.toFixed(2), run: e.h.run, side: e.h.side,
    progress: +e.h.progress.toFixed(1),
    state: e.h.s.phase, active: hazardLive(e.h),
    armed: e.kind === 'fire' ? !!e.armed : null, armedAt: e.armedAt ?? null,
    inside: !!(e.f && e.f.inside),
    arc: !!(e.f && e.f.arc), blast: !!(e.f && e.f.blast),
    intensity: e.h.s.intensity ?? null, density: e.h.s.density ?? null,
    damageTaken: +e.damageTaken.toFixed(2),
    blockers: e.blockN,
    loop: !!e.loop,
    
    
    
    valve: e.h.valve ? { x: +e.h.valve.x.toFixed(2), z: +e.h.valve.z.toFixed(2), nx: e.h.valve.nx, nz: e.h.valve.nz } : null,
    box: e.h.box ? { x: +e.h.box.x.toFixed(2), z: +e.h.box.z.toFixed(2), y: e.h.box.y, nx: e.h.box.nx, nz: e.h.box.nz } : null,
    vent: e.h.vent ? { x: +e.h.vent.x.toFixed(2), z: +e.h.vent.z.toFixed(2), nx: e.h.vent.nx, nz: e.h.vent.nz } : null,
    footprint: footprint(e.h),
  }));
}


export function hazardDamageTaken(ctx) {
  const rt = rtOf(ctx);
  return rt ? +rt.damageTaken.toFixed(2) : 0;
}








export function forceHazard(index, what, { hold = 0 } = {}) {
  const rt = S.rt;
  if (!rt || !rt.list[index]) return null;
  const e = rt.list[index];
  const s = { ...e.h.s };
  switch (what) {
    case 'arc': s.t = s.nextArc; s.arcT = 0; if (hold) { s.arcT = hold; s.hitThisArc = false; } break;
    case 'on': s.offset = -s.t; break;                       
    case 'off': s.offset = HAZARD.steam.on + 0.6 - s.t; break;
    case 'shoot': if (e.kind === 'electric') { s.phase = 'dead'; s.arcT = 0; } break;
    case 'close': if (e.kind === 'gas' && s.phase === 'leaking') { s.phase = 'clearing'; s.closeT = 0; e.fx.spin = 1.2; } break;
    case 'out': if (e.kind === 'fire') { s.t = HAZARD.fire.burnsFor + HAZARD.fire.dieDown; } break;
    default: return null;
  }
  e.h = { ...e.h, s };
  if (what === 'arc' && hold) e.fx.arcT = hold;
  return hazardsDebug(rt.ctx)[index];
}
