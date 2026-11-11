


import { pixelRatioFor } from '../pose/device.js';
import { THREE } from '../vendor/three-vendor.js';
import { loadArt } from './art.js';
import { ART_ROOT } from './artManifest.js';
import { blastAt, blastSpec, partAt } from './blast.js';
import { dressProps } from './dress.js';
import {
  BOSS_DOWN,
  BOSS_SPRITE,
  bossAnchor,
  bossPose,
  cellUV,
  GANTRY,
  gantryPlaneY,
  RIDER_LIFT,
  SPRITE_FILL,
  SPRITES,
  spriteHang,
  spriteLift,
  spritePose,
  tipsOver,
} from './enemySprites.js';
import { LOOK_DROP, vfovFor } from './fov.js';
import { buildProps } from './props.js';
import { SET_PIECES, setPieceLift, setPiecePos, setPiecesAt, setPiecesOf } from './setPieces.js';
import { groundBeside } from './terrain.js';
import { createTracers } from './tracers.js';


const KIND_LOOK = {
  compy: { color: 0x9fbf4a, h: 0.6 },
  raptor: { color: 0xd9822b, h: 1.4 },
  dilo: { color: 0x8a5fb8, h: 1.8 },
  merc: { color: 0x3d4a3a, h: 1.8 },
  pteranodon: { color: 0xb08a6a, h: 0.9, shape: 'box', w: 3 },
  spino: { color: 0x4f6f5a, h: 3.4 },
  gunboat: { color: 0x59626b, h: 2, shape: 'box', w: 6 },
  ankylo: { color: 0x8a7a55, h: 1.6, shape: 'box', w: 3 },
  trike: { color: 0x6f8a9a, h: 2, shape: 'box', w: 2.4 },
  rex: { color: 0x6b5a3a, h: 4.5 },
  heli: { color: 0x2e3a2e, h: 2.4, shape: 'box', w: 7 },
  barrel: { color: 0xc0392b, h: 1.4, shape: 'cyl' },
  hostage: { color: 0x3a7bd5, h: 1.75 },
  rock: { color: 0x5a4a40, h: 1.6, shape: 'sphere' },
  shell: { color: 0xffb14a, h: 0.8, shape: 'sphere' },
  rocket: { color: 0xff6a3a, h: 0.7, shape: 'sphere' },
  plate: { color: 0xa8b2bd, h: 0.9, shape: 'box', w: 1.1 },
  jaw: { color: 0x9aa4ae, h: 1.4, shape: 'box', w: 2.4 },
  varga: { color: 0x2b1d1a, h: 1.85 },
};






export function createScene(canvas, stage, plan) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' });
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(vfovFor(1), 1, 0.1, 600);
  scene.add(camera);
  const hemi = new THREE.HemisphereLight(0xdfe9c8, 0x2a3320, 1.6);
  const sun = new THREE.DirectionalLight(0xfff1d0, 1.4);
  sun.position.set(30, 60, 20);
  scene.add(hemi, sun);
  const props = buildProps(scene, stage);
  const sky = new THREE.Color(props.theme.sky);
  scene.background = sky;
  scene.fog = new THREE.Fog(sky, props.theme.fog[0], props.theme.fog[1]);
  
  
  let dress = null;
  const art = loadArt(stage.theme)
    .then((a) => {
      dress = dressProps(scene, stage, props, a);
      return a;
    })
    .catch(() => null);

  
  
  const sheets = {};
  const texLoader = new THREE.TextureLoader();
  for (const [kind, s] of Object.entries(SPRITES)) {
    texLoader
      .loadAsync(`${ART_ROOT}sprites/${s.sheet}/sheet.png`)
      .then((tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.magFilter = THREE.NearestFilter;
        sheets[kind] = { tex, names: s.frames };
      })
      .catch(() => {});
  }

  
  const meshes = new Map();
  const ringGeo = new THREE.TorusGeometry(1, 0.08, 6, 32);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff2a1a, fog: false, depthTest: false, transparent: true });
  
  const fx = [];
  const sparkGeo = new THREE.SphereGeometry(1, 8, 6);
  
  const blasts = [];
  const tracers = createTracers(scene);
  const stats = { tracers: 0, impacts: 0 };
  const ironJaw = bossBody();
  scene.add(ironJaw.group, ironJaw.gantry, ironJaw.billboard);
  const sheetOf = (s) => texLoader.loadAsync(`${ART_ROOT}sprites/${s.sheet}/sheet.png`);
  Promise.all([sheetOf(BOSS_SPRITE), sheetOf(BOSS_DOWN)])
    .then(([tex, down]) => ironJaw.setSheet(tex, down))
    .catch(() => {});
  sheetOf(SPRITES.varga)
    .then((tex) => ironJaw.setRider(tex))
    .catch(() => {});
  sheetOf(GANTRY)
    .then((tex) => ironJaw.setGantry(tex))
    .catch(() => {});

  
  
  
  const pieceMeshes = new Map();
  
  const pieceTex = {};
  
  const pieces = { stage: null, list: [] };
  function dropPiece(id) {
    const m = pieceMeshes.get(id);
    if (!m) return;
    scene.remove(m);
    m.geometry.dispose();
     (m.material).dispose();
    pieceMeshes.delete(id);
  }
  
  function drawSetPieces(game, cam) {
    if (pieces.stage !== game.stage) {
      for (const id of [...pieceMeshes.keys()]) dropPiece(id);
      pieces.stage = game.stage;
      pieces.list = setPiecesOf(game.stage.events);
    }
    if (!pieces.list.length) return;
    const d = game.run.dist;
    const want = setPiecesAt(pieces.list, d);
    for (const id of [...pieceMeshes.keys()]) if (!want.some((p) => p.id === id)) dropPiece(id);
    for (const kind of new Set(pieces.list.map((p) => p.kind))) {
      const ahead = pieces.list.some((p) => p.kind === kind && d < p.until);
      if (ahead && pieceTex[kind] === undefined) {
        pieceTex[kind] = null;
        sheetOf(SET_PIECES[kind])
          .then((tex) => {
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.magFilter = THREE.NearestFilter;
            pieceTex[kind] = tex;
          })
          .catch(() => {});
      } else if (!ahead && pieceTex[kind]) {
        pieceTex[kind]?.dispose();
        delete pieceTex[kind];
      }
    }
    for (const p of want) {
      const s = SET_PIECES[p.kind];
      const tex = pieceTex[p.kind];
      if (!tex) continue;
      let m = pieceMeshes.get(p.id);
      if (!m) {
        
        const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.5 });
        m = new THREE.Mesh(new THREE.PlaneGeometry(s.side, s.side), mat);
        const at = setPiecePos(game.stage, p);
        m.position.set(at.x, at.y + setPieceLift(s), at.z);
        pieceMeshes.set(p.id, m);
        scene.add(m);
      }
      m.lookAt(cam.x, m.position.y, cam.z);
    }
  }

  function dropMesh(m) {
    scene.remove(m.body, m.ring);
    m.body.geometry.dispose();
    m.body.material.dispose();
    m.sheet?.tex.dispose();
  }

  function enemyMesh(e) {
    const look = KIND_LOOK[e.kind] ?? KIND_LOOK.raptor;
    const sheet = sheets[e.kind];
    if (sheet) {
      const side = SPRITES[e.kind].side;
      const tex = sheet.tex.clone();
      tex.repeat.set(1 / sheet.names.length, 1);
      const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
      const body = new THREE.Mesh(new THREE.PlaneGeometry(side, side), mat);
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.renderOrder = 10;
      ring.visible = false;
      scene.add(body, ring);
      return { body, ring, hp: e.hp, hurtT: 0, sheet: { tex, names: sheet.names } };
    }
    const shape = look.shape ?? 'capsule';
    const geo =
      shape === 'cyl'
        ? new THREE.CylinderGeometry(e.r, e.r, look.h, 10)
        : shape === 'sphere'
          ? new THREE.SphereGeometry(e.r, 10, 8)
          : shape === 'box'
            ? new THREE.BoxGeometry(look.w ?? 1, look.h, look.w ?? 1)
            : new THREE.CapsuleGeometry(e.r, Math.max(0.1, look.h - 2 * e.r), 4, 8);
    const body = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: look.color }));
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.renderOrder = 10;
    ring.visible = false;
    scene.add(body, ring);
    return { body, ring, hp: e.hp, hurtT: 0 };
  }

  function burst(pos, color, size, life, grow) {
    const mesh = new THREE.Mesh(sparkGeo, new THREE.MeshBasicMaterial({ color, transparent: true, fog: false }));
    mesh.position.set(pos.x, pos.y, pos.z);
    mesh.scale.setScalar(size);
    scene.add(mesh);
    fx.push({ mesh, t: 0, life, grow });
  }

  




  function blast(where, parts) {
    for (const part of parts) {
      const mesh = new THREE.Mesh(
        sparkGeo,
        new THREE.MeshBasicMaterial({
          color: part.color,
          transparent: true,
          opacity: 0,
          fog: false,
          depthWrite: false,
          side: THREE.DoubleSide,
        }),
      );
      const at = where(part.side, part.up);
      mesh.position.set(at.x, at.y, at.z);
      mesh.visible = false;
      scene.add(mesh);
      blasts.push({ mesh, part, t: 0, y: at.y });
    }
  }

  
  function shotFx(ev, game, muzzleOf) {
    const e = game.enemies.find((x) => x.id === ev.hit);
    const p = ev.at ?? e?.pos;
    if (!p) return;
    const to = new THREE.Vector3(p.x, p.y, p.z);
    const from = muzzleOf?.(ev.side) ?? camera.localToWorld(new THREE.Vector3(ev.side === 'left' ? -0.25 : 0.25, -0.25, -0.7));
    if (tracers.fire(from, to)) stats.tracers++;
    tracers.impact(to, camera.position);
    stats.impacts++;
  }

  let shake = 0;
  let dark = false;
  let flash = 0;
  let crouch = 0;
  return {
    camera,
    renderer,
    
    stats,
    
    art,
    
    objects() {
      let n = 0;
      scene.traverse(() => n++);
      return { nodes: n, fx: fx.length + blasts.length, meshes: meshes.size, pieces: pieceMeshes.size };
    },
    resize(w, h) {
      renderer.setPixelRatio(pixelRatioFor(w, h, window.devicePixelRatio, plan.maxPixelRatio));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = vfovFor(w / h); 
      camera.updateProjectionMatrix();
    },
    
    ray(ndc) {
      const rc = new THREE.Raycaster();
      rc.setFromCamera(new THREE.Vector2(ndc.x, ndc.y), camera);
      const { origin: o, direction: d } = rc.ray;
      return { o: { x: o.x, y: o.y, z: o.z }, d: { x: d.x, y: d.y, z: d.z } };
    },
    
    project(p) {
      const v = new THREE.Vector3(p.x, p.y, p.z).project(camera);
      return { x: v.x, y: v.y, z: v.z };
    },
    



    draw(game, events, dt, muzzleOf) {
      const shots = [];
      for (const ev of events) {
        if (ev.type === 'shot') {
          shots.push(ev);
          flash = 1;
        } else if (ev.type === 'explode') {
          const p = ev.pos ?? game.cam.pos;
          const spec = blastSpec(ev.what, ev.power ?? 1);
          if (spec.staged && ev.place) {
            
            const d = game.run.dist;
            const { tangent } = game.stage.rail.at(d);
            const { ahead = 0, side = 0, up = 0 } = ev.place;
            const baseY = groundBeside(game.stage, d + ahead, side);
            blast((s, u) => blastAt(p, tangent, { ahead, side: side + s, up: up + u }, baseY), spec.parts);
          } else {
            const old = blastSpec(undefined, ev.power ?? 1);
            const at = ev.place ? { x: p.x + game.cam.fwd.x * ev.place.ahead, y: p.y, z: p.z + game.cam.fwd.z * ev.place.ahead } : p;
            burst(at, old.color, old.size, old.life, old.grow);
          }
          shake = Math.max(shake, 0.5 * (ev.power ?? 1));
        } else if (ev.type === 'shake') shake = Math.max(shake, ev.power ?? 0.5);
        else if (ev.type === 'hurt' || ev.type === 'bite') shake = Math.max(shake, 0.25);
        else if (ev.type === 'lights') dark = ev.on === false;
        else if (ev.type === 'rescued') burst(ev.pos, 0x7ad0ff, 0.6, 0.5, 3);
      }
      
      flash = Math.max(0, flash - dt * 8);
      hemi.intensity = dark ? 0.15 + 1.2 * flash : 1.6;
      sun.intensity = dark ? 0.05 : 1.4;

      const { pos, fwd } = game.cam;
      crouch += ((game.crouched ? 1 : 0) - crouch) * Math.min(1, dt * 10);
      shake = Math.max(0, shake - dt * 1.5);
      const j = shake * 0.15;
      const y = pos.y - 0.8 * crouch;
      camera.position.set(pos.x + (Math.random() - 0.5) * j, y + (Math.random() - 0.5) * j, pos.z);
      camera.lookAt(pos.x + fwd.x, y + fwd.y - LOOK_DROP, pos.z + fwd.z);
      camera.rotateZ(-(game.cam.roll ?? 0)); 
      if (props.groundFollows) props.ground.position.set(pos.x, pos.y - 1.62, pos.z);
      else props.ground.position.set(pos.x, props.ground.position.y, pos.z);
      dress?.follow(pos, fwd, game.vehicle);
      camera.updateMatrixWorld();
      for (const ev of shots) shotFx(ev, game, muzzleOf);
      tracers.update(dt);

      ironJaw.update(game.boss, pos);
      drawSetPieces(game, pos);

      const live = new Set();
      for (const e of game.enemies) {
        live.add(e.id);
        let m = meshes.get(e.id);
        
        if (m && !m.sheet && sheets[e.kind]) {
          dropMesh(m);
          m = undefined;
        }
        if (!m) {
          m = enemyMesh(e);
          meshes.set(e.id, m);
        }
        const h = KIND_LOOK[e.kind]?.h ?? 1;
        const centred = e.state === 'part' || KIND_LOOK[e.kind]?.shape === 'sphere' || (m.sheet && SPRITES[e.kind].centred);
        
        const lift = m.sheet ? spriteLift(SPRITES[e.kind]) : h / 2;
        const hang = m.sheet ? spriteHang(SPRITES[e.kind]) : 0;
        m.body.position.set(e.pos.x, centred ? e.pos.y + hang : e.pos.y + lift - e.r, e.pos.z);
        m.body.lookAt(pos.x, m.body.position.y, pos.z);
        if (e.dead) {
          const lying = m.sheet && !tipsOver(SPRITES[e.kind]);
          if (!lying) m.body.rotation.x = Math.min(Math.PI / 2, e.deadT * 4);
          if (e.state === 'part') m.body.position.y -= e.deadT * 4;
          else if (!lying) m.body.position.y -= e.deadT * 0.6;
        }
        if (m.hp !== e.hp) {
          m.hp = e.hp;
          m.hurtT = 0.25;
          m.body.material.emissive?.setHex(0x662200);
        } else m.body.material.emissive?.multiplyScalar(0.8);
        m.hurtT = Math.max(0, m.hurtT - dt);
        if (m.sheet) {
          const uv = cellUV(SPRITES[e.kind], spritePose(e.kind, e, m.hurtT) ?? '');
          m.sheet.tex.repeat.x = uv.repeat;
          m.sheet.tex.offset.x = uv.offset;
        }
        m.ring.visible = !e.dead && (e.state === 'telegraph' || e.state === 'incoming' || !!e.warn);
        if (m.ring.visible) {
          m.ring.position.copy(m.body.position);
          m.ring.quaternion.copy(camera.quaternion);
          m.ring.scale.setScalar(Math.max(0.6, e.r) * (3.2 - 2.2 * e.ring));
        }
      }
      for (const [id, m] of meshes) {
        if (live.has(id)) continue;
        dropMesh(m);
        meshes.delete(id);
      }
      for (let i = fx.length - 1; i >= 0; i--) {
        const f = fx[i];
        f.t += dt;
        const u = f.t / f.life;
        f.mesh.scale.multiplyScalar(1 + f.grow * dt);
        f.mesh.material.opacity = Math.max(0, 1 - u);
        if (u >= 1) {
          scene.remove(f.mesh);
          f.mesh.material.dispose();
          fx.splice(i, 1);
        }
      }
      for (let i = blasts.length - 1; i >= 0; i--) {
        const b = blasts[i];
        b.t += dt;
        const s = partAt(b.part, b.t);
        if (s) {
          b.mesh.visible = true;
          b.mesh.scale.setScalar(s.r);
          b.mesh.position.y = b.y + s.dy;
          b.mesh.material.opacity = s.opacity;
        } else if (b.t >= b.part.delay) {
          scene.remove(b.mesh);
          b.mesh.material.dispose();
          blasts.splice(i, 1);
        }
      }
      renderer.render(scene, camera);
    },
  };
}


function sheetPlane(tex, sprite) {
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.magFilter = THREE.NearestFilter;
  tex.repeat.set(1 / sprite.frames.length, 1);
  const mat = new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
  return new THREE.Mesh(new THREE.PlaneGeometry(sprite.side, sprite.side), mat);
}





function bossBody() {
  const group = new THREE.Group();
  const hide = new THREE.MeshLambertMaterial({ color: 0x9a7a52 });
  const metal = new THREE.MeshLambertMaterial({ color: 0x8e979f });
  
  const blocks = [];
  const box = (w, h, d, mat, x, y, z) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    group.add(m);
    blocks.push(m);
    return m;
  };
  box(3, 3, 6, hide, 0, 3.2, 1); 
  box(1.4, 1.4, 6, hide, 0, 3.4, 6); 
  box(1, 2.4, 1.2, hide, -1, 1.2, 1.4); 
  box(1, 2.4, 1.2, hide, 1, 1.2, 1.4);
  box(2, 1.8, 3, hide, 0, 4.6, -2.6); 
  box(2.3, 0.6, 2.6, metal, 0, 3.6, -2.8); 
  const varga = new THREE.Group();
  const coat = new THREE.Mesh(new THREE.CapsuleGeometry(0.4, 1, 4, 8), new THREE.MeshLambertMaterial({ color: 0x2b1d1a }));
  coat.position.y = 0.9;
  const cigar = new THREE.Mesh(new THREE.SphereGeometry(0.07, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff7a1a }));
  cigar.position.set(0, 1.55, -0.45);
  varga.add(coat, cigar);
  varga.position.set(0, 4.7, 1);
  group.add(varga);
  group.visible = false;
  const gantry = new THREE.Group();
  gantry.visible = false;
  const gantryBox = new THREE.Mesh(new THREE.BoxGeometry(4, 1, 2), metal);
  gantryBox.position.y = -0.5;
  gantry.add(gantryBox);
  const billboard = new THREE.Group();
  billboard.visible = false;
  
  let sheet = null;
  
  let rider = null;
  return {
    group,
    gantry,
    billboard,
    
    setSheet(tex, downTex) {
      const plane = sheetPlane(tex, BOSS_SPRITE);
      const down = sheetPlane(downTex, BOSS_DOWN);
      plane.position.y = (BOSS_SPRITE.side * SPRITE_FILL) / 2;
      down.position.y = (BOSS_DOWN.side * SPRITE_FILL) / 2;
      billboard.add(plane, down);
      for (const b of blocks) b.visible = false;
      sheet = { plane, tex, down };
    },
    
    setRider(tex) {
      const plane = sheetPlane(tex, SPRITES.varga);
      plane.position.z = 0.1;
      const uv = cellUV(SPRITES.varga, SPRITES.varga.poses.idle);
      tex.repeat.x = uv.repeat;
      tex.offset.x = uv.offset;
      billboard.add(plane);
      rider = { plane, tex };
    },
    
    setGantry(tex) {
      const plane = sheetPlane(tex, GANTRY);
      plane.position.set(0, gantryPlaneY(), -0.2);
      gantry.add(plane);
      gantryBox.visible = false;
    },
    
    update(boss, cam) {
      group.visible = !!boss;
      gantry.visible = !!boss?.parts.varga;
      billboard.visible = !!boss && !!sheet;
      if (!boss) return;
      const pose = bossPose(boss);
      if (sheet) {
        billboard.position.set(boss.pos.x, boss.pos.y, boss.pos.z);
        billboard.lookAt(cam.x, boss.pos.y, cam.z);
        sheet.down.visible = boss.down;
        sheet.plane.visible = !boss.down;
        if (!boss.down) {
          const uv = cellUV(BOSS_SPRITE, pose);
          sheet.tex.repeat.x = uv.repeat;
          sheet.tex.offset.x = uv.offset;
        }
      }
      if (rider) {
        rider.plane.visible = !boss.parts.varga;
        const feet = bossAnchor(pose, 'feet');
        rider.plane.position.x = feet.x;
        rider.plane.position.y = feet.y + RIDER_LIFT;
      }
      group.position.set(boss.pos.x, boss.pos.y, boss.pos.z);
      
      group.rotation.set(0, Math.atan2(cam.x - boss.pos.x, cam.z - boss.pos.z) + Math.PI, boss.down ? Math.PI / 2 : 0);
      varga.visible = !boss.parts.varga && !rider;
      cigar.material.color.setHex(Math.sin(boss.t * 6) > 0 ? 0xff7a1a : 0xffc04a);
      const v = boss.parts.varga;
      if (v) {
        gantry.position.set(v.pos.x, v.pos.y - RIDER_LIFT, v.pos.z);
        gantry.lookAt(cam.x, gantry.position.y, cam.z);
      }
    },
  };
}
