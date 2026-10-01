
























export function routeKey(e, { overlay = false, typing = false } = {}) {
  
  
  
  if (e.ctrl || e.meta || e.alt) return null;
  const key = e.key;

  if (key === 'Escape') return { type: 'back' };
  if (key === 'Enter' || key === ' ' || key === 'Spacebar') return { type: 'enter' };

  if (typing) {
    
    
    
    if (key === 'Backspace') return { type: 'rub' };
    if (/^[a-zA-Z0-9]$/.test(key)) return { type: 'letter', value: key.toUpperCase() };
    return null;
  }

  if (key === '?' || key === '/') return { type: 'help' };
  if (key === 'ArrowLeft' || key === 'ArrowUp') return { type: 'move', value: -1 };
  if (key === 'ArrowRight' || key === 'ArrowDown') return { type: 'move', value: 1 };
  if (key === 'Tab') return { type: 'move', value: 1 };

  if (overlay) return null;

  
  
  
  if (/^[1-4]$/.test(key)) return { type: 'token', value: Number(key) - 1 };
  return null;
}


export const KEY_HELP = 'Space or Enter rolls the die and confirms a move. '
  + 'Arrow keys move between the pieces you may move. '
  + 'Number keys 1 to 4 choose a piece straight away. '
  + 'Escape closes a panel. Question mark opens the help.';
