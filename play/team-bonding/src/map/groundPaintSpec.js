



























export const GROUND_PALETTE = Object.freeze({
  snow:       '#dce9f7',   
                           
                           
  snowCrest:  '#f2f8ff',   
  snowHollow: '#93b2d1',   
                           
                           
                           
  glint:      '#fbfdff',   
  ice:        '#b8e0ef',   
  iceDeep:    '#6fa3bd',   
  iceSheen:   '#dcf3fb',   
  grit:       '#8d9aa6',   

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  trodden:     '#8a9cb2',  
  troddenRim:  '#eaf2fb',  
  troddenDeep: '#5a6e85',  
  straw:       '#c1a45e',  
                           
                           
  mud:         '#7d6a55',  
                           
                           
                           
  rutSnow:     '#7f93ab',  
                           
                           
  rutLip:      '#f0f6fd',  
  rutFloor:    '#4e647c',  
});




const GROUND_PAINT_VIRGIN = {
  snow: Object.freeze({
    name: 'snow',
    field: GROUND_PALETTE.snow,
    crest: GROUND_PALETTE.snowCrest,
    hollow: GROUND_PALETTE.snowHollow,
    
    
    
    ripples: 5,
    rippleRows: 4,          
    rippleWander: 2.2,      
    
    
    hollows: 6,
    hollowAlpha: 0.30,
    glints: 22,             
    grit: 9,                
    noise: 16,              
    
    
    edgeCrest: 0.26,
    edgeHollow: 0.14,
    
    
    
    
    edgeBreakup: 0.55,
    seed: 401,
  }),
  ice: Object.freeze({
    name: 'ice',
    field: GROUND_PALETTE.ice,
    crest: GROUND_PALETTE.iceSheen,
    hollow: GROUND_PALETTE.iceDeep,
    
    
    
    cracks: 4,
    crackBranches: 2,
    crackAlpha: 0.5,
    
    
    
    
    
    
    crackWander: 0.32,
    
    bubbles: 14,
    
    sheens: 3,
    sheenAlpha: 0.34,
    noise: 10,
    edgeCrest: 0.16,
    edgeHollow: 0.22,       
    edgeBreakup: 0.5,
    seed: 613,
  }),
};



















export const TILE_SUN = Object.freeze({ x: 0.83, y: 0.55 });

export const GROUND_PAINT_WEAR = Object.freeze({
  trodden: Object.freeze({
    name: 'trodden',
    field: GROUND_PALETTE.trodden,
    crest: GROUND_PALETTE.troddenRim,
    hollow: GROUND_PALETTE.troddenDeep,
    
    
    
    
    
    
    
    
    
    printPairs: 3,
    printLen: 17,           
    printWide: 7,
    printStride: 20,        
    printSpread: 6,         
    printAlpha: 0.46,
    printFade: 0.45,        
                            
    printLugs: 3,           
                            
    printRim: 0.42,         
    
    
    
    churn: 16,
    churnAlpha: 0.24,
    
    
    
    
    
    straws: 11,
    mudPatches: 4,
    mudRadius: 3.2,
    mudAlpha: 0.34,
    noise: 18,
    edgeCrest: 0.16,        
    edgeHollow: 0.12,       
    edgeBreakup: 0.42,
    variantSeeds: Object.freeze([727, 941]),
  }),
  rut: Object.freeze({
    name: 'rut',
    field: GROUND_PALETTE.rutSnow,
    crest: GROUND_PALETTE.rutLip,
    hollow: GROUND_PALETTE.rutFloor,
    
    
    
    rutWidth: 0.40,         
    
    
    treads: 9,
    treadLean: 0.42,        
                            
    treadAlpha: 0.46,
    lipRows: 3,             
    lipAlpha: 0.4,
    lipWander: 1.6,         
                            
                            
                            
                            
    
    mudSpecks: 16,
    mudAlpha: 0.4,
    noise: 14,
    edgeCrest: 0.12,
    edgeHollow: 0.1,
    edgeBreakup: 0.3,
    
    
    
    edgeOnly: 'horizontal',
    seed: 1153,
  }),
});



export const GROUND_MATERIALS = Object.freeze(['snow', 'ice', 'trodden', 'rut']);




export const GROUND_SIGNATURE = Object.freeze({
  snow: 'ripples', ice: 'cracks', trodden: 'printPairs', rut: 'treads',
});



export const GROUND_PAINT = Object.freeze({
  ...GROUND_PAINT_VIRGIN,
  ...GROUND_PAINT_WEAR,
});
