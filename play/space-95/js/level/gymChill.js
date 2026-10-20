









import { levelBuilder } from './dsl.js';

export const CHILL_GYM = {
  pool: { from: { x: 27, y: 2 }, x0: 18, x1: 32, weevil: 'C1' },
  dive: { from: { x: 60, y: 2 }, band: [2, 12], fly: 'C2' },
  ladder: { from: { x: 76, y: 2 }, crew: ['C3a', 'C3b', 'C3c', 'C3d'] },
  thaw: { hot: 'C4hot', neutral: 'C4air', from: { x: 112, y: 2 } },
  freezer: { from: { x: 134, y: 2 }, button: 'C5btn', flies: ['C5a', 'C5b', 'C5c', 'C5d'] },
};

export function buildChillGym() {
  const L = levelBuilder({ id: 96, name: 'Chill gym', height: 40, pitCost: 'none' });
  L.wall(0, 180, 0, 2).wall(0, 1, 2, 40).wall(179, 180, 2, 40);
  L.spawnAt(3, 2);
  
  L.cold(18, 32, 2, 7, { source: 'peas' });
  L.putAt('weevil', 36, 2, { id: 'C1', patrol: [34, 38], charge: true, wake: 30 });
  
  L.cold(50, 70, 2, 12, { source: 'fridge' });
  L.putAt('wasp', 60, 16, { id: 'C2', skin: 'fizzfly', wake: 30, wakeY: 30 });
  
  L.wall(80, 82, 2, 8);
  L.cold(82, 95, 2, 12, { source: 'fridge' });
  for (const [i, id] of ['C3a', 'C3b', 'C3c', 'C3d'].entries()) L.putAt('weevil', 96 + i * 2.2, 2, { id, march: -1, wake: 40, wakeY: 40 });
  
  L.hob(110, 116, 2, { period: 4, on: 2, at: 0 });
  L.putAt('weevil', 113, 2, { id: 'C4hot', frozen: true, wake: 40 });
  L.putAt('weevil', 120, 2, { id: 'C4air', frozen: true, wake: 40 });
  
  L.wall(128, 129, 2, 30).wall(171, 172, 2, 30).wall(128, 172, 30, 31);
  L.putAt('freezeButton', 134, 2, {
    id: 'C5btn',
    zone: { x0: 129, x1: 171, y0: 2, y1: 30 },
    slots: [
      [138.75, 2],
      [140.25, 2],
      [140.25, 3.5],
      [141.75, 2],
    ],
  });
  for (const [i, id] of ['C5a', 'C5b', 'C5c', 'C5d'].entries())
    L.putAt('wasp', 146 + i * 4, 18, { id, skin: 'fizzfly', wake: 40, wakeY: 40, use: 'M5' });
  L.putAt('finish', 176, 2, { name: 'gym end' });
  return L.build();
}
