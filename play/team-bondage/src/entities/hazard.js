







import * as THREE from 'three';
import {
  HAZARDS, HZ_PALETTE, HZ_TEXTURED, LABEL_REPEAT, LABEL_UV_OFFSET,
} from './hazardSpec.js';
import {
  makeEggshellTexture, makeBottleGlassTexture, makeMilkLabelTexture,
  makeMetalTexture,
} from '../map/textures.js';
import { BASELINE_SIZE } from '../../../../web-engine/procgen/voxelWorldGen.js';

export const HAZARD_KINDS = ['egg', 'milk'];
const SPAWN_HEIGHT = 22;      
const GROUND_Y = 1;           
const FALL_TIME = 2.0;        
const SPLASH_RADIUS = 2.2;    
const SPLASH_DAMAGE = 20;
const EXPLOSION_LIFE_SEC = 0.65;

export class HazardSystem {
  constructor(scene, grid, opts = {}) {
    this.scene = scene;
    this.grid = grid;
    this.active = [];   
    this.opts = { intervalMs: [3000, 6000], batch: [2, 3], ...opts };
    const tex = buildHazardTextures();
    this._egg  = buildHazardModel(HAZARDS.egg, tex);
    this._milk = buildHazardModel(HAZARDS.milk, tex);
    this._spawnSeq = 0;
  }

  update(dt, nowMs) {
    for (const h of this.active) {
      if (h.done) continue;
      const t = Math.min(1, (nowMs - h.spawnAt) / (h.landAt - h.spawnAt));
      const y = SPAWN_HEIGHT + (GROUND_Y - SPAWN_HEIGHT) * t;
      h.mesh.position.set(h.x, y, h.z);
      
      const s = 0.5 + t * 0.6;
      h.shadow.scale.set(s, s, s);
      h.shadow.material.opacity = 0.15 + t * 0.55;
      
      
      
      h.mesh.rotation.x = h.spin.x0 + t * h.spin.x;
      h.mesh.rotation.y = h.spin.y0 + t * h.spin.y;
      h.mesh.rotation.z = h.spin.z0 + t * h.spin.z;
      if (nowMs >= h.landAt) {
        h.done = true;
        h.impactPoint = new THREE.Vector3(h.x, GROUND_Y, h.z);
        this._splashDecal(h);
        this._spawnExplosion(h);
        setTimeout(() => this._despawn(h), 800);
      }
    }
    
    const nowSec = nowMs / 1000;
    this._explosions = (this._explosions || []).filter((ex) => {
      const t = (nowSec - ex.bornAt) / EXPLOSION_LIFE_SEC;
      if (t >= 1) { this.scene.remove(ex.mesh); return false; }
      if (ex.shard) {
        
        const d = ex.mesh.userData;
        ex.mesh.position.x += d.vx * dt;
        ex.mesh.position.z += d.vz * dt;
        d.vy -= 9.8 * dt;
        ex.mesh.position.y += d.vy * dt;
        ex.mesh.material.opacity = (1 - t) * 0.9;
      } else {
        
        const s = 0.4 + t * 3.4;
        ex.mesh.scale.set(s, s, s);
        ex.mesh.material.opacity = (1 - t) * 0.85;
      }
      return true;
    });
    this.active = this.active.filter((h) => h.mesh.parent !== null || !h.done);
  }

  _spawnExplosion(h) {
    
    
    
    
    
    const color = h.kind === 'egg' ? 0xf5e9c5 : 0xffe6ec;
    const ejecta = h.kind === 'egg' ? HZ_PALETTE.yolk : HZ_PALETTE.milk;
    const geo = new THREE.SphereGeometry(0.4, 12, 10);
    const mat = new THREE.MeshBasicMaterial({
      color, transparent: true, opacity: 0.85,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(h.x, GROUND_Y + 0.3, h.z);
    this.scene.add(mesh);
    if (!this._explosions) this._explosions = [];
    this._explosions.push({ mesh, bornAt: performance.now() / 1000 });

    
    for (let i = 0; i < 10; i++) {
      const shard = new THREE.Mesh(
        new THREE.BoxGeometry(0.10, 0.10, 0.10),
        new THREE.MeshBasicMaterial({ color: ejecta, transparent: true, opacity: 0.9 }),
      );
      shard.position.set(h.x, GROUND_Y + 0.2, h.z);
      const ang = (i / 10) * Math.PI * 2;
      shard.userData = {
        vx: Math.cos(ang) * (2 + Math.random() * 2),
        vy: 3 + Math.random() * 2,
        vz: Math.sin(ang) * (2 + Math.random() * 2),
        bornAt: performance.now() / 1000,
      };
      this.scene.add(shard);
      this._explosions.push({ mesh: shard, bornAt: performance.now() / 1000, shard: true });
    }
  }

  
  
  consumeHitsFor(playerPos) {
    const hits = [];
    for (const h of this.active) {
      if (!h.done || h._hitConsumed || !h.impactPoint) continue;
      const dx = playerPos.x - h.impactPoint.x;
      const dz = playerPos.z - h.impactPoint.z;
      const dy = playerPos.y - h.impactPoint.y;
      if (dx * dx + dz * dz + dy * dy * 0.25 <= SPLASH_RADIUS * SPLASH_RADIUS) {
        
        const d = Math.hypot(dx, dz);
        const falloff = 1 - Math.min(1, d / SPLASH_RADIUS) * 0.7;
        hits.push(Math.round(SPLASH_DAMAGE * falloff));
      }
      h._hitConsumed = true;
    }
    return hits;
  }

  
  spawn({ kind, x, z, spawnAt, landAt }) {
    const proto = kind === 'milk' ? this._milk : this._egg;
    const mesh = proto.clone();
    mesh.position.set(x, SPAWN_HEIGHT, z);
    this.scene.add(mesh);

    
    
    const base = (HAZARDS[kind] || HAZARDS.egg).spin;
    const r = seedRng((Math.round(x * 71) ^ Math.round(z * 131) ^ (this._spawnSeq++ * 2654435761)) >>> 0);
    const spin = {
      x0: r() * Math.PI * 2, y0: r() * Math.PI * 2, z0: r() * Math.PI * 2,
      x: base.x * (0.8 + r() * 0.45) * (r() > 0.5 ? 1 : -1),
      y: base.z * (0.4 + r() * 0.5) * (r() > 0.5 ? 1 : -1),
      z: base.z * (0.8 + r() * 0.45) * (r() > 0.5 ? 1 : -1),
    };

    
    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(SPLASH_RADIUS, 24),
      new THREE.MeshBasicMaterial({
        color: 0xff4a3a, transparent: true, opacity: 0.15,
        depthWrite: false, side: THREE.DoubleSide,
      }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.set(x, GROUND_Y + 0.01, z);
    this.scene.add(shadow);

    this.active.push({
      kind, x, z, spawnAt, landAt, mesh, shadow, spin, done: false,
    });
  }

  _splashDecal(h) {
    
    h.shadow.material.color.setHex(h.kind === 'egg' ? HZ_PALETTE.yolk : HZ_PALETTE.milk);
    h.shadow.material.opacity = 0.75;
  }

  _despawn(h) {
    this.scene.remove(h.mesh);
    this.scene.remove(h.shadow);
  }
}










function seedRng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) / 4294967296);
  };
}

function buildHazardTextures() {
  
  
  
  if (typeof document === 'undefined') return {};
  return {
    eggshell:  makeEggshellTexture(),
    glass:     makeBottleGlassTexture(),
    milkLabel: makeMilkLabelTexture(LABEL_REPEAT),
    metal:     makeMetalTexture(),
  };
}



export function buildHazardMesh(kind) {
  const spec = HAZARDS[kind] || HAZARDS.egg;
  return buildHazardModel(spec, buildHazardTextures());
}

function buildHazardModel(spec, tex) {
  const g = new THREE.Group();
  const rng = seedRng(hashString(spec.signature));
  for (const part of spec.parts) {
    const mesh = new THREE.Mesh(buildGeometry(part), buildMaterial(part, tex, rng));
    mesh.position.set(part.pos[0], part.pos[1], part.pos[2]);
    if (part.rot) mesh.rotation.set(part.rot[0], part.rot[1], part.rot[2]);
    mesh.castShadow = false;
    g.add(mesh);
  }
  g.scale.setScalar(spec.scale || 1);
  return g;
}

function buildGeometry(part) {
  if (part.kind === 'blob') return new THREE.IcosahedronGeometry(part.r, 0);
  if (part.kind === 'cyl') return new THREE.CylinderGeometry(part.r, part.r, part.h, part.seg);
  return new THREE.BoxGeometry(part.size[0], part.size[1], part.size[2]);
}

function buildMaterial(part, tex, rng) {
  const skin = HZ_TEXTURED[part.mat];
  const base = skin && tex[skin.tex];
  if (!base) {
    return new THREE.MeshLambertMaterial({ color: HZ_PALETTE[part.mat], flatShading: true });
  }
  const map = base.clone();
  map.needsUpdate = true;
  if (skin.tex === 'milkLabel') {
    
    
    
    map.repeat.set(1, 1);
    map.offset.set(LABEL_UV_OFFSET, 0);
  } else if (part.kind === 'cyl') {
    
    
    map.repeat.set(1, 1);
    map.offset.set(0, rng() * 0.2);
  } else {
    
    
    const longest = part.size ? Math.max(...part.size) : part.r * 2;
    const rep = Math.max(1, Math.round(longest / 0.2));
    map.repeat.set(rep, rep);
    map.offset.set(rng(), rng());
  }
  return new THREE.MeshLambertMaterial({
    map,
    color: skin.tint,
    emissive: skin.emissive || 0x000000,
    flatShading: true,
  });
}

function hashString(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}





export function makeHostSchedule(worldSize, rng, nowMs) {
  
  
  
  
  const per64 = rng.rangeI(2, 3);
  const count = Math.max(1, Math.round(
    per64 * (worldSize.x * worldSize.z) / (BASELINE_SIZE * BASELINE_SIZE)));
  const items = [];
  for (let i = 0; i < count; i++) {
    
    const spawnAt = nowMs + rng.rangeI(0, 600);
    items.push({
      kind: rng.chance(0.5) ? 'egg' : 'milk',
      x: rng.rangeF(2, worldSize.x - 2),
      z: rng.rangeF(2, worldSize.z - 2),
      spawnAt,
      landAt: spawnAt + Math.round(FALL_TIME * 1000),
    });
  }
  return items;
}
