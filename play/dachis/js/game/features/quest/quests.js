












import { nextLair } from '../world/lairs.js';
import { HOME } from '../world/regions.js';

const MAIN_STEPS = [
  { kind: 'visit', flag: 'starter', text: 'Run down the road to the priests — the X on your map' },
  { kind: 'visit', flag: 'initiated', text: 'Run to the Shrine Village — the X on your map' },
  { kind: 'talk', flag: 'kumabo', text: 'Return to Kazan Village and see Kumabo' },
  { kind: 'beat', lairs: true }, 
  { kind: 'befriend', last: true },
];

export const QUESTS = [
  { id: 'main', region: HOME, main: true, name: 'The Bridge', steps: MAIN_STEPS },
  { id: 'paw-tonic', region: HOME, giver: 'kazan-v1', name: 'A Sore Paw', after: 'initiated',
    steps: [
      { kind: 'talk', npc: 'kazan-v1', text: 'Talk to the villager with the sore paw',
        say: ['My paw still aches, Tamer. The spring helps, but a Berry Tonic would fix it for good.', 'If you find one in the grass, would you bring it to me?'] },
      { kind: 'deliver', npc: 'kazan-v1', item: 'tonic', n: 1, text: 'Bring a Berry Tonic to the villager with the sore paw',
        say: ['A Berry Tonic! Oh, that is so much better.', 'Here, take this. I wore it while I healed. Maybe one of your friends will like it.'] },
    ],
    reward: { collectible: 'c9' } },
  { id: 'forgotten-friends', region: HOME, giver: 'kazan-v2', name: 'Forgotten Friends', after: 'initiated',
    steps: [
      { kind: 'talk', npc: 'kazan-v2', text: 'Talk to the villager who knows about the sickness',
        say: ['The sickness makes wild dachis forget they are friends.', 'Show me it can be undone, Tamer. Befriend a wild dachi out there, then come back.'] },
      { kind: 'befriend', text: 'Befriend a wild dachi' },
      { kind: 'talk', npc: 'kazan-v2', text: 'Tell the villager about your new friend',
        say: ['You did it! It remembered!', 'Take this shell. Hold it to your ear when the road gets lonely.'] },
    ],
    reward: { collectible: 'c6', items: { candy: 1 } } },
  { id: 'spiral-watch', region: HOME, giver: 'kazan-v0', name: 'Spiral Watch', after: 'kumabo',
    steps: [
      { kind: 'talk', npc: 'kazan-v0', text: 'Talk to the villager who saw the red hand',
        say: ['Last night the red hand came through a spiral down on Tomo Coast.', 'Go and look, Tamer. Tell me what is left there.'] },
      { kind: 'visit', sec: 'tomo-coast', text: 'Look for the spiral scorch on Tomo Coast', 
        say: ['The sand here is burned black in a spiral. A splinter of dark glass glints in the middle.'] },
      { kind: 'talk', npc: 'kazan-v0', text: 'Tell the villager what you found on Tomo Coast',
        say: ['Glass from a spiral... The Elder has one like it, from the first one.', 'Keep it. You are the Bridge; maybe it will listen to you.'] },
    ],
    reward: { collectible: 'c1' } },
  
  { id: 'lost-hatchling', region: 'ember-tube', giver: 'kazan-v3', name: 'The Lost Hatchling', after: 'initiated',
    steps: [
      { kind: 'talk', npc: 'kazan-v3', text: 'Talk to the worried villager in Kazan Village',
        say: ['My little one followed the warm air down the cave on the slope. The Ember Tube, we call it.', 'Please, Tamer. Find my hatchling before the lava does.'] },
      { kind: 'visit', sec: 'ember-b', text: 'Look for the hatchling in the Ember Tube\'s Magma Hall',
        say: ['A tiny dachi is curled up on a warm stone, humming to itself. It blinks at you and hops onto your shoulder.'] },
      { kind: 'talk', npc: 'kazan-v3', text: 'Bring the hatchling home to Kazan Village',
        say: ['You found it! Look at it, humming that silly tune.', 'It hummed it all the way into this shell. Keep it - it is yours now.'] },
    ],
    reward: { collectible: 'c23', items: { tonic: 2 } } },
  { id: 'lantern-oil', region: 'ember-tube', giver: 'shrine-v0', name: 'Light for the Lanterns', after: 'initiated',
    steps: [
      { kind: 'talk', npc: 'shrine-v0', text: 'Talk to the acolyte by the shrine lanterns',
        say: ['Our lanterns burn low. The first keepers carried fire up from the Ember Tube in a lantern of black glass.', 'They say it still sits in the Glow Gallery. Would you bring it back to us?'] },
      { kind: 'find', id: 'c16', text: 'Find the Obsidian Lantern in the Ember Tube\'s Glow Gallery',
        say: ['The black glass lantern is still warm. A tiny flame wakes inside it when you lift it.'] },
      { kind: 'talk', npc: 'shrine-v0', text: 'Bring the Obsidian Lantern to the acolyte',
        say: ['It still burns! The keepers\' fire, after all these years.', 'Take the helmet the last keeper wore. Its lamp will never go out down there.'] },
    ],
    reward: { collectible: 'c24' } },
  { id: 'kumabo-gear', region: 'ember-tube', giver: 'kazan-v4', name: 'Kumabo\'s Missing Gear', after: 'kumabo',
    steps: [
      { kind: 'talk', npc: 'kazan-v4', text: 'Talk to the villager who fixes things',
        say: ['Kumabo lost a gear from its arm in the Ember Tube. An Ember dachi carried it off, shiny thing.', 'Make friends with an Ember dachi and it might give it back.'] },
      { kind: 'befriend', type: 'Ember', text: 'Befriend an Ember dachi',
        say: ['Your new friend coughs up something round and warm: a little brass gear.'] },
      { kind: 'talk', npc: 'kazan-v4', text: 'Bring the gear back to Kazan Village',
        say: ['That is Kumabo\'s gear, all right. It will want you to keep it, you know. For luck.', 'And take a Heart Seal. Down in that tube you will need every friend you can make.'] },
    ],
    reward: { collectible: 'c17', items: { seal: 1 } } },
  
  { id: 'bubble-mend', region: 'shellhaven', giver: 'shell-v0', name: 'A Thin Spot', after: 'boss_ashlo',
    steps: [
      { kind: 'talk', npc: 'shell-v0', text: 'Talk to the fish folk keeper by the gate in Shellhaven',
        say: ['See how the skin ripples there? A thin spot. If it pops, the sea comes in.', 'Frost dachis can breathe a bubble hard as ice. Make friends with one and bring it here?'] },
      { kind: 'befriend', type: 'Frost', text: 'Befriend a Frost dachi',
        say: ['Your new friend puffs a breath of frost. A little bubble freezes in the air and drops into your hand.'] },
      { kind: 'talk', npc: 'shell-v0', text: 'Bring your Frost friend back to Shellhaven',
        say: ['Oh, look at that - the skin went smooth the moment it breathed on it!', 'Keep the frozen one. A bit of our air, for when you are far from the sea.'] },
    ],
    reward: { collectible: 'c32' } },
  { id: 'clam-pearl', region: 'shellhaven', giver: 'shell-v1', name: 'The Quiet Clam', after: 'boss_ashlo',
    steps: [
      { kind: 'talk', npc: 'shell-v1', text: 'Talk to the fish folk by the giant clam',
        say: ['The clam has not opened all day. It sulks when nobody feeds it.', 'It loves sweets. Do you have a Sweet Candy? Just one.'] },
      { kind: 'deliver', npc: 'shell-v1', item: 'candy', n: 1, text: 'Bring a Sweet Candy to the clam keeper in Shellhaven',
        say: ['The clam opens wide - and spits out a shell, right at your head. That means thank you, in clam.', 'Wear it! You look like one of us now.'] },
    ],
    reward: { collectible: 'c40', items: { tonic: 1 } } },
  { id: 'city-song', region: 'shellhaven', giver: 'shell-v3', name: 'The City That Sang', after: 'boss_ashlo',
    steps: [
      { kind: 'talk', npc: 'shell-v3', text: 'Talk to the fish folk who listens to Memory Stones',
        say: ['Grandmother says the drowned temple up in Coral Deep still sings when the tide moves through it.', 'I have never been brave enough to go. Would you listen for me?'] },
      { kind: 'visit', sec: 'temple-sanctum', text: 'Listen at the altar inside the drowned temple in Coral Deep', 
        say: ['The tide breathes through the temple\'s broken windows. It sounds like a choir that forgot the words.'] },
      { kind: 'talk', npc: 'shell-v3', text: 'Tell the fish folk in Shellhaven what you heard',
        say: ['It really sings? Then the city is not all gone.', 'You should keep the song. You heard it first.'] },
    ],
    reward: { collectible: 'c37' } },
  
  { id: 'lost-coin', region: 'shellhaven', giver: 'shell-v2', name: 'Grandfather\'s Coin', after: 'boss_ashlo',
    steps: [
      { kind: 'talk', npc: 'shell-v2', text: 'Talk to the fish folk by the elder\'s post in Shellhaven',
        say: ['My little sister chased a shiny coin into the Kelp Maze. She came back crying, without it.', 'It was our grandfather\'s, from the market in the city above. It has a whale on it. Could you look? The maze is through the east gate.'] },
      { kind: 'find', id: 'c33', text: 'Find the whale coin deep in the Kelp Maze, east of Shellhaven',
        say: ['Deep in the kelp, at the very end of a blind corner, something green and round winks at you. A whale on one side.'] },
      { kind: 'talk', npc: 'shell-v2', text: 'Bring the coin back to Shellhaven',
        say: ['That is it! That is the whale! She will stop crying now. Probably.', 'Keep the coin - Grandfather would want it travelling. Take these too, for the maze.'] },
    ],
    reward: { items: { candy: 2, seal: 1 } } },
  
  
  { id: 'firefly-home', region: 'hollowroot', giver: 'hollow-v3', name: 'The Lost Fireflies', after: 'boss_leviathrum',
    steps: [
      { kind: 'talk', npc: 'hollow-v3', text: 'Talk to the tree folk who keeps the firefly jars',
        say: ['Half my fireflies flew down the knot-hole last night. They go to the heartwood when they are sad.', 'The sap pool down there glows like they do. Could you go and tell them it is safe to come home?'] },
      { kind: 'visit', sec: 'tree-heart', text: 'Find the fireflies at the sap pool, inside the Mother Tree',
        say: ['A cloud of fireflies hangs over the glowing sap. When you hum, they drift up toward the knot-hole, one by one.'] },
      { kind: 'talk', npc: 'hollow-v3', text: 'Tell the firefly keeper in Hollowroot',
        say: ['They are back! Every one. Look at them - brighter than before.', 'Take a jar. One of them chose you. They do that.'] },
    ],
    reward: { collectible: 'c48' } },
  { id: 'old-shears', region: 'hollowroot', giver: 'hollow-v2', name: 'The Gardener\'s Shears', after: 'boss_leviathrum',
    steps: [
      { kind: 'talk', npc: 'hollow-v2', text: 'Talk to the tree folk who remembers the Old Grove',
        say: ['Mother Bramble had a pair of shears she never let anyone touch. She dropped them the night the red came.', 'They will be somewhere in Thornfield, her garden. The rope slide on the south-east platform goes down.'] },
      { kind: 'find', id: 'c46', text: 'Find Mother Bramble\'s shears in Thornfield\'s garden terraces',
        say: ['Under a thorn bed, half sunk in moss: a pair of old garden shears, handles worn smooth by one paw, for years.'] },
      { kind: 'talk', npc: 'hollow-v2', text: 'Bring the shears back to Hollowroot',
        say: ['Those are hers. When she is herself again, she will want them. Keep them safe until then.', 'And wear this. Every gardener up here wears one.'] },
    ],
    reward: { collectible: 'c54', items: { seal: 1 } } },
  { id: 'leaf-bed', region: 'hollowroot', giver: 'hollow-v1', name: 'A Bed of Leaves', after: 'boss_leviathrum',
    steps: [
      { kind: 'talk', npc: 'hollow-v1', text: 'Talk to the tree folk on the east platform',
        say: ['The leaf beds are restless. The wild ones in them keep waking up scared.', 'If one of them made a friend - a ground walker, even - the others would sleep. Could you try?'] },
      { kind: 'befriend', type: 'Leaf', text: 'Befriend a Leaf dachi',
        say: ['Your new friend curls up for a moment in the leaves, and the whole bed goes quiet around it.'] },
      { kind: 'talk', npc: 'hollow-v1', text: 'Tell the east platform\'s tree folk',
        say: ['Listen - nothing. They are all asleep. You did that.', 'Here. We drink rain from these. It is the best cup in the Wilds.'] },
    ],
    reward: { collectible: 'c50', items: { candy: 2 } } },
];
export const questById = (id) => QUESTS.find((q) => q.id === id) || null;
export const SIDE = QUESTS.filter((q) => !q.main);



export function mainStep(flags = {}, ctx = {}) {
  for (let i = 0; i < MAIN_STEPS.length; i++) {
    const s = MAIN_STEPS[i];
    if (s.flag && !flags[s.flag]) return { index: i, text: s.text };
    if (s.lairs) { const l = nextLair(flags); if (l) return { index: i, text: l.hint }; }
    if (s.last) return { index: i, text: `Befriend every dachi — ${ctx.caught || 0} / ${ctx.total || 0}` };
  }
  return { index: MAIN_STEPS.length, text: '' };
}


const prog = (flags, id) => (flags.quests ? flags.quests[id] : undefined);
export function status(flags = {}, q) {
  const n = prog(flags, q.id);
  if (n === undefined) return q.after && !flags[q.after] ? 'locked' : 'open';
  return n >= q.steps.length ? 'done' : 'active';
}

function matches(s, e, items = {}) {
  if (s.kind === 'talk' || s.kind === 'deliver') {
    if (e.kind !== 'talk' || e.npc !== s.npc) return false;
    return s.kind === 'talk' || (items[s.item] || 0) >= (s.n || 1);
  }
  if (s.kind !== e.kind) return false;
  if (s.kind === 'visit') return e.sec === s.sec;
  if (s.kind === 'befriend') return !s.type || (e.types || []).includes(s.type);
  if (s.kind === 'find') return e.id === s.id;
  if (s.kind === 'beat') return !s.boss || e.boss === s.boss;
  return false;
}



export function advance(flags, event, items = {}) {
  const out = [];
  for (const q of SIDE) {
    const st = status(flags, q);
    if (st === 'locked' || st === 'done') continue;
    const i = st === 'open' ? 0 : prog(flags, q.id), s = q.steps[i];
    if (!matches(s, event, items)) continue;
    if (s.kind === 'deliver') items[s.item] -= s.n || 1;
    
    
    let n = i + 1;
    while (n < q.steps.length && q.steps[n].kind === 'find' && flags.found && flags.found[q.steps[n].id]) n++;
    (flags.quests || (flags.quests = {}))[q.id] = n;
    const done = n >= q.steps.length;
    out.push({ quest: q, step: s, done, say: s.say || [], reward: done ? q.reward || null : null });
  }
  return out;
}

export function reminder(flags, npc) {
  for (const q of SIDE) if (q.giver === npc && status(flags, q) === 'active') return q.steps[prog(flags, q.id)].text;
  return null;
}


export function questState(flags = {}, ctx = {}) {
  const main = { id: 'main', name: QUESTS[0].name, ...mainStep(flags, ctx) };
  const side = SIDE.map((q) => {
    const st = status(flags, q), n = prog(flags, q.id) || 0;
    return { id: q.id, name: q.name, region: q.region, status: st, text: st === 'active' ? q.steps[n].text : st === 'done' ? 'Done' : '',
      steps: q.steps.slice(0, st === 'done' ? q.steps.length : n).map((s) => s.text) };
  }).filter((q) => q.status === 'active' || q.status === 'done');
  return { main, side };
}
