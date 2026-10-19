










import * as THREE from 'three';
import { LANTERN } from '../sim/abilities.js';
import { LIGHT_COLOURS, lightAt } from '../sim/light.js';

const PINK = 0xff2fa0;
const NIGHT_HEMI = 0.55; 
const NIGHT_MOON = 0.7; 
const MAX_DISCS = 24;
const MAX_LIGHTS = 6;
const MAX_FLIES = 256;
const TRAIL_DRAWN = 24;
const TILE_GLOW = 0.38; 
const ENTITY_GLOW = 0.35;
const NIGHTIFIED = new WeakSet();


function nightify(obj, k) {
  obj.updateMatrixWorld(true);
  const wp = new THREE.Vector3();
  obj.traverse((o) => {
    if (o.isMesh && o.getWorldPosition(wp).z < -4) return; 
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats)
      if (m.isMeshLambertMaterial && !NIGHTIFIED.has(m)) {
        NIGHTIFIED.add(m);
        m.emissive.copy(m.color).multiplyScalar(k).add(m.emissive);
      }
  });
}


function nightBrightness() {
  let v = null;
  try {
    v = new URLSearchParams(location.search).get('night') ?? localStorage.getItem('space95.night');
  } catch {
    v = null;
  }
  let k = Number.parseFloat(v ?? '1');
  if (!Number.isFinite(k)) k = 1;
  if (k > 3) k /= 100; 
  return Math.min(2, Math.max(0.5, k));
}

let glowTex = null;

function glowTexture() {
  if (glowTex) return glowTex;
  const c = document.createElement('canvas');
  c.width = 64;
  c.height = 64;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.55)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  glowTex = new THREE.CanvasTexture(c);
  glowTex.colorSpace = THREE.SRGBColorSpace;
  return glowTex;
}

const additive = (color, opacity = 1) =>
  new THREE.MeshBasicMaterial({
    color,
    map: glowTexture(),
    transparent: true,
    opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

function nightSky() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, '#1a1540');
  grad.addColorStop(0.65, '#2e2866');
  grad.addColorStop(1, '#4a3f7a');
  g.fillStyle = grad;
  g.fillRect(0, 0, 4, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}


function columnTop(world, c) {
  for (let r = world.height - 1; r >= 0; r--) if (world.solid(c, r)) return (r + 1) * world.tile;
  return null;
}





function bandMesh(world, x0, x1, color, rise) {
  const T = world.tile;
  const col = new THREE.Color(color);
  const pos = [];
  const cols = [];
  for (let c = Math.floor(x0 / T); c * T < x1; c++) {
    const top = columnTop(world, c);
    if (top === null) continue;
    const a = Math.max(x0, c * T);
    const b = Math.min(x1, (c + 1) * T);
    const y0 = top - 0.25;
    const y1 = top + rise;
    pos.push(a, y0, 0.32, b, y0, 0.32, b, y1, 0.32, a, y0, 0.32, b, y1, 0.32, a, y1, 0.32);
    for (const k of [1, 1, 0, 1, 0, 0]) cols.push(col.r * k, col.g * k, col.b * k);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const m = new THREE.Mesh(
    geo,
    new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }),
  );
  m.renderOrder = 2;
  return m;
}


function moonRims(world) {
  const T = world.tile;
  const pos = [];
  const h = 0.09;
  for (let r = 0; r < world.height; r++) {
    let c = 0;
    while (c < world.width) {
      const open = (k) => (world.solid(k, r) || world.oneWay(k, r)) && !world.solid(k, r + 1);
      if (!open(c)) {
        c++;
        continue;
      }
      let e = c + 1;
      while (e < world.width && open(e)) e++;
      const a = c * T;
      const b = e * T;
      const y1 = (r + 1) * T + 0.01;
      const y0 = y1 - h;
      pos.push(a, y0, 0.34, b, y0, 0.34, b, y1, 0.34, a, y0, 0.34, b, y1, 0.34, a, y1, 0.34);
      c = e;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xd8d2ff, transparent: true, opacity: 0.75, depthWrite: false }));
}


export function nightEntityView(e, g) {
  const lam = (color, emissive = 0x000000) => new THREE.MeshLambertMaterial({ color, emissive });
  if (e.kind === 'bud') {
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.7, 6), lam(0x3f6b3a, 0x0e1a0c));
    stem.position.y = 0.35;
    const bud = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), lam(0xdfe8c8, 0x2a3318));
    bud.scale.set(0.9, 1.25, 0.9);
    bud.position.y = 0.95;
    bud.name = 'budBody';
    const core = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), additive(LIGHT_COLOURS.firefly, 0.55));
    core.position.set(0, 0.95, 0.5);
    core.name = 'budCore';
    g.add(stem, bud, core);
    return true;
  }
  if (e.kind === 'bloomGate') {
    const w = e.w ?? 8;
    const h = e.h ?? 12;
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, h * 0.55, 8), lam(0x3f6b3a, 0x0e1a0c));
    stem.position.set(0, h * 0.275, -0.6);
    const head = new THREE.Group();
    head.name = 'gateHead';
    head.position.set(0, h * 0.62, -0.4);
    const petalMat = lam(0xeeeaff, 0x302c50);
    for (let i = 0; i < 7; i++) {
      const pet = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), petalMat);
      pet.scale.set(w * 0.14, h * 0.2, 0.5);
      pet.userData.a = -1.2 + (i * 2.4) / 6;
      pet.name = `petal${i}`;
      head.add(pet);
    }
    const heart = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, w * 0.9), additive(LIGHT_COLOURS.firefly, 0));
    heart.position.z = 0.9;
    heart.name = 'gateHeart';
    head.add(heart);
    g.add(stem, head);
    return true;
  }
  if (e.kind === 'sprite' && e.ghost) {
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), new THREE.MeshBasicMaterial({ color: LIGHT_COLOURS.specimen }));
    body.position.y = 0.3;
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.2), additive(LIGHT_COLOURS.specimen, 0.7));
    halo.position.set(0, 0.3, 0.3);
    halo.name = 'ghostHalo';
    g.add(body, halo);
    return true;
  }
  if (e.kind === 'sprite') {
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.36, 4, 8), lam(0x3a3450, 0x15122a));
    body.rotation.z = Math.PI / 2;
    body.position.set(0.1, 0.36, 0);
    const abd = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), new THREE.MeshBasicMaterial({ color: LIGHT_COLOURS.firefly }));
    abd.position.set(-0.28, 0.3, 0.05);
    abd.name = 'abdomen';
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), additive(LIGHT_COLOURS.firefly, 0.6));
    glow.position.set(-0.28, 0.3, 0.3);
    glow.name = 'spriteGlow';
    
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.18, 5), new THREE.MeshBasicMaterial({ color: 0xe6ff9a }));
    crown.position.set(0.32, 0.6, 0);
    const wing = new THREE.Mesh(
      new THREE.PlaneGeometry(0.5, 0.25),
      new THREE.MeshBasicMaterial({ color: 0xcfd8ff, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    );
    wing.position.set(0.05, 0.58, -0.05);
    wing.name = 'wing';
    g.add(body, abd, glow, crown, wing);
    return true;
  }
  if (e.kind === 'finish' && e.bloomGate) {
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.35, 14, 10), new THREE.MeshBasicMaterial({ color: LIGHT_COLOURS.navLamp }));
    lamp.position.y = 0.6;
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(3, 3), additive(LIGHT_COLOURS.navLamp, 0.8));
    glow.position.set(0, 0.6, 0.3);
    glow.name = 'navBlink';
    g.add(lamp, glow);
    return true;
  }
  return false;
}





export function createNight(scene, level, h) {
  if (!level.dark) return null;
  const world = level.world;
  let k = nightBrightness();
  scene.background = nightSky();
  
  scene.fog = new THREE.Fog(0x1d1838, 26, 120);
  h.hemi.color.set(0x6a70d8);
  h.hemi.groundColor.set(0x2a2040);
  h.sun.color.set(LIGHT_COLOURS.moon);
  h.sun.position.set(-8, 16, 12); 
  nightify(scene, TILE_GLOW);
  let moonBase = NIGHT_MOON * k;
  h.hemi.intensity = NIGHT_HEMI * k;
  h.sun.intensity = moonBase;

  const group = new THREE.Group();
  scene.add(group);
  group.add(moonRims(world));

  
  const moonDisc = new THREE.Mesh(new THREE.CircleGeometry(1.5, 32), new THREE.MeshBasicMaterial({ color: 0xe6e2ff, fog: false }));
  const moonHalo = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), additive(LIGHT_COLOURS.moon, 0.35));
  moonHalo.material.fog = false;
  const cloud = new THREE.Mesh(
    new THREE.CircleGeometry(4.5, 24),
    new THREE.MeshBasicMaterial({ color: 0x2a2450, transparent: true, opacity: 0, fog: false }),
  );
  cloud.scale.set(1.8, 0.7, 1);
  scene.add(moonDisc, moonHalo, cloud);

  
  const bands = [];
  for (const m of level.moons ?? []) {
    const mesh = bandMesh(world, m.x0, m.x1, LIGHT_COLOURS.moon, 2.6);
    group.add(mesh);
    bands.push({ kind: 'moon', x0: m.x0, x1: m.x1, mesh, o: 0 });
  }
  for (const l of level.lamps ?? [])
    if (l.security && l.cover) {
      const mesh = bandMesh(world, l.cover[0], l.cover[1], LIGHT_COLOURS.security, 4.5);
      group.add(mesh);
      bands.push({ kind: 'security', id: l.id, x0: l.cover[0], x1: l.cover[1], mesh, o: 0 });
    }

  
  const lampHeads = (level.lamps ?? []).map((l) => {
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), new THREE.MeshBasicMaterial({ color: 0x55546a }));
    head.position.set(l.x, l.y, -0.2);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 6), new THREE.MeshLambertMaterial({ color: 0x4a4860 }));
    pole.position.set(l.x, l.y - 1.4, -0.3);
    group.add(head, pole);
    return { l, head };
  });

  
  const tipMat = new THREE.MeshBasicMaterial({ color: PINK });
  const tipGeo = new THREE.ConeGeometry(0.11, 0.42, 4);
  const stemMat = new THREE.MeshLambertMaterial({ color: 0x2c3a28, emissive: 0x0c120a });
  for (const sp of (level.sparks ?? []).filter((s) => s.skin === 'thorn')) {
    const stem = new THREE.Mesh(new THREE.BoxGeometry(sp.x1 - sp.x0, 0.22, 0.4), stemMat);
    stem.position.set((sp.x0 + sp.x1) / 2, sp.y0 + 0.11, 0.2);
    group.add(stem);
    for (let x = sp.x0 + 0.3; x < sp.x1; x += 0.6) {
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.position.set(x, sp.y1 + 0.12, 0.36);
      tip.rotation.z = Math.sin(x * 7) * 0.35;
      group.add(tip);
    }
  }

  
  const padMat = new THREE.MeshLambertMaterial({ color: 0xf2eeff, emissive: 0x9a94c8 });
  const stubMat = new THREE.MeshLambertMaterial({ color: 0xc8d8a8, emissive: 0x6a7a50 });
  const pads = (level.blooms ?? []).map((b) => {
    const g = new THREE.Group();
    g.position.set(b.x, b.y, 0);
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.4, 6), new THREE.MeshLambertMaterial({ color: 0x3f6b3a }));
    stem.position.set(0, -0.85, -0.1);
    const stub = new THREE.Mesh(new THREE.BoxGeometry(b.stub ?? 1, 0.2, 0.9), stubMat);
    stub.position.y = -0.1;
    const deck = new THREE.Mesh(new THREE.BoxGeometry(1, 0.14, 1.1), padMat);
    deck.position.y = -0.07;
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1.4), additive(0xe8e4ff, 0));
    glow.position.set(0, 0.25, 0.4);
    g.add(stem, stub, deck, glow);
    group.add(g);
    return { b, deck, glow };
  });

  
  const ivy = (level.ivy ?? []).map((v) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.max(0.5, v.x1 - v.x0), v.y1 - v.y0),
      new THREE.MeshLambertMaterial({ color: 0x6a58a0, transparent: true, opacity: 1, depthWrite: false }),
    );
    m.position.set((v.x0 + v.x1) / 2, (v.y0 + v.y1) / 2, 0.36);
    group.add(m);
    return { v, m };
  });

  
  const discs = [];
  for (let i = 0; i < MAX_DISCS; i++) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), additive(0xffffff, 0));
    m.position.z = 0.33;
    m.renderOrder = 3;
    m.visible = false;
    group.add(m);
    discs.push({ m, key: null, o: 0 });
  }
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), additive(LIGHT_COLOURS.lantern, 0.32));
  glow.position.z = 0.33;
  group.add(glow);
  const lights = [];
  for (let i = 0; i < MAX_LIGHTS; i++) {
    const L = new THREE.PointLight(0xffffff, 0, 10, 1.4);
    L.position.z = 2;
    scene.add(L);
    lights.push(L);
  }

  
  const flyPos = new Float32Array(MAX_FLIES * 3);
  const flyGeo = new THREE.BufferGeometry();
  flyGeo.setAttribute('position', new THREE.BufferAttribute(flyPos, 3));
  const flies = new THREE.Points(
    flyGeo,
    new THREE.PointsMaterial({
      color: LIGHT_COLOURS.firefly,
      size: 0.55,
      map: glowTexture(),
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  flies.frustumCulled = false;
  group.add(flies);

  
  const ringGeo = new THREE.RingGeometry(0.92, 1, 48);
  const rings = new Map();
  const flashes = [];
  const flash = (x, y, r, color, life) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2 * r, 2 * r), additive(color, 0));
    m.position.set(x, y, 0.4);
    group.add(m);
    flashes.push({ m, t: 0, life });
  };

  const colourOf = (q) =>
    q.kind === 'lamp'
      ? LIGHT_COLOURS.solarLamp
      : q.kind === 'lantern'
        ? LIGHT_COLOURS.lantern
        : q.kind === 'security'
          ? LIGHT_COLOURS.security
          : LIGHT_COLOURS.firefly;

  let t = 0;
  return {
    
    get hemiBase() {
      return NIGHT_HEMI * k;
    },
    
    update(s, dt, camera) {
      
      if (Math.floor(t) !== Math.floor(t + dt)) {
        k = nightBrightness();
        moonBase = NIGHT_MOON * k;
      }
      t += dt;
      const L = s.light;
      const p = s.player;
      const ramp = (o, target, sec) => o + Math.sign(target - o) * Math.min(Math.abs(target - o), dt / sec);
      
      const moonK = !L ? 1 : L.moon === 'cover' ? 0 : L.moon === 'warn' ? 0.55 : 1;
      const cx = camera.position.x;
      moonDisc.position.set(cx - 16, camera.position.y + 14, -60);
      moonHalo.position.set(cx - 16, camera.position.y + 14, -59.5);
      moonHalo.material.opacity = 0.12 + 0.28 * moonK;
      moonDisc.material.color.setScalar(0.55 + 0.45 * moonK).multiply(new THREE.Color(0xe6e2ff));
      cloud.position.set(cx - 16 + (L?.moon === 'out' ? 14 : 0), camera.position.y + 14, -58);
      cloud.material.opacity = ramp(cloud.material.opacity, L?.moon === 'out' ? 0 : 0.95, 0.5);
      h.sun.intensity = moonBase * (0.45 + 0.55 * moonK) * (s.lightsOut ? 0.25 : 1);
      
      const src = L?.sources ?? [];
      for (const B of bands) {
        const on = src.some((q) => q.kind === B.kind && q.x0 === B.x0 && q.x1 === B.x1);
        const warn = B.kind === 'moon' && L?.moon === 'warn' ? 0.6 : 1;
        B.o = ramp(B.o, on ? warn : 0, 0.3);
        B.mesh.material.opacity = B.o * 0.45;
        B.mesh.visible = B.o > 0.01;
      }
      for (const H of lampHeads) {
        const on = H.l.security ? !!L?.security?.on : !!L?.lampsOn?.[H.l.id];
        H.head.material.color.setHex(on ? colourOf({ kind: H.l.security ? 'security' : 'lamp' }) : 0x55546a);
      }
      
      const circles = src.filter((q) => q.r !== undefined);
      const want = new Map(circles.map((q) => [`${q.kind}:${q.id ?? ''}`, q]));
      for (const D of discs) if (D.key && !want.has(D.key)) D.key = `~${D.key}`; 
      for (const [key, q] of want) {
        let D = discs.find((d) => d.key === key || d.key === `~${key}`);
        if (!D) D = discs.find((d) => !d.key || (d.key.startsWith('~') && d.o <= 0.01));
        if (!D) continue;
        if (D.key !== key && !D.key?.startsWith('~')) D.o = 0;
        D.key = key;
        D.q = q;
      }
      for (const D of discs) {
        if (!D.key) {
          D.m.visible = false;
          continue;
        }
        const live = !D.key.startsWith('~');
        D.o = ramp(D.o, live ? 1 : 0, 0.2);
        if (!live && D.o <= 0.01) {
          D.key = null;
          D.m.visible = false;
          continue;
        }
        const q = D.q;
        const r = Math.max(0.5, q.r) * 1.15; 
        D.m.visible = true;
        D.m.position.set(q.x, q.y, 0.33);
        D.m.scale.set(r, r, 1);
        D.m.material.color.setHex(colourOf(q));
        D.m.material.opacity = D.o * (q.kind === 'perch' ? 0.55 + 0.08 * Math.sin(t * 4) : 0.6);
      }
      const near = circles
        .map((q) => ({ q, d: Math.hypot(q.x - p.x, q.y - p.y) - q.r }))
        .sort((a, b) => a.d - b.d)
        .slice(0, MAX_LIGHTS);
      lights.forEach((PL, i) => {
        const n = near[i];
        if (!n) {
          PL.intensity = 0;
          return;
        }
        PL.color.setHex(colourOf(n.q));
        PL.position.set(n.q.x, n.q.y, 2);
        PL.distance = n.q.r * 1.8;
        PL.intensity = 2 + n.q.r;
      });
      
      const lan = p.lantern;
      if (lan) {
        const dimR = lan.dazzle > 0 ? LANTERN.DAZZLED_GLOW : LANTERN.GLOW;
        const gr = Math.max(dimR, Math.min(lan.r, LANTERN.GLOW)) * 1.45; 
        glow.visible = true;
        glow.position.set(p.x + 0.6 * p.facing, p.y + p.h / 2, 0.33);
        glow.scale.set(gr, gr, 1);
        glow.material.opacity = lan.dazzle > 0 ? 0.16 : 0.22;
        if (lan.raised || lan.r > LANTERN.GLOW + 1e-6) {
          
          h.bolt.group.position.set(p.x, p.y + p.h / 2 + LANTERN.RAISE_Y, 0.4);
        }
      } else glow.visible = false;
      
      for (const P of pads) {
        const st = s.blooms?.find((b) => b.id === P.b.id);
        const u = st?.u ?? 0;
        const stub = P.b.stub ?? 1;
        const w = stub + ((P.b.w ?? 4) - stub) * u;
        P.deck.scale.x = Math.max(0.01, w);
        P.deck.visible = u > 0.02;
        P.glow.scale.x = w;
        P.glow.material.opacity = 0.35 * u;
      }
      for (const I of ivy) {
        const shown = !!L?.ivyShown?.[I.v.id];
        I.m.material.color.setHex(shown ? 0x2f6b3a : 0x6a58a0);
        I.m.material.opacity = shown ? 0.5 + 0.08 * Math.sin(t * 2.3) : 1;
        I.m.rotation.y = shown ? Math.sin(t * 1.7) * 0.08 : 0;
      }
      
      let n = 0;
      const put = (f) => {
        if (n >= MAX_FLIES) return;
        flyPos[n * 3] = f.x;
        flyPos[n * 3 + 1] = f.y;
        flyPos[n * 3 + 2] = 0.45;
        n++;
      };
      const F = s.flock;
      if (F) {
        for (const sw of F.swarms) for (const f of sw.flies) put(f);
        for (let i = 0; i < Math.min(TRAIL_DRAWN, F.trail.length); i++) put(F.trail[i]);
        for (const b of F.bursts) {
          let R = rings.get(b);
          if (!R) {
            R = new THREE.Mesh(
              ringGeo,
              new THREE.MeshBasicMaterial({ color: LIGHT_COLOURS.firefly, transparent: true, opacity: 0, depthWrite: false }),
            );
            group.add(R);
            rings.set(b, R);
          }
          R.position.set(b.x, b.cy, 0.42);
          R.scale.setScalar(Math.max(0.2, b.r));
          R.material.opacity = Math.min(1, b.t / 0.2) * Math.max(0, 1 - b.t / 1.5) * 0.8;
        }
        for (const [b, R] of rings)
          if (!F.bursts.includes(b)) {
            group.remove(R);
            R.material.dispose();
            rings.delete(b);
          }
      }
      flyGeo.setDrawRange(0, n);
      flyGeo.attributes.position.needsUpdate = true;
      flies.material.opacity = 0.75 + 0.25 * Math.sin(t * 3);
      
      for (let i = flashes.length - 1; i >= 0; i--) {
        const f = flashes[i];
        f.t += dt;
        const q = f.t / f.life;
        f.m.material.opacity = 0.7 * Math.min(1, f.t / 0.05) * Math.max(0, 1 - q);
        if (q >= 1) {
          group.remove(f.m);
          f.m.material.dispose();
          f.m.geometry.dispose();
          flashes.splice(i, 1);
        }
      }
      
      
      for (const e of s.entities) {
        const v = h.views.get(e.id);
        if (!v) continue;
        if (e.hidden) v.visible = false;
        if (!v.userData.night) {
          v.userData.night = true;
          nightify(v, ENTITY_GLOW);
        }
        if (!v.userData.eyes && ['aphid', 'ladybot', 'pillbug', 'antPorter'].includes(e.kind)) {
          v.userData.eyes = true;
          const eye = new THREE.MeshBasicMaterial({ color: 0xffffff });
          for (const dz of [-0.08, 0.08]) {
            const m = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), eye);
            m.position.set(e.kind === 'aphid' ? 0.17 : 0.38, e.kind === 'aphid' ? 0.3 : 0.4, 0.2 + dz);
            v.add(m);
          }
        }
        if (e.kind === 'bud') {
          const body = v.getObjectByName('budBody');
          const core = v.getObjectByName('budCore');
          const lit = lightAt(s, e.x, e.y + (e.h ?? 1.5) / 2);
          if (e.state === 'bud') {
            body.scale.set(0.9, 1.25, 0.9);
            core.material.opacity = (lit ? 0.85 : 0.45) + 0.12 * Math.sin(t * 3 + e.x);
          } else if (e.state === 'popping') {
            body.scale.set(1.15, 1.05, 1.15);
            core.material.opacity = 1;
          } else {
            body.scale.set(1.3, 0.35, 1.3);
            core.material.opacity = 0;
          }
          body.material.emissive.setHex(lit ? 0x4a5530 : 0x2a3318);
        } else if (e.kind === 'sprite' && e.ghost) {
          v.visible = e.alive && e.stage !== 'gone';
          v.getObjectByName('ghostHalo').material.opacity = 0.6 + 0.05 * Math.sin(t * 2);
        } else if (e.kind === 'sprite') {
          const abd = v.getObjectByName('abdomen');
          const gl = v.getObjectByName('spriteGlow');
          const tele = e.stage === 'telegraph';
          abd.material.color.setHex(tele ? PINK : LIGHT_COLOURS.firefly);
          gl.material.color.setHex(tele ? PINK : LIGHT_COLOURS.firefly);
          gl.material.opacity = tele ? 0.75 : 0.35 + 0.3 * (Math.sin(t * 17 + e.x) > 0 ? 1 : 0.4);
          v.getObjectByName('wing').rotation.x = Math.sin(t * 40 + e.x) * 0.8;
          if (e.stage === 'fluster') v.rotation.z = Math.sin(t * 30) * 0.4;
        } else if (e.kind === 'bloomGate') {
          const head = v.getObjectByName('gateHead');
          const heart = v.getObjectByName('gateHeart');
          const FL = 1.2;
          const open = e.state === 'open' ? 1 : e.state === 'opening' ? Math.min(1, Math.max(0, (e.gt - 1) / FL)) : 0;
          for (let i = 0; i < 7; i++) {
            const pet = head.getObjectByName(`petal${i}`);
            const a = pet.userData.a * (0.25 + 0.75 * open);
            pet.position.set(Math.sin(a) * (0.6 + 3 * open), Math.cos(a) * (0.6 + 1.5 * open) - 1.2 * open, 0);
            pet.rotation.z = -a;
          }
          heart.material.opacity = e.state === 'closed' ? 0.15 : e.state === 'call' ? 0.4 + 0.2 * Math.sin(t * 8) : 0.4 + 0.5 * open;
        } else if (e.kind === 'finish' && e.bloomGate) {
          const b = v.getObjectByName('navBlink');
          b.material.opacity = Math.sin(t * 4) > 0 ? 0.85 : 0.25;
        }
      }
    },
    
    onEvent(e) {
      if (e.type === 'flockBurst') h.kick(0.04);
      if (e.type === 'budPop') for (let i = 0; i < 4; i++) h.spark(e.x - 0.4 + i * 0.27, e.y + 1.2, LIGHT_COLOURS.firefly, 0.5, 0.1);
      if (e.type === 'spriteFlash') flash(e.x, e.y + 0.3, Math.min(6, e.r ?? 6), 0xf4ffd8, 0.35);
      if (e.type === 'dazzled') for (let i = 0; i < 5; i++) h.spark(e.x + Math.cos(i * 1.3) * 0.6, e.y + 1.4, 0xffffff, 0.5, 0.08);
      if (e.type === 'spriteFluster') h.spark(e.x, e.y + 0.4, LIGHT_COLOURS.firefly, 0.5, 0.14);
      if (e.type === 'perch') h.spark(e.x, e.y + 0.5, LIGHT_COLOURS.firefly, 0.6, 0.12);
      if (e.type === 'bloom') {
        flash(e.x, e.y + 7, 7, LIGHT_COLOURS.firefly, 1.2);
        h.kick(0.06);
      }
      if (e.type === 'finishOpen')
        for (let i = 0; i < 6; i++) h.spark(e.x + Math.cos(i) * 0.8, e.y + 0.8 + Math.sin(i) * 0.6, LIGHT_COLOURS.navLamp, 0.8, 0.12);
      if (e.type === 'ghostBlink' || e.type === 'ghostAppear') h.spark(e.x, e.y + 0.3, LIGHT_COLOURS.specimen, 0.6, 0.14);
      if (e.type === 'thornHit') {
        h.kick(0.08);
        for (let i = 0; i < 4; i++) h.spark(e.x - 0.3 + i * 0.2, e.y + 0.2, PINK, 0.4, 0.08);
      }
      if (e.type === 'ivyRustle' || e.type === 'ivyShown')
        for (let i = 0; i < 3; i++) h.spark(e.x, e.y + 0.5 + i * 0.6, 0x7fcf7a, 0.5, 0.08);
      if (e.type === 'securityOn') h.kick(0.03);
    },
  };
}
