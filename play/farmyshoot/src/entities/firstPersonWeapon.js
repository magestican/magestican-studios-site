















import * as THREE from 'three';
import { makeWoodTexture, makeMetalTexture } from '../map/textures.js';
import {
  VIEWMODELS, VM_PALETTE, VM_TEXTURED, VM_EMISSIVE, DEFAULT_VIEWMODEL,
  muzzleFor, recoilFor, recoilPhase, recoilDuration,
} from './viewmodelSpec.js';

const REST_Z = -0.55;
const REST_X = 0.35;
const REST_Y = -0.30;

export class FirstPersonWeapon {
  constructor(camera) {
    this.camera = camera;
    this.rig = new THREE.Group();
    this.rig.position.set(0.35, -0.30, REST_Z);   
    this.camera.add(this.rig);

    const tex = buildTextureLibrary();
    this._models = {};
    this._muzzles = {};
    for (const [id, spec] of Object.entries(VIEWMODELS)) {
      const m = buildModel(spec, tex);
      m.visible = false;
      this._models[id] = m;
      this.rig.add(m);
      
      
      
      
      
      
      
      const anchor = new THREE.Object3D();
      anchor.position.fromArray(muzzleFor(id));
      m.add(anchor);
      this._muzzles[id] = anchor;
      
      
      
      
      
      const flash = buildFlash(recoilFor(id).flash);
      if (flash) { anchor.add(flash); this._flashes = this._flashes || {}; this._flashes[id] = flash; }
    }
    this.setWeapon('shovel');

    this._recoilAge = Infinity;   
    this._flashT = 0;
    this._t = 0;
  }

  
  
  
  
  
  
  
  muzzleWorld(out = new THREE.Vector3()) {
    const anchor = this._muzzles[this._currentId];
    if (!anchor) return null;
    this.camera.updateMatrixWorld(true);
    return anchor.getWorldPosition(out);
  }

  
  
  
  
  
  
  setWeapon(id) {
    let key = id;
    if (!this._models[key]) {
      console.warn(`[viewmodel] no model "${id}" -- showing the ${DEFAULT_VIEWMODEL}. `
                 + `Known: ${Object.keys(this._models).join(', ')}.`);
      key = DEFAULT_VIEWMODEL;
    }
    for (const [k, m] of Object.entries(this._models)) m.visible = (k === key);
    this._current = this._models[key];
    this._currentId = key;
  }

  
  currentWeapon() { return this._currentId; }

  
  
  
  
  
  kick() {
    this._recoilAge = 0;
    this._flashT = FLASH_SECONDS;
  }

  update(dt) {
    this._t += dt;
    
    
    const bobY = Math.sin(this._t * 1.6) * 0.006;
    const bobX = Math.sin(this._t * 1.1) * 0.004;
    const sway = Math.sin(this._t * 0.9) * 0.012;

    
    
    
    
    
    
    const r = recoilFor(this._currentId);
    let k = 0;
    if (this._recoilAge < recoilDuration(this._currentId)) {
      this._recoilAge += dt;
      k = recoilPhase(this._recoilAge, r);
    }

    this.rig.position.x = REST_X + bobX + k * r.roll * 0.12;
    this.rig.position.y = REST_Y + bobY + k * r.pitch * 0.06;
    this.rig.position.z = REST_Z + k * r.back;
    this.rig.rotation.x = bobY - k * r.pitch;
    this.rig.rotation.z = sway * 0.5 + k * r.roll;

    
    
    if (this._flashT > 0) {
      this._flashT -= dt;
      const f = this._flashes?.[this._currentId];
      if (f) {
        const a = Math.max(0, this._flashT / FLASH_SECONDS);
        f.visible = true;
        f.material.opacity = a;
        f.scale.setScalar(0.6 + a * 0.7);
        f.rotation.z = this._flashSpin ??= 0;
      }
    } else if (this._flashes) {
      for (const f of Object.values(this._flashes)) f.visible = false;
    }
  }
}







const FLASH_SECONDS = 0.045;




















function buildFlash(radius) {
  if (!radius || typeof document === 'undefined') return null;
  const mat = new THREE.MeshBasicMaterial({
    color: 0xf6f1e6, transparent: true, opacity: 0, depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const g = new THREE.Group();

  
  g.add(new THREE.Mesh(new THREE.IcosahedronGeometry(radius * 0.55, 0), mat));

  
  
  
  const spike = new THREE.BoxGeometry(radius * 0.24, radius * 1.9, radius * 0.24);
  for (let i = 0; i < 4; i++) {
    const s = new THREE.Mesh(spike, mat);
    s.rotation.z = (i / 4) * Math.PI * 2 + Math.PI / 8;
    g.add(s);
  }
  
  
  const nose = new THREE.Mesh(
    new THREE.BoxGeometry(radius * 0.30, radius * 0.30, radius * 1.5), mat);
  nose.position.z = -radius * 0.5;
  g.add(nose);

  g.visible = false;
  g.material = mat;      
  return g;
}

function buildTextureLibrary() {
  
  
  
  if (typeof document === 'undefined') return {};
  return { wood: makeWoodTexture(), metal: makeMetalTexture() };
}



function seedRng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return ((s >>> 0) / 4294967296);
  };
}

function buildModel(spec, tex) {
  const g = new THREE.Group();
  const rng = seedRng(hashString(spec.signature));

  for (const part of spec.parts) {
    const mesh = new THREE.Mesh(buildGeometry(part), buildMaterial(part, tex, rng));
    mesh.position.set(part.pos[0], part.pos[1], part.pos[2]);
    if (part.rot) mesh.rotation.set(part.rot[0], part.rot[1], part.rot[2]);
    g.add(mesh);
  }

  const { pos, rot, scale } = spec.pose;
  g.position.set(pos[0], pos[1], pos[2]);
  g.rotation.set(rot[0], rot[1], rot[2]);
  g.scale.setScalar(scale);
  return g;
}

function buildGeometry(part) {
  if (part.kind === 'blob') return new THREE.IcosahedronGeometry(part.r, 0);
  return new THREE.BoxGeometry(part.size[0], part.size[1], part.size[2]);
}

function buildMaterial(part, tex, rng) {
  const skin = VM_TEXTURED[part.mat];
  const base = skin && tex[skin.tex];
  if (!base) {
    
    
    
    return new THREE.MeshLambertMaterial({
      color: VM_PALETTE[part.mat],
      emissive: VM_EMISSIVE[part.mat] || 0x000000,
      flatShading: true,
    });
  }

  
  
  const map = base.clone();
  map.needsUpdate = true;
  const longest = part.size ? Math.max(...part.size) : 0.1;
  const rep = Math.max(1, Math.round(longest / 0.12));
  map.repeat.set(rep, rep);
  map.offset.set(rng(), rng());
  
  
  
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
