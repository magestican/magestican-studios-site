
































import { levelBuilder } from './dsl.js';

const BOSS = 'L08-boss-1';
const DEED = 'L08-intel-2';


const FIN_PAIRS = 6;
const ZIGS = 2; 
const FORK = 133 + 22 * ZIGS; 
const NFINS = 9 + 2 * FIN_PAIRS;
const X1 = FORK + 4.5 * (NFINS + 1); 
const UP = X1 - 178; 
const Y = (y) => y + UP;
const TOP = Y(274);

export function buildL08() {
  const L = levelBuilder({ id: 8, name: 'Honeycomb Hall', pitCost: 'heart', height: TOP });

  
  L.wall(0, 1, 0, TOP).wall(29, 30, 0, TOP).wall(1, 29, 0, 2);

  
  L.putAt('ability', 4.4, 2, { grant: 'double', name: 'Thruster coil' });
  L.putAt('ability', 4.8, 2, { grant: 'pound', name: 'Pound plates' });
  L.putAt('ability', 5.2, 2, { grant: 'dash', name: 'Dash spring' });
  L.putAt('ability', 5.6, 2, { grant: 'glide', name: 'Broad leaf' });

  
  L.spawnAt(4, 2);
  L.landmarkAt('Landing board', 2.5, 2);
  L.wall(16, 29, 24, 25);

  
  
  L.honey(6, 10, 2, { use: 'M1' });
  L.putAt('guard', 1.8, 2, { dozing: true, wakeWhen: { x: 12 }, facing: 1, motif: 'honey', use: 'M1' });

  
  L.putAt('ability', 11, 2, { grant: 'wall', name: 'Wax grips' });
  L.wall(12, 12.5, 4.5, 14).wall(14.5, 15, 4.5, 14).ledge(6, 12, 14);

  
  L.wall(1, 6, 14, 30).carve(2, 5, 26.5, 29).carve(5, 6, 26.5, 28.5).wall(8.5, 9, 17, 30);
  L.putAt('intel', 3.5, 26.5, {
    secret: 'cache',
    name: 'A Vast birthday-candle stub',
    signals: ['visual:amber-glint', 'audio:hollow-knock'],
    seenFrom: 'the Brood pillar top (x 1-6, y 30)',
  });

  
  L.ledge(9, 14, 32).ledge(16.5, 21, 34).ledge(23.5, 29, 36.5);
  L.wall(26.5, 27, 38.5, 48).wall(1, 26.5, 46, 48);
  L.beaconAt(23, 48);

  
  L.landmarkAt('Drip Gallery', 14, 48);

  
  L.ledge(17, 22, 50.5).ledge(11, 15.5, 53).ledge(5, 9.5, 55.5);
  L.ledge(1, 5, 55.5); 
  L.honey(17, 22, 50.5, { use: 'M2' }).honey(11, 15.5, 53, { use: 'M2' }).honey(5, 9.5, 55.5, { use: 'M2' });
  L.putAt('wasp', 16.5, 58, { motif: 'honey', use: 'M2' });
  L.putAt('wasp', 9, 59, { motif: 'honey', use: 'M2' });
  L.wall(3, 3.5, 58, 76);
  L.cameraHint(1, 23, { dy: 2, y0: 48, y1: 62 });

  
  L.wall(3.5, 29, 74, 76).wall(1, 13.5, 80, 82).wall(16, 29, 80, 82);
  L.honey(8, 11, 76, { use: 'M3' }).honey(18.5, 21.5, 76, { use: 'M3' });
  L.putAt('guard', 5.5, 76, { dozing: true, wakeWhen: { x: 12 }, facing: 1, motif: 'honey', use: 'M3' });
  L.putAt('guard', 27, 76, { dozing: true, wakeWhen: { x: 12, dir: 1 }, facing: -1, motif: 'honey', use: 'M3' });

  
  L.wall(13, 13.5, 82, 96).wall(16, 16.5, 82, 96).carve(16, 16.5, 88, 88.5);
  L.wall(16.5, 26, 94, 96).wall(25.5, 26, 85, 94);
  L.putAt('guard', 21, 82, {
    specimen: true,
    velvet: true,
    name: 'Velvet Page',
    signals: ['visual:cape-glint', 'audio:kazoo-fanfare'],
    seenFrom: 'chimney 5 through the slit (x 16-16.5, y 88-88.5)',
  });

  
  L.ledge(1, 13, 96).wall(4, 29, 98.5, 100);

  
  L.landmarkAt('Honey Works', 16, 100);
  L.putAt('antPorter', 16, 100, { skin: 'workerBee', facing: 1 });
  L.putAt('antPorter', 20, 100, { skin: 'workerBee', facing: -1 });

  
  
  
  L.wall(24, 24.5, 103, 111).wall(27.5, 29, 100, 111).ledge(15.5, 24.5, 111);
  L.wall(18.5, 19, 113.5, 122).wall(15, 15.5, 111, 122).ledge(6.5, 15, 122);
  L.wall(9.5, 10, 124.5, 133).wall(6, 6.5, 122, 133);
  L.putAt('wasp', 17, 129); 
  for (let k = 0; k < ZIGS; k++) {
    const b = 133 + 22 * k;
    L.ledge(1, 27.5, b); 
    L.wall(24, 24.5, b + 2.5, b + 11)
      .wall(27.5, 29, b, b + 11)
      .ledge(6.5, 24.5, b + 11); 
    L.wall(9.5, 10, b + 13.5, b + 22).wall(6, 6.5, b + 11, b + 22); 
  }
  L.ledge(1, 23, FORK);
  L.beaconAt(4, FORK);

  
  
  for (let i = 0; i < NFINS; i++) {
    const y0 = FORK + 2.5 + 4.5 * i;
    const x0 = i % 2 === 0 ? 23 : 17;
    L.wall(x0, x0 + 1, y0, Math.min(y0 + (i === 0 ? 7.5 : 7), X1));
    L.ledge(i % 2 === 0 ? 2 : 9, i % 2 === 0 ? 7 : 14, FORK + 4.5 * (i + 1));
  }
  L.ledge(4, 17, X1);

  
  
  L.wall(3, 3.5, Y(180.5), Y(194)).wall(3.5, 29, Y(192.5), Y(194));
  L.putAt('wasp', 11, Y(186)); 

  
  L.landmarkAt('Hatchery', 12, Y(194));
  L.putAt('wasp', 13, Y(201)); 
  L.wall(20.5, 21, Y(196.5), Y(214)).wall(23.5, 24, Y(194), Y(214)).wall(1, 21, Y(212.5), Y(214)).wall(23.5, 29, Y(212.5), Y(214));
  L.ledge(21, 23.5, Y(214));
  L.beaconAt(18, Y(214));

  
  
  
  L.landmarkAt('Royal gallery', 12, Y(214));
  L.putAt('cameo', 16, Y(214), { zone: { x0: 1, x1: 16, y0: Y(214), y1: Y(216) }, who: 'Duchess Mandibella' });
  L.putAt('guard', 12, Y(214), { dozing: true, wakeWhen: { x: 6 }, facing: -1 });
  L.wall(3.5, 4, Y(217), Y(230));
  L.cameraHint(1, 4, { dy: -3, y0: Y(214), y1: Y(226) });

  
  
  L.wall(4, 29, Y(228.5), Y(230)).wall(1, 26.5, Y(235), Y(236.5)).wall(26, 26.5, Y(232.5), Y(236.5));
  L.putAt('guard', 5, Y(230), { dozing: true, wakeWhen: { x: 12 }, facing: 1 });

  
  L.ledge(26.5, 29, Y(236.5));
  L.landmarkAt('Royal antechamber', 8, Y(236.5));
  L.wall(1, 13, Y(248), Y(250)).wall(16, 29, Y(248), Y(250)).ledge(13, 16, Y(250));
  L.wall(12.5, 13, Y(239.5), Y(248)).wall(16, 16.5, Y(239.5), Y(248));
  L.beaconAt(14.5, Y(250));

  
  L.honey(10, 20, Y(250), { use: 'M4' });
  L.ledge(1, 6, Y(254.5)).ledge(24, 29, Y(254.5)).ledge(1, 4, Y(261)).ledge(26, 29, Y(261));
  L.ledge(12.5, 17.5, Y(264)); 
  L.wall(1, 13, Y(270), Y(272)).wall(17, 29, Y(270), Y(272));
  L.landmarkAt('Throne room', 15, Y(264));
  
  L.putAt('intel', 2.5, Y(261), {
    id: DEED,
    alive: false,
    secret: 'deed',
    name: "The Duchess's spare tiara",
    condition: { noDamageInPhase: 2 },
    signals: ['visual:gold-glint', 'audio:glint-chime'],
    seenFrom: 'the arena: it lands on the left perch at the P2 -> P3 transition',
  });
  const respawn = { x: 14.5, y: Y(250) }; 
  L.putAt('boss', 15, Y(264), {
    id: BOSS,
    type: 'duchess',
    name: 'Duchess Mandibella',
    w: 3,
    h: 2,
    arena: { x0: 1, x1: 29, y0: Y(250), y1: Y(270) },
    escape: true,
    respawn,
    vat: { x0: 10, x1: 20, y: Y(250) },
    dais: { x: 15, y: Y(264) },
    hole: { x: 15 },
    bolt: { x: 3, y: Y(256) }, 
    phases: [
      {
        name: 'Grand Entrance',
        hp: 2,
        use: 'M4',
        motif: 'honey',
        weakness: 'stomp',
        spawn: respawn,
        attacks: [
          { name: 'hornCharge', telegraph: 0.8, active: 2.5, recover: 3.0 },
          { name: 'glitterFan', telegraph: 0.7, active: 0.6, recover: 0.8 },
        ],
      },
      {
        name: 'Court Dance',
        hp: 3,
        deed: DEED,
        weakness: 'stomp',
        spawn: respawn,
        attacks: [
          { name: 'royalSwoop', telegraph: 0.9, active: 1.6, recover: 2.5 },
          { name: 'glitterFanDouble', telegraph: 0.7, active: 0.8, recover: 0.8 },
        ],
      },
      {
        name: 'Crown Grab',
        hp: 1,
        use: 'M5',
        motif: 'honey',
        weakness: 'stomp',
        spawn: respawn,
        
        attacks: [{ name: 'royalDive', telegraph: 1.2, active: 1.0, recover: 4.0 }],
      },
    ],
  });

  
  L.putAt('finish', 15, Y(250), { axis: 'y', alive: false, bossGate: BOSS, name: 'Camp lamp' });

  const level = L.build();
  level.waypoints = ROUTE;
  return level;
}


const ROUTE = [
  { x: 11, y: 2, move: 'walk' }, 
  { x: 10, y: 14, move: 'wall', via: { x: 13.5 } }, 
  { x: 4, y: 30, move: 'wall', via: { x: 7.25 } }, 
  { x: 11.5, y: 32, move: 'jump', at: 6 },
  { x: 19, y: 34, move: 'jump', at: 14 },
  { x: 25, y: 36.5, move: 'jump', at: 21 },
  { x: 24, y: 48, move: 'wall', via: { x: 28 } }, 
  { x: 19.5, y: 50.5, move: 'jump' }, 
  { x: 13, y: 53, move: 'jump' }, 
  { x: 7, y: 55.5, move: 'jump' }, 
  { x: 4.5, y: 76, move: 'wall', via: { x: 2 } }, 
  { x: 11, y: 96, move: 'wall', via: { x: 14.75 } }, 
  { x: 2.5, y: 96, move: 'walk' },
  { x: 6, y: 100, move: 'wall', via: { x: 2.5 } }, 
  { x: 21, y: 111, move: 'wall', via: { x: 26 } }, 
  { x: 12, y: 122, move: 'wall', via: { x: 17 } }, 
  { x: 26, y: 133, move: 'wall', via: { x: 8 } }, 
  ...Array.from({ length: ZIGS }, (_, k) => [
    { x: 12, y: 144 + 22 * k, move: 'wall', via: { x: 26 } }, 
    k === ZIGS - 1 ? { x: 4, y: FORK, move: 'wall', via: { x: 8 } } : { x: 26, y: 155 + 22 * k, move: 'wall', via: { x: 8 } }, 
  ]).flat(),
  { x: 20.5, y: FORK, move: 'walk' },
  { x: 12, y: X1, move: 'wall', via: { x: 20.5 }, maxS: 20 }, 
  { x: 5, y: Y(194), move: 'wall', via: { x: 2 } }, 
  { x: 18, y: Y(214), move: 'wall', via: { x: 22.25 } }, 
  { x: 4.5, y: Y(230), move: 'wall', via: { x: 2.25 } }, 
  { x: 26, y: Y(236.5), move: 'wall', via: { x: 27.75 } }, 
  { x: 14.5, y: Y(250), move: 'wall', via: { x: 14.5 } }, 
  { x: 15, y: Y(250), move: 'boss' }, 
];
