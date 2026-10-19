





import { levelBuilder } from './dsl.js';

export function buildL01() {
  const L = levelBuilder({ id: 1, name: 'Crash Orchard', pitCost: 'heart', height: 26 });
  const motif = { motif: 'kicked-pebble' };

  
  L.run(26).gap(2).run(10).gap(3).run(14);
  
  L.step(1.5, 8).step(1.5, 8).step(1.5, 8).step(-4.5, 14);
  
  L.put('pebble', 5, motif);
  L.put('ladybot', 18, { facing: 1 });
  L.run(34);
  L.beacon(2).run(10);
  
  L.gap(2.5).run(8).gap(4).run(6).gap(4.5).run(16);
  
  L.put('pillbug', 22, { facing: -1 });
  L.run(36);
  
  L.run(4);
  L.pillar(0, 6, 3);
  L.platform(-3, L.ground + 1.5, 2, 'one-way');
  L.secret(
    'cache',
    3,
    { name: 'Alien hard drive', signals: ['visual:hairline-crack', 'audio:hollow-knock'], seenFrom: 'the stairs top' },
    L.ground + 3,
  );
  L.run(12);
  
  L.put('pebble', 3, motif);
  L.run(8);
  L.step(1, 4);
  L.put('ladybot', 6, { facing: -1 });
  L.run(22);
  L.beacon(2).run(8);
  
  L.gap(3).run(3).gap(4).run(3).gap(5).run(4).gap(3.5).run(12);
  L.platform(-36, L.ground + 3, 2)
    .platform(-31, L.ground + 4.5, 2)
    .platform(-26, L.ground + 6, 2)
    .platform(-20, L.ground + 6, 3);
  L.secret(
    'deed',
    -19,
    { name: 'Bottle cap with alien DNA', signals: ['visual:gold-glint', 'audio:glint-chime'], seenFrom: 'gap chain' },
    L.ground + 6,
  );
  
  L.put('pebble', 6, motif);
  L.run(10).gap(3);
  L.put('pillbug', 10, { facing: -1, phase: 2.0 });
  L.run(28);
  
  L.platform(4, L.ground + 2.5, 10);
  L.put(
    'pillbug',
    8,
    { specimen: true, name: 'Golden pillbug', signals: ['visual:gold-shimmer', 'audio:tiny-jingle'], facing: 1 },
    L.ground + 2.5,
  );
  L.run(20);
  L.beacon(2).run(10);
  
  L.put('ladybot', 10, { facing: -1 });
  L.run(18).step(1, 10);
  L.put('ladybot', 6, { facing: -1, phase: 1 });
  L.run(14).gap(3).run(10).step(-1, 18);
  L.put('ladybot', 9, { facing: -1, phase: 0.5 });
  L.run(24);
  
  for (let i = 0; i < 4; i++)
    L.gap(3 + (i % 2))
      .run(9)
      .step(i % 2 ? -1 : 1, 9);
  L.beacon(2).run(12);
  
  
  L.ceiling(4, 6, L.ground + 3.5).run(14);
  L.put('pillbug', 10, { facing: -1, phase: 1.5 });
  L.run(24).gap(3).run(6).gap(3.5).run(6).step(1.5, 8).step(1.5, 8);
  L.put('ladybot', 5, { facing: -1 });
  L.run(16).step(-3, 20);
  L.put('pillbug', 12, { facing: -1 });
  L.run(30);
  L.beacon(2).run(10);
  for (let i = 0; i < 3; i++)
    L.gap(3.5)
      .run(6 + i * 2)
      .step(i === 1 ? 1 : 0, 6);
  
  L.put('pebble', 4, motif);
  L.run(8).step(-1, 6);
  L.put('ladybot', 8, { facing: -1 });
  L.put('ladybot', 15, { facing: -1, phase: 1 });
  L.run(30);
  
  L.gap(3).run(10).gap(4).run(10).step(1, 10).step(1, 10).run(20);
  L.put('finish', -8);
  return L.build();
}
