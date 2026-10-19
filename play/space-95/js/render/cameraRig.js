



const LOOK_AHEAD = 3; 
const LOOK_AHEAD_RATE = 2.5; 
const DEAD_ZONE_UP = 1.6; 
const DEAD_ZONE_DOWN = 0.6; 
const FALL_LOOK = 2.5; 
const FALL_LOOK_SPEED = 10; 
const FOLLOW_Y_RATE = 6; 

export function createCameraRig(x, y) {
  return { x, y, focusY: y, ahead: 0, fallLook: 0 };
}







export function updateCameraRig(cam, target, dt, runSpeed) {
  const k = (rate) => 1 - Math.exp(-rate * dt);
  const speedFrac = Math.min(1, Math.abs(target.vx) / runSpeed);
  const wantAhead = Math.sign(target.vx || target.facing) * LOOK_AHEAD * speedFrac;
  cam.ahead += (wantAhead - cam.ahead) * k(LOOK_AHEAD_RATE);
  cam.x = target.x + cam.ahead;

  
  if (target.grounded) cam.focusY += (target.y - cam.focusY) * k(FOLLOW_Y_RATE * 0.6);
  else if (target.y > cam.focusY + DEAD_ZONE_UP) cam.focusY = target.y - DEAD_ZONE_UP;
  else if (target.y < cam.focusY - DEAD_ZONE_DOWN) cam.focusY = target.y + DEAD_ZONE_DOWN;
  const falling = target.vy < -FALL_LOOK_SPEED;
  cam.fallLook += ((falling ? FALL_LOOK : 0) - cam.fallLook) * k(3);
  cam.y += (cam.focusY - cam.fallLook - cam.y) * k(FOLLOW_Y_RATE);
  return cam;
}
