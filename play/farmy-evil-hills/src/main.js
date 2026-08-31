






















import * as THREE from 'three';

import { solve, RIG as FRIG, ARCH } from '../../2d-fighter-ex/src/animeRig.mjs';
import { poseById } from '../../2d-fighter-ex/src/moveSet.mjs';
import { segmentsOf, torsoBoxOf, jointsOf, girdleOf } from '../../../web-engine/ps1/ps1Rig.mjs';
import { buildFighter } from '../../../web-engine/ps1/ps1Mesh.mjs';
import { hair3d } from '../../../web-engine/ps1/ps1Head.mjs';
import { buildChicken } from '../../../web-engine/ps1/creatures/chicken.mjs';
import { ps1Vertex, FRAGMENT, KEY_DIR, FILL_DIR } from '../../../web-engine/ps1/ps1Shader.mjs';
import { PS1_SNAP } from '../../shared/ps1Render/ps1Material.js';

import { emptyCamera, stepCamera, cameraPlacement } from '../../../web-engine/horror/camera.js';
import { spawnVitals, tickVitals, damage, beginGrapple, endGrapple, MAX_HEALTH, CHICKEN_LATCH_SLOW } from '../../../web-engine/horror/health.js';
import { spawn as spawnCreature, resolveHit, applyDamage, mobilityOf, statusOf } from '../../../web-engine/horror/dismemberment.js';
import { readyWeapon, tickWeapon, canFire, fire } from '../../../web-engine/horror/weapons.js';
import { createStruggle, VERB_FOR, promptFor } from '../../../web-engine/horror/struggle.js';
import { initAnalytics, trackEvent } from 'arbelo/analytics';

const XANDER_H = 1.80;
const CHICKEN_H = 1.14;
const HALL_W = 3.2;
const HALL_H = 2.8;
const HALL_LEN = 90;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));








const XCOL = { top: 0xa8402f, pant: 0x39476b, accent: 0x5a3a24, skin: 0xd9a07a, hair: 0x4a3524 };
const CCOL = {
  torso: 0xb9b07a, wingL: 0xa89a68, wingR: 0xa89a68, tail: 0x8d8352,
  head: 0xc9a98c, beak: 0xd8c27a, comb: 0x8e3b46,
  legL: 0xc4a06d, legR: 0xc4a06d, eyeL: 0x241a1c, eyeR: 0x241a1c,
};









function partsToGeometry(parts, colourOf, targetHeight) {
  let lo = Infinity; let hi = -Infinity;
  for (const p of parts) {
    for (let i = 2; i < p.mesh.positions.length; i += 3) {
      if (p.mesh.positions[i] < lo) lo = p.mesh.positions[i];
      if (p.mesh.positions[i] > hi) hi = p.mesh.positions[i];
    }
  }
  const s = (hi - lo) > 1e-6 ? targetHeight / (hi - lo) : 1;

  const pos = []; const col = []; const idx = [];
  for (const p of parts) {
    const base = pos.length / 3;
    const c = new THREE.Color(colourOf(p.name));
    for (let i = 0; i < p.mesh.positions.length; i += 3) {
      pos.push(
        p.mesh.positions[i] * s,
        p.mesh.positions[i + 1] * s,
        (p.mesh.positions[i + 2] - lo) * s,   
      );
      col.push(c.r, c.g, c.b);
    }
    for (const i of p.mesh.indices) idx.push(base + i);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((pos.length / 3) * 2).fill(0), 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

function xanderParts() {
  const A = ARCH.renji;
  const build = A.build || 1;
  const pose = poseById('guard');
  const K = solve(pose, { flip: false });
  const o = { flip: false, build };
  const built = buildFighter(K, {
    segments: segmentsOf(K, o), torso: torsoBoxOf(K, o),
    joints: jointsOf(K, o), girdle: girdleOf(K, o),
    headR: FRIG.headR, arch: { build, jaw: A.jaw, brow: A.brow, hair: 'crop' },
    flip: false, pose, head: true,
  });
  
  
  
  return [...built.parts,
    { name: 'hair', mesh: hair3d('crop', { centre: [K.head[0], 0, K.head[1]], r: FRIG.headR, forward: [1, 0, 0] }) },
  ].filter((p) => p.mesh && p.mesh.indices && p.mesh.indices.length);
}
const xColour = (n) => (n === 'hair' ? XCOL.hair
  : /^pelvis|^thigh|^shin|^hip\d|^knee|^ankle/.test(n) ? XCOL.pant
    : /^torso|^trapezius/.test(n) ? XCOL.top
      : /^foot/.test(n) ? XCOL.accent : XCOL.skin);


function panel(w, h, colour, place) {
  const g = new THREE.PlaneGeometry(w, h);
  const n = g.attributes.position.count;
  const c = new THREE.Color(colour);
  const col = [];
  for (let i = 0; i < n; i += 1) col.push(c.r, c.g, c.b);
  g.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
  const m = new THREE.Mesh(g, place.mat);
  place.apply(m);
  return m;
}

function buildHall(scene, mat) {
  const mk = (w, h, colour, fn) => scene.add(panel(w, h, colour, { mat, apply: fn }));
  const mid = HALL_LEN / 2 - 4;
  
  mk(HALL_W, HALL_LEN, 0x3f4436, (m) => { m.rotation.x = -Math.PI / 2; m.position.set(0, 0, mid); });
  
  mk(HALL_W, HALL_LEN, 0x272b20, (m) => { m.rotation.x = Math.PI / 2; m.position.set(0, HALL_H, mid); });
  
  mk(HALL_LEN, HALL_H, 0x76806a, (m) => { m.rotation.y = Math.PI / 2; m.position.set(-HALL_W / 2, HALL_H / 2, mid); });
  mk(HALL_LEN, HALL_H, 0x646e59, (m) => { m.rotation.y = -Math.PI / 2; m.position.set(HALL_W / 2, HALL_H / 2, mid); });
  
  mk(HALL_W, HALL_H, 0x2c3126, (m) => { m.position.set(0, HALL_H / 2, mid + HALL_LEN / 2); m.rotation.y = Math.PI; });
  mk(HALL_W, HALL_H, 0x2c3126, (m) => { m.position.set(0, HALL_H / 2, mid - HALL_LEN / 2); });

  
  
  
  
  for (let z = 2; z < HALL_LEN - 6; z += 7) {
    mk(0.5, 1.6, 0xd8e0b0, (m) => { m.rotation.x = Math.PI / 2; m.position.set(0, HALL_H - 0.02, z); });
  }
}





export function boot(canvas, hud) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  } catch (e) {
    hud.fatal('This browser could not start WebGL, so the station stays dark.');
    return null;
  }
  renderer.setPixelRatio(1);
  renderer.setClearColor(0x05060a, 1);
  if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  if ('toneMapping' in renderer) renderer.toneMapping = THREE.NoToneMapping;

  const scene = new THREE.Scene();
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uRes: { value: new THREE.Vector2(PS1_SNAP.x, PS1_SNAP.y) },
      uKey: { value: new THREE.Vector3(...KEY_DIR) },
      uFill: { value: new THREE.Vector3(...FILL_DIR) },
      uAlpha: { value: 1 },
    },
    vertexShader: ps1Vertex(),
    fragmentShader: FRAGMENT.colour(),
    fog: false, lights: false, toneMapped: false, side: THREE.DoubleSide,
  });

  buildHall(scene, mat);

  const xGeo = partsToGeometry(xanderParts(), xColour, XANDER_H);
  const xander = new THREE.Mesh(xGeo, mat);
  xander.rotation.x = -Math.PI / 2;   
  scene.add(xander);

  const chickenGeo = partsToGeometry(buildChicken().parts, (n) => CCOL[n] ?? 0xb9b07a, CHICKEN_H);

  const player = {
    x: 0, z: 0, yaw: 0,
    vitals: spawnVitals(),
    weapon: readyWeapon('boltDriver'),
    cam: emptyCamera(1),
    struggle: null,
    latchedBy: null,
    dead: false,
  };

  const birds = [];
  function addChicken(z, x) {
    const mesh = new THREE.Mesh(chickenGeo, mat);
    mesh.rotation.x = -Math.PI / 2;
    scene.add(mesh);
    birds.push({
      mesh, x, z, alive: true,
      creature: spawnCreature('chicken'),
      latched: false,
      cool: 0,
    });
  }
  for (let i = 0; i < 6; i += 1) addChicken(16 + i * 9, (i % 2 ? 1 : -1) * (0.4 + (i % 3) * 0.3));

  const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 200);

  
  const keys = new Set();
  let fireHeld = false;
  let aiming = false;
  addEventListener('keydown', (e) => {
    keys.add(e.code);
    if (player.struggle) {
      
      
      if (e.code === 'KeyA') player.struggle.press('a');
      if (e.code === 'KeyD') player.struggle.press('d');
    }
    if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
  });
  addEventListener('keyup', (e) => keys.delete(e.code));
  canvas.addEventListener('pointerdown', (e) => {
    if (player.struggle) { player.struggle.press('tap'); return; }
    if (e.button === 2) { aiming = true; return; }
    fireHeld = true;
  });
  addEventListener('pointerup', () => { fireHeld = false; aiming = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  
  canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (player.struggle) player.struggle.press('tap'); else fireHeld = true;
  }, { passive: false });
  canvas.addEventListener('touchend', () => { fireHeld = false; }, { passive: false });

  
  let last = 0;
  let shotFlash = 0;
  const tmpV = new THREE.Vector3();

  function step(nowMs) {
    const now = nowMs / 1000;
    const dt = Math.min(0.05, last ? now - last : 0.016);
    last = now;

    if (!player.dead) {
      
      const sprint = keys.has('ShiftLeft') || keys.has('ShiftRight');
      let fwd = 0;
      if (keys.has('KeyW') || keys.has('ArrowUp')) fwd += 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) fwd -= 1;
      let turn = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) turn += 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) turn -= 1;
      
      if (player.struggle) turn = 0;

      player.yaw += turn * 2.1 * dt;
      const slow = player.latchedBy ? (1 - CHICKEN_LATCH_SLOW) : 1;
      const speed = (player.struggle ? 0 : (sprint ? 5.5 : 2.4)) * slow;
      player.x -= Math.sin(player.yaw) * fwd * speed * dt;
      player.z += Math.cos(player.yaw) * fwd * speed * dt;
      player.x = clamp(player.x, -HALL_W / 2 + 0.4, HALL_W / 2 - 0.4);
      player.z = clamp(player.z, -2, HALL_LEN - 10);

      const mode = player.struggle ? 'walk' : (sprint && fwd ? 'sprint' : 'walk');
      tickVitals(player.vitals, dt, mode);
    }

    
    tickWeapon(player.weapon, dt);
    if (fireHeld && !player.struggle && !player.dead && canFire(player.weapon)) {
      fire(player.weapon);
      shotFlash = 0.06;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const muzzleY = 1.30;
      const aimDrop = keys.has('ControlLeft') || keys.has('KeyQ') ? 1.0 : 0.30;
      for (const b of birds) {
        if (!b.alive) continue;
        const dx = player.x - b.x; const dz = player.z - b.z;
        const dist = Math.hypot(dx, dz);
        if (dist > (player.weapon.spec?.range ?? 18)) continue;
        
        const fx = dx / dist; const fz = dz / dist;
        const rx = fz; const rz = -fx;                 
        const toLocal = (wx, wy, wz) => {
          const ox = wx - b.x; const oz = wz - b.z;
          return {
            x: (ox * rx + oz * rz) / CHICKEN_H,
            y: wy / CHICKEN_H,
            z: (ox * fx + oz * fz) / CHICKEN_H,
          };
        };
        const tipY = muzzleY - aimDrop * (dist / 6);
        const hit = resolveHit(
          b.creature,
          toLocal(player.x, muzzleY, player.z),
          toLocal(player.x - Math.sin(player.yaw) * 30, tipY, player.z + Math.cos(player.yaw) * 30),
        );
        if (!hit) continue;
        applyDamage(b.creature, hit.id, player.weapon.spec?.limbDamage ?? 12);
        const st = statusOf(b.creature);
        
        
        if (!st.alive) {
          b.alive = false;
          b.mesh.visible = false;
          if (b.latched) { player.latchedBy = null; player.struggle = null; endGrapple(player.vitals); }
        }
        break;                                        
      }
    }

    
    for (const b of birds) {
      if (!b.alive) continue;
      const dx = player.x - b.x; const dz = player.z - b.z;
      const dist = Math.hypot(dx, dz);
      const mob = mobilityOf(b.creature);
      const spd = 6.2 * (typeof mob === 'number' ? mob : (mob?.speed ?? 1));
      if (!b.latched && dist > 0.75 && !player.dead) {
        b.x += (dx / dist) * spd * dt;
        b.z += (dz / dist) * spd * dt;
      } else if (!b.latched && !player.dead && b.cool <= 0) {
        b.latched = true;
        player.latchedBy = b;
        player.struggle = createStruggle({ verb: VERB_FOR.chicken ?? 'mash' });
        beginGrapple(player.vitals, 'chicken');
      }
      b.cool -= dt;
      b.mesh.position.set(b.x, 0, b.z);
      b.mesh.rotation.z = Math.atan2(dx, dz) + Math.PI;
    }

    
    if (player.struggle) {
      player.struggle.update(dt);
      if (player.struggle.progress >= 1 || player.struggle.done) {
        const b = player.latchedBy;
        if (b) { b.latched = false; b.cool = 1.6; b.x -= Math.sin(player.yaw) * -0.8; }
        player.latchedBy = null;
        player.struggle = null;
        endGrapple(player.vitals);
      }
    }

    if (player.vitals.health <= 0 && !player.dead) {
      player.dead = true;
      hud.dead();
    }

    
    const wallAhead = 3.0;
    player.cam = stepCamera(player.cam, { aiming }, dt, wallAhead);
    const place = cameraPlacement(player.cam, { x: player.x, y: 0, z: player.z }, player.yaw);
    camera.fov = place.fov;
    camera.updateProjectionMatrix();
    camera.position.set(place.eye.x, place.eye.y, place.eye.z);
    camera.lookAt(place.target.x, place.target.y, place.target.z);

    xander.position.set(player.x, 0, player.z);
    xander.rotation.z = player.yaw;

    
    const w = canvas.clientWidth || 960; const h = canvas.clientHeight || 540;
    if (canvas.width !== w || canvas.height !== h) {
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);
    shotFlash = Math.max(0, shotFlash - dt);
    hud.paint({
      health: player.vitals.health,
      maxHealth: MAX_HEALTH,
      stamina: player.vitals.stamina,
      struggle: player.struggle,
      alive: !player.dead,
      remaining: birds.filter((b) => b.alive).length,
      flash: shotFlash > 0,
    });
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
  return { player, birds };
}

export { promptFor };













const $ = (id) => document.getElementById(id);





const tape = (() => {
  let ctx = null; let bus = null; let timer = null; let bar = 0; let on = false;
  const D = 146.83;
  const dorian = [0, 2, 3, 5, 7, 9, 10];
  const hz = (deg, oct = 0) => D * (2 ** ((dorian[((deg % 7) + 7) % 7] + 12 * (oct + Math.floor(deg / 7))) / 12));

  const tone = (type, f, t, dur, gain) => {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + 0.05);
  };
  const kick = (t) => {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.11);
    g.gain.setValueAtTime(0.45, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); g.connect(bus); o.start(t); o.stop(t + 0.2);
  };
  const hat = (t) => {
    const b = ctx.createBuffer(1, 1024, ctx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
    const n = ctx.createBufferSource(); n.buffer = b;
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
    const g = ctx.createGain(); g.gain.setValueAtTime(0.09, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    n.connect(hp); hp.connect(g); g.connect(bus); n.start(t); n.stop(t + 0.06);
  };

  function schedule() {
    const spb = 60 / 104;
    const t0 = ctx.currentTime + 0.06;
    const r = [0, 0, 3, 2][bar % 4];
    for (let b = 0; b < 4; b += 1) {
      const t = t0 + b * spb;
      kick(t); hat(t + spb * 0.5);
      tone('sawtooth', hz(r, -1), t, 0.34, 0.15);
      if (b % 2 === 0) {
        tone('triangle', hz(r + 2), t + 0.02, 0.5, 0.07);
        tone('triangle', hz(r + 4), t + 0.02, 0.5, 0.055);
      }
    }
    bar += 1;
    timer = setTimeout(schedule, spb * 4 * 1000 - 60);
  }

  return {
    toggle() {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return false;
        ctx = new AC(); bus = ctx.createGain(); bus.gain.value = 0.5; bus.connect(ctx.destination);
      }
      if (on) { clearTimeout(timer); timer = null; on = false; } else { if (ctx.resume) ctx.resume(); on = true; schedule(); }
      return on;
    },
    
    
    
    get audible() { return on && !!ctx && ctx.state === 'running'; },
  };
})();

const hud = {
  fatal(text) { const b = $('boot'); if (b) { b.style.display = 'flex'; b.innerHTML = `<div style="max-width:46ch">${text}</div>`; } },
  dead() {
    $('overTitle').textContent = 'THE LIVESTOCK HAD OPINIONS';
    $('overBody').textContent = 'Xander does not report back.';
    $('over').style.display = 'flex';
  },
  paint(s) {
    $('hpFill').style.width = `${Math.max(0, (s.health / s.maxHealth) * 100)}%`;
    $('spTrack').style.opacity = s.stamina >= 99 ? '0' : '1';
    $('spFill').style.width = `${Math.max(0, s.stamina)}%`;
    $('count').textContent = s.remaining ? `${s.remaining} ON THE DECK` : 'DECK CLEAR';
    $('flash').style.opacity = s.flash ? '0.30' : '0';
    if (s.struggle) {
      $('qte').style.display = 'block';
      $('qteFill').style.width = `${Math.min(100, s.struggle.progress * 100)}%`;
      $('qteHow').textContent = 'alternate A and D — or tap the button';
    } else {
      $('qte').style.display = 'none';
    }
    $('tape').classList.toggle('on', tape.audible);
  },
};

function start() {
  
  
  try { initAnalytics(); trackEvent('game_open', { game: 'farmy-evil-hills' }); } catch {  }
  $('tape').addEventListener('click', () => {
    const playing = tape.toggle();
    $('tape').classList.toggle('on', tape.audible);
    $('tapeCap').textContent = playing ? (tape.audible ? 'SIDE A' : 'TAP FOR SOUND') : 'STOPPED';
  });
  $('again').addEventListener('click', () => window.location.reload());
  $('qteBtn').addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const st = window.__feh && window.__feh.player && window.__feh.player.struggle;
    if (st) st.press('tap');
  });

  try {
    const api = boot($('game'), hud);
    window.__feh = api;
    if (api) $('boot').style.display = 'none';
  } catch (err) {
    hud.fatal(`The station did not come up.<br><small style="opacity:.6">${String(err).slice(0, 300)}</small>`);
    throw err;
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
