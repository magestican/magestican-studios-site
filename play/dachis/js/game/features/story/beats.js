


import { U } from '../../../engine/core/util.js';
import { G, S, saveGame, healParty, addDachi, caughtCount } from '../../state.js';
import { speciesById, makeDachi, GUARDIAN, STARTERS, SPECIES } from '../../data/species.js';
import { AMBUSH, SHRINE, SPAWN } from '../world/mapgen.js';
import { tripped, burstFrom, AMBUSH_GATE } from './tripwire.js';
import { spawnNpcs, readOf } from '../world/npcs.js';
import { HOME } from '../world/regions.js';
import * as shrineVillage from '../world/regionMaps/shrineVillage.js';
import { LANE } from '../world/regionMaps/shellhaven.js';
import * as motherHollow from '../world/regionMaps/motherHollow.js';
import * as court from '../world/regionMaps/obsidianCourt.js';
import { bubbleLook } from '../world/worldView.js';
import { spawnWild, removeWild } from '../world/wilds.js';
import { startBattle } from '../battle/battle.js';
import { KID, ELDER, NARR } from './scenes.js';
import { questTalk } from '../quest/questRuntime.js';

const HIBONE = { who: 'Hibone', portrait: GUARDIAN };
const TOMO = { who: 'Tomo, the First Friend', portrait: undefined };
const PRIEST = { who: 'High Priest Tomoe', portrait: 'priest' };
const say = (lines, then) => S.dialog.say(lines, then);
const L = (who, text, extra) => Object.assign(typeof who === 'function' ? who() : { ...who }, { text }, extra || {});


let scene = null;

export const storyLocksMovement = () => !!scene && scene.kind !== 'conch';

export function afterIntro() {
  G.flags.started = true;
  
  if (G.region === HOME) { G.player.x = SPAWN.x; G.player.y = SPAWN.y; spawnNpcs(); }
  say([
    L(ELDER, 'Down the road, off the mountain. The X on your map is the Shrine Village. Do not leave the road.'),
    L(ELDER, 'If something comes at you out of the rocks, you run. Some of our own bite now. You will know them by the red.'),
  ]);
  saveGame();
}


const REGION_BEATS = {
  'ember-b': [
    L(NARR, 'The Magma Hall. Heat rolls off the pools in slow waves, and the rock hums underfoot.'),
    L(NARR, 'Somewhere past the pools, something small is crying.'),
  ],
  
  shellhaven: [
    L(NARR, 'The water parts like a curtain. You step through - and you are dry, standing in air, on the bottom of the sea.'),
    L(NARR, 'Above you the bubble wobbles. Fish swim past outside it, close enough to touch.'),
    L(KID, 'No way. NO way. This is better than the aquarium on Coney Island.'),
  ],
  'kelp-maze': [
    L(NARR, 'The bubble stretches out into a long tunnel of air. The kelp has grown into walls taller than you.'),
    L(KID, 'Okay. Left hand on the wall. That is how you do mazes. I think.'),
  ],
  
  hollowroot: [
    L(NARR, 'The rope ladder sways. You climb, and climb, and do not look down - and then your head comes up through the leaves into the light.'),
    L(NARR, 'A whole village sits in the crown of the old tree: huts where the boughs fork, firefly jars, walkways of living wood.'),
    L(KID, 'A treehouse. A whole TOWN of treehouses. Okay, I am never going home.'),
  ],
  'thorn-upper': [
    L(NARR, 'The rope slide hisses, the leaves whip past - and you land in a garden. Or what used to be one.'),
    L(NARR, 'Long beds run along every terrace, planted in neat rows. Thorns have climbed over all of them.'),
    L(KID, 'Somebody used a ruler on this. My mom does the shelves at the store like that. You do NOT touch her shelves.'),
  ],
  'thorn-lower': [
    L(NARR, 'Down here the rows give up. The garden has run wild, and the thorns grow as tall as you.'),
  ],
  
  vinegate: [
    L(NARR, 'Aerowing drops you on a wooden landing over a wide brown river. The air is hot and loud with insects.'),
    L(NARR, 'A whole village stands in the water on stilts, joined by boardwalks. Something with a long tail watches you from a roof.'),
    L(KID, 'It is like the South Street Seaport. If the Seaport was in a jungle. And the guy selling pretzels had a tail.'),
  ],
  
  'canopy-walk': [
    L(NARR, 'The ladder ends on a platform of planks lashed round a trunk. Rope bridges swing away from it in every direction.'),
    L(NARR, 'Some climb up into the sunny crowns. Some sag across the shade below. The ground is very, very far down.'),
    L(KID, '(Do not look down. Okay. Looked down. Great.)'),
  ],
  'gale-ledges': [ 
    L(NARR, 'The jetty ends in a rope ladder bolted to the cliff. At the top, four long ledges step up the rock, and the wind comes along them in shoves.'),
    L(KID, 'Whoa - WHOA. It is like the platform at Fourteenth Street when the express goes by. Okay. Stand behind the big rocks.'),
  ],
  'fig-terraces': [
    L(NARR, 'Past the last bridge the jungle opens onto a hillside of flooded fields, stepping down like stairs full of sky.'),
    L(NARR, 'Narrow mud walls run between the pools. Old fig trees grow where the walls meet. Nobody has tended this in a long time.'),
    L(KID, 'It is like a giant ice cube tray. A muddy one. I can walk on the edges.'),
  ],
  
  minehead: [
    L(NARR, 'Aerowing comes down on a ring of trodden earth round a hole in the world. The pit is wider than a city block, and black at the bottom.'),
    L(NARR, 'Huts stand back from the edge. One ledge leaves the rim and winds down the pit wall, round and round, with torches on it.'),
    L(KID, 'It is like the ramp in the Guggenheim. Mom took me once. Except the Guggenheim has a floor.'),
  ],
  'shaft-a': [
    L(NARR, 'The ladder ends in a tunnel. A lantern hangs just ahead, cold. Past it there is nothing to see at all.'),
    L(KID, '(My Walkman light. Okay. It is a very small light.)'),
  ],
  'seam-hall': [
    L(NARR, 'Through the crack the air goes still. Somewhere in the black there are pillars - you can hear your own steps come back off them.'),
    L(NARR, 'Ahead, a chain hangs across the way on, heavy as a ship\'s.'),
    L(KID, 'Okay. Okay okay okay. It is just the basement. Every building has a basement. ...Every building has a light switch in the basement.'),
  ],
  'ruin-steps': [
    L(NARR, 'The jungle gives way to stone: the face of an old temple, climbing the hill in broken steps too steep to walk.'),
    L(NARR, 'Long ramps run back and forth across it, each a little higher than the last. At the very top, a gate of black glass.'),
    L(KID, 'Like the ramp at the Y on 63rd. Except at the Y, the guy at the top just wants to see your card.'),
  ],
  'court-stones': [
    L(NARR, 'Inside the gate the floor is water - perfectly still and perfectly black, like a mirror nobody cleaned.'),
    L(NARR, 'Pale stones lead across it, not in a straight line. Your reflection follows you, one step behind.'),
  ],
  'court-guards': [
    L(NARR, 'A long hall of stone guards. Between them, real ones: big furry dachis in armour, kneeling, tails shaking.'),
    L(KID, '(They look more scared of me than I am of them. That is... a lot of scared.)'),
  ],
  'court-throne': [
    L(NARR, 'The last door opens onto the sky. A round floor at the top of the world, and at its far side, a throne of black stone.'),
    L(NARR, 'Someone huge stands in front of it, very still, looking out over the jungle like he is counting every tree.'),
  ],
  'tree-vault': [
    L(NARR, 'You squeeze down through the knot-hole and drop onto soft moss. Inside, the tree is hollow, and it smells like rain.'),
    L(NARR, 'Seedlings grow in neat rows across the floor, each one labelled with a scratch in the bark. Someone kept them here very carefully.'),
  ],
  'tree-heart': [
    L(NARR, 'The heartwood. A pool of sap glows gold in the middle of the hall, and the walls creak slowly, like breathing.'),
  ],
  'tree-roots': [
    L(NARR, 'At the very bottom the roots twist round one mossy stone, as if the whole tree were holding it.'),
    L(KID, 'All of this from one seed? We grew a bean in a cup in second grade. Mine died. It was in the window and everything.'),
  ],
  'temple-porch': [
    L(NARR, 'Inside the drowned temple it is quiet. Water drips. Your footsteps echo a long way off.'),
  ],
  'temple-sanctum': [
    L(NARR, 'At the end of the aisle an old altar waits. When the tide moves, the whole room hums, like a choir far away.'),
    L(KID, 'Okay, that is creepy. That is creepy, right? Buildings do not sing. Even in Manhattan.'),
  ],
};


const CONCH = () => { const n = G.npcs.find((x) => x.id === 'shell-elder'); return n ? { who: n.name, portrait: n.sp } : NARR; };
const WELCOME = {
  before: [
    'Let me look at you. Two legs, no gills, dry as a biscuit. Have you eaten? You have not eaten. Nobody up there feeds anybody.',
    'Conch. Grandmother Conch, to everyone - even the ones older than me. This square was a market when there was a city on top of it. Now it is us, the bubble, and a lot of fish who think they run the place.',
    'The clam by the pool mends your little ones. It sulks; ignore it. And when you have the stomach for it, come and ask me about the big one up in the plaza. Not before you have eaten.',
  ],
  after: [
    'So YOU are the one who went up and shouted at Leviathrum. Look at the knees on you. Have you eaten?',
    'Grandmother Conch. When his tide let go, my pots fell off the shelf, every one. Stay. Eat something. I am not asking.',
  ],
};

const FIRST_SEED = () => [
  
  L(NARR, 'You put your hand on the mossy stone. The roots around it are warm. The hollow goes bright, and you are somewhere else.', { onShow: () => document.body.classList.add('memory') }),
  L(NARR, 'A bare hill, long ago. No tree. A young dachi with small, bare antlers kneels and presses one seed into the dirt.'),
  { who: 'Young Bramble', portrait: undefined, text: 'There. Do not hurry. I am not going anywhere, so neither are you.' },
  L(NARR, 'Years go by in a breath. The seed is a sprout, then a sapling, then a tree with its head in the clouds. Bramble gets old beside it. Her antlers fill with flowers.'),
  L(NARR, 'Something red moves at the edge of the picture. The hill is gone.'),
  L(KID, '(She talked to it. My grandma talks to her tomatoes on the fire escape. Same voice.)', { onShow: () => document.body.classList.remove('memory') }),
  L(KID, '(And then something came and talked to HER. I bet it said all the right stuff, too.)'),
];

const BUBBLE_CLEARS = () => [
  L(NARR, 'Something is different. The bubble\'s skin, murky green the last time you were here, is clearing like a window someone breathed on.'),
  L(NARR, 'Sunlight comes down through the water in long gold ribbons. Fish folk stand still all over the square, faces up.'),
  L(CONCH, 'Would you look at that. I told them it was yellow. Nobody under forty believed me.'),
  L(KID, 'That was Leviathrum. The red stuff was him. Well - it was IN him.'),
  L(CONCH, 'Hm. We stopped swimming up to visit him, you know. Years ago. He was such a gloomy old thing. ...I may go up tomorrow. With soup.'),
];


const KING = () => { const n = G.npcs.find((x) => x.id === 'court-king'); return n ? { who: 'Kingshade', portrait: n.sp } : NARR; };
const GUARD = (i) => () => { const n = G.npcs.find((x) => x.id === 'court-g' + i); return n ? { who: 'Kong guard', portrait: n.sp } : NARR; };
const KING_STEPS = () => [
  L(NARR, 'The red seams in Kingshade\'s armour go dark one by one, from the fists up.'),
  L(NARR, 'He walks back to his throne. He does not sit in it. He sits on the bottom step, and the stone creaks under him.'),
  L(KING, 'Do not stand there looking at me. I was beaten by a child; I was there. Sit down or go.'),
  L(KING, 'The flood took the low terraces in one night. I carried them up two at a time until my arms quit. I lost four. Afterwards something in the black pool agreed with everything I thought. I should have known by that.'),
  L(NARR, 'Footsteps on the stairs. His three guards come up out of the hall and stop well out of reach.'),
  L(KING, 'Get up. UP. I am sick of the tops of your heads.'),
  L(KING, 'I never asked you. I knew what you would say, so I never asked. ...Well? Say it.'),
  L(GUARD(0), 'Home, Majesty. The river. My grandmother\'s terrace has gone to weeds, and she will not let anyone else pull them.'),
  L(GUARD(2), 'And you. Down there, not up here. Old Banyan says she kept your hammock. She says it smells.'),
  L(NARR, 'Kingshade looks at the three of them for a long time. Then he puts one huge hand over his eyes, and keeps it there.'),
  L(KID, '(My dad did that once. At Grandpa\'s funeral. He said it was allergies.)'),
];
const COURT = 'obsidian-court';
function updateCourt(sec, dt) {
  const seen = G.flags.beats || (G.flags.beats = {});
  if (scene && scene.kind === 'court') { 
    let done = true;
    scene.guards.forEach((n, i) => { if (!moveTo(n, court.GUARD_UP[i].x, court.GUARD_UP[i].y, dt * 0.8)) done = false; });
    scene.t += dt;
    if (scene.step === 'up' && (done || scene.t > 6)) {
      scene.step = 'talk';
      for (const n of scene.guards) { n.moving = false; n.face = 1; }
      say(KING_STEPS(), () => { seen['kingshade-gone'] = 1; scene = null; saveGame(); });
    }
    return true;
  }
  if (!G.flags.boss_kingshade || seen['kingshade-steps'] || sec !== 'court-throne' || S.dialog.active) return false;
  seen['kingshade-steps'] = 1; seen['court-throne'] = 1; 
  spawnNpcs(); 
  const guards = [0, 1, 2].map((i) => G.npcs.find((x) => x.id === 'court-g' + i)).filter(Boolean);
  guards.forEach((n, i) => { n.x = court.DOORWAY_UP.x + (i - 1) * 0.9; n.y = court.DOORWAY_UP.y - (i - 1) * 0.9; });
  scene = { kind: 'court', step: 'up', t: 0, guards };
  say([L(NARR, 'Kingshade staggers back a step - and catches himself, and looks round to see who saw.')]);
  return true;
}
const SHELL = 'shellhaven';
let bubbleK = -1, bubbleIn = null; 
function moveTo(n, x, y, dt) {
  const dx = x - n.x, dy = y - n.y, d = Math.hypot(dx, dy), s = Math.min(d, 1.6 * dt);
  if (d < 0.02) { n.moving = false; return true; }
  n.x += dx / d * s; n.y += dy / d * s; n.moving = true; n.walk += dt * 10;
  if (Math.abs(dx - dy) > 0.05) n.face = dx - dy > 0 ? 1 : -1;
  return false;
}
function updateShellhaven(sec, dt) {
  const seen = G.flags.beats || (G.flags.beats = {});
  if (bubbleIn !== S.W) { bubbleIn = S.W; bubbleK = -1; }
  const target = G.flags.boss_leviathrum && seen['shellhaven-clear'] ? 1 : 0;
  if (target !== bubbleK) { bubbleLook(target, bubbleK < 0); bubbleK = target; }
  if (scene && scene.kind === 'conch') {
    const n = scene.n, p = G.player;
    if (scene.step === 'to') {
      const d = U.dist(n.x, n.y, p.x, p.y), w = scene.path[0];
      scene.t += dt;
      if (d > 3 && w && scene.t < 14) { if (moveTo(n, w[0], w[1], dt)) scene.trail.push(scene.path.shift()); }
      else if (d > 1.75) moveTo(n, n.x + (p.x - n.x) * (d - 1.7) / d, n.y + (p.y - n.y) * (d - 1.7) / d, dt);
      else { n.moving = false; scene.step = 'talk'; say(WELCOME[G.flags.boss_leviathrum ? 'after' : 'before'].map((t) => L(CONCH, t)), () => { scene.step = 'back'; }); }
    } else if (scene.step === 'back') {
      const w = scene.trail[scene.trail.length - 1] || [scene.home.x, scene.home.y];
      if (moveTo(n, w[0], w[1], dt) && !scene.trail.pop()) { n.face = 1; scene = null; saveGame(); }
    }
    return true;
  }
  if (sec !== SHELL || S.dialog.active) return false;
  if (seen[SHELL] && !seen['shellhaven-welcome']) { 
    seen['shellhaven-welcome'] = 1;
    if (G.flags.boss_leviathrum) seen['shellhaven-clear'] = 1; 
    const n = G.npcs.find((x) => x.id === 'shell-elder');
    if (n) { scene = { kind: 'conch', n, step: 'to', t: 0, home: { x: n.x, y: n.y }, path: LANE.slice().reverse(), trail: [] }; return true; }
  }
  if (G.flags.boss_leviathrum && seen['shellhaven-welcome'] && !seen['shellhaven-clear']) {
    seen['shellhaven-clear'] = 1; saveGame();
    bubbleLook(1); bubbleK = 1; 
    say(BUBBLE_CLEARS());
    return true;
  }
  return false;
}
export function updateRegionBeats(sec, dt = 1 / 60) {
  
  const p = G.player, T = shrineVillage.SHRINE_AT;
  if (G.region === shrineVillage.ID && G.flags.starter && !G.flags.initiated && U.dist(p.x, p.y, T.x, T.y) < shrineVillage.CEREMONY_R && !S.dialog.active && !scene) { ceremony(); return; }
  if (G.region === SHELL && updateShellhaven(sec, dt)) return;
  if (G.region === COURT && updateCourt(sec, dt)) return;
  
  
  if (G.region === motherHollow.ID && !S.dialog.active) {
    const seen = G.flags.beats || (G.flags.beats = {}), Sd = motherHollow.SEED;
    if (!seen['first-seed'] && U.dist(p.x, p.y, Sd.x, Sd.y) < Sd.r + 0.8) { seen['first-seed'] = 1; saveGame(); say(FIRST_SEED(), () => document.body.classList.remove('memory')); return; }
  }
  const lines = REGION_BEATS[sec], seen = G.flags.beats || (G.flags.beats = {});
  if (!lines || seen[sec] || S.dialog.active) return;
  seen[sec] = 1;
  say(lines);
}


export function updateStory(dt) {
  const p = G.player;
  
  if (!scene && G.flags.started && !G.flags.starter && tripped(p.x, p.y, AMBUSH_GATE) && !S.dialog.active) startAmbush();
  if (scene && scene.kind === 'ambush' && scene.charging) {
    const w = scene.wild, dx = p.x - w.x, dy = p.y - w.y, d = Math.hypot(dx, dy);
    if (d > 1.2) { w.x += dx / d * 5.5 * dt; w.y += dy / d * 5.5 * dt; w.face = dx - dy > 0 ? 1 : -1; w.moving = true; w.walk += dt * 14; }
    else { scene.charging = false; guardianAppears(); }
  }
  if (G.flags.starter && !G.flags.initiated && U.dist(p.x, p.y, SHRINE.x, SHRINE.y) < 2.6 && !S.dialog.active && !scene) ceremony();
}

function ambusherSpecies() {
  const s = SPECIES.find(x => x.types[0] === 'Shadow' && x.stage === 2 && x.fam > 3) || SPECIES[20];
  return s.id;
}
function startAmbush() {
  scene = { kind: 'ambush' };
  const p = G.player, b = burstFrom(p.x, p.y, AMBUSH_GATE, AMBUSH.from);
  say([L(NARR, b.staged ? 'Something is moving behind those rocks...' : 'Something is moving in the grass, right beside you...'), L(KID, 'H-hello...?')], () => {
    const w = spawnWild({ x: b.x, y: b.y });
    w.d = makeDachi(ambusherSpecies(), 9); w.d.corrupt = true; w.d.maxHpOverride = 29997; w.d.hp = 29997;
    w.scripted = true; scene.wild = w;
    S.sfx.play('start');
    say([L(NARR, 'A dachi with glowing, cracked red skin bursts out from behind the rocks and charges straight at you!')], () => { scene.charging = true; });
  });
}
function guardianAppears() {
  S.flash = 1;
  const hib = makeDachi(GUARDIAN, 60);
  G.dex.seen[GUARDIAN] = G.dex.caught[GUARDIAN] = 1;   
  say([
    L(NARR, 'Right before it hits you, a burst of orange fire slams between you!'),
    L(HIBONE, 'HOLD IT! Stay behind me, kid.'),
    L(NARR, 'An orange dachi — half dragon, half skeleton, with the cutest face you have ever seen — stands his ground in front of you.'),
    L(HIBONE, 'Name’s Hibone. Guardian. I got three moves and no eyes in the back of my head, so you shout, I throw. One, two, three. GO!'),
    L(NARR, 'Hibone is your first dachi. His attacks are keys 1, 2 and 3, or the glowing buttons.'),
  ], () => {
    startBattle(scene.wild, { script: 'guardian', ally: hib, onEnd: afterGuardianFight });
  });
}
function afterGuardianFight() {
  const w = scene.wild; removeWild(w);
  S.flash = 1.2;
  say([
    L(HIBONE, 'Heh... heh. That took... everything I had left.'),
    L(KID, 'Hibone? Hey — hey, what’s happening to you?!'),
    L(HIBONE, 'Hey. No crying, I got a reputation. Guardians don\'t end, kid. We just... start over.'),
    L(NARR, 'Hibone glows with a soft white light that grows and grows... and when it fades, there is only a warm, speckled egg where he stood.'),
    L(NARR, 'You pick up the egg. It is warm, and heavier than it looks.', { onShow: () => { G.items.egg = 1; } }),
    L(NARR, 'The whole island goes quiet. Even the sea. Then the light talks.'),
    L(TOMO, 'Child of the other world. I have very little light left, so I will ask only once.'),
    Object.assign(L(TOMO, 'What matters most to you?'), {
      choices: [
        { sprite: STARTERS.power, html: '<b>Power</b><br><small>To be strong enough to protect everyone.</small>', fn: () => chooseStarter('power') },
        { sprite: STARTERS.wisdom, html: '<b>Wisdom</b><br><small>To understand what is really happening.</small>', fn: () => chooseStarter('wisdom') },
        { sprite: STARTERS.adventure, html: '<b>Adventure</b><br><small>To go wherever the road leads.</small>', fn: () => chooseStarter('adventure') },
      ],
    }),
  ]);
}
function chooseStarter(path) {
  const id = STARTERS[path], s = speciesById(id);
  const d = makeDachi(id, 5);
  addDachi(d);
  G.flags.starter = true; G.flags.path = path;
  G.follower.x = G.player.x; G.follower.y = G.player.y - 0.8;
  scene = null;
  const why = { power: 'a baby dragon, half machine, breathing tiny sparks', wisdom: 'a round little blue mouse with very wise eyes', adventure: 'a small monkey in a knight’s breastplate and a wizard’s hat' }[path];
  S.dialog.insert([
    L(TOMO, path === 'power' ? 'Power. Then you will need a friend with fire in its heart.' : path === 'wisdom' ? 'Wisdom. Then you will need a friend who sees clearly.' : 'Adventure. Then you will need a friend who is never afraid of the next step.'),
    L(NARR, `The light gathers in your hands and becomes ${why}.`, { portrait: id }),
    L(NARR, `${s.name} joined you! It will fight at your side — press 1, 2, 3 in battle to shout its specials.`, { portrait: id }),
    L(TOMO, 'Keep the egg close. The priests are waiting, and I am tired.'),
    L(NARR, 'Wild dachis live in the tall grass. Weaken one below 25% HP, then tap it to befriend it with the ritual.'),
  ]);
  S.dialog.next();
  saveGame();
}


export function ceremony() {
  G.flags.initiated = true;
  say([
    L(PRIEST, 'You are late. The Elder\'s bird came at dawn. We have been standing in these robes since dawn.'),
    L(PRIEST, 'Is that a guardian\'s egg? ...So Hibone got to you first. Of course he did. He never could wait for a rite.'),
    L(PRIEST, 'Kneel, {name}. No - both knees. This has been done the same way for four hundred years, and it will not be done sloppily today.'),
    L(NARR, 'The Priest Dachis raise their paws. The acolytes mouth the words a beat behind Tomoe. A warm golden light wraps around you and your companions.'),
    L(PRIEST, 'It held. ...It held. You are a Dachi Tamer. Your dachis will hear you when you shout in a fight, and a red one you befriend will come clean of it.'),
    L(PRIEST, 'Dachi World is being drained, {name}. The spiral that took you is part of it. Something up there is pulling, and nobody believes me about how high up.'),
    L(PRIEST, 'Go back up to Kazan. The little pink one is mending. That was the Elder\'s bargain with you, I gather. Go and collect.'),
    L(NARR, 'INITIATION COMPLETE! You received 5 Heart Seals. Your companions were fully healed.'),
  ], () => { G.items.seal += 5; healParty(); spawnNpcs(); saveGame(); });
}


function kumaboThanks() {
  G.flags.kumabo = true;
  G.items.charm = 1; G.items.candy = (G.items.candy || 0) + 3;
  say([
    { who: 'Kumabo', portrait: 'kumabo', text: 'Kuma! Kumabo!!' },
    L(NARR, 'The bandage is gone. Kumabo spins in a happy circle, then presses something small and warm into your hand.'),
    L(NARR, 'You received Kumabo’s Lucky Charm and 3 Spirit Candies!'),
    { who: 'Kumabo', portrait: 'kumabo', text: 'Kuma... bo. (She will be right here when you come back.)' },
    L(ELDER, 'There. I said she would mend. ...Do not look at me like that, {name}; she mended. There are 123 kinds of dachi on these islands. Go and make friends with them before something else does.'),
    L(NARR, 'END OF CHAPTER 1 — Kazan Isle is yours to explore. To be continued...'),
  ], () => saveGame());
}



function elderAfterAshlo() {
  G.flags.elderAshlo = true;
  say([
    L(ELDER, 'You came back. Good. I had Aerowing watching the coast in case you did not.'),
    L(ELDER, 'Ashlo kept the fire in this village longer than I have had this arm. A guardian, like your Hibone. Nobody ever thanked him for it. I never did. Something up there noticed that before we did.'),
    L(NARR, 'Hibone\'s egg shifts in your pack.'),
    L(ELDER, 'Hm. It moved. Every guardian you bring back will warm it. Do not ask me how I know; I have seen it before, and I do not talk about it.'),
    L(ELDER, 'Aerowing will carry you from now on. Any hot spring you have rested at, she can find. She will complain. Ignore her.'),
    L(ELDER, 'There is a city under the reef off Tomo Coast. Its guardian has not come up for air in a hundred years. Go and find out why.'),
  ]);
  saveGame();
}


function elderAfterLeviathrum() {
  G.flags.elderLeviathrum = true;
  say([
    L(ELDER, 'The tide came in soft this morning. So. Leviathrum.'),
    L(KID, 'He kept saying that thing about footprints. Over and over. Like somebody taught it to him.'),
    L(ELDER, 'Somebody did. It never says anything new, that voice. It says what you already think, only louder, until you think it is yours.'),
    L(NARR, 'Hibone\'s egg is warm against your back now, like a stone left in the sun.'),
    L(ELDER, 'Inland, the Verdant Wilds have gone quiet. Aerowing will not fly over them. She will not tell me why, either.'),
  ]);
  saveGame();
}
function elderAfterBramble() {
  G.flags.elderBramble = true;
  say([
    L(ELDER, 'Bramble. I courted her once, you know. Badly. She liked her seedlings better, and she was right to.'),
    L(KID, 'She called New York dirt. Like, actual dirt. For planting stuff in.'),
    L(ELDER, 'It promised her a bigger garden. One day it will promise you something too, {name}. When it does, you come and tell me before you answer it.'),
    L(NARR, 'Something inside Hibone\'s egg taps back when you touch it. Once. Twice.'),
    L(ELDER, 'The Kong in the jungle have a king who has stopped coming down from his tree. Old Banyan sent word. Banyan does not send word.'),
  ]);
  saveGame();
}
export function talkTo(n) {
  if (n.kind === 'elder') {
    if (G.flags.boss_ashlo && !G.flags.elderAshlo) return elderAfterAshlo();
    if (G.flags.boss_leviathrum && !G.flags.elderLeviathrum) return elderAfterLeviathrum();
    if (G.flags.boss_bramble && !G.flags.elderBramble) return elderAfterBramble();
    if (!G.flags.starter) return say([L(ELDER, 'Why are you still here? The red dashes on your map. The X. Go.')]);
    if (!G.flags.initiated) return say([L(ELDER, 'Hibone. So he found you first, the show-off. The priests, {name}. Now.')]);
    if (!G.flags.kumabo) return say([L(ELDER, 'It took. I can smell it on you. She is by the spring. Go and see her - I told you she would mend.')]);
    const read = readOf('ashlo'); 
    return say([L(ELDER, `${caughtCount()} kinds. When I was your age I had three, and one of them bit me.`), ...(read ? [L(ELDER, read)] : [])]);
  }
  if (n.kind === 'kumabo') {
    
    if (G.flags.kumabo && G.flags.boss_ashlo && !G.flags.kumaboAshlo) {
      G.flags.kumaboAshlo = true; saveGame();
      return say([
        { who: 'Kumabo', portrait: 'kumabo', text: 'Kuma! Kuma-kuma!' },
        L(NARR, 'Kumabo pats your pack, right where the egg is, and listens with her good ear.'),
        L(NARR, 'Then she looks up at you, very serious, and holds up one paw: come back. Promise.'),
        L(KID, 'Pinky swear. ...You don\'t have pinkies. Paw swear, then.'),
      ]);
    }
    
    if (G.flags.kumabo && G.flags.boss_leviathrum && !G.flags.kumaboLeviathrum) {
      G.flags.kumaboLeviathrum = true; saveGame();
      return say([
        { who: 'Kumabo', portrait: 'kumabo', text: 'Kuma? ...Kuma!' },
        L(NARR, 'Kumabo sniffs your sleeve. Salt. She sneezes, offended, then sneezes again on purpose to make you laugh.'),
        L(NARR, 'She has drawn a whale in the ash by the spring. Its ribs are white, not red.'),
        L(KID, 'Yeah. That\'s exactly how it looks now.'),
      ]);
    }
    if (G.flags.kumabo && G.flags.boss_bramble && !G.flags.kumaboBramble) {
      G.flags.kumaboBramble = true; saveGame();
      return say([
        { who: 'Kumabo', portrait: 'kumabo', text: 'Kuma-kuma-kuma!' },
        L(NARR, 'A flower is tucked behind Kumabo\'s good ear. She points at it, then at the forest far below, then at you.'),
        L(NARR, 'She takes it out and pushes it into your hand. Then she holds up her paw again. Come back. Still.'),
        L(KID, 'Still. Every time.'),
      ]);
    }
    if (G.flags.kumabo) return say([{ who: 'Kumabo', portrait: 'kumabo', text: 'Kuma! Kuma-kuma!' }, L(NARR, 'Kumabo hugs your leg. Harder than she looks.')]);
    if (G.flags.initiated) return kumaboThanks();
    return say([{ who: 'Kumabo', portrait: 'kumabo', text: '...Kuma...' }, L(NARR, 'She holds your finger with her little robot paw. You have to do this. For her.')]);
  }
  if (n.kind === 'priest') {
    if (!G.flags.starter) return say([{ who: 'Priest Dachi', portrait: 'priest', text: 'You are early. The High Priest hates early almost as much as late.' }]);
    if (!G.flags.initiated) return n.head ? ceremony() : say([{ who: 'Priest Dachi', portrait: 'priest', text: 'The High Priest is on the temple steps. Practising the speech. Again.' }]);
    return say([{ who: 'Priest Dachi', portrait: 'priest', text: 'Tamer {name}. It still sounds strange. Nobody has been called that in my lifetime.' }]);
  }
  const q = questTalk(n); 
  if (q) return say(q);
  n.li = ((n.li ?? -1) + 1) % n.lines.length;
  say([{ who: n.name || speciesById(n.sp).name, portrait: n.sp, text: n.lines[n.li] }]); 
}
