





























export const REMOTE = Object.freeze({
  






  ease: 12,
  
  turnEase: 10,
  









  jumpM: 3,
});

const TAU = Math.PI * 2;









export function shortestTurn(a, b) {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return d;
}


export function createRemote(body = {}) {
  const at = {
    x: Number(body.x) || 0,
    z: Number(body.z) || 0,
    heading: Number(body.heading) || 0,
    speed: Number(body.speed) || 0,
    state: body.state || 'idle',
    
    jumps: 0,
  };
  return at;
}









export function remoteStep(v, body, dt) {
  if (!v) return v;
  if (!body) return v;
  const tx = Number(body.x);
  const tz = Number(body.z);
  if (!Number.isFinite(tx) || !Number.isFinite(tz)) return v;
  const step = Math.max(0, Math.min(0.1, Number(dt) || 0));

  const far = Math.hypot(tx - v.x, tz - v.z) > REMOTE.jumpM;
  if (far) {
    
    
    v.x = tx;
    v.z = tz;
    v.heading = Number(body.heading) || 0;
    v.jumps += 1;
  } else {
    
    
    const k = 1 - Math.exp(-REMOTE.ease * step);
    v.x += (tx - v.x) * k;
    v.z += (tz - v.z) * k;
    const kt = 1 - Math.exp(-REMOTE.turnEase * step);
    v.heading += shortestTurn(v.heading, Number(body.heading) || 0) * kt;
  }
  
  
  
  v.speed = Number(body.speed) || 0;
  v.state = body.state || 'idle';
  return v;
}











export const visitorsOn = (people, planet) => (people || [])
  .filter((p) => p && (p.planet === undefined || p.planet === planet));








export const visitorLabel = (person) => (person && person.name ? person.name : '');
