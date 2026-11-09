



export const FIRST_REPEAT_TICKS = 16;
export const REPEAT_TICKS = 5;

const REPEATS = new Set(['left', 'right']);
const HELD = new Set(['soft']);

export function createHands() {
  const held = new Map();
  const tapped = new Set();
  
  const pressed = [];

  return {
    down(key) {
      if (held.has(key)) return; 
      held.set(key, 0);
      tapped.add(key);
    },
    up(key) { held.delete(key); },
    press(key) { pressed.push(key); },
    clear() {
      held.clear();
      tapped.clear();
      pressed.length = 0;
    },
    
    tick() {
      const keys = pressed.splice(0);
      for (const key of tapped) keys.push(key);
      for (const [key, age] of held) {
        if (HELD.has(key) && !tapped.has(key)) keys.push(key);
        const next = age + 1;
        held.set(key, next);
        if (REPEATS.has(key) && !tapped.has(key) && age >= FIRST_REPEAT_TICKS
          && (age - FIRST_REPEAT_TICKS) % REPEAT_TICKS === 0) keys.push(key);
      }
      tapped.clear();
      return keys;
    },
  };
}
