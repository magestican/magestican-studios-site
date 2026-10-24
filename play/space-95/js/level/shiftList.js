













export const UNRENDERED = new Set( ([])); 






export const GREYBOX = new Set( ([]));


export const SHIFT_NAMES = {
  1: 'Crash Orchard',
  2: 'Purple Trunk',
  3: 'Ant Highway',
  4: 'Seed Vault',
  5: "Stripecat's Back",
  6: 'Windward',
  7: 'The Long Way Home',
  8: 'Honeycomb Hall',
  9: 'Puddle Sea',
  10: 'The Gardener Mantis',
  11: 'Desk of the Vast',
  12: 'Inside the Machine',
  13: 'Crumb Express',
  14: 'Night Bloom',
  15: 'Silk Span',
  16: 'The Deep Burrow',
  17: 'Dragonfly Dogfight',
  18: 'Kitchen of the Vast',
  19: 'Stampede',
  20: 'Swarm Sovereign',
};


export const ALL_SHIFT_IDS = Object.keys(SHIFT_NAMES).map(Number);

export const SHIFT_IDS = ALL_SHIFT_IDS.filter((id) => !UNRENDERED.has(id));


const GYM_TITLES = {
  'gym-train': 'Train gym', 
  'gym-webs': 'Web gym', 
  'gym-drill': 'Drill gym', 
  'gym-chill': 'Chill gym', 
  'gym-plane': 'Plane gym', 
};


export const isShiftKey = (key) => key !== 'gym' && Object.hasOwn(SHIFT_NAMES, key);





export function describeLevel(key, level, challenges) {
  if (isShiftKey(key)) {
    return {
      level,
      labels: level.checkpoints.map((c) => ({ id: c.id, label: 'Clock-in', proves: '' })),
      title: `Shift ${level.id}: ${level.name}`,
    };
  }
  if (Object.hasOwn(GYM_TITLES, key)) {
    const name = key === 'gym-train' ? (c) => c.name : () => 'Clock-in';
    return { level, labels: level.checkpoints.map((c) => ({ id: c.id, label: name(c), proves: '' })), title: GYM_TITLES[key] };
  }
  return { level, labels: challenges, title: 'Metrics gym' };
}
