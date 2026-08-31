






















import * as THREE from 'three';

import { solve, RIG as FRIG, ARCH } from '../../2d-fighter-ex/src/animeRig.mjs';
import { poseById } from '../../2d-fighter-ex/src/moveSet.mjs';
import { segmentsOf, torsoBoxOf, jointsOf, girdleOf } from '../../../web-engine/ps1/ps1Rig.mjs';
import { buildFighter, jointBall } from '../../../web-engine/ps1/ps1Mesh.mjs';
import { hair3d } from '../../../web-engine/ps1/ps1Head.mjs';
import { buildChicken } from '../../../web-engine/ps1/creatures/chicken.mjs';
import { ps1Vertex, FRAGMENT, KEY_DIR, FILL_DIR } from '../../../web-engine/ps1/ps1Shader.mjs';
import { PS1_SNAP } from '../../shared/ps1Render/ps1Material.js';




import { lockZoom } from '../../shared/input/zoomLock.js';

import { emptyCamera, stepCamera, cameraPlacement } from '../../../web-engine/horror/camera.js';
import { spawnVitals, tickVitals, damage, beginGrapple, endGrapple, MAX_HEALTH, CHICKEN_LATCH_SLOW } from '../../../web-engine/horror/health.js';
import { spawn as spawnCreature, resolveHit, applyDamage, mobilityOf, statusOf } from '../../../web-engine/horror/dismemberment.js';
import { readyWeapon, tickWeapon, canFire, fire } from '../../../web-engine/horror/weapons.js';
import { createStruggle, VERB_FOR, promptFor } from '../../../web-engine/horror/struggle.js';
import { initAnalytics, trackEvent } from 'arbelo/analytics';

const XANDER_H = 1.80;
const CHICKEN_H = 0.72;
const HALL_W = 3.2;








const HALL_H = 3.4;










const HALL_LEN = 64;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));








const XCOL = {
  top: 0xb8503a,      
  pant: 0x3d5486,     
  accent: 0x6b452a,   
  skin: 0xe8b590,
  hair: 0xe8cf82,     
                      
                      
  eye: 0x2f6fd0,      
};
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
  
  
  
  
  
  
  
  
  



const A = { ...ARCH.renji, hair: 'crop', jaw: ARCH.renji.jaw, brow: ARCH.renji.brow };
  
  
  
  
  
  const build = 1.16;
  const pose = poseById('guard');
  const K = solve(pose, { flip: false });
  const o = { flip: false, build };
  const built = buildFighter(K, {
    segments: segmentsOf(K, o), torso: torsoBoxOf(K, o),
    joints: jointsOf(K, o), girdle: girdleOf(K, o),
    headR: FRIG.headR, arch: { build, jaw: A.jaw, brow: A.brow, hair: 'crop' },
    flip: false, pose, head: true,
  });
  
  
  
  
  
  
  
  
  const hc = [K.head[0], 0, K.head[1]];
  const r = FRIG.headR;
  return [...built.parts,
    
    
    
    
    { name: 'hair', mesh: hair3d('crop', { centre: [hc[0] - r * 0.06, hc[1], hc[2] + r * 0.10], r: r * 0.86, forward: [1, 0, 0] }) },
    { name: 'eyeL', mesh: jointBall([hc[0] + r * 0.94, +r * 0.28, hc[2] + r * 0.02], r * 0.15, { sides: 4 }) },
    { name: 'eyeR', mesh: jointBall([hc[0] + r * 0.94, -r * 0.28, hc[2] + r * 0.02], r * 0.15, { sides: 4 }) },
  ].filter((p) => p.mesh && p.mesh.indices && p.mesh.indices.length);
}
const xColour = (n) => (n === 'hair' ? XCOL.hair
  : /^eye/.test(n) ? XCOL.eye
  : /^pelvis|^thigh|^shin|^hip\d|^knee|^ankle/.test(n) ? XCOL.pant
    : /^torso|^trapezius/.test(n) ? XCOL.top
      : /^foot/.test(n) ? XCOL.accent : XCOL.skin);








function hash2(x, y) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
























function panel(w, h, colour, place) {
  
  
  
  
  
  
  
  
  
  
  
  
  const QUAD = 0.65;
  const sw = Math.max(1, Math.round(w / QUAD));
  const sh = Math.max(1, Math.round(h / QUAD));
  
  
  
  
  
  
  
  
  
  
  
  
  
  const g = new THREE.PlaneGeometry(w, h, sw, sh).toNonIndexed();
  const P = g.attributes.position.array;
  const n = g.attributes.position.count;
  const col = new Float32Array(n * 3);
  const base = new THREE.Color(colour);
  const MUD = new THREE.Color(0x6a4f2c);
  const BLOOD = new THREE.Color(0x53171a);
  const HAY = new THREE.Color(0xd6bd63);
  const t = new THREE.Color();
  
  
  
  
  
  
  
  
  
  
  
  for (let quad = 0; quad < n; quad += 6) {
    const last = Math.min(6, n - quad);
    let cx = 0; let cy = 0;
    for (let k = 0; k < last; k += 1) { cx += P[(quad + k) * 3]; cy += P[(quad + k) * 3 + 1]; }
    cx /= last; cy /= last;

    t.copy(base);
    const grain = hash2(cx * 2.9, cy * 3.1);
    const seam = (Math.abs(cx % 4) < 0.5 || Math.abs(cy % 4) < 0.5) ? 0.76 : 1;
    t.multiplyScalar(seam * (0.84 + grain * 0.30));

    
    
    
    const blotch = hash2(cx * 0.30 + 3.1, cy * 0.30 - 1.7);
    const edge = hash2(cx * 1.7 - 8.3, cy * 1.9 + 4.4);
    if (blotch > 0.80 && edge > 0.30) t.lerp(MUD, 0.30 + edge * 0.35);
    else if (blotch < 0.085 && edge > 0.42) t.lerp(BLOOD, 0.40 + edge * 0.40);
    if (hash2(cx * 5.1, cy * 4.7) > 0.965) t.lerp(HAY, 0.55);

    for (let k = 0; k < last; k += 1) {
      col[(quad + k) * 3] = t.r;
      col[(quad + k) * 3 + 1] = t.g;
      col[(quad + k) * 3 + 2] = t.b;
    }
  }
  g.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(n * 2).fill(0), 2));
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, place.mat);
  place.apply(m);
  return m;
}

function buildHall(scene, mat) {
  const strips = [];
  const mk = (w, h, colour, fn) => scene.add(panel(w, h, colour, { mat, apply: fn }));
  const mid = HALL_LEN / 2 - 4;
  
  mk(HALL_W, HALL_LEN, 0x6d7360, (m) => { m.rotation.x = -Math.PI / 2; m.position.set(0, 0, mid); });
  
  mk(HALL_W, HALL_LEN, 0x4c5242, (m) => { m.rotation.x = Math.PI / 2; m.position.set(0, HALL_H, mid); });
  
  mk(HALL_LEN, HALL_H, 0xa3ad93, (m) => { m.rotation.y = Math.PI / 2; m.position.set(-HALL_W / 2, HALL_H / 2, mid); });
  mk(HALL_LEN, HALL_H, 0x8f9a80, (m) => { m.rotation.y = -Math.PI / 2; m.position.set(HALL_W / 2, HALL_H / 2, mid); });
  
  mk(HALL_W, HALL_H, 0x5a6150, (m) => { m.position.set(0, HALL_H / 2, mid + HALL_LEN / 2); m.rotation.y = Math.PI; });
  mk(HALL_W, HALL_H, 0x5a6150, (m) => { m.position.set(0, HALL_H / 2, mid - HALL_LEN / 2); });

  
  
  
  
  
  

  
  
  
  
  for (let z = 2; z < HALL_LEN - 6; z += 7) {
    
    
    const lm = mat.clone();
    lm.uniforms = THREE.UniformsUtils.clone(mat.uniforms);
    lm.transparent = true;
    const strip = panel(0.5, 1.6, 0xe4ecc0, {
      mat: lm,
      apply: (m) => { m.rotation.x = Math.PI / 2; m.position.set(0, HALL_H - 0.02, z); },
    });
    scene.add(strip);
    strips.push({ mesh: strip, mat: lm, phase: hash2(z * 3.1, 7.7) * 10, next: 3 + hash2(z, 2.2) * 12 });
  }
  return strips;
}






















const MAP_TILT = 0.62;          
const MAP_SCALE = 1.55;         
const MAP_RANGE = 34;           

function drawMap(cv, player, birds, exitZ) {
  const g = cv.getContext('2d');
  const W = cv.width; const H = cv.height;
  g.clearRect(0, 0, W, H);

  const cx = W / 2; const cy = H * 0.66;
  const cos = Math.cos(-player.yaw); const sin = Math.sin(-player.yaw);

  
  
  const proj = (wx, wz) => {
    const dx = wx - player.x; const dz = wz - player.z;
    const rx = dx * cos - dz * sin;
    const rz = dx * sin + dz * cos;
    const depth = 1 / (1 + Math.max(0, rz) * 0.020);
    return [cx + rx * MAP_SCALE * depth * 2.2, cy - rz * MAP_SCALE * Math.cos(MAP_TILT) * depth];
  };

  const line = (a, b, colour, width) => {
    g.strokeStyle = colour; g.lineWidth = width || 1;
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
  };

  const NEON = '#39ff88';
  const DIM = 'rgba(57,255,136,0.28)';

  
  const half = HALL_W / 2;
  const z0 = player.z - 6; const z1 = player.z + MAP_RANGE;
  line(proj(-half, z0), proj(-half, z1), DIM, 1.5);
  line(proj(half, z0), proj(half, z1), DIM, 1.5);
  for (let z = Math.ceil(z0 / 4) * 4; z < z1; z += 4) {
    line(proj(-half, z), proj(half, z), 'rgba(57,255,136,0.13)', 1);
  }

  
  g.fillStyle = '#ff5a4a';
  for (const b of birds) {
    if (!b.alive) continue;
    const d = Math.hypot(b.x - player.x, b.z - player.z);
    if (d > MAP_RANGE) continue;
    const [px, py] = proj(b.x, b.z);
    g.fillRect(px - 2.5, py - 2.5, 5, 5);
  }

  
  if (exitZ - player.z < MAP_RANGE + 8) {
    const [ex, ey] = proj(0, exitZ);
    g.strokeStyle = NEON; g.lineWidth = 2;
    g.strokeRect(ex - 9, ey - 9, 18, 18);
    g.fillStyle = NEON;
    g.font = 'bold 9px ui-monospace, monospace';
    g.textAlign = 'center';
    g.fillText('EL', ex, ey + 3.5);
    g.font = '8px ui-monospace, monospace';
    g.fillText(`${Math.max(0, Math.round(exitZ - player.z))}m`, ex, ey - 13);
  }

  
  g.strokeStyle = '#eafff2'; g.lineWidth = 2;
  g.beginPath();
  g.moveTo(cx, cy - 7); g.lineTo(cx - 5, cy + 5); g.lineTo(cx + 5, cy + 5); g.closePath();
  g.stroke();

  g.strokeStyle = 'rgba(57,255,136,0.45)';
  g.lineWidth = 1;
  g.strokeRect(0.5, 0.5, W - 1, H - 1);
}

export function boot(canvas, hud) {
  let renderer;
  try {
    
    
    
    
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true });
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

  const strips = buildHall(scene, mat);

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
  
  
  
  
  
  
  [26, 42, 61].forEach((z, i) => addChicken(z, (i % 2 ? 1 : -1) * (0.5 + i * 0.25)));

  
  const EXIT_Z = HALL_LEN - 12;
  const lift = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 2.4).toNonIndexed(),
    mat,
  );
  {
    const n = lift.geometry.attributes.position.count;
    const col = new Float32Array(n * 3);
    const c = new THREE.Color(0x2f6f4a);
    for (let i = 0; i < n; i += 1) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    lift.geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    lift.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(n * 2).fill(0), 2));
    lift.geometry.computeVertexNormals();
  }
  lift.position.set(0, 1.2, EXIT_Z + 0.02);
  lift.rotation.y = Math.PI;
  scene.add(lift);

  const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 200);
  
  
  renderer.setSize(canvas.clientWidth || 960, canvas.clientHeight || 540, false);
  camera.aspect = (canvas.clientWidth || 960) / (canvas.clientHeight || 540);
  camera.updateProjectionMatrix();

  
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
  let paIn = 12 + Math.random() * 14;
  let level = 1;
  let liftIn = 0;
  const mapCv = document.getElementById('map');
  
  
  
  
  const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

    
    
    
    
    const roomBehind = Math.max(0.6, player.z + 3.4);
    player.cam = stepCamera(player.cam, { aiming }, dt, roomBehind);
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

    
    
    
    
    
    if (!calm) {
      for (const st of strips) {
        st.next -= dt;
        if (st.next <= 0) {
          st.next = 4 + Math.random() * 14;
          st.phase = 0.42 + Math.random() * 0.3;      
        }
        const fit = st.phase > 0;
        if (fit) {
          st.phase -= dt;
          const w = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(now * 26 + st.next));
          st.mat.uniforms.uAlpha.value = w;
        } else if (st.mat.uniforms.uAlpha.value !== 1) {
          st.mat.uniforms.uAlpha.value = 1;
        }
      }
    }

    
    paIn -= dt;
    if (paIn <= 0 && !player.dead) {
      paIn = 22 + Math.random() * 26;
      paVoice(PA_KINDS[Math.floor(Math.random() * PA_KINDS.length)]);
    }

    
    const hunted = birds.some((b) => b.alive && Math.hypot(b.x - player.x, b.z - player.z) < 13);
    audio.duck(hunted);

    
    if (!player.dead && Math.abs(player.z - EXIT_Z) < 1.6 && Math.abs(player.x) < 1.1) {
      if (liftIn <= 0) {
        liftIn = 2.4;
        hud.lift(level + 1);
        
        
        
        liftChime();
      }
    }
    if (liftIn > 0) {
      liftIn -= dt;
      if (liftIn <= 0) {
        level += 1;
        player.z = 0; player.x = 0; player.yaw = 0;
        birds.forEach((b, i) => {
          b.alive = true; b.mesh.visible = true;
          b.creature = spawnCreature('chicken');
          b.latched = false; b.cool = 0;
          b.z = 24 + i * (13 - Math.min(6, level)); b.x = (i % 2 ? 1 : -1) * (0.5 + i * 0.25);
        });
        player.latchedBy = null; player.struggle = null;
        hud.lift(0);
      }
    }

    if (mapCv) drawMap(mapCv, player, birds, EXIT_Z);

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









const audio = (() => {
  let ctx = null; let music = null; let sfx = null;
  return {
    get ctx() { return ctx; },
    get musicBus() { return music; },
    get sfxBus() { return sfx; },
    ensure() {
      if (ctx) return ctx;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      music = ctx.createGain(); music.gain.value = 0.50; music.connect(ctx.destination);
      sfx = ctx.createGain(); sfx.gain.value = 0.85; sfx.connect(ctx.destination);
      return ctx;
    },
    get running() { return !!ctx && ctx.state === 'running'; },
    
    
    duck(on) {
      if (music && ctx) music.gain.setTargetAtTime(on ? 0.18 : 0.50, ctx.currentTime, 0.4);
    },
  };
})();
















const FORMANTS = {
  oh: [[500, 860], [0.95, 0.5]],
  no: [[400, 1100], [1.0, 0.55]],
  ah: [[730, 1150], [1.0, 0.6]],
  sob: [[430, 1250], [0.7, 0.45]],
};

function paVoice(kind) {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const [freqs, amps] = FORMANTS[kind] || FORMANTS.oh;
  const t0 = ctx.currentTime + 0.03;
  const dur = kind === 'sob' ? 0.42 : 1.1 + Math.random() * 0.8;

  const speaker = ctx.createBiquadFilter();
  speaker.type = 'bandpass'; speaker.frequency.value = 1500; speaker.Q.value = 0.7;
  const crunch = ctx.createWaveShaper();
  const curve = new Float32Array(256);
  for (let i = 0; i < 256; i += 1) { const x = (i / 128) - 1; curve[i] = Math.tanh(x * 2.6); }
  crunch.curve = curve;
  const out = ctx.createGain(); out.gain.value = 0.5;
  speaker.connect(crunch); crunch.connect(out); out.connect(audio.sfxBus);

  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  const base = 115 + Math.random() * 95;
  osc.frequency.setValueAtTime(base * 1.15, t0);
  osc.frequency.exponentialRampToValueAtTime(base * 0.7, t0 + dur);
  const amp = ctx.createGain();
  amp.gain.setValueAtTime(0.0001, t0);
  amp.gain.exponentialRampToValueAtTime(0.45, t0 + (kind === 'sob' ? 0.05 : 0.2));
  amp.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(amp);
  freqs.forEach((f, i) => {
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = f; bp.Q.value = 8;
    const g = ctx.createGain(); g.gain.value = amps[i];
    amp.connect(bp); bp.connect(g); g.connect(speaker);
  });
  osc.start(t0); osc.stop(t0 + dur + 0.12);

  for (const at of [t0 - 0.02, t0 + dur + 0.03]) {
    const c = ctx.createOscillator(); const cg = ctx.createGain();
    c.frequency.value = 1900;
    cg.gain.setValueAtTime(0.05, at);
    cg.gain.exponentialRampToValueAtTime(0.0001, at + 0.03);
    c.connect(cg); cg.connect(audio.sfxBus); c.start(at); c.stop(at + 0.05);
  }
}

function liftChime() {
  const ctx = audio.ensure();
  if (!ctx || !audio.running) return;
  const t = ctx.currentTime + 0.05;
  
  
  [392.0, 493.9, 587.3, 880.0].forEach((f, i) => {
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = f;
    const at = t + i * 0.09;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.16, at + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 2.1);
    o.connect(g); g.connect(audio.musicBus); o.start(at); o.stop(at + 2.2);
  });
}

const PA_KINDS = ['oh', 'no', 'ah', 'sob', 'sob'];

const tape = (() => {
  let timer = null; let bar = 0; let on = false;
  const D = 146.83;
  const dorian = [0, 2, 3, 5, 7, 9, 10];
  const hz = (deg, oct = 0) => D * (2 ** ((dorian[((deg % 7) + 7) % 7] + 12 * (oct + Math.floor(deg / 7))) / 12));
  const ctx = () => audio.ctx;
  const bus = () => audio.musicBus;

  const tone = (type, f, t, dur, gain) => {
    const o = ctx().createOscillator(); const g = ctx().createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 0.014);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus()); o.start(t); o.stop(t + dur + 0.05);
  };
  const kick = (t) => {
    const o = ctx().createOscillator(); const g = ctx().createGain();
    o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.11);
    g.gain.setValueAtTime(0.45, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(g); g.connect(bus()); o.start(t); o.stop(t + 0.2);
  };
  const hat = (t) => {
    const b = ctx().createBuffer(1, 1024, ctx().sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i += 1) d[i] = Math.random() * 2 - 1;
    const n = ctx().createBufferSource(); n.buffer = b;
    const hp = ctx().createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 7000;
    const g = ctx().createGain(); g.gain.setValueAtTime(0.09, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    n.connect(hp); hp.connect(g); g.connect(bus()); n.start(t); n.stop(t + 0.06);
  };

  function schedule() {
    if (!ctx()) return;
    const spb = 60 / 104;
    const t0 = ctx().currentTime + 0.06;
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
      const c = audio.ensure();
      if (!c) return false;
      if (on) { clearTimeout(timer); timer = null; on = false; } else { if (c.resume) c.resume(); on = true; schedule(); }
      return on;
    },
    
    
    
    get audible() { return on && audio.running; },
  };
})();

const hud = {
  fatal(text) { const b = $('boot'); if (b) { b.style.display = 'flex'; b.innerHTML = `<div style="max-width:46ch">${text}</div>`; } },
  lift(toLevel) {
    const el = $('msg');
    el.textContent = toLevel ? `LIFT — DECK ${toLevel}` : '';
  },
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
  lockZoom();
  
  
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
    if (api) {
      let started = false;
      const go = () => {
        if (started) return;
        started = true;
        $('boot').style.display = 'none';
        $('hint').style.display = 'block';
        
        
        
        
        
        if (!tape.audible) {
          tape.toggle();
          $('tape').classList.toggle('on', tape.audible);
          $('tapeCap').textContent = tape.audible ? 'SIDE A' : 'TAP FOR SOUND';
        }
      };
      $('startBtn').addEventListener('click', go);
      $('boot').addEventListener('click', go);
      document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.code === 'Enter') go();
      });
    }
  } catch (err) {
    hud.fatal(`The station did not come up.<br><small style="opacity:.6">${String(err).slice(0, 300)}</small>`);
    throw err;
  }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
