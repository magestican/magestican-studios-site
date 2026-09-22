


































const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;

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
