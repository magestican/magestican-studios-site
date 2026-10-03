


import { U } from '../../../engine/core/util.js';
import { G, S, saveGame, healParty, addDachi, caughtCount } from '../../state.js';
import { speciesById, makeDachi, GUARDIAN, STARTERS, SPECIES } from '../../data/species.js';
import { AMBUSH, SHRINE, SPAWN } from '../world/mapgen.js';
import { spawnNpcs } from '../world/npcs.js';
import { HOME } from '../world/regions.js';
import * as shrineVillage from '../world/regionMaps/shrineVillage.js';
import { LANE } from '../world/regionMaps/shellhaven.js';
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
    L(ELDER, 'Go now, child. Follow the road down the mountain — the X on your map is the Shrine Village.'),
    L(ELDER, 'Be careful. Since the spirals began to open, some of our kind have… changed.'),
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
    L(KID, 'Somebody loved this place. You can tell. Nobody plants in straight lines unless they love it.'),
  ],
  'thorn-lower': [
    L(NARR, 'Down here the rows give up. The garden has run wild, and the thorns grow as tall as you.'),
  ],
  'temple-porch': [
    L(NARR, 'Inside the drowned temple it is quiet. Water drips. Your footsteps echo a long way off.'),
  ],
  'temple-sanctum': [
    L(NARR, 'At the end of the aisle an old altar waits. When the tide moves, the whole room hums, like a choir far away.'),
    L(KID, 'It is singing. The temple is actually singing.'),
  ],
};


const CONCH = () => { const n = G.npcs.find((x) => x.id === 'shell-elder'); return n ? { who: n.name, portrait: n.sp } : NARR; };
const WELCOME = {
  before: [
    'Well, well. Let me look at you. Two legs, no gills, and dry as a biscuit.',
    'I am Grandmother Conch. This was a city once; now it is a bubble, and we fish folk keep it.',
    'You are welcome here, child. Rest at the clam whenever you need. And when you are ready, come and talk to me about the great one up in the plaza.',
  ],
  after: [
    'Well, well. So you are the one who set Leviathrum free. Look at you - so small!',
    'I am Grandmother Conch. The whole bubble felt it when his red tide lifted. Welcome to Shellhaven, child. Stay as long as you like.',
  ],
};

const BUBBLE_CLEARS = () => [
  L(NARR, 'Something is different. The bubble\'s skin, murky green the last time you were here, is clearing like a window someone breathed on.'),
  L(NARR, 'Sunlight comes down through the water in long gold ribbons. Fish folk stand still all over the square, faces up.'),
  L(CONCH, 'Look at that. The sun. I had forgotten its colour, child.'),
  L(KID, 'That was Leviathrum. He was holding the red tide over all of you.'),
  L(CONCH, 'Then he is holding it no longer. Thank you - from all of us, and from him.'),
];
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
  const lines = REGION_BEATS[sec], seen = G.flags.beats || (G.flags.beats = {});
  if (!lines || seen[sec] || S.dialog.active) return;
  seen[sec] = 1;
  say(lines);
}


export function updateStory(dt) {
  const p = G.player;
  if (!scene && G.flags.started && !G.flags.starter && U.dist(p.x, p.y, AMBUSH.x, AMBUSH.y) < 2.4 && !S.dialog.active) startAmbush();
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
  say([L(NARR, 'Something is moving behind those rocks...'), L(KID, 'H-hello...?')], () => {
    const w = spawnWild({ x: AMBUSH.from.x, y: AMBUSH.from.y });
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
    L(HIBONE, 'Name’s Hibone. I am your guardian. Now shout, kid! Tell me what to do!'),
    L(NARR, 'Hibone became your first dachi! Shout his three special attacks: press 1, 2 and 3 — or tap the glowing buttons.'),
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
    L(HIBONE, 'Don’t cry, kid. Guardians don’t end. We just... start over.'),
    L(NARR, 'Hibone glows with a soft white light that grows and grows... and when it fades, there is only a warm, speckled egg where he stood.'),
    L(NARR, 'You pick up the egg. It is warm, and it feels like it is listening.', { onShow: () => { G.items.egg = 1; } }),
    L(NARR, 'The whole island goes quiet. A voice as old as the sea speaks from inside the light.'),
    L(TOMO, 'Child of the other world. Before you walk on, tell me.'),
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
    L(TOMO, 'Keep the egg close. Now go — the priests are waiting.'),
    L(NARR, 'Wild dachis live in the tall grass. Weaken one below 25% HP, then tap it to befriend it with the ritual.'),
  ]);
  S.dialog.next();
  saveGame();
}


export function ceremony() {
  G.flags.initiated = true;
  say([
    L(PRIEST, 'So... the child of the other world. The Elder’s fire-bird told us you would come.'),
    L(PRIEST, 'And you carry a guardian’s egg. Then it has already begun.'),
    L(PRIEST, 'Kneel, {name}. By the light of this Temple and the fire of Mt. Kazan, we begin the initiation.'),
    L(NARR, 'The Priest Dachis raise their paws. A warm golden light wraps around you and your companions.'),
    L(PRIEST, 'You are now a Dachi Tamer. Your voice will reach every dachi that fights beside you — and your kindness can wash the red sickness out of a corrupted heart.'),
    L(PRIEST, 'A sickness is draining Dachi World. The spiral that stole you from your home is part of it. Somewhere above us, something is pulling.'),
    L(PRIEST, 'Return to Kazan Village. Little Kumabo’s wound has begun to heal. I think she wants to see you.'),
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
    L(ELDER, 'She believes in you, {name}. Now go — there are 123 kinds of dachi on these islands, and every one of them was meant to be a friend.'),
    L(NARR, 'END OF CHAPTER 1 — Kazan Isle is yours to explore. To be continued...'),
  ], () => saveGame());
}



function elderAfterAshlo() {
  G.flags.elderAshlo = true;
  say([
    L(ELDER, 'You faced Cinderwarden Ashlo... and you came back. The mountain breathes easier tonight.'),
    L(ELDER, 'Ashlo was a guardian once, as your Hibone is. Whatever waits behind the spirals turned him.'),
    L(NARR, 'Hibone\'s egg shifts in your pack.'),
    L(ELDER, 'So it has begun to wake. Every guardian you set free will warm it a little more.'),
    L(ELDER, 'Aerowing will carry you now, child. Rest at any hot spring you have visited and call for her.'),
    L(ELDER, 'The tide pulls below Tomo Coast. Something old is stirring in Coral Deep, under the reef.'),
  ]);
  saveGame();
}


function elderAfterLeviathrum() {
  G.flags.elderLeviathrum = true;
  say([
    L(ELDER, 'The tide came in gentle this morning. Leviathrum is free, then.'),
    L(KID, 'It said the tide erases every footprint. That only the ones who leave get remembered.'),
    L(ELDER, 'Hm. A lonely thing to believe at the bottom of the sea. Whoever told it that wanted it to leave.'),
    L(NARR, 'Hibone\'s egg is warm against your back now, like a stone left in the sun.'),
    L(ELDER, 'Two guardians set free. Inland, past the jungle, the Verdant Wilds have gone quiet. Too quiet. The birds left first.'),
  ]);
  saveGame();
}
function elderAfterBramble() {
  G.flags.elderBramble = true;
  say([
    L(ELDER, 'Mother Bramble... I knew her when her antlers still flowered. You brought her home.'),
    L(KID, 'She called our world soil. She said the new world would be their garden.'),
    L(ELDER, 'Then someone is promising the dachis a paradise, and asking them to pay for it with everything they love.'),
    L(NARR, 'Something inside Hibone\'s egg taps back when you touch it. Once. Twice.'),
    L(ELDER, 'Three guardians, child. The spirals are not an accident. Rest now - what comes next will ask more of you.'),
  ]);
  saveGame();
}
export function talkTo(n) {
  if (n.kind === 'elder') {
    if (G.flags.boss_ashlo && !G.flags.elderAshlo) return elderAfterAshlo();
    if (G.flags.boss_leviathrum && !G.flags.elderLeviathrum) return elderAfterLeviathrum();
    if (G.flags.boss_bramble && !G.flags.elderBramble) return elderAfterBramble();
    if (!G.flags.starter) return say([L(ELDER, 'Hurry, child! Down the road — follow the red dashes on your map to the X.')]);
    if (!G.flags.initiated) return say([L(ELDER, 'A guardian’s egg... So Hibone found you. Go on, the priests are waiting.')]);
    if (!G.flags.kumabo) return say([L(ELDER, 'You have been initiated. I can feel it. Go on — Kumabo is waiting for you.')]);
    return say([L(ELDER, `You have befriended ${caughtCount()} kinds of dachi. Keep going, Tamer.`)]);
  }
  if (n.kind === 'kumabo') {
    
    if (G.flags.kumabo && G.flags.boss_ashlo && !G.flags.kumaboAshlo) {
      G.flags.kumaboAshlo = true; saveGame();
      return say([
        { who: 'Kumabo', portrait: 'kumabo', text: 'Kuma! Kuma-kuma!' },
        L(NARR, 'Kumabo pats your pack, right where the egg is, and listens with her good ear.'),
        L(NARR, 'Then she looks up at you, very serious, and holds up one paw: come back. Promise.'),
        L(KID, 'I promise. I\'ll always come back here.'),
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
    if (!G.flags.starter) return say([{ who: 'Priest Dachi', portrait: 'priest', text: 'You should not be here yet, child.' }]);
    if (!G.flags.initiated) return n.head ? ceremony() : say([{ who: 'Priest Dachi', portrait: 'priest', text: 'The High Priest awaits you at the temple steps.' }]);
    return say([{ who: 'Priest Dachi', portrait: 'priest', text: 'May your bond with every dachi grow strong, Tamer {name}.' }]);
  }
  const q = questTalk(n); 
  if (q) return say(q);
  n.li = ((n.li ?? -1) + 1) % n.lines.length;
  say([{ who: n.name || speciesById(n.sp).name, portrait: n.sp, text: n.lines[n.li] }]); 
}
