




import * as THREE from 'three';
import { followJo } from '../game/bolt.js';
import { BODY_H, BODY_W, RUN_SPEED } from '../sim/constants.js';
import { bladeAt } from '../sim/fan.js';
import { heaveAt } from '../sim/heave.js';
import { sparkState } from '../sim/pins.js';
import { topSolid } from '../sim/shoe.js';
import { zoneOn } from '../sim/wind.js';
import { biomeArt, paintedBackdrop, skinMaterial, worldUV } from './biomeArt.js';
import { burrowEntityView, createBurrow } from './burrowView.js';
import { createCameraRig, rideLead, updateCameraRig } from './cameraRig.js';
import { attachCritterSprite, hasCritterSprite, updateCritterSprite } from './critterSprite.js';
import { createJoSprite } from './joSprite.js';
import { createKitchen, kitchenEntityView } from './kitchenView.js';
import { createNight, nightEntityView } from './nightView.js';
import { createRide, rideEntityView } from './rideView.js';
import { createSilk, silkEntityView } from './silkView.js';
import { createSky, skyEntityView } from './skyView.js';
import { sovereignEntityView } from './sovereignView.js';
import { createTrainView } from './trainView.js';

const CAM_DIST = 20;
const PORTRAIT_RIDE_PULL = 1.25;
const TILE_DEPTH = 2.4;


export function createView(canvas, level, labels) {
  
  if (level.mode === 'train') return createTrainView(canvas, level, labels);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const art = biomeArt(level); 
  scene.background = art ? new THREE.Color(art.sky) : skyTexture();
  scene.fog = new THREE.Fog(art ? art.sky : 0xbfe6ff, 30, 90);

  const camera = new THREE.PerspectiveCamera(35, 16 / 9, 0.5, 200);
  const backdrop = art ? paintedBackdrop(camera, art) : null;
  if (backdrop) scene.add(camera); 
  const hemi = new THREE.HemisphereLight(0xcfeaff, 0xffd9a8, 1.6);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.2);
  sun.position.set(-8, 14, 12);
  scene.add(sun);

  
  const kitchenSkin = !!level.colds?.length;
  scene.add(tileMeshes(level.world, level.darkTint === 'umber' ? 'bedrock' : kitchenSkin ? 'kitchen' : null, art));
  if (kitchenSkin) scene.background = new THREE.Color(0x6cc7bd);
  scene.add(barkMeshes(level.world));
  const soil = soilMeshes(level.world);
  scene.add(soil.mesh);
  const fur = heaveMeshes(level);
  scene.add(fur.group);
  const wind = windMeshes(level);
  scene.add(wind.group);
  const shoe = shoeMeshes();
  scene.add(shoe.group);
  scene.add(honeyMeshes(level));
  scene.add(waterMeshes(level));
  const arena = arenaMeshes(level);
  scene.add(arena.group);
  scene.add(slickMeshes(level));
  const machine = machineMeshes(level);
  scene.add(machine.group);
  
  const rope = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
    new THREE.LineBasicMaterial({ color: 0x2a2440 }),
  );
  rope.visible = false;
  scene.add(rope);
  const sea = seaMeshes();
  scene.add(sea.group);
  
  const teles = [];
  const tele = (m, life) => {
    scene.add(m);
    teles.push({ m, t: 0, life });
  };
  if (!art) scene.add(farLayers(level.world));
  
  for (const cp of level.checkpoints.filter((c) => c.phase === undefined)) {
    const label = labels.find((l) => l.id === cp.id);
    scene.add(beacon(cp, label ? `${cp.id}. ${label.label}` : `${cp.id}`));
  }

  const jo = joPlaceholder();
  scene.add(jo.group);
  const joSprite = createJoSprite(jo.body);
  
  let pendingEvents = [];
  const bolt = boltPlaceholder();
  scene.add(bolt.group);
  const boltPos = { x: level.spawn.x - 1.4, y: level.spawn.y + 1.6 };
  
  const entityViews = new Map();
  
  const night = createNight(scene, level, { hemi, sun, spark: (...a) => spark(...a), kick: (a) => kick(a), views: entityViews, bolt });
  
  const silk = createSilk(scene, level, { sun, spark: (...a) => spark(...a), views: entityViews, jo });
  
  const burrow = createBurrow(scene, level, {
    spark: (...a) => spark(...a),
    kick: (a) => kick(a),
    tele: (m, life) => tele(m, life),
    views: entityViews,
    jo,
    soil,
  });
  
  const kitchen = createKitchen(scene, level, { views: entityViews, spark: (...a) => spark(...a) });
  
  const ride = createRide(scene, level, { views: entityViews });
  
  const sky = createSky(scene, level, { jo, bolt, views: entityViews, spark: (...a) => spark(...a), kick: (a) => kick(a) });

  const rig = createCameraRig(0, 0);
  let squash = 0; 
  let hintDy = 0; 
  let aheadK = 1; 
  let frameK = 0;
  
  let lastFrame = null; 
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

  let viewHalfW = 11;
  let viewAspect = 16 / 9;
  
  
  const camDist = () => (level.camDist ?? CAM_DIST) * (level.ride && viewAspect < 1 ? PORTRAIT_RIDE_PULL : 1);
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    const aspect = w / Math.max(1, h);
    const visibleH = Math.max(12.4, 14 / aspect); 
    viewHalfW = (visibleH * aspect) / 2; 
    viewAspect = aspect;
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
      
      const hint = level.cameraHints?.find((h) => x >= h.x0 && x < h.x1 && (h.y0 === undefined || (y >= h.y0 && y < h.y1)));
      const wall = !!p.abilities?.has('wall') && p.ab?.wallDir !== 0; 
      updateCameraRig(
        rig,
        {
          x,
          y,
          vx: p.vx,
          vy: p.vy,
          grounded: p.grounded,
          facing: p.facing,
          climbing: p.climbing,
          wall,
          carryVx: p.carryVx ?? 0,
          descent: !!level.descent,
          webLaunch: !!p.webLaunch,
          drilling: p.drilling ?? null,
          rideLead: level.ride ? rideLead((viewHalfW * camDist()) / CAM_DIST) : null,
        },
        dt,
        RUN_SPEED,
      );
      
      aheadK += ((hint?.ahead === 0 ? 0 : 1) - aheadK) * (1 - Math.exp(-dt * 3));
      
      const fr = hint?.frame;
      frameK += ((fr ? 1 : 0) - frameK) * (1 - Math.exp(-dt * 2.5));
      if (fr) lastFrame = fr;
      const followX = hint?.lock ? hint.lock.x : x + rig.ahead * aheadK;
      const camX = lastFrame ? followX + ((lastFrame.x0 + lastFrame.x1) / 2 - followX) * frameK : followX;
      const frameDy = lastFrame ? ((lastFrame.y0 + lastFrame.y1) / 2 - rig.y) * frameK : 0;
      hintDy += ((hint?.lock ? hint.lock.y - rig.y : (hint?.dy ?? 0) + frameDy) - hintDy) * (1 - Math.exp(-dt * 4));
      
      shake *= Math.exp(-dt * 18);
      const sx0 = Math.sin(session.time * 91) * shake;
      const sy0 = Math.cos(session.time * 73) * shake;
      camera.position.set(camX + sx0, rig.y + hintDy + 1.2 + sy0, camDist() * (1 + 0.45 * frameK)); 
      camera.lookAt(camX + sx0, rig.y + hintDy + 0.6 + sy0, 0);

      squash *= Math.exp(-dt * 14);
      const sx = 1 + squash * 0.35;
      const sy = 1 - squash * 0.3;
      jo.group.position.set(x, y, 0.35);
      jo.body.scale.set(sx * p.facing, sy, 1);
      joSprite.update(dt, p, pendingEvents, { punt: session.punt > 0 });
      pendingEvents = [];
      const blink = session.invuln > 0 && Math.floor(session.invuln * 16) % 2 === 0;
      jo.group.visible = (session.dead === 0 || Math.floor(session.dead * 20) % 2 === 0) && !blink;
      followJo(boltPos, { x, y }, p.facing, dt, session.time);
      bolt.group.position.set(boltPos.x, boltPos.y, 0.3);
      bolt.group.scale.x = p.facing;
      fur.update(session.world);
      wind.update(session.time, dt);
      arena.update(session.world, dt);
      machine.update(session);
      
      const dark = session.lightsOut ? 0.25 : 1;
      hemi.intensity += ((night ? night.hemiBase : silk ? silk.hemiBase : 1.6) * dark - hemi.intensity) * Math.min(1, dt * 4);
      if (!night) sun.intensity += ((silk ? silk.sunBase : 2.2) * dark - sun.intensity) * Math.min(1, dt * 4);
      shoe.update(session, dt);
      sea.update(session);
      jo.shell.visible = !!session.shield;
      jo.leaf.visible = !!p.gliding;
      const tt = p.tether;
      const hook = tt ? session.hooks?.find((h) => h.id === tt.hook) : null;
      rope.visible = !!hook;
      if (hook) {
        const cx = x;
        const cy = y + 0.5;
        const dist = Math.hypot(hook.x - cx, hook.y - cy) || 1;
        const k = tt.phase === 'throw' ? Math.min(1, (tt.d ?? 0) / dist) : 1;
        const pos = rope.geometry.attributes.position;
        pos.setXYZ(0, cx, cy, 0.4);
        pos.setXYZ(1, cx + (hook.x - cx) * k, cy + (hook.y - cy) * k, 0.4);
        pos.needsUpdate = true;
      }
      
      jo.body.rotation.z = session.punt > 0 ? session.punt * 14 * (level.dir ?? 1) : 0;
      if (session.punt > 0) jo.group.position.y += Math.sin(Math.min(1, session.punt / 0.8) * Math.PI) * 2.5;
      syncEntities(scene, entityViews, session.entities, alpha, session.time);
      night?.update(session, dt, camera);
      silk?.update(session, dt, camera);
      burrow?.update(session, dt);
      kitchen?.update(session, dt);
      ride?.update(session);
      sky?.update(session, dt);
      for (let i = teles.length - 1; i >= 0; i--) {
        const T = teles[i];
        T.t += dt;
        T.m.material.opacity = 0.9 * (0.6 + 0.4 * Math.sin(session.time * 22)) * Math.max(0, 1 - T.t / T.life);
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
        f.m.material.opacity = Math.max(0, 1 - k);
        if (k >= 1) {
          scene.remove(f.m);
          f.m.geometry.dispose();
          fx.splice(i, 1);
        }
      }
      backdrop?.update();
      renderer.render(scene, camera);
    },
    
    boltMood(mood) {
      bolt.face.material.color.set(mood === 'curious' ? 0xffd34d : mood === 'worried' ? 0xff8a2a : 0x2fe0d0);
    },
    
    onEvent(e) {
      pendingEvents.push(e);
      night?.onEvent(e);
      silk?.onEvent(e);
      burrow?.onEvent(e);
      kitchen?.onEvent(e);
      sky?.onEvent(e);
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
      
      if (e.type === 'signal' && e.signals?.some((s) => s.startsWith('visual:'))) spark(e.x, e.y + 0.4, 0xffd34d, 0.9, 0.12);
      if (e.type === 'defeat') spark(e.x, e.y + 0.6, 0xffffff, 0.5, 0.18);
      if (e.type === 'hurt') kick(0.12);
      if (e.type === 'shoeLand') {
        shoe.land(e);
        if (e.lane !== 'back') kick(0.12);
      }
      if (e.type === 'bowl')
        for (let i = 0; i < 3 + e.n; i++) spark(e.x + Math.cos(i * 2) * 0.5, e.y + 0.5 + Math.sin(i * 2) * 0.5, 0xffd34d, 0.6, 0.12);
      if (e.type === 'punted') spark(e.x, e.y + 0.5, 0xffffff, 0.6, 0.2);
      
      if (e.type === 'swoopLine') {
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(e.x, e.y, 0.4), new THREE.Vector3(e.tx, e.ty, 0.4)]),
          new THREE.LineDashedMaterial({ color: 0xff2fa0, dashSize: 0.35, gapSize: 0.22, transparent: true }),
        );
        line.computeLineDistances();
        tele(line, 0.9);
      }
      if (e.type === 'diveRing') {
        const w = e.x1 - e.x0;
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.42, 0.5, 40),
          new THREE.MeshBasicMaterial({ color: 0xff2fa0, transparent: true, side: THREE.DoubleSide, depthWrite: false }),
        );
        ring.scale.set(w, w * 0.35, 1);
        ring.position.set(e.x, e.y + 0.1, 0.3);
        tele(ring, 1.2);
      }
      if (e.type === 'gloop' || e.type === 'honeyStuck')
        for (let i = 0; i < 3; i++) spark(e.x - 0.3 + i * 0.3, e.y + 0.1, 0xe8a317, 0.5, 0.1);
      if (e.type === 'glitterSplat')
        for (let i = 0; i < 6; i++) spark(e.x + Math.cos(i) * 0.6, e.y + 0.3 + Math.sin(i) * 0.3, 0xc9a7ff, 0.6, 0.1);
      if (e.type === 'guardStunned' || e.type === 'helmetBonk') kick(0.06);
      
      
      if (e.type === 'cursorLaser' && e.to) {
        const beam = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(e.to.x - 5, e.to.y + 9, 0.4),
            new THREE.Vector3(e.to.x, e.to.y, 0.4),
          ]),
          new THREE.LineBasicMaterial({ color: 0x7dff7d, transparent: true }),
        );
        tele(beam, 0.35);
        for (let i = 0; i < 4; i++) spark(e.to.x + Math.cos(i * 1.6) * 0.4, e.to.y + Math.sin(i * 1.6) * 0.4, 0x7dff7d, 0.5, 0.12);
      }
      if (e.type === 'tetherAttach') spark(jo.group.position.x, jo.group.position.y + 0.8, 0xffffff, 0.3, 0.1);
      if (e.type === 'shearLine') {
        const bar = new THREE.Mesh(
          new THREE.PlaneGeometry(e.x1 - e.x0, 0.14),
          new THREE.MeshBasicMaterial({ color: 0xff2fa0, transparent: true, depthWrite: false }),
        );
        bar.position.set((e.x0 + e.x1) / 2, e.y + 0.5, 0.4);
        tele(bar, e.seconds ?? 0.9);
      }
      if (e.type === 'strikeArc' || e.type === 'twigRing') {
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(0.55, 0.7, 32),
          new THREE.MeshBasicMaterial({ color: 0xff2fa0, transparent: true, side: THREE.DoubleSide, depthWrite: false }),
        );
        ring.scale.set(e.type === 'strikeArc' ? 2.4 : 1.4, 0.4, 1);
        ring.position.set(e.x, (e.type === 'strikeArc' ? e.y : (topSolid(level.world, e.x) ?? e.y)) + 0.08, 0.4);
        tele(ring, e.seconds ?? 0.9);
      }
      if (e.type === 'surgeHit' || e.type === 'pinZap')
        for (let i = 0; i < 4; i++) spark(e.x + Math.cos(i * 1.6) * 0.4, (e.y ?? 0) + 0.5, 0xfff6a0, 0.5, 0.12);
      if (e.type === 'plugYank' || e.type === 'lightsOut') kick(0.08);
      if (e.type === 'sourBite')
        for (let i = 0; i < 5; i++) spark(e.x + Math.cos(i * 1.3) * 0.8, e.y + 2.4 + Math.sin(i * 1.3) * 0.5, 0xffd34d, 0.8, 0.14);
      if (e.type === 'prune' || e.type === 'pruneCut') kick(0.1);
      if (e.type === 'dunk') for (let i = 0; i < 6; i++) spark(e.x - 0.6 + i * 0.24, e.y + 0.2, 0x7fd3ff, 0.6, 0.12);
      if (e.type === 'capsize') for (let i = 0; i < 4 + (e.n ?? 1); i++) spark(e.x - 1 + i * 0.4, e.y + 0.4, 0xdff6ff, 0.6, 0.12);
      if (e.type === 'ripple' && e.big) kick(0.06);
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


export function entityView(e) {
  const g = new THREE.Group();
  const mat = (color) => new THREE.MeshLambertMaterial({ color });
  
  if (
    nightEntityView(e, g) ||
    silkEntityView(e, g) ||
    burrowEntityView(e, g) ||
    kitchenEntityView(e, g) ||
    rideEntityView(e, g) ||
    sovereignEntityView(e, g) ||
    skyEntityView(e, g)
  ) {
    
  } else if (e.kind === 'pebble') {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), mat(0xb8b1a6));
    m.position.y = 0.15;
    g.add(m);
  } else if (e.kind === 'ladybot' && e.skin === 'silverfish') {
    
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.8, 4, 10), mat(0xc8d0dc));
    m.rotation.z = Math.PI / 2;
    m.position.y = 0.2;
    g.add(m);
  } else if (e.kind === 'ladybot') {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 20, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xff4d3d));
    body.position.y = 0.3;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 12), mat(0x23233a));
    head.position.set(0.3, 0.35, 0);
    g.add(body, head);
  } else if (e.kind === 'pillbug' && e.topiary) {
    
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), mat(0x3f8f4a));
    m.position.y = 0.4;
    m.name = 'ball';
    g.add(m);
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
    
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 12), mat(e.skin === 'workerBee' ? 0xf2c230 : 0x7a3b1f));
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
  } else if (e.kind === 'snailknight') {
    const shell = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.25, 12, 24), mat(e.specimen ? 0xf4f0ff : 0x7d9bd6));
    shell.position.y = 0.8;
    const foot = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 0.5), mat(0xc9e07a));
    foot.position.y = 0.15;
    g.add(shell, foot);
  } else if (e.kind === 'bandit') {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.6, 6, 12), mat(0x6fcf4a));
    body.position.y = 0.6;
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.7, 24),
      new THREE.MeshBasicMaterial({ color: 0xff2fa0, transparent: true, opacity: 0 }),
    );
    halo.position.set(0, 0.6, 0.4);
    halo.name = 'kickHalo';
    g.add(body, halo);
  } else if (e.kind === 'shellShield' || e.kind === 'shellShot') {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.14, 10, 18), mat(0x7d9bd6));
    m.position.y = 0.35;
    m.name = 'spin';
    g.add(m);
  } else if (e.kind === 'moth') {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.14, 0.6, 6, 10), mat(0xe9dcc0));
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.3;
    const wings = new THREE.Group();
    wings.name = 'flap';
    wings.position.y = 0.35;
    const wingMat = new THREE.MeshLambertMaterial({ color: 0xf6efd8, side: THREE.DoubleSide });
    for (const s of [1, -1]) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.5), wingMat);
      w.position.z = s * 0.3;
      w.rotation.x = Math.PI / 2;
      wings.add(w);
    }
    g.add(body, wings);
  } else if (e.kind === 'seedRide') {
    const seed = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), mat(0x8a6a3a));
    seed.position.y = 0.3;
    const wing = new THREE.Mesh(
      new THREE.PlaneGeometry(1.2, 0.25),
      new THREE.MeshLambertMaterial({ color: 0xd9c48a, side: THREE.DoubleSide }),
    );
    wing.position.y = 0.55;
    wing.name = 'spin';
    g.add(seed, wing);
  } else if (e.kind === 'wasp') {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.45, 6, 10), mat(e.specimen ? 0xf4f0ff : 0xf2c230));
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.35;
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 6, 14), mat(0x2a2016));
    band.rotation.y = Math.PI / 2;
    band.position.set(-0.08, 0.35, 0);
    const sting = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.25, 8), mat(0x2a2016));
    sting.rotation.z = Math.PI / 2;
    sting.position.set(-0.5, 0.35, 0);
    g.add(body, band, sting);
    
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3(1, 0, 0)]),
      new THREE.LineDashedMaterial({ color: 0xff2fa0, dashSize: 0.25, gapSize: 0.18 }),
    );
    line.name = 'aimLine';
    line.visible = false;
    g.add(line);
  } else if (e.kind === 'plug') {
    
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.5), mat(0x2a2a30));
    const tab = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.35, 0.1), mat(e.dud ? 0x6a6a70 : 0xf2c230));
    tab.position.set(0, -0.4, 0.2);
    g.add(body, tab);
  } else if (e.kind === 'readArm') {
    const m = new THREE.Mesh(new THREE.BoxGeometry(e.w ?? 6, e.h ?? 0.5, 0.6), mat(0x9aa3b0));
    m.position.set(((e.dir ?? 1) * (e.w ?? 6)) / 2, (e.h ?? 0.5) / 2, 0);
    g.add(m);
  } else if (e.kind === 'boss' && e.type === 'matriarch') {
    
    const r = (e.w ?? 2) / 2;
    const body = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 14), mat(0xb8b0a8));
    body.position.y = r;
    body.name = 'ball';
    const hat = new THREE.Mesh(new THREE.SphereGeometry(r * 0.55, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xf2c230));
    hat.position.y = r * 1.85;
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(r * 1.2, r * 1.4, 32),
      new THREE.MeshBasicMaterial({ color: 0xff2fa0, transparent: true, opacity: 0 }),
    );
    halo.position.set(0, r, 0.5);
    halo.name = 'halo';
    g.add(body, hat, halo, textSprite(e.name ?? 'Dustmite Matriarch'));
  } else if (e.kind === 'hook') {
    
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.05, 8, 20), mat(0xc9a45a));
    ring.name = 'aim';
    g.add(ring);
  } else if (e.kind === 'typeKey') {
    
    const cap = new THREE.Group();
    cap.name = 'keycap';
    const box = new THREE.Mesh(new THREE.BoxGeometry((e.w ?? 3) * 0.94, e.rise ?? 1, 1.4), mat(0xf2efe6));
    box.position.y = (e.rise ?? 1) / 2;
    const glow = new THREE.Mesh(new THREE.PlaneGeometry((e.w ?? 3) * 0.8, 0.12), new THREE.MeshBasicMaterial({ color: 0x7dff7d }));
    glow.position.set(0, (e.rise ?? 1) + 0.02, 0.71);
    const label = textSprite(e.letter ?? '');
    label.position.set(0, (e.rise ?? 1) * 0.55, 0.75);
    label.scale.multiplyScalar(0.7);
    cap.add(box, glow, label);
    g.add(cap);
  } else if (e.kind === 'dustmite') {
    
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), mat(0xb8b0a8));
    body.position.y = 0.35;
    const hat = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), mat(0xf2c230));
    hat.position.y = 0.62;
    g.add(body, hat);
  } else if (e.kind === 'fruitlet') {
    
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.25, 14, 10), mat(0xc8d84a));
    m.position.y = 0.25;
    m.name = 'ball';
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.15, 4), mat(0x5a3418));
    stalk.position.y = 0.55;
    g.add(m, stalk);
  } else if (e.kind === 'twig' || e.kind === 'twigDrop') {
    const m = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.14, 0.14), mat(0x7a5a3a));
    m.position.y = 0.1;
    m.rotation.z = 0.2;
    g.add(m);
  } else if (e.kind === 'mantisArm') {
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 3, 0.25), mat(0x7fbf3a));
    arm.position.y = 1.5;
    const claw = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.6, 6), mat(0x5f9f2a));
    claw.rotation.z = Math.PI;
    claw.position.y = -0.1;
    g.add(arm, claw);
  } else if (e.kind === 'boss' && e.type === 'mantis') {
    
    const h = e.h ?? 3.5;
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.45, h * 0.5, 6, 12), mat(0x7fbf3a));
    body.position.y = h * 0.45;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 12), mat(0x9fd84a));
    head.scale.set(1.2, 0.8, 0.9);
    head.position.set(0.3, h * 0.92, 0);
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.9, 0.12, 16), mat(0xe8c870));
    hat.position.set(0.3, h * 1.05, 0);
    const arms = new THREE.Group();
    arms.name = 'shears';
    arms.position.set(0.5, h * 0.7, 0.2);
    for (const s of [0.1, -0.1]) {
      const a = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.16, 0.16), mat(0x5f9f2a));
      a.position.set(0.7, s * 2, s);
      a.rotation.z = -0.5 + s * 3;
      arms.add(a);
    }
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(1.2, 1.45, 32),
      new THREE.MeshBasicMaterial({ color: 0xff2fa0, transparent: true, opacity: 0 }),
    );
    halo.position.set(0, h / 2, 0.5);
    halo.name = 'halo';
    g.add(body, head, hat, arms, halo, textSprite(e.name ?? 'The Gardener Mantis'));
  } else if (e.kind === 'strider') {
    
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.1, 0.6, 4, 8), mat(e.commodore ? 0xf4f0ff : 0x5a4a3a));
    body.rotation.z = Math.PI / 2;
    body.position.y = 0.35;
    g.add(body);
    for (const s of [-1, 1])
      for (const z of [-0.25, 0.25]) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 4), mat(0x3a2e24));
        leg.rotation.z = s * 1.0;
        leg.position.set(s * 0.35, 0.2, z);
        g.add(leg);
      }
    if (e.commodore) {
      const hat = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.2, 6), mat(0xff9fc4));
      hat.position.set(0.25, 0.55, 0);
      g.add(hat);
    }
  } else if (e.kind === 'skiff') {
    
    const big = e.galleon;
    const hull = new THREE.Mesh(
      new THREE.SphereGeometry(1, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2),
      mat(big ? 0x7a4f2a : 0xc9a46a),
    );
    hull.scale.set((e.w ?? 3) / 2, (e.h ?? 1) * 0.8, 0.8);
    hull.position.y = (e.h ?? 1) * 0.8;
    g.add(hull);
    if (!e.toy && !e.empty) {
      const crew = new THREE.Mesh(new THREE.SphereGeometry(big ? 0.4 : 0.22, 10, 8), mat(0x7a3b1f));
      crew.position.y = (e.h ?? 1) * 0.9 + 0.2;
      g.add(crew);
    }
    if (big) {
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6), mat(0x5a3418));
      mast.position.y = (e.h ?? 3) * 0.9 + 1;
      const sail = new THREE.Mesh(
        new THREE.PlaneGeometry(1.4, 1.6),
        new THREE.MeshLambertMaterial({ color: 0xf2ead8, side: THREE.DoubleSide }),
      );
      sail.position.set(0.3, (e.h ?? 3) * 0.9 + 1.2, 0);
      g.add(mast, sail);
    }
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 0.75, 24),
      new THREE.MeshBasicMaterial({ color: 0xff2fa0, transparent: true, opacity: 0 }),
    );
    halo.position.set(0, (e.h ?? 1) * 0.8, 0.5);
    halo.name = 'kickHalo';
    g.add(halo);
  } else if (e.kind === 'guard') {
    
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 0.5, 6, 12), mat(e.velvet ? 0xf4f0ff : 0xe0a020));
    body.position.y = 0.55;
    const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(0x5a4632));
    helmet.position.y = 0.95;
    const horn = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 8), mat(0xf6efd8));
    horn.rotation.z = -Math.PI / 2;
    horn.position.set(0.35, 1.05, 0);
    const cape = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.7),
      new THREE.MeshLambertMaterial({ color: e.velvet ? 0x7d4fd6 : 0x8c2f39, side: THREE.DoubleSide }),
    );
    cape.position.set(-0.3, 0.6, -0.1);
    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.6, 0.75, 24),
      new THREE.MeshBasicMaterial({ color: 0xff2fa0, transparent: true, opacity: 0 }),
    );
    halo.position.set(0, 0.6, 0.4);
    halo.name = 'kickHalo';
    g.add(body, helmet, horn, cape, halo);
  } else if (e.kind === 'glitterPuff') {
    const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.25), new THREE.MeshBasicMaterial({ color: 0xc9a7ff }));
    m.position.y = 0.25;
    m.name = 'spin';
    g.add(m);
  } else if (e.kind === 'cameo') {
    
  } else if (e.kind === 'boss' && (e.type === 'duchess' || e.type === 'sovereign')) {
    
    
    const body = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat(0x6a3fa0));
    body.scale.set((e.w ?? 2) / 2, (e.h ?? 1.6) / 2, 0.8);
    body.position.y = (e.h ?? 1.6) / 2;
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.3, 6, 1, true), mat(0xffd34d));
    crown.position.set(0.25, (e.h ?? 1.6) + 0.1, 0);
    const wings = new THREE.Group();
    wings.name = 'flap';
    wings.position.y = (e.h ?? 1.6) * 0.8;
    const wingMat = new THREE.MeshLambertMaterial({ color: 0xe8e0ff, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
    for (const s of [1, -1]) {
      const w = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), wingMat);
      w.position.z = s * 0.5;
      w.rotation.x = Math.PI / 2;
      wings.add(w);
    }
    const halo = new THREE.Mesh(
      new THREE.RingGeometry((e.w ?? 2) * 0.6, (e.w ?? 2) * 0.75, 32),
      new THREE.MeshBasicMaterial({ color: 0xff2fa0, transparent: true, opacity: 0 }),
    );
    halo.position.set(0, (e.h ?? 1.6) / 2, 0.5);
    halo.name = 'halo';
    g.add(body, crown, wings, halo, textSprite(e.name ?? 'Duchess Mandibella'));
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
  
  if (hasCritterSprite(e)) {
    for (const child of g.children) if (!/^(kickHalo|aimLine)$/.test(child.name)) child.userData.placeholder = true; 
    attachCritterSprite(g, e);
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
    const keycap = v.getObjectByName('keycap');
    if (keycap) keycap.position.y = e.key === 'down' ? -(e.rise ?? 1) * 0.8 : e.key === 'press' ? -(e.rise ?? 1) * 0.4 : 0;
    if (e.kind === 'dustmite') v.visible = e.alive && e.state !== 'hidden' && !e.hidden;
    const flap = v.getObjectByName('flap');
    if (flap) {
      v.visible = e.state !== 'away';
      flap.rotation.x = e.state === 'perch' ? 0.2 : Math.sin(time * 26) * 0.7;
    }
    const aim = v.getObjectByName('aimLine');
    if (aim) {
      aim.visible = e.stage === 'telegraph' && !!e.lock;
      if (aim.visible) {
        
        const pos = aim.geometry.attributes.position;
        pos.setXYZ(0, 0, 0.35, 0);
        pos.setXYZ(1, (e.lock.x - v.position.x) * v.scale.x, e.lock.y - v.position.y, 0);
        pos.needsUpdate = true;
        aim.computeLineDistances();
      }
    }
    const kh = v.getObjectByName('kickHalo');
    if (kh) kh.material.opacity = e.stage === 'windup' || e.state === 'windup' ? 0.85 : 0;
    const halo = v.getObjectByName('halo');
    if (halo) {
      const tele = e.stage === 'telegraph';
      halo.material.opacity = tele ? 0.55 + 0.4 * Math.sin(time * 18) : 0;
      halo.scale.setScalar(tele ? 1 + 0.15 * Math.sin(time * 9) : 1);
    }
    const sdt = Math.min(0.1, Math.max(0, time - (v.userData.lastT ?? time)));
    v.userData.lastT = time;
    if (v.userData.critter?.ready) {
      updateCritterSprite(v, e, sdt);
      v.rotation.z = 0; 
      continue;
    }
    if (e.state === 'dazed' || (e.kind === 'boss' && e.stage === 'recover')) v.rotation.z = Math.sin(time * 30) * 0.12;
    else if (e.state === 'scurry' || e.state === 'flipped')
      v.rotation.z = Math.PI + (e.state === 'flipped' ? Math.sin(time * 12) * 0.15 : 0);
    else if (e.state === 'capsizing') v.rotation.z = Math.min(Math.PI, (v.rotation.z || 0) + 0.12);
    else if (e.state === 'righting') v.rotation.z = Math.PI * 0.5 + Math.sin(time * 30) * 0.2;
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




function tileMeshes(world, skin = null, art = null) {
  const T = world.tile;
  const group = new THREE.Group();
  const rock = skin === 'bedrock';
  const kitchen = skin === 'kitchen';
  const solidMat = new THREE.MeshLambertMaterial({ color: rock ? 0x6c7078 : kitchen ? 0xb8875a : 0x9a7bd8 });
  const topMat = new THREE.MeshLambertMaterial({ color: rock ? 0x8fa6bf : kitchen ? 0xece4d6 : 0x7ed957 });
  const painted = art && !skin;
  if (painted) {
    skinMaterial(solidMat, art.solid);
    skinMaterial(topMat, art.top);
  }
  
  const uv = (m, spec) => {
    if (painted) worldUV(m.geometry, m.position, spec.unit * T);
    return m;
  };
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
        group.add(uv(m, art?.solid));
        
        
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
          group.add(uv(cap, art?.top));
          k = k2;
        }
      }
      c = end;
    }
  }
  return group;
}


function heaveMeshes(level) {
  const group = new THREE.Group();
  const cols = [];
  const T = level.world.tile;
  const furA = new THREE.MeshLambertMaterial({ color: 0xe8a04a });
  const furB = new THREE.MeshLambertMaterial({ color: 0x5a3418 }); 
  const keyCap = new THREE.MeshLambertMaterial({ color: 0xe6e2d8 });
  const keyGap = new THREE.MeshLambertMaterial({ color: 0x3a3a44 });
  for (const h of level.heaves ?? []) {
    let i = 0;
    for (let x = h.x0; x < h.x1 - 1e-6; x += T, i++) {
      const keyMat = h.group === 'type' ? (i % 6 === 5 ? keyGap : keyCap) : null; 
      const m = new THREE.Mesh(new THREE.BoxGeometry(T, 1, TILE_DEPTH), keyMat ?? (i % 7 < 2 ? furB : furA));
      group.add(m);
      cols.push({ h, x: x + T / 2, m, floor: h.base - (h.sink ?? 0) - 2 });
    }
  }
  return {
    group,
    update(world) {
      for (const c of cols) {
        const s = heaveAt(c.h, c.x, world.time ?? 0, world.sighStart ?? null);
        const top = s ? s.y : c.h.base;
        const hgt = Math.max(0.05, top - c.floor);
        c.m.scale.y = hgt;
        c.m.position.set(c.x, c.floor + hgt / 2, -TILE_DEPTH / 2 + 0.3);
      }
    },
  };
}


function windMeshes(level) {
  const group = new THREE.Group();
  const zones = [];
  const add = (z, up) => {
    const w = z.x1 - z.x0;
    const h = z.y1 - z.y0;
    const veil = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: up ? 0xfff4c8 : 0xd8f4ff, transparent: true, opacity: 0.12, depthWrite: false }),
    );
    veil.position.set(z.x0 + w / 2, z.y0 + h / 2, -0.2);
    group.add(veil);
    const n = Math.max(4, Math.round((w * h) / (up ? 6 : 10)));
    const bits = [];
    const bitMat = new THREE.MeshBasicMaterial({ color: up ? 0xfffbe6 : 0xffffff, transparent: true, opacity: 0.7, depthWrite: false });
    const geo = up ? new THREE.PlaneGeometry(0.08, 0.3) : new THREE.PlaneGeometry(1.1, 0.09);
    for (let i = 0; i < n; i++) {
      const m = new THREE.Mesh(geo, bitMat);
      
      const u = (0.5 + i * 0.7548777) % 1; 
      const v = (0.5 + i * 0.5698403) % 1;
      m.position.set(z.x0 + u * w, z.y0 + v * h, 0.1);
      group.add(m);
      bits.push({ m, u, v });
    }
    zones.push({ z, up, veil, bits, bitMat, k: 1, w, h });
  };
  for (const z of level.updrafts ?? []) add(z, true);
  for (const z of level.gusts ?? []) add(z, false);
  return {
    group,
    update(time, dt) {
      for (const Z of zones) {
        const on = zoneOn(Z.z, time) ? 1 : 0;
        Z.k += (on - Z.k) * Math.min(1, dt * 8);
        Z.veil.material.opacity = 0.12 * Z.k;
        Z.bitMat.opacity = 0.7 * Z.k;
        const speed = Z.up ? (Z.z.lift ?? 7) * 0.6 : (Z.z.vx ?? 0);
        for (const b of Z.bits) {
          if (Z.up) b.v = (((b.v + (speed * dt) / Z.h) % 1) + 1) % 1;
          else b.u = (((b.u + (speed * dt) / Z.w) % 1) + 1) % 1;
          b.m.position.x = Z.z.x0 + b.u * Z.w;
          b.m.position.y = Z.z.y0 + b.v * Z.h;
        }
      }
    },
  };
}



function shoeMeshes() {
  const group = new THREE.Group();
  const pool = [];
  const shadowMat = new THREE.MeshBasicMaterial({ color: 0x1a1030, transparent: true, opacity: 0.35, depthWrite: false });
  const rimMat = new THREE.MeshBasicMaterial({ color: 0xff2fa0, transparent: true, opacity: 0.8, depthWrite: false });
  const soleMat = new THREE.MeshLambertMaterial({ color: 0x3b4a8c });
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xfff1d6,
    transparent: true,
    opacity: 0.6,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const make = () => {
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.5), shadowMat);
    const rim = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.12), rimMat);
    const sole = new THREE.Mesh(new THREE.BoxGeometry(1, 3, 1.6), soleMat);
    group.add(shadow, rim, sole);
    return { shadow, rim, sole };
  };
  const stamps = []; 
  const rings = [];
  const span = (dir, toe, foot) => (dir < 0 ? [toe, toe + foot] : [toe - foot, toe]);
  return {
    group,
    land(e) {
      stamps.push({ e, t: 0 });
      if (e.lane === 'back') return;
      const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 32), ringMat.clone());
      group.add(m);
      rings.push({ m, x: e.toe, r: 0, radius: e.radius ?? 12, y: null, ring: e.ring });
    },
    update(session, dt) {
      const sh = session.shoe;
      let i = 0;
      const show = (f, k, groundY, depth) => {
        if (!pool[i]) pool[i] = make();
        const o = pool[i++];
        const [lo, hi] = span(sh?.dir ?? -1, f.toe, f.foot);
        const w = hi - lo;
        const cx = (lo + hi) / 2;
        const back = f.lane === 'back';
        o.shadow.visible = true;
        o.shadow.scale.set(w * (0.4 + 0.6 * k), 1 + k, 1);
        o.shadow.position.set(cx, groundY + 0.02, depth + 0.05);
        o.shadow.rotation.x = -Math.PI / 2;
        o.rim.visible = !back;
        o.rim.scale.set(w, 1, 1);
        o.rim.position.set(cx, groundY + 0.06, depth + 0.3);
        rimMat.opacity = 0.5 + 0.4 * Math.sin(session.time * 20);
        
        const drop = Math.max(0, Math.min(1, (k - 0.7) / 0.3));
        o.sole.visible = drop > 0;
        o.sole.scale.set(w, 1, 1);
        o.sole.position.set(cx, groundY + 1.5 + (1 - drop) * 14, depth);
      };
      for (const f of sh?.pending ?? []) {
        const k = 1 - Math.max(0, f.lands - session.time) / (f.tele || 1);
        const gy = f.lane === 'back' ? 2 : (topSolid(session.world, f.toe) ?? 2);
        show(f, k, gy, f.lane === 'back' ? -4 : 0);
      }
      for (let j = stamps.length - 1; j >= 0; j--) {
        const s = stamps[j];
        s.t += dt;
        if (s.t > 0.6) {
          stamps.splice(j, 1);
          continue;
        }
        const gy = s.e.lane === 'back' ? 2 : (topSolid(session.world, s.e.toe) ?? 2);
        show(s.e, 1, gy, s.e.lane === 'back' ? -4 : 0);
        const o = pool[i - 1];
        o.shadow.visible = false;
        o.rim.visible = false;
        o.sole.position.y += Math.max(0, s.t - 0.25) * 30; 
      }
      for (; i < pool.length; i++) {
        pool[i].shadow.visible = false;
        pool[i].rim.visible = false;
        pool[i].sole.visible = false;
      }
      const simRings = sh?.rings ?? [];
      for (let j = rings.length - 1; j >= 0; j--) {
        const R = rings[j];
        const live = simRings.find((r) => r.id === R.ring);
        if (live && R.y === null) R.y = live.impactY ?? 2;
        R.r = live ? live.r : R.r + 60 * dt;
        R.m.scale.set(Math.max(0.01, R.r), Math.max(0.01, R.r * 0.25), 1);
        R.m.position.set(R.x, (R.y ?? 2) + 0.1, 0.2);
        R.m.material.opacity = 0.6 * Math.max(0, 1 - R.r / R.radius);
        if (R.r >= R.radius) {
          group.remove(R.m);
          R.m.geometry.dispose();
          R.m.material.dispose();
          rings.splice(j, 1);
        }
      }
    },
  };
}


function honeyMeshes(level) {
  const group = new THREE.Group();
  const m = new THREE.MeshLambertMaterial({ color: 0xe8a317, transparent: true, opacity: 0.85, emissive: 0x4a2a00 });
  for (const h of level.honey ?? []) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(h.x1 - h.x0, 0.18, TILE_DEPTH * 0.9), m);
    slab.position.set((h.x0 + h.x1) / 2, h.y + 0.06, -TILE_DEPTH / 2 + 0.3);
    group.add(slab);
  }
  return group;
}


function waterMeshes(level) {
  const group = new THREE.Group();
  const m = new THREE.MeshLambertMaterial({ color: 0x4fa8d8, transparent: true, opacity: 0.55, depthWrite: false });
  const top = new THREE.MeshBasicMaterial({ color: 0xcfefff, transparent: true, opacity: 0.6, depthWrite: false });
  for (const w of level.water ?? []) {
    const depth = Math.max(1, w.y + 2);
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(w.x1 - w.x0, depth, TILE_DEPTH), m);
    sheet.position.set((w.x0 + w.x1) / 2, w.y - depth / 2, -TILE_DEPTH / 2 + 0.3);
    const line = new THREE.Mesh(new THREE.PlaneGeometry(w.x1 - w.x0, 0.06), top);
    line.position.set((w.x0 + w.x1) / 2, w.y, 0.35);
    group.add(sheet, line);
  }
  return group;
}


function seaMeshes() {
  const group = new THREE.Group();
  const rafts = new Map();
  const rings = new Map();
  const colour = { ferry: 0x5fae3a, leaf: 0x79c24a, pad: 0x3f8f4a, motor: 0xb98a4a, packet: 0x5ad1ff };
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.7,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  return {
    group,
    update(session) {
      const list = session.rafts?.list ?? [];
      const seen = new Set();
      for (const r of list) {
        if (session.level.ride && r.lane === session.level.ride) continue; 
        seen.add(r.id);
        let v = rafts.get(r.id);
        if (!v) {
          v = new THREE.Group();
          const deck = new THREE.Mesh(
            new THREE.BoxGeometry(1, 0.2, 1.2),
            new THREE.MeshLambertMaterial({ color: colour[r.packet ? 'packet' : r.mode] ?? 0x79c24a }),
          );
          deck.position.y = -0.1;
          v.add(deck);
          if (r.mode === 'motor') {
            const motor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.3), new THREE.MeshLambertMaterial({ color: 0x8a95a8 }));
            motor.name = 'motor';
            v.add(motor);
          }
          group.add(v);
          rafts.set(r.id, v);
        }
        v.visible = r.state !== 'gone';
        v.children[0].scale.x = r.w;
        v.position.set(r.x, r.y, 0.1);
        
        v.rotation.z = r.state === 'sinking' ? -0.15 : Math.sin(session.time * 2 + r.x) * 0.02;
        const motor = v.getObjectByName('motor');
        if (motor) motor.position.set(-r.w / 2 - 0.1, 0.1, 0);
      }
      for (const [id, v] of rafts) {
        if (!seen.has(id)) {
          group.remove(v);
          rafts.delete(id);
        }
      }
      const live = session.ripple?.rings ?? [];
      const ids = new Set();
      for (const g of live) {
        ids.add(g.id);
        let m = rings.get(g.id);
        if (!m) {
          m = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 40), ringMat.clone());
          group.add(m);
          rings.set(g.id, m);
        }
        m.scale.set(Math.max(0.05, g.r), Math.max(0.02, g.r * 0.18), 1);
        m.position.set(g.x, g.y + 0.04, 0.3);
        m.material.opacity = (g.big ? 0.85 : 0.6) * Math.max(0, 1 - g.r / (g.radius || 1));
      }
      for (const [id, m] of rings) {
        if (!ids.has(id)) {
          group.remove(m);
          m.geometry.dispose();
          m.material.dispose();
          rings.delete(id);
        }
      }
    },
  };
}


function slickMeshes(level) {
  const group = new THREE.Group();
  const m = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false });
  for (const [x0, x1, , y1] of level.slick ?? []) {
    const stripe = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, 0.08), m);
    stripe.position.set((x0 + x1) / 2, y1 - 0.12, 0.32);
    group.add(stripe);
  }
  return group;
}


function machineMeshes(level) {
  const group = new THREE.Group();
  const T = level.world.tile;
  const bladeMat = new THREE.MeshLambertMaterial({ color: 0x6a7280 });
  const fans = [];
  for (const d of level.fans ?? []) {
    const along = d.axis === 'y' ? [d.y0, d.y1] : [d.x0, d.x1];
    const cells = [];
    for (let a = along[0]; a < along[1] - 1e-6; a += T) {
      const geo = d.axis === 'y' ? new THREE.BoxGeometry(d.x1 - d.x0, T, 1.2) : new THREE.BoxGeometry(T, d.y1 - d.y0, 1.2);
      const m = new THREE.Mesh(geo, bladeMat);
      if (d.axis === 'y') m.position.set((d.x0 + d.x1) / 2, a + T / 2, -0.4);
      else m.position.set(a + T / 2, (d.y0 + d.y1) / 2, -0.4);
      group.add(m);
      cells.push({ m, a: a + T / 2 });
    }
    fans.push({ d, cells });
  }
  
  const pins = (level.sparks ?? []).map((sp) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(sp.x1 - sp.x0, Math.max(0.12, sp.y1 - sp.y0)),
      new THREE.MeshBasicMaterial({ color: 0xff2fa0, transparent: true, depthWrite: false }),
    );
    m.position.set((sp.x0 + sp.x1) / 2, (sp.y0 + sp.y1) / 2, 0.35);
    group.add(m);
    return { sp, m };
  });
  const traces = (level.circuits ?? []).map((c) => {
    const mat = new THREE.LineBasicMaterial({ color: 0xb8863a, transparent: true, opacity: 0.6 });
    for (const line of c.lines) {
      const pts = line.map(([x, y]) => new THREE.Vector3(x, y, -0.3));
      group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
    }
    return { c, mat };
  });
  return {
    group,
    update(session) {
      const t = session.time;
      for (const F of fans) {
        const live = session.fans?.list?.find((f) => f.def === F.d || f.def?.id === F.d.id);
        for (const cell of F.cells) cell.m.visible = live ? bladeAt(live, cell.a, t) : false;
      }
      for (const P of pins) {
        const st = sparkState(P.sp, t);
        P.m.material.opacity = st === 'live' ? 0.85 : st === 'warn' ? 0.35 + 0.35 * Math.sin(t * 30) : 0.12;
      }
      for (const Tr of traces) {
        const hot = (session.surges ?? []).some((sp) => sp.circuit === Tr.c.id && !sp.over);
        Tr.mat.color.setHex(hot ? 0xfff6a0 : 0xb8863a);
        Tr.mat.opacity = hot ? 1 : 0.6;
      }
    },
  };
}


function arenaMeshes(level) {
  const group = new THREE.Group();
  const bark = new THREE.MeshLambertMaterial({ color: 0x6a4a2e });
  const pieces = (level.arena ?? []).map((p) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(p.x1 - p.x0, p.y1 - p.y0, TILE_DEPTH), bark);
    m.position.set((p.x0 + p.x1) / 2, (p.y0 + p.y1) / 2, -TILE_DEPTH / 2 + 0.3);
    group.add(m);
    return { p, m, y: p.y0 };
  });
  return {
    group,
    update(world, dt) {
      const ph = world.arenaPhase ?? 0;
      for (const P of pieces) {
        const at = P.p.at?.[ph];
        P.m.visible = at !== undefined;
        if (at === undefined) continue;
        P.y += (at - P.y) * Math.min(1, dt * 6); 
        P.m.position.y = P.y + (P.p.y1 - P.p.y0) / 2;
      }
    },
  };
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
  
  const backs = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(T, T),
    new THREE.MeshLambertMaterial({ color: 0x3a2618 }),
    Math.max(1, cells.length),
  );
  backs.count = cells.length;
  const backAt = cells.map(([c, r]) => new THREE.Matrix4().makeTranslation(c * T + T / 2, r * T + T / 2, -TILE_DEPTH + 0.35));
  for (let i = 0; i < cells.length; i++) backs.setMatrixAt(i, gone);
  mesh.add(backs);
  
  const shown = cells.map(() => true);
  const set = (i, on) => {
    shown[i] = on;
    mesh.setMatrixAt(i, on ? m.makeTranslation(cells[i][0] * T + T / 2, cells[i][1] * T + T / 2, -TILE_DEPTH / 2 + 0.3) : gone);
    backs.setMatrixAt(i, on ? gone : backAt[i]);
  };
  const flush = () => {
    mesh.instanceMatrix.needsUpdate = true;
    backs.instanceMatrix.needsUpdate = true;
  };
  return {
    mesh,
    cells,
    hide(list) {
      for (const [c, r] of list) {
        const i = index.get(`${c},${r}`);
        if (i !== undefined) set(i, false);
      }
      flush();
    },
    
    sync(world) {
      let changed = false;
      for (let i = 0; i < cells.length; i++) {
        const on = world.soil(cells[i][0], cells[i][1]);
        if (on !== shown[i]) {
          set(i, on);
          changed = true;
        }
      }
      if (changed) flush();
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

export function textSprite(text) {
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


export function boltPlaceholder() {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.32, 20, 14), new THREE.MeshLambertMaterial({ color: 0xf2f6ff }));
  const face = new THREE.Mesh(new THREE.CircleGeometry(0.2, 20), new THREE.MeshBasicMaterial({ color: 0x2fe0d0 }));
  face.position.set(0.12, 0.04, 0.3);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.3, 6), new THREE.MeshLambertMaterial({ color: 0x9aa3c7 }));
  antenna.position.set(0, 0.42, 0);
  group.add(body, face, antenna);
  return { group, face };
}


export function joPlaceholder() {
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
  
  const shell = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.08, 8, 14), new THREE.MeshLambertMaterial({ color: 0x7d9bd6 }));
  shell.position.set(-BODY_W * 0.45, BODY_H * 0.55, -0.01);
  shell.visible = false;
  
  const leaf = new THREE.Mesh(
    new THREE.PlaneGeometry(BODY_W * 2.4, BODY_W * 0.9),
    new THREE.MeshLambertMaterial({ color: 0x5fae3a, side: THREE.DoubleSide }),
  );
  leaf.position.set(0, BODY_H * 1.35, 0);
  leaf.rotation.x = -Math.PI / 2.4;
  leaf.visible = false;
  for (const m of [suit, scarf, head, visor]) m.userData.placeholder = true; 
  body.add(suit, scarf, head, visor, shell, leaf);
  group.add(body);
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(BODY_W * 0.6, 24),
    new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.18 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, 0.01, -0.2);
  group.add(shadow);
  return { group, body, shell, leaf };
}
