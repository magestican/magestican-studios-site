



export const GROWTH_LINES = {
  spikes: 'And it grew a whole row of spikes down its back!',
  crest: 'Look at that - a crest of feathers on its head!',
  whiskers: 'It\'s got long whiskers now. Very fancy.',
  hood: 'Whoa, it fans a big hood out behind its head now!',
  horn: 'It grew a huge horn. Watch where you point that thing.',
  flower: 'A flower just opened up on top of its head!',
  shellSpikes: 'Its shell\'s all spiky now. No hugs for a while.',
  domeSpikes: 'Spikes popped up all along its shell!',
  antlers: 'It grew antlers! Real ones!',
  throat: 'It puffs its throat out now. Like a balloon!',
  frill: 'A frilly crown grew round the top of it.',
  spire: 'Its shell grew a tall pointy tower on top!',
  fins: 'It grew two big flappy fins. Like ears!',
  horns: 'Two horns curl out in front of its face now.',
  ruff: 'It\'s got a fluffy ruff round its neck now.',
  hands: 'It grew long arms with big spooky hands. Creepy. Cool, but creepy.',
};

export const growthLine = (growth) => (growth && Object.prototype.hasOwnProperty.call(GROWTH_LINES, growth) ? GROWTH_LINES[ (growth)] : null);
