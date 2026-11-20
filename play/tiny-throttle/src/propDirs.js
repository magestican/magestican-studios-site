





export const YARD_MODELS = Object.freeze(new Set([
  'pool', 'pool_ladder', 'pool_ring', 'deck_section', 'sandpit', 'bucket', 'slide', 'swing_set', 'sprinkler',
  'hose_coil', 'fence_panel', 'hedge', 'watering_can', 'ball', 'flower_bed',
]));

export const propDir = (name) => (YARD_MODELS.has(name) ? 'yard' : 'house');
