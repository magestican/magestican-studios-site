
























































export const TILE_METRES = 25;



















export const MARK_KINDS = Object.freeze(['blob', 'soft', 'rows']);












































export const ROW_ENVELOPE_LO = 0.34;


export const ROW_ENVELOPE_MEAN = (1 + ROW_ENVELOPE_LO) / 2;







export const ROW_ALPHA_MAX = ROW_ENVELOPE_MEAN / 1.08;


export const markEnveloped = (mark) => mark.envelope !== false;













export const TERRAIN_RECIPE = {
  
  
  
  
  
  pasture: {
    base: 0x40682a,
    marks: [
      
      
      
      { id: 'wash', kind: 'soft', colour: 0x233d16, alpha: 0.58, coverage: 0.30, scaleMetres: [20, 14] },
      { id: 'sun', kind: 'soft', colour: 0x6d9647, alpha: 0.52, coverage: 0.28, scaleMetres: [17, 12] },
      
      
      { id: 'trail', kind: 'rows', colour: 0x8a8f4a, alpha: 0.42, coverage: 0.06, periodMetres: 25, scaleMetres: [1.5, 25] },
      { id: 'worn', colour: 0x8a8f4a, alpha: 0.62, coverage: 0.13, scaleMetres: [4.5, 3.0] },
      { id: 'shade', kind: 'soft', colour: 0x2c4a1e, alpha: 0.58, coverage: 0.14, scaleMetres: [3.2, 5.0] },
      { id: 'thistle', colour: 0x86b45c, alpha: 0.55, coverage: 0.09, scaleMetres: [2.0, 2.0] },
      { id: 'scrape', colour: 0x6f5a3c, alpha: 0.50, coverage: 0.06, scaleMetres: [2.6, 1.6] },
      { id: 'tuft', colour: 0x63a043, alpha: 0.45, coverage: 0.10, scaleMetres: [0.5, 0.5] },
      { id: 'tuftDark', colour: 0x35571f, alpha: 0.45, coverage: 0.08, scaleMetres: [0.4, 0.4] },
    ],
  },
  longGrass: {
    base: 0x35591f,
    marks: [
      { id: 'wash', kind: 'soft', colour: 0x1e3a12, alpha: 0.58, coverage: 0.30, scaleMetres: [19, 13] },
      { id: 'sun', kind: 'soft', colour: 0x6ba043, alpha: 0.55, coverage: 0.28, scaleMetres: [16, 11] },
      
      
      { id: 'lay', kind: 'rows', colour: 0x8cc25f, alpha: 0.38, coverage: 0.20, periodMetres: 12.5, scaleMetres: [2.5, 25] },
      { id: 'layDark', kind: 'rows', colour: 0x24401a, alpha: 0.44, coverage: 0.128, periodMetres: 12.5, phase: 0.5, scaleMetres: [1.6, 25] },
      { id: 'layCross', kind: 'rows', colour: 0x7cb052, alpha: 0.44, coverage: 0.096, periodMetres: 25, scaleMetres: [25, 2.4] },
      { id: 'clump', kind: 'soft', colour: 0x223f18, alpha: 0.58, coverage: 0.16, scaleMetres: [3.4, 4.4] },
      { id: 'seed', colour: 0xa8c877, alpha: 0.48, coverage: 0.09, scaleMetres: [1.8, 1.4] },
      { id: 'blade', colour: 0x69a745, alpha: 0.45, coverage: 0.10, scaleMetres: [0.45, 0.6] },
      { id: 'bladeDark', colour: 0x2c4a1c, alpha: 0.45, coverage: 0.08, scaleMetres: [0.4, 0.55] },
    ],
  },
  scrub: {
    base: 0x5a6b3a,
    marks: [
      { id: 'wash', kind: 'soft', colour: 0x34411f, alpha: 0.58, coverage: 0.30, scaleMetres: [18, 13] },
      { id: 'dry', kind: 'soft', colour: 0x8d9857, alpha: 0.55, coverage: 0.28, scaleMetres: [15, 11] },
      
      
      { id: 'bush', colour: 0x2c3d1e, alpha: 0.75, coverage: 0.15, scaleMetres: [3.0, 3.0] },
      { id: 'bare', colour: 0x8a7a55, alpha: 0.60, coverage: 0.12, scaleMetres: [4.0, 2.6] },
      { id: 'bushSmall', colour: 0x35491f, alpha: 0.65, coverage: 0.10, scaleMetres: [1.5, 1.4] },
      { id: 'stoneBig', colour: 0x9a9581, alpha: 0.55, coverage: 0.07, scaleMetres: [1.6, 1.3] },
      { id: 'twig', colour: 0x4c5a2e, alpha: 0.45, coverage: 0.09, scaleMetres: [0.6, 0.5] },
      { id: 'grit', colour: 0x9aa06a, alpha: 0.42, coverage: 0.07, scaleMetres: [0.35, 0.35] },
    ],
  },
  mud: {
    base: 0x5b4a33,
    marks: [
      { id: 'wet', kind: 'soft', colour: 0x31281b, alpha: 0.60, coverage: 0.30, scaleMetres: [18, 13] },
      { id: 'dry', kind: 'soft', colour: 0x8d7554, alpha: 0.55, coverage: 0.28, scaleMetres: [15, 11] },
      
      
      
      
      
      { id: 'rut', kind: 'rows', colour: 0x2f261a, alpha: 0.60, coverage: 0.10, periodMetres: 25, scaleMetres: [2.5, 25] },
      { id: 'rutLip', kind: 'rows', colour: 0x9e8862, alpha: 0.55, coverage: 0.032, periodMetres: 25, phase: 0.08, scaleMetres: [0.8, 25] },
      { id: 'scrape', colour: 0xb09a70, alpha: 0.50, coverage: 0.08, scaleMetres: [3.2, 2.0] },
      
      
      { id: 'puddle', colour: 0x263640, alpha: 0.72, coverage: 0.10, scaleMetres: [2.6, 1.5] },
      { id: 'puddleSky', colour: 0xbcd6e4, alpha: 0.38, coverage: 0.045, scaleMetres: [1.7, 0.7] },
      { id: 'clod', colour: 0x6d5b40, alpha: 0.45, coverage: 0.10, scaleMetres: [0.6, 0.5] },
    ],
  },

  
  
  
  
  
  
  
  ploughedA: {
    base: 0x7c5e3d,
    marks: [
      { id: 'wash', kind: 'soft', colour: 0x54402a, alpha: 0.55, coverage: 0.30, scaleMetres: [20, 17] },
      { id: 'washLight', kind: 'soft', colour: 0x9a7a52, alpha: 0.52, coverage: 0.28, scaleMetres: [16, 15] },
      
      
      
      
      { id: 'furrow', kind: 'rows', colour: 0x3d2e1c, alpha: 0.60, coverage: 0.26, periodMetres: 5, scaleMetres: [1.3, 25] },
      { id: 'ridge', kind: 'rows', colour: 0xac8b5e, alpha: 0.56, coverage: 0.20, periodMetres: 5, phase: 0.5, scaleMetres: [1.0, 25] },
      
      
      
      
      
      
      { id: 'headRow', kind: 'rows', colour: 0x6d5335, alpha: 0.62, coverage: 0.104, periodMetres: 25, scaleMetres: [25, 2.6] },
      { id: 'headland', colour: 0x7d6446, alpha: 0.55, coverage: 0.10, scaleMetres: [4.0, 2.4] },
      { id: 'damp', kind: 'soft', colour: 0x63492e, alpha: 0.52, coverage: 0.15, scaleMetres: [3.0, 4.0] },
      { id: 'stone', colour: 0xa08a6d, alpha: 0.45, coverage: 0.06, scaleMetres: [0.4, 0.4] },
      { id: 'clod', colour: 0x3c2c1c, alpha: 0.45, coverage: 0.07, scaleMetres: [0.5, 0.4] },
    ],
  },
  
  
  
  
  ploughedB: {
    base: 0x795b3b,
    marks: [
      { id: 'wash', kind: 'soft', colour: 0x513e28, alpha: 0.55, coverage: 0.30, scaleMetres: [17, 20] },
      { id: 'washLight', kind: 'soft', colour: 0x977750, alpha: 0.52, coverage: 0.28, scaleMetres: [15, 16] },
      { id: 'furrow', kind: 'rows', colour: 0x3a2b1a, alpha: 0.60, coverage: 0.26, periodMetres: 5, scaleMetres: [25, 1.3] },
      { id: 'ridge', kind: 'rows', colour: 0xa9885c, alpha: 0.56, coverage: 0.20, periodMetres: 5, phase: 0.5, scaleMetres: [25, 1.0] },
      { id: 'headRow', kind: 'rows', colour: 0x6a5033, alpha: 0.62, coverage: 0.104, periodMetres: 25, scaleMetres: [2.6, 25] },
      { id: 'headland', colour: 0x7a6144, alpha: 0.55, coverage: 0.10, scaleMetres: [2.4, 4.0] },
      { id: 'damp', kind: 'soft', colour: 0x60472c, alpha: 0.52, coverage: 0.15, scaleMetres: [4.0, 3.0] },
      { id: 'stone', colour: 0x9d8769, alpha: 0.45, coverage: 0.06, scaleMetres: [0.4, 0.4] },
      { id: 'clod', colour: 0x392a1a, alpha: 0.45, coverage: 0.07, scaleMetres: [0.4, 0.5] },
    ],
  },
  stubble: {
    base: 0xa08b4e,
    marks: [
      { id: 'wash', kind: 'soft', colour: 0x776535, alpha: 0.55, coverage: 0.30, scaleMetres: [22, 15] },
      { id: 'washLight', kind: 'soft', colour: 0xcdb676, alpha: 0.52, coverage: 0.28, scaleMetres: [18, 12] },
      
      
      
      { id: 'row', kind: 'rows', colour: 0x86713d, alpha: 0.60, coverage: 0.25, periodMetres: 4.4, scaleMetres: [1.1, 25] },
      { id: 'rowLight', kind: 'rows', colour: 0xdfca8d, alpha: 0.50, coverage: 0.205, periodMetres: 4.4, phase: 0.5, scaleMetres: [0.9, 25] },
      
      
      
      { id: 'headRow', kind: 'rows', colour: 0x8d783f, alpha: 0.58, coverage: 0.096, periodMetres: 25, scaleMetres: [25, 2.4] },
      { id: 'bale', colour: 0x6a5a30, alpha: 0.62, coverage: 0.08, scaleMetres: [2.6, 2.6] },
      { id: 'bare', colour: 0x8a7250, alpha: 0.55, coverage: 0.09, scaleMetres: [3.4, 2.0] },
      { id: 'straw', colour: 0xe6d69c, alpha: 0.42, coverage: 0.08, scaleMetres: [0.5, 0.35] },
    ],
  },
  gravel: {
    base: 0x6f6b60,
    marks: [
      { id: 'wash', kind: 'soft', colour: 0x504d44, alpha: 0.54, coverage: 0.30, scaleMetres: [18, 14] },
      { id: 'washLight', kind: 'soft', colour: 0x969181, alpha: 0.54, coverage: 0.28, scaleMetres: [15, 11] },
      { id: 'track', kind: 'rows', colour: 0x413e37, alpha: 0.60, coverage: 0.104, periodMetres: 25, scaleMetres: [2.6, 25] },
      { id: 'spill', colour: 0xaaa491, alpha: 0.55, coverage: 0.11, scaleMetres: [3.0, 2.2] },
      { id: 'oil', colour: 0x2d2b27, alpha: 0.58, coverage: 0.06, scaleMetres: [1.6, 1.2] },
      { id: 'chip', colour: 0x9b9686, alpha: 0.45, coverage: 0.11, scaleMetres: [0.35, 0.35] },
      { id: 'chipDark', colour: 0x413e37, alpha: 0.45, coverage: 0.10, scaleMetres: [0.3, 0.3] },
    ],
  },
  concrete: {
    base: 0x7c7c78,
    marks: [
      { id: 'pour', kind: 'soft', colour: 0x5c5c58, alpha: 0.48, coverage: 0.30, scaleMetres: [16, 16] },
      { id: 'pourLight', kind: 'soft', colour: 0xa4a49d, alpha: 0.48, coverage: 0.28, scaleMetres: [13, 13] },
      
      
      
      
      
      
      
      { id: 'joint', kind: 'rows', envelope: false, colour: 0x3f3f3c, alpha: 0.90, coverage: 0.032, periodMetres: 12.5, scaleMetres: [0.4, 25] },
      { id: 'jointCross', kind: 'rows', envelope: false, colour: 0x3f3f3c, alpha: 0.90, coverage: 0.032, periodMetres: 12.5, scaleMetres: [25, 0.4] },
      { id: 'stain', kind: 'soft', colour: 0x4f4f4a, alpha: 0.58, coverage: 0.13, scaleMetres: [3.0, 2.4] },
      { id: 'wear', kind: 'soft', colour: 0xb0b0a7, alpha: 0.52, coverage: 0.11, scaleMetres: [2.4, 3.2] },
      { id: 'crack', colour: 0x3f3f3b, alpha: 0.55, coverage: 0.05, scaleMetres: [0.3, 4.0] },
    ],
  },

  
  dryPaddock: {
    base: 0x8d8a52,
    marks: [
      { id: 'burnt', kind: 'soft', colour: 0x67642f, alpha: 0.57, coverage: 0.30, scaleMetres: [21, 15] },
      { id: 'bleach', kind: 'soft', colour: 0xbcb779, alpha: 0.57, coverage: 0.28, scaleMetres: [17, 12] },
      { id: 'bare', colour: 0x8a7450, alpha: 0.62, coverage: 0.14, scaleMetres: [4.2, 2.8] },
      { id: 'shade', kind: 'soft', colour: 0x555328, alpha: 0.55, coverage: 0.13, scaleMetres: [3.0, 4.2] },
      { id: 'clump', colour: 0xc6c184, alpha: 0.50, coverage: 0.09, scaleMetres: [1.9, 1.6] },
      { id: 'tuft', colour: 0x9d9a5e, alpha: 0.42, coverage: 0.10, scaleMetres: [0.5, 0.45] },
      { id: 'stone', colour: 0x8f8b78, alpha: 0.42, coverage: 0.06, scaleMetres: [0.4, 0.4] },
    ],
  },
  dirt: {
    base: 0x7a6242,
    marks: [
      { id: 'damp', kind: 'soft', colour: 0x51402a, alpha: 0.58, coverage: 0.30, scaleMetres: [19, 13] },
      { id: 'dust', kind: 'soft', colour: 0xa68b5c, alpha: 0.56, coverage: 0.28, scaleMetres: [16, 11] },
      { id: 'track', kind: 'rows', colour: 0x453824, alpha: 0.60, coverage: 0.096, periodMetres: 25, scaleMetres: [2.4, 25] },
      { id: 'trackLip', kind: 'rows', colour: 0xb09769, alpha: 0.54, coverage: 0.032, periodMetres: 25, phase: 0.11, scaleMetres: [0.8, 25] },
      { id: 'scrape', colour: 0xb09a70, alpha: 0.55, coverage: 0.10, scaleMetres: [3.2, 2.2] },
      { id: 'stone', colour: 0x8d7451, alpha: 0.45, coverage: 0.10, scaleMetres: [0.45, 0.4] },
      { id: 'stoneDark', colour: 0x4a3b26, alpha: 0.45, coverage: 0.08, scaleMetres: [0.4, 0.35] },
    ],
  },
  rock: {
    base: 0x6a6558,
    marks: [
      { id: 'shelf', kind: 'soft', colour: 0x464236, alpha: 0.62, coverage: 0.30, scaleMetres: [17, 13] },
      { id: 'lit', kind: 'soft', colour: 0x989281, alpha: 0.60, coverage: 0.28, scaleMetres: [14, 11] },
      { id: 'boulder', colour: 0xa39c8c, alpha: 0.72, coverage: 0.15, scaleMetres: [3.4, 3.0] },
      { id: 'crevice', colour: 0x2e2b26, alpha: 0.62, coverage: 0.11, scaleMetres: [1.3, 2.8] },
      { id: 'scree', colour: 0x7d7768, alpha: 0.52, coverage: 0.11, scaleMetres: [1.4, 1.2] },
      { id: 'chip', colour: 0x575246, alpha: 0.45, coverage: 0.10, scaleMetres: [0.4, 0.35] },
    ],
  },

  
  
  
  
  
  
  
  
  
  
  
  
  
  waterClean: {
    base: 0x164457,
    marks: [
      { id: 'deep', kind: 'soft', colour: 0x0a2432, alpha: 0.62, coverage: 0.30, scaleMetres: [20, 14] },
      { id: 'shallow', kind: 'soft', colour: 0x256076, alpha: 0.55, coverage: 0.26, scaleMetres: [16, 11] },
      { id: 'swell', kind: 'rows', colour: 0x1d5c78, alpha: 0.50, coverage: 0.24, periodMetres: 12.5, scaleMetres: [3.0, 25] },
      { id: 'swellDark', kind: 'rows', colour: 0x0d2f40, alpha: 0.42, coverage: 0.16, periodMetres: 12.5, phase: 0.5, scaleMetres: [2.0, 25] },
      { id: 'weed', kind: 'soft', colour: 0x17423e, alpha: 0.58, coverage: 0.09, scaleMetres: [2.4, 1.8] },
      { id: 'glint', colour: 0xa8dbf0, alpha: 0.48, coverage: 0.055, scaleMetres: [2.6, 0.6] },
      { id: 'ripple', colour: 0x4fa6c4, alpha: 0.42, coverage: 0.10, scaleMetres: [0.9, 0.35] },
    ],
  },
  waterFouled: {
    base: 0x33463f,
    marks: [
      { id: 'deep', kind: 'soft', colour: 0x1d2a26, alpha: 0.62, coverage: 0.30, scaleMetres: [20, 14] },
      { id: 'shallow', kind: 'soft', colour: 0x4d6355, alpha: 0.55, coverage: 0.26, scaleMetres: [16, 11] },
      { id: 'slick', kind: 'rows', colour: 0x5b6b46, alpha: 0.42, coverage: 0.192, periodMetres: 12.5, scaleMetres: [2.4, 25] },
      
      
      { id: 'scum', colour: 0x6f6e3c, alpha: 0.72, coverage: 0.17, scaleMetres: [3.6, 2.6] },
      { id: 'sheen', colour: 0x949f5e, alpha: 0.50, coverage: 0.08, scaleMetres: [2.0, 1.4] },
      { id: 'foam', colour: 0xbcc0a4, alpha: 0.45, coverage: 0.05, scaleMetres: [1.4, 0.6] },
      { id: 'silt', colour: 0x27342c, alpha: 0.45, coverage: 0.10, scaleMetres: [0.8, 0.6] },
    ],
  },
};

export const TERRAIN_IDS = Object.freeze(Object.keys(TERRAIN_RECIPE).sort());


export const markKind = (mark) => mark.kind || 'blob';









export function terrainForSector({ kind, faction, pollution = 0 }) {
  if (kind === 'water') return pollution > 0 ? ['waterFouled'] : ['waterClean'];
  if (kind === 'keystone') return ['rock', 'dirt'];
  if (faction === 'herd') return ['pasture', 'longGrass', 'scrub', 'mud'];
  if (faction === 'yield') return ['ploughedA', 'ploughedB', 'stubble', 'gravel', 'concrete'];
  return ['dryPaddock', 'dirt', 'scrub'];
}
