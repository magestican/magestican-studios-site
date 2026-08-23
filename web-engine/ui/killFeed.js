


























export const KILL_FEED_MAX = 5;
export const KILL_FEED_TTL_MS = 6000;




const WEAPON_LABEL = Object.freeze({
  shovel:  'shovel',
  shotgun: 'shotgun',
  rocket:  'rocket',
  chicken: 'chicken',
  steak:   'steak poison',
  hazard:  'the weather',
});










export function killFeedLine({ killerName, victimName, weapon } = {}) {
  const victim = String(victimName ?? '?');
  const what = WEAPON_LABEL[weapon] || (weapon ? String(weapon) : 'the void');
  if (!killerName || killerName === victim) return `${victim} ☠ ${what}`;
  return `${killerName} ➜ ${victim} · ${what}`;
}








export class KillFeed {
  constructor({ max = KILL_FEED_MAX, ttlMs = KILL_FEED_TTL_MS } = {}) {
    this.max = max;
    this.ttlMs = ttlMs;
    this.entries = [];
  }

  push(text, nowMs) {
    if (!text) return this.entries;
    this.entries.push({ text: String(text), at: nowMs });
    
    
    while (this.entries.length > this.max) this.entries.shift();
    return this.entries;
  }

  
  lines(nowMs) {
    this.entries = this.entries.filter((e) => nowMs - e.at < this.ttlMs);
    return this.entries.map((e) => e.text);
  }

  clear() { this.entries = []; }
}
