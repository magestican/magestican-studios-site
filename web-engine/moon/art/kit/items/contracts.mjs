




import * as item from '../../item.mjs';
import { contractTests } from '../contract.mjs';

const band = (x0, x1, y0, y1, z0, z1) => ({ x: [x0, x1], y: [y0, y1], z: [z0, z1] });



export const SIZE = Object.freeze({
  seed: band(0.05, 0.1, 0.04, 0.11, 0.05, 0.1), 
  sapling: band(0.12, 0.26, 0.35, 0.5, 0.1, 0.26), 
  apple: band(0.06, 0.1, 0.06, 0.11, 0.06, 0.1), 
  peach: band(0.065, 0.1, 0.065, 0.125, 0.065, 0.1),
  cherry: band(0.04, 0.075, 0.06, 0.1, 0.035, 0.07), 
  goldenApple: band(0.06, 0.1, 0.06, 0.11, 0.06, 0.1),
  juice: band(0.045, 0.11, 0.1, 0.19, 0.045, 0.09),
  jam: band(0.055, 0.1, 0.07, 0.12, 0.055, 0.1), 
  sugar: band(0.06, 0.11, 0.085, 0.155, 0.045, 0.11),
  coin: band(0.04, 0.08, 0.006, 0.035, 0.04, 0.06),
  giftBox: band(0.13, 0.24, 0.1, 0.2, 0.13, 0.2), 
  moonRock: band(0.07, 0.12, 0.04, 0.1, 0.07, 0.12),
  gem: band(0.035, 0.07, 0.02, 0.07, 0.018, 0.055),
  
  
  shovel: band(0.48, 0.66, 0.025, 0.05, 0.11, 0.19), 
  axe: band(0.29, 0.46, 0.03, 0.05, 0.13, 0.2), 
  pickaxe: band(0.29, 0.46, 0.03, 0.05, 0.2, 0.37), 
  wateringCan: band(0.29, 0.41, 0.22, 0.28, 0.12, 0.2), 
  wood: band(0.16, 0.27, 0.07, 0.13, 0.13, 0.23), 
  stone: band(0.1, 0.17, 0.035, 0.11, 0.08, 0.15),
  mushroom: band(0.05, 0.1, 0.045, 0.1, 0.05, 0.08),
  berries: band(0.05, 0.14, 0.02, 0.05, 0.04, 0.1),
  carrot: band(0.11, 0.2, 0.05, 0.12, 0.03, 0.12), 
  potato: band(0.06, 0.13, 0.04, 0.085, 0.055, 0.09),
});

export function itemContracts(kinds) {
  for (const kind of kinds) {
    for (const variant of item.VARIANTS[kind]) {
      const adapter = { TIER: item.TIER, generate: (o) => item.generate({ ...o, kind, variant }) };
      contractTests(adapter, {
        name: `item ${kind}${variant ? `/${variant}` : ''}`,
        size: SIZE[kind], minY: -1e-9, maxMinY: 1e-9,
        seasonal: item.SEASONAL.includes(kind),
      });
    }
  }
}
