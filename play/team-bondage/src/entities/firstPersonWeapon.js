// First-person weapon viewmodel - mounted to the camera as a child, so it
// always renders at the bottom-right of the screen no matter where the
// player looks.
//
// Graphics loop pass 3 (queue item 1, GRAPHICS_QUALITY_LOOP.md): the three
// viewmodels used to be 2-3 untextured primitives each. They are now built
// from the voxel part specs in viewmodelSpec.js -- wood grain + scratched
// metal canvas textures, a worn/polished cutting edge, and one unmistakable
// signature per weapon so you can tell what you're holding at 1/8th screen:
//   shovel  = wide spade blade + D-handle + poo pellet on the face
//   shotgun = TWO barrels + brass breech
//   rocket  = stepped red warhead + fins
//
// Per hand-drawn.md, texture offsets are jittered per part (deterministically)
// so no two wooden pieces show the same grain, and the rig breathes when idle.

import * as THREE from 'three';
import { makeWoodTexture, makeMetalTexture } from '../map/textures.js';
import { VIEWMODELS, VM_PALETTE, VM_TEXTURED } from './viewmodelSpec.js';

const REST_Z = -0.55;

export class FirstPersonWeapon {
  constructor(camera) {
    this.camera = camera;
    this.rig = new THREE.Group();
    this.rig.position.set(0.35, -0.30, REST_Z);   // bottom-right of the frame
    this.camera.add(this.rig);

    const tex = buildTextureLibrary();
    this._models = {};
    for (const [id, spec] of Object.entries(VIEWMODELS)) {
      const m = buildModel(spec, tex);
      m.visible = false;
      this._models[id] = m;
      this.rig.add(m);
    }
    this.setWeapon('shovel');

    this._recoilT = 0;
    this._t = 0;
  }

  setWeapon(id) {
    const key = this._models[id] ? id : 'shovel';
    for (const [k, m] of Object.entries(this._models)) m.visible = (k === key);
    this._current = this._models[key];
  }

  // Play a small recoil kick (called from game.js when we fire).
  kick() { this._recoilT = 0.15; }

  update(dt) {
    this._t += dt;
    // Idle breath: the rig drifts a few millimetres so the weapon reads as
    // held, not welded to the camera (silhouette-readability.md motion test).
    const bobY = Math.sin(this._t * 1.6) * 0.006;
    const bobX = Math.sin(this._t * 1.1) * 0.004;
    const sway = Math.sin(this._t * 0.9) * 0.012;

    // Recoil back-and-forward: quick pull-back, slower return.
    if (this._recoilT > 0) {
      this._recoilT -= dt;
      const k = Math.max(0, this._recoilT / 0.15);
      this.rig.position.z = REST_Z + k * 0.18;
      this.rig.rotation.x = -k * 0.35 + bobY;
    } else {
      this.rig.position.z = REST_Z;
      this.rig.rotation.x = bobY;
    }
    this.rig.position.x = 0.35 + bobX;
    this.rig.position.y = -0.30 + bobY;
    this.rig.rotation.z = sway * 0.5;
  }
}

// -- Build -----------------------------------------------------------------

function buildTextureLibrary() {
  // Guard: the viewmodel is only ever constructed in the browser, but keep
  // the module importable in node-ish contexts (tests import the spec, not
  // this, but a stray import shouldn't explode).
  if (typeof document === 'undefined') return {};
  return { wood: makeWoodTexture(), metal: makeMetalTexture() };
}

// Deterministic PRNG so a given part always gets the same grain offset --
// the wobble is authored, not random-per-load.
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
    return new THREE.MeshLambertMaterial({ color: VM_PALETTE[part.mat], flatShading: true });
  }

  // Clone so each part can carry its own grain scale + offset (shared image,
  // so this costs nothing on the GPU).
  const map = base.clone();
  map.needsUpdate = true;
  const longest = part.size ? Math.max(...part.size) : 0.1;
  const rep = Math.max(1, Math.round(longest / 0.12));
  map.repeat.set(rep, rep);
  map.offset.set(rng(), rng());
  // `tint` multiplies the texture DOWN toward the palette colour; `emissive`
  // lifts the one material (metalLite) that has to end up brighter than the
  // texture itself. See the note on VM_TEXTURED in viewmodelSpec.js.
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
