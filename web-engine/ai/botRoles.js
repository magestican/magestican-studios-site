


























export const ROLES = Object.freeze(['rusher', 'guard', 'sheltered', 'sniper']);











export const ROLE_PROFILES = Object.freeze({
  
  
  rusher: Object.freeze({
    engageRange: 6, coverWeight: 0.0, leashRadius: Infinity, pushiness: 1.0, fireRange: 18,
  }),
  
  
  guard: Object.freeze({
    engageRange: 10, coverWeight: 0.35, leashRadius: 14, pushiness: 0.25, fireRange: 18,
  }),
  
  sheltered: Object.freeze({
    engageRange: 12, coverWeight: 1.0, leashRadius: Infinity, pushiness: 0.7, fireRange: 16,
  }),
  
  
  sniper: Object.freeze({
    engageRange: 22, coverWeight: 0.6, leashRadius: Infinity, pushiness: 0.4, fireRange: 30,
  }),
});

export function profileFor(role) {
  return ROLE_PROFILES[role] || ROLE_PROFILES.rusher;
}







export function dealRole(taken = [], rng = Math.random) {
  
  
  
  
  
  if (!taken.length) return ROLES[0];

  const counts = new Map(ROLES.map((r) => [r, 0]));
  for (const t of taken) {
    if (counts.has(t)) counts.set(t, counts.get(t) + 1);
  }
  let min = Infinity;
  for (const n of counts.values()) if (n < min) min = n;
  const candidates = ROLES.filter((r) => counts.get(r) === min);
  return candidates[Math.floor(rng() * candidates.length) % candidates.length];
}






export function closeDesire(role, distanceToEnemy) {
  const p = profileFor(role);
  if (!Number.isFinite(distanceToEnemy)) return p.pushiness;
  const gap = distanceToEnemy - p.engageRange;
  if (Math.abs(gap) < 1.5) return 0;                 
  const want = gap > 0 ? 1 : -1;
  
  
  return want * Math.min(1, Math.abs(gap) / 12) * p.pushiness;
}


export function offLeash(role, distanceToAnchor) {
  const p = profileFor(role);
  return Number.isFinite(p.leashRadius) && distanceToAnchor > p.leashRadius;
}



export function mayFire(role, distanceToEnemy) {
  return distanceToEnemy <= profileFor(role).fireRange;
}
