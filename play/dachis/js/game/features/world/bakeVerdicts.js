








export const LIVE = {
  lever: 'pulled by the player (kazan-galleries rail junctions, railRules leversOn)',
  valve: 'turned by the player (features/world/magma.js valveNear)',
  winch: 'cranked by the player (frostspine)',
  mirrorstand: 'turned by the player to aim the light (geode-galleries)',
  iceblock: 'pushed by the player (frost-glacier, frostspine)',
  cart: 'rides the rails (carts.js)',
  lampout: 'lit by the player in a dark map (darkness.js lairLamps, flags.lit)',
};
export const MASKED = {
  torch: 'fire: flames, glow and embers are particles (torches.js createTorchFire); the post is baked',
  spring: 'spring: water and steam are animated (spring.js createSpringWater); the basin is baked',
};

export const LIVE_WHERE = {
  lantern: { why: 'a dark map (W.dark) lights it when the kid walks by (darkness.js, flags.lit); elsewhere a still paper lantern', live: (W) => !!W.dark },
};
export const BAKED = new Set(['anvil', 'appletree', 'ashbowl', 'banana', 'basalt', 'basket', 'bed', 'blossom', 'bowl', 'bridge', 'bramble', 'broom',
  'bush', 'clapper', 'cookfire', 'coral', 'crag', 'crates', 'crystal', 'drift', 'feather', 'fence', 'fern', 'fir', 'fishrack', 'floodpost',
  'flower', 'forge', 'fruitfall', 'gate', 'hearth', 'hut', 'jetty', 'jtree', 'knothole', 'ladder', 'flow', 'vent', 'tubemouth', 'mango', 'moss', 'namestone',
  'obsidian', 'offering', 'palm', 'pillar', 'pots', 'prayerline', 'rail', 'redpool', 'rimstone', 'rock', 'ropeslide', 'sandbags', 'seat',
  'shears', 'spears', 'step', 'stilts', 'strawbed', 'stump', 'suncrack', 'sweepings', 'temple', 'tools', 'toys', 'tree', 'violets',
  'washline', 'well']);
export function verdictOf(kind, W) {
  if (LIVE[kind]) return { verdict: 'live', why: LIVE[kind] };
  if (MASKED[kind]) return { verdict: 'masked', why: MASKED[kind] };
  if (LIVE_WHERE[kind]) return { verdict: LIVE_WHERE[kind].live(W) ? 'live' : 'baked', why: LIVE_WHERE[kind].why };
  if (BAKED.has(kind)) return { verdict: 'baked', why: null };
  return { verdict: 'undecided', why: null };
}


export const liveObjects = (W, objects = W.objects) => objects.filter((o) => verdictOf(o.kind, W).verdict === 'live');
