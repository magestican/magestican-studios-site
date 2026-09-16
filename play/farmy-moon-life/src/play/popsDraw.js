









import { createPop, popItemAt, landedCount, popDone } from 'moon/play/pop.mjs';

export function createPopsDraw({ scene, itemObject, season }) {
  const active = [];
  const inFlight = {};

  async function launch({ good, count, from, seed, nowS }) {
    if (!good || !(count > 0)) return;
    inFlight[good] = (inFlight[good] || 0) + count;
    const entry = { pop: createPop({ from, count, seed, startS: nowS, good }), objects: [], landed: 0 };
    active.push(entry);
    for (let i = 0; i < count; i++) {
      const obj = await itemObject(good, { seed: seed + i, season, lod: 0 });
      obj.visible = false;
      scene.add(obj);
      entry.objects.push(obj);
    }
  }

  function update(nowS, to) {
    for (let k = active.length - 1; k >= 0; k--) {
      const e = active[k];
      e.objects.forEach((obj, i) => {
        const p = popItemAt(e.pop, i, nowS, to);
        obj.visible = p.visible;
        obj.position.set(p.x, p.y, p.z);
        obj.scale.setScalar(p.scale);
        obj.rotation.y = p.spin;
      });
      const n = landedCount(e.pop, nowS);
      if (n > e.landed) {
        inFlight[e.pop.good] -= n - e.landed;
        if (inFlight[e.pop.good] <= 0) delete inFlight[e.pop.good];
        e.landed = n;
      }
      if (popDone(e.pop, nowS) && e.objects.length === e.pop.items.length) {
        for (const obj of e.objects) scene.remove(obj);
        active.splice(k, 1);
      }
    }
  }

  
  function shown(pockets) {
    const out = {};
    for (const [good, n] of Object.entries(pockets)) {
      const left = n - (inFlight[good] || 0);
      if (left > 0) out[good] = left;
    }
    return out;
  }

  return { launch, update, shown, inFlight, get active() { return active.length; } };
}
