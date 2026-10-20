









import { levelBuilder } from './dsl.js';

export const WEB_STACK = { x0: 104, step: 8.5, base: 10, n: 4 };

export function buildWebGym() {
  const L = levelBuilder({ id: 98, name: 'Web gym', height: 60, pitCost: 'none' });
  L.wall(0, 150, 0, 2).wall(0, 1, 2, 60).wall(149, 150, 2, 60);
  L.spawnAt(2, 2);
  L.web(4, 10, 20, 10, { id: 'S1' });
  L.web(24, 10, 40, 10, { id: 'S2' }).ledge(40, 46, 18.5);
  L.web(50, 10, 58, 10 + 8 * Math.tan(Math.PI / 12), { id: 'S3a', slant: true });
  L.web(64, 10, 72, 10 + 8 * Math.tan(Math.PI / 6), { id: 'S3b', slant: true });
  L.harp({ id: 'GH', every: 1.6, amp: 1 });
  L.web(80, 10, 94, 10, { id: 'S4', harp: 'GH' }).ledge(94, 100, 19.5);
  const { x0, step, base, n } = WEB_STACK;
  for (let i = 0; i < n; i++)
    L.web(i % 2 ? x0 + 14 : x0, base + step * i, (i % 2 ? x0 + 14 : x0) + 14, base + step * i, { id: `S5-${i + 1}` });
  L.ledge(x0, x0 + 14, base + step * n);
  L.putAt('finish', 146, 2, { name: 'gym end' });
  return L.build();
}
