// Voxel farm animals - cow, chicken, pig, sheep. Built from BoxGeometry cubes,
// no external assets. Each returns a THREE.Group whose local origin is at the
// character's feet so player.position === group.position works.
//
// # PLACEHOLDER ART - swap out for hand-drawn voxel models per
// docs/DESIGN_PRINCIPLES.md before release.

import * as THREE from 'three';

const cube = (w, h, d, hex) => {
  const mat = new THREE.MeshLambertMaterial({
    color: new THREE.Color(hex), flatShading: true,
  });
  const g = new THREE.BoxGeometry(w, h, d);
  return new THREE.Mesh(g, mat);
};

function pos(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }

// Each build returns { group, headBone } - headBone points at the head so we
// can tilt it with the mouse look for local players.
export function buildCharacter(kind, teamTintHex) {
  switch (kind) {
    case 'cow':     return buildCow(teamTintHex);
    case 'chicken': return buildChicken(teamTintHex);
    case 'pig':     return buildPig(teamTintHex);
    case 'sheep':   return buildSheep(teamTintHex);
    default:        return buildCow(teamTintHex);
  }
}

// Small teammate armband so red/blue is instantly readable.
function armband(hex) { return cube(0.55, 0.10, 0.55, hex); }

// ---- Cow -----------------------------------------------------------------

function buildCow(teamHex) {
  const g = new THREE.Group();
  // legs
  g.add(pos(cube(0.15, 0.5, 0.15, 0x1a1512),  0.20, 0.25,  0.35));
  g.add(pos(cube(0.15, 0.5, 0.15, 0x1a1512), -0.20, 0.25,  0.35));
  g.add(pos(cube(0.15, 0.5, 0.15, 0x1a1512),  0.20, 0.25, -0.35));
  g.add(pos(cube(0.15, 0.5, 0.15, 0x1a1512), -0.20, 0.25, -0.35));
  // body
  g.add(pos(cube(0.70, 0.55, 1.05, 0xf2ede2), 0, 0.80, 0));
  // black spots
  g.add(pos(cube(0.25, 0.20, 0.30, 0x1a1512), 0.36, 0.85, 0.10));
  g.add(pos(cube(0.30, 0.15, 0.25, 0x1a1512), -0.36, 0.70, -0.20));
  // head + horns
  const head = pos(cube(0.55, 0.55, 0.55, 0xf2ede2), 0, 1.00, 0.75);
  g.add(head);
  g.add(pos(cube(0.10, 0.20, 0.10, 0xffffff),  0.20, 1.30, 0.70));
  g.add(pos(cube(0.10, 0.20, 0.10, 0xffffff), -0.20, 1.30, 0.70));
  g.add(pos(cube(0.20, 0.10, 0.15, 0xff8fbc), 0, 0.87, 1.02));  // muzzle
  // armband
  g.add(pos(armband(teamHex), 0, 0.65, 0));
  return { group: g, headBone: head, eyeHeight: 1.3 };
}

// ---- Chicken -------------------------------------------------------------

function buildChicken(teamHex) {
  const g = new THREE.Group();
  g.add(pos(cube(0.10, 0.35, 0.10, 0xffcc55),  0.12, 0.18,  0));
  g.add(pos(cube(0.10, 0.35, 0.10, 0xffcc55), -0.12, 0.18,  0));
  g.add(pos(cube(0.55, 0.55, 0.75, 0xffffff), 0, 0.60, 0));
  // wings
  g.add(pos(cube(0.10, 0.30, 0.60, 0xefe9d8), 0.32, 0.60, 0));
  g.add(pos(cube(0.10, 0.30, 0.60, 0xefe9d8), -0.32, 0.60, 0));
  // head + comb + beak
  const head = pos(cube(0.40, 0.40, 0.40, 0xffffff), 0, 1.05, 0.30);
  g.add(head);
  g.add(pos(cube(0.10, 0.20, 0.35, 0xb73a2a), 0, 1.35, 0.28));  // comb
  g.add(pos(cube(0.10, 0.10, 0.25, 0xf4c95d), 0, 1.02, 0.60));  // beak
  g.add(pos(armband(teamHex), 0, 0.45, 0));
  return { group: g, headBone: head, eyeHeight: 1.3 };
}

// ---- Pig ------------------------------------------------------------------

function buildPig(teamHex) {
  const g = new THREE.Group();
  g.add(pos(cube(0.15, 0.4, 0.15, 0xd67c7c),  0.22, 0.20,  0.30));
  g.add(pos(cube(0.15, 0.4, 0.15, 0xd67c7c), -0.22, 0.20,  0.30));
  g.add(pos(cube(0.15, 0.4, 0.15, 0xd67c7c),  0.22, 0.20, -0.30));
  g.add(pos(cube(0.15, 0.4, 0.15, 0xd67c7c), -0.22, 0.20, -0.30));
  g.add(pos(cube(0.75, 0.60, 1.05, 0xf29a9a), 0, 0.70, 0));
  const head = pos(cube(0.55, 0.50, 0.50, 0xf29a9a), 0, 0.85, 0.75);
  g.add(head);
  g.add(pos(cube(0.30, 0.20, 0.15, 0xffc4c4), 0, 0.80, 1.02));   // snout
  g.add(pos(cube(0.08, 0.15, 0.08, 0xffc4c4),  0.15, 1.15, 0.70));
  g.add(pos(cube(0.08, 0.15, 0.08, 0xffc4c4), -0.15, 1.15, 0.70));
  g.add(pos(armband(teamHex), 0, 0.55, 0));
  return { group: g, headBone: head, eyeHeight: 1.2 };
}

// ---- Sheep ---------------------------------------------------------------

function buildSheep(teamHex) {
  const g = new THREE.Group();
  g.add(pos(cube(0.15, 0.5, 0.15, 0x1a1512),  0.22, 0.25,  0.32));
  g.add(pos(cube(0.15, 0.5, 0.15, 0x1a1512), -0.22, 0.25,  0.32));
  g.add(pos(cube(0.15, 0.5, 0.15, 0x1a1512),  0.22, 0.25, -0.32));
  g.add(pos(cube(0.15, 0.5, 0.15, 0x1a1512), -0.22, 0.25, -0.32));
  // fluffy body - multiple cubes for a puffy look
  const wool = 0xf6f1e6;
  g.add(pos(cube(0.80, 0.65, 1.10, wool), 0, 0.80, 0));
  g.add(pos(cube(0.20, 0.20, 0.20, wool),  0.35, 1.05,  0.30));
  g.add(pos(cube(0.20, 0.20, 0.20, wool), -0.35, 1.05,  0.30));
  g.add(pos(cube(0.20, 0.20, 0.20, wool),  0.30, 1.10, -0.30));
  const head = pos(cube(0.40, 0.45, 0.45, 0x2a231b), 0, 0.90, 0.72);
  g.add(head);
  g.add(pos(cube(0.10, 0.20, 0.10, 0xf6f1e6),  0.15, 1.25, 0.70));
  g.add(pos(cube(0.10, 0.20, 0.10, 0xf6f1e6), -0.15, 1.25, 0.70));
  g.add(pos(armband(teamHex), 0, 0.65, 0));
  return { group: g, headBone: head, eyeHeight: 1.3 };
}
