


















































import { ticks } from './fixed.js';

export const FACTIONS = Object.freeze(['herd', 'yield']);






export const HERD = 'herd';
export const YIELD = 'yield';

























export const ARMOUR_CLASSES = Object.freeze(['flesh', 'hide', 'metal', 'structure', 'air']);

export const DAMAGE_CLASSES = Object.freeze([
  'smallArms', 'crush', 'pesticide', 'claw', 'gore',
  'kick', 'talon', 'trample', 'stone', 'towerGun', 'current',
]);


export const DAMAGE_TABLE = Object.freeze({
  smallArms: Object.freeze({ flesh: 130, hide: 85, metal: 45, structure: 40, air: 95 }),
  crush: Object.freeze({ flesh: 200, hide: 115, metal: 90, structure: 150, air: 0 }),
  pesticide: Object.freeze({ flesh: 150, hide: 150, metal: 0, structure: 0, air: 60 }),
  claw: Object.freeze({ flesh: 120, hide: 85, metal: 45, structure: 50, air: 25 }),
  gore: Object.freeze({ flesh: 110, hide: 100, metal: 75, structure: 200, air: 0 }),
  kick: Object.freeze({ flesh: 115, hide: 95, metal: 70, structure: 90, air: 0 }),
  talon: Object.freeze({ flesh: 125, hide: 70, metal: 145, structure: 60, air: 130 }),
  trample: Object.freeze({ flesh: 150, hide: 130, metal: 150, structure: 300, air: 0 }),
  stone: Object.freeze({ flesh: 140, hide: 120, metal: 110, structure: 45, air: 120 }),
  towerGun: Object.freeze({ flesh: 125, hide: 80, metal: 55, structure: 30, air: 105 }),
  current: Object.freeze({ flesh: 160, hide: 120, metal: 60, structure: 0, air: 0 }),
});
























export function damageAfterArmour(damage, damageClass, armourClass, armourFlat) {
  const row = DAMAGE_TABLE[damageClass];
  if (!row) throw new Error(`unknown damage class: ${damageClass}`);
  const mult = row[armourClass];
  if (mult === undefined) throw new Error(`unknown armour class: ${armourClass}`);
  if (mult === 0) return 0;
  const scaled = Math.floor((damage * mult) / 100);
  return Math.max(1, scaled - armourFlat);
}















const unit = (o) => Object.freeze({
  packSize: 1,
  armourFlat: 0,
  damage: 0,
  damageClass: 'smallArms',
  attackTicks: 0,
  rangeMm: 0,
  areaMm: 0,
  gatherFeedPerTick: 0,
  gatherWaterPerTick: 0,
  requires: null,
  air: false,
  waterOnly: false,
  ...o,
});

export const UNITS = Object.freeze({

  

  farmhand: unit({
    id: 'farmhand', faction: YIELD, tier: 1, name: 'Farmhand',
    
    
    
    
    variants: ['m', 'f'],
    hp: 90, armourClass: 'flesh', armourFlat: 0,
    
    
    
    
    
    
    
    
    
    
    
    
    
    damage: 12, damageClass: 'smallArms', attackTicks: 16, rangeMm: 45000,
    speedMmPerTick: 950, visionMm: 140000, captureWeight: 6,
    cost: { feed: 60, water: 0 }, buildTicks: ticks(6),
  }),

  harvester: unit({
    id: 'harvester', faction: YIELD, tier: 1, name: 'Harvester',
    hp: 260, armourClass: 'metal', armourFlat: 4,
    speedMmPerTick: 700, visionMm: 113750, captureWeight: 5,
    
    
    
    
    
    gatherFeedPerTick: 150,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    cost: { feed: 90, water: 0 }, buildTicks: ticks(10),
  }),

  bowser: unit({
    id: 'bowser', faction: YIELD, tier: 1, name: 'Water Bowser',
    hp: 240, armourClass: 'metal', armourFlat: 4,
    speedMmPerTick: 620, visionMm: 105000, captureWeight: 4,
    gatherWaterPerTick: 100,
    cost: { feed: 110, water: 0 }, buildTicks: ticks(9),
  }),

  quadBike: unit({
    id: 'quadBike', faction: YIELD, tier: 1, name: 'Quad Bike',
    hp: 110, armourClass: 'metal', armourFlat: 2,
    damage: 8, damageClass: 'smallArms', attackTicks: 12, rangeMm: 45000,
    speedMmPerTick: 1700, visionMm: 210000, captureWeight: 3,
    cost: { feed: 90, water: 0 }, buildTicks: ticks(7),
  }),

  poundWagon: unit({
    id: 'poundWagon', faction: YIELD, tier: 2, name: 'Pound Wagon',
    
    
    
    
    
    
    
    
    
    
    
    hp: 320, armourClass: 'metal', armourFlat: 5,
    speedMmPerTick: 800, visionMm: 122500, captureWeight: 4,
    capturesPacks: true, capturesBelowPct: 40, captureTicks: ticks(3),
    captureRefundPct: 60, captureScore: 15,
    cost: { feed: 180, water: 10 }, buildTicks: ticks(14),
  }),

  foodTruck: unit({
    id: 'foodTruck', faction: YIELD, tier: 2, name: 'Food Truck',
    hp: 300, armourClass: 'metal', armourFlat: 5,
    speedMmPerTick: 850, visionMm: 122500, captureWeight: 4,
    healPerPulse: 9, healPulseTicks: 20, healRadiusMm: 50000,
    auraSpeedPct: 8, auraRadiusMm: 50000,
    cost: { feed: 200, water: 20 }, buildTicks: ticks(15),
  }),

  tractor: unit({
    id: 'tractor', faction: YIELD, tier: 2, name: 'Tractor',
    hp: 620, armourClass: 'metal', armourFlat: 9,
    damage: 34, damageClass: 'crush', attackTicks: 24, rangeMm: 18000,
    speedMmPerTick: 700, visionMm: 122500, captureWeight: 7,
    
    
    
    
    cost: { feed: 260, water: 0 }, buildTicks: ticks(18),
  }),

  cropDuster: unit({
    id: 'cropDuster', faction: YIELD, tier: 3, name: 'Crop Duster',
    hp: 260, armourClass: 'air', armourFlat: 3,
    damage: 14, damageClass: 'pesticide', attackTicks: 30, rangeMm: 60000,
    areaMm: 26000,
    speedMmPerTick: 2100, visionMm: 262500,
    
    
    
    
    captureWeight: 0, air: true,
    requires: 'machineShed',
    cost: { feed: 320, water: 60 }, buildTicks: ticks(22),
  }),

  combine: unit({
    id: 'combine', faction: YIELD, tier: 3, name: 'Combine Harvester',
    hp: 1400, armourClass: 'metal', armourFlat: 13,
    damage: 70, damageClass: 'crush', attackTicks: 20, rangeMm: 26000,
    speedMmPerTick: 550, visionMm: 131250, captureWeight: 9,
    requires: 'machineShed',
    cost: { feed: 520, water: 140 }, buildTicks: ticks(34),
  }),

  

  flock: unit({
    id: 'flock', faction: HERD, tier: 1, name: 'Flock', packSize: 6,
    hp: 26, armourClass: 'flesh', armourFlat: 0,
    damage: 3, damageClass: 'claw', attackTicks: 14, rangeMm: 9000,
    speedMmPerTick: 900, visionMm: 113750, captureWeight: 1,
    
    
    gatherFeedPerTick: 25,
    
    
    
    
    
    cost: { feed: 70, water: 0 }, buildTicks: ticks(6),
  }),

  duckRaft: unit({
    id: 'duckRaft', faction: HERD, tier: 1, name: 'Duck Raft', packSize: 5,
    hp: 30, armourClass: 'flesh', armourFlat: 0,
    damage: 2, damageClass: 'claw', attackTicks: 16, rangeMm: 9000,
    speedMmPerTick: 700, visionMm: 105000, captureWeight: 1,
    gatherWaterPerTick: 25, waterOnly: true,
    cost: { feed: 90, water: 0 }, buildTicks: ticks(8),
  }),

  skulk: unit({
    id: 'skulk', faction: HERD, tier: 1, name: 'Skulk', packSize: 3,
    hp: 55, armourClass: 'flesh', armourFlat: 1,
    damage: 9, damageClass: 'claw', attackTicks: 12, rangeMm: 11000,
    speedMmPerTick: 1750, visionMm: 280000, captureWeight: 2,
    cost: { feed: 100, water: 0 }, buildTicks: ticks(7),
  }),

  sounder: unit({
    id: 'sounder', faction: HERD, tier: 2, name: 'Sounder', packSize: 5,
    
    
    
    
    
    hp: 160, armourClass: 'hide', armourFlat: 3,
    
    
    damage: 13, damageClass: 'gore', attackTicks: 20, rangeMm: 13000,
    
    
    
    
    
    
    
    
    
    
    
    
    
    speedMmPerTick: 1080, visionMm: 122500, captureWeight: 3,
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    cost: { feed: 270, water: 0 }, buildTicks: ticks(13),
  }),

  horseHerd: unit({
    id: 'horseHerd', faction: HERD, tier: 2, name: 'Herd', packSize: 4,
    
    
    
    
    
    hp: 130, armourClass: 'hide', armourFlat: 3,
    damage: 12, damageClass: 'kick', attackTicks: 18, rangeMm: 12000,
    speedMmPerTick: 1600, visionMm: 148750, captureWeight: 3,
    auraSpeedPct: 15, auraDamagePct: 12, auraRadiusMm: 70000,
    carriesUnit: 'flock',
    cost: { feed: 220, water: 25 }, buildTicks: ticks(16),
  }),

  wing: unit({
    id: 'wing', faction: HERD, tier: 3, name: 'Wing', packSize: 3,
    hp: 90, armourClass: 'air', armourFlat: 1,
    damage: 21, damageClass: 'talon', attackTicks: 16, rangeMm: 22000,
    speedMmPerTick: 2200, visionMm: 350000, captureWeight: 0, air: true,
    requires: 'sanctuary',
    
    
    
    cost: { feed: 300, water: 30 }, buildTicks: ticks(21),
  }),

  pride: unit({
    id: 'pride', faction: HERD, tier: 3, name: 'Pride', packSize: 3,
    hp: 175, armourClass: 'hide', armourFlat: 4,
    damage: 33, damageClass: 'claw', attackTicks: 18, rangeMm: 14000,
    speedMmPerTick: 1450, visionMm: 157500, captureWeight: 4,
    requires: 'sanctuary',
    cost: { feed: 340, water: 60 }, buildTicks: ticks(22),
  }),

  elephant: unit({
    id: 'elephant', faction: HERD, tier: 3, name: 'Elephant', packSize: 1,
    
    
    
    
    hp: 1500, armourClass: 'hide', armourFlat: 11,
    damage: 95, damageClass: 'trample', attackTicks: 30, rangeMm: 26000,
    speedMmPerTick: 560, visionMm: 157500, captureWeight: 8,
    requires: 'sanctuary',
    cost: { feed: 500, water: 130 }, buildTicks: ticks(32),
  }),
});











const building = (o) => Object.freeze({
  armourClass: 'structure',
  armourFlat: 0,
  damage: 0,
  damageClass: 'towerGun',
  attackTicks: 0,
  rangeMm: 0,
  areaMm: 0,
  visionMm: 157500,
  wall: false,
  waterOnly: false,
  unlocks: Object.freeze([]),
  ...o,
});

export const BUILDINGS = Object.freeze({

  

  watchtower: building({
    id: 'watchtower', faction: YIELD, name: 'Watchtower',
    hp: 400, armourFlat: 6,
    damage: 13, damageClass: 'towerGun', attackTicks: 22, rangeMm: 90000,
    
    
    
    
    visionMm: 455000,
    cost: { feed: 90, water: 0 }, buildTicks: ticks(8),
  }),

  pesticideBattery: building({
    id: 'pesticideBattery', faction: YIELD, name: 'Pesticide Battery',
    
    
    
    
    
    
    hp: 550, armourFlat: 8,
    damage: 10, damageClass: 'pesticide', attackTicks: 34, rangeMm: 110000,
    areaMm: 26000, dotTicks: ticks(4),
    visionMm: 210000,
    cost: { feed: 200, water: 30 }, buildTicks: ticks(16),
  }),

  electricFence: building({
    id: 'electricFence', faction: YIELD, name: 'Electric Fence',
    
    
    
    
    hp: 300, armourFlat: 10, wall: true, seversAura: true,
    damage: 7, damageClass: 'current', attackTicks: 20, rangeMm: 9000,
    visionMm: 52500,
    cost: { feed: 40, water: 0 }, buildTicks: ticks(3),
  }),

  machineShed: building({
    id: 'machineShed', faction: YIELD, name: 'Machine Shed',
    hp: 900, armourFlat: 8,
    unlocks: Object.freeze(['cropDuster', 'combine']),
    
    
    
    
    
    
    cost: { feed: 240, water: 40 }, buildTicks: ticks(24),
  }),

  pumpStation: building({
    id: 'pumpStation', faction: YIELD, name: 'Pump Station',
    hp: 700, armourFlat: 8, waterOnly: true,
    yieldBonusPct: 120,
    
    
    
    
    
    
    pollutePerTicks: ticks(20), polluteMax: 3,
    cost: { feed: 260, water: 0 }, buildTicks: ticks(18),
  }),

  processingPlant: building({
    id: 'processingPlant', faction: YIELD, name: 'Processing Plant',
    hp: 1400, armourFlat: 12,
    requiresPollutionAtLeast: 2, scoreMultiplier: 2,
    cost: { feed: 480, water: 200 }, buildTicks: ticks(30),
  }),

  

  haven: building({
    id: 'haven', faction: HERD, name: 'Haven',
    
    
    
    
    
    hp: 350, armourFlat: 4, anchorsSector: true, conceals: true,
    healPerPulse: 6, healPulseTicks: 20, healRadiusMm: 45000,
    visionMm: 245000,
    
    
    
    
    
    
    
    
    
    cost: { feed: 60, water: 0 }, buildTicks: ticks(8),
  }),

  greatTree: building({
    id: 'greatTree', faction: HERD, name: 'Great Tree',
    
    
    
    
    hp: 600, armourFlat: 6, arcs: true,
    damage: 30, damageClass: 'stone', attackTicks: 30, rangeMm: 105000,
    visionMm: 210000,
    cost: { feed: 210, water: 30 }, buildTicks: ticks(16),
  }),

  mudWall: building({
    id: 'mudWall', faction: HERD, name: 'Mud Wall',
    hp: 380, armourFlat: 3, wall: true, slowsNearbyPct: 35,
    visionMm: 52500,
    cost: { feed: 35, water: 0 }, buildTicks: ticks(3),
  }),

  sanctuary: building({
    id: 'sanctuary', faction: HERD, name: 'Sanctuary',
    hp: 900, armourFlat: 5,
    
    
    
    
    
    
    
    
    
    
    
    
    unlocks: Object.freeze(['wing', 'pride', 'elephant']),
    
    
    
    
    
    unlocksVoice: 'theOldOne',
    
    
    
    
    
    
    
    
    
    
    
    
    
    cost: { feed: 240, water: 20 }, buildTicks: ticks(24),
  }),

  reedbed: building({
    id: 'reedbed', faction: HERD, name: 'Reedbed',
    hp: 650, armourFlat: 4, waterOnly: true,
    yieldBonusPct: 90,
    cleanPerTicks: ticks(15),
    
    
    
    
    spawnsUnit: 'duckRaft', spawnEveryTicks: ticks(40), spawnPackSize: 3,
    cost: { feed: 240, water: 0 }, buildTicks: ticks(18),
  }),

  greatWarren: building({
    id: 'greatWarren', faction: HERD, name: 'Great Warren',
    hp: 1300, armourFlat: 8,
    requiresPollutionAtMost: 0, requiresOwnedNeighbours: 2, scoreMultiplier: 2,
    cost: { feed: 460, water: 180 }, buildTicks: ticks(30),
  }),
});














export const START_FORCE = Object.freeze({
  [YIELD]: Object.freeze([
    Object.freeze({ unit: 'harvester', count: 2 }),
    Object.freeze({ unit: 'farmhand', count: 1 }),
  ]),
  [HERD]: Object.freeze([
    
    Object.freeze({ unit: 'flock', count: 1, packSize: 10 }),
  ]),
});

export const START_RESOURCES = Object.freeze({ feed: 150, water: 0 });






export function unitsOf(faction) {
  return Object.keys(UNITS).filter((id) => UNITS[id].faction === faction).sort();
}


export function buildingsOf(faction) {
  return Object.keys(BUILDINGS).filter((id) => BUILDINGS[id].faction === faction).sort();
}


export function specOf(id) {
  return UNITS[id] || BUILDINGS[id] || null;
}


export function packHp(unitId) {
  const u = UNITS[unitId];
  return u ? u.hp * u.packSize : 0;
}


export function packCaptureWeight(unitId) {
  const u = UNITS[unitId];
  return u ? u.captureWeight * u.packSize : 0;
}








export function packDpsX100(unitId, armourClass, armourFlat = 0) {
  const u = UNITS[unitId];
  if (!u || !u.attackTicks || !u.damage) return 0;
  const per = damageAfterArmour(u.damage, u.damageClass, armourClass, armourFlat);
  const attacksPerSecondX100 = Math.floor((20 * 100) / u.attackTicks);
  return per * u.packSize * attacksPerSecondX100;
}
