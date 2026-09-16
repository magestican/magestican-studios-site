





















import { whyCannot } from '../economy/world.mjs';
import { LAND, STAPLES } from '../economy/tables.mjs';
import { nextParcelPrice } from '../economy/land.mjs';
import { seedOf } from '../voice/mumble.mjs';
import { sugarToBuy } from './interact.mjs';
import { nameOf } from './names.mjs';
import { CAT_NAME } from './people.mjs';

export const SPEAKER = Object.freeze({ name: CAT_NAME, voice: 'cat' });
export const NODES = Object.freeze(['greeting', 'land', 'confirm', 'cantAfford', 'soldOut', 'thanks', 'bye']);

export const MAX_LINE_CHARS = 72;

export const MAX_PARCEL_CHOICES = 3;


export const coinsText = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function startTalk({ visits = 0 } = {}) {
  return { node: 'greeting', visits, step: 0, selected: null, want: null, bought: null, error: null, seenLand: false };
}

function pick(list, world, state, what) {
  return list[seedOf(`${world.seed}|${what}|${state.visits}|${state.step}`) % list.length];
}

const soldOut = (world, land) => world.parcels >= LAND.maxParcels || !land || !land.forSale || land.forSale.length === 0;
const priceOf = (world, land) => (land && Number.isFinite(land.nextPrice) ? land.nextPrice : nextParcelPrice(world));

function sugarChoice(world, t) {
  const count = sugarToBuy(world);
  const price = count * STAPLES.sugar.buy_coins;
  const action = { type: 'buy', good: 'sugar', count };
  return {
    key: 'sugar',
    label: `${cap(nameOf('sugar', count))} - ${coinsText(price)} coins`,
    action,
    why: whyCannot(world, action, t),
    want: { kind: 'sugar', price, count },
  };
}

const something = { key: 'more', label: 'Something else', next: 'greeting' };
const byeChoice = (label = 'Bye for now') => ({ key: 'bye', label, next: 'bye' });

const NODE = {
  greeting(state, { world, t, land }) {
    let lines;
    if (state.step > 0) lines = [pick(['Anything else?', 'What else can I do for you?', 'Something else?'], world, state, 'again')];
    else if (state.visits === 0) lines = ['Oh. You must be the new one.', 'I own the land on this moon. All of it. I sell sugar, too.'];
    else lines = [pick(['Back again. What can I do for you?', 'Ah, you. Sugar, or something bigger?', 'Hello again. Mind the edge.'], world, state, 'hello')];
    return {
      lines,
      choices: [
        sugarChoice(world, t),
        { key: 'land', label: 'About land...', next: soldOut(world, land) ? 'soldOut' : 'land' },
        byeChoice(state.step > 0 ? 'That is all' : 'Just saying hello'),
      ],
    };
  },

  land(state, { world, land }) {
    const price = priceOf(world, land);
    const lines = state.seenLand
      ? ['Which one, then?']
      : [
        `The next parcel is ${coinsText(price)} coins.`,
        'Each one after costs a little more. There is only so much moon.',
        'Have a look at the signs. Any take your fancy?',
      ];
    
    const parcels = land.forSale.slice(0, MAX_PARCEL_CHOICES).map((p) => ({ key: `parcel:${p.id}`, label: cap(p.label), select: p.id }));
    return { lines, choices: [...parcels, byeChoice('Not today')] };
  },

  confirm(state, { world, t, land }) {
    const parcel = land.forSale.find((p) => p.id === land.selected);
    if (!parcel) return { ...NODE.land({ ...state, seenLand: true }, { world, t, land }), id: 'land' };
    const price = priceOf(world, land);
    const action = { type: 'buyParcel', parcel: parcel.id };
    return {
      lines: [`${cap(parcel.label)}? That one is ${coinsText(price)} coins.`],
      look: parcel.id,
      choices: [
        { key: 'buy', label: `Buy it - ${coinsText(price)} coins`, action, why: whyCannot(world, action, t), want: { kind: 'parcel', price, parcel: parcel.id } },
        { key: 'other', label: 'Another one', next: 'land' },
        byeChoice('Not today'),
      ],
    };
  },

  cantAfford(state, { world }) {
    const want = state.want || { kind: 'other', price: 0 };
    const short = want.price - world.coins;
    let lines;
    if (short <= 0) lines = [state.error ? `Hm. ${state.error}` : 'Hm. Not just now.'];
    else if (want.kind === 'sugar') {
      lines = [`Sugar is ${STAPLES.sugar.buy_coins} coins a bag. You're ${coinsText(short)} coins short.`, 'Sell a few apples and come back. I will be here.'];
    } else {
      lines = [
        `That one is ${coinsText(want.price)} coins, and you have ${coinsText(world.coins)}.`,
        `You're ${coinsText(short)} coins short. No rush - the land is not going anywhere.`,
      ];
    }
    return { lines, look: want.kind === 'parcel' ? want.parcel : null, choices: [something, byeChoice('Bye for now')] };
  },

  soldOut(state, { world }) {
    const lines = world.parcels >= LAND.maxParcels
      ? ['I have no more land to sell on this moon.', 'It is all yours now. Look after it.']
      : ['Nothing is for sale just now. Ask me again later.'];
    return { lines, choices: [something, byeChoice('Bye for now')] };
  },

  thanks(state, { world }) {
    const b = state.bought || {};
    let lines;
    if (b.type === 'buyParcel') {
      lines = [pick(['It is yours. Plant something nice on it.', 'Sold. It suits you, that patch.'], world, state, 'land')];
      if (world.parcels >= LAND.maxParcels) lines.push('That was the last of it, by the way.');
      else lines.push(`The next one will be ${coinsText(nextParcelPrice(world))} coins.`);
    } else if (b.type === 'buy') {
      lines = [`There you go - ${nameOf(b.good || 'sugar', b.count || 1)}.`, pick(['Do not eat it all at once.', 'Good jam weather, this.'], world, state, 'sugar')];
    } else {
      lines = ['There you go.'];
    }
    return { lines, look: b.type === 'buyParcel' ? state.selected : null, choices: [something, byeChoice('Thanks, bye')] };
  },

  bye(state, { world }) {
    return { lines: [pick(['Mind how you go.', 'Come by any time.', 'Off you go, then.'], world, state, 'bye')], choices: [], end: true };
  },
};


export function talkNode(state, { world, t, land = { forSale: [], selected: null, nextPrice: null } }) {
  const view = { forSale: [], selected: null, ...land };
  let id = NODE[state.node] ? state.node : 'greeting';
  
  if ((id === 'land' || id === 'confirm') && soldOut(world, view)) id = 'soldOut';
  const n = NODE[id](state, { world, t, land: view });
  return {
    id: n.id || id,
    key: `${id}|${state.step}`,
    speaker: SPEAKER.name,
    voice: SPEAKER.voice,
    lines: n.lines,
    choices: n.choices,
    look: n.look ?? null,
    end: Boolean(n.end),
  };
}






export function choose(state, choice, outcome) {
  if (!choice) return state;
  const base = { ...state, step: state.step + 1, error: null, seenLand: state.seenLand || state.node === 'land' || state.node === 'confirm' };
  if (choice.close) return null;
  if (choice.why) return { ...base, node: 'cantAfford', want: choice.want || null, error: choice.why };
  if (choice.action) {
    if (!outcome || outcome.error) return { ...base, node: 'cantAfford', want: choice.want || null, error: outcome ? outcome.error : 'Nothing happened.' };
    const e = (outcome.events || []).find((x) => x.type === choice.action.type);
    return { ...base, node: 'thanks', bought: e ? { ...e } : { type: choice.action.type } };
  }
  if (choice.select !== undefined) return { ...base, node: 'confirm', selected: choice.select };
  const next = NODES.includes(choice.next) ? choice.next : 'bye';
  return { ...base, node: next, selected: next === 'confirm' ? state.selected : null, want: null, bought: null };
}


export const isEnd = (node) => Boolean(node && node.end);
