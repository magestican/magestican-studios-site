































export const JUMP = Object.freeze({
  speed: 9.0,          
  airSpeedFactor: 0.95, 
  airJumps: 1,         
  gravity: -30.0,
  terminalVelocity: -30.0,
});

export function newJumpState() {
  return {
    airJumpsLeft: JUMP.airJumps,
    
    
    
    
    latched: false,
  };
}

















export function stepJump(state, { velY, grounded, jumpDown, dt }) {
  let jumped = null;

  
  if (grounded) state.airJumpsLeft = JUMP.airJumps;

  
  if (!jumpDown) state.latched = false;

  if (jumpDown && !state.latched) {
    if (grounded) {
      velY = JUMP.speed;
      state.latched = true;
      jumped = 'ground';
    } else if (state.airJumpsLeft > 0) {
      
      
      velY = JUMP.speed * JUMP.airSpeedFactor;
      state.airJumpsLeft--;
      state.latched = true;
      jumped = 'air';
    }
    
    
    
    
  }

  
  
  
  velY += JUMP.gravity * dt;
  if (velY < JUMP.terminalVelocity) velY = JUMP.terminalVelocity;

  
  
  
  if (grounded && velY < 0) velY = 0;

  return { velY, jumped };
}
