




export const LIFE = {
  BREATHE: 0.025, 
  PERIOD: 1.7, 
  SLEEP_PERIOD: 3.2, 
  SLEEP_DEPTH: 1.6, 
  MAX_LEAN: 0.12, 
  LEAN_PER_SPEED: 0.018, 
  LEAN_EASE: 10, 
  LAND: 0.16, 
  LAND_DECAY: 16, 
  CROUCH: 0.08, 
  CROUCH_EASE: 14, 
};

const ANTICIPATE = /^(windup|telegraph|charge|aim|crouch|tense)/;
const STILL = new Set(['gone', 'hidden']);


function phaseOf(id) {
  const s = String(id ?? '');
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}


export function createLife(id) {
  return { t: phaseOf(id), lean: 0, land: 0, crouch: 0, grounded: null };
}








export function stepLife(life, e, dt) {
  if (STILL.has(e.state)) {
    life.lean = 0;
    life.land = 0;
    life.crouch = 0;
    life.grounded = e.grounded ?? null;
    return { sx: 1, sy: 1, lean: 0 };
  }
  const asleep = !!(e.dozing || e.sleeping || e.asleep);
  const period = asleep ? LIFE.SLEEP_PERIOD : LIFE.PERIOD;
  life.t += dt / period;
  life.t -= Math.floor(life.t);

  
  if (life.grounded === false && e.grounded === true) life.land = LIFE.LAND;
  life.grounded = e.grounded ?? null;
  life.land *= Math.exp(-dt * LIFE.LAND_DECAY);

  const crouchTo = ANTICIPATE.test(e.state ?? '') ? LIFE.CROUCH : 0;
  life.crouch += (crouchTo - life.crouch) * (1 - Math.exp(-dt * LIFE.CROUCH_EASE));

  const speed = Math.abs(e.vx ?? 0);
  const leanTo = -Math.min(LIFE.MAX_LEAN, speed * LIFE.LEAN_PER_SPEED);
  life.lean += (leanTo - life.lean) * (1 - Math.exp(-dt * LIFE.LEAN_EASE));

  
  const calm = Math.max(0, 1 - speed / 2) * (e.grounded === false ? 0 : 1);
  const breath = Math.sin(life.t * Math.PI * 2) * LIFE.BREATHE * (asleep ? LIFE.SLEEP_DEPTH : 1) * calm;
  const squash = life.land + life.crouch; 
  const sy = Math.min(1 + LIFE.BREATHE * LIFE.SLEEP_DEPTH, Math.max(0.6, 1 + breath - squash));
  return { sx: 1 / sy, sy, lean: life.lean };
}
