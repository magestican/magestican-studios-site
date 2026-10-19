




import * as THREE from 'three';
import { followJo } from '../game/bolt.js';
import { BODY_H, BODY_W, RUN_SPEED } from '../sim/constants.js';
import { createCameraRig, updateCameraRig } from './cameraRig.js';

const CAM_DIST = 20;
const TILE_DEPTH = 2.4;


export function createView(canvas, level, labels) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.background = skyTexture();
  scene.fog = new THREE.Fog(0xbfe6ff, 30, 90);

  const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.5, 200);
  scene.add(new THREE.HemisphereLight(0xcfeaff, 0xffd9a8, 1.6));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
  sun.position.set(-8, 14, 12);
  scene.add(sun);

  scene.add(tileMeshes(level.world));
  scene.add(barkMeshes(level.world));
  const soil = soilMeshes(level.world);
  scene.add(soil.mesh);
  scene.add(farLayers(level.world));
  for (const cp of level.checkpoints) {
    const label = labels.find((l) => l.id === cp.id);
    scene.add(beacon(cp, label ? `${cp.id}. ${label.label}` : `${cp.id}`));
  }

  const jo = joPlaceholder();
  scene.add(jo.group);
  const bolt = boltPlaceholder();
  scene.add(bolt.group);
  const boltPos = { x: level.spawn.x - 1.4, y: level.spawn.y + 1.6 };
  
  const entityViews = new Map();

  const rig = createCameraRig(0, 0);
  let squash = 0; 
  let hintDy = 0; 
  let shake = 0; 
  const kick = (a) => {
    shake = Math.min(0.15, Math.max(shake, a));
  };
  
  const fx = [];
  const spark = (x, y, color, life, size) => {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(size), new THREE.MeshBasicMaterial({ color, transparent: true }));
    m.position.set(x, y, 0.5);
    scene.add(m);
    fx.push({ m, t: 0, life });
  };

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    const aspect = w / Math.max(1, h);
    const visibleH = Math.max(12.4, 14 / aspect); 
    camera.aspect = aspect;
    camera.fov = (2 * Math.atan(visibleH / 2 / CAM_DIST) * 180) / Math.PI;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  return {
    
    render(session, alpha, dt) {
      const p = session.player;
      const x = p.px + (p.x - p.px) * alpha;
      const y = p.py + (p.y - p.py) * alpha;
      
      if (!rig.placed || Math.hypot(rig.x - x, rig.focusY - y) > 20) {
        rig.x = x;
        rig.y = y;
        rig.focusY = y;
        rig.placed = true;
      }
      const hint = level.cameraHints?.find((h) => x >= h.x0 && x < h.x1);
      updateCameraRig(rig, { x, y, vx: p.vx, vy: p.vy, grounded: p.grounded, facing: p.facing, climbing: p.climbing }, dt, RUN_SPEED);
      const camX = hint?.lock ? hint.lock.x : rig.x;
      hintDy += ((hint?.lock ? hint.lock.y - rig.y : (hint?.dy ?? 0)) - hintDy) * (1 - Math.exp(-dt * 4));
      
      shake *= Math.exp(-dt * 18);
      const sx0 = Math.sin(session.time * 91) * shake;
      const sy0 = Math.cos(session.time * 73) * shake;
      camera.position.set(camX + sx0, rig.y + hintDy + 1.2 + sy0, CAM_DIST);
      camera.lookAt(camX + sx0, rig.y + hintDy + 0.6 + sy0, 0);

      squash *= Math.exp(-dt * 14);
      const sx = 1 + squash * 0.35;
      const sy = 1 - squash * 0.3;
      jo.group.position.set(x, y, 0.35);
      jo.body.scale.set(sx * p.facing, sy, 1);
      const blink = session.invuln > 0 && Math.floor(session.invuln * 16) % 2 === 0;
      jo.group.visible = (session.dead === 0 || Math.floor(session.dead * 20) % 2 === 0) && !blink;
      followJo(boltPos, { x, y }, p.facing, dt, session.time);
      bolt.group.position.set(boltPos.x, boltPos.y, 0.3);
      bolt.group.scale.x = p.facing;
      syncEntities(scene, entityViews, session.entities, alpha, session.time);
      for (let i = fx.length - 1; i >= 0; i--) {
        const f = fx[i];
        f.t += dt;
        const k = f.t / f.life;
        f.m.scale.setScalar(0.4 + k * 1.4);
        f.m.rotation.z += dt * 6;
        f.m.material.opacity = Math.max(0, 1 - k);
        if (k >= 1) {
          scene.remove(f.m);
          f.m.geometry.dispose();
          fx.splice(i, 1);
        }
      }
      renderer.render(scene, camera);
    },
    
    boltMood(mood) {
      bolt.face.material.color.set(mood === 'curious' ? 0xffd34d : mood === 'worried' ? 0xff8a2a : 0x2fe0d0);
    },
    
    onEvent(e) {
      if (e.type === 'jump') squash = -0.6;
      if (e.type === 'land') squash = Math.min(1, 0.25 + (e.fall ?? 0) * 0.12);
      if (e.type === 'mantle') squash = -0.3;
      if (e.type === 'doubleJump' || e.type === 'wallJump') squash = -0.5;
      if (e.type === 'stomp') squash = -0.45;
      if (e.type === 'poundStart') squash = 0.5;
      if (e.type === 'pound') squash = 1;
      if (e.type === 'dig') {
        soil.hide(e.cells);
        for (let i = 0; i < 4; i++) spark(e.x - 0.5 + i * 0.33, e.y + 0.2, 0x8a5a3a, 0.5, 0.12);
      }
      
      if (e.type === 'signal' && e.signals.some((s) => s.startsWith('visual:'))) spark(e.x, e.y + 0.4, 0xffd34d, 0.9, 0.12);
      if (e.type === 'defeat') spark(e.x, e.y + 0.6, 0xffffff, 0.5, 0.18);
      if (e.type === 'hurt') kick(0.12);
      if (e.type === 'bossHit') kick(0.15);
      if (e.type === 'pound' || e.type === 'clodLand') kick(0.08);
      if (e.type === 'land' && (e.fall ?? 0) > 4) kick(0.05);
      if (e.type === 'dewBounce') for (let i = 0; i < 5; i++) spark(e.x - 0.6 + i * 0.3, e.y + 0.3, 0x5ad1ff, 0.6, 0.1);
      if (e.type === 'lurch') for (let i = 0; i < 4; i++) spark(e.x - 1 + i * 0.6, e.y + 0.1, 0xc9a37a, 0.5, 0.1);
      if (e.type === 'dash')
        for (let i = 0; i < 3; i++) spark(jo.group.position.x - e.dir * (0.4 + i * 0.4), jo.group.position.y + 0.5, 0xffffff, 0.35, 0.16);
      if (e.type === 'strike') for (let i = 0; i < 6; i++) spark(e.x + Math.cos(i) * 0.8, e.y + 1 + Math.sin(i) * 0.8, 0xffd34d, 1.1, 0.2);
    },
  };
}


function entityView(e) {
  const g = new THREE.Group();
  const mat = (color) => new THREE.MeshLambertMaterial({ color });
  if (e.kind === 'pebble') {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), mat(0xb8b1a6));
    m.position.y = 0.15;
    g.add(m);
  } else if (e.kind === 'ladybot') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xff4d3d));
    body.position.y = 0.3;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), mat(0x23233a));
    head.position.set(0.3, 0.35, 0);
    g.add(body, head);
  } else if (e.kind === 'pillbug') {
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 20, 14), mat(e.specimen ? 0xffcf3a : 0x8d8fa8));
    ball.position.y = 0.3;
    ball.name = 'ball';
    g.add(ball);
  } else if (e.kind === 'intel') {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), new THREE.MeshBasicMaterial({ color: 0xffd34d }));
    m.position.y = 0.35;
    m.name = 'spin';
    g.add(m);
  } else if (e.kind === 'dew') {
    const m = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2),
      new THREE.MeshLambertMaterial({ color: 0x5ad1ff, transparent: true, opacity: 0.8 }),
    );
    m.scale.set(e.w ?? 1.5, 0.8, 0.6);
    m.name = 'lens';
    g.add(m);
  } else if (e.kind === 'seed') {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 8), mat(0xe8c27a));
    m.scale.set(0.8, 1.2, 0.8);
    m.position.y = 0.2;
    m.name = 'spin';
    g.add(m);
  } else if (e.kind === 'aphid') {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), mat(0x9be36a));
    m.position.y = 0.22;
    g.add(m);
  } else if (e.kind === 'antColumn') {
    
    const len = e.x1 - e.x0;
    const march = new THREE.Group();
    march.name = 'march';
    const antMat = mat(0x5a2e1a);
    for (let i = 0; i < Math.floor(len / 0.7); i++) {
      const a = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), antMat);
      a.scale.set(1.4, 0.8, 0.8);
      a.position.set(-len / 2 + 0.35 + i * 0.7, -0.25, 0.1);
      march.add(a);
    }
    g.add(march);
  } else if (e.kind === 'antPorter') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), mat(0x7a3b1f));
    body.scale.set(1.5, 0.9, 0.9);
    body.position.y = 0.3;
    const crumb = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 0.3), mat(0xf0d9a0));
    crumb.position.set(0, 0.75, 0);
    g.add(body, crumb);
  } else if (e.kind === 'ability') {
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshBasicMaterial({ color: 0x2fe0d0 }));
    m.position.y = 0.5;
    m.name = 'spin';
    g.add(m);
  } else if (e.kind === 'clod') {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(0.55), mat(0x7b4f2c));
    m.position.y = 0.5;
    g.add(m);
  } else if (e.kind === 'finish') {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 0.2), mat(0xffffff));
    post.position.y = 1.5;
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.7),
      new THREE.MeshBasicMaterial({ color: 0x2fe0d0, side: THREE.DoubleSide }),
    );
    flag.position.set(0.7, 2.6, 0);
    g.add(post, flag, textSprite('Clock out'));
  } else if (e.kind === 'boss') {
    
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat(0x6b4a2b));
    body.scale.set((e.w ?? 2.4) / 2, (e.h ?? 1.8) / 2, 0.9);
    body.position.y = (e.h ?? 1.8) / 2;
    const hat = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xffc93c));
    hat.position.set(0.3, (e.h ?? 1.8) * 0.95, 0);
    const halo = new THREE.Mesh(
      new THREE.RingGeometry((e.w ?? 2.4) * 0.6, (e.w ?? 2.4) * 0.75, 32),
      new THREE.MeshBasicMaterial({ color: 0xff2fa0, transparent: true, opacity: 0 }),
    );
    halo.position.set(0, (e.h ?? 1.8) / 2, 0.5);
    halo.name = 'halo';
    g.add(body, hat, halo, textSprite(e.name ?? 'Boss'));
  } else {
    
    const m = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.15, (e.w ?? 0.4) / 2), 12, 8), mat(0x9aa3c7));
    m.position.y = (e.h ?? 0.4) / 2;
    g.add(m);
  }
  return g;
}

function syncEntities(scene, views, entities, alpha, time) {
  for (const e of entities) {
    let v = views.get(e.id);
    if (!v) {
      v = entityView(e);
      views.set(e.id, v);
      scene.add(v);
    }
    v.visible = e.alive;
    if (!e.alive) continue;
    v.position.set(e.px + (e.x - e.px) * alpha, e.py + (e.y - e.py) * alpha, 0.2);
    v.scale.x = e.facing < 0 ? -1 : 1;
    const ball = v.getObjectByName('ball');
    if (ball) {
      ball.rotation.z = e.state === 'roll' ? -e.x / 0.3 : 0;
      ball.scale.set(e.state === 'uncurl' ? 1.25 : 1, e.state === 'uncurl' ? 0.75 : 1, 1);
    }
    const lens = v.getObjectByName('lens');
    if (lens) lens.scale.y = 0.8 * (1 - 0.45 * Math.sin(Math.max(0, e.wobble ?? 0) * 25) * Math.min(1, (e.wobble ?? 0) * 4));
    const march = v.getObjectByName('march');
    if (march) {
      const len = e.x1 - e.x0;
      const speed = e.lurch > 0 ? 14 * Math.sign(e.speed) : e.speed;
      v.userData.m = ((v.userData.m ?? 0) + speed / 60) % 0.7;
      for (const [i, a] of march.children.entries()) a.position.x = -len / 2 + 0.35 + ((i * 0.7 + v.userData.m + len) % len);
      v.scale.x = 1;
    }
    const spin = v.getObjectByName('spin');
    if (spin) spin.rotation.y = time * 2.5;
    const halo = v.getObjectByName('halo');
    if (halo) {
      const tele = e.stage === 'telegraph';
      halo.material.opacity = tele ? 0.55 + 0.4 * Math.sin(time * 18) : 0;
      halo.scale.setScalar(tele ? 1 + 0.15 * Math.sin(time * 9) : 1);
    }
    if (e.state === 'dazed' || (e.kind === 'boss' && e.stage === 'recover')) v.rotation.z = Math.sin(time * 30) * 0.12;
    else if (e.state === 'scurry') v.rotation.z = Math.PI;
    else v.rotation.z = 0;
  }
  for (const [id, v] of views) {
    if (!entities.some((e) => e.id === id)) {
      scene.remove(v);
      views.delete(id);
    }
  }
}

function skyTexture() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#5ec8ff');
  grad.addColorStop(0.6, '#bfe6ff');
  grad.addColorStop(1, '#ffe9c4');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}


function tileMeshes(world) {
  const T = world.tile;
  const group = new THREE.Group();
  const solidMat = new THREE.MeshLambertMaterial({ color: 0x9a7bd8 });
  const topMat = new THREE.MeshLambertMaterial({ color: 0x7ed957 });
  const oneWayMat = new THREE.MeshLambertMaterial({ color: 0xf2c879 });
  for (let r = 0; r < world.height; r++) {
    let c = 0;
    while (c < world.width) {
      const solid = world.solid(c, r) && !world.soil?.(c, r); 
      const oneWay = world.oneWay(c, r);
      if (!solid && !oneWay) {
        c++;
        continue;
      }
      let end = c + 1;
      while (end < world.width && world.solid(end, r) && !world.soil?.(end, r) === solid && world.oneWay(end, r) === oneWay) end++;
      const w = (end - c) * T;
      if (oneWay) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, T * 0.3, TILE_DEPTH * 0.8), oneWayMat);
        m.position.set(c * T + w / 2, (r + 1) * T - T * 0.15, -0.6);
        group.add(m);
      } else {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, T, TILE_DEPTH), solidMat);
        m.position.set(c * T + w / 2, r * T + T / 2, -TILE_DEPTH / 2 + 0.3);
        group.add(m);
        
        
        for (let k = c; k < end; ) {
          if (world.solid(k, r + 1)) {
            k++;
            continue;
          }
          let k2 = k + 1;
          while (k2 < end && !world.solid(k2, r + 1)) k2++;
          const cw = (k2 - k) * T;
          const cap = new THREE.Mesh(new THREE.BoxGeometry(cw, T * 0.3, TILE_DEPTH + 0.02), topMat);
          cap.position.set(k * T + cw / 2, (r + 1) * T - T * 0.15 + 0.005, -TILE_DEPTH / 2 + 0.3);
          group.add(cap);
          k = k2;
        }
      }
      c = end;
    }
  }
  return group;
}


function soilMeshes(world) {
  const T = world.tile;
  const cells = [];
  if (world.soil) for (let r = 0; r < world.height; r++) for (let c = 0; c < world.width; c++) if (world.soil(c, r)) cells.push([c, r]);
  const geo = new THREE.BoxGeometry(T, T, TILE_DEPTH);
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshLambertMaterial({ color: 0x9b6a45 }), Math.max(1, cells.length));
  mesh.count = cells.length;
  const index = new Map();
  const m = new THREE.Matrix4();
  cells.forEach(([c, r], i) => {
    m.makeTranslation(c * T + T / 2, r * T + T / 2, -TILE_DEPTH / 2 + 0.3);
    mesh.setMatrixAt(i, m);
    index.set(`${c},${r}`, i);
  });
  const gone = new THREE.Matrix4().makeScale(0, 0, 0);
  return {
    mesh,
    hide(list) {
      for (const [c, r] of list) {
        const i = index.get(`${c},${r}`);
        if (i !== undefined) mesh.setMatrixAt(i, gone);
      }
      mesh.instanceMatrix.needsUpdate = true;
    },
  };
}


function barkMeshes(world) {
  const T = world.tile;
  const group = new THREE.Group();
  if (!world.bark) return group;
  
  const mat = new THREE.MeshLambertMaterial({ color: 0x4a2a5c });
  const edge = new THREE.MeshBasicMaterial({ color: 0x2fe0d0 });
  for (let r = 0; r < world.height; r++) {
    let c = 0;
    while (c < world.width) {
      if (!world.bark(c, r)) {
        c++;
        continue;
      }
      let end = c + 1;
      while (end < world.width && world.bark(end, r)) end++;
      const w = (end - c) * T;
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, T, 0.3), mat);
      m.position.set(c * T + w / 2, r * T + T / 2, -0.25);
      group.add(m);
      for (const ex of [c * T + 0.03, end * T - 0.03]) {
        const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.06, T), edge);
        strip.position.set(ex, r * T + T / 2, -0.09);
        group.add(strip);
      }
      c = end;
    }
  }
  return group;
}


function farLayers(world) {
  const group = new THREE.Group();
  const span = world.width * world.tile;
  const layers = [
    { z: -14, color: 0x9fd8b6, h: 7, step: 9 },
    { z: -32, color: 0xb9d9ef, h: 14, step: 17 },
  ];
  for (const L of layers) {
    const mat = new THREE.MeshLambertMaterial({ color: L.color });
    for (let x = -20, i = 0; x < span + 40; x += L.step, i++) {
      const h = L.h * (0.6 + 0.4 * Math.abs(Math.sin(i * 1.7)));
      const m = new THREE.Mesh(new THREE.SphereGeometry(L.step * 0.75, 16, 12), mat);
      m.scale.set(1, h / (L.step * 0.75), 0.4);
      m.position.set(x, -1, L.z);
      group.add(m);
    }
  }
  return group;
}

function beacon(cp, text) {
  const g = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  post.position.y = 0.8;
  const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), new THREE.MeshBasicMaterial({ color: 0x2fe0d0 }));
  lamp.position.y = 1.7;
  g.add(post, lamp, textSprite(text));
  g.position.set(cp.x - 0.6, cp.y, -0.2);
  return g;
}

function textSprite(text) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const font = '600 44px system-ui, sans-serif';
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(text).width) + 48;
  c.width = w;
  c.height = 72;
  ctx.font = font;
  ctx.fillStyle = 'rgba(20, 24, 48, 0.72)';
  ctx.beginPath();
  ctx.roundRect(0, 0, w, 72, 20);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 24, 38);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false }));
  const scale = 0.011;
  s.scale.set(w * scale, 72 * scale, 1);
  s.position.set((w * scale) / 2 - 0.2, 2.4, 0);
  return s;
}


function boltPlaceholder() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 14), new THREE.MeshLambertMaterial({ color: 0xf2f6ff }));
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), new THREE.MeshBasicMaterial({ color: 0x2fe0d0 }));
  face.position.set(0.12, 0.04, 0.3);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6), new THREE.MeshLambertMaterial({ color: 0x9aa3c7 }));
  antenna.position.set(0, 0.42, 0);
  group.add(body, face, antenna);
  return { group, face };
}


function joPlaceholder() {
  const group = new THREE.Group();
  const body = new THREE.Group();
  const suit = new THREE.Mesh(new THREE.PlaneGeometry(BODY_W, BODY_H * 0.8), new THREE.MeshBasicMaterial({ color: 0x1fb5a8 }));
  suit.position.y = BODY_H * 0.4;
  const scarf = new THREE.Mesh(new THREE.PlaneGeometry(BODY_W * 1.1, BODY_H * 0.12), new THREE.MeshBasicMaterial({ color: 0xff8a2a }));
  scarf.position.set(0, BODY_H * 0.78, 0.01);
  const head = new THREE.Mesh(new THREE.CircleGeometry(BODY_W * 0.42, 24), new THREE.MeshBasicMaterial({ color: 0xffd7b0 }));
  head.position.set(0, BODY_H * 0.9, 0.005);
  const visor = new THREE.Mesh(new THREE.PlaneGeometry(BODY_W * 0.3, BODY_H * 0.08), new THREE.MeshBasicMaterial({ color: 0x14203c }));
  visor.position.set(BODY_W * 0.12, BODY_H * 0.92, 0.02);
  body.add(suit, scarf, head, visor);
  group.add(body);
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(BODY_W * 0.6, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.01, -0.2);
  group.add(shadow);
  return { group, body };
}
