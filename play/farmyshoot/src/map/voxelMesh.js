



import * as THREE from 'three';
import { VOX, VOX_COLOR } from 'arbelo/voxel';
import { makeSnowTexture, makeIceTexture, makeTroddenTexture, makeRutTexture, makeWoodTexture, makeStoneTexture, makeDirtTexture, makeHayTexture, makeBloodTinted, makeBarnPaintTexture } from './textures.js';
import { makeRockTexture, makeRinkTexture, makeBoardsTexture, makePineTexture, makePaverTexture, makeIglooTexture, makeHedgeTexture } from './textures.js';

const CUBE_GEO = new THREE.BoxGeometry(1, 1, 1);



CUBE_GEO.setAttribute('color', new THREE.BufferAttribute(
  new Float32Array(CUBE_GEO.attributes.position.count * 3).fill(1), 3));


let TEX = null;
function getTextures() {
  if (TEX) return TEX;
  TEX = {
    
    
    [VOX.GRASS]: makeSnowTexture(),
    [VOX.ICE]:   makeIceTexture(),
    
    
    
    [VOX.TRODDEN]:   makeTroddenTexture(0),
    [VOX.TRODDEN_B]: makeTroddenTexture(1),
    [VOX.RUT]:       makeRutTexture(),
    [VOX.WOOD]:  makeWoodTexture(),
    [VOX.STONE]: makeStoneTexture(),
    [VOX.DIRT]:  makeDirtTexture(),
    [VOX.HAY]:   makeHayTexture(),
    [VOX.HILL]:  makeDirtTexture(),
    
    [VOX.BASE_RED]:  makeBarnPaintTexture('red'),
    [VOX.BASE_BLUE]: makeBarnPaintTexture('blue'),
    
    
    
    [VOX.ROCK]:   makeRockTexture(),
    [VOX.RINK]:   makeRinkTexture(),
    [VOX.BOARDS]: makeBoardsTexture(),
    [VOX.PINE]:   makePineTexture(),
    [VOX.PAVER]:  makePaverTexture(),
    [VOX.IGLOO]:  makeIglooTexture(),
    [VOX.HEDGE]:  makeHedgeTexture(),
  };
  
  
  
  
  
  
  TEX[VOX.CRATE] = TEX[VOX.WOOD];
  return TEX;
}






const SELF_COLOURED = new Set([
  VOX.BASE_RED, VOX.BASE_BLUE,
  
  
  
  
  VOX.GRASS, VOX.ICE,
  
  
  VOX.TRODDEN, VOX.TRODDEN_B, VOX.RUT,
  
  
  
  VOX.ROCK, VOX.RINK, VOX.BOARDS, VOX.PINE, VOX.PAVER, VOX.IGLOO,
  
  
  
  VOX.HEDGE,
]);




let TEX_BLOOD = null;
function getBloodTextures() {
  if (TEX_BLOOD) return TEX_BLOOD;
  const base = getTextures();
  const BLOOD_TARGETS = new Set([VOX.WOOD, VOX.CRATE, VOX.STONE, VOX.HAY, VOX.ROCK, VOX.BOARDS]);
  TEX_BLOOD = {};
  for (const k in base) {
    if (BLOOD_TARGETS.has(Number(k))) TEX_BLOOD[k] = makeBloodTinted(base[k]);
    else TEX_BLOOD[k] = base[k];
  }
  return TEX_BLOOD;
}



export function buildWorldMeshes(grid, { mature = false } = {}) {
  
  const groups = new Map();  
  for (let z = 0; z < grid.sz; z++) {
    for (let y = 0; y < grid.sy; y++) {
      for (let x = 0; x < grid.sx; x++) {
        const v = grid.get(x, y, z);
        if (v === VOX.AIR) continue;
        
        if (isFullyOccluded(grid, x, y, z)) continue;
        if (!groups.has(v)) groups.set(v, []);
        groups.get(v).push({ x, y, z });
      }
    }
  }

  const parent = new THREE.Group();
  parent.name = 'voxelWorld';
  
  
  
  
  
  
  
  
  const index = new Map();   
  const dummy = new THREE.Object3D();
  const materialsByType = {};   

  const textures = mature ? getBloodTextures() : getTextures();
  for (const [v, cells] of groups.entries()) {
    const [r, g, b] = VOX_COLOR[v];
    const selfColoured = SELF_COLOURED.has(v);
    const materialOpts = {
      color: selfColoured
        ? new THREE.Color(1, 1, 1)
        : new THREE.Color(r / 255, g / 255, b / 255),
      flatShading: true,
      
      
      vertexColors: true,
    };
    if (textures[v]) materialOpts.map = textures[v];
    
    
    
    if (v === VOX.HAY) {
      materialOpts.transparent = true;
      materialOpts.opacity = 0.72;
      materialOpts.side = THREE.DoubleSide;
      materialOpts.emissive = new THREE.Color(0x5a4a15);
    }
    
    
    
    if (v === VOX.GLASS) {
      materialOpts.transparent = true;
      materialOpts.opacity = 0.30;
      materialOpts.side = THREE.DoubleSide;
      
      materialOpts.emissive = new THREE.Color(0x203040);
    }
    const material = new THREE.MeshLambertMaterial(materialOpts);
    materialsByType[v] = material;
    const inst = new THREE.InstancedMesh(CUBE_GEO, material, cells.length);
    inst.castShadow = false;
    inst.receiveShadow = false;
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const jitterColor = new THREE.Color();
    if (!inst.instanceColor) {
      inst.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(cells.length * 3), 3);
    }
    for (let i = 0; i < cells.length; i++) {
      const { x, y, z } = cells[i];
      dummy.position.set(x + 0.5, y + 0.5, z + 0.5);
      dummy.updateMatrix();
      inst.setMatrixAt(i, dummy.matrix);
      index.set(`${x},${y},${z}`, { inst, i });
      const j = 1 - Math.random() * 0.08;
      jitterColor.setRGB(j, j, j);
      inst.setColorAt(i, jitterColor);
    }
    inst.instanceMatrix.needsUpdate = true;
    if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
    parent.add(inst);
  }

  parent.userData.materialsByType = materialsByType;
  parent.userData.voxelIndex = index;
  
  
  
  
  
  
  
  
  
  
  parent.userData.grid = grid;
  return parent;
}


export { hayOpacityFor } from '../../../../web-engine/render/hayVisibility.js';


function isFullyOccluded(grid, x, y, z) {
  for (const [dx, dy, dz] of NEIGHBOURS) {
    const v = grid.get(x + dx, y + dy, z + dz);
    if (v === VOX.AIR) return false;
  }
  return true;
}

const NEIGHBOURS = [
  [ 1, 0, 0], [-1, 0, 0],
  [ 0, 1, 0], [ 0,-1, 0],
  [ 0, 0, 1], [ 0, 0,-1],
];














export function removeVoxelMesh(parent, x, y, z) {
  const index = parent?.userData?.voxelIndex;
  if (!index) return false;
  const hit = index.get(`${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`);
  if (!hit) return false;
  const m = new THREE.Matrix4().makeScale(0, 0, 0);
  hit.inst.setMatrixAt(hit.i, m);
  hit.inst.instanceMatrix.needsUpdate = true;
  index.delete(`${Math.floor(x)},${Math.floor(y)},${Math.floor(z)}`);
  return true;
}
