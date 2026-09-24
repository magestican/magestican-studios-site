




































import { seedOf } from '../voice/mumble.mjs';
import { personalityOf } from './personality.mjs';
import { EVENT_HOURS, eventFor } from './calendar.mjs';

export const MINUTES_PER_DAY = 1440;

export const DAY_FROM_MIN = 6 * 60;
export const DAY_TO_MIN = 22 * 60;

export const PLACE_KEYS = Object.freeze(['home', 'friend', 'shelter']);








export const BEDTIME_MIN = Object.freeze({
  grumpy: 20 * 60 + 45, shy: 21 * 60, gentle: 21 * 60 + 15, bossy: 21 * 60 + 30,
  curious: 21 * 60 + 45, cheerful: 22 * 60, dreamy: 22 * 60,
});
export const WIND_DOWN_MIN = 30;
export const bedtimeOf = (villager) => BEDTIME_MIN[personalityOf(villager)] ?? DAY_TO_MIN;

export function asleepAt(block, minute) {
  if (!block || block.id !== 'sleep') return false;
  return block.from === 0 || minute - block.from >= WIND_DOWN_MIN;
}

const always = () => 0;
const w = (base, { day = null, rainy = null } = {}) => (personality, hour, weather) => {
  if (weather === 'rain' && rainy === false) return 0;
  if (day && (hour < day[0] || hour >= day[1])) return 0;
  return base[personality] || 0;
};








export const ACTIVITIES = Object.freeze(Object.fromEntries([
  
  { id: 'sleep', indoors: true, kind: 'home', where: 'home', use: null, clip: null, wants: 'sleep', mood: 'sleepy', minutes: [0, 0], outdoor: false, weight: always },
  { id: 'breakfast', indoors: true, kind: 'home', where: 'home', use: null, clip: 'sit', wants: 'eat', mood: 'happy', minutes: [20, 35], outdoor: false, weight: always },
  { id: 'morningWalk', kind: 'spot', where: 'town', use: null, clip: null, mood: null, minutes: [15, 30], outdoor: true, weight: always },
  { id: 'lunch', kind: 'use', where: 'town', use: 'seat', clip: 'sit', wants: 'eat', mood: 'happy', minutes: [35, 50], outdoor: true, weight: always },
  { id: 'evening', kind: 'use', where: 'firepit', use: 'warm', clip: 'warmHands', mood: 'happy', minutes: [0, 0], outdoor: true, weight: always },
  { id: 'shelter', indoors: true, kind: 'home', where: 'shelter', use: null, clip: null, mood: 'concern', minutes: [20, 40], outdoor: false, weight: always },
  
  
  
  { id: 'birthday', kind: 'spot', where: 'town', use: null, clip: null, mood: 'happy', minutes: [0, 0], outdoor: false, weight: always },
  { id: 'marketGather', kind: 'spot', where: 'town', use: null, clip: null, mood: 'interest', minutes: [0, 0], outdoor: true, weight: always },
  
  { id: 'chatNearest', kind: 'pair', where: 'town', use: null, clip: 'chat', mood: 'happy', minutes: [10, 20], outdoor: true,
    weight: w({ cheerful: 4, curious: 1, gentle: 1 }) },
  { id: 'feedBirds', kind: 'spot', where: 'orchard', use: null, clip: 'pickUp', mood: 'happy', minutes: [15, 25], outdoor: true,
    weight: w({ cheerful: 3, gentle: 1 }, { day: [7, 18] }) },
  { id: 'hum', kind: 'use', where: 'town', use: 'seat', clip: 'sit', mood: 'happy', minutes: [10, 20], outdoor: true,
    weight: w({ cheerful: 2 }) },
  { id: 'sweepPorch', kind: 'home', where: 'home', use: null, clip: 'sweep', mood: 'frustration', minutes: [15, 25], outdoor: true,
    weight: w({ grumpy: 4 }, { day: [7, 18] }) },
  { id: 'sitAloneFirepit', kind: 'use', where: 'firepit', use: 'warm', clip: 'warmHands', mood: 'frustration', minutes: [20, 35], outdoor: true,
    weight: w({ grumpy: 3 }) },
  { id: 'grumbleWeather', kind: 'spot', where: 'shop', use: null, clip: null, mood: 'frustration', minutes: [10, 20], outdoor: true,
    weight: w({ grumpy: 2 }) },
  { id: 'tendFlowers', kind: 'home', where: 'home', use: null, clip: 'water', mood: 'concern', minutes: [15, 30], outdoor: true,
    weight: w({ shy: 4, gentle: 1 }, { day: [7, 18] }) },
  
  
  
  { id: 'fish', kind: 'spot', where: 'town', use: null, clip: 'fish', mood: 'sleepy', minutes: [25, 40], outdoor: true,
    weight: w({ shy: 3, dreamy: 1 }) },
  { id: 'farBench', kind: 'use', where: 'town', use: 'seat', clip: 'sit', mood: 'concern', minutes: [15, 25], outdoor: true,
    weight: w({ shy: 2 }) },
  { id: 'watchFountain', kind: 'use', where: 'town', use: 'seat', clip: 'sit', mood: 'amazement', minutes: [20, 35], outdoor: false,
    weight: w({ dreamy: 4 }) },
  { id: 'wanderOrchard', kind: 'spot', where: 'orchard', use: null, clip: null, mood: 'amazement', minutes: [15, 30], outdoor: false,
    weight: w({ dreamy: 3, curious: 1 }) },
  { id: 'inspectSquare', kind: 'spot', where: 'town', use: null, clip: null, mood: 'concern', minutes: [10, 20], outdoor: true,
    weight: w({ bossy: 4 }) },
  { id: 'readBoard', kind: 'spot', where: 'shop', use: null, clip: null, mood: 'interest', minutes: [10, 15], outdoor: true,
    weight: w({ bossy: 2, curious: 3 }) },
  { id: 'lookAtItems', kind: 'spot', where: 'orchard', use: null, clip: null, mood: 'interest', minutes: [10, 20], outdoor: true,
    weight: w({ curious: 3, bossy: 1 }) },
  { id: 'waterFlowerBoxes', kind: 'spot', where: 'town', use: null, clip: 'water', mood: 'happy', minutes: [15, 25], outdoor: true,
    weight: w({ gentle: 3 }, { day: [7, 18] }) },
  { id: 'warmHands', kind: 'use', where: 'firepit', use: 'warm', clip: 'warmHands', mood: 'happy', minutes: [15, 25], outdoor: true,
    weight: w({ gentle: 2, cheerful: 1 }) },
  { id: 'visitFriend', kind: 'spot', where: 'friend', use: null, clip: null, mood: 'happy', minutes: [20, 35], outdoor: true,
    weight: w({ gentle: 3, cheerful: 1 }) },
].map((row) => [row.id, Object.freeze(row)])));

export const FIXED = Object.freeze(['sleep', 'breakfast', 'morningWalk', 'lunch', 'evening', 'shelter', 'birthday', 'marketGather']);
export const HOBBIES = Object.freeze(Object.keys(ACTIVITIES).filter((id) => !FIXED.includes(id)));



export const ANCHORS = Object.freeze({
  wake: [DAY_FROM_MIN, DAY_FROM_MIN + 10],
  lunch: [12 * 60, 12 * 60 + 20],
  evening: [19 * 60, 19 * 60 + 15],
  snowEveningEarlierMin: 60,
});

const cache = new Map();








export function scheduleFor(villager, localDay, world, { weather = 'clear', owl = false } = {}) {
  
  const event = eventFor(villager, localDay, world);
  const key = `${world.seed}|${villager.id}|${villager.species}|${localDay}|${weather}|${owl}|${event}`;
  if (cache.has(key)) return cache.get(key);
  const personality = personalityOf(villager);
  const unit = (what) => (seedOf(`${world.seed}|l3|${villager.id}|${localDay}|${what}`) % 10007) / 10007;
  const span = (range, what) => Math.round(range[0] + unit(what) * (range[1] - range[0]));
  const rain = weather === 'rain';
  const sheltered = (id) => (rain && personality !== 'dreamy' && ACTIVITIES[id].outdoor ? 'shelter' : id);
  const out = [];
  let cursor = 0;
  const push = (id, to) => {
    if (to <= cursor) return;
    const last = out[out.length - 1];
    if (last && last.id === id) last.to = to;
    else out.push({ id, from: cursor, to });
    cursor = to;
  };
  let k = 0;
  const fill = (until) => {
    while (cursor < until) {
      const hour = cursor / 60;
      const prev = out.length ? out[out.length - 1].id : null;
      const options = HOBBIES
        .map((id) => [id, ACTIVITIES[id].weight(personality, hour, weather)])
        .filter(([id, wt]) => wt > 0 && id !== prev);
      let id = 'morningWalk';
      if (options.length) {
        const total = options.reduce((n, [, wt]) => n + wt, 0);
        let r = unit(`hobby${k}`) * total;
        id = options[options.length - 1][0];
        for (const [o, wt] of options) { if (r < wt) { id = o; break; } r -= wt; }
      }
      const len = span(ACTIVITIES[id].minutes, `len${k}`);
      k += 1;
      
      const to = until - (cursor + len) < 10 ? until : cursor + len;
      push(sheltered(id), to);
    }
  };
  const wake = span(ANCHORS.wake, 'wake');
  push(owl ? 'free' : 'sleep', wake);
  push('breakfast', wake + span(ACTIVITIES.breakfast.minutes, 'breakfast'));
  push(sheltered('morningWalk'), cursor + span(ACTIVITIES.morningWalk.minutes, 'walk'));
  const lunchAt = span(ANCHORS.lunch, 'lunch');
  if (event) {
    fill(EVENT_HOURS[event].from);
    push(sheltered(event), lunchAt);
  }
  fill(lunchAt);
  push(sheltered('lunch'), lunchAt + span(ACTIVITIES.lunch.minutes, 'lunchLen'));
  const eveningAt = span(ANCHORS.evening, 'evening') - (weather === 'snow' ? ANCHORS.snowEveningEarlierMin : 0);
  fill(eveningAt);
  if (owl) {
    push(sheltered('evening'), MINUTES_PER_DAY);
  } else {
    push(sheltered('evening'), Math.min(DAY_TO_MIN, bedtimeOf(villager)));
    push('sleep', MINUTES_PER_DAY);
  }
  const plan = Object.freeze(out.map((b) => Object.freeze(b)));
  if (cache.size > 256) cache.delete(cache.keys().next().value);
  cache.set(key, plan);
  return plan;
}


export function blockAt(schedule, minute) {
  const m = ((minute % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  for (let i = 0; i < schedule.length; i++) {
    if (m >= schedule[i].from && m < schedule[i].to) return { block: schedule[i], prev: schedule[i - 1] || null, index: i };
  }
  return { block: schedule[schedule.length - 1], prev: schedule[schedule.length - 2] || null, index: schedule.length - 1 };
}


export const activityOf = (id) => ACTIVITIES[id] || null;









export const STAND = Object.freeze({ maxS: 130, everyS: Object.freeze([60, 130]), stepM: Object.freeze([0.6, 1.3]) });






export function standDrift(seedKey, elapsedS, walkMps = 1, cfg = STAND) {
  const u = (what) => (seedOf(`${seedKey}|drift|${what}`) % 10007) / 10007;
  const periodS = cfg.everyS[0] + u('period') * (cfg.everyS[1] - cfg.everyS[0]);
  const at = (n) => {
    if (n <= 0) return { x: 0, z: 0 };
    const a = n * 2.4 + (u(`a${n}`) - 0.5) * 0.6;
    const r = cfg.stepM[0] + u(`r${n}`) * (cfg.stepM[1] - cfg.stepM[0]);
    return { x: Math.sin(a) * r, z: Math.cos(a) * r };
  };
  const index = Math.max(0, Math.floor(elapsedS / periodS));
  const to = at(index);
  if (index > 0) {
    const from = at(index - 1);
    const legS = Math.hypot(to.x - from.x, to.z - from.z) / walkMps;
    const since = elapsedS - index * periodS;
    if (since < legS) {
      const k = since / legS;
      return { dx: from.x + (to.x - from.x) * k, dz: from.z + (to.z - from.z) * k, moving: true, heading: Math.atan2(to.x - from.x, to.z - from.z), index, periodS };
    }
  }
  return { dx: to.x, dz: to.z, moving: false, heading: null, index, periodS };
}





export const FOLLOW = Object.freeze({ hearts: 2, startM: 5, behindM: 1.6, followS: 60, restS: 600, giveUpM: 14 });





export function followFor({ personality, hearts, distM, nowS, free, state = null }, cfg = FOLLOW) {
  const s = state || { since: null, until: -Infinity, restUntil: -Infinity };
  if (s.since !== null && nowS < s.until && free && distM <= cfg.giveUpM) return { following: true, state: s };
  const ended = s.since !== null ? { since: null, until: -Infinity, restUntil: nowS + cfg.restS } : s;
  if (personality !== 'curious' || !(hearts >= cfg.hearts) || !free || !(distM <= cfg.startM) || nowS < ended.restUntil) return { following: false, state: ended };
  return { following: true, state: { since: nowS, until: nowS + cfg.followS, restUntil: -Infinity } };
}


export function followPoint(player, from, cfg = FOLLOW) {
  const dx = from.x - player.x, dz = from.z - player.z;
  const d = Math.hypot(dx, dz) || 1;
  return { x: player.x + (dx / d) * cfg.behindM, z: player.z + (dz / d) * cfg.behindM, heading: Math.atan2(-dx, -dz) };
}










export const CATCH_UP = Object.freeze({ mps: 2.4, jumpMs: 5000, farM: 30 });


export function isTeleport({ lastT = null, t, dt, wasVisible = true, forced = false }, cfg = CATCH_UP) {
  if (forced || lastT === null || !wasVisible) return true;
  const gap = t - lastT;
  return gap < 0 || gap - dt * 1000 > cfg.jumpMs;
}


export function catchUp(cur, target, dt, { teleport = false } = {}, cfg = CATCH_UP) {
  if (cur.x === null || cur.x === undefined || teleport) return { x: target.x, z: target.z, moved: 0, snapped: true };
  const d = Math.hypot(target.x - cur.x, target.z - cur.z);
  if (d > cfg.farM) return { x: target.x, z: target.z, moved: 0, snapped: true };
  if (d < 1e-6) return { x: cur.x, z: cur.z, moved: 0, snapped: false };
  const k = Math.min(d, cfg.mps * dt);
  return { x: cur.x + ((target.x - cur.x) / d) * k, z: cur.z + ((target.z - cur.z) / d) * k, moved: k, snapped: false };
}




export const NOTICE = Object.freeze({ withinM: 6 });

export function noticedBy(shown, at, cfg = NOTICE) {
  return shown.filter((v) => v.visible !== false && !v.inside && Math.hypot(v.x - at.x, v.z - at.z) <= cfg.withinM).map((v) => v.id);
}



export const GREET = Object.freeze({ withinM: 3, hearts: 1, everyS: 120 });


export function greetFor({ distM, hearts, lastWaveS = null, nowS }, cfg = GREET) {
  if (!(distM <= cfg.withinM) || !(hearts >= cfg.hearts)) return false;
  return lastWaveS === null || nowS - lastWaveS >= cfg.everyS;
}



export const PAIRS = Object.freeze({ withinM: 2, chatS: [10, 20], perHour: 1 });







export function pairFor(poses, hour, lastPairHour, { seed = 0, cfg = PAIRS } = {}) {
  const h = Math.floor(hour);
  if (lastPairHour !== null && lastPairHour !== undefined && h - lastPairHour < 1 / cfg.perHour) return null;
  const walking = poses.filter((p) => p.doing === 'walking');
  let best = null, bestD = cfg.withinM;
  for (let i = 0; i < walking.length; i++) {
    for (let j = i + 1; j < walking.length; j++) {
      const d = Math.hypot(walking[i].x - walking[j].x, walking[i].z - walking[j].z);
      if (d <= bestD) { bestD = d; best = [walking[i], walking[j]]; }
    }
  }
  if (!best) return null;
  const u = (seedOf(`${seed}|pair|${h}|${best[0].id}|${best[1].id}`) % 1000) / 1000;
  return { a: best[0].id, b: best[1].id, chatS: cfg.chatS[0] + u * (cfg.chatS[1] - cfg.chatS[0]), hour: h };
}






export function pairMeet(a, b, gapM = 0.9) {
  const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
  let dx = b.x - a.x, dz = b.z - a.z;
  const d = Math.hypot(dx, dz);
  if (d < 1e-6) { dx = 1; dz = 0; } else { dx /= d; dz /= d; }
  const h = gapM / 2;
  return {
    a: { x: mx - dx * h, z: mz - dz * h, heading: Math.atan2(dx, dz) },
    b: { x: mx + dx * h, z: mz + dz * h, heading: Math.atan2(-dx, -dz) },
  };
}
