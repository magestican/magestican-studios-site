




























import { whyCannot } from '../economy/world.mjs';
import { GIFTS, GOODS } from '../economy/tables.mjs';
import { VILLAGER_SPECIES, VOICES } from '../voice/voices.mjs';
import { seedOf } from '../voice/mumble.mjs';
import { nameOf } from './names.mjs';
import { villagerName } from './people.mjs';
import { PERSONALITIES, personalityOf } from './personality.mjs';
import { MAX_LINE_CHARS, coinsText } from './talk.mjs';
import { homeStage } from './village.mjs';
import { calendarLines } from './calendar.mjs';
import { noticeBoard } from '../economy/town.mjs';
import { hourAt } from '../economy/clock.mjs';

export { MAX_LINE_CHARS };
export const NODES = Object.freeze(['greeting', 'gift', 'goods', 'hint', 'thanks', 'levelUp', 'cantGive', 'bye']);

export const COIN_GIFTS = Object.freeze([GIFTS.coinsPerPoint, 50, 200]);

export const GOODS_SHOWN_MAX = 3;

export const FRUIT_HANDFUL = 5;

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);



export const GENERIC_LINES = Object.freeze({
  
  
  
  
  
  
  
  hello: "Oh, hello! I'm {name}. You must be new here!",
  welcome: 'Welcome to Farmy Moon. You are going to love it here.',
  again: Object.freeze(['Oh, hello again!', 'Nice to see you again.', 'Oh! It is you. Hello!', 'What a lovely day for a walk.']),
  bye: Object.freeze(['Bye for now!', 'See you around, neighbour.', 'Take care now.']),
  calm: "Don't you worry about me.",
});


export const SPECIES_LINES = Object.freeze({});









const say = (text, mood) => Object.freeze({ text, mood });
export const PERSONALITY_LINES = Object.freeze({
  cheerful: Object.freeze({
    hello: say("Oh! Hello, hello! I'm {name}. What a lovely day to meet somebody new!", 'happy'),
    welcome: say("Welcome to Farmy Moon! You'll love it here. Everyone does.", 'happy'),
    again: Object.freeze([say('There you are! What a lovely day for a walk.', 'happy'), say('Oh, hello again! I was just thinking about you.', 'happy')]),
    bye: Object.freeze([say('Bye for now! Come back soon!', 'happy')]),
    calm: say("Don't you worry about me. I'm always fine!", 'happy'),
    more: say("Anything else? I've got all day!", 'happy'),
    gift: say('Coins? For me? Oh, how kind! How many?', 'amazement'),
    goods: say('A present! Ooh, I love presents. What is it?', 'amazement'),
    double: say('And a favourite thing counts twice, you know!', 'happy'),
    favourite: say("And it's my very favourite, too!", 'amazement'),
  }),
  grumpy: Object.freeze({
    hello: say("Hm. You're new. I'm {name}. Mind the grass.", 'frustration'),
    welcome: say('Farmy Moon, they call it. It was quieter before.', 'neutral'),
    again: Object.freeze([say('Oh. You again.', 'neutral'), say('Back in my day, people knocked.', 'frustration')]),
    bye: Object.freeze([say('Yes, yes. Off you go.', 'neutral')]),
    calm: say("I'm fine. I'm always fine. Stop asking.", 'frustration'),
    more: say('Well? Anything else?', 'neutral'),
    gift: say('Coins. Hm. Go on then, how many?', 'neutral'),
    goods: say("A present? Let's see it, then.", 'interest'),
    double: say("Get it right and it counts twice. Most people don't.", 'neutral'),
    favourite: say("...That's my favourite. Don't tell anyone I smiled.", 'happy'),
  }),
  shy: Object.freeze({
    hello: say("Oh - um, hello. I'm {name}. You're new, aren't you?", 'concern'),
    welcome: say("Welcome to Farmy Moon. It's quiet here. I like that.", 'neutral'),
    again: Object.freeze([say('Oh - um, hello.', 'concern'), say("Hello again. I'm glad it's you.", 'happy')]),
    bye: Object.freeze([say('Bye... come again, if you like.', 'happy')]),
    calm: say("It's all right. Really. Please don't worry.", 'concern'),
    more: say('Was there... something else?', 'concern'),
    gift: say("Oh, you shouldn't. How many, um?", 'concern'),
    goods: say('For me? Oh... what is it?', 'amazement'),
    double: say('A favourite thing means twice as much. To me, anyway.', 'neutral'),
    favourite: say("Oh! That's my favourite. How did you know?", 'amazement'),
  }),
  dreamy: Object.freeze({
    hello: say("Oh, hello. I'm {name}. Did you fall from a star?", 'amazement'),
    welcome: say('Welcome to Farmy Moon. The nights here are something else.', 'happy'),
    again: Object.freeze([say('Do you ever just... look at the sky?', 'amazement'), say("Oh, it's you. I was miles away.", 'neutral')]),
    bye: Object.freeze([say('Goodbye... mind the stars on your way.', 'happy')]),
    calm: say("Never mind me. My head's in the clouds again.", 'neutral'),
    more: say('Hm? Oh - was there more?', 'interest'),
    gift: say('Coins? They shine like little moons. How many?', 'amazement'),
    goods: say('A present... I wonder what it is. Show me?', 'interest'),
    double: say('A favourite thing is worth twice as much. Like starlight.', 'happy'),
    favourite: say("My favourite! It's as if you read my dreams.", 'amazement'),
  }),
  bossy: Object.freeze({
    hello: say("Ah, a new face. I'm {name}. I keep this town in order.", 'interest'),
    welcome: say('Welcome to Farmy Moon. Read the notice board. Every day.', 'neutral'),
    again: Object.freeze([say('Someone has to keep this town in order.', 'concern'), say('There you are. Keeping busy, I hope?', 'interest')]),
    bye: Object.freeze([say("Right. Off you go, and don't dawdle.", 'neutral')]),
    calm: say("No fuss. I've handled worse before breakfast.", 'neutral'),
    more: say('Next item. What else?', 'neutral'),
    gift: say('Coins? Sensible. How many are we talking?', 'interest'),
    goods: say('A present? Let me have a proper look.', 'interest'),
    double: say('Rule one: a favourite thing counts twice. Remember that.', 'neutral'),
    favourite: say("And it's my favourite. Well done, you.", 'happy'),
  }),
  curious: Object.freeze({
    hello: say("Ooh, a new face! I'm {name}. Where did you come from?", 'interest'),
    welcome: say("Welcome to Farmy Moon! There's so much to find here.", 'happy'),
    again: Object.freeze([say("Ooh, what's that? Oh - it's you! Hello!", 'amazement'), say('Back again! Found anything good?', 'interest')]),
    bye: Object.freeze([say('Bye! Tell me everything next time.', 'happy')]),
    calm: say('No harm done. I wanted to see what happens anyway.', 'interest'),
    more: say('Ooh, and what else?', 'interest'),
    gift: say('Coins? What are they for? How many?', 'interest'),
    goods: say("What's in your pockets? Show me, show me!", 'amazement'),
    double: say("Did you know a favourite thing counts twice? It's true!", 'interest'),
    favourite: say('My favourite! How did you find out?', 'amazement'),
  }),
  gentle: Object.freeze({
    hello: say("Hello there. I'm {name}. It's good to have you here.", 'happy'),
    welcome: say("Welcome to Farmy Moon. Settle in slowly. We'll look after you.", 'happy'),
    again: Object.freeze([say("Take your time, there's no rush.", 'happy'), say('Hello again, dear. How are you keeping?', 'interest')]),
    bye: Object.freeze([say('Look after yourself. See you soon.', 'happy')]),
    calm: say("It's quite all right. These things happen.", 'happy'),
    more: say('Is there anything else, dear?', 'neutral'),
    gift: say('Oh, you are kind. How many, dear?', 'happy'),
    goods: say("A present? You needn't have. What is it?", 'amazement'),
    double: say('A favourite thing means twice as much. Keep that in mind.', 'neutral'),
    favourite: say('And my favourite, too. Thank you, dear.', 'happy'),
  }),
});




export const LINE_MOODS = Object.freeze({ thanks: 'happy', levelUp: 'amazement', cantGive: 'concern', home: null, hint: null, generic: 'neutral' });



const GENERIC_MOODS = Object.freeze({
  hello: 'happy', welcome: 'happy', again: 'happy', bye: 'happy', calm: 'neutral',
  more: 'neutral', gift: 'amazement', goods: 'amazement', double: 'neutral', favourite: 'amazement',
});
const GENERIC_NODE_TEXT = Object.freeze({
  more: Object.freeze(['Anything else?', 'What else?', 'Hm?']),
  gift: Object.freeze(["Coins? That's so kind. How many?", 'Oh, for me? How much?']),
  goods: Object.freeze(['A present? For me? What is it?', "Ooh, what's in your pockets?"]),
});

const HOME_LINE = Object.freeze({
  none: 'I sleep under the stars for now. One day, a house!',
  building: "I'm building my house! It's going to be lovely.",
  house: "Come by my house sometime. It's small, but it's mine.",
  decorated: 'Have you seen my house? I made it all pretty.',
  garden: "My garden is blooming. I've never been so happy.",
});





export const knockLine = (villager, villagers = []) => `${villagerName(villager, villagers)} peers through the window. "Not today, thank you."`;


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






export function saysFor(species, name, personality) {
  const fill = (s) => s.replaceAll('{name}', name || 'your neighbour').replaceAll('{species}', species || 'villager');
  const generic = { ...GENERIC_LINES, ...GENERIC_NODE_TEXT, double: DOUBLE_LINE, favourite: FAVOURITE_LINE, ...(SPECIES_LINES[species] || {}) };
  const own = PERSONALITY_LINES[personality] || {};
  const one = (k) => {
    const o = own[k];
    if (o) return Array.isArray(o) ? o.map((l) => say(fill(l.text), l.mood)) : say(fill(o.text), o.mood);
    const g = generic[k];
    return Array.isArray(g) ? g.map((s) => say(fill(s), GENERIC_MOODS[k])) : say(fill(g), GENERIC_MOODS[k]);
  };
  const list = (k) => [].concat(one(k));
  return {
    hello: one('hello'), welcome: one('welcome'), again: list('again'), bye: list('bye'), calm: one('calm'),
    more: list('more'), gift: list('gift'), goods: list('goods'), double: one('double'), favourite: one('favourite'),
  };
}


export function linesFor(species, name, personality) {
  const s = saysFor(species, name, personality);
  return { hello: s.hello.text, welcome: s.welcome.text, again: s.again.map((l) => l.text), bye: s.bye.map((l) => l.text), calm: s.calm.text };
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
    const s = saysOf(villager, world);
    let said;
    if (state.step > 0) said = [pick(s.more, world, state, 'again')];
    
    
    
    else if (state.visits === 0) said = [s.hello, s.welcome, say(HOME_LINE[homeStage(villager, t).stage], ownMood(villager, 'home'))];
    else said = [pick(s.again, world, state, 'hello')];
    
    if (state.step === 0) said = [...calendarLines(world, villager, t, noticeBoard(world, t, hourAt(world, t)), nameOf), ...said];
    const goods = giftGoods(world, villager);
    return {
      said,
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
      said: [pick(saysOf(villager, world).gift, world, state, 'gift')],
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
      said: [pick(saysOf(villager, world).goods, world, state, 'goods')],
      choices: [
        ...goods.map(({ good, count, favourite }) => {
          const action = { type: 'gift', villager: villager.id, good, count };
          return { key: `good:${good}`, label: cap(nameOf(good, count)), action, why: whyCannot(world, action, t), want: { kind: 'good', good, count, favourite } };
        }),
        { key: 'back', label: 'Never mind', next: 'greeting' },
      ],
    };
  },

  hint(state, { world, villager }) {
    return { said: [say(hintFor(villager.favourite), ownMood(villager, 'hint')), saysOf(villager, world).double], choices: [{ key: 'goods', label: 'Give a present', next: 'goods' }, something, byeChoice()] };
  },

  thanks(state, { world, villager }) {
    const g = state.gave || { points: 0 };
    const tier = THANKS.find(([below]) => g.points < below)[1];
    const said = [say(pick(tier, world, state, 'thanks'), LINE_MOODS.thanks)];
    if (g.favourite) said.push(saysOf(villager, world).favourite);
    return { said, choices: [something, byeChoice('Bye for now')] };
  },

  levelUp(state, { world, t, villager }) {
    const n = NODE.thanks(state, { world, t, villager });
    const up = state.gave && state.gave.levelUp;
    return { ...n, said: [...n.said, ...(LEVEL_UP[up && up.event] || ["I'm so happy!"]).map((l) => say(l, LINE_MOODS.levelUp))] };
  },

  cantGive(state, { world, villager }) {
    const want = state.want || { kind: 'other' };
    let first;
    if (want.kind === 'coins' && world.coins < want.coins) first = `That's sweet, but you only have ${coinsText(world.coins)} coins.`;
    else if (want.kind === 'good' && (world.pockets[want.good] || 0) < want.count) first = `That's sweet, but you only have ${nameOf(want.good, world.pockets[want.good] || 0)}.`;
    else if (want.kind === 'nothing') first = "That's sweet, but there's nothing in your pockets for me.";
    else first = `Oh! ${state.error || 'Not just now.'}`;
    return { said: [say(first, LINE_MOODS.cantGive), saysOf(villager, world).calm], choices: [something, byeChoice('Bye for now')] };
  },

  bye(state, { world, villager }) {
    return { said: [pick(saysOf(villager, world).bye, world, state, 'bye')], choices: [], end: true };
  },
};


function saysOf(villager, world) {
  return saysFor(villager.species, villagerName(villager, world.villagers || []), personalityOf(villager));
}

function ownMood(villager, what) {
  return LINE_MOODS[what] || PERSONALITIES[personalityOf(villager)].baseline;
}


export function talkNode(state, { world, t }) {
  const villager = villagerOf(world, state);
  const speaker = speakerOf(villager || { species: state.species }, world.villagers || []);
  if (!villager) {
    return { id: 'bye', key: `bye|${state.step}`, speaker: speaker.name, voice: speaker.voice, villager: state.villager, lines: ['...'], moods: ['neutral'], choices: [], look: null, end: true };
  }
  const id = NODE[state.node] ? state.node : 'greeting';
  const n = NODE[id](state, { world, t, villager });
  return {
    id: n.id || id,
    key: `${id}|${state.step}`,
    speaker: speaker.name,
    voice: speaker.voice,
    villager: villager.id,
    
    personality: personalityOf(villager),
    
    
    lines: n.said.map((l) => l.text),
    moods: n.said.map((l) => l.mood),
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
