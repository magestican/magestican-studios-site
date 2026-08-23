
















export const VM_PALETTE = {
  wood:      0x8a5a2b,   
  woodDark:  0x5d3a1a,   
  metal:     0x8a90a0,   
  metalDark: 0x3a3d44,   
  metalLite: 0xc3cad6,   
  brass:     0xf4c95d,   
  red:       0xb73a2a,   
  muck:      0x7a5c3d,   
};













export const VM_TEXTURED = {
  wood:      { tex: 'wood',  tint: 0xffffff },
  woodDark:  { tex: 'wood',  tint: 0xaca49b },
  metal:     { tex: 'metal', tint: 0xd5d8e0 },
  metalDark: { tex: 'metal', tint: 0x5b5c5f },
  metalLite: { tex: 'metal', tint: 0xffffff, emissive: 0x2a2c30 },
};

const box  = (mat, size, pos, rot) => ({ kind: 'box', mat, size, pos, rot });
const blob = (mat, r, pos)         => ({ kind: 'blob', mat, r, pos });



const SHOVEL = [
  box('wood',      [0.048, 0.62, 0.048], [0, 0.06, 0]),            
  box('woodDark',  [0.056, 0.03, 0.056], [0, 0.20, 0]),            
  box('woodDark',  [0.030, 0.13, 0.030], [-0.052, 0.435, 0]),      
  box('woodDark',  [0.030, 0.13, 0.030], [0.052, 0.435, 0]),       
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



export const VIEWMODELS = {
  shovel: {
    
    
    
    signature: 'wide spade blade + D-handle',
    parts: SHOVEL,
    pose: { pos: [0.25, -0.02, -0.08], rot: [-0.16, 0.18, -2.05], scale: 0.66 },
  },
  shotgun: {
    signature: 'double barrel',
    parts: SHOTGUN,
    pose: { pos: [0, -0.01, -0.20], rot: [0.02, 0.16, 0.03], scale: 1 },
  },
  rocket: {
    
    
    signature: 'stepped red warhead + fins',
    parts: ROCKET,
    pose: { pos: [0.02, -0.02, -0.16], rot: [0.02, 0.42, 0.05], scale: 1 },
  },
};



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
