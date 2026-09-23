

































import { whyCannot } from '../economy/world.mjs';
import { UNDERGROUND } from '../economy/tables.mjs';
import { MOLE_PERSONALITY } from './personality.mjs';
import { seedOf } from '../voice/mumble.mjs';
import { nameOf } from './names.mjs';
import { MOLE_NAME } from './people.mjs';
import { MAX_LINE_CHARS, coinsText } from './talk.mjs';

export { MAX_LINE_CHARS };

export const SPEAKER = Object.freeze({ name: MOLE_NAME, voice: 'mole' });
export const NODES = Object.freeze(['greeting', 'likes', 'dislikes', 'truffle', 'thanks', 'cantAfford', 'bye']);



export const MOLE_GOOD = 'truffle';
export const TRUFFLE_COINS = UNDERGROUND[MOLE_GOOD].buy_coins;

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function startTalk({ visits = 0 } = {}) {
  return { node: 'greeting', visits, step: 0, want: null, bought: null, error: null, took: false, heard: { likes: false, dislikes: false } };
}

const pick = (list, world, state, what) => list[seedOf(`${world.seed}|mole|${what}|${state.visits}|${state.step}`) % list.length];







export const givesIt = (state) => state.visits === 0 && !state.took;

function truffleChoice(state, world, t) {
  const first = givesIt(state);
  const action = { type: 'buyUnderground', good: MOLE_GOOD, count: 1, first };
  const price = first ? 0 : TRUFFLE_COINS;
  return {
    key: 'truffle',
    label: first ? 'Take the truffle' : `Buy a truffle - ${coinsText(price)} coins`,
    action,
    why: whyCannot(world, action, t),
    want: { kind: MOLE_GOOD, price },
  };
}

const byeChoice = (label = 'I will leave you to it') => ({ key: 'bye', label, next: 'bye' });
const something = { key: 'more', label: 'Something else', next: 'greeting' };

const NODE = {
  greeting(state, { world, t }) {
    let lines;
    if (state.step > 0) {
      lines = [pick(['Something else, was it?', 'Go on, then.', 'What else.'], world, state, 'again')];
    } else if (state.visits === 0) {
      lines = [
        'Oh. Oh, it is very bright up here. Give me a moment.',
        'You are the new one, then. I am Cosimo. I live under your farm.',
        'I was here first, mind. I shall not be any trouble.',
      ];
    } else {
      lines = [pick([
        'You again. Shut the sun off, would you.',
        'Back down here, are we. Hello.',
        'I heard you coming. You walk like a wheelbarrow.',
      ], world, state, 'hello')];
    }
    return {
      lines,
      choices: [
        { key: 'likes', label: 'What do you like?', next: 'likes' },
        { key: 'dislikes', label: 'And what do you not?', next: 'dislikes' },
        { key: 'ask', label: 'Anything down there for me?', next: 'truffle' },
        byeChoice(state.step > 0 ? 'That is all' : 'Just saying hello'),
      ],
    };
  },

  likes(state, { world }) {
    const lines = [
      'Worms. A good long one, still cold from the deep soil.',
      'Truffles, when I can find them. Better than any of your apples.',
      pick([
        'And the quiet. Down there it is dark and quiet and nothing looks at you.',
        'And rain, heard from underneath. Drumming away up there. Lovely.',
        'And the quiet, mostly. You would be amazed how loud grass is.',
      ], world, state, 'likes'),
    ];
    return {
      lines,
      choices: [
        { key: 'dislikes', label: 'And what do you not?', next: 'dislikes' },
        { key: 'ask', label: 'Anything down there for me?', next: 'truffle' },
        byeChoice(),
      ],
    };
  },

  dislikes(state, { world }) {
    const lines = [
      'Light. Obviously. Look at me, I am squinting at you now.',
      pick([
        'It is not that it hurts. It is that it will not stop.',
        'A whole sky of it, and none of it asked my permission.',
        'Down there I can see nothing and it suits me beautifully.',
      ], world, state, 'dark'),
      pick([
        'Then: noise. Boots. Being looked at. Birds, chiefly.',
        'Then: boots. Whistling. Anyone standing on my roof.',
        'Then: birds. Do not get me started on birds.',
      ], world, state, 'dislikes'),
    ];
    return {
      lines,
      choices: [
        { key: 'likes', label: 'What do you like, then?', next: 'likes' },
        { key: 'ask', label: 'Anything down there for me?', next: 'truffle' },
        byeChoice(),
      ],
    };
  },

  truffle(state, { world, t }) {
    const lines = givesIt(state)
      ? [
        'As it happens, yes. Dug this up an hour ago, under your apples.',
        'A truffle. You will not find one in any shop - they only grow',
        'down where I am. Take it. I cannot carry the pair of them.',
      ]
      : [
        pick([
          'I have another. It costs, mind. Digging is work.',
          'One more, yes. Not free this time - I had to go deep.',
          'There is one. You are getting a taste for them, I see.',
        ], world, state, 'sell'),
        `A truffle is ${coinsText(TRUFFLE_COINS)} coins, and worth ten of that as a gift.`,
      ];
    return { lines, choices: [truffleChoice(state, world, t), something, byeChoice('Not today')] };
  },

  thanks(state, { world }) {
    const b = state.bought || {};
    const lines = b.coins > 0
      ? [`${cap(nameOf(MOLE_GOOD, b.count || 1))}, then. Do not drop it in the light.`,
        pick(['Give it to somebody. They will never have seen one.', 'Best thing on this moon, and it never sees the sun.'], world, state, 'sold')]
      : ['There. Do not tell the cat. He would try to sell you one.',
        'Mind how you carry it. And mind where you tread, come to that.'];
    return { lines, choices: [something, byeChoice('Thank you, Cosimo')] };
  },

  cantAfford(state, { world }) {
    const want = state.want || { kind: MOLE_GOOD, price: TRUFFLE_COINS };
    const short = want.price - world.coins;
    const lines = short > 0
      ? [`A truffle is ${coinsText(want.price)} coins and you have ${coinsText(world.coins)}.`,
        `You are ${coinsText(short)} short. It will keep. So shall I.`]
      : [state.error ? `Hm. ${state.error}` : 'Hm. Not just now.'];
    return { lines, choices: [something, byeChoice()] };
  },

  bye(state, { world }) {
    return {
      lines: [pick([
        'Right. Down I go. Mind where you tread.',
        'Goodbye. Do not follow the dirt, it is rude.',
        'Back to the dark, then. Much obliged.',
      ], world, state, 'bye')],
      choices: [],
      end: true,
    };
  },
};




export const MOLE_MOODS = Object.freeze({
  greeting: 'concern', likes: 'happy', dislikes: 'sad', truffle: 'interest', thanks: 'amazement', cantAfford: 'concern', bye: 'happy',
});

export function talkNode(state, { world, t }) {
  const id = NODE[state.node] ? state.node : 'greeting';
  const n = NODE[id](state, { world, t });
  return {
    id,
    key: `${id}|${state.step}`,
    speaker: SPEAKER.name,
    voice: SPEAKER.voice,
    
    personality: MOLE_PERSONALITY,
    lines: n.lines,
    moods: n.lines.map(() => MOLE_MOODS[id] || 'concern'),
    choices: n.choices,
    look: null,
    end: Boolean(n.end),
  };
}






export function choose(state, choice, outcome) {
  if (!choice) return state;
  const heard = {
    likes: state.heard.likes || state.node === 'likes',
    dislikes: state.heard.dislikes || state.node === 'dislikes',
  };
  const base = { ...state, step: state.step + 1, error: null, heard };
  if (choice.close) return null;
  if (choice.why) return { ...base, node: 'cantAfford', want: choice.want || null, error: choice.why };
  if (choice.action) {
    if (!outcome || outcome.error) return { ...base, node: 'cantAfford', want: choice.want || null, error: outcome ? outcome.error : 'Nothing happened.' };
    const e = (outcome.events || []).find((x) => x.type === choice.action.type);
    return { ...base, node: 'thanks', took: true, bought: e ? { ...e } : { type: choice.action.type, count: 1, coins: 0 } };
  }
  const next = NODES.includes(choice.next) ? choice.next : 'bye';
  return { ...base, node: next, want: null, bought: null };
}


export const isEnd = (node) => Boolean(node && node.end);
