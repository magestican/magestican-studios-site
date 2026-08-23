









export const TAUNT_LINES = Object.freeze({
  
  kill: [
    'that one\'s going in the freezer',
    'you dropped like a sack of feed',
    'moo-ve over, rookie',
    'barn\'s that way, pal',
    'should\'ve stayed in the hay',
    'oink oink, gg',
    'that was almost a fight',
    'and STAY down',
    'that\'s another one for the tally',
    'you walked into that like it was a gate',
    'i barely aimed',
    'put that on the highlight reel',
    'somebody get a bucket',
    'you had the whole field to hide in',
    'nothing personal. mostly',
    'that\'s what the hooves are for',
  ],
  
  death: [
    'lucky shot, featherweight',
    'i was AFK, obviously',
    'my hooves slipped',
    'lag. definitely lag',
    'enjoy it while it lasts',
    'i\'ll be back in five seconds',
    'that was the ice, not you',
    'i let you have that one',
    'okay. okay. noted',
    'i was reloading, that shouldn\'t count',
    'skill issue. mine',
    'right. now i\'m annoyed',
    'you got me. once',
  ],
  
  capture: [
    'that\'s how you farm',
    'flag\'s in the barn, boys',
    'scoreboard. look at it',
    'too easy',
    'wheelbarrow that one home',
    'and the crowd goes mild',
    'grazing my way to the top',
    'that\'s the harvest',
    'someone write that down',
  ],
  
  conceded: [
    'who was watching the barn?',
    'defend the flag, i\'m begging',
    'that\'s coming out of everyone\'s hay',
    'we had ONE job',
    'the gate was open, wasn\'t it',
    'i\'m not angry, i\'m disappointed',
    'somebody was AFK and it wasn\'t me',
    'right, everyone back',
  ],
  
  chicken: [
    'CHICKEN. every time',
    'that bird had a family',
    'poultry in motion',
    'the bird does not miss',
    'launched. absolutely launched',
    'that\'s free-range damage',
  ],
  
  greet: [
    'let\'s get it',
    'good luck, you\'ll need it',
    'who let the humans in?',
    'stretching my hooves',
    'hooves warm, brain off. let\'s go',
    'i\'ve been up since 4am, i\'m ready',
    'try to make it interesting',
    'first one to the flag gets extra feed',
  ],

  
  
  
  
  
  
  
  
  idle: [
    'anyone else hear that',
    'i\'m just going to stand here menacingly',
    'this ice is genuinely a nightmare',
    'has anyone actually seen the flag',
    'i\'ve been walking for a full minute',
    'lovely weather for it',
    'i think i\'m lost',
    'someone say something, it\'s quiet',
    'guarding. this is what guarding looks like',
    'my hooves are killing me',
    'if i stand still am i a prop',
    'i\'m not lost, i\'m flanking',
    'nice barn',
    'does anyone have a plan or is it vibes',
    'i respect the snow. i fear the snow',
    'brb, grazing',
  ],
});


export const TAUNT_RULES = Object.freeze({
  
  
  
  
  
  
  
  
  chance: 0.45,
  
  perBotCooldown: 8,
  
  
  globalCooldown: 2.6,
  
  
  noRepeatWindow: 10,
  
  
  delay: [0.7, 2.4],
  
  
  
  idleEverySeconds: [9, 18],
  idleChance: 0.55,
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
