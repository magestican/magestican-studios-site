









export const TAUNT_LINES = Object.freeze({
  
  kill: [
    'that one\'s going in the freezer',
    'you dropped like a sack of feed',
    'moo-ve over, rookie',
    'barn\'s that way, pal',
    'should\'ve stayed in the hay',
    'oink oink, gg',
    'that was almost a fight',
  ],
  
  death: [
    'lucky shot, featherweight',
    'i was AFK, obviously',
    'my hooves slipped',
    'lag. definitely lag',
    'enjoy it while it lasts',
    'i\'ll be back in five seconds',
  ],
  
  capture: [
    'that\'s how you farm',
    'flag\'s in the barn, boys',
    'scoreboard. look at it',
    'too easy',
  ],
  
  conceded: [
    'who was watching the barn?',
    'defend the flag, i\'m begging',
    'that\'s coming out of everyone\'s hay',
  ],
  
  chicken: [
    'CHICKEN. every time',
    'that bird had a family',
    'poultry in motion',
  ],
  
  greet: [
    'let\'s get it',
    'good luck, you\'ll need it',
    'who let the humans in?',
    'stretching my hooves',
  ],
});


export const TAUNT_RULES = Object.freeze({
  
  
  chance: 0.28,
  
  perBotCooldown: 14,
  
  
  globalCooldown: 4.5,
  
  noRepeatWindow: 6,
  
  
  delay: [0.7, 2.4],
});





export function considerTaunt({ botId, event, state, now, rand = Math.random,
                                rules = TAUNT_RULES, lines = TAUNT_LINES }) {
  const pool = lines[event];
  if (!pool || !pool.length) return null;
  if (now - (state.lastGlobal ?? -Infinity) < rules.globalCooldown) return null;
  if (now - (state.lastByBot.get(botId) ?? -Infinity) < rules.perBotCooldown) return null;
  if (rand() > rules.chance) return null;

  
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
