






















































































































































import { UNITS, BUILDINGS, HERD } from '../../../web-engine/rts/roster.js';
import { unitSpec, buildingSpec, STATE, MAX_UNITS } from '../../../web-engine/rts/sim/world.js';

import { TERRAIN_IDS, terrainForSector } from '../../../web-engine/rts/art/terrainRecipe.js';
import { cornerHeightDm, MM_PER_DM } from '../../../web-engine/rts/maps/elevation.js';


const MM = 1000;




















export const PX_PER_UNIT_AT_DEFAULT_ZOOM = 1.25;









export const GROUND_LIFT = 0.62;




















































export const EFFECT_BUDGET = Object.freeze({
  DUST: 320,
  SMOKE: 224,
  MOTE: 288,
  GLINT: 96,
  RIPPLE: 96,
  DEBRIS: 128,
  
  TOTAL: 1152,
  
  DRAW_CALLS: 3,
});


export const MESH_ORDER = Object.freeze({
  
  ground: 2.65,
  
  air: 3.9,
  
  glow: 4.6,
});


const TILE = Object.freeze({
  SOFT: 0, PLUME: 1, MOTE: 2, GLINT: 3, RING: 4, CHIP: 5,
});
const TILE_COLS = 6;







































export const DUST_GROUND = Object.freeze({
  
  ploughedA: { lift: 1.00, tint: 0xdcc4a2, rise: 7.0, life: 2.1 },
  ploughedB: { lift: 1.00, tint: 0xe4d0af, rise: 7.0, life: 2.1 },
  
  dryPaddock: { lift: 0.95, tint: 0xece0c4, rise: 6.4, life: 2.4 },
  dirt: { lift: 0.90, tint: 0xd4bd9c, rise: 6.6, life: 2.0 },
  
  stubble: { lift: 0.78, tint: 0xf2e3b8, rise: 5.6, life: 2.3 },
  gravel: { lift: 0.66, tint: 0xdedbd2, rise: 4.6, life: 1.5 },
  rock: { lift: 0.34, tint: 0xcac4ba, rise: 4.0, life: 1.2 },
  scrub: { lift: 0.46, tint: 0xd6cba0, rise: 4.8, life: 1.6 },
  
  
  longGrass: { lift: 0.36, tint: 0xd8e0b4, rise: 4.4, life: 1.5 },
  pasture: { lift: 0.30, tint: 0xcadcae, rise: 4.0, life: 1.3 },
  
  
  
  mud: { lift: 0.18, tint: 0x4a3d2c, rise: 2.6, life: 0.8 },
  
  
  
  concrete: { lift: 0.08, tint: 0xe2e2df, rise: 2.4, life: 0.7 },
  
  waterClean: { lift: 0, tint: 0xdff4ff, rise: 0, life: 0 },
  waterFouled: { lift: 0, tint: 0xbfc3a0, rise: 0, life: 0 },
});













export const FOOT_WEIGHT = Object.freeze({
  PAW: 0.55, HOOF: 1.00, BOOT: 0.60, TYRE: 1.35,
});


export const UNIT_FOOT = Object.freeze({
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
});






































export const BUILDING_PLUME = Object.freeze({
  
  
  
  
  
  
  
  
  
  
  
  
  
  processingPlant: {
    tile: TILE.PLUME, tint: 0x40382f, every: 0.24, size: 22, grow: 3.4,
    rise: 21, life: 6.5, lean: 1.0, alpha: 0.82, glow: false,
  },
  
  
  machineShed: {
    tile: TILE.PLUME, tint: 0x6d727a, every: 0.40, size: 14, grow: 2.6,
    rise: 13, life: 3.2, lean: 0.85, alpha: 0.62, glow: false,
  },
  
  pumpStation: {
    tile: TILE.SOFT, tint: 0xf2f8fb, every: 0.46, size: 12, grow: 3.0,
    rise: 9, life: 2.2, lean: 0.35, alpha: 0.70, glow: false,
  },
  
  
  pesticideBattery: {
    tile: TILE.SOFT, tint: 0xdff0a8, every: 0.70, size: 10, grow: 2.2,
    rise: 3.2, life: 3.0, lean: 0.55, alpha: 0.56, glow: false,
  },
  
  
  
  
  
  greatTree: {
    tile: TILE.MOTE, tint: 0xffe6a0, every: 0.22, size: 3.6, grow: 1.0,
    rise: 4.5, life: 3.4, lean: 0.9, alpha: 0.95, glow: true,
  },
  haven: {
    tile: TILE.MOTE, tint: 0xe8f0b0, every: 0.34, size: 3.2, grow: 1.0,
    rise: 3.8, life: 3.0, lean: 0.9, alpha: 0.90, glow: true,
  },
  sanctuary: {
    tile: TILE.MOTE, tint: 0xffedb8, every: 0.32, size: 3.4, grow: 1.0,
    rise: 4.2, life: 3.2, lean: 0.9, alpha: 0.90, glow: true,
  },
  
  reedbed: {
    tile: TILE.MOTE, tint: 0xd8f0e0, every: 0.30, size: 2.8, grow: 1.0,
    rise: 2.4, life: 2.6, lean: 1.0, alpha: 0.90, glow: true,
  },
});











export const DAMAGE_SMOKE_AT = 0.5;
const DAMAGE_PLUME = Object.freeze({
  tile: TILE.PLUME, tint: 0x1c1a18, every: 0.22, size: 17, grow: 3.0,
  rise: 15, life: 4.0, lean: 0.95, alpha: 0.88, glow: false,
});









const WIND = Object.freeze({ BASE: 4.2, GUST: 1.6, SWING: 0.42, PERIOD: 97 });











export function hash01(a, salt = 0) {
  let h = ((a | 0) * 2654435761 + (salt | 0) * 40503) >>> 0;
  h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
















export function sampleGroundY(map, xMm, yMm) {
  if (!map || !map.heightOfCell) return 0;
  const cell = map.cellMm;
  const n = map.cellsPerSide;
  const fx = Math.min(n, Math.max(0, xMm / cell));
  const fy = Math.min(n, Math.max(0, yMm / cell));
  const cx = Math.min(n - 1, Math.trunc(fx));
  const cy = Math.min(n - 1, Math.trunc(fy));
  const tx = fx - cx;
  const ty = fy - cy;
  const k = (ix, iy) => (cornerHeightDm(map, ix, iy) * MM_PER_DM) / MM;
  const h00 = k(cx, cy);
  const h10 = k(cx + 1, cy);
  const h01 = k(cx, cy + 1);
  const h11 = k(cx + 1, cy + 1);
  return (h00 * (1 - tx) + h10 * tx) * (1 - ty) + (h01 * (1 - tx) + h11 * tx) * ty;
}










export function materialOfCell(m, cx, cy) {
  const cells = m.w.map.cellsPerSide;
  const sec = m.w.sectors[m.w.map.sectorOfCell[cy * cells + cx]];
  if (!sec) return 'dirt';
  const choices = terrainForSector({
    kind: sec.kind,
    faction: sec.owner === null ? null : m.factions[sec.owner],
    pollution: sec.pollution,
  });
  let sh = (sec.id * 2654435761) >>> 0;
  sh = (sh ^ (sh >>> 15)) >>> 0;
  return choices[sh % choices.length];
}















export function dustStrength(unitId, terrainId, members = 1) {
  const foot = UNIT_FOOT[unitId];
  if (!foot) return 0;
  const ground = DUST_GROUND[terrainId];
  if (!ground) return 0;
  return FOOT_WEIGHT[foot] * ground.lift * Math.sqrt(Math.max(1, members));
}














export function shorelineCells(map, sectors) {
  const n = map.cellsPerSide;
  const cell = map.cellMm / MM;
  const isWater = new Uint8Array(sectors.length);
  for (let i = 0; i < sectors.length; i += 1) isWater[i] = sectors[i].kind === 'water' ? 1 : 0;
  const out = [];
  for (let cy = 0; cy < n; cy += 1) {
    for (let cx = 0; cx < n; cx += 1) {
      const s = map.sectorOfCell[cy * n + cx];
      if (!isWater[s]) continue;
      
      
      
      
      let dx = 0;
      let dz = 0;
      let land = 0;
      for (const [ox, oz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ax = cx + ox;
        const az = cy + oz;
        
        
        
        const outside = ax < 0 || az < 0 || ax >= n || az >= n;
        if (outside || !isWater[map.sectorOfCell[az * n + ax]]) {
          dx += ox; dz += oz; land += 1;
        }
      }
      if (!land) continue;
      const len = Math.hypot(dx, dz) || 1;
      out.push({
        x: (cx + 0.5) * cell,
        z: (cy + 0.5) * cell,
        nx: dx / len,
        nz: dz / len,
        sector: s,
      });
    }
  }
  return out;
}










function makePool(cap) {
  return {
    cap,
    head: 0,
    tile: new Float32Array(cap),
    x: new Float32Array(cap),
    y: new Float32Array(cap),
    z: new Float32Array(cap),
    size: new Float32Array(cap),
    grow: new Float32Array(cap),
    born: new Float32Array(cap),
    life: new Float32Array(cap),
    rise: new Float32Array(cap),
    lean: new Float32Array(cap),
    spin: new Float32Array(cap),
    ang: new Float32Array(cap),
    peak: new Float32Array(cap),
    col: new Int32Array(cap),
    flat: new Uint8Array(cap),
  };
}










function spawn(p, o) {
  if (!Number.isFinite(o.x) || !Number.isFinite(o.y) || !Number.isFinite(o.z)) return -1;
  if (!Number.isFinite(o.size) || o.size <= 0) return -1;
  if (!Number.isFinite(o.life) || o.life <= 0) return -1;
  const i = p.head;
  p.head = (p.head + 1) % p.cap;
  p.tile[i] = o.tile;
  p.x[i] = o.x; p.y[i] = o.y; p.z[i] = o.z;
  p.size[i] = o.size;
  p.grow[i] = o.grow === undefined ? 1 : o.grow;
  p.born[i] = o.now;
  p.life[i] = o.life;
  p.rise[i] = o.rise || 0;
  p.lean[i] = o.lean === undefined ? 1 : o.lean;
  p.spin[i] = o.spin || 0;
  p.ang[i] = o.ang || 0;
  p.peak[i] = o.peak === undefined ? 1 : o.peak;
  p.col[i] = o.col;
  p.flat[i] = o.flat ? 1 : 0;
  return i;
}


























































export function createEffects(opts) {
  const {
    THREE, scene, match,
    view = null,
    groundY = sampleGroundY,
    quality = 1,
    impacts = false,
    waterLift = GROUND_LIFT,
  } = opts;
  const doc = opts.document || (typeof document === 'undefined' ? null : document);
  
  
  
  
  let q = Math.max(0, Math.min(1, quality));

  
  
  
  
  
  
  
  const S = 64;
  function drawStrip(ctx) {
    const at = (i) => { ctx.save(); ctx.translate(i * S, 0); };

    at(TILE.SOFT);
    
    
    
    
    for (const [ox, oy, r, a] of [[0.50, 0.52, 0.46, 0.55], [0.38, 0.44, 0.30, 0.40],
      [0.62, 0.58, 0.26, 0.34]]) {
      const g = ctx.createRadialGradient(S * ox, S * oy, 1, S * ox, S * oy, S * r);
      g.addColorStop(0, `rgba(255,255,255,${a})`);
      g.addColorStop(0.55, `rgba(255,255,255,${a * 0.42})`);
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, S, S);
    }
    ctx.restore();

    at(TILE.PLUME);
    
    
    
    
    
    
    for (const [ox, oy, r] of [[0.46, 0.54, 0.42], [0.66, 0.40, 0.28], [0.32, 0.36, 0.24],
      [0.60, 0.68, 0.24], [0.36, 0.68, 0.20]]) {
      const g = ctx.createRadialGradient(S * ox, S * oy, 1, S * ox, S * oy, S * r);
      g.addColorStop(0, 'rgba(255,255,255,0.50)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.20)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, S, S);
    }
    ctx.restore();

    at(TILE.MOTE);
    
    
    
    
    
    const hg = ctx.createRadialGradient(S / 2, S / 2, 1, S / 2, S / 2, S * 0.48);
    hg.addColorStop(0, 'rgba(255,255,255,0.55)');
    hg.addColorStop(0.35, 'rgba(255,255,255,0.18)');
    hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg;
    ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = 'rgba(255,255,255,1)';
    ctx.beginPath(); ctx.arc(S / 2, S / 2, S * 0.13, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    at(TILE.GLINT);
    
    
    
    
    const gg = ctx.createRadialGradient(S / 2, S / 2, 1, S / 2, S / 2, S * 0.5);
    gg.addColorStop(0, 'rgba(255,255,255,0.9)');
    gg.addColorStop(0.25, 'rgba(255,255,255,0.28)');
    gg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gg;
    ctx.save(); ctx.translate(S / 2, S / 2); ctx.scale(1, 0.34); ctx.translate(-S / 2, -S / 2);
    ctx.fillRect(0, 0, S, S);
    ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fillRect(S * 0.10, S * 0.47, S * 0.80, S * 0.06);
    ctx.fillRect(S * 0.47, S * 0.28, S * 0.06, S * 0.44);
    ctx.restore();

    at(TILE.RING);
    
    
    
    ctx.strokeStyle = 'rgba(255,255,255,0.75)';
    ctx.lineWidth = S * 0.045;
    ctx.beginPath(); ctx.ellipse(S / 2, S / 2, S * 0.40, S * 0.26, 0, Math.PI * 0.08, Math.PI * 0.92);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.40)';
    ctx.lineWidth = S * 0.030;
    ctx.beginPath(); ctx.ellipse(S / 2, S / 2, S * 0.28, S * 0.17, 0, Math.PI * 0.12, Math.PI * 0.88);
    ctx.stroke();
    ctx.restore();

    at(TILE.CHIP);
    
    
    
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    for (const [px, py, r, rot] of [[0.34, 0.40, 0.13, 0.4], [0.62, 0.34, 0.10, 1.1],
      [0.52, 0.66, 0.11, 2.0], [0.28, 0.68, 0.075, 2.7]]) {
      ctx.save();
      ctx.translate(S * px, S * py);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.moveTo(-S * r, -S * r * 0.7);
      ctx.lineTo(S * r, -S * r * 0.45);
      ctx.lineTo(S * r * 0.6, S * r);
      ctx.lineTo(-S * r * 0.8, S * r * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  }

  let tex = null;
  if (doc) {
    const c = doc.createElement('canvas');
    c.width = S * TILE_COLS;
    c.height = S;
    const ctx = c.getContext('2d');
    if (ctx) drawStrip(ctx);
    tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
  }

  
  
  
  
  
  
  
  
  const materials = [];
  function stripMaterial(blending) {
    const mat = new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      blending,
    });
    
    
    
    
    mat.onBeforeCompile = (shader) => {
      shader.vertexShader = 'attribute float aTile;\nattribute float aAlpha;\n'
        + `varying float vTile;\nvarying float vAlpha;\n${shader.vertexShader}`
          .replace('#include <uv_vertex>',
            '#include <uv_vertex>\n  vTile = aTile;\n  vAlpha = aAlpha;');
      shader.fragmentShader = `varying float vTile;\nvarying float vAlpha;\n${shader.fragmentShader}`
        .replace('#include <map_fragment>',
          `#ifdef USE_MAP
             diffuseColor *= texture2D(map, vec2((vMapUv.x + vTile) / ${TILE_COLS}.0, vMapUv.y));
             diffuseColor.a *= vAlpha;
           #endif`);
    };
    materials.push(mat);
    return mat;
  }

  function makeMesh(cap, order, blending) {
    const geo = new THREE.PlaneGeometry(1, 1);
    const tileAttr = new THREE.InstancedBufferAttribute(new Float32Array(cap), 1);
    const alphaAttr = new THREE.InstancedBufferAttribute(new Float32Array(cap), 1);
    geo.setAttribute('aTile', tileAttr);
    geo.setAttribute('aAlpha', alphaAttr);
    const mesh = new THREE.InstancedMesh(geo, stripMaterial(blending), cap);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.count = 0;
    
    
    
    
    mesh.frustumCulled = false;
    mesh.renderOrder = order;
    if (scene) scene.add(mesh);
    return { mesh, geo, tileAttr, alphaAttr, cap, n: 0 };
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const AIR_CAP = EFFECT_BUDGET.DUST + EFFECT_BUDGET.SMOKE + EFFECT_BUDGET.DEBRIS
    + EFFECT_BUDGET.MOTE;
  const GLOW_CAP = EFFECT_BUDGET.MOTE + EFFECT_BUDGET.GLINT + EFFECT_BUDGET.SMOKE;
  const GROUND_CAP = EFFECT_BUDGET.RIPPLE;

  const layer = {
    ground: makeMesh(GROUND_CAP, MESH_ORDER.ground, THREE.NormalBlending),
    air: makeMesh(AIR_CAP, MESH_ORDER.air, THREE.NormalBlending),
    glow: makeMesh(GLOW_CAP, MESH_ORDER.glow, THREE.AdditiveBlending),
  };

  const dummy = new THREE.Object3D();
  const colour = new THREE.Color();

  
  const dust = makePool(EFFECT_BUDGET.DUST);
  const smoke = makePool(EFFECT_BUDGET.SMOKE);
  const debris = makePool(EFFECT_BUDGET.DEBRIS);

  
  
  
  
  
  
  
  const MAX_SLOTS = 1024;
  const stepId = new Int32Array(MAX_SLOTS).fill(-1);
  const stepX = new Float32Array(MAX_SLOTS);
  const stepZ = new Float32Array(MAX_SLOTS);
  
  const scuffleNext = new Float32Array(Math.max(MAX_SLOTS, MAX_UNITS));
  const bId = new Int32Array(256).fill(-1);
  const bNext = new Float32Array(256);

  
  let currentMap = match ? match.w.map : null;
  let shore = [];
  let windSeed = 0;

  function reset(nextMatch) {
    const w = nextMatch.w;
    currentMap = w.map;
    shore = shorelineCells(w.map, w.sectors);
    
    
    
    
    
    
    
    
    
    
    
    windSeed = w.rng.save() | 0;
    stepId.fill(-1);
    bId.fill(-1);
    for (const p of [dust, smoke, debris]) {
      p.life.fill(0);
      p.head = 0;
    }
  }
  if (match) reset(match);

  
  const wind = { x: 0, z: 0, dir: 0, speed: 0 };
  function stepWind(now) {
    const base = hash01(windSeed, 7) * Math.PI * 2;
    const phase = (now / WIND.PERIOD) * Math.PI * 2 + hash01(windSeed, 11) * 6.283;
    wind.dir = base + Math.sin(phase) * WIND.SWING + Math.sin(phase * 2.37) * (WIND.SWING * 0.3);
    wind.speed = WIND.BASE + Math.sin(phase * 1.61) * WIND.GUST;
    wind.x = Math.cos(wind.dir) * wind.speed;
    wind.z = Math.sin(wind.dir) * wind.speed;
  }

  
  
  
  
  
  
  
  
  
  
  
  function emitDust(m, seat, now, cxw, czw, span) {
    const w = m.w;
    const u = w.u;
    const vis = m.presence.visible;
    const sc = w.sectors.length;
    const cells = w.map.cellsPerSide;
    const cellWu = w.map.cellMm / MM;
    
    
    
    
    
    
    
    
    const reach = span * 1.5;
    const reach2 = reach * reach;
    for (let i = 0; i < u.count; i += 1) {
      if (!u.alive[i]) continue;
      const sec = u.sector[i];
      
      if (sec >= 0 && !vis[seat * sc + sec]) continue;
      const id = u.id[i];
      const ux = u.x[i] / MM;
      const uz = u.y[i] / MM;
      const ddx = ux - cxw;
      const ddz = uz - czw;
      if (ddx * ddx + ddz * ddz > reach2) { stepId[i] = -1; continue; }
      if (stepId[i] !== id) {
        stepId[i] = id;
        stepX[i] = ux;
        stepZ[i] = uz;
        continue;
      }
      const spec = unitSpec(w, i);
      if (!spec) continue;
      const foot = UNIT_FOOT[spec.id];
      
      
      
      if (!foot) continue;
      const dx = ux - stepX[i];
      const dz = uz - stepZ[i];
      
      
      
      
      
      
      
      
      
      
      
      
      
      const stride = 9 + FOOT_WEIGHT[foot] * 7;
      
      
      
      
      
      
      let scuffle = false;
      if (dx * dx + dz * dz < stride * stride) {
        if (u.state[i] !== STATE.ATTACKING || now < scuffleNext[i]) continue;
        scuffleNext[i] = now + 0.32 + hash01(id, Math.trunc(now * 5)) * 0.25;
        scuffle = true;
      }
      stepX[i] = ux;
      stepZ[i] = uz;

      const cx = Math.min(cells - 1, Math.max(0, Math.trunc(ux / cellWu)));
      const cy = Math.min(cells - 1, Math.max(0, Math.trunc(uz / cellWu)));
      const terrain = materialOfCell(m, cx, cy);
      const g = DUST_GROUND[terrain];
      if (!g || g.lift <= 0) continue;
      const strength = dustStrength(spec.id, terrain, u.members[i]);
      if (strength <= 0.05) continue;

      const gy = groundY(w.map, u.x[i], u.y[i]);
      
      
      
      const len = Math.hypot(dx, dz) || 1;
      
      
      const sa = scuffle ? hash01(id, Math.trunc(now * 7) + 5) * Math.PI * 2 : 0;
      const bx = scuffle ? Math.cos(sa) : -dx / len;
      const bz = scuffle ? Math.sin(sa) : -dz / len;
      
      
      
      
      const salt = Math.trunc(ux * 0.7 + uz * 0.7);
      for (let k = 0; k < 2; k += 1) {
        const h = hash01(id, salt + k);
        const h2 = hash01(id, salt + k + 97);
        const back = 4 + k * 11 + h * 6;
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        
        const zoomScale = Math.min(2, Math.max(0.8, span / 320));
        const size = (13 + strength * 12) * zoomScale * (0.7 + h2 * 0.6) * (k === 0 ? 1 : 0.72);
        spawn(dust, {
          tile: TILE.SOFT,
          
          
          x: ux + bx * back + (h - 0.5) * 8,
          y: gy + size * 0.22,
          z: uz + bz * back + (h2 - 0.5) * 8,
          size,
          grow: 1.5 + strength * 0.25,
          now,
          life: g.life * (0.5 + h * 0.35),
          rise: g.rise * (0.5 + h2 * 0.4),
          lean: 1,
          spin: (h - 0.5) * 1.6,
          
          
          
          
          
          
          
          peak: Math.min(0.9, 0.42 + strength * 0.4),
          col: g.tint,
        });
      }
    }
  }

  











  function flips(m, seat, events, nowSec) {
    if (!events || !events.length || !m || !m.w) return;
    const w = m.w;
    const vis = m.presence.visible;
    const sc = w.sectors.length;
    const now = Number.isFinite(nowSec) ? nowSec : 0;
    for (const evt of events) {
      if (evt.type !== 'captured' && evt.type !== 'lost' && evt.type !== 'faded') continue;
      const s = w.sectors[evt.sector];
      if (!s) continue;
      if (evt.sector >= 0 && !vis[seat * sc + evt.sector]) continue;
      const owner = evt.to === null || evt.to === undefined ? null : evt.to;
      const herd = owner !== null && m.factions[owner] === HERD;
      const col = owner === null ? 0xd8cfb4 : (herd ? 0x9ee06a : 0xffa04a);
      const gy = groundY(w.map, s.cx, s.cy);
      for (let k = 0; k < 2; k += 1) {
        spawn(dust, {
          tile: TILE.RING,
          x: s.cx / MM,
          y: gy + 0.9,
          z: s.cy / MM,
          size: 60 + k * 30,
          grow: 3.2,
          now: now + k * 0.12,
          life: 1.3,
          rise: 0,
          lean: 0,
          spin: 0,
          peak: k === 0 ? 0.75 : 0.45,
          col,
          flat: 1,
        });
      }
    }
  }

  
  function emitSmoke(m, seat, now) {
    const w = m.w;
    const b = w.b;
    const vis = m.presence.visible;
    const sc = w.sectors.length;
    for (let i = 0; i < b.count; i += 1) {
      if (!b.alive[i]) continue;
      const sec = b.sector[i];
      if (sec >= 0 && !vis[seat * sc + sec]) continue;
      
      
      
      if (b.building[i] > 0) continue;
      const spec = buildingSpec(w, i);
      if (!spec) continue;
      const id = b.id[i];
      const hurt = spec.hp > 0 && b.hp[i] / spec.hp < DAMAGE_SMOKE_AT;
      const plume = hurt ? DAMAGE_PLUME : BUILDING_PLUME[spec.id];
      if (!plume) continue;

      if (bId[i] !== id) { bId[i] = id; bNext[i] = now + hash01(id, 3) * plume.every; }
      if (now < bNext[i]) continue;
      
      
      
      
      
      bNext[i] = now + plume.every * (0.75 + hash01(id, Math.trunc(now * 8)) * 0.5);

      const bx = b.x[i] / MM;
      const bz = b.y[i] / MM;
      const gy = groundY(w.map, b.x[i], b.y[i]);
      const h = hash01(id, Math.trunc(now * 16));
      const h2 = hash01(id, Math.trunc(now * 16) + 31);
      
      
      
      
      const roof = plume.glow ? 14 : 26;
      
      
      
      
      spawn(smoke, {
        tile: plume.tile,
        x: bx + (h - 0.5) * 10,
        y: gy + roof + h2 * 6,
        z: bz + (h2 - 0.5) * 10,
        size: plume.size * (0.8 + h * 0.45),
        grow: plume.grow,
        now,
        life: plume.life * (0.85 + h2 * 0.3),
        rise: plume.rise * (0.85 + h * 0.3),
        lean: plume.lean,
        spin: (h2 - 0.5) * 0.9,
        peak: plume.alpha,
        col: plume.tint,
        flat: 0,
      });
    }
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  const MOTE_LAYERS = [
    { share: 0.42, size: 2.4, drift: 0.35, bobY: 3.2, hi: 26 },
    { share: 0.34, size: 3.6, drift: 0.62, bobY: 4.6, hi: 46 },
    { share: 0.24, size: 5.0, drift: 0.95, bobY: 6.0, hi: 72 },
  ];

  




















  const DARK_MOTE_SHARE = 0.45;

  function packMotes(m, now, cxw, czw, span, yaw) {
    const glow = layer.glow;
    const n = Math.round(EFFECT_BUDGET.MOTE * q);
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const boxW = span * 3.8;
    const boxH = span * 2.4;
    for (let i = 0; i < n; i += 1) {
      let acc = 0;
      let li = 0;
      const pick = hash01(i, 5);
      for (let k = 0; k < MOTE_LAYERS.length; k += 1) {
        acc += MOTE_LAYERS[k].share;
        if (pick < acc) { li = k; break; }
        li = k;
      }
      const L = MOTE_LAYERS[li];
      const hx = hash01(i, 1);
      const hz = hash01(i, 2);
      const hy = hash01(i, 3);
      const hp = hash01(i, 4);
      
      
      
      
      
      const bx = hx * boxW + wind.x * L.drift * now;
      const bz = hz * boxH + wind.z * L.drift * now;
      const x = cxw - boxW / 2 + (((bx % boxW) + boxW) % boxW);
      const z = czw - boxH / 2 + (((bz % boxH) + boxH) % boxH);
      const gy = groundY(currentMap, x * MM, z * MM);
      
      
      
      const bob = Math.sin(now * (0.5 + hp * 0.7) + hp * 6.283) * L.bobY;
      const yv = gy + 6 + hy * L.hi + bob;
      
      
      
      const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(now * (1.1 + hp * 1.9) + hx * 12.566));
      const size = L.size * (0.75 + hz * 0.6);
      
      
      const dark = hash01(i, 9) < DARK_MOTE_SHARE;
      const target = dark ? layer.air : glow;
      if (target.n >= target.cap) break;
      writeInstance(
        target, TILE.MOTE, x, yv, z,
        dark ? size * 0.72 : size,
        dark ? 0.30 + tw * 0.34 : tw * 0.62,
        dark ? 0x1d2417 : 0xffeec8,
        yaw, hp * 3.14, false,
      );
    }
  }

  






















  function packShore(now, cxw, czw, span, yaw) {
    const ripples = Math.round(EFFECT_BUDGET.RIPPLE * q);
    const glints = Math.round(EFFECT_BUDGET.GLINT * q);
    if (!shore.length || (!ripples && !glints)) return;
    const reach = span * 1.35;
    const reach2 = reach * reach;
    let r = 0;
    let g = 0;
    
    
    
    
    const start = Math.trunc(now * 7) % shore.length;
    for (let k = 0; k < shore.length && (r < ripples || g < glints); k += 1) {
      const c = shore[(start + k) % shore.length];
      const dx = c.x - cxw;
      const dz = c.z - czw;
      if (dx * dx + dz * dz > reach2) continue;
      const idx = (start + k) % shore.length;
      const ph = hash01(idx, 21);
      const gy = groundY(currentMap, c.x * MM, c.z * MM);
      
      
      if (r < ripples) {
        const t = ((now * (0.36 + ph * 0.22) + ph) % 1);
        const travel = 5.5 * t;
        const fade = Math.sin(t * Math.PI);
        if (writeInstance(
          layer.ground, TILE.RING,
          c.x + c.nx * travel, gy + waterLift, c.z + c.nz * travel,
          
          
          11 + t * 9, fade * 0.62, 0xdff4ff,
          yaw, Math.atan2(-c.nx, -c.nz), true,
        )) r += 1;
      }
      
      
      
      if (g < glints) {
        const ph2 = hash01(idx, 34);
        const s = Math.sin(now * (1.3 + ph2 * 1.1) + ph2 * 6.283);
        const flash = s > 0 ? s ** 8 : 0;
        if (flash > 0.02) {
          const jx = (ph - 0.5) * 8;
          const jz = (ph2 - 0.5) * 8;
          if (writeInstance(
            layer.glow, TILE.GLINT,
            c.x + jx, gy + waterLift + 1.4, c.z + jz,
            
            
            
            
            
            7 + ph2 * 6, flash, 0xfff4d8,
            yaw, 0, false,
          )) g += 1;
        }
      }
    }
  }

  








  function writeInstance(L, tile, x, y, z, size, alpha, hex, yaw, spin, flat) {
    if (L.n >= L.cap) return false;
    
    
    
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return false;
    if (!Number.isFinite(size) || size <= 0) return false;
    if (!Number.isFinite(alpha) || alpha <= 0) return false;
    const i = L.n;
    dummy.position.set(x, y, z);
    if (flat) {
      
      
      
      
      dummy.rotation.set(-Math.PI / 2, 0, spin);
    } else {
      dummy.rotation.set(0, yaw, spin);
    }
    dummy.scale.set(size, size, 1);
    dummy.updateMatrix();
    L.mesh.setMatrixAt(i, dummy.matrix);
    L.tileAttr.setX(i, tile);
    L.alphaAttr.setX(i, Math.min(1, alpha));
    colour.setHex(hex);
    L.mesh.setColorAt(i, colour);
    L.n = i + 1;
    return true;
  }

  
  function packPool(p, L, now, yaw, cap) {
    let drawn = 0;
    for (let i = 0; i < p.cap && drawn < cap; i += 1) {
      const life = p.life[i];
      if (life <= 0) continue;
      const age = (now - p.born[i]) / life;
      if (age < 0 || age >= 1) continue;
      const t = age * life;
      const size = p.size[i] * (1 + (p.grow[i] - 1) * age);
      
      
      
      
      
      
      const drift = p.lean[i] * t * t * 0.5;
      
      
      const fade = age < 0.25 ? 1 : (1 - (age - 0.25) / 0.75) ** 2;
      const glow = p.tile[i] === TILE.MOTE || p.tile[i] === TILE.GLINT;
      const target = glow ? layer.glow : L;
      if (target.n >= target.cap) break;
      if (writeInstance(
        target, p.tile[i],
        p.x[i] + wind.x * drift,
        p.y[i] + p.rise[i] * t,
        p.z[i] + wind.z * drift,
        size, p.peak[i] * fade, p.col[i],
        yaw, p.ang[i] + p.spin[i] * t, !!p.flat[i],
      )) drawn += 1;
    }
    return drawn;
  }

  function upload(L) {
    L.mesh.count = L.n;
    L.mesh.instanceMatrix.needsUpdate = true;
    L.tileAttr.needsUpdate = true;
    L.alphaAttr.needsUpdate = true;
    if (L.mesh.instanceColor) L.mesh.instanceColor.needsUpdate = true;
  }

  const stats = {
    dust: 0, smoke: 0, debris: 0, mote: 0, shore: 0, total: 0, ms: 0,
  };

  

















  function frame(m, seat, nowSec) {
    const t0 = stats.t0read ? stats.t0read() : 0;
    if (!m || !m.w) return;
    if (m.w.map !== currentMap) reset(m);
    const now = Number.isFinite(nowSec) ? nowSec : 0;
    stepWind(now);

    layer.ground.n = 0;
    layer.air.n = 0;
    layer.glow.n = 0;

    const cxw = view ? view.x : 600;
    const czw = view ? view.y : 600;
    const span = view ? view.span : 320;
    
    
    
    const yaw = view ? (view.yawSteps * Math.PI) / 2 : 0;

    emitDust(m, seat, now, cxw, czw, span);
    emitSmoke(m, seat, now);

    stats.dust = packPool(dust, layer.air, now, yaw, Math.round(EFFECT_BUDGET.DUST * q));
    stats.smoke = packPool(smoke, layer.air, now, yaw, Math.round(EFFECT_BUDGET.SMOKE * q));
    stats.debris = impacts
      ? packPool(debris, layer.air, now, yaw, Math.round(EFFECT_BUDGET.DEBRIS * q)) : 0;

    
    
    
    
    const moteBefore = layer.glow.n + layer.air.n;
    packMotes(m, now, cxw, czw, span, yaw);
    stats.mote = (layer.glow.n + layer.air.n) - moteBefore;
    const shoreBefore = layer.glow.n + layer.ground.n;
    packShore(now, cxw, czw, span, yaw);
    stats.shore = (layer.glow.n + layer.ground.n) - shoreBefore;

    upload(layer.ground);
    upload(layer.air);
    upload(layer.glow);
    stats.total = layer.ground.n + layer.air.n + layer.glow.n;
    if (t0) stats.ms = stats.t0read() - t0;
  }

  




































  function shots(m, seat, events, nowSec) {
    if (!impacts || !events || !events.length || !m || !m.w) return;
    const w = m.w;
    const vis = m.presence.visible;
    const sc = w.sectors.length;
    const cells = w.map.cellsPerSide;
    const cellWu = w.map.cellMm / MM;
    const now = Number.isFinite(nowSec) ? nowSec : 0;
    
    
    
    
    let budget = 16;
    for (const evt of events) {
      if (evt.type !== 'shot' || budget <= 0) continue;
      const tx = evt.tx / MM;
      const tz = evt.ty / MM;
      const cx = Math.min(cells - 1, Math.max(0, Math.trunc(tx / cellWu)));
      const cy = Math.min(cells - 1, Math.max(0, Math.trunc(tz / cellWu)));
      const secAt = w.map.sectorOfCell[cy * cells + cx];
      const secFrom = w.map.sectorOfCell[
        Math.min(cells - 1, Math.max(0, Math.trunc((evt.y / MM) / cellWu))) * cells
        + Math.min(cells - 1, Math.max(0, Math.trunc((evt.x / MM) / cellWu)))];
      if (!vis[seat * sc + secAt] && !vis[seat * sc + secFrom]) continue;
      const terrain = materialOfCell(m, cx, cy);
      const g = DUST_GROUND[terrain];
      if (!g || g.lift <= 0) continue;
      budget -= 1;
      const gy = groundY(w.map, evt.tx, evt.ty);
      
      
      
      const heft = 1 + Math.min(1.4, evt.areaMm / 8000);
      const seed = (evt.tick * 131 + evt.attacker * 17 + evt.building * 7) | 0;
      spawn(debris, {
        tile: TILE.SOFT,
        x: tx, y: gy + 5 * heft, z: tz,
        size: 13 * heft * g.lift + 4,
        grow: 2.4, now, life: g.life * 0.7,
        rise: g.rise * 0.55, lean: 0.8,
        spin: (hash01(seed, 1) - 0.5) * 2,
        peak: Math.min(0.8, 0.3 + g.lift * 0.45),
        col: g.tint,
      });
      const chips = Math.min(4, 1 + Math.round(heft * 1.6));
      for (let k = 0; k < chips; k += 1) {
        const a = hash01(seed, k + 40) * Math.PI * 2;
        const r = 5 + hash01(seed, k + 60) * 12 * heft;
        spawn(debris, {
          tile: TILE.CHIP,
          x: tx + Math.cos(a) * r, y: gy + 4 + hash01(seed, k + 80) * 9 * heft, z: tz + Math.sin(a) * r,
          size: 5 + hash01(seed, k + 100) * 5 * heft,
          grow: 1, now, life: 0.55 + hash01(seed, k + 120) * 0.35,
          
          
          rise: -7 - hash01(seed, k + 140) * 6,
          lean: 0.2,
          spin: (hash01(seed, k + 160) - 0.5) * 12,
          peak: 0.85,
          col: g.tint,
        });
      }
    }
  }

  function dispose() {
    for (const L of [layer.ground, layer.air, layer.glow]) {
      if (scene) scene.remove(L.mesh);
      if (L.mesh.dispose) L.mesh.dispose();
      if (L.geo.dispose) L.geo.dispose();
    }
    for (const mat of materials) if (mat.dispose) mat.dispose();
    if (tex && tex.dispose) tex.dispose();
  }

  return {
    frame,
    shots,
    flips,
    reset,
    dispose,
    
    setQuality(v) { q = Math.max(0, Math.min(1, Number(v) || 0)); return q; },
    get quality() { return q; },
    

    wind,
    

    meshes: {
      get ground() { return layer.ground.mesh; },
      get air() { return layer.air.mesh; },
      get glow() { return layer.glow.mesh; },
    },
    








    counts() {
      return {
        dust: stats.dust,
        smoke: stats.smoke,
        debris: stats.debris,
        motes: stats.mote,
        shore: stats.shore,
        ground: layer.ground.n,
        air: layer.air.n,
        glow: layer.glow.n,
        total: layer.ground.n + layer.air.n + layer.glow.n,
      };
    },
    
    shoreCells() { return shore; },
    
    installTimer(read) { stats.t0read = read; },
    
    lastFrameMs() { return stats.ms; },
  };
}
