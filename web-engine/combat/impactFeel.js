

























































export const FLASH = Object.freeze({
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  COLOR: 0xff10c8,
  BASE_S: 0.055,             
  PER_DAMAGE_S: 0.0004,      
  DAMAGE_BONUS_CAP_S: 0.035,
  HEADSHOT_SCALE: 1.4,
  KILL_MIN_S: 0.11,
  MAX_S: 0.14,
});







export function flashDuration({ damage = 0, killed = false, headshot = false } = {}) {
  const dmg = Number.isFinite(damage) && damage > 0 ? damage : 0;
  if (dmg <= 0 && !killed) return 0;
  let d = FLASH.BASE_S
        + Math.min(FLASH.DAMAGE_BONUS_CAP_S, dmg * FLASH.PER_DAMAGE_S);
  if (headshot) d *= FLASH.HEADSHOT_SCALE;
  if (killed) d = Math.max(d, FLASH.KILL_MIN_S);
  return Math.min(FLASH.MAX_S, d);
}











export function* flashableMeshes(root) {
  if (!root) return;
  const stack = [root];
  while (stack.length) {
    const n = stack.pop();
    if (!n) continue;
    if (Array.isArray(n.children)) for (const c of n.children) stack.push(c);
    if (!n.material) continue;
    if (n.isSprite) continue;
    if (n.userData && n.userData.noHitFlash) continue;
    yield n;
  }
}











export class HitFlash {
  
  constructor(material = null) {
    this.material = material;
    
    this.held = new Map();
  }

  
  get active() { return this.held.size; }

  




  flash(root, duration) {
    if (!this.material || !(duration > 0)) return 0;
    let n = 0;
    for (const mesh of flashableMeshes(root)) {
      const held = this.held.get(mesh);
      if (held) {
        
        
        
        held.remaining = Math.max(held.remaining, duration);
      } else {
        this.held.set(mesh, { original: mesh.material, remaining: duration });
        mesh.material = Array.isArray(mesh.material)
          ? mesh.material.map(() => this.material)   
          : this.material;
      }
      n++;
    }
    return n;
  }

  
  update(dt) {
    const step = Number.isFinite(dt) && dt > 0 ? dt : 0;
    if (this.held.size === 0) return 0;
    for (const [mesh, held] of this.held) {
      held.remaining -= step;
      if (held.remaining <= 0) {
        mesh.material = held.original;
        this.held.delete(mesh);
      }
    }
    return this.held.size;
  }

  





  clear(root = null) {
    if (root == null) {
      const n = this.held.size;
      for (const [mesh, held] of this.held) mesh.material = held.original;
      this.held.clear();
      return n;
    }
    let n = 0;
    for (const mesh of flashableMeshes(root)) {
      const held = this.held.get(mesh);
      if (!held) continue;
      mesh.material = held.original;
      this.held.delete(mesh);
      n++;
    }
    return n;
  }
}









export const HITSTOP = Object.freeze({
  HIT_S: 0,
  HEADSHOT_S: 0.028,   
  KILL_S: 0.055,       
  MAX_S: 0.06,
  TIME_SCALE: 0.06,    
});





export function hitStopFor({ killed = false, headshot = false, mine = false } = {}) {
  if (!mine) return 0;
  if (killed) return HITSTOP.KILL_S;
  if (headshot) return HITSTOP.HEADSHOT_S;
  return HITSTOP.HIT_S;
}





export function addHitStop(remaining, seconds) {
  const a = Number.isFinite(remaining) && remaining > 0 ? remaining : 0;
  const b = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  return Math.min(HITSTOP.MAX_S, Math.max(a, b));
}








export function stepHitStop(remaining, dt) {
  const real = Number.isFinite(dt) && dt > 0 ? dt : 0;
  const left = Number.isFinite(remaining) && remaining > 0 ? remaining : 0;
  if (left <= 0) return { step: real, remaining: 0, frozen: false };
  return {
    step: real * HITSTOP.TIME_SCALE,
    remaining: Math.max(0, left - real),
    frozen: true,
  };
}
