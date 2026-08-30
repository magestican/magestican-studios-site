


































const luma8 = (hex) => 0.2126 * ((hex >> 16) & 255)
  + 0.7152 * ((hex >> 8) & 255)
  + 0.0722 * (hex & 255);


export const luma = luma8;



























export const ROAD_RECIPE = {
  summer: {
    base: 0x6d5b45,
    marks: [
      
      
      { id: 'bandDark', colour: 0x5a4a37, alpha: 0.34, coverage: 0.22, scaleMetres: [26, 2.0] },
      { id: 'bandLight', colour: 0x87735a, alpha: 0.34, coverage: 0.22, scaleMetres: [26, 2.0] },
      
      
      
      
      { id: 'dryPatch', colour: 0xa08a6d, alpha: 0.58, coverage: 0.15, scaleMetres: [3.5, 4.5] },
      { id: 'gravel', colour: 0x413528, alpha: 0.42, coverage: 0.10, scaleMetres: [2.0, 3.0] },
      
      { id: 'rut', colour: 0x5a4a37, alpha: 0.95, coverage: 0.17, scaleMetres: [2.2, 8] },
      { id: 'rutDeep', colour: 0x413528, alpha: 0.80, coverage: 0.07, scaleMetres: [0.9, 8] },
      { id: 'rutLip', colour: 0xa08a6d, alpha: 0.55, coverage: 0.05, scaleMetres: [0.5, 8] },
      
      { id: 'crown', colour: 0x87735a, alpha: 0.30, coverage: 0.09, scaleMetres: [1.4, 8] },
      { id: 'grit', colour: 0x413528, alpha: 0.50, coverage: 0.05, scaleMetres: [0.15, 0.15] },
      { id: 'gritLight', colour: 0xa08a6d, alpha: 0.50, coverage: 0.05, scaleMetres: [0.15, 0.15] },
    ],
  },
  mud: {
    base: 0x6b5741,
    marks: [
      { id: 'bandDark', colour: 0x4a3a2a, alpha: 0.34, coverage: 0.22, scaleMetres: [26, 2.0] },
      { id: 'bandLight', colour: 0x8a7454, alpha: 0.34, coverage: 0.22, scaleMetres: [26, 2.0] },
      { id: 'dryPatch', colour: 0xa08a6d, alpha: 0.58, coverage: 0.16, scaleMetres: [3.5, 4.5] },
      { id: 'gravel', colour: 0x33281c, alpha: 0.38, coverage: 0.07, scaleMetres: [2.0, 3.0] },
      { id: 'rut', colour: 0x4a3a2a, alpha: 0.95, coverage: 0.17, scaleMetres: [2.2, 8] },
      { id: 'rutDeep', colour: 0x33281c, alpha: 0.85, coverage: 0.07, scaleMetres: [0.9, 8] },
      { id: 'rutLip', colour: 0x8a7454, alpha: 0.55, coverage: 0.05, scaleMetres: [0.5, 8] },
      
      
      
      { id: 'puddle', colour: 0x2f2a24, alpha: 0.55, coverage: 0.09, scaleMetres: [2.2, 1.2] },
      { id: 'puddleSky', colour: 0xd8e9f6, alpha: 0.30, coverage: 0.04, scaleMetres: [1.5, 0.6] },
      { id: 'grit', colour: 0x33281c, alpha: 0.50, coverage: 0.05, scaleMetres: [0.15, 0.15] },
      { id: 'gritLight', colour: 0x8a7454, alpha: 0.50, coverage: 0.05, scaleMetres: [0.15, 0.15] },
    ],
  },
  snow: {
    
    
    
    base: 0xc2d2e2,
    marks: [
      { id: 'bandDark', colour: 0x9fb3c6, alpha: 0.34, coverage: 0.22, scaleMetres: [26, 2.0] },
      { id: 'bandLight', colour: 0xf2f8ff, alpha: 0.34, coverage: 0.22, scaleMetres: [26, 2.0] },
      { id: 'dryPatch', colour: 0xf2f8ff, alpha: 0.55, coverage: 0.13, scaleMetres: [3.5, 4.5] },
      { id: 'gravel', colour: 0x6f5a44, alpha: 0.32, coverage: 0.08, scaleMetres: [2.0, 3.0] },
      { id: 'rut', colour: 0x8a7a63, alpha: 0.95, coverage: 0.17, scaleMetres: [2.2, 8] },
      { id: 'rutDeep', colour: 0x5a4a37, alpha: 0.68, coverage: 0.06, scaleMetres: [0.9, 8] },
      { id: 'rutLip', colour: 0xf2f8ff, alpha: 0.55, coverage: 0.05, scaleMetres: [0.5, 8] },
      
      
      { id: 'hollow', colour: 0xa8c0da, alpha: 0.42, coverage: 0.12, scaleMetres: [1.8, 0.9] },
      { id: 'grit', colour: 0x5a4a37, alpha: 0.50, coverage: 0.04, scaleMetres: [0.15, 0.15] },
      { id: 'gritLight', colour: 0xf2f8ff, alpha: 0.50, coverage: 0.05, scaleMetres: [0.15, 0.15] },
    ],
  },
};











export const FIELD_RECIPE = {
  summer: {
    base: 0x5f8b3f,
    marks: [
      { id: 'fieldWarm', colour: 0xa8a24e, alpha: 0.38, coverage: 0.22, scaleMetres: [14, 10] },
      { id: 'fieldDark', colour: 0x4a6f31, alpha: 0.38, coverage: 0.20, scaleMetres: [14, 10] },
      { id: 'plough', colour: 0x3c5827, alpha: 0.26, coverage: 0.10, scaleMetres: [1.0, 12] },
      { id: 'hedge', colour: 0x2c4420, alpha: 0.55, coverage: 0.07, scaleMetres: [0.6, 20] },
      { id: 'clumpLight', colour: 0x7ba750, alpha: 0.34, coverage: 0.20, scaleMetres: [1.2, 1.0] },
      { id: 'clumpDark', colour: 0x3c5827, alpha: 0.34, coverage: 0.20, scaleMetres: [1.2, 1.0] },
      { id: 'stubble', colour: 0xc2b174, alpha: 0.30, coverage: 0.08, scaleMetres: [0.6, 0.6] },
    ],
  },
  mud: {
    base: 0x546b38,
    marks: [
      { id: 'fieldWarm', colour: 0x9c9358, alpha: 0.46, coverage: 0.26, scaleMetres: [14, 10] },
      { id: 'fieldDark', colour: 0x4a3a2a, alpha: 0.38, coverage: 0.15, scaleMetres: [14, 10] },
      { id: 'plough', colour: 0x3a2f22, alpha: 0.26, coverage: 0.10, scaleMetres: [1.0, 12] },
      { id: 'hedge', colour: 0x2b3a22, alpha: 0.55, coverage: 0.07, scaleMetres: [0.6, 20] },
      { id: 'clumpLight', colour: 0x7d9757, alpha: 0.42, coverage: 0.22, scaleMetres: [1.2, 1.0] },
      { id: 'clumpDark', colour: 0x3a2f22, alpha: 0.34, coverage: 0.17, scaleMetres: [1.2, 1.0] },
      { id: 'stubble', colour: 0xb09a72, alpha: 0.30, coverage: 0.08, scaleMetres: [0.6, 0.6] },
    ],
  },
  snow: {
    base: 0xe2eef8,
    marks: [
      { id: 'fieldWarm', colour: 0xf6fbff, alpha: 0.38, coverage: 0.22, scaleMetres: [14, 10] },
      { id: 'fieldDark', colour: 0xa8c0da, alpha: 0.42, coverage: 0.22, scaleMetres: [14, 10] },
      { id: 'plough', colour: 0x8fa8c4, alpha: 0.30, coverage: 0.10, scaleMetres: [1.0, 12] },
      
      
      { id: 'hedge', colour: 0x4c5f70, alpha: 0.62, coverage: 0.07, scaleMetres: [0.6, 20] },
      { id: 'clumpLight', colour: 0xf2f8ff, alpha: 0.34, coverage: 0.20, scaleMetres: [1.2, 1.0] },
      { id: 'clumpDark', colour: 0xa8c0da, alpha: 0.38, coverage: 0.20, scaleMetres: [1.2, 1.0] },
      { id: 'stubble', colour: 0xc2b174, alpha: 0.34, coverage: 0.08, scaleMetres: [0.6, 0.6] },
    ],
  },
};















export function compositeBuckets(recipe) {
  let buckets = [{ v: luma8(recipe.base), w: 1 }];
  for (const mark of recipe.marks) {
    const target = luma8(mark.colour);
    const next = [];
    for (const b of buckets) {
      if (mark.coverage > 0) next.push({ v: b.v + (target - b.v) * mark.alpha, w: b.w * mark.coverage });
      if (mark.coverage < 1) next.push({ v: b.v, w: b.w * (1 - mark.coverage) });
    }
    buckets = next;
  }
  return buckets.sort((a, b) => a.v - b.v);
}


export function compositePercentile(recipe, p) {
  const buckets = compositeBuckets(recipe);
  const total = buckets.reduce((a, b) => a + b.w, 0);
  let acc = 0;
  for (const b of buckets) {
    acc += b.w;
    if (acc >= p * total) return b.v;
  }
  return buckets[buckets.length - 1].v;
}








export function compositeSpread(recipe) {
  return compositePercentile(recipe, 0.95) - compositePercentile(recipe, 0.05);
}


export function compositeMean(recipe) {
  const buckets = compositeBuckets(recipe);
  const total = buckets.reduce((a, b) => a + b.w, 0);
  return buckets.reduce((a, b) => a + b.v * b.w, 0) / total;
}



















export const MIN_ROAD_FIELD_GAP = { summer: 25, mud: 12, snow: 25 };


export const RECIPE_THEMES = ['summer', 'mud', 'snow'];

export const roadRecipe = (theme) => ROAD_RECIPE[theme] ?? ROAD_RECIPE.summer;
export const fieldRecipe = (theme) => FIELD_RECIPE[theme] ?? FIELD_RECIPE.summer;
