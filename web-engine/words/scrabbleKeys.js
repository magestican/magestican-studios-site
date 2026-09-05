


































import { SIZES } from './style.js';


export const ENTER_KEY = 'ENTER';

export const DELETE_KEY = 'DEL';
















export const KEY_ROWS = [
  'QWERTYUIOP'.split(''),
  'ASDFGHJKL'.split(''),
  [ENTER_KEY, ...'ZXCVBNM'.split(''), DELETE_KEY],
];


export const KEY_GAP = 6;
















export const keysHeight = (rows = KEY_ROWS.length, gap = KEY_GAP) => rows * SIZES.target + (rows - 1) * gap;



















export const KEYS_MAX_WIDTH = 640;













export const keysReserved = (width, maxWidth = KEYS_MAX_WIDTH) => width < maxWidth;














export const keysLive = ({ myTurn = false, over = false } = {}) => !!myTurn && !over;











export function pressFor(label) {
  if (label === ENTER_KEY) return { key: 'Enter' };
  if (label === DELETE_KEY) return { key: 'Backspace' };
  return { key: label };
}













export const firesOnDown = (label) => label !== ENTER_KEY && label !== DELETE_KEY;





























export function strokeStep(stroke, index, labelAt) {
  if (!stroke) return { stroke: null, emit: null };
  if (index < 0 || index === stroke.lastKey) return { stroke, emit: null };
  const label = labelAt(index);
  const moved = { ...stroke, lastKey: index };
  if (label === ENTER_KEY || label === DELETE_KEY) return { stroke: moved, emit: null };
  return { stroke: moved, emit: label };
}





























export const dragTypes = ({ ch, rack = [], myTurn = false }) => !!myTurn && rack.includes(ch);









export const KEYS_HELP = 'On a phone there is a keyboard along the bottom. '
  + 'Tap a letter to lay a tile where the blue ring is, or hold your finger down and slide it across '
  + 'the letters to spell a word. Enter plays the word and the arrow key beside M takes a tile back.';
