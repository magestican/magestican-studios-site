







import { levelBuilder } from './dsl.js';

export function buildPlaneGym() {
  const G = levelBuilder({ id: 98, name: 'Plane gym', mode: 'plane', camDist: 28, pitCost: 'heart', height: 68 });
  G.wall(0, 124, 0, 2); 
  G.wall(0, 1, 2, 68); 
  G.wall(123, 124, 2, 68); 
  G.spawnAt(4, 2);
  G.beaconAt(10, 30);
  G.beaconAt(50, 30);
  G.beaconAt(85, 30);
  G.putAt('ace', 20, 29.7, { perch: true, wakeWhen: { x: 26 }, chase: true, motif: 'wingman', use: 'G1' });
  G.putAt('ace', 70, 26.2, {
    perch: true,
    wakeWhen: { x: 40 },
    chase: true,
    headOn: { y: 28.5, from: 75, to: 20 },
    motif: 'wingman',
    use: 'G2',
  });
  G.putAt('ace', 72, 29.2, {
    perch: true,
    wakeWhen: { x: 40 },
    chase: true,
    headOn: { y: 31.5, from: 77, to: 20 },
    motif: 'wingman',
    use: 'G2',
  });
  for (const [i, y] of [22, 23.5, 25, 26.5, 28, 29.5].entries())
    G.putAt('wasp', 95, y, { id: `gym-cadet-${i + 1}`, motif: 'wingman', use: 'G3' });
  G.fluff(30, 36, 40, 50);
  G.soft(104, 112, 36, 46, { skin: 'cloth' });
  G.putAt('intel', 108, 41, { secret: 'cache', name: 'gym paper plane', signals: ['visual:sheet-shadow', 'audio:paper-flutter'] });
  G.updraft(40, 48, 2, 40, { lift: 5 });
  G.gust(50, 90, 44, 52, { vx: 3 });
  return G.build();
}
