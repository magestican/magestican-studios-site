













export const MULTI_WINDOW_MS = 4000;

const MULTI_TIERS = [
  [5, 'MONSTER_KILL'],
  [4, 'ULTRA_KILL'],
  [3, 'MULTI_KILL'],
  [2, 'DOUBLE_KILL'],
];

const SPREE_TIERS = [
  [25, 'GODLIKE'],
  [20, 'UNSTOPPABLE'],
  [15, 'DOMINATING'],
  [10, 'RAMPAGE'],
  [5,  'KILLING_SPREE'],
];

export class KillAnnouncer {
  constructor() { this.reset(); }

  reset() {
    this._firstBlood = false;
    this._state = new Map();   
  }

  _for(id) {
    if (!this._state.has(id)) {
      this._state.set(id, { spree: 0, multi: 0, lastKillAt: -Infinity, lastKilledBy: null });
    }
    return this._state.get(id);
  }

  
  registerKill({ killer, victim, weapon, atMs }) {
    
    if (!killer || killer === victim) {
      this.registerDeath(victim, null);
      return [];
    }

    const k = this._for(killer);
    const out = [];

    if (!this._firstBlood) {
      this._firstBlood = true;
      out.push('FIRST_BLOOD');
    }

    k.multi = (atMs - k.lastKillAt) <= MULTI_WINDOW_MS ? k.multi + 1 : 1;
    k.lastKillAt = atMs;
    k.spree += 1;

    if (k.multi >= 2) {
      
      
      const tier = MULTI_TIERS.find(([n]) => k.multi >= n);
      if (tier) out.push(tier[1]);
    }

    const spreeTier = SPREE_TIERS.find(([n]) => k.spree === n);
    if (spreeTier) out.push(spreeTier[1]);

    
    if (out.length === 0) {
      if (k.lastKilledBy === victim) out.push('REVENGE');
      else if (weapon === 'shovel') out.push('HUMILIATION');
    }

    this.registerDeath(victim, killer);
    return out;
  }

  
  registerDeath(victim, killer) {
    const v = this._for(victim);
    v.spree = 0;
    v.multi = 0;
    v.lastKillAt = -Infinity;
    v.lastKilledBy = killer || null;
  }

  spreeOf(id) { return this._for(id).spree; }
  multiOf(id) { return this._for(id).multi; }
}




const REMOTE_AUDIBLE = new Set(['RAMPAGE', 'DOMINATING', 'UNSTOPPABLE', 'GODLIKE', 'MONSTER_KILL']);

export function shouldHear(phraseKey, { killer, victim, listener }) {
  
  if (killer === listener || victim === listener) return true;
  return REMOTE_AUDIBLE.has(phraseKey);
}
