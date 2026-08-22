// Bot chat. PURE — no DOM, no THREE, no timers — so the pacing rules are
// testable, which matters more here than anywhere else in the game: the
// failure mode of chatty bots is not that they say the wrong thing, it is that
// they say too much and the chat becomes unreadable noise that humans give up
// on. Every constant below exists to stop that.
//
// Bryan 2026-08-21: "I want bots to be able to taunt in-chat".

// Lines are grouped by the event that earns them. Farm-animal register: these
// are livestock with guns, not marines — trash talk should be daft.
export const TAUNT_LINES = Object.freeze({
  // The bot killed a human.
  kill: [
    'that one\'s going in the freezer',
    'you dropped like a sack of feed',
    'moo-ve over, rookie',
    'barn\'s that way, pal',
    'should\'ve stayed in the hay',
    'oink oink, gg',
    'that was almost a fight',
  ],
  // The bot died.
  death: [
    'lucky shot, featherweight',
    'i was AFK, obviously',
    'my hooves slipped',
    'lag. definitely lag',
    'enjoy it while it lasts',
    'i\'ll be back in five seconds',
  ],
  // The bot's team captured a flag.
  capture: [
    'that\'s how you farm',
    'flag\'s in the barn, boys',
    'scoreboard. look at it',
    'too easy',
  ],
  // The bot's team conceded a flag.
  conceded: [
    'who was watching the barn?',
    'defend the flag, i\'m begging',
    'that\'s coming out of everyone\'s hay',
  ],
  // Someone got obliterated by the chicken slingshot.
  chicken: [
    'CHICKEN. every time',
    'that bird had a family',
    'poultry in motion',
  ],
  // Match start.
  greet: [
    'let\'s get it',
    'good luck, you\'ll need it',
    'who let the humans in?',
    'stretching my hooves',
  ],
});

// Pacing. These are the numbers that keep chat readable.
export const TAUNT_RULES = Object.freeze({
  // Chance a given bot reacts to an event it was involved in. Well under 1 so
  // fifteen bots do not all answer the same kill.
  chance: 0.28,
  // A single bot cannot speak more often than this, seconds.
  perBotCooldown: 14,
  // ...and the whole bot population cannot exceed this, seconds, so a busy
  // fight does not produce a wall of text no matter how many bots are alive.
  globalCooldown: 4.5,
  // Never repeat a line until this many others have been used.
  noRepeatWindow: 6,
  // Reaction delay range, seconds — a bot that answers on the same frame as
  // the kill reads as a script, one that takes a beat reads as a person typing.
  delay: [0.7, 2.4],
});

// Decides whether a bot speaks, and what it says. Pure: caller supplies `now`
// (seconds) and a random source, and owns all the timers.
//
// state: { lastGlobal:number, lastByBot:Map<id,number>, recent:string[] }
export function considerTaunt({ botId, event, state, now, rand = Math.random,
                                rules = TAUNT_RULES, lines = TAUNT_LINES }) {
  const pool = lines[event];
  if (!pool || !pool.length) return null;
  if (now - (state.lastGlobal ?? -Infinity) < rules.globalCooldown) return null;
  if (now - (state.lastByBot.get(botId) ?? -Infinity) < rules.perBotCooldown) return null;
  if (rand() > rules.chance) return null;

  // Avoid anything said recently, so a colony of bots does not chant.
  const fresh = pool.filter((l) => !state.recent.includes(l));
  const usable = fresh.length ? fresh : pool;
  const text = usable[Math.floor(rand() * usable.length) % usable.length];

  state.lastGlobal = now;
  state.lastByBot.set(botId, now);
  state.recent.push(text);
  while (state.recent.length > rules.noRepeatWindow) state.recent.shift();

  const [lo, hi] = rules.delay;
  return { text, delay: lo + rand() * (hi - lo) };
}

export function newTauntState() {
  return { lastGlobal: -Infinity, lastByBot: new Map(), recent: [] };
}
