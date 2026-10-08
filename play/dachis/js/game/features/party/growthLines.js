



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

export const BODY_LINES = {
  round: 'Still round. Still perfect.',
  quadruped: 'It\'s up on four legs now, like a real puppy!',
  fish: 'It\'s a fish now! It swims in the air. Don\'t ask me how.',
  bird: 'It\'s got wings and skinny little bird legs now!',
  serpent: 'It\'s all long and coily now, like a snake!',
  bug: 'It\'s got a shell and six legs. A real bug!',
  biped: 'It stands up on two legs now, like a person!',
  plant: 'It\'s sitting in a bunch of big leaves now, like a plant!',
  ghost: 'Its body trails off into smoke now. Like a ghost!',
  crab: 'Look at those claws - it\'s a real crab now!',
  jelly: 'It floats now, with tentacles hanging under it!',
  strider: 'It\'s up on long stilt legs now. It\'s taller than me!',
  turtle: 'It\'s got a whole shell now, like a turtle!',
  bat: 'Its arms turned into big wings. It\'s a bat!',
  snail: 'It\'s carrying a shell on its back now, like a snail!',
  frog: 'It sits like a frog now, with big jumpy legs!',
  octopus: 'It\'s got a whole bunch of wiggly arms now!', 
  ray: 'It\'s all flat and floaty now, with a long tail!',
};

export const bodyLine = (plan) => (plan && Object.prototype.hasOwnProperty.call(BODY_LINES, plan) ? BODY_LINES[ (plan)] : null);

export const growthLine = (growth) => (growth && Object.prototype.hasOwnProperty.call(GROWTH_LINES, growth) ? GROWTH_LINES[ (growth)] : null);
