// Ambient life. Right now that means the arctic map's penguins.
//
// Bryan asked for "another set in the artic with penguins looking at you", and
// the *looking at you* is the whole feature. They do not patrol, they are not
// shootable, they take no damage and they never move from where worldgen put
// them. All they do is stand in loose colonies and slowly turn their heads to
// track whoever is nearest — which is a great deal more unsettling than if
// they wandered around, and costs one yaw assignment per bird per frame.
//
// They are placed by voxelWorldGen's placeAmbient(), which runs after the
// whole world is built, so a penguin is never standing inside a pressure ridge
// or an igloo wall.
//
// # PLACEHOLDER ART — procedural boxes, due a hand-drawn pass.

import * as THREE from 'three';
import { PENGUIN, TURN_RATE, BOB, LOOK_RANGE, HUDDLE_TILT } from './ambientCrittersSpec.js';

export class AmbientCritters {
  // spots: [{x, y, z}] in world coordinates; cfg is the map's `ambient` entry.
  constructor(scene, spots, cfg = {}) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'ambientCritters';
    scene.add(this.group);

    // One geometry + material set shared by every bird. Twenty-six penguins of
    // eight boxes each is 208 meshes; sharing keeps it to eight materials.
    const mats = new Map();
    const matFor = (hex) => {
      if (!mats.has(hex)) {
        mats.set(hex, new THREE.MeshLambertMaterial({
          color: new THREE.Color(hex), flatShading: true,
        }));
      }
      return mats.get(hex);
    };

    // Deterministic per-colony variation. Seeded, not Math.random, so two
    // peers looking at the same colony see the same birds — they are cosmetic,
    // but "the same map" should mean the same map.
    let seed = 0x9E3779B9;
    const rnd = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000; };

    this.birds = [];
    for (const spot of spots) {
      const bird = new THREE.Group();
      const scale = PENGUIN.scale * (0.82 + rnd() * 0.36);   // adults and chicks
      for (const part of PENGUIN.parts) {
        const [x, y, z, w, h, d] = part.p;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matFor(part.hex));
        mesh.position.set(x, y, z);
        if (part.tilt) mesh.rotation.x = part.tilt;
        bird.add(mesh);
      }
      bird.position.set(spot.x, spot.y, spot.z);
      bird.scale.setScalar(scale);
      // Start facing a random way. The turn toward the player is what should
      // be noticeable, and it is only noticeable if they were facing elsewhere.
      bird.rotation.y = rnd() * Math.PI * 2;
      this.group.add(bird);
      this.birds.push({
        obj: bird,
        // Each bird bobs on its own phase — a colony breathing in unison is
        // one animation played twenty-six times.
        phase: rnd() * Math.PI * 2,
        baseY: spot.y,
        lean: (rnd() - 0.5) * HUDDLE_TILT,
      });
    }
    void cfg;
    this._t = 0;
  }

  update(dt, camPos) {
    if (!camPos) return;
    this._t += dt;
    for (const b of this.birds) {
      const dx = camPos.x - b.obj.position.x;
      const dz = camPos.z - b.obj.position.z;
      const dist2 = dx * dx + dz * dz;
      if (dist2 < LOOK_RANGE * LOOK_RANGE) {
        // Turn toward the player, but SLOWLY. A penguin that snaps round is a
        // turret; one that takes a second and a half about it is watching you.
        const want = Math.atan2(dx, dz);
        let delta = want - b.obj.rotation.y;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        b.obj.rotation.y += Math.max(-TURN_RATE * dt, Math.min(TURN_RATE * dt, delta));
      }
      // Slow shuffle-bob, and a permanent slight lean, because a colony of
      // perfectly upright identical birds reads as bollards.
      b.obj.position.y = b.baseY + Math.sin(this._t * BOB.hz * Math.PI * 2 + b.phase) * BOB.amplitude;
      b.obj.rotation.z = b.lean;
    }
  }

  dispose() {
    this.scene.remove(this.group);
    this.group.traverse((o) => {
      o.geometry?.dispose?.();
      if (!Array.isArray(o.material)) o.material?.dispose?.();
    });
  }
}
