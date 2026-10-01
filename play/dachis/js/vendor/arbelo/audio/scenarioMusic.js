





































import { TRACK_NAMES, openingTrackFor } from './songSpec.js';










export const SCENARIO_ORDER = Object.freeze(['victory', 'worm', 'matchpoint', 'carrier', 'play']);













export const SCENARIOS = Object.freeze({
  play: Object.freeze({
    bpmScale: 1.00, brightness: 0.72, gain: 1.00,
    prefer: ['hog-stomp', 'last-light', 'barn-burner'],
  }),
  
  
  carrier: Object.freeze({
    bpmScale: 1.04, brightness: 0.95, gain: 1.06,
    prefer: ['barn-burner', 'last-light'],
  }),
  
  matchpoint: Object.freeze({
    bpmScale: 1.06, brightness: 1.00, gain: 1.10,
    prefer: ['barn-burner', 'wire-fence'],
  }),
  
  
  
  worm: Object.freeze({
    bpmScale: 1.02, brightness: 0.40, gain: 0.82,
    prefer: ['wire-fence', 'silo-crawl'],
  }),
  victory: Object.freeze({
    bpmScale: 1.00, brightness: 0.88, gain: 1.00,
    prefer: ['last-light', 'hog-stomp'],
  }),
});














export function scenarioFor({ ended = false, wormOut = false, flagCarried = false,
  topScore = 0, target = 0 } = {}) {
  if (ended) return 'victory';
  if (wormOut) return 'worm';
  
  
  if (target > 0 && topScore >= target - 1) return 'matchpoint';
  if (flagCarried) return 'carrier';
  return 'play';
}


export function settingsFor(scenario) {
  return SCENARIOS[scenario] || SCENARIOS.play;
}











export function trackFor(scenario, map, current = null) {
  const prefer = settingsFor(scenario).prefer || [];
  for (const name of prefer) {
    if (name !== current && TRACK_NAMES.includes(name)) return name;
  }
  const opening = openingTrackFor(map);
  if (opening !== current) return opening;
  return TRACK_NAMES.find((n) => n !== current) || TRACK_NAMES[0];
}














export function shouldSwitchTrack(from, to) {
  if (from === to) return false;
  const BIG = new Set(['worm', 'matchpoint', 'victory']);
  return BIG.has(to) || BIG.has(from);
}
