



















export const HEFT_OF_KIND = Object.freeze({
  seed: 0.02, 
  fruit: 0.12,
  food: 0.14,
  jam: 0.4, 
  drink: 0.46, 
  staple: 0.55, 
  rare: 0.3, 
  resource: 0.9, 
});


export const HEFT_OF_GOOD = Object.freeze({
  gem: 0.08, 
  truffle: 0.1, 
  goldenApple: 0.2, 
  moonRock: 0.75, 
  stone: 1, 
  wood: 0.8,
});


export const HEFT_DEFAULT = 0.25;







export function heftOf(good, goods = null) {
  if (typeof good !== 'string' || good === '') return HEFT_DEFAULT;
  if (Object.hasOwn(HEFT_OF_GOOD, good)) return HEFT_OF_GOOD[good];
  const kind = goods && goods[good] ? goods[good].kind : null;
  if (kind && Object.hasOwn(HEFT_OF_KIND, kind)) return HEFT_OF_KIND[kind];
  return HEFT_DEFAULT;
}
