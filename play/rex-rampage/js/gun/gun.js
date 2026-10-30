



export const GUN = { rate: 6, clip: 12, autoReloadS: 1.0, holdReloadS: 1.5, keepS: 0.5, drainPerS: 1 };
const EPS = 1e-6;
const INTERVAL = 1 / GUN.rate;




export function createGun({ autoReload }) {
  return { ammo: GUN.clip, reloading: 0, acc: INTERVAL, keep: 0, autoReload };
}

function refill(g) {
  g.ammo = GUN.clip;
  g.reloading = 0;
  g.keep = 0;
}






export function stepGun(g, dt, { onTarget, up, lowered }) {
  const aiming = !lowered && !up && onTarget;
  
  if (aiming && g.ammo > 0 && g.reloading > 0) {
    g.reloading = 0;
    g.keep = 0;
  }
  let shots = 0;
  if (aiming && g.ammo > 0 && g.reloading === 0) {
    g.acc += dt;
    shots = Math.min(g.ammo, Math.floor((g.acc + EPS) / INTERVAL));
    g.ammo -= shots;
    g.acc -= shots * INTERVAL;
    if (g.ammo === 0) g.acc = INTERVAL;
  } else {
    
    g.acc = Math.min(INTERVAL, g.acc + dt);
  }

  if (g.autoReload && g.ammo === 0) {
    g.reloading += dt / GUN.autoReloadS;
    if (g.reloading >= 1 - EPS) refill(g);
  } else if (up && !lowered && g.ammo < GUN.clip) {
    g.reloading += dt / GUN.holdReloadS;
    g.keep = GUN.keepS;
    if (g.reloading >= 1 - EPS) refill(g);
  } else if (g.reloading > 0) {
    const kept = Math.min(g.keep, dt);
    g.keep -= kept;
    g.reloading = Math.max(0, g.reloading - (dt - kept) * GUN.drainPerS);
  }
  return shots;
}
