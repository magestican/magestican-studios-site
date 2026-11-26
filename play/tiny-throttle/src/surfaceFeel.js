














import { GRIP, SIM_SCALE } from '../../../web-engine/rc/rcTuning.js';

export const SURFACE_FEEL = Object.freeze({
  tile: Object.freeze({ cap: 1, tyre: 'tyreTile', skid: 'skid' }),
  connector: Object.freeze({ cap: 1, tyre: 'tyreConnector', skid: 'skid' }),
  deck: Object.freeze({ cap: 0.97, tyre: 'tyreDeck', skid: 'skid' }),
  floorboards: Object.freeze({ cap: 0.97, tyre: 'tyreBoards', skid: 'skid' }),
  
  
  rug: Object.freeze({ cap: 0.95, tyre: 'tyreRug', skid: 'skidRug' }),
  lawn: Object.freeze({ cap: 0.86, tyre: 'tyreLawn', skid: 'skidLawn' }),
  sand: Object.freeze({ cap: 0.78, tyre: 'tyreSand', skid: 'skidSand' }),
  
  
  wet: Object.freeze({ cap: 1, tyre: 'tyreTile', skid: 'skid' }),
  wetSand: Object.freeze({ cap: 0.85, tyre: 'tyreSand', skid: 'skidSand' }),
});
for (const name of Object.keys(GRIP)) {
  if (!SURFACE_FEEL[name]) throw new Error(`surfaceFeel: surface "${name}" has grip but no feel row`);
}

export const TYRE_LOOPS = Object.freeze([...new Set(Object.values(SURFACE_FEEL).map((f) => f.tyre))]);

export const feelOf = (surface) => {
  const f = SURFACE_FEEL[surface];
  if (!f) throw new Error(`surfaceFeel: no feel for surface "${surface}"`);
  return f;
};

export const BOG = Object.freeze({
  rate: 4, 
});


export function bogKart(kart, surface, dt) {
  const { cap } = feelOf(surface);
  if (cap >= 1 || !kart.grounded || !(dt > 0)) return kart;
  const top = kart.tuning?.topSpeed;
  if (!(top > 0)) return kart;
  const speed = Math.hypot(kart.vx, kart.vz);
  const limit = top * cap;
  if (speed <= limit) return kart;
  const next = speed - (speed - limit) * Math.min(1, BOG.rate * dt);
  const k = next / speed;
  return { ...kart, vx: kart.vx * k, vz: kart.vz * k };
}

export const TYRE = Object.freeze({
  full: 3, 
  top: 4.5, 
  rate: Object.freeze([0.6, 1.8]), 
  fade: 10, 
  slip: 0.35, 
  skidSpeed: 1, 
  cooldown: 0.4, 
  motorRate: Object.freeze([0.6, 2.2]), 
});

export function createTyres() {
  const gains = {};
  for (const name of TYRE_LOOPS) gains[name] = 0;
  return { gains, sliding: false, cool: 0 };
}





export function stepTyres(st, { surface, kart, air, dt }) {
  const feel = SURFACE_FEEL[surface] ?? SURFACE_FEEL.tile;
  const speed = Math.hypot(kart.vx ?? 0, kart.vz ?? 0) / SIM_SCALE;
  const share = Math.min(1, speed / TYRE.top);
  const target = air ? 0 : Math.min(1, speed / TYRE.full) ** 0.8;
  const a = Math.min(1, TYRE.fade * Math.max(0, dt));
  for (const name of TYRE_LOOPS) {
    const want = name === feel.tyre ? target : 0;
    st.gains[name] += (want - st.gains[name]) * a;
    if (st.gains[name] < 1e-4) st.gains[name] = 0;
  }
  
  let slip = 0;
  if (speed > 0.05) {
    slip = (kart.heading ?? 0) - Math.atan2(kart.vx, kart.vz);
    while (slip > Math.PI) slip -= Math.PI * 2;
    while (slip < -Math.PI) slip += Math.PI * 2;
    if (Math.abs(slip) > Math.PI / 2) slip -= Math.sign(slip) * Math.PI;
  }
  st.cool = Math.max(0, st.cool - Math.max(0, dt));
  const sliding = !air && speed >= TYRE.skidSpeed && Math.abs(slip) > TYRE.slip;
  let skid = null;
  if (sliding && !st.sliding && st.cool <= 0) { skid = feel.skid; st.cool = TYRE.cooldown; }
  st.sliding = sliding;
  const [r0, r1] = TYRE.rate;
  const [m0, m1] = TYRE.motorRate;
  return { gains: st.gains, rate: Math.min(r1, r0 + (r1 - r0) * share), motorRate: Math.min(m1, m0 + (m1 - m0) * share), skid };
}
