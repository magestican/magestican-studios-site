// Decides WHICH announcement fires for a kill. Pure logic, no audio, no DOM,
// so the rules are unit-tested (killAnnouncer.test.mjs).
//
// Rules are the arena-shooter classics:
//   * first kill of the match          -> FIRST_BLOOD
//   * kills stacked inside a 4 s window -> DOUBLE / MULTI / ULTRA / MONSTER
//   * kills without dying              -> SPREE / RAMPAGE / DOMINATING /
//                                         UNSTOPPABLE / GODLIKE
//   * killed with the shovel           -> HUMILIATION (melee humiliation)
//   * killed the player who last killed you -> REVENGE
//
// Multi-kill and spree can both fire on one kill; the multi-kill is returned
// first because it's the more immediate feedback.

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
    this._state = new Map();   // playerId -> { spree, multi, lastKillAt, lastKilledBy }
  }

  _for(id) {
    if (!this._state.has(id)) {
      this._state.set(id, { spree: 0, multi: 0, lastKillAt: -Infinity, lastKilledBy: null });
    }
    return this._state.get(id);
  }

  // Returns an array of phrase keys (usually 0 or 1, at most 2).
  registerKill({ killer, victim, weapon, atMs }) {
    // Suicides and environmental deaths announce nothing and break the spree.
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
      // Cap at the top tier: a 7-kill chain stays MONSTER_KILL rather than
      // going silent.
      const tier = MULTI_TIERS.find(([n]) => k.multi >= n);
      if (tier) out.push(tier[1]);
    }

    const spreeTier = SPREE_TIERS.find(([n]) => k.spree === n);
    if (spreeTier) out.push(spreeTier[1]);

    // Flavour lines only fire when nothing louder already did.
    if (out.length === 0) {
      if (k.lastKilledBy === victim) out.push('REVENGE');
      else if (weapon === 'shovel') out.push('HUMILIATION');
    }

    this.registerDeath(victim, killer);
    return out;
  }

  // A death ends the victim's spree and multi-kill chain.
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

// Which announcements a given client should actually HEAR. Your own events
// always play; other players' only break through at RAMPAGE and above, or
// you'd hear an announcer over a 6-bot match non-stop.
const REMOTE_AUDIBLE = new Set(['RAMPAGE', 'DOMINATING', 'UNSTOPPABLE', 'GODLIKE', 'MONSTER_KILL']);

export function shouldHear(phraseKey, { killer, victim, listener }) {
  // Being on the receiving end is half the joke -- the victim hears it too.
  if (killer === listener || victim === listener) return true;
  return REMOTE_AUDIBLE.has(phraseKey);
}
