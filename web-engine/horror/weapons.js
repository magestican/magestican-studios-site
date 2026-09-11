










































































































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




export const MIN_INTERVAL = 0.09;






export const CLICK_BUFFER_S = 0.2;























function weapon(w) {
  
  
  return Object.freeze({
    fireMode: 'semi',
    minInterval: MIN_INTERVAL,
    
    
    
    
    magazine: w.ammoPerShot === 0 ? Infinity : 8,
    reloadTime: w.ammoPerShot === 0 ? 0 : 1.4,
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
    fireMode: 'semi',
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    limbDamage: 39,
    torsoDamage: 39,
    
    
    severBonus: 1.35,
    stagger: 0.35,
    targets: 1,
    burnDps: 0,
    ammoPerShot: 1,
    ammo: 'bolts',
    
    
    
    
    
    
    magazine: 8,
    reloadTime: 1.5,
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
    fireMode: 'semi',
    limbDamage: 6,
    torsoDamage: 6,
    severBonus: 1,
    
    
    stagger: 1,
    targets: 1,
    burnDps: 0,
    
    
    
    
    ammoPerShot: 0,
    ammo: null,
    
    
    
    magazine: Infinity,
    reloadTime: 0,
    
    
    
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
    fireMode: 'semi',
    limbDamage: 9,
    torsoDamage: 9,
    severBonus: 1,
    stagger: 0.5,
    targets: 1,
    
    
    
    
    
    burnDps: 4,
    burnSeconds: 6,
    ammoPerShot: 1,
    ammo: 'cartridges',
    
    
    
    
    magazine: 1,
    reloadTime: 2.2,
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
    
    
    
    fireMode: 'auto',
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    limbDamage: 5.8,
    torsoDamage: 5.8,
    severBonus: 1,
    stagger: 0.2,
    
    
    
    targets: 3,
    burnDps: 0,
    ammoPerShot: 1,
    ammo: 'grain',
    
    
    
    
    magazine: 40,
    reloadTime: 3.4,
    breaksGrapple: false,
    multiTarget: true,
    ignition: false,
  }),
});

export const WEAPON_IDS = Object.freeze(Object.keys(WEAPONS));









































export const FEEL_AXES = Object.freeze(['kick', 'camPunch', 'flashSize', 'hitStop', 'knockback', 'rumble']);



export const HIT_STOP_SLOW = 0.35;



export const KNOCK_SECONDS = 0.12;


export const CAM_PUNCH_S = 0.12;

function feel(f) {
  return Object.freeze({ ...f });
}

export const FEEL = Object.freeze({
  boltDriver: feel({ kick: 0.06, camPunch: 2.5, flashSize: 1.0, hitStop: 0.045, knockback: 0.35, rumble: 0, shell: true }),
  cattleProd: feel({ kick: 0.02, camPunch: 1.2, flashSize: 0.4, hitStop: 0.03, knockback: 0.9, rumble: 0, shell: false }),
  flareGun: feel({ kick: 0.09, camPunch: 3.5, flashSize: 1.8, hitStop: 0.02, knockback: 0.25, rumble: 0, shell: true }),
  grainAuger: feel({ kick: 0.012, camPunch: 0.4, flashSize: 0.5, hitStop: 0.012, knockback: 0.12, rumble: 0.5, shell: false }),
});



export function feelOf(id) {
  return FEEL[id] ?? FEEL.boltDriver;
}



export function dominatesFeel(a, b) {
  if (b.shell && !a.shell) return false;
  let strictly = false;
  for (const key of FEEL_AXES) {
    const av = a[key] ?? 0;
    const bv = b[key] ?? 0;
    if (av < bv) return false;
    if (av > bv) strictly = true;
  }
  if (a.shell && !b.shell) strictly = true;
  return strictly;
}

export function dominatedFeelPairs() {
  const out = [];
  for (const a of WEAPON_IDS) {
    for (const b of WEAPON_IDS) {
      if (a === b) continue;
      if (dominatesFeel(FEEL[a], FEEL[b])) out.push([a, b]);
    }
  }
  return out;
}





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
    
    
    
    sinceShot: Infinity,
    
    
    ammo: w.ammoPerShot === 0 ? Infinity : (opts.ammo ?? 0),
    
    
    
    
    reserve: w.ammoPerShot === 0 ? 0 : (opts.reserve ?? 0),
    
    
    
    reloading: 0,
  };
}










export function needsReload(state) {
  if (state.spec.ammoPerShot === 0) return false;
  if (state.ammo === Infinity) return false;
  return state.ammo < state.spec.magazine && state.reserve > 0;
}









export function startReload(state) {
  if (state.reloading > 0) return false;
  if (!needsReload(state)) return false;
  state.reloading = state.spec.reloadTime;
  return true;
}











export function stepReload(state, dt) {
  if (!(state.reloading > 0)) return { done: false, loaded: 0 };
  state.reloading = Math.max(0, state.reloading - Math.max(0, dt));
  if (state.reloading > 0) return { done: false, loaded: 0 };
  const room = state.spec.magazine - state.ammo;
  const loaded = Math.max(0, Math.min(room, state.reserve));
  state.ammo += loaded;
  state.reserve -= loaded;
  return { done: true, loaded };
}


export function cancelReload(state) {
  const was = state.reloading > 0;
  state.reloading = 0;
  return was;
}

export function tickWeapon(state, dt) {
  const d = Math.max(0, dt);
  state.cooldown = Math.max(0, state.cooldown - d);
  state.sinceShot = (state.sinceShot ?? Infinity) + d;
  return state;
}





export function canFire(state, { click = false } = {}) {
  
  
  
  if (state.reloading > 0) return false;
  if (state.ammo < state.spec.ammoPerShot) return false;
  if (click && state.spec.fireMode === 'semi') {
    return (state.sinceShot ?? Infinity) >= (state.spec.minInterval ?? MIN_INTERVAL);
  }
  return state.cooldown <= 0;
}







export function fire(state, { click = false } = {}) {
  if (!canFire(state, { click })) {
    const reason = state.reloading > 0 ? 'reloading'
      : (state.ammo < state.spec.ammoPerShot ? 'empty' : 'cooling');
    return { fired: false, reason };
  }
  state.cooldown = 1 / state.spec.fireRate;
  state.sinceShot = 0;
  if (state.ammo !== Infinity) state.ammo -= state.spec.ammoPerShot;
  return { fired: true, weapon: state.spec, click };
}









export function createTrigger() {
  return { held: false, clicks: 0, clickAge: 0 };
}




export function pressTrigger(t) {
  t.held = true;
  t.clicks = 1;
  t.clickAge = 0;
  return t;
}

export function releaseTrigger(t) {
  t.held = false;
  return t;
}



export function dropClicks(t) {
  t.clicks = 0;
  return t;
}








export function stepTrigger(t, state, dt) {
  const d = Math.max(0, dt);
  if (t.clicks > 0) {
    t.clickAge += d;
    if (t.clickAge > CLICK_BUFFER_S) t.clicks = 0;
  }
  if (t.clicks > 0 && canFire(state, { click: true })) {
    t.clicks = 0;
    return { fire: true, click: true };
  }
  if (t.held && canFire(state)) return { fire: true, click: false };
  return { fire: false, click: false };
}
