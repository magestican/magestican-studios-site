














import * as THREE from 'three';
import { bossLevel, createBossFight, pillars, ARENA } from '../../../../web-engine/horror/boss.js';
import { LIFT, OFF_RECT } from '../../../../web-engine/horror/lift.js';
import { buildLevel, pointBehind, progressAt, routePointAt, corners } from '../../../../web-engine/horror/level.js';
import { WEAPONS } from '../../../../web-engine/horror/weapons.js';
import {
  isBossDeck, actFor, rosterFor, actCardFor, openingGate, openingFor, openingRosterAt,
} from '../../../../web-engine/horror/acts.js';
import { gatesFor } from '../../../../web-engine/horror/gates.js';
import { createDirector } from '../../../../web-engine/horror/director.js';
import { stockBench, recoveredAt } from '../../../../web-engine/horror/workbench.js';
import { cornersOf, ambushPost } from '../../../../web-engine/horror/packBehaviour.js';
import { hash2, HALL_W, HALL_H } from '../constants.js';
import { CREATURE_FACE } from '../creatures/rigs.js';
import { texturedMaterial, grimeTexture, panel } from './textures.js';
import { buildDeck } from './deck.js';
import { dressDeck, archetypeFor } from '../../../../web-engine/horror/archetypes.js';
import { hexRgb } from '../../../../web-engine/horror/prelightDeck.mjs';
import { kitFor, buildProp, boxGeo } from './kit.js';
import { buildLook } from './look.js';
import { makeLeak, makeWire, sparkSprite } from './hazards.js';
import { makeImpacts, makeRicochets, makeTracers, makeDecals } from '../fx/particles.js';
import { buildHazards } from './hazardsRuntime.js';
import { buildBeats } from './beatsRuntime.js';









export function buildWorld(ctx, seed) {
  if (ctx.deckGroup) {
    ctx.deckGroup.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    ctx.scene.remove(ctx.deckGroup);
  }
  ctx.deckGroup = new THREE.Group();
  ctx.scene.add(ctx.deckGroup);

  
  
  ctx.isBoss = isBossDeck(seed);
  ctx.deck = ctx.isBoss ? bossLevel() : buildLevel(seed);
  
  
  ctx.fight = ctx.isBoss ? createBossFight({ endurance: 1 + (actFor(seed) - 1) * 0.25 }) : null;
  ctx.EXIT = ctx.deck.exit;
  
  
  ctx.safeRoom = ctx.deck.rooms.find((m) => m.kind === 'safe') || null;
  
  
  
  
  ctx.library = null;
  ctx.workbench = null;
  ctx.nearBench = false;
  ctx.leaks = [];
  ctx.wires = [];
  ctx.lockers = [];
  ctx.pickups = [];

  
  
  
  
  
  
  const arch = archetypeFor(seed);
  ctx.dressing = ctx.isBoss ? null : dressDeck(ctx.deck, seed);
  ctx.kit = kitFor(arch, seed);
  ({ strips: ctx.strips, ceilingPieces: ctx.ceilingPieces } = buildDeck(ctx.deckGroup, ctx.deck, { kit: ctx.kit, dressing: ctx.dressing }));
  const extraFixtures = [];
  const finishLook = () => {
    if (ctx.look) ctx.look.dispose();
    ctx.look = buildLook(ctx, {
      deck: ctx.deck, dressing: ctx.dressing, level: seed, kit: ctx.kit, group: ctx.deckGroup,
      extraFixtures, isBoss: ctx.isBoss,
    });
  };

  
  
  ctx.leaks = [];
  ctx.wires = [];
  ctx.props = [];
  ctx.solidProps = [];
  for (const run of ctx.deck.runs) {
    const len = Math.hypot(run.x1 - run.x0, run.z1 - run.z0);
    const dx = (run.x1 - run.x0) / len; const dz = (run.z1 - run.z0) / len;
    const px = -dz; const pz = dx;
    for (let t = 5; t < len - 3; t += 11) {
      const x = run.x0 + dx * t; const z = run.z0 + dz * t;
      const side = hash2(x + z, 1.7) > 0.5 ? 1 : -1;
      
      
      
      ctx.leaks.push(makeLeak(
        x + px * side * (HALL_W / 2 - 0.12),
        0.55 + hash2(x, 2.9) * 1.5,
        z + pz * side * (HALL_W / 2 - 0.12),
        [-px * side * 0.9, 0.25, -pz * side * 0.9],
      ));
      
      
      
      
      
      
      
      
      
      
      
      
      for (let u = 0; u < 3; u += 1) {
        const wt = t + u * 3.7;
        if (wt >= len - 3) break;
        if (hash2(wt + z, 5.5) <= 0.30) continue;
        const wx = run.x0 + dx * wt; const wz = run.z0 + dz * wt;
        ctx.wires.push(makeWire(
          wx + px * (hash2(wz, 6.1) - 0.5) * HALL_W * 0.7,
          wz + pz * (hash2(wz, 6.1) - 0.5) * HALL_W * 0.7,
          0.7 + hash2(wz, 7.3) * 1.5, wx + wz,
        ));
      }
    }
  }
  for (const l of ctx.leaks) ctx.deckGroup.add(l.points);
  for (const w of ctx.wires) ctx.deckGroup.add(w.line);

  
  
  
  
  
  
  ctx.sparkGeo = new THREE.BufferGeometry();
  ctx.sparkGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ctx.SPARK_N * 3), 3));
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  ctx.sparkPt = new THREE.Points(ctx.sparkGeo, new THREE.PointsMaterial({
    color: 0xdfe9ff, size: 0.20, sizeAttenuation: true, transparent: true, opacity: 0,
    map: sparkSprite(), blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  ctx.sparkPt.frustumCulled = false;
  ctx.deckGroup.add(ctx.sparkPt);

  
  
  
  
  ctx.impacts = makeImpacts();
  ctx.ricochets = makeRicochets();
  ctx.tracers = makeTracers();
  ctx.deckGroup.add(ctx.ricochets.points);
  ctx.deckGroup.add(ctx.tracers.lines);
  ctx.deckGroup.add(ctx.impacts.points);
  ctx.decals = makeDecals();
  ctx.deckGroup.add(ctx.decals.group);
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  ctx.lockers = [];
  ctx.props = [];
  ctx.solidProps = [];
  const placeProp = (p, parent) => {
    const g = buildProp(p.name, p, ctx.kit);
    const y = p.place === 'ceiling' ? HALL_H : 0;
    g.position.set(p.x, y, p.z);
    g.rotation.y = p.yaw || 0;
    parent.add(g);
    if (g.userData.light) {
      const L = g.userData.light;
      extraFixtures.push({ x: p.x, y: y + L.y, z: p.z, colour: hexRgb(L.colour), intensity: L.intensity, radius: L.radius, flicker: !!L.flicker });
    }
    if (p.solid && p.place !== 'ceiling' && p.solids && p.solids.length) {
      
      
      
      
      
      for (const sd of p.solids) ctx.solidProps.push({ x: sd.x, z: sd.z, r: sd.r, h: p.h });
      const shGeo = new THREE.PlaneGeometry(1, 1);
      const shMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthWrite: false });
      const sh = new THREE.Mesh(shGeo, shMat);
      sh.rotation.x = -Math.PI / 2;
      sh.position.set(p.x, 0.012, p.z);
      sh.userData.noBake = true;
      parent.add(sh);
      ctx.props.push({ mesh: g, shadow: sh, mat: shMat, x: p.x, z: p.z, r: Math.max(0.2, p.r || 0.3), h: p.h || 0.8 });
    }
    return g;
  };
  const makeLocker = (p) => {
    const g = placeProp(p, ctx.deckGroup);
    const hinge = new THREE.Group();
    const door = new THREE.Mesh(boxGeo(0.66, 1.9, 0.035, 0.7), ctx.kit.mat.steel);
    door.position.x = -0.33;
    hinge.add(door);
    hinge.position.set(0.35, 1.0, 0.235);
    g.add(hinge);
    const fx = Math.sin(p.yaw || 0); const fz = Math.cos(p.yaw || 0);
    ctx.lockers.push({
      mesh: g, door: hinge, x: p.x + fx * 0.5, z: p.z + fz * 0.5, side: 1,
      inX: p.x + fx * 0.26, inZ: p.z + fz * 0.26,
    });
  };
  if (ctx.dressing) {
    for (const p of ctx.dressing.props) {
      if (p.name === 'locker') makeLocker(p);
      else placeProp(p, ctx.deckGroup);
    }
  }

  
  
  
  
  
  
  ctx.pickups = [];
  for (const m of ctx.deck.rooms) {
    if (m.contents !== 'item') continue;
    const cx = (m.x0 + m.x1) / 2; const cz = (m.z0 + m.z1) / 2;
    const ammo = hash2(cx, cz) > 0.45;
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.30, 0.26).toNonIndexed(), ctx.mat);
    {
      const n = box.geometry.attributes.position.count;
      const col = new Float32Array(n * 3);
      const c = new THREE.Color(ammo ? 0xb5893f : 0xc4534a);
      for (let i = 0; i < n; i += 1) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      box.geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
      box.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(n * 2).fill(0), 2));
      box.geometry.computeVertexNormals();
    }
    box.position.set(cx, 0.15, cz);
    ctx.deckGroup.add(box);
    ctx.pickups.push({ mesh: box, x: cx, z: cz, ammo, taken: false });
  }

  
  
  
  
  
  
  
  
  
  if (ctx.safeRoom) {
    const cx = (ctx.safeRoom.x0 + ctx.safeRoom.x1) / 2;
    const cz = (ctx.safeRoom.z0 + ctx.safeRoom.z1) / 2;
    const far = ctx.safeRoom.side > 0 ? ctx.safeRoom.x1 : ctx.safeRoom.x0;
    
    
    
    const paint = (geo, hex) => {
      const n = geo.attributes.position.count;
      const col = new Float32Array(n * 3);
      const c = new THREE.Color(hex);
      for (let i = 0; i < n; i += 1) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      geo.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(n * 2).fill(0), 2));
      geo.computeVertexNormals();
      return new THREE.Mesh(geo, ctx.mat);
    };

    
    
    
    
    
    
    
    
    {
      const kit = new THREE.Group();
      
      
      
      kit.add(paint(new THREE.BoxGeometry(0.42, 0.30, 0.30).toNonIndexed(), 0xd8d4c8));
      
      for (const zs of [-1, 1]) {
        const h = paint(new THREE.BoxGeometry(0.24, 0.075, 0.02).toNonIndexed(), 0xb6392c);
        h.position.set(0, 0, zs * 0.155);
        const v = paint(new THREE.BoxGeometry(0.075, 0.24, 0.02).toNonIndexed(), 0xb6392c);
        v.position.set(0, 0, zs * 0.155);
        kit.add(h, v);
      }
      kit.position.set(cx, 0.95, cz);
      ctx.deckGroup.add(kit);
      ctx.pickups.push({
        mesh: kit, x: cx, z: cz, medkit: true, taken: false,
        
        
        baseY: 0.95, bob: 0.09, spin: 0.7,
      });
    }

    
    
    
    
    
    
    
    
    
    
    {
      const lx = cx + ctx.safeRoom.side * 0.8;
      const lz = ctx.safeRoom.z1 - 0.32;
      const shelf = paint(new THREE.BoxGeometry(1.5, 2.05, 0.52).toNonIndexed(), 0x4a5347);
      shelf.position.set(lx, 1.025, lz);
      ctx.deckGroup.add(shelf);
      
      for (const y of [0.62, 1.15, 1.68]) {
        const lip = paint(new THREE.BoxGeometry(1.42, 0.05, 0.06).toNonIndexed(), 0x2e352d);
        lip.position.set(lx, y, lz - 0.29);
        ctx.deckGroup.add(lip);
      }
      
      
      
      
      
      
      
      
      
      const scrMat = new THREE.MeshBasicMaterial({ color: 0x6ff0d8 });
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.64, 0.42), scrMat);
      scr.position.set(lx, 1.42, ctx.safeRoom.z1 - 0.60);
      scr.rotation.y = Math.PI;
      ctx.deckGroup.add(scr);
      
      
      ctx.solidProps.push({ x: lx, z: lz, r: 0.85, h: 1.9 });   
      ctx.library = { x: lx, z: lz, screen: scr };
    }

    
    
    
    
    {
      const near = ctx.safeRoom.side > 0 ? ctx.safeRoom.x0 : ctx.safeRoom.x1;
      const wx = near + ctx.safeRoom.side * 0.55;
      const wz = ctx.safeRoom.z0 + 1.6;
      const table = paint(new THREE.BoxGeometry(0.6, 0.92, 1.5).toNonIndexed(), 0x525a55);
      table.position.set(wx, 0.46, wz);
      ctx.deckGroup.add(table);
      
      
      const tool = paint(new THREE.BoxGeometry(0.12, 0.1, 0.9).toNonIndexed(), 0x8a5a3a);
      tool.position.set(wx - ctx.safeRoom.side * 0.08, 0.97, wz - 0.15);
      tool.rotation.y = 0.35;
      ctx.deckGroup.add(tool);
      const box2 = paint(new THREE.BoxGeometry(0.28, 0.18, 0.28).toNonIndexed(), 0x3e463f);
      box2.position.set(wx, 1.01, wz + 0.45);
      ctx.deckGroup.add(box2);
      ctx.solidProps.push({ x: wx, z: wz, r: 0.7, h: 0.92 });   
      ctx.workbench = { x: wx, z: wz };
    }
  }

  
  
  
  
  
  
  
  
  if (ctx.dressing) {
    const keep = [];
    if (ctx.library) keep.push({ x: ctx.library.x, z: ctx.library.z, r: 1.2 });
    if (ctx.workbench) keep.push({ x: ctx.workbench.x, z: ctx.workbench.z, r: 1.0 });
    for (const q of ctx.pickups) keep.push({ x: q.x, z: q.z, r: 0.9 });
    for (const room of ctx.dressing.rooms) {
      for (const p of room.props) {
        if (keep.some((k) => Math.hypot(k.x - p.x, k.z - p.z) < k.r + (p.r || 0.3))) continue;
        placeProp(p, ctx.deckGroup);
      }
    }
  }

  








{
  const cw = LIFT.width; const cd = LIFT.depth; const ch = LIFT.height;
  
  
  
  
  
  
  
  
  ctx.liftGroup = new THREE.Group();
  ctx.deckGroup.add(ctx.liftGroup);
  const cx = 0; const cz = cd / 2 + 0.1;
  
  
  
  
  
  
  
  
  
  ctx.placeCar(ctx.deck.bays[0]);

  
  
  
  
  
  ctx.sealedDoors = null;
  for (const bay of ctx.deck.bays) {
    const f = bay.car.face;
    const yaw = Math.atan2(-f.x, -f.z);
    const mouth = {
      x: bay.car.x + f.x * (LIFT.depth / 2 + 0.12),
      z: bay.car.z + f.z * (LIFT.depth / 2 + 0.12),
    };
    const frame = new THREE.Group();
    frame.position.set(mouth.x, 0, mouth.z);
    frame.rotation.y = yaw;
    const jambGeo = new THREE.BoxGeometry(0.22, LIFT.height + 0.15, 0.3).toNonIndexed();
    for (const sideX of [-1, 1]) {
      const j = new THREE.Mesh(jambGeo.clone(), ctx.mat);
      ctx.paintGeo(j.geometry, 0x565e52);
      j.position.set(sideX * (LIFT.width / 2 + 0.11), (LIFT.height + 0.15) / 2, 0);
      frame.add(j);
    }
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(LIFT.width + 0.66, 0.3, 0.3).toNonIndexed(), ctx.mat);
    ctx.paintGeo(lintel.geometry, 0x565e52);
    lintel.position.set(0, LIFT.height + 0.15, 0);
    frame.add(lintel);
    
    
    
    const lampMat = new THREE.MeshBasicMaterial({ color: 0x2a4a3e });
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.1), lampMat);
    lamp.position.set(0, LIFT.height - 0.05, 0.18);
    frame.add(lamp);
    ctx.deckGroup.add(frame);
    if (bay.kind === 'departure') ctx.liftLamp = lampMat;
    if (bay.kind === 'arrival') {
      
      
      const sd = new THREE.Group();
      sd.position.copy(frame.position);
      sd.rotation.y = yaw;
      for (const sideX of [-1, 1]) {
        const leaf = new THREE.Mesh(new THREE.BoxGeometry(LIFT.width / 2, LIFT.height, 0.09).toNonIndexed(), ctx.mat);
        ctx.paintGeo(leaf.geometry, 0x49544b);
        leaf.position.set(sideX * (LIFT.width / 4), LIFT.height / 2, 0.02);
        sd.add(leaf);
      }
      
      
      sd.visible = !(ctx.liftCar && ctx.liftCar.kind === 'arrival');
      ctx.deckGroup.add(sd);
      ctx.sealedDoors = sd;
    }
  }

  
  
  
  ctx.liftGroup.userData.noBake = true;
  const carMat = ctx.kit ? ctx.kit.mat.steel : texturedMaterial(grimeTexture({
    base: 0x7a8a80, seams: true, rivets: true, mud: 2, blood: 3, hay: 0,
  }));
  const put = (w, h, tile, fn) => {
    const m = panel(w, h, tile, { mat: carMat, apply: fn });
    m.geometry.attributes.aColor.array.fill(0.72);
    ctx.liftGroup.add(m);
    return m;
  };
  put(cw, cd, 2.0, (m) => { m.rotation.x = -Math.PI / 2; m.position.set(cx, 0.01, cz); });
  put(cw, cd, 2.0, (m) => { m.rotation.x = Math.PI / 2; m.position.set(cx, ch, cz); });
  put(cw, ch, 2.0, (m) => { m.position.set(cx, ch / 2, cz + cd / 2); m.rotation.y = Math.PI; });
  put(cd, ch, 2.0, (m) => { m.position.set(cx - cw / 2, ch / 2, cz); m.rotation.y = Math.PI / 2; });
  put(cd, ch, 2.0, (m) => { m.position.set(cx + cw / 2, ch / 2, cz); m.rotation.y = -Math.PI / 2; });

  
  
  
  
  
  const doorMat = ctx.kit ? ctx.kit.mat.doorLeaf : texturedMaterial(grimeTexture({
    base: 0x9fb0a4, seams: true, rivets: true, mud: 1, blood: 2, hay: 0,
  }), { side: THREE.DoubleSide });
  ctx.liftDoors = [-1, 1].map((side) => {
    const d = panel(cw / 2, ch, 1.6, {
      mat: doorMat,
      apply: (m) => { m.position.set(cx + side * cw / 4, ch / 2, cz - cd / 2); },
    });
    d.geometry.attributes.aColor.array.fill(0.72);
    d.userData.side = side;
    d.userData.homeX = cx + side * cw / 4;
    ctx.liftGroup.add(d);
    return d;
  });

  
  
  
  
  
  
  
  
  
  {
    const leaves = [{ ...OFF_RECT }, { ...OFF_RECT }];
    const sealed = { ...OFF_RECT };
    ctx.liftColliders = { leaves, sealed, all: [leaves[0], leaves[1], sealed] };
    ctx.solidProps.push(...ctx.liftColliders.all);
    ctx.syncLiftColliders();
  }

  
  
  const call = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.26).toNonIndexed(), ctx.mat);
  {
    const n = call.geometry.attributes.position.count;
    const col = new Float32Array(n * 3);
    const c = new THREE.Color(0x7dffc4);
    for (let i = 0; i < n; i += 1) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    call.geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
    call.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(n * 2).fill(0), 2));
    call.geometry.computeVertexNormals();
  }
  call.position.set(cx + cw / 2 - 0.05, 1.35, cz - cd / 2 - 0.06);
  ctx.liftGroup.add(call);
  ctx.lift = call;
}

  
  ctx.boulder = null;
  ctx.cable = null;
  ctx.arenaPillars = [];
  if (ctx.isBoss) {
    const bp = ctx.deck.boulder;
    ctx.boulder = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 0).toNonIndexed(), ctx.mat);
    {
      const n = ctx.boulder.geometry.attributes.position.count;
      const col = new Float32Array(n * 3);
      const c = new THREE.Color(0x4a4640);
      for (let i = 0; i < n; i += 1) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
      ctx.boulder.geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
      ctx.boulder.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(n * 2).fill(0), 2));
      ctx.boulder.geometry.computeVertexNormals();
    }
    ctx.boulder.position.set(bp.x, bp.y, bp.z);
    ctx.deckGroup.add(ctx.boulder);

    
    
    
    
    
    
    
    
    
    
    for (const q of pillars()) {
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(q.r, q.r * 1.12, ARENA.height, 7).toNonIndexed(),
        ctx.mat,
      );
      const n = col.geometry.attributes.position.count;
      const cc = new Float32Array(n * 3);
      const c2 = new THREE.Color(0x5d6357);
      for (let i = 0; i < n; i += 1) { cc[i * 3] = c2.r; cc[i * 3 + 1] = c2.g; cc[i * 3 + 2] = c2.b; }
      col.geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(cc, 3));
      col.geometry.setAttribute('uv', new THREE.Float32BufferAttribute(new Array(n * 2).fill(0), 2));
      col.geometry.computeVertexNormals();
      col.position.set(q.x, ARENA.height / 2, q.z);
      ctx.deckGroup.add(col);
      ctx.arenaPillars.push(q);
    }

    
    const cg = new THREE.BufferGeometry();
    cg.setAttribute('position', new THREE.BufferAttribute(new Float32Array([
      bp.x, ARENA.height, bp.z, bp.x, bp.y + 0.9, bp.z,
    ]), 3));
    ctx.cable = new THREE.Line(cg, new THREE.LineBasicMaterial({ color: 0x8a7f68 }));
    ctx.cable.frustumCulled = false;
    ctx.deckGroup.add(ctx.cable);
  }

  
  
  
  
  
  for (const b of ctx.birds) {
    ctx.scene.remove(b.mesh);
    if (b.shade) ctx.scene.remove(b.shade);
    if (b.flame) { ctx.scene.remove(b.flame); b.flame = null; }
    b.alive = false;
  }
  ctx.birds.length = 0;
  ctx.player.latchedBy = null;
  ctx.player.struggle = null;

  








if (ctx.isBoss) {
  finishLook();
  ctx.addChicken(ctx.deck.length * 0.90, 0, 'horse');
  
  
  
  buildHazards(ctx, seed);
  buildBeats(ctx, seed);
  return;
}


  
  
  
  
  
  
  
  const plan = rosterFor(seed);
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const startP = progressAt(ctx.deck, ctx.deck.start.x, ctx.deck.start.z);
  plan.behind.forEach((back, i) => {
    const p = startP - back >= 2
      ? pointBehind(ctx.deck, ctx.deck.start.x, ctx.deck.start.z, back)
      : routePointAt(ctx.deck, startP + back);
    ctx.addChicken(p.z, p.x + (i % 2 ? 1 : -1) * 0.5);
  });

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const openingBreach = [];
  {
    const roster = openingRosterAt(ctx.deck, seed);
    for (const q of roster.porkers) openingBreach.push({ species: 'porker', x: q.x, z: q.z, progress: q.progress });
    for (const q of roster.cows) openingBreach.push({ species: 'cow', x: q.x, z: q.z, progress: q.progress });
  }
  
  
  if (plan.ahead >= 1 && ctx.deck.runs.length > 2) {
    const r2 = ctx.deck.runs[2];
    ctx.addChicken((r2.z0 + r2.z1) / 2, (r2.x0 + r2.x1) / 2);
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  {
    const cs = cornersOf(ctx.deck);
    
    
    
    
    const first = seed <= 1 ? 1 : 0;   
    if (cs.length > first) {
      
      
      
      
      
      const k = first + Math.floor(hash2(seed, 907) * (cs.length - first));
      const post = ambushPost(ctx.deck, k);
      if (post) {
        
        
        const b = ctx.addChicken(post.z, post.x, k >= 2 ? 'porker' : 'chicken');
        if (b) {
          b.posted = true;
          b.mesh.rotation.z = post.yaw + CREATURE_FACE;
          ctx.ambushAt = { corner: k, x: post.x, z: post.z, kind: b.kind };
        }
      }
    }
  }

  
  
  
  
  
  
  
  const porkerFloor = (() => {
    const rule = openingFor(seed);
    const cs = corners(ctx.deck);
    const fr = rule ? rule.porkerNotBeforeRun : 0;
    return fr > 0 && cs[fr - 1] ? cs[fr - 1].progress : -Infinity;
  })();

  
  
  for (const m of ctx.deck.rooms) {
    if (m.contents !== 'enemy') continue;
    const b = ctx.addChicken((m.z0 + m.z1) / 2, (m.x0 + m.x1) / 2, 'porker');
    
    
    
    
    
    
    
    if (b && Number.isFinite(porkerFloor) && progressAt(ctx.deck, m.door.x, m.door.z) < porkerFloor) b.notBefore = porkerFloor;
  }

  
  
  ctx.bench = stockBench(ctx.bench, seed, ctx.player.weapon.id);

  
  
  
  
  
  
  
  
  
  ctx.gateMeshes = [];
  ctx.entrances = [];
  for (const d of ctx.debrisPool) { d.live = false; d.settled = false; if (d.mesh) d.mesh.visible = false; }
  
  
  
  ctx.director = null;
  ctx.openingPending = [];
  ctx.openingCooldown = 0;
  if (!ctx.isBoss) {
    
    
    
    
    
    
    const og = openingGate(ctx.deck, seed, seed);
    const gs = gatesFor(ctx.deck, seed, { act: actFor(seed) }).concat(og ? [og] : []);
    for (const g of gs) {
      if (g.kind === 'drop') {
        
        
        
        
        const dg = new THREE.Group();
        dg.position.set(g.x, HALL_H, g.z);
        const tile = ctx.introPaint(new THREE.BoxGeometry(1.3, 0.06, 1.3).toNonIndexed(), 0x3a3f3b);
        tile.position.y = -0.03;
        tile.rotation.x = 0.04;   
        dg.add(tile);
        ctx.deckGroup.add(dg);
        ctx.gateMeshes.push({ gate: g, group: dg, tile });
        continue;
      }
      const gg = new THREE.Group();
      const yaw2 = Math.atan2(g.nx, g.nz);
      gg.position.set(g.x, 0, g.z);
      gg.rotation.y = yaw2;
      if (g.kind === 'duct') {
        
        
        const hole = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.4),
          new THREE.MeshBasicMaterial({ color: 0x050807 }));
        hole.position.set(0, 0.24, 0.02);
        gg.add(hole);
        const frame2 = ctx.introPaint(new THREE.BoxGeometry(0.72, 0.06, 0.06).toNonIndexed(), 0x565a5e);
        frame2.position.set(0, 0.47, 0.05); gg.add(frame2);
        const sill = ctx.introPaint(new THREE.BoxGeometry(0.72, 0.05, 0.08).toNonIndexed(), 0x565a5e);
        sill.position.set(0, 0.03, 0.05); gg.add(sill);
        const grille = new THREE.Group();
        for (let li = 0; li < 5; li += 1) {
          const louvre = ctx.introPaint(new THREE.BoxGeometry(0.62, 0.045, 0.03).toNonIndexed(), 0x6f7377);
          louvre.position.set(0, 0.09 + li * 0.075, 0.06);
          louvre.rotation.x = 0.5;
          grille.add(louvre);
        }
        gg.add(grille);
        ctx.gateMeshes.push({ gate: g, group: gg, grille });
      } else {
        
        
        
        const panel = ctx.introPaint(new THREE.BoxGeometry(1.5, 1.9, 0.05).toNonIndexed(), 0x4b524d);
        panel.position.set(0, 1.0, 0.03); gg.add(panel);
        const crackG = new THREE.Group();
        for (const [cx3, cy3, len3, rot3] of [[0, 1.2, 0.9, 0.5], [-0.2, 0.8, 0.7, -0.9], [0.25, 1.5, 0.5, 1.2], [0.1, 0.5, 0.6, -0.3]]) {
          const ck = new THREE.Mesh(new THREE.PlaneGeometry(len3, 0.025),
            new THREE.MeshBasicMaterial({ color: 0x120f0c }));
          ck.position.set(cx3, cy3, 0.062);
          ck.rotation.z = rot3;
          crackG.add(ck);
        }
        gg.add(crackG);
        ctx.gateMeshes.push({ gate: g, group: gg, cracks: crackG });
      }
      ctx.deckGroup.add(gg);
    }
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    ctx.openingPending = [];
    {
      const used = new Set();
      
      
      
      
      
      
      
      
      
      for (const item of openingBreach) {
        let best = -1;
        let bestD = Infinity;
        ctx.gateMeshes.forEach((m, gi) => {
          if (m.gate.kind !== 'breach' || m.gate.scripted || used.has(gi)) return;
          if (item.species === 'porker' && progressAt(ctx.deck, m.gate.x, m.gate.z) < porkerFloor) return;
          const d = Math.hypot(m.gate.x - item.x, m.gate.z - item.z);
          if (d < bestD) { bestD = d; best = gi; }
        });
        if (best >= 0) {
          used.add(best);
          ctx.openingPending.push({
            gi: best, species: item.species, gate: ctx.gateMeshes[best].gate,
            
            
            
            
            
            
            notBefore: item.species === 'porker' && Number.isFinite(porkerFloor) ? porkerFloor : 0,
          });
        } else {
          ctx.addChicken(item.z, item.x, item.species);
        }
      }
    }

    
    
    
    
    ctx.director = seed > 1 ? createDirector(seed, actFor(seed), ctx.gateMeshes.length) : null;
  }

  
  
  
  
  buildHazards(ctx, seed);
  buildBeats(ctx, seed);

  
  
  
  
  
  finishLook();

  const rec = recoveredAt(seed);
  const recName = rec ? `RECOVERED: ${WEAPONS[rec].name}` : null;
  const card = actCardFor(seed);
  const note = card && recName ? `${card}  •  ${recName}` : (card || recName);
  if (note) { ctx.hud.msg(note); ctx.actCardT = 5; }
}
