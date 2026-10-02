








import { HOME } from '../features/world/regions.js';
import { fromUV } from '../features/world/sections.js';

export const KINDS = {
  relic: { name: 'Relics', one: 'Relic', per: 5 },
  shell: { name: 'Echo Shells', one: 'Echo Shell', per: 3 },
  hat: { name: 'Hats', one: 'Hat', per: 4 },
  stone: { name: 'Memory Stones', one: 'Memory Stone', per: 3 },
};
export const PER_REGION = 15;

const spot = (sec, u, v) => ({ spot: { sec, uv: [u, v] } });
export const COLLECTIBLES = [
  
  { id: 'c1', region: HOME, kind: 'relic', name: 'Spiral Shard', from: { quest: 'spiral-watch' },
    text: 'A splinter of black glass from the first spiral. It stays cold in the sun, and the Elder\'s machine arm hums when it is near.' },
  { id: 'c2', region: HOME, kind: 'relic', name: 'Cracked Bell of Kazan', from: spot('jungle', 3.5, 66.5),
    text: 'The bell that rang when the first spiral opened, long before the Elder\'s arm was steel. Its clapper is missing.' },
  { id: 'c3', region: HOME, kind: 'relic', name: 'Old Ferry Token', from: spot('road', -4.9, 73.5),
    text: 'A brass token stamped with a boat. A ferry once ran between the islands, back when every shore was friendly.' },
  { id: 'c4', region: HOME, kind: 'relic', name: 'Prayer Strip', from: spot('shrine', 4.2, 91.2),
    text: 'Paper with a red band, like the priests\' hats. The prayer asks Tomo to keep the doors between worlds open for friends.' },
  { id: 'c5', region: HOME, kind: 'relic', name: 'Tide-Worn Mask', from: spot('coast', 14.1, 75.7),
    text: 'A carved dachi mask the sea gave back. The first Tamers wore masks like it, the stories say, to look like the friends they met.' },
  { id: 'c6', region: HOME, kind: 'shell', name: 'Kazan Lullaby', from: { quest: 'forgotten-friends' },
    text: 'Hold it to your ear: the village song, hummed by a hundred dachis around the crater fire.' },
  { id: 'c7', region: HOME, kind: 'shell', name: 'Radio Static, 1992', from: spot('road', 1.4, 79.9),
    text: 'A shell that plays a radio station from home. A DJ is talking about the weather in Brooklyn.' },
  { id: 'c8', region: HOME, kind: 'shell', name: 'Surf Breaks', from: spot('coast', 12.7, 81.3),
    text: 'The waves of Tomo Coast, slowed down until they sound like a drum loop.' },
  { id: 'c9', region: HOME, kind: 'hat', name: 'Bandage Bandana', from: { quest: 'paw-tonic' },
    text: 'A clean bandage tied as a bandana. For dachis who got hurt and got back up.' },
  { id: 'c10', region: HOME, kind: 'hat', name: 'Ember Cap', from: spot('jungle', 1.4, 62.9),
    text: 'A little cap of cooled lava rock from Mt. Kazan, still warm inside.' },
  { id: 'c11', region: HOME, kind: 'hat', name: 'Mini Priest Hat', from: spot('shrine', 3.5, 97.6),
    text: 'A tiny white hat with a red band. The priests pretend not to notice who wears it.' },
  { id: 'c12', region: HOME, kind: 'hat', name: 'Backwards Cap', from: spot('road', -5.7, 82.7),
    text: 'Like yours, worn backwards. Any dachi will think it is the coolest thing in the world.' },
  { id: 'c13', region: HOME, kind: 'stone', name: 'Ashlo\'s First Ember', from: { boss: 'ashlo' },
    text: 'A memory: a grey wolf pup curled by a village hearth, keeping the fire alive for everyone through the long rain.' },
  { id: 'c14', region: HOME, kind: 'stone', name: 'The Lantern Keeper', from: spot('shrine', -4.9, 90.5),
    text: 'A memory: Ashlo, before the red fractures, guarding the Shrine Village lanterns through a storm.' },
  { id: 'c15', region: HOME, kind: 'stone', name: 'The Smouldering Night', from: spot('jungle', 4.9, 60.8),
    text: 'A memory: the night the red hand touched Ashlo. The fire in its ribs turned from orange to red, and it stopped coming down to the village.' },
];
export const collectibleById = (id) => COLLECTIBLES.find((c) => c.id === id) || null;
export const found = (flags, id) => !!(flags && flags.found && flags.found[id]);


export function collectibleSpots(region) {
  return COLLECTIBLES.filter((c) => c.region === region && c.from.spot).map((c) => {
    const [x, y] = fromUV(...c.from.spot.uv);
    return { id: c.id, sec: c.from.spot.sec, x, y };
  });
}

export function collectibleAt(flags, region, x, y, r = 0.6) {
  return collectibleSpots(region).find((s) => !found(flags, s.id) && Math.hypot(s.x - x, s.y - y) < r) || null;
}

export function collect(flags, id) {
  const c = collectibleById(id);
  if (!c || found(flags, id)) return null;
  (flags.found || (flags.found = {}))[id] = 1;
  return c;
}

export const bossCollectibles = (flags, boss) => COLLECTIBLES.filter((c) => c.from.boss === boss && !found(flags, c.id));

export function tally(flags, region = null) {
  const out = {};
  for (const k of Object.keys(KINDS)) out[k] = { found: 0, total: 0 };
  for (const c of COLLECTIBLES) {
    if (region && c.region !== region) continue;
    out[c.kind].total++; if (found(flags, c.id)) out[c.kind].found++;
  }
  return out;
}
