






























export const GESTURE_REACH_M = 4;
export const FRIEND_HEARTS = 1;

export const GRUMPY_CHEER_LIMIT = 3;


const g = (clip, loop, label, cue, face, needs = null) => Object.freeze({ clip, loop, label, cue, face, needs });

export const GESTURES = Object.freeze({
  wave: g('wave', false, 'Wave', 'gesture.wave', 'happy'),
  cheer: g('cheer', false, 'Cheer', 'gesture.cheer', 'amazement'),
  bow: g('bow', false, 'Bow', 'gesture.bow', 'happy'),
  
  sitHere: g('sit', true, 'Sit here', 'gesture.sit', 'neutral'),
  
  sleep: g('sit', true, 'Sleep', 'gesture.sleep', 'sleepy', 'ownHome'),
});
export const GESTURE_IDS = Object.freeze(Object.keys(GESTURES));

const r = (clip, mood) => Object.freeze({ clip, mood });
const pair = (friend, stranger) => Object.freeze({ friend, stranger });

const row = (wave, cheer, bow, sitHere, sleep) => Object.freeze({ wave, cheer, bow, sitHere, sleep });
export const REACTIONS = Object.freeze({
  cheerful: row(
    pair(r('wave', 'happy'), r('wave', 'interest')),
    pair(r('cheer', 'amazement'), r(null, 'happy')),
    pair(r('bow', 'happy'), r(null, 'interest')),
    pair(r(null, 'happy'), r(null, 'interest')),
    pair(r(null, 'sleepy'), r(null, 'interest')),
  ),
  grumpy: row(
    pair(r('wave', 'neutral'), r(null, 'interest')),
    pair(r(null, 'frustration'), r(null, 'frustration')),
    pair(r('bow', 'happy'), r(null, 'interest')),
    pair(r(null, 'neutral'), r(null, 'interest')),
    pair(r(null, 'sleepy'), r(null, 'interest')),
  ),
  shy: row(
    pair(r('wave', 'happy'), r(null, 'concern')),
    pair(r(null, 'amazement'), r(null, 'concern')),
    pair(r('wave', 'happy'), r(null, 'concern')),
    pair(r(null, 'happy'), r(null, 'interest')),
    pair(r(null, 'sleepy'), r(null, 'interest')),
  ),
  dreamy: row(
    pair(r('wave', 'happy'), r(null, 'interest')),
    pair(r(null, 'amazement'), r(null, 'amazement')),
    pair(r('bow', 'happy'), r(null, 'interest')),
    pair(r(null, 'amazement'), r(null, 'interest')),
    pair(r(null, 'sleepy'), r(null, 'sleepy')),
  ),
  bossy: row(
    pair(r('wave', 'happy'), r(null, 'interest')),
    pair(r(null, 'concern'), r(null, 'concern')),
    pair(r('wave', 'happy'), r(null, 'happy')),
    pair(r(null, 'concern'), r(null, 'concern')),
    pair(r(null, 'sleepy'), r(null, 'interest')),
  ),
  curious: row(
    pair(r('wave', 'happy'), r('wave', 'interest')),
    pair(r('cheer', 'amazement'), r(null, 'interest')),
    pair(r('bow', 'interest'), r(null, 'interest')),
    pair(r(null, 'interest'), r(null, 'interest')),
    pair(r(null, 'interest'), r(null, 'interest')),
  ),
  gentle: row(
    pair(r('wave', 'happy'), r('wave', 'happy')),
    pair(r(null, 'happy'), r(null, 'happy')),
    pair(r('wave', 'happy'), r(null, 'interest')),
    pair(r(null, 'happy'), r(null, 'interest')),
    pair(r(null, 'sleepy'), r(null, 'interest')),
  ),
});







export function reactionTo({ gesture, personality, hearts = 0, cheersBefore = 0 }) {
  const table = REACTIONS[personality];
  if (!table) throw new Error(`no personality '${personality}'`);
  const entry = table[gesture];
  if (!entry) throw new Error(`no gesture '${gesture}'`);
  if (gesture === 'cheer' && personality === 'grumpy' && cheersBefore + 1 >= GRUMPY_CHEER_LIMIT) {
    return { clip: null, mood: 'anger', kind: 'fedUp' };
  }
  const kind = hearts >= FRIEND_HEARTS ? 'friend' : 'stranger';
  return { ...entry[kind], kind };
}


export function seenBy(villagers, at, reach = GESTURE_REACH_M) {
  return (villagers || [])
    .map((v) => ({ id: v.id, d: Math.hypot(v.x - at.x, v.z - at.z) }))
    .filter((v) => v.d <= reach)
    .sort((a, b) => a.d - b.d || (a.id < b.id ? -1 : 1))
    .map((v) => v.id);
}


export function gestureAllowed(id, { inOwnHome = false, busy = false } = {}) {
  const spec = GESTURES[id];
  if (!spec) return `There is no gesture '${id}'.`;
  if (busy) return 'Finish what you are doing first.';
  if (spec.needs === 'ownHome' && !inOwnHome) return 'You can only sleep at home.';
  return null;
}


export const nextCheers = (before, gesture) => (gesture === 'cheer' ? (before || 0) + 1 : 0);



export const TOSS_REACH_M = 2.5;
export const TOSS_LABEL = 'Toss a coin';
export const TOSS_CUE = 'gesture.toss';


export function coinWaterNear(waters, at, reach = TOSS_REACH_M) {
  let best = null, bestD = Infinity;
  for (const w of waters || []) {
    const d = Math.hypot(w.x - at.x, w.z - at.z);
    if (d <= reach && d < bestD) { best = w; bestD = d; }
  }
  return best;
}
