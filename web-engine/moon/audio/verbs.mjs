

























export const CUE_OF_EVENT = Object.freeze({
  
  fell: 'tool.chop',
  mine: 'tool.mine',
  clearStump: 'tool.dig',
  plant: 'tool.dig',
  water: 'tool.water',
  
  
  harvest: 'pick.crop',
  pickUpFind: 'pick.find',
  collect: 'pick.find',
  
  place: 'make.place',
  craft: 'make.place',
  takeBack: 'pick.find',
  stock: 'make.place',
});


export const SOUNDED_EVENTS = Object.freeze(Object.keys(CUE_OF_EVENT));








export function cueForEvents(events) {
  if (!Array.isArray(events)) return null;
  for (const e of events) {
    const cue = e && CUE_OF_EVENT[e.type];
    if (cue) return cue;
  }
  return null;
}
