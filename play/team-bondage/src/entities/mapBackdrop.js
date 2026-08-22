// The out-of-bounds backdrop: the city, the woods, the range, the floe.
//
// backdropGen.js decides WHAT is out there as pure data; this file is the only
// part that knows about THREE. It merges every box and every lit window into
// ONE buffer, so a whole Manhattan skyline is two draw calls: the scenery, and
// the ground skirt it stands on. The target machine is a locked-down corporate
// laptop, and a hundred separate building meshes would cost more frame time
// than the entire arena in front of them.
//
// Nothing out here is LIT. Every face is shaded once, at build time, against
// the light rig's sun direction, and the value is then a number we chose — the
// only way to promise a tower stays darker than the bright horizon band it is
// standing against (art/knowledge/craft/color.md, "a thing that must always
// look bright should be PAINTED, not lit"). Unlit also means the backdrop
// cannot drift when a future pass retunes the rig.
//
// Feature spec: docs/features/map-backdrops.md

import * as THREE from 'three';
import { generateBackdrop, faceShade, mixHex } from '../../../../web-engine/procgen/backdropGen.js';

// BoxGeometry lays its 24 vertices out as +X, -X, +Y, -Y, +Z, -Z, four each —
// the same layout snow.js's painted flake relies on. Taking the template from
// THREE rather than writing 24 positions by hand is what keeps the winding
// right without a hand-checked table of corners.
const UNIT = new THREE.BoxGeometry(1, 1, 1);
const FACE_NORMALS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];

// An unlit window quad, +Z facing, so it can be yawed onto a building's
// arena-facing wall the same way the building itself is.
const QUAD = new THREE.PlaneGeometry(1, 1);

// Add the map's backdrop to the scene. Returns the group so a caller can drop
// it again on a map change.
export function addMapBackdrop(scene, world) {
  const data = generateBackdrop(world.mapId ?? world.map?.id, world.seed);
  const group = new THREE.Group();
  group.name = 'mapBackdrop';
  scene.add(group);
  if (!data) return group;

  group.add(buildSkirt(data));
  group.add(buildScenery(data));
  return group;
}

// ---------------------------------------------------------------------------

// The ground beyond the arena. This one IS fogged, and that is the whole
// trick: fogged, it dissolves into the horizon on exactly the same curve the
// map's own ground does, so there is no seam at the map edge and no line where
// the land stops. Without it the backdrop stands on nothing and the buildings
// read as cut-outs hung in the air.
function buildSkirt(data) {
  const { inner, outer, y, hex } = data.skirt;
  const cx = (inner.x0 + inner.x1) / 2, cz = (inner.z0 + inner.z1) / 2;
  // A 3x3 grid with the middle cell — the playfield — left out. Eight quads,
  // not one, because a single ring quad cannot have a vertex ON the map edge
  // and the fog would interpolate across the whole strip instead of starting
  // at the boundary.
  const xs = [cx - outer, inner.x0, inner.x1, cx + outer];
  const zs = [cz - outer, inner.z0, inner.z1, cz + outer];
  const pos = [];
  const idx = [];
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (i === 1 && j === 1) continue;
      const b = pos.length / 3;
      // Winding matched to PlaneGeometry rotated -90 degrees about X, i.e. an
      // up-facing quad: (x0,z0) (x1,z0) (x0,z1) (x1,z1) with 0,2,1 / 2,3,1.
      pos.push(xs[i], y, zs[j], xs[i + 1], y, zs[j],
               xs[i], y, zs[j + 1], xs[i + 1], y, zs[j + 1]);
      idx.push(b, b + 2, b + 1, b + 2, b + 3, b + 1);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pos), 3));
  geo.setIndex(idx);
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    color: new THREE.Color(hex), fog: true,
  }));
  mesh.name = 'backdropSkirt';
  return mesh;
}

// Every solid and every lit window, merged into one geometry with one
// material. Solids carry a per-face tone; windows carry their own.
function buildScenery(data) {
  const boxVerts = UNIT.attributes.position.count;          // 24
  const boxIdx = UNIT.index.count;                          // 36
  const quadVerts = QUAD.attributes.position.count;         // 4
  const quadIdx = QUAD.index.count;                         // 6
  const nV = data.solids.length * boxVerts + data.lights.length * quadVerts;
  const nI = data.solids.length * boxIdx + data.lights.length * quadIdx;

  const position = new Float32Array(nV * 3);
  const color = new Float32Array(nV * 3);
  const index = new Uint32Array(nI);
  let vo = 0, io = 0;

  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  const src = UNIT.attributes.position.array;
  const srcIdx = UNIT.index.array;
  const v = new THREE.Vector3();

  for (const b of data.solids) {
    // The box is authored standing on `y`, so the unit cube is lifted half its
    // own height before it is yawed into place.
    m.makeRotationY(b.yaw);
    m.setPosition(b.x, b.y + b.h / 2, b.z);
    const base = vo;
    for (let i = 0; i < boxVerts; i++) {
      v.set(src[i * 3] * b.w, src[i * 3 + 1] * b.h, src[i * 3 + 2] * b.d).applyMatrix4(m);
      const o = (vo + i) * 3;
      position[o] = v.x; position[o + 1] = v.y; position[o + 2] = v.z;
    }
    // One tone per face, from the face's WORLD normal. A building on the far
    // side of the ring is yawed 180 degrees, so its arena-facing wall is the
    // one pointing away from the sun — which is why half the skyline is dark
    // and half is catching the last of it, for free.
    const cy = Math.cos(b.yaw), sy = Math.sin(b.yaw);
    for (let f = 0; f < 6; f++) {
      const [nx, ny, nz] = FACE_NORMALS[f];
      const wx = nx * cy + nz * sy;
      const wz = -nx * sy + nz * cy;
      const [r, g, bl] = mixHex(b.shade, b.lit, faceShade(wx, ny, wz));
      c.setRGB(r / 255, g / 255, bl / 255, THREE.SRGBColorSpace);
      for (let k = 0; k < 4; k++) {
        const o = (vo + f * 4 + k) * 3;
        color[o] = c.r; color[o + 1] = c.g; color[o + 2] = c.b;
      }
    }
    for (let i = 0; i < boxIdx; i++) index[io + i] = base + srcIdx[i];
    vo += boxVerts; io += boxIdx;
  }

  const qSrc = QUAD.attributes.position.array;
  const qIdx = QUAD.index.array;
  for (const w of data.lights) {
    m.makeRotationY(w.yaw);
    m.setPosition(w.x, w.y, w.z);
    const base = vo;
    c.set(w.hex);
    for (let i = 0; i < quadVerts; i++) {
      v.set(qSrc[i * 3] * w.w, qSrc[i * 3 + 1] * w.h, qSrc[i * 3 + 2]).applyMatrix4(m);
      const o = (vo + i) * 3;
      position[o] = v.x; position[o + 1] = v.y; position[o + 2] = v.z;
      color[o] = c.r; color[o + 1] = c.g; color[o + 2] = c.b;
    }
    for (let i = 0; i < quadIdx; i++) index[io + i] = base + qIdx[i];
    vo += quadVerts; io += quadIdx;
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(position, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(color, 3));
  geo.setIndex(new THREE.BufferAttribute(index, 1));
  geo.computeBoundingSphere();

  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    vertexColors: true,
    // fog OFF. The furthest bands sit past every map's fogFar, so fogged they
    // would be 100 % haze — an empty horizon. The recession is painted into
    // the tones instead, which is the only way to control it.
    fog: false,
  }));
  mesh.name = 'backdropScenery';
  return mesh;
}
