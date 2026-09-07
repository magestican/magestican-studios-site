









































































export const TILE_METRES = 25;



















export const MARK_KINDS = Object.freeze(['blob', 'soft', 'rows']);












































export const ROW_ENVELOPE_LO = 0.34;


export const ROW_ENVELOPE_MEAN = (1 + ROW_ENVELOPE_LO) / 2;







export const ROW_ALPHA_MAX = ROW_ENVELOPE_MEAN / 1.08;


export const markEnveloped = (mark) => mark.envelope !== false;













export const TERRAIN_RECIPE = {
  
  
  
  
  
  pasture: {
    base: 0x467039,
    marks: [
      
      
      
      { id: 'wash', kind: 'soft', colour: 0x0f471c, alpha: 0.56, coverage: 0.30, scaleMetres: [22, 16] },
      { id: 'sun', kind: 'soft', colour: 0x96b26a, alpha: 0.50, coverage: 0.28, scaleMetres: [19, 14] },
      
      
      
      
      { id: 'trail', kind: 'rows', colour: 0x9a9a5e, alpha: 0.50, coverage: 0.12, periodMetres: 12.5, scaleMetres: [1.5, 25] },
      
      
      
      { id: 'shade', kind: 'soft', colour: 0x285827, alpha: 0.66, coverage: 0.17, scaleMetres: [5.6, 7.6] },
      { id: 'worn', kind: 'soft', colour: 0x8d8f5c, alpha: 0.58, coverage: 0.14, scaleMetres: [5.5, 4.0] },
      { id: 'thistle', colour: 0x9dc06a, alpha: 0.55, coverage: 0.09, scaleMetres: [2.2, 2.2] },
      { id: 'scrape', colour: 0x6f5a3c, alpha: 0.55, coverage: 0.07, scaleMetres: [2.8, 1.8] },
      { id: 'tuft', colour: 0x63a043, alpha: 0.45, coverage: 0.07, scaleMetres: [0.55, 0.55] },
      { id: 'tuftDark', colour: 0x2c4a1c, alpha: 0.45, coverage: 0.06, scaleMetres: [0.45, 0.45] },
    ],
  },
  
  
  
  
  
  longGrass: {
    base: 0x7f8a3b,
    marks: [
      { id: 'wash', kind: 'soft', colour: 0x4e601d, alpha: 0.56, coverage: 0.30, scaleMetres: [21, 15] },
      { id: 'sun', kind: 'soft', colour: 0xcece6d, alpha: 0.48, coverage: 0.28, scaleMetres: [18, 13] },
      
      
      { id: 'lay', kind: 'rows', colour: 0xb2b65c, alpha: 0.44, coverage: 0.20, periodMetres: 12.5, scaleMetres: [2.5, 25] },
      { id: 'layDark', kind: 'rows', colour: 0x4e601d, alpha: 0.50, coverage: 0.10, periodMetres: 12.5, phase: 0.5, scaleMetres: [1.25, 25] },
      { id: 'layCross', kind: 'rows', colour: 0x9ca44e, alpha: 0.46, coverage: 0.096, periodMetres: 25, scaleMetres: [25, 2.4] },
      { id: 'clump', kind: 'soft', colour: 0x627129, alpha: 0.60, coverage: 0.16, scaleMetres: [4.0, 5.2] },
      { id: 'seed', colour: 0xd6d47a, alpha: 0.50, coverage: 0.10, scaleMetres: [2.0, 1.6] },
      { id: 'blade', colour: 0x8fa348, alpha: 0.45, coverage: 0.10, scaleMetres: [0.5, 0.65] },
      { id: 'bladeDark', colour: 0x44521c, alpha: 0.45, coverage: 0.08, scaleMetres: [0.45, 0.6] },
    ],
  },
  
  
  
  scrub: {
    base: 0x4f5b41,
    marks: [
      { id: 'wash', kind: 'soft', colour: 0x273625, alpha: 0.56, coverage: 0.30, scaleMetres: [20, 14] },
      { id: 'dry', kind: 'soft', colour: 0x989c72, alpha: 0.50, coverage: 0.28, scaleMetres: [17, 12] },
      
      
      
      { id: 'bush', colour: 0x23341b, alpha: 0.72, coverage: 0.16, scaleMetres: [3.4, 3.2] },
      { id: 'bare', kind: 'soft', colour: 0x7d8560, alpha: 0.58, coverage: 0.14, scaleMetres: [5.0, 3.4] },
      { id: 'bushSmall', colour: 0x2a4315, alpha: 0.62, coverage: 0.10, scaleMetres: [1.6, 1.5] },
      { id: 'stoneBig', colour: 0x8e8f76, alpha: 0.55, coverage: 0.07, scaleMetres: [1.7, 1.4] },
      { id: 'twig', colour: 0x415424, alpha: 0.45, coverage: 0.09, scaleMetres: [0.6, 0.5] },
      { id: 'grit', colour: 0x838a65, alpha: 0.42, coverage: 0.07, scaleMetres: [0.35, 0.35] },
    ],
  },
  mud: {
    base: 0x5e4837,
    marks: [
      { id: 'wet', kind: 'soft', colour: 0x38251d, alpha: 0.60, coverage: 0.30, scaleMetres: [20, 14] },
      { id: 'dry', kind: 'soft', colour: 0xa48867, alpha: 0.52, coverage: 0.28, scaleMetres: [17, 12] },
      
      
      
      
      { id: 'rut', kind: 'rows', colour: 0x2b1f14, alpha: 0.60, coverage: 0.10, periodMetres: 12.5, scaleMetres: [1.25, 25] },
      { id: 'rutLip', kind: 'rows', colour: 0xa48867, alpha: 0.52, coverage: 0.04, periodMetres: 12.5, phase: 0.10, scaleMetres: [0.5, 25] },
      { id: 'hollow', kind: 'soft', colour: 0x473226, alpha: 0.62, coverage: 0.15, scaleMetres: [4.6, 6.0] },
      { id: 'scrape', colour: 0xb69c7b, alpha: 0.55, coverage: 0.10, scaleMetres: [3.4, 2.2] },
      
      
      { id: 'puddle', colour: 0x1d2d37, alpha: 0.75, coverage: 0.10, scaleMetres: [2.8, 1.6] },
      { id: 'puddleSky', colour: 0xb2ccda, alpha: 0.40, coverage: 0.045, scaleMetres: [1.8, 0.8] },
      { id: 'clod', colour: 0x645238, alpha: 0.45, coverage: 0.10, scaleMetres: [0.6, 0.5] },
    ],
  },

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  ploughedA: {
    base: 0x795033,
    marks: [
      { id: 'wash', kind: 'soft', colour: 0x4e2917, alpha: 0.55, coverage: 0.30, scaleMetres: [22, 18] },
      { id: 'washLight', kind: 'soft', colour: 0xc19263, alpha: 0.50, coverage: 0.28, scaleMetres: [18, 15] },
      
      
      
      
      { id: 'furrow', kind: 'rows', colour: 0x381505, alpha: 0.60, coverage: 0.26, periodMetres: 5, scaleMetres: [1.3, 25] },
      { id: 'ridge', kind: 'rows', colour: 0xa87b52, alpha: 0.56, coverage: 0.20, periodMetres: 5, phase: 0.5, scaleMetres: [1.0, 25] },
      
      
      
      
      { id: 'headRow', kind: 'rows', colour: 0x5f3922, alpha: 0.60, coverage: 0.104, periodMetres: 25, scaleMetres: [25, 2.6] },
      { id: 'headland', kind: 'soft', colour: 0x946945, alpha: 0.55, coverage: 0.13, scaleMetres: [4.2, 3.0] },
      { id: 'damp', kind: 'soft', colour: 0x5f3922, alpha: 0.55, coverage: 0.14, scaleMetres: [3.2, 4.4] },
      { id: 'stone', colour: 0xa08a6d, alpha: 0.45, coverage: 0.06, scaleMetres: [0.45, 0.45] },
      { id: 'clod', colour: 0x3c2c1c, alpha: 0.45, coverage: 0.07, scaleMetres: [0.5, 0.4] },
    ],
  },
  
  
  
  
  
  ploughedB: {
    base: 0x9f8159,
    marks: [
      { id: 'wash', kind: 'soft', colour: 0x71573a, alpha: 0.55, coverage: 0.30, scaleMetres: [18, 22] },
      { id: 'washLight', kind: 'soft', colour: 0xebc78d, alpha: 0.50, coverage: 0.28, scaleMetres: [15, 18] },
      { id: 'furrow', kind: 'rows', colour: 0x5a422b, alpha: 0.60, coverage: 0.26, periodMetres: 5, scaleMetres: [25, 1.3] },
      { id: 'ridge', kind: 'rows', colour: 0xd0ae7a, alpha: 0.56, coverage: 0.20, periodMetres: 5, phase: 0.5, scaleMetres: [25, 1.0] },
      { id: 'headRow', kind: 'rows', colour: 0x846847, alpha: 0.60, coverage: 0.104, periodMetres: 25, scaleMetres: [2.6, 25] },
      { id: 'headland', kind: 'soft', colour: 0xbc9b6d, alpha: 0.55, coverage: 0.13, scaleMetres: [3.0, 4.2] },
      { id: 'damp', kind: 'soft', colour: 0x846847, alpha: 0.55, coverage: 0.14, scaleMetres: [4.4, 3.2] },
      { id: 'stone', colour: 0xbfae90, alpha: 0.45, coverage: 0.06, scaleMetres: [0.45, 0.45] },
      { id: 'clod', colour: 0x6a5238, alpha: 0.45, coverage: 0.07, scaleMetres: [0.4, 0.5] },
    ],
  },
  stubble: {
    base: 0xb38a45,
    marks: [
      { id: 'wash', kind: 'soft', colour: 0x835f27, alpha: 0.55, coverage: 0.30, scaleMetres: [22, 16] },
      { id: 'washLight', kind: 'soft', colour: 0xf5c974, alpha: 0.48, coverage: 0.28, scaleMetres: [18, 13] },
      
      
      
      { id: 'row', kind: 'rows', colour: 0x977033, alpha: 0.60, coverage: 0.25, periodMetres: 4.4, scaleMetres: [1.1, 25] },
      { id: 'rowLight', kind: 'rows', colour: 0xe5b766, alpha: 0.50, coverage: 0.205, periodMetres: 4.4, phase: 0.5, scaleMetres: [0.9, 25] },
      
      
      { id: 'headRow', kind: 'rows', colour: 0x8d783f, alpha: 0.50, coverage: 0.096, periodMetres: 25, scaleMetres: [25, 2.4] },
      
      { id: 'bale', colour: 0x6b4917, alpha: 0.65, coverage: 0.09, scaleMetres: [2.8, 2.8] },
      { id: 'bare', kind: 'soft', colour: 0xd0a458, alpha: 0.55, coverage: 0.12, scaleMetres: [4.6, 3.0] },
      { id: 'straw', colour: 0xf0dcae, alpha: 0.42, coverage: 0.08, scaleMetres: [0.5, 0.35] },
    ],
  },
  gravel: {
    base: 0x78776c,
    marks: [
      { id: 'wash', kind: 'soft', colour: 0x4a4e4c, alpha: 0.54, coverage: 0.30, scaleMetres: [19, 14] },
      { id: 'washLight', kind: 'soft', colour: 0xc3bba2, alpha: 0.50, coverage: 0.28, scaleMetres: [16, 12] },
      { id: 'track', kind: 'rows', colour: 0x343b3c, alpha: 0.45, coverage: 0.104, periodMetres: 25, scaleMetres: [2.6, 25] },
      { id: 'spill', kind: 'soft', colour: 0xa8a48f, alpha: 0.62, coverage: 0.15, scaleMetres: [5.2, 3.6] },
      { id: 'oil', colour: 0x272521, alpha: 0.58, coverage: 0.06, scaleMetres: [1.8, 1.3] },
      { id: 'chip', colour: 0x949181, alpha: 0.45, coverage: 0.11, scaleMetres: [0.4, 0.4] },
      { id: 'chipDark', colour: 0x434744, alpha: 0.45, coverage: 0.10, scaleMetres: [0.35, 0.35] },
    ],
  },
  concrete: {
    base: 0xa0a19d,
    marks: [
      { id: 'pour', kind: 'soft', colour: 0x70757a, alpha: 0.50, coverage: 0.30, scaleMetres: [17, 17] },
      { id: 'pourLight', kind: 'soft', colour: 0xefe8d5, alpha: 0.46, coverage: 0.28, scaleMetres: [14, 14] },
      
      
      
      
      
      
      { id: 'joint', kind: 'rows', envelope: false, colour: 0x4b4b4d, alpha: 0.90, coverage: 0.032, periodMetres: 12.5, scaleMetres: [0.4, 25] },
      { id: 'jointCross', kind: 'rows', envelope: false, colour: 0x4b4b4d, alpha: 0.90, coverage: 0.032, periodMetres: 12.5, scaleMetres: [25, 0.4] },
      { id: 'stain', kind: 'soft', colour: 0x838788, alpha: 0.58, coverage: 0.14, scaleMetres: [3.4, 2.8] },
      { id: 'wear', kind: 'soft', colour: 0xd3cfc1, alpha: 0.52, coverage: 0.12, scaleMetres: [2.8, 3.6] },
      { id: 'crack', colour: 0x3f3f3b, alpha: 0.55, coverage: 0.05, scaleMetres: [0.3, 4.0] },
    ],
  },

  
  dryPaddock: {
    base: 0xa09759,
    marks: [
      { id: 'burnt', kind: 'soft', colour: 0x706c39, alpha: 0.56, coverage: 0.30, scaleMetres: [22, 16] },
      { id: 'bleach', kind: 'soft', colour: 0xefdd8c, alpha: 0.50, coverage: 0.28, scaleMetres: [18, 13] },
      { id: 'bare', kind: 'soft', colour: 0x837e46, alpha: 0.66, coverage: 0.17, scaleMetres: [6.0, 4.2] },
      { id: 'shade', kind: 'soft', colour: 0x58572a, alpha: 0.62, coverage: 0.14, scaleMetres: [4.0, 5.4] },
      { id: 'clump', colour: 0xd3c47a, alpha: 0.52, coverage: 0.11, scaleMetres: [2.2, 1.8] },
      { id: 'tuft', colour: 0x9d9a5e, alpha: 0.42, coverage: 0.07, scaleMetres: [0.55, 0.5] },
      { id: 'stone', colour: 0x8f8b78, alpha: 0.42, coverage: 0.06, scaleMetres: [0.4, 0.4] },
    ],
  },
  dirt: {
    base: 0x7c6b52,
    marks: [
      { id: 'damp', kind: 'soft', colour: 0x514133, alpha: 0.58, coverage: 0.30, scaleMetres: [20, 14] },
      { id: 'dust', kind: 'soft', colour: 0xc4ae85, alpha: 0.52, coverage: 0.28, scaleMetres: [17, 12] },
      { id: 'track', kind: 'rows', colour: 0x3d2d22, alpha: 0.45, coverage: 0.096, periodMetres: 25, scaleMetres: [2.4, 25] },
      { id: 'trackLip', kind: 'rows', colour: 0xc4ae85, alpha: 0.50, coverage: 0.032, periodMetres: 25, phase: 0.11, scaleMetres: [0.8, 25] },
      { id: 'scour', kind: 'soft', colour: 0x615240, alpha: 0.66, coverage: 0.17, scaleMetres: [5.4, 6.8] },
      { id: 'scrape', colour: 0xaa9d79, alpha: 0.55, coverage: 0.11, scaleMetres: [3.4, 2.2] },
      { id: 'stone', colour: 0x857659, alpha: 0.45, coverage: 0.10, scaleMetres: [0.5, 0.45] },
      { id: 'stoneDark', colour: 0x433d2d, alpha: 0.45, coverage: 0.08, scaleMetres: [0.4, 0.35] },
    ],
  },
  rock: {
    base: 0x58595c,
    marks: [
      { id: 'shelf', kind: 'soft', colour: 0x2e333d, alpha: 0.62, coverage: 0.30, scaleMetres: [18, 14] },
      { id: 'lit', kind: 'soft', colour: 0x9f9a90, alpha: 0.58, coverage: 0.28, scaleMetres: [15, 11] },
      { id: 'boulder', colour: 0x85827e, alpha: 0.72, coverage: 0.17, scaleMetres: [5.4, 4.4] },
      { id: 'crevice', colour: 0x1c232e, alpha: 0.66, coverage: 0.11, scaleMetres: [1.4, 3.2] },
      { id: 'scree', colour: 0x72716f, alpha: 0.52, coverage: 0.11, scaleMetres: [2.2, 1.8] },
      { id: 'chip', colour: 0x3e4149, alpha: 0.45, coverage: 0.06, scaleMetres: [0.4, 0.35] },
    ],
  },

  
  
  
  
  
  
  
  
  
  
  waterClean: {
    base: 0x003f55,
    marks: [
      { id: 'deep', kind: 'soft', colour: 0x00213b, alpha: 0.62, coverage: 0.30, scaleMetres: [22, 15] },
      { id: 'shallow', kind: 'soft', colour: 0x5d7d89, alpha: 0.55, coverage: 0.26, scaleMetres: [17, 12] },
      { id: 'swell', kind: 'rows', colour: 0x2b5768, alpha: 0.50, coverage: 0.24, periodMetres: 12.5, scaleMetres: [3.0, 25] },
      { id: 'swellDark', kind: 'rows', colour: 0x002e46, alpha: 0.44, coverage: 0.16, periodMetres: 12.5, phase: 0.5, scaleMetres: [2.0, 25] },
      { id: 'weed', kind: 'soft', colour: 0x073632, alpha: 0.58, coverage: 0.10, scaleMetres: [2.6, 2.0] },
      { id: 'glint', colour: 0x99cce0, alpha: 0.48, coverage: 0.055, scaleMetres: [2.8, 0.7] },
      { id: 'ripple', colour: 0x3e97b5, alpha: 0.42, coverage: 0.10, scaleMetres: [1.0, 0.4] },
    ],
  },
  
  
  
  waterFouled: {
    base: 0x12413f,
    marks: [
      { id: 'deep', kind: 'soft', colour: 0x022323, alpha: 0.62, coverage: 0.30, scaleMetres: [22, 15] },
      { id: 'shallow', kind: 'soft', colour: 0x648173, alpha: 0.55, coverage: 0.26, scaleMetres: [17, 12] },
      { id: 'slick', kind: 'rows', colour: 0x4a6b62, alpha: 0.44, coverage: 0.192, periodMetres: 12.5, scaleMetres: [2.4, 25] },
      
      
      { id: 'scum', colour: 0x6e7844, alpha: 0.72, coverage: 0.18, scaleMetres: [4.0, 2.8] },
      { id: 'sheen', colour: 0x8a965a, alpha: 0.50, coverage: 0.08, scaleMetres: [2.2, 1.5] },
      { id: 'foam', colour: 0xaab5a6, alpha: 0.45, coverage: 0.05, scaleMetres: [1.5, 0.6] },
      { id: 'silt', colour: 0x132928, alpha: 0.45, coverage: 0.10, scaleMetres: [0.8, 0.6] },
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
