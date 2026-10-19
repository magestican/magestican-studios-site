





import { levelBuilder } from './dsl.js';

export function buildL01() {
  const L = levelBuilder({ id: 1, name: 'Crash Orchard', pitCost: 'heart', height: 26 });
  const motif = { motif: 'kicked-pebble' };
  
  const at = (kind, x, props = {}, y = L.ground) => L.put(kind, x - L.x, props, y);

  
  L.landmark('crashed-survey-ship', 7).run(16);
  
  L.step(1, 4).step(-1, 6);
  L.step(2.5, 6).step(-2.5, 8);
  
  L.run(4).step(-1.5, 3).step(1.5, 5).step(-1.5, 4).step(1.5, 5).step(-1.5, 4.5).step(1.5, 10.5);
  
  L.gap(2.5).run(9.5);
  
  at('pebble', 92, motif);
  at('ladybot', 102, { facing: 1 });
  L.run(32).gap(3);
  
  L.run(5).step(-1.5, 14);
  L.platform(-15, 3, 16, 'one-way');
  at('pillbug', 135, { facing: -1 }, 0.5);
  L.step(1.5, 18);
  
  L.run(6);
  at('pebble', 164, motif);
  L.step(-1, 22);
  at('pillbug', 180, { facing: -1 });
  L.step(1, 12).beacon(-3);
  
  L.gap(3).run(6).gap(4).run(6).gap(4.5).run(8.5);
  
  L.run(4);
  at('pebble', 235.5, motif); 
  L.gap(3).run(23);
  at('ladybot', 246, { facing: -1 });
  
  L.run(38).ceiling(-18, 14, 5.5).platform(-10, 8, 3);
  L.landmark('tree-a-root-arch', -11);
  L.secret(
    'cache',
    -8.5,
    { name: 'Alien hard drive', signals: ['visual:amber-glint', 'audio:hollow-knock'], seenFrom: 'under the root arch (x 282-296)' },
    8,
  );
  
  L.step(2, 6).step(2, 6).step(2, 6).run(6).platform(-31, 8, 19, 'one-way');
  
  L.step(-3, 6).step(-3, 6);
  
  L.run(40);
  at('ladybot', 348, { facing: -1 });
  at('ladybot', 364, { facing: -1, phase: 1 });
  L.step(1, 10).beacon(-2);
  
  
  L.run(4).step(-2.5, 44).platform(-42, 3, 38).platform(-4, 3, 4, 'one-way');
  at('pillbug', 412, {
    specimen: true,
    name: 'Golden pillbug',
    signals: ['visual:gold-shimmer', 'audio:tiny-jingle'],
    seenFrom: 'the high slab above the root cellar (x 392-430)',
    facing: 1,
  });
  
  
  L.step(2.5, 66);
  L.landmark('vast-watering-can', -33, 'far');
  L.platform(-56, 5.5, 1.5, 'one-way').platform(-50.5, 6.5, 1.5, 'one-way').platform(-45, 7.5, 1.5, 'one-way');
  L.platform(-39, 7.5, 1.5, 'one-way').platform(-33, 7.5, 3, 'one-way');
  L.secret(
    'deed',
    -31.5,
    {
      name: 'Bottle cap with alien DNA',
      signals: ['visual:gold-glint', 'audio:glint-chime'],
      seenFrom: 'the slab end x 430 and the breather floor',
    },
    7.5,
  );
  
  L.run(56);
  at('pebble', 504, motif);
  at('ladybot', 512, { facing: 1 });
  at('pillbug', 524, { facing: -1 });
  L.step(1.5, 8);
  
  L.run(4).gap(2.5).run(3).gap(2.5).run(3).gap(2.5).run(6.5).ceiling(-20, 20, 7);
  
  L.step(-2.5, 12).beacon(-2);
  
  L.run(4).gap(3.5).run(7);
  at('ladybot', 612, { facing: -1 });
  L.gap(4).step(1, 6).gap(4).step(-1, 12);
  at('pillbug', 636, { facing: -1 });
  L.gap(4.5).run(6).step(2, 6).step(2, 6).run(3);
  at('pebble', 664, motif);
  
  L.step(-1.5, 8).step(-1.5, 8).step(-1, 30);
  at('ladybot', 690, { facing: -1 });
  at('ladybot', 697, { facing: -1, phase: 1 });
  at('pillbug', 705, { facing: -1 });
  L.step(2, 10);
  
  L.run(10).step(-1, 14).gap(3).run(12).step(-1, 16).gap(3).run(60);
  L.landmark('tree-b', -32);
  L.put('finish', -8);
  return L.build();
}
