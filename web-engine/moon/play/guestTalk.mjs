




























import { whyCannot } from '../economy/world.mjs';
import { GUEST_GIFTS } from '../economy/tables.mjs';
import { GUESTS } from './guests.mjs';
import { nameOf } from './names.mjs';
import { seedOf } from '../voice/mumble.mjs';
import { MAX_LINE_CHARS } from './talk.mjs';
import { EMPTY_LEDGER, applyLine, moodNow } from './moods.mjs';
import { PERSONALITIES } from './personality.mjs';
import { GUEST_NAMES } from './people.mjs';

export { MAX_LINE_CHARS };

export { GUEST_NAMES };
export const NODES = Object.freeze(['greeting', 'about', 'offer', 'thanks', 'refused', 'bye']);


const L = (text, mood) => Object.freeze([text, mood]);
export const GUEST_LINES = Object.freeze({
  fairy: Object.freeze({
    hello: [L('Oh! Hello. I was only passing... the stars were in the way.', 'amazement'),
      L("I'm Stellina. Do you ever just... float, for a while?", 'happy')],
    again: [L('You again. I dreamt you might be here.', 'happy'),
      L('Or was it the other way round? Never mind.', 'amazement')],
    about: [L('I go wherever the light is thinnest. Tonight it was here.', 'amazement'),
      L('Moons are softer than planets. Have you noticed?', 'interest'),
      L('I stay one day. Then I forget where I was going, and go.', 'sad')],
    offer: [L('I could grant a wish. Only one, and only a small one.', 'interest'),
      L('Your orchard ripe tonight, or your young trees a little taller.', 'happy')],
    ripen: [L('There. Every fruit at home is ripe. Go and look.', 'amazement'),
      L('It lasts one picking. Wishes are like that.', 'happy')],
    growth: [L('There. Your little trees have had a dream about growing.', 'amazement'),
      L('When you get home they will have woken up taller.', 'happy')],
    refused: [L('Hm. The wish slipped through my fingers.', 'concern')],
    bye: [L('Goodbye... mind the stars on your way.', 'happy')],
  }),
  mummy: Object.freeze({
    hello: [L('Hm. A visitor. Nobody visits. Three thousand years of it.', 'frustration'),
      L("I'm Amenofi. Mind the bandages, they are older than you.", 'neutral')],
    again: [L('Oh. You again. Back in my day, people knocked.', 'frustration'),
      L('Well. Sit, if you must.', 'neutral')],
    about: [L('I was a king once. Or a king\'s baker. It was a long time ago.', 'neutral'),
      L('They wrapped me for ever. Nobody said how long ever is.', 'frustration'),
      L('Now I walk about on moons. It is quieter than a pyramid.', 'sad')],
    offer: [L('I have this jewel. It was in the tomb with me.', 'neutral'),
      L('Three thousand years and it never once said thank you. Take it.', 'frustration')],
    thanks: [L('There. Do not lose it. I did, for a thousand years.', 'neutral'),
      L('Give it to somebody who deserves it. If you find one.', 'frustration')],
    refused: [L('Hm. No. Not today.', 'frustration')],
    bye: [L('Yes, yes. Off you go. I shall be here. Until I am not.', 'neutral')],
  }),
  werewolf: Object.freeze({
    hello: [L('Oh - sorry, did I startle you? I do that. It\'s the ears.', 'concern'),
      L("I'm Ugo. Take your time, there's no rush.", 'happy')],
    again: [L('Hello again. How have you been? Really?', 'happy'),
      L('You look like you could do with a sit down.', 'concern')],
    about: [L('I only look like this when the moon is up. Which here is always.', 'happy'),
      L('I pick berries, mostly. People expect howling. I am not a howler.', 'neutral'),
      L('Loud noises upset me. I know. A werewolf. Funny, isn\'t it.', 'sad')],
    offer: [L('I picked too many again. Moon berries - they only grow out here.', 'happy'),
      L('Please, have some. They are better shared.', 'happy')],
    thanks: [L('There you are. Eat one on the way home, go on.', 'happy'),
      L('And look after yourself, won\'t you.', 'concern')],
    refused: [L('Oh dear. I seem to have eaten them. I am so sorry.', 'sad')],
    bye: [L('Mind how you go. I mean it.', 'happy')],
  }),
  fox: Object.freeze({
    hello: [L("Ooh, what's that? Oh - it's a person. Even better.", 'interest'),
      L('Rinaldo, dealer in curios. Well. Collector. Well. Finder.', 'happy')],
    again: [L('You! I was hoping. What have you found since?', 'interest'),
      L('Never mind, never mind. Look what I have.', 'amazement')],
    about: [L('I go from moon to moon and pick up what nobody is holding.', 'interest'),
      L('A lady in a frame who smiles at everybody. A bust with no nose.', 'amazement'),
      L('Where did they come from? Now that is a story with no ending.', 'frustration')],
    offer: [L('Here is how it works. One apple, one curio. Wrapped.', 'interest'),
      L('You open it at home. No peeking. That is the fun of it.', 'happy')],
    thanks: [L('A pleasure doing business. Crunchy, too.', 'happy'),
      L('Do not open it here. Well - I cannot stop you. But do not.', 'interest')],
    refused: [L('No apple? Then no curio, I am afraid. Rules of the road.', 'concern'),
      L('Fetch one and come back. I shall wait. A little.', 'interest')],
    bye: [L('Off I go. Somebody somewhere is not holding something.', 'interest')],
  }),
});

const pick = (list, world, state, what) => list[seedOf(`${world.seed}|guest|${state.kind}|${what}|${state.step}`) % list.length];

export function startTalk({ kind, visits = 0 } = {}) {
  if (!GUESTS[kind]) throw new Error(`no guest '${kind}'`);
  return { node: 'greeting', kind, visits, step: 0, gave: null, error: null };
}


export function giftChoices(state, world, t) {
  const kind = state.kind;
  const spec = GUEST_GIFTS[kind];
  const name = GUEST_NAMES[kind];
  if (spec.wishes) {
    const label = { ripen: 'Wish the orchard ripe', growth: 'Wish the young trees taller' };
    return spec.wishes.map((wish) => {
      const action = { type: 'guestGift', kind, wish };
      return { key: `wish:${wish}`, label: label[wish], action, why: whyCannot(world, action, t) };
    });
  }
  const action = { type: 'guestGift', kind };
  const label = spec.price ? `Give ${name} an apple` : kind === 'mummy' ? 'Take the jewel' : 'Take some berries';
  return [{ key: 'gift', label, action, why: whyCannot(world, action, t) }];
}

const byeChoice = (label) => ({ key: 'bye', label, next: 'bye' });

function nodeLines(state, world) {
  const L2 = GUEST_LINES[state.kind];
  switch (state.node) {
    case 'greeting':
      return state.step > 0 ? [pick([L('Something else?', 'interest'), L('Go on.', 'neutral')], world, state, 'more')]
        : state.visits > 0 ? L2.again : L2.hello;
    case 'thanks': {
      const g = state.gave || {};
      if (state.kind === 'fairy') return L2[g.wish] || L2.ripen;
      
      const got = g.good ? nameOf(g.good, g.count || 1) : null;
      return got ? [L(`${got.charAt(0).toUpperCase()}${got.slice(1)}, then.`, L2.thanks[0][1]), ...L2.thanks] : L2.thanks;
    }
    default:
      return L2[state.node] || L2.bye;
  }
}

function nodeChoices(state, world, t) {
  const name = GUEST_NAMES[state.kind];
  const gave = Boolean(world.guest && world.guest.gave) || Boolean(state.gave);
  const ask = gave ? [] : [{ key: 'offer', label: 'Have you anything for me?', next: 'offer' }];
  switch (state.node) {
    case 'greeting': return [{ key: 'about', label: 'Who are you?', next: 'about' }, ...ask, byeChoice('Just saying hello')];
    case 'about': return [...ask, byeChoice(`Goodbye, ${name}`)];
    case 'offer': return [...giftChoices(state, world, t), byeChoice('Not today')];
    case 'thanks': return [byeChoice(`Thank you, ${name}`)];
    case 'refused': return [...ask, { key: 'about', label: 'Tell me about yourself', next: 'about' }, byeChoice('I will come back')];
    default: return [];
  }
}


export function talkNode(state, { world, t }) {
  const id = NODES.includes(state.node) ? state.node : 'greeting';
  const s = { ...state, node: id };
  const pairs = nodeLines(s, world);
  return {
    id,
    key: `${id}|${state.step}`,
    speaker: GUEST_NAMES[state.kind],
    voice: state.kind,
    personality: GUESTS[state.kind].personality,
    lines: pairs.map((p) => p[0]),
    moods: pairs.map((p) => p[1]),
    choices: id === 'bye' ? [] : nodeChoices(s, world, t),
    look: null,
    end: id === 'bye',
  };
}






export function choose(state, choice, outcome) {
  if (!choice) return state;
  if (choice.close) return null;
  const base = { ...state, step: state.step + 1, error: null };
  if (choice.why) return { ...base, node: 'refused', error: choice.why };
  if (choice.action) {
    if (!outcome || outcome.error) return { ...base, node: 'refused', error: outcome ? outcome.error : 'Nothing happened.' };
    const e = (outcome.events || []).find((x) => x.type === 'guestGift');
    return { ...base, node: 'thanks', gave: e ? { ...e } : { type: 'guestGift', kind: state.kind } };
  }
  return { ...base, node: NODES.includes(choice.next) ? choice.next : 'bye' };
}


export const isEnd = (node) => Boolean(node && node.end);







export function guestFace(kind, ledger, tS) {
  const personality = PERSONALITIES[GUESTS[kind].personality];
  return { expression: moodNow(ledger || EMPTY_LEDGER, tS, { personality }), intensity: personality.intensity };
}

export { applyLine, EMPTY_LEDGER };
