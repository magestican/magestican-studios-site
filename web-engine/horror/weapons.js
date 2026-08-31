










































































export const AXES = Object.freeze([
  { key: 'range', higher: true },
  { key: 'fireRate', higher: true },
  { key: 'limbDamage', higher: true },
  { key: 'severBonus', higher: true },
  { key: 'stagger', higher: true },
  { key: 'targets', higher: true },
  { key: 'burnDps', higher: true },
  { key: 'ammoPerSecond', higher: false },
]);





export const CAPABILITIES = Object.freeze(['breaksGrapple', 'multiTarget', 'ignition']);

function weapon(w) {
  
  
  return Object.freeze({
    ...w,
    ammoPerSecond: w.ammoPerShot * w.fireRate,
    dps: w.limbDamage * w.fireRate * w.targets,
  });
}

export const WEAPONS = Object.freeze({
  
  
  
  
  
  
  
  
  boltDriver: weapon({
    id: 'boltDriver',
    name: 'BOLT DRIVER',
    
    
    flavour: 'Fence-post driver, agency issue. It was never for this.',
    range: 18,
    fireRate: 1.6,
    limbDamage: 12,
    torsoDamage: 12,
    
    
    severBonus: 1.35,
    stagger: 0.35,
    targets: 1,
    burnDps: 0,
    ammoPerShot: 1,
    ammo: 'bolts',
    breaksGrapple: false,
    multiTarget: false,
    ignition: false,
  }),

  
  cattleProd: weapon({
    id: 'cattleProd',
    name: 'CATTLE PROD',
    flavour: 'Charges off the suit. Meant for moving a herd, not stopping one.',
    range: 1.8,
    fireRate: 2.5,
    limbDamage: 6,
    torsoDamage: 6,
    severBonus: 1,
    
    
    stagger: 1,
    targets: 1,
    burnDps: 0,
    
    
    
    
    ammoPerShot: 0,
    ammo: null,
    
    
    
    breaksGrapple: true,
    multiTarget: false,
    ignition: false,
  }),

  flareGun: weapon({
    id: 'flareGun',
    name: 'FLARE GUN',
    flavour: 'Distress issue. Six cartridges, and nobody coming.',
    
    
    range: 30,
    fireRate: 0.5,
    limbDamage: 9,
    torsoDamage: 9,
    severBonus: 1,
    stagger: 0.5,
    targets: 1,
    
    
    
    
    
    burnDps: 4,
    burnSeconds: 6,
    ammoPerShot: 1,
    ammo: 'cartridges',
    breaksGrapple: false,
    multiTarget: false,
    
    
    ignition: true,
  }),

  grainAuger: weapon({
    id: 'grainAuger',
    name: 'GRAIN AUGER',
    flavour: 'Torn off the feed line. It still turns, which is the problem.',
    range: 4,
    
    
    
    fireRate: 8,
    limbDamage: 3.5,
    torsoDamage: 3.5,
    severBonus: 1,
    stagger: 0.2,
    
    
    
    targets: 3,
    burnDps: 0,
    ammoPerShot: 1,
    ammo: 'grain',
    breaksGrapple: false,
    multiTarget: true,
    ignition: false,
  }),
});

export const WEAPON_IDS = Object.freeze(Object.keys(WEAPONS));





export function dominates(a, b) {
  for (const cap of CAPABILITIES) {
    
    
    if (b[cap] && !a[cap]) return false;
  }
  let strictlyBetterSomewhere = false;
  for (const { key, higher } of AXES) {
    const av = a[key] ?? 0;
    const bv = b[key] ?? 0;
    if (higher) {
      if (av < bv) return false;
      if (av > bv) strictlyBetterSomewhere = true;
    } else {
      if (av > bv) return false;
      if (av < bv) strictlyBetterSomewhere = true;
    }
  }
  for (const cap of CAPABILITIES) if (a[cap] && !b[cap]) strictlyBetterSomewhere = true;
  return strictlyBetterSomewhere;
}




export function dominatedPairs() {
  const out = [];
  for (const a of WEAPON_IDS) {
    for (const b of WEAPON_IDS) {
      if (a === b) continue;
      if (dominates(WEAPONS[a], WEAPONS[b])) out.push([a, b]);
    }
  }
  return out;
}







export function inRange(weapon, distance) {
  return Number.isFinite(distance) && distance >= 0 && distance <= weapon.range;
}





export function readyWeapon(id, opts = {}) {
  const w = WEAPONS[id];
  if (!w) throw new Error(`unknown weapon: ${id}`);
  return {
    id,
    spec: w,
    cooldown: 0,
    
    
    ammo: w.ammoPerShot === 0 ? Infinity : (opts.ammo ?? 0),
  };
}

export function tickWeapon(state, dt) {
  state.cooldown = Math.max(0, state.cooldown - Math.max(0, dt));
  return state;
}

export function canFire(state) {
  return state.cooldown <= 0 && state.ammo >= state.spec.ammoPerShot;
}



export function fire(state) {
  if (!canFire(state)) return { fired: false, reason: state.cooldown > 0 ? 'cooling' : 'empty' };
  state.cooldown = 1 / state.spec.fireRate;
  if (state.ammo !== Infinity) state.ammo -= state.spec.ammoPerShot;
  return { fired: true, weapon: state.spec };
}
