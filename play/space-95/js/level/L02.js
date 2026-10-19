






import { levelBuilder } from './dsl.js';

export function buildL02() {
  const L = levelBuilder({ id: 2, name: 'Purple Trunk', pitCost: 'heart', height: 272 });
  const dew = (x, y, use) => L.putAt('dew', x, y, { motif: 'dew-bounce', use, w: 1.5 }); 
  const seeds = (...pts) => {
    for (const [x, y] of pts) L.putAt('seed', x, y);
  };
  const aphid = (x, y, group, props = {}) => L.putAt('aphid', x, y, { group, ...props });

  
  L.wall(0, 1, 0, 272).wall(29, 30, 0, 272).wall(1, 29, 0, 2);

  
  L.spawnAt(3, 2);
  L.landmarkAt('tree-b-root-flare', 4, 2);
  L.landmarkAt('l01-beacon-prop', 2, 2);
  L.landmarkAt('ribbon-bow-low', 25, 4, 'bg');

  
  L.bark(8, 10, 2, 6).ledge(8, 17, 6);
  seeds([9, 3.5], [9, 5]);

  
  L.bark(15, 17, 6, 12).bark(20, 22, 10, 17).ledge(20, 23, 17).ledge(22, 26, 9);
  seeds([16, 8], [16, 10], [18.5, 13.5], [21, 15]);

  
  L.wall(23, 26, 15, 17).wall(26, 27.5, 15, 16).wall(27.5, 29, 15, 17).ledge(18, 28.5, 21);
  dew(26.75, 16, 'D1');
  seeds([26.75, 18], [26.75, 19.5], [26.75, 21.5], [23, 21.5], [20, 21.5]);

  
  L.ledge(5, 17, 23.5).bark(5, 7, 23.5, 31).ledge(3, 9, 31);
  L.putAt('ladybot', 11, 23.5, { facing: -1 });

  
  L.wall(9.5, 17, 28.5, 29).wall(17, 18.5, 27.5, 28).wall(18.5, 20, 27.5, 31).ledge(15, 25, 33);
  dew(17.75, 28, 'D2');
  seeds([11.5, 29.5], [13.5, 29.5], [15.5, 29.5], [17.75, 30.5], [17.75, 32], [17.75, 33.5], [20, 33.5]);

  
  L.bark(24, 26, 33, 45).ledge(18, 28, 45).ledge(6, 14, 38);
  aphid(9, 38, 'A0');
  aphid(11, 38, 'A0');
  seeds([25, 37], [25, 41]);

  
  
  
  L.ledge(3, 17, 47).bark(4.5, 6.5, 47, 55).ledge(1, 12, 55);
  aphid(10, 47, 'A1');
  aphid(11.5, 47, 'A1', { phase: 0.6 });
  L.beaconAt(6, 55);

  
  L.bark(2, 4, 55, 63).bark(7.5, 9.5, 59, 70).bark(13, 15, 67, 76).ledge(12, 16, 76).ledge(9.5, 24, 62);
  L.wall(24, 29, 67, 69); 
  L.putAt('intel', 25.5, 69, {
    secret: 'cache',
    name: "A giant's lost button",
    signals: ['visual:pearl-glint', 'audio:hollow-knock'],
    seenFrom: 'across the furrow from bark columns B and C (x 7.5-15, y 59-76)',
  });
  seeds([8.5, 65], [14, 72]);

  
  L.wall(16, 16.5, 74, 76).wall(16.5, 18, 74, 75).wall(18, 27, 74, 76);
  L.bark(27, 29, 69, 76); 
  dew(17.25, 75, 'D3');
  aphid(20.5, 76, 'A2');
  aphid(21.5, 76, 'A2');
  aphid(22.5, 76, 'A2');
  seeds([18.6, 78], [19.4, 79.7], [20.2, 80.8], [21, 81.5], [21.8, 81.8], [22.6, 81.5], [23.4, 80.5], [24.2, 78.7]);

  
  L.bark(23.5, 26.5, 76, 88).ledge(14, 28, 88);
  L.ledge(23, 28, 90.5).ledge(17, 22, 93).ledge(23, 28, 95.5).ledge(17, 22, 98);
  L.bark(14, 16, 88, 100).ledge(10, 28, 100).wall(10, 11, 86, 99).ledge(1.5, 10, 92);
  aphid(6, 92, 'specimen', {
    specimen: true,
    hop: 4,
    period: 2.0,
    name: 'Glassy dew aphid',
    signals: ['visual:blue-shimmer', 'audio:bubble-plip'],
    seenFrom: 'across from the stair ledge OW(17,22,93) and from above on the fork shelf',
  });
  seeds([20, 93.5], [25, 96]);

  
  L.wall(8, 27.5, 108, 110); 
  L.bark(7, 16, 100.5, 108).bark(4, 7, 100.5, 110).bark(2, 4, 92, 110).ledge(2, 8, 110);
  aphid(11, 100, 'A3');
  aphid(12.5, 100, 'A3');
  seeds([13, 107.5], [10, 107.5], [7, 107.5]);

  
  L.wall(27.5, 29, 108, 109.5).ledge(27, 29, 114.5).ledge(27, 29, 119.5).ledge(1, 29, 124.5);
  dew(28.25, 109.5, 'D4');
  dew(28.25, 114.5, 'D4');
  dew(28.25, 119.5, 'D4');
  seeds([12, 110.5], [16, 110.5], [20, 110.5], [24, 110.5], [28.25, 112], [28.25, 113.5]);
  seeds([28.25, 117], [28.25, 118.5], [28.25, 122], [28.25, 123.5]);
  L.beaconAt(24, 124.5);

  
  L.ledge(11, 17, 127).ledge(1, 9.5, 129.5).bark(1.5, 3.5, 129.5, 147).ledge(1, 9, 147);
  L.ledge(11, 18, 149.5).ledge(19.5, 25, 152).bark(22.5, 24.5, 152, 165).ledge(19, 29, 165);
  L.ledge(12, 26, 141).bark(19.5, 21.5, 141, 152); 
  aphid(12.5, 127, 'A4');
  aphid(14, 127, 'A4');
  L.putAt('ladybot', 6, 129.5, { facing: -1 });
  aphid(14, 149.5, 'A5');
  aphid(15.5, 149.5, 'A5');
  seeds([2.5, 135], [2.5, 140], [2.5, 145], [23.5, 158]);

  
  L.bark(26, 28, 165, 190);
  seeds([27, 170], [27, 175], [27, 180], [27, 185]);

  
  L.wall(1, 18, 188, 190).ledge(18, 29, 190);
  L.bark(22, 23, 192, 196).bark(26.5, 27.5, 195, 199).bark(22, 23, 198, 202);
  L.bark(26.5, 27.5, 201, 205).bark(22, 23, 204, 208).ledge(20, 25, 208);
  L.putAt('intel', 22.5, 208, {
    secret: 'deed',
    name: "A Vast child's drawing",
    signals: ['visual:paper-flutter', 'audio:paper-rustle'],
    seenFrom: 'the Snag shelf (y 190) below it',
  });
  seeds([15, 190.5], [11, 190.5]);
  L.beaconAt(5, 190);
  L.landmarkAt('the-snag', 10, 190);
  L.landmarkAt('kite-bow', 24, 196, 'bg');

  
  L.bark(2, 4, 190, 198).bark(7.5, 9.5, 195, 204).bark(2, 4, 201, 210).ledge(1, 14, 210);
  L.bark(12, 14, 210, 219).bark(17.5, 19.5, 215, 224).bark(23, 25, 221, 230).ledge(22, 29, 230);
  L.ledge(12, 29, 214); 
  aphid(7, 210, 'A6', { phase: 0.9 });
  aphid(8.5, 210, 'A6', { phase: 0.9 });
  seeds([8.5, 200], [3, 207], [18.5, 220], [24, 227]);

  
  L.ledge(1, 20, 232.5).bark(2, 4, 232.5, 246).ledge(1, 5, 246);
  L.putAt('ladybot', 15, 232.5, { facing: 1 });
  seeds([3, 238], [3, 243]);

  
  L.wall(5, 12.5, 244, 246).wall(12.5, 14, 244, 245).wall(14, 15, 244, 246);
  L.ledge(19.5, 29, 247).ledge(14, 19.5, 241).bark(19.5, 21, 241, 247);
  dew(13.25, 245, 'D5');
  seeds([14.6, 247.6], [15.4, 249.2], [16.2, 250.3], [17, 251], [17.8, 251.3], [18.6, 251], [19.4, 250], [20.2, 248.2]);

  
  
  
  L.ledge(22, 28, 249.5).ledge(8, 20, 252).bark(8, 10, 252, 260).ledge(6, 12, 260).wall(12, 29, 258, 260);
  seeds([24, 250], [14, 252.5], [9, 256], [14, 260.5], [16, 262], [20, 264.5], [24, 264.5]);
  L.bark(15, 17, 260, 264).ledge(14, 29, 264); 
  L.putAt('finish', 26, 264, { axis: 'y' });
  L.landmarkAt('vast-kite', 21, 266, 'far');

  const level = L.build();
  
  
  level.waypoints = ROUTE.map(([x, y, move]) =>
    move === 'pop' ? { x, y: y + 0.7, move: 'climb' } : move === 'joff' ? { x, y, move: 'climb' } : { x, y, move },
  );
  return level;
}



const ROUTE = [
  [9, 2, 'walk'],
  [9, 6, 'pop'],
  [16, 6, 'walk'],
  [16, 12, 'climb'],
  [21, 14, 'joff'],
  [21, 17, 'pop'],
  [27, 21, 'bounce'],
  [18.5, 21, 'walk'],
  [15.5, 23.5, 'jump'],
  [11, 23.5, 'walk'],
  [6, 23.5, 'jump'],
  [6, 31, 'pop'],
  [8.8, 31, 'walk'],
  [10.8, 29, 'drop'],
  [17.75, 33, 'bounce'],
  [25, 33, 'walk'],
  [25, 45, 'pop'],
  [18.5, 45, 'walk'],
  [15.5, 47, 'jump'],
  [13, 47, 'walk'],
  [8.5, 47, 'jump'],
  [5.5, 47, 'walk'],
  [5.5, 55, 'pop'],
  [3, 55, 'walk'],
  [3, 63, 'climb'],
  [8.5, 64, 'joff'],
  [8.5, 70, 'climb'],
  [14, 70.5, 'joff'],
  [14, 76, 'pop'],
  [24.8, 76, 'bounce'],
  [25, 88, 'pop'],
  [25, 90.5, 'jump'],
  [20, 93, 'jump'],
  [25, 95.5, 'jump'],
  [20, 98, 'jump'],
  [20, 100, 'jump'],
  [15, 100, 'walk'],
  [15, 107, 'climb'],
  [5.5, 107, 'climb'],
  [5.5, 110, 'pop'],
  [28.25, 124.5, 'bounce'],
  [17, 124.5, 'walk'],
  [16, 127, 'jump'],
  [11.5, 127, 'jump'],
  [8.5, 129.5, 'jump'],
  [6, 129.5, 'walk'],
  [2.5, 129.5, 'jump'],
  [2.5, 147, 'pop'],
  [8.5, 147, 'walk'],
  [12, 149.5, 'jump'],
  [17, 149.5, 'jump'],
  [20.5, 152, 'jump'],
  [23.5, 152, 'walk'],
  [23.5, 165, 'pop'],
  [27, 165, 'walk'],
  [27, 190, 'pop'],
  [5, 190, 'walk'],
  [3, 190, 'walk'],
  [3, 198, 'climb'],
  [8.5, 199, 'joff'],
  [8.5, 204, 'climb'],
  [3, 205, 'joff'],
  [3, 210, 'pop'],
  [5.8, 210, 'walk'],
  [11, 210, 'jump'],
  [13, 210, 'walk'],
  [13, 219, 'climb'],
  [18.5, 220, 'joff'],
  [18.5, 224, 'climb'],
  [24, 225, 'joff'],
  [24, 230, 'pop'],
  [19.5, 232.5, 'jump'],
  [15, 232.5, 'jump'],
  [3, 232.5, 'walk'],
  [3, 246, 'pop'],
  [20.5, 247, 'bounce'],
  [24, 249.5, 'jump'],
  [18.5, 252, 'jump'],
  [9, 252, 'walk'],
  [9, 260, 'pop'],
  [16, 260, 'walk'],
  [16, 264, 'pop'],
  [26, 264, 'walk'],
];
