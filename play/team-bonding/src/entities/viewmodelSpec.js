
















export const VM_PALETTE = {
  wood:      0x8a5a2b,   
  woodDark:  0x5d3a1a,   
  metal:     0x8a90a0,   
  metalDark: 0x3a3d44,   
  metalLite: 0xc3cad6,   
  brass:     0xf4c95d,   
  red:       0xb73a2a,   
  muck:      0x7a5c3d,   
  
  
  
  
  
  
  
  meat:      0xa02020,   
  fat:       0xffe8b0,   
  
  
  
  bone:      0xf6f1e6,   
};













export const VM_TEXTURED = {
  wood:      { tex: 'wood',  tint: 0xffffff },
  woodDark:  { tex: 'wood',  tint: 0xaca49b },
  metal:     { tex: 'metal', tint: 0xd5d8e0 },
  metalDark: { tex: 'metal', tint: 0x5b5c5f },
  metalLite: { tex: 'metal', tint: 0xffffff, emissive: 0x2a2c30 },
};






export const VM_EMISSIVE = {
  meat: 0x300808,
  
  
  
  
  bone: 0x554e3e,
};

const box  = (mat, size, pos, rot) => ({ kind: 'box', mat, size, pos, rot });
const blob = (mat, r, pos)         => ({ kind: 'blob', mat, r, pos });



const SHOVEL = [
  box('wood',      [0.048, 0.62, 0.048], [0, 0.06, 0]),            
  box('woodDark',  [0.056, 0.03, 0.056], [0, 0.20, 0]),            
  
  
  
  
  
  
  
  box('woodDark',  [0.030, 0.13, 0.030], [-0.045, 0.435, 0], [0, 0, 0.20]),   
  box('woodDark',  [0.030, 0.13, 0.030], [0.045, 0.435, 0], [0, 0, -0.20]),   
  box('woodDark',  [0.155, 0.036, 0.042], [0, 0.508, 0]),          
  box('metalDark', [0.078, 0.11, 0.070], [0, -0.29, 0]),           
  
  
  box('metal',     [0.200, 0.200, 0.036], [0, -0.415, 0]),         
  box('metal',     [0.185, 0.120, 0.036], [0, -0.575, 0]),         
  box('metal',     [0.140, 0.100, 0.036], [0, -0.685, 0]),         
  box('metalLite', [0.125, 0.034, 0.044], [0, -0.742, 0]),         
  box('metalDark', [0.038, 0.300, 0.026], [0, -0.520, -0.028]),    
  box('metalDark', [0.032, 0.030, 0.046], [-0.050, -0.720, 0]),    
  
  
  
  box('muck',      [0.090, 0.032, 0.008], [0.016, -0.620, 0.022]), 
  blob('muck',     0.040, [-0.045, -0.360, 0.045]),                
];




const SHOTGUN = [
  box('metalDark', [0.052, 0.055, 0.62], [-0.038, 0.005, -0.24]),  
  box('metalDark', [0.052, 0.055, 0.62], [0.038, 0.005, -0.24]),   
  box('metalLite', [0.020, 0.016, 0.56], [0, 0.034, -0.24]),       
  box('metalLite', [0.060, 0.062, 0.05], [-0.038, 0.005, -0.53]),  
  box('metalLite', [0.060, 0.062, 0.05], [0.038, 0.005, -0.53]),   
  box('brass',     [0.078, 0.070, 0.04], [0, 0.005, -0.34]),       
  box('wood',      [0.082, 0.070, 0.22], [0, -0.045, -0.20]),      
  box('metal',     [0.086, 0.105, 0.20], [0, -0.020, 0.03]),       
  box('brass',     [0.090, 0.050, 0.035], [0, -0.020, 0.132]),     
  box('metalDark', [0.018, 0.045, 0.020], [0, -0.085, 0.10]),      
  box('wood',      [0.070, 0.115, 0.26], [0, -0.058, 0.245], [-0.10, 0, 0]),   
  box('woodDark',  [0.074, 0.122, 0.030], [0, -0.083, 0.378], [-0.10, 0, 0]),  
  box('woodDark',  [0.076, 0.026, 0.13], [0, -0.008, 0.215], [-0.10, 0, 0]),   
  box('brass',     [0.020, 0.022, 0.020], [0, 0.045, -0.52]),      
];





const ROCKET = [
  box('metal',     [0.150, 0.150, 0.60], [0, 0, -0.20]),           
  box('brass',     [0.158, 0.158, 0.045], [0, 0, -0.34]),          
  box('brass',     [0.158, 0.158, 0.045], [0, 0, -0.06]),          
  box('metalDark', [0.154, 0.052, 0.12], [0, 0.030, -0.20]),       
  box('red',       [0.150, 0.150, 0.090], [0, 0, -0.540]),         
  box('red',       [0.110, 0.110, 0.070], [0, 0, -0.615]),         
  box('red',       [0.070, 0.070, 0.055], [0, 0, -0.672]),         
  box('metalLite', [0.030, 0.030, 0.035], [0, 0, -0.708]),         
  box('metal',     [0.165, 0.165, 0.060], [0, 0, 0.115]),          
  box('metalDark', [0.014, 0.110, 0.130], [-0.086, 0, 0.020]),     
  box('metalDark', [0.014, 0.110, 0.130], [0.086, 0, 0.020]),      
  box('metalDark', [0.110, 0.014, 0.130], [0, 0.086, 0.020]),      
  box('woodDark',  [0.055, 0.100, 0.075], [0, -0.115, 0.055]),     
  box('woodDark',  [0.050, 0.090, 0.060], [0, -0.105, -0.285]),    
  box('metalDark', [0.045, 0.030, 0.220], [0, 0.092, -0.185]),     
  box('brass',     [0.020, 0.045, 0.020], [0, 0.128, -0.285]),     
];


















const STEAK = [
  
  
  
  
  
  box('meat',     [0.52, 0.25, 0.09], [-0.18, 0.10, 0]),       
  box('meat',     [0.36, 0.09, 0.09], [-0.24, 0.245, 0]),      
  box('meat',     [0.34, 0.09, 0.09], [-0.20, -0.05, 0]),      
  box('meat',     [0.13, 0.20, 0.09], [-0.48, 0.11, 0]),       
  
  
  
  
  
  
  
  
  box('fat',      [0.34, 0.07, 0.095], [-0.23, 0.325, 0]),     
  box('fat',      [0.20, 0.14, 0.095], [-0.44, 0.235, 0]),     
  box('fat',      [0.07, 0.18, 0.095], [-0.575, 0.15, 0]),     
  
  
  
  
  box('fat',      [0.26, 0.022, 0.11], [-0.22, 0.155, 0]),
  box('fat',      [0.17, 0.020, 0.11], [-0.13, 0.055, 0]),
  
  
  
  
  box('woodDark', [0.32, 0.05, 0.095], [-0.20, -0.085, 0]),    
  box('woodDark', [0.05, 0.15, 0.095], [0.085, 0.10, 0]),      
  
  
  
  
  
  
  box('bone',     [0.10, 0.52, 0.10], [0.06, -0.04, 0], [0, 0, 0.85]),   
  box('bone',     [0.15, 0.13, 0.13], [0.285, -0.235, 0]),               
];













const CHICKEN = [
  box('wood',      [0.075, 0.34, 0.075], [0, -0.30, 0]),                    
  box('woodDark',  [0.088, 0.10, 0.088], [0, -0.34, 0]),                    
  box('wood',      [0.20, 0.10, 0.075], [0, -0.10, 0]),                     
  
  
  
  box('wood',      [0.060, 0.36, 0.070], [-0.115, 0.106, 0], [0, 0, 0.40]), 
  box('wood',      [0.060, 0.36, 0.070], [0.115, 0.106, 0], [0, 0, -0.40]), 
  
  
  
  box('metalLite', [0.080, 0.060, 0.085], [-0.190, 0.276, 0]),
  box('metalLite', [0.080, 0.060, 0.085], [0.190, 0.276, 0]),
  
  
  
  
  
  
  
  
  
  
  box('woodDark',  [0.030, 0.030, 0.22], [-0.1375, 0.2405, 0.060], [0.419, 0.719, 0]),
  box('woodDark',  [0.030, 0.030, 0.22], [0.1375, 0.2405, 0.060], [0.419, -0.719, 0]),
  
  
  
  
  
  
  
  
  
  
  box('bone',      [0.20, 0.16, 0.17], [0, 0.185, 0.100]),                  
  box('woodDark',  [0.09, 0.13, 0.05], [0.125, 0.255, 0.100], [0, 0, -0.5]),
  box('bone',      [0.10, 0.11, 0.10], [-0.13, 0.265, 0.100]),              
  box('red',       [0.09, 0.07, 0.035], [-0.135, 0.345, 0.100]),            
  box('red',       [0.035, 0.055, 0.030], [-0.175, 0.205, 0.100]),          
  box('brass',     [0.075, 0.038, 0.038], [-0.215, 0.255, 0.100]),          
  box('woodDark',  [0.024, 0.024, 0.024], [-0.145, 0.285, 0.047]),          
  box('woodDark',  [0.024, 0.024, 0.024], [-0.145, 0.285, 0.153]),          
  box('brass',     [0.030, 0.11, 0.030], [-0.045, 0.065, 0.100]),           
  box('brass',     [0.030, 0.11, 0.030], [0.035, 0.065, 0.100]),            
];










export const VIEWMODELS = {
  shovel: {
    
    
    
    signature: 'wide spade blade + D-handle',
    bright: 'metalLite',
    parts: SHOVEL,
    pose: { pos: [0.25, -0.02, -0.08], rot: [-0.16, 0.18, -2.05], scale: 0.66 },
  },
  shotgun: {
    signature: 'double barrel',
    bright: 'metalLite',
    parts: SHOTGUN,
    pose: { pos: [0, -0.01, -0.20], rot: [0.02, 0.16, 0.03], scale: 1 },
  },
  rocket: {
    
    
    signature: 'stepped red warhead + fins',
    bright: 'metalLite',
    parts: ROCKET,
    pose: { pos: [0.02, -0.02, -0.16], rot: [0.02, 0.42, 0.05], scale: 1 },
  },
  steak: {
    
    
    
    
    
    signature: 'bone handle + fat-capped red slab',
    bright: 'fat',
    parts: STEAK,
    pose: { pos: [0.12, 0.01, -0.10], rot: [-0.08, 0.20, -0.20], scale: 0.72 },
  },
  chicken: {
    
    
    
    
    signature: 'Y-fork slingshot + loaded white chicken',
    bright: 'metalLite',
    parts: CHICKEN,
    pose: { pos: [0.02, -0.02, -0.12], rot: [0.06, -0.30, -0.22], scale: 0.78 },
  },
};


































export const MUZZLES = Object.freeze({
  shovel:  [-0.045, -0.470, 0.060],
  shotgun: [0, 0.005, -0.575],
  rocket:  [0, 0, -0.735],
  steak:   [-0.50, 0.15, 0.07],
  chicken: [-0.16, 0.26, 0.10],
});





export function muzzleFor(viewmodelId) {
  return MUZZLES[viewmodelId] || [0, 0, 0];
}





























export const RECOIL = Object.freeze({
  shovel:  { back: 0.075, pitch: 0.16, roll: -0.09, punch: 0.035, settle: 0.16, flash: 0 },
  shotgun: { back: 0.190, pitch: 0.34, roll: 0.05, punch: 0.045, settle: 0.30, flash: 0.16 },
  rocket:  { back: 0.230, pitch: 0.30, roll: -0.07, punch: 0.060, settle: 0.42, flash: 0.26 },
  steak:   { back: 0.110, pitch: 0.22, roll: 0.14, punch: 0.055, settle: 0.24, flash: 0 },
  chicken: { back: 0.140, pitch: 0.26, roll: -0.16, punch: 0.050, settle: 0.28, flash: 0 },
});

export function recoilFor(viewmodelId) {
  return RECOIL[viewmodelId] || RECOIL.shovel;
}











export function recoilPhase(age, { punch, settle }) {
  if (!(age >= 0)) return 0;
  if (age < punch) {
    const t = age / punch;
    return 1 - (1 - t) * (1 - t);        
  }
  const t = (age - punch) / settle;
  if (t >= 1) return 0;
  return 1 - (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
}


export function recoilDuration(id) {
  const r = recoilFor(id);
  return r.punch + r.settle;
}



export function specBounds(parts) {
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const p of parts) {
    const half = p.kind === 'blob' ? [p.r, p.r, p.r] : p.size.map((s) => s / 2);
    for (let i = 0; i < 3; i++) {
      lo[i] = Math.min(lo[i], p.pos[i] - half[i]);
      hi[i] = Math.max(hi[i], p.pos[i] + half[i]);
    }
  }
  return { lo, hi, size: hi.map((h, i) => h - lo[i]) };
}























export const WEAPON_VIEWMODEL = {
  shovel:  'shovel',
  shotgun: 'shotgun',
  rocket:  'rocket',
  steak:   'steak',
  chicken: 'chicken',
};

export const DEFAULT_VIEWMODEL = 'shovel';

export function viewmodelFor(weaponId, warn = defaultWarn) {
  const id = WEAPON_VIEWMODEL[weaponId];
  if (id && VIEWMODELS[id]) return id;
  warn(`[viewmodel] weapon "${weaponId}" has no viewmodel -- holding the `
     + `${DEFAULT_VIEWMODEL} instead. Add it to WEAPON_VIEWMODEL and VIEWMODELS `
     + `in entities/viewmodelSpec.js.`);
  return DEFAULT_VIEWMODEL;
}

function defaultWarn(msg) {
  if (typeof console !== 'undefined') console.warn(msg);
}


















export const PICKUP_VIEWMODELS = new Set(['steak', 'chicken']);

export function isPickupViewmodel(id) { return PICKUP_VIEWMODELS.has(id); }

export function activeViewmodel({ chickenAmmo = 0, steakAmmo = 0, weaponId } = {}, warn) {
  if (chickenAmmo > 0) return 'chicken';
  if (steakAmmo > 0) return 'steak';
  return viewmodelFor(weaponId, warn);
}
