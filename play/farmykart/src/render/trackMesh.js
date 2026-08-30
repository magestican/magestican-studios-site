














import * as THREE from 'three';
import { nearestOnBranch, sampleAt, trackSurface } from 'arbelo/trackPath';
import { PALETTE } from '../palette.js';
import { makeRoadTexture, makeGrassTexture, makeShortcutTexture, makeGroundNormal } from './textures.js';
import { surface, addGroundDetail, applyShadows } from './materials.js';

import { NORMAL_SCALE } from '../../../../web-engine/render/lookGrade.js';
import { inSpan, RESPAWNS } from 'arbelo/trackHazards';
import {
  SHOULDER, KERB_WIDTH, groundGrid, groundMeshHeightAt, trackGuards,
  GUARD_WIDTH, guardSection, GUARD_DRESS_MIN,
  
  
  
  
  
  
  
  
  
  
  CAMBER_COLS, roadCrossSection, camberLiftAt, camberEdgeY,
  blendToGround, trackRails, RAIL_AT, RAIL_HEIGHT, RAIL_RADIUS,
} from 'arbelo/trackGround';
import { terrainOffsetAt } from 'arbelo/trackTerrain';







const KERB_STRIPE = 4;








export function buildTrackMesh(path, track) {
  const group = new THREE.Group();
  group.name = 'track';
  const theme = track.theme ?? 'summer';

  
  
  
  
  
  
  
  
  
  
  
  
  
  path.terrain = track.terrain ?? null;

  group.add(buildGround(path, track));
  group.add(buildChasmWalls(path, track));
  group.add(buildViaducts(path));
  group.add(buildRoad(path, theme));
  group.add(buildShortcuts(path, theme));
  group.add(buildKerbs(path));
  group.add(buildVerge(path, track));
  
  
  
  group.add(buildEdgeGuards(path, track));
  
  
  
  group.add(buildRails(path, track));
  group.add(buildMarkerPosts(path, theme));
  group.add(buildStartLine(path));
  return group;
}























export {
  SHOULDER, groundGrid, groundHeightAt, groundMeshHeightAt, groundMeshVertex,
  bodyGroundY, groundTable, trackGuards, GUARD_WIDTH,
} from 'arbelo/trackGround';
































function buildRoad(path, theme) {
  const n = path.count;
  const cols = CAMBER_COLS;
  const positions = new Float32Array(n * cols * 3);
  const uvs = new Float32Array(n * cols * 2);
  const indices = [];

  for (let i = 0; i < n; i += 1) {
    const p = path.pts[i];
    const t = path.tangents[i];
    const half = p.width / 2;
    const section = roadCrossSection(path.camber, i);
    const v = path.s[i] / 8;
    for (let j = 0; j < cols; j += 1) {
      
      
      
      
      
      
      const { t: lat, lift } = section[cols - 1 - j];
      const off = lat * half;
      const b = (i * cols + j) * 3;
      
      
      positions[b + 0] = p.x + t.z * off;
      positions[b + 1] = p.y + 0.02 + lift;
      positions[b + 2] = p.z - t.x * off;
      
      
      
      
      
      
      
      
      
      
      const q = (i * cols + j) * 2;
      uvs[q + 0] = (1 - lat) / 2;
      uvs[q + 1] = v;
    }
  }
  for (let i = 0; i < n; i += 1) {
    const row = i * cols;
    const next = ((i + 1) % n) * cols;
    for (let j = 0; j < cols - 1; j += 1) {
      const a = row + j; const b = a + 1;
      const c = next + j; const d = c + 1;
      
      
      indices.push(a, b, c, b, d, c);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  
  
  
  const map = makeRoadTexture(theme);
  map.repeat.set(1, 1);
  map.colorSpace = THREE.SRGBColorSpace;
  
  
  
  
  const normalMap = makeGroundNormal(map, 1);
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const mesh = new THREE.Mesh(geo, addGroundDetail(
    surface({ map, normalMap, roughness: 0.94, rim: false, unique: true }),
    { scale: 0.020, strength: 0.20 },
  ));
  if (normalMap) mesh.material.normalScale.set(NORMAL_SCALE.road, NORMAL_SCALE.road);
  mesh.name = 'road';
  applyShadows(mesh, 'road');
  return mesh;
}









function buildKerbs(path) {
  const n = path.count;
  const group = new THREE.Group();
  group.name = 'kerbs';
  const a = new THREE.Color(PALETTE.kerbA);
  const b = new THREE.Color(PALETTE.kerbB);

  for (const side of [1, -1]) {
    const positions = new Float32Array(n * 2 * 3);
    const colors = new Float32Array(n * 2 * 3);
    const indices = [];
    for (let i = 0; i < n; i += 1) {
      const p = path.pts[i];
      const t = path.tangents[i];
      const inner = (p.width / 2) * side;
      const outer = ((p.width / 2) + KERB_WIDTH) * side;
      
      
      
      
      
      
      const lift = camberEdgeY(path.camber, i, side);
      positions[i * 6 + 0] = p.x + t.z * inner;
      positions[i * 6 + 1] = p.y + lift + 0.05;
      positions[i * 6 + 2] = p.z - t.x * inner;
      positions[i * 6 + 3] = p.x + t.z * outer;
      
      
      
      positions[i * 6 + 4] = p.y + lift + 0.13;
      positions[i * 6 + 5] = p.z - t.x * outer;
      const c = (Math.floor(path.s[i] / KERB_STRIPE) % 2 === 0) ? a : b;
      for (const off of [0, 3]) {
        colors[i * 6 + off + 0] = c.r;
        colors[i * 6 + off + 1] = c.g;
        colors[i * 6 + off + 2] = c.b;
      }
    }
    for (let i = 0; i < n; i += 1) {
      const p0 = i * 2; const p1 = p0 + 1;
      const q0 = ((i + 1) % n) * 2; const q1 = q0 + 1;
      indices.push(p0, p1, q0, p1, q1, q0);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const strip = new THREE.Mesh(geo, surface({
      vertexColors: true, side: THREE.DoubleSide,
    }));
    
    
    
    
    
    
    applyShadows(strip, 'kerb');
    group.add(strip);
  }
  return group;
}




































const VERGE_ROWS = 5;

function buildVerge(path, track) {
  const theme = track.theme ?? 'summer';
  const n = path.count;
  const positions = new Float32Array(n * 2 * VERGE_ROWS * 3);
  const indices = [];
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const colour = theme === 'snow' ? 0xccd9e6
    : theme === 'mud' ? PALETTE.mud
      : PALETTE.shoulder;

  
  
  
  
  
  
  
  
  const chasmEdge = (i, side) => {
    const p = path.pts[i];
    const frac = path.s[i] / path.length;
    let cut = Infinity;
    for (const zone of path.hazards ?? []) {
      if ((zone.depth ?? 0) < 12) continue;
      if (!inSpan(frac, zone.from, zone.to)) continue;
      if (zone.side && zone.side !== 'both') {
        if ((zone.side === 'left' ? 1 : -1) !== side) continue;
      }
      cut = Math.min(cut, (p.width / 2) * (zone.beyond ?? 1.18));
    }
    return cut;
  };

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let v = 0;
  for (const side of [1, -1]) {
    for (let i = 0; i < n; i += 1) {
      const p = path.pts[i];
      const t = path.tangents[i];
      const innerMag = (p.width / 2) + KERB_WIDTH;
      const outerMag = Math.min(innerMag + SHOULDER, chasmEdge(i, side));
      for (let r = 0; r < VERGE_ROWS; r += 1) {
        const f = r / (VERGE_ROWS - 1);
        const off = (innerMag + (outerMag - innerMag) * f) * side;
        const x = p.x + t.z * off;
        const z = p.z - t.x * off;
        const surf = trackSurface(path, x, z, i, { shoulder: SHOULDER });
        
        
        
        
        
        const bias = 0.012 + (-0.02 - 0.012) * f;
        positions[v * 3 + 0] = x;
        positions[v * 3 + 1] = blendToGround(path, surf, x, z) + bias;
        positions[v * 3 + 2] = z;
        v += 1;
      }
    }
  }
  for (let s = 0; s < 2; s += 1) {
    const base = s * n * VERGE_ROWS;
    for (let i = 0; i < n; i += 1) {
      const row = base + i * VERGE_ROWS;
      const next = base + ((i + 1) % n) * VERGE_ROWS;
      for (let r = 0; r < VERGE_ROWS - 1; r += 1) {
        const p0 = row + r; const p1 = p0 + 1;
        const q0 = next + r; const q1 = q0 + 1;
        indices.push(p0, p1, q0, p1, q1, q0);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const mesh = new THREE.Mesh(geo, addGroundDetail(surface({
    color: colour, side: THREE.DoubleSide, rim: false, roughness: 0.96, unique: true,
  }), { scale: 0.030, strength: 0.30, fade: 300 }));
  
  
  
  
  
  
  applyShadows(mesh, 'verge');
  mesh.name = 'verge';
  return mesh;
}




















function buildGround(path, track) {
  const theme = track.theme ?? 'summer';
  const b = path.bounds;
  
  
  
  
  
  const grid = groundGrid(path);
  const { w, h, cx, cz } = grid;
  const geo = new THREE.PlaneGeometry(w, h, grid.seg, grid.seg);
  geo.rotateX(-Math.PI / 2);

  
  
  
  
  
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) + cx;
    const z = pos.getZ(i) + cz;
    
    
    
    
    
    
    
    
    
    pos.setY(i, groundMeshHeightAt(path, x, z));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const cold = theme === 'snow';
  const rock = new THREE.Color(cold ? PALETTE.rockCold : PALETTE.rock);
  const ash = new THREE.Color(cold ? 0x8f9aa4 : 0x4c443c);
  const plain = new THREE.Color(0xffffff);
  const colors = new Float32Array(pos.count * 3);
  const step = Math.max(grid.w / grid.seg, grid.h / grid.seg);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) + cx;
    const z = pos.getZ(i) + cz;
    const y = pos.getY(i);
    
    
    const dx = (groundMeshHeightAt(path, x + step, z) - groundMeshHeightAt(path, x - step, z)) / (2 * step);
    const dz = (groundMeshHeightAt(path, x, z + step) - groundMeshHeightAt(path, x, z - step)) / (2 * step);
    const slope = Math.hypot(dx, dz);
    const bare = Math.min(1, Math.max(0, (slope - 0.30) / 0.55));
    c.copy(plain).lerp(rock, bare * bare * (3 - 2 * bare));
    const lift = terrainOffsetAt(path.terrain, x, z);
    if (lift > 0) {
      const burnt = Math.min(1, Math.max(0, (lift - 14) / 26));
      c.lerp(ash, burnt * burnt * (3 - 2 * burnt) * 0.9);
    }
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
    
    
    void y;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const map = makeGrassTexture(theme);
  
  
  
  
  
  
  
  
  
  
  map.repeat.set(w / 20, h / 20);
  map.colorSpace = THREE.SRGBColorSpace;
  
  const normalMap = makeGroundNormal(map, 1);
  
  
  
  const mesh = new THREE.Mesh(geo, addGroundDetail(
    
    surface({ map, normalMap, roughness: 0.97, rim: false, vertexColors: true, unique: true }),
    { scale: 0.0055, strength: 0.26, fade: 420 },
  ));
  if (normalMap) mesh.material.normalScale.set(NORMAL_SCALE.ground, NORMAL_SCALE.ground);
  mesh.position.set(cx, -0.05, cz);
  mesh.name = 'ground';
  applyShadows(mesh, 'ground');
  return mesh;
}























function buildShortcuts(path, theme) {
  const group = new THREE.Group();
  group.name = 'shortcuts';
  if (!path.branches || path.branches.length === 0) return group;

  const map = makeShortcutTexture(theme);
  map.colorSpace = THREE.SRGBColorSpace;
  
  
  
  
  const mat = surface({ map, rim: false });

  for (const br of path.branches) {
    const n = br.count;
    const positions = new Float32Array(n * 2 * 3);
    const uvs = new Float32Array(n * 2 * 2);
    const indices = [];
    for (let i = 0; i < n; i += 1) {
      const p = br.pts[i];
      const t = br.tangents[i];
      const half = br.width / 2;
      positions[i * 6 + 0] = p.x + t.z * half;
      
      
      
      
      positions[i * 6 + 1] = (p.y ?? 0) + 0.03;
      positions[i * 6 + 2] = p.z - t.x * half;
      positions[i * 6 + 3] = p.x - t.z * half;
      positions[i * 6 + 4] = (p.y ?? 0) + 0.03;
      positions[i * 6 + 5] = p.z + t.x * half;
      
      
      const v = br.s[i] / 8;
      uvs[i * 4 + 0] = 0; uvs[i * 4 + 1] = v;
      uvs[i * 4 + 2] = 1; uvs[i * 4 + 3] = v;
    }
    
    
    
    
    for (let i = 0; i < n - 1; i += 1) {
      const a = i * 2; const b = i * 2 + 1;
      const j = (i + 1) * 2; const k = j + 1;
      indices.push(a, b, j, b, k, j);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, mat);
    mesh.name = `shortcut-${br.id}`;
    applyShadows(mesh, 'shortcut');
    group.add(mesh);
  }
  group.add(buildGates(path));
  return group;
}











function buildGates(path) {
  const group = new THREE.Group();
  group.name = 'gates';
  const mouths = [];
  for (const br of path.branches ?? []) {
    for (const at of [0, br.count - 1]) {
      mouths.push({ p: br.pts[at], t: br.tangents[Math.min(at, br.count - 2)], half: br.width / 2 + 0.7 });
    }
  }
  if (mouths.length === 0) return group;

  const height = 3.4;
  const postGeo = new THREE.BoxGeometry(0.3, height, 0.3);
  postGeo.translate(0, height / 2, 0);
  const bandGeo = new THREE.BoxGeometry(0.36, 0.42, 0.36);
  const posts = new THREE.InstancedMesh(
    postGeo, surface({ color: PALETTE.gatePost, flatShading: true }), mouths.length * 2,
  );
  const bands = new THREE.InstancedMesh(
    bandGeo, surface({ color: PALETTE.gateStripe, flatShading: true }), mouths.length * 6,
  );
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);

  let pi = 0; let bi = 0;
  for (const mouth of mouths) {
    for (const side of [1, -1]) {
      const x = mouth.p.x + mouth.t.z * mouth.half * side;
      const z = mouth.p.z - mouth.t.x * mouth.half * side;
      const y = mouth.p.y ?? 0;
      
      
      
      
      e.set(0, 0, side > 0 ? 0.035 : -0.05);
      q.setFromEuler(e);
      v.set(x, y, z);
      posts.setMatrixAt(pi, m.compose(v, q, one));
      pi += 1;
      
      
      for (const by of [0.6, 1.6, 2.6]) {
        v.set(x, y + by, z);
        bands.setMatrixAt(bi, m.compose(v, q, one));
        bi += 1;
      }
    }
  }
  posts.instanceMatrix.needsUpdate = true;
  bands.instanceMatrix.needsUpdate = true;
  posts.castShadow = true;
  group.add(posts, bands);
  return group;
}







const CHASM_DEPTH = 12;
export const chasmZonesOf = (path) => (path.hazards ?? []).filter((z) => (z.depth ?? 0) >= CHASM_DEPTH);


























function buildChasmWalls(path, track) {
  const group = new THREE.Group();
  group.name = 'chasmWalls';
  const zones = chasmZonesOf(path);
  if (!zones.length) return group;
  const cold = (track.theme ?? 'summer') === 'snow';
  const faceCol = new THREE.Color(cold ? PALETTE.rockCold : PALETTE.rock);
  const lipCol = new THREE.Color(cold ? PALETTE.rockLipCold : PALETTE.rockLip);

  let seed = (0x51ce ^ Math.floor(path.length * 7)) >>> 0 || 1;
  const rng = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };

  for (const zone of zones) {
    const span = zone.from <= zone.to ? zone.to - zone.from : (1 - zone.from) + zone.to;
    
    
    
    const steps = Math.max(16, Math.round((span * path.length) / 5));
    const sides = !zone.side || zone.side === 'both' ? [1, -1] : [zone.side === 'left' ? 1 : -1];
    const positions = [];
    const colors = [];
    const indices = [];
    const ROWS = 4;
    for (const side of sides) {
      const base = positions.length / 3;
      for (let i = 0; i <= steps; i += 1) {
        const frac = (zone.from + (span * i) / steps) % 1;
        const p = sampleAt(path, frac * path.length);
        const half = p.width / 2;
        const nx = p.tz * side;
        const nz = -p.tx * side;
        const lip = half * (zone.beyond ?? 1.18);
        
        const bed = half * ((zone.beyond ?? 1.18) + (zone.bank ?? 0.55));
        const depth = zone.depth ?? 4.5;
        const y0 = p.y ?? 0;
        
        
        
        
        const over = 1.2;
        const skirt = 16;
        
        
        const wob = (rng() - 0.5) * 2.4;
        const rows = [
          { out: lip - over, y: y0 + 0.15, c: lipCol },
          { out: lip + (bed - lip) * 0.34 + wob, y: y0 - depth * 0.42, c: faceCol },
          { out: bed + wob * 0.5, y: y0 - depth, c: faceCol },
          { out: bed + skirt, y: y0 - depth - 1.4, c: faceCol },
        ];
        for (const r of rows) {
          positions.push(p.x + nx * r.out, r.y, p.z + nz * r.out);
          colors.push(r.c.r, r.c.g, r.c.b);
        }
      }
      for (let i = 0; i < steps; i += 1) {
        for (let r = 0; r < ROWS - 1; r += 1) {
          const a = base + i * ROWS + r;
          const b = a + 1;
          const c = base + (i + 1) * ROWS + r;
          const d = c + 1;
          indices.push(a, b, c, b, d, c);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    
    
    
    
    const mesh = new THREE.Mesh(geo, surface({
      vertexColors: true, side: THREE.DoubleSide, roughness: 0.98, flatShading: true,
    }));
    mesh.name = `cliff-${zone.id}`;
    applyShadows(mesh, 'cliff');
    group.add(mesh);
  }
  return group;
}







const VIADUCT_MIN = 5;

const PIER_GAP = 15;

















function buildViaducts(path) {
  const group = new THREE.Group();
  group.name = 'viaducts';

  
  
  
  const clearance = new Float64Array(path.count);
  const under = new Float64Array(path.count);
  for (let i = 0; i < path.count; i += 1) {
    const p = path.pts[i];
    const t = path.tangents[i];
    const off = p.width / 2 + KERB_WIDTH + SHOULDER + 5;
    let ground = Infinity;
    for (const side of [1, -1]) {
      const x = p.x + t.z * off * side;
      const z = p.z - t.x * off * side;
      ground = Math.min(ground, groundMeshHeightAt(path, x, z));
    }
    under[i] = ground;
    clearance[i] = (p.y ?? 0) - ground;
  }

  const fascia = buildFascia(path, clearance);
  if (fascia) group.add(fascia);

  
  const legs = [];
  let nextS = 0;
  for (let i = 0; i < path.count; i += 1) {
    if (path.s[i] < nextS) continue;
    nextS = path.s[i] + PIER_GAP;
    if (clearance[i] < VIADUCT_MIN) continue;
    legs.push({ i, drop: clearance[i], ground: under[i] });
  }
  if (!legs.length) return group;

  const postGeo = new THREE.CylinderGeometry(0.55, 0.85, 1, 6);
  postGeo.translate(0, 0.5, 0);          
  const braceGeo = new THREE.BoxGeometry(1, 0.34, 0.34);
  const posts = new THREE.InstancedMesh(
    postGeo, surface({ color: PALETTE.pier, flatShading: true }), legs.length * 2,
  );
  const braces = new THREE.InstancedMesh(
    braceGeo, surface({ color: PALETTE.pierDark, flatShading: true }), legs.length * 2,
  );
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const sc = new THREE.Vector3();
  let pi = 0; let bi = 0;
  for (const leg of legs) {
    const p = path.pts[leg.i];
    const t = path.tangents[leg.i];
    const off = p.width / 2 - 1.5;
    const yaw = Math.atan2(t.x, t.z);
    for (const side of [1, -1]) {
      const x = p.x + t.z * off * side;
      const z = p.z - t.x * off * side;
      e.set(0, yaw, 0);
      q.setFromEuler(e);
      v.set(x, leg.ground - 0.8, z);
      sc.set(1, leg.drop + 1.0, 1);
      posts.setMatrixAt(pi, m.compose(v, q, sc));
      pi += 1;
    }
    
    
    const x0 = p.x + t.z * off; const z0 = p.z - t.x * off;
    const x1 = p.x - t.z * off; const z1 = p.z + t.x * off;
    for (const up of [0.34, 0.72]) {
      e.set(0, Math.atan2(x1 - x0, z1 - z0) + Math.PI / 2, 0);
      q.setFromEuler(e);
      v.set((x0 + x1) / 2, leg.ground + leg.drop * up, (z0 + z1) / 2);
      sc.set(Math.hypot(x1 - x0, z1 - z0), 1, 1);
      braces.setMatrixAt(bi, m.compose(v, q, sc));
      bi += 1;
    }
  }
  
  
  const hidden = m.compose(new THREE.Vector3(0, -1000, 0), new THREE.Quaternion(), new THREE.Vector3(0, 0, 0));
  for (let i = pi; i < legs.length * 2; i += 1) posts.setMatrixAt(i, hidden);
  for (let i = bi; i < legs.length * 2; i += 1) braces.setMatrixAt(i, hidden);
  posts.instanceMatrix.needsUpdate = true;
  braces.instanceMatrix.needsUpdate = true;
  posts.castShadow = true;
  group.add(posts, braces);
  return group;
}









function buildFascia(path, clearance) {
  const n = path.count;
  let any = false;
  const positions = [];
  const indices = [];
  const depthAt = (i) => {
    
    
    const c = clearance[i];
    if (c < 1.2) return 0;
    const u = Math.min(1, (c - 1.2) / 3);
    return (0.5 + Math.min(2.2, c * 0.12)) * (u * u * (3 - 2 * u));
  };
  for (const side of [1, -1]) {
    const base = positions.length / 3;
    for (let i = 0; i < n; i += 1) {
      const p = path.pts[i];
      const t = path.tangents[i];
      const off = ((p.width / 2) + KERB_WIDTH) * side;
      const d = depthAt(i);
      if (d > 0) any = true;
      positions.push(p.x + t.z * off, (p.y ?? 0) + 0.05, p.z - t.x * off);
      positions.push(p.x + t.z * off, (p.y ?? 0) - d, p.z - t.x * off);
    }
    for (let i = 0; i < n; i += 1) {
      const a = base + i * 2; const b = a + 1;
      const c = base + ((i + 1) % n) * 2; const dd = c + 1;
      indices.push(a, b, c, b, dd, c);
    }
  }
  if (!any) return null;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, surface({
    color: PALETTE.deck, side: THREE.DoubleSide, roughness: 0.95, flatShading: true,
  }));
  mesh.name = 'fascia';
  
  
  
  
  
  applyShadows(mesh, 'fascia');
  return mesh;
}
















const MARKER_GAP = 9;










function buildMarkerPosts(path, theme) {
  const group = new THREE.Group();
  group.name = 'markers';
  const perSide = Math.max(8, Math.floor(path.length / MARKER_GAP));
  const count = perSide * 2;

  const postGeo = new THREE.BoxGeometry(0.11, 1.05, 0.11);
  postGeo.translate(0, 0.52, 0);
  const capGeo = new THREE.BoxGeometry(0.15, 0.24, 0.15);
  capGeo.translate(0, 0.92, 0);

  const postMat = surface({
    
    
    
    color: theme === 'snow' ? PALETTE.night : PALETTE.marker,
    flatShading: true,
  });
  const capMat = surface({
    color: theme === 'snow' ? PALETTE.barnRed : PALETTE.markerWarn, flatShading: true,
  });

  const posts = new THREE.InstancedMesh(postGeo, postMat, count);
  const caps = new THREE.InstancedMesh(capGeo, capMat, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);

  
  
  let seed = 0x9051 ^ Math.floor(path.length);
  const rng = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };

  let idx = 0;
  for (const side of [1, -1]) {
    for (let i = 0; i < perSide; i += 1) {
      const sAt = (path.length * i) / perSide;
      const li = Math.min(path.count - 1, Math.floor((sAt / path.length) * path.count));
      const p = path.pts[li];
      const t = path.tangents[li];
      
      const off = ((p.width / 2) + KERB_WIDTH + 0.85) * side;
      const x = p.x + t.z * off;
      const z = p.z - t.x * off;
      
      if (nearBranchMouth(path, x, z, 5.5)) continue;
      e.set((rng() - 0.5) * 0.13, Math.atan2(t.x, t.z), (rng() - 0.5) * 0.13);
      q.setFromEuler(e);
      
      
      
      
      v.set(x, (p.y ?? 0) + camberEdgeY(path.camber, li, side), z);
      const scale = one.clone().setScalar(0.85 + rng() * 0.3);
      posts.setMatrixAt(idx, m.compose(v, q, scale));
      caps.setMatrixAt(idx, m.compose(v, q, scale));
      idx += 1;
    }
  }
  
  
  
  const hidden = m.compose(new THREE.Vector3(0, -1000, 0), new THREE.Quaternion(), new THREE.Vector3(0, 0, 0));
  for (let i = idx; i < count; i += 1) { posts.setMatrixAt(i, hidden); caps.setMatrixAt(i, hidden); }
  posts.instanceMatrix.needsUpdate = true;
  caps.instanceMatrix.needsUpdate = true;
  
  
  
  
  
  
  
  
  
  
  
  
  
  applyShadows(posts, 'markerPost');
  applyShadows(caps, 'markerPost');
  group.add(posts, caps);
  return group;
}


function nearBranchMouth(path, x, z, radius) {
  for (const br of path.branches ?? []) {
    for (const p of [br.pts[0], br.pts[br.count - 1]]) {
      if (Math.hypot(p.x - x, p.z - z) < radius) return true;
    }
  }
  return false;
}


function onAnyBranch(path, x, z, pad = 0) {
  for (const br of path.branches ?? []) {
    if (nearestOnBranch(br, x, z).dist <= br.width / 2 + br.shoulder + pad) return true;
  }
  return false;
}






const RAIL_RADIAL = 6;


const RAIL_POST_GAP = 6;

























function buildRails(path, track) {
  const group = new THREE.Group();
  group.name = 'rails';
  const rails = trackRails(path, track);
  if (!rails || !rails.spans || !rails.spans.length) return group;

  const positions = [];
  const colors = [];
  const indices = [];
  const posts = [];
  const bright = new THREE.Color(PALETTE.markerWarn);
  const dark = new THREE.Color(PALETTE.deck);

  for (let s = 0; s < 2; s += 1) {
    
    
    
    const side = s === 0 ? 1 : -1;
    let strip = [];
    
    let nextPost = -Infinity;

    const flush = () => {
      if (strip.length >= 2) {
        const base = positions.length / 3;
        for (const ring of strip) {
          for (let a = 0; a < RAIL_RADIAL; a += 1) {
            const th = (a / RAIL_RADIAL) * Math.PI * 2;
            const c = Math.cos(th);
            const up = Math.sin(th);
            positions.push(
              ring.x + ring.nx * c * RAIL_RADIUS,
              ring.y + up * RAIL_RADIUS,
              ring.z + ring.nz * c * RAIL_RADIUS,
            );
            
            
            
            const t = Math.max(0, Math.min(1, up * 0.5 + 0.5));
            colors.push(
              dark.r + (bright.r - dark.r) * t,
              dark.g + (bright.g - dark.g) * t,
              dark.b + (bright.b - dark.b) * t,
            );
          }
        }
        for (let i = 0; i < strip.length - 1; i += 1) {
          for (let a = 0; a < RAIL_RADIAL; a += 1) {
            const b = (a + 1) % RAIL_RADIAL;
            const p0 = base + i * RAIL_RADIAL + a;
            const p1 = base + i * RAIL_RADIAL + b;
            const q0 = base + (i + 1) * RAIL_RADIAL + a;
            const q1 = base + (i + 1) * RAIL_RADIAL + b;
            indices.push(p0, p1, q0, p1, q1, q0);
          }
        }
      }
      strip = [];
    };

    for (let i = 0; i <= path.count; i += 1) {
      const j = i % path.count;
      const on = i < path.count ? rails.on[j * 2 + s] : 0;
      if (!on) { flush(); continue; }
      const p = path.pts[j];
      const t = path.tangents[j];
      const off = ((p.width / 2) + RAIL_AT) * side;
      const x = p.x + t.z * off;
      const z = p.z - t.x * off;
      
      
      
      const y = (p.y ?? 0) + camberEdgeY(path.camber, j, side) + RAIL_HEIGHT;
      strip.push({ x, y, z, nx: t.z, nz: -t.x });

      const arc = path.s[j];
      if (arc >= nextPost) {
        nextPost = arc + RAIL_POST_GAP;
        
        
        
        
        
        const ground = groundMeshHeightAt(path, x, z);
        posts.push({ x, y, z, yaw: Math.atan2(t.x, t.z), drop: Math.max(0.35, Math.min(2.6, y - ground)) });
      }
    }
    flush();
  }

  if (indices.length) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, surface({
      vertexColors: true, roughness: 0.42, metalness: 0.15,
    }));
    mesh.name = 'railTube';
    applyShadows(mesh, 'grindRail');
    group.add(mesh);
  }

  if (posts.length) {
    
    
    const geo = new THREE.BoxGeometry(0.13, 1, 0.13);
    geo.translate(0, -0.5, 0);           
    const mat = surface({ color: PALETTE.deck, flatShading: true });
    const inst = new THREE.InstancedMesh(geo, mat, posts.length);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const v = new THREE.Vector3();
    const sc = new THREE.Vector3();
    for (let i = 0; i < posts.length; i += 1) {
      const post = posts[i];
      e.set(0, post.yaw, 0);
      q.setFromEuler(e);
      v.set(post.x, post.y, post.z);
      sc.set(1, post.drop, 1);
      inst.setMatrixAt(i, m.compose(v, q, sc));
    }
    inst.instanceMatrix.needsUpdate = true;
    inst.name = 'railPosts';
    applyShadows(inst, 'grindRail');
    group.add(inst);
  }
  return group;
}


function buildStartLine(path) {
  const c = path.pts[0];
  const t = path.tangents[0];
  const group = new THREE.Group();
  group.name = 'startLine';
  const cols = 12;
  const rows = 2;
  const depth = 2.4;
  const cellW = c.width / cols;
  const cellD = depth / rows;
  const light = surface({ color: PALETTE.line });
  const dark = surface({ color: PALETTE.night });
  const geo = new THREE.PlaneGeometry(cellW, cellD);
  geo.rotateX(-Math.PI / 2);
  for (let i = 0; i < cols; i += 1) {
    for (let j = 0; j < rows; j += 1) {
      const m = new THREE.Mesh(geo, (i + j) % 2 === 0 ? light : dark);
      const lat = (i + 0.5) * cellW - c.width / 2;
      const along = (j + 0.5) * cellD - depth / 2;
      m.position.set(
        c.x + t.z * lat + t.x * along,
        
        
        
        
        
        
        
        c.y + 0.04 + camberLiftAt(path.camber, 0, lat / Math.max(1e-6, c.width / 2)),
        c.z - t.x * lat + t.z * along,
      );
      m.rotation.y = Math.atan2(t.x, t.z);
      
      
      
      
      
      applyShadows(m, 'startLine');
      group.add(m);
    }
  }
  return group;
}











function inWater(path, frac) {
  for (const z of path.hazards ?? []) {
    
    
    
    
    
    
    
    
    if (RESPAWNS.has(z.kind) && inSpan(frac, z.from, z.to)) return true;
  }
  return false;
}































function buildEdgeGuards(path, track) {
  const group = new THREE.Group();
  group.name = 'edgeGuards';
  const guards = trackGuards(path, track);
  if (!guards.spans.length) return group;

  const theme = track.theme ?? 'summer';
  const cold = theme === 'snow';
  
  
  
  
  
  
  
  const bankCol = new THREE.Color(cold ? PALETTE.packedSnow
    : theme === 'mud' ? PALETTE.mud : PALETTE.grassDark);
  const crestCol = new THREE.Color(cold ? PALETTE.snowCrest
    : theme === 'mud' ? PALETTE.hedgeMud : PALETTE.grass);
  const faceCol = new THREE.Color(cold ? PALETTE.rockCold : PALETTE.rock);

  
  const positions = [];
  const colors = [];
  const indices = [];
  const ROWS = 6;
  const perM = path.count / path.length;
  const stride = Math.max(1, Math.round(3.5 * perM));

  
  
  const dressed = { stones: [], barrels: [], wall: [] };
  const spacing = { stones: 7.5, barrels: 6.0, wall: 2.4 };

  for (let s = 0; s < 2; s += 1) {
    const side = s === 0 ? 1 : -1;
    
    
    
    
    
    
    
    
    
    const nextAt = { stones: 0, barrels: 0, wall: 0 };
    let strip = [];
    const flush = () => {
      if (strip.length >= 2) {
        const base = positions.length / 3;
        for (const ring of strip) {
          for (const r of ring) {
            positions.push(r.x, r.y, r.z);
            colors.push(r.c.r, r.c.g, r.c.b);
          }
        }
        for (let i = 0; i < strip.length - 1; i += 1) {
          for (let r = 0; r < ROWS - 1; r += 1) {
            const a = base + i * ROWS + r;
            const b = a + 1;
            const c = base + (i + 1) * ROWS + r;
            const d = c + 1;
            indices.push(a, b, c, b, d, c);
          }
        }
      }
      strip = [];
    };
    
    
    
    
    for (let i = 0; i <= path.count; i += stride) {
      const j = i % path.count;
      const k = j * 2 + s;
      const h = i < path.count ? guards.height[k] : 0;
      if (!(h > 0)) { flush(); continue; }
      const p = path.pts[j];
      const t = path.tangents[j];
      
      
      
      
      
      
      
      
      
      const y0 = (p.y ?? 0) + camberEdgeY(path.camber, j, side);
      
      
      
      const { width: reach, flat, crest } = guardSection(guards.reach[k]);
      const half = p.width / 2;
      
      
      
      
      const ox = p.x + t.z * ((half + reach) * side);
      const oz = p.z - t.x * ((half + reach) * side);
      const outside = groundMeshHeightAt(path, ox, oz);
      const fall = Math.max(0.6, Math.min(4.5, y0 + h - outside));
      const at = (out, y, c) => ({
        x: p.x + t.z * ((half + out) * side),
        y,
        z: p.z - t.x * ((half + out) * side),
        c,
      });
      const rise = crest - flat;
      strip.push([
        
        
        
        
        at(0, y0 - 0.01, bankCol),
        at(flat, y0 - 0.005, bankCol),
        
        
        
        
        at(flat + rise * 0.45, y0 + h * 0.16, bankCol),
        at(flat + rise * 0.80, y0 + h * 0.70, crestCol),
        at(reach, y0 + h, crestCol),
        at(reach, y0 + h - fall, faceCol),
      ]);

      
      
      
      const tier = guards.tier[k];
      
      
      
      
      
      if (tier && h > tier.height * GUARD_DRESS_MIN) {
        const arc = path.s[j];
        const put = (kind) => {
          if (arc < nextAt[kind]) return;
          nextAt[kind] = arc + spacing[kind];
          const out = half + (crest + reach) * 0.5;
          dressed[kind].push({
            x: p.x + t.z * (out * side),
            y: y0 + h,
            z: p.z - t.x * (out * side),
            yaw: Math.atan2(t.x, t.z),
          });
        };
        if (tier.dress === 'wall') {
          put('wall');
          
          
          
          
          
          
          
          if (Math.floor(arc / 13) !== Math.floor((arc - spacing.wall) / 13)) put('barrels');
        } else put(tier.dress);
      }
    }
    flush();
  }

  if (indices.length) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const mesh = new THREE.Mesh(geo, addGroundDetail(surface({
      vertexColors: true, side: THREE.DoubleSide, roughness: 0.96,
      rim: false, unique: true,
    }), { scale: 0.055, strength: 0.26 }));
    mesh.name = 'guardBank';
    applyShadows(mesh, 'guardBank');
    group.add(mesh);
  }

  
  
  
  
  
  
  let seed = (0x9a1de5 ^ Math.floor(path.length * 11)) >>> 0 || 1;
  const rng = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed >>> 0) / 4294967296; };

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const sc = new THREE.Vector3();

  const place = (list, geoms, mats, sizer) => {
    if (!list.length) return;
    const meshes = geoms.map((g, gi) => new THREE.InstancedMesh(g, mats[gi], list.length));
    list.forEach((spot, idx) => {
      const z = sizer(rng);
      e.set(z.lean * (rng() - 0.5), spot.yaw + z.turn * (rng() - 0.5), z.lean * (rng() - 0.5));
      q.setFromEuler(e);
      v.set(spot.x, spot.y + z.lift, spot.z);
      sc.set(z.sx, z.sy, z.sz);
      for (const mesh of meshes) mesh.setMatrixAt(idx, m.compose(v, q, sc));
    });
    for (const mesh of meshes) {
      mesh.instanceMatrix.needsUpdate = true;
      
      
      
      
      mesh.castShadow = false;
      mesh.receiveShadow = true;
      group.add(mesh);
    }
    
    
    
    
    
  };

  
  
  
  
  
  
  
  
  
  
  const stoneGeo = new THREE.IcosahedronGeometry(0.46, 0);
  stoneGeo.translate(0, 0.16, 0);
  place(dressed.stones, [stoneGeo],
    [surface({ color: cold ? PALETTE.rockCold : PALETTE.rock, flatShading: true })],
    (r) => ({
      sx: 0.75 + r() * 0.55, sy: 0.6 + r() * 0.5, sz: 0.75 + r() * 0.55,
      lean: 0.5, turn: 2.4, lift: -0.16,
    }));

  
  
  
  
  const barrelGeo = new THREE.CylinderGeometry(0.42, 0.42, 1.05, 9);
  barrelGeo.translate(0, 0.52, 0);
  const hoopGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.16, 9);
  hoopGeo.translate(0, 0.62, 0);
  place(dressed.barrels, [barrelGeo, hoopGeo], [
    surface({ color: PALETTE.barn, flatShading: true }),
    surface({ color: PALETTE.line, flatShading: true }),
  ], (r) => ({ sx: 1, sy: 0.92 + r() * 0.2, sz: 1, lean: 0.1, turn: 3.1, lift: 0 }));

  
  
  
  
  const blockGeo = new THREE.BoxGeometry(1.15, 0.78, 0.62);
  blockGeo.translate(0, 0.39, 0);
  const capGeo = new THREE.BoxGeometry(1.3, 0.2, 0.76);
  capGeo.translate(0, 0.88, 0);
  place(dressed.wall, [blockGeo, capGeo], [
    surface({ color: cold ? PALETTE.rockCold : PALETTE.rock, flatShading: true }),
    surface({ color: cold ? PALETTE.rockLipCold : PALETTE.rockLip, flatShading: true }),
  ], (r) => ({
    sx: 0.94 + r() * 0.18, sy: 0.88 + r() * 0.26, sz: 1,
    lean: 0.09, turn: 0.12, lift: -0.06,
  }));

  return group;
}

export function buildFences(path, count, seed = 0xfe4ce5) {
  const group = new THREE.Group();
  group.name = 'fences';
  let s = seed >>> 0 || 1;
  const rng = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };

  const postGeo = new THREE.BoxGeometry(0.16, 1.35, 0.16);
  const postMat = surface({ color: PALETTE.fence });
  const railGeo = new THREE.BoxGeometry(1, 0.11, 0.07);
  const railMat = surface({ color: PALETTE.fenceDark });

  const posts = new THREE.InstancedMesh(postGeo, postMat, count);
  const rails = new THREE.InstancedMesh(railGeo, railMat, count * 2);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const pos = new THREE.Vector3();
  const scl = new THREE.Vector3();

  let railIdx = 0;
  const perSide = Math.floor(count / 2);
  let idx = 0;
  for (const side of [1, -1]) {
    for (let i = 0; i < perSide && idx < count; i += 1) {
      const sAt = (path.length * i) / perSide;
      const li = Math.min(path.count - 1, Math.floor((sAt / path.length) * path.count));
      const p = path.pts[li];
      const t = path.tangents[li];
      const off = ((p.width / 2) + KERB_WIDTH + SHOULDER + 1.4 + rng() * 0.5) * side;
      const x = p.x + t.z * off;
      const z = p.z - t.x * off;
      
      
      
      
      
      
      
      
      
      
      if (onAnyBranch(path, x, z, 1.5)) continue;
      
      
      
      
      
      if (inWater(path, sAt / path.length)) continue;
      const yaw = Math.atan2(t.x, t.z);
      const height = 0.85 + rng() * 0.35;
      e.set((rng() - 0.5) * 0.16, yaw + (rng() - 0.5) * 0.2, (rng() - 0.5) * 0.16);
      q.setFromEuler(e);
      pos.set(x, height * 0.62, z);
      scl.set(1, height, 1);
      posts.setMatrixAt(idx, m.compose(pos, q, scl));

      
      
      
      const nj = Math.min(path.count - 1, Math.floor((((sAt + path.length / perSide) % path.length) / path.length) * path.count));
      const np = path.pts[nj];
      const nt = path.tangents[nj];
      const nx = np.x + nt.z * off;
      const nz = np.z - nt.x * off;
      const span = Math.hypot(nx - x, nz - z);
      if (span < 22) {
        for (const railY of [0.42, 0.78]) {
          e.set(0, Math.atan2(nx - x, nz - z) + Math.PI / 2, 0);
          q.setFromEuler(e);
          pos.set((x + nx) / 2, height * railY, (z + nz) / 2);
          scl.set(span, 1, 1);
          if (railIdx < count * 2) rails.setMatrixAt(railIdx++, m.compose(pos, q, scl));
        }
      }
      idx += 1;
    }
  }
  
  
  
  
  scl.set(0, 0, 0);
  q.identity(); pos.set(0, -1000, 0);
  for (let i = idx; i < count; i += 1) posts.setMatrixAt(i, m.compose(pos, q, scl));
  for (let i = railIdx; i < count * 2; i += 1) rails.setMatrixAt(i, m.compose(pos, q, scl));
  posts.instanceMatrix.needsUpdate = true;
  rails.instanceMatrix.needsUpdate = true;
  posts.castShadow = true;
  group.add(posts, rails);
  return group;
}
