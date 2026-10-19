






































import { levelBuilder } from './dsl.js';

const RISER = 20; 

const HOLE1 = 316;
const ARMED = { motif: 'keystroke' };
const KEY = (letter, use, extra = {}) => ({ letter, w: 3, rise: 1, mode: 'one', reach: 16, ...ARMED, use, ...extra });
const FISH = (facing, use) => ({ skin: 'silverfish', hop: false, facing, ...ARMED, use });

export function buildL11() {
  const L = levelBuilder({ id: 11, name: 'Desk of the Vast', pitCost: 'heart', pitReturn: 'ground', height: 48, soilLook: 'bookmark' });
  
  const hooks = {};
  const hook = (tag, x, y, props = {}) => {
    hooks[tag] = L.putAt('hook', x, y, { tag, required: true, ...props }).id;
  };

  
  L.wall(1, 296, 0, 16).wall(HOLE1, 326, 0, 16).wall(350, 456, 0, 16).wall(466, 712, 0, 16);

  
  L.putAt('ability', 4.4, 16, { grant: 'double', name: 'Thruster coil' });
  L.putAt('ability', 4.8, 16, { grant: 'pound', name: 'Pound plates' });
  L.putAt('ability', 5.2, 16, { grant: 'dash', name: 'Dash spring' });
  L.putAt('ability', 5.6, 16, { grant: 'glide', name: 'Broad leaf' });
  L.putAt('ability', 6.0, 16, { grant: 'wall', name: 'Wax grips' });

  
  L.spawnAt(3, 16).wall(0, 1, 16, 48).landmarkAt('Window', 2, 16, 'back');

  
  L.wall(12, 19, 16, 17.5).wall(22, 190, 16, 19).slick(22, 190, 16, 19);

  
  L.putAt('typeKey', 41.5, 19, KEY('J', 'M1'));
  L.putAt('ladybot', 46, 19, FISH(1, 'M1'));
  L.landmarkAt('BUG BLASTER', 60, 19, 'back');

  
  L.carve(58, 91, 17.5, 19);
  for (let i = 0; i <= 10; i++)
    L.heaveAt(58 + 3 * i, 61 + 3 * i, 19, -1.5, -0.2 * i, { group: 'type', period: 2.2, id: `L11-key-${i}`, launch: false });

  
  L.putAt('typeKey', 95.5, 19, KEY('J', 'M2'));
  L.putAt('typeKey', 101.5, 19, KEY('O', 'M2'));
  L.putAt('typeKey', 107.5, 19, KEY('B', 'M2'));
  for (const x of [110, 113, 116]) L.putAt('ladybot', x, 19, FISH(-1, 'M2'));

  
  L.beaconAt(128, 19);
  L.carve(136, 148, 17, 19);
  for (let i = 0; i <= 3; i++)
    L.heaveAt(136 + 3 * i, 139 + 3 * i, 19, 4, -0.3 * i, { group: 'type', period: 2.4, dwell: 0.6, id: `L11-stair-${i}`, launch: false });
  L.wall(150, 166, 19, 26).slick(150, 166, 19, 26);
  L.putAt('bandit', 160, 26, { facing: -1 });

  
  L.carve(172, 175, 17, 19);
  L.putAt('dustmite', 173.5, 17, {
    specimen: true,
    name: 'Dustmite Scout',
    signals: ['visual:crumb-puff', 'audio:static-crackle'],
    seenFrom: 'the macro pad top (y 26, x 150-166), looking down',
  });

  
  L.wall(204, 212, 16, 19.5).slick(204, 212, 16, 19.5);
  L.putAt('bandit', 224, 16, { facing: -1 });
  L.landmarkAt('Mouse', 208, 16);

  
  
  L.wall(234, 238, 16, 18.5).wall(238, 242, 16, 21);
  L.putAt('ability', 236, 18.5, { grant: 'tether', name: 'Paperclip hook' });
  L.wall(243, 257, 16, 27).slick(243, 257, 16, 27);
  hook('H1', 242.3, 29.5, { name: 'pen clip', teach: true });
  L.landmarkAt('Pencil mug', 250, 27);

  
  L.wall(264, 350, RISER, 21.5).slick(264, 350, RISER, 21.5);
  L.wall(270, 350, 21.5, 48).slick(270, 350, 21.5, 48);
  L.beaconAt(294, 16);

  
  
  L.slick(295, 296, 0, 16)
    .slick(HOLE1, HOLE1 + 1, 0, 16)
    .slick(325, 326, 0, 16)
    .slick(350, 351, 0, 16);

  
  hook('H2', 300, RISER, { name: 'cable clip' });
  hook('H3', 306.5, RISER, { name: 'cable clip' });
  hook('H4', 313, RISER, { name: 'cable clip' });
  L.cameraHint(294, 352, { dy: -1, y0: 14, y1: 22 });

  
  hook('H5', 330, RISER, { name: 'cable clip' });
  hook('H6', 336.5, RISER, { name: 'cable clip' });
  hook('H7', 343, RISER, { name: 'cable clip' });
  hook('H8', 348, RISER, { name: 'cable clip' });

  
  
  L.wall(358, 366, 16, 30).wall(369, 384, 16, 30);
  
  
  L.carve(358, 366, 16, 18.5);
  L.carve(371, 382, 27, 29).carve(369, 371, 27, 28.5).carve(376, 377, 29, 30).soil(376, 377, 29, 30);
  L.putAt('intel', 380, 27, {
    secret: 'cache',
    name: 'A Vast sticky note',
    signals: ['visual:amber-glint', 'audio:hollow-knock'],
    seenFrom: 'the books chimney through the slot (x 369-371, y 27-28.5)',
  });
  L.landmarkAt('Books', 375, 30);

  
  L.wall(412, 436, 16, 18).slick(412, 436, 16, 18);
  L.putAt('typeKey', 419.5, 18, KEY('9', 'M3'));
  L.putAt('typeKey', 428.5, 18, KEY('5', 'M3'));
  L.putAt('bandit', 434, 18, { facing: -1, ...ARMED, use: 'M3' });
  L.putAt('bandit', 442, 16, { facing: -1, ...ARMED, use: 'M3' });

  
  
  hook('H9', 462, 26.5, { name: 'lamp spring' });
  L.wall(466, 486, 16, 22).slick(466, 486, 16, 22);
  L.wall(474, 486, 37, 39).slick(474, 486, 37, 39);
  L.landmarkAt('Desk lamp', 470, 22);

  
  L.beaconAt(490, 16);
  hook('D1', 469, 33, { name: 'lamp spring', required: false });
  hook('D2', 473.5, 40, { name: 'lamp hinge', required: false });
  L.putAt('intel', 482, 39, {
    secret: 'deed',
    name: 'A Vast staff ID badge',
    signals: ['visual:gold-glint', 'audio:glint-chime'],
    seenFrom: 'the crack swing and the reams (on the lamp head, 13-17 u above)',
    signalRange: 18, 
  });

  
  
  L.wall(506, 534, 16, 26).slick(506, 534, 16, 26);
  hook('H10', 505.3, 29, { name: 'hinge pin' });

  
  
  L.ledge(552, 580, 22).ledge(552, 580, 28.5).ledge(552, 580, 35);
  L.wall(580, 581, 16, 36).slick(580, 581, 16, 36);
  hook('T1', 551.5, 24.5, { name: 'label clip' });
  hook('T2', 551.5, 31, { name: 'label clip' });
  hook('T3', 551.5, 37.5, { name: 'label clip' });
  L.landmarkAt('Letter trays', 566, 35);

  
  L.beaconAt(598, 16);
  L.wall(600, 690, 16, 17.5).slick(600, 690, 16, 17.5);
  L.landmarkAt('Laptop', 645, 17.5);

  
  for (let i = 0; i <= 6; i++)
    L.heaveAt(603 + 3 * i, 606 + 3 * i, 17.5, 2, 0.25 * i, { group: 'type', period: 2.0, id: `L11-wave-${i}`, launch: false });
  L.putAt('typeKey', 635, 17.5, { letter: 'SPACE', w: 18, rise: 1, mode: 'wide', reach: [-2, 18], screen: 'laptop', ...ARMED, use: 'M4' });
  for (const x of [648, 653, 658]) L.putAt('bandit', x, 17.5, { facing: -1, ...ARMED, use: 'M4' });

  
  L.putAt('typeKey', 679, 17.5, { letter: 'ENTER', w: 6, rise: 1.5, mode: 'all', reach: [0, 28], screen: 'laptop', ...ARMED, use: 'M5' });
  for (const x of [692, 698, 704]) L.putAt('bandit', x, 16, { facing: -1, ...ARMED, use: 'M5' });

  
  L.beaconAt(708, 16);
  L.cameraHint(700, 790, { dy: -2, y0: 8, y1: 28 });

  
  hook('C1', 720, 24, { name: 'cable tie' });
  hook('C2', 729, 22, { name: 'plug' });
  hook('C3', 748, 19, { name: 'cable tie' });
  hook('C4', 757, 17, { name: 'plug' });
  hook('C5', 767, 16, { name: 'cable tie' });
  hook('C6', 777, 15, { name: 'plug' });
  L.wall(784, 830, 0, 12).slick(784, 830, 0, 12);
  L.landmarkAt('Tower', 806, 12);

  
  L.putAt('cameo', 812, 12, { who: 'dustmite', zone: { x0: 804, x1: 820, y0: 11, y1: 16 } });
  L.putAt('finish', 812, 12, { name: 'The humming box' });

  const level = L.build();
  level.waypoints = route(hooks);
  level.hookTags = hooks;
  return level;
}


function route(H) {
  const T = (tag, at, x, y, extra = {}) => ({ x, y, move: 'tether', hook: H[tag], ...(at !== null ? { at } : {}), ...extra });
  const chain = (tag, next) => ({ hook: H[tag], next: H[next] });
  
  const beat = (fx, fy, x0, y) => ({ beat: { from: { x: fx, y: fy }, goal: { x0, y, dir: 1 } } });
  return [
    { x: 17, y: 17.5, move: 'jump', at: 12 }, 
    { x: 30, y: 19, move: 'jump', at: 21 }, 
    { x: 41.5, y: 20, move: 'jump' }, 
    { x: 56, y: 19, move: 'walk' },
    { x: 92, y: 19, move: 'walk' }, 
    { x: 95.5, y: 20, move: 'jump' }, 
    { x: 101.5, y: 20, move: 'jump' }, 
    { x: 107.5, y: 20, move: 'jump' }, 
    { x: 134, y: 19, move: 'walk' }, 
    { x: 140, y: 23, move: 'jump' }, 
    { x: 152, y: 26, move: 'jump' }, 
    { x: 176, y: 19, move: 'jump' }, 
    { x: 203, y: 16, move: 'walk' },
    { x: 210, y: 19.5, move: 'glide', at: 203 }, 
    { x: 236, y: 18.5, move: 'jump' }, 
    { x: 241.5, y: 21, move: 'jump' },
    T('H1', 241.5, 246, 27, beat(241.5, 21, 243, 27)), 
    { x: 294, y: 16, move: 'walk' }, 
    { ...T('H2', 295.5, 0, 0, beat(295.5, 16, HOLE1, 16)), ...chain('H2', 'H3') }, 
    { ...T('H3', null, 0, 0), ...chain('H3', 'H4') },
    T('H4', null, HOLE1 + 2, 16),
    { x: 324, y: 16, move: 'walk' },
    { ...T('H5', 325.5, 0, 0, beat(325.5, 16, 350, 16)), ...chain('H5', 'H6') }, 
    { ...T('H6', null, 0, 0), ...chain('H6', 'H7') },
    { ...T('H7', null, 0, 0), ...chain('H7', 'H8') },
    T('H8', null, 352, 16),
    { x: 370, y: 30, move: 'wall', via: { x: 367.5 } }, 
    { x: 383, y: 30, move: 'walk' },
    { x: 419.5, y: 19, move: 'jump', at: 412 }, 
    { x: 428.5, y: 19, move: 'jump' }, 
    { x: 455.5, y: 16, move: 'walk' },
    T('H9', 455.5, 468, 22, beat(455.5, 16, 466, 22)), 
    { x: 503, y: 16, move: 'walk' }, 
    T('H10', 503, 510, 26, { via: { double: true }, ...beat(503, 16, 506, 26) }), 
    { x: 550, y: 16, move: 'walk' },
    T('T1', 549.5, 554, 22, beat(549.5, 16, 552, 22)),
    T('T2', 552.5, 554, 28.5, beat(552.5, 22, 552, 28.5)),
    T('T3', 552.5, 554, 35, beat(552.5, 28.5, 552, 35)),
    { x: 581, y: 36, move: 'jump' }, 
    { x: 601, y: 17.5, move: 'jump' }, 
    { x: 624, y: 17.5, move: 'jump' }, 
    { x: 636, y: 17.5, move: 'jump', at: 624 }, 
    { x: 679, y: 19, move: 'jump' }, 
    { x: 711.5, y: 16, move: 'walk' }, 
    { ...T('C1', 711.5, 0, 0, beat(711.5, 16, 784, 12)), ...chain('C1', 'C2') }, 
    { ...T('C2', null, 0, 0), ...chain('C2', 'C3') }, 
    { ...T('C3', null, 0, 0), ...chain('C3', 'C4') },
    { ...T('C4', null, 0, 0), ...chain('C4', 'C5') },
    { ...T('C5', null, 0, 0), ...chain('C5', 'C6') },
    T('C6', null, 790, 12),
    { x: 812, y: 12, move: 'walk' }, 
  ];
}
