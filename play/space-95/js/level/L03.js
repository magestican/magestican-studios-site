








import { levelBuilder } from './dsl.js';

export function buildL03() {
  const L = levelBuilder({ id: 3, name: 'Ant Highway', pitCost: 'heart', height: 26 });
  
  const n = { antColumn: 0, antPorter: 0 };
  const put = L.put;
  L.put = (kind, dx, props = {}, y = L.ground) =>
    put(kind, dx, kind in n && !props.id ? { id: `L03-${kind.toLowerCase()}-${++n[kind]}`, ...props } : props, y);
  
  const at = (kind, x, props = {}, y = L.ground) => L.put(kind, x - L.x, props, y);
  
  const crew = (kind, x, props = {}, y = L.ground + 0.5) => at(kind, x, { facing: -1, wake: 6, ...props }, y);
  const porter = (x, facing) => at('antPorter', x, { facing });

  
  L.run(14).landmark('Tree B far side + burst apple', -8);
  
  L.run(32);
  porter(22, 1);
  porter(27, 1);
  porter(40, -1);
  
  L.run(4).antColumn(0, 40).run(40).step(1.5, 6).step(-1.5, 10);
  
  L.run(20);
  at('aphid', 114, { phase: 0.3 }); 
  at('aphid', 120, { phase: 0.6 });
  
  L.run(4).antColumn(0, 36, 4, { headline: 'M1' });
  crew('ladybot', 144, { facing: 1 });
  L.run(36).step(2, 8).step(-2, 8);
  
  L.run(6).step(1.5, 8).gap(4).step(-1.5, 0).antColumn(0, 36, 4, { headline: 'M2' });
  crew('ladybot', 210, { phase: 1 });
  crew('pillbug', 224);
  L.run(36).step(1.5, 6).step(-1.5, 14);
  porter(248, 1);
  
  L.run(4).antColumn(0, 30).run(30).step(1.5, 6).step(-1.5, 6).beacon(-4);
  
  L.run(26);
  L.put('ability', -0.6, { grant: 'double', name: 'Thruster coil' });
  L.landmark('Crumb quarry + sugar cube', -10);
  
  L.step(4, 4).step(-4, 10);
  
  L.step(-1.5, 6.5).step(1.5, 6).step(-1.5, 7).step(1.5, 10);
  
  L.gap(6.5).run(8).gap(7).run(10);
  
  L.run(4).gap(6).run(10);
  at('aphid', 418);
  
  L.run(26);
  at('ladybot', 433, { facing: -1 });
  porter(437, -1);
  porter(441, -1);
  porter(445, -1);
  
  
  L.step(2, 8).gap(6.5).step(-2, 0).antColumn(0, 44, 4, { headline: 'M3' });
  crew('ladybot', 474.5);
  crew('ladybot', 482.5, { phase: 1 });
  crew('pillbug', 492.5);
  L.run(44).step(2.5, 8).platform(-27.5, 8.5, 24, 'one-way');
  L.secret(
    'cache',
    -25.5,
    {
      name: 'Pheromone map from an ant queen',
      signals: ['visual:scent-wisps', 'audio:queen-hum'],
      seenFrom: 'riding the M3 column underneath (x 470-505)',
    },
    8.5,
  );
  
  L.step(-2.5, 12).beacon(-2);
  
  
  L.run(10).step(2, 6).step(-3.5, 2).antColumn(0, 36.5, -4).run(36.5).platform(-36, 4, 33.5);
  L.put(
    'ladybot',
    -22.5,
    {
      specimen: true,
      hop: false,
      wake: 10,
      facing: -1,
      name: 'Opal Ladybot',
      signals: ['visual:opal-shimmer', 'audio:music-box'],
      seenFrom: 'the breadstick bridge above the gutter (x 546-579.5)',
    },
    1,
  );
  L.step(3, 10);
  
  L.run(6).step(1, 5).step(1, 5).step(-2, 12);
  at('aphid', 605.5, {}, 5.5);
  
  L.run(64);
  L.platform(-56, 7.5, 1.5, 'one-way').platform(-48.5, 9.5, 1.5, 'one-way').platform(-41, 11.5, 1.5, 'one-way');
  L.platform(-32.5, 11.5, 1.5, 'one-way').platform(-25, 13.5, 3, 'one-way');
  L.secret(
    'deed',
    -23.5,
    {
      name: "A giant's lost button",
      signals: ['visual:button-gleam', 'audio:button-clink'],
      seenFrom: 'the crumb scree top (x 603-608) and the breather floor',
    },
    13.5,
  );
  L.landmark('Vast cookie', -30, 'back');
  porter(670, -1);
  porter(676, -1);
  
  L.run(4).antColumn(0, 12, -4, { headline: 'M4' });
  crew('ladybot', 691);
  crew('pillbug', 694.5);
  crew('ladybot', 698, { phase: 1 });
  L.run(12).step(4.5, 10).step(-2, 8).step(-2.5, 12).beacon(-2);
  
  L.run(10).antColumn(0, 36).run(36).step(1.5, 4).gap(4).run(3);
  
  L.antColumn(0, 36).run(36).step(1.5, 6).gap(6.5);
  at('aphid', 826);
  
  L.antColumn(0, 44, 4, { headline: 'M5' });
  crew('ladybot', 843.5);
  crew('pillbug', 849.5);
  crew('ladybot', 855.5, { phase: 1 });
  crew('pillbug', 863.5);
  crew('ladybot', 869.5, { phase: 0.5 });
  L.run(44).step(1.5, 8).landmark('Grand Gate', -4);
  
  L.step(-1.5, 12).step(-1.5, 12).gap(3).step(-1.5, 12).run(8);
  L.antColumn(0, 60).run(60).run(36);
  L.put('antPorter', -30, { facing: 1 });
  L.put('antPorter', -24, { facing: 1 });
  L.put('finish', -8);
  L.landmark('Grand Anthill', -20, 'back');
  return L.build();
}
