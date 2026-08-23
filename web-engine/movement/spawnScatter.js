




























export const SPAWN_SLOTS = 16;






export function spawnOffset(slot) {
  const i = ((slot % SPAWN_SLOTS) + SPAWN_SLOTS) % SPAWN_SLOTS;
  const ang = i * 2.399963229728653;              
  const rad = 0.85 + 2.05 * Math.sqrt(i / (SPAWN_SLOTS - 1));
  return { x: Math.cos(ang) * rad, z: Math.sin(ang) * rad };
}






export function pickSpawnSlot(taken = []) {
  const used = new Set();
  for (const t of taken) {
    if (Number.isInteger(t)) used.add(((t % SPAWN_SLOTS) + SPAWN_SLOTS) % SPAWN_SLOTS);
  }
  for (let i = 0; i < SPAWN_SLOTS; i++) if (!used.has(i)) return i;
  
  
  
  return used.size % SPAWN_SLOTS;
}
