































import * as THREE from 'three';
import {
  fixturesFor, visibilityFor, bakeSurface, combineLight, sampleLight, moverTint, flickerFor, levelsAt,
  LIGHT, LIGHT_MODES, transformPoints, transformNormals,
} from '../../../../web-engine/horror/prelightDeck.mjs';
import { flickerSchedule } from '../../../../web-engine/horror/tools/prelight.mjs';
import { placeHazards, footprint, HAZARD } from '../../../../web-engine/horror/hazards.js';
import { runRect } from '../../../../web-engine/horror/level.js';
import { lookState } from '../render/materials.js';
import { sparkSprite, makeWire } from './hazards.js';
import { readyGeometry, boxGeo, quadGeo, cylGeo, kitTextureCount } from './kit.js';
import { hash2 } from '../constants.js';


function fallbackDressing(deck, arch) {
  const fixtures = [];
  deck.runs.forEach((run, ri) => {
    const len = Math.hypot(run.x1 - run.x0, run.z1 - run.z0);
    const dx = (run.x1 - run.x0) / len; const dz = (run.z1 - run.z0) / len;
    for (let u = 4; u < len - 2; u += 8) fixtures.push({ x: run.x0 + dx * u, z: run.z0 + dz * u, run: ri, progress: u, dead: false, flicker: (u / 8) % 3 === 1, phase: u });
  });
  return { lights: { kind: arch.lights.kind, colour: arch.lights.colour, fixtures }, rooms: [] };
}


function bakeable(o) {
  for (let p = o; p; p = p.parent) if (p.userData && (p.userData.mover || p.userData.noBake)) return false;
  return true;
}












export function buildShell(deck, { off = 0.05, height = deck.height } = {}) {
  const rects = [
    ...deck.runs.map(runRect),
    ...deck.rooms.map((m) => ({ x0: m.x0, x1: m.x1, z0: m.z0, z1: m.z1 })),
    ...(deck.bays || []).map((b) => ({ x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 })),
  ];
  const pos = [];
  const tri = (a, b, c) => pos.push(...a, ...b, ...c);
  
  const quad = (a, b, c, d, n) => {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const cr = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
    const dot = cr[0] * n[0] + cr[1] * n[1] + cr[2] * n[2];
    if (dot >= 0) { tri(a, b, c); tri(a, c, d); } else { tri(a, c, b); tri(a, d, c); }
  };
  const y0 = -off; const y1 = height + off;
  const eps = 1e-6;
  const subtract = (lo, hi, covers) => {
    let spans = [[lo, hi]];
    for (const [a, b] of covers) {
      const next = [];
      for (const [s0, s1] of spans) {
        if (b <= s0 + eps || a >= s1 - eps) { next.push([s0, s1]); continue; }
        if (a > s0 + eps) next.push([s0, a]);
        if (b < s1 - eps) next.push([b, s1]);
      }
      spans = next;
    }
    return spans.filter(([s0, s1]) => s1 - s0 > 0.01);
  };
  rects.forEach((R, i) => {
    const others = rects.filter((_, j) => j !== i);
    
    for (const [xEdge, sign] of [[R.x1, 1], [R.x0, -1]]) {
      const covers = others
        .filter((Q) => (sign > 0 ? (Q.x0 <= xEdge + eps && Q.x1 > xEdge + eps) : (Q.x1 >= xEdge - eps && Q.x0 < xEdge - eps)))
        .map((Q) => [Math.max(R.z0, Q.z0), Math.min(R.z1, Q.z1)]).filter(([a, b]) => b > a);
      for (const [a, b] of subtract(R.z0, R.z1, covers)) {
        const x = xEdge + sign * off;
        quad([x, y0, a], [x, y0, b], [x, y1, b], [x, y1, a], [sign, 0, 0]);
      }
    }
    
    for (const [zEdge, sign] of [[R.z1, 1], [R.z0, -1]]) {
      const covers = others
        .filter((Q) => (sign > 0 ? (Q.z0 <= zEdge + eps && Q.z1 > zEdge + eps) : (Q.z1 >= zEdge - eps && Q.z0 < zEdge - eps)))
        .map((Q) => [Math.max(R.x0, Q.x0), Math.min(R.x1, Q.x1)]).filter(([a, b]) => b > a);
      for (const [a, b] of subtract(R.x0, R.x1, covers)) {
        const z = zEdge + sign * off;
        quad([a, y0, z], [b, y0, z], [b, y1, z], [a, y1, z], [0, 0, sign]);
      }
    }
    
    quad([R.x0 - off, y1, R.z0 - off], [R.x1 + off, y1, R.z0 - off], [R.x1 + off, y1, R.z1 + off], [R.x0 - off, y1, R.z1 + off], [0, 1, 0]);
    quad([R.x0 - off, y0, R.z0 - off], [R.x1 + off, y0, R.z0 - off], [R.x1 + off, y0, R.z1 + off], [R.x0 - off, y0, R.z1 + off], [0, -1, 0]);
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(Float32Array.from(pos), 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0x000000, side: THREE.FrontSide, fog: false }));
  m.frustumCulled = false;
  m.userData.noBake = true;
  m.userData.shell = true;
  return m;
}





export function buildLook(ctx, { deck, dressing, level, kit, group, extraFixtures = [], isBoss = false }) {
  const arch = kit.arch;
  const H = deck.height;
  const dress = dressing || fallbackDressing(deck, arch);
  const fixtures = fixturesFor(dress, deck, { height: H, seed: level });
  for (const f of extraFixtures) fixtures.push({ cutoff: 4, flicker: false, dead: false, kind: 'prop', run: -1, progress: -1, phase: 0, seed: (level * 977 + fixtures.length * 31) >>> 0, ...f });
  const visible = visibilityFor(deck);

  
  const hazards = [];
  const hazardList = isBoss ? [] : placeHazards(deck, level, level);
  const sprites = [];
  for (const h of hazardList) {
    const fp = footprint(h);
    const entry = { id: h.id, kind: h.kind, h, level: 1, set(k) { entry.level = k; } };
    const yawOf = (nx, nz) => Math.atan2(nx, nz);
    if (h.kind === 'steam') {
      const vent = new THREE.Mesh(quadGeo(0.5, 0.36, 0.5, { stretch: true }), kit.mat.grille);
      vent.position.set(h.vent.x + h.vent.nx * 0.01, h.vent.y, h.vent.z + h.vent.nz * 0.01);
      vent.rotation.y = yawOf(h.vent.nx, h.vent.nz);
      group.add(vent);
      const jet = makeJet({ x: h.vent.x, y: h.vent.y, z: h.vent.z, nx: h.vent.nx, nz: h.vent.nz, reach: h.half * 2, colour: 0xc9d2d6, opacity: 0.5, size: 0.26, count: 70 });
      group.add(jet.points);
      const cycle = HAZARD.steam.on + HAZARD.steam.off;
      entry.step = (dt, now) => {
        const local = ((now + h.s.offset) % cycle + cycle) % cycle;
        const on = local < HAZARD.steam.on ? 1 : 0;
        jet.step(dt, on * entry.level);
      };
      sprites.push(jet);
    } else if (h.kind === 'gas') {
      const haze = makeHaze({ corners: fp.corners, count: 90, colour: 0x8fa580, opacity: 0.14, size: 0.55, y0: 0.15, y1: 2.4 });
      group.add(haze.points);
      const wheel = new THREE.Mesh(cylGeo(0.13, 0.13, 0.04, 8, 0.3), kit.mat.brass);
      wheel.position.set(h.valve.x, h.valve.y, h.valve.z);
      wheel.rotation.set(Math.PI / 2, 0, 0); wheel.rotation.y = yawOf(h.valve.nx, h.valve.nz);
      const stub = new THREE.Mesh(cylGeo(0.05, 0.05, 0.3, 6, 0.3), kit.mat.rust);
      stub.position.set(h.valve.x - h.valve.nx * 0.12, h.valve.y, h.valve.z - h.valve.nz * 0.12);
      stub.rotation.z = Math.PI / 2; stub.rotation.y = yawOf(h.valve.nx, h.valve.nz);
      group.add(wheel, stub);
      entry.step = (dt) => haze.step(dt, entry.level);
      sprites.push(haze);
    } else if (h.kind === 'fire') {
      const flames = makeFlames({ corners: fp.corners, count: 64, colour: 0xff7a1c });
      group.add(flames.points);
      const scorch = new THREE.Mesh(new THREE.PlaneGeometry(h.length + 0.6, h.half + 0.5), new THREE.MeshBasicMaterial({ color: 0x0a0806, transparent: true, opacity: 0.7, depthWrite: false }));
      const cx = fp.corners.reduce((s, c) => s + c.x, 0) / 4; const cz = fp.corners.reduce((s, c) => s + c.z, 0) / 4;
      scorch.position.set(cx, 0.014, cz); scorch.rotation.x = -Math.PI / 2; scorch.rotation.z = h.axis === 'z' ? 0 : Math.PI / 2;
      scorch.userData.noBake = true;
      group.add(scorch);
      const fi = fixtures.length;
      fixtures.push({ x: cx, y: 0.7, z: cz, colour: [1, 0.48, 0.11], radius: 2.4, intensity: 3.4, cutoff: 3, flicker: true, dead: false, kind: 'fire', run: h.run, progress: h.progress, seed: (level * 4099 + fi * 17) >>> 0, phase: 0 });
      entry.fixture = fi;
      entry.step = (dt) => flames.step(dt, entry.level);
      sprites.push(flames);
    } else if (h.kind === 'electric') {
      const puddle = new THREE.Mesh(readyGeometry(new THREE.CircleGeometry(h.puddleR, 10)), kit.mat.water);
      puddle.position.set(h.x, 0.012, h.z); puddle.rotation.x = -Math.PI / 2;
      group.add(puddle);
      const box = new THREE.Mesh(boxGeo(0.32, 0.42, 0.16, 0.4), kit.mat.steel);
      box.position.set(h.box.x, h.box.y, h.box.z); box.rotation.y = yawOf(h.box.nx, h.box.nz);
      group.add(box);
      
      
      const w = makeWire(h.cable.x, h.cable.z, H - h.cable.tip, level * 3.1 + h.progress);
      w.hazard = h.id;
      ctx.wires.push(w);
      group.add(w.line);
      entry.wire = w;
    }
    hazards.push(entry);
  }

  
  const lamps = [];
  const lampMat = (colour) => new THREE.MeshBasicMaterial({ color: colour, fog: false });
  fixtures.forEach((f, i) => {
    if (f.kind === 'prop' || f.kind === 'fire') return;
    const c = new THREE.Color(f.colour[0], f.colour[1], f.colour[2]);
    const g = new THREE.Group();
    g.position.set(f.x, H, f.z);
    let face; let mat;
    if (f.kind === 'room' || f.kind === 'safe') {
      mat = lampMat(c);
      face = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), mat);
      face.rotation.x = Math.PI / 2; face.position.y = -0.03;
      g.add(face);
      const frame = new THREE.Mesh(boxGeo(1.0, 0.05, 1.0, 0.5), kit.mat.steel);
      frame.position.y = -0.02; g.add(frame);
    } else if (f.kind === 'fluorescent') {
      const chan = new THREE.Mesh(boxGeo(1.3, 0.08, 0.2, 0.5), kit.mat.steel);
      chan.position.y = -0.05; g.add(chan);
      mat = lampMat(c);
      face = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.05, 0.1), mat);
      face.position.y = -0.11; g.add(face);
    } else if (f.kind === 'emergency') {
      const cage = new THREE.Mesh(boxGeo(0.3, 0.14, 0.3, 0.4), kit.mat.rust);
      cage.position.y = -0.08; g.add(cage);
      mat = lampMat(c);
      face = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.1, 0.18), mat);
      face.position.y = -0.2; g.add(face);
    } else {
      
      const shade = new THREE.Mesh(cylGeo(0.12, 0.26, 0.16, 8, 0.3, { open: true }), kit.mat.steel);
      shade.position.y = -0.12; g.add(shade);
      mat = lampMat(c);
      face = new THREE.Mesh(new THREE.CircleGeometry(0.2, 8), mat);
      face.rotation.x = Math.PI / 2; face.position.y = -0.2; g.add(face);
    }
    
    if (f.run >= 0 && deck.runs[f.run] && f.kind === 'fluorescent') {
      const run = deck.runs[f.run];
      g.rotation.y = Math.atan2(run.x1 - run.x0, run.z1 - run.z0) + Math.PI / 2;
    }
    face.userData.noBake = true;
    group.add(g);
    lamps.push({ i, mat, face, colour: c, dead: f.dead, level: 1 });
  });

  
  const dust = makeDust(fixtures.filter((f) => (f.kind === arch.lights.kind || f.kind === 'bay') && f.intensity > 0), H);
  if (dust) group.add(dust.points);

  
  const shell = buildShell(deck);
  group.add(shell);

  
  group.updateMatrixWorld(true);
  const surfaces = [];
  const byFixture = new Map();
  let vertices = 0;
  group.traverse((o) => {
    if (!o.isMesh || !o.geometry || !o.geometry.attributes || !o.geometry.attributes.aColor) return;
    const u = o.material && o.material.uniforms;
    if (!u || !u.uPrelit) return;
    if (!bakeable(o)) return;
    const geo = o.geometry;
    const P = transformPoints(geo.attributes.position.array, o.matrixWorld.elements);
    const N = geo.attributes.normal ? transformNormals(geo.attributes.normal.array, o.matrixWorld.elements) : null;
    const textured = !!u.uMap;
    const albedo = textured ? null : Float32Array.from(geo.attributes.aColor.array);
    const bake = bakeSurface(P, N, fixtures, { visible });
    const s = { mesh: o, attr: geo.attributes.aColor, bake, albedo, fixtures: new Set(bake.parts.map((p) => p.f)) };
    surfaces.push(s);
    vertices += bake.n;
    for (const fi of s.fixtures) { if (!byFixture.has(fi)) byFixture.set(fi, []); byFixture.get(fi).push(s); }
  });

  
  const schedules = fixtures.map((f) => (f.kind === 'fire'
    ? flickerSchedule(f.seed, 900, { rate: 30, wobble: 0.28, meanGap: 0.6, depth: [0.15, 0.45], floor: 0.35 })
    : flickerFor(f)));
  const overrides = new Array(fixtures.length).fill(null);
  const levels = new Float32Array(fixtures.length).fill(1);
  const last = new Float32Array(fixtures.length).fill(-1);
  let modeName = 'normal';
  let mode = LIGHT_MODES.normal;

  const recombine = (s) => {
    combineLight(s.bake, levels, s.attr.array, s.albedo, mode);
    s.attr.needsUpdate = true;
  };
  const recombineAll = () => { for (const s of surfaces) recombine(s); };
  const paintLamps = () => {
    for (const l of lamps) {
      const k = l.dead ? 0.1 : (0.2 + 0.8 * Math.min(1, levels[l.i])) * (mode.scale < 0.2 ? 0.15 : 1);
      l.mat.color.setRGB(l.colour.r * k * mode.tint[0], l.colour.g * k * mode.tint[1], l.colour.b * k * mode.tint[2]);
    }
  };
  recombineAll();
  paintLamps();

  const look = {
    fixtures, lamps, surfaces, hazards, dust, shell, schedules, levels,
    get mode() { return modeName; },
    setMode(name) {
      const m = LIGHT_MODES[name];
      if (!m || name === modeName) return modeName;
      modeName = name; mode = m;
      recombineAll(); paintLamps();
      return modeName;
    },
    
    override(i, k) { overrides[i] = k; last[i] = -1; },
    












    lightAt(out, x, y, z) {
      const c = moverTint(sampleLight(x, y, z, fixtures, levels, { visible, mode }));
      out.set(c[0], c[1], c[2]);
      return out;
    },
    
    fieldAt(x, y, z) { return sampleLight(x, y, z, fixtures, levels, { visible, mode }); },
    step(now, dt, { calm = false } = {}) {
      
      for (const hz of hazards) if (hz.fixture !== undefined) overrides[hz.fixture] = hz.level;
      if (calm) { for (let i = 0; i < levels.length; i += 1) levels[i] = overrides[i] === null || overrides[i] === undefined ? 1 : overrides[i]; } else levelsAt(fixtures, schedules, now, levels, overrides);
      let any = false;
      const touched = new Set();
      for (let i = 0; i < levels.length; i += 1) {
        if (Math.abs(levels[i] - last[i]) < 1e-4) continue;
        last[i] = levels[i]; any = true;
        const list = byFixture.get(i);
        if (list) for (const s of list) touched.add(s);
      }
      if (any) { for (const s of touched) recombine(s); paintLamps(); }
      if (dust) dust.step(dt, now);
      for (const hz of hazards) if (hz.step) hz.step(dt, now);
    },
    
    stats(camera) {
      const ls = lookState();
      const st = {
        fixtures: fixtures.length,
        lit: fixtures.filter((f) => f.intensity > 0).length,
        flickering: schedules.filter(Boolean).length,
        dead: fixtures.filter((f) => f.dead).length,
        textures: kitTextureCount(kit),
        fogNear: ls.fogNear, fogFar: ls.fogFar, mode: modeName,
        surfaces: surfaces.length, vertices, hazards: hazards.map((h) => h.kind),
        archetype: arch.name,
        dimmed: lamps.filter((l) => !l.dead && levels[l.i] < LIGHT.dimmedAt).length,
      };
      if (camera && deck.runs.length) {
        
        
        
        
        const r0 = deck.runs[0];
        const wx = r0.x1; const wz = r0.z1 + deck.width / 2;
        const at = (y) => {
          const v = new THREE.Vector3(wx, y, wz);
          v.project(camera);
          return { sx: +((v.x + 1) / 2).toFixed(3), sy: +((1 - v.y) / 2).toFixed(3), inFront: v.z < 1 };
        };
        const c = at(H / 2); const foot = at(0); const top = at(H);
        st.endWall = {
          sx: c.sx, sy: c.sy, footY: foot.sy, topY: top.sy,
          dist: +Math.hypot(wx - camera.position.x, H / 2 - camera.position.y, wz - camera.position.z).toFixed(1),
          inFront: c.inFront && foot.inFront,
        };
      }
      return st;
    },
    dispose() {
      if (dust) dust.points.geometry.dispose();
      for (const s of sprites) s.points.geometry.dispose();
      shell.geometry.dispose();
    },
  };
  return look;
}






function makeJet({ x, y, z, nx, nz, reach, colour, opacity, size, count }) {
  const pos = new Float32Array(count * 3);
  const life = new Float32Array(count);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: colour, size, sizeAttenuation: true, transparent: true, opacity: 0, depthWrite: false, map: sparkSprite() });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  for (let i = 0; i < count; i += 1) life[i] = hash2(i * 3.3, 1.7);
  let on = 0;
  return {
    points,
    step(dt, want) {
      on += (want - on) * Math.min(1, dt * 6);
      mat.opacity = opacity * on;
      if (on < 0.02) return;
      for (let i = 0; i < count; i += 1) {
        life[i] += dt * 1.6;
        if (life[i] > 1) life[i] -= 1;
        const t = life[i];
        const travel = reach * (1 - Math.exp(-2.8 * t)) / (1 - Math.exp(-2.8));
        const spread = 0.12 + t * 0.55;
        const s = i * 7.7;
        pos[i * 3] = x + nx * travel + (hash2(s, 1.1) - 0.5) * spread;
        pos[i * 3 + 1] = y + t * 0.5 + (hash2(s, 2.2) - 0.5) * spread;
        pos[i * 3 + 2] = z + nz * travel + (hash2(s, 3.3) - 0.5) * spread;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}


function makeHaze({ corners, count, colour, opacity, size, y0, y1 }) {
  const pos = new Float32Array(count * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: colour, size, sizeAttenuation: true, transparent: true, opacity, depthWrite: false, map: sparkSprite() });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  const ax = corners[1].x - corners[0].x; const az = corners[1].z - corners[0].z;
  const bx = corners[3].x - corners[0].x; const bz = corners[3].z - corners[0].z;
  const seeds = new Float32Array(count * 2);
  for (let i = 0; i < count; i += 1) { seeds[i * 2] = hash2(i * 1.3, 4.4); seeds[i * 2 + 1] = hash2(i * 2.1, 5.5); }
  return {
    points,
    step(dt, level) {
      mat.opacity = opacity * Math.max(0, Math.min(1, level));
      const t = performance.now() / 1000;
      for (let i = 0; i < count; i += 1) {
        const u = (seeds[i * 2] + Math.sin(t * 0.13 + i) * 0.06 + 1) % 1;
        const v = (seeds[i * 2 + 1] + Math.cos(t * 0.11 + i * 0.7) * 0.06 + 1) % 1;
        pos[i * 3] = corners[0].x + ax * u + bx * v;
        pos[i * 3 + 1] = y0 + (y1 - y0) * ((hash2(i, 9.9) + t * 0.04) % 1);
        pos[i * 3 + 2] = corners[0].z + az * u + bz * v;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}


function makeFlames({ corners, count, colour }) {
  const pos = new Float32Array(count * 3);
  const life = new Float32Array(count);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({ color: colour, size: 0.38, sizeAttenuation: true, transparent: true, opacity: 0.85, depthWrite: false, map: sparkSprite(), blending: THREE.AdditiveBlending });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  const ax = corners[1].x - corners[0].x; const az = corners[1].z - corners[0].z;
  const bx = corners[3].x - corners[0].x; const bz = corners[3].z - corners[0].z;
  for (let i = 0; i < count; i += 1) life[i] = hash2(i * 2.2, 6.6);
  return {
    points,
    step(dt, level) {
      mat.opacity = 0.85 * Math.max(0, Math.min(1, level));
      for (let i = 0; i < count; i += 1) {
        life[i] += dt * (1.4 + hash2(i, 1.2) * 0.8);
        if (life[i] > 1) life[i] -= 1;
        const t = life[i];
        const u = hash2(i * 3.1, 7.7); const v = hash2(i * 1.7, 8.8);
        pos[i * 3] = corners[0].x + ax * u + bx * v + Math.sin(t * 9 + i) * 0.08;
        pos[i * 3 + 1] = 0.05 + t * t * 1.1 * level;
        pos[i * 3 + 2] = corners[0].z + az * u + bz * v + Math.cos(t * 7 + i) * 0.08;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}


function makeDust(fixtures, H) {
  const per = 10;
  const count = fixtures.length * per;
  if (!count) return null;
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const home = new Float32Array(count * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  fixtures.forEach((f, k) => {
    for (let j = 0; j < per; j += 1) {
      const i = k * per + j;
      const a = hash2(i, 1.1) * Math.PI * 2; const r = Math.sqrt(hash2(i, 2.2)) * 1.3;
      home[i * 3] = f.x + Math.cos(a) * r; home[i * 3 + 1] = 0.5 + hash2(i, 3.3) * (H - 1.0); home[i * 3 + 2] = f.z + Math.sin(a) * r;
      col[i * 3] = f.colour[0] * 0.55; col[i * 3 + 1] = f.colour[1] * 0.55; col[i * 3 + 2] = f.colour[2] * 0.55;
    }
  });
  const mat = new THREE.PointsMaterial({ size: 0.05, sizeAttenuation: true, transparent: true, opacity: 0.6, depthWrite: false, map: sparkSprite(), blending: THREE.AdditiveBlending, vertexColors: true });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.userData.noBake = true;
  return {
    points,
    step(dt, now) {
      for (let i = 0; i < count; i += 1) {
        const s = i * 0.37;
        pos[i * 3] = home[i * 3] + Math.sin(now * 0.21 + s) * 0.25 + Math.sin(now * 0.9 + s * 3) * 0.04;
        pos[i * 3 + 1] = home[i * 3 + 1] + Math.sin(now * 0.17 + s * 2) * 0.18;
        pos[i * 3 + 2] = home[i * 3 + 2] + Math.cos(now * 0.19 + s) * 0.25 + Math.cos(now * 0.8 + s * 2) * 0.04;
      }
      geo.attributes.position.needsUpdate = true;
    },
  };
}
