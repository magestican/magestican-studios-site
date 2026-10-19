





















import { levelBuilder } from './dsl.js';

export function buildL07() {
  const L = levelBuilder({ id: 7, name: 'The Long Way Home', pitCost: 'heart', height: 32, dir: -1 });

  
  L.putAt('ability', 869.4, 12, { grant: 'double', name: 'Thruster coil' });
  L.putAt('ability', 868.8, 12, { grant: 'pound', name: 'Pound plates' });
  L.putAt('ability', 868.2, 12, { grant: 'dash', name: 'Dash spring' });
  L.putAt('ability', 867.6, 12, { grant: 'glide', name: 'Broad leaf' });

  
  L.wall(874, 878, 0, 30);
  L.wall(852, 874, 0, 12);
  L.spawnAt(870, 12);
  L.ledge(840, 852, 9.5);
  L.ledge(828, 840, 7);
  L.landmarkAt('Gatepost', 863, 12);
  L.cameraHint(846, 878, { dy: -2 });

  
  L.wall(818, 852, 0, 2);
  L.wall(790, 818, 0, 0.5);
  L.wall(808, 810, 0.5, 1.5);
  L.wall(800, 802, 0.5, 1.5);
  L.shoeBeat(840, { lane: 'back', x: 880, radius: 80, use: 'M1' });
  L.putAt('ladybot', 812, 0.5, { dozing: true, facing: 1, flee: true });
  L.putAt('ladybot', 805, 0.5, { dozing: true, facing: 1, flee: true });

  
  L.wall(768, 790, 0, 2);
  L.shoeBeat(786, { lane: 'play', spare: true, lead: 0, use: 'M1' });
  L.putAt('antPorter', 789, 2, { dozing: true, facing: -1 });
  L.putAt('ladybot', 770, 2, { facing: 1 });
  L.cameraHint(760, 800, { ahead: 0 });

  
  L.wall(748, 768, 0, 4);
  L.carve(750, 766, 0.5, 3.5);
  L.carve(748, 750, 2, 3.5);
  L.wall(722, 748, 0, 2);
  L.putAt('intel', 757, 0.5, {
    secret: 'cache',
    name: "A Vast child's lost button",
    signals: ['visual:amber-glint', 'audio:hollow-knock'],
    seenFrom: 'the root hump top over the hollow (x 750-766, y 4)',
  });
  L.landmarkAt('Tree B', 745, 2);
  L.beaconAt(724, 2);

  
  L.shoeRun(722, 566, { tempo: 1.7, stride: 6.8 });
  L.cameraHint(560, 724, { ahead: 0 });
  L.wall(700, 722, 0, 2);

  
  L.wall(693, 696.5, 0, 1.5);
  L.wall(685, 689, 0, 1.5);
  L.wall(676, 681, 0, 1.5);

  
  L.wall(664, 672, 0, 2);
  L.wall(646, 660, 0, 2);
  L.shoeBeat(676, { use: 'M2', radius: 30 });
  L.putAt('ladybot', 656, 2, { facing: 1 });
  L.putAt('ladybot', 650, 2, { facing: -1, phase: 1 });

  
  L.wall(620, 642, 0, 2);
  L.wall(596, 620, 0, 4);
  L.wall(577, 592.5, 0, 2);
  L.wall(540, 574, 0, 2);

  
  L.wall(490, 540, 0, 2);
  L.wall(486, 540, 10, 11);
  L.carve(498, 502, 10, 11);
  L.wall(486, 490, 0, 10);
  L.carve(486, 490, 2, 5);
  L.wall(520, 521, 11, 14.5);
  L.putAt('ladybot', 508, 11, {
    specimen: true,
    lamp: true,
    hopEvery: 1,
    facing: -1,
    name: 'Lamplight Ladybot',
    signals: ['visual:lamp-blink', 'audio:cricket-hum'],
    seenFrom: 'inside the watering can, under the ceiling hole (x 496-504)',
    signalRange: 12,
  });
  L.putAt('antPorter', 530, 2, { facing: 1 });
  L.putAt('antPorter', 512, 2, { facing: 1 });
  L.cameraHint(490, 540, { dy: 3 });
  L.landmarkAt('Watering can', 513, 11);

  
  L.wall(452, 486, 0, 2);
  L.ledge(480, 486, 4.5);
  L.ledge(479, 485, 7.5);
  L.beaconAt(476, 2);

  
  L.shoeRun(474, 302, { tempo: 1.5, stride: 7.5 });
  L.cameraHint(296, 478, { ahead: 0 });

  
  
  L.wall(444, 449, 0, 0.5);
  L.wall(434, 440, 0, 0.5);
  L.wall(418, 429.5, 0, 0.5);
  L.wall(404, 414, 0, 0.5);
  L.wall(392, 400, 0, 2);
  L.ledge(447, 456, 5.5);
  L.ledge(436, 441, 6.5);
  L.ledge(424, 430, 7);
  L.ledge(410, 416, 6.5);
  for (const x of [451.5, 438.5, 426.5, 412.5]) L.landmarkAt('mud stalk', x, 0.5, 'back');
  L.shoeBeat(446, { use: 'M3', radius: 26 });
  L.putAt('ladybot', 424, 0.5, { facing: 1 });
  L.putAt('dew', 405.75, 0.5, { w: 1.5 });
  L.putAt('intel', 413, 6.5, {
    secret: 'deed',
    name: 'A gold-star sticker',
    signals: ['visual:gold-glint', 'audio:glint-chime'],
    seenFrom: 'ridge R3 in the heel print (x 418-429.5) and the high road',
    signalRange: 12,
  });

  
  L.wall(340, 392, 0, 2);
  L.wall(356, 374, 3.5, 6);
  L.shoeBeat(384, { use: 'M4' });
  L.putAt('snailknight', 366, 2, { facing: 1 });

  
  L.wall(320, 336, 0, 2);
  L.wall(300, 320, 0, 3.5);

  
  L.wall(264, 300, 0, 2);
  L.wall(282, 296, 5.5, 6.5);
  L.beaconAt(266, 2);
  L.landmarkAt('Tree A root arch', 289, 6.5);

  
  L.shoeRun(262, 84, { tempo: 1.4, stride: 8.4 });
  L.cameraHint(80, 266, { ahead: 0 });
  L.wall(254, 264, 0, 2);
  L.wall(241.5, 250, 0, 1.5);
  L.wall(224, 237, 0, 2);
  L.wall(212, 224, 0, 4);
  L.wall(200, 208, 0, 2);

  
  L.wall(196, 200, 0, 2);
  L.wall(188, 193.5, 0, 2);
  L.wall(180, 185.5, 0, 2);
  L.wall(137, 177.5, 0, 2);
  L.wall(176, 200, 4.5, 5.5);

  
  L.wall(65.5, 137, 0, 2);

  
  L.shoeBeat(88, { use: 'M5', radius: 50, final: true });
  L.wall(61, 65.5, 0, 0.5);
  L.wall(56, 61, 0, 2);
  L.wall(52, 56, 0, 0.5);
  L.wall(47, 52, 0, 2);
  L.wall(44, 47, 0, 0.5);
  L.putAt('ladybot', 72, 2, { facing: 1 });
  L.putAt('ladybot', 68, 2, { facing: -1 });
  L.putAt('ladybot', 58.5, 2, { facing: 1 });
  L.putAt('ladybot', 49.5, 2, { facing: -1 });

  
  L.wall(0, 44, 0, 2);
  L.putAt('finish', 10, 2, { dir: -1 });
  L.landmarkAt('Ship', 7, 2);

  const level = L.build();
  level.waypoints = ROUTE;
  return level;
}



const ROUTE = [
  { x: 846, y: 9.5, move: 'walk' }, 
  { x: 834, y: 7, move: 'walk' }, 
  { x: 820, y: 2, move: 'walk' }, 
  { x: 812, y: 0.5, move: 'walk' }, 
  { x: 804.5, y: 0.5, move: 'jump', at: 811 }, 
  { x: 797, y: 0.5, move: 'jump', at: 803 }, 
  { x: 786, y: 2, move: 'jump', at: 792 }, 
  { x: 769.5, y: 2, move: 'walk' }, 
  { x: 762, y: 4, move: 'jump', at: 770 }, 
  { x: 722, y: 2, move: 'walk' }, 
  { x: 694.5, y: 1.5, move: 'jump', at: 701 },
  { x: 687, y: 1.5, move: 'jump', at: 694 },
  { x: 678.5, y: 1.5, move: 'jump', at: 686 }, 
  { x: 668, y: 2, move: 'jump', at: 677 },
  { x: 655, y: 2, move: 'jump', at: 665 }, 
  { x: 638, y: 2, move: 'jump', at: 647 },
  { x: 616, y: 4, move: 'jump', at: 622 }, 
  { x: 589, y: 2, move: 'jump', at: 597 },
  { x: 571, y: 2, move: 'jump', at: 578 }, 
  { x: 520, y: 2, move: 'walk' }, 
  { x: 474, y: 2, move: 'walk' }, 
  { x: 446.5, y: 0.5, move: 'jump', at: 453 }, 
  { x: 437, y: 0.5, move: 'jump', at: 444.5 }, 
  { x: 424, y: 0.5, move: 'jump', at: 434.5 }, 
  { x: 410, y: 0.5, move: 'jump', at: 418.5 }, 
  { x: 397, y: 2, move: 'jump', at: 404.5 }, 
  { x: 350, y: 2, move: 'walk' }, 
  { x: 331, y: 2, move: 'jump', at: 341 },
  { x: 314, y: 3.5, move: 'jump', at: 322 }, 
  { x: 264, y: 2, move: 'walk' }, 
  { x: 246, y: 1.5, move: 'jump', at: 255 },
  { x: 233, y: 2, move: 'jump', at: 242 },
  { x: 219, y: 4, move: 'jump', at: 226 }, 
  { x: 204, y: 2, move: 'jump', at: 213 },
  { x: 191, y: 2, move: 'jump', at: 196.5 }, 
  { x: 183, y: 2, move: 'jump', at: 188.5 },
  { x: 174, y: 2, move: 'jump', at: 180.5 },
  { x: 134, y: 2, move: 'jump', at: 141 }, 
  { x: 95, y: 2, move: 'walk' }, 
  { x: 67, y: 2, move: 'walk' }, 
  { x: 58.5, y: 2, move: 'jump', at: 66.5 }, 
  { x: 49.5, y: 2, move: 'jump', at: 56.5 }, 
  { x: 10, y: 2, move: 'jump', at: 47.5 }, 
];
