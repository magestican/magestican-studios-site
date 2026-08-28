





































import * as THREE from 'three';
import { nearestOnBranch, nearestOnPath } from 'arbelo/trackPath';
import { RESPAWNS } from 'arbelo/trackHazards';
import { PALETTE } from '../palette.js';
import { makeBarnTexture } from './textures.js';




import { SHOULDER, GUARD_WIDTH, groundMeshHeightAt } from './trackMesh.js';
import { surface } from './materials.js';

function rngFrom(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
}


function onShortcut(path, x, z, pad) {
  for (const br of path.branches ?? []) {
    if (nearestOnBranch(br, x, z).dist <= br.width / 2 + br.shoulder + pad) return true;
  }
  return false;
}






























function inWaterZone(path, x, z) {
  
  
  
  
  
  
  const feature = (path.terrain ?? []).find(
    (f) => f.kind === 'volcano' && Math.hypot(x - f.x, z - f.z) < (f.craterRadius ?? 78) * 1.25,
  );
  if (feature) return true;
  const zones = path.hazards;
  if (!zones || !zones.length) return false;
  const near = nearestOnPath(path, x, z, null);
  const frac = near.s / path.length;
  const out = Math.abs(near.lateral ?? 0) / Math.max(1e-3, near.width / 2);
  for (const zone of zones) {
    if (!RESPAWNS.has(zone.kind)) continue;
    const within = zone.from <= zone.to
      ? frac >= zone.from && frac <= zone.to
      : frac >= zone.from || frac <= zone.to;
    if (!within) continue;
    if (zone.side && zone.side !== 'both') {
      const side = (near.lateral ?? 0) > 0 ? 'left' : 'right';
      if (zone.side !== side) continue;
    }
    if (out >= (zone.beyond ?? 1.18)) return true;
  }
  return false;
}
















function tooSteep(path, x, z, limit = 0.34) {
  const d = 6;
  const dx = (groundMeshHeightAt(path, x + d, z) - groundMeshHeightAt(path, x - d, z)) / (2 * d);
  const dz = (groundMeshHeightAt(path, x, z + d) - groundMeshHeightAt(path, x, z - d)) / (2 * d);
  return Math.hypot(dx, dz) > limit;
}

function besideTrack(path, rng, minOut, maxOut, { clear = 2, minClear = 0 } = {}) {
  let pick = null;
  let best = -Infinity;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const floor = Math.max(minOut, GUARD_WIDTH - SHOULDER + 0.5);
  const span = Math.max(0, maxOut - floor);
  for (let tries = 0; tries < 10; tries += 1) {
    const i = Math.floor(rng() * path.count) % path.count;
    const p = path.pts[i];
    const t = path.tangents[i];
    const side = rng() > 0.5 ? 1 : -1;
    const out = ((p.width / 2) + SHOULDER + floor + rng() * span) * side;
    const x = p.x + t.z * out;
    const z = p.z - t.x * out;
    if (inWaterZone(path, x, z)) continue;
    if (tooSteep(path, x, z)) continue;
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const near = nearestOnPath(path, x, z, null);
    const road = near.dist - near.width / 2;
    if (onShortcut(path, x, z, clear)) continue;
    if (road >= SHOULDER + minClear) {
      return { x, y: groundMeshHeightAt(path, x, z), z, index: i, side };
    }
    
    
    
    
    if (road > best) { best = road; pick = { x, y: groundMeshHeightAt(path, x, z), z, index: i, side }; }
  }
  return pick;
}

















function instanced(geo, mat, count) {
  const n = Math.max(1, count);
  const m = new THREE.InstancedMesh(geo, mat, n);
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const hidden = new THREE.Matrix4().compose(
    new THREE.Vector3(0, -1000, 0), new THREE.Quaternion(), new THREE.Vector3(0, 0, 0),
  );
  for (let i = 0; i < n; i += 1) m.setMatrixAt(i, hidden);
  m.instanceMatrix.needsUpdate = true;
  return m;
}

function place(mesh, i, x, y, z, yaw, scale) {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0));
  m.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(scale, scale, scale));
  mesh.setMatrixAt(i, m);
}


export function buildScenery(path, track) {
  const group = new THREE.Group();
  group.name = 'scenery';
  const rng = rngFrom(hashString(track.id));
  const s = track.scenery ?? {};
  const theme = track.theme ?? 'summer';

  group.add(buildBackdrop(path, theme));
  group.add(buildHedgerows(path, rng, s.hedgerows ?? 14, theme));
  if (s.sunflowers) group.add(buildSunflowers(path, rng, s.sunflowers));
  if (s.trees) group.add(buildTrees(path, rng, s.trees, theme));
  if (s.bales) group.add(buildBales(path, rng, s.bales, theme));
  if (s.snowmen) group.add(buildSnowmen(path, rng, s.snowmen));
  if (s.barns) group.add(buildBarns(path, rng, s.barns));
  if (s.silos) group.add(buildSilos(path, rng, s.silos));
  if (s.landmark) group.add(buildLandmark(path, s.landmark, theme));
  return group;
}





const BACKDROP_THEMES = {
  summer: { near: PALETTE.hillNear, far: PALETTE.hillFar },
  mud: { near: PALETTE.hillMud, far: PALETTE.hillMudFar },
  snow: { near: PALETTE.hillSnow, far: PALETTE.hillSnowFar },
};
























function buildBackdrop(path, theme) {
  const group = new THREE.Group();
  group.name = 'backdrop';
  const c = BACKDROP_THEMES[theme] ?? BACKDROP_THEMES.summer;
  const b = path.bounds;
  const cx = (b.minX + b.maxX) / 2;
  const cz = (b.minZ + b.maxZ) / 2;
  const halfSpan = Math.max(b.maxX - b.minX, b.maxZ - b.minZ) / 2;

  const rings = [
    { radius: halfSpan + 430, lo: 34, hi: 86, colour: c.far, seed: 3.1, freq: 2 },
    { radius: halfSpan + 300, lo: 18, hi: 52, colour: c.near, seed: 0.7, freq: 3 },
  ];
  for (const ring of rings) {
    const N = 128;
    const positions = new Float32Array((N + 1) * 2 * 3);
    const indices = [];
    for (let i = 0; i <= N; i += 1) {
      const a = (i / N) * Math.PI * 2;
      
      
      
      
      const h = ring.lo + (ring.hi - ring.lo) * (
        0.5
        + 0.28 * Math.sin(a * ring.freq + ring.seed)
        + 0.14 * Math.sin(a * (ring.freq * 3 + 1) + ring.seed * 2.3)
        + 0.08 * Math.sin(a * (ring.freq * 7 + 2) - ring.seed)
      );
      const x = cx + Math.sin(a) * ring.radius;
      const z = cz + Math.cos(a) * ring.radius;
      positions[i * 6 + 0] = x;
      positions[i * 6 + 1] = -30;
      positions[i * 6 + 2] = z;
      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = h;
      positions[i * 6 + 5] = z;
    }
    for (let i = 0; i < N; i += 1) {
      const p0 = i * 2; const p1 = p0 + 1;
      const q0 = (i + 1) * 2; const q1 = q0 + 1;
      indices.push(p0, p1, q0, p1, q1, q0);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    
    
    
    
    
    
    const mat = new THREE.MeshBasicMaterial({ color: ring.colour, side: THREE.DoubleSide, fog: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = 'hills';
    group.add(mesh);
  }
  return group;
}










function buildHedgerows(path, rng, count, theme) {
  const group = new THREE.Group();
  group.name = 'hedgerows';
  if (!count) return group;
  const colour = theme === 'snow' ? 0x7f93a3 : theme === 'mud' ? PALETTE.hedgeMud : PALETTE.hedge;
  const perRow = 14;
  const total = count * perRow;
  const geo = new THREE.BoxGeometry(3.4, 2.1, 1.5);
  geo.translate(0, 1.05, 0);
  const mesh = instanced(geo, surface({ color: colour, flatShading: true }), total);

  let idx = 0;
  for (let r = 0; r < count; r += 1) {
    const anchor = besideTrack(path, rng, 60, 190, { clear: 6, minClear: 46 });
    const dir = rng() * Math.PI * 2;
    for (let k = 0; k < perRow && idx < total; k += 1, idx += 1) {
      
      
      const along = (k - perRow / 2) * (3.1 + rng() * 0.5);
      const x = anchor.x + Math.sin(dir) * along + (rng() - 0.5) * 1.4;
      const z = anchor.z + Math.cos(dir) * along + (rng() - 0.5) * 1.4;
      place(mesh, idx, x, groundMeshHeightAt(path, x, z) - 0.2, z, dir + (rng() - 0.5) * 0.25, 0.8 + rng() * 0.5);
    }
  }
  for (let i = idx; i < total; i += 1) place(mesh, i, 0, -1000, 0, 0, 0);
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = false;   
  group.add(mesh);
  return group;
}












function buildSunflowers(path, rng, count) {
  const group = new THREE.Group();
  group.name = 'sunflowers';
  const stemGeo = new THREE.CylinderGeometry(0.04, 0.06, 1.5, 4);
  stemGeo.translate(0, 0.75, 0);
  const headGeo = new THREE.CylinderGeometry(0.34, 0.34, 0.09, 8);
  headGeo.rotateX(Math.PI / 2.35);
  headGeo.translate(0, 1.52, 0.05);
  const centreGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.12, 7);
  centreGeo.rotateX(Math.PI / 2.35);
  centreGeo.translate(0, 1.52, 0.11);

  const stems = instanced(stemGeo, surface({ color: PALETTE.tree, flatShading: true }), count);
  const heads = instanced(headGeo, surface({ color: PALETTE.sunflower, flatShading: true }), count);
  const centres = instanced(centreGeo, surface({ color: PALETTE.sunflowerC, flatShading: true }), count);

  let i = 0;
  while (i < count) {
    const anchor = besideTrack(path, rng, 2, 40);
    const clump = 4 + Math.floor(rng() * 9);
    for (let c = 0; c < clump && i < count; c += 1, i += 1) {
      const x = anchor.x + (rng() - 0.5) * 9;
      const z = anchor.z + (rng() - 0.5) * 9;
      
      
      const yaw = 2.1 + (rng() - 0.5) * 0.9;
      const scale = 0.8 + rng() * 0.55;
      const y = groundMeshHeightAt(path, x, z);
      place(stems, i, x, y, z, yaw, scale);
      place(heads, i, x, y, z, yaw, scale);
      place(centres, i, x, y, z, yaw, scale);
    }
  }
  for (const m of [stems, heads, centres]) { m.instanceMatrix.needsUpdate = true; m.castShadow = true; }
  group.add(stems, heads, centres);
  return group;
}












const TREE_MIX = {
  summer: { broadleaf: 0.78, conifer: 0.14, bare: 0.08 },
  mud: { broadleaf: 0.42, conifer: 0.18, bare: 0.40 },
  snow: { broadleaf: 0.16, conifer: 0.62, bare: 0.22 },
};


function buildTrees(path, rng, count, theme) {
  const group = new THREE.Group();
  group.name = 'trees';
  const mix = TREE_MIX[theme] ?? TREE_MIX.summer;
  const nConifer = Math.round(count * mix.conifer);
  const nBare = Math.round(count * mix.bare);
  const nBroad = Math.max(1, count - nConifer - nBare);

  const leaf = theme === 'snow' ? 0x4a6b52 : theme === 'mud' ? 0x3a5c2c : PALETTE.tree;
  const trunkMat = surface({ color: PALETTE.treeTrunk, flatShading: true });
  const leafMat = surface({ color: leaf, flatShading: true });
  const pineMat = surface({ color: PALETTE.pine, flatShading: true });
  const snowMat = surface({ color: PALETTE.pineSnow, flatShading: true });
  const bareMat = surface({ color: PALETTE.deadWood, flatShading: true });

  
  
  const trunkGeo = new THREE.CylinderGeometry(0.28, 0.42, 3.2, 6);
  trunkGeo.translate(0, 1.6, 0);
  const canopyGeo = new THREE.IcosahedronGeometry(2.1, 0);
  canopyGeo.translate(0, 4.2, 0);
  const canopy2Geo = new THREE.IcosahedronGeometry(1.5, 0);
  canopy2Geo.translate(0.9, 3.2, 0.5);
  const trunks = instanced(trunkGeo, trunkMat, nBroad);
  const tops = instanced(canopyGeo, leafMat, nBroad);
  const tops2 = instanced(canopy2Geo, leafMat, nBroad);
  for (let i = 0; i < nBroad; i += 1) {
    const p = besideTrack(path, rng, 6, 130, { minClear: 5 });
    const yaw = rng() * Math.PI * 2;
    const scale = 0.75 + rng() * 0.9;
    place(trunks, i, p.x, p.y, p.z, yaw, scale);
    place(tops, i, p.x, p.y, p.z, yaw, scale);
    place(tops2, i, p.x, p.y, p.z, yaw + 1.7, scale);
  }

  
  
  
  
  
  const pineTrunkGeo = new THREE.CylinderGeometry(0.22, 0.34, 1.6, 5);
  pineTrunkGeo.translate(0, 0.8, 0);
  const coneLowGeo = new THREE.ConeGeometry(2.0, 3.6, 7);
  coneLowGeo.translate(0, 2.9, 0);
  const coneHighGeo = new THREE.ConeGeometry(1.35, 3.2, 7);
  coneHighGeo.translate(0, 5.0, 0);
  const capGeo = new THREE.ConeGeometry(1.42, 1.5, 7);
  capGeo.translate(0, 6.2, 0);
  const pineTrunks = instanced(pineTrunkGeo, trunkMat, nConifer);
  const coneLow = instanced(coneLowGeo, pineMat, nConifer);
  const coneHigh = instanced(coneHighGeo, pineMat, nConifer);
  const caps = theme === 'snow' ? instanced(capGeo, snowMat, nConifer) : null;
  for (let i = 0; i < nConifer; i += 1) {
    const p = besideTrack(path, rng, 6, 150, { minClear: 5 });
    const yaw = rng() * Math.PI * 2;
    const scale = 0.7 + rng() * 0.8;
    place(pineTrunks, i, p.x, p.y, p.z, yaw, scale);
    place(coneLow, i, p.x, p.y, p.z, yaw, scale);
    place(coneHigh, i, p.x, p.y, p.z, yaw + 0.8, scale);
    if (caps) place(caps, i, p.x, p.y, p.z, yaw + 0.8, scale);
  }

  
  
  const bareTrunkGeo = new THREE.CylinderGeometry(0.2, 0.4, 4.2, 5);
  bareTrunkGeo.translate(0, 2.1, 0);
  const limbGeo = new THREE.CylinderGeometry(0.08, 0.16, 2.6, 4);
  limbGeo.translate(0, 1.3, 0);
  const bareTrunks = instanced(bareTrunkGeo, bareMat, nBare);
  const limbs = instanced(limbGeo, bareMat, nBare * 3);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  for (let i = 0; i < nBare; i += 1) {
    const p = besideTrack(path, rng, 6, 140, { minClear: 5 });
    const yaw = rng() * Math.PI * 2;
    const scale = 0.8 + rng() * 0.8;
    place(bareTrunks, i, p.x, p.y, p.z, yaw, scale);
    for (let k = 0; k < 3; k += 1) {
      const lean = 0.5 + rng() * 0.5;
      e.set(Math.sin(yaw + k * 2.1) * lean, yaw + k * 2.1, Math.cos(yaw + k * 2.1) * lean);
      q.setFromEuler(e);
      limbs.setMatrixAt(i * 3 + k, m.compose(
        new THREE.Vector3(p.x, p.y + 3.2 * scale, p.z),
        q,
        new THREE.Vector3(scale, scale, scale),
      ));
    }
  }

  const all = [trunks, tops, tops2, pineTrunks, coneLow, coneHigh, bareTrunks, limbs];
  if (caps) all.push(caps);
  for (const mesh of all) { mesh.instanceMatrix.needsUpdate = true; mesh.castShadow = true; }
  group.add(...all);
  return group;
}


function buildBales(path, rng, count, theme) {
  const group = new THREE.Group();
  group.name = 'bales';
  const geo = new THREE.CylinderGeometry(0.95, 0.95, 1.5, 10);
  geo.rotateZ(Math.PI / 2);
  geo.translate(0, 0.95, 0);
  const colour = theme === 'snow' ? 0xcbb87f : PALETTE.haybale;
  const bales = instanced(geo, surface({ color: colour, flatShading: true }), count);
  for (let i = 0; i < count; i += 1) {
    const p = besideTrack(path, rng, 1.5, 26);
    place(bales, i, p.x, p.y, p.z, rng() * Math.PI * 2, 0.85 + rng() * 0.4);
  }
  bales.instanceMatrix.needsUpdate = true;
  bales.castShadow = true;
  group.add(bales);
  return group;
}












function buildSnowmen(path, rng, count) {
  const group = new THREE.Group();
  group.name = 'snowmen';
  const white = surface({ color: PALETTE.snow, flatShading: true });
  const radii = [0.62, 0.44, 0.3];
  const ys = [];
  let y = 0;
  for (const r of radii) { y += r * 0.86; ys.push(y); y += r * 0.28; }

  const balls = radii.map((r, k) => {
    const geo = new THREE.IcosahedronGeometry(r, 1);
    geo.translate(0, ys[k], 0);
    return instanced(geo, white, count);
  });
  const noseGeo = new THREE.ConeGeometry(0.07, 0.34, 5);
  noseGeo.rotateX(Math.PI / 2);
  noseGeo.translate(0, y - 0.16, 0.3);
  const noses = instanced(noseGeo, surface({ color: 0xe08a3c, flatShading: true }), count);
  const hatGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.34, 8);
  hatGeo.translate(0, y + 0.16, 0);
  const hats = instanced(hatGeo, surface({ color: PALETTE.night, flatShading: true }), count);

  for (let i = 0; i < count; i += 1) {
    const p = besideTrack(path, rng, 2, 30);
    const yaw = rng() * Math.PI * 2;
    const scale = 0.8 + rng() * 0.5;
    for (const b of balls) place(b, i, p.x, p.y, p.z, yaw, scale);
    place(noses, i, p.x, p.y, p.z, yaw, scale);
    place(hats, i, p.x, p.y, p.z, yaw, scale);
  }
  for (const mesh of [...balls, noses, hats]) { mesh.instanceMatrix.needsUpdate = true; mesh.castShadow = true; }
  group.add(...balls, noses, hats);
  return group;
}









function buildBarns(path, rng, count) {
  const group = new THREE.Group();
  group.name = 'barns';
  const wallMat = surface({ map: makeBarnTexture() });
  const roofMat = surface({ color: PALETTE.barnRoof, flatShading: true });
  for (let i = 0; i < count; i += 1) {
    
    
    
    const p = besideTrack(path, rng, 34, 80, { clear: 8, minClear: 30 });
    const g = new THREE.Group();
    const w = 11 + rng() * 6;
    const d = 16 + rng() * 8;
    const h = 6 + rng() * 2;
    const walls = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
    walls.position.y = h / 2;
    g.add(walls);
    
    
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.72, w * 0.72, d + 1.2, 3, 1), roofMat);
    roof.rotation.z = Math.PI / 2;
    roof.rotation.y = Math.PI / 2;
    roof.position.y = h + w * 0.3;
    g.add(roof);
    g.position.set(p.x, p.y, p.z);
    g.rotation.y = rng() * Math.PI * 2;
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    group.add(g);
  }
  return group;
}


function buildSilos(path, rng, count) {
  const group = new THREE.Group();
  group.name = 'silos';
  const body = surface({ color: PALETTE.silo, flatShading: true });
  const cap = surface({ color: PALETTE.barnRoof, flatShading: true });
  for (let i = 0; i < count; i += 1) {
    const p = besideTrack(path, rng, 40, 100, { clear: 8, minClear: 34 });
    const g = new THREE.Group();
    const r = 3.2 + rng() * 1.4;
    const h = 13 + rng() * 7;
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), body);
    tube.position.y = h / 2;
    g.add(tube);
    const dome = new THREE.Mesh(new THREE.ConeGeometry(r * 1.06, r * 1.1, 12), cap);
    dome.position.y = h + r * 0.55;
    g.add(dome);
    g.position.set(p.x, p.y, p.z);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    group.add(g);
  }
  return group;
}














function buildLandmark(path, spec, theme) {
  const group = new THREE.Group();
  group.name = 'landmark';
  const kind = typeof spec === 'string' ? spec : spec.kind;
  const at = (typeof spec === 'object' && spec.at !== undefined) ? spec.at : 0.25;
  const side = (typeof spec === 'object' && spec.side) ? spec.side : 1;
  const out = (typeof spec === 'object' && spec.out) ? spec.out : 60;

  const i = Math.min(path.count - 1, Math.floor(at * path.count));
  const p = path.pts[i];
  const t = path.tangents[i];
  const off = ((p.width / 2) + SHOULDER + out) * side;
  const x = p.x + t.z * off;
  const z = p.z - t.x * off;
  const g = new THREE.Group();

  const stone = surface({ color: PALETTE.silo, flatShading: true });
  const dark = surface({ color: PALETTE.barnRoof, flatShading: true });
  const red = surface({ color: PALETTE.barnRed, flatShading: true });
  const cream = surface({ color: PALETTE.ceiling, flatShading: true });

  if (kind === 'windmill') {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 5, 16, 8), stone);
    tower.position.y = 8;
    g.add(tower);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(3.8, 3.4, 8), dark);
    cap.position.y = 17.4;
    g.add(cap);
    
    
    const hub = new THREE.Group();
    hub.position.set(0, 15.6, 4.4);
    for (let k = 0; k < 4; k += 1) {
      const sail = new THREE.Mesh(new THREE.BoxGeometry(1.7, 9.5, 0.35), cream);
      sail.position.y = 4.9;
      const arm = new THREE.Group();
      arm.rotation.z = (k * Math.PI) / 2 + 0.35;
      arm.add(sail);
      hub.add(arm);
    }
    g.add(hub);
  } else if (kind === 'watertower') {
    for (const dx of [-3.4, 3.4]) {
      for (const dz of [-3.4, 3.4]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.55, 13, 0.55), dark);
        leg.position.set(dx, 6.5, dz);
        leg.rotation.x = dz * 0.012;
        leg.rotation.z = -dx * 0.012;
        g.add(leg);
      }
    }
    const brace = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.35, 0.35), dark);
    brace.position.y = 6.5;
    g.add(brace);
    const brace2 = brace.clone();
    brace2.rotation.y = Math.PI / 2;
    g.add(brace2);
    const tank = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 6, 10), red);
    tank.position.y = 16;
    g.add(tank);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.6, 10), dark);
    roof.position.y = 20.3;
    g.add(roof);
  } else if (kind === 'church') {
    const nave = new THREE.Mesh(new THREE.BoxGeometry(9, 7, 16), stone);
    nave.position.y = 3.5;
    g.add(nave);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(6.5, 6.5, 16.6, 3, 1), dark);
    roof.rotation.z = Math.PI / 2;
    roof.rotation.y = Math.PI / 2;
    roof.position.y = 9.6;
    g.add(roof);
    const tower = new THREE.Mesh(new THREE.BoxGeometry(5.4, 17, 5.4), stone);
    tower.position.set(0, 8.5, -10);
    g.add(tower);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(4, 9, 4), dark);
    spire.position.set(0, 21.5, -10);
    spire.rotation.y = Math.PI / 4;
    g.add(spire);
  }

  g.position.set(x, groundMeshHeightAt(path, x, z), z);
  g.rotation.y = Math.atan2(t.x, t.z) + (side > 0 ? -1.2 : 1.2);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  group.add(g);
  return group;
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
