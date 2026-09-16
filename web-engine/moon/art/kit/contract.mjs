




import { test } from 'node:test';
import assert from 'node:assert/strict';
import { budgetFor } from '../../budgets.mjs';
import { SEASONS } from '../../palette/seasons.mjs';

export function signature(mesh) {
  let h = 0;
  for (const g of mesh.groups.values()) {
    for (let i = 0; i < g.positions.length; i += 7) h = (h * 31 + Math.round(g.positions[i] * 1000)) | 0;
    h = (h * 31 + g.indices.length) | 0;
  }
  return `${mesh.triangleCount}:${h}`;
}




export function contractTests(mod, { name, seeds = [1, 2, 3], lods = [0, 1, 2], minY = -0.08, maxMinY = 0.02, size, seasonal = true }) {
  const cache = new Map();
  const gen = (seed, season, lod) => {
    const k = `${seed}/${season}/${lod}`;
    if (!cache.has(k)) cache.set(k, mod.generate({ seed, season, lod }));
    return cache.get(k);
  };

  test(`${name}: exports TIER with a budget`, () => {
    assert.equal(typeof mod.TIER, 'string');
    assert.ok(budgetFor(mod.TIER, 0) > 0);
  });

  for (const lod of lods) {
    test(`${name} lod ${lod}: valid, in budget, grounded, in scale - every seed and season`, () => {
      for (const seed of seeds) {
        for (const season of SEASONS) {
          const m = gen(seed, season, lod);
          const where = `${name} seed ${seed} ${season} lod ${lod}`;
          assert.deepEqual(m.validate(), [], where);
          assert.ok(m.triangleCount > 0, `${where}: empty`);
          assert.ok(m.triangleCount <= budgetFor(mod.TIER, lod), `${where}: ${m.triangleCount} tris > budget ${budgetFor(mod.TIER, lod)}`);
          const b = m.bounds();
          assert.ok(b.min[1] >= minY && b.min[1] <= maxMinY, `${where}: sits on y=0 (min y ${b.min[1].toFixed(3)})`);
          const sx = b.max[0] - b.min[0], sy = b.max[1] - b.min[1], sz = b.max[2] - b.min[2];
          assert.ok(sx <= size.x[1] && sx >= size.x[0], `${where}: width ${sx.toFixed(2)} outside ${size.x}`);
          assert.ok(sz <= size.z[1] && sz >= size.z[0], `${where}: depth ${sz.toFixed(2)} outside ${size.z}`);
          assert.ok(sy <= size.y[1] && sy >= size.y[0], `${where}: height ${sy.toFixed(2)} outside ${size.y}`);
        }
      }
    });
  }

  test(`${name}: deterministic, and seeds 1-3 differ`, () => {
    for (const lod of lods) {
      const sigs = seeds.map((seed) => signature(gen(seed, 'summer', lod)));
      seeds.forEach((seed, i) => assert.equal(signature(mod.generate({ seed, season: 'summer', lod })), sigs[i], `${name} seed ${seed} lod ${lod} deterministic`));
      assert.equal(new Set(sigs).size, seeds.length, `${name} lod ${lod}: seeds must differ`);
    }
  });

  if (seasonal) {
    test(`${name}: winter differs from summer (season is visible)`, () => {
      assert.notEqual(signature(gen(1, 'winter', 0)), signature(gen(1, 'summer', 0)));
    });
  } else {
    test(`${name}: the same form in every season (not a seasonal asset)`, () => {
      for (const season of SEASONS) assert.equal(signature(gen(1, season, 0)), signature(gen(1, 'summer', 0)), season);
    });
  }
}

export function lodReport(mod, seeds = [1, 2, 3], lods = [0, 1, 2]) {
  const out = {};
  for (const lod of lods) out[lod] = Math.max(...seeds.flatMap((seed) => SEASONS.map((season) => mod.generate({ seed, season, lod }).triangleCount)));
  return out;
}
