// The two power-up pickups: a protein shake on the gym deck, a cheese wheel
// on the dairy deck.
//
// Host-authoritative, exactly like ChickenPickup:
//   * each spawns on its own zone's dais 3 s after boot, then every 30 s
//   * the first player within PICKUP_RADIUS takes it -> host broadcasts
//     POWERUP_PICK -> every peer hides the mesh, and the named peer starts a
//     20-second effect (powerUpSpec.js owns what the effect IS)
//
// The meshes are built here rather than loaded, for the same reason the
// chicken and the steaks are: they have to be on screen on the first frame on
// a hotel Wi-Fi Chromebook. Both follow art/knowledge/styles/voxel.md — chunky
// boxes, flat shading, five materials or fewer — and each carries a silhouette
// signature nothing else in the game shares (see the table in
// art/knowledge/craft/silhouette-readability.md):
//
//   protein shake — tall tapered shaker + flip-cap nub off the lid
//   cheese wheel  — a disc with a WEDGE MISSING, plus its eye holes
//
// Preview harness: art/preview/powerups.html.

import * as THREE from 'three';
import { POWER_UPS } from './powerUpSpec.js';

const RESPAWN_MS = 30_000;     // same clock as the chicken slingshot
const PICKUP_RADIUS = 1.6;
const FIRST_SPAWN_MS = 3_000;
const FLOAT_ABOVE_DECK = 1.2;  // the chicken's offset, so the two read alike

export class PowerUpPickups {
  constructor(scene, spawns, opts = {}) {
    this.scene = scene;
    this.onPickup = opts.onPickup || (() => {});
    this.items = new Map();
    this._bobT = 0;
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    for (const id of Object.keys(POWER_UPS)) {
      const at = spawns?.[id];
      if (!at) continue;
      const mesh = id === 'protein-shake' ? buildProteinShakeMesh() : buildCheeseWheelMesh();
      mesh.position.set(at.x, at.y + FLOAT_ABOVE_DECK, at.z);
      mesh.visible = false;
      scene.add(mesh);
      this.items.set(id, {
        id, mesh, at: { ...at },
        available: false,
        nextSpawnAt: now + FIRST_SPAWN_MS,
      });
    }
  }

  update(dt, hostPlayers) {
    this._bobT += dt;
    const now = performance.now();
    let phase = 0;
    for (const it of this.items.values()) {
      if (it.mesh.visible) {
        // Bob + spin, offset per item so the two pickups are never in step —
        // two landmarks pulsing on the same frame read as one UI effect.
        it.mesh.position.y = it.at.y + FLOAT_ABOVE_DECK
          + Math.sin(this._bobT * 2.6 + phase) * 0.22;
        it.mesh.rotation.y += dt * 1.2;
      }
      phase += 1.7;
      if (!it.available && now >= it.nextSpawnAt) {
        it.available = true;
        it.mesh.visible = true;
      }
      if (it.available && hostPlayers) {
        for (const p of hostPlayers) {
          if (Math.hypot(p.pos.x - it.at.x, p.pos.z - it.at.z) < PICKUP_RADIUS) {
            this.markTaken(it.id, now + RESPAWN_MS);
            this.onPickup(it.id, p.peerId);
            break;
          }
        }
      }
    }
  }

  // Hide + reschedule. Called on the host when it resolves a pickup and on
  // every peer when POWERUP_PICK arrives, so the world agrees about what is
  // still standing on the deck.
  markTaken(id, nextSpawnAt) {
    const it = this.items.get(id);
    if (!it) return false;
    it.available = false;
    it.mesh.visible = false;
    it.nextSpawnAt = nextSpawnAt;
    return true;
  }

  isAvailable(id) { return this.items.get(id)?.available === true; }
  position(id) { return this.items.get(id)?.at ?? null; }
  nextSpawnAt(id) { return this.items.get(id)?.nextSpawnAt ?? 0; }
}

// ---------------------------------------------------------------------------
// Voxel art
// ---------------------------------------------------------------------------

const lambert = (hex, emissive) => new THREE.MeshLambertMaterial({
  color: hex, flatShading: true, ...(emissive ? { emissive } : {}),
});

function box(w, h, d, hex, x, y, z, emissive) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lambert(hex, emissive));
  m.position.set(x, y, z);
  return m;
}

// A glow disc at the pickup's feet, in its own tint. Every pickup in the game
// has one; it is what says "this is a thing you collect" before you can make
// out what the thing is.
function glowRing(hex, y) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1.1, 24),
    new THREE.MeshBasicMaterial({
      color: hex, transparent: true, opacity: 0.55, side: THREE.DoubleSide,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  // At the model's OWN feet, which is a different number for a bottle standing
  // on its base and a wheel standing on its rim. A ring floating in the gap
  // under an object is the goose's "body that does not touch its own feet"
  // failure with a halo instead of legs.
  ring.position.y = y;
  return ring;
}

// THE PROTEIN SHAKE.
//
// 1.14 m tall, which is ~80 px at the 10 m readability bar (703/d px per metre
// — see silhouette-readability.md).
//
// The first cut of this model tapered from a narrow cup through two shoulder
// steps to a small lid, and in silhouette it was a CHESS PAWN. A monotonic
// taper is a pawn; what makes a bottle a bottle is the WAIST — a wide body,
// then a step IN at the neck, then a step back OUT for the screw cap. So the
// profile is body > neck < cap, and the flip spout on top of the cap is the
// one asymmetric part, which is also what makes the spin read as a spin.
//
// Read in order of what carries identity:
//   silhouette — wide-waisted bottle with a spout. Nothing else in the game is
//     a vertical column at all; the chicken is wide, the steak is flat, the
//     cheese is round.
//   value      — a FILL LINE. The bottom two thirds are strawberry shake and
//     the top third is the empty cup above it, which is a hard horizontal
//     value break two thirds of the way up a column. The first cut used a
//     dark grip band on an all-cream body and the whole shaker came back grey
//     against a pale blue sky, with the cap doing all the work.
//   colour     — berry pink, the only pink anywhere in the game.
function buildProteinShakeMesh() {
  const g = new THREE.Group();
  const CREAM = 0xf7f0e0, CREAM_DK = 0xcdc0a4;
  const SHAKE = 0xf2789f, BERRY = 0xff5fa2, BERRY_DK = 0xa8265c;

  g.add(box(0.60, 0.08, 0.60, BERRY_DK, 0, 0.04, 0));      // wide foot: it STANDS
  g.add(box(0.56, 0.44, 0.56, SHAKE,    0, 0.30, 0));      // what is IN it
  g.add(box(0.56, 0.24, 0.56, CREAM,    0, 0.64, 0));      // ...and the cup above it
  g.add(box(0.42, 0.11, 0.42, CREAM_DK, 0, 0.81, 0));      // the WAIST — step IN
  g.add(box(0.58, 0.20, 0.58, BERRY,    0, 0.97, 0));      // screw cap — step OUT
  // The signature: a flip spout standing proud of the cap on ONE side. It is
  // the only asymmetric part, so it is also what makes the spin read as a spin
  // rather than as a still object.
  g.add(box(0.20, 0.15, 0.24, BERRY_DK, 0, 1.12, 0.15));
  g.add(glowRing(BERRY, 0.01));
  return g;
}

// THE CHEESE WHEEL.
//
// Stood on edge and leaned back, not laid flat: a wheel lying face-up is a
// thin bar seen from a standing player's eye line, and this pickup floats at
// roughly head height over its deck. Leaning it means it is never perfectly
// edge-on as it turns.
//
// The signature is the MISSING WEDGE. `thetaLength` cuts a 79-degree slice out
// of the disc, and three's cylinder caps the cut, so the notch is a real hole
// in the outline rather than a dark patch painted on a circle — it survives
// the silhouette test, which a painted-on wedge would not. The eye holes are
// the second read, at about 5 m.
function buildCheeseWheelMesh() {
  const g = new THREE.Group();
  const wheel = new THREE.Group();
  // The rind is pushed WARM and DARK and the paste PALE, because the first cut
  // had them four values apart and at 10 m the wheel came back as one flat
  // ochre disc with no rim on it. Value pattern is the second thing that
  // carries identity after silhouette, and it is the only thing telling you
  // this is a cheese and not a coin.
  const RIND = 0xd4801f, PASTE = 0xffef9e, HOLE = 0x8a5c12;

  const SEG = 10;
  const CUT = Math.PI * 2 * 0.78;   // 78% of the circle: a 79-degree wedge gone

  // Rind: the outer edge you see around the circumference.
  const rind = new THREE.Mesh(
    new THREE.CylinderGeometry(0.52, 0.52, 0.34, SEG, 1, false, 0, CUT),
    lambert(RIND),
  );
  // Paste: a hair narrower so the rind rings it, a hair longer so the pale
  // face — not the gold edge — is what you see head-on.
  const paste = new THREE.Mesh(
    new THREE.CylinderGeometry(0.47, 0.47, 0.37, SEG, 1, false, 0, CUT),
    lambert(PASTE),
  );
  wheel.add(rind, paste);

  // Eye holes, sunk into both pale faces. The cylinder's axis is local Y, so
  // its flat faces are the y = +/-0.185 planes and the holes are thin in Y —
  // placing them on +/-Z (the obvious guess) puts them on the RIM, where they
  // read as chipped paint. Three of them, at different sizes and off the
  // centre line: evenly spaced same-size holes read as a dial, not as cheese.
  for (const face of [1, -1]) {
    for (const [hx, hz, r] of [[0.12, 0.16, 0.15], [-0.17, -0.05, 0.19], [0.07, -0.23, 0.12]]) {
      wheel.add(box(r, 0.06, r, HOLE, hx, face * 0.185, hz));
    }
  }

  // Stand it on edge (axis -> Z), then lean it back so it never goes flat-on.
  wheel.rotation.x = Math.PI / 2;
  wheel.rotation.z = 0.34;
  g.add(wheel);
  g.add(glowRing(RIND, -0.5));
  return g;
}

export { buildProteinShakeMesh, buildCheeseWheelMesh };
