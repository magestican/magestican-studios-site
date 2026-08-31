




















export const RIG = Object.freeze({
  pivotHeight: 1.52,      
  
  
  
  
  distance: 3.15,         
  aimDistance: 1.35,      
  shoulder: 0.42,         
  aimShoulder: 0.30,      
  height: 0.34,           
  minDistance: 0.45,      
});




export const FOLLOW = Object.freeze({
  position: 12.0,
  shoulderSwap: 8.0,
  aim: 10.0,
});




export const FOV = Object.freeze({ hip: 62, aim: 44 });

export function emptyCamera(side = 1) {
  return {
    
    
    shoulder: RIG.shoulder * Math.sign(side || 1),
    distance: RIG.distance,
    aim: 0,             
    side: Math.sign(side || 1),
    fov: FOV.hip,
  };
}

const lerp = (a, b, t) => a + (b - a) * t;









export function approach(current, target, rate, dt) {
  if (!(dt > 0)) return current;
  return lerp(current, target, 1 - Math.exp(-rate * dt));
}








export function stepCamera(cam, input, dt, wallDistance = Infinity) {
  const next = { ...cam };

  if (input.swapShoulder) next.side = -cam.side;

  const aimTarget = input.aiming ? 1 : 0;
  next.aim = approach(cam.aim, aimTarget, FOLLOW.aim, dt);

  const wantShoulder = lerp(RIG.shoulder, RIG.aimShoulder, next.aim) * next.side;
  next.shoulder = approach(cam.shoulder, wantShoulder, FOLLOW.shoulderSwap, dt);

  
  
  
  
  
  
  const want = lerp(RIG.distance, RIG.aimDistance, next.aim);
  const allowed = Math.max(RIG.minDistance, Math.min(want, wallDistance));
  next.distance = approach(cam.distance, allowed, FOLLOW.position, dt);
  
  
  next.distance = Math.max(RIG.minDistance, Math.min(next.distance, Math.max(RIG.minDistance, wallDistance)));

  next.fov = lerp(FOV.hip, FOV.aim, next.aim);
  return next;
}









export function cameraPlacement(cam, pos, yaw) {
  const sin = Math.sin(yaw); const cos = Math.cos(yaw);
  const pivot = { x: pos.x, y: pos.y + RIG.pivotHeight, z: pos.z };
  
  const right = { x: cos, z: -sin };
  const back = { x: -sin, z: -cos };
  return {
    eye: {
      x: pivot.x + right.x * cam.shoulder + back.x * cam.distance,
      y: pivot.y + RIG.height,
      z: pivot.z + right.z * cam.shoulder + back.z * cam.distance,
    },
    
    
    
    
    target: {
      x: pivot.x + right.x * cam.shoulder - back.x * 6,
      y: pivot.y - 0.06,
      z: pivot.z + right.z * cam.shoulder - back.z * 6,
    },
    fov: cam.fov,
  };
}
