














import * as THREE from 'three';
import { lineOf } from '../sim/enemies/aunt.js';
import { harpOff, surfaceAt } from '../sim/web.js';

const PINK = 0xff2fa0;
const SILK = 0xf4f8ff;
const BAND = 0xc9d4ec;
const HUB_RIM = 0xffb760;
const STEP_U = 0.4; 
const BAND_H = 0.32; 
const EDGE_H = 0.07;
const SHADE_H = 0.06; 
const Z = 0.12;

const NIGHT = { top: 0x141033, bottom: 0x2b2152, fog: 0x2a2148, hemi: 0.8, sun: 0.9, sunColor: 0xb8b0ff };
const DAWN = { top: 0x8fc8ff, bottom: 0xffd2a8, fog: 0xffd9b8, hemi: 1.6, sun: 2.2, sunColor: 0xfff1d6 };

const basic = (color, opacity = 1) => new THREE.MeshBasicMaterial({ color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1 });


function strip(n, mat) {
  const pos = new Float32Array((n + 1) * 2 * 3);
  const idx = [];
  for (let i = 0; i < n; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setIndex(idx);
  const m = new THREE.Mesh(geo, mat);
  m.frustumCulled = false;
  return m;
}

function line(color, opacity = 1, n = 2) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
  const l = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity }));
  l.frustumCulled = false;
  return l;
}

function setLine(l, pts) {
  const p = l.geometry.attributes.position;
  for (let i = 0; i < pts.length; i++) p.setXYZ(i, pts[i][0], pts[i][1], pts[i][2] ?? Z);
  p.needsUpdate = true;
}

const lerp = (a, b, k) => a + (b - a) * k;
const mix = (a, b, k) => new THREE.Color(a).lerp(new THREE.Color(b), k);


function skyCanvas() {
  const c = document.createElement('canvas');
  c.width = 2;
  c.height = 256;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return {
    tex,
    draw(top, bottom) {
      const g = c.getContext('2d');
      const grad = g.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, `#${top.getHexString()}`);
      grad.addColorStop(1, `#${bottom.getHexString()}`);
      g.fillStyle = grad;
      g.fillRect(0, 0, 2, 256);
      tex.needsUpdate = true;
    },
  };
}


export function createSilk(scene, level, { sun, spark, views, jo }) {
  if (!level.webs?.length) return null;
  const group = new THREE.Group();
  scene.add(group);
  const harps = level.harps ?? [];

  
  const webs = level.webs.map((w, i) => {
    const n = Math.max(4, Math.ceil((w.x1 - w.x0) / STEP_U));
    const hub = !!w.hub;
    const band = strip(n, basic(hub ? 0xffd9a0 : BAND, 0.42));
    const edge = strip(n, basic(hub ? HUB_RIM : SILK));
    const shade = strip(n, basic(0x4a3c6c, 0.7));
    shade.renderOrder = 2;
    band.renderOrder = 2;
    edge.renderOrder = 3;
    group.add(shade, band, edge);
    const V = { w, i, n, band, edge, shade, pluck: 0 };
    if (w.net) {
      V.fringe = new THREE.LineSegments(
        new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array((n + 1) * 6), 3)),
        new THREE.LineBasicMaterial({ color: BAND, transparent: true, opacity: 0.55 }),
      );
      V.fringe.frustumCulled = false;
      group.add(V.fringe);
    }
    if (w.harp) {
      const h = harps.find((x) => x.id === w.harp);
      if (h?.aunt) {
        V.thread = line(SILK, 0.35);
        V.harpAt = h.aunt;
        group.add(V.thread);
      }
    }
    
    for (const [ax, ay, dir] of [
      [w.x0, w.y0, -1],
      [w.x1, w.y1, 1],
    ]) {
      const g = line(BAND, 0.3);
      setLine(g, [
        [ax, ay, -0.3],
        [ax + dir * 1.2, ay + 1.6, -0.6],
      ]);
      group.add(g);
    }
    return V;
  });

  
  for (const hb of level.hubs ?? []) {
    const members = level.webs.filter((w) => hb.webs.includes(w.id));
    const hw = members.find((w) => w.hub);
    if (!hw) continue;
    const cx = (hw.x0 + hw.x1) / 2;
    const cy = (hw.y0 + hw.y1) / 2;
    const pts = [];
    for (const w of members) {
      if (w === hw) continue;
      for (const f of [0.1, 0.5, 0.9]) pts.push(cx, cy, -0.9, lerp(w.x0, w.x1, f), lerp(w.y0, w.y1, f), -0.9);
    }
    for (let a = 0; a < 16; a++) {
      const r = 26;
      pts.push(cx, cy, -1, cx + Math.cos((a / 16) * Math.PI * 2) * r, cy + Math.sin((a / 16) * Math.PI * 2) * r * 0.9, -1);
    }
    const spokes = new THREE.LineSegments(
      new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)),
      new THREE.LineBasicMaterial({ color: 0xe8ddf0, transparent: true, opacity: 0.28 }),
    );
    group.add(spokes);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.45, 32), basic(HUB_RIM, 0.75));
    ring.position.set(cx, cy + 0.9, -0.8);
    group.add(ring);
  }

  
  const curtains = (level.ivy ?? [])
    .filter((v) => v.skin === 'silk')
    .map((v) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(0.5, v.x1 - v.x0), v.y1 - v.y0), basic(0xb9bfd0, 0.94));
      m.position.set((v.x0 + v.x1) / 2, (v.y0 + v.y1) / 2, 0.36);
      group.add(m);
      return { v, m };
    });

  
  const lines = new Map();
  const dots = new Map();
  const blobs = [];
  const blobGeo = new THREE.SphereGeometry(0.18, 12, 8);
  const blobMat = basic(PINK, 0.9);
  const patchGeo = new THREE.CircleGeometry(0.5, 20);
  const cocoon = new THREE.Mesh(new THREE.SphereGeometry(0.5, 16, 12), basic(PINK, 0.38));
  cocoon.scale.set(0.9, 1.25, 0.6);
  cocoon.visible = false;
  group.add(cocoon);

  const sky = level.sky === 'nightToDawn' ? skyCanvas() : null;
  if (sky) {
    scene.background = sky.tex;
    sky.draw(new THREE.Color(NIGHT.top), new THREE.Color(NIGHT.bottom));
  }
  const top = (level.checkpoints?.length ? Math.max(...level.checkpoints.map((c) => c.y)) : 300) + 30;
  const y0 = 60;
  const y1 = Math.max(y0 + 60, top);
  let lastK = -1;
  const S = { hemiBase: NIGHT.hemi, sunBase: NIGHT.sun };

  return {
    get hemiBase() {
      return S.hemiBase;
    },
    get sunBase() {
      return S.sunBase;
    },
    
    update(s, dt, camera) {
      const t = s.time;
      
      for (const V of webs) {
        const st = s.webs?.[V.i];
        const bp = V.band.geometry.attributes.position;
        const ep = V.edge.geometry.attributes.position;
        const sp = V.shade.geometry.attributes.position;
        const w = V.w;
        for (let j = 0; j <= V.n; j++) {
          const x = lerp(w.x0, w.x1, j / V.n);
          const y = surfaceAt(w, st, x, t, harps);
          ep.setXYZ(j * 2, x, y + 0.01, Z + 0.01);
          ep.setXYZ(j * 2 + 1, x, y - EDGE_H, Z + 0.01);
          bp.setXYZ(j * 2, x, y - EDGE_H, Z);
          bp.setXYZ(j * 2 + 1, x, y - BAND_H, Z);
          sp.setXYZ(j * 2, x, y - BAND_H, Z);
          sp.setXYZ(j * 2 + 1, x, y - BAND_H - SHADE_H, Z);
          if (V.fringe) {
            const fp = V.fringe.geometry.attributes.position;
            const hang = 0.5 + 0.35 * Math.sin(j * 1.7);
            fp.setXYZ(j * 2, x, y - BAND_H, Z - 0.05);
            fp.setXYZ(j * 2 + 1, x + Math.sin(t * 1.3 + j) * 0.06, y - BAND_H - hang, Z - 0.05);
          }
        }
        bp.needsUpdate = true;
        sp.needsUpdate = true;
        ep.needsUpdate = true;
        if (V.fringe) V.fringe.geometry.attributes.position.needsUpdate = true;
        if (V.thread) {
          const mx = (w.x0 + w.x1) / 2;
          setLine(V.thread, [
            [mx, surfaceAt(w, st, mx, t, harps)],
            [V.harpAt[0], V.harpAt[1] + 0.4],
          ]);
          V.pluck = Math.max(0, V.pluck - dt * 2.5);
          V.thread.material.opacity = 0.3 + 0.6 * V.pluck + 0.1 * Math.abs(harpOff(w, harps, t).v) * 0.1;
        }
      }
      
      const seen = new Set();
      for (const e of s.entities) {
        const v = views.get(e.id);
        if (e.webFlung && v) {
          v.rotation.z = (v.rotation.z || 0) + dt * 14;
          const k = Math.min(1, e.webFlung.t / 1.2);
          v.scale.set((e.facing < 0 ? -1 : 1) * (1 - 0.5 * k), 1 - 0.5 * k, 1);
        }
        if (e.kind !== 'aunt' && e.kind !== 'goldAunt') continue;
        if (!e.alive) continue;
        seen.add(e.id);
        let L = lineOf(e);
        if (!L && e.kind === 'goldAunt') L = { x0: e.x, y0: (e.homeY ?? e.y) + 8, x1: e.x, y1: e.y + (e.h ?? 0.9) };
        if (!L && e.kind === 'aunt' && e.mode === 'tele') L = { x0: e.ax, y0: e.ay, x1: e.ax, y1: e.ay - 0.2 };
        let l = lines.get(e.id);
        if (!l) {
          l = line(e.kind === 'goldAunt' ? 0xffe9a8 : SILK, 0.85);
          lines.set(e.id, l);
          group.add(l);
        }
        l.visible = !!L;
        if (L)
          setLine(l, [
            [L.x0, L.y0, 0.15],
            [L.x1, L.y1, 0.15],
          ]);
        
        let d = dots.get(e.id);
        if (e.mode === 'tele' && e.drop) {
          if (!d) {
            d = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), basic(PINK, 0.95));
            dots.set(e.id, d);
            group.add(d);
          }
          d.visible = true;
          d.position.set(e.ax, e.drop.to, 0.5);
          d.scale.setScalar(1 + 0.3 * Math.sin(t * 24));
        } else if (d) d.visible = false;
        if (v) {
          const body = v.getObjectByName('auntBody');
          if (body)
            body.rotation.z =
              e.mode === 'cut' ? Math.sin(t * 30) * 0.4 : e.mode === 'dangle' || e.mode === 'hang' ? Math.sin(t * 5) * 0.08 : 0;
          const legs = v.getObjectByName('auntLegs');
          if (legs) legs.rotation.z = e.mode === 'pluck' ? Math.sin(t * 8) * 0.15 : 0;
        }
      }
      for (const [id, l] of lines)
        if (!seen.has(id)) {
          l.visible = false;
          const d = dots.get(id);
          if (d) d.visible = false;
        }
      
      const sn = s.snares ?? [];
      while (blobs.length < sn.length) {
        const m = new THREE.Mesh(blobGeo, blobMat);
        group.add(m);
        blobs.push(m);
      }
      for (let i = 0; i < blobs.length; i++) {
        const b = sn[i];
        const m = blobs[i];
        m.visible = !!b;
        if (!b) continue;
        if (b.state === 'patch') {
          if (m.geometry !== patchGeo) m.geometry = patchGeo;
          m.position.set(b.x, b.y + 0.04, 0.3);
          m.scale.set(1.5, 0.22, 1);
        } else {
          if (m.geometry !== blobGeo) m.geometry = blobGeo;
          m.position.set(b.x, b.y, 0.45);
          m.scale.setScalar(1);
        }
      }
      
      const p = s.player;
      cocoon.visible = p.snared > 0;
      if (cocoon.visible) {
        cocoon.position.set(jo.group.position.x, jo.group.position.y + 0.55, 0.5);
        cocoon.rotation.z = Math.sin(t * 28) * 0.12;
      }
      
      for (const C of curtains) {
        const v = C.v;
        const near = p.x > v.x0 - 1.5 && p.x < v.x1 + 1.5 && p.y > v.y0 - 1.5 && p.y < v.y1 + 1.5;
        C.m.material.opacity += ((near ? 0.45 + 0.1 * Math.sin(t * 6) : 0.94) - C.m.material.opacity) * Math.min(1, dt * 6);
        C.m.material.color.setHex(near ? 0xe6ecff : 0xb9bfd0);
      }
      
      if (sky) {
        const k = Math.max(0, Math.min(1, (camera.position.y - y0) / (y1 - y0)));
        const e = k * k * (3 - 2 * k);
        if (Math.abs(e - lastK) > 0.004) {
          lastK = e;
          sky.draw(mix(NIGHT.top, DAWN.top, e), mix(NIGHT.bottom, DAWN.bottom, e));
          scene.fog.color.copy(mix(NIGHT.fog, DAWN.fog, e));
          sun.color.copy(mix(NIGHT.sunColor, DAWN.sunColor, e));
          S.hemiBase = lerp(NIGHT.hemi, DAWN.hemi, e);
          S.sunBase = lerp(NIGHT.sun, DAWN.sun, e);
          
          sun.position.set(lerp(-8, 10, e), lerp(14, 8, e), 12);
        }
      }
    },
    onEvent(e) {
      if (e.type === 'pluck') {
        const V = webs.find((x) => x.w.id === e.web);
        if (V) V.pluck = 1;
      }
      if (e.type === 'fling' && e.x !== undefined) spark(e.x, e.y + 0.6, 0xfff6b0, 0.6, 0.22);
      if (e.type === 'lineCut' && e.x !== undefined) spark(e.x, e.y, 0xffffff, 0.35, 0.16);
      if (e.type === 'snarePatch') spark(e.x, e.y + 0.2, PINK, 0.3, 0.14);
      if (e.type === 'webLand' && e.hub) {
        const hw = level.webs.find((w) => w.hub);
        if (hw) spark((hw.x0 + hw.x1) / 2, hw.y0 + 0.9, HUB_RIM, 0.9, 0.6);
      }
    },
  };
}


export function silkEntityView(e, g) {
  if (e.kind !== 'aunt' && e.kind !== 'goldAunt') return false;
  const gold = e.kind === 'goldAunt';
  const lam = (color, emissive = 0x000000) => new THREE.MeshLambertMaterial({ color, emissive });
  const body = new THREE.Group();
  body.name = 'auntBody';
  body.position.y = 0.45;
  const abdomen = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 14), lam(gold ? 0xf2c14e : 0x8a5cc4, gold ? 0x4a3410 : 0x1c1030));
  abdomen.scale.set(1, 0.92, 0.8);
  abdomen.position.set(-0.12, 0.05, 0);
  const shawl = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 10), lam(gold ? 0xfff0b8 : 0xf3e2c8, 0x201a10));
  shawl.scale.set(1, 0.55, 0.5);
  shawl.position.set(-0.14, 0.2, 0.22);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), lam(gold ? 0xffd77a : 0xb48ae0, 0x1a1028));
  head.position.set(0.3, -0.02, 0.05);
  body.add(abdomen, shawl, head);
  for (const dx of [0.07, -0.07]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    eye.position.set(0.38 + dx * 0.4, 0.05, 0.22 + dx);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: 0x1a1428 }));
    pupil.position.set(0.42 + dx * 0.4, 0.05, 0.28 + dx);
    body.add(eye, pupil);
  }
  const legs = new THREE.Group();
  legs.name = 'auntLegs';
  const legMat = lam(gold ? 0xd9a43a : 0x5e3c8c, 0x10081c);
  const mitt = lam(gold ? 0xfff0b8 : 0xf3e2c8, 0x201a10);
  for (let i = 0; i < 4; i++) {
    for (const side of [-1, 1]) {
      const a = (-0.9 + i * 0.6) * side;
      const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.42, 3, 6), legMat);
      leg.position.set(0.05 + Math.sin(a) * 0.32, -0.2, side * 0.12);
      leg.rotation.z = a * 0.7 + (side > 0 ? 0.25 : -0.25);
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mitt);
      m.position.set(0.05 + Math.sin(a) * 0.5, -0.42, side * 0.12);
      legs.add(leg, m);
    }
  }
  body.add(legs);
  g.add(body);
  return true;
}
