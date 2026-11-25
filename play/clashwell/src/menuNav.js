












export function pickNext(rects, from, dir) {
  if (!rects.length) return -1;
  if (from < 0 || from >= rects.length) return 0;
  const c = (q) => ({ x: q.x + q.w / 2, y: q.y + q.h / 2 });
  const a = c(rects[from]);
  const [ax, ay] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir] || [0, 0];
  let best = from;
  let bestScore = Infinity;
  rects.forEach((q, i) => {
    if (i === from) return;
    const b = c(q);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const along = dx * ax + dy * ay;
    if (along <= 1) return;
    const across = Math.abs(dx * ay) + Math.abs(dy * ax);
    if (across > along * 2) return;
    const score = along + across * 3;
    if (score < bestScore) { bestScore = score; best = i; }
  });
  return best;
}





export const BACK = Object.freeze({ select: 'select-back', room: 'leave-room', match: 'quit', end: 'to-title' });


export const PRIMARY = Object.freeze({
  title: Object.freeze(['play-now']),
  select: Object.freeze(['fight']),
  room: Object.freeze(['start-room', 'leave-room']),
  end: Object.freeze(['rematch', 'to-title']),
});

const KEYS = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right',
  KeyD: 'right', Enter: 'confirm', NumpadEnter: 'confirm', Space: 'confirm', Escape: 'back', Backspace: 'back',
};

export function keyAction(code) { return KEYS[code] || null; }

const DEAD = 0.5;

export function padHeld(p) {
  const held = new Set();
  if (!p) return held;
  const on = (i) => !!p.buttons?.[i]?.pressed;
  const [x = 0, y = 0] = p.axes || [];
  if (on(12) || y < -DEAD) held.add('up');
  if (on(13) || y > DEAD) held.add('down');
  if (on(14) || x < -DEAD) held.add('left');
  if (on(15) || x > DEAD) held.add('right');
  if (on(0)) held.add('confirm');
  if (on(1)) held.add('back');
  if (on(2)) held.add('x');
  if (on(3)) held.add('y');
  if (on(9)) held.add('start');
  return held;
}

export const REPEAT_DELAY_MS = 400;
export const REPEAT_MS = 130;
const DIRS = new Set(['up', 'down', 'left', 'right']);

export function padPresses(state, held, now) {
  const prev = state?.since || {};
  const since = {};
  const presses = [];
  for (const w of held) {
    if (!(w in prev)) { presses.push(w); since[w] = { next: now + REPEAT_DELAY_MS }; continue; }
    const s = { ...prev[w] };
    if (DIRS.has(w) && now >= s.next) { presses.push(w); s.next = now + REPEAT_MS; }
    since[w] = s;
  }
  return { presses, state: { since } };
}

const PLAY = { left: 'left', right: 'right', down: 'soft', confirm: 'cw', x: 'ccw', y: 'hard' };

export function padPlay(held) {
  const out = [];
  for (const w of held) if (PLAY[w]) out.push(PLAY[w]);
  return out;
}
