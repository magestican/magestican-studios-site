







import * as THREE from 'three';
import { nearestOnRail, posAt } from '../sim/track.js';
import { nextThrowable } from '../sim/train.js';
import { createTrainRig, TRAIN_CAM, trainCameraPose, updateTrainRig } from './cameraRig.js';
import { updateCritterSprite } from './critterSprite.js';
import { createJoSprite } from './joSprite.js';
import { boltPlaceholder, entityView, joPlaceholder, textSprite } from './scene.js';

const GAUGE_HALF = 0.75; 
const RAIL_W = 0.16;
const RAIL_Z = 0.12;
const MAX_PROP_Z = 28; 
const MIN_VIEW_W = 17; 
const FOCUS_DIST = Math.hypot(TRAIN_CAM.back, TRAIN_CAM.height); 
const ENTITY_SCALE = 1.35; 
const TEAL = 0x2fe0d0;
const PINK = 0xff2fa0; 
const GOLD = 0xffd34d; 
const BRASS = 0xc9a45a; 
const TILE = 4; 


export function createTrainView(canvas, level, labels) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x2e2638); 
  const camera = new THREE.PerspectiveCamera(TRAIN_CAM.fovY, 16 / 9, 0.5, 320);
  const hemi = new THREE.HemisphereLight(0xfff6e6, 0x8a7a6a, 1.8);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d6, 1.5);
  sun.position.set(-30, -40, 80);
  scene.add(sun);

  scene.add(floorMeshes(level, renderer));
  scene.add(railMeshes(level));
  const props = propMeshes(level);
  scene.add(props.group);
  scene.add(stationMeshes(level, labels));
  const points = pointsMeshes(level);
  scene.add(points.group);
  const signals = signalMeshes(level);
  scene.add(signals.group);
  const debris = debrisMeshes(level);
  scene.add(debris.group);
  scene.add(peaLanes(level));
  const peas = peaPool(scene);
  const train = trainMeshes();
  scene.add(train.group);

  
  const jo = joPlaceholder();
  jo.group.children[1].visible = false; 
  jo.group.scale.setScalar(1.8);
  scene.add(jo.group);
  const joSprite = createJoSprite(jo.body);
  const bolt = boltPlaceholder();
  bolt.group.scale.setScalar(1.4);
  scene.add(bolt.group);
  const boltPos = { x: level.spawn.x, y: level.spawn.y, z: 3 };
  
  const views = new Map();

  const rig = createTrainRig(level.spawn.x, level.spawn.y);
  let placed = false;
  let viewW = 37;
  let shake = 0;
  const kick = (a) => {
    shake = Math.min(0.15, Math.max(shake, a));
  };
  let tilt = 0;
  let tumble = 0;
  let pendingEvents = [];
  
  const teles = [];
  const tele = (m, life, pulse = true) => {
    scene.add(m);
    teles.push({ m, t: 0, life, pulse });
  };
  
  const fx = [];
  const spark = (x, y, z, color, life, size) => {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(size), new THREE.MeshBasicMaterial({ color, transparent: true }));
    m.position.set(x, y, z);
    scene.add(m);
    fx.push({ m, t: 0, life });
  };
  const burst = (x, y, z, color, n, r, life = 0.6, size = 0.18) => {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      spark(x + Math.cos(a) * r, y + Math.sin(a) * r, z, color, life, size);
    }
  };
  const ring = (x, y, r, color, life, pulse = true) => {
    const m = new THREE.Mesh(
      new THREE.RingGeometry(r * 0.78, r, 40),
      new THREE.MeshBasicMaterial({ color, transparent: true, side: THREE.DoubleSide, depthWrite: false }),
    );
    m.position.set(x, y, 0.2);
    tele(m, life, pulse);
  };
  const line = (ax, ay, az, bx, by, bz, color, life) => {
    const m = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(ax, ay, az), new THREE.Vector3(bx, by, bz)]),
      new THREE.LineBasicMaterial({ color, transparent: true }),
    );
    tele(m, life, false);
  };
  
  let last = null;

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    const aspect = w / Math.max(1, h);
    
    
    const baseH = 2 * FOCUS_DIST * Math.tan((TRAIN_CAM.fovY * Math.PI) / 360);
    const visH = Math.max(baseH, MIN_VIEW_W / aspect);
    viewW = visH * aspect;
    camera.aspect = aspect;
    camera.fov = (2 * Math.atan(visH / 2 / FOCUS_DIST) * 180) / Math.PI;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  return {
    
    render(session, _alpha, dt) {
      last = session;
      const t = session.train;
      const c = t.cars[0];
      const time = session.time;
      
      const far = Math.hypot(rig.x - c.x, rig.y - c.y) > 30;
      updateTrainRig(rig, { x: c.x, y: c.y, hx: c.hx, hy: c.hy, v: t.v }, placed && !far ? dt : 10);
      placed = true;
      
      const kx = Math.min(1, (viewW * 0.2) / Math.max(1e-6, Math.abs(rig.lx)));
      const pose = trainCameraPose({ x: c.x + rig.lx * kx, y: rig.y });
      shake *= Math.exp(-dt * 18);
      const sx = Math.sin(time * 91) * shake;
      const sy = Math.cos(time * 73) * shake;
      camera.position.set(pose.position[0] + sx, pose.position[1] + sy, pose.position[2]);
      camera.lookAt(pose.lookAt[0] + sx, pose.lookAt[1] + sy, 0);
      camera.updateMatrixWorld();

      
      const back = t.cars[t.cars.length - 1];
      const turn = Math.sign(back.hx * c.hy - back.hy * c.hx); 
      tilt += ((t.curveT > 0 ? 0.18 * turn : 0) - tilt) * (1 - Math.exp(-dt * 12));
      tumble = Math.max(0, tumble - dt);
      for (const g of Object.values(train.cars)) g.visible = false;
      for (const [i, car] of t.cars.entries()) {
        const g = train.cars[car.kind];
        if (!g) continue;
        g.visible = true;
        g.position.set(car.x, car.y, 0);
        g.rotation.z = Math.atan2(car.hy, car.hx);
        const inner = g.userData.inner;
        const k = tumble / 0.45;
        inner.rotation.x = tilt * (i === 0 ? 0.6 : 1) + (k > 0 ? Math.sin(time * 38 + i * 1.7) * 0.45 * k : 0);
        inner.position.z = k > 0 ? Math.abs(Math.sin(k * 9 + i)) * 0.7 * k : 0;
      }
      train.shell.visible = !!session.shield;
      train.key.rotation.x -= dt * (1.5 + t.v * 0.6);
      const spark4 = t.sparkT > 0;
      for (const w of train.wheels) w.material.color.set(spark4 ? 0xfff06a : 0x1d1d24);
      train.boost.visible = t.boostT > 0 || spark4;
      if (train.boost.visible) train.boost.scale.x = 0.8 + 0.3 * Math.sin(time * 40);

      
      const cabX = c.x - c.hx * 1.25;
      const cabY = c.y - c.hy * 1.25;
      jo.group.position.set(cabX, cabY, 0.9 + (train.cars.engine.userData.inner.position.z ?? 0));
      jo.group.quaternion.copy(camera.quaternion);
      const facing = c.hx < -0.05 ? -1 : 1;
      jo.body.scale.set(facing, 1, 1);
      joSprite.update(
        dt,
        { grounded: true, vx: 0, vy: 0, facing },
        pendingEvents.filter((e) => e.type === 'hurt'),
        { punt: false },
      );
      pendingEvents = [];
      const blink = session.invuln > 0 && Math.floor(session.invuln * 16) % 2 === 0;
      jo.group.visible = !blink;
      jo.shell.visible = false; 
      const tender = t.cars[1] ?? c;
      const bk = 1 - Math.exp(-dt * 5);
      boltPos.x += (tender.x - boltPos.x) * bk;
      boltPos.y += (tender.y - boltPos.y) * bk;
      if (Math.hypot(tender.x - boltPos.x, tender.y - boltPos.y) > 20) Object.assign(boltPos, { x: tender.x, y: tender.y });
      bolt.group.position.set(boltPos.x, boltPos.y, 3 + Math.sin(time * 3) * 0.15);
      bolt.group.quaternion.copy(camera.quaternion);
      bolt.group.scale.x = 1.4 * facing;

      points.update(session, time);
      signals.update(session);
      debris.update(session);
      peas.update(session.peas ?? []);
      props.update(camera.position, c, dt);
      syncTrainEntities(scene, views, session, camera, time);

      for (let i = teles.length - 1; i >= 0; i--) {
        const T = teles[i];
        T.t += dt;
        const fade = Math.max(0, 1 - T.t / T.life);
        T.m.material.opacity = 0.9 * (T.pulse ? 0.6 + 0.4 * Math.sin(time * 22) : 1) * fade;
        if (T.t >= T.life) {
          scene.remove(T.m);
          T.m.geometry.dispose();
          T.m.material.dispose();
          teles.splice(i, 1);
        }
      }
      for (let i = fx.length - 1; i >= 0; i--) {
        const f = fx[i];
        f.t += dt;
        const k = f.t / f.life;
        f.m.scale.setScalar(0.4 + k * 1.4);
        f.m.rotation.z += dt * 6;
        f.m.position.z += dt * 1.2;
        f.m.material.opacity = Math.max(0, 1 - k);
        if (k >= 1) {
          scene.remove(f.m);
          f.m.geometry.dispose();
          f.m.material.dispose();
          fx.splice(i, 1);
        }
      }
      renderer.render(scene, camera);
    },
    
    boltMood(mood) {
      bolt.face.material.color.set(mood === 'curious' ? 0xffd34d : mood === 'worried' ? 0xff8a2a : 0x2fe0d0);
    },
    
    onEvent(e) {
      pendingEvents.push(e);
      const t = last?.train;
      const c = t?.cars[0];
      const at = (x, y) => [x ?? c?.x ?? 0, y ?? c?.y ?? 0];
      if (e.type === 'pointsThrow') {
        burst(e.x, e.y, 0.6, e.how === 'lever' ? BRASS : TEAL, 6, 0.9, 0.5, 0.14);
        points.pop(e.id);
        if (e.how === 'lever') line(boltPos.x, boltPos.y, 3, e.x, e.y, 0.5, BRASS, 0.4);
      }
      if (e.type === 'pointsPass' && c) spark(c.x, c.y, 0.5, 0xdfe4ee, 0.3, 0.12);
      if (e.type === 'hollowKnock' && c) burst(c.x, c.y, 0.8, 0xffb648, 5, 1.2, 0.7, 0.12);
      if (e.type === 'noPoints' && c) spark(c.x, c.y, 1.2, 0xffffff, 0.4, 0.2);
      if ((e.type === 'boost' || e.type === 'boostEmpty') && c)
        for (let i = 0; i < 4; i++)
          spark(c.x - c.hx * (2 + i * 0.8), c.y - c.hy * (2 + i * 0.8), 1.4, e.type === 'boost' ? 0xffffff : 0x8a8f9e, 0.45, 0.2);
      if (e.type === 'curveWarn')
        for (let i = 0; i < 4; i++) spark(e.x + Math.cos(i * 1.7), e.y + Math.sin(i * 1.7), 0.3, 0xffa040, 0.4, 0.12);
      if (e.type === 'bufferStop') kick(0.1);
      if (e.type === 'tetherAttach') line(boltPos.x, boltPos.y, 3, e.x, e.y, 0.6, 0xffffff, 0.35);
      if (e.type === 'tetherBoop') spark(boltPos.x, boltPos.y, 3.4, 0xffffff, 0.3, 0.12);
      if (e.type === 'scan') {
        ring(e.x, e.y, 1.6, TEAL, 0.9, false);
        line(boltPos.x, boltPos.y, 3, e.x, e.y, 0.4, TEAL, 0.6);
      }
      if (e.type === 'specimenHide') spark(e.x, e.y, 0.5, 0xffffff, 0.3, 0.12);
      if (e.type === 'powerUp') burst(e.x, e.y, 0.8, GOLD, 6, 0.8, 0.7, 0.14);
      if (e.type === 'shieldOn') {
        const [x, y] = at(e.x, e.y);
        burst(x, y, 0.8, 0x7d9bd6, 6, 0.8, 0.6, 0.14);
      }
      if (e.type === 'shieldBreak') {
        burst(e.x, e.y, 0.8, 0x7d9bd6, 8, 1.2, 0.7, 0.16);
        kick(0.1);
      }
      if (e.type === 'couple') {
        burst(e.x, e.y, 1, 0xffffff, 6, 1.4, 0.5, 0.16);
        kick(0.06);
      }
      if (e.type === 'signal' && e.state === 'green') {
        const g = signals.at(e.id);
        if (g) burst(g.x, g.y, 2.9, 0x3bd16f, 6, 0.8, 0.8, 0.14);
      } else if (e.type === 'signal' && e.signals?.some((s) => s.startsWith('visual:'))) {
        const [x, y] = at(e.x, e.y);
        spark(x, y, 1, GOLD, 0.9, 0.16);
      }
      if (e.type === 'fling') {
        burst(e.x, e.y, 0.8, 0xffffff, 4, 0.6, 0.4, 0.16);
        kick(0.04 + Math.min(0.06, (e.n ?? 1) * 0.015));
      }
      if (e.type === 'defeat') spark(e.x, e.y, 1, 0xffffff, 0.5, 0.2);
      if (e.type === 'bowl') burst(e.x, e.y, 0.8, GOLD, 3 + (e.n ?? 1), 0.6, 0.6, 0.12);
      if (e.type === 'telegraph') spark(e.x, e.y, 1.4, PINK, 0.4, 0.16);
      if (e.type === 'landingRing') ring(e.x, e.y, 1.3, PINK, e.seconds ?? 1.2);
      if (e.type === 'land' && e.onRails) for (let i = 0; i < 3; i++) spark(e.x - 0.5 + i * 0.5, e.y, 0.2, 0xc9a37a, 0.4, 0.1);
      if (e.type === 'kick' || e.type === 'hurt') kick(0.12);
      if (e.type === 'derail') {
        tumble = 0.45;
        kick(0.15);
        burst(e.x, e.y, 0.6, 0xffa040, 8, 1.6, 0.7, 0.18);
      }
      if (e.type === 'rerail') burst(e.x, e.y, 0.5, TEAL, 6, 1.2, 0.6, 0.14);
      if (e.type === 'diamondClack' && c) spark(c.x, c.y, 0.4, 0xdfe4ee, 0.25, 0.1);
    },
  };
}





function strip(rail, s0, s1, off, w, z, pos, idx) {
  const pts = [posAt(rail, s0)];
  for (let i = 0; i < rail.xs.length; i++)
    if (rail.cum[i] > s0 + 1e-6 && rail.cum[i] < s1 - 1e-6) pts.push({ x: rail.xs[i], y: rail.ys[i] });
  pts.push(posAt(rail, s1));
  const base = pos.length / 3;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    let tx = b.x - a.x;
    let ty = b.y - a.y;
    const L = Math.hypot(tx, ty) || 1;
    tx /= L;
    ty /= L;
    for (const side of [-1, 1]) {
      const d = off + (side * w) / 2;
      pos.push(pts[i].x - ty * d, pts[i].y + tx * d, z);
    }
    if (i > 0) {
      const k = base + 2 * (i - 1);
      idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3);
    }
  }
}

function geometryOf(pos, idx) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });
const basic = (color, extra = {}) => new THREE.MeshBasicMaterial({ color, ...extra });


function boxAt(x0, x1, y0, y1, z0, z1, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), material);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return m;
}

function canvasTexture(w, h, paint) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  paint(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}


function lcg(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function shadowBlob(r = 0.55) {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 20), basic(0x000000, { transparent: true, opacity: 0.24, depthWrite: false }));
  m.position.z = 0.03;
  return m;
}





function floorMeshes(level, renderer) {
  const g = new THREE.Group();
  const { w, h } = level.floor;
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const rnd = lcg(13);
  const carpet = canvasTexture(128, 128, (ctx, cw, ch) => {
    ctx.fillStyle = '#56607e';
    ctx.fillRect(0, 0, cw, ch);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.10)';
      ctx.fillRect(rnd() * cw, rnd() * ch, 2, 2);
    }
  });
  const tiles = canvasTexture(128, 128, (ctx, cw, ch) => {
    ctx.fillStyle = '#b6a98f';
    ctx.fillRect(0, 0, cw, ch);
    ctx.fillStyle = '#efe6d2';
    ctx.fillRect(3, 3, cw - 6, ch - 6);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(10, 10, 40, 6);
  });
  for (const [tex, rx, ry] of [
    [carpet, 46 / TILE, h / TILE],
    [tiles, (w - 46) / TILE, h / TILE],
  ]) {
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(rx, ry);
    tex.anisotropy = aniso;
  }
  const cw = Math.min(46, w);
  const cm = new THREE.Mesh(new THREE.PlaneGeometry(cw, h), lambert(0xffffff, { map: carpet }));
  cm.position.set(cw / 2, h / 2, 0);
  g.add(cm);
  if (w > 46) {
    const tm = new THREE.Mesh(new THREE.PlaneGeometry(w - 46, h), lambert(0xffffff, { map: tiles }));
    tm.position.set(46 + (w - 46) / 2, h / 2, 0);
    g.add(tm);
  }
  
  const sk = lambert(0xe9e2d6);
  g.add(boxAt(-1, w + 1, -1, 0, 0, 1.2, sk), boxAt(-1, w + 1, h, h + 1, 0, 1.2, sk));
  g.add(boxAt(-1, 0, 0, h, 0, 1.2, sk), boxAt(w, w + 1, 0, h, 0, 1.2, sk));
  
  
  const wall = lambert(0xd9cbb4);
  g.add(boxAt(-2, w + 2, h + 1, h + 2, 0, 60, wall), boxAt(-2, -1, -40, h + 2, 0, 60, wall), boxAt(w + 1, w + 2, -40, h + 2, 0, 60, wall));
  return g;
}


function railMeshes(level) {
  const g = new THREE.Group();
  const rails = Object.values(level.trackGraph.rails);
  const pos = [];
  const idx = [];
  let sleepers = 0;
  for (const r of rails) {
    for (const off of [-GAUGE_HALF, GAUGE_HALF]) strip(r, 0, r.length, off, RAIL_W, RAIL_Z, pos, idx);
    sleepers += Math.floor(r.length);
  }
  g.add(new THREE.Mesh(geometryOf(pos, idx), basic(0xc3c8d4, { side: THREE.DoubleSide })));
  const sl = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), lambert(0x7a5236), sleepers);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const z = new THREE.Vector3(0, 0, 1);
  let n = 0;
  for (const r of rails)
    for (let s = 0.5; s < r.length && n < sleepers; s += 1) {
      const p = posAt(r, s);
      q.setFromAxisAngle(z, Math.atan2(p.hy, p.hx));
      m.compose(new THREE.Vector3(p.x, p.y, 0.05), q, new THREE.Vector3(0.36, 2.2, 0.1));
      sl.setMatrixAt(n++, m);
    }
  sl.count = n;
  g.add(sl);
  for (const r of rails)
    if (r.spec.buffer) {
      const p = posAt(r, r.length);
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.7, 2.8, 1), lambert(0xd8402f));
      b.position.set(p.x + p.hx * 0.4, p.y + p.hy * 0.4, 0.5);
      b.rotation.z = Math.atan2(p.hy, p.hx);
      g.add(b);
    }
  
  const chev = new THREE.Shape();
  chev.moveTo(0.35, 0);
  chev.lineTo(-0.35, 0.6);
  chev.lineTo(-0.1, 0);
  chev.lineTo(-0.35, -0.6);
  chev.closePath();
  const cg = new THREE.ShapeGeometry(chev);
  const cm = basic(0xffc21a, { side: THREE.DoubleSide });
  for (const ch of level.track.chevrons) {
    const r = level.trackGraph.rails[ch.rail];
    for (let s = ch.s0 + 0.5; s <= ch.s1; s += 2.5) {
      const p = posAt(r, s);
      const mm = new THREE.Mesh(cg, cm);
      mm.position.set(p.x, p.y, 0.09);
      mm.rotation.z = Math.atan2(p.hy, p.hx);
      g.add(mm);
    }
  }
  for (const d of level.track.diamonds) {
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), basic(0x8a8f9e));
    plate.position.set(d.x, d.y, 0.08);
    plate.rotation.z = Math.PI / 4;
    g.add(plate);
  }
  return g;
}

const PROP_COLOR = {
  pcTower: 0x2c2f3a,
  eraser: 0xf28fb0,
  threshold: BRASS,
  crumb: 0xd9a35a,
  sugarCanister: 0xe6eef5,
  backDoor: 0x8a5a3a,
  sugarCubes: 0xf8f8f2,
  peaBowl: 0x6fa8dc,
  caboose: 0xc0392b,
  tableLeg: 0x9b6b43,
  chairLeg: 0x7a4a2a,
  cerealBoxes: 0xe8b33a,
  fireflyJar: 0xbfeaff,
};


function propMeshes(level) {
  const group = new THREE.Group();
  
  const tall = [];
  const rails = Object.values(level.trackGraph.rails);
  const offRails = (x, y) => rails.every((r) => nearestOnRail(r, x, y).d > 1.6);
  for (const p of level.track.props) {
    const cx = (p.x0 + p.x1) / 2;
    const cy = (p.y0 + p.y1) / 2;
    const w = p.x1 - p.x0;
    const h = p.y1 - p.y0;
    if (p.kind === 'tableShadow') {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        basic(0x000000, { transparent: true, opacity: p.shade ?? 0.35, depthWrite: false }),
      );
      m.position.set(cx, cy, 0.02);
      group.add(m);
      continue;
    }
    if (p.text) {
      
      const tex = canvasTexture(512, Math.max(64, Math.round((512 * h) / w)), (ctx, cw, ch) => {
        ctx.fillStyle = '#f6f0e0';
        ctx.fillRect(0, 0, cw, ch);
        ctx.fillStyle = p.kind === 'wantedPoster' ? '#7a2a1a' : '#3a56c8';
        let size = 64;
        ctx.font = `700 ${size}px system-ui, sans-serif`;
        while (ctx.measureText(p.text).width > cw * 0.9 && size > 10) ctx.font = `700 ${--size}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (p.kind === 'wantedPoster' && ch > 200) {
          const [a, b] = p.text.split(':');
          ctx.fillText(`${a}:`, cw / 2, ch * 0.3);
          ctx.fillText((b ?? '').trim(), cw / 2, ch * 0.6);
        } else ctx.fillText(p.text, cw / 2, ch / 2);
      });
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), lambert(0xffffff, { map: tex }));
      m.position.set(cx, cy, 0.04);
      group.add(m);
      continue;
    }
    const z = Math.min(MAX_PROP_Z, p.z ?? 1);
    const color = PROP_COLOR[p.kind] ?? 0x9aa3b0;
    const fade = z > 6;
    const mat = lambert(color, fade ? { transparent: true } : {});
    const mats = [mat];
    if (p.kind === 'doughnut') {
      const r = Math.min(w, h) / 2;
      const d = new THREE.Mesh(new THREE.TorusGeometry(r * 0.66, r * 0.3, 14, 40), lambert(0xd9a066));
      d.position.set(cx, cy, r * 0.3);
      d.scale.z = z / (r * 0.6);
      const icing = new THREE.Mesh(new THREE.TorusGeometry(r * 0.66, r * 0.24, 10, 40), lambert(0xf28fb0));
      icing.position.set(cx, cy, r * 0.3 * d.scale.z + 0.2);
      icing.scale.z = 0.4;
      group.add(d, icing);
      continue;
    }
    if (p.kind === 'cerealSpill') {
      const rnd = lcg(181);
      const fm = lambert(0xf0c060);
      for (let i = 0; i < (p.flakes ?? 12) * 3; i++) {
        const fx = p.x0 + rnd() * w;
        const fy = p.y0 + rnd() * h;
        if (!offRails(fx, fy)) continue; 
        const f = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1, 0.3), fm);
        f.position.set(fx, fy, 0.15 + rnd() * 0.3);
        f.rotation.set(rnd() * 0.4, rnd() * 0.4, rnd() * 3);
        group.add(f);
      }
      continue;
    }
    if (p.kind === 'sugarCubes') {
      for (let i = 0; i < Math.floor(w / 3); i++)
        group.add(boxAt(p.x0 + i * 3 + 0.2, p.x0 + i * 3 + 2.8, p.y0 + (i % 2) * 0.6, p.y0 + (i % 2) * 0.6 + 2.6, 0, z, mat));
      continue;
    }
    if (p.kind === 'fireflyJar') {
      const jar = boxAt(p.x0, p.x1, p.y0, p.y1, 0, z, lambert(color, { transparent: true, opacity: 0.55 }));
      group.add(jar);
      for (const [dx, dy] of [
        [0.4, 0.5],
        [1.4, 1.2],
        [0.9, 1.6],
      ]) {
        const f = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), basic(0xfff27a));
        f.position.set(p.x0 + dx, p.y0 + dy, z * 0.6);
        group.add(f);
      }
      continue;
    }
    const m = boxAt(p.x0, p.x1, p.y0, p.y1, 0, z, mat);
    group.add(m);
    if (p.kind === 'backDoor' && p.catFlap) {
      const fm = lambert(0x5a3a24, fade ? { transparent: true } : {});
      mats.push(fm);
      group.add(boxAt(p.x0 - 0.3, p.x0 + 0.2, p.catFlap[0], p.catFlap[1], 0, 10, fm));
    }
    if (p.kind === 'pcTower') {
      
      group.add(boxAt(p.x0 + 3, p.x1 - 3, p.y0 - 0.2, p.y0, z - 8, z - 4, lambert(0x4a4f60, fade ? { transparent: true } : {})));
      for (let i = 0; i < 5; i++) group.add(boxAt(p.x0 + 4, p.x1 - 4, p.y0 - 0.2, p.y0, 4 + i * 2, 4.6 + i * 2, lambert(0x1a1c24)));
      const led = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), basic(0x3bd16f));
      led.position.set(p.x1 - 3, p.y0 - 0.3, z - 2);
      group.add(led);
    }
    if (p.kind === 'caboose') group.add(boxAt(p.x0 - 0.3, p.x1 + 0.3, p.y0 - 0.2, p.y1 + 0.2, z, z + 0.4, lambert(0x5a2a20)));
    if (p.kind === 'sugarCanister') {
      const lid = new THREE.Mesh(
        new THREE.CylinderGeometry(w * 0.3, w * 0.3, 0.6, 20),
        lambert(0xc0392b, fade ? { transparent: true } : {}),
      );
      mats.push(lid.material);
      lid.rotation.x = Math.PI / 2;
      lid.position.set(cx, cy, z + 0.3);
      group.add(lid);
    }
    if (fade) tall.push({ mats, b: [p.x0, p.x1, p.y0, p.y1, z + 0.6], k: 1 });
  }
  const ray = new THREE.Vector3();
  return {
    group,
    
    update(cam, c, dt) {
      ray.set(c.x - cam.x, c.y - cam.y, 1 - cam.z);
      for (const T of tall) {
        const hit = segmentHitsBox(cam, ray, T.b);
        T.k += ((hit ? 0.22 : 1) - T.k) * (1 - Math.exp(-dt * 8));
        for (const mm of T.mats) {
          mm.opacity = T.k;
          mm.depthWrite = T.k > 0.95;
        }
      }
    },
  };
}


function segmentHitsBox(o, d, [x0, x1, y0, y1, z1]) {
  let t0 = 0;
  let t1 = 1;
  for (const [oo, dd, lo, hi] of [
    [o.x, d.x, x0, x1],
    [o.y, d.y, y0, y1],
    [o.z, d.z, 0, z1],
  ]) {
    if (Math.abs(dd) < 1e-9) {
      if (oo < lo || oo > hi) return false;
      continue;
    }
    let a = (lo - oo) / dd;
    let b = (hi - oo) / dd;
    if (a > b) [a, b] = [b, a];
    t0 = Math.max(t0, a);
    t1 = Math.min(t1, b);
    if (t0 > t1) return false;
  }
  return true;
}


function stationMeshes(level, labels) {
  const g = new THREE.Group();
  const R = level.trackGraph.rails;
  for (const st of level.track.stations) {
    const p = posAt(R[st.rail], st.s);
    const nx = -p.hy;
    const ny = p.hx;
    
    const side = ny < 0 || (Math.abs(ny) < 0.2 && nx > 0) ? 1 : -1;
    const px = p.x + nx * 2.6 * side;
    const py = p.y + ny * 2.6 * side;
    const plat = new THREE.Mesh(new THREE.BoxGeometry(6, 2.2, 0.4), lambert(0xd8c8a8));
    plat.position.set(px, py, 0.2);
    plat.rotation.z = Math.atan2(p.hy, p.hx);
    g.add(plat);
    const cp = level.checkpoints.find((k) => k.name === st.id);
    if (cp) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8), lambert(0xffffff));
      post.rotation.x = Math.PI / 2;
      post.position.set(px, py, 1.4);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), basic(TEAL));
      lamp.position.set(px, py, 2.7);
      g.add(post, lamp);
    }
    const label = cp ? labels.find((l) => l.id === cp.id) : null;
    const name = st.sign ?? label?.label ?? st.id;
    const text = cp ? `${cp.id}. ${name}` : name;
    const sign = textSprite(text);
    sign.position.set(px, py, 3.8);
    sign.scale.multiplyScalar(0.95);
    g.add(sign);
  }
  return g;
}

const ARROW = (() => {
  const s = new THREE.Shape();
  s.moveTo(1, 0);
  s.lineTo(-0.5, 0.75);
  s.lineTo(-0.2, 0);
  s.lineTo(-0.5, -0.75);
  s.closePath();
  return new THREE.ShapeGeometry(s);
})();


function pointsMeshes(level) {
  const group = new THREE.Group();
  const R = level.trackGraph.rails;
  const list = [];
  for (const p of level.track.points) {
    const q = posAt(R[p.rail], p.s);
    const blades = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2, 0.14), lambert(0x3a3f4f));
    blades.position.set(q.x, q.y, 0.1);
    blades.rotation.z = Math.atan2(q.hy, q.hx);
    group.add(blades);
    const color = p.lever ? BRASS : TEAL;
    const branch = {};
    for (const k of ['a', 'b']) {
      const rail = R[p[k]];
      if (!rail) continue;
      const s0 = p[k] === p.rail ? p.s : 0;
      const pos = [];
      const idx = [];
      strip(rail, s0, Math.min(rail.length, s0 + 6), 0, 2, 0.1, pos, idx);
      const glow = new THREE.Mesh(
        geometryOf(pos, idx),
        basic(color, { transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide }),
      );
      const a = posAt(rail, Math.min(rail.length, s0 + 3.5));
      const arrow = new THREE.Mesh(ARROW, basic(color, { transparent: true, depthWrite: false, side: THREE.DoubleSide }));
      arrow.position.set(a.x, a.y, 0.2);
      arrow.rotation.z = Math.atan2(a.hy, a.hx);
      group.add(glow, arrow);
      branch[k] = { glow, arrow };
    }
    list.push({ p, branch, pop: 0, lastT: 0 });
  }
  return {
    group,
    pop(id) {
      const it = list.find((x) => x.p.id === id);
      if (it) it.pop = 0.35;
    },
    update(s, time) {
      const next = nextThrowable(s)?.p.id;
      for (const it of list) {
        const dt = Math.min(0.1, Math.max(0, time - it.lastT));
        it.lastT = time;
        it.pop = Math.max(0, it.pop - dt);
        const set = s.points[it.p.id];
        const pulse = next === it.p.id;
        for (const k of ['a', 'b']) {
          const b = it.branch[k];
          if (!b) continue;
          const on = set === k;
          b.glow.visible = on;
          b.arrow.visible = on;
          if (!on) continue;
          const wave = Math.sin(time * 10);
          b.glow.material.opacity = pulse ? 0.45 + 0.3 * wave : 0.25;
          b.arrow.material.opacity = pulse ? 1 : 0.7;
          b.arrow.scale.setScalar((pulse ? 1.2 + 0.2 * wave : 1) + it.pop * 1.5);
        }
      }
    },
  };
}


function signalMeshes(level) {
  const group = new THREE.Group();
  const R = level.trackGraph.rails;
  const list = [];
  for (const sig of level.track.signals) {
    const p = level.track.points.find((x) => x.id === sig.points);
    if (!p) continue;
    const q = posAt(R[p.rail], Math.max(0, p.s - 3));
    const x = q.x - q.hy * 2.4;
    const y = q.y + q.hx * 2.4;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 8), lambert(0x3a3f4f));
    post.rotation.x = Math.PI / 2;
    post.position.set(x, y, 1.3);
    const head = boxAt(x - 0.4, x + 0.4, y - 0.4, y + 0.4, 2.4, 3.4, lambert(0x23233a));
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 12), basic(0xff3b30));
    lamp.position.set(x, y - 0.3, 3);
    group.add(post, head, lamp);
    if (sig.sign) {
      const sign = textSprite(sig.sign);
      sign.position.set(x, y, 4.4);
      sign.scale.multiplyScalar(0.7);
      group.add(sign);
    }
    list.push({ sig, lamp, x, y });
  }
  return {
    group,
    at: (id) => list.find((l) => l.sig.id === id) ?? null,
    update(s) {
      for (const l of list) l.lamp.material.color.set(s.signals?.[l.sig.id] === 'green' ? 0x3bd16f : 0xff3b30);
    },
  };
}


function debrisMeshes(level) {
  const group = new THREE.Group();
  const R = level.trackGraph.rails;
  const list = [];
  for (const d of level.track.debris) {
    const r = R[d.rail];
    const mid = posAt(r, (d.s0 + d.s1) / 2);
    const g = new THREE.Group();
    g.position.set(mid.x, mid.y, 0);
    g.rotation.z = Math.atan2(mid.hy, mid.hx) + Math.PI / 2; 
    const steel = lambert(0xcfd4dc);
    if (d.name === 'fork') {
      g.add(boxAt(-3.6, 1, -0.22, 0.22, 0.15, 0.45, steel), boxAt(1, 2.2, -0.6, 0.6, 0.15, 0.4, steel));
      for (const ty of [-0.5, -0.17, 0.17, 0.5]) g.add(boxAt(2.2, 3.6, ty - 0.08, ty + 0.08, 0.15, 0.35, steel));
    } else g.add(boxAt(-1.6, 1.6, -0.8, 0.8, 0, 1, lambert(0xb08a5a)));
    group.add(g);
    if (d.mark === 'crayonX') {
      
      const m = posAt(r, Math.max(0, d.s0 - 4));
      for (const a of [Math.PI / 4, -Math.PI / 4]) {
        const bar = new THREE.Mesh(new THREE.PlaneGeometry(3, 0.4), basic(0xe0302a));
        bar.position.set(m.x - m.hy * 2.2, m.y + m.hx * 2.2, 0.05);
        bar.rotation.z = a;
        group.add(bar);
      }
    }
    list.push({ d, g });
  }
  return {
    group,
    update(s) {
      const cleared = s.train?.cleared ?? [];
      for (const it of list) it.g.visible = !cleared.includes(it.d.id);
    },
  };
}


function peaLanes(level) {
  const g = new THREE.Group();
  for (const pe of level.track.peas) {
    const l = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(pe.from[0], pe.from[1], 0.06),
        new THREE.Vector3(pe.to[0], pe.to[1], 0.06),
      ]),
      new THREE.LineDashedMaterial({ color: 0x8a6a3a, dashSize: 0.6, gapSize: 0.4 }),
    );
    l.computeLineDistances();
    g.add(l);
  }
  return g;
}


function peaPool(scene) {
  const pool = [];
  const geo = new THREE.SphereGeometry(0.6, 16, 12);
  const mat = lambert(0x7fc34a);
  return {
    update(list) {
      while (pool.length < list.length) {
        const m = new THREE.Mesh(geo, mat);
        const sh = shadowBlob(0.6);
        scene.add(m, sh);
        pool.push({ m, sh });
      }
      for (const [i, it] of pool.entries()) {
        const q = list[i];
        it.m.visible = it.sh.visible = !!q;
        if (!q) continue;
        it.m.position.set(q.x, q.y, 0.6);
        it.m.rotation.x = -q.y / 0.6;
        it.sh.position.set(q.x + 0.15, q.y + 0.15, 0.03);
      }
    },
  };
}





function carGroup() {
  const g = new THREE.Group();
  const inner = new THREE.Group();
  g.add(inner);
  g.userData.inner = inner;
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), basic(0x000000, { transparent: true, opacity: 0.25, depthWrite: false }));
  sh.position.set(0.15, -0.15, 0.03);
  g.add(sh);
  g.userData.shadow = sh;
  return g;
}

function trainMeshes() {
  const group = new THREE.Group();
  const wheels = [];
  const wheelMat = () => basic(0x1d1d24);
  const addWheels = (inner, len) => {
    for (const x of [-len / 2 + 0.6, len / 2 - 0.6])
      for (const y of [-1.02, 1.02]) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.16, 14), wheelMat());
        w.position.set(x, y, 0.36);
        inner.add(w);
        wheels.push(w);
      }
  };
  
  const engine = carGroup();
  const ei = engine.userData.inner;
  engine.userData.shadow.scale.set(4.2, 2.2, 1);
  ei.add(boxAt(-2, 1.4, -0.9, 0.9, 0.25, 0.65, lambert(0x2a2a35)));
  const boiler = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 2.3, 18), lambert(0xd8402f));
  boiler.rotation.z = Math.PI / 2;
  boiler.position.set(0.25, 0, 1.25);
  ei.add(boiler);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.71, 0.71, 0.16, 18), lambert(BRASS));
  band.rotation.z = Math.PI / 2;
  band.position.set(0.6, 0, 1.25);
  ei.add(band);
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1, 12), lambert(0x23233a));
  chimney.rotation.x = Math.PI / 2;
  chimney.position.set(1.05, 0, 2.15);
  ei.add(chimney);
  
  const cabM = lambert(0xb02a20);
  ei.add(boxAt(-2, -0.55, -0.95, -0.8, 0.65, 1.3, cabM), boxAt(-2, -0.55, 0.8, 0.95, 0.65, 1.3, cabM));
  ei.add(boxAt(-0.7, -0.55, -0.95, 0.95, 0.65, 1.45, cabM), boxAt(-2, -1.85, -0.95, 0.95, 0.65, 1.2, cabM));
  
  const wedge = new THREE.Shape();
  wedge.moveTo(2, 0);
  wedge.lineTo(1.3, 1);
  wedge.lineTo(1.3, -1);
  wedge.closePath();
  const cc = new THREE.Mesh(new THREE.ExtrudeGeometry(wedge, { depth: 0.55, bevelEnabled: false }), lambert(0xb9bec8));
  cc.position.z = 0.12;
  ei.add(cc);
  
  const key = new THREE.Group();
  key.position.set(-0.3, 0, 2.15);
  const bow = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 8, 18), lambert(BRASS));
  bow.rotation.y = Math.PI / 2;
  bow.position.z = 0.25;
  key.add(bow);
  ei.add(key);
  
  const shell = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.2, 10, 20), lambert(0x7d9bd6));
  shell.position.set(1.85, 0, 0.75);
  shell.rotation.y = Math.PI / 2;
  shell.visible = false;
  ei.add(shell);
  
  const boost = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.5), basic(0xffffff, { transparent: true, opacity: 0.7, depthWrite: false }));
  boost.position.set(-0.6, 0, 2.6);
  boost.visible = false;
  ei.add(boost);
  addWheels(ei, 4);

  const tender = carGroup();
  const ti = tender.userData.inner;
  tender.userData.shadow.scale.set(3.2, 2.2, 1);
  ti.add(boxAt(-1.5, 1.5, -0.95, 0.95, 0.3, 1.35, lambert(0x2f6f4a)));
  ti.add(boxAt(-1.3, 1.3, -0.75, 0.75, 1.35, 1.55, lambert(0x1e1e24)));
  addWheels(ti, 3);

  const hopper = carGroup();
  const hi = hopper.userData.inner;
  hopper.userData.shadow.scale.set(3.7, 2.2, 1);
  hi.add(boxAt(-1.75, 1.75, -0.95, 0.95, 0.3, 1.3, lambert(0x8a7a5a)));
  
  hi.add(boxAt(-1.2, 0.2, -0.6, 0.6, 1.3, 1.9, lambert(TEAL)));
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), lambert(0xc8ccd6));
  dish.position.set(0.9, 0, 1.3);
  dish.rotation.x = Math.PI / 2;
  hi.add(dish);
  addWheels(hi, 3.5);

  group.add(engine, tender, hopper);
  return { group, cars: { engine, tender, hopper }, wheels, key, shell, boost };
}





const TRAIN_KINDS = {
  windupKey() {
    const g = new THREE.Group();
    const spin = new THREE.Group();
    spin.name = 'spin';
    spin.position.y = 0.55;
    const m = lambert(BRASS);
    const bow = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 8, 16), m);
    bow.position.x = -0.3;
    const stem = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.09, 0.09), m);
    stem.position.x = 0.15;
    const bit = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.09), m);
    bit.position.set(0.38, -0.1, 0);
    spin.add(bow, stem, bit);
    g.add(spin);
    return g;
  },
  sparkWheels() {
    const g = new THREE.Group();
    const spin = new THREE.Group();
    spin.name = 'spin';
    spin.position.y = 0.45;
    for (const x of [-0.28, 0.28]) {
      const w = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.07, 8, 16), basic(0xfff06a));
      w.position.x = x;
      spin.add(w);
    }
    g.add(spin);
    return g;
  },
  hopper() {
    const g = new THREE.Group();
    g.add(boxAt(-0.9, 0.9, 0, 0.9, -0.5, 0.5, lambert(0x8a7a5a)), boxAt(-0.5, 0.3, 0.9, 1.3, -0.3, 0.3, lambert(TEAL)));
    return g;
  },
  handcar() {
    const g = new THREE.Group();
    g.add(boxAt(-1, 1, 0.1, 0.5, -0.5, 0.5, lambert(0x9b6b43)));
    g.add(boxAt(-0.06, 0.06, 0.5, 1.3, -0.06, 0.06, lambert(0x3a3f4f)), boxAt(-0.6, 0.6, 1.25, 1.37, -0.06, 0.06, lambert(0x3a3f4f)));
    const halo = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.05, 24), basic(PINK, { transparent: true, opacity: 0 }));
    halo.position.set(0, 0.6, 0.4);
    halo.name = 'kickHalo';
    g.add(halo);
    return g;
  },
  cricket(e) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.5, 4, 10), lambert(0x5aa83a));
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.25;
    g.add(body);
    if (e.specimen) {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), lambert(GOLD));
      cap.position.set(0.28, 0.38, 0);
      g.add(cap);
    }
    return g;
  },
  hook(e) {
    if (!e.lever) return entityView(e);
    
    const g = new THREE.Group();
    g.add(boxAt(-0.06, 0.06, 0, 1, -0.06, 0.06, lambert(0x3a3f4f)));
    const r = new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.08, 8, 20), lambert(BRASS));
    r.position.y = 1.25;
    r.name = 'aim';
    g.add(r);
    return g;
  },
};

function syncTrainEntities(scene, views, s, camera, time) {
  const t = s.train;
  const seen = new Set();
  for (const e of s.entities) {
    seen.add(e.id);
    let v = views.get(e.id);
    if (!v) {
      const bb = new THREE.Group();
      const inner = TRAIN_KINDS[e.kind] ? TRAIN_KINDS[e.kind](e) : entityView(e);
      bb.add(inner);
      const shadow = shadowBlob(Math.max(0.4, Math.min(1.2, ((e.w ?? 0.8) * ENTITY_SCALE) / 2)));
      scene.add(bb, shadow);
      v = { bb, inner, shadow };
      views.set(e.id, v);
    }
    
    const armed = e.kind !== 'sparkWheels' || (t.passes[e.rail] ?? 0) >= (e.pass ?? 0);
    const show = e.alive && armed && !(e.kind === 'cricket' && e.hidden) && e.kind !== 'cameo';
    v.bb.visible = show;
    v.shadow.visible = show && e.kind !== 'finish';
    if (!show) continue;
    const z = e.z ?? 0;
    v.bb.position.set(e.x, e.y, 0.05 + z);
    v.bb.quaternion.copy(camera.quaternion);
    const flip = e.facing < 0 ? -1 : 1;
    v.inner.scale.set(ENTITY_SCALE * flip, ENTITY_SCALE, ENTITY_SCALE);
    v.shadow.position.set(e.x, e.y, 0.03);
    v.shadow.scale.setScalar(1 / (1 + z * 0.25));
    const spin = v.inner.getObjectByName('spin');
    if (spin) spin.rotation.y = time * 2.5;
    const ball = v.inner.getObjectByName('ball');
    if (ball) ball.rotation.z = e.rolling || e.state === 'roll' ? -time * 12 : 0;
    const kh = v.inner.getObjectByName('kickHalo');
    if (kh) kh.material.opacity = e.stage === 'windup' || e.state === 'windup' ? 0.85 : 0;
    const sdt = Math.min(0.1, Math.max(0, time - (v.bb.userData.lastT ?? time)));
    v.bb.userData.lastT = time;
    if (v.inner.userData.critter?.ready) updateCritterSprite(v.inner, e, sdt);
    
    if (e.flung) v.inner.rotation.z = time * 18 * flip;
    else if (e.state === 'dazed') v.inner.rotation.z = Math.sin(time * 30) * 0.15;
    else v.inner.rotation.z = 0;
  }
  for (const [id, v] of views)
    if (!seen.has(id)) {
      scene.remove(v.bb, v.shadow);
      views.delete(id);
    }
}
