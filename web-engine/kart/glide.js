

































































































































const clamp = (v, lo, hi) => (v < lo ? lo : (v > hi ? hi : v));
















export const DEPLOY_HEIGHT = 9;






















export const DEPLOY_AIR_TIME = 0.3;











export const SINK_RATE = 8;









export const DIVE_SINK = 32;











export const CATCH_RATE = 26;


export const CRUISE_FRAC = 0.62;


export const THROTTLE_BAND = 0.18;


export const CRUISE_PULL = 14;












export const STEER_AUTHORITY = 0.62;













export const GRIP = 0.7;


export function glideFields() {
  return {
    
    airTime: 0,
    















    airHeight: 0,
    



    gliding: false,
    
    glideTime: 0,
    
    glideDive: false,
    
    glideStarted: false,
    
    glideLanded: false,
  };
}





















export function glideStep(kart, input = {}, ctx = {}) {
  const { height = 0, dt = 0, declared = false, enabled = true } = ctx;
  const airTime = kart.airTime ?? 0;
  const idle = {
    gliding: false, glideTime: 0, dive: false, started: false,
    sink: 0, steer: 0, grip: 0, cruise: 0,
  };

  
  
  
  if (kart.grounded || !enabled) return idle;

  const already = !!kart.gliding;
  
  
  const deploy = already
    || declared
    || (airTime >= DEPLOY_AIR_TIME && height >= DEPLOY_HEIGHT);
  if (!deploy) return idle;

  
  
  
  const dive = !!input.jump;
  const throttle = clamp(input.throttle ?? 0, -1, 1);
  const top = kart.tuning?.topSpeed ?? 40;

  return {
    gliding: true,
    glideTime: already ? (kart.glideTime ?? 0) + dt : 0,
    dive,
    started: !already,
    sink: dive ? DIVE_SINK : SINK_RATE,
    steer: STEER_AUTHORITY,
    grip: GRIP,
    cruise: top * CRUISE_FRAC * (1 + throttle * THROTTLE_BAND),
  };
}













export function glideSink(vy, sink, gravity, dt) {
  const target = -sink;
  if (vy > target) {
    
    
    return Math.max(target, vy - gravity * dt);
  }
  
  
  
  return Math.min(target, vy + CATCH_RATE * dt);
}








export function glideCruise(speed, cruise, dt) {
  const gap = cruise - speed;
  const step = CRUISE_PULL * dt;
  if (Math.abs(gap) <= step) return cruise;
  return speed + Math.sign(gap) * step;
}










export function glideReach(height, speed, sink = SINK_RATE) {
  const t = Math.max(0, height) / Math.max(sink, 1e-6);
  return { time: t, distance: Math.max(0, speed) * t };
}
