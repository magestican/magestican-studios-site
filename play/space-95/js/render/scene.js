




import * as THREE from 'three';
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
  scene.add(farLayers(level.world));
  for (const cp of level.checkpoints) {
    const label = labels.find((l) => l.id === cp.id);
    scene.add(beacon(cp, label ? `${cp.id}. ${label.label}` : `${cp.id}`));
  }

  const jo = joPlaceholder();
  scene.add(jo.group);
  
  const entityViews = new Map();

  const rig = createCameraRig(0, 0);
  let squash = 0; 
  
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
      updateCameraRig(rig, { x, y, vx: p.vx, vy: p.vy, grounded: p.grounded, facing: p.facing }, dt, RUN_SPEED);
      camera.position.set(rig.x, rig.y + 1.2, CAM_DIST);
      camera.lookAt(rig.x, rig.y + 0.6, 0);

      squash *= Math.exp(-dt * 14);
      const sx = 1 + squash * 0.35;
      const sy = 1 - squash * 0.3;
      jo.group.position.set(x, y, 0.35);
      jo.body.scale.set(sx * p.facing, sy, 1);
      const blink = session.invuln > 0 && Math.floor(session.invuln * 16) % 2 === 0;
      jo.group.visible = (session.dead === 0 || Math.floor(session.dead * 20) % 2 === 0) && !blink;
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
    
    onEvent(e) {
      if (e.type === 'jump') squash = -0.6;
      if (e.type === 'land') squash = Math.min(1, 0.25 + (e.fall ?? 0) * 0.12);
      if (e.type === 'mantle') squash = -0.3;
      if (e.type === 'doubleJump' || e.type === 'wallJump') squash = -0.5;
      if (e.type === 'stomp') squash = -0.45;
      if (e.type === 'poundStart') squash = 0.5;
      if (e.type === 'pound') squash = 1;
      
      if (e.type === 'signal' && e.signals.some((s) => s.startsWith('visual:'))) spark(e.x, e.y + 0.4, 0xffd34d, 0.9, 0.12);
      if (e.type === 'defeat') spark(e.x, e.y + 0.6, 0xffffff, 0.5, 0.18);
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
  } else if (e.kind === 'finish') {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.2, 3, 0.2), mat(0xffffff));
    post.position.y = 1.5;
    const flag = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.7),
      new THREE.MeshBasicMaterial({ color: 0x2fe0d0, side: THREE.DoubleSide }),
    );
    flag.position.set(0.7, 2.6, 0);
    g.add(post, flag, textSprite('Clock out'));
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
    const spin = v.getObjectByName('spin');
    if (spin) spin.rotation.y = time * 2.5;
    if (e.state === 'dazed') v.rotation.z = Math.sin(time * 30) * 0.2;
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
      const solid = world.solid(c, r);
      const oneWay = world.oneWay(c, r);
      if (!solid && !oneWay) {
        c++;
        continue;
      }
      let end = c + 1;
      while (end < world.width && world.solid(end, r) === solid && world.oneWay(end, r) === oneWay) end++;
      const w = (end - c) * T;
      if (oneWay) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, T * 0.3, TILE_DEPTH * 0.8), oneWayMat);
        m.position.set(c * T + w / 2, (r + 1) * T - T * 0.15, -0.6);
        group.add(m);
      } else {
        const exposed = !world.solid(c, r + 1);
        const m = new THREE.Mesh(new THREE.BoxGeometry(w, T, TILE_DEPTH), exposed && runExposed(world, c, end, r) ? topMat : solidMat);
        m.position.set(c * T + w / 2, r * T + T / 2, -TILE_DEPTH / 2 + 0.3);
        group.add(m);
      }
      c = end;
    }
  }
  return group;
}

function runExposed(world, c0, c1, r) {
  for (let c = c0; c < c1; c++) if (world.solid(c, r + 1)) return false;
  return true;
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
