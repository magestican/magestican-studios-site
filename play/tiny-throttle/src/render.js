










import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sampleAt } from '../../../web-engine/kart/trackPath.js';
import { deckRuns, piecesAlong, trestlesAlong } from '../../../web-engine/rc/connector.js';
import { SIM_SCALE, METRICS } from '../../../web-engine/rc/rcTuning.js';
import { propDir } from './propDirs.js';
import { supportY } from './support.js';
import { KINDS } from '../../../web-engine/rc/props.js';
import { buildItems } from './renderItems.js';
import { qualityFor, createScaler } from './quality.js';
import { createSuspension, stepSuspension, bodyScale, createShake, addShake, stepShake } from './carFeel.js';
import { createAttitude, stepAttitude, createSparks, emitSparks, stepSparks, SPARKS } from './carAttitude.js';

const m = (units) => units / SIM_SCALE;


import { BODIES, carDir } from './carClass.js';
export { BODIES };

export const LIVERIES = Object.freeze([
  0xff3b30, 0x2f7bff, 0x30c95a, 0xffc61a, 0xa64dff, 0xff7ac8,
  0x00c2c7, 0xff8a1f, 0x8fd14f, 0x5a5cff, 0xe0e0e0, 0x7a4b2a,
]);

const ASSET_DIRS = {
  car: 'cars', connector: 'connector', house: 'house', yard: 'yard', pickups: 'pickups',
};



export function modelsFor(def) {
  
  const names = new Set([...def.props, ...(def.loose ?? [])].map((p) => p.model).concat(['toy_block', 'marble']));
  const out = [...names].map((n) => [propDir(n), n]);
  out.push([ASSET_DIRS.connector, 'track_piece'], [ASSET_DIRS.connector, 'trestle'], [ASSET_DIRS.connector, 'start_arch']);
  
  out.push([ASSET_DIRS.pickups, 'desk_fan'], [ASSET_DIRS.pickups, 'rubber_band']);
  for (const b of BODIES) out.push([carDir(b), `car_${b}`]);
  return out;
}

export async function loadModels(def, base = './assets', onProgress = () => {}) {
  const loader = new GLTFLoader();
  const list = modelsFor(def);
  const out = new Map();
  let done = 0;
  await Promise.all(list.map(async ([dir, name]) => {
    const gltf = await loader.loadAsync(`${base}/${dir}/${name}/${name}.glb`);
    const root = gltf.scene;
    root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    out.set(name, { root, box: new THREE.Box3().setFromObject(root) });
    done += 1;
    onProgress(done / list.length);
  }));
  return out;
}

const clone = (models, name) => {
  const m0 = models.get(name);
  if (!m0) throw new Error(`render: no model "${name}"`);
  return m0.root.clone(true);
};


const yawOf = (tx, tz) => Math.atan2(-tz, tx);

const coarsePointer = () => typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches;



export function createView(canvas, race, models, { quality = qualityFor({ coarse: coarsePointer(), dpr: window.devicePixelRatio || 1 }) } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: quality.antialias, powerPreference: 'high-performance' });
  renderer.setPixelRatio(quality.pixelRatio);
  const scaler = createScaler(quality);
  let lastNow = 0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = quality.softShadows ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  
  
  const air = race.track.def.room?.sky ?? 0xf3e6cf;
  scene.background = new THREE.Color(air);
  
  
  scene.fog = new THREE.Fog(air, 12, 40);

  const camera = new THREE.PerspectiveCamera(METRICS.fov.base, 1, 0.01, 90);

  scene.add(new THREE.HemisphereLight(0xfff6e8, 0xb59a7a, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(quality.shadowMap, quality.shadowMap);
  const sc = sun.shadow.camera;
  sc.left = -3; sc.right = 3; sc.top = 3; sc.bottom = -3; sc.near = 0.1; sc.far = 12;
  sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);

  buildRoom(scene, race.track.def);
  buildLanes(scene, race.track);
  buildConnector(scene, race.track, models);
  buildProps(scene, race.track.def, models);
  buildStart(scene, race.track, models);
  
  
  if (!quality.propShadows) scene.traverse((o) => { if (o.isMesh) o.castShadow = false; });
  const cars = buildCars(scene, race, models);
  const loose = buildLoose(scene, race, models);
  const items = buildItems(scene, race, models);
  const sparks = buildSparks(scene);
  
  const warm = items.warm();
  renderer.compile(scene, camera);
  for (const o of warm) o.removeFromParent();

  const cam = { pos: new THREE.Vector3(), look: new THREE.Vector3(), ready: false, fov: METRICS.fov.base };
  
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shake = createShake({ reduced });
  let lastFocus = null;

  function resize(w, h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  
  function draw(dt, focusId, { camMode = 'chase' } = {}) {
    for (const c of cars) {
      const r = race.racers.find((x) => x.id === c.id);
      const k = r.kart;
      c.obj.position.set(m(k.x), m(k.y), m(k.z));
      c.obj.rotation.y = k.heading - Math.PI / 2;
      
      c.obj.rotation.x = -(k.steerVisual ?? 0) * 0.1;
      
      
      if (k.respawning) c.att = createAttitude();
      stepAttitude(c.att, { y: m(k.y), h: Math.hypot(k.vx, k.vz) / SIM_SCALE }, dt);
      c.obj.rotation.z = c.att.pitch + c.att.wheelie;
      
      c.obj.position.y += Math.sin(c.att.wheelie) * 0.05;
      c.obj.visible = !(k.respawning && Math.floor(race.clock * 10) % 2 === 0);
      
      
      if (k.respawning) c.susp = createSuspension();
      stepSuspension(c.susp, m(k.y), dt);
      const sc = bodyScale(c.susp);
      c.obj.scale.set(sc.xz, sc.y, sc.xz);
      
      if (c.susp.landed) emitSparks(sparks.pool, { x: m(k.x), y: m(k.y), z: m(k.z), heading: k.heading, impact: c.susp.landed });
    }
    sparks.draw(dt);
    drawLoose(loose, race);
    items.draw(race.clock);
    const f = race.racers.find((x) => x.id === focusId) ?? race.racers[race.racers.length - 1];
    const k = f.kart;
    const fx = Math.sin(k.heading); const fz = Math.cos(k.heading);
    const speed = Math.hypot(k.vx, k.vz) / SIM_SCALE;
    const p = new THREE.Vector3(m(k.x), m(k.y), m(k.z));
    const C = METRICS.camera;
    let wantPos; let wantLook;
    if (camMode === 'top') {
      wantPos = p.clone().add(new THREE.Vector3(-fx * 1.2, 2.4, -fz * 1.2));
      wantLook = p.clone();
    } else {
      wantPos = p.clone().add(new THREE.Vector3(-fx * C.back, C.up + 0.06, -fz * C.back));
      wantLook = p.clone().add(new THREE.Vector3(fx * C.lookAhead, 0.02, fz * C.lookAhead));
    }
    const a = cam.ready ? 1 - Math.exp(-dt * 9) : 1;
    cam.pos.lerp(wantPos, a);
    cam.look.lerp(wantLook, a);
    cam.ready = true;
    
    
    if (f.id !== lastFocus) { shake.trauma = 0; lastFocus = f.id; }
    const fc = cars.find((c) => c.id === f.id);
    if (fc?.susp.landed) addShake(shake, Math.min(0.8, (fc.susp.landed - 0.8) / 3.5));
    const sh = stepShake(shake, dt);
    camera.position.set(cam.pos.x + sh.x, cam.pos.y + sh.y, cam.pos.z);
    camera.lookAt(cam.look.x + sh.x, cam.look.y + sh.y, cam.look.z);
    
    const t = Math.min(1, speed / METRICS.topSpeed);
    const base = METRICS.fov.base + (METRICS.fov.fast - METRICS.fov.base) * t;
    const portrait = camera.aspect < 1 ? Math.min(20, (1 - camera.aspect) * 40) : 0;
    const want = base + portrait;
    cam.fov += (want - cam.fov) * Math.min(1, dt * 4);
    if (Math.abs(camera.fov - cam.fov) > 0.01) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
    sun.position.set(p.x + 2.5, p.y + 6, p.z + 1.5);
    sun.target.position.copy(p);
    
    const now = performance.now();
    if (lastNow) {
      const r = scaler.step((now - lastNow) / 1000);
      if (r !== renderer.getPixelRatio()) renderer.setPixelRatio(r);
    }
    lastNow = now;
    renderer.render(scene, camera);
  }

  return { renderer, scene, camera, resize, draw, cars, quality, scaler, shake: (amount) => addShake(shake, amount) };
}




const FLOORS = {
  tile: { color: 0xe2d2b6, line: 0xc9b799 },
  boards: { color: 0xc79a64, line: 0x9c7344 },
  
  
  lawn: { color: 0x6fae45, line: 0x5f9a3a },
};


function buildRoom(scene, def) {
  const R = def.room;
  const cx = (R.x0 + R.x1) / 2; const cz = (R.z0 + R.z1) / 2;
  const W = R.x1 - R.x0; const D = R.z1 - R.z0;
  const look = FLOORS[R.floor] ?? FLOORS.tile;
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(W + 40, D + 40),
    new THREE.MeshLambertMaterial({ color: look.color }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(cx, 0, cz);
  floor.receiveShadow = true;
  scene.add(floor);
  if (R.floor === 'boards') scene.add(boardLines(R, look.line));
  else if (R.floor === 'lawn') scene.add(mowStripes(R, look.line));
  else {
    const size = Math.max(W, D) + 40;
    const grout = new THREE.GridHelper(size, Math.round(size / 0.3), look.line, look.line);
    grout.position.set(cx, 0.0008, cz);
    grout.material.transparent = true;
    grout.material.opacity = 0.55;
    scene.add(grout);
  }
  for (const r of def.rugs ?? []) scene.add(rugMesh(r));
  
  
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xf7efe0 });
  const skirt = new THREE.MeshLambertMaterial({ color: 0xc9b08a });
  
  
  const sides = { z0: [W, cx, R.z0, 0], x1: [D, R.x1, cz, -Math.PI / 2], x0: [D, R.x0, cz, Math.PI / 2],
    z1: [W, cx, R.z1, Math.PI] };
  for (const [w, x, z, ry] of (R.walls ?? Object.keys(sides)).map((k) => sides[k])) {
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.2, 3), wallMat);
    wall.rotation.y = ry;
    wall.position.set(x, 1.5, z);
    wall.receiveShadow = true;
    const s = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.2, 0.08), skirt);
    s.rotation.y = ry;
    
    s.position.set(x + Math.sign(cx - x) * 0.01 * (ry !== 0 && ry !== Math.PI ? 1 : 0), 0.04,
      z + Math.sign(cz - z) * 0.01 * (ry === 0 || ry === Math.PI ? 1 : 0));
    scene.add(wall, s);
  }
}


function mowStripes(R, colour) {
  const grp = new THREE.Group();
  const mat = new THREE.MeshLambertMaterial({ color: colour });
  const D = R.z1 - R.z0 + 40;
  for (let x = R.x0 - 20; x < R.x1 + 20; x += 1.0) {
    const band = new THREE.Mesh(new THREE.PlaneGeometry(0.5, D), mat);
    band.rotation.x = -Math.PI / 2;
    band.position.set(x + 0.25, 0.0006, (R.z0 + R.z1) / 2);
    band.receiveShadow = true;
    grp.add(band);
  }
  return grp;
}

function boardLines(R, colour) {
  const pos = [];
  const x0 = R.x0 - 20; const x1 = R.x1 + 20;
  for (let z = R.z0 - 20; z <= R.z1 + 20; z += 0.14) pos.push(x0, 0.0008, z, x1, 0.0008, z);
  
  let row = 0;
  for (let z = R.z0; z <= R.z1; z += 0.14, row += 1) {
    for (let x = R.x0 + (row % 3) * 0.4; x <= R.x1; x += 1.2) pos.push(x, 0.0008, z, x, 0.0008, z + 0.14);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({ color: colour, transparent: true, opacity: 0.6 });
  return new THREE.LineSegments(g, mat);
}


function rugMesh(r) {
  const grp = new THREE.Group();
  const w = r.x1 - r.x0; const d = r.z1 - r.z0;
  const edge = new THREE.Mesh(new THREE.BoxGeometry(w, 0.006, d), new THREE.MeshLambertMaterial({ color: r.border }));
  const mid = new THREE.Mesh(new THREE.BoxGeometry(w - 0.3, 0.007, d - 0.3), new THREE.MeshLambertMaterial({ color: r.color }));
  edge.position.set(0, 0.003, 0); mid.position.set(0, 0.0035, 0);
  edge.receiveShadow = true; mid.receiveShadow = true;
  grp.add(edge, mid);
  if (r.boards) {
    
    const pos = [];
    for (let z = -d / 2 + 0.14; z < d / 2; z += 0.14) pos.push(-w / 2, 0.0075, z, w / 2, 0.0075, z);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    grp.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: r.border })));
  }
  grp.position.set((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2);
  return grp;
}


function buildLanes(scene, track) {
  const { path, spans } = track;
  const isConnector = (s) => spans.some((sp) => {
    const L = path.length; const x = ((s - sp.s0) % L + L) % L;
    return x <= sp.s1 - sp.s0;
  });
  const tape = new THREE.MeshLambertMaterial({ color: 0x2f8cff });
  const line = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const tw = 0.035;
  const pos = []; const posLine = [];
  const N = 900;
  for (let i = 0; i < N; i += 1) {
    const s0 = (i / N) * path.length; const s1 = ((i + 1) / N) * path.length;
    if (isConnector(s0) || isConnector(s1)) continue;
    const a = { ...sampleAt(path, s0) }; const b = { ...sampleAt(path, s1) };
    
    a.lift = onRug(track.def, m(a.x), m(a.z)) ? 0.009 : 0.002;
    b.lift = onRug(track.def, m(b.x), m(b.z)) ? 0.009 : 0.002;
    for (const side of [-1, 1]) {
      const off = side * m(a.width) / 2; const offB = side * m(b.width) / 2;
      quad(pos, a, b, off - tw / 2, off + tw / 2, offB - tw / 2, offB + tw / 2);
    }
  }
  
  const a = sampleAt(path, track.startS - 0.03 * SIM_SCALE); const b = sampleAt(path, track.startS + 0.03 * SIM_SCALE);
  quad(posLine, a, b, -m(a.width) / 2, m(a.width) / 2, -m(b.width) / 2, m(b.width) / 2);
  scene.add(stripMesh(pos, tape), stripMesh(posLine, line));
}

const onRug = (def, x, z) => (def.rugs ?? []).some((r) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1);

function quad(out, a, b, a0, a1, b0, b1) {
  const y = (p) => m(p.y) + (p.lift ?? 0.002);
  const P = (p, off) => [m(p.x) + p.nx * off, y(p), m(p.z) + p.nz * off];
  const A0 = P(a, a0); const A1 = P(a, a1); const B0 = P(b, b0); const B1 = P(b, b1);
  out.push(...A0, ...B0, ...A1, ...A1, ...B0, ...B1);
}

function stripMesh(pos, mat) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  const mesh = new THREE.Mesh(g, mat);
  mat.side = THREE.DoubleSide;
  mesh.receiveShadow = true;
  return mesh;
}


export { supportY };

function buildConnector(scene, track, models) {
  const { path, spans, def } = track;
  const piece = models.get('track_piece');
  const trestle = models.get('trestle');
  const pieceLen = piece.box.max.x - piece.box.min.x;
  const deckTop = piece.box.max.y - METRICS.connector.lip;
  const trestleH = trestle.box.max.y - trestle.box.min.y;
  
  
  
  const beamHalf = (trestle.box.max.z - trestle.box.min.z) / 2;
  for (const span of spans) {
    for (const run of deckRuns(span)) {
      for (const pc of piecesAlong(run, pieceLen * SIM_SCALE)) {
        const a = sampleAt(path, pc.s - pc.length / 2); const b = sampleAt(path, pc.s + pc.length / 2);
        const c = sampleAt(path, pc.s);
        const o = clone(models, 'track_piece');
        o.position.set(m(c.x), m(c.y) - deckTop, m(c.z));
        o.rotation.order = 'YZX';
        o.rotation.y = yawOf(c.tx, c.tz);
        o.rotation.z = Math.atan2(m(b.y - a.y), m(pc.length));
        o.scale.x = pc.stretch;
        scene.add(o);
      }
      const deckY = (s) => sampleAt(path, s).y;
      const floorY = (s) => { const p = sampleAt(path, s); return supportY(def, m(p.x), m(p.z)) * SIM_SCALE; };
      for (const t of trestlesAlong(run, METRICS.connector.trestleEvery * SIM_SCALE, deckY, floorY,
        { minHeight: 0.04 * SIM_SCALE })) {
        const p = sampleAt(path, t.s);
        const o = clone(models, 'trestle');
        const d = 0.1 * SIM_SCALE;
        const slope = Math.abs(deckY(t.s + d) - deckY(t.s - d)) / (2 * d);
        const h = m(t.height) - (piece.box.max.y - piece.box.min.y) - beamHalf * slope;
        if (h <= 0.02) continue;
        o.position.set(m(p.x), m(floorY(t.s)) - trestle.box.min.y, m(p.z));
        o.rotation.y = yawOf(p.tx, p.tz) + Math.PI / 2;
        o.scale.y = h / trestleH;
        scene.add(o);
      }
    }
  }
}

function buildProps(scene, def, models) {
  for (const p of def.props) {
    const o = clone(models, p.model);
    const box = models.get(p.model).box;
    o.position.set(p.x, (p.y ?? 0) - box.min.y, p.z);
    o.rotation.y = p.rot ?? 0;
    if (p.lean) {
      
      o.rotation.order = 'YZX';
      o.rotation.z = Math.atan2(p.lean.toY - p.lean.fromY, p.lean.run);
      o.position.y = (p.lean.fromY + p.lean.toY) / 2 - box.max.y;
    }
    scene.add(o);
  }
}




function buildLoose(scene, race, models) {
  return race.loose.map((p) => {
    const box = models.get(p.model).box;
    const inner = clone(models, p.model);
    inner.position.set(-(box.min.x + box.max.x) / 2, -(box.min.y + box.max.y) / 2, -(box.min.z + box.max.z) / 2);
    const g = new THREE.Group();
    g.add(inner);
    g.rotation.order = 'YXZ';
    scene.add(g);
    return { g, half: (box.max.y - box.min.y) / 2 };
  });
}

function drawLoose(loose, race) {
  loose.forEach((o, i) => {
    const p = race.loose[i];
    const K = KINDS[p.kind];
    if (K.tips && p.down) {
      
      o.g.position.set(p.x, p.y + K.radius, p.z);
      o.g.rotation.set(p.roll, p.heading, Math.PI / 2);
    } else if (p.kind === 'marble') {
      o.g.position.set(p.x, p.y + o.half, p.z);
      o.g.rotation.set(p.roll, p.heading, 0);
    } else {
      
      o.g.position.set(p.x, p.y + o.half, p.z);
      o.g.rotation.set(0, p.heading + p.roll * 0.05, 0);
    }
  });
}

function buildStart(scene, track, models) {
  const s = sampleAt(track.path, track.startS);
  const o = clone(models, 'start_arch');
  o.position.set(m(s.x), 0, m(s.z));
  
  o.rotation.y = yawOf(s.tx, s.tz);
  scene.add(o);
}


function buildSparks(scene) {
  const pool = createSparks();
  const pos = new Float32Array(pool.n * 3);
  const geo = new THREE.BufferGeometry();
  const attr = new THREE.BufferAttribute(pos, 3);
  attr.setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', attr);
  const mat = new THREE.PointsMaterial({ color: 0xffb347, size: 0.012, sizeAttenuation: true, transparent: true,
    blending: THREE.AdditiveBlending, depthWrite: false });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  scene.add(pts);
  return {
    pool,
    draw(dt) {
      stepSparks(pool, dt);
      for (let j = 0; j < pool.n; j += 1) {
        const live = pool.age[j] < SPARKS.life;
        pos[j * 3] = pool.x[j]; pos[j * 3 + 1] = live ? pool.y[j] : -1000; pos[j * 3 + 2] = pool.z[j];
      }
      attr.needsUpdate = true;
    },
  };
}

function buildCars(scene, race, models) {
  
  
  return race.racers.map((r, i) => {
    const mine = r.id === (race.me ?? 'you');
    
    const body = r.body ?? (mine ? 'buggy' : BODIES[i % BODIES.length]);
    const o = clone(models, `car_${body}`);
    const colour = mine ? LIVERIES[0] : LIVERIES[1 + (i % (LIVERIES.length - 1))];
    o.traverse((n) => {
      if (!n.isMesh) return;
      const mats = Array.isArray(n.material) ? n.material : [n.material];
      const tinted = mats.map((mt) => {
        if (!/livery/i.test(mt.name) && !/livery/i.test(n.name)) return mt;
        const c = mt.clone();
        c.color = new THREE.Color(colour);
        return c;
      });
      n.material = Array.isArray(n.material) ? tinted : tinted[0];
    });
    scene.add(o);
    o.rotation.order = 'YXZ';
    return { id: r.id, obj: o, body, colour, susp: createSuspension(), att: createAttitude() };
  });
}
