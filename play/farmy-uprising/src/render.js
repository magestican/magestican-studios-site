



















import * as THREE from 'three';
import { FIELD_MM } from '../../../web-engine/rts/fixed.js';
import { CELLS_PER_SIDE, sectorAt } from '../../../web-engine/rts/maps/mapFormat.js';
import { cornerHeightDm, MM_PER_DM } from '../../../web-engine/rts/maps/elevation.js';
import { TERRAIN_IDS, terrainForSector, TILE_METRES }
  from '../../../web-engine/rts/art/terrainRecipe.js';
import {
  buildTerrainTextures, buildMacroTexture, buildDetailTexture, buildSurroundTexture,
  GROUND_LIGHT, TEX_METRES,
} from './terrainTex.js';
import {
  scatterProps, columnFor, depthKey, SCATTER_KINDS,
} from '../../../web-engine/rts/art/scatter.js';
import { loadPropAtlas, propPlacement, fallbackPropAtlas } from './propSprites.js';
import { HERD } from '../../../web-engine/rts/roster.js';
import { facing8, BRADS } from '../../../web-engine/rts/fixed.js';
import { UNITS, BUILDINGS } from '../../../web-engine/rts/roster.js';
import {
  unitSpec, buildingSpec, packPct, STATE, ORDER, MAX_UNITS,
} from '../../../web-engine/rts/sim/world.js';
import { loadAtlas, rowOf, rowCount, unitScale, fallbackAtlas } from './sprites.js';
import {
  loadBuildingAtlas, rowOf as buildingRowOf, facingFor, buildingScale, fallbackBuildingAtlas,
} from './buildingSprites.js';
import {
  loadIdleAtlas, idleColumns, idleRowCount, idleRowOf, idleFrame, idleColumn,
} from './idleSprites.js';


const MM = 1000;
const FIELD = FIELD_MM / MM;














const cornerY = (map, cx, cy) => (cornerHeightDm(map, cx, cy) * MM_PER_DM) / MM;


















function groundY(map, xMm, yMm) {
  if (!map || !map.heightOfCell) return 0;
  const cell = map.cellMm;
  const n = map.cellsPerSide;
  const fx = Math.min(n, Math.max(0, xMm / cell));
  const fy = Math.min(n, Math.max(0, yMm / cell));
  const cx = Math.min(n - 1, Math.trunc(fx));
  const cy = Math.min(n - 1, Math.trunc(fy));
  const tx = fx - cx;
  const ty = fy - cy;
  const h00 = cornerY(map, cx, cy);
  const h10 = cornerY(map, cx + 1, cy);
  const h01 = cornerY(map, cx, cy + 1);
  const h11 = cornerY(map, cx + 1, cy + 1);
  return (h00 * (1 - tx) + h10 * tx) * (1 - ty) + (h01 * (1 - tx) + h11 * tx) * ty;
}

const GROUND_PX = 2048;
const MAX_INSTANCES = 4096;










const TRACER_BUDGET = 24;




















const WEAPON = {
  smallArms: { flash: 0xfff2b0, trail: 0xffe27a, size: 0.90 },
  towerGun: { flash: 0xfff6d0, trail: 0xffe9a0, size: 1.25 },
  stone: { flash: 0xe8ded0, trail: 0xcfc3ae, size: 1.10 },
  pesticide: { flash: 0xc8f08a, trail: 0x9ed86a, size: 1.30 },
  current: { flash: 0xbfe9ff, trail: 0x7fd4ff, size: 1.15 },
  claw: { flash: 0xffd8d8, trail: 0xff9a9a, size: 0.80 },
  gore: { flash: 0xffc8c0, trail: 0xff8a76, size: 1.00 },
  kick: { flash: 0xf4e6c8, trail: 0xd9c193, size: 0.95 },
  talon: { flash: 0xffe8c0, trail: 0xffc470, size: 0.90 },
  trample: { flash: 0xe8dcc0, trail: 0xc4b48c, size: 1.40 },
  crush: { flash: 0xe0e4e8, trail: 0xb0b6bc, size: 1.35 },
};







































const CLUSTER_MAX = 5;
const CLUSTER = [
  [0, 0],
  [0.688, 0.482],
  [-0.542, 0.693],
  [-0.704, -0.493],
  [0.516, -0.737],
];













const CLUSTER_REACH = CLUSTER.map((_, k) => {
  let r = 0;
  for (let i = 0; i <= k; i += 1) r = Math.max(r, Math.hypot(CLUSTER[i][0], CLUSTER[i][1]));
  return r;
});






















const RING_TEX_RADIUS = 0.44;
const RING_FOOT = 0.29;
const RING_SQUASH = 0.667;








































export function measureFootY(image, cols, rows, tile) {
  const out = new Float32Array(rows * cols);
  const w = cols * tile;
  const h = rows * tile;
  let d;
  try {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.drawImage(image, 0, 0, w, h);
    d = x.getImageData(0, 0, w, h).data;
  } catch (e) {
    
    
    
    
    
    
    
    
    
    console.warn(`Farmy Uprising: cannot measure sprite feet (${e.message})`
      + ' - sprites will be anchored on the quad edge and will float');
    return out;
  }
  for (let r = 0; r < rows; r += 1) {
    for (let f = 0; f < cols; f += 1) {
      
      
      
      
      let bottom = -1;
      for (let yy = tile - 1; yy >= 0 && bottom < 0; yy -= 1) {
        const base = ((r * tile + yy) * w + f * tile) * 4;
        for (let xx = 0; xx < tile; xx += 1) {
          if (d[base + xx * 4 + 3] > 24) { bottom = yy; break; }
        }
      }
      
      
      
      out[r * cols + f] = bottom < 0 ? 0 : 1 - (bottom + 1) / tile;
    }
  }
  return out;
}








export function footYTable(manifest, image, cols, rows, tile, rowIndex) {
  const ids = Object.keys(manifest.rows);
  const authored = ids.every((id) => manifest.rows[id].footY !== undefined);
  if (!authored) return measureFootY(image, cols, rows, tile);
  const out = new Float32Array(rows * cols);
  for (const id of ids) {
    const r = rowIndex(manifest, id);
    const v = manifest.rows[id].footY;
    for (let f = 0; f < cols; f += 1) out[r * cols + f] = Array.isArray(v) ? (v[f] || 0) : v;
  }
  return out;
}












































const IDLE = {
  flock: { act: 'peck', period: 1.7 },
  duckRaft: { act: 'paddle', period: 2.5 },
  sounder: { act: 'wallow', period: 3.3 },
  skulk: { act: 'pounce', period: 2.9 },
  horseHerd: { act: 'graze', period: 4.1 },
  pride: { act: 'ball', period: 2.3 },
  elephant: { act: 'sway', period: 4.7 },
  wing: { act: 'hover', period: 3.1 },
  farmhand: { act: 'ball', period: 2.7 },
  quadBike: { act: 'rev', period: 2.1 },
  tractor: { act: 'engine', period: 1.5 },
  harvester: { act: 'engine', period: 1.9 },
  combine: { act: 'engine', period: 2.4 },
  bowser: { act: 'slosh', period: 3.5 },
  foodTruck: { act: 'engine', period: 1.7 },
  poundWagon: { act: 'rattle', period: 1.1 },
  cropDuster: { act: 'hover', period: 2.4 },
};
























const MACHINE_PART = {
  combine: 'beacon',
  cropDuster: 'prop',
  bowser: 'drip',
};


























const IDLE_FRAME_RESIDUAL = 0.3;
















const FOOTMARK = {
  flock: 'PAW',
  duckRaft: 'PAW',
  sounder: 'PAW',
  skulk: 'PAW',
  pride: 'PAW',
  horseHerd: 'HOOF',
  elephant: 'HOOF',
  farmhand: 'BOOT',
  bowser: 'TYRE',
  combine: 'TYRE',
  foodTruck: 'TYRE',
  harvester: 'TYRE',
  poundWagon: 'TYRE',
  quadBike: 'TYRE',
  tractor: 'TYRE',
  wing: null,
  cropDuster: null,
};











function phaseOf(id, salt = 0) {
  let h = (id * 2654435761 + salt * 40503) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}









const MOTION = {
   dx: 0,
   dy: 0,
   dz: 0,
   tilt: 0,
  sx: 1,
  sy: 1,
   emit: '',
};
















function idleMotion(act, cyc, s) {
  const m = MOTION;
  m.dx = 0; m.dy = 0; m.dz = 0; m.tilt = 0; m.sx = 1; m.sy = 1; m.emit = '';
  
  
  
  const k = cyc - Math.floor(cyc);
  const w = cyc * Math.PI * 2;
  switch (act) {
    case 'peck': {
      
      
      const dip = k < 0.20 ? Math.sin((k / 0.20) * Math.PI) : 0;
      m.dy = -s * 0.11 * dip;
      m.dz = s * 0.05 * dip;
      m.tilt = 0.40 * dip;
      m.sy = 1 - 0.05 * dip;
      m.emit = 'crumb';
      break;
    }
    case 'paddle':
      m.dy = Math.sin(w) * s * 0.045;
      m.tilt = Math.sin(w * 0.5) * 0.09;
      m.emit = 'ripple';
      break;
    case 'wallow':
      
      
      m.dy = -s * 0.045 * (0.6 + 0.4 * Math.sin(w * 0.5));
      m.tilt = Math.sin(w) * 0.16;
      m.sy = 0.93;
      m.sx = 1.05;
      m.emit = 'puff';
      break;
    case 'pounce': {
      if (k < 0.62) {
        const c = Math.sin((k / 0.62) * Math.PI);
        m.sy = 1 - 0.10 * c;
        m.dy = -s * 0.03 * c;
        m.tilt = Math.sin((k / 0.62) * Math.PI * 2) * 0.06;
      } else {
        const arc = Math.sin(((k - 0.62) / 0.38) * Math.PI);
        m.dy = s * 0.16 * arc;
        m.dz = -s * 0.10 * arc;
        m.tilt = -0.18 * arc;
        m.sy = 1 + 0.06 * arc;
      }
      break;
    }
    case 'graze': {
      
      
      const down = k < 0.75 ? Math.sqrt(Math.sin((k / 0.75) * Math.PI)) : 0;
      m.dy = -s * 0.075 * down;
      m.tilt = 0.22 * down;
      if (k > 0.82) m.tilt += Math.sin(((k - 0.82) / 0.18) * Math.PI * 3) * 0.05;
      break;
    }
    case 'ball': {
      
      
      const lean = Math.sin(w);
      m.dx = lean * s * 0.06;
      m.tilt = lean * 0.14;
      m.dy = s * 0.05 * Math.max(0, Math.sin(w * 2)) ** 3;
      m.emit = 'ball';
      break;
    }
    case 'sway':
      
      
      m.dx = Math.sin(w) * s * 0.045;
      m.dy = Math.abs(Math.sin(w)) * s * 0.012;
      m.tilt = Math.sin(w) * 0.075 + Math.sin(w * 9) * 0.022;
      break;
    case 'hover':
      m.dy = Math.sin(w) * s * 0.075;
      m.dx = Math.sin(w * 0.5) * s * 0.10;
      m.dz = Math.cos(w * 0.5) * s * 0.06;
      m.tilt = Math.sin(w * 0.5 + 1) * 0.10;
      break;
    case 'rev': {
      const burst = k > 0.72 ? Math.sin(((k - 0.72) / 0.28) * Math.PI) : 0;
      m.dy = burst * s * 0.05 + Math.sin(w * 26) * s * 0.004;
      m.tilt = -0.18 * burst;
      m.emit = 'puff';
      break;
    }
    case 'engine':
      m.dy = Math.sin(w * 9) * s * 0.006;
      m.tilt = Math.sin(w * 4.5) * 0.012;
      m.emit = 'puff';
      break;
    case 'slosh':
      m.tilt = Math.sin(w) * 0.055;
      m.dx = Math.sin(w) * s * 0.018;
      m.dy = Math.abs(Math.sin(w * 0.5)) * s * 0.006;
      break;
    case 'rattle':
      m.dy = Math.sin(w * 14) * s * 0.007;
      m.dx = Math.sin(w * 11 + 1.1) * s * 0.005;
      m.tilt = Math.sin(w * 17) * 0.014;
      break;
    default:
      
      
      
      break;
  }
  return m;
}

const PALETTE = {
  neutral: '#b9ac86',
  neutralEdge: '#cdc4a8',
  herd: '#5f8f3e',
  herdEdge: '#d8b54a',
  yield: '#7c8087',
  yieldEdge: '#e8701a',
  waterClean: '#2f9e9e',
  waterFoul: ['#2f9e9e', '#4f8f84', '#6b7f6a', '#7a6f4e'],
  keystone: '#a8925f',
  fog: 'rgba(6, 10, 14, 0.72)',
};

export async function createRenderer(canvas, match, viewSeat) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const scene = new THREE.Scene();
  
  scene.background = new THREE.Color('#1d2419');

  
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 4000);
  const view = {
    x: FIELD / 2, y: FIELD / 2,
    
    
    
    
    span: 320,
    minSpan: 130, maxSpan: 620,
    yawSteps: 0,
  };

  function placeCamera() {
    
    
    
    
    
    
    
    
    
    
    
    
    const tilt = (48 * Math.PI) / 180;
    const yaw = (view.yawSteps * Math.PI) / 2;
    const dist = 1200;
    const off = new THREE.Vector3(
      Math.sin(yaw) * Math.sin(tilt) * dist,
      Math.cos(tilt) * dist,
      Math.cos(yaw) * Math.sin(tilt) * dist,
    );
    cam.position.set(view.x + off.x, off.y, view.y + off.z);
    cam.lookAt(view.x, 0, view.y);
    cam.updateProjectionMatrix();
  }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    const aspect = w / Math.max(1, h);
    
    
    
    
    
    
    
    
    view.maxSpan = Math.max(view.minSpan + 20, Math.min(620, FIELD / (2 * Math.max(1, aspect))));
    if (view.span > view.maxSpan) view.span = view.maxSpan;
    cam.left = -view.span * aspect;
    cam.right = view.span * aspect;
    cam.top = view.span;
    cam.bottom = -view.span;
    cam.updateProjectionMatrix();
    placeCamera();
  }

  
  const groundCanvas = document.createElement('canvas');
  groundCanvas.width = GROUND_PX;
  groundCanvas.height = GROUND_PX;
  const gctx = groundCanvas.getContext('2d');
  const groundTex = new THREE.CanvasTexture(groundCanvas);
  groundTex.colorSpace = THREE.SRGBColorSpace;
  
  
  
  
  
  
  
  
  
  
  
  groundTex.minFilter = THREE.LinearMipmapLinearFilter;
  groundTex.magFilter = THREE.LinearFilter;
  groundTex.generateMipmaps = true;
  groundTex.anisotropy = 8;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const neededTerrain = (() => {
    const want = new Set();
    for (const sec of match.w.sectors) {
      for (const f of [null, 'herd', 'yield']) {
        for (const p of [0, 1]) {
          for (const id of terrainForSector({ kind: sec.kind, faction: f, pollution: p })) {
            want.add(id);
          }
        }
      }
    }
    return [...want];
  })();
  const terrainTex = buildTerrainTextures(THREE, neededTerrain);
  const CELLS = CELLS_PER_SIDE;
  const CELL = FIELD / CELLS;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const macroTex = buildMacroTexture(THREE);
  const detailTex = buildDetailTexture(THREE);
  const G = GROUND_LIGHT;
  const v3 = (a) => `vec3(${a[0]}, ${a[1]}, ${a[2]})`;
  const GROUND_NOISE = `
    varying vec3 vGroundPos;
    uniform sampler2D uMacro;
    uniform sampler2D uDetail;
    uniform float uField;
    vec3 fuGroundLight(vec2 w, float mottle) {
      vec3 m = texture2D(uMacro, w / uField).rgb;
      float n = m.r * ${G.macroWeights[0]} + m.g * ${G.macroWeights[1]} + m.b * ${G.macroWeights[2]};
      // 0.74 to 1.26 - a HALF STOP either side of neutral. It was half that,
      // and the texture still won: at 320 span the 50 m repeat showed as a
      // lattice across every paddock, because the periodic signal was louder
      // than the aperiodic one laid over it.
      float shade = (${G.shadeLo} + n * ${G.shadeSpan}) * (${G.mottleLo} + mottle * ${G.mottleSpan});
      return shade * mix(${v3(G.cool)}, ${v3(G.warm)}, n);
    }
  `;

  








  function groundMaterial(map, fade) {
    const mat = new THREE.MeshBasicMaterial({
      map,
      transparent: !!fade,
      depthWrite: !fade,
    });
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uMacro = { value: macroTex };
      shader.uniforms.uDetail = { value: detailTex };
      shader.uniforms.uField = { value: FIELD };
      shader.vertexShader = `varying vec3 vGroundPos;\n${fade ? 'attribute float aFade;\nvarying float vFade;\n' : ''}${shader.vertexShader}`
        .replace('#include <begin_vertex>',
          `#include <begin_vertex>\n  vGroundPos = transformed;${fade ? '\n  vFade = aFade;' : ''}`);
      
      
      shader.fragmentShader = `${GROUND_NOISE}\n${fade ? 'varying float vFade;\n' : ''}${shader.fragmentShader}`
        .replace('#include <map_fragment>',
          `#ifdef USE_MAP
             vec2 fuFieldUv = vGroundPos.xz / uField;
             vec2 fuDet = texture2D(uDetail, fuFieldUv).rg;
             float fuK = smoothstep(${G.bombEdge[0]}, ${G.bombEdge[1]}, fuDet.g);
             vec4 fuA = texture2D(map, vMapUv);
             vec4 fuB = texture2D(map, vMapUv * ${G.bombScale} + vec2(${G.bombOffset[0]}, ${G.bombOffset[1]}));
             diffuseColor *= mix(fuA, fuB, fuK);
             diffuseColor.rgb *= fuGroundLight(vGroundPos.xz, fuDet.r);
           #endif`
          
          
          
          + `${fade ? '\n  diffuseColor.a *= vFade * vFade * 0.92;' : ''}`);
    };
    return mat;
  }

  
  let warnedOutlines = false;

  
  const terrainMeshes = Object.create(null);
  for (const id of neededTerrain) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position',
      new THREE.BufferAttribute(new Float32Array(CELLS * CELLS * 6 * 3), 3));
    geo.setAttribute('uv',
      new THREE.BufferAttribute(new Float32Array(CELLS * CELLS * 6 * 2), 2));
    const mesh = new THREE.Mesh(geo, groundMaterial(terrainTex[id], false));
    mesh.frustumCulled = false;
    scene.add(mesh);

    
    
    
    
    
    
    
    
    
    
    
    
    
    const blendGeo = new THREE.BufferGeometry();
    blendGeo.setAttribute('position',
      new THREE.BufferAttribute(new Float32Array(CELLS * CELLS * 6 * 3), 3));
    blendGeo.setAttribute('uv',
      new THREE.BufferAttribute(new Float32Array(CELLS * CELLS * 6 * 2), 2));
    blendGeo.setAttribute('aFade',
      new THREE.BufferAttribute(new Float32Array(CELLS * CELLS * 6), 1));
    const blendMesh = new THREE.Mesh(blendGeo, groundMaterial(terrainTex[id], true));
    blendMesh.frustumCulled = false;
    blendMesh.renderOrder = 1;
    
    
    
    blendMesh.position.y = 0.05;
    scene.add(blendMesh);

    terrainMeshes[id] = { mesh, geo, blendMesh, blendGeo };
  }

  







  function materialOfCell(m, cx, cy) {
    const sec = m.w.sectors[m.w.map.sectorOfCell[cy * CELLS + cx]];
    const choices = terrainForSector({
      kind: sec.kind,
      faction: sec.owner === null ? null : m.factions[sec.owner],
      pollution: sec.pollution,
    });
    let sh = (sec.id * 2654435761) >>> 0;
    sh = (sh ^ (sh >>> 15)) >>> 0;
    return choices[sh % choices.length];
  }

  






















  const uvFrames = new Map();
  function uvFrame(secId) {
    let f = uvFrames.get(secId);
    if (f) return f;
    let h = (secId * 2654435761) >>> 0;
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    h = (h ^ (h >>> 13)) >>> 0;
    const a = ((h % 16) * Math.PI) / 8;
    f = {
      cos: Math.cos(a),
      sin: Math.sin(a),
      
      
      ou: (((h >>> 8) & 255) / 256),
      ov: (((h >>> 16) & 255) / 256),
    };
    uvFrames.set(secId, f);
    return f;
  }

  











  function writeQuad(geo, offset, cx, cy, frame, fades, map) {
    const x0 = cx * CELL;
    const x1 = x0 + CELL;
    const z0 = cy * CELL;
    const z1 = z0 + CELL;
    const uv = (x, z) => [
      (x * frame.cos + z * frame.sin) / TEX_METRES + frame.ou,
      (z * frame.cos - x * frame.sin) / TEX_METRES + frame.ov,
    ];
    const a = uv(x0, z0);
    const b = uv(x0, z1);
    const cc = uv(x1, z1);
    const d = uv(x1, z0);
    
    
    
    
    
    
    
    
    const y00 = cornerY(map, cx, cy);
    const y01 = cornerY(map, cx, cy + 1);
    const y11 = cornerY(map, cx + 1, cy + 1);
    const y10 = cornerY(map, cx + 1, cy);
    
    const c = [[x0, z0, a[0], a[1], y00], [x0, z1, b[0], b[1], y01],
      [x1, z1, cc[0], cc[1], y11], [x1, z0, d[0], d[1], y10]];
    const tri = [0, 1, 2, 0, 2, 3];
    const pos = geo.getAttribute('position').array;
    const uvs = geo.getAttribute('uv').array;
    const fadeAttr = fades ? geo.getAttribute('aFade').array : null;
    for (let k = 0; k < 6; k += 1) {
      const w = offset + k;
      const v = c[tri[k]];
      pos[w * 3] = v[0];
      pos[w * 3 + 1] = v[4];
      pos[w * 3 + 2] = v[1];
      uvs[w * 2] = v[2];
      uvs[w * 2 + 1] = v[3];
      if (fadeAttr) fadeAttr[w] = fades[tri[k]];
    }
  }

  






  function fadeRamp(dx, dy) {
    
    
    if (dx === -1) return [1, 1, 0, 0];
    if (dx === 1) return [0, 0, 1, 1];
    if (dy === -1) return [1, 0, 0, 1];
    return [0, 1, 1, 0];
  }

  
  function layTiles(m) {
    const counts = Object.create(null);
    const blendCounts = Object.create(null);
    for (const id of neededTerrain) { counts[id] = 0; blendCounts[id] = 0; }

    
    
    
    const matOf = new Array(CELLS * CELLS);
    const secOf = m.w.map.sectorOfCell;
    for (let cy = 0; cy < CELLS; cy += 1) {
      for (let cx = 0; cx < CELLS; cx += 1) matOf[cy * CELLS + cx] = materialOfCell(m, cx, cy);
    }

    for (let cy = 0; cy < CELLS; cy += 1) {
      for (let cx = 0; cx < CELLS; cx += 1) {
        const here = cy * CELLS + cx;
        const id = matOf[here];
        const t = terrainMeshes[id];
        writeQuad(t.geo, counts[id], cx, cy, uvFrame(secOf[here]), null, m.w.map);
        counts[id] += 6;

        
        
        
        
        
        
        
        
        
        
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= CELLS || ny >= CELLS) continue;
          const n = ny * CELLS + nx;
          const other = matOf[n];
          if (other === id) continue;
          const b = terrainMeshes[other];
          
          
          
          
          writeQuad(b.blendGeo, blendCounts[other], cx, cy,
            uvFrame(secOf[n]), fadeRamp(dx, dy), m.w.map);
          blendCounts[other] += 6;
        }
      }
    }
    for (const id of neededTerrain) {
      const t = terrainMeshes[id];
      t.geo.setDrawRange(0, counts[id]);
      t.geo.getAttribute('position').needsUpdate = true;
      t.geo.getAttribute('uv').needsUpdate = true;
      t.mesh.visible = counts[id] > 0;
      t.blendGeo.setDrawRange(0, blendCounts[id]);
      t.blendGeo.getAttribute('position').needsUpdate = true;
      t.blendGeo.getAttribute('uv').needsUpdate = true;
      t.blendGeo.getAttribute('aFade').needsUpdate = true;
      t.blendMesh.visible = blendCounts[id] > 0;
    }
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const groundGeo = new THREE.PlaneGeometry(FIELD, FIELD, CELLS_PER_SIDE, CELLS_PER_SIDE);
  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshBasicMaterial({ map: groundTex, transparent: true }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(FIELD / 2, 0.4, FIELD / 2);

  





  function liftOverlay(map) {
    const pos = groundGeo.getAttribute('position');
    const n = CELLS_PER_SIDE;
    for (let iy = 0; iy <= n; iy += 1) {
      for (let ix = 0; ix <= n; ix += 1) {
        pos.setZ(iy * (n + 1) + ix, cornerY(map, ix, iy));
      }
    }
    pos.needsUpdate = true;
    
    
    groundGeo.computeBoundingSphere();
  }
  liftOverlay(match.w.map);

  
















  let currentMap = match.w.map;
  
  
  
  
  
  ground.renderOrder = 2;
  scene.add(ground);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const surroundTex = buildSurroundTexture(THREE);
  const surround = new THREE.Mesh(
    new THREE.PlaneGeometry(FIELD * 5, FIELD * 5),
    
    
    
    
    
    new THREE.MeshBasicMaterial({ map: surroundTex, color: new THREE.Color('#c3ccae') }),
  );
  surround.rotation.x = -Math.PI / 2;
  surround.position.set(FIELD / 2, -2, FIELD / 2);
  scene.add(surround);

  
  let groundKey = '';

  















  const cellEdge = (c) => Math.round((c * GROUND_PX) / CELLS_PER_SIDE);

  

























  function sectorPath(ctx, map, s) {
    const loops = map.outlines && map.outlines[s];
    if (!loops || loops.length === 0) return false;
    const toPx = (mm) => (mm * GROUND_PX) / FIELD_MM;
    ctx.beginPath();
    let any = false;
    for (const flat of loops) {
      if (flat.length < 6) continue;
      ctx.moveTo(toPx(flat[0]), toPx(flat[1]));
      for (let i = 2; i < flat.length; i += 2) ctx.lineTo(toPx(flat[i]), toPx(flat[i + 1]));
      ctx.closePath();
      any = true;
    }
    return any;
  }

  function paintGround(m, seat) {
    const map = m.w.map;
    
    
    
    
    const hasOutlines = !!(map.outlines && map.outlines.length === m.w.sectors.length);
    if (!hasOutlines && !warnedOutlines) {
      warnedOutlines = true;
      console.warn('Farmy Uprising: this map has no sector outlines'
        + ' - falling back to cell-aligned borders');
    }

    
    
    
    
    gctx.clearRect(0, 0, GROUND_PX, GROUND_PX);

    
    
    
    if (hasOutlines) {
      
      
      
      
      for (let sIdx = 0; sIdx < m.w.sectors.length; sIdx += 1) {
        const sec = m.w.sectors[sIdx];
        if (sec.owner === null) continue;
        if (!sectorPath(gctx, map, sIdx)) continue;
        gctx.fillStyle = m.factions[sec.owner] === HERD
          ? 'rgba(96,168,74,0.22)' : 'rgba(196,148,58,0.22)';
        gctx.fill();
      }
    } else {
      for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
        const y0 = cellEdge(cy);
        const y1 = cellEdge(cy + 1);
        for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
          const sIdx = map.sectorOfCell[cy * CELLS_PER_SIDE + cx];
          const sec = m.w.sectors[sIdx];
          if (sec.owner === null) continue;
          const x0 = cellEdge(cx);
          gctx.fillStyle = m.factions[sec.owner] === HERD
            ? 'rgba(96,168,74,0.22)' : 'rgba(196,148,58,0.22)';
          gctx.fillRect(x0, y0, cellEdge(cx + 1) - x0, y1 - y0);
        }
      }
    }

    
    
    for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
      for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
        const sec = m.w.sectors[map.sectorOfCell[cy * CELLS_PER_SIDE + cx]];
        if (sec.owner === null) continue;
        
        
        
        
        
        
        
        const isHerd = m.factions[sec.owner] === HERD;
        if (!isHerd) continue;
        
        
        const x0 = cellEdge(cx);
        const y0 = cellEdge(cy);
        const w = cellEdge(cx + 1) - x0;
        gctx.fillStyle = 'rgba(255,255,255,0.055)';
        gctx.fillRect(x0 + w * 0.34, y0 + w * 0.30, w * 0.13, w * 0.13);
      }
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    if (hasOutlines) {
      gctx.lineJoin = 'round';
      gctx.lineCap = 'round';
      for (let sIdx = 0; sIdx < m.w.sectors.length; sIdx += 1) {
        if (!sectorPath(gctx, map, sIdx)) continue;
        gctx.strokeStyle = 'rgba(22,26,18,0.55)';
        gctx.lineWidth = 6;
        gctx.stroke();
        gctx.globalAlpha = 0.62;
        gctx.strokeStyle = edgeFor(m, m.w.sectors[sIdx]);
        gctx.lineWidth = 3;
        gctx.stroke();
        gctx.globalAlpha = 1;
      }
    } else {
      for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
        const y0 = cellEdge(cy);
        const y1 = cellEdge(cy + 1);
        for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
          const here = map.sectorOfCell[cy * CELLS_PER_SIDE + cx];
          const right = cx + 1 < CELLS_PER_SIDE ? map.sectorOfCell[cy * CELLS_PER_SIDE + cx + 1] : here;
          const down = cy + 1 < CELLS_PER_SIDE ? map.sectorOfCell[(cy + 1) * CELLS_PER_SIDE + cx] : here;
          const sec = m.w.sectors[here];
          const x0 = cellEdge(cx);
          const x1 = cellEdge(cx + 1);
          
          
          
          
          
          
          
          
          
          
          
          
          
          gctx.fillStyle = 'rgba(22,26,18,0.55)';
          if (right !== here) gctx.fillRect(x1 - 3, y0, 6, y1 - y0);
          if (down !== here) gctx.fillRect(x0, y1 - 3, x1 - x0, 6);
          gctx.globalAlpha = 0.62;
          gctx.fillStyle = edgeFor(m, sec);
          if (right !== here) gctx.fillRect(x1 - 1, y0, 3, y1 - y0);
          if (down !== here) gctx.fillRect(x0, y1 - 1, x1 - x0, 3);
          gctx.globalAlpha = 1;
        }
      }
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const vis = m.presence.visible;
    const sc = m.w.sectors.length;
    const fogCanvas = document.createElement('canvas');
    fogCanvas.width = GROUND_PX;
    fogCanvas.height = GROUND_PX;
    const fctx = fogCanvas.getContext('2d');
    fctx.fillStyle = 'rgba(11,16,22,0.72)';
    for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
      const y0 = cellEdge(cy);
      const y1 = cellEdge(cy + 1);
      for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
        const sIdx = map.sectorOfCell[cy * CELLS_PER_SIDE + cx];
        if (vis[seat * sc + sIdx]) continue;
        const x0 = cellEdge(cx);
        fctx.fillRect(x0, y0, cellEdge(cx + 1) - x0, y1 - y0);
      }
    }
    gctx.filter = 'blur(24px)';
    gctx.drawImage(fogCanvas, 0, 0);
    gctx.filter = 'none';
    groundTex.needsUpdate = true;
  }

  function fillFor(m, sec) {
    if (sec.kind === 'water') {
      return PALETTE.waterFoul[Math.min(3, sec.pollution)];
    }
    if (sec.owner === null) return sec.kind === 'keystone' ? PALETTE.keystone : PALETTE.neutral;
    return m.factions[sec.owner] === HERD ? PALETTE.herd : PALETTE.yield;
  }

  function edgeFor(m, sec) {
    if (sec.owner === null) return PALETTE.neutralEdge;
    return m.factions[sec.owner] === HERD ? PALETTE.herdEdge : PALETTE.yieldEdge;
  }

  
  
  
  
  
  
  
  
  
  
  let propSheet = null;
  try {
    propSheet = await loadPropAtlas();
  } catch (e) {
    const ids = [...SCATTER_KINDS];
    propSheet = {
      image: fallbackPropAtlas(ids),
      manifest: {
        tile: 64,
        facings: 4,
        rows: Object.fromEntries(ids.map((k, i) => [k,
          { row: i, worldSize: 6, drawSize: 16, footY: 0.3, role: 'point' }])),
      },
    };
    
    console.warn(`Farmy Uprising: prop atlas missing (${e.message}) - placeholders`);
  }
  const propManifest = propSheet.manifest;
  const PROP_ROWS = Math.max(1, Object.keys(propManifest.rows).length);
  const PROP_COLS = propManifest.facings || 4;

  const MAX_PROP_INSTANCES = 6000;
  const propTex = new THREE.Texture(propSheet.image);
  propTex.needsUpdate = true;
  propTex.colorSpace = THREE.SRGBColorSpace;
  propTex.minFilter = THREE.LinearMipmapLinearFilter;
  propTex.magFilter = THREE.LinearFilter;
  propTex.generateMipmaps = true;
  propTex.anisotropy = 8;

  const propGeo = new THREE.PlaneGeometry(1, 1);
  const propTileAttr = new THREE.InstancedBufferAttribute(
    new Float32Array(MAX_PROP_INSTANCES * 2), 2,
  );
  propGeo.setAttribute('aTile', propTileAttr);
  const propMat = new THREE.MeshBasicMaterial({
    map: propTex, transparent: true, alphaTest: 0.28, depthWrite: false,
  });
  propMat.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute vec2 aTile;\nvarying vec2 vTile;\n${shader.vertexShader}`
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n  vTile = aTile;');
    shader.fragmentShader = `varying vec2 vTile;\n${shader.fragmentShader}`
      .replace('#include <map_fragment>',
        `#ifdef USE_MAP
           vec2 tiledUv = vec2(
             (vMapUv.x + vTile.x) / ${PROP_COLS}.0,
             1.0 - ((1.0 - vMapUv.y) + vTile.y) / ${PROP_ROWS}.0
           );
           diffuseColor *= texture2D(map, tiledUv);
         #endif`);
  };
  const propMesh = new THREE.InstancedMesh(propGeo, propMat, MAX_PROP_INSTANCES);
  propMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  propMesh.count = 0;
  propMesh.frustumCulled = false;
  
  propMesh.renderOrder = 3.5;
  scene.add(propMesh);

  
  
  
  
  
  
  
  
  
  
  
  let scatter = scatterProps(match.w.map, {
    facings: PROP_COLS, max: MAX_PROP_INSTANCES,
  });
  const propDummy = new THREE.Object3D();
  const propColour = new THREE.Color();

  






















  function layProps(m, seat, yawSteps) {
    const yaw = (yawSteps * Math.PI) / 2;
    const list = scatter.props.slice()
      .sort((a, b) => depthKey(a, yawSteps) - depthKey(b, yawSteps));
    const vis = m.presence.visible;
    const sc = m.w.sectors.length;
    let n = 0;
    for (const p of list) {
      if (n >= MAX_PROP_INSTANCES) break;
      const row = propManifest.rows[p.kind];
      if (!row) continue;
      const size = row.worldSize * (p.scale / 1000);
      
      
      
      
      propDummy.position.set(
        p.x / MM,
        groundY(m.w.map, p.x, p.y) + size * (0.5 - (row.footY || 0)),
        p.y / MM,
      );
      propDummy.rotation.set(0, yaw, 0);
      propDummy.scale.set(size, size, size);
      propDummy.updateMatrix();
      propMesh.setMatrixAt(n, propDummy.matrix);
      propTileAttr.setXY(n, columnFor(p, yawSteps, PROP_COLS), row.row);
      
      
      
      
      
      
      
      const lit = p.sector < 0 ? 0.82 : (vis[seat * sc + p.sector] ? 1 : 0.30);
      propColour.setRGB(lit, lit, lit);
      propMesh.setColorAt(n, propColour);
      n += 1;
    }
    propMesh.count = n;
    propMesh.instanceMatrix.needsUpdate = true;
    propTileAttr.needsUpdate = true;
    if (propMesh.instanceColor) propMesh.instanceColor.needsUpdate = true;
  }

  







  let propYaw = -1;

  

  
  
  
  
  let atlasImage;
  let manifest;
  try {
    const loaded = await loadAtlas();
    atlasImage = loaded.image;
    manifest = loaded.manifest;
  } catch (e) {
    const ids = Object.keys(UNITS).sort();
    atlasImage = fallbackAtlas(ids);
    manifest = {
      tile: 64,
      facings: 8,
      rows: Object.fromEntries(ids.map((k, i) => [k, { row: i, worldSize: 2 }])),
    };
    
    console.warn(`Farmy Uprising: sprite atlas missing (${e.message}) - placeholders`);
  }
  const ATLAS_COLS = manifest.facings || 8;
  const ATLAS_ROWS = Math.max(1, rowCount(manifest));

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let idleImage = null;
  let idleManifest = null;
  try {
    const loaded = await loadIdleAtlas();
    if (loaded.manifest.tile !== manifest.tile) {
      throw new Error(`idle tile ${loaded.manifest.tile} but units tile ${manifest.tile}`);
    }
    if (loaded.manifest.facings !== ATLAS_COLS) {
      throw new Error(`idle has ${loaded.manifest.facings} facings but units has ${ATLAS_COLS}`);
    }
    if (!Array.isArray(loaded.manifest.order) || loaded.manifest.order.length < 2) {
      throw new Error('idle.json has no loop order');
    }
    idleImage = loaded.image;
    idleManifest = loaded.manifest;
  } catch (e) {
    console.warn(`Farmy Uprising: no idle frames (${e.message})`
      + ' - units will idle on their standing pose');
  }
  const IDLE_COLS = idleManifest ? idleColumns(idleManifest) : 1;
  const IDLE_ROWS = idleManifest ? Math.max(1, idleRowCount(idleManifest)) : 1;

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const unitFoot = footYTable(manifest, atlasImage, ATLAS_COLS, ATLAS_ROWS, manifest.tile, rowOf);

  const atlas = new THREE.Texture(atlasImage);
  atlas.needsUpdate = true;
  atlas.colorSpace = THREE.SRGBColorSpace;
  atlas.minFilter = THREE.LinearMipmapLinearFilter;
  atlas.magFilter = THREE.LinearFilter;

  
  
  
  
  
  
  
  const idleTex = idleImage ? new THREE.Texture(idleImage) : null;
  if (idleTex) {
    idleTex.needsUpdate = true;
    idleTex.colorSpace = THREE.SRGBColorSpace;
    idleTex.minFilter = THREE.LinearMipmapLinearFilter;
    idleTex.magFilter = THREE.LinearFilter;
  }
  
  
  const blankTex = new THREE.DataTexture(new Uint8Array([0, 0, 0, 0]), 1, 1);
  blankTex.needsUpdate = true;

  const unitGeo = new THREE.PlaneGeometry(1, 1);
  
  
  
  
  
  
  
  
  
  
  const tileAttr = new THREE.InstancedBufferAttribute(new Float32Array(MAX_INSTANCES * 3), 3);
  unitGeo.setAttribute('aTile', tileAttr);

  const unitMat = new THREE.MeshBasicMaterial({
    map: atlas, transparent: true, alphaTest: 0.35, depthWrite: false,
  });
  
  
  
  
  
  
  
  
  
  
  
  
  let idleUniform = null;
  unitMat.onBeforeCompile = (shader) => {
    
    
    
    
    shader.uniforms.mapIdle = { value: idleTex || atlas };
    idleUniform = shader.uniforms.mapIdle;
    shader.vertexShader = `attribute vec3 aTile;\nvarying vec3 vTile;\n${shader.vertexShader}`
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n  vTile = aTile;');
    
    
    
    
    
    
    
    
    
    
    shader.fragmentShader = `varying vec3 vTile;\nuniform sampler2D mapIdle;\n${shader.fragmentShader}`
      .replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
           vec4 sampledDiffuseColor;
           if ( vTile.z > 0.5 ) {
             vec2 idleUv = vec2(
               (vMapUv.x + vTile.x) / ${IDLE_COLS}.0,
               1.0 - ((1.0 - vMapUv.y) + vTile.y) / ${IDLE_ROWS}.0
             );
             sampledDiffuseColor = texture2D( mapIdle, idleUv );
           } else {
             vec2 tiledUv = vec2(
               (vMapUv.x + vTile.x) / ${ATLAS_COLS}.0,
               1.0 - ((1.0 - vMapUv.y) + vTile.y) / ${ATLAS_ROWS}.0
             );
             sampledDiffuseColor = texture2D( map, tiledUv );
           }
           diffuseColor *= sampledDiffuseColor;
         #endif`,
      );
  };

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const shadowTex = (() => {
    const c = document.createElement('canvas');
    const S = 96;
    c.width = S; c.height = S;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2 - 1);
    g.addColorStop(0, 'rgba(78,78,78,0.52)');
    g.addColorStop(0.55, 'rgba(78,78,78,0.26)');
    g.addColorStop(0.78, 'rgba(78,78,78,0.06)');
    g.addColorStop(1, 'rgba(78,78,78,0)');
    x.fillStyle = g;
    x.fillRect(0, 0, S, S);
    
    
    
    
    
    x.fillStyle = 'rgba(255,255,255,0.95)';
    x.beginPath();
    x.ellipse(S / 2, S * 0.845, S * 0.105, S * 0.072, 0, 0, Math.PI * 2);
    x.fill();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const shadows = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    MAX_INSTANCES,
  );
  shadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  shadows.count = 0;
  shadows.frustumCulled = false;
  shadows.renderOrder = 3;
  scene.add(shadows);

  
  
  
  
  
  
  const ringTex = (() => {
    const c = document.createElement('canvas');
    const S = 128;
    c.width = S; c.height = S;
    const x = c.getContext('2d');
    
    
    
    
    
    
    
    
    
    
    
    x.strokeStyle = 'rgba(255,255,255,0.72)';
    x.lineWidth = S * 0.026;
    x.beginPath();
    x.arc(S / 2, S / 2, S * 0.44, 0, Math.PI * 2);
    x.stroke();
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const rings = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false }),
    512,
  );
  rings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  rings.count = 0;
  rings.frustumCulled = false;
  rings.renderOrder = 3;
  scene.add(rings);

  
  let selected = new Set();

  
  
  
  
  
  
  
  
  
  const barMat = () => new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false });
  const hpBack = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), barMat(), MAX_INSTANCES);
  const hpFill = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), barMat(), MAX_INSTANCES);
  for (const m of [hpBack, hpFill]) {
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.count = 0;
    m.frustumCulled = false;
    m.renderOrder = 5;
    scene.add(m);
  }

  
  
  
  
  
  
  
  
  
  
  const COUNT_TILES = 16;
  const countTex = (() => {
    const c = document.createElement('canvas');
    const S = 64;
    c.width = S * COUNT_TILES; c.height = S;
    const x = c.getContext('2d');
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    for (let i = 0; i < COUNT_TILES; i += 1) {
      const cx = i * S + S / 2;
      x.fillStyle = 'rgba(10,14,10,0.74)';
      x.beginPath();
      x.roundRect(i * S + S * 0.10, S * 0.22, S * 0.80, S * 0.56, S * 0.16);
      x.fill();
      x.font = `bold ${Math.round(S * 0.46)}px ui-monospace, monospace`;
      x.fillStyle = '#ffffff';
      x.fillText(String(i + 1), cx, S * 0.52);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();
  const countGeo = new THREE.PlaneGeometry(1, 1);
  const countAttr = new THREE.InstancedBufferAttribute(new Float32Array(MAX_INSTANCES), 1);
  countGeo.setAttribute('aCol', countAttr);
  const countMat = new THREE.MeshBasicMaterial({
    map: countTex, transparent: true, depthWrite: false,
  });
  countMat.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute float aCol;\nvarying float vCol;\n${shader.vertexShader}`
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n  vCol = aCol;');
    shader.fragmentShader = `varying float vCol;\n${shader.fragmentShader}`
      .replace('#include <map_fragment>',
        `#ifdef USE_MAP
           diffuseColor *= texture2D(map,
             vec2((vMapUv.x + vCol) / ${COUNT_TILES}.0, vMapUv.y));
         #endif`);
  };
  const counts = new THREE.InstancedMesh(countGeo, countMat, MAX_INSTANCES);
  counts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  counts.count = 0;
  counts.frustumCulled = false;
  counts.renderOrder = 5;
  scene.add(counts);
  const units = new THREE.InstancedMesh(unitGeo, unitMat, MAX_INSTANCES);
  units.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  units.count = 0;
  units.frustumCulled = false;
  units.renderOrder = 4;
  scene.add(units);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let buildingImage;
  let buildingManifest;
  try {
    const loaded = await loadBuildingAtlas();
    buildingImage = loaded.image;
    buildingManifest = loaded.manifest;
  } catch (e) {
    const ids = Object.keys(BUILDINGS).sort();
    buildingImage = fallbackBuildingAtlas(ids);
    buildingManifest = {
      tile: 64,
      facings: 4,
      rows: Object.fromEntries(ids.map((k, i) => [k, {
        row: i, worldSize: 8, faction: BUILDINGS[k].faction,
      }])),
    };
    
    
    
    console.warn(`Farmy Uprising: building atlas missing (${e.message}) - placeholders`);
  }
  const BUILD_COLS = buildingManifest.facings || 4;
  const BUILD_ROWS = Math.max(1, Object.keys(buildingManifest.rows).length);
  const buildingFoot = footYTable(
    buildingManifest, buildingImage, BUILD_COLS, BUILD_ROWS, buildingManifest.tile, buildingRowOf,
  );

  const buildingAtlas = new THREE.Texture(buildingImage);
  buildingAtlas.needsUpdate = true;
  buildingAtlas.colorSpace = THREE.SRGBColorSpace;
  buildingAtlas.minFilter = THREE.LinearMipmapLinearFilter;
  buildingAtlas.magFilter = THREE.LinearFilter;

  const bGeo = new THREE.PlaneGeometry(1, 1);
  const bTileAttr = new THREE.InstancedBufferAttribute(new Float32Array(256 * 2), 2);
  bGeo.setAttribute('aTile', bTileAttr);
  const bMat = new THREE.MeshBasicMaterial({
    map: buildingAtlas, transparent: true, alphaTest: 0.35, depthWrite: false,
  });
  bMat.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute vec2 aTile;\nvarying vec2 vTile;\n${shader.vertexShader}`
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n  vTile = aTile;');
    
    
    
    shader.fragmentShader = `varying vec2 vTile;\n${shader.fragmentShader}`
      .replace('#include <map_fragment>',
        `#ifdef USE_MAP
           vec2 tiledUv = vec2(
             (vMapUv.x + vTile.x) / ${BUILD_COLS}.0,
             1.0 - ((1.0 - vMapUv.y) + vTile.y) / ${BUILD_ROWS}.0
           );
           diffuseColor *= texture2D( map, tiledUv );
         #endif`);
  };
  const buildings = new THREE.InstancedMesh(bGeo, bMat, 256);
  buildings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  buildings.count = 0;
  buildings.frustumCulled = false;
  
  
  
  
  buildings.renderOrder = 3.7;
  scene.add(buildings);

  
  
  
  
  
  
  
  
  const buildingPads = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    256,
  );
  buildingPads.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  buildingPads.count = 0;
  buildingPads.frustumCulled = false;
  buildingPads.renderOrder = 3;
  scene.add(buildingPads);

  
  const siteBeat = new Int32Array(256).fill(-1);

  










  const buildOrder = [];
  let buildDepthYaw = 0;
  const buildDepth = (i) => {
    const x = match.w.b.x[i];
    const y = match.w.b.y[i];
    if (buildDepthYaw === 0) return y;
    if (buildDepthYaw === 1) return x;
    if (buildDepthYaw === 2) return -y;
    return -x;
  };

  const dummy = new THREE.Object3D();
  const colour = new THREE.Color();

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  let clockSec = 0;

  
  
  
  
  
  
  
  
  
  
  
  const FLECK = { PUFF: 0, BALL: 1, SPARK: 2, CRUMB: 3, SPLASH: 4 };
  const FLECK_COLS = 5;
  
  
  
  
  
  const MAX_FLECKS = 768;
  const fleckTex = (() => {
    const S = 64;
    const c = document.createElement('canvas');
    c.width = S * FLECK_COLS; c.height = S;
    const x = c.getContext('2d');
    const at = (i) => { x.save(); x.translate(i * S, 0); };
    
    
    
    at(FLECK.PUFF);
    const g = x.createRadialGradient(S / 2, S / 2, 1, S / 2, S / 2, S / 2 - 2);
    g.addColorStop(0, 'rgba(255,255,255,0.85)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, S, S);
    x.restore();

    at(FLECK.BALL);
    
    
    
    const bg = x.createRadialGradient(S * 0.40, S * 0.38, 2, S * 0.5, S * 0.5, S * 0.42);
    bg.addColorStop(0, 'rgba(255,255,255,1)');
    bg.addColorStop(0.75, 'rgba(214,214,214,1)');
    bg.addColorStop(1, 'rgba(150,150,150,1)');
    x.fillStyle = bg;
    x.beginPath(); x.arc(S / 2, S / 2, S * 0.40, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(90,90,90,0.85)';
    x.lineWidth = S * 0.05;
    x.beginPath(); x.ellipse(S / 2, S / 2, S * 0.16, S * 0.39, 0, 0, Math.PI * 2); x.stroke();
    x.restore();

    at(FLECK.SPARK);
    
    
    x.fillStyle = 'rgba(255,255,255,0.95)';
    x.beginPath();
    for (let k = 0; k < 8; k += 1) {
      const a = (k * Math.PI) / 4;
      const r = (k % 2 === 0 ? 0.46 : 0.14) * S;
      const px = S / 2 + Math.cos(a) * r;
      const py = S / 2 + Math.sin(a) * r;
      if (k === 0) x.moveTo(px, py); else x.lineTo(px, py);
    }
    x.closePath(); x.fill();
    x.restore();

    at(FLECK.CRUMB);
    
    
    x.fillStyle = 'rgba(255,255,255,0.9)';
    for (const [px, py, r] of [[0.34, 0.58, 0.09], [0.58, 0.44, 0.07], [0.50, 0.68, 0.05]]) {
      x.beginPath(); x.arc(S * px, S * py, S * r, 0, Math.PI * 2); x.fill();
    }
    x.restore();

    at(FLECK.SPLASH);
    
    
    x.strokeStyle = 'rgba(255,255,255,0.9)';
    x.lineWidth = S * 0.055;
    x.beginPath();
    x.arc(S / 2, S * 0.62, S * 0.30, Math.PI * 1.08, Math.PI * 1.92);
    x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.9)';
    for (const [px, py, r] of [[0.24, 0.40, 0.07], [0.50, 0.28, 0.08], [0.77, 0.42, 0.06]]) {
      x.beginPath(); x.arc(S * px, S * py, S * r, 0, Math.PI * 2); x.fill();
    }
    x.restore();

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();

  







  function stripMaterial(tex, cols) {
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false });
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = 'attribute float aCol;\nattribute float aAlpha;\n'
        + `varying float vCol;\nvarying float vAlpha;\n${shader.vertexShader}`
          .replace('#include <uv_vertex>',
            '#include <uv_vertex>\n  vCol = aCol;\n  vAlpha = aAlpha;');
      shader.fragmentShader = `varying float vCol;\nvarying float vAlpha;\n${shader.fragmentShader}`
        .replace('#include <map_fragment>',
          `#ifdef USE_MAP
             diffuseColor *= texture2D(map, vec2((vMapUv.x + vCol) / ${cols}.0, vMapUv.y));
             diffuseColor.a *= vAlpha;
           #endif`);
    };
    return mat;
  }

  const fleckGeo = new THREE.PlaneGeometry(1, 1);
  const fleckCol = new THREE.InstancedBufferAttribute(new Float32Array(MAX_FLECKS), 1);
  const fleckAlpha = new THREE.InstancedBufferAttribute(new Float32Array(MAX_FLECKS), 1);
  fleckGeo.setAttribute('aCol', fleckCol);
  fleckGeo.setAttribute('aAlpha', fleckAlpha);
  const flecks = new THREE.InstancedMesh(
    fleckGeo, stripMaterial(fleckTex, FLECK_COLS), MAX_FLECKS,
  );
  flecks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  flecks.count = 0;
  flecks.frustumCulled = false;
  
  
  flecks.renderOrder = 4.5;
  scene.add(flecks);

  
  
  
  
  
  
  
  const fleck = {
    kind: new Float32Array(MAX_FLECKS),
    x: new Float32Array(MAX_FLECKS),
    y: new Float32Array(MAX_FLECKS),
    z: new Float32Array(MAX_FLECKS),
    size: new Float32Array(MAX_FLECKS),
    born: new Float32Array(MAX_FLECKS),
    life: new Float32Array(MAX_FLECKS),
    col: new Int32Array(MAX_FLECKS),
    rise: new Float32Array(MAX_FLECKS),
    spin: new Float32Array(MAX_FLECKS),
  };
  let fleckHead = 0;

  function addFleck(kind, x, z, y, size, life, hex, rise = 0, spin = 0) {
    
    
    
    if (!Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(size)) return;
    const i = fleckHead;
    fleckHead = (fleckHead + 1) % MAX_FLECKS;
    fleck.kind[i] = kind;
    fleck.x[i] = x; fleck.y[i] = y; fleck.z[i] = z;
    fleck.size[i] = size;
    fleck.born[i] = clockSec;
    fleck.life[i] = life;
    fleck.col[i] = hex;
    fleck.rise[i] = rise;
    fleck.spin[i] = spin;
  }

  
  
  
  
  
  
  
  
  
  
  const MAX_LIVE = 96;
  const live = {
    kind: new Float32Array(MAX_LIVE),
    x: new Float32Array(MAX_LIVE),
    y: new Float32Array(MAX_LIVE),
    z: new Float32Array(MAX_LIVE),
    size: new Float32Array(MAX_LIVE),
    alpha: new Float32Array(MAX_LIVE),
    col: new Int32Array(MAX_LIVE),
    spin: new Float32Array(MAX_LIVE),
  };
  let liveN = 0;

  function addLive(kind, x, y, z, size, alpha, hex, spin = 0) {
    if (liveN >= MAX_LIVE) return;
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return;
    const i = liveN;
    liveN += 1;
    live.kind[i] = kind;
    live.x[i] = x; live.y[i] = y; live.z[i] = z;
    live.size[i] = size; live.alpha[i] = alpha; live.col[i] = hex; live.spin[i] = spin;
  }

  function layFlecks() {
    const yaw = billboardRotation();
    let n = 0;
    for (let i = 0; i < liveN && n < MAX_FLECKS; i += 1) {
      dummy.position.set(live.x[i], live.y[i], live.z[i]);
      dummy.rotation.set(0, yaw, live.spin[i]);
      dummy.scale.set(live.size[i], live.size[i], 1);
      dummy.updateMatrix();
      flecks.setMatrixAt(n, dummy.matrix);
      fleckCol.setX(n, live.kind[i]);
      fleckAlpha.setX(n, live.alpha[i]);
      colour.setHex(live.col[i]);
      flecks.setColorAt(n, colour);
      n += 1;
    }
    for (let i = 0; i < MAX_FLECKS && n < MAX_FLECKS; i += 1) {
      const life = fleck.life[i];
      if (life <= 0) continue;
      const age = (clockSec - fleck.born[i]) / life;
      if (age < 0 || age >= 1) continue;
      
      
      
      const grow = fleck.kind[i] === FLECK.SPARK ? 1 - age * 0.45 : 1 + age * 0.55;
      dummy.position.set(
        fleck.x[i], fleck.y[i] + fleck.rise[i] * age, fleck.z[i],
      );
      dummy.rotation.set(0, yaw, fleck.spin[i] * age);
      dummy.scale.set(fleck.size[i] * grow, fleck.size[i] * grow, 1);
      dummy.updateMatrix();
      flecks.setMatrixAt(n, dummy.matrix);
      fleckCol.setX(n, fleck.kind[i]);
      fleckAlpha.setX(n, (1 - age) * (1 - age));
      colour.setHex(fleck.col[i]);
      flecks.setColorAt(n, colour);
      n += 1;
    }
    flecks.count = n;
    flecks.instanceMatrix.needsUpdate = true;
    fleckCol.needsUpdate = true;
    fleckAlpha.needsUpdate = true;
    if (flecks.instanceColor) flecks.instanceColor.needsUpdate = true;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const TRACK = {
    PAW: 0, HOOF: 1, BOOT: 2, TYRE: 3, RIPPLE: 4, SCUFF: 5,
  };
  const TRACK_COLS = 6;
  const MAX_TRACKS = 768;
  const trackTex = (() => {
    const S = 64;
    const c = document.createElement('canvas');
    c.width = S * TRACK_COLS; c.height = S;
    const x = c.getContext('2d');
    const at = (i) => { x.save(); x.translate(i * S, 0); };
    
    
    x.fillStyle = 'rgba(255,255,255,0.95)';

    at(TRACK.PAW);
    
    for (const [cx, cy] of [[0.36, 0.60], [0.62, 0.34]]) {
      x.beginPath(); x.ellipse(S * cx, S * cy, S * 0.095, S * 0.115, 0, 0, Math.PI * 2); x.fill();
      for (let k = -1; k <= 1; k += 1) {
        x.beginPath();
        x.arc(S * (cx + k * 0.075), S * (cy - 0.145), S * 0.038, 0, Math.PI * 2);
        x.fill();
      }
    }
    x.restore();

    at(TRACK.HOOF);
    
    x.strokeStyle = 'rgba(255,255,255,0.95)';
    x.lineWidth = S * 0.075;
    for (const [cx, cy] of [[0.36, 0.60], [0.62, 0.34]]) {
      x.beginPath(); x.arc(S * cx, S * cy, S * 0.105, Math.PI * 1.15, Math.PI * 1.85); x.stroke();
      x.beginPath(); x.arc(S * cx, S * cy, S * 0.105, Math.PI * 0.15, Math.PI * 0.85); x.stroke();
    }
    x.restore();

    at(TRACK.BOOT);
    
    
    for (const [cx, cy] of [[0.36, 0.60], [0.62, 0.34]]) {
      x.beginPath();
      x.roundRect(S * (cx - 0.075), S * (cy - 0.16), S * 0.15, S * 0.20, S * 0.06);
      x.fill();
      x.beginPath();
      x.roundRect(S * (cx - 0.065), S * (cy + 0.07), S * 0.13, S * 0.09, S * 0.03);
      x.fill();
    }
    x.restore();

    at(TRACK.TYRE);
    
    
    x.fillStyle = 'rgba(255,255,255,0.55)';
    x.fillRect(S * 0.30, S * 0.10, S * 0.40, S * 0.80);
    x.fillStyle = 'rgba(255,255,255,0.95)';
    for (let k = 0; k < 7; k += 1) {
      x.fillRect(S * 0.30, S * (0.12 + k * 0.113), S * 0.40, S * 0.045);
    }
    x.restore();

    at(TRACK.RIPPLE);
    x.strokeStyle = 'rgba(255,255,255,0.85)';
    x.lineWidth = S * 0.045;
    x.beginPath(); x.arc(S / 2, S / 2, S * 0.38, 0, Math.PI * 2); x.stroke();
    x.lineWidth = S * 0.028;
    x.beginPath(); x.arc(S / 2, S / 2, S * 0.22, 0, Math.PI * 2); x.stroke();
    x.restore();

    at(TRACK.SCUFF);
    
    
    const sg = x.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S * 0.46);
    sg.addColorStop(0, 'rgba(255,255,255,0.62)');
    sg.addColorStop(0.7, 'rgba(255,255,255,0.22)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = sg;
    x.beginPath(); x.ellipse(S / 2, S / 2, S * 0.44, S * 0.30, 0, 0, Math.PI * 2); x.fill();
    x.restore();

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();

  





















  const SURFACE = {
    mud: { mark: -1, tint: 0x2e2418, life: 15, alpha: 0.88 },
    dirt: { mark: -1, tint: 0x4a3826, life: 9, alpha: 0.70 },
    dryPaddock: { mark: -1, tint: 0x6a5a3a, life: 8, alpha: 0.60 },
    pasture: { mark: -1, tint: 0x93a968, life: 7, alpha: 0.52 },
    longGrass: { mark: TRACK.SCUFF, tint: 0x8ea058, life: 8, alpha: 0.64 },
    scrub: { mark: TRACK.SCUFF, tint: 0x9a8e56, life: 7, alpha: 0.50 },
    stubble: { mark: TRACK.SCUFF, tint: 0xc9b477, life: 8, alpha: 0.64 },
    ploughedA: { mark: -1, tint: 0x3f2d1c, life: 11, alpha: 0.72 },
    ploughedB: { mark: -1, tint: 0x3f2d1c, life: 11, alpha: 0.72 },
    gravel: { mark: TRACK.SCUFF, tint: 0xbcb7ab, life: 5, alpha: 0.44 },
    
    
    
    concrete: { mark: TRACK.SCUFF, tint: 0xb8b8b4, life: 2.5, alpha: 0.20 },
    rock: { mark: TRACK.SCUFF, tint: 0xa79f92, life: 2.5, alpha: 0.20 },
    waterClean: { mark: TRACK.RIPPLE, tint: 0xdff4ff, life: 2.6, alpha: 0.80 },
    waterFouled: { mark: TRACK.RIPPLE, tint: 0xbfc3a0, life: 2.6, alpha: 0.72 },
  };

  const trackGeo = new THREE.PlaneGeometry(1, 1);
  const trackCol = new THREE.InstancedBufferAttribute(new Float32Array(MAX_TRACKS), 1);
  const trackAlpha = new THREE.InstancedBufferAttribute(new Float32Array(MAX_TRACKS), 1);
  trackGeo.setAttribute('aCol', trackCol);
  trackGeo.setAttribute('aAlpha', trackAlpha);
  const tracks = new THREE.InstancedMesh(
    trackGeo, stripMaterial(trackTex, TRACK_COLS), MAX_TRACKS,
  );
  tracks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  tracks.count = 0;
  tracks.frustumCulled = false;
  
  
  
  tracks.renderOrder = 2.6;
  scene.add(tracks);

  const track = {
    kind: new Float32Array(MAX_TRACKS),
    x: new Float32Array(MAX_TRACKS),
    







    y: new Float32Array(MAX_TRACKS),
    z: new Float32Array(MAX_TRACKS),
    size: new Float32Array(MAX_TRACKS),
    ang: new Float32Array(MAX_TRACKS),
    born: new Float32Array(MAX_TRACKS),
    life: new Float32Array(MAX_TRACKS),
    peak: new Float32Array(MAX_TRACKS),
    col: new Int32Array(MAX_TRACKS),
  };
  let trackHead = 0;

  function addTrack(kind, x, y, z, size, ang, life, hex, peak) {
    if (!Number.isFinite(x) || !Number.isFinite(z) || !Number.isFinite(size)) return;
    const i = trackHead;
    trackHead = (trackHead + 1) % MAX_TRACKS;
    track.kind[i] = kind;
    track.x[i] = x; track.y[i] = y; track.z[i] = z;
    track.size[i] = size;
    track.ang[i] = ang;
    track.born[i] = clockSec;
    track.life[i] = life;
    track.peak[i] = peak;
    track.col[i] = hex;
  }

  function layTracks() {
    let n = 0;
    for (let i = 0; i < MAX_TRACKS; i += 1) {
      const life = track.life[i];
      if (life <= 0) continue;
      const age = (clockSec - track.born[i]) / life;
      if (age < 0 || age >= 1) continue;
      
      
      
      const grow = track.kind[i] === TRACK.RIPPLE ? 1 + age * 1.6 : 1;
      
      
      
      
      
      
      
      const fade = Math.min(1, (1 - age) * 2.5);
      const size = track.size[i] * grow;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      dummy.position.set(track.x[i], track.y[i] + 0.5, track.z[i]);
      dummy.rotation.set(-Math.PI / 2, 0, track.ang[i]);
      dummy.scale.set(size, size, 1);
      dummy.updateMatrix();
      tracks.setMatrixAt(n, dummy.matrix);
      trackCol.setX(n, track.kind[i]);
      trackAlpha.setX(n, track.peak[i] * fade * fade);
      colour.setHex(track.col[i]);
      tracks.setColorAt(n, colour);
      n += 1;
    }
    tracks.count = n;
    tracks.instanceMatrix.needsUpdate = true;
    trackCol.needsUpdate = true;
    trackAlpha.needsUpdate = true;
    if (tracks.instanceColor) tracks.instanceColor.needsUpdate = true;
  }

  
































  function billboardRotation() {
    return (view.yawSteps * Math.PI) / 2;
  }

  














  function teamTint(m, owner, seat) {
    const herd = m.factions[owner] === HERD;
    const mine = owner === seat;
    if (herd) return mine ? 0xf2ffe8 : 0xd2e8c0;
    return mine ? 0xfff2dc : 0xefd9b4;
  }

  






  function teamMark(m, owner, seat) {
    const herd = m.factions[owner] === HERD;
    const mine = owner === seat;
    if (herd) return mine ? 0x9dff62 : 0x4f9c2e;
    return mine ? 0xffb03a : 0xc06318;
  }

  






























  function setSelection(list) {
    selected = list instanceof Set ? list : new Set(list || []);
  }

  













  function selectionWeight(count) {
    if (count <= 2) return 0.95;
    if (count >= 12) return 0.30;
    
    
    
    
    return 0.95 - ((count - 2) / 10) * 0.65;
  }

  
  
  
  
  
  
  
  
  const slotId = new Int32Array(MAX_UNITS).fill(-1);
  const stepX = new Float32Array(MAX_UNITS);
  const stepZ = new Float32Array(MAX_UNITS);
  
  const idleBeat = new Int32Array(MAX_UNITS).fill(-1);
  










  const firstBody = new Int32Array(MAX_UNITS).fill(-1);
  
  let drawnMatch = null;

  








  let barX = 1;
  let barZ = 0;
  let camX = 0;
  let camZ = 1;

  







  function idleEmit(m, slot, spec, kind, cyc, ux, uz, s) {
    if (!kind) return;
    const id = m.w.u.id[slot];
    if (kind === 'ball') {
      
      
      
      
      const a = cyc * Math.PI * 2;
      const across = Math.sin(a) * s * 0.62;
      const fwd = Math.cos(a) * s * 0.20;
      const size = s * 0.20;
      addLive(
        FLECK.BALL,
        ux + across * barX + fwd * camX,
        groundY(m.w.map, ux * MM, uz * MM) + size * 0.5 + Math.abs(Math.sin(a * 2)) * s * 0.16,
        uz + across * barZ + fwd * camZ,
        size, 1,
        
        
        spec.faction === HERD ? 0xf0d79a : 0xf4f8ff,
        -a * 1.4,
      );
      return;
    }
    
    const part = MACHINE_PART[spec.id];
    if (part) {
      const a = cyc * Math.PI * 2;
      const gp = groundY(m.w.map, ux * MM, uz * MM);
      if (part === 'beacon') {
        
        
        
        
        const pulse = Math.sin(a * 3) * 0.5 + 0.5;
        addLive(
          FLECK.SPARK,
          ux + s * 0.16 * barX, gp + s * 0.72, uz + s * 0.16 * barZ,
          s * (0.15 + pulse * 0.10), 0.35 + pulse * 0.65, 0xffa424, a * 2,
        );
      } else if (part === 'prop') {
        
        
        
        addLive(
          FLECK.PUFF,
          ux - s * 0.30 * camX, gp + s * 0.52, uz - s * 0.30 * camZ,
          s * 0.34, 0.5, 0xdfe6ec, a * 9,
        );
      } else if (part === 'drip') {
        
        
        
        
        const k = cyc - Math.floor(cyc);
        addLive(
          FLECK.SPLASH,
          ux + s * 0.22 * barX, gp + s * 0.34 * (1 - k * k), uz + s * 0.22 * barZ,
          s * 0.12, 1 - k * 0.4, 0xbfd8c8, 0,
        );
      }
    }

    
    
    
    const beat = Math.trunc(cyc);
    if (idleBeat[slot] === beat) return;
    idleBeat[slot] = beat;
    const jx = (phaseOf(id, beat) - 0.5) * s * 0.5;
    const jz = (phaseOf(id, beat + 1) - 0.5) * s * 0.3;
    const gy = groundY(m.w.map, ux * MM, uz * MM);
    if (kind === 'crumb') {
      addFleck(FLECK.CRUMB, ux + jx, uz + jz, gy + s * 0.10, s * 0.26, 0.8, 0x8a7048, s * 0.06);
    } else if (kind === 'puff') {
      
      
      
      const engine = spec.faction !== HERD;
      addFleck(
        FLECK.PUFF, ux + jx, uz + jz,
        gy + s * (engine ? 0.55 : 0.14), s * (engine ? 0.26 : 0.34), engine ? 1.6 : 1.1,
        engine ? 0x9aa0a6 : 0x6b563a, s * (engine ? 0.55 : 0.16),
      );
    } else if (kind === 'ripple') {
      
      
      addTrack(
        TRACK.RIPPLE, ux + jx, groundY(m.w.map, (ux + jx) * MM, (uz + jz) * MM), uz + jz,
        s * 0.5, 0, 2.2, 0xdff4ff, 0.55,
      );
    }
  }

  








  function layTrail(m, slot, spec, s, ux, uz) {
    const name = FOOTMARK[spec.id];
    
    
    
    if (name === null || name === undefined) return;
    const dx = ux - stepX[slot];
    const dz = uz - stepZ[slot];
    const stride = s * 0.6;
    if (dx * dx + dz * dz < stride * stride) return;
    stepX[slot] = ux;
    stepZ[slot] = uz;
    const cx = Math.min(CELLS - 1, Math.max(0, Math.trunc(ux / CELL)));
    const cy = Math.min(CELLS - 1, Math.max(0, Math.trunc(uz / CELL)));
    
    
    
    const surf = SURFACE[materialOfCell(m, cx, cy)];
    if (!surf) return;
    const kind = surf.mark >= 0 ? surf.mark : TRACK[name];
    
    
    
    
    
    const ang = Math.atan2(-dx, -dz);
    addTrack(kind, ux, groundY(m.w.map, ux * MM, uz * MM), uz, s * 0.55, ang,
      surf.life, surf.tint, surf.alpha);
    
    if (surf.mark === TRACK.RIPPLE) {
      addFleck(FLECK.SPLASH, ux, uz, groundY(m.w.map, ux * MM, uz * MM) + s * 0.16,
        s * 0.30, 0.7, 0xe8f6ff, s * 0.10);
    }
  }

  



























  function drawShots(m, seat, events) {
    if (!events || !events.length) return;
    const w = m.w;
    const vis = m.presence.visible;
    const sc = w.sectors.length;
    let budget = TRACER_BUDGET;
    for (const evt of events) {
      if (evt.type !== 'shot') continue;
      if (budget <= 0) break;
      
      
      
      
      
      const from = sectorAt(w.map, evt.x, evt.y);
      const at = sectorAt(w.map, evt.tx, evt.ty);
      const seen = (from >= 0 && vis[seat * sc + from])
        || (at >= 0 && vis[seat * sc + at]);
      if (!seen) continue;
      budget -= 1;

      const look = WEAPON[evt.weapon] || WEAPON.smallArms;
      const x0 = evt.x / MM;
      const z0 = evt.y / MM;
      const x1 = evt.tx / MM;
      const z1 = evt.ty / MM;
      const dx = x1 - x0;
      const dz = z1 - z0;
      const len = Math.hypot(dx, dz);
      const ax = len > 1e-6 ? dx / len : 0;
      const az = len > 1e-6 ? dz / len : 0;
      
      
      
      
      const S = 30 * look.size;
      
      
      
      
      
      const y0g = groundY(w.map, evt.x, evt.y);
      const y1g = groundY(w.map, evt.tx, evt.ty);
      const muzzleY = y0g + S * 0.75;
      const impactY = y1g + S * 0.55;

      if (evt.projectile) {
        
        
        
        const bodies = Math.max(1, Math.min(4, evt.members || 1));
        for (let k = 0; k < bodies; k += 1) {
          
          
          const spread = (k - (bodies - 1) / 2) * S * 0.55;
          addFleck(
            FLECK.SPARK,
            x0 + ax * S * 0.30 - az * spread, z0 + az * S * 0.30 + ax * spread,
            muzzleY, S * 0.62, 0.16, look.flash,
          );
        }
        
        
        
        for (let q = 1; q <= 2; q += 1) {
          const f = q / 3;
          addFleck(
            FLECK.SPARK, x0 + dx * f, z0 + dz * f,
            muzzleY + (impactY - muzzleY) * f, S * 0.26, 0.13 + q * 0.02, look.trail,
          );
        }
      } else {
        
        
        
        
        
        addFleck(FLECK.PUFF, x1, z1, y1g + S * 0.20, S * 0.70, 0.45, 0xbaa98a, S * 0.30);
      }

      
      
      addFleck(
        FLECK.SPARK, x1, z1, y1g + S * 0.52,
        S * (evt.projectile ? 0.46 : 0.72), 0.22, look.flash,
      );

      
      
      
      
      
      if (evt.areaMm > 0) {
        const r = evt.areaMm / MM;
        addTrack(TRACK.RIPPLE, x1, groundY(w.map, evt.tx, evt.ty), z1,
          r * 2, 0, 0.9, look.trail, 0.7);
        for (let k = 0; k < 6; k += 1) {
          const a = (k / 6) * Math.PI * 2;
          addFleck(
            FLECK.PUFF, x1 + Math.cos(a) * r * 0.7, z1 + Math.sin(a) * r * 0.7,
            y1g + S * 0.25, r * 0.5, 0.55, look.trail, r * 0.25,
          );
        }
      }
    }
  }

  function drawUnits(m, seat, tSec) {
    const w = m.w;
    drawnMatch = m;
    firstBody.fill(-1);
    const vis = m.presence.visible;
    const sc = w.sectors.length;
    const yaw = billboardRotation();
    
    
    
    
    
    
    
    barX = Math.cos(yaw);
    barZ = -Math.sin(yaw);
    camX = Math.sin(yaw);
    camZ = Math.cos(yaw);
    liveN = 0;
    
    
    rings.material.opacity = selectionWeight(selected.size);
    let n = 0;
    let rn = 0;
    let bn = 0;
    let cn = 0;
    for (let i = 0; i < w.u.count && n < MAX_INSTANCES; i += 1) {
      if (!w.u.alive[i] || w.u.owner[i] < 0) continue;
      
      
      
      
      
      const sec = w.u.sector[i];
      if (sec >= 0 && !vis[seat * sc + sec]) continue;

      const spec = unitSpec(w, i);
      const s = unitScale(spec.id, manifest);
      
      
      
      
      
      const face = facing8(w.u.facing[i] + Math.round((view.yawSteps * BRADS) / 4));
      const row = rowOf(manifest, spec.id);
      const mark = teamMark(m, w.u.owner[i], seat);
      const isSel = selected.has(i);
      const ux = w.u.x[i] / MM;
      const uz = w.u.y[i] / MM;
      
      
      
      
      
      const uy = groundY(w.map, w.u.x[i], w.u.y[i]);

      
      
      
      
      if (slotId[i] !== w.u.id[i]) {
        slotId[i] = w.u.id[i];
        stepX[i] = ux;
        stepZ[i] = uz;
        idleBeat[i] = -1;
      }

      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const ph = phaseOf(w.u.id[i]);
      const state = w.u.state[i];
      const moving = state === STATE.MOVING;
      const idling = state === STATE.IDLE;
      
      
      
      
      
      
      
      
      
      
      const charging = moving && w.u.orderType[i] === ORDER.ATTACK;
      
      
      
      const pace = charging ? 1.35 : (moving ? 1 : 0.45);
      const gait = pace * (2.75 - ((s - 44) / 76) * 1.6);
      const spin = ph * Math.PI * 2;
      const spinC = Math.cos(spin);
      const spinS = Math.sin(spin);
      const idleAct = IDLE[spec.id];
      const idleCyc = idleAct ? (tSec / idleAct.period) + ph : 0;
      
      
      
      
      
      
      
      
      
      const idleRow = idleManifest ? idleRowOf(idleManifest, spec.id) : -1;
      const framed = idling && idleRow >= 0;
      
      
      
      
      
      
      
      
      
      
      const foot = unitFoot[row * ATLAS_COLS + face];

      
      
      
      
      
      
      
      
      
      
      
      
      const drawn = Math.min(w.u.members[i], CLUSTER_MAX);
      const reach = CLUSTER_REACH[drawn - 1];
      for (let k = 0; k < drawn && n < MAX_INSTANCES; k += 1) {
        const off = CLUSTER[k];
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        const breath = 1 + 0.06 * (1 + Math.sin(
          tSec * gait * 1.7 + phaseOf(w.u.id[i], k + 3) * Math.PI * 2,
        ));
        
        
        
        
        
        const bx = ux + off[0] * s;
        const bz = uz + off[1] * s;
        
        
        const rx = bx - ux;
        const rz = bz - uz;
        const px0 = ux + (rx * spinC - rz * spinS) * breath;
        const pz0 = uz + (rx * spinS + rz * spinC) * breath;

        
        
        const bph = phaseOf(w.u.id[i], k + 1) * Math.PI * 2;
        const beat = tSec * gait * Math.PI * 2 + bph;
        let dy = Math.sin(beat) * s * (charging ? 0.055 : (moving ? 0.038 : 0.014));
        let dx = 0;
        let dz = 0;
        
        
        
        
        let tilt = Math.sin(beat * 0.5 + bph) * (moving ? 0.085 : 0.05)
          + (charging ? 0.20 : (moving ? 0.055 : 0));
        let sx = 1;
        let sy = 1;

        
        
        
        
        
        
        
        
        
        
        
        const bodyCyc = idleCyc + k * 0.29;
        let tileCol = face;
        let tileRow = row;
        let tileSheet = 0;

        
        if (idling && idleAct) {
          const im = idleMotion(idleAct.act, bodyCyc, s);
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          
          const d = framed ? IDLE_FRAME_RESIDUAL : 1;
          dx += im.dx * d; dy += im.dy * d; dz += im.dz * d;
          tilt += im.tilt * d;
          sx *= 1 + (im.sx - 1) * d; sy *= 1 + (im.sy - 1) * d;
          if (k === 0) idleEmit(m, i, spec, im.emit, idleCyc, ux, uz, s);
        }

        
        
        
        
        
        
        if (framed) {
          const fr = idleFrame(idleManifest, bodyCyc);
          if (fr > 0) {
            tileCol = idleColumn(idleManifest, face, fr);
            tileRow = idleRow;
            tileSheet = 1;
          }
        }

        
        
        
        const alt = spec.air ? s * 0.55 + Math.sin(beat * 0.6) * s * 0.05 : 0;

        
        
        
        
        const px = px0 + dx * barX + dz * camX;
        const pz = pz0 + dx * barZ + dz * camZ;
        dummy.position.set(px, uy + s * (0.5 - foot) * sy + dy + alt, pz);
        dummy.rotation.set(0, yaw, tilt);
        dummy.scale.set(s * sx, s * sy, s);
        dummy.updateMatrix();
        units.setMatrixAt(n, dummy.matrix);

        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        const lift = Math.max(0, alt / s);
        const shrink = 1 / (1 + lift * 1.6);
        dummy.position.set(px0, uy + 0.6, pz0 + s * 0.10);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(s * 0.82 * shrink, s * 0.52 * shrink, 1);
        dummy.updateMatrix();
        shadows.setMatrixAt(n, dummy.matrix);
        colour.setHex(mark);
        shadows.setColorAt(n, colour);

        
        
        
        tileAttr.setXYZ(n, tileCol, tileRow, tileSheet);
        if (k === 0) firstBody[i] = n;
        
        
        
        
        
        
        
        
        
        
        
        colour.setHex(teamTint(m, w.u.owner[i], seat));
        units.setColorAt(n, colour);
        n += 1;
      }

      
      layTrail(m, i, spec, s, ux, uz);

      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      if (isSel && rn < 512) {
        const ringX = (reach + RING_FOOT) / RING_TEX_RADIUS;
        const ringZ = (reach + RING_FOOT * RING_SQUASH) / RING_TEX_RADIUS;
        dummy.position.set(ux, uy + 0.75, uz + s * 0.10);
        dummy.rotation.set(-Math.PI / 2, 0, 0);
        dummy.scale.set(s * ringX, s * ringZ, 1);
        dummy.updateMatrix();
        rings.setMatrixAt(rn, dummy.matrix);
        colour.setHex(mark);
        rings.setColorAt(rn, colour);
        rn += 1;
      }

      
      
      
      
      const pct = packPct(w, i);
      if (pct < 100 && bn < MAX_INSTANCES) {
        const wBar = s * 0.54;
        const hBar = Math.max(2.2, s * 0.095);
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        const y = s * (0.92 + 0.9 * reach) - s * foot;
        dummy.rotation.set(0, yaw, 0);
        dummy.position.set(ux, uy + y, uz);
        dummy.scale.set(wBar, hBar, 1);
        dummy.updateMatrix();
        hpBack.setMatrixAt(bn, dummy.matrix);
        colour.setHex(0x14180f);
        hpBack.setColorAt(bn, colour);

        
        
        
        const frac = Math.max(0.02, pct / 100);
        const shift = -(1 - frac) * wBar * 0.5;
        dummy.position.set(ux + barX * shift, uy + y, uz + barZ * shift);
        dummy.scale.set(wBar * frac, hBar * 0.62, 1);
        dummy.updateMatrix();
        hpFill.setMatrixAt(bn, dummy.matrix);
        
        
        
        colour.setHex(pct > 60 ? 0x7fdc4a : (pct > 30 ? 0xe8c23a : 0xe0503a));
        hpFill.setColorAt(bn, colour);
        bn += 1;
      }

      
      
      
      
      
      if (w.u.members[i] > 1 && cn < MAX_INSTANCES) {
        const size = Math.max(12, s * 0.30);
        dummy.rotation.set(0, yaw, 0);
        const shift = s * 0.38;
        dummy.position.set(ux + barX * shift,
          uy + s * (0.92 + 0.9 * reach) - s * foot, uz + barZ * shift);
        dummy.scale.set(size, size, 1);
        dummy.updateMatrix();
        counts.setMatrixAt(cn, dummy.matrix);
        countAttr.setX(cn, Math.min(15, w.u.members[i] - 1));
        cn += 1;
      }
    }
    units.count = n;
    shadows.count = n;
    rings.count = rn;
    hpBack.count = bn;
    hpFill.count = bn;
    counts.count = cn;
    shadows.instanceMatrix.needsUpdate = true;
    units.instanceMatrix.needsUpdate = true;
    rings.instanceMatrix.needsUpdate = true;
    hpBack.instanceMatrix.needsUpdate = true;
    hpFill.instanceMatrix.needsUpdate = true;
    counts.instanceMatrix.needsUpdate = true;
    tileAttr.needsUpdate = true;
    countAttr.needsUpdate = true;
    if (units.instanceColor) units.instanceColor.needsUpdate = true;
    if (shadows.instanceColor) shadows.instanceColor.needsUpdate = true;
    if (rings.instanceColor) rings.instanceColor.needsUpdate = true;
    if (hpBack.instanceColor) hpBack.instanceColor.needsUpdate = true;
    if (hpFill.instanceColor) hpFill.instanceColor.needsUpdate = true;
  }

  









  function drawBuildings(m, seat, tSec) {
    const w = m.w;
    const vis = m.presence.visible;
    const sc = w.sectors.length;
    const yaw = billboardRotation();
    const col = facingFor(buildingManifest, view.yawSteps);
    
    
    
    
    buildOrder.length = 0;
    buildDepthYaw = view.yawSteps;
    for (let i = 0; i < w.b.count; i += 1) {
      if (!w.b.alive[i] || w.b.owner[i] < 0) continue;
      const sec = w.b.sector[i];
      if (sec >= 0 && !vis[seat * sc + sec]) continue;
      buildOrder.push(i);
    }
    
    
    
    
    
    buildOrder.sort((a, b) => buildDepth(a) - buildDepth(b) || a - b);

    let n = 0;
    for (const i of buildOrder) {
      if (n >= 256) break;
      const spec = buildingSpec(w, i);
      const row = buildingRowOf(buildingManifest, spec.id);
      const size = buildingScale(spec.id, buildingManifest);
      const bx = w.b.x[i] / MM;
      const bz = w.b.y[i] / MM;
      const by = groundY(w.map, w.b.x[i], w.b.y[i]);
      const under = w.b.building[i] > 0;

      
      
      
      
      
      
      
      
      
      const total = Math.max(1, spec.buildTicks || 1);
      const grow = under ? 0.55 + 0.45 * (1 - Math.min(1, w.b.building[i] / total)) : 1;
      const drawn = size * grow;

      
      
      
      
      const foot = buildingFoot[row * BUILD_COLS + col];
      dummy.position.set(bx, by + drawn * (0.5 - foot), bz);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(drawn, drawn, drawn);
      dummy.updateMatrix();
      buildings.setMatrixAt(n, dummy.matrix);
      bTileAttr.setXY(n, col, row);
      
      
      
      
      
      colour.setHex(under ? 0x9aa08e : teamTint(m, w.b.owner[i], seat));
      buildings.setColorAt(n, colour);

      
      
      
      const pad = size * 0.72;
      dummy.position.set(bx, by + 0.5, bz + size * 0.06);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(pad, pad * 0.62, 1);
      dummy.updateMatrix();
      buildingPads.setMatrixAt(n, dummy.matrix);
      colour.setHex(teamMark(m, w.b.owner[i], seat));
      buildingPads.setColorAt(n, colour);

      
      
      
      
      if (under) {
        
        
        
        const beat = Math.trunc(tSec * 2 + phaseOf(w.b.id[i], 7) * 4);
        if (siteBeat[i] !== beat) {
          siteBeat[i] = beat;
          addFleck(
            FLECK.PUFF,
            bx + (phaseOf(w.b.id[i], beat) - 0.5) * size * 0.5,
            bz + (phaseOf(w.b.id[i], beat + 1) - 0.5) * size * 0.3,
            by + drawn * 0.18,
            drawn * 0.30, 1.4, 0xd8d2bd, drawn * 0.34,
          );
        }
      }
      n += 1;
    }
    buildings.count = n;
    buildingPads.count = n;
    buildings.instanceMatrix.needsUpdate = true;
    buildingPads.instanceMatrix.needsUpdate = true;
    bTileAttr.needsUpdate = true;
    if (buildings.instanceColor) buildings.instanceColor.needsUpdate = true;
    if (buildingPads.instanceColor) buildingPads.instanceColor.needsUpdate = true;
  }

  
  
  
  
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.82, 28),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, side: THREE.DoubleSide }),
  );
  marker.rotation.x = -Math.PI / 2;
  marker.visible = false;
  marker.renderOrder = 5;
  scene.add(marker);
  let markerUntil = 0;

  function markOrder(xMm, yMm) {
    marker.position.set(xMm / MM, groundY(currentMap, xMm, yMm) + 1.5, yMm / MM);
    marker.visible = true;
    markerUntil = performance.now() + 2000;
  }

  
  function frame(m, seat, now = 0) {
    
    
    
    
    clockSec = (now || performance.now()) / 1000;
    
    
    let key = '';
    for (let i = 0; i < m.w.sectors.length; i += 1) {
      const s = m.w.sectors[i];
      key += `${s.owner === null ? '-' : s.owner}${s.pollution}`;
    }
    const vis = m.presence.visible;
    const sc = m.w.sectors.length;
    for (let i = 0; i < sc; i += 1) key += vis[seat * sc + i] ? '1' : '0';
    if (key !== groundKey) {
      groundKey = key;
      
      
      
      layTiles(m);
      paintGround(m, seat);
      
      layProps(m, seat, view.yawSteps);
      propYaw = view.yawSteps;
    }

    
    
    if (propYaw !== view.yawSteps) {
      layProps(m, seat, view.yawSteps);
      propYaw = view.yawSteps;
    }

    if (marker.visible) {
      const left = markerUntil - (now || performance.now());
      if (left <= 0) marker.visible = false;
      else {
        
        
        const t = 1 - left / 2000;
        const size = 40 + t * 34;
        marker.scale.set(size, size, size);
        marker.material.opacity = 0.85 * (1 - t);
      }
    }

    drawBuildings(m, seat, clockSec);
    drawUnits(m, seat, clockSec);
    
    
    
    layFlecks();
    layTracks();
    renderer.render(scene, cam);
  }

  
  const api = {
    frame,
    resize,
    view,
    panBy(dxPx, dyPx) {
      const h = renderer.domElement.clientHeight || 1;
      const scale = (view.span * 2) / h;
      const yaw = (view.yawSteps * Math.PI) / 2;
      const dx = dxPx * scale;
      const dy = dyPx * scale;
      view.x -= dx * Math.cos(yaw) + dy * Math.sin(yaw);
      view.y -= dy * Math.cos(yaw) - dx * Math.sin(yaw);
      clampView();
      placeCamera();
    },
    zoomBy(factor) {
      view.span = Math.max(view.minSpan, Math.min(view.maxSpan, view.span * factor));
      resize();
    },
    rotate(dir) {
      view.yawSteps = (view.yawSteps + dir + 4) % 4;
      
      
      propYaw = -1;
      placeCamera();
    },
    centreOn(xMm, yMm) {
      view.x = xMm / MM;
      view.y = yMm / MM;
      clampView();
      placeCamera();
    },
    
    pick(clientX, clientY) {
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, cam);
      const hit = ray.intersectObject(ground, false);
      if (hit.length === 0) return null;
      return { x: Math.round(hit[0].point.x * MM), y: Math.round(hit[0].point.z * MM) };
    },
    markOrder,
    setSelection,

    









    shots(m, seat, events) { drawShots(m, seat, events); },
    








    reset(m, seat) {
      groundKey = '';
      
      
      
      
      scatter = scatterProps(m.w.map, { facings: PROP_COLS, max: MAX_PROP_INSTANCES });
      
      
      
      
      liftOverlay(m.w.map);
      currentMap = m.w.map;
      propYaw = -1;
      marker.visible = false;
      units.count = 0;
      buildings.count = 0;
      buildingPads.count = 0;
      
      
      
      
      
      
      
      
      fleck.life.fill(0);
      track.life.fill(0);
      liveN = 0;
      fleckHead = 0;
      trackHead = 0;
      slotId.fill(-1);
      idleBeat.fill(-1);
      siteBeat.fill(-1);
      
      
      
      
      
      
      firstBody.fill(-1);
      drawnMatch = null;
      flecks.count = 0;
      tracks.count = 0;
      view.span = 320;
      view.yawSteps = 0;
      const sp = m.w.map.spawns.find((s) => s.seat === seat);
      if (sp) { view.x = sp.x / MM; view.y = sp.y / MM; }
      clampView();
      resize();
    },
    dispose() { renderer.dispose(); },

    





















    
















    propPixelsDrawn() {
      const gl = renderer.getContext();
      const w = renderer.domElement.width;
      const h = renderer.domElement.height;
      const withProps = new Uint8Array(w * h * 4);
      const without = new Uint8Array(w * h * 4);
      
      
      renderer.render(scene, cam);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, withProps);
      const was = propMesh.visible;
      propMesh.visible = false;
      renderer.render(scene, cam);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, without);
      propMesh.visible = was;
      renderer.render(scene, cam);
      let n = 0;
      for (let i = 0; i < withProps.length; i += 4) {
        if (withProps[i] !== without[i]
          || withProps[i + 1] !== without[i + 1]
          || withProps[i + 2] !== without[i + 2]) n += 1;
      }
      return n;
    },

    

    propsPlaced() { return scatter.props.length; },

    unitPixelsDrawn() { return pixelsOf(units); },

    




















    unitTiles() {
      if (!drawnMatch) return [];
      const w = drawnMatch.w;
      const out = [];
      for (let i = 0; i < w.u.count; i += 1) {
        const n = firstBody[i];
        if (n < 0) continue;
        out.push({
          slot: i,
          id: unitSpec(w, i).id,
          owner: w.u.owner[i],
          idle: w.u.state[i] === STATE.IDLE,
          col: tileAttr.getX(n),
          row: tileAttr.getY(n),
          sheet: tileAttr.getZ(n),
        });
      }
      return out;
    },

    
    idleAtlas() {
      if (!idleManifest) return null;
      return {
        cols: IDLE_COLS,
        rows: IDLE_ROWS,
        tile: idleManifest.tile,
        stored: idleManifest.stored,
        order: [...idleManifest.order],
        ids: Object.keys(idleManifest.rows),
        
        
        
        
        shaderReady: !!idleUniform,
      };
    },

    





















    idlePixelsDrawn() {
      if (!idleUniform) return -1;
      const gl = renderer.getContext();
      const w = renderer.domElement.width;
      const h = renderer.domElement.height;
      const withIt = new Uint8Array(w * h * 4);
      const without = new Uint8Array(w * h * 4);
      
      
      renderer.render(scene, cam);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, withIt);
      const was = idleUniform.value;
      idleUniform.value = blankTex;
      renderer.render(scene, cam);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, without);
      idleUniform.value = was;
      renderer.render(scene, cam);
      let n = 0;
      for (let i = 0; i < withIt.length; i += 4) {
        if (withIt[i] !== without[i]
          || withIt[i + 1] !== without[i + 1]
          || withIt[i + 2] !== without[i + 2]) n += 1;
      }
      return n;
    },

    













    buildingPixelsDrawn() { return pixelsOf(buildings); },
    trackPixelsDrawn() { return pixelsOf(tracks); },
    fleckPixelsDrawn() { return pixelsOf(flecks); },

    
    effectCounts() {
      return {
        units: units.count,
        buildings: buildings.count,
        tracks: tracks.count,
        flecks: flecks.count,
      };
    },
  };

  











  function pixelsOf(mesh) {
    const gl = renderer.getContext();
    const w = renderer.domElement.width;
    const h = renderer.domElement.height;
    const withIt = new Uint8Array(w * h * 4);
    const without = new Uint8Array(w * h * 4);
    
    
    
    renderer.render(scene, cam);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, withIt);
    const was = mesh.visible;
    mesh.visible = false;
    renderer.render(scene, cam);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, without);
    mesh.visible = was;
    renderer.render(scene, cam);
    let n = 0;
    for (let i = 0; i < withIt.length; i += 4) {
      if (withIt[i] !== without[i]
        || withIt[i + 1] !== without[i + 1]
        || withIt[i + 2] !== without[i + 2]) n += 1;
    }
    return n;
  }

  function clampView() {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const inset = Math.min(view.span * 0.78, FIELD / 2);
    view.x = Math.max(inset, Math.min(FIELD - inset, view.x));
    view.y = Math.max(inset, Math.min(FIELD - inset, view.y));
  }

  resize();
  const spawn = match.w.map.spawns.find((s) => s.seat === viewSeat);
  if (spawn) api.centreOn(spawn.x, spawn.y);
  return api;
}
