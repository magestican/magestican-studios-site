













import { audio } from './audio/unlock.js';
import { benchOffers } from '../../../web-engine/horror/workbench.js';
import { HORSE as BOSS_HORSE } from '../../../web-engine/horror/boss.js';
import { canFire, readyWeapon } from '../../../web-engine/horror/weapons.js';
import { CHICKEN_H, XANDER_H } from './constants.js';
import { chickVoice, porkVoice, SHEET_VOICE, sheetVoice } from './creatures/voices.js';
import { clearOfCar, LIFT } from '../../../web-engine/horror/lift.js';
import { clearOfProps, insideLevel, moveInLevel } from '../../../web-engine/horror/level.js';
import { COW_HEIGHT_M } from '../../../web-engine/ps1/creatures/cow.mjs';
import { createStruggle } from '../../../web-engine/horror/struggle.js';
import { currentBark, say } from '../../../web-engine/horror/barks.js';
import { flashScale, shakeScale, struggleMode } from '../../../web-engine/horror/access.js';
import { gunSfx, sfxSheet, voxSheet } from './audio/sheets.js';
import { hideDrawsPlayer, hideProtects } from '../../../web-engine/horror/hideout.js';
import { INTRO_SHOTS } from '../../../web-engine/horror/intro.js';
import { isDanger } from '../../../web-engine/horror/injury.js';
import { makeSave } from '../../../web-engine/horror/saveGame.js';
import { MAX_HEALTH } from '../../../web-engine/horror/health.js';
import { mumbleState } from './audio/mumble.js';
import { PORKER_HEIGHT_M } from '../../../web-engine/ps1/creatures/porker.mjs';
import {
  applyDamage, mobilityOf, resolveHit, spawn as spawnCreature, statusOf,
} from '../../../web-engine/horror/dismemberment.js';
import { settleSfx, sparkSfx } from './audio/synth.js';



import { hitReact, locomotion } from '../../../web-engine/horror/creatureAnim.js';
import { tape } from './audio/music.js';
import { hazardsDebug, hazardDamageTaken, hazardsVision } from './world/hazardsRuntime.js';
import { beatsDebug, openingDebug, beatsFired } from './world/beatsRuntime.js';
import * as THREE from 'three';
import { FLASH_MATS } from './world/textures.js';
import { ps1Vertex, FRAGMENT, KEY_DIR, FILL_DIR } from '../../../web-engine/ps1/ps1Shader.mjs';
import { PS1_SNAP } from '../../shared/ps1Render/ps1Material.js';



import { palette, to15 } from '../../../web-engine/ps1/texturePaint.mjs';


export function createDebug(ctx) {
  
  
  
  
  
  const PART_ALIAS = {
    head: 'head', hair: 'hair', neck: 'neck', chest: 'torso', hips: 'pelvis', yoke: 'trapezius',
    handL: 'hand0', handR: 'hand1', forearmL: 'foreArm0', forearmR: 'foreArm1',
    upperArmL: 'upperArm0', upperArmR: 'upperArm1', thighL: 'thigh0', thighR: 'thigh1',
    shinL: 'shin0', shinR: 'shin1', bootL: 'foot0', bootR: 'foot1',
  };
  const _pbV = new THREE.Vector3();
  
  
  
  const _lightAt = new THREE.Vector3();
  





  const partBox = (name) => {
    const part = PART_ALIAS[name] || name;
    const cam = ctx.camera; const canvas = ctx.renderer.domElement;
    const W = canvas.width; const H = canvas.height;
    let x0 = Infinity; let y0 = Infinity; let x1 = -Infinity; let y1 = -Infinity; let n = 0;
    const take = (obj, geo, start, count) => {
      obj.updateWorldMatrix(true, false);
      const P = geo.getAttribute('position');
      for (let i = start; i < start + count; i += 1) {
        _pbV.fromBufferAttribute(P, i).applyMatrix4(obj.matrixWorld).project(cam);
        if (!(_pbV.z < 1 && _pbV.z > -1)) continue;
        const sx = (_pbV.x + 1) / 2; const sy = (1 - _pbV.y) / 2;
        x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy); n += 1;
      }
    };
    if (part === 'head') {
      const g = ctx.xHead.geometry;
      take(ctx.xHead, g, 0, g.getAttribute('position').count);
    } else {
      const geo = ctx.xander.geometry;
      for (const r of (geo.userData && geo.userData.parts) || []) if (r.name === part) take(ctx.xander, geo, r.start, r.count);
    }
    if (!n) return null;
    return {
      part, n, x0, y0, x1, y1,
      px: { x0: Math.round(x0 * W), y0: Math.round(y0 * H), x1: Math.round(x1 * W), y1: Math.round(y1 * H) },
      widthPct: +((x1 - x0) * 100).toFixed(1), heightPct: +((y1 - y0) * 100).toFixed(1),
    };
  };
  
  const lab = (rgb) => {
    const f = (c) => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92; };
    const [r, g, b] = rgb.map(f);
    const g2 = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    const x = g2((r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047);
    const y = g2(r * 0.2126 + g * 0.7152 + b * 0.0722);
    const z = g2((r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883);
    return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
  };
  
  
  
  
  
  
  
  const deltaE = (a, b) => { if (!a || !b) return null; const [l1, a1, b1] = lab(a); const [l2, a2, b2] = lab(b); return +Math.hypot(l1 - l2, a1 - a2, b1 - b2).toFixed(2); };
  
  
  
  
  
  
  
  const deltaEab = (a, b) => { if (!a || !b) return null; const [, a1, b1] = lab(a); const [, a2, b2] = lab(b); return +Math.hypot(a1 - a2, b1 - b2).toFixed(2); };
  
  
  const relLum = (c) => +(0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]).toFixed(1);
  
  
  
  
  
  
  
  
  
  const FAMILIES = ['skin', 'hair', 'denim', 'plaid', 'leather', 'brass'];
  const nearestFamily = (c) => {
    if (!c) return null;
    let best = null; let bd = Infinity;
    for (const name of FAMILIES) {
      for (const [stop, rgb] of Object.entries(palette(name).by)) {
        const q = to15(rgb);
        const d = Math.hypot(q[0] - c[0], q[1] - c[1], q[2] - c[2]);
        if (d < bd) { bd = d; best = { family: name, stop }; }
      }
    }
    return { ...best, distance: +bd.toFixed(1) };
  };
  











  const readerFor = (read, W, H) => {
    const modeOf = (buf, skipDark) => {
      const counts = new Map();
      let best = null; let bestN = 0;
      for (let i = 0; i < buf.length; i += 4) {
        
        
        if (skipDark && buf[i] * 0.299 + buf[i + 1] * 0.587 + buf[i + 2] * 0.114 < 50) continue;
        const k = (buf[i] << 16) | (buf[i + 1] << 8) | buf[i + 2];
        const n = (counts.get(k) || 0) + 1;
        counts.set(k, n);
        if (n > bestN) { bestN = n; best = k; }
      }
      return best === null ? null : [(best >> 16) & 255, (best >> 8) & 255, best & 255];
    };
    const patch = (fx, fy, rad = 4) => {
      const cx = Math.round(fx * W); const cy = Math.round(fy * H);
      const w = rad * 2 + 1;
      return modeOf(read(cx - rad, cy - rad, w, w), false) || [0, 0, 0];
    };
    
    const bandMode = (box, fx0, fy0, fx1, fy1) => {
      if (!box) return null;
      const bw = box.x1 - box.x0; const bh = box.y1 - box.y0;
      const x0 = Math.round((box.x0 + bw * fx0) * W); const x1 = Math.round((box.x0 + bw * fx1) * W);
      const y0 = Math.round((box.y0 + bh * fy0) * H); const y1 = Math.round((box.y0 + bh * fy1) * H);
      return modeOf(read(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0)), true);
    };
    
    const regionMode = (box, frac = 0.4) => bandMode(box, 0.5 - frac / 2, 0.5 - frac / 2, 0.5 + frac / 2, 0.5 + frac / 2);
    return { patch, bandMode, regionMode, W, H };
  };
  
  const canvasReader = () => {
    const r = ctx.renderer; const gl = r.getContext(); const canvas = r.domElement;
    const W = canvas.width; const H = canvas.height;
    return readerFor((x, y, w, h) => {
      const buf = new Uint8Array(w * h * 4);
      gl.readPixels(x, Math.max(0, H - (y + h)), w, h, gl.RGBA, gl.UNSIGNED_BYTE, buf);
      return buf;
    }, W, H);
  };
  
  const bufferReader = (img) => readerFor((x, y, w, h) => {
    const out = new Uint8Array(w * h * 4);
    for (let j = 0; j < h; j += 1) {
      const sy = y + j;
      if (sy < 0 || sy >= img.height) continue;
      for (let i = 0; i < w; i += 1) {
        const sx = x + i;
        if (sx < 0 || sx >= img.width) continue;
        const s = (sy * img.width + sx) * 4; const d = (j * w + i) * 4;
        out[d] = img.data[s]; out[d + 1] = img.data[s + 1]; out[d + 2] = img.data[s + 2]; out[d + 3] = 255;
      }
    }
    return out;
  }, img.width, img.height);
  const isTextured = (m) => !!(m && m.uniforms && m.uniforms.uMap && m.uniforms.uMap.value && m.uniforms.uMap.value.isTexture);
  





  let flat = null;
  const flatMaterials = () => {
    if (flat) return flat;
    const src = ps1Vertex();
    const flatSrc = src.replace(/vShade = [^;]+;/, 'vShade = 1.0;');
    if (flatSrc === src) throw new Error('xanderSkinSample: could not find the vShade line in ps1Vertex - the shader changed');
    const mk = () => new THREE.ShaderMaterial({
      uniforms: {
        uRes: { value: new THREE.Vector2(PS1_SNAP.x, PS1_SNAP.y) },
        uKey: { value: new THREE.Vector3(...KEY_DIR) },
        uFill: { value: new THREE.Vector3(...FILL_DIR) },
        uAlpha: { value: 1 }, uMap: { value: null },
      },
      vertexShader: flatSrc, fragmentShader: FRAGMENT.textured(),
      fog: false, lights: false, toneMapped: false, side: THREE.DoubleSide,
    });
    flat = { body: mk(), face: mk() };
    return flat;
  };
  let dimBase = null;

  return {
    get hidden() { return ctx.hidden; },
    get inSafe() { return ctx.inSafe; },
    get nearLocker() { return !!ctx.nearLocker; },
    get pickups() { return ctx.pickups.filter((q) => !q.taken).length; },
    
    
    
    goTo(x, z) { ctx.player.x = x; ctx.player.z = z; ctx.camState = null; },
    get level() { return ctx.level; },
    
    
    
    
    
    get deck() {
      return {
        start: ctx.deck.start, exit: ctx.deck.exit, bays: ctx.deck.bays,
        runs: ctx.deck.runs.map((r) => ({ x0: r.x0, z0: r.z0, x1: r.x1, z1: r.z1 })),
      };
    },
    
    
    
    
    
    get cameraEye() { return { ...ctx.camEye }; },
    get cameraTarget() { return { ...ctx.camTarget }; },
    
    
    
    get medkit() {
      const it = ctx.pickups.find((q) => q.medkit);
      return it ? { x: it.x, z: it.z, taken: it.taken } : null;
    },
    get library() { return ctx.library ? { ...ctx.library, near: ctx.nearLibrary } : null; },
    
    
    
    giveWeapon(wid, ammo) { ctx.player.weapon = readyWeapon(wid, { ammo: ammo ?? 48 }); return ctx.player.weapon.id; },
    creatureStatus(i) {
      const b = ctx.birds[i];
      return b && b.creature ? { ...statusOf(b.creature), burn: b.burn ? { ...b.burn } : null } : null;
    },
    get workbench() {
      return ctx.workbench ? {
        x: ctx.workbench.x, z: ctx.workbench.z, near: ctx.nearBench,
        offers: benchOffers(ctx.bench), carried: ctx.player.weapon.id,
      } : null;
    },
    
    
    
    
    get fireState() {
      return {
        fireHeld: ctx.fireHeld,
        hidden: ctx.hidden,
        dead: ctx.player.dead,
        struggling: !!ctx.player.struggle,
        ammo: ctx.player.weapon.ammo,
        cooldown: ctx.player.weapon.cooldown,
        canFire: canFire(ctx.player.weapon),
        fireT: ctx.fireT,
      };
    },
    
    
    
    get liftCar() { return ctx.liftCar ? { ...ctx.liftCar } : null; },
    clearOfCar(x, z) { return ctx.liftCar ? clearOfCar(ctx.liftCar, x, z, 0.2) : true; },
    
    
    
    
    
    
    
    get sfxSheet() {
      return {
        ready: sfxSheet.ready,
        failure: sfxSheet.failure,
        played: sfxSheet.played,
        byEffect: sfxSheet.byEffect,
      };
    },
    
    
    voice(b, kind) {
      if (!b) return 'no creature';
      const fn = b.kind === 'chicken' ? chickVoice : porkVoice;
      fn(b, kind, Math.hypot(b.x - ctx.player.x, b.z - ctx.player.z));
      return 'called';
    },
    
    
    
    whyVoice(b, kind) {
      if (!b) return { ok: false, why: 'no creature' };
      const table = SHEET_VOICE[b.kind] || SHEET_VOICE.chicken;
      return {
        ok: sheetVoice(b, kind),
        kind: b.kind,
        effect: table[kind] || null,
        hasNode: !!audio.at(b.x, b.z),
        sheetReady: sfxSheet.ready,
        audioRunning: audio.running,
        knownEffects: sfxSheet.effectNames,
        dist: Math.hypot(b.x - ctx.player.x, b.z - ctx.player.z),
      };
    },
    get wires() {
      let nearest = Infinity;
      for (const w of ctx.wires) {
        nearest = Math.min(nearest, Math.hypot(w.tip[0] - ctx.player.x, w.tip[2] - ctx.player.z));
      }
      return { count: ctx.wires.length, nearest: Number.isFinite(nearest) ? nearest : null };
    },
    
















    get footPlant() {
      const f = ctx.footPlant;
      return {
        samples: f.samples,
        max: +f.max.toFixed(4),
        mean: f.samples ? +(f.sum / f.samples).toFixed(4) : 0,
        over: f.over,
        worst: f.worst,
        
        
        
        
        
        pops: f.pops,
        popMax: +f.popMax.toFixed(4),
        popWorst: f.popWorst,
        
        
        clips: { ...f.clips },
        
        
        
        
        
        rawMax: +f.rawMax.toFixed(4),
        
        
        stances: f.stances,
        driftMax: +f.driftMax.toFixed(4),
        driftWorst: f.driftWorst,
        
        
        
        
        settle: {
          samples: f.settle.samples,
          max: +f.settle.max.toFixed(4),
          mean: f.settle.samples ? +(f.settle.sum / f.settle.samples).toFixed(4) : 0,
          over: f.settle.over,
          worst: f.settle.worst,
        },
      };
    },
    get sparks() { return { ...ctx.sparkStats }; },
    
    
    sparkNow() {
      let best = null; let bd = Infinity;
      for (const w of ctx.wires) {
        const d = Math.hypot(w.tip[0] - ctx.player.x, w.tip[2] - ctx.player.z);
        if (d < bd) { bd = d; best = w; }
      }
      if (!best) return null;
      ctx.sparkAt(best.tip);
      ctx.sparkFlash = 0.34;
      sparkSfx(best.tip[0], best.tip[2]);
      return { at: [...best.tip], dist: bd };
    },
    
    
    freshCreature(kind) { return spawnCreature(kind); },
    
    
    
    
    
    
    maim(kind, limb = 'leg-l') {
      const b = ctx.birds.find((q) => q.alive && q.kind === kind && q.creature);
      if (!b || !b.creature.limbs[limb]) return null;
      b.creature.limbs[limb].integrity = 0;
      b.creature.limbs[limb].severed = true;
      return statusOf(b.creature);
    },
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    staggerNow(kind, amount = 1, dir = Math.PI, limb = 'torso') {
      const b = ctx.birds.find((q) => q.alive && q.kind === kind && q.anim);
      if (!b) return null;
      const was = b.anim.state;
      b.anim = hitReact(b.anim, kind, limb, amount, dir);
      return {
        staggerT: b.anim.staggerT,
        staggerAmt: b.anim.staggerAmt,
        hitStopT: b.anim.hitStopT,
        was,
        state: b.anim.state,
        react: b.anim.react,
        x: b.x,
        z: b.z,
      };
    },
    
    
    
    
    
    
    
    
    killByLegs(kind = 'chicken') {
      const b = ctx.birds.find((q) => q.alive && q.kind === kind && q.creature);
      if (!b) return null;
      for (const limb of ['leg-l', 'leg-r']) applyDamage(b.creature, limb, 999);
      const st = statusOf(b.creature);
      return {
        alive: st.alive,
        causeOfDeath: st.causeOfDeath,
        severed: st.severedLimbs,
        mode: locomotion(b.kind, mobilityOf(b.creature)).mode,
        dying: !!(b.anim && b.anim.dying),
      };
    },
    
    
    
    
    locomotionOf(which = 'chicken') {
      const b = typeof which === 'number'
        ? ctx.birds[which]
        : ctx.birds.find((q) => q.alive && q.kind === which && q.creature);
      if (!b || !b.creature) return null;
      const l = locomotion(b.kind, mobilityOf(b.creature));
      return {
        kind: b.kind, x: b.x, z: b.z, i: ctx.birds.indexOf(b),
        mode: l.mode, speedMps: l.speedMps, heightScale: l.heightScale,
        canLatch: l.canLatch, bleedOut: l.bleedOut,
        state: b.anim ? b.anim.state : null,
        dying: !!(b.anim && b.anim.dying),
        bleedLeft: b.anim ? (b.anim.bleedLeft ?? 0) : 0,
        retreat: b.retreat ? b.retreat.phase : null,
      };
    },
    
    
    get creatureStats() { return { ...ctx.creatureStats }; },
    
    
    animOf(kind) {
      const b = ctx.birds.find((q) => q.alive && q.kind === kind && q.anim);
      return b ? { ...b.anim, gallopGait: b.gallopGait } : null;
    },
    
    
    
    settleNow() { return settleSfx(ctx.player.x + 4, ctx.player.z + 6); },
    
    
    
    
    
    
    
    facingOf(b) {
      if (!b || !b.mesh) return null;
      b.mesh.updateMatrixWorld(true);
      const m = b.mesh.matrixWorld.elements;
      
      const axis = (i) => ({ x: m[i * 4], y: m[i * 4 + 1], z: m[i * 4 + 2] });
      const dx = ctx.player.x - b.x; const dz = ctx.player.z - b.z;
      const len = Math.hypot(dx, dz) || 1;
      const toPlayer = { x: dx / len, z: dz / len };
      const dot = (a) => {
        const l = Math.hypot(a.x, a.z) || 1;
        return (a.x / l) * toPlayer.x + (a.z / l) * toPlayer.z;
      };
      return {
        toPlayer,
        localX: axis(0),
        localY: axis(1),
        localZ: axis(2),
        dotX: dot(axis(0)),
        dotY: dot(axis(1)),
        dotZ: dot(axis(2)),
        rotZ: b.mesh.rotation.z,
      };
    },
    
    
    
    holdFlash(on) {
      ctx.flashHeld = !!on;
      if (!on && ctx.mat && ctx.mat.uniforms.uFlash) ctx.mat.uniforms.uFlash.value = 0;
    },
    get flashTicks() { return ctx.flashTicks; },
    get dim() { return ctx.mat && ctx.mat.uniforms.uDim ? ctx.mat.uniforms.uDim.value : 1; },
    
    
    toProp() {
      let best = null; let bd = Infinity;
      for (const p of ctx.props) {
        const d = Math.hypot(p.x - ctx.player.x, p.z - ctx.player.z);
        if (d < bd) { bd = d; best = p; }
      }
      if (!best) return null;
      
      
      
      
      
      
      
      
      
      for (let i = 0; i < 16; i += 1) {
        const a = (i / 16) * Math.PI * 2;
        const px = best.x + Math.sin(a) * 1.5;
        const pz = best.z + Math.cos(a) * 1.5;
        if (!insideLevel(ctx.deck, px, pz, 0.45)) continue;
        if (!clearOfProps(ctx.solidProps, px, pz)) continue;
        ctx.player.x = px; ctx.player.z = pz;
        return { x: best.x, z: best.z, from: { x: px, z: pz }, was: bd };
      }
      return null;
    },
    
    
    step(dx, dz) {
      const m = moveInLevel(ctx.deck, ctx.player, dx, dz, 0.4, ctx.solidProps);
      ctx.player.x = m.x; ctx.player.z = m.z;
      return { x: m.x, z: m.z };
    },
    clearOfProp(x, z) { return clearOfProps(ctx.solidProps, x, z); },
    
    
    
    
    
    get solidCircles() { return ctx.solidProps.map((o) => ({ x: o.x, z: o.z, r: o.r })); },
    get props() {
      return {
        count: ctx.props.length,
        solid: ctx.solidProps.length,
        litShadows: ctx.props.filter((p) => p.mat.opacity > 0.01).length,
      };
    },
    
    
    
    
    
    
    poseShot() {
      const yaw = ctx.player.yaw;
      const dx = -Math.sin(yaw); const dz = Math.cos(yaw);
      const from = [ctx.player.x + dx * 0.34, 1.16, ctx.player.z + dz * 0.34];
      const to = [ctx.player.x + dx * 6, 1.06, ctx.player.z + dz * 6];
      if (ctx.tracers) { ctx.tracers.fire(from, to); ctx.tracers.freeze(40); }
      if (ctx.ricochets) ctx.ricochets.burst(to[0], to[1], to[2], { x: dx, z: dz }, { x: -dx, z: -dz });
      return { from, to };
    },
    get shots() { return { ...ctx.shotStats }; },
    
    
    shootWall() {
      ctx.shotStats.forcedAt = null;
      const range = ctx.player.weapon.spec?.range ?? 18;
      for (const yaw of [ctx.player.yaw, ctx.player.yaw + 1.57, ctx.player.yaw + 3.14, ctx.player.yaw + 4.71]) {
        const dx = -Math.sin(yaw); const dz = Math.cos(yaw);
        for (let d2 = 0.4; d2 < range; d2 += 0.22) {
          if (!insideLevel(ctx.deck, ctx.player.x + dx * d2, ctx.player.z + dz * d2, 0.02)) {
            ctx.player.yaw = yaw;
            ctx.shotStats.forcedAt = d2;
            return { yaw, dist: d2 };
          }
        }
      }
      return null;
    },
    get hide() {
      return {
        phase: ctx.hide.phase, door: ctx.hide.door, step: ctx.hide.step,
        protectedNow: hideProtects(ctx.hide), draws: hideDrawsPlayer(ctx.hide),
      };
    },
    
    
    hideNow() {
      let best = null; let bd = Infinity;
      for (const l of ctx.lockers) {
        const d = Math.hypot(l.x - ctx.player.x, l.z - ctx.player.z);
        if (d < bd) { bd = d; best = l; }
      }
      if (!best) return null;
      ctx.player.x = best.x; ctx.player.z = best.z;
      ctx.hideLocker = best; ctx.hideWant = true;
      return { x: best.x, z: best.z };
    },
    unhideNow() { ctx.hideWant = true; return ctx.hide.phase; },
    
    
    
    
    
    
    
    
    snapCamera() {
      ctx.camState = null;
      return ctx.camMode;
    },
    get mumble() { return { count: mumbleState.count, playing: !!mumbleState.stop }; },
    get gunVisible() { return ctx.gun.visible; },
    get injury() { return ctx.injuryDbg; },
    get liftForced() { return ctx.liftForced; },
    
    
    
    
    get liftStats() { return { ...ctx.liftStats }; },
    
    
    
    
    
    
    
    get liftLeaves() {
      if (!ctx.liftDoors || !ctx.liftGroup) return [];
      const yaw = ctx.liftGroup.rotation.y;
      const ax = Math.cos(yaw); const az = -Math.sin(yaw);
      const fx = Math.sin(yaw); const fz = Math.cos(yaw);
      return ctx.liftDoors.map((d) => ({
        x: ctx.liftGroup.position.x + ax * d.position.x + fx * d.position.z,
        z: ctx.liftGroup.position.z + az * d.position.x + fz * d.position.z,
        ax, az, fx, fz, halfLen: LIFT.width / 4, halfThick: 0.06,
      }));
    },
    
    
    get audioState() { return audio.ctx ? audio.ctx.state : null; },
    
    
    
    
    
    get audioMuted() {
      return {
        flag: audio.muted,
        
        
        
        master: audio.masterBus ? audio.masterBus.gain.value : null,
        music: audio.musicBus ? audio.musicBus.gain.value : null,
        sfx: audio.sfxBus ? audio.sfxBus.gain.value : null,
      };
    },
    
    
    get studioOn() { return !!ctx.studio; },
    
    
    
    
    xanderScreenBox() { return ctx.screenBoxOf(ctx.xRig); },
    creatureScreenBox(i) { const b = ctx.birds[i]; return b && b.mesh ? ctx.screenBoxOf(b.mesh) : null; },
    
    
    
    
    
    
    
    xanderPartBox(name) { return partBox(name); },
    
    
    
    
    
    
    xanderProportions() {
      const parts = ctx.xanderAllParts || [];
      let lo = Infinity; let hi = -Infinity; let hLo = Infinity; let hHi = -Infinity;
      for (const p of parts) {
        const isHead = p.name === 'head' || p.name === 'hair';
        const P = p.mesh.positions;
        for (let i = 2; i < P.length; i += 3) {
          const z = P[i];
          if (z < lo) lo = z; if (z > hi) hi = z;
          if (isHead) { if (z < hLo) hLo = z; if (z > hHi) hHi = z; }
        }
      }
      const H = hi - lo; const headH = hHi - hLo;
      return {
        parts: parts.length, height: H, headHeight: headH,
        headsTall: headH > 0 ? +(H / headH).toFixed(3) : 0,
        headCm: headH > 0 ? +((headH / H) * XANDER_H * 100).toFixed(1) : 0,
      };
    },
    
    
    
    
    
    
    
    
    
    
    
    
    
    xanderSkinSample(o = {}) {
      
      
      
      const r = ctx.renderer;
      const { patch, regionMode } = canvasReader();
      const head = partBox('head'); const hand = partBox(o.hand || 'handL'); const fore = partBox(o.forearm || 'forearmL');
      const bodyMat = ctx.xander.material; const faceMat = ctx.xHead.material;
      const out = {
        textured: isTextured(bodyMat) && isTextured(faceMat),
        atlas: ctx.atlasTex ? { width: ctx.atlasTex.image.width, height: ctx.atlasTex.image.height } : null,
        head, hand, forearm: fore,
      };
      if (!head || !hand) return { ...out, error: 'a part box is missing - is he on screen?' };
      
      
      const cheekAt = [head.x0 + (head.x1 - head.x0) * (o.cheekX ?? 0.28), head.y0 + (head.y1 - head.y0) * (o.cheekY ?? 0.64)];
      const handAt = [(hand.x0 + hand.x1) / 2, (hand.y0 + hand.y1) / 2];
      const foreAt = fore ? [(fore.x0 + fore.x1) / 2, (fore.y0 + fore.y1) / 2] : null;
      
      out.lit = { cheek: patch(...cheekAt), hand: regionMode(hand), forearm: fore ? regionMode(fore) : null };
      out.lit.deltaE = deltaE(out.lit.cheek, out.lit.hand);
      
      const flatPair = flatMaterials();
      flatPair.body.uniforms.uMap.value = bodyMat.uniforms ? bodyMat.uniforms.uMap.value : null;
      flatPair.face.uniforms.uMap.value = faceMat.uniforms ? faceMat.uniforms.uMap.value : null;
      ctx.xander.material = flatPair.body; ctx.xHead.material = flatPair.face;
      try {
        r.render(ctx.scene, ctx.camera);
        out.cheek = patch(...cheekAt); out.hand = regionMode(hand); out.forearm = fore ? regionMode(fore) : null;
      } finally {
        ctx.xander.material = bodyMat; ctx.xHead.material = faceMat;
      }
      out.deltaE = deltaE(out.cheek, out.hand);
      out.deltaEForearm = out.forearm ? deltaE(out.cheek, out.forearm) : null;
      out.where = { cheek: cheekAt, hand: handAt, forearm: foreAt };
      return out;
    },
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    xanderColourSample(o = {}) {
      const r = ctx.renderer;
      const cv = canvasReader();
      const head = partBox('head'); const hair = partBox('hair'); const pelvis = partBox('hips'); const torso = partBox('chest');
      const out = { boxes: { head, hair, pelvis, torso } };
      if (!head) return { ...out, error: 'no head box - is he on screen?' };
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const CROWN = o.crown || [0.34, 0.02, 0.66, 0.16];
      const CHEEK = o.cheek || [0.28, 0.64];
      const STRAP = o.strap || [0.76, 0.00, 0.99, 0.045];
      const cheekAt = [head.x0 + (head.x1 - head.x0) * CHEEK[0], head.y0 + (head.y1 - head.y0) * CHEEK[1]];
      const tag = (c) => (c ? { rgb: c, lum: relLum(c), stop: nearestFamily(c) } : null);
      const readTriple = (R, boxes) => ({
        skin: tag(R.patch(...(boxes.cheekAt || cheekAt))),
        hair: tag(R.bandMode(boxes.head, ...CROWN)),
        denim: tag(boxes.pelvis ? R.regionMode(boxes.pelvis) : R.bandMode(boxes.torso, ...STRAP)),
      });
      
      out.lit = readTriple(cv, { head, torso, pelvis });
      
      
      out.lit.thigh = tag(cv.regionMode(partBox('thighL')));
      
      const bodyMat = ctx.xander.material; const faceMat = ctx.xHead.material;
      out.textured = isTextured(bodyMat) && isTextured(faceMat);
      const flatPair = flatMaterials();
      flatPair.body.uniforms.uMap.value = bodyMat.uniforms ? bodyMat.uniforms.uMap.value : null;
      flatPair.face.uniforms.uMap.value = faceMat.uniforms ? faceMat.uniforms.uMap.value : null;
      ctx.xander.material = flatPair.body; ctx.xHead.material = flatPair.face;
      try {
        r.render(ctx.scene, ctx.camera);
        out.flat = readTriple(cv, { head, torso, pelvis });
        out.flat.thigh = tag(cv.regionMode(partBox('thighL')));
      } finally {
        ctx.xander.material = bodyMat; ctx.xHead.material = faceMat;
      }
      
      
      
      const sep = (t) => (t && t.hair && t.skin && t.skin.lum > 0
        ? { hairLum: t.hair.lum, skinLum: t.skin.lum, ratio: +(t.hair.lum / t.skin.lum).toFixed(3), deltaE: deltaE(t.hair.rgb, t.skin.rgb) }
        : null);
      out.hairSkin = { flat: sep(out.flat), lit: sep(out.lit) };
      
      
      
      
      
      
      
      
      
      const FAMILY_OF = { skin: 'skin', hair: 'hair', denim: 'denim' };
      out.litFamilies = Object.fromEntries(Object.entries(FAMILY_OF).map(([k, fam]) => {
        const p = out.lit[k];
        return [k, p ? { want: fam, got: p.stop.family, stop: p.stop.stop, distance: p.stop.distance, ok: p.stop.family === fam } : null];
      }));
      out.litMaterialsKept = Object.values(out.litFamilies).filter((q) => q && q.ok).length;
      
      const p = ctx.portrait && ctx.portrait.readback ? ctx.portrait.readback() : null;
      if (p && p.boxes && p.boxes.head) {
        const pr = bufferReader(p);
        const pHead = p.boxes.head;
        const pCheek = [pHead.x0 + (pHead.x1 - pHead.x0) * CHEEK[0], pHead.y0 + (pHead.y1 - pHead.y0) * CHEEK[1]];
        out.portrait = readTriple(pr, { head: pHead, torso: p.boxes.torso, cheekAt: pCheek });
        out.portrait.canvas = { width: p.width, height: p.height };
        
        
        
        out.portrait.boxes = p.boxes;
        
        
        
        
        
        
        if (o.grid) {
          const grid = (R, box) => (box ? Array.from({ length: 6 }, (_, j) => Array.from({ length: 4 }, (_, i) => {
            const c = R.bandMode(box, i / 4, j / 24, (i + 1) / 4, (j + 1) / 24);
            return c ? `${nearestFamily(c).family}` : '-';
          }).join(' ')) : null);
          out.grid = { model: grid(cv, torso), portrait: grid(pr, p.boxes.torso) };
        }
        
        
        
        
        const pair = (k) => {
          const a = out.lit[k]; const b = out.portrait[k];
          return a && b ? { model: a.rgb, portrait: b.rgb, deltaE: deltaE(a.rgb, b.rgb), deltaEab: deltaEab(a.rgb, b.rgb) } : null;
        };
        const parts = { skin: pair('skin'), hair: pair('hair'), denim: pair('denim') };
        const got = Object.values(parts).filter((q) => q && q.deltaEab !== null);
        out.portraitMatch = {
          ...parts,
          
          
          
          measured: Object.entries(parts).filter(([, q]) => q && q.deltaEab !== null).map(([k]) => k),
          worstDeltaE: got.length ? +Math.max(...got.map((q) => q.deltaE)).toFixed(2) : null,
          worstDeltaEab: got.length ? +Math.max(...got.map((q) => q.deltaEab)).toFixed(2) : null,
        };
      } else {
        out.portrait = null;
        out.portraitMatch = null;
      }
      
      
      
      
      
      
      if (ctx.look) {
        const v = ctx.look.lightAt(_lightAt, ctx.player.x, 1.0, ctx.player.z);
        out.light = [+v.x.toFixed(3), +v.y.toFixed(3), +v.z.toFixed(3)];
        if (ctx.look.fieldAt) out.field = ctx.look.fieldAt(ctx.player.x, 1.0, ctx.player.z).map((q) => +q.toFixed(3));
      }
      out.where = { crown: CROWN, cheek: CHEEK, strap: STRAP };
      return out;
    },
    
    
    materialCensus() {
      const mats = new Set(); const tex = new Set(); let meshes = 0;
      ctx.scene.traverse((o) => {
        if (!o.isMesh || !o.visible) return;
        meshes += 1;
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of ms) {
          if (!m) continue;
          mats.add(m.uuid);
          for (const k of ['map', 'uMap', 'uTex']) {
            const t = m[k] || (m.uniforms && m.uniforms[k] && m.uniforms[k].value);
            if (t && t.uuid) tex.add(t.uuid);
          }
        }
      });
      return { materials: mats.size, textures: tex.size, meshes };
    },
    beginEntrance(i, species) { return ctx.beginEntrance(i, species); },
    
    
    
    clearOpeningPending() { const n = ctx.openingPending.length; ctx.openingPending = []; return n; },
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    forceStruggle(verb) {
      
      
      
      
      
      
      
      
      
      let b = ctx.birds.find((q) => q.alive && q.kind !== 'horse');
      if (!b) {
        b = ctx.birds.find((q) => q.kind !== 'horse' && q.mesh);
        if (!b) return null;
        b.alive = true;
        b.dying = undefined;
        if (b.mesh) b.mesh.visible = true;
        b.x = ctx.player.x; b.z = ctx.player.z + 0.8;
      }
      b.latched = true;
      b.cool = 0;
      ctx.player.latchedBy = b;
      ctx.player.struggle = createStruggle({
        verb: verb || 'mash',
        mode: struggleMode(ctx.access, 'reduced'),
      });
      return ctx.player.struggle.verb;
    },
    get paused() { return ctx.paused; },
    setPaused(on) { if (ctx.api_setPaused) ctx.api_setPaused(on); return ctx.paused; },
    saveNow() {
      const save = makeSave(ctx.runState(), Date.now());
      ctx.writeLocalSave(save);
      return save;
    },
    readSave() { return ctx.readLocalSave(); },
    get frames() { return ctx.frameCount; },
    get render() {
      const i = ctx.renderer.info;
      return {
        tris: i.render.triangles,
        calls: i.render.calls,
        geometries: i.memory.geometries,
        textures: i.memory.textures,
      };
    },
    get opening() {
      return ctx.openingPending.map((op) => ({
        species: op.species,
        kind: op.gate.kind,
        fromStart: +Math.hypot(op.gate.x - ctx.deck.start.x, op.gate.z - ctx.deck.start.z).toFixed(1),
      }));
    },
    
    
    
    
    
    
    
    
    get hazards() { return hazardsDebug(ctx); },
    
    
    
    
    
    
    get vision() { return hazardsVision(ctx); },
    get beats() { return beatsDebug(ctx); },
    get openingRule() { return openingDebug(ctx); },
    get dressing() {
      const d = ctx.dressing;
      if (!d) return null;
      return {
        archetype: d.archetype, kit: d.kit.key, kitProps: d.kit.props.slice(),
        props: d.props.length, placed: ctx.props.length, solids: ctx.solidProps.length,
        rooms: d.rooms.map((r) => ({ kind: r.room.kind, template: r.template, props: r.props.length })),
        fixtures: d.lights.fixtures.length, spacing: +d.lights.spacing.toFixed(2),
        hazardDamage: hazardDamageTaken(ctx), beatsFired: beatsFired(ctx),
      };
    },
    get litter() { return ctx.debrisPool.filter((d) => d.live && d.settled).length; },
    camFov() { return ctx.camera.fov; },
    ceilVis() { let v = 0; for (const c of ctx.ceilingPieces) if (c.visible) v += 1; return { visible: v, total: ctx.ceilingPieces.length }; },
    get director() {
      return ctx.director ? { budget: ctx.director.budget, fired: ctx.director.fired, cooldown: +ctx.director.cooldown.toFixed(1) } : null;
    },
    get entrances() {
      return ctx.entrances.map((en) => ({
        kind: en.gm.gate.kind, phase: en.e.phase, k: +(en.e.k || 0).toFixed(2),
        bx: +en.b.x.toFixed(2), bz: +en.b.z.toFixed(2), entering: !!en.b.entering,
      }));
    },
    get gates() {
      return ctx.gateMeshes.map((m) => ({
        kind: m.gate.kind, x: +m.gate.x.toFixed(2), z: +m.gate.z.toFixed(2),
        nx: m.gate.nx, nz: m.gate.nz, drawn: !!m.group,
        
        
        
        
        opened: !!m.opened,
      }));
    },
    get deckCard() {
      const el = document.getElementById('deckCard');
      return { text: el ? el.textContent : '', opacity: el ? +(el.style.opacity || 0) : 0 };
    },
    get danger() {
      return {
        danger: isDanger(ctx.player.vitals.health, MAX_HEALTH),
        stumbling: ctx.stumbleT >= 0,
        walked: +ctx.walkedTotal.toFixed(2),
        nextStumble: +ctx.stumbleAt.toFixed(2),
      };
    },
    get intro() {
      if (ctx.intro) {
        return {
          shot: INTRO_SHOTS[ctx.intro.shot].id, t: +ctx.intro.t.toFixed(2),
          tShot: +ctx.intro.tShot.toFixed(2), leaving: ctx.intro.leaving, done: false,
        };
      }
      return ctx.introDone ? { done: true } : null;
    },
    
    
    introJump(shotId) {
      if (!ctx.intro) return false;
      const idx = INTRO_SHOTS.findIndex((sh) => sh.id === shotId);
      if (idx < 0) return false;
      ctx.intro = { ...ctx.intro, shot: idx, tShot: 0, fired: 0 };
      ctx.routeIntroCue({ kind: 'shotStart', shotId });
      return true;
    },
    get aim() { return { up: ctx.aimLatch.up, u: +ctx.aimLatch.u.toFixed(3), target: !!ctx.target, armsShown: ctx.walkArmsShown }; },
    get vox() {
      return {
        ready: voxSheet.ready, failure: voxSheet.failure,
        played: voxSheet.played, lastId: voxSheet.lastId,
      };
    },
    
    
    
    
    
    holdPA(seconds) { ctx.paIn = seconds; return ctx.paIn; },
    get gunSfx() { return { ...gunSfx }; },
    
    
    emptyGun() { ctx.player.weapon.ammo = 0; },
    get camBasis() {
      const f = { x: ctx.camTarget.x - ctx.camEye.x, z: ctx.camTarget.z - ctx.camEye.z };
      const m = Math.hypot(f.x, f.z) || 1;
      return { fx: f.x / m, fz: f.z / m, rx: -f.z / m, rz: f.x / m };
    },
    
    
    
    
    get cameraMode() { return ctx.camMode; },
    
    
    toLift() {
      
      
      
      
      if (ctx.liftCar && ctx.liftCar.kind === 'arrival') ctx.parkCarAtTerminus();
      if (ctx.liftCar) { ctx.player.x = ctx.liftCar.x; ctx.player.z = ctx.liftCar.z; }
      else { ctx.player.x = ctx.EXIT.x; ctx.player.z = ctx.EXIT.z; }
    },
    
    
    
    
    buildDeck(n) { ctx.level = n; ctx.buildWorld(n); return ctx.level; },
    get ride() {
      return {
        phase: ctx.ride.phase, door: ctx.ride.door, rise: ctx.ride.rise, sealed: ctx.ride.sealed,
      };
    },
    
    
    
    get audio() { return audio; },
    
    
    
    
    
    get tape() {
      return { audible: tape.audible, side: tape.sideName, title: tape.title };
    },
    get steps() { return ctx.stepCount; },
    
    
    
    
    
    
    get hits() { return ctx.hitCount; },
    
    
    
    
    
    
    
    get fireStats() { return { ...ctx.fireStats, stopT: +Math.max(0, ctx.hitStopT).toFixed(4), punch: +ctx.camPunchRad.toFixed(5) }; },
    
    
    
    get aimPoint() { return ctx.lastAimPoint ? { ...ctx.lastAimPoint } : null; },
    get aimMode() { return ctx.aimLowNow ? 'low' : 'centre'; },
    
    
    
    
    get pa() { return ctx.paCount; },
    firePA() { ctx.tannoy(); },
    
    
    
    
    
    get barks() {
      const c = currentBark(ctx.barks);
      return {
        current: c ? { ...c } : null,
        saidCount: ctx.barks.said.size,
        
        
        
        t: ctx.barks.t,
        quietUntil: ctx.barks.quietUntil,
      };
    },
    sayNow(trigger) {
      return trigger === 'pa'
        ? say(ctx.barks, null, { who: 'pa', force: true })
        : say(ctx.barks, trigger, { force: true });
    },
    get lights() {
      
      
      if (ctx.look) {
        const st = ctx.look.stats(null);
        return { total: ctx.look.lamps.length, dimmed: st.dimmed, flickering: st.flickering, dead: st.dead };
      }
      let lit = 0;
      for (const st of ctx.strips) if (st.mat && st.mat.uniforms && st.mat.uniforms.uAlpha) {
        if (st.mat.uniforms.uAlpha.value < 0.98) lit += 1;
      }
      return { total: ctx.strips.length, dimmed: lit };
    },
    
    
    
    
    lookStats() { return ctx.look ? ctx.look.stats(ctx.camera) : null; },
    
    
    toPickup() {
      const it = ctx.pickups.find((q) => !q.taken);
      if (!it) return null;
      ctx.player.x = it.x; ctx.player.z = it.z;
      return { ammo: it.ammo };
    },
    
    
    
    
    testShot() {
      const b = ctx.birds.find((q) => q.alive && q.creature);
      if (!b) return null;
      const dx = ctx.player.x - b.x; const dz = ctx.player.z - b.z;
      const dist = Math.hypot(dx, dz);
      const fx = dx / dist; const fz = dz / dist;
      const rx = fz; const rz = -fx;
      const bh = { porker: PORKER_HEIGHT_M, cow: COW_HEIGHT_M }[b.kind] ?? CHICKEN_H;
      const toLocal = (wx, wy, wz) => {
        const ox = wx - b.x; const oz = wz - b.z;
        return {
          x: (ox * rx + oz * rz) / bh,
          y: wy / bh,
          z: (ox * fx + oz * fz) / bh,
        };
      };
      const side = ((ctx.player.x - b.x) * rx + (ctx.player.z - b.z) * rz) >= 0 ? 1 : -1;
      const lx = b.x + rx * side * 0.062 * bh;
      const lz = b.z + rz * side * 0.062 * bh;
      const aimYaw = Math.atan2(-(b.x - ctx.player.x), b.z - ctx.player.z);
      const legYaw = Math.atan2(-(lx - ctx.player.x), lz - ctx.player.z);
      const from = toLocal(ctx.player.x, 0.62, ctx.player.z);
      
      
      const shot = (mz, aimAt, yaw) => {
        const f2 = toLocal(ctx.player.x, mz, ctx.player.z);
        const t2 = toLocal(
          ctx.player.x - Math.sin(yaw) * dist * 1.8,
          mz + (aimAt * bh - mz) * 1.8,
          ctx.player.z + Math.cos(yaw) * dist * 1.8,
        );
        return { from: f2, to: t2, hit: resolveHit(b.creature, f2, t2) };
      };
      const high = shot(1.30, 0.50, aimYaw);
      const low = shot(0.62, 0.14, legYaw);
      return {
        kind: b.kind, dist, bh, from, to: low.to,
        high: high.hit, low: low.hit,
        keysQ: ctx.keys.has('KeyQ'),
        hit: low.hit,
        
        
        
        limbs: Object.values(b.creature.limbs).map((l) => [l.id, l.integrity, l.severed]),
      };
    },
    get isBoss() { return ctx.isBoss; },
    get fight() { return ctx.fight; },
    get horseSpeed() { return ctx.bossHorseSpeed; },
    
    
    
    
    
    
    
    
    
    exhaustBoss() {
      if (!ctx.fight) return;
      ctx.fight.fatigue.value = 100;
      ctx.fight.fatigue.gaveUp = true;
      ctx.fight.fatigue.givenUpFor = BOSS_HORSE.giveUpSeconds;
    },
    
    setStudio(o) {
      ctx.studio = o;
      
      
      
      
      
      
      
      
      
      if (dimBase === null && ctx.mat && ctx.mat.uniforms.uDim) dimBase = ctx.mat.uniforms.uDim.value;
      if (dimBase !== null) {
        const want = o && o.silhouette ? 0 : dimBase;
        for (const fm of FLASH_MATS) if (fm.uniforms && fm.uniforms.uDim) fm.uniforms.uDim.value = want;
      }
    },
    get studio() { return ctx.studio; },
    
    
    
    
    
    
    kickNow() { ctx.kickT = 0; },
    












    flinchNow(bearing) {
      ctx.flinchT = 0;
      if (Number.isFinite(bearing)) ctx.flinchBearing = bearing;
    },
    reachNow() { ctx.reachT = 0; },
    get kickT() { return ctx.kickT; },
    get flinchT() { return ctx.flinchT; },
    get reachT() { return ctx.reachT; },
    get walkPhase() { return ctx.walkPhase; },
    get pendingPickup() { return !!ctx.pendingPickup; },
    
    
    
    get pickupItems() {
      return ctx.pickups.map((q) => ({
        x: q.x, z: q.z, taken: q.taken, medkit: !!q.medkit, ammo: !!q.ammo,
      }));
    },
    
    
    get poseLean() { return ctx.xTilt.rotation.x; },
    











    get poseRoll() { return ctx.xTilt.rotation.z; },
    
    
    
    
    get poseFeet() { return ctx.lastPosedFeet; },
    get startStep() { return { dist: +ctx.startDist.toFixed(3), phase: +ctx.startPhase.toFixed(3) }; },
    
    
    
    
    say(trigger) { const l = say(ctx.barks, trigger, { force: true }); return l ? l.id : null; },
    get access() { return { ...ctx.access, shake: shakeScale(ctx.access), flash: flashScale(ctx.access) }; },
    get body() {
      return {
        talking: ctx.talkT >= 0, fidget: ctx.fidgetT >= 0 ? ctx.fidgetWhich : -1,
        still: +ctx.stillFor.toFixed(1),
        roll: +ctx.xTilt.rotation.z.toFixed(4), flinchSide: ctx.flinchSide,
      };
    },
    get rest() {
      return {
        safeIdle: +ctx.safeIdle.toFixed(2), resting: ctx.resting,
        k: ctx.restNow ? +ctx.restNow.k.toFixed(2) : 0, seated: !!(ctx.restNow && ctx.restNow.seated),
        blown: ctx.blown,
      };
    },
    get bobY() { return ctx.xRig.position.y; },
    
    
    
    
    
    
    
    
    
    
    
    
    get facing() {
      const v = new THREE.Vector3(1, 0, 0);
      ctx.xander.updateWorldMatrix(true, false);
      v.applyQuaternion(ctx.xander.getWorldQuaternion(new THREE.Quaternion()));
      return {
        mesh: [v.x, v.z],
        rule: [-Math.sin(ctx.player.yaw), Math.cos(ctx.player.yaw)],
        yaw: ctx.player.yaw,
      };
    },

    
    
    
    
    
    
    
    
    
    
    
    get coop() {
      const rt = ctx.coopNet;
      if (!rt) return { mode: 'off', active: false };
      const s = rt.session;
      const c = s ? s.coop : null;
      return {
        mode: rt.mode,
        active: rt.active,
        guest: rt.guest,
        watching: rt.watching,
        code: rt.code,
        spoken: rt.spoken,
        status: rt.status,
        me: s ? s.id : null,
        seat: s ? s.seat : null,
        seated: s ? s.seated : false,
        hostId: c ? c.hostId : null,
        phase: c ? c.phase : null,
        level: c ? c.level : null,
        peers: c ? { ...c.peers } : {},
        down: c ? Object.keys(c.down) : [],
        partner: rt.partnerId(),
        partnerBody: rt.partnerBody(),
        seats: rt.seatBodies(),
        stats: rt.stats,
        revive: rt.revivePrompt,
        creatures: ctx.birds.map((b, i) => ({
          i, kind: b.kind, alive: !!b.alive, x: +b.x.toFixed(3), z: +b.z.toFixed(3),
          latchTo: b.latchTo ?? null, puppet: !!b.puppet,
        })),
        
        
        
        host: () => rt.openHost(),
        join: (code, watch) => rt.joinRoom(code, !!watch),
        local: () => rt.openLocal(),
        begin: () => rt.beginRun(),
        
        
        
        
        
        liftInside: (local) => rt.liftInside(!!local),
        grab: (who, i) => rt.grab(who, i),
        free: (who, i) => rt.free(who, i),
        hurt: (n) => { ctx.player.vitals.health = Math.max(0, ctx.player.vitals.health - n); },
        
        
        
        
        
        
        
        restore: () => {
          ctx.endStruggleWith();
          ctx.player.vitals.health = 100;
          return ctx.player.vitals.health;
        },
      };
    },
  };
}
