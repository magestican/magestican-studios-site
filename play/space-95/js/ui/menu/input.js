




const KEYS = {
  ArrowUp: { type: 'move', dir: 'up' },
  KeyW: { type: 'move', dir: 'up' },
  ArrowDown: { type: 'move', dir: 'down' },
  KeyS: { type: 'move', dir: 'down' },
  ArrowLeft: { type: 'move', dir: 'left' },
  KeyA: { type: 'move', dir: 'left' },
  ArrowRight: { type: 'move', dir: 'right' },
  KeyD: { type: 'move', dir: 'right' },
  Enter: { type: 'confirm' },
  NumpadEnter: { type: 'confirm' },
  Space: { type: 'confirm' },
  Escape: { type: 'back' },
  Backspace: { type: 'back' },
};


export function keyAction( code) {
  const a = KEYS[code];
  return a ? { ...a } : null;
}


const PAD = [
  [0, { type: 'confirm' }],
  [1, { type: 'back' }],
  [9, { type: 'pause' }],
  [12, { type: 'move', dir: 'up' }],
  [13, { type: 'move', dir: 'down' }],
  [14, { type: 'move', dir: 'left' }],
  [15, { type: 'move', dir: 'right' }],
];





export function padActions(now, before) {
  const out = [];
  for (const [i, a] of  (PAD)) if (now[i]?.pressed && !before[i]?.pressed) out.push({ ...a });
  return out;
}


const STICK_DEAD = 0.5;


export function stickDir( x,  y) {
  if (Math.max(Math.abs(x), Math.abs(y)) < STICK_DEAD) return null;
  if (Math.abs(x) > Math.abs(y)) return x > 0 ? 'right' : 'left';
  return y > 0 ? 'down' : 'up';
}


export function tapAction( index) {
  return { type: 'tap', index };
}
