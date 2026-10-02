


import { U } from '../../../engine/core/util.js';
import { G, S, saveGame, healParty, addDachi, caughtCount } from '../../state.js';
import { speciesById, makeDachi, GUARDIAN, STARTERS, SPECIES } from '../../data/species.js';
import { AMBUSH, SHRINE, SPAWN } from '../world/mapgen.js';
import { spawnNpcs } from '../world/npcs.js';
import { HOME } from '../world/regions.js';
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
export const storyLocksMovement = () => !!scene;

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
};
export function updateRegionBeats(sec) {
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
export function talkTo(n) {
  if (n.kind === 'elder') {
    if (G.flags.boss_ashlo && !G.flags.elderAshlo) return elderAfterAshlo();
    if (!G.flags.starter) return say([L(ELDER, 'Hurry, child! Down the road — follow the red dashes on your map to the X.')]);
    if (!G.flags.initiated) return say([L(ELDER, 'A guardian’s egg... So Hibone found you. Go on, the priests are waiting.')]);
    if (!G.flags.kumabo) return say([L(ELDER, 'You have been initiated. I can feel it. Go on — Kumabo is waiting for you.')]);
    return say([L(ELDER, `You have befriended ${caughtCount()} kinds of dachi. Keep going, Tamer.`)]);
  }
  if (n.kind === 'kumabo') {
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
  say([{ who: speciesById(n.sp).name, portrait: n.sp, text: n.lines[n.li] }]);
}
