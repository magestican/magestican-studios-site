

















import * as THREE from 'three';
import { generateBackdrop, faceShade, mixHex } from '../../../../web-engine/procgen/backdropGen.js';





const UNIT = new THREE.BoxGeometry(1, 1, 1);
const FACE_NORMALS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];



const QUAD = new THREE.PlaneGeometry(1, 1);



export function addMapBackdrop(scene, world) {
  const data = generateBackdrop(world.mapId ?? world.map?.id, world.seed);
  const group = new THREE.Group();
  group.name = 'mapBackdrop';
  scene.add(group);
  if (!data) return group;

  group.add(buildSkirt(data));
  group.add(buildScenery(data));
  return group;
}








function buildSkirt(data) {
  const { inner, outer, y, hex } = data.skirt;
  const cx = (inner.x0 + inner.x1) / 2, cz = (inner.z0 + inner.z1) / 2;
  
  
  
  
  const xs = [cx - outer, inner.x0, inner.x1, cx + outer];
  const zs = [cz - outer, inner.z0, inner.z1, cz + outer];
  const pos = [];
  const idx = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (i === 1 && j === 1) continue;
      const b = pos.length / 3;
      
      
      pos.push(xs[i], y, zs[j], xs[i + 1], y, zs[j],
               xs[i], y, zs[j + 1], xs[i + 1], y, zs[j + 1]);
      idx.push(b, b + 2, b + 1, b + 2, b + 3, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color: new THREE.Color(hex), fog: true,
  }));
  mesh.name = 'backdropSkirt';
  return mesh;
}



function buildScenery(data) {
  const boxVerts = UNIT.attributes.position.count;          
  const boxIdx = UNIT.index.count;                          
  const quadVerts = QUAD.attributes.position.count;         
  const quadIdx = QUAD.index.count;                         
  const nV = data.solids.length * boxVerts + data.lights.length * quadVerts;
  const nI = data.solids.length * boxIdx + data.lights.length * quadIdx;

  const position = new Float32Array(nV * 3);
  const color = new Float32Array(nV * 3);
  const index = new Uint32Array(nI);
  let vo = 0, io = 0;

  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  const src = UNIT.attributes.position.array;
  const srcIdx = UNIT.index.array;
  const v = new THREE.Vector3();

  for (const b of data.solids) {
    
    
    m.makeRotationY(b.yaw);
    m.setPosition(b.x, b.y + b.h / 2, b.z);
    const base = vo;
    for (let i = 0; i < boxVerts; i++) {
      v.set(src[i * 3] * b.w, src[i * 3 + 1] * b.h, src[i * 3 + 2] * b.d).applyMatrix4(m);
      const o = (vo + i) * 3;
      position[o] = v.x; position[o + 1] = v.y; position[o + 2] = v.z;
    }
    
    
    
    
    const cy = Math.cos(b.yaw), sy = Math.sin(b.yaw);
    for (let f = 0; f < 6; f++) {
      const [nx, ny, nz] = FACE_NORMALS[f];
      const wx = nx * cy + nz * sy;
      const wz = -nx * sy + nz * cy;
      const [r, g, bl] = mixHex(b.shade, b.lit, faceShade(wx, ny, wz));
      c.setRGB(r / 255, g / 255, bl / 255, THREE.SRGBColorSpace);
      for (let k = 0; k < 4; k++) {
        const o = (vo + f * 4 + k) * 3;
        color[o] = c.r; color[o + 1] = c.g; color[o + 2] = c.b;
      }
    }
    for (let i = 0; i < boxIdx; i++) index[io + i] = base + srcIdx[i];
    vo += boxVerts; io += boxIdx;
  }

  const qSrc = QUAD.attributes.position.array;
  const qIdx = QUAD.index.array;
  for (const w of data.lights) {
    m.makeRotationY(w.yaw);
    m.setPosition(w.x, w.y, w.z);
    const base = vo;
    c.set(w.hex);
    for (let i = 0; i < quadVerts; i++) {
      v.set(qSrc[i * 3] * w.w, qSrc[i * 3 + 1] * w.h, qSrc[i * 3 + 2]).applyMatrix4(m);
      const o = (vo + i) * 3;
      position[o] = v.x; position[o + 1] = v.y; position[o + 2] = v.z;
      color[o] = c.r; color[o + 1] = c.g; color[o + 2] = c.b;
    }
    for (let i = 0; i < quadIdx; i++) index[io + i] = base + qIdx[i];
    vo += quadVerts; io += quadIdx;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(color, 3));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  geo.computeBoundingSphere();

  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    vertexColors: true,
    
    
    
    fog: false,
  }));
  mesh.name = 'backdropScenery';
  return mesh;
}
