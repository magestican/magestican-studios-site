



export const STEP = 1 / 120; 
export const TILE = 0.5; 


export const BODY_W = 0.5;
export const BODY_H = 1.0;


export const RUN_SPEED = 8; 
const ACCEL_TIME = 0.1; 
const DECEL_TIME = 0.08; 
export const AIR_CONTROL = 0.85; 
export const TURN_FLIP_FRACTION = 0.5; 
export const TURN_SKID_TIME = 0.06; 


const JUMP_HEIGHT = 3.2; 
const JUMP_TIME = 0.38; 
export const JUMP_RELEASE_CUT = 0.45; 


export const JUMP_MIN_HOLD = 0.044; 
export const AIR_CARRY_HELD = 1.0; 
export const AIR_CARRY_RELEASED = 0.92; 
export const APEX_HANG_GRAVITY = 0.5; 
export const APEX_HANG_SPEED = 1.5; 
export const FALL_GRAVITY = 1.7; 
export const MAX_FALL = 18; 
export const MAX_FAST_FALL = 24; 


export const COYOTE_TIME = 0.1; 
export const JUMP_BUFFER = 0.12; 
export const LEDGE_ASSIST = 0.25; 
export const CORNER_CORRECTION = 0.2; 
export const LANDING_FORGIVENESS = 0.15; 


export const GRAVITY = (2 * JUMP_HEIGHT) / (JUMP_TIME * JUMP_TIME); 
export const JUMP_VELOCITY = (2 * JUMP_HEIGHT) / JUMP_TIME; 
export const GROUND_ACCEL = RUN_SPEED / ACCEL_TIME;
export const GROUND_DECEL = RUN_SPEED / DECEL_TIME;
