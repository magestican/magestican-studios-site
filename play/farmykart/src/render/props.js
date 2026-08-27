













import * as THREE from 'three';
import { PALETTE } from '../palette.js';
import { makeBarnTexture } from './textures.js';
import { SHOULDER } from './trackMesh.js';

function rngFrom(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; };
}










function besideTrack(path, rng, minOut, maxOut) {
  const i = Math.floor(rng() * path.count) % path.count;
  const p = path.pts[i];
  const t = path.tangents[i];
  const side = rng() > 0.5 ? 1 : -1;
  const out = ((p.width / 2) + SHOULDER + minOut + rng() * (maxOut - minOut)) * side;
  return { x: p.x + t.z * out, y: p.y, z: p.z - t.x * out, index: i, side };
}

function instanced(geo, mat, count) {
  const m = new THREE.InstancedMesh(geo, mat, Math.max(1, count));
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
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

  if (s.sunflowers) group.add(buildSunflowers(path, rng, s.sunflowers));
  if (s.trees) group.add(buildTrees(path, rng, s.trees, track.theme));
  if (s.bales) group.add(buildBales(path, rng, s.bales, track.theme));
  if (s.snowmen) group.add(buildSnowmen(path, rng, s.snowmen));
  if (s.barns) group.add(buildBarns(path, rng, s.barns));
  if (s.silos) group.add(buildSilos(path, rng, s.silos));
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

  const stems = instanced(stemGeo, new THREE.MeshLambertMaterial({ color: PALETTE.tree, flatShading: true }), count);
  const heads = instanced(headGeo, new THREE.MeshLambertMaterial({ color: PALETTE.sunflower, flatShading: true }), count);
  const centres = instanced(centreGeo, new THREE.MeshLambertMaterial({ color: PALETTE.sunflowerC, flatShading: true }), count);

  let i = 0;
  while (i < count) {
    const anchor = besideTrack(path, rng, 2, 40);
    const clump = 4 + Math.floor(rng() * 9);
    for (let c = 0; c < clump && i < count; c += 1, i += 1) {
      const x = anchor.x + (rng() - 0.5) * 9;
      const z = anchor.z + (rng() - 0.5) * 9;
      
      
      const yaw = 2.1 + (rng() - 0.5) * 0.9;
      const scale = 0.8 + rng() * 0.55;
      place(stems, i, x, 0, z, yaw, scale);
      place(heads, i, x, 0, z, yaw, scale);
      place(centres, i, x, 0, z, yaw, scale);
    }
  }
  for (const m of [stems, heads, centres]) { m.instanceMatrix.needsUpdate = true; m.castShadow = true; }
  group.add(stems, heads, centres);
  return group;
}


function buildTrees(path, rng, count, theme) {
  const group = new THREE.Group();
  group.name = 'trees';
  const trunkGeo = new THREE.CylinderGeometry(0.28, 0.42, 3.2, 6);
  trunkGeo.translate(0, 1.6, 0);
  const canopyGeo = new THREE.IcosahedronGeometry(2.1, 0);
  canopyGeo.translate(0, 4.2, 0);
  const canopy2Geo = new THREE.IcosahedronGeometry(1.5, 0);
  canopy2Geo.translate(0.9, 3.2, 0.5);

  const leaf = theme === 'snow' ? 0x4a6b52 : theme === 'mud' ? 0x3a5c2c : PALETTE.tree;
  const trunks = instanced(trunkGeo, new THREE.MeshLambertMaterial({ color: PALETTE.treeTrunk, flatShading: true }), count);
  const tops = instanced(canopyGeo, new THREE.MeshLambertMaterial({ color: leaf, flatShading: true }), count);
  const tops2 = instanced(canopy2Geo, new THREE.MeshLambertMaterial({ color: leaf, flatShading: true }), count);

  for (let i = 0; i < count; i += 1) {
    const p = besideTrack(path, rng, 6, 90);
    const yaw = rng() * Math.PI * 2;
    const scale = 0.75 + rng() * 0.9;
    place(trunks, i, p.x, 0, p.z, yaw, scale);
    place(tops, i, p.x, 0, p.z, yaw, scale);
    place(tops2, i, p.x, 0, p.z, yaw + 1.7, scale);
  }
  for (const m of [trunks, tops, tops2]) { m.instanceMatrix.needsUpdate = true; m.castShadow = true; }
  group.add(trunks, tops, tops2);
  return group;
}


function buildBales(path, rng, count, theme) {
  const group = new THREE.Group();
  group.name = 'bales';
  const geo = new THREE.CylinderGeometry(0.95, 0.95, 1.5, 10);
  geo.rotateZ(Math.PI / 2);
  geo.translate(0, 0.95, 0);
  const colour = theme === 'snow' ? 0xcbb87f : PALETTE.haybale;
  const bales = instanced(geo, new THREE.MeshLambertMaterial({ color: colour, flatShading: true }), count);
  for (let i = 0; i < count; i += 1) {
    const p = besideTrack(path, rng, 1.5, 26);
    place(bales, i, p.x, 0, p.z, rng() * Math.PI * 2, 0.85 + rng() * 0.4);
  }
  bales.instanceMatrix.needsUpdate = true;
  bales.castShadow = true;
  group.add(bales);
  return group;
}


function buildSnowmen(path, rng, count) {
  const group = new THREE.Group();
  group.name = 'snowmen';
  const white = new THREE.MeshLambertMaterial({ color: PALETTE.snow, flatShading: true });
  for (let i = 0; i < count; i += 1) {
    const p = besideTrack(path, rng, 2, 30);
    const g = new THREE.Group();
    const scale = 0.8 + rng() * 0.5;
    const radii = [0.62, 0.44, 0.30];
    let y = 0;
    for (const r of radii) {
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), white);
      y += r * 0.86;
      s.position.y = y;
      y += r * 0.28;
      g.add(s);
    }
    const nose = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.34, 5),
      new THREE.MeshLambertMaterial({ color: 0xe08a3c, flatShading: true }),
    );
    nose.rotation.x = Math.PI / 2;
    nose.position.set(0, y - 0.16, 0.30);
    g.add(nose);
    const hat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.24, 0.24, 0.34, 8),
      new THREE.MeshLambertMaterial({ color: PALETTE.night, flatShading: true }),
    );
    hat.position.y = y + 0.16;
    g.add(hat);
    g.position.set(p.x, 0, p.z);
    g.rotation.y = rng() * Math.PI * 2;
    g.scale.setScalar(scale);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    group.add(g);
  }
  return group;
}





function buildBarns(path, rng, count) {
  const group = new THREE.Group();
  group.name = 'barns';
  const wallMat = new THREE.MeshLambertMaterial({ map: makeBarnTexture() });
  const roofMat = new THREE.MeshLambertMaterial({ color: PALETTE.barnRoof, flatShading: true });
  for (let i = 0; i < count; i += 1) {
    const p = besideTrack(path, rng, 34, 80);
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
    roof.position.y = h + w * 0.30;
    g.add(roof);
    g.position.set(p.x, 0, p.z);
    g.rotation.y = rng() * Math.PI * 2;
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    group.add(g);
  }
  return group;
}


function buildSilos(path, rng, count) {
  const group = new THREE.Group();
  group.name = 'silos';
  const body = new THREE.MeshLambertMaterial({ color: PALETTE.silo, flatShading: true });
  const cap = new THREE.MeshLambertMaterial({ color: PALETTE.barnRoof, flatShading: true });
  for (let i = 0; i < count; i += 1) {
    const p = besideTrack(path, rng, 40, 100);
    const g = new THREE.Group();
    const r = 3.2 + rng() * 1.4;
    const h = 13 + rng() * 7;
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 12), body);
    tube.position.y = h / 2;
    g.add(tube);
    const dome = new THREE.Mesh(new THREE.ConeGeometry(r * 1.06, r * 1.1, 12), cap);
    dome.position.y = h + r * 0.55;
    g.add(dome);
    g.position.set(p.x, 0, p.z);
    g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
    group.add(g);
  }
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
