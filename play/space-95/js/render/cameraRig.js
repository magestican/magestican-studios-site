




const LOOK_AHEAD = 4; 
const LOOK_AHEAD_RATE = 2.5; 
const DEAD_ZONE_UP = 1.6; 
const DEAD_ZONE_DOWN = 0.6; 
const FALL_LOOK = 2.5; 
const FALL_LOOK_SPEED = 10; 
const FOLLOW_Y_RATE = 6; 
const CLIMB_LOOK = 3; 


const WALL_HOLD = 0.5; 





const DESCENT_LOOK = 6; 
const DESCENT_LOOK_SPEED = 6; 
const WEB_LEAD_SPEED = 12; 









const RIDE_LEAD_SHARE = 0.6;


export const rideLead = (halfW) => halfW * RIDE_LEAD_SHARE;

export function createCameraRig(x, y) {
  return { x, y, focusY: y, ahead: 0, fallLook: 0, upLook: 0, wallT: 0 };
}







export function updateCameraRig(cam, target, dt, runSpeed) {
  const k = (rate) => 1 - Math.exp(-rate * dt);
  const vx = target.vx + (target.carryVx ?? 0);
  const boreSide = target.drilling === 'side';
  const speedFrac = boreSide ? 1 : Math.min(1, Math.abs(vx) / runSpeed);
  const wantAhead =
    target.rideLead != null
      ? target.rideLead
      : (boreSide ? Math.sign(target.facing) : Math.sign(vx || target.facing)) * LOOK_AHEAD * speedFrac;
  cam.ahead += (wantAhead - cam.ahead) * k(LOOK_AHEAD_RATE);
  cam.x = target.x + cam.ahead;

  
  cam.wallT = target.wall ? WALL_HOLD : Math.max(0, (cam.wallT ?? 0) - dt);
  const climbing = target.climbing || cam.wallT > 0 || target.drilling === 'up' || target.drilling === 'brace';
  if (target.grounded || climbing) cam.focusY += (target.y - cam.focusY) * k(FOLLOW_Y_RATE * 0.6);
  else if (target.y > cam.focusY + DEAD_ZONE_UP) cam.focusY = target.y - DEAD_ZONE_UP;
  else if (target.y < cam.focusY - DEAD_ZONE_DOWN) cam.focusY = target.y + DEAD_ZONE_DOWN;
  const descent = !!target.descent;
  const falling = target.vy < -(descent ? DESCENT_LOOK_SPEED : FALL_LOOK_SPEED);
  cam.fallLook += ((falling ? (descent ? DESCENT_LOOK : FALL_LOOK) : 0) - cam.fallLook) * k(3);
  
  
  
  
  const webLead = target.webLaunch && target.vy > WEB_LEAD_SPEED ? target.vy / FOLLOW_Y_RATE : 0;
  const lead = descent && !target.grounded && target.vy < 0 ? target.vy / FOLLOW_Y_RATE : webLead;
  const up = climbing || target.vy > 6;
  cam.upLook += ((up ? CLIMB_LOOK : 0) - cam.upLook) * k(2);
  cam.y += (cam.focusY - cam.fallLook + cam.upLook + lead - cam.y) * k(FOLLOW_Y_RATE);
  return cam;
}







export const TRAIN_CAM = Object.freeze({
  lead: 6, 
  leadRate: 2, 
  cruise: 8,
  maxLeadScale: 1.625,
  height: 32, 
  back: 11.5, 
  fovY: (2 * Math.atan(6.2 / 20) * 180) / Math.PI, 
});

export function createTrainRig(x, y) {
  return { x, y, lx: 0, ly: 0 };
}






export function updateTrainRig(cam, target, dt) {
  const k = 1 - Math.exp(-TRAIN_CAM.leadRate * dt);
  const lead = TRAIN_CAM.lead * Math.min(TRAIN_CAM.maxLeadScale, Math.max(0, target.v / TRAIN_CAM.cruise));
  cam.lx += (target.hx * lead - cam.lx) * k;
  cam.ly += (target.hy * lead - cam.ly) * k;
  cam.x = target.x + cam.lx;
  cam.y = target.y + cam.ly;
  return cam;
}


export function trainCameraPose(cam) {
  return { position: [cam.x, cam.y - TRAIN_CAM.back, TRAIN_CAM.height], lookAt: [cam.x, cam.y, 0], fovY: TRAIN_CAM.fovY };
}


export function floorView(pose, aspect) {
  const [px, py, pz] = pose.position;
  const [lx, ly, lz] = pose.lookAt;
  const norm = (v) => {
    const l = Math.hypot(...v);
    return v.map((c) => c / l);
  };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const f = norm([lx - px, ly - py, lz - pz]);
  const r = norm(cross(f, [0, 1, 0]));
  const u = cross(r, f);
  const ty = Math.tan((pose.fovY * Math.PI) / 360);
  const tx = ty * aspect;
  return [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ].map(([sx, sy]) => {
    const d = [0, 1, 2].map((i) => f[i] + r[i] * sx * tx + u[i] * sy * ty);
    const t = -pz / d[2];
    return [px + d[0] * t, py + d[1] * t];
  });
}
