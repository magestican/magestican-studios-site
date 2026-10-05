








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
const FROST = 'frostspine', GLACIER = 'frost-glacier', SUMMIT = 'frost-summit'; 
const HEART = 'kazan-heart', GALL = 'kazan-galleries', PYRE = 'kazan-pyre'; 
const MINE = 'minehead', SHAFT = 'lantern-shaft', SEAM = 'deep-seam', ECHO = 'echo-lake'; 
const VINE = 'vinegate', CANOPY = 'canopy-walk', FIG = 'fig-terraces', RUIN = 'ruin-steps', COURT = 'obsidian-court'; 
const SHRINE_V = 'shrine-village', COAST = 'tomo-coast', SHELL = 'shellhaven', MAZE = 'kelp-maze', TEMPLE = 'drowned-temple', HOLLOW = 'hollowroot', THORN = 'thornfield', MOTHER = 'mother-hollow'; 
export const COLLECTIBLES = [
  
  { id: 'c1', region: HOME, kind: 'relic', name: 'Spiral Shard', from: { quest: 'spiral-watch' },
    text: 'A splinter of black glass from the first spiral. It stays cold in the sun, and the Elder\'s machine arm hums when it is near.' },
  { id: 'c2', region: HOME, kind: 'relic', name: 'Cracked Bell of Kazan', from: spot('jungle', 3.5, 66.5),
    text: 'The bell that rang when the first spiral opened, long before the Elder\'s arm was steel. Its clapper is missing.' },
  { id: 'c3', region: HOME, kind: 'relic', name: 'Old Ferry Token', from: spot('road', -4.9, 73.5),
    text: 'A brass token stamped with a boat. It is the same size as a subway token, nearly to the hair, and just as heavy.' },
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
    text: 'A memory: Ashlo alone by a cold hearth after the long rain, and a red hand in the smoke, saying: they never thanked you, did they? The fire in his ribs turned red, and he stopped coming down to the village.' },
  
  { id: 'c16', region: TUBE, kind: 'relic', name: 'Obsidian Lantern', from: spot('ember-a', -12.7, 38.9),
    text: 'Black glass around a flame that never went out. The first keepers carried fire up to the shrine in it.' },
  { id: 'c17', region: TUBE, kind: 'relic', name: 'Kumabo\'s Brass Gear', from: { quest: 'kumabo-gear' },
    text: 'A gear from Kumabo\'s arm, still warm from an Ember dachi\'s belly. It ticks when you hold it, a little faster than a watch.' },
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
    text: 'A memory: Ashlo, eyes already red at the edges, carrying the bell\'s clapper down into the dark so no warning would ever ring. Halfway, he stops and almost turns back.' },
  { id: 'c30', region: TUBE, kind: 'stone', name: 'Ember and Ash', from: spot('ember-a', -3.5, 52.3),
    text: 'A memory: Ashlo licking the burned paw of a village child, long ago, whispering that fire is for keeping people warm.' },
  
  
  { id: 'c31', region: SHELL, kind: 'relic', name: 'Pearl Doorknob', from: spot('shellhaven', -8.0, 38.6),
    text: 'A doorknob of pearl from a house in the drowned city. The door it opened is long gone; the knob still turns.' },
  { id: 'c32', region: SHELL, kind: 'relic', name: 'Frozen Bubble', from: { quest: 'bubble-mend' },
    text: 'A bubble a Frost dachi breathed on until it froze solid. Inside it, a little of Shellhaven\'s air. It smells of salt and wet rope.' },
  { id: 'c33', region: SHELL, kind: 'relic', name: 'Drowned Coin', from: spot('kelp-maze', -6.65, 49.55, MAZE), 
    text: 'A coin from the city\'s market, green with the sea. One side shows a whale; the other side has worn away. A fish folk child chased it into the kelp.' },
  { id: 'c34', region: SHELL, kind: 'relic', name: 'Harbour Bell', from: spot('shellhaven', 11.0, 40.2),
    text: 'A small brass bell that once hung on the harbour wall. It rang when the boats came home.' },
  { id: 'c35', region: SHELL, kind: 'relic', name: 'Mosaic Tile', from: spot('coral', 13.0, 99.0, HOME),
    text: 'A blue tile from the temple floor, painted with a child riding a whale. Someone polished it, a long time after the flood.' },
  { id: 'c36', region: SHELL, kind: 'shell', name: 'Bubble Song', cue: 'town', from: spot('shellhaven', -5.0, 50.0),
    text: 'The hum of the bubble\'s skin, the clam breathing, two fish folk arguing about whose turn it is to feed the clam.' },
  { id: 'c37', region: SHELL, kind: 'shell', name: 'Drowned Choir', cue: 'cave', from: { quest: 'city-song' },
    text: 'The drowned temple as the tide goes through it: three notes, the same three, over and over.' },
  { id: 'c38', region: SHELL, kind: 'shell', name: 'Leviathrum\'s Lament', cue: 'boss', from: { boss: 'leviathrum' },
    text: 'The great guardian\'s call, the one he sent out every night for a hundred years. Under it, very faint, he is counting streets.' },
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
    text: 'Wind through ten thousand leaves, a rope creaking, someone on a far platform losing a bet about a fig.' },
  { id: 'c52', region: HOLLOW, kind: 'shell', name: 'Heartwood Hum', cue: 'cave', from: spot('tree-heart', -5.0, 55.6, MOTHER),
    text: 'The sound inside the Mother Tree: sap moving slowly, wood creaking, and every so often a long slow knock, like a pipe in a building at night.' },
  { id: 'c53', region: HOLLOW, kind: 'shell', name: 'Bramble\'s Lament', cue: 'boss', from: { boss: 'bramble' },
    text: 'The great gardener\'s cry as the red left her: it starts as a howl and ends as somebody saying the names of flowers.' },
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
  
  
  
  { id: 'c61', region: VINE, kind: 'relic', name: 'Old Fishing Float', from: spot('ruin-steps', -8.0, 51.2, RUIN), 
    text: 'A painted gourd float that drifted all the way down from the temple steps. Whoever fished here last fished a very long time ago.' },
  { id: 'c62', region: VINE, kind: 'relic', name: 'Bridge Knot', from: spot('canopy-walk', 9.4, 45.4, CANOPY),
    text: 'A rope knot as big as your fist, tied so well it outlived the bridge. Kong children are not allowed on a bridge until they can tie this one with their eyes shut.' },
  { id: 'c63', region: VINE, kind: 'relic', name: 'Lucky Fig', from: { quest: 'fig-luck' },
    text: 'A dried fig from the terraces, thrown in the river and fished out again for luck. It is, technically, very lucky. Also very sticky.' },
  { id: 'c64', region: VINE, kind: 'relic', name: 'Paddy Bell', from: spot('fig-terraces', 14.6, 40.0, FIG),
    text: 'A little bronze bell the farmers rang to call the water down the terraces. It still rings. The water does not come down any more.' },
  { id: 'c65', region: VINE, kind: 'relic', name: 'Guard\'s Tail Ribbon', from: { quest: 'scared-tails' },
    text: 'A ribbon a Kong guard tied round his tail so it would stop shaking. It did not. He gave it to you anyway.' },
  { id: 'c66', region: VINE, kind: 'shell', name: 'Rope and Wind', cue: 'field', from: spot('canopy-walk', -11.2, 33.0, CANOPY),
    text: 'A rope bridge creaking in the wind high over the jungle floor, and far below, something big moving through the leaves.' },
  { id: 'c67', region: VINE, kind: 'shell', name: 'Temple Steps', cue: 'field', from: spot('ruin-steps', -13.2, 40.6, RUIN),
    text: 'Stone grinding on stone, a monkey call echoing off the temple face, and a guard on the steps whispering at his tail to stop it.' },
  { id: 'c68', region: VINE, kind: 'shell', name: 'Kingshade\'s Oath', cue: 'boss', from: { boss: 'kingshade' },
    text: 'The king\'s roar as the red left him - and then, very quietly, the same order over and over: "Up. Up. Everybody up."' },
  { id: 'c69', region: VINE, kind: 'hat', name: 'Guard Helm', geo: 'helmet', from: spot('court-guards', 5.9, 66.0, COURT),
    text: 'A Kong guard\'s helm, left on a statue\'s head. It is much too big. It is also very shiny.' },
  { id: 'c70', region: VINE, kind: 'hat', name: 'Reed Bandana', geo: 'bandana', from: { quest: 'bend-fishing' },
    text: 'A bandana woven from river reeds, the way the Vinegate fishers wear them. It smells faintly of fish. Faintly.' },
  { id: 'c71', region: VINE, kind: 'hat', name: 'Leaf Crown', geo: 'horns', from: spot('canopy-walk', -11.8, 45.6, CANOPY),
    text: 'A circle of fig leaves pinned with twigs. The Kong children make them to play at being king.' },
  { id: 'c72', region: VINE, kind: 'hat', name: 'Paddy Hat', geo: 'beanie', from: spot('fig-terraces', -14.6, 36.0, FIG),
    text: 'A wide woven hat for working the paddies in the rain. In the canopy it always rains, so it is always the right hat.' },
  { id: 'c73', region: VINE, kind: 'stone', name: 'The Flood', from: spot('fig-terraces', -6.0, 29.8, FIG),
    text: 'A memory: the river rising over the terraces in one night, and a young Kingshade carrying families up the vines, two at a time, until morning.' },
  { id: 'c74', region: VINE, kind: 'stone', name: 'The Crown of Vines', from: spot('ruin-steps', 13.2, 35.6, RUIN),
    text: 'A memory: the Kong weaving a crown of vines for the one who saved them, and Kingshade saying he would rather have a hammock.' },
  { id: 'c75', region: VINE, kind: 'stone', name: 'The Promised Jungle', from: spot('court-stones', 6.4, 42.6, COURT),
    text: 'A memory: a red voice in the black pool telling Kingshade about a jungle with no floods, past the spirals, where he would never have to carry anyone again.' },
  
  
  { id: 'c76', region: MINE, kind: 'relic', name: 'Tally Board', from: spot('minehead', -14.0, 30.0, MINE),
    text: 'A plank of chalk marks, one for every miner down and one for every miner up. The last row does not add up, and somebody has stopped counting.' },
  { id: 'c77', region: MINE, kind: 'relic', name: 'The Dented Lamp', from: spot('seam-hall', -9.0, 38.0, SEAM), 
    text: 'A miner\'s lamp with a dent shaped like a bean. Its owner trims it every night. It has not been lit in a month.' },
  { id: 'c78', region: MINE, kind: 'relic', name: 'Soup Crystal', from: { quest: 'night-soup' },
    text: 'A clear crystal the cook found at the bottom of a soup pot. She does not ask how. Nobody asks the cook anything twice.' },
  { id: 'c79', region: MINE, kind: 'relic', name: 'Ore Cart Wheel', from: spot('mine-workings', -9.0, 62.5, MINE),
    text: 'An iron wheel off a cart that ran the old workings. The camp children roll it down the rim road. It always wins.' },
  { id: 'c80', region: MINE, kind: 'relic', name: 'The Hush Token', from: { quest: 'not-afraid' },
    text: 'A smooth black pebble the Hermit gives to the ones who keep quiet in the dark. It is warm, as if somebody has been holding it a long time.' },
  
  { id: 'c81', region: MINE, kind: 'shell', name: 'Three Echoes', cue: 'town', from: spot('echo-isles', -7.6, 87.4, ECHO),
    text: 'A name shouted from Driftwick\'s jetty, and the lake shouting it back three times - the third a little slower, a little wrong, as if somebody else were trying it out.' },
  { id: 'c82', region: MINE, kind: 'shell', name: 'The Thinking Water', cue: 'cave', from: spot('echo-isles', -6.6, 104.6, ECHO),
    text: 'Lie flat on the island logs and listen: a hum under the water, low and patient, like the lake is thinking about something and has not decided yet.' },
  { id: 'c83', region: MINE, kind: 'shell', name: 'The Hermit\'s Hush', cue: 'boss', from: { boss: 'quartz' },
    text: 'The Hermit\'s lenses clicking as the red left him - and then his breathing, fast, the way a kid breathes when the light goes out.' },
  { id: 'c84', region: MINE, kind: 'hat', name: 'Miner\'s Helmet', geo: 'helmet', from: { quest: 'dented-lamp' },
    text: 'A tin helmet with a bracket for a lamp and no lamp in it. Somebody\'s brother is coming back for this one. Maybe.' },
  { id: 'c85', region: MINE, kind: 'hat', name: 'Ore Goggles', geo: 'goggles', from: spot('mine-workings', 9.0, 68.5, MINE),
    text: 'Scratched goggles for chipping ore. Everything through them looks like it is underwater, which in the Deep is probably true.' },
  { id: 'c86', region: MINE, kind: 'hat', name: 'Lamp-Trimmer\'s Cap', geo: 'beanie', from: spot('shaft-b', -11.6, 68.3, SHAFT),
    text: 'A knitted cap with wax on it. The lamp trimmers wear them so the hot drips land on the cap and not on their heads. Mostly.' },
  { id: 'c87', region: MINE, kind: 'hat', name: 'Crystal Horns', geo: 'horns', from: spot('seam-narrows', 7.0, 53.1, SEAM),
    text: 'Two quartz spikes on a headband. The Hush wear them so they can feel the ceiling coming in the dark. Nobody laughs at them down there.' },
  { id: 'c88', region: MINE, kind: 'stone', name: 'The Night Shift', from: spot('seam-stones', -2.8, 66.0, SEAM),
    text: 'A memory: a young mole on the night shift, lamp held up in both paws, jumping at every drip, and the others laughing - kindly, mostly.' },
  { id: 'c89', region: MINE, kind: 'stone', name: 'Nine Years Awake', from: spot('seam-hollow', -3.0, 84.0, SEAM),
    text: 'A memory: the same mole, older, sitting up every night with the lamp turned high, listening, listening, never once going to sleep in the dark.' },
  { id: 'c90', region: MINE, kind: 'stone', name: 'The Voice in the Seam', from: spot('seam-hollow', 3.0, 84.0, SEAM),
    text: 'A memory: the lamp finally burning out, and a red voice in the black saying there was nothing there - nothing at all - and the mole, for the first time in nine years, letting go.' },
  
  
  { id: 'c91', region: FROST, kind: 'relic', name: "Cut Rope End", from: spot('frost-pass', 4.0, 61.6, FROST),
    text: "A frayed end of the high bridge's rope, cut clean through on one side and chewed on the other. Grandpa Hask says the knife did all of it. The teeth marks say otherwise." },
  { id: 'c92', region: FROST, kind: 'relic', name: "Stilt Mallet", from: spot('frost-camp', -15.4, 44.6, FROST),
    text: "Rime's spare mallet, the head worn round from nine winters of knocking stilts straight. The handle is wrapped in somebody's old scarf." },
  { id: 'c93', region: FROST, kind: 'relic', name: "Ice-Cutter's Saw", from: spot('glacier-field', -5.6, 27.4, GLACIER),
    text: "A long toothed saw for cutting blocks out of the glacier. The old cutter swears he's retired. He still oils it every week." },
  { id: 'c94', region: FROST, kind: 'relic', name: "Vent Kettle", from: spot('steam-vents', 39.4, 85.6, GLACIER),
    text: "A dented kettle wedged over a steam crack, always on the boil. Nobody owns it. Everybody who passes leaves the lid a little straighter." },
  { id: 'c95', region: FROST, kind: 'relic', name: "The Moss Basket", from: spot('summit-lair', 9.4, 80.6, SUMMIT),
    text: "A basket woven from tusk-scraped bark, full of moss gone stiff with frost. Somebody very big brought it up here every morning for a very long time." },
  { id: 'c96', region: FROST, kind: 'shell', name: "Mallets at Dawn", cue: 'town', from: spot('frost-camp', 13.0, 51.4, FROST),
    text: "Base Camp at first light: a mallet knocking on stilts, the hot spring crust cracking, and the lake ice groaning back at both of them." },
  { id: 'c97', region: FROST, kind: 'shell', name: "Waist-Deep Hush", cue: 'field', from: spot('aurora-hollow', -14.4, 86.4, GLACIER),
    text: "Aurora Hollow with the wind dropped: snow settling on snow, a dachi breathing somewhere under it, and the sky crackling green very far away." },
  { id: 'c98', region: FROST, kind: 'shell', name: "The Last Roar", cue: 'boss', from: { boss: 'glacius' },
    text: "Glacius Rex's vents hissing one last time - and then, instead of the roar, a long, shaking breath out, like something finally putting down a load." },
  { id: 'c99', region: FROST, kind: 'hat', name: "Pom Beanie", geo: 'beanie', from: spot('frost-camp', -16.6, 31.0, FROST),
    text: "A knitted beanie with a pom-pom the size of a fist. Somebody at Base Camp knits one for anybody new. It's a little big on you. They always are." },
  { id: 'c100', region: FROST, kind: 'hat', name: "Snow Goggles", geo: 'goggles', from: spot('glacier-field', 6.4, 60.0, GLACIER),
    text: "Bone goggles with skinny slits to cut the glare off the ice. Everything through them looks like a movie on a really wide screen." },
  { id: 'c101', region: FROST, kind: 'hat', name: "Icicle Horns", geo: 'horns', from: spot('menagerie-3', 4.6, 58.2, SUMMIT),
    text: "Two icicles on a band, snapped off a frozen dachi's block in the Menagerie. They still haven't melted. It's been weeks." },
  { id: 'c102', region: FROST, kind: 'hat', name: "Climber's Helmet", geo: 'helmet', from: spot('frost-pass', -16.4, 88.4, FROST),
    text: "A leather climbing helmet, the chin strap knotted twice. Grandpa Hask wore it the night he cut the bridge. He swears he doesn't remember where he lost it. He's a pretty bad liar." },
  { id: 'c103', region: FROST, kind: 'stone', name: "The Long Winters", from: spot('frost-pass', -12.0, 66.2, FROST),
    
    text: "A memory: a young mammoth-mecha breaking drifts up the pass in a blizzard, the little ones walking in his tracks. On his back, holding on with both mittens, a human boy in a wool cap with a short brim, a tiny dachi stuffed inside his coat. The boy is laughing." },
  { id: 'c104', region: FROST, kind: 'stone', name: "Every Spring, Fewer", from: spot('aurora-hollow', 13.0, 66.4, GLACIER),
    text: "A memory: the same keeper, older, standing at the thaw line every spring, counting the herd as it comes down, and every spring the count a little shorter." },
  { id: 'c105', region: FROST, kind: 'stone', name: "Hold Still", from: spot('summit-lair', -9.6, 92.6, SUMMIT),
    text: "A memory: a red voice in the aurora telling him nothing ever had to end - just hold still, hold everything still - and the keeper, so tired of counting, believing it." },
  
  
  { id: 'c106', region: HEART, kind: 'relic', name: "The Thirty-Second Plate", from: spot('ashen-forge', -2.4, 79.6, HEART),
    text: "A curved iron plate, polished, scratched with a smith's 32. Ojiji's arm has thirty-one. Old Ferro made this one just in case. Ojiji never came back to have it fitted." },
  { id: 'c107', region: HEART, kind: 'relic', name: "Spiral Scorch", from: spot('crater-stair', 5.4, 37.6, HEART),
    text: "A slab of the Crater Stair burned in a perfect spiral, like somebody pressed a giant stove coil into the rock. The forge folk say it's from the night the first spiral opened. They walk around it. Every time." },
  { id: 'c108', region: HEART, kind: 'relic', name: "Cart Ten", from: spot('magma-galleries', -14.6, 55.6, GALL),
    text: "A dented tin plate off an ore cart: CART 10. Somebody scratched a little face inside the zero. The track fixer says it's from the one that came off the rails. She says it like it was a person." },
  { id: 'c109', region: HEART, kind: 'relic', name: "Fare Tokens", from: spot('pyre-2', -3.4, 42.2, PYRE),
    text: "A string of clay discs, each pressed with a dachi's paw. The vault-keepers gave one to every dachi who 'paid the fare'. There are a lot of discs. The string is heavy." },
  { id: 'c110', region: HEART, kind: 'relic', name: "The Pot", from: spot('cinder-cistern', 39.6, 81.4, GALL),
    text: "A blackened cooking pot with a dent in the lid. A girl at the forge carried it all the way down out of the Vault while everybody else carried blankets. She says she doesn't need it back. She does." },
  { id: 'c111', region: HEART, kind: 'shell', name: "Anvil Morning", cue: 'town', from: spot('ashen-forge', 12.2, 89.6, HEART),
    text: "The Ashen Forge waking up: the bellows wheezing, a hammer finding its rhythm, the run bubbling under all of it, and somebody yelling at somebody about the washing." },
  { id: 'c112', region: HEART, kind: 'shell', name: "Cart Rattle", cue: 'field', from: spot('magma-galleries', 14.2, 28.4, GALL),
    text: "An ore cart running the trestles flat out: wheels shrieking on the bends, the points clanking, and a long whoop that might be yours." },
  { id: 'c113', region: HEART, kind: 'shell', name: "The Herald's Last Note", cue: 'boss', from: { boss: 'pyrecrown' },
    text: "Pyrecrown's wings beating twice - and then not diving. Just the sound of a fire settling down, and a long quiet where the god's answer never comes." },
  { id: 'c114', region: HEART, kind: 'hat', name: "Smith's Bandana", geo: 'bandana', from: spot('ashen-forge', -16.0, 86.0, HEART),
    text: "A sweat-stiff bandana with burn holes in it like a star map. Bellows swears it's lucky. Bellows also has no eyebrows." },
  { id: 'c115', region: HEART, kind: 'hat', name: "Ore Helmet", geo: 'helmet', from: spot('obsidian-rivers', -14.4, 86.4, GALL),
    text: "A miner's helmet with a cracked lamp. Somebody painted flames on the side. Then somebody else painted a smiley face on the flames." },
  { id: 'c116', region: HEART, kind: 'hat', name: "Ember Cap", geo: 'ember', from: spot('obsidian-rivers', 14.0, 92.4, GALL),
    text: "A little cap with a real ember stitched into the brim. It's warm. It's always warm. Don't put it in your pocket." },
  { id: 'c117', region: HEART, kind: 'hat', name: "Glass Horns", geo: 'horns', from: spot('pyre-3', 3.0, 65.0, PYRE),
    text: "Two horns of black volcanic glass on a band. They ring like a bell if you flick them. Everybody who tries it on flicks them. Everybody." },
  { id: 'c118', region: HEART, kind: 'stone', name: "Brightest in the Mountain", from: spot('crater-stair', -5.6, 59.4, HEART),
    text: "A memory: a young firebird lighting up the whole Vault at a festival, wings wide, everyone below him cheering - then going back to their supper, and the firebird still up there, burning, waiting for somebody to look up again." },
  { id: 'c119', region: HEART, kind: 'stone', name: "A Boy at the Festival", from: spot('obsidian-rivers', -12.4, 77.0, GALL),
    
    text: "A memory: the same festival, and down in the crowd a human boy in a short-brimmed cap with a B on the front, a tiny dachi riding on his shoulder, staring up at the firebird with his mouth open. (Hey. That's a Dodgers cap. Grandpa's got one in a drawer. The Dodgers left Brooklyn and he STILL won't talk about it.)" },
  { id: 'c120', region: HEART, kind: 'stone', name: "A Seat Kept", from: spot('pyre-nest', 8.4, 80.4, PYRE),
    text: "A memory: a red voice in the smoke saying it had seen him, only it, and that there would be a seat at its side when the Spire opened. The firebird asking what it would cost. The voice telling him. The firebird saying yes." },
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
