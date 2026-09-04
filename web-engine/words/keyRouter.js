





















export const LETTER = 'letter';
export const SUBMIT = 'submit';
export const DELETE = 'delete';
export const BACK = 'back';
export const OPEN = 'open';
export const MOVE = 'move';
export const CHOOSE = 'choose';
export const HELP = 'help';
export const NONE = null;


export const HOME = 'home';













export function routeKey(press, state) {
  const { key, ctrl = false, meta = false, alt = false } = press ?? {};
  
  
  
  if (ctrl || meta || alt) return NONE;

  const k = String(key ?? '');
  const upper = k.toUpperCase();

  if (k === 'Escape') return { type: BACK };
  if (k === '?' || (upper === 'H' && state.screen === HOME)) {
    
    
    return { type: HELP };
  }

  if (state.overlay) {
    
    
    if (/^[0-9]$/.test(k)) return { type: CHOOSE, value: k };
    if (k === 'Enter') return { type: SUBMIT };
    if (k === 'Backspace' || k === 'Delete') return { type: DELETE };
    const move = arrow(k);
    if (move) return { type: MOVE, ...move };
    
    
    
    
    
    if (/^[A-Z]$/.test(upper)) return { type: LETTER, value: upper };
    return NONE;
  }

  if (state.screen === HOME) {
    const n = Number(k);
    if (Number.isInteger(n) && n >= 1 && n <= state.games.length) {
      return { type: OPEN, game: state.games[n - 1] };
    }
    
    
    
    if (/^[A-Z]$/.test(upper)) return { type: OPEN, game: 'wordle', value: upper };
    if (k === 'Enter') return { type: OPEN, game: state.games[0] };
    const move = arrow(k);
    if (move) return { type: MOVE, ...move };
    return NONE;
  }

  if (k === 'Enter') return { type: SUBMIT };
  if (k === 'Backspace' || k === 'Delete') return { type: DELETE };
  const move = arrow(k);
  if (move) return { type: MOVE, ...move };
  if (/^[A-Z]$/.test(upper)) return { type: LETTER, value: upper };
  return NONE;
}











function arrow(key) {
  if (key === 'ArrowLeft') return { dx: -1, dy: 0 };
  if (key === 'ArrowRight') return { dx: 1, dy: 0 };
  if (key === 'ArrowUp') return { dx: 0, dy: -1 };
  if (key === 'ArrowDown') return { dx: 0, dy: 1 };
  return null;
}









export function moveCursor(index, { dx, dy }, cols, count) {
  const rows = Math.ceil(count / cols);
  let col = index % cols;
  let row = Math.floor(index / cols);
  col = Math.max(0, Math.min(cols - 1, col + dx));
  row = Math.max(0, Math.min(rows - 1, row + dy));
  const next = row * cols + col;
  return next < count ? next : index;
}
