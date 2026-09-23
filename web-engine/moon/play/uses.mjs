


































const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;
const r4 = (v) => Math.round(v * 1e4) / 1e4 || 0;


export const USE_LABELS = Object.freeze({ seat: 'Sit', lean: 'Lean', warm: 'Warm your hands' });


export const useKindOf = (id) => String(id).split('|')[0];
export const useLabel = (id) => USE_LABELS[useKindOf(id)] || null;
export const PLAYER_USE = 'player';

export const USE_REACH_R = 0.2;






export function worldSlots(placements, usesFor) {
  const out = [];
  for (const p of placements) {
    const list = usesFor(p) || [];
    const c = Math.cos(p.rotY || 0), s = Math.sin(p.rotY || 0);
    list.forEach((u, i) => {
      out.push(Object.freeze({
        ...u,
        id: `${u.kind}|${p.module || p.kind || 'item'}|${r4(p.x)},${r4(p.z)}|${i}`,
        at: Object.freeze({ x: r4(p.x + u.at.x * c + u.at.z * s), z: r4(p.z - u.at.x * s + u.at.z * c) }),
        heading: r4(Math.atan2(Math.sin(u.heading + (p.rotY || 0)), Math.cos(u.heading + (p.rotY || 0)))),
        y: p.y || 0,
      }));
    });
  }
  return out;
}








export function placedSlots(world, usesOfItem) {
  const outdoors = (world.placed || []).filter((p) => p.spot && !(Number.isInteger(p.planet) && p.planet !== 0) && !Number.isInteger(p.spot.room));
  
  
  const safe = (item) => { try { return usesOfItem(item); } catch { return []; } };
  return worldSlots(outdoors.map((p) => ({ module: `placed:${p.id}`, x: p.spot.x, z: p.spot.z, rotY: p.spot.rotY || 0, item: p.item })), (p) => safe(p.item));
}


export const usePlaces = (slots) => slots.map((s) => ({ type: 'use', id: s.id, x: s.at.x, z: s.at.z, r: USE_REACH_R }));






export function useForStay(slots, registry, at, kind, withinM = 4) {
  const s = nearestFreeUse(slots, registry, at, kind);
  return s && dist2(s.at, at) <= withinM * withinM ? s : null;
}




export const STAY_USE = Object.freeze({ firepit: 'warm', town: 'seat' });







export function villagerUse(slots, registry, pose, withinM = 4) {
  
  
  const kind = pose.use !== undefined ? pose.use : STAY_USE[pose.doing];
  if (!kind || pose.speed > 0 || pose.inside) return null;
  return useForStay(slots, registry, pose, kind, withinM);
}

export function nearestFreeUse(slots, registry, from, kind = null) {
  let best = null, bestD = Infinity;
  for (const s of slots) {
    if (kind && s.kind !== kind) continue;
    if (registry[s.id]) continue;
    const d = dist2(s.at, from);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best;
}

export function holderOf(registry, slotId) {
  return registry[slotId] ?? null;
}

export function releaseUse(registry, ownerId) {
  const out = {};
  for (const [id, owner] of Object.entries(registry)) if (owner !== ownerId) out[id] = owner;
  return out;
}

export function takeUse(registry, slotId, ownerId) {
  return { ...releaseUse(registry, ownerId), [slotId]: ownerId };
}

export function contestUse(slots, registry, slotId, playerId) {
  const slot = slots.find((s) => s.id === slotId);
  if (!slot) throw new Error(`uses: no slot '${slotId}'`);
  const holder = holderOf(registry, slotId);
  if (holder === playerId) return { registry, displaced: null };
  if (!holder) return { registry: takeUse(registry, slotId, playerId), displaced: null };
  const freed = releaseUse(registry, holder);
  const alt = nearestFreeUse(slots.filter((s) => s.id !== slotId), freed, slot.at, slot.kind);
  const bumped = alt ? takeUse(freed, alt.id, holder) : freed;
  return { registry: takeUse(bumped, slotId, playerId), displaced: holder };
}
