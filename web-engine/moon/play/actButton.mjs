

































export const ACT_WORD = Object.freeze({
  harvest: 'Pick', clearStump: 'Dig up', plant: 'Plant',
  stock: 'Stock', build: 'Build', collect: 'Collect', open: 'Open', buy: 'Buy', talk: 'Talk',
  fell: 'Chop', mine: 'Mine', dig: 'Dig', water: 'Water', forage: 'Pick',
  
  
  
  
  place: 'Put down',
});


export const TOOL_WORD = Object.freeze({ shovel: 'Dig', axe: 'Chop', pickaxe: 'Mine', wateringCan: 'Water' });


export const PICK_UP = 'Pick up';


export const ACT_MAX_CHARS = 18;


export const REFUSAL_S = 2;





export function actWord(p) {
  if (!p) return PICK_UP;
  if (p.verb) return ACT_WORD[p.verb] || PICK_UP;
  if (p.hold) return ACT_WORD.fell;
  if (p.chosen) return TOOL_WORD[p.chosen] || PICK_UP;
  return p.target && p.target.type === 'ground' ? ACT_WORD.plant : ACT_WORD.harvest;
}


export function actLabel(p) {
  if (!p) return PICK_UP;
  const word = actWord(p);
  const said = typeof p.label === 'string' ? p.label : '';
  
  const short = said.split(' - ')[0].replace(/^(\S+) (?:the|a|an) /i, '$1 ').trim();
  if (!short || short.length > ACT_MAX_CHARS) return word;
  return short;
}







export const actRefused = (p) => Boolean(p && p.why && !p.hold);


export const refusalOf = (p) => (actRefused(p) ? p.why : null);
