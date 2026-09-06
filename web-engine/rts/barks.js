





















import { HERD, YIELD, UNITS } from './roster.js';
import { TICKS_PER_SECOND } from './fixed.js';










export const HERD_FORBIDDEN = Object.freeze([
  'deploy', 'deployed', 'resource', 'resources', 'enemy', 'enemies',
  'unit', 'units', 'build', 'building', 'economy', 'upgrade', 'tech',
  'squad', 'troops', 'reinforce', 'objective', 'target',
]);










export const YIELD_FORBIDDEN = Object.freeze([
  'kill', 'kills', 'killing', 'slaughter', 'butcher', 'murder', 'die', 'dead',
  'attack', 'destroy', 'animal', 'animals', 'beast', 'beasts', 'creature',
]);


export const VOICE_OF = Object.freeze({
  flock: 'chicken',
  duckRaft: 'duck',
  skulk: 'fox',
  sounder: 'pig',
  horseHerd: 'horse',
  wing: 'eagle',
  pride: 'lion',
  elephant: 'elephant',
  
  
  
  farmhand: 'human',
  harvester: 'human',
  bowser: 'human',
  quadBike: 'machine',
  tractor: 'machine',
  poundWagon: 'machine',
  foodTruck: 'machine',
  cropDuster: 'machine',
  combine: 'machine',
});









export const LINES = Object.freeze({
  chicken: {
    select: ['We are awake.', 'All of us. Yes.', 'We hear you.'],
    move: ['Going. Going now.', 'That way. Together.', 'We run.'],
    capture: ['This ground is ours.', 'We stand here now.', 'Ours. All ours.'],
    attack: ['Get them. Get them.', 'Now. All at once.', 'Take it back.'],
    lost: ['Fewer of us now.', 'Some are gone.'],
  },
  duck: {
    select: ['The water knows us.', 'We float, we listen.'],
    move: ['Downstream. Come on.', 'To the water.'],
    capture: ['The dam is clean.', 'This water breathes.'],
    attack: ['Off our water.', 'Not here. Leave.'],
    lost: ['The water is red.'],
  },
  fox: {
    select: ['I have been counting them for you.', 'Everything is where I said it was.'],
    move: ['I will go and look, quietly.', 'Nobody will notice me leaving.'],
    capture: ['They never even fenced this one.', 'Taken, and nobody has noticed yet.'],
    attack: ['They are slower than they think they are.', 'This will be embarrassing for them.'],
    lost: ['I was seen. That was careless of me.'],
  },
  pig: {
    select: ['We are here.', 'Solid. Ready.'],
    move: ['Moving up.', 'We push forward.'],
    capture: ['Held. Ours.', 'Nothing moves us.'],
    attack: ['Through them.', 'Break the line.'],
    lost: ['We felt that.'],
  },
  horse: {
    select: ['We remember the shape of every field before the fences came.'],
    move: ['Run with us and do not stop until the ground changes under you.'],
    capture: ['The old paths are open again and they run all the way through.'],
    attack: ['Come with us now and do not look at what is behind you.'],
    lost: ['One of us has stopped running and the rest go on.'],
  },
  eagle: {
    select: ['We see the whole valley.', 'From up here, everything.'],
    move: ['Circling now.', 'We go high.'],
    capture: ['Watched. It is ours.', 'Nothing crosses unseen.'],
    attack: ['Down. Now.', 'Straight down on them.'],
    lost: ['Something has fallen.'],
  },
  lion: {
    select: ['I was not asked to come.', 'You know what I am for.'],
    move: ['I will walk there.', 'It is not far for me.'],
    capture: ['This is mine to keep now.', 'Nothing else will claim it.'],
    attack: ['Stand still. It is easier.', 'You should not have built here.'],
    lost: ['That was expensive for them.'],
  },
  elephant: {
    select: ['I have been awake far longer than any of you and I remember all of it.'],
    move: ['I will come, and the ground will know that I am coming long before I arrive.'],
    capture: ['This place was here before the farm and it will be here long after.'],
    attack: ['I am not angry with you. I am simply going to walk through where you are standing.'],
    lost: ['Something very old has stopped, and the field is quieter for it.'],
  },
  monkey: {
    select: ['Up here. Watching.', 'We have plenty of stones.'],
    attack: ['Stones. Lots of them.', 'Right on their heads.'],
  },
  human: {
    select: ['Yeah, standing by.', 'On the ground, ready.', 'Got it.'],
    move: ['Moving to position.', 'On my way over.', 'Heading across.'],
    capture: ['Sector secured, logging it.', 'This block is ours now.'],
    attack: ['Beginning recovery on that group.', 'Moving in to contain them.'],
    lost: ['We are taking losses out here.', 'I need support, now.'],
    build: ['Structure is up and certified.', 'Facility is online.'],
  },
  machine: {
    select: ['Unit ready, over.', 'Cab is live, standing by.'],
    move: ['Repositioning now, over.', 'Rolling to the new grid.'],
    capture: ['Grid reference secured, over.', 'Block is under management.'],
    attack: ['Commencing stock recovery, over.', 'Moving to contain the asset.'],
    lost: ['We have lost a unit out here.', 'Taking damage, requesting support.'],
    build: ['Plant is operational, over.'],
  },
});







export const ANNOUNCER = Object.freeze({
  matchStart: 'Ten minutes. Hold the most ground.',
  halfway: 'Five minutes remaining.',
  oneMinute: 'One minute.',
  leadTaken: 'You have the lead.',
  leadLost: 'You have lost the lead.',
  win: 'The land is yours.',
  lose: 'You held less ground.',
  rout: 'It is over. They have everything.',
});









export const GLOBAL_COOLDOWN_TICKS = 4 * TICKS_PER_SECOND;
export const SPEAKER_COOLDOWN_TICKS = 12 * TICKS_PER_SECOND;







export const ANNOUNCER_COOLDOWN_TICKS = 2 * TICKS_PER_SECOND;


export function createBarkState() {
  return {
    lastTick: -9999,
    lastAnnouncerTick: -9999,
    
    bySpeaker: Object.create(null),
    
    bagUsed: Object.create(null),
  };
}












function fromBag(state, key, lines, rng) {
  if (lines.length === 1) return lines[0];
  const used = state.bagUsed[key] || 0;
  
  
  const i = used % lines.length;
  if (i === 0) state.bagOrder = state.bagOrder || Object.create(null);
  if (i === 0) {
    const order = [];
    for (let n = 0; n < lines.length; n += 1) order.push(n);
    
    for (let n = order.length - 1; n > 0; n -= 1) {
      const j = rng.below(n + 1);
      const t = order[n]; order[n] = order[j]; order[j] = t;
    }
    state.bagOrder[key] = order;
  }
  state.bagUsed[key] = used + 1;
  const order = (state.bagOrder && state.bagOrder[key]) || null;
  return lines[order ? order[i] : i];
}











export function requestBark(state, tick, voice, event, rng) {
  const bank = LINES[voice];
  if (!bank) return null;
  const lines = bank[event];
  if (!lines || lines.length === 0) return null;
  if (tick - state.lastTick < GLOBAL_COOLDOWN_TICKS) return null;
  const key = `${voice}.${event}`;
  const last = state.bySpeaker[voice];
  if (last !== undefined && tick - last < SPEAKER_COOLDOWN_TICKS) return null;

  const text = fromBag(state, key, lines, rng);
  const index = lines.indexOf(text);
  state.lastTick = tick;
  state.bySpeaker[voice] = tick;
  return { voice, event, text, clip: `${voice}.${event}.${index}` };
}


export function requestAnnouncement(state, tick, event) {
  const text = ANNOUNCER[event];
  if (!text) return null;
  if (tick - state.lastAnnouncerTick < ANNOUNCER_COOLDOWN_TICKS) return null;
  state.lastAnnouncerTick = tick;
  return { voice: 'announcer', event, text, clip: `announcer.${event}` };
}


export function voiceForUnit(unitId) {
  return VOICE_OF[unitId] || null;
}


export function factionOfVoice(voice) {
  if (voice === 'human' || voice === 'machine') return YIELD;
  if (voice === 'announcer') return null;
  return HERD;
}









export function everyClipId() {
  const out = [];
  for (const [voice, events] of Object.entries(LINES)) {
    for (const [event, lines] of Object.entries(events)) {
      lines.forEach((_, i) => out.push(`${voice}.${event}.${i}`));
    }
  }
  for (const event of Object.keys(ANNOUNCER)) out.push(`announcer.${event}`);
  return out;
}
