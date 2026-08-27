














import * as THREE from 'three';
import { PALETTE } from '../palette.js';
import { makeRoadTexture, makeGrassTexture } from './textures.js';





export const SHOULDER = 7;

const KERB_WIDTH = 1.6;



const KERB_STRIPE = 4;








export function buildTrackMesh(path, track) {
  const group = new THREE.Group();
  group.name = 'track';
  const theme = track.theme ?? 'summer';

  group.add(buildGround(path, theme));
  group.add(buildRoad(path));
  group.add(buildKerbs(path));
  group.add(buildVerge(path, theme));
  group.add(buildStartLine(path));
  return group;
}













function buildRoad(path) {
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

  const map = makeRoadTexture();
  map.repeat.set(1, 1);
  map.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map }));
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
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    group.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
      vertexColors: true, side: THREE.DoubleSide,
    })));
  }
  return group;
}








function buildVerge(path, theme) {
  const n = path.count;
  const positions = new Float32Array(n * 4 * 3);
  const indices = [];
  
  
  
  
  
  const colour = theme === 'snow' ? PALETTE.snowHollow
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
  
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({
    color: colour, side: THREE.DoubleSide,
  }));
  mesh.name = 'verge';
  return mesh;
}


function buildGround(path, theme) {
  const b = path.bounds;
  const w = (b.maxX - b.minX) + 400;
  const h = (b.maxZ - b.minZ) + 400;
  const geo = new THREE.PlaneGeometry(w, h, 1, 1);
  geo.rotateX(-Math.PI / 2);
  const map = makeGrassTexture(theme);
  
  
  
  map.repeat.set(w / 12, h / 12);
  map.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map }));
  mesh.position.set((b.minX + b.maxX) / 2, -0.05, (b.minZ + b.maxZ) / 2);
  mesh.name = 'ground';
  mesh.receiveShadow = true;
  return mesh;
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
  const light = new THREE.MeshLambertMaterial({ color: PALETTE.line });
  const dark = new THREE.MeshLambertMaterial({ color: PALETTE.night });
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










export function buildFences(path, count, seed = 0xfe4ce5) {
  const group = new THREE.Group();
  group.name = 'fences';
  let s = seed >>> 0 || 1;
  const rng = () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };

  const postGeo = new THREE.BoxGeometry(0.16, 1.35, 0.16);
  const postMat = new THREE.MeshLambertMaterial({ color: PALETTE.fence });
  const railGeo = new THREE.BoxGeometry(1, 0.11, 0.07);
  const railMat = new THREE.MeshLambertMaterial({ color: PALETTE.fenceDark });

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
