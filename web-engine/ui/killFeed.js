






























export const KILL_FEED_MAX = 3;
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



















export function killFeedEntry({
  killerName, killerTeam, killerCharacter,
  victimName, victimTeam, victimCharacter,
  weapon,
} = {}) {
  const victim = String(victimName ?? '?');
  const killer = killerName == null ? null : String(killerName);
  
  
  
  const suicide = !killer || killer === victim;
  return {
    suicide,
    killer: suicide ? null : {
      name: killer,
      team: killerTeam || null,
      character: killerCharacter || null,
    },
    victim: {
      name: victim,
      team: victimTeam || null,
      character: victimCharacter || null,
    },
    weapon: weapon || null,
    weaponLabel: WEAPON_LABEL[weapon] || (weapon ? String(weapon) : 'the void'),
  };
}



export function toText(entry) {
  if (!entry) return '';
  if (typeof entry === 'string') return entry;
  if (entry.suicide) return `${entry.victim.name} ☠ ${entry.weaponLabel}`;
  return `${entry.killer.name} ➜ ${entry.victim.name} · ${entry.weaponLabel}`;
}








export class KillFeed {
  constructor({ max = KILL_FEED_MAX, ttlMs = KILL_FEED_TTL_MS } = {}) {
    this.max = max;
    this.ttlMs = ttlMs;
    this.entries = [];
  }

  
  
  
  push(item, nowMs) {
    if (!item) return this.entries;
    this.entries.push({ item, at: nowMs });
    
    
    while (this.entries.length > this.max) this.entries.shift();
    return this.entries;
  }

  
  
  
  
  items(nowMs) {
    this.entries = this.entries.filter((e) => nowMs - e.at < this.ttlMs);
    return this.entries.map((e) => e.item);
  }

  
  
  
  lines(nowMs) {
    return this.items(nowMs).map(toText);
  }

  clear() { this.entries = []; }
}
