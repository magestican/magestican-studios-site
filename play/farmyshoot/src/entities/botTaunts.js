




























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
    'straight to the butcher counter',
    'that\'s a wrap, buttercup',
    'i have seen scarecrows put up more',
    'tell the farmer i said hello',
    'back in the pen with you',
    'i did not even spill my feed',
    'that one goes on the barn door',
    'you came at a cow. bold',
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
    'i tripped on a turnip',
    'somebody left the gate open',
    'my hoof caught the trigger, it happens',
    'i was admiring the barn, honestly',
    'that is ONE. i am counting',
    'fine. FINE',
    'i genuinely did not see you there',
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
    'straight into the barn, no notes',
    'that is the whole harvest, gone',
    'i carried that like a prize marrow',
    'put it on the mantelpiece',
    'we are simply better at flags',
    'and i did it all in hooves',
    'somebody milk me, i am on fire',
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
    'the flag has legs now, apparently',
    'i turned around for ONE second',
    'was anybody even in the barn',
    'that is embarrassing for all of us',
    'i need a lie down and a carrot',
    'right. hooves up, heads down',
    'we are giving these away like eggs',
    'no notes. terrible. no notes',
  ],
  
  chicken: [
    'CHICKEN. every time',
    'that bird had a family',
    'poultry in motion',
    'the bird does not miss',
    'launched. absolutely launched',
    'that\'s free-range damage',
    'the chicken has no notes either',
    'that bird flew better than it walked',
    'launched into next tuesday',
    'nobody teach the chickens about this',
    'that is a very fast bird',
    'squawk, and then nothing',
    'the bird wins again',
    'i am on the bird\'s side now',
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
    'hooves up, let\'s be silly',
    'i had a big breakfast, watch out',
    'may the best animal win. it is me',
    'right, where is the flag',
    'i\'ll go easy. probably',
    'fresh hay, fresh start',
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
    'i can hear my own hooves and nothing else',
    'is the flag on a break as well',
    'found a nice fence. that is the update',
    'genuinely lovely bit of grass over here',
    'if anyone needs me i am behind the barn',
    'i have made a friend. it is a rock',
    'do we get paid for this',
    'still walking. still nothing',
    'i am starting a podcast about this map',
    'someone shoot something, i am getting sleepy',
  ],

  
  
  
  
  
  
  
  
  
  losing: [
    'right, everyone up. we are being farmed',
    'this is not our finest hour',
    'we are losing to THESE',
    'i refuse to accept that scoreboard',
    'plan B. does anybody have a plan A',
    'okay. new strategy: try',
    'i have been carrying and i am ONE cow',
    'we can still make this a comeback story',
    'please stop dying so enthusiastically',
    'chins up. hooves up',
    'the scoreboard is lying. it is not, but still',
    'i have seen worse. not today, but i have',
    'we are one good push from a different story',
    'nobody panic. i am panicking, but nobody else',
  ],
  winning: [
    'do not get comfortable, keep pushing',
    'this is going suspiciously well',
    'nobody say anything, we will jinx it',
    'i would like to thank the hay',
    'we are simply farming today',
    'keep it tidy, keep it boring',
    'scoreboard is looking lovely',
    'save some for the others. actually, do not',
    'this is what practice looks like',
    'i am going to be insufferable about this',
    'best barn. best animals',
    'steady on. no showboating. much',
    'i am putting this round in my memoirs',
    'lovely stuff. do it again',
  ],
});







export const TAUNT_RULES = Object.freeze({
  
  
  
  
  
  
  chance: 0.6,
  
  
  
  perBotCooldown: 6,
  
  
  
  
  globalCooldown: 2.0,
  
  
  noRepeatWindow: 12,
  
  
  
  
  delay: [0.5, 1.9],
  
  
  
  
  
  
  
  idleEverySeconds: [4, 9],
  idleChance: 0.8,
  
  
  
  
  
  
  
  
  
  silenceBypassSeconds: 12,
});













export function considerTaunt({ botId, event, state, now, rand = Math.random,
                                rules = TAUNT_RULES, lines = TAUNT_LINES }) {
  const pool = lines[event];
  if (!pool || !pool.length) return null;
  const sinceGlobal = now - (state.lastGlobal ?? -Infinity);
  if (sinceGlobal < rules.globalCooldown) return null;
  if (now - (state.lastByBot.get(botId) ?? -Infinity) < rules.perBotCooldown) return null;
  
  
  const silent = sinceGlobal >= (rules.silenceBypassSeconds ?? Infinity);
  if (!silent && rand() > rules.chance) return null;

  
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




export const MOOD_MARGIN = 2;









export function pickIdleEvent({ myScore = 0, theirScore = 0, rand = Math.random,
                                moodChance = 0.5, margin = MOOD_MARGIN } = {}) {
  const diff = (Number(myScore) || 0) - (Number(theirScore) || 0);
  if (Math.abs(diff) >= margin && rand() < moodChance) {
    return diff < 0 ? 'losing' : 'winning';
  }
  return 'idle';
}

export function newTauntState() {
  return { lastGlobal: -Infinity, lastByBot: new Map(), recent: [] };
}
