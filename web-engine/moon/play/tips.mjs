




























export const TIPS = Object.freeze([
  Object.freeze({
    id: 'jump',
    when: (s) => Boolean(s.canJump),
    text: 'Tap Jump twice quickly to fly to another planet - and HOLD it to fly straight home.',
  }),
  Object.freeze({
    id: 'tools',
    when: (s) => Boolean(s.hasTools),
    text: 'Your tools pick themselves: walk up to a tree, a boulder or a patch and the button says what it will do.',
  }),
  Object.freeze({
    id: 'placing',
    when: (s) => Boolean(s.placing),
    text: 'Move about to choose the spot - the ghost goes flat where a thing will not fit.',
  }),
  Object.freeze({
    id: 'visit',
    when: (s) => Boolean(s.visitOpen),
    text: 'Share the code and a friend can walk onto your moon, wherever they are.',
  }),
]);


export const SEEN_KEY = 'fml.tips.seen';


export const TIP_SECONDS = 7;











export function nextTip(state = {}, seen = new Set()) {
  if (state.busy) return null;
  for (const tip of TIPS) {
    if (seen.has(tip.id)) continue;
    if (tip.when(state)) return tip;
  }
  return null;
}


export function loadSeen(storage) {
  try {
    const raw = storage && storage.getItem(SEEN_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(list) ? list.filter((id) => typeof id === 'string') : []);
  } catch {
    
    return new Set();
  }
}


export function markSeen(storage, seen, id) {
  const next = new Set(seen);
  next.add(id);
  try {
    if (storage) storage.setItem(SEEN_KEY, JSON.stringify([...next]));
  } catch {  }
  return next;
}
