










import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { sampleAt } from '../../../web-engine/kart/trackPath.js';
import { deckRuns, piecesAlong, trestlesAlong } from '../../../web-engine/rc/connector.js';
import { SIM_SCALE, METRICS } from '../../../web-engine/rc/rcTuning.js';

const m = (units) => units / SIM_SCALE;

export const BODIES = Object.freeze(['buggy', 'monster', 'openwheel', 'rally', 'pickup', 'street']);

export const LIVERIES = Object.freeze([
  0xff3b30, 0x2f7bff, 0x30c95a, 0xffc61a, 0xa64dff, 0xff7ac8,
  0x00c2c7, 0xff8a1f, 0x8fd14f, 0x5a5cff, 0xe0e0e0, 0x7a4b2a,
]);

const ASSET_DIRS = {
  car: 'cars', connector: 'connector', house: 'house',
};


export function modelsFor(def) {
  const names = new Set(def.props.map((p) => p.model));
  const out = [...names].map((n) => [ASSET_DIRS.house, n]);
  out.push([ASSET_DIRS.connector, 'track_piece'], [ASSET_DIRS.connector, 'trestle'], [ASSET_DIRS.connector, 'start_arch']);
  for (const b of BODIES) out.push([ASSET_DIRS.car, `car_${b}`]);
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

export function createView(canvas, race, models, { pixelRatio = Math.min(window.devicePixelRatio || 1, 2) } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3e6cf);
  
  
  scene.fog = new THREE.Fog(0xf3e6cf, 12, 40);

  const camera = new THREE.PerspectiveCamera(METRICS.fov.base, 1, 0.01, 90);

  scene.add(new THREE.HemisphereLight(0xfff6e8, 0xb59a7a, 1.4));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const sc = sun.shadow.camera;
  sc.left = -3; sc.right = 3; sc.top = 3; sc.bottom = -3; sc.near = 0.1; sc.far = 12;
  sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);

  buildRoom(scene);
  buildLanes(scene, race.track);
  buildConnector(scene, race.track, models);
  buildProps(scene, race.track.def, models);
  buildStart(scene, race.track, models);
  const cars = buildCars(scene, race, models);

  const cam = { pos: new THREE.Vector3(), look: new THREE.Vector3(), ready: false, fov: METRICS.fov.base };

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
      c.obj.visible = !(k.respawning && Math.floor(race.clock * 10) % 2 === 0);
    }
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
    camera.position.copy(cam.pos);
    camera.lookAt(cam.look);
    
    const t = Math.min(1, speed / METRICS.topSpeed);
    const base = METRICS.fov.base + (METRICS.fov.fast - METRICS.fov.base) * t;
    const portrait = camera.aspect < 1 ? Math.min(20, (1 - camera.aspect) * 40) : 0;
    const want = base + portrait;
    cam.fov += (want - cam.fov) * Math.min(1, dt * 4);
    if (Math.abs(camera.fov - cam.fov) > 0.01) { camera.fov = cam.fov; camera.updateProjectionMatrix(); }
    sun.position.set(p.x + 2.5, p.y + 6, p.z + 1.5);
    sun.target.position.copy(p);
    renderer.render(scene, camera);
  }

  return { renderer, scene, camera, resize, draw, cars };
}

function buildRoom(scene) {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 80),
    new THREE.MeshLambertMaterial({ color: 0xe2d2b6 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(13, 0, -10);
  floor.receiveShadow = true;
  scene.add(floor);
  
  const grout = new THREE.GridHelper(80, 80 / 0.3, 0xc9b799, 0xc9b799);
  grout.position.set(13, 0.0008, -10);
  grout.material.transparent = true;
  grout.material.opacity = 0.55;
  scene.add(grout);
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xf7efe0 });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(60, 3), wallMat);
  back.position.set(13, 1.5, -22.45);
  back.receiveShadow = true;
  const side = new THREE.Mesh(new THREE.PlaneGeometry(40, 3), wallMat);
  side.rotation.y = -Math.PI / 2;
  side.position.set(26.45, 1.5, -10);
  side.receiveShadow = true;
  
  
  const left = new THREE.Mesh(new THREE.PlaneGeometry(40, 3), wallMat);
  left.rotation.y = Math.PI / 2;
  left.position.set(-2.4, 1.5, -10);
  left.receiveShadow = true;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(60, 3), wallMat);
  front.rotation.y = Math.PI;
  front.position.set(13, 1.5, 6.5);
  front.receiveShadow = true;
  
  const skirt = new THREE.MeshLambertMaterial({ color: 0xc9b08a });
  for (const [w, x, z, ry] of [[60, 13, -22.44, 0], [40, 26.44, -10, -Math.PI / 2], [40, -2.39, -10, Math.PI / 2],
    [60, 13, 6.49, Math.PI]]) {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.08), skirt);
    s.rotation.y = ry;
    s.position.set(x, 0.04, z);
    scene.add(s);
  }
  scene.add(back, side, left, front);
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
    const a = sampleAt(path, s0); const b = sampleAt(path, s1);
    for (const side of [-1, 1]) {
      const off = side * m(a.width) / 2; const offB = side * m(b.width) / 2;
      quad(pos, a, b, off - tw / 2, off + tw / 2, offB - tw / 2, offB + tw / 2);
    }
  }
  
  const a = sampleAt(path, track.startS - 0.03 * SIM_SCALE); const b = sampleAt(path, track.startS + 0.03 * SIM_SCALE);
  quad(posLine, a, b, -m(a.width) / 2, m(a.width) / 2, -m(b.width) / 2, m(b.width) / 2);
  scene.add(stripMesh(pos, tape), stripMesh(posLine, line));
}

function quad(out, a, b, a0, a1, b0, b1) {
  const y = (p) => m(p.y) + 0.002;
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


function supportY(def, x, z) {
  for (const p of def.props) {
    if (p.support != null && Math.hypot(p.x - x, p.z - z) < 0.3) return p.support;
  }
  const onLeg1 = x > 12.5 && x < 25.2 && z > -22.42 && z < -21.18;
  const onLeg2 = x > 25.18 && x < 26.42 && z > -22.42 && z < -4.6;
  if (onLeg1 || onLeg2) return 0.905;
  return 0;
}

function buildConnector(scene, track, models) {
  const { path, spans, def } = track;
  const piece = models.get('track_piece');
  const trestle = models.get('trestle');
  const pieceLen = piece.box.max.x - piece.box.min.x;
  const deckTop = piece.box.max.y - METRICS.connector.lip;
  const trestleH = trestle.box.max.y - trestle.box.min.y;
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
        const h = m(t.height) - (piece.box.max.y - piece.box.min.y);
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

function buildStart(scene, track, models) {
  const s = sampleAt(track.path, track.startS);
  const o = clone(models, 'start_arch');
  o.position.set(m(s.x), 0, m(s.z));
  
  o.rotation.y = yawOf(s.tx, s.tz);
  scene.add(o);
}

function buildCars(scene, race, models) {
  return race.racers.map((r, i) => {
    const body = r.isPlayer ? 'buggy' : BODIES[i % BODIES.length];
    const o = clone(models, `car_${body}`);
    const colour = r.isPlayer ? LIVERIES[0] : LIVERIES[1 + (i % (LIVERIES.length - 1))];
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
    return { id: r.id, obj: o, body, colour };
  });
}
