





const TIPS = {
  fall: 'Hold jump to go higher. Jump just after the edge too.',
  hit: 'Jump on a bug to bop it, or kick a pebble.',
  hazard: 'Wait for a gap in the pink spikes, then jump over.',
};


export const TIP_SECONDS = 6;

export function createCoach() {
  let beacon = 0;
  let deaths = 0;
  let cause = null;
  const told = new Set();
  return {
    




    onEvent(e, checkpoint, platform = true) {
      if (e.type === 'checkpoint' && e.id !== beacon) {
        beacon = e.id ?? beacon;
        deaths = 0;
      } else if (e.type === 'pit') cause = 'fall';
      else if (e.type === 'thornHit' || e.type === 'pinZap') cause = 'hazard';
      else if (e.type === 'hurt') cause = cause === 'hazard' ? cause : 'hit';
      else if (e.type === 'rescued')
        deaths = Math.max(0, deaths - 1); 
      else if (e.type === 'respawn') {
        if (checkpoint !== beacon) {
          beacon = checkpoint;
          deaths = 0;
        }
        deaths++;
        const how = cause;
        cause = null;
        if (deaths >= 2 && platform && how && !told.has(beacon)) {
          told.add(beacon);
          return { text: TIPS[how], mood: 'worried' };
        }
      }
      return null;
    },
  };
}
