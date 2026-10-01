

































export const GUEST_MAY = Object.freeze([
  'harvest',      
  'forage',       
  'dig',          
  'pickUpFind',   
  'water',        
                  
                  
]);




















export const GUEST_MAY_NOT = Object.freeze([
  
  'fell', 'clearStump', 'plant', 'mine', 'place', 'takeBack', 'build', 'upgrade',
  
  
  
  
  'terraform',
  
  
  'layPath', 'erasePath', 'placeLight', 'removeLight', 'spurHomes',
  
  'buy', 'buyParcel', 'craft', 'gift', 'stock', 'unstock', 'startJob', 'collect',
  'buyFrom', 'sellTo', 'fillRequest',
  
  
  'acceptFavour', 'completeFavour',
  
  
  
  'tossCoin',
  
  
  
  
  'buyUnderground',
  
  
  'guestGift',
]);

const MAY = new Set(GUEST_MAY);
const MAY_NOT = new Set(GUEST_MAY_NOT);


export const guestMay = (type) => MAY.has(type);










export function whyGuestCannot(type) {
  if (MAY.has(type)) return null;
  if (MAY_NOT.has(type)) return 'You are a guest on this moon - you can help gather, but the rest is for whoever lives here.';
  
  
  
  return `There is nothing a guest can do with '${type}' on somebody else's moon.`;
}












export function guestTools(verbTool) {
  const out = [];
  for (const [verb, tool] of Object.entries(verbTool)) {
    if (MAY.has(verb) && !out.includes(tool)) out.push(tool);
  }
  return out;
}
