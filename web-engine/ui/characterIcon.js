


















export const CHARACTER_ICON = Object.freeze({
  cow: '🐄',
  chicken: '🐓',
  pig: '🐖',
  sheep: '🐑',
  
  
  
  
  goat: '🐐',
  duck: '🦆',
  donkey: '🫏',
  goose: '🪿',
});







export const UNKNOWN_ICON = '•';

export function iconFor(character) {
  return CHARACTER_ICON[character] || UNKNOWN_ICON;
}




export const ICON_CHARACTERS = Object.freeze(Object.keys(CHARACTER_ICON));
