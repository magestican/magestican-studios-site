














import * as THREE from 'three';
import { nearestOnPath, nearestOnBranch } from 'arbelo/trackPath';
import { PALETTE } from '../palette.js';
import { makeRoadTexture, makeGrassTexture, makeShortcutTexture } from './textures.js';
import { surface, addGroundDetail } from './materials.js';
import { waterDepthAt, inSpan } from 'arbelo/trackHazards';





export const SHOULDER = 7;

const KERB_WIDTH = 1.6;



const KERB_STRIPE = 4;








export function buildTrackMesh(path, track) {
  const group = new THREE.Group();
  group.name = 'track';
  const theme = track.theme ?? 'summer';

  group.add(buildGround(path, theme));
  group.add(buildRoad(path, theme));
  group.add(buildShortcuts(path, theme));
  group.add(buildKerbs(path));
  group.add(buildVerge(path, theme));
  group.add(buildMarkerPosts(path, theme));
  group.add(buildStartLine(path));
  return group;
}














const FLAT_OUT = 46;
const HILL_OUT = 150;
const HILL_HEIGHT = 3.2;














export function groundHeightAt(path, x, z) {
  const near = nearestOnPath(path, x, z, null);
  
  
  
  
  
  
  
  
  const roadY = near.y ?? 0;

  
  
  
  
  
  
  const depth = waterDepthAt(path.hazards, {
    frac: near.s / path.length, lateral: near.lateral, width: near.width,
  });
  if (depth != null) return roadY - depth;

  const out = near.dist - near.width / 2;
  if (out <= FLAT_OUT) return roadY;
  
  
  const u = Math.min(1, (out - FLAT_OUT) / (HILL_OUT - FLAT_OUT));
  const ramp = u * u * (3 - 2 * u);
  const a = Math.sin(x * 0.0121 + 1.7) * Math.cos(z * 0.0104 - 0.6);
  const b = Math.sin(x * 0.0298 - 2.3) * Math.cos(z * 0.0331 + 1.1) * 0.42;
  const hills = (a + b) * HILL_HEIGHT;
  
  
  
  return roadY * (1 - ramp) + hills * ramp;
}













function buildRoad(path, theme) {
  const n = path.count;
  const positions = new Float32Array(n * 2 * 3);
  const uvs = new Float32Array(n * 2 * 2);
  const indices = [];

  for (let i = 0; i < n; i += 1) {
    const p = path.pts[i];
    const t = path.tangents[i];
    const half = p.width / 2;
    
    
    positions[i * 6 + 0] = p.x + t.z * half;
    positions[i * 6 + 1] = p.y + 0.02;
    positions[i * 6 + 2] = p.z - t.x * half;
    positions[i * 6 + 3] = p.x - t.z * half;
    positions[i * 6 + 4] = p.y + 0.02;
    positions[i * 6 + 5] = p.z + t.x * half;
    const v = path.s[i] / 8;
    uvs[i * 4 + 0] = 0; uvs[i * 4 + 1] = v;
    uvs[i * 4 + 2] = 1; uvs[i * 4 + 3] = v;
  }
  for (let i = 0; i < n; i += 1) {
    const a = i * 2; const b = i * 2 + 1;
    const j = ((i + 1) % n) * 2; const k = j + 1;
    indices.push(a, b, j, b, k, j);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();

  
  
  
  const map = makeRoadTexture(theme);
  map.repeat.set(1, 1);
  map.colorSpace = THREE.SRGBColorSpace;
  
  
  
  const mesh = new THREE.Mesh(geo, addGroundDetail(
    surface({ map, roughness: 0.94, rim: false }),
    { scale: 0.020, strength: 0.20 },
  ));
  mesh.name = 'road';
  mesh.receiveShadow = true;
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
      positions[i * 6 + 0] = p.x + t.z * inner;
      positions[i * 6 + 1] = p.y + 0.05;
      positions[i * 6 + 2] = p.z - t.x * inner;
      positions[i * 6 + 3] = p.x + t.z * outer;
      
      
      
      positions[i * 6 + 4] = p.y + 0.13;
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
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    group.add(new THREE.Mesh(geo, surface({
      vertexColors: true, side: THREE.DoubleSide,
    })));
  }
  return group;
}








function buildVerge(path, theme) {
  const n = path.count;
  const positions = new Float32Array(n * 4 * 3);
  const indices = [];
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const colour = theme === 'snow' ? 0xccd9e6
    : theme === 'mud' ? PALETTE.mud
      : PALETTE.shoulder;

  let v = 0;
  for (const side of [1, -1]) {
    for (let i = 0; i < n; i += 1) {
      const p = path.pts[i];
      const t = path.tangents[i];
      const inner = ((p.width / 2) + KERB_WIDTH) * side;
      const outer = ((p.width / 2) + KERB_WIDTH + SHOULDER) * side;
      positions[v * 3 + 0] = p.x + t.z * inner;
      positions[v * 3 + 1] = p.y + 0.012;
      positions[v * 3 + 2] = p.z - t.x * inner;
      v += 1;
      positions[v * 3 + 0] = p.x + t.z * outer;
      positions[v * 3 + 1] = p.y - 0.02;
      positions[v * 3 + 2] = p.z - t.x * outer;
      v += 1;
    }
  }
  for (let s = 0; s < 2; s += 1) {
    const base = s * n * 2;
    for (let i = 0; i < n; i += 1) {
      const p0 = base + i * 2; const p1 = p0 + 1;
      const q0 = base + ((i + 1) % n) * 2; const q1 = q0 + 1;
      indices.push(p0, p1, q0, p1, q1, q0);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  
  const mesh = new THREE.Mesh(geo, surface({
    color: colour, side: THREE.DoubleSide,
  }));
  mesh.name = 'verge';
  return mesh;
}




















function buildGround(path, theme) {
  const b = path.bounds;
  
  
  
  
  
  const w = (b.maxX - b.minX) + 900;
  const h = (b.maxZ - b.minZ) + 900;
  const cx = (b.minX + b.maxX) / 2;
  const cz = (b.minZ + b.maxZ) / 2;
  const geo = new THREE.PlaneGeometry(w, h, 64, 64);
  geo.rotateX(-Math.PI / 2);

  
  
  
  
  
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i += 1) {
    const x = pos.getX(i) + cx;
    const z = pos.getZ(i) + cz;
    pos.setY(i, groundHeightAt(path, x, z));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();

  const map = makeGrassTexture(theme);
  
  
  
  
  
  
  
  
  
  
  map.repeat.set(w / 20, h / 20);
  map.colorSpace = THREE.SRGBColorSpace;
  
  
  
  const mesh = new THREE.Mesh(geo, addGroundDetail(
    surface({ map, roughness: 0.97, rim: false }),
    { scale: 0.0055, strength: 0.26, fade: 420 },
  ));
  mesh.position.set(cx, -0.05, cz);
  mesh.name = 'ground';
  mesh.receiveShadow = true;
  return mesh;
}























function buildShortcuts(path, theme) {
  const group = new THREE.Group();
  group.name = 'shortcuts';
  if (!path.branches || path.branches.length === 0) return group;

  const map = makeShortcutTexture(theme);
  map.colorSpace = THREE.SRGBColorSpace;
  const mat = surface({ map });

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
    mesh.receiveShadow = true;
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
      v.set(x, p.y ?? 0, z);
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
  
  
  
  
  
  posts.castShadow = false;
  caps.castShadow = false;
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
        c.y + 0.04,
        c.z - t.x * lat + t.z * along,
      );
      m.rotation.y = Math.atan2(t.x, t.z);
      group.add(m);
    }
  }
  return group;
}











function inWater(path, frac) {
  for (const z of path.hazards ?? []) {
    if (z.kind === 'water' && inSpan(frac, z.from, z.to)) return true;
  }
  return false;
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
