
import { LINES } from './linesData.js';

export { LINES };


export function subtitle(ev) {
  const l = ev.type === 'say' && ev.line ? LINES[ev.line] : null;
  return l ? `${l.who.toUpperCase()}: ${l.text}` : '';
}
