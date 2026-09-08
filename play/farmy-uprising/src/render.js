



















import * as THREE from 'three';
import { FIELD_MM } from '../../../web-engine/rts/fixed.js';
import { CELLS_PER_SIDE, sectorAt } from '../../../web-engine/rts/maps/mapFormat.js';
import {
  cornerHeightDm, MM_PER_DM, tierOfDm, tierAtMm,
} from '../../../web-engine/rts/maps/elevation.js';
import { terrainForSector } from '../../../web-engine/rts/art/terrainRecipe.js';
import {
  buildTerrainTextures, buildMacroTexture, buildDetailTexture, buildSurroundTexture,
  GROUND_LIGHT, TEX_METRES,
} from './terrainTex.js';
import {
  scatterProps, columnFor, depthKey, SCATTER_KINDS,
} from '../../../web-engine/rts/art/scatter.js';
import { loadPropAtlas, propPlacement, fallbackPropAtlas } from './propSprites.js';
import { HERD } from '../../../web-engine/rts/roster.js';
import { HOLD_MAX, captureState } from '../../../web-engine/rts/territory.js';
import { facing8, BRADS } from '../../../web-engine/rts/fixed.js';
import { UNITS, BUILDINGS } from '../../../web-engine/rts/roster.js';
import {
  unitSpec, buildingSpec, packPct, STATE, ORDER, MAX_UNITS,
} from '../../../web-engine/rts/sim/world.js';



import {
  washStyle, washAlphaFor, relationOf, groundColour,
  playerColours, hexInt, WASH_ALPHA as OWNED_WASH_ALPHA,
} from '../../../web-engine/rts/palette.js';
import { loadAtlas, rowOf, rowCount, unitScale, fallbackAtlas } from './sprites.js';
import { createVisualSpread } from './visualSpread.js';
import { shouldRetreat } from '../../../web-engine/rts/sim/retreat.js';
import {
  loadBuildingAtlas, rowOf as buildingRowOf, facingFor, buildingScale, fallbackBuildingAtlas,
} from './buildingSprites.js';
import {
  loadIdleAtlas, idleColumns, idleRowCount, idleRowOf, idleFrame, idleColumn,
} from './idleSprites.js';





import { createEffects } from './effects.js';
import { approach, decay } from './interp.js';
import { SETTINGS as QUALITY_SETTINGS } from './quality.js';
import { loadAnimAtlases, animColumns, animRowCount } from './animSprites.js';
import { animFrame, animTile, DIE_TICKS } from '../../../web-engine/rts/art/animFrames.js';


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
































































const CLUSTER_MAX = 13;
const CLUSTER = [
  [0, 0],
  
  [0.000, 0.850], [0.808, 0.263], [0.500, -0.688], [-0.500, -0.688], [-0.808, 0.263],
  
  [1.640, 0.790], [0.405, 1.774], [-1.135, 1.423], [-1.820, 0.000],
  [-1.135, -1.423], [0.405, -1.774], [1.640, -0.790],
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


































const SUN = (() => {
  const raw = [-0.568, 0.669, -0.479];
  const len = Math.hypot(raw[0], raw[1], raw[2]);
  const dir = [raw[0] / len, raw[1] / len, raw[2] / len];
  const ground = Math.hypot(dir[0], dir[2]);
  
  const cast = [-dir[0] / ground, -dir[2] / ground];
  return {
    dir,
    
    flat: dir[1],
    cast,
    
    reach: ground / dir[1],
    










    castAngle: Math.atan2(-cast[0], -cast[1]),
  };
})();






























const CUSTOM_TONE_MAP = `
vec3 fuACES( vec3 x ) {
  // Narkowicz's closed-form fit of the ACES filmic curve. The point of it is
  // the shoulder: a warm key that would have clipped a white shed to a flat
  // 255 now rolls off through cream, and the ground under it keeps its detail.
  const float a = 2.51;
  const float b = 0.03;
  const float c = 2.43;
  const float d = 0.59;
  const float e = 0.14;
  return saturate( ( x * ( a * x + b ) ) / ( x * ( c * x + d ) + e ) );
}
vec3 CustomToneMapping( vec3 color ) {
  color *= toneMappingExposure;
  // THE GRADE: a warm key against a cool shadow, split on luminance.
  //
  // Every outdoor photograph has this in it and no unlit renderer gets it by
  // accident - the sun is warm, and the only light reaching a shadow is the
  // sky, which is blue. Splitting on luminance rather than on a light vector
  // costs one smoothstep and applies to the sprites too, which carry their own
  // shading baked in from the offline render and would otherwise stand in a
  // different afternoon from the ground under them.
  float l = dot( color, vec3( 0.2126, 0.7152, 0.0722 ) );
  float t = smoothstep( 0.015, 0.60, l );
  color *= mix( vec3( 0.88, 0.955, 1.16 ), vec3( 1.09, 1.015, 0.88 ), t );
  color = fuACES( color );
  // ...AND THE CONTRAST BACK, because on display-referred art the curve alone
  // takes it away. ACES(x) = x crosses at linear 0.061 and 0.728 and this game
  // lives almost entirely between them, so every paddock comes out of the
  // filmic curve LIFTED and flatter than it was painted. A gamma of 1.15 on
  // the output pulls the low end back down without touching white, which puts
  // the value structure back: measured against Lane M new palette, a dark
  // material at 70 goes to 56, the mean at 108 to 115 and concrete at 153 to
  // 175. Darks down, highlights up, mids where the painter put them.
  color = pow( color, vec3( 1.15 ) );
  // ACES eats saturation on the way through, and a farm in the afternoon is
  // not a grey place. A little of it back and no more: past about 1.2 the
  // Herd's pasture goes acid and stops reading as grass.
  float g = dot( color, vec3( 0.2126, 0.7152, 0.0722 ) );
  return saturate( mix( vec3( g ), color, 1.15 ) );
}
`;


let toneMapInstalled = false;

function installToneMapping(renderer) {
  if (!toneMapInstalled) {
    const stub = 'vec3 CustomToneMapping( vec3 color ) { return color; }';
    const chunk = THREE.ShaderChunk.tonemapping_pars_fragment;
    if (!chunk || chunk.indexOf(stub) < 0) {
      
      console.warn('Farmy Uprising: three.js CustomToneMapping hook has moved'
        + ' - falling back to plain ACES with no colour grade');
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      return;
    }
    THREE.ShaderChunk.tonemapping_pars_fragment = chunk.replace(stub, CUSTOM_TONE_MAP);
    toneMapInstalled = true;
  }
  renderer.toneMapping = THREE.CustomToneMapping;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  renderer.toneMappingExposure = 1.05;
}

export async function createRenderer(canvas, match, viewSeat) {
  
  
  
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  
  
  
  
  renderer.setPixelRatio(Math.min(QUALITY_SETTINGS.high.pixelRatio, window.devicePixelRatio || 1));
  let qualityTier = 'high';
  installToneMapping(renderer);
  const scene = new THREE.Scene();

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const HAZE_COLOUR = new THREE.Color('#aebbb8');
  scene.fog = new THREE.Fog(HAZE_COLOUR, 1, 2);
  
  
  
  
  scene.background = HAZE_COLOUR.clone();

  
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 4000);
  const view = {
    x: FIELD / 2, y: FIELD / 2,
    
    
    
    
    span: 320,
    minSpan: 130, maxSpan: 620,
    yawSteps: 0,
  };

  



















  const HAZE = 0.34;

  







  const camView = new THREE.Vector3(0, 1, 0);
  
  const sunHalf = new THREE.Vector3(0, 1, 0);

  function setHaze() {
    const depth = 1.111 * view.span;
    scene.fog.near = 1200 - depth;
    scene.fog.far = scene.fog.near + (2 * depth) / HAZE;
  }

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
    camView.set(off.x, off.y, off.z).normalize();
    sunHalf.set(SUN.dir[0], SUN.dir[1], SUN.dir[2]).add(camView).normalize();
    
    
    setHaze();
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

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const cornerNrm = new Float32Array((CELLS + 1) * (CELLS + 1) * 3);
  function buildNormals(map) {
    for (let iy = 0; iy <= CELLS; iy += 1) {
      for (let ix = 0; ix <= CELLS; ix += 1) {
        const x0 = Math.max(0, ix - 1);
        const x1 = Math.min(CELLS, ix + 1);
        const y0 = Math.max(0, iy - 1);
        const y1 = Math.min(CELLS, iy + 1);
        const dx = (cornerY(map, x1, iy) - cornerY(map, x0, iy)) / ((x1 - x0) * CELL);
        const dz = (cornerY(map, ix, y1) - cornerY(map, ix, y0)) / ((y1 - y0) * CELL);
        const inv = 1 / Math.hypot(dx, 1, dz);
        const w = (iy * (CELLS + 1) + ix) * 3;
        cornerNrm[w] = -dx * inv;
        cornerNrm[w + 1] = inv;
        cornerNrm[w + 2] = -dz * inv;
      }
    }
  }
  buildNormals(match.w.map);

  














  function slopeLightAt(map, xMm, yMm) {
    if (!map || !map.heightOfCell) return 1;
    const n = map.cellsPerSide;
    const fx = Math.min(n, Math.max(0, xMm / map.cellMm));
    const fy = Math.min(n, Math.max(0, yMm / map.cellMm));
    const cx = Math.min(n - 1, Math.trunc(fx));
    const cy = Math.min(n - 1, Math.trunc(fy));
    const tx = fx - cx;
    const ty = fy - cy;
    let d = 0;
    for (let k = 0; k < 4; k += 1) {
      const ix = cx + (k & 1);
      const iy = cy + (k >> 1);
      const w = (iy * (CELLS + 1) + ix) * 3;
      const wt = ((k & 1) ? tx : 1 - tx) * ((k >> 1) ? ty : 1 - ty);
      d += wt * (cornerNrm[w] * SUN.dir[0] + cornerNrm[w + 1] * SUN.dir[1]
        + cornerNrm[w + 2] * SUN.dir[2]);
    }
    const t = Math.max(-1, Math.min(1, (d - SUN.flat) / (1 - SUN.flat)));
    return 1 + t * (t > 0 ? 0.22 : 0.30);
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const macroTex = buildMacroTexture(THREE);
  const detailTex = buildDetailTexture(THREE);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const CLOUD_METRES = 360;
  const cloudTex = (() => {
    const S = 256;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const x = c.getContext('2d');
    const img = x.createImageData(S, S);
    let seed = 0x9e3779b9;
    const rnd = () => {
      seed = Math.imul(seed ^ (seed >>> 15), 2246822507) >>> 0;
      return (seed >>> 8) / 16777216;
    };
    
    
    
    
    
    const oct = [[3, 0.62], [6, 0.26], [12, 0.12]];
    const grids = oct.map(([n]) => Float32Array.from({ length: n * n }, rnd));
    const smooth = (t) => t * t * (3 - 2 * t);
    for (let py = 0; py < S; py += 1) {
      for (let px = 0; px < S; px += 1) {
        let v = 0;
        for (let k = 0; k < oct.length; k += 1) {
          const n = oct[k][0];
          const g = grids[k];
          const fx = (px / S) * n;
          const fy = (py / S) * n;
          const ix = Math.floor(fx);
          const iy = Math.floor(fy);
          const tx = smooth(fx - ix);
          const ty = smooth(fy - iy);
          
          
          
          const a = g[(iy % n) * n + (ix % n)];
          const b = g[(iy % n) * n + ((ix + 1) % n)];
          const cc = g[((iy + 1) % n) * n + (ix % n)];
          const d = g[((iy + 1) % n) * n + ((ix + 1) % n)];
          v += oct[k][1] * ((a * (1 - tx) + b * tx) * (1 - ty)
            + (cc * (1 - tx) + d * tx) * ty);
        }
        
        
        const cl = smooth(Math.max(0, Math.min(1, (v - 0.44) / 0.22)));
        const o = (py * S + px) * 4;
        const g8 = Math.round(cl * 255);
        img.data[o] = g8;
        img.data[o + 1] = g8;
        img.data[o + 2] = g8;
        img.data[o + 3] = 255;
      }
    }
    x.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    
    
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = true;
    return t;
  })();

  
  const groundShaders = [];
  const G = GROUND_LIGHT;
  const v3 = (a) => `vec3(${a[0]}, ${a[1]}, ${a[2]})`;
  
























  const SUN_LIGHT = `
    varying vec3 vNrm;
    const vec3 fuSunDir = vec3(${SUN.dir[0]}, ${SUN.dir[1]}, ${SUN.dir[2]});
    float fuSlope(vec3 n) {
      return clamp((dot(normalize(n), fuSunDir) - ${SUN.flat}) / ${1 - SUN.flat}, -1.0, 1.0);
    }
    vec3 fuSunLight(vec3 n) {
      float t = fuSlope(n);
      float lum = 1.0 + (t > 0.0 ? t * 0.34 : t * 0.44);
      return lum * mix(vec3(0.92, 0.97, 1.10), vec3(1.08, 1.03, 0.90), t * 0.5 + 0.5);
    }
  `;

  const GROUND_NOISE = `
    varying vec3 vGroundPos;
    uniform sampler2D uMacro;
    uniform sampler2D uDetail;
    uniform float uField;
    uniform sampler2D uClouds;
    uniform vec2 uCloudShift;
    // WEATHER, AND IT IS TINTED RATHER THAN ONLY DIMMED. Ground under a cloud
    // is lit by the sky alone, which is blue - the same argument the cast
    // shadows and the colour grade both make. Using one answer everywhere is
    // what stops three separate shadow colours arguing on one screen.
    vec3 fuClouds(vec2 w) {
      float c = texture2D(uClouds, w / ${CLOUD_METRES}.0 + uCloudShift).r;
      return mix(vec3(1.0), vec3(0.74, 0.79, 0.92), c);
    }
    vec3 fuGroundLight(vec3 m, float mottle) {
      float n = m.r * ${G.macroWeights[0]} + m.g * ${G.macroWeights[1]} + m.b * ${G.macroWeights[2]};
      // 0.74 to 1.26 - a HALF STOP either side of neutral. It was half that,
      // and the texture still won: at 320 span the 50 m repeat showed as a
      // lattice across every paddock, because the periodic signal was louder
      // than the aperiodic one laid over it.
      float shade = (${G.shadeLo} + n * ${G.shadeSpan}) * (${G.mottleLo} + mottle * ${G.mottleSpan});
      return shade * mix(${v3(G.cool)}, ${v3(G.warm)}, n);
    }

    // ---- THE GROUND ROLLS, AND THE HEIGHT FIELD DOES NOT SAY SO ----------
    //
    // Half of mudgeeFlats is flat to the millimetre, measured: the median
    // slope light over all 9,409 corners is exactly 1.000. That is honest -
    // the map is called the Flats - but a real paddock is never a table, and a
    // sun that only touches the two named landforms leaves nine tenths of the
    // screen exactly as unlit as it was before there was a sun.
    //
    // So the geometric normal is BENT by the macro field before it is lit.
    // uMacro is already a smooth field-wide lattice - g at about 67 m
    // features, b at about 22 m - and reading it as a HEIGHT rather than as a
    // brightness gives four or five metres of rolling ground for two texture
    // fetches. The difference on screen is large, because it is directional:
    // every rise across the whole map catches the light on the same side, and
    // that consistency is what the eye reads as land. Uncorrelated per-pixel
    // brightness, which is what fuGroundLight alone gives, reads as dirt.
    //
    // TWO FETCHES, NOT FOUR. The centre sample is the one fuGroundLight
    // already needs, so it is taken once in the caller and passed to both;
    // that turns a central difference into a forward difference, which is
    // biased by half a step and completely invisible in a lighting term. The
    // ground shader is the one place in this file where a fetch is expensive -
    // it covers the whole screen, and a slow ground shader has already cost
    // this game its SIMULATION rate once.
    vec3 fuBend(vec3 n, vec2 uv, vec3 m0) {
      float du = 6.0 / uField;
      vec3 mx = texture2D(uMacro, uv + vec2(du, 0.0)).rgb;
      vec3 mz = texture2D(uMacro, uv + vec2(0.0, du)).rgb;
      // Metres of rise per unit of channel, over the 6 m the difference spans.
      vec2 s = (vec2(mx.g - m0.g, mz.g - m0.g) * 5.0
              + vec2(mx.b - m0.b, mz.b - m0.b) * 1.0) / 6.0;
      return normalize(n + vec3(-s.x, 0.0, -s.y));
    }
  `;

  








  
























  const WATER = `
    uniform float uTime;
    uniform vec3 uHalf;
    uniform vec3 uView;
    varying float vShore;
    vec3 fuWaterNormal(vec2 w) {
      vec2 k1 = vec2( 0.63,  0.28);
      vec2 k2 = vec2(-0.31,  0.74);
      vec2 k3 = vec2( 0.94, -0.52);
      // THE PHASES CROSS-MODULATE, and without that this is tartan.
      //
      // Three plain sine waves are three plane waves, and three plane waves
      // interfere into a perfectly regular diamond lattice - measured on
      // art/preview/out/laneL/s7-river.png, where the dam came out looking
      // like pressed glass. Feeding each wave's phase through a slow sine of
      // ANOTHER wave's argument makes the sum aperiodic for the cost of one
      // more sine each, and the surface goes from a woven pattern to water.
      float p1 = dot(w, k1) + uTime * 1.15 + sin(dot(w, k2) * 0.41) * 1.4;
      float p2 = dot(w, k2) + uTime * 0.87 + sin(dot(w, k3) * 0.29) * 1.2;
      float p3 = dot(w, k3) - uTime * 1.63 + sin(dot(w, k1) * 0.53) * 0.9;
      vec2 s = k1 * cos(p1) * 0.26 + k2 * cos(p2) * 0.22 + k3 * cos(p3) * 0.15;
      return normalize(vec3(-s.x, 1.0, -s.y));
    }
  `;

  
  const waterShaders = [];

  








  function groundMaterial(map, fade, water) {
    const mat = new THREE.MeshBasicMaterial({
      map,
      transparent: !!fade,
      depthWrite: !fade,
    });
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const cacheKey = `fuGround|${fade ? 1 : 0}|${water ? 1 : 0}`;
    mat.customProgramCacheKey = () => cacheKey;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uMacro = { value: macroTex };
      shader.uniforms.uDetail = { value: detailTex };
      shader.uniforms.uField = { value: FIELD };
      shader.uniforms.uClouds = { value: cloudTex };
      shader.uniforms.uCloudShift = { value: new THREE.Vector2(0, 0) };
      groundShaders.push(shader);
      if (water) {
        shader.uniforms.uTime = { value: 0 };
        shader.uniforms.uHalf = { value: new THREE.Vector3(0, 1, 0) };
        shader.uniforms.uView = { value: new THREE.Vector3(0, 1, 0) };
        waterShaders.push(shader);
      }
      shader.vertexShader = `varying vec3 vGroundPos;\nattribute vec3 aNrm;\nvarying vec3 vNrm;\n${water ? 'attribute float aShore;\nvarying float vShore;\n' : ''}${fade ? 'attribute float aFade;\nvarying float vFade;\n' : ''}${shader.vertexShader}`
        .replace('#include <begin_vertex>',
          `#include <begin_vertex>\n  vGroundPos = transformed;\n  vNrm = aNrm;${water ? '\n  vShore = aShore;' : ''}${fade ? '\n  vFade = aFade;' : ''}`);
      
      
      shader.fragmentShader = `${SUN_LIGHT}\n${GROUND_NOISE}\n${water ? WATER : ''}\n${fade ? 'varying float vFade;\n' : ''}${shader.fragmentShader}`
        .replace('#include <map_fragment>',
          `#ifdef USE_MAP
             vec2 fuFieldUv = vGroundPos.xz / uField;
             vec3 fuMacro = texture2D(uMacro, fuFieldUv).rgb;
             vec2 fuDet = texture2D(uDetail, fuFieldUv).rg;
             float fuK = smoothstep(${G.bombEdge[0]}, ${G.bombEdge[1]}, fuDet.g);
             vec4 fuA = texture2D(map, vMapUv);
             vec4 fuB = texture2D(map, vMapUv * ${G.bombScale} + vec2(${G.bombOffset[0]}, ${G.bombOffset[1]}));
             diffuseColor *= mix(fuA, fuB, fuK);
             diffuseColor.rgb *= fuGroundLight(fuMacro, fuDet.r);
             ${water ? `
             // ---- THE SURFACE ------------------------------------------
             // The bed's own slope is deliberately NOT used here: a river
             // surface is level whatever the ground under it is doing, and
             // shading it by the bed would put a hillside in the water.
             vec3 fuWn = fuWaterNormal(vGroundPos.xz);
             // THE SHORE, from the corner lattice. 1 where all four cells
             // touching a corner are water, 0.25 where only this one is - so
             // this ramps across the last half cell before the bank, which is
             // about six metres, and that is the band a shoreline lives in.
             float fuDeep = smoothstep(0.42, 0.95, vShore);
             // Shallows are paler, warmer and much less reflective, because
             // near the bank you are looking at the bottom rather than at the
             // sky. It is the single strongest cue that water has an EDGE
             // rather than a boundary.
             diffuseColor.rgb = mix(diffuseColor.rgb * vec3(1.34, 1.27, 1.10),
                                    diffuseColor.rgb, fuDeep);
             // THE SKY, WHICH IS MOST OF WHAT WATER LOOKS LIKE, and the one
             // number here that is knowingly not physics. Schlick at this
             // camera angle - the eye is 42 degrees above the surface - puts
             // the real reflectance at about 2.4%, so a physically weighted
             // mix would leave the river exactly the colour of the painted
             // tile, which is 0x003f55 and reads as a hole in the map. What
             // the eye actually accepts as water is the SKY, so a third of it
             // goes in flat and the Fresnel term only modulates that.
             float fuFres = pow(1.0 - clamp(dot(fuWn, uView), 0.0, 1.0), 4.0);
             // ...AND CAPPED SO WATER STAYS THE DARKEST THING ON THE MAP.
             // Lane M holds every land material at least 6 luma above clean
             // water in the recipe, because water reading as the LOW point is
             // most of why it reads as water. This term and the glitter below
             // sit on top of that, so they are deliberately short of what
             // would look best in isolation.
             diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.17, 0.26, 0.37),
                                    (0.10 + 0.30 * fuFres) * fuDeep);
             // The waves get the sun as well, so the surface has relief rather
             // than being a flat sheet with sparks on it.
             diffuseColor.rgb *= mix(vec3(1.0), fuSunLight(fuWn), 0.42 * fuDeep);
             // THE GLITTER, IN TWO LOBES. A broad one is the sheen of the sun's
             // path across the whole reach; a very tight one is the individual
             // sparks that are actually what says MOVING water at this size on
             // screen. One lobe alone gives either an even plastic gloss or a
             // scatter of white dots on something dead.
             float fuNh = max(dot(fuWn, uHalf), 0.0);
             diffuseColor.rgb += vec3(1.00, 0.94, 0.80)
               * (pow(fuNh, 16.0) * 0.06 + pow(fuNh, 130.0) * 2.0) * fuDeep;
             // ...and the foam at the bank, which travels along it rather than
             // sitting still. Without this the edge is a colour change and the
             // eye reads it as a texture seam rather than as a shoreline.
             float fuBand = 1.0 - smoothstep(0.30, 0.72, vShore);
             float fuLap = 0.5 + 0.5 * sin(dot(vGroundPos.xz, vec2(0.42, 0.31))
                                           - uTime * 1.9);
             diffuseColor.rgb += vec3(0.60, 0.64, 0.60) * fuBand
                                 * (0.38 + 0.62 * fuLap) * 0.36;
             ` : `
             // THE SLOPE, WHICH IS THE POINT OF ALL OF THIS.
             diffuseColor.rgb *= fuSunLight(fuBend(vNrm, fuFieldUv, fuMacro));
             `}
             // ...and the weather over all of it, land and water alike. Last,
             // so it multiplies the finished surface rather than arguing with
             // one term of it.
             diffuseColor.rgb *= fuClouds(vGroundPos.xz);
           #endif`
          
          
          
          + `${fade ? '\n  diffuseColor.a *= vFade * vFade * 0.92;' : ''}`);
    };
    return mat;
  }

  
  const isWaterId = (id) => id === 'waterClean' || id === 'waterFouled';

  
  let warnedOutlines = false;

  
  const terrainMeshes = Object.create(null);
  for (const id of neededTerrain) {
    const wet = isWaterId(id);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position',
      new THREE.BufferAttribute(new Float32Array(CELLS * CELLS * 6 * 3), 3));
    geo.setAttribute('uv',
      new THREE.BufferAttribute(new Float32Array(CELLS * CELLS * 6 * 2), 2));
    
    
    
    geo.setAttribute('aNrm',
      new THREE.BufferAttribute(new Float32Array(CELLS * CELLS * 6 * 3), 3));
    
    if (wet) {
      geo.setAttribute('aShore',
        new THREE.BufferAttribute(new Float32Array(CELLS * CELLS * 6), 1));
    }
    const mesh = new THREE.Mesh(geo, groundMaterial(terrainTex[id], false, wet));
    mesh.frustumCulled = false;
    scene.add(mesh);

    
    
    
    
    
    
    
    
    
    
    
    
    
    const blendGeo = new THREE.BufferGeometry();
    blendGeo.setAttribute('position',
      new THREE.BufferAttribute(new Float32Array(CELLS * CELLS * 6 * 3), 3));
    blendGeo.setAttribute('uv',
      new THREE.BufferAttribute(new Float32Array(CELLS * CELLS * 6 * 2), 2));
    blendGeo.setAttribute('aFade',
      new THREE.BufferAttribute(new Float32Array(CELLS * CELLS * 6), 1));
    blendGeo.setAttribute('aNrm',
      new THREE.BufferAttribute(new Float32Array(CELLS * CELLS * 6 * 3), 3));
    if (wet) {
      blendGeo.setAttribute('aShore',
        new THREE.BufferAttribute(new Float32Array(CELLS * CELLS * 6), 1));
    }
    const blendMesh = new THREE.Mesh(blendGeo, groundMaterial(terrainTex[id], true, wet));
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
    
    
    
    
    
    
    const c = [[x0, z0, a[0], a[1], y00, cx, cy], [x0, z1, b[0], b[1], y01, cx, cy + 1],
      [x1, z1, cc[0], cc[1], y11, cx + 1, cy + 1], [x1, z0, d[0], d[1], y10, cx + 1, cy]];
    const tri = [0, 1, 2, 0, 2, 3];
    const pos = geo.getAttribute('position').array;
    const uvs = geo.getAttribute('uv').array;
    const fadeAttr = fades ? geo.getAttribute('aFade').array : null;
    const nrmAttr = geo.getAttribute('aNrm').array;
    const shoreAttr = geo.getAttribute('aShore');
    for (let k = 0; k < 6; k += 1) {
      const w = offset + k;
      const v = c[tri[k]];
      pos[w * 3] = v[0];
      pos[w * 3 + 1] = v[4];
      pos[w * 3 + 2] = v[1];
      uvs[w * 2] = v[2];
      uvs[w * 2 + 1] = v[3];
      const lat = (v[6] * (CELLS + 1) + v[5]) * 3;
      nrmAttr[w * 3] = cornerNrm[lat];
      nrmAttr[w * 3 + 1] = cornerNrm[lat + 1];
      nrmAttr[w * 3 + 2] = cornerNrm[lat + 2];
      if (shoreAttr) shoreAttr.array[w] = shoreAt(v[5], v[6]);
      if (fadeAttr) fadeAttr[w] = fades[tri[k]];
    }
  }

  














  const waterCell = new Uint8Array(CELLS * CELLS);
  function shoreAt(ix, iy) {
    let n = 0;
    for (let dy = -1; dy <= 0; dy += 1) {
      for (let dx = -1; dx <= 0; dx += 1) {
        const cx = ix + dx;
        const cy = iy + dy;
        if (cx < 0 || cy < 0 || cx >= CELLS || cy >= CELLS) continue;
        n += waterCell[cy * CELLS + cx];
      }
    }
    return n / 4;
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

    
    
    
    
    
    
    
    
    
    for (let i = 0; i < CELLS * CELLS; i += 1) {
      waterCell[i] = m.w.sectors[secOf[i]].kind === 'water' ? 1 : 0;
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
      
      
      
      
      t.geo.getAttribute('aNrm').needsUpdate = true;
      if (t.geo.getAttribute('aShore')) t.geo.getAttribute('aShore').needsUpdate = true;
      t.mesh.visible = counts[id] > 0;
      t.blendGeo.setDrawRange(0, blendCounts[id]);
      t.blendGeo.getAttribute('position').needsUpdate = true;
      t.blendGeo.getAttribute('uv').needsUpdate = true;
      t.blendGeo.getAttribute('aFade').needsUpdate = true;
      t.blendGeo.getAttribute('aNrm').needsUpdate = true;
      if (t.blendGeo.getAttribute('aShore')) t.blendGeo.getAttribute('aShore').needsUpdate = true;
      t.blendMesh.visible = blendCounts[id] > 0;
    }
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const groundGeo = new THREE.PlaneGeometry(FIELD, FIELD, CELLS_PER_SIDE, CELLS_PER_SIDE);
  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshBasicMaterial({ map: groundTex, transparent: true, fog: false }),
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
    
    
    
    
    buildNormals(map);
    
    
    groundGeo.computeBoundingSphere();
  }
  liftOverlay(match.w.map);

  
















  let currentMap = match.w.map;
  
  
  
  
  
  ground.renderOrder = 2;
  scene.add(ground);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const WASH_PX = 512;
  const washCanvas = document.createElement('canvas');
  washCanvas.width = WASH_PX;
  washCanvas.height = WASH_PX;
  const wctx = washCanvas.getContext('2d');
  const washTex = new THREE.CanvasTexture(washCanvas);
  washTex.colorSpace = THREE.SRGBColorSpace;
  washTex.generateMipmaps = false;
  washTex.minFilter = THREE.LinearFilter;
  washTex.magFilter = THREE.LinearFilter;
  const wash = new THREE.Mesh(
    groundGeo,
    new THREE.MeshBasicMaterial({ map: washTex, transparent: true, fog: false, depthWrite: false }),
  );
  wash.rotation.x = -Math.PI / 2;
  wash.position.set(FIELD / 2, 0.45, FIELD / 2);
  wash.renderOrder = 2;
  scene.add(wash);

  function paintWash(m, seat) {
    const map = m.w.map;
    wctx.clearRect(0, 0, WASH_PX, WASH_PX);
    const vis = m.presence.visible;
    const sc = m.w.sectors.length;
    wctx.save();
    wctx.scale(WASH_PX / GROUND_PX, WASH_PX / GROUND_PX);
    for (let sIdx = 0; sIdx < sc; sIdx += 1) {
      const sec = m.w.sectors[sIdx];
      const st = captureState(sec);
      if (st.phase === 'idle') continue;
      
      
      if (!revealAll && !vis[seat * sc + sIdx]) continue;
      if (!sectorPath(wctx, map, sIdx)) continue;

      
      
      
      
      
      
      const alpha = WASH_ALPHA * (st.pct / 100);
      if (st.phase === 'claiming') {
        
        
        
        
        wctx.fillStyle = washStyle(st.actor, seat, m.factions, alpha, m.teams || null);
      } else {
        
        
        
        
        
        
        wctx.fillStyle = `rgba(255,214,92,${alpha})`;
      }
      wctx.fill();

      
      
      
      wctx.save();
      wctx.globalAlpha = 0.35 + 0.4 * (st.pct / 100);
      wctx.strokeStyle = st.phase === 'claiming'
        ? groundColour(st.actor, seat, m.factions, m.teams || null).edge
        : '#ffd65c';
      wctx.lineWidth = 7;
      wctx.setLineDash([26, 18]);
      wctx.stroke();
      wctx.restore();
    }
    wctx.restore();
    washTex.needsUpdate = true;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const surroundTex = buildSurroundTexture(THREE);
  const surround = new THREE.Mesh(
    new THREE.PlaneGeometry(FIELD * 5, FIELD * 5),
    
    
    
    
    
    new THREE.MeshBasicMaterial({ map: surroundTex, color: new THREE.Color('#c3ccae') }),
  );
  surround.rotation.x = -Math.PI / 2;
  surround.position.set(FIELD / 2, -2, FIELD / 2);
  scene.add(surround);

  
  let groundKey = '';
  
  let washKey = '';

  















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

  
  
  
  
  
  
  
  
  
  
  
  const WASH_ALPHA = OWNED_WASH_ALPHA;

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
        if (!sectorPath(gctx, map, sIdx)) continue;
        
        
        
        
        const rel = relationOf(sec.owner, seat, m.teams || null);
        gctx.fillStyle = washStyle(sec.owner, seat, m.factions, washAlphaFor(rel), m.teams || null);
        gctx.fill();
      }
    } else {
      for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
        const y0 = cellEdge(cy);
        const y1 = cellEdge(cy + 1);
        for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
          const sIdx = map.sectorOfCell[cy * CELLS_PER_SIDE + cx];
          const sec = m.w.sectors[sIdx];
          const x0 = cellEdge(cx);
          const rel = relationOf(sec.owner, seat, m.teams || null);
          gctx.fillStyle = washStyle(sec.owner, seat, m.factions, washAlphaFor(rel), m.teams || null);
          gctx.fillRect(x0, y0, cellEdge(cx + 1) - x0, y1 - y0);
        }
      }
    }

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    {
      const cpx = GROUND_PX / CELLS_PER_SIDE;
      const tierAt = (cx, cy) => {
        if (cx < 0 || cy < 0 || cx >= CELLS_PER_SIDE || cy >= CELLS_PER_SIDE) return -1;
        return tierOfDm(map.heightOfCell[cy * CELLS_PER_SIDE + cx]);
      };
      for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
        for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
          const t = tierAt(cx, cy);
          if (t <= 0) continue;
          
          
          gctx.fillStyle = t === 1 ? 'rgba(255,250,232,0.055)' : 'rgba(255,250,232,0.10)';
          gctx.fillRect(cx * cpx, cy * cpx, cpx + 0.5, cpx + 0.5);
        }
      }
      gctx.fillStyle = 'rgba(38,30,18,0.34)';
      const cw = Math.max(1.5, cpx * 0.22);
      for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
        for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
          const t = tierAt(cx, cy);
          if (tierAt(cx + 1, cy) > t) gctx.fillRect((cx + 1) * cpx - cw / 2, cy * cpx, cw, cpx + 0.5);
          if (tierAt(cx, cy + 1) > t) gctx.fillRect(cx * cpx, (cy + 1) * cpx - cw / 2, cpx + 0.5, cw);
        }
      }
    }

    
    
    
    
    
    

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const GROOVE_WIDE = 'rgba(20,24,16,0.20)';
    const GROOVE_NARROW = 'rgba(20,24,16,0.42)';
    const OWNER_DASH = [18, 12];
    const OWNER_DASH_ALPHA = 0.55;
    if (hasOutlines) {
      gctx.lineJoin = 'round';
      gctx.lineCap = 'round';
      for (let sIdx = 0; sIdx < m.w.sectors.length; sIdx += 1) {
        if (!sectorPath(gctx, map, sIdx)) continue;
        gctx.setLineDash([]);
        gctx.strokeStyle = GROOVE_WIDE;
        gctx.lineWidth = 11;
        gctx.stroke();
        gctx.strokeStyle = GROOVE_NARROW;
        gctx.lineWidth = 4;
        gctx.stroke();
        const sec = m.w.sectors[sIdx];
        
        
        
        
        
        gctx.globalAlpha = OWNER_DASH_ALPHA;
        gctx.strokeStyle = edgeFor(m, sec, seat);
        gctx.lineWidth = 2.5;
        gctx.setLineDash(OWNER_DASH);
        gctx.stroke();
        gctx.setLineDash([]);
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
          gctx.fillStyle = edgeFor(m, sec, seat);
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
        if (revealAll || vis[seat * sc + sIdx]) continue;
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

  function edgeFor(m, sec, seat) {
    return groundColour(sec.owner, seat, m.factions, m.teams || null).edge;
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
  
  function propHash(x, y) {
    let n = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }

  






















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
      
      
      
      
      
      
      
      const h = propHash(p.x, p.y);
      const size = row.worldSize * (p.scale / 1000) * (0.88 + h * 0.24);
      
      
      
      
      const py = groundY(m.w.map, p.x, p.y);
      propDummy.position.set(
        p.x / MM,
        py + size * (0.5 - (row.footY || 0)),
        p.y / MM,
      );
      propDummy.rotation.set(0, yaw, 0);
      propDummy.scale.set(size, size, size);
      propDummy.updateMatrix();
      propMesh.setMatrixAt(n, propDummy.matrix);
      propTileAttr.setXY(n, columnFor(p, yawSteps, PROP_COLS), row.row);
      
      
      
      
      
      writeCast(castProps, n, p.x / MM, py, p.y / MM,
        size * (1 - (row.footY || 0)) * 0.86, size * 0.46);
      
      
      
      
      
      
      
      const fogged = p.sector < 0 ? 0.82 : ((revealAll || vis[seat * sc + p.sector]) ? 1 : 0.30);
      
      
      
      
      
      
      
      
      
      
      const lit = fogged * (1 + (slopeLightAt(m.w.map, p.x, p.y) - 1) * 0.66);
      
      
      
      const h2 = propHash(p.y, p.x);
      const value = 0.93 + h2 * 0.14;
      const lean = (propHash(p.x + 7, p.y + 3) - 0.5) * 0.10;
      propColour.setRGB(lit * value * (1 + lean), lit * value, lit * value * (1 - lean));
      propMesh.setColorAt(n, propColour);
      n += 1;
    }
    propMesh.count = n;
    castProps.count = n;
    propMesh.instanceMatrix.needsUpdate = true;
    castProps.instanceMatrix.needsUpdate = true;
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

  
  
  
  
  const anim = { herd: null, yield: null };
  try {
    const loaded = await loadAnimAtlases();
    for (const f of ['herd', 'yield']) {
      const sh = loaded[f];
      if (!sh) continue;
      if (sh.manifest.facings !== ATLAS_COLS) throw new Error(`anim-${f} has ${sh.manifest.facings} facings but units has ${ATLAS_COLS}`);
      if (!sh.manifest.kinds || !sh.manifest.kinds.walk) throw new Error(`anim-${f}.json names no kinds`);
      anim[f] = sh;
    }
    if (!anim.herd && !anim.yield) throw new Error('neither sheet loaded');
  } catch (e) {
    console.warn(`Farmy Uprising: no animation frames (${e.message})`
      + ' - units will walk on their standing pose');
  }
  const ANIM_COLS = { herd: anim.herd ? animColumns(anim.herd.manifest) : 1, yield: anim.yield ? animColumns(anim.yield.manifest) : 1 };
  const ANIM_ROWS = { herd: anim.herd ? Math.max(1, animRowCount(anim.herd.manifest)) : 1, yield: anim.yield ? Math.max(1, animRowCount(anim.yield.manifest)) : 1 };

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
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
  
  
  const animTexOf = (sh) => {
    if (!sh) return null;
    const t = new THREE.Texture(sh.image);
    t.needsUpdate = true;
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.magFilter = THREE.LinearFilter;
    return t;
  };
  const animTex = { herd: animTexOf(anim.herd), yield: animTexOf(anim.yield) };

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
    
    shader.uniforms.mapAnimHerd = { value: animTex.herd || atlas };
    shader.uniforms.mapAnimYield = { value: animTex.yield || atlas };
    shader.vertexShader = `attribute vec3 aTile;\nvarying vec3 vTile;\n${shader.vertexShader}`
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n  vTile = aTile;');
    
    
    
    
    
    
    
    
    
    
    shader.fragmentShader = `varying vec3 vTile;\nuniform sampler2D mapIdle;\nuniform sampler2D mapAnimHerd;\nuniform sampler2D mapAnimYield;\n${shader.fragmentShader}`
      .replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
           vec4 sampledDiffuseColor;
           if ( vTile.z > 2.5 ) {
             vec2 animUv = vec2(
               (vMapUv.x + vTile.x) / ${ANIM_COLS.yield}.0,
               1.0 - ((1.0 - vMapUv.y) + vTile.y) / ${ANIM_ROWS.yield}.0
             );
             sampledDiffuseColor = texture2D( mapAnimYield, animUv );
           } else if ( vTile.z > 1.5 ) {
             vec2 animUv = vec2(
               (vMapUv.x + vTile.x) / ${ANIM_COLS.herd}.0,
               1.0 - ((1.0 - vMapUv.y) + vTile.y) / ${ANIM_ROWS.herd}.0
             );
             sampledDiffuseColor = texture2D( mapAnimHerd, animUv );
           } else if ( vTile.z > 0.5 ) {
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
    new THREE.MeshBasicMaterial({
      map: shadowTex, transparent: true, depthWrite: false, fog: false,
    }),
    MAX_INSTANCES,
  );
  shadows.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  shadows.count = 0;
  shadows.frustumCulled = false;
  shadows.renderOrder = 3;
  scene.add(shadows);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const castTex = (() => {
    const S = 128;
    const c = document.createElement('canvas');
    c.width = S; c.height = S;
    const x = c.getContext('2d');
    const img = x.createImageData(S, S);
    for (let py = 0; py < S; py += 1) {
      
      
      
      
      
      
      const v = 1 - (py + 0.5) / S;
      for (let px = 0; px < S; px += 1) {
        const u = (px + 0.5) / S - 0.5;
        
        
        const halfW = 0.36 * (1 - 0.42 * v);
        const d = Math.hypot(u / halfW, (v - 0.03) / 0.90);
        let a = 1 - d;
        if (a <= 0) continue;
        
        a = a * a * (3 - 2 * a);
        
        
        a *= 1 - 0.52 * v;
        const o = (py * S + px) * 4;
        
        
        
        
        img.data[o] = 28;
        img.data[o + 1] = 38;
        img.data[o + 2] = 42;
        img.data[o + 3] = Math.round(a * 0.58 * 255);
      }
    }
    x.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  })();

  








  function castSheet(count) {
    const m = new THREE.InstancedMesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({
        map: castTex, transparent: true, depthWrite: false, fog: false,
      }),
      count,
    );
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.count = 0;
    m.frustumCulled = false;
    m.renderOrder = 2.8;
    scene.add(m);
    return m;
  }

  








  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const SHADOW_STRETCH = 1.6;
  const castDummy = new THREE.Object3D();
  function writeCast(sheet, n, x, y, z, height, width) {
    const len = height * SUN.reach * SHADOW_STRETCH;
    castDummy.position.set(
      x + SUN.cast[0] * len * 0.5,
      y + 0.55,
      z + SUN.cast[1] * len * 0.5,
    );
    castDummy.rotation.set(-Math.PI / 2, 0, SUN.castAngle);
    castDummy.scale.set(width, len + width * 0.85, 1);
    castDummy.updateMatrix();
    sheet.setMatrixAt(n, castDummy.matrix);
  }

  const castUnits = castSheet(MAX_INSTANCES);
  const castProps = castSheet(MAX_PROP_INSTANCES);
  const castBuildings = castSheet(256);

  
  
  
  
  
  
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
    new THREE.MeshBasicMaterial({
      map: ringTex, transparent: true, depthWrite: false, fog: false,
    }),
    512,
  );
  rings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  rings.count = 0;
  rings.frustumCulled = false;
  rings.renderOrder = 3;
  scene.add(rings);

  
  let selected = new Set();

  
  
  
  
  
  
  
  
  
  const barMat = () => new THREE.MeshBasicMaterial({
    transparent: true, depthWrite: false, fog: false,
  });
  const hpBack = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), barMat(), MAX_INSTANCES);
  const hpFill = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), barMat(), MAX_INSTANCES);
  for (const m of [hpBack, hpFill]) {
    m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    m.count = 0;
    m.frustumCulled = false;
    m.renderOrder = 5;
    scene.add(m);
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const RETREAT_TILE = 16;
  const COUNT_TILES = 17;
  const countTex = (() => {
    const c = document.createElement('canvas');
    const S = 64;
    c.width = S * COUNT_TILES; c.height = S;
    const x = c.getContext('2d');
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    for (let i = 0; i < COUNT_TILES; i += 1) {
      const cx = i * S + S / 2;
      const retreat = i === RETREAT_TILE;
      
      
      
      x.fillStyle = retreat ? 'rgba(120,74,10,0.90)' : 'rgba(10,14,10,0.74)';
      x.beginPath();
      x.roundRect(i * S + S * 0.10, S * 0.22, S * 0.80, S * 0.56, S * 0.16);
      x.fill();
      if (retreat) {
        
        
        
        x.strokeStyle = '#ffd65c';
        x.lineWidth = S * 0.075;
        x.lineCap = 'round';
        x.lineJoin = 'round';
        x.beginPath();
        x.moveTo(cx - S * 0.20, S * 0.50);
        x.lineTo(cx, S * 0.32);
        x.lineTo(cx + S * 0.20, S * 0.50);
        x.stroke();
        x.beginPath();
        x.moveTo(cx - S * 0.13, S * 0.50);
        x.lineTo(cx - S * 0.13, S * 0.68);
        x.lineTo(cx + S * 0.13, S * 0.68);
        x.lineTo(cx + S * 0.13, S * 0.50);
        x.stroke();
        continue;
      }
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
    map: countTex, transparent: true, depthWrite: false, fog: false,
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
    new THREE.MeshBasicMaterial({
      map: shadowTex, transparent: true, depthWrite: false, fog: false,
    }),
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
    
    
    
    
    
    
    
    
    const halo = x.createRadialGradient(S / 2, S / 2, S * 0.05, S / 2, S / 2, S * 0.48);
    halo.addColorStop(0, 'rgba(255,255,255,0.55)');
    halo.addColorStop(0.55, 'rgba(255,255,255,0.18)');
    halo.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = halo;
    x.fillRect(0, 0, S, S);
    x.fillStyle = 'rgba(255,255,255,0.95)';
    x.beginPath();
    for (let k = 0; k < 8; k += 1) {
      const a = (k * Math.PI) / 4;
      const r = (k % 2 === 0 ? 0.48 : 0.24) * S;
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
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, depthWrite: false, fog: false,
    });
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
      
      
      
      
      
      
      
      const grow = fleck.kind[i] === FLECK.SPARK ? 1 - age * 0.25 : 1 + age * 0.55;
      dummy.position.set(
        fleck.x[i], fleck.y[i] + fleck.rise[i] * age, fleck.z[i],
      );
      dummy.rotation.set(0, yaw, fleck.spin[i] * age);
      dummy.scale.set(fleck.size[i] * grow, fleck.size[i] * grow, 1);
      dummy.updateMatrix();
      flecks.setMatrixAt(n, dummy.matrix);
      fleckCol.setX(n, fleck.kind[i]);
      fleckAlpha.setX(n, fleck.kind[i] === FLECK.SPARK ? (1 - age) : (1 - age) * (1 - age));
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

  














  








  
  const spread = createVisualSpread();
  let lastSpreadSec = 0;

  let factionColours = {};
  let seatColours = playerColours(match.factions, factionColours);
  function setFactionColours(custom) {
    factionColours = custom ? { ...custom } : {};
    seatColours = playerColours(match.factions, factionColours);
    return seatColours.slice();
  }

  
  function lighten(hex, t) {
    const n = hexInt(hex);
    const r = Math.round(((n >> 16) & 255) + (255 - ((n >> 16) & 255)) * t);
    const g = Math.round(((n >> 8) & 255) + (255 - ((n >> 8) & 255)) * t);
    const b = Math.round((n & 255) + (255 - (n & 255)) * t);
    return (r << 16) | (g << 8) | b;
  }

  function teamTint(m, owner, seat) {
    
    
    
    
    
    
    const hex = seatColours[owner] || '#ffffff';
    return lighten(hex, owner === seat ? 0.80 : 0.66);
  }

  






  function teamMark(m, owner, seat) {
    
    
    
    
    return hexInt(seatColours[owner] || '#ffffff');
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

  
  
  
  
  
  
  
  
  
  const lastId = new Int32Array(MAX_UNITS).fill(-1);
  const lastX = new Float32Array(MAX_UNITS);
  const lastZ = new Float32Array(MAX_UNITS);
  const lastY = new Float32Array(MAX_UNITS);
  const lastFace = new Uint8Array(MAX_UNITS);
  const lastS = new Float32Array(MAX_UNITS);
  const lastFoot = new Float32Array(MAX_UNITS);
  const lastSector = new Int32Array(MAX_UNITS);
  const lastOwner = new Int8Array(MAX_UNITS);
  const lastSpec = new Array(MAX_UNITS).fill(null);
  
  const lastAnim = new Int16Array(MAX_UNITS).fill(-1);
  const MAX_GHOSTS = 48;
  const ghost = {
    n: 0, head: 0,
    x: new Float32Array(MAX_GHOSTS), z: new Float32Array(MAX_GHOSTS), y: new Float32Array(MAX_GHOSTS),
    face: new Uint8Array(MAX_GHOSTS), s: new Float32Array(MAX_GHOSTS), foot: new Float32Array(MAX_GHOSTS),
    sector: new Int32Array(MAX_GHOSTS), owner: new Int8Array(MAX_GHOSTS), tick0: new Int32Array(MAX_GHOSTS),
    spec: new Array(MAX_GHOSTS).fill(null), live: new Uint8Array(MAX_GHOSTS),
  };
  function addGhost(i, tick) {
    const g = ghost.head;
    ghost.head = (ghost.head + 1) % MAX_GHOSTS;
    ghost.x[g] = lastX[i]; ghost.z[g] = lastZ[i]; ghost.y[g] = lastY[i];
    ghost.face[g] = lastFace[i]; ghost.s[g] = lastS[i]; ghost.foot[g] = lastFoot[i];
    ghost.sector[g] = lastSector[i]; ghost.owner[g] = lastOwner[i]; ghost.tick0[g] = tick;
    ghost.spec[g] = lastSpec[i]; ghost.live[g] = 1;
  }
  function clearGhosts() {
    lastId.fill(-1);
    lastAnim.fill(-1);
    ghost.live.fill(0);
    ghost.head = 0;
  }

  








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
      const seen = revealAll || (from >= 0 && vis[seat * sc + from])
        || (at >= 0 && vis[seat * sc + at]);
      if (!seen) continue;
      budget -= 1;
      
      
      
      
      
      
      flinchAt(w, evt.owner, evt.tx, evt.ty);

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
      
      
      
      
      
      
      
      
      const S = 44 * look.size;
      
      
      
      
      
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
            muzzleY, S * 0.80, 0.24, look.flash,
          );
        }
        
        
        
        for (let q = 1; q <= 3; q += 1) {
          const f = q / 4;
          addFleck(
            FLECK.SPARK, x0 + dx * f, z0 + dz * f,
            muzzleY + (impactY - muzzleY) * f, S * 0.34, 0.16 + q * 0.03, look.trail,
          );
        }
      } else {
        
        
        
        
        
        addFleck(FLECK.PUFF, x1, z1, y1g + S * 0.20, S * 0.70, 0.45, 0xbaa98a, S * 0.30);
      }

      
      
      addFleck(
        FLECK.SPARK, x1, z1, y1g + S * 0.52,
        S * (evt.projectile ? 0.64 : 0.92), 0.32, look.flash,
      );
      
      
      
      
      for (let k = 0; k < 3; k += 1) {
        const a = (k / 3) * Math.PI * 2 + (evt.x % 7) * 0.4;
        addFleck(
          FLECK.CRUMB, x1 + Math.cos(a) * S * 0.30, z1 + Math.sin(a) * S * 0.30,
          y1g + S * 0.45, S * 0.28, 0.40 + k * 0.05, look.trail, S * 0.9, (k - 1) * 3,
        );
      }

      
      
      
      
      
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

    
    
    
    
    
    
    const bodies = [];
    for (let i = 0; i < w.u.count; i += 1) {
      if (!w.u.alive[i]) continue;
      const sp = unitSpec(w, i);
      if (!sp) continue;
      const s = w.u.sector[i];
      if (s >= 0 && !revealAll && !vis[seat * sc + s]) continue;
      const xm = interp ? interp.posX(w, i, alphaNow) : w.u.x[i];
      const ym = interp ? interp.posY(w, i, alphaNow) : w.u.y[i];
      bodies.push({
        id: w.u.id[i], x: xm / MM, y: ym / MM, r: unitScale(sp.id, manifest) * 0.5,
      });
    }
    spread.step(bodies, Math.max(0, Math.min(0.1, tSec - lastSpreadSec)));
    lastSpreadSec = tSec;

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
      if (!revealAll && sec >= 0 && !vis[seat * sc + sec]) continue;

      const spec = unitSpec(w, i);
      const s = unitScale(spec.id, manifest);
      
      
      
      
      
      const face = facing8(w.u.facing[i] + Math.round((view.yawSteps * BRADS) / 4));
      const row = rowOf(manifest, spec.id);
      const mark = teamMark(m, w.u.owner[i], seat);
      const isSel = selected.has(i);
      
      
      
      
      
      
      
      const xMm = interp ? interp.posX(w, i, alphaNow) : w.u.x[i];
      const yMm = interp ? interp.posY(w, i, alphaNow) : w.u.y[i];
      
      
      
      
      
      
      
      
      const nudge = spread.offsetOf(w.u.id[i]);
      const ux = xMm / MM + nudge[0];
      const uz = yMm / MM + nudge[1];
      
      
      
      
      
      const uy = groundY(w.map, xMm, yMm);
      
      
      
      
      
      const uLit = 1 + (slopeLightAt(w.map, xMm, yMm) - 1) * 0.5;

      
      
      
      
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
      
      
      
      
      
      
      const af = animFrame({
        moving, cooldown: w.u.cooldown[i], attackTicks: spec.attackTicks || 0, tick: w.tick, phase: ph,
      });
      const animKey = spec.faction === HERD ? 'herd' : 'yield';
      const animMan = af && anim[animKey] ? anim[animKey].manifest : null;
      const at = animMan ? animTile(animMan, spec.id, face, af) : null;
      const animOk = !!(at && at.row >= 0);
      lastAnim[i] = animOk ? (af.kind === 'walk' ? 0 : (af.kind === 'attack' ? 10 : 20)) + af.frame : -1;
      
      
      
      
      
      
      
      
      
      
      const foot = unitFoot[row * ATLAS_COLS + face];
      
      lastId[i] = w.u.id[i];
      lastX[i] = ux; lastZ[i] = uz; lastY[i] = uy;
      lastFace[i] = face; lastS[i] = s; lastFoot[i] = foot;
      lastSector[i] = sec; lastOwner[i] = w.u.owner[i]; lastSpec[i] = spec;

      
      
      
      
      
      
      
      
      
      
      
      
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
        
        
        
        
        
        const ackLeft = ackUntil[i] - clockSec * 1000;
        if (ackLeft > 0) {
          const p = Math.sin((1 - ackLeft / ACK_MS) * Math.PI);
          tilt += p * 0.24 * ackDir[i];
          sy *= 1 - p * 0.08;
          sx *= 1 + p * 0.05;
        }
        
        
        
        
        const hitLeft = hitUntil[i] - clockSec * 1000;
        if (hitLeft > 0) {
          const p = hitLeft / HIT_MS;
          tilt += p * 0.20 * ((k & 1) ? 1 : -1);
          sy *= 1 - p * 0.14;
          sx *= 1 + p * 0.10;
        }

        
        
        
        
        
        
        
        
        
        
        
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
        
        
        
        
        if (animOk) {
          tileCol = at.col;
          tileRow = at.row;
          tileSheet = animKey === 'herd' ? 2 : 3;
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

        
        
        
        
        
        
        
        
        
        writeCast(castUnits, n, px0, uy, pz0 + s * 0.10,
          (s * 0.72 + alt) * shrink, s * 0.60 * shrink);

        
        
        
        tileAttr.setXYZ(n, tileCol, tileRow, tileSheet);
        if (k === 0) firstBody[i] = n;
        
        
        
        
        
        
        
        
        
        
        
        colour.setHex(teamTint(m, w.u.owner[i], seat)).multiplyScalar(uLit);
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

      
      
      
      
      
      
      
      
      
      
      if (cn < MAX_INSTANCES
          && m.automation[w.u.owner[i]]
          && m.automation[w.u.owner[i]].autoRetreat
          && shouldRetreat(w, i, spec)) {
        const size = Math.max(13, s * 0.34);
        dummy.rotation.set(0, yaw, 0);
        
        
        dummy.position.set(ux, uy + s * (1.24 + 0.9 * reach) - s * foot, uz);
        dummy.scale.set(size, size, 1);
        dummy.updateMatrix();
        counts.setMatrixAt(cn, dummy.matrix);
        countAttr.setX(cn, RETREAT_TILE);
        cn += 1;
      }
    }
    
    
    
    
    
    for (let i = 0; i < MAX_UNITS; i += 1) {
      if (lastId[i] < 0) continue;
      if (w.u.alive[i] && w.u.id[i] === lastId[i]) continue;
      if (lastSector[i] < 0 || revealAll || vis[seat * sc + lastSector[i]]) addGhost(i, w.tick);
      lastId[i] = -1;
    }
    for (let g = 0; g < MAX_GHOSTS && n < MAX_INSTANCES; g += 1) {
      if (!ghost.live[g]) continue;
      const gf = animFrame({ moving: false, cooldown: 0, attackTicks: 0, tick: w.tick, phase: 0, dyingSince: ghost.tick0[g] });
      if (!gf) { ghost.live[g] = 0; continue; }
      const gspec = ghost.spec[g];
      const gkey = gspec.faction === HERD ? 'herd' : 'yield';
      const gman = anim[gkey] ? anim[gkey].manifest : null;
      const gt = gman ? animTile(gman, gspec.id, ghost.face[g], gf) : null;
      if (!gt || gt.row < 0) { ghost.live[g] = 0; continue; }
      const gs = ghost.s[g];
      dummy.position.set(ghost.x[g], ghost.y[g] + gs * (0.5 - ghost.foot[g]), ghost.z[g]);
      dummy.rotation.set(0, yaw, 0);
      dummy.scale.set(gs, gs, gs);
      dummy.updateMatrix();
      units.setMatrixAt(n, dummy.matrix);
      tileAttr.setXYZ(n, gt.col, gt.row, gkey === 'herd' ? 2 : 3);
      colour.setHex(teamTint(m, ghost.owner[g], seat)).multiplyScalar(0.85);
      units.setColorAt(n, colour);
      
      dummy.position.set(ghost.x[g], ghost.y[g] + 0.6, ghost.z[g] + gs * 0.10);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(gs * 0.82, gs * 0.52, 1);
      dummy.updateMatrix();
      shadows.setMatrixAt(n, dummy.matrix);
      colour.setHex(teamMark(m, ghost.owner[g], seat));
      shadows.setColorAt(n, colour);
      writeCast(castUnits, n, ghost.x[g], ghost.y[g], ghost.z[g] + gs * 0.10, gs * 0.72 * (1 - gf.frame * 0.3), gs * 0.60);
      n += 1;
    }

    units.count = n;
    shadows.count = n;
    castUnits.count = n;
    rings.count = rn;
    hpBack.count = bn;
    hpFill.count = bn;
    counts.count = cn;
    shadows.instanceMatrix.needsUpdate = true;
    castUnits.instanceMatrix.needsUpdate = true;
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
      if (!revealAll && sec >= 0 && !vis[seat * sc + sec]) continue;
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
      
      
      
      
      
      colour.setHex(under ? 0x9aa08e : teamTint(m, w.b.owner[i], seat))
        .multiplyScalar(1 + (slopeLightAt(w.map, w.b.x[i], w.b.y[i]) - 1) * 0.5);
      buildings.setColorAt(n, colour);

      
      
      
      const pad = size * 0.72;
      dummy.position.set(bx, by + 0.5, bz + size * 0.06);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(pad, pad * 0.62, 1);
      dummy.updateMatrix();
      buildingPads.setMatrixAt(n, dummy.matrix);
      
      
      
      
      
      writeCast(castBuildings, n, bx, by, bz + size * 0.06,
        drawn * (1 - foot) * 0.90, pad * 0.78);
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
    castBuildings.count = n;
    buildings.instanceMatrix.needsUpdate = true;
    buildingPads.instanceMatrix.needsUpdate = true;
    castBuildings.instanceMatrix.needsUpdate = true;
    bTileAttr.needsUpdate = true;
    if (buildings.instanceColor) buildings.instanceColor.needsUpdate = true;
    if (buildingPads.instanceColor) buildingPads.instanceColor.needsUpdate = true;
  }

  
  
  
  
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.82, 28),
    new THREE.MeshBasicMaterial({
      color: 0xffe9a8, transparent: true, side: THREE.DoubleSide, fog: false,
    }),
  );
  marker.rotation.x = -Math.PI / 2;
  marker.visible = false;
  
  
  
  
  
  marker.renderOrder = 2.7;
  scene.add(marker);
  let markerUntil = 0;

  function markOrder(xMm, yMm) {
    marker.position.set(xMm / MM, groundY(currentMap, xMm, yMm) + 0.4, yMm / MM);
    marker.visible = true;
    markerUntil = performance.now() + 2000;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const fx = createEffects({
    THREE, scene, match, view, groundY, impacts: true,
  });
  
  
  
  fx.installTimer(() => performance.now());

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const vignette = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      
      
      toneMapped: false,
      fog: false,
      uniforms: {},
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        void main() {
          // Distance from the centre, in units of half a screen. The corners
          // reach about 1.41, so the ramp is placed against that rather than
          // against 1.0 - a vignette that starts at the edge midpoints puts a
          // visible dark band across the middle of the top of the frame.
          vec2 d = vUv - 0.5;
          float r = length(d) * 2.0;
          float v = smoothstep(0.62, 1.42, r);
          gl_FragColor = vec4(0.043, 0.070, 0.078, v * 0.42);
        }
      `,
    }),
  );
  vignette.frustumCulled = false;
  const vignetteScene = new THREE.Scene();
  vignetteScene.add(vignette);
  
  
  const vignetteCam = new THREE.Camera();

  
  
  
  
  
  
  
  
  let interp = null;
  let alphaNow = 1;
  let camVX = 0;            
  let camVY = 0;
  let spanTarget = view.span;
  let lastFrameMs = 0;
  const FLING_TAU_MS = 140; 
  const ZOOM_TAU_MS = 45;   
  const reduceMotion = typeof matchMedia === 'function'
    && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ACK_MS = 260;
  const ackUntil = new Float64Array(MAX_UNITS);
  const ackDir = new Float32Array(MAX_UNITS);
  
  
  const HIT_MS = 220;
  const HIT_REACH_MM = 2500;
  const hitUntil = new Float64Array(MAX_UNITS);
  
  
  const hitCount = new Uint32Array(MAX_UNITS);
  function flinchAt(w, shooter, txMm, tyMm) {
    let best = -1;
    let bestD = HIT_REACH_MM * HIT_REACH_MM;
    for (let i = 0; i < w.u.count; i += 1) {
      if (!w.u.alive[i] || w.u.owner[i] === shooter) continue;
      const dx = w.u.x[i] - txMm;
      const dy = w.u.y[i] - tyMm;
      const d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best >= 0) { hitUntil[best] = performance.now() + HIT_MS; hitCount[best] += 1; }
  }
  
  
  
  
  let revealAll = false;
  
  
  let glideX = null;
  let glideY = null;
  const GLIDE_TAU_MS = 220;

  function screenPan(dxWorld, dyWorld) {
    const yaw = (view.yawSteps * Math.PI) / 2;
    view.x -= dxWorld * Math.cos(yaw) + dyWorld * Math.sin(yaw);
    view.y -= dyWorld * Math.cos(yaw) - dxWorld * Math.sin(yaw);
  }

  function easeCamera(nowMs) {
    const dt = lastFrameMs ? Math.min(100, nowMs - lastFrameMs) : 16;
    lastFrameMs = nowMs;
    let moved = false;
    if (camVX !== 0 || camVY !== 0) {
      screenPan(camVX * dt, camVY * dt);
      camVX = decay(camVX, dt, FLING_TAU_MS);
      camVY = decay(camVY, dt, FLING_TAU_MS);
      if (Math.abs(camVX) + Math.abs(camVY) < 0.002) { camVX = 0; camVY = 0; }
      moved = true;
    }
    if (Math.abs(view.span - spanTarget) > 0.05) {
      view.span = approach(view.span, spanTarget, dt, ZOOM_TAU_MS);
      if (Math.abs(view.span - spanTarget) <= 0.05) view.span = spanTarget;
      resize();
      moved = true;
    }
    if (glideX !== null) {
      view.x = approach(view.x, glideX, dt, GLIDE_TAU_MS);
      view.y = approach(view.y, glideY, dt, GLIDE_TAU_MS);
      if (Math.hypot(view.x - glideX, view.y - glideY) < 0.3) {
        view.x = glideX; view.y = glideY; glideX = null; glideY = null;
      }
      moved = true;
    }
    if (moved) { clampView(); placeCamera(); }
  }

  function frame(m, seat, now = 0, alpha = 1) {
    
    
    
    
    clockSec = (now || performance.now()) / 1000;
    alphaNow = alpha;
    easeCamera(clockSec * 1000);
    
    
    let key = '';
    let progress = '';
    for (let i = 0; i < m.w.sectors.length; i += 1) {
      const s = m.w.sectors[i];
      key += `${s.owner === null ? '-' : s.owner}${s.pollution}`;
      
      
      
      
      
      
      
      
      
      
      const cs = captureState(s);
      if (cs.phase !== 'idle') {
        progress += `${i}${cs.phase[0]}${cs.actor === null ? '-' : cs.actor}${Math.floor(cs.pct / 10)}`;
      }
    }
    const vis = m.presence.visible;
    const sc = m.w.sectors.length;
    for (let i = 0; i < sc; i += 1) key += (revealAll || vis[seat * sc + i]) ? '1' : '0';
    if (key !== groundKey) {
      groundKey = key;
      washKey = progress;
      
      
      
      layTiles(m);
      paintGround(m, seat);
      paintWash(m, seat);
      
      layProps(m, seat, view.yawSteps);
      propYaw = view.yawSteps;
    } else if (progress !== washKey) {
      washKey = progress;
      paintWash(m, seat);
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

    
    
    
    
    
    
    
    
    
    
    const drift = (clockSec * 6) / CLOUD_METRES;
    for (const sh of groundShaders) {
      sh.uniforms.uCloudShift.value.set(fx.wind.x * drift, fx.wind.z * drift);
    }

    for (const sh of waterShaders) {
      sh.uniforms.uTime.value = clockSec;
      sh.uniforms.uHalf.value.copy(sunHalf);
      sh.uniforms.uView.value.copy(camView);
    }

    
    
    
    fx.frame(m, seat, clockSec);

    renderer.render(scene, cam);
    
    
    
    renderer.autoClear = false;
    renderer.render(vignetteScene, vignetteCam);
    renderer.autoClear = true;
  }

  
  const api = {
    frame,
    resize,
    view,
    
    
    panBy(dxPx, dyPx) {
      const h = renderer.domElement.clientHeight || 1;
      const scale = (view.span * 2) / h;
      camVX = 0; camVY = 0;
      glideX = null; glideY = null;
      screenPan(dxPx * scale, dyPx * scale);
      clampView();
      placeCamera();
    },
    
    fling(vxPx, vyPx) {
      if (reduceMotion) return;
      const h = renderer.domElement.clientHeight || 1;
      const scale = (view.span * 2) / h;
      camVX = vxPx * scale;
      camVY = vyPx * scale;
    },
    zoomBy(factor) {
      spanTarget = Math.max(view.minSpan, Math.min(view.maxSpan, spanTarget * factor));
      if (reduceMotion) { view.span = spanTarget; resize(); }
    },
    rotate(dir) {
      view.yawSteps = (view.yawSteps + dir + 4) % 4;
      
      
      propYaw = -1;
      placeCamera();
    },
    centreOn(xMm, yMm) {
      view.x = xMm / MM;
      view.y = yMm / MM;
      camVX = 0; camVY = 0;
      glideX = null; glideY = null;
      clampView();
      placeCamera();
    },
    
    glideTo(xMm, yMm) {
      if (reduceMotion) { this.centreOn(xMm, yMm); return; }
      camVX = 0; camVY = 0;
      glideX = xMm / MM;
      glideY = yMm / MM;
    },
    
    setReveal(on) {
      revealAll = !!on;
      groundKey = '';
    },
    get revealed() { return revealAll; },
    







    setFactionColours(custom) { return setFactionColours(custom); },
    
    get seatColours() { return seatColours.slice(); },
    





    debugSpread(id) { return spread.offsetOf(id).slice(); },
    





    setQuality(tier) {
      const s = QUALITY_SETTINGS[tier] || QUALITY_SETTINGS.high;
      renderer.setPixelRatio(Math.min(s.pixelRatio, window.devicePixelRatio || 1));
      resize();
      fx.setQuality(s.effects);
      qualityTier = tier in QUALITY_SETTINGS ? tier : 'high';
      return qualityTier;
    },
    get quality() {
      return { tier: qualityTier, pixelRatio: renderer.getPixelRatio(), effects: fx.quality };
    },
    
    setInterp(it) { interp = it; },
    





    acknowledge(slots, xMm, yMm) {
      const until = performance.now() + ACK_MS;
      for (const i of slots) {
        if (i < 0 || i >= MAX_UNITS) continue;
        const dx = xMm - drawnMatch?.w.u.x[i];
        const dz = yMm - drawnMatch?.w.u.y[i];
        const side = dx * barX + dz * barZ;
        ackDir[i] = side >= 0 ? 1 : -1;
        ackUntil[i] = until;
      }
    },
    
    ackLeft(slot) { return Math.max(0, ackUntil[slot] - performance.now()); },
    
    hitLeft(slot) { return Math.max(0, hitUntil[slot] - performance.now()); },
    
    flinches(slot) { return hitCount[slot]; },
    




    drawnAt(slot) {
      const n = firstBody[slot];
      if (n < 0) return null;
      const mtx = new THREE.Matrix4();
      units.getMatrixAt(n, mtx);
      const p = new THREE.Vector3().setFromMatrixPosition(mtx);
      return { x: p.x, y: p.y, z: p.z, instance: n };
    },
    get camera() { return { vx: camVX, vy: camVY, spanTarget }; },
    
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

    
















    gfx: {
      scene,
      renderer,
      cam,
      get terrain() { return terrainMeshes; },
      
      
      groundTexture: groundTex,
      
      washCanvas,
      meshes: {
        ground,
        surround,
        props: propMesh,
        units,
        buildings,
        buildingPads,
        shadows,
        castUnits,
        castProps,
        castBuildings,
        rings,
        get tracks() { return tracks; },
        get flecks() { return flecks; },
      },
      
      sun: SUN,
    },

    









    shots(m, seat, events) {
      drawShots(m, seat, events);
      
      
      
      
      
      
      fx.shots(m, seat, events, clockSec);
      
      
      
      fx.flips(m, seat, events, clockSec);
    },
    








    reset(m, seat) {
      groundKey = '';
      
      
      
      
      scatter = scatterProps(m.w.map, { facings: PROP_COLS, max: MAX_PROP_INSTANCES });
      
      
      
      
      liftOverlay(m.w.map);
      
      fx.reset(m);
      currentMap = m.w.map;
      propYaw = -1;
      marker.visible = false;
      units.count = 0;
      buildings.count = 0;
      buildingPads.count = 0;
      
      
      
      castUnits.count = 0;
      castProps.count = 0;
      castBuildings.count = 0;
      
      
      
      
      
      
      
      
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
      
      clearGhosts();
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

    




















    
    animAt(slot) {
      const v = lastAnim[slot];
      if (v < 0) return null;
      const kind = v >= 20 ? 'die' : (v >= 10 ? 'attack' : 'walk');
      return { kind, frame: v % 10, sheet: anim.herd || anim.yield ? 'loaded' : 'missing' };
    },
    
    ghostCount() {
      let c = 0;
      for (let g = 0; g < MAX_GHOSTS; g += 1) if (ghost.live[g]) c += 1;
      return c;
    },
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
    






    effectPixelsDrawn() {
      return pixelsOfMany([fx.meshes.ground, fx.meshes.air, fx.meshes.glow, flecks]);
    },
    effectStats() { return { ...fx.counts(), ms: fx.lastFrameMs(), flecks: flecks.count }; },

    
    effectCounts() {
      return {
        units: units.count,
        buildings: buildings.count,
        tracks: tracks.count,
        flecks: flecks.count,
      };
    },
  };

  











  
  function pixelsOfMany(meshes) {
    const gl = renderer.getContext();
    const w = renderer.domElement.width;
    const h = renderer.domElement.height;
    const withIt = new Uint8Array(w * h * 4);
    const without = new Uint8Array(w * h * 4);
    renderer.render(scene, cam);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, withIt);
    const was = meshes.map((mm) => mm.visible);
    for (const mm of meshes) mm.visible = false;
    renderer.render(scene, cam);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, without);
    meshes.forEach((mm, k) => { mm.visible = was[k]; });
    renderer.render(scene, cam);
    let n = 0;
    for (let i = 0; i < withIt.length; i += 4) {
      if (withIt[i] !== without[i] || withIt[i + 1] !== without[i + 1] || withIt[i + 2] !== without[i + 2]) n += 1;
    }
    return { pixels: n, of: w * h };
  }

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
