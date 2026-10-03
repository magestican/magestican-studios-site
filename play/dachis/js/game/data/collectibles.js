








import { HOME } from '../features/world/regions.js';
const TUBE = 'ember-tube'; 
import { fromUV } from '../features/world/sections.js';

export const KINDS = {
  relic: { name: 'Relics', one: 'Relic', per: 5 },
  shell: { name: 'Echo Shells', one: 'Echo Shell', per: 3 },
  hat: { name: 'Hats', one: 'Hat', per: 4 },
  stone: { name: 'Memory Stones', one: 'Memory Stone', per: 3 },
};
export const PER_REGION = 15;



const spot = (sec, u, v, map) => ({ spot: map ? { sec, uv: [u, v], map } : { sec, uv: [u, v] } });
const SHRINE_V = 'shrine-village', COAST = 'tomo-coast', SHELL = 'shellhaven', MAZE = 'kelp-maze', TEMPLE = 'drowned-temple', HOLLOW = 'hollowroot', THORN = 'thornfield', MOTHER = 'mother-hollow'; 
export const COLLECTIBLES = [
  
  { id: 'c1', region: HOME, kind: 'relic', name: 'Spiral Shard', from: { quest: 'spiral-watch' },
    text: 'A splinter of black glass from the first spiral. It stays cold in the sun, and the Elder\'s machine arm hums when it is near.' },
  { id: 'c2', region: HOME, kind: 'relic', name: 'Cracked Bell of Kazan', from: spot('jungle', 3.5, 66.5),
    text: 'The bell that rang when the first spiral opened, long before the Elder\'s arm was steel. Its clapper is missing.' },
  { id: 'c3', region: HOME, kind: 'relic', name: 'Old Ferry Token', from: spot('road', -4.9, 73.5),
    text: 'A brass token stamped with a boat. A ferry once ran between the islands, back when every shore was friendly.' },
  { id: 'c4', region: HOME, kind: 'relic', name: 'Prayer Strip', from: spot('shrine-village', -2.8, 45.0, SHRINE_V),
    text: 'Paper with a red band, like the priests\' hats. The prayer asks Tomo to keep the doors between worlds open for friends.' },
  { id: 'c5', region: HOME, kind: 'relic', name: 'Tide-Worn Mask', from: spot('tomo-coast', 1.2, 37.0, COAST),
    text: 'A carved dachi mask the sea gave back. The first Tamers wore masks like it, the stories say, to look like the friends they met.' },
  { id: 'c6', region: HOME, kind: 'shell', name: 'Kazan Lullaby', cue: 'town', from: { quest: 'forgotten-friends' },
    text: 'Hold it to your ear: the village song, hummed by a hundred dachis around the crater fire.' },
  { id: 'c7', region: HOME, kind: 'shell', name: 'Radio Static, 1992', cue: 'intro-alley', from: spot('road', 1.4, 79.9),
    text: 'A shell that plays a radio station from home. A DJ is talking about the weather in Brooklyn.' },
  { id: 'c8', region: HOME, kind: 'shell', name: 'Surf Breaks', cue: 'field', from: spot('tomo-coast', 3.4, 47.0, COAST),
    text: 'The waves of Tomo Coast, slowed down until they sound like a drum loop.' },
  { id: 'c9', region: HOME, kind: 'hat', name: 'Bandage Bandana', geo: 'bandana', from: { quest: 'paw-tonic' },
    text: 'A clean bandage tied as a bandana. For dachis who got hurt and got back up.' },
  { id: 'c10', region: HOME, kind: 'hat', name: 'Ember Cap', geo: 'ember', from: spot('jungle', 1.4, 62.9),
    text: 'A little cap of cooled lava rock from Mt. Kazan, still warm inside.' },
  { id: 'c11', region: HOME, kind: 'hat', name: 'Mini Priest Hat', geo: 'priest', from: spot('shrine-village', 5.2, 33.6, SHRINE_V),
    text: 'A tiny white hat with a red band. The priests pretend not to notice who wears it.' },
  { id: 'c12', region: HOME, kind: 'hat', name: 'Backwards Cap', geo: 'backcap', from: spot('road', -5.7, 82.7),
    text: 'Like yours, worn backwards. Any dachi will think it is the coolest thing in the world.' },
  { id: 'c13', region: HOME, kind: 'stone', name: 'Ashlo\'s First Ember', from: { boss: 'ashlo' },
    text: 'A memory: a grey wolf pup curled by a village hearth, keeping the fire alive for everyone through the long rain.' },
  { id: 'c14', region: HOME, kind: 'stone', name: 'The Lantern Keeper', from: spot('shrine-village', 3.0, 49.2, SHRINE_V),
    text: 'A memory: Ashlo, before the red fractures, guarding the Shrine Village lanterns through a storm.' },
  { id: 'c15', region: HOME, kind: 'stone', name: 'The Smouldering Night', from: spot('jungle', 4.9, 60.8),
    text: 'A memory: the night the red hand touched Ashlo. The fire in its ribs turned from orange to red, and it stopped coming down to the village.' },
  
  { id: 'c16', region: TUBE, kind: 'relic', name: 'Obsidian Lantern', from: spot('ember-a', -12.7, 38.9),
    text: 'Black glass around a flame that never went out. The first keepers carried fire up to the shrine in it.' },
  { id: 'c17', region: TUBE, kind: 'relic', name: 'Kumabo\'s Brass Gear', from: { quest: 'kumabo-gear' },
    text: 'A gear from Kumabo\'s arm, still warm from an Ember dachi\'s belly. It ticks when you are brave.' },
  { id: 'c18', region: TUBE, kind: 'relic', name: 'Tube Painting', from: spot('ember-b', 13.4, 65.1),
    text: 'A rubbing of a wall painting: a human and a dachi holding hands under a spiral. Nobody remembers who painted it.' },
  { id: 'c19', region: TUBE, kind: 'relic', name: 'First Tamer\'s Torch', from: spot('ember-a', 9.2, 50.9),
    text: 'A torch handle wrapped in leather, carved with a name worn too smooth to read. The first Tamer came this way.' },
  { id: 'c20', region: TUBE, kind: 'relic', name: 'Bell Clapper', from: spot('ember-b', -4.2, 77.1),
    text: 'The missing clapper of the Cracked Bell of Kazan. Someone hid it down here, so the bell could never ring again.' },
  { id: 'c21', region: TUBE, kind: 'shell', name: 'Lava Drip Beat', cue: 'battle', from: spot('ember-b', 3.5, 76.4),
    text: 'Drips of cooling lava, ticking like a drum machine. Turn it up.' },
  { id: 'c22', region: TUBE, kind: 'shell', name: 'Cave Echo', cue: 'intro-spiral', from: spot('ember-a', 6.4, 36.8),
    text: 'Your own voice, bounced around the tube until it sounds like somebody else calling you.' },
  { id: 'c23', region: TUBE, kind: 'shell', name: 'Hatchling Hum', cue: 'intro-wonder', from: { quest: 'lost-hatchling' },
    text: 'The silly tune a lost hatchling hummed all the way home.' },
  { id: 'c24', region: TUBE, kind: 'hat', name: 'Keeper\'s Lamp Helmet', geo: 'helmet', from: { quest: 'lantern-oil' },
    text: 'A little helmet with a lamp on the front. The last lantern keeper wore it in the tube.' },
  { id: 'c25', region: TUBE, kind: 'hat', name: 'Crater Goggles', geo: 'goggles', from: spot('ember-b', -5.7, 62.9),
    text: 'Smoked-glass goggles for staring at lava. Very serious. Very cool.' },
  { id: 'c26', region: TUBE, kind: 'hat', name: 'Obsidian Horns', geo: 'horns', from: spot('ember-a', -6.4, 41),
    text: 'Two little horns of black glass on a band. Gentle dachis wear them to look tough.' },
  { id: 'c27', region: TUBE, kind: 'hat', name: 'Ash Beanie', geo: 'beanie', from: spot('ember-b', -14.8, 75),
    text: 'A knitted beanie, grey as ash, with a pompom. Warm even in a volcano.' },
  { id: 'c28', region: TUBE, kind: 'stone', name: 'The Warm Den', from: spot('ember-a', -8.5, 50.2),
    text: 'A memory: Ashlo as a pup, born here in the tube, sleeping in a ring of warm stones with its brothers and sisters.' },
  { id: 'c29', region: TUBE, kind: 'stone', name: 'The Hidden Clapper', from: spot('ember-b', -11.3, 65.8),
    text: 'A memory: Ashlo, eyes already red at the edges, carrying the bell\'s clapper down into the dark so no warning would ever ring.' },
  { id: 'c30', region: TUBE, kind: 'stone', name: 'Ember and Ash', from: spot('ember-a', -3.5, 52.3),
    text: 'A memory: Ashlo licking the burned paw of a village child, long ago, whispering that fire is for keeping people warm.' },
  
  
  { id: 'c31', region: SHELL, kind: 'relic', name: 'Pearl Doorknob', from: spot('shellhaven', -8.0, 38.6),
    text: 'A doorknob of pearl from a house in the drowned city. The door it opened is long gone; the knob still turns.' },
  { id: 'c32', region: SHELL, kind: 'relic', name: 'Frozen Bubble', from: { quest: 'bubble-mend' },
    text: 'A bubble a Frost dachi breathed on until it froze solid. Inside it, a little of Shellhaven\'s air, forever.' },
  { id: 'c33', region: SHELL, kind: 'relic', name: 'Drowned Coin', from: spot('kelp-maze', -6.65, 49.55, MAZE), 
    text: 'A coin from the city\'s market, green with the sea. One side shows a whale; the other side has worn away. A fish folk child chased it into the kelp.' },
  { id: 'c34', region: SHELL, kind: 'relic', name: 'Harbour Bell', from: spot('shellhaven', 11.0, 40.2),
    text: 'A small brass bell that once hung on the harbour wall. It rang when the boats came home.' },
  { id: 'c35', region: SHELL, kind: 'relic', name: 'Mosaic Tile', from: spot('coral', 13.0, 99.0, HOME),
    text: 'A blue tile from the temple floor, painted with a child riding a whale. Someone polished it, a long time after the flood.' },
  { id: 'c36', region: SHELL, kind: 'shell', name: 'Bubble Song', cue: 'town', from: spot('shellhaven', -5.0, 50.0),
    text: 'The hum of the bubble\'s skin, the clam breathing, fish folk laughing. Home, under the sea.' },
  { id: 'c37', region: SHELL, kind: 'shell', name: 'Drowned Choir', cue: 'cave', from: { quest: 'city-song' },
    text: 'The drowned temple singing to itself as the tide moves through it. It sounds like people who are not there.' },
  { id: 'c38', region: SHELL, kind: 'shell', name: 'Leviathrum\'s Lament', cue: 'boss', from: { boss: 'leviathrum' },
    text: 'The great guardian\'s call, the one he sent out every night for a hundred years. Somebody finally heard it.' },
  { id: 'c39', region: SHELL, kind: 'hat', name: 'Kelp Beanie', geo: 'kelp', from: spot('shellhaven', 8.0, 34.2),
    text: 'A beanie knitted from dried kelp. It smells like the sea and it is a little bit crunchy.' },
  { id: 'c40', region: SHELL, kind: 'hat', name: 'Conch Helmet', geo: 'conch', from: { quest: 'clam-pearl' },
    text: 'Half a conch shell, worn as a helmet. The giant clam spat it out to say thank you.' },
  { id: 'c41', region: SHELL, kind: 'hat', name: 'Diving Goggles', geo: 'goggles', from: spot('shellhaven', -11.0, 39.4),
    text: 'Round brass diving goggles from the drowned city. Through them the whole world looks like an aquarium.' },
  { id: 'c42', region: SHELL, kind: 'hat', name: 'Coral Horns', geo: 'coral', from: spot('coral', 14.0, 95.6, HOME),
    text: 'Two little branches of pink coral on a band. Fish folk children wear them to play Leviathrum.' },
  { id: 'c43', region: SHELL, kind: 'stone', name: 'The Last Boat', from: spot('temple-nave', -6.0, 56.0, TEMPLE),
    text: 'A memory: the last boat leaving the city as the water rose, and Leviathrum promising the crying children he would keep their homes until they came back.' },
  { id: 'c44', region: SHELL, kind: 'stone', name: 'A Hundred Tides', from: spot('temple-porch', -7.0, 36.0, TEMPLE),
    text: 'A memory: Leviathrum sweeping the empty streets every morning for a hundred years, so they would be clean when his people returned.' },
  { id: 'c45', region: SHELL, kind: 'stone', name: 'The Red Tide', from: spot('coral', 12.2, 94.0, HOME),
    text: 'A memory: a red hand reaching down through the water and whispering that no one was coming back. Leviathrum believed it.' },
  
  
  
  { id: 'c46', region: HOLLOW, kind: 'relic', name: 'Bramble\'s Shears', from: spot('thorn-upper', -14.0, 36.6, THORN), 
    text: 'Old garden shears, the handles worn smooth by one paw over hundreds of years. Mother Bramble never let anyone else touch them.' },
  { id: 'c47', region: HOLLOW, kind: 'relic', name: 'Seed Label', from: spot('tree-vault', -3.4, 40.2, MOTHER),
    text: 'A sliver of bark with a word scratched in it: "Patience". Every seedling in the vault has one. This one fell off.' },
  { id: 'c48', region: HOLLOW, kind: 'relic', name: 'Firefly Jar', from: { quest: 'firefly-home' },
    text: 'A jar with one firefly in it that chose you. The lid is never closed. It just stays.' },
  { id: 'c49', region: HOLLOW, kind: 'relic', name: 'Rope Slide Handle', from: spot('hollowroot', 11.4, 28.6, HOLLOW),
    text: 'A wooden handle from the first rope slide, worn into the shape of a lot of small paws holding on very tight.' },
  { id: 'c50', region: HOLLOW, kind: 'relic', name: 'Acorn Cup', from: { quest: 'leaf-bed' },
    text: 'A cup carved from one enormous acorn. The tree folk drink rain from them. It is, they insist, the best cup in the Wilds.' },
  { id: 'c51', region: HOLLOW, kind: 'shell', name: 'Treetop Wind', cue: 'town', from: spot('hollowroot', -12.8, 32.6, HOLLOW),
    text: 'Wind through ten thousand leaves, a rope creaking, someone laughing on a far platform. Hollowroot, at the top of the world.' },
  { id: 'c52', region: HOLLOW, kind: 'shell', name: 'Heartwood Hum', cue: 'cave', from: spot('tree-heart', -5.0, 55.6, MOTHER),
    text: 'The sound inside the Mother Tree: sap moving slowly, wood creaking like breathing, and under it a hum that might be a song.' },
  { id: 'c53', region: HOLLOW, kind: 'shell', name: 'Bramble\'s Lament', cue: 'boss', from: { boss: 'bramble' },
    text: 'The great gardener\'s cry as the red left her: not anger at all, in the end. A sound like someone who has lost a garden.' },
  { id: 'c54', region: HOLLOW, kind: 'hat', name: 'Acorn Helmet', geo: 'helmet', from: { quest: 'old-shears' },
    text: 'Half an acorn shell with a strap. Every gardener in Hollowroot wears one. Now you are a gardener, apparently.' },
  { id: 'c55', region: HOLLOW, kind: 'hat', name: 'Moss Beanie', geo: 'beanie', from: spot('thorn-lower', 12.0, 74.0, THORN),
    text: 'A beanie of living moss. It is a little damp. It is also growing, very slowly.' },
  { id: 'c56', region: HOLLOW, kind: 'hat', name: 'Twig Antlers', geo: 'horns', from: spot('tree-roots', -1.6, 65.0, MOTHER),
    text: 'Two twigs on a band, shaped like Mother Bramble\'s antlers. The tree folk children wear them to play gardener.' },
  { id: 'c57', region: HOLLOW, kind: 'hat', name: 'Bark Goggles', geo: 'goggles', from: spot('hollowroot', -5.2, 31.6, HOLLOW),
    text: 'Goggles with lenses of clear amber, for looking at the sun through the leaves without blinking.' },
  { id: 'c58', region: HOLLOW, kind: 'stone', name: 'The First Seed', from: spot('tree-roots', 2.6, 65.4, MOTHER),
    text: 'A memory: a young Bramble, antlers still bare, pressing one seed into the bare earth of an empty hill and singing to it every day for a year.' },
  { id: 'c59', region: HOLLOW, kind: 'stone', name: 'Songs for Seedlings', from: spot('thorn-upper', 13.0, 47.0, THORN),
    text: 'A memory: Bramble walking her garden rows at dusk, humming a different tune to every bed, because each kind of seedling liked its own song.' },
  { id: 'c60', region: HOLLOW, kind: 'stone', name: 'The Red Wind', from: spot('thorn-lower', -12.0, 60.0, THORN),
    text: 'A memory: a red wind coming down a spiral, and a voice in it telling Bramble that her garden would be bigger, so much bigger, if only she let the old world rot.' },
];
export const collectibleById = (id) => COLLECTIBLES.find((c) => c.id === id) || null;
export const found = (flags, id) => !!(flags && flags.found && flags.found[id]);


export function collectibleSpots(region) {
  return COLLECTIBLES.filter((c) => c.from.spot && (c.from.spot.map || c.region) === region).map((c) => {
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


export const hatGeoOf = (id) => { const c = id && collectibleById(id); return c && c.kind === 'hat' ? c.geo : null; };
export const foundHats = (flags) => COLLECTIBLES.filter((c) => c.kind === 'hat' && found(flags, c.id));

export function whereToLook(c) {
  const f = c.from;
  if (f.quest) return 'Someone in need will thank you with it.';
  if (f.boss) return 'It sleeps inside a corrupted guardian.';
  return { jungle: 'Somewhere under the jungle leaves.', road: 'Somewhere along the old road.', coast: 'Somewhere the tide reaches.',
    shrine: 'Somewhere among the shrine lanterns.', 'tomo-coast': 'Somewhere the tide reaches.', shellhaven: 'Somewhere inside the bubble.', coral: 'Somewhere among the drowned ruins.', 'kelp-maze': 'Somewhere deep in the Kelp Maze.', 'temple-porch': 'Somewhere inside the drowned temple.', 'temple-nave': 'Somewhere inside the drowned temple.', hollowroot: 'Somewhere up in the treetops.', 'thorn-upper': 'Somewhere in the old garden.', 'thorn-lower': 'Somewhere in the wild meadow.', 'tree-vault': 'Somewhere inside the Mother Tree.', 'tree-heart': 'Somewhere inside the Mother Tree.', 'tree-roots': 'Somewhere among the Mother Tree\'s roots.', 'shrine-village': 'Somewhere among the shrine lanterns.', slope: 'Somewhere on the volcano slope.', kazan: 'Somewhere in the village.',
    'ember-a': 'Somewhere in the glow of the Ember Tube.', 'ember-b': 'Somewhere between the lava pools.' }[f.spot.sec]
    || 'Somewhere off the beaten path.';
}

export function tally(flags, region = null) {
  const out = {};
  for (const k of Object.keys(KINDS)) out[k] = { found: 0, total: 0 };
  for (const c of COLLECTIBLES) {
    if (region && c.region !== region) continue;
    out[c.kind].total++; if (found(flags, c.id)) out[c.kind].found++;
  }
  return out;
}
