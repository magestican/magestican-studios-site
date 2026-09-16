




























export const CRAFT_CATEGORIES = Object.freeze(['pots', 'garden', 'paths', 'seats', 'lights', 'water', 'rustic', 'houses']);

export const CRAFTABLES = Object.freeze({
  
  bowlPot: { name: 'squat flower bowl', category: 'pots', art: { kind: 'flowerPot', seed: 1 }, cost: { stone: 2, food: 1 }, blocks: false },
  tallPot: { name: 'tall terracotta pot', category: 'pots', art: { kind: 'flowerPot', seed: 2 }, cost: { stone: 2, food: 1 }, blocks: false },
  widePot: { name: 'wide-rimmed pot', category: 'pots', art: { kind: 'flowerPot', seed: 3 }, cost: { stone: 3, food: 1 }, blocks: false },

  
  stoneBed: { name: 'stone-kerbed flower bed', category: 'garden', art: { kind: 'flowerBed', seed: 1 }, cost: { stone: 5, food: 2 }, blocks: false },
  logBed: { name: 'log-edged round bed', category: 'garden', art: { kind: 'flowerBed', seed: 2 }, cost: { wood: 5, food: 2 }, blocks: false },
  kidneyBed: { name: 'little kidney bed', category: 'garden', art: { kind: 'flowerBed', seed: 3 }, cost: { stone: 2, wood: 2, food: 2 }, blocks: false },

  
  steppingStones: { name: 'stepping stones', category: 'paths', art: { kind: 'footpath', seed: 1 }, cost: { stone: 3 }, blocks: false },
  pebblePath: { name: 'pebble path', category: 'paths', art: { kind: 'footpath', seed: 2 }, cost: { stone: 4 }, blocks: false },
  flagstonePath: { name: 'flagstone path', category: 'paths', art: { kind: 'footpath', seed: 3 }, cost: { stone: 5 }, blocks: false },

  
  pineBench: { name: 'honey pine bench', category: 'seats', art: { kind: 'bench', seed: 1 }, cost: { wood: 6 }, blocks: true },
  paintedBench: { name: 'sea-blue bench', category: 'seats', art: { kind: 'bench', seed: 2 }, cost: { wood: 6, food: 2 }, blocks: true },
  longBench: { name: 'long bench', category: 'seats', art: { kind: 'bench', seed: 3 }, cost: { wood: 9 }, blocks: true },
  pineTable: { name: 'pine picnic table', category: 'seats', art: { kind: 'picnicTable', seed: 1 }, cost: { wood: 12 }, blocks: true },
  paintedTable: { name: 'painted picnic table', category: 'seats', art: { kind: 'picnicTable', seed: 2 }, cost: { wood: 12, food: 2 }, blocks: true },
  roundTable: { name: 'round table and stools', category: 'seats', art: { kind: 'picnicTable', seed: 3 }, cost: { wood: 10, stone: 2 }, blocks: true },

  
  
  
  gardenLantern: { name: 'garden lantern', category: 'lights', art: { kind: 'postLantern', seed: 1 }, cost: { wood: 3, stone: 1, coins: 40 }, blocks: false, light: true },
  streetLantern: { name: 'street lantern', category: 'lights', art: { kind: 'postLantern', seed: 2 }, cost: { wood: 4, stone: 3, coins: 80 }, blocks: false, light: true },
  pathLight: { name: 'path light', category: 'lights', art: { kind: 'postLantern', seed: 3 }, cost: { stone: 2, coins: 30 }, blocks: false, light: true },
  crookLamp: { name: 'crook lamp post', category: 'lights', art: { kind: 'lampPost', seed: 1 }, cost: { stone: 4, coins: 110 }, blocks: false, light: true },
  postLamp: { name: 'wooden lamp post', category: 'lights', art: { kind: 'lampPost', seed: 2 }, cost: { wood: 6, stone: 2, coins: 90 }, blocks: false, light: true },
  ironLamp: { name: 'iron lamp post', category: 'lights', art: { kind: 'lampPost', seed: 3 }, cost: { stone: 6, coins: 140 }, blocks: false, light: true },
  firePit: { name: 'fire pit', category: 'lights', art: { kind: 'firePit', seed: 1 }, cost: { stone: 8, wood: 4 }, blocks: true, light: true },
  stoneFirePit: { name: 'stone-ringed fire pit', category: 'lights', art: { kind: 'firePit', seed: 2 }, cost: { stone: 10, wood: 4 }, blocks: true, light: true },
  bigFirePit: { name: 'big fire pit', category: 'lights', art: { kind: 'firePit', seed: 3 }, cost: { stone: 12, wood: 6 }, blocks: true, light: true },

  
  
  birdBath: { name: 'bird bath', category: 'water', art: { kind: 'birdBath', seed: 1 }, cost: { stone: 5 }, blocks: true },
  wideBasin: { name: 'low wide basin', category: 'water', art: { kind: 'birdBath', seed: 2 }, cost: { stone: 6 }, blocks: true },
  slenderBath: { name: 'tall slender bath', category: 'water', art: { kind: 'birdBath', seed: 3 }, cost: { stone: 5 }, blocks: true },
  tieredFountain: { name: 'tiered fountain', category: 'water', art: { kind: 'fountain', seed: 1 }, cost: { stone: 18, coins: 120 }, blocks: true },
  squareFountain: { name: 'square fountain', category: 'water', art: { kind: 'fountain', seed: 2 }, cost: { stone: 14, coins: 90 }, blocks: true },
  tallFountain: { name: 'tall fountain', category: 'water', art: { kind: 'fountain', seed: 3 }, cost: { stone: 22, coins: 160 }, blocks: true },
  stoneWell: { name: 'stone well', category: 'water', art: { kind: 'well', seed: 1 }, cost: { stone: 14, wood: 6 }, blocks: true },
  roundWell: { name: 'round well', category: 'water', art: { kind: 'well', seed: 2 }, cost: { stone: 16, wood: 4 }, blocks: true },
  wishingWell: { name: 'wishing well', category: 'water', art: { kind: 'well', seed: 3 }, cost: { stone: 18, wood: 8, coins: 60 }, blocks: true },

  
  
  creamFence: { name: 'cream rail fence', category: 'rustic', art: { kind: 'fence', seed: 1 }, cost: { wood: 4 }, blocks: true },
  picketFence: { name: 'picket fence', category: 'rustic', art: { kind: 'fence', seed: 2 }, cost: { wood: 5 }, blocks: true },
  splitRailFence: { name: 'split rail fence', category: 'rustic', art: { kind: 'fence', seed: 3 }, cost: { wood: 3 }, blocks: true },
  boulder: { name: 'boulder', category: 'rustic', art: { kind: 'stone', seed: 1 }, cost: { stone: 6 }, blocks: true },
  rockCluster: { name: 'cluster of rocks', category: 'rustic', art: { kind: 'stone', seed: 2 }, cost: { stone: 8 }, blocks: true },
  flatRock: { name: 'flat slab', category: 'rustic', art: { kind: 'stone', seed: 3 }, cost: { stone: 5 }, blocks: true },
  barrel: { name: 'oak barrel', category: 'rustic', art: { kind: 'barrel', seed: 1 }, cost: { wood: 5 }, blocks: true },
  barrelPlanter: { name: 'barrel planter', category: 'rustic', art: { kind: 'barrel', seed: 2 }, cost: { wood: 5, food: 2 }, blocks: true },
  rainBarrel: { name: 'rain barrel', category: 'rustic', art: { kind: 'barrel', seed: 3 }, cost: { wood: 6, stone: 1 }, blocks: true },
  crate: { name: 'wooden crate', category: 'rustic', art: { kind: 'crate', seed: 1 }, cost: { wood: 3 }, blocks: true },
  crateStack: { name: 'stack of crates', category: 'rustic', art: { kind: 'crate', seed: 2 }, cost: { wood: 6 }, blocks: true },
  fruitCrate: { name: 'crate of fruit', category: 'rustic', art: { kind: 'crate', seed: 3 }, cost: { wood: 3, food: 4 }, blocks: true },
  armSignpost: { name: 'signpost', category: 'rustic', art: { kind: 'signpost', seed: 1 }, cost: { wood: 4 }, blocks: false },
  crossSignpost: { name: 'crossroads signpost', category: 'rustic', art: { kind: 'signpost', seed: 2 }, cost: { wood: 6 }, blocks: false },
  boardSign: { name: 'standing board sign', category: 'rustic', art: { kind: 'signpost', seed: 3 }, cost: { wood: 5 }, blocks: false },

  
  
  
  humanHouse: { name: 'cottage', category: 'houses', art: { kind: 'house', variant: 'human', stage: 'house' }, cost: { wood: 40, stone: 25 }, blocks: true },
  pigHouse: { name: 'snug gable house', category: 'houses', art: { kind: 'house', variant: 'pig', stage: 'house' }, cost: { wood: 36, stone: 22 }, blocks: true },
  pandaHouse: { name: 'round cosy house', category: 'houses', art: { kind: 'house', variant: 'panda', stage: 'house' }, cost: { wood: 38, stone: 24 }, blocks: true },
  elephantHouse: { name: 'wide arched house', category: 'houses', art: { kind: 'house', variant: 'elephant', stage: 'house' }, cost: { wood: 46, stone: 30 }, blocks: true },
  giraffeHouse: { name: 'tall gable house', category: 'houses', art: { kind: 'house', variant: 'giraffe', stage: 'house' }, cost: { wood: 44, stone: 28 }, blocks: true },
  humanGardenHouse: { name: 'cottage with a garden', category: 'houses', art: { kind: 'house', variant: 'human', stage: 'garden' }, cost: { wood: 55, stone: 35, food: 8 }, blocks: true },
  pigGardenHouse: { name: 'snug house with a garden', category: 'houses', art: { kind: 'house', variant: 'pig', stage: 'garden' }, cost: { wood: 50, stone: 32, food: 8 }, blocks: true },
  pandaGardenHouse: { name: 'round house with a garden', category: 'houses', art: { kind: 'house', variant: 'panda', stage: 'garden' }, cost: { wood: 52, stone: 34, food: 8 }, blocks: true },
  elephantGardenHouse: { name: 'arched house with a garden', category: 'houses', art: { kind: 'house', variant: 'elephant', stage: 'garden' }, cost: { wood: 62, stone: 40, food: 8 }, blocks: true },
  giraffeGardenHouse: { name: 'tall house with a garden', category: 'houses', art: { kind: 'house', variant: 'giraffe', stage: 'garden' }, cost: { wood: 58, stone: 38, food: 8 }, blocks: true },
});
