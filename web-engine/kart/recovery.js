
























export const WRONG_WAY_GRACE = 1.0;


export const LOST_GRACE = 3.0;








export const RELEASE_ANGLE = 0.6;


const CRAWL = 3;

export function createRecovery() {
  return { wrongFor: 0, lostFor: 0, active: false, reason: null, heldFor: 0 };
}

const wrapAngle = (a) => {
  let x = a;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x < -Math.PI) x += Math.PI * 2;
  return x;
};











export function headingError(kart, surface) {
  const speed = kart.speed ?? 0;
  const dir = Math.abs(speed) > CRAWL && (kart.vx !== 0 || kart.vz !== 0)
    ? Math.atan2(kart.vx, kart.vz)
    : kart.heading;
  return wrapAngle(surface.heading - dir);
}







export function stepRecovery(rec, { kart, surface, dt, enabled = true }) {
  if (!enabled || !surface) {
    rec.wrongFor = 0; rec.lostFor = 0; rec.active = false; rec.reason = null;
    return null;
  }
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (kart.gliding || kart.grinding) {
    rec.wrongFor = 0;
    rec.lostFor = 0;
    rec.active = false;
    rec.reason = null;
    return null;
  }

  
  
  
  if (kart.spinTime > 0) {
    rec.wrongFor = 0;
    return rec.active ? hold(rec, kart, surface) : null;
  }

  const err = headingError(kart, surface);
  
  
  const wrongWay = Math.abs(err) > Math.PI / 2;

  rec.wrongFor = wrongWay ? rec.wrongFor + dt : 0;
  rec.lostFor = surface.lost ? rec.lostFor + dt : 0;

  if (!rec.active) {
    if (rec.wrongFor > WRONG_WAY_GRACE) { rec.active = true; rec.reason = 'wrong-way'; rec.heldFor = 0; }
    else if (rec.lostFor > LOST_GRACE) { rec.active = true; rec.reason = 'lost'; rec.heldFor = 0; }
    else return null;
  }

  rec.heldFor += dt;
  
  
  if (Math.abs(err) < RELEASE_ANGLE && !surface.lost) {
    rec.active = false; rec.reason = null; rec.wrongFor = 0; rec.lostFor = 0;
    return null;
  }
  return hold(rec, kart, surface);
}


function hold(rec, kart, surface) {
  const err = headingError(kart, surface);
  
  
  
  
  
  
  const steer = Math.max(-1, Math.min(1, -err * 2.4));

  
  
  
  
  
  const facing = Math.abs(err);
  let throttle;
  if (facing > 2.2) throttle = 0.35;       
  else if (facing > 1.0) throttle = 0.6;
  else throttle = 1;
  return { steer, throttle, reason: rec.reason };
}


export const isRecovering = (rec) => !!(rec && rec.active);




























































export const UNRECOVERABLE_OVER = 34;

























export const UNRECOVERABLE_GRACE = 1.25;





















export function isUnrecoverable(surface, kart) {
  if (!surface || !kart) return false;
  
  
  
  if (!surface.lost) return false;
  if ((surface.overBy ?? 0) < UNRECOVERABLE_OVER) return false;
  
  if (!kart.grounded) return false;
  
  
  
  
  
  
  
  
  
  
  if (kart.gliding) return false;
  
  
  
  
  
  
  
  
  
  
  if (kart.grinding) return false;
  return (kart.lostTime ?? 0) >= UNRECOVERABLE_GRACE;
}
