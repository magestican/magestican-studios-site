

































export const ACT_WORD = Object.freeze({
  harvest: 'Pick', clearStump: 'Dig up', plant: 'Plant',
  stock: 'Stock', build: 'Build', collect: 'Collect', open: 'Open', buy: 'Buy', talk: 'Talk',
  fell: 'Chop', mine: 'Mine', dig: 'Dig', water: 'Water', forage: 'Pick',
  
  
  
  
  place: 'Put down',
  
  
  
  
  goIn: 'Enter', goOut: 'Leave',
});


export const TOOL_WORD = Object.freeze({ shovel: 'Dig', axe: 'Chop', pickaxe: 'Mine', wateringCan: 'Water' });


export const PICK_UP = 'Pick up';


export const ACT_MAX_CHARS = 18;


export const REFUSAL_S = 2;





export function actWord(p) {
  
  
  
  
  
  return ACT_WORD[actVerb(p)] || PICK_UP;
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











































export const VERB_FLASH_S = 0.55;







export const TOOL_VERB = Object.freeze({ shovel: 'dig', axe: 'fell', pickaxe: 'mine', wateringCan: 'water' });


export const PICK_UP_VERB = 'pickUp';







export const ACT_ICON = Object.freeze({
  harvest: '\u{1F34E}',    
  forage: '\u{1F33F}',     
  plant: '\u{1F331}',      
  water: '\u{1F4A7}',      
  fell: '\u{1FA93}',       
  clearStump: '\u{1FAB5}', 
  dig: '⛏',           
  mine: '\u{1FAA8}',       
  stock: '\u{1F4E6}',      
  build: '\u{1F528}',      
  collect: '\u{1F9FA}',    
  open: '\u{1F4D6}',       
  buy: '\u{1FA99}',        
  talk: '\u{1F4AC}',       
  place: '\u{1F4CD}',      
  goIn: '\u{1F6AA}',       
  goOut: '\u{1F6AA}',
  [PICK_UP_VERB]: '✋', 
});









export function actVerb(p) {
  if (!p) return PICK_UP_VERB;
  if (p.verb) return ACT_WORD[p.verb] ? p.verb : PICK_UP_VERB;
  if (p.hold) return 'fell';
  if (p.chosen) return TOOL_VERB[p.chosen] || PICK_UP_VERB;
  return p.target && p.target.type === 'ground' ? 'plant' : 'harvest';
}


export const actIcon = (p) => ACT_ICON[actVerb(p)] || ACT_ICON[PICK_UP_VERB];























export function verbStep(prev, p, nowS) {
  const verb = actVerb(p);
  const word = actWord(p);
  const icon = actIcon(p);
  const sentence = actLabel(p);
  const cannot = actRefused(p);
  if (!prev) {
    
    
    
    return {
      verb, word, icon, sentence, label: sentence, cannot,
      flash: false, since: nowS, changes: 0, from: null, fromIcon: null,
    };
  }
  if (prev.verb !== verb) {
    return {
      verb, word, icon, sentence, label: word, cannot,
      flash: true, since: nowS, changes: prev.changes + 1, from: prev.verb, fromIcon: prev.icon,
    };
  }
  const flash = prev.flash && nowS - prev.since < VERB_FLASH_S;
  const label = flash ? word : sentence;
  if (flash === prev.flash && label === prev.label && icon === prev.icon
    && cannot === prev.cannot && word === prev.word && sentence === prev.sentence) return prev;
  
  
  return { ...prev, word, icon, sentence, label, cannot, flash };
}
