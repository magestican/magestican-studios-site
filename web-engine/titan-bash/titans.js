



export const WEAPONS = Object.freeze({
  
  
  
  lance:  { kind: 'bolt', speed: 46, damage: 5.5, heat: 18, cooldown: 0.45, count: 1, spread: 0, range: 34 },
  twin:   { kind: 'bolt', speed: 30, damage: 3.5, heat: 14, cooldown: 0.7,  count: 2, spread: 6, range: 30 },
  needle: { kind: 'bolt', speed: 52, damage: 2.2, heat: 11, cooldown: 0.5,  count: 3, spread: 14, range: 24 },
  lob:    { kind: 'lob',  flight: 0.6, damage: 7.3, heat: 25, cooldown: 0.9, count: 1, spread: 0, range: 26, splash: 3 },
});

export const TITANS = Object.freeze({
  lancer:  { name: 'Lancer',  armour: 330, walk: 6.0, weapon: 'lance',  ability: 'bladeLunge', abilityCooldown: 7 },
  bulwark: { name: 'Bulwark', armour: 430, walk: 5.0, weapon: 'twin',   ability: 'aegis',      abilityCooldown: 8 },
  wisp:    { name: 'Wisp',    armour: 300, walk: 7.2, weapon: 'needle', ability: 'afterimage', abilityCooldown: 7 },
  mortar:  { name: 'Mortar',  armour: 320, walk: 5.4, weapon: 'lob',    ability: 'seedBarrage', abilityCooldown: 9 },
});


export const HOUSES = Object.freeze([
  { id: 'vale',   name: 'Vale',   colour: '#e8423a', titan: 'lancer' },
  { id: 'mirren', name: 'Mirren', colour: '#2f7de1', titan: 'bulwark' },
  { id: 'sora',   name: 'Sora',   colour: '#f4c430', titan: 'wisp' },
  { id: 'kett',   name: 'Kett',   colour: '#3fb950', titan: 'mortar' },
  { id: 'oru',    name: 'Oru',    colour: '#9b59d0', titan: 'lancer' },
  { id: 'dunn',   name: 'Dunn',   colour: '#f0822d', titan: 'bulwark' },
  { id: 'lisle',  name: 'Lisle',  colour: '#f3a6c8', titan: 'wisp' },
  { id: 'ash',    name: 'Ash',    colour: '#2ec4b6', titan: 'mortar' },
]);
