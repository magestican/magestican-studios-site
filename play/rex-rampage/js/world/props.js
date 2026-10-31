


import { THREE } from '../vendor/three-vendor.js';
import { DEFAULT_HALF_M, groundBeside, terrainStrip } from './terrain.js';

export const THEMES = {
  jungle: { sky: 0x48624a, fog: [18, 130], ground: 0x3f5a2c, path: 0x8a6a45, width: 7 },
  sea: { sky: 0x7fb0d8, fog: [40, 420], ground: 0x2f6f9a, path: null, width: 0 },
  interior: { sky: 0x22262b, fog: [8, 70], ground: 0x5d5a55, path: 0x8c867c, width: 12 },
  river: { sky: 0x6e8f9e, fog: [25, 220], ground: 0x2c6a7a, path: 0x2f7f92, width: 13, rock: 0x6b5a48 },
  volcano: { sky: 0x3a1c14, fog: [15, 140], ground: 0x2a2220, path: 0x4a3a30, width: 5 },
  stadium: { sky: 0x141a28, fog: [30, 220], ground: 0x3d6b3a, path: null, width: 0 },
};


function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const lambert = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });


function ribbon(rail, width, color, { lift = 0.02, y = null, tile = 7 } = {}) {
  const pts = [];
  for (let d = 0; d <= rail.length; d += 4) pts.push(rail.at(d));
  const pos = new Float32Array(pts.length * 6);
  const uv = new Float32Array(pts.length * 4);
  for (let i = 0; i < pts.length; i++) uv.set([0, (i * 4) / tile, 1, (i * 4) / tile], i * 4); 
  pts.forEach(({ pos: p, tangent: t }, i) => {
    const l = Math.hypot(t.x, t.z) || 1;
    const rx = -t.z / l;
    const rz = t.x / l;
    const h = y ?? p.y - 1.6 + lift;
    const w = width / 2;
    pos.set([p.x + w * rx, h, p.z + w * rz, p.x - w * rx, h, p.z - w * rz], i * 6);
  });
  const idx = [];
  for (let i = 0; i < pts.length - 1; i++) idx.push(i * 2, i * 2 + 2, i * 2 + 1, i * 2 + 1, i * 2 + 2, i * 2 + 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, lambert(color, { side: THREE.DoubleSide }));
}


function instances(geo, mat, n, fn) {
  const mesh = new THREE.InstancedMesh(geo, mat, Math.max(1, n));
  const m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    fn(i, m);
    mesh.setMatrixAt(i, m);
  }
  mesh.count = n;
  return mesh;
}


function besideRail(rail, rand, n, near, far, ground = rail.ground ?? ((d, _off) => rail.at(d).pos.y - 1.6)) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const d = rand() * rail.length;
    const { pos, tangent } = rail.at(d);
    const side = rand() < 0.5 ? -1 : 1;
    const off = side * (near + rand() * (far - near));
    const l = Math.hypot(tangent.x, tangent.z) || 1;
    out.push({ x: pos.x + (-tangent.z / l) * off, z: pos.z + (tangent.x / l) * off, g: ground(d, off), side });
  }
  return out;
}

function trees(rail, rand, n, near, far) {
  const at = besideRail(rail, rand, n, near, far);
  const scales = at.map(() => 0.7 + rand() * 0.8);
  const trunk = instances(new THREE.CylinderGeometry(0.4, 0.6, 9, 6), lambert(0x5a4632), n, (i, m) =>
    m.makeScale(scales[i], scales[i], scales[i]).setPosition(at[i].x, at[i].g + 4.5 * scales[i], at[i].z),
  );
  const crown = instances(new THREE.ConeGeometry(3.2, 7, 7), lambert(0x2f6b34), n, (i, m) =>
    m.makeScale(scales[i], scales[i], scales[i]).setPosition(at[i].x, at[i].g + 10 * scales[i], at[i].z),
  );
  return [trunk, crown];
}






export function buildProps(scene, stage) {
  const theme = THEMES[stage.theme] ?? THEMES.jungle;
  const { rail } = stage;
  const rand = rng(7);
  const add = (...o) => scene.add(...o);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), lambert(theme.ground));
  ground.rotation.x = -Math.PI / 2;
  add(ground);
  const water = stage.water;
  if (water !== null) ground.position.y = water;
  
  let terrain = null;
  if (stage.terrain?.fixed && !stage.terrain.air) {
    const t = stage.terrain;
    rail.ground ??= (d, off) => groundBeside(stage, d, off);
    const s = terrainStrip(rail, t, t.half ?? DEFAULT_HALF_M, 1);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(s.position, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(s.uv, 2));
    geo.setIndex(s.index);
    geo.computeVertexNormals();
    
    terrain = new THREE.Mesh(geo, lambert(theme.rock ?? theme.ground));
    add(terrain);
    if (water === null) ground.position.y = Math.min(t.floor, t.left ?? t.floor, t.right ?? t.floor) - 0.05;
  }
  const road = theme.path ? ribbon(rail, theme.width, theme.path) : null;
  if (road) add(road);
  
  const greybox = [];
  
  const surfaces =  ({});
  const tag = (name, mesh) => {
    surfaces[name] = [...(surfaces[name] ?? []), mesh];
    return mesh;
  };

  if (stage.theme === 'jungle') {
    greybox.push(...trees(rail, rand, Math.min(500, Math.floor(rail.length / 2.5)), 9, 37));
    add(...greybox);
  } else if (stage.theme === 'sea') {
    const end = rail.at(rail.length).pos;
    const island = new THREE.Mesh(new THREE.ConeGeometry(160, 70, 12), lambert(0x3f5a2c));
    island.position.set(end.x - 20, (water ?? 0) - 30, end.z - 120);
    const beach = new THREE.Mesh(new THREE.CylinderGeometry(60, 60, 1, 24), lambert(0xc9b27a));
    beach.position.set(end.x, (water ?? 0) + 0.2, end.z - 10);
    add(island, beach);
    
    const stacks = besideRail(rail, rng(17), Math.ceil(rail.length / 40), 18, 70, () => water ?? 0);
    add(
      tag(
        'rock',
        instances(new THREE.CylinderGeometry(5, 9, 1, 7), lambert(0x5d5a52), stacks.length, (i, m) => {
          const h = 24 + (i % 6) * 9;
          m.makeScale(1, h, 1).setPosition(stacks[i].x, stacks[i].g + h / 2 - 2, stacks[i].z);
        }),
      ),
    );
    
    for (const m of trees({ length: 1, at: () => ({ pos: { ...end, y: 1.6 }, tangent: { x: 0, y: 0, z: -1 } }) }, rng(5), 70, 8, 60))
      add(m);
  } else if (stage.theme === 'interior') {
    const n = Math.ceil(rail.length / 5);
    
    
    const near = [];
    for (let d = 0; d <= rail.length; d += 4) near.push(rail.at(d).pos);
    const clear = (r) => near.every((p) => Math.hypot(p.x - r.x, p.z - r.z) > 6);
    const walls = besideRail(rail, rng(11), n * 2, 6.5, 6.6).filter(clear);
    add(
      tag(
        'wall',
        instances(new THREE.BoxGeometry(1, 5, 5.2), lambert(0x7a746a), walls.length, (i, m) =>
          m.makeRotationY(Math.atan2(walls[i].x, walls[i].z)).setPosition(walls[i].x, walls[i].g + 2.5, walls[i].z),
        ),
      ),
      
      tag('ceiling', ribbon(rail, 26, 0x6a655c, { lift: 4.8 })),
    );
    
    for (const ev of stage.events) {
      if (ev.do !== 'cover' && !(ev.do === 'explode' && ev.what === 'glass')) continue;
      const { pos, tangent } = rail.at(ev.at + (ev.do === 'cover' ? 3 : 10));
      const glass = ev.do !== 'cover';
      const box = new THREE.Mesh(
        glass ? new THREE.BoxGeometry(4, 3, 0.1) : new THREE.BoxGeometry(3.4, 1.1, 1),
        glass ? new THREE.MeshLambertMaterial({ color: 0x9fd6ff, transparent: true, opacity: 0.35 }) : lambert(0x8a6a3a),
      );
      const l = Math.hypot(tangent.x, tangent.z) || 1;
      const s = glass ? 6 : 0;
      box.position.set(pos.x + (-tangent.z / l) * s, pos.y - 1.6 + (glass ? 1.5 : 0.55), pos.z + (tangent.x / l) * s);
      box.rotation.y = Math.atan2(tangent.x, tangent.z) + (glass ? Math.PI / 2 : 0);
      add(box);
    }
  } else if (stage.theme === 'river') {
    const n = Math.ceil(rail.length / 6);
    
    const near = [];
    for (let d = 0; d <= rail.length; d += 8) near.push(rail.at(d).pos);
    const clear = (r) => near.every((p) => Math.hypot(p.x - r.x, p.z - r.z) > 15);
    const rock = besideRail(rail, rng(13), n * 2, 16, 26).filter(clear);
    add(
      tag(
        'rock',
        instances(new THREE.BoxGeometry(8, 1, 8), lambert(0x7a6650), rock.length, (i, m) => {
          const h = 18 + (i % 5) * 4;
          m.makeScale(1, h, 1).setPosition(rock[i].x, rock[i].g + h / 2 - 2, rock[i].z);
        }),
      ),
    );
  } else if (stage.theme === 'volcano') {
    
    const near = [];
    for (let d = 0; d <= rail.length; d += 8) near.push(rail.at(d).pos);
    const clear = (gap) => (r) => near.every((p) => Math.hypot(p.x - r.x, p.z - r.z) > gap);
    const rocks = besideRail(rail, rng(19), Math.ceil(rail.length / 4), 7, 40).filter(clear(7));
    add(
      tag(
        'rock',
        instances(new THREE.ConeGeometry(3, 8, 6), lambert(0x3b2f2a), rocks.length, (i, m) => {
          const s = 0.6 + (i % 7) * 0.25;
          m.makeScale(s, s, s).setPosition(rocks[i].x, rocks[i].g + 4 * s, rocks[i].z);
        }),
      ),
    );
    const lava = besideRail(rail, rng(23), Math.ceil(rail.length / 25), 9, 30).filter(clear(9));
    add(
      instances(new THREE.CylinderGeometry(4, 4, 0.2, 10), new THREE.MeshBasicMaterial({ color: 0xff5a14 }), lava.length, (i, m) =>
        m.makeScale(1, 1, 1).setPosition(lava[i].x, lava[i].g + 0.05, lava[i].z),
      ),
    );
    const cone = new THREE.Mesh(new THREE.ConeGeometry(120, 110, 10), lambert(0x2a1d18));
    
    const { pos: end, tangent: t } = rail.at(rail.length);
    const tl = Math.hypot(t.x, t.z) || 1;
    const [fx, fz] = [t.x / tl, t.z / tl];
    cone.position.set(end.x + fx * 180 + fz * 60, end.y + 30, end.z + fz * 180 - fx * 60);
    add(tag('rock', cone));
  } else if (stage.theme === 'stadium' && stage.arena) {
    const { x, z, r } = stage.arena;
    const tiers = 6;
    const per = 28;
    add(
      tag(
        'stands',
        instances(new THREE.BoxGeometry(1, 1, 1), lambert(0x4b5568), tiers * per, (i, m) => {
          const tier = Math.floor(i / per);
          const a = ((i % per) / per) * Math.PI * 2;
          const rr = r + 10 + tier * 3;
          const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a);
          m.compose(
            new THREE.Vector3(x + Math.cos(a) * rr, 1 + tier * 2.2, z + Math.sin(a) * rr),
            q,
            new THREE.Vector3(3, 2 + tier * 4.4, (2 * Math.PI * rr) / per),
          );
        }),
      ),
    );
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + (i * Math.PI) / 2;
      const tower = new THREE.Mesh(new THREE.BoxGeometry(1.5, 40, 1.5), lambert(0x2b2f36));
      tower.position.set(x + Math.cos(a) * (r + 32), 20, z + Math.sin(a) * (r + 32));
      const lamp = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 1), new THREE.MeshBasicMaterial({ color: 0xfff6d0 }));
      lamp.position.set(tower.position.x, 41, tower.position.z);
      add(tower, lamp);
    }
    const line = new THREE.Mesh(new THREE.RingGeometry(r - 0.4, r + 0.4, 48), new THREE.MeshBasicMaterial({ color: 0xf4ecd8 }));
    line.rotation.x = -Math.PI / 2;
    line.position.set(x, 0.03, z);
    add(line);
  }
  return { theme, groundFollows: water === null && stage.theme !== 'stadium' && !terrain, ground, terrain, road, greybox, surfaces };
}
