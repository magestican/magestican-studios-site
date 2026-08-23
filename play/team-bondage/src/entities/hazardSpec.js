





















export const HZ_PALETTE = {
  shell:     0xefe3c4,   
  shellDark: 0xcbb894,   
  shellLite: 0xf6f1e6,   
  crack:     0x4a3626,   
  yolk:      0xf4c95d,   
  milk:      0xf6f1e6,   
  cream:     0xf0e2b8,   
  label:     0xb73a2a,   
  foil:      0xc3cad6,   
};















export const HZ_TEXTURED = {
  shell:     { tex: 'eggshell', tint: 0xffffff, emissive: 0x554527 },
  shellLite: { tex: 'eggshell', tint: 0xffffff, emissive: 0x7a6c4e },
  milk:  { tex: 'glass',     tint: 0xffffff, emissive: 0x46443a },
  cream: { tex: 'glass',     tint: 0xf7ecc8, emissive: 0x50441f },
  label: { tex: 'milkLabel', tint: 0xffffff, emissive: 0x2a1410 },
  foil:  { tex: 'metal',     tint: 0xffffff, emissive: 0x24272c },
};

const box  = (mat, size, pos, rot) => ({ kind: 'box', mat, size, pos, rot });
const blob = (mat, r, pos)         => ({ kind: 'blob', mat, r, pos });

const cyl  = (mat, r, h, y, seg = 8) => ({ kind: 'cyl', mat, r, h, seg, pos: [0, y, 0] });









const EGG_TIERS = [
  [0.16, 0.07,  0.275],
  [0.27, 0.08,  0.205],
  [0.36, 0.10,  0.110],
  [0.42, 0.12,  0.000],   
  [0.40, 0.10, -0.105],
  [0.30, 0.09, -0.195],
  [0.16, 0.06, -0.265],
];








export const CRACK_PROUD = 0.012;

const crackSeg = (x, y, tierW, rz, len = 0.105) =>
  box('crack', [0.026, len, 0.028], [x, y, tierW / 2 + CRACK_PROUD], [0, 0, rz]);







export const CRACK_STEP = 0.090;

const EGG = [
  ...EGG_TIERS.map(([w, h, y]) => box('shell', [w, h, w], [0, y, 0])),
  
  crackSeg(0.020,  0.220, 0.27,  0.30),
  crackSeg(-0.030, 0.130, 0.36, -0.26),
  crackSeg(0.032,  0.040, 0.42,  0.24),
  
  
  crackSeg(-0.020, -0.081, 0.42, -0.22, 0.148),
  
  
  
  
  crackSeg(0.012, -0.1875, 0.30,  0.18, 0.065),
  
  
  box('crack', [0.062, 0.020, 0.028], [0.070, 0.075, 0.36 / 2 + CRACK_PROUD], [0, 0, -0.5]),
  
  
  
  
  
  
  
  box('shellLite', [0.020, 0.100, 0.026], [0.043,  0.215, 0.27 / 2 + CRACK_PROUD * 0.6], [0, 0, 0.30]),
  box('shellLite', [0.020, 0.100, 0.026], [-0.007, 0.128, 0.36 / 2 + CRACK_PROUD * 0.6], [0, 0, -0.26]),
  box('shellLite', [0.020, 0.145, 0.026], [0.004, -0.078, 0.42 / 2 + CRACK_PROUD * 0.6], [0, 0, -0.22]),
  
  
  box('crack', [0.026, 0.070, 0.030], [-(0.42 / 2 + CRACK_PROUD),  0.010,  0.030], [0.26, 0, 0]),
  box('crack', [0.026, 0.062, 0.030], [-(0.40 / 2 + CRACK_PROUD), -0.070, -0.020], [-0.22, 0, 0]),
  
  
  
  blob('yolk', 0.062, [0.010, -0.012, 0.238]),
  blob('yolk', 0.034, [-0.022, -0.100, 0.208]),   
  blob('yolk', 0.026, [0.044,  0.072, 0.196]),    
  
  
  box('shell',     [0.085, 0.018, 0.072], [0.082, 0.128, 0.176], [0.62, 0.20, -0.34]),
  box('shellDark', [0.072, 0.012, 0.060], [0.078, 0.116, 0.170], [0.62, 0.20, -0.34]),
];







export const LABEL_R = 0.182;   

const MILK = [
  cyl('milk',  0.185, 0.030, -0.235),   
  cyl('milk',  0.175, 0.300, -0.100),   
  cyl('milk',  0.155, 0.060,  0.075),   
  cyl('cream', 0.125, 0.060,  0.135),   
  cyl('milk',  0.078, 0.100,  0.215),   
  cyl('foil',  0.085, 0.012,  0.262),   
  cyl('foil',  0.095, 0.035,  0.283),   
  cyl('label', LABEL_R, 0.170, -0.090), 
];




export const LABEL_REPEAT = 4;



export const LABEL_UV_OFFSET = 1 / 16;









export const HAZARD_SCALE = 1.34;

export const HAZARDS = {
  egg: {
    signature: 'cracked shell + gold yolk seep',
    parts: EGG,
    scale: HAZARD_SCALE,
    
    
    
    
    
    
    
    spin: { x: 6.5, z: 4.0 },
  },
  milk: {
    signature: 'bottle neck + red MILK band',
    parts: MILK,
    scale: HAZARD_SCALE,
    spin: { x: 3.2, z: 1.9 },
  },
};




export function specBounds(parts) {
  const lo = [Infinity, Infinity, Infinity];
  const hi = [-Infinity, -Infinity, -Infinity];
  for (const p of parts) {
    let half;
    if (p.kind === 'blob') half = [p.r, p.r, p.r];
    else if (p.kind === 'cyl') half = [p.r, p.h / 2, p.r];
    else half = p.size.map((s) => s / 2);
    for (let i = 0; i < 3; i++) {
      lo[i] = Math.min(lo[i], p.pos[i] - half[i]);
      hi[i] = Math.max(hi[i], p.pos[i] + half[i]);
    }
  }
  return { lo, hi, size: hi.map((h, i) => h - lo[i]) };
}
