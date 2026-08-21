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
import { speciesFor, TURN_RATE, BOB, LOOK_RANGE, HUDDLE_TILT, CHEER, CHEER_EVENTS }
  from './ambientCrittersSpec.js';

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

    // Which animal this map keeps. Each scenario gets the crowd its name
    // implies — penguins on the floe, geese on the farm.
    const species = speciesFor(cfg?.kind);

    this.birds = [];
    for (const spot of spots) {
      const bird = new THREE.Group();
      const scale = species.scale * (0.82 + rnd() * 0.36);   // adults and chicks
      const flippers = [];
      for (const part of species.parts) {
        const [x, y, z, w, h, d] = part.p;
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), matFor(part.hex));
        if (part.role === 'flipper' && part.pivot) {
          // A box rotates about its own centre, so swinging the flipper mesh
          // directly pivots it through the middle of the flipper and drives
          // half of it into the bird's chest. Hang it off a pivot group at the
          // SHOULDER instead and rotate that, which is where an arm bends.
          const [px, py, pz] = part.pivot;
          const pivot = new THREE.Group();
          pivot.position.set(px, py, pz);
          mesh.position.set(x - px, y - py, z - pz);
          if (part.tilt) mesh.rotation.x = part.tilt;
          pivot.add(mesh);
          bird.add(pivot);
          flippers.push({ obj: pivot, side: part.side ?? 1, restZ: pivot.rotation.z });
          continue;
        }
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
        flippers,
        // Cheer state. `cheerT` counts DOWN from duration once the wave
        // arrives; `cheerDelay` counts down until it does.
        cheerT: 0,
        cheerDelay: 0,
        cheerAmp: 0,
        // Per-bird flap rate + amplitude so neighbours starting on the same
        // frame still do not agree. See CHEER in the spec.
        flapHz: CHEER.flapHz + (rnd() - 0.5) * 2 * CHEER.flapJitter,
        ampScale: 1 + (rnd() - 0.5) * 2 * CHEER.amplitudeJitter,
        cheerYaw: null,
      });
    }
    this._t = 0;
  }

  // Set the colony cheering about something that happened at `atPos`.
  //
  // `kind` is a key of CHEER_EVENTS ('capture' | 'annihilation' | 'chicken' |
  // 'pickup' | 'kill'). The reaction is proportional, so the crowd works as a
  // scoreboard you can read from across the map without looking at the HUD.
  //
  // The cheer does not start everywhere at once: each bird's start is delayed
  // by its distance from the event over CHEER.waveSpeed, so the reaction
  // travels outward from whatever caused it the way a stadium does.
  cheer(atPos, kind = 'kill') {
    const intensity = CHEER_EVENTS[kind] ?? CHEER_EVENTS.kill;
    if (!atPos || intensity <= 0) return;
    for (const b of this.birds) {
      const dx = atPos.x - b.obj.position.x;
      const dz = atPos.z - b.obj.position.z;
      const dist = Math.hypot(dx, dz);
      const delay = dist / CHEER.waveSpeed;
      // A louder event overrides a quieter one already in progress; a quieter
      // one never interrupts a capture.
      if (b.cheerT > 0 && b.cheerAmp >= intensity) continue;
      b.cheerDelay = delay;
      b.cheerT = CHEER.duration;
      b.cheerAmp = intensity;
      // Cheering birds look at the thing they are cheering about.
      b.cheerYaw = Math.atan2(dx, dz);
    }
  }

  update(dt, camPos) {
    if (!camPos) return;
    this._t += dt;
    for (const b of this.birds) {
      // --- cheer state machine -------------------------------------------
      let cheering = 0;             // 0..1, this bird's current cheer strength
      if (b.cheerT > 0) {
        if (b.cheerDelay > 0) {
          b.cheerDelay -= dt;       // the wave has not reached this bird yet
        } else {
          b.cheerT -= dt;
          // Ease in fast, out slow, so the crowd swells and settles instead of
          // switching on and off.
          const f = Math.max(0, b.cheerT / CHEER.duration);
          cheering = Math.min(1, f * 1.6) * b.cheerAmp;
          if (b.cheerT <= 0) { b.cheerT = 0; b.cheerYaw = null; b.cheerAmp = 0; }
        }
      }

      // --- facing ----------------------------------------------------------
      // Cheering birds turn to the event, and turn FASTER than they track a
      // player: watching is a decision, reacting is a reflex.
      let want = null, rate = TURN_RATE;
      if (cheering > 0 && b.cheerYaw !== null) {
        want = b.cheerYaw; rate = CHEER.turnRate;
      } else {
        const dx = camPos.x - b.obj.position.x;
        const dz = camPos.z - b.obj.position.z;
        if (dx * dx + dz * dz < LOOK_RANGE * LOOK_RANGE) want = Math.atan2(dx, dz);
      }
      if (want !== null) {
        // Turn toward the target, but SLOWLY when idle. A penguin that snaps
        // round is a turret; one that takes a second and a half is watching.
        let delta = want - b.obj.rotation.y;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        b.obj.rotation.y += Math.max(-rate * dt, Math.min(rate * dt, delta));
      }

      // --- body ------------------------------------------------------------
      // Slow shuffle-bob, and a permanent slight lean, because a colony of
      // perfectly upright identical birds reads as bollards. A cheering bird
      // hops instead of shuffling, and straightens out of its huddle lean.
      const bob = Math.sin(this._t * BOB.hz * Math.PI * 2 + b.phase) * BOB.amplitude;
      if (cheering > 0) {
        const amp = cheering * b.ampScale;
        // abs(sin) so the bird leaves the ground and lands, rather than
        // sinking below it on the trough of the wave.
        const hop = Math.abs(Math.sin(this._t * CHEER.hopHz * Math.PI + b.phase))
                  * CHEER.hopHeight * amp;
        b.obj.position.y = b.baseY + hop;
        b.obj.rotation.z = b.lean * (1 - cheering);
        // Flippers up. Both swing outward from the shoulder, mirrored, so the
        // silhouette is the arms-overhead shape that reads as celebration at
        // any distance.
        //
        // The sign matters and the first cut had it backwards, which no test
        // caught because the value was non-zero and only a render shows a
        // DIRECTION: rotating about +Z carries a part at +X upward, so the
        // right flipper (side +1) wants a POSITIVE angle and the left a
        // negative one. Negating by side drove both wings down through the
        // bird's own body and the whole colony just stood there.
        const swing = (0.5 + 0.5 * Math.sin(this._t * b.flapHz * Math.PI * 2 + b.phase))
                    * CHEER.flipperSwing * amp;
        for (const f of b.flippers) f.obj.rotation.z = f.restZ + swing * f.side;
      } else {
        b.obj.position.y = b.baseY + bob;
        b.obj.rotation.z = b.lean;
        for (const f of b.flippers) f.obj.rotation.z = f.restZ;
      }
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
