






























export const TREES = Object.freeze({
  apple: {
    fruit: 'apple', seed: 'appleSeed',
    growth_s: { seed: 300, sapling: 480, young: 720 },
    ripen_s: 180, fruitPerCrop: 4,
    seedsWhenFelled: { sapling: 1, young: 2, fruiting: 3 },
    woodWhenFelled: { sapling: 1, young: 3, fruiting: 5 },
    rare: { good: 'goldenApple', chance_bp: 100 },
  },
  peach: {
    fruit: 'peach', seed: 'peachSeed',
    growth_s: { seed: 360, sapling: 600, young: 840 },
    ripen_s: 240, fruitPerCrop: 4,
    seedsWhenFelled: { sapling: 1, young: 2, fruiting: 3 },
    woodWhenFelled: { sapling: 1, young: 3, fruiting: 5 },
    rare: null,
  },
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  pine: {
    timber: true,
    fruit: null, seed: null,
    growth_s: { seed: 420, sapling: 660, young: 900 },
    
    
    ripen_s: 0, fruitPerCrop: 0,
    seedsWhenFelled: { sapling: 0, young: 0, fruiting: 0 },
    woodWhenFelled: { sapling: 2, young: 5, fruiting: 9 },
    rare: null,
  },
  
  
  cherry: {
    fruit: 'cherry', seed: 'cherrySeed',
    growth_s: { seed: 420, sapling: 720, young: 960 },
    ripen_s: 150, fruitPerCrop: 6,
    seedsWhenFelled: { sapling: 1, young: 2, fruiting: 3 },
    woodWhenFelled: { sapling: 1, young: 3, fruiting: 5 },
    rare: null,
  },
});


export const STUMP = Object.freeze({ wood: 1 });




export const WATER = Object.freeze({ cut_bp: 3000 });






export const GOODS = Object.freeze({
  apple: { kind: 'fruit', sell_coins: 5, demand: 3, gift_points: 1 },
  peach: { kind: 'fruit', sell_coins: 7, demand: 3, gift_points: 1 },
  cherry: { kind: 'fruit', sell_coins: 3, demand: 3, gift_points: 1 },

  appleSeed: { kind: 'seed', sell_coins: 0, demand: 0, gift_points: 0 },
  peachSeed: { kind: 'seed', sell_coins: 0, demand: 0, gift_points: 0 },
  cherrySeed: { kind: 'seed', sell_coins: 0, demand: 0, gift_points: 0 },

  appleJuice: { kind: 'drink', sell_coins: 22, demand: 4, gift_points: 4 },
  peachJuice: { kind: 'drink', sell_coins: 30, demand: 4, gift_points: 4 },
  cherryJuice: { kind: 'drink', sell_coins: 26, demand: 4, gift_points: 4 },
  orchardJuice: { kind: 'drink', sell_coins: 42, demand: 4, gift_points: 7 },
  appleJam: { kind: 'jam', sell_coins: 40, demand: 4, gift_points: 6 },
  peachJam: { kind: 'jam', sell_coins: 52, demand: 4, gift_points: 6 },
  cherryJam: { kind: 'jam', sell_coins: 44, demand: 4, gift_points: 6 },

  sugar: { kind: 'staple', sell_coins: 0, demand: 0, gift_points: 0 },

  goldenApple: { kind: 'rare', sell_coins: 120, demand: 1, gift_points: 40 },
  moonRock: { kind: 'rare', sell_coins: 25, demand: 1, gift_points: 8 },
  gem: { kind: 'rare', sell_coins: 150, demand: 1, gift_points: 50 },

  
  
  
  
  
  
  
  truffle: { kind: 'rare', sell_coins: 0, demand: 0, gift_points: 30 },

  
  
  
  wood: { kind: 'resource', sell_coins: 0, demand: 0, gift_points: 1 },
  stone: { kind: 'resource', sell_coins: 0, demand: 0, gift_points: 1 },
  mushroom: { kind: 'food', sell_coins: 6, demand: 2, gift_points: 2 },
  berries: { kind: 'food', sell_coins: 4, demand: 2, gift_points: 2 },
  carrot: { kind: 'food', sell_coins: 5, demand: 2, gift_points: 2 },
  potato: { kind: 'food', sell_coins: 5, demand: 2, gift_points: 2 },
});



export { CRAFTABLES, CRAFT_CATEGORIES } from './craftables.mjs';



export const RESOURCES = Object.freeze({
  wood: Object.freeze(['wood']),
  stone: Object.freeze(['stone']),
  food: Object.freeze(Object.keys(GOODS).filter((id) => GOODS[id].kind === 'fruit' || GOODS[id].kind === 'food')),
});





export const FORAGE = Object.freeze({
  mushroom: { good: 'mushroom', min: 1, max: 3, regrow_s: 1200 },
  berries: { good: 'berries', min: 2, max: 4, regrow_s: 900 },
  dig: { weights: { carrot: 45, potato: 45, stone: 10 }, min: 1, max: 2, regrow_s: 1800 },
});
































export const FINDS = Object.freeze({
  gem: { good: 'gem', min: 1, max: 1, regrow_s: 7200, treasure: true, container: 'chest' },
  goldenApple: { good: 'goldenApple', min: 1, max: 1, regrow_s: 6300, treasure: true, container: 'chest' },
  moonRock: { good: 'moonRock', min: 1, max: 2, regrow_s: 2700, treasure: false, container: 'crate' },
  wood: { good: 'wood', min: 2, max: 4, regrow_s: 1500, treasure: false, container: 'crate' },
  stone: { good: 'stone', min: 2, max: 4, regrow_s: 1500, treasure: false, container: 'crate' },
  mushroom: { good: 'mushroom', min: 2, max: 3, regrow_s: 1200, treasure: false, container: 'barrel' },
  berries: { good: 'berries', min: 2, max: 4, regrow_s: 1080, treasure: false, container: 'barrel' },
});













export const CONTAINERS = Object.freeze({
  chest: Object.freeze([1, 2, 3]),
  crate: Object.freeze([1, 2]),
  barrel: Object.freeze([1]),
});
export const CONTAINER_KINDS = Object.freeze(Object.keys(CONTAINERS));



export const STAPLES = Object.freeze({
  sugar: { buy_coins: 4 },
});












export const UNDERGROUND = Object.freeze({
  truffle: { buy_coins: 45 },
});









export const RECIPES = Object.freeze({
  appleJuice: { inputs: { apple: 3 }, output: 'appleJuice', time_s: 25, processorLevel: 1 },
  peachJuice: { inputs: { peach: 3 }, output: 'peachJuice', time_s: 30, processorLevel: 1 },
  cherryJuice: { inputs: { cherry: 6 }, output: 'cherryJuice', time_s: 25, processorLevel: 1 },
  appleJam: { inputs: { apple: 4, sugar: 1 }, output: 'appleJam', time_s: 45, processorLevel: 2 },
  peachJam: { inputs: { peach: 4, sugar: 1 }, output: 'peachJam', time_s: 50, processorLevel: 2 },
  cherryJam: { inputs: { cherry: 8, sugar: 1 }, output: 'cherryJam', time_s: 50, processorLevel: 2 },
  orchardJuice: { inputs: { apple: 2, peach: 2 }, output: 'orchardJuice', time_s: 40, processorLevel: 3 },
});







export const BUILDINGS = Object.freeze({
  shop: {
    buildingSlots: 1,
    levels: [
      { cost_coins: 0, shelves: 3, shelfStack: 8, footfall_bp: 10000 },
      { cost_coins: 1200, shelves: 5, shelfStack: 12, footfall_bp: 12500 },
      { cost_coins: 6000, shelves: 8, shelfStack: 20, footfall_bp: 15000 },
    ],
  },
  processor: {
    buildingSlots: 1,
    maxBatches: 30,
    levels: [
      { cost_coins: 200, jobSlots: 1 },
      { cost_coins: 900, jobSlots: 2 },
      { cost_coins: 4000, jobSlots: 3 },
    ],
  },
  lamp: { buildingSlots: 0, cost_coins: 80, light: 1 },
  firepit: { buildingSlots: 0, cost_coins: 250, light: 2 },
});




export const LAND = Object.freeze({
  startingParcels: 1,
  maxParcels: 24,
  treeSlotsPerParcel: 6,
  buildingSlotsPerParcel: 2,
  firstParcel_coins: 1500,
  priceGrowth_bp: 17500,
  roundTo_coins: 50,
});







export const CUSTOMERS = Object.freeze({
  slot_s: 8,
  arrival_bp: 6000,
  saturationPerSale_bp: 25,
  saturationHalfLife_s: 1200,
  maxDiscount_bp: 6000,
  nightUnlit_bp: 3500,
  nightLit_bp: 11000,
  lightsForLitShop: 2,
});





export const CLOCK = Object.freeze({
  day_s: 2400,
  startHour: 8,
});






export const HAPPINESS = Object.freeze({
  levels: [
    { points: 100, event: 'house', build_s: 600, footfall_bp: 1000 },
    { points: 280, event: 'decorate', build_s: 300, footfall_bp: 1000 },
    { points: 600, event: 'garden', build_s: 450, footfall_bp: 1500 },
  ],
  warmthRoom_points: 75,
  overflow_bp: 2500,
  warmthHalfLife_s: 3600,
  warmthCap_points: 300,
  
  
  
  enterHearts: 1,
});

export const GIFTS = Object.freeze({
  coinsPerPoint: 10,
  favourite_bp: 20000,
});







export const ROCKS = Object.freeze({
  cooldown_s: 2400,
  hitsPerDay: 3,
  stonePerHit: 1,
  moonRockChance_bp: 3333,
  gemChance_bp: 267,
});










export const START = Object.freeze({
  coins: 0,
  villagers: [
    { species: 'elephant', favourite: 'appleJuice' },
    { species: 'giraffe', favourite: 'peachJam' },
    { species: 'panda', favourite: 'apple' },
    { species: 'human', favourite: 'orchardJuice', home: 'cottage' },
    { species: 'pig', favourite: 'appleJam' },
  ],
});
