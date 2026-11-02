






import { CELL, fill, lastCallAt } from './lampsMatch.js';

export const CHEAT_STATES = Object.freeze(['mid', 'lastcall', 'frozen', 'final', 'end']);

const unlit = (m) => m.state.reduce((out, st, i) => {
  if (m.solution[i] && st !== CELL.LIT) out.push(i);
  return out;
}, []);


function lightWindows(m, n, now) {
  const left = unlit(m);
  const stride = 7;
  const order = [...left.filter((_, k) => k % stride !== 0), ...left.filter((_, k) => k % stride === 0)];
  order.slice(0, n).forEach((cell, k) => {
    
    fill(m, k % 2, cell, now);
  });
}


export function applyCheat(m, state, now) {
  if (!CHEAT_STATES.includes(state)) return false;
  if (state === 'mid') lightWindows(m, Math.floor(m.total / 2), now);
  if (state === 'lastcall') {
    lightWindows(m, lastCallAt(m.total, m.rules), now);
  }
  if (state === 'frozen') {
    lightWindows(m, Math.floor(m.total / 3), now);
    const dark = m.state.findIndex((st, i) => st === CELL.DARK && !m.solution[i]);
    if (dark >= 0) fill(m, 0, dark, now);
  }
  if (state === 'final') lightWindows(m, m.total - 1, now);
  if (state === 'end') lightWindows(m, m.total, now);
  return true;
}
