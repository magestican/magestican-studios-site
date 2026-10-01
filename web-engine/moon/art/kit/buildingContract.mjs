











import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contractTests } from './contract.mjs';
import { BUILDINGS } from '../../economy/tables.mjs';

export const CAMERA_DIR = Object.freeze([0, Math.sin((35 * Math.PI) / 180), Math.cos((35 * Math.PI) / 180)]);


export const GOODS_CLEARANCE = 0.32;


export function triangleSoup(mesh) {
  let n = 0;
  for (const g of mesh.groups.values()) n += g.indices.length;
  const out = new Float64Array(n * 3);
  let o = 0;
  for (const g of mesh.groups.values()) {
    const P = g.positions;
    for (const i of g.indices) { out[o++] = P[i * 3]; out[o++] = P[i * 3 + 1]; out[o++] = P[i * 3 + 2]; }
  }
  return out;
}


export function castRay(soup, [ox, oy, oz], [dx, dy, dz], tMin = 1e-4) {
  let best = Infinity;
  for (let k = 0; k < soup.length; k += 9) {
    const ax = soup[k], ay = soup[k + 1], az = soup[k + 2];
    const e1x = soup[k + 3] - ax, e1y = soup[k + 4] - ay, e1z = soup[k + 5] - az;
    const e2x = soup[k + 6] - ax, e2y = soup[k + 7] - ay, e2z = soup[k + 8] - az;
    const px = dy * e2z - dz * e2y, py = dz * e2x - dx * e2z, pz = dx * e2y - dy * e2x;
    const det = e1x * px + e1y * py + e1z * pz;
    if (Math.abs(det) < 1e-12) continue;
    const inv = 1 / det;
    const tx = ox - ax, ty = oy - ay, tz = oz - az;
    const u = (tx * px + ty * py + tz * pz) * inv;
    if (u < 0 || u > 1) continue;
    const qx = ty * e1z - tz * e1y, qy = tz * e1x - tx * e1z, qz = tx * e1y - ty * e1x;
    const v = (dx * qx + dy * qy + dz * qz) * inv;
    if (v < 0 || u + v > 1) continue;
    const t = (e2x * qx + e2y * qy + e2z * qz) * inv;
    if (t > tMin && t < best) best = t;
  }
  return best;
}

const DOWN = [0, -1, 0], UP = [0, 1, 0], FORWARD = [0, 0, 1];
const finite = (o) => Object.values(o).every((v) => (typeof v === 'object' ? finite(v) : Number.isFinite(v)));
const outside = (p, fp) => Math.abs(p.x) > fp.hx || p.z > fp.hz;

export function buildingTests(mod, { name, type, sizes, seeds = [1, 2, 3] }) {
  const table = BUILDINGS[type];
  assert.ok(table, `BUILDINGS.${type}`);

  test(`${name}: TIER heroBuilding, STAGES are the economy levels`, () => {
    assert.equal(mod.TIER, 'heroBuilding');
    assert.deepEqual(mod.STAGES, ['level1', 'level2', 'level3']);
    assert.equal(mod.STAGES.length, table.levels.length);
    assert.throws(() => mod.anchors({ seed: 1, stage: 'level4' }), /unknown stage/);
  });

  mod.STAGES.forEach((stage) => {
    contractTests({ TIER: mod.TIER, generate: (o) => mod.generate({ ...o, stage }) }, { name: `${name} ${stage}`, seeds, size: sizes[stage] });
  });

  test(`${name}: anchors are pure numbers, deterministic, tied to BUILDINGS.${type}`, () => {
    mod.STAGES.forEach((stage, L) => {
      for (const seed of seeds) {
        const a = mod.anchors({ seed, stage });
        const where = `${name} ${stage} seed ${seed}`;
        assert.ok(finite(a), `${where}: every anchor value is a finite number`);
        assert.deepEqual(mod.anchors({ seed, stage }), a, `${where}: deterministic`);
        assert.ok(a.footprint.hx > 1 && a.footprint.hz > 0.5, `${where}: footprint`);
        assert.ok(a.front.z > a.footprint.hz && Math.abs(a.front.x) <= a.footprint.hx, `${where}: the player's front spot is just outside the footprint, in front`);
        if (type === 'shop') {
          assert.equal(a.shelves.length, table.levels[L].shelves, `${where}: shelves = BUILDINGS.shop.levels[${L}].shelves`);
          for (const sh of a.shelves) {
            assert.ok(sh.width >= 0.6 && sh.depth >= 0.25, `${where}: a shelf wide and deep enough for goods`);
            assert.ok(Math.abs(sh.x) <= a.footprint.hx && Math.abs(sh.z) <= a.footprint.hz, `${where}: shelf inside the footprint`);
          }
          assert.equal(a.counter.rotY, Math.PI);
          assert.equal(a.customerPath.length, 4, `${where}: start, first stand, counter, away`);
          assert.deepEqual(a.customerPath[2], { x: a.counter.x, z: a.counter.z }, `${where}: the path stops at the counter`);
          for (const p of a.customerPath) assert.ok(outside(p, a.footprint), `${where}: customers never walk inside the footprint (${p.x}, ${p.z})`);
          assert.ok(Math.sign(a.customerPath[0].x) === -Math.sign(a.customerPath[3].x), `${where}: customers arrive from one side and leave by the other`);
        } else {
          assert.equal(a.stations.length, table.levels[L].jobSlots, `${where}: stations = BUILDINGS.processor.levels[${L}].jobSlots`);
          assert.equal(a.outputs.length, a.stations.length, `${where}: one output per station`);
          a.stations.forEach((s, i) => {
            assert.ok(Math.abs(s.x) <= a.footprint.hx && s.z <= a.footprint.hz, `${where}: station ${i} inside the footprint`);
            assert.ok(a.footprint.hz - s.z <= 1.2, `${where}: station ${i} stands at the working front`);
            const o = a.outputs[i];
            assert.ok(Math.hypot(o.x - s.x, o.z - s.z) <= 1.6, `${where}: output ${i} is next to its station`);
          });
        }
      }
    });
  });

  for (const season of ['summer', 'winter']) {
    test(`${name}: anchors match the mesh (ray casts, ${season})`, () => {
      mod.STAGES.forEach((stage) => {
        for (const seed of seeds) {
          const a = mod.anchors({ seed, stage });
          const soup = triangleSoup(mod.generate({ seed, season, stage, lod: 0 }));
          const where = `${name} ${stage} seed ${seed} ${season}`;
          const clearToCamera = (p, what) => assert.equal(castRay(soup, p, CAMERA_DIR, 0.01), Infinity, `${where}: ${what} hidden from the gameplay camera at (${p.map((v) => v.toFixed(2))})`);
          if (type === 'shop') {
            a.shelves.forEach((sh, i) => {
              const c = Math.cos(sh.rotY), s = Math.sin(sh.rotY);
              for (const u of [-0.42, 0, 0.42]) {
                for (const v of [-0.3, 0.3]) {
                  const lx = u * sh.width, lz = v * sh.depth;
                  const x = sh.x + lx * c + lz * s, z = sh.z - lx * s + lz * c;
                  
                  
                  const t = castRay(soup, [x, sh.y + GOODS_CLEARANCE, z], DOWN);
                  assert.ok(Number.isFinite(t) && Math.abs(sh.y + GOODS_CLEARANCE - t - sh.y) <= 0.03, `${where}: shelf ${i} surface at y ${sh.y} with ${GOODS_CLEARANCE} m clear above, under (${x.toFixed(2)}, ${z.toFixed(2)}), hit ${(sh.y + GOODS_CLEARANCE - t).toFixed(3)}`);
                }
                clearToCamera([sh.x + u * 0.8 * sh.width * c, sh.y + 0.09, sh.z - u * 0.8 * sh.width * s], `goods on shelf ${i}`);
              }
            });
            clearToCamera([a.counter.x, 1.0, a.counter.z], 'the customer at the counter');
          } else {
            a.stations.forEach((st, i) => {
              
              
              const TIMER_CLEARANCE = 0.6;
              const above = castRay(soup, [st.x, st.y, st.z], UP);
              assert.ok(above > TIMER_CLEARANCE, `${where}: station ${i} has ${TIMER_CLEARANCE} m clear above for its timer (something at ${above.toFixed(2)} m)`);
              const t = castRay(soup, [st.x, st.y, st.z], DOWN);
              assert.ok(t <= 0.9, `${where}: station ${i} timer floats just above the station (gap ${t.toFixed(2)})`);
              clearToCamera([st.x, st.y, st.z], `station ${i} timer`);
              assert.equal(castRay(soup, [st.x, 0.7, st.z + 0.95], FORWARD), Infinity, `${where}: station ${i} reachable from the front`);
              const o = a.outputs[i];
              for (const dx of [-0.1, 0, 0.1]) {
                const h = castRay(soup, [o.x + dx, o.y + 0.5, o.z], DOWN);
                assert.ok(Number.isFinite(h) && Math.abs(o.y + 0.5 - h - o.y) <= 0.03, `${where}: output ${i} surface at y ${o.y} (hit ${(o.y + 0.5 - h).toFixed(3)})`);
              }
              clearToCamera([o.x, o.y + 0.08, o.z], `output ${i} goods`);
            });
          }
        }
      });
    });
  }
}
