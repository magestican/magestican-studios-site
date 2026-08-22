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
function glowRing(hex) {
  const ring = new THREE.Mesh(
    new THREE.RingGeometry(0.8, 1.1, 24),
    new THREE.MeshBasicMaterial({
      color: hex, transparent: true, opacity: 0.55, side: THREE.DoubleSide,
    }),
  );
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = -0.55;
  return ring;
}

// THE PROTEIN SHAKE.
//
// 1.15 m tall, which is ~80 px at the 10 m readability bar (703/d px per metre
// — see silhouette-readability.md). Read in order of what carries identity:
//   silhouette — a tall column with a STEPPED shoulder and a cap nub sticking
//     out one side. Nothing else in the game is a vertical column; the chicken
//     is wide, the steak is flat, the cheese is round.
//   value      — one dark band across the middle of a pale cup, so the shaker
//     does not read as one continuous pale blob at distance.
//   colour     — berry pink, the only pink in the palette.
// The taper is three boxes each narrower than the last, not a cone: a smooth
// cone reads as plastic (the shotgun-barrel lesson, same doc).
function buildProteinShakeMesh() {
  const g = new THREE.Group();
  const CREAM = 0xefe6d2, CREAM_DK = 0xcfc2a6, BERRY = 0xff5fa2, BERRY_DK = 0xc93c78;
  const BAND = 0x33405a;

  g.add(box(0.54, 0.10, 0.54, CREAM_DK, 0, 0.05, 0));      // wide foot: it STANDS
  g.add(box(0.46, 0.52, 0.46, CREAM,    0, 0.36, 0));      // cup
  g.add(box(0.50, 0.09, 0.50, BAND,     0, 0.44, 0));      // measuring band
  g.add(box(0.40, 0.14, 0.40, CREAM,    0, 0.69, 0));      // shoulder, step 1
  g.add(box(0.34, 0.10, 0.34, CREAM_DK, 0, 0.81, 0));      // shoulder, step 2
  g.add(box(0.36, 0.18, 0.36, BERRY,    0, 0.95, 0));      // screw lid
  // The signature: a flip cap standing proud of the lid on ONE side. It is the
  // only asymmetric thing on the model, so it is also what makes the spin read
  // as a spin rather than as a still object.
  g.add(box(0.15, 0.12, 0.20, BERRY_DK, 0, 1.09, 0.13));
  g.add(glowRing(BERRY));
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
  const RIND = 0xe8a33d, PASTE = 0xf7e07a, HOLE = 0xb07d1f;

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
    for (const [hx, hz, r] of [[0.10, 0.14, 0.10], [-0.14, -0.04, 0.13], [0.06, -0.20, 0.08]]) {
      wheel.add(box(r, 0.06, r, HOLE, hx, face * 0.185, hz));
    }
  }

  // Stand it on edge (axis -> Z), then lean it back so it never goes flat-on.
  wheel.rotation.x = Math.PI / 2;
  wheel.rotation.z = 0.22;
  g.add(wheel);
  g.add(glowRing(RIND));
  return g;
}

export { buildProteinShakeMesh, buildCheeseWheelMesh };
