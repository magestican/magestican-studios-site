










import { levelBuilder } from './dsl.js';

export const DRILL_GYM = {
  bore: { from: { x: 7, y: 2 }, x0: 10, x1: 40 },
  up: { from: { x: 52, y: 2 }, top: 7.5 },
  dig: { from: { x: 66, y: 24 }, bottom: 2 },
  reach: [
    { tag: 'R4', from: { x: 79, y: 6 }, h: 4 },
    { tag: 'R2', from: { x: 99, y: 4 }, h: 2 },
    { tag: 'R0', from: { x: 113, y: 2 }, h: 0 },
  ],
  chain: { from: { x: 131.5, y: 8 }, towers: ['C1', 'C2', 'C3'] },
  rock: { from: { x: 157, y: 2 }, x0: 160 },
};

export function buildDrillGym() {
  const L = levelBuilder({ id: 97, name: 'Drill gym', height: 40, pitCost: 'none' });
  L.wall(0, 200, 0, 2).wall(0, 1, 2, 40).wall(199, 200, 2, 40);
  L.spawnAt(3, 2);
  
  L.soil(10, 40, 2, 5.5);
  
  L.soil(46, 58, 3, 7.5);
  
  L.wall(62, 64, 2, 24).wall(68, 70, 2, 24).soil(64, 68, 2, 24);
  
  L.wall(74, 82, 2, 6).tower(81.5, 7, 6, { id: 'R4', lean: 1, foot: [81, 82, 6, 7] });
  L.wall(94, 102, 2, 4).tower(101.5, 5, 6, { id: 'R2', lean: 1, foot: [101, 102, 4, 5] });
  L.tower(115.5, 3, 6, { id: 'R0', lean: 1, foot: [115, 116, 2, 3] });
  
  L.wall(128, 134, 2, 8).wall(134, 138, 2, 6).wall(138, 142, 2, 4);
  L.tower(133.5, 9, 5, { id: 'C1', lean: 1, foot: [133, 134, 8, 9] });
  L.tower(136, 7, 5, { id: 'C2', lean: 1, foot: [135.5, 136.5, 6, 7] });
  L.tower(140, 5, 6, { id: 'C3', lean: 1, foot: [139.5, 140.5, 4, 5] });
  for (const x of [144.4, 145.1, 145.8]) L.putAt('pillbug', x, 2, { wake: 0.1, wakeY: 0.1 });
  
  L.wall(160, 164, 2, 4).soil(166, 170, 2, 4);
  L.putAt('finish', 196, 2, { name: 'gym end' });
  return L.build();
}
