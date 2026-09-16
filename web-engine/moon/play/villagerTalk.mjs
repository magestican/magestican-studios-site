




























import { whyCannot } from '../economy/world.mjs';
import { GIFTS, GOODS } from '../economy/tables.mjs';
import { VILLAGER_SPECIES, VOICES } from '../voice/voices.mjs';
import { seedOf } from '../voice/mumble.mjs';
import { nameOf } from './names.mjs';
import { villagerName } from './people.mjs';
import { MAX_LINE_CHARS, coinsText } from './talk.mjs';
import { homeStage } from './village.mjs';

export { MAX_LINE_CHARS };
export const NODES = Object.freeze(['greeting', 'gift', 'goods', 'hint', 'thanks', 'levelUp', 'cantGive', 'bye']);

export const COIN_GIFTS = Object.freeze([GIFTS.coinsPerPoint, 50, 200]);

export const GOODS_SHOWN_MAX = 3;

export const FRUIT_HANDFUL = 5;

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);



export const GENERIC_LINES = Object.freeze({
  hello: "Oh, hello! I'm {name}. You must be new here.",
  again: Object.freeze(['Oh, hello again!', 'Nice to see you again.', 'Oh! It is you. Hello!', 'What a lovely day for a walk.']),
  bye: Object.freeze(['Bye for now!', 'See you around, neighbour.', 'Take care now.']),
  calm: "Don't you worry about me.",
});


export const SPECIES_LINES = Object.freeze({});

const HOME_LINE = Object.freeze({
  none: 'I sleep under the stars for now. One day, a house!',
  building: "I'm building my house! It's going to be lovely.",
  house: "Come by my house sometime. It's small, but it's mine.",
  decorated: 'Have you seen my house? I made it all pretty.',
  garden: "My garden is blooming. I've never been so happy.",
});


export const HINTS = Object.freeze({
  appleJuice: "I'd do anything for a cold bottle of apple juice.",
  peachJam: "Peach jam on toast. That's my perfect morning.",
  apple: 'A crisp apple, fresh off the tree. Nothing better!',
  orchardJuice: 'Juice of apples and peaches together. Dreamy.',
});
const DOUBLE_LINE = 'A favourite thing means twice as much, you know.';


const THANKS = Object.freeze([
  [1, ['You spoil me! Save some kindness for later.', "Oh my, I'm already so spoilt. Thank you!"]],
  [5, ["Oh, thank you! That's lovely.", 'For me? Thank you!']],
  [20, ["That's so thoughtful. Thank you!", "Oh! You really didn't have to. Thank you!"]],
  [50, ['Oh my! That really made my day.', "I'm all warm and fuzzy now. Thank you!"]],
  [Infinity, ["I don't know what to say. Thank you, truly!", 'This is the kindest thing anyone has done for me!']],
]);
export const FAVOURITE_LINE = "And it's my favourite, too!";

const LEVEL_UP = Object.freeze({
  house: ["I'm so happy here, I've decided to stay.", "I'm going to build a house! Come and watch!"],
  decorate: ['My little house needs some love.', "I'm going to decorate it! Come and see!"],
  garden: ['You know what my house needs? Flowers.', "I'm going to plant a garden all round it!"],
});


export function linesFor(species, name) {
  const fill = (s) => s.replaceAll('{name}', name || 'your neighbour').replaceAll('{species}', species || 'villager');
  const merged = { ...GENERIC_LINES, ...(SPECIES_LINES[species] || {}) };
  return {
    hello: fill(merged.hello),
    again: merged.again.map(fill),
    bye: merged.bye.map(fill),
    calm: fill(merged.calm),
  };
}


export const hintFor = (good) => HINTS[good] || `I do love ${nameOf(good)}.`;

const villagerOf = (world, state) => (world.villagers || []).find((v) => v.id === state.villager) || null;


export function speakerOf(villager, villagers = []) {
  const species = villager ? villager.species : '';
  const voice = VOICES[species] ? species : VILLAGER_SPECIES[seedOf(String(species)) % VILLAGER_SPECIES.length];
  return { name: species ? villagerName(villager, villagers) : 'Someone', voice };
}

export function startTalk({ villager, visits = 0 } = {}) {
  if (!villager) throw new Error('startTalk: which villager?');
  return { villager: villager.id, species: villager.species, node: 'greeting', visits, step: 0, want: null, gave: null, error: null };
}

function pick(list, world, state, what) {
  return list[seedOf(`${world.seed}|villager|${state.villager}|${what}|${state.visits}|${state.step}`) % list.length];
}


export function giftGoods(world, villager) {
  return Object.entries(world.pockets || {})
    .filter(([good, n]) => n > 0 && GOODS[good] && GOODS[good].gift_points > 0)
    .map(([good, n]) => ({ good, count: GOODS[good].kind === 'fruit' ? Math.min(n, FRUIT_HANDFUL) : 1, favourite: good === villager.favourite }))
    .sort((a, b) => (b.favourite - a.favourite) || (GOODS[b.good].gift_points - GOODS[a.good].gift_points) || (a.good < b.good ? -1 : 1))
    .slice(0, GOODS_SHOWN_MAX);
}

const byeChoice = (label = 'Bye for now') => ({ key: 'bye', label, next: 'bye' });
const something = { key: 'more', label: 'Something else', next: 'greeting' };
export const NO_GOODS = 'You have nothing in your pockets they would like.';

const NODE = {
  greeting(state, { world, t, villager }) {
    const lines0 = linesFor(villager.species, villagerName(villager, world.villagers));
    let lines;
    if (state.step > 0) lines = [pick(['Anything else?', 'What else?', 'Hm?'], world, state, 'again')];
    else if (state.visits === 0) lines = [lines0.hello, HOME_LINE[homeStage(villager, t).stage]];
    else lines = [pick(lines0.again, world, state, 'hello')];
    const goods = giftGoods(world, villager);
    return {
      lines,
      choices: [
        { key: 'coins', label: 'Give some coins', next: 'gift' },
        { key: 'goods', label: 'Give a present', next: 'goods', why: goods.length ? null : NO_GOODS, want: goods.length ? null : { kind: 'nothing' } },
        { key: 'hint', label: 'What do you like?', next: 'hint' },
        byeChoice(state.step > 0 ? 'That is all' : 'Just saying hello'),
      ],
    };
  },

  gift(state, { world, t, villager }) {
    return {
      lines: [pick(["Coins? That's so kind. How many?", 'Oh, for me? How much?'], world, state, 'gift')],
      choices: [
        ...COIN_GIFTS.map((coins) => {
          const action = { type: 'gift', villager: villager.id, coins };
          return { key: `coins:${coins}`, label: `${coinsText(coins)} coins`, action, why: whyCannot(world, action, t), want: { kind: 'coins', coins } };
        }),
        { key: 'back', label: 'Never mind', next: 'greeting' },
      ],
    };
  },

  goods(state, { world, t, villager }) {
    const goods = giftGoods(world, villager);
    if (!goods.length) return { ...NODE.cantGive({ ...state, want: { kind: 'nothing' }, error: NO_GOODS }, { world, t, villager }), id: 'cantGive' };
    return {
      lines: [pick(['A present? For me? What is it?', "Ooh, what's in your pockets?"], world, state, 'goods')],
      choices: [
        ...goods.map(({ good, count, favourite }) => {
          const action = { type: 'gift', villager: villager.id, good, count };
          return { key: `good:${good}`, label: cap(nameOf(good, count)), action, why: whyCannot(world, action, t), want: { kind: 'good', good, count, favourite } };
        }),
        { key: 'back', label: 'Never mind', next: 'greeting' },
      ],
    };
  },

  hint(state, { villager }) {
    return { lines: [hintFor(villager.favourite), DOUBLE_LINE], choices: [{ key: 'goods', label: 'Give a present', next: 'goods' }, something, byeChoice()] };
  },

  thanks(state, { world }) {
    const g = state.gave || { points: 0 };
    const tier = THANKS.find(([below]) => g.points < below)[1];
    const lines = [pick(tier, world, state, 'thanks')];
    if (g.favourite) lines.push(FAVOURITE_LINE);
    return { lines, choices: [something, byeChoice('Bye for now')] };
  },

  levelUp(state, { world, t, villager }) {
    const n = NODE.thanks(state, { world, t, villager });
    const up = state.gave && state.gave.levelUp;
    return { ...n, lines: [...n.lines, ...(LEVEL_UP[up && up.event] || ["I'm so happy!"])] };
  },

  cantGive(state, { world, villager }) {
    const want = state.want || { kind: 'other' };
    let first;
    if (want.kind === 'coins' && world.coins < want.coins) first = `That's sweet, but you only have ${coinsText(world.coins)} coins.`;
    else if (want.kind === 'good' && (world.pockets[want.good] || 0) < want.count) first = `That's sweet, but you only have ${nameOf(want.good, world.pockets[want.good] || 0)}.`;
    else if (want.kind === 'nothing') first = "That's sweet, but there's nothing in your pockets for me.";
    else first = `Oh! ${state.error || 'Not just now.'}`;
    return { lines: [first, linesFor(villager.species, villagerName(villager, world.villagers)).calm], choices: [something, byeChoice('Bye for now')] };
  },

  bye(state, { world, villager }) {
    return { lines: [pick(linesFor(villager.species, villagerName(villager, world.villagers)).bye, world, state, 'bye')], choices: [], end: true };
  },
};


export function talkNode(state, { world, t }) {
  const villager = villagerOf(world, state);
  const speaker = speakerOf(villager || { species: state.species }, world.villagers || []);
  if (!villager) {
    return { id: 'bye', key: `bye|${state.step}`, speaker: speaker.name, voice: speaker.voice, villager: state.villager, lines: ['...'], choices: [], look: null, end: true };
  }
  const id = NODE[state.node] ? state.node : 'greeting';
  const n = NODE[id](state, { world, t, villager });
  return {
    id: n.id || id,
    key: `${id}|${state.step}`,
    speaker: speaker.name,
    voice: speaker.voice,
    villager: villager.id,
    lines: n.lines,
    choices: n.choices,
    look: null,
    end: Boolean(n.end),
  };
}





export function choose(state, choice, outcome) {
  if (!choice) return state;
  const base = { ...state, step: state.step + 1, error: null };
  if (choice.close) return null;
  if (choice.why) return { ...base, node: 'cantGive', want: choice.want || null, error: choice.why };
  if (choice.action) {
    if (!outcome || outcome.error) return { ...base, node: 'cantGive', want: choice.want || null, error: outcome ? outcome.error : 'Nothing happened.' };
    const events = outcome.events || [];
    const gift = events.find((e) => e.type === 'gift' && e.villager === choice.action.villager);
    const ups = events.filter((e) => e.type === 'levelUp' && e.villager === choice.action.villager);
    const up = ups[ups.length - 1] || null;
    return {
      ...base,
      node: up ? 'levelUp' : 'thanks',
      want: null,
      gave: {
        points: gift ? gift.points : 0,
        base: gift ? gift.base : 0,
        favourite: Boolean(choice.want && choice.want.favourite),
        coins: choice.action.coins ?? null,
        good: choice.action.good ?? null,
        count: choice.action.count ?? null,
        levelUp: up ? { level: up.level, event: up.event, doneAt: up.doneAt } : null,
        levels: ups.map((e) => e.level),
      },
    };
  }
  const next = NODES.includes(choice.next) ? choice.next : 'bye';
  return { ...base, node: next, want: null, gave: null };
}
