










export const TITLE_CONTROLS = Object.freeze(['quickPlayBtn', 'goal-toggle', 'see-options-summary']);


export const MATCH_MENU = Object.freeze(['mm-resume', 'mm-settings', 'mm-leave']);


export function navKey(key) {
  return { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }[key] || null;
}


export const STEP = Object.freeze({ up: -1, left: -1, down: 1, right: 1 });





export function stepFocus(at, step, n) {
  if (n <= 0) return -1;
  if (at < 0) return 0;
  return (((at + Math.sign(step)) % n) + n) % n;
}







export function shouldHold({ isHost, humans, matchState }) {
  return !!isHost && humans === 0 && matchState === 'playing';
}


export function resumeDeadline(endsAt, heldMs) {
  if (!endsAt || !(heldMs > 0)) return endsAt;
  return endsAt + heldMs;
}





export const CONFIRM_MS = 3000;
export function leaveStep({ humans, armedAt }, now) {
  if (humans === 0) return 'leave';
  if (armedAt && now - armedAt <= CONFIRM_MS) return 'leave';
  return 'arm';
}








export const STICK_DEAD = 0.22;

export const TRIGGER_ON = 0.35;


export function deadZone(v) {
  const a = Math.abs(v || 0);
  if (a <= STICK_DEAD) return 0;
  return Math.sign(v) * Math.min(1, (a - STICK_DEAD) / (1 - STICK_DEAD));
}


export function padMove(p) {
  const on = (i) => !!p?.buttons?.[i]?.pressed;
  const [x = 0, y = 0] = p?.axes || [];
  const sx = deadZone(x), sy = deadZone(y);
  return {
    moveForward: sy < -0.35 || on(12),
    moveBack: sy > 0.35 || on(13),
    moveLeft: sx < -0.35 || on(14),
    moveRight: sx > 0.35 || on(15),
  };
}


export const LOOK_PX_PER_S = 900;




export function padLook(p, dt) {
  const ax = p?.axes || [];
  const curve = (v) => { const d = deadZone(v); return Math.sign(d) * d * d; };
  const k = LOOK_PX_PER_S * Math.max(0, Math.min(dt || 0, 0.1));
  return [curve(ax[2]) * k, curve(ax[3]) * k];
}


export function padButtons(p) {
  const on = (i) => !!p?.buttons?.[i]?.pressed;
  const rt = p?.buttons?.[7];
  return {
    fire: !!rt && (!!rt.pressed || (rt.value || 0) > TRIGGER_ON),
    jump: on(0),
    reload: on(2),
    prevWeapon: on(4),
    nextWeapon: on(5),
    scoreboard: on(8),
    menu: on(9),
    back: on(1),
  };
}


export function padMenuHeld(p) {
  const held = new Set();
  if (!p) return held;
  const on = (i) => !!p.buttons?.[i]?.pressed;
  const [x = 0, y = 0] = p.axes || [];
  if (on(12) || y < -0.5) held.add('up');
  if (on(13) || y > 0.5) held.add('down');
  if (on(14) || x < -0.5) held.add('left');
  if (on(15) || x > 0.5) held.add('right');
  if (on(0)) held.add('confirm');
  if (on(1)) held.add('back');
  if (on(9)) held.add('menu');
  return held;
}

export const REPEAT_DELAY_MS = 400;
export const REPEAT_MS = 150;
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


export function cycleSlot(slot, dir, n = 3) {
  const s = Number.isFinite(slot) ? slot : 1;
  return ((((s - 1) + dir) % n) + n) % n + 1;
}






export const MENU_CUES = Object.freeze(['tap', 'back', 'toggleOn', 'toggleOff', 'open', 'focus', 'error']);

export const MENU_GAINS = Object.freeze({ tap: 0.42, back: 0.42, toggleOn: 0.42, toggleOff: 0.42, open: 0.38, focus: 0.2, error: 0.42 });


export function menuCue(id) {
  if (id === 'mm-resume' || id === 'mm-leave' || id === 'settings-leave') return 'back';
  if (id === 'mm-settings' || id === 'see-options-summary' || id === 'goal-toggle') return 'open';
  return 'tap';
}


export const SCREEN_IN_MS = 220;
export const STAGGER_MS = 45;
export const MENU_IN_MS = 180;
