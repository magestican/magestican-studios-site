




























export function createTriggerLatch() {
  return {
    
    
    blocked: false,
    
    
    lastWeapon: null,
  };
}















export function triggerAllowed(latch, down, weapon) {
  if (!latch) return !!down;
  if (!down) {
    
    
    
    latch.blocked = false;
    latch.lastWeapon = weapon;
    return false;
  }
  
  
  if (latch.lastWeapon !== null && weapon !== latch.lastWeapon) latch.blocked = true;
  latch.lastWeapon = weapon;
  return !latch.blocked;
}









export function blockUntilRelease(latch) {
  if (latch) latch.blocked = true;
}
