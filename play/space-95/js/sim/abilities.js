




import { touchingWall } from './body.js';
import { GRAVITY, JUMP_VELOCITY, RUN_SPEED, STEP } from './constants.js';
import { glideVy } from './wind.js';

const ABILITIES = ['double', 'dash', 'wall', 'pound', 'glide'];

const DOUBLE_JUMP_HEIGHT = 2.0; 
const DOUBLE_JUMP_V = Math.sqrt(2 * GRAVITY * DOUBLE_JUMP_HEIGHT);
const DASH_SPEED = 16; 
const DASH_TIME = 0.16; 
const DASH_COOLDOWN = 0.3; 
const WALL_SLIDE_MAX = 3; 
const WALL_JUMP_VX = 7; 
const WALL_JUMP_VY = JUMP_VELOCITY * 0.92;
const WALL_LOCK = 0.12; 
const WALL_COYOTE = 0.08; 
const POUND_HANG = 0.1; 
const POUND_SPEED = 26; 


export function parseAbilities(list) {
  if (!list) return new Set();
  if (list === 'all') return new Set(ABILITIES);
  return new Set(list.split(',').filter((a) => ABILITIES.includes(a)));
}

export function abilityState() {
  return {
    usedDouble: false,
    dashT: 0,
    dashDir: 0,
    dashUsed: false,
    dashCool: 0,
    pound: null,
    poundT: 0,
    wallDir: 0,
    sinceWall: 9,
    wallLock: 0,
    prevDash: false,
    prevDown: false,
    glideArm: false, 
  };
}


const has = (p, a) => p.abilities?.has(a);





export function abilityJumps(p, input, world) {
  const A = p.ab;
  const unconsumed = p.sincePressed === 0;
  if (!unconsumed || p.grounded) return;
  if (has(p, 'wall') && A.sinceWall <= WALL_COYOTE && A.wallDir !== 0) {
    p.vx = -A.wallDir * WALL_JUMP_VX;
    p.vy = WALL_JUMP_VY;
    p.facing = -A.wallDir;
    A.wallLock = WALL_LOCK;
    A.sinceWall = 9;
    A.usedDouble = false; 
    startJumpArc(p);
    p.events.push({ type: 'wallJump', dir: -A.wallDir });
    return;
  }
  
  
  if (has(p, 'glide')) A.glideArm = true;
  if (has(p, 'double') && !A.usedDouble && A.pound === null) {
    A.usedDouble = true;
    p.vy = DOUBLE_JUMP_V;
    startJumpArc(p);
    p.events.push({ type: 'doubleJump' });
  }
  void world;
}

function startJumpArc(p) {
  p.jumpedThisAir = true;
  p.rising = true;
  p.jumpTime = 0;
  p.cut = false;
  p.sincePressed = Number.POSITIVE_INFINITY;
}


export function abilityHorizontal(p, input, dir) {
  const A = p.ab;
  const dashPressed = input.dash && !A.prevDash;
  A.prevDash = !!input.dash;
  if (A.dashCool > 0) A.dashCool -= STEP;
  if (A.wallLock > 0) {
    A.wallLock -= STEP;
    if (dir === A.wallDir) p.vx = -A.wallDir * WALL_JUMP_VX; 
  }
  if (has(p, 'dash') && dashPressed && A.dashT <= 0 && !A.dashUsed && A.dashCool <= 0 && A.pound === null) {
    A.dashT = DASH_TIME;
    A.dashDir = dir || p.facing;
    if (!p.grounded) A.dashUsed = true;
    p.events.push({ type: 'dash', dir: A.dashDir });
  }
  if (A.dashT > 0) {
    A.dashT -= STEP;
    p.vx = A.dashDir * DASH_SPEED;
    p.vy = 0;
    if (A.dashT <= 0) {
      p.vx = A.dashDir * RUN_SPEED; 
      A.dashCool = DASH_COOLDOWN;
    }
  }
}





export function abilityGravity(p, input, dir, world) {
  const A = p.ab;
  const downPressed = input.down && !A.prevDown;
  A.prevDown = !!input.down;
  if (!input.jump || input.down || p.grounded) A.glideArm = false; 
  if (A.dashT > 0) {
    p.gliding = A.glideArm && p.wasGliding; 
    return true;
  }
  if (has(p, 'pound') && downPressed && !p.grounded && A.pound === null) {
    A.pound = 'hang';
    A.poundT = POUND_HANG;
    p.vx = 0;
    p.vy = 0;
    p.rising = false;
    p.events.push({ type: 'poundStart' });
  }
  if (A.pound === 'hang') {
    p.vx = 0;
    p.vy = 0;
    A.poundT -= STEP;
    if (A.poundT <= 0) A.pound = 'fall';
    return true;
  }
  if (A.pound === 'fall') {
    p.vx = 0;
    p.vy = -POUND_SPEED;
    return true;
  }
  if (A.glideArm && A.pound === null && (p.vy <= 0 || p.wasGliding)) {
    p.gliding = true;
    p.vy = glideVy(world, p);
    return true;
  }
  if (has(p, 'wall') && !p.grounded && A.wallDir !== 0 && dir === A.wallDir && p.vy < 0) {
    p.vy -= GRAVITY * STEP;
    if (p.vy < -WALL_SLIDE_MAX) p.vy = -WALL_SLIDE_MAX;
    return true;
  }
  return false;
}


export function abilityAfterMove(p, world, dir, landed) {
  const A = p.ab;
  const wall = !p.grounded && dir !== 0 && touchingWall(world, p, dir) ? dir : 0;
  if (wall) {
    if (A.wallDir === 0 && has(p, 'wall')) p.events.push({ type: 'wallSlide' });
    A.wallDir = wall;
    A.sinceWall = 0;
  } else {
    A.sinceWall += STEP;
    if (A.sinceWall > WALL_COYOTE) A.wallDir = 0;
  }
  if (p.grounded) {
    A.glideArm = false;
    A.usedDouble = false;
    A.dashUsed = false;
    A.wallDir = 0;
    if (landed && A.pound === 'fall') p.events.push({ type: 'pound', x: p.x, y: p.y });
    A.pound = null;
  }
}
