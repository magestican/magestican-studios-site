











import { levelBuilder } from './dsl.js';

const KIT = [
  ['double', 'Thruster coil'],
  ['pound', 'Pound plates'],
  ['dash', 'Dash spring'],
  ['glide', 'Broad leaf'],
  ['wall', 'Wax grips'],
  ['tether', 'Paperclip hook'],
  ['lantern', 'Firefly Lantern'],
  ['drill', 'Screw-drill'],
];
const DECK = 6; 

export function buildL19() {
  const L = levelBuilder({ id: 19, name: 'Stampede', pitCost: 'heart', height: 44, ride: 'L19-ruuma', camDist: 26 });
  const hurdle = (x, skin = 'hurdle') => L.putAt('obstacle', x, DECK, { w: 1.2, h: 1.0, skin });
  const lintel = (x, skin = 'lintel') => L.putAt('obstacle', x, DECK + 1.4, { w: 1.6, h: 1.6, skin });
  const tall = (x, skin = 'pot') => L.putAt('obstacle', x, DECK, { w: 2.0, h: 4.0, skin });
  const wave = (x, use) => L.putAt('maneWave', x, DECK, { motif: 'mane', use });
  
  
  const surfSeeds = (x) => {
    for (const [dx, dy] of [
      [0, 3.5],
      [3, 5.5],
      [6, 6.5],
      [9, 5.5],
      [12, 3.5],
    ])
      L.putAt('seed', x + dx, DECK + dy);
  };
  const seeds = (...pts) => {
    for (const [x, y] of pts) L.putAt('seed', x, y);
  };
  const soft = (x, skin, y = DECK, h = 1.0) => L.putAt('obstacle', x, y, { w: 1.2, h, skin, soft: true });
  const line = (step, x0, x1) =>
    L.putAt('cameo', (x0 + x1) / 2, DECK, { event: 'rideLine', step, zone: { x0, x1, y0: DECK - 1, y1: DECK + 9 } });

  L.wall(0, 1660, 0, 2); 
  L.wall(1660, 1760, 0, 30); 
  
  L.packetLane(
    'L19-ruuma',
    [
      [-20, DECK],
      [1440, DECK],
      [1462, DECK + 7],
      [1484, DECK],
      [1600, DECK],
      [1650, 31],
      [1740, 31],
    ],
    { speed: 14, period: 1e6, offset: 0, w: 26 },
  );
  L.spawnAt(12, DECK);
  for (const [i, [grant, name]] of KIT.entries()) L.putAt('ability', 13 + 0.4 * i, DECK, { grant, name }); 
  line(0, 8, 30);

  
  soft(50, 'crumb');
  soft(70, 'crumb');
  L.landmarkAt('The kitchen', 40, 14, 'back');
  
  soft(110, 'beads', DECK + 1.4, 1.6); 
  hurdle(150, 'rug');
  wave(190, 'M1');
  surfSeeds(190);
  tall(198, 'stool');
  L.putAt('intel', 198, 12.9, {
    
    secret: 'cache',
    name: "The kid's toy astronaut",
    signals: ['visual:gold-glint', 'audio:toy-squeak'],
    seenFrom: 'the hall entry: on the coat-hook shelf, high over the stool',
  });
  lintel(260, 'door');
  hurdle(290, 'rug');
  line(1, 80, 100);
  L.landmarkAt('The hallway', 200, 16, 'back');
  
  for (const x of [340, 346, 352, 358, 364]) lintel(x, 'flap');
  line(2, 296, 312); 
  L.landmarkAt('The cat flap', 352, 12, 'mid');
  
  L.beaconAt(430, DECK);
  
  hurdle(460, 'chair');
  lintel(490, 'chair'); 
  wave(512, 'M2');
  surfSeeds(512);
  tall(520, 'pot');
  hurdle(600, 'chair');
  hurdle(640, 'chair');
  L.putAt('obstacle', 700, DECK, { w: 2.0, h: 3.5, skin: 'pot' }); 
  seeds([730, 8.5], [750, 8.5]); 
  hurdle(770, 'chair');
  L.landmarkAt('The patio', 600, 14, 'back');
  
  L.beaconAt(800, DECK);
  
  for (const [x, y] of [
    [840, 15],
    [870, 16],
    [960, 15],
    [1025, 15], 
  ])
    L.putAt('wasp', x, y, { wake: 14, wakeY: 14 });
  wave(900, 'M3');
  surfSeeds(900);
  tall(908, 'sprinkler');
  L.putAt('perchBug', 885, 12.3, {
    fly: { x1: 945, lead: 5 }, 
    specimen: true,
    name: 'Comet Cadet',
    signals: ['visual:azure-trail', 'audio:comet-whine'],
    seenFrom: 'the patio: it races along the sprinkler arc',
  });
  hurdle(1000, 'gnome');
  hurdle(1050, 'gnome');
  seeds([1055, 8.5], [1060, 8.5], [1065, 8.5], [1070, 8.5], [1075, 8.5]); 
  line(3, 790, 810);
  L.landmarkAt('The lawn', 950, 14, 'back');
  
  L.beaconAt(1100, DECK);
  
  for (const x of [1150, 1200, 1250]) lintel(x, 'sheet');
  wave(1300, 'M4');
  surfSeeds(1300);
  tall(1308, 'pole');
  wave(1340, 'M4');
  surfSeeds(1340);
  tall(1348, 'pole');
  L.landmarkAt('The washing line', 1250, 16, 'back');
  
  lintel(1378, 'peg'); 
  hurdle(1406, 'peg');
  L.beaconAt(1425, DECK);
  
  hurdle(1500, 'flowers');
  hurdle(1520, 'flowers');
  hurdle(1560, 'flowers');
  wave(1600, 'M5');
  seeds([1605, 14], [1613, 18], [1621, 22], [1629, 26], [1637, 29], [1645, 31]); 
  L.putAt('intel', 1690, 31.3, {
    
    secret: 'deed',
    alive: false,
    condition: { noHurtFrom: 1100, at: 1650 },
    name: "Ruuma's collar bell",
    signals: ['visual:gold-glint', 'audio:bell-jingle'],
    seenFrom: 'the sill: it drops there if no hurt since CK3',
  });
  line(4, 1525, 1545); 
  L.landmarkAt('The windowsill', 1700, 36, 'mid');
  L.putAt('finish', 1712, 30, { name: 'The windowsill' });
  return L.build();
}
