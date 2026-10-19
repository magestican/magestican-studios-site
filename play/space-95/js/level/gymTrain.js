









import { levelBuilder } from './dsl.js';

export function buildTrainGym() {
  const G = levelBuilder({ id: 99, name: 'Train gym', mode: 'train', floor: { w: 100, h: 60 }, pitCost: 'heart' });
  G.rail('G', [40, 10], ['line', 90, 10, 12], ['line', 90, 50, 6], ['line', 10, 50, 12], ['line', 10, 10, 12], ['line', 40, 10], {
    exit: 'G:s0',
  });
  G.rail('G-alt', G.onRail('G', 8), ['line', 52, 14, 6], ['line', 68, 14, 6], ['line', ...G.onRail('G', 32)]);
  G.rail('G-out', G.onRail('G', 2), ['line', 46, 6, 8], ['line', 98, 6], { buffer: true });
  G.points('J1', { rail: 'G', s: 8, a: 'G', b: 'G-alt', set: 'a' });
  G.points('JX', { rail: 'G', s: 2, a: 'G', b: 'G-out', set: 'a' });
  G.trainAt('G', 0.5);
  G.station('GK1', 'G', 46);
  G.station('GK2', 'G', 140);
  G.debris('G-alt', 12, 14, { id: 'gym-fork', name: 'fork', rerail: 'G:s30' });
  G.pea('GP', { from: [50, 56], to: [50, 40], speed: 3, period: 3 });
  G.chevrons('G', 85, 100);
  for (const [i, s] of [60, 63, 66].entries())
    G.putAt('bandit', ...G.onRail('G', s), { rail: 'G', s, stance: 'stand', motif: 'cow-catcher', use: `G${i + 1}` });
  G.putAt('bandit', 6, 32, { stance: 'hopAt', motif: 'cow-catcher', use: 'G4' });
  G.putAt('windupKey', ...G.onRail('G', 20), { rail: 'G', s: 20 });
  G.putAt('hook', 46, 6.7, { id: 'LV1', lever: 'J1', name: 'gym lever' }); 
  G.putAt('cricket', 64, 2.5, {
    specimen: true,
    name: 'Gym cricket',
    scan: { maxSpeed: 4 },
    signals: ['audio:fiddle-tune', 'visual:gold-cap'],
  });
  G.putAt('ability', 40, 9.6, { grant: 'dash' });
  G.putAt('ability', 40.2, 9.6, { grant: 'tether' });
  const end = G.railLength('G-out') - 1;
  G.putAt('finish', ...G.onRail('G-out', end), { rail: 'G-out', s: end });
  return G.build();
}
