







export const WATCHED = ['ashlo', 'kingshade', 'glacius', 'pyrecrown'];
export const watchDue = (flags, boss) => WATCHED.includes(boss) && !((flags && flags.watched) || {})[boss];
export const markWatched = (flags, boss) => ({ ...((flags && flags.watched) || {}), [boss]: true });


export const WATCH = {
  appear: 0.5,    
  spread: 1.9,    
  laugh: 2.4,     
  lift: 2.9,      
  gone: 4.9,      
  end: 6.0,       
};
export const SPREAD_TIME = 0.45;
export const DARK = 0.38; 

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ease = (v) => v * v * (3 - 2 * v);








export const FLAP_HZ = 1.5;
export function flapPose(ph) {
  const s = Math.sin(ph), c = Math.cos(ph);
  return {
    arm: { raise: 0.12 + 0.78 * c, sweep: 0.12 - 0.2 * s },
    hand: { raise: 0.4 * s, fold: 0.62 * Math.pow(Math.max(0, -s), 0.8) },
    thrust: Math.max(0, s),
  };
}

export const WING_FOLDED = { arm: { raise: -0.35, sweep: 1.45 }, hand: { raise: -0.3, fold: 0.3 } }; 
export const WING_OPEN = { arm: { raise: 0.32, sweep: 0.18 }, hand: { raise: 0.12, fold: 0.12 } };
const lerpPose = (a, b, k) => ({
  arm: { raise: a.arm.raise + (b.arm.raise - a.arm.raise) * k, sweep: a.arm.sweep + (b.arm.sweep - a.arm.sweep) * k },
  hand: { raise: a.hand.raise + (b.hand.raise - a.hand.raise) * k, fold: a.hand.fold + (b.hand.fold - a.hand.fold) * k },
});


const flyPhase = (fly) => -Math.PI / 2 + Math.PI * 2 * FLAP_HZ * fly;
function climb(fly) {
  let rise = 0, v = 0;
  const dt = 1 / 60;
  for (let x = 0; x < fly; x += dt) {
    v += (flapPose(flyPhase(x)).thrust * 30 - 5) * dt;
    if (rise <= 0 && v < 0) v = 0;
    rise = Math.max(0, rise + v * dt);
  }
  return { rise, v };
}



export function watchAt(t) {
  const W = WATCH;
  const shown = t < W.gone ? clamp01(t / W.appear) : 0;
  const spread = ease(clamp01((t - W.spread) / SPREAD_TIME));
  const fly = Math.max(0, t - W.lift);
  const held = lerpPose(WING_FOLDED, WING_OPEN, spread);
  const fp = flapPose(flyPhase(fly));
  const wing = fly > 0 ? lerpPose(held, fp, ease(clamp01(fly / 0.2))) : held;
  const { rise } = fly > 0 ? climb(fly) : { rise: 0 };
  const bob = fly > 0 ? -0.06 * Math.cos(flyPhase(fly)) : 0;
  const away = fly > 0 ? 0.9 * fly * fly : 0;
  const darkIn = ease(clamp01((t - W.laugh + 0.2) / 0.8)), darkOut = ease(clamp01((t - W.gone) / (W.end - W.gone)));
  const dark = DARK * darkIn * (1 - darkOut);
  return { shown, spread, wing, bob, rise, away, dark, done: t >= W.end };
}




export const WATCH_SIDE = 1.3, WATCH_UP = 2.2;
export const WATCH_DIST = Math.hypot(WATCH_SIDE, WATCH_UP);
export function watchSpot(px, py, side = 1) {
  const r = side * WATCH_SIDE / Math.SQRT2, u = WATCH_UP / Math.SQRT2;
  return [px + r - u, py - r - u];
}


export function watchSpots(px, py) {
  const out = [];
  for (const k of [1, 0.75, 1.3]) for (const side of [1, -1]) {
    const r = side * WATCH_SIDE * k / Math.SQRT2, u = WATCH_UP * k / Math.SQRT2;
    out.push([px + r - u, py - r - u]);
  }
  return out;
}
