



























































export const REASONS = Object.freeze(['rout', 'eliminated', 'draw', 'time', 'gaveUp']);

const WON = Object.freeze({
  rout: 'A rout. The map is yours.',
  eliminated: 'Nothing of theirs is left standing.',
  draw: 'You held the most ground.',
  time: 'You held the most ground.',
  gaveUp: 'You walked away.',
});

const LOST = Object.freeze({
  rout: 'Routed.',
  
  
  
  eliminated: 'Wiped out. Nothing of yours is left standing.',
  draw: 'They held more ground.',
  time: 'They held more ground.',
  gaveUp: 'You walked away.',
});

const DRAWN = 'Level. Neither side gave ground.';









export function endTitle(reason, won, drawn) {
  
  
  
  if (reason === 'gaveUp') return WON.gaveUp;
  if (drawn) return DRAWN;
  const table = won ? WON : LOST;
  return table[reason] || table.time;
}
