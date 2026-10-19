




const LOOK_AHEAD = 3; 
const LOOK_AHEAD_RATE = 2.5; 
const DEAD_ZONE_UP = 1.6; 
const DEAD_ZONE_DOWN = 0.6; 
const FALL_LOOK = 2.5; 
const FALL_LOOK_SPEED = 10; 
const FOLLOW_Y_RATE = 6; 
const CLIMB_LOOK = 3; 


const WALL_HOLD = 0.5; 

export function createCameraRig(x, y) {
  return { x, y, focusY: y, ahead: 0, fallLook: 0, upLook: 0, wallT: 0 };
}







export function updateCameraRig(cam, target, dt, runSpeed) {
  const k = (rate) => 1 - Math.exp(-rate * dt);
  const vx = target.vx + (target.carryVx ?? 0);
  const speedFrac = Math.min(1, Math.abs(vx) / runSpeed);
  const wantAhead = Math.sign(vx || target.facing) * LOOK_AHEAD * speedFrac;
  cam.ahead += (wantAhead - cam.ahead) * k(LOOK_AHEAD_RATE);
  cam.x = target.x + cam.ahead;

  
  cam.wallT = target.wall ? WALL_HOLD : Math.max(0, (cam.wallT ?? 0) - dt);
  const climbing = target.climbing || cam.wallT > 0;
  if (target.grounded || climbing) cam.focusY += (target.y - cam.focusY) * k(FOLLOW_Y_RATE * 0.6);
  else if (target.y > cam.focusY + DEAD_ZONE_UP) cam.focusY = target.y - DEAD_ZONE_UP;
  else if (target.y < cam.focusY - DEAD_ZONE_DOWN) cam.focusY = target.y + DEAD_ZONE_DOWN;
  const falling = target.vy < -FALL_LOOK_SPEED;
  cam.fallLook += ((falling ? FALL_LOOK : 0) - cam.fallLook) * k(3);
  const up = climbing || target.vy > 6;
  cam.upLook += ((up ? CLIMB_LOOK : 0) - cam.upLook) * k(2);
  cam.y += (cam.focusY - cam.fallLook + cam.upLook - cam.y) * k(FOLLOW_Y_RATE);
  return cam;
}
