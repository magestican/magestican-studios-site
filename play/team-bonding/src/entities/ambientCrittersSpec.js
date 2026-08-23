








const BLACK  = 0x1a1c22;   
const BELLY  = 0xf4f2ea;   
const BEAK   = 0xe8a13c;
const FOOT   = 0xd88a2e;
const EYE    = 0x0d0e11;
const EYE_LIT = 0xf6f4ee;  








export const PENGUIN = Object.freeze({
  scale: 0.62,
  parts: Object.freeze([
    
    
    { p: [0, 0.52, 0,      0.52, 0.86, 0.42], hex: BLACK },
    { p: [0, 1.06, 0,      0.44, 0.30, 0.38], hex: BLACK },
    
    
    
    
    
    
    { p: [0, 0.46, 0.215,  0.26, 0.58, 0.02], hex: BELLY },
    { p: [0, 0.76, 0.212,  0.16, 0.10, 0.02], hex: BELLY },
    
    
    { p: [0, 1.34, 0.02,   0.34, 0.32, 0.32], hex: BLACK },
    
    
    { p: [ 0.175, 1.30, 0.05, 0.02, 0.20, 0.22], hex: BELLY },
    { p: [-0.175, 1.30, 0.05, 0.02, 0.20, 0.22], hex: BELLY },
    { p: [0, 1.22, 0.17,   0.26, 0.12, 0.02], hex: BELLY },
    
    
    { p: [ 0.10, 1.38, 0.155, 0.10, 0.10, 0.03], hex: EYE_LIT },
    { p: [-0.10, 1.38, 0.155, 0.10, 0.10, 0.03], hex: EYE_LIT },
    { p: [ 0.10, 1.38, 0.170, 0.05, 0.05, 0.03], hex: EYE },
    { p: [-0.10, 1.38, 0.170, 0.05, 0.05, 0.03], hex: EYE },
    
    { p: [0, 1.27, 0.24,   0.08, 0.08, 0.20], hex: BEAK, tilt: 0.25 },
    
    
    
    { p: [ 0.29, 0.62, -0.02, 0.07, 0.60, 0.24], hex: BLACK, tilt: -0.12,
      role: 'flipper', side: 1,  pivot: [0.29, 0.90, -0.02] },
    { p: [-0.29, 0.62, -0.02, 0.07, 0.60, 0.24], hex: BLACK, tilt: -0.12,
      role: 'flipper', side: -1, pivot: [-0.29, 0.90, -0.02] },
    
    { p: [0, 0.14, -0.26,  0.24, 0.10, 0.22], hex: BLACK, tilt: 0.35 },
    
    { p: [ 0.13, 0.05, 0.12, 0.18, 0.10, 0.28], hex: FOOT },
    { p: [-0.13, 0.05, 0.12, 0.18, 0.10, 0.28], hex: FOOT },
  ]),
});














const GOOSE_BLACK = 0x191b20;   
const GOOSE_BODY  = 0x8a7355;   
const GOOSE_PALE  = 0xd9d2c4;   
const GOOSE_FOOT  = 0xd88a2e;

export const GOOSE = Object.freeze({
  scale: 0.66,
  parts: Object.freeze([
    
    
    
    
    
    
    { p: [0, 0.66, 0.02,   0.44, 0.42, 0.78], hex: GOOSE_BODY },
    
    { p: [0, 0.60, 0.30,   0.40, 0.34, 0.26], hex: GOOSE_BODY },
    
    
    { p: [0, 0.74, -0.34,  0.30, 0.26, 0.26], hex: GOOSE_BODY },
    
    
    { p: [ 0.225, 0.56, 0.04, 0.02, 0.20, 0.54], hex: GOOSE_PALE },
    { p: [-0.225, 0.56, 0.04, 0.02, 0.20, 0.54], hex: GOOSE_PALE },
    
    
    
    
    
    
    
    
    
    { p: [ 0.11, 0.28, 0.12, 0.075, 0.38, 0.075], hex: GOOSE_FOOT },
    { p: [-0.11, 0.28, 0.12, 0.075, 0.38, 0.075], hex: GOOSE_FOOT },
    
    
    { p: [0, 1.04, 0.32,   0.17, 0.52, 0.17], hex: GOOSE_BLACK },
    { p: [0, 1.36, 0.34,   0.16, 0.22, 0.16], hex: GOOSE_BLACK },
    
    { p: [0, 1.52, 0.36,   0.20, 0.20, 0.26], hex: GOOSE_BLACK },
    
    
    { p: [ 0.10, 1.46, 0.36, 0.02, 0.15, 0.16], hex: GOOSE_PALE },
    { p: [-0.10, 1.46, 0.36, 0.02, 0.15, 0.16], hex: GOOSE_PALE },
    { p: [0, 1.40, 0.36,   0.18, 0.03, 0.15], hex: GOOSE_PALE },
    
    
    { p: [ 0.075, 1.56, 0.43, 0.07, 0.07, 0.03], hex: EYE_LIT },
    { p: [-0.075, 1.56, 0.43, 0.07, 0.07, 0.03], hex: EYE_LIT },
    { p: [ 0.075, 1.56, 0.442, 0.035, 0.035, 0.03], hex: EYE },
    { p: [-0.075, 1.56, 0.442, 0.035, 0.035, 0.03], hex: EYE },
    
    { p: [0, 1.50, 0.51,   0.11, 0.09, 0.16], hex: GOOSE_BLACK },
    
    { p: [0, 0.80, -0.50,  0.24, 0.13, 0.22], hex: GOOSE_BLACK, tilt: -0.3 },
    
    
    { p: [ 0.25, 0.70, 0.02, 0.09, 0.30, 0.58], hex: GOOSE_BODY,
      role: 'flipper', side: 1,  pivot: [0.23, 0.86, 0.06] },
    { p: [-0.25, 0.70, 0.02, 0.09, 0.30, 0.58], hex: GOOSE_BODY,
      role: 'flipper', side: -1, pivot: [-0.23, 0.86, 0.06] },
    
    { p: [ 0.11, 0.05, 0.17, 0.16, 0.10, 0.28], hex: GOOSE_FOOT },
    { p: [-0.11, 0.05, 0.17, 0.16, 0.10, 0.28], hex: GOOSE_FOOT },
  ]),
});


























const GOAT_COAT = 0xe4dbc8;   
                              
const GOAT_DARK = 0x4a4239;   
const GOAT_HORN = 0x241f1b;   
const GOAT_EYE  = 0x14120f;

export const GOAT = Object.freeze({
  scale: 0.58,
  
  
  
  
  
  
  rearUp: Object.freeze({ pivotZ: -0.44 }),
  parts: Object.freeze([
    
    
    
    
    { p: [ 0.20, 0.44,  0.40, 0.15, 0.88, 0.17], hex: GOAT_DARK,
      role: 'foreleg', side:  1, pivot: [ 0.20, 0.86, 0.40] },
    { p: [-0.20, 0.44,  0.40, 0.15, 0.88, 0.17], hex: GOAT_DARK,
      role: 'foreleg', side: -1, pivot: [-0.20, 0.86, 0.40] },
    
    
    
    
    
    
    
    { p: [ 0.21, 0.44, -0.44, 0.16, 0.88, 0.18], hex: GOAT_DARK,
      role: 'hindleg', side:  1, pivot: [ 0.21, 0.86, -0.44] },
    { p: [-0.21, 0.44, -0.44, 0.16, 0.88, 0.18], hex: GOAT_DARK,
      role: 'hindleg', side: -1, pivot: [-0.21, 0.86, -0.44] },
    { p: [ 0.20, 0.05,  0.40, 0.19, 0.11, 0.21], hex: GOAT_HORN,
      role: 'foreleg', side:  1, pivot: [ 0.20, 0.86, 0.40] },
    { p: [-0.20, 0.05,  0.40, 0.19, 0.11, 0.21], hex: GOAT_HORN,
      role: 'foreleg', side: -1, pivot: [-0.20, 0.86, 0.40] },
    { p: [ 0.21, 0.05, -0.44, 0.20, 0.11, 0.22], hex: GOAT_HORN,
      role: 'hindleg', side:  1, pivot: [ 0.21, 0.86, -0.44] },
    { p: [-0.21, 0.05, -0.44, 0.20, 0.11, 0.22], hex: GOAT_HORN,
      role: 'hindleg', side: -1, pivot: [-0.21, 0.86, -0.44] },
    
    
    
    { p: [0, 1.20, -0.04, 0.60, 0.68, 1.28], hex: GOAT_COAT },
    
    
    
    { p: [0, 1.56,  0.24, 0.54, 0.30, 0.60], hex: GOAT_COAT },
    
    { p: [0, 1.16, -0.62, 0.50, 0.54, 0.28], hex: GOAT_COAT },
    
    
    
    { p: [0, 0.92, -0.04, 0.62, 0.16, 1.16], hex: GOAT_DARK },
    
    
    
    
    { p: [0, 1.44, 0.66, 0.34, 0.44, 0.36], hex: GOAT_COAT,
      role: 'head', pivot: [0, 1.48, 0.50] },
    
    { p: [0, 1.44, 0.96, 0.26, 0.30, 0.34], hex: GOAT_COAT,
      role: 'head', pivot: [0, 1.48, 0.50] },
    { p: [0, 1.36, 1.16, 0.20, 0.18, 0.16], hex: GOAT_DARK,
      role: 'head', pivot: [0, 1.48, 0.50] },
    
    { p: [0, 1.18, 1.06, 0.11, 0.26, 0.11], hex: GOAT_DARK,
      role: 'head', pivot: [0, 1.48, 0.50] },
    { p: [ 0.19, 1.54, 0.90, 0.14, 0.09, 0.17], hex: GOAT_COAT,
      role: 'head', pivot: [0, 1.48, 0.50] },
    { p: [-0.19, 1.54, 0.90, 0.14, 0.09, 0.17], hex: GOAT_COAT,
      role: 'head', pivot: [0, 1.48, 0.50] },
    
    
    
    { p: [ 0.075, 1.49, 1.125, 0.07, 0.07, 0.03], hex: GOAT_EYE,
      role: 'head', pivot: [0, 1.48, 0.50] },
    { p: [-0.075, 1.49, 1.125, 0.07, 0.07, 0.03], hex: GOAT_EYE,
      role: 'head', pivot: [0, 1.48, 0.50] },
    
    
    
    
    { p: [ 0.105, 1.70, 0.94, 0.12, 0.30, 0.13], hex: GOAT_HORN,
      role: 'head', pivot: [0, 1.48, 0.50] },
    { p: [-0.105, 1.70, 0.94, 0.12, 0.30, 0.13], hex: GOAT_HORN,
      role: 'head', pivot: [0, 1.48, 0.50] },
    { p: [ 0.11, 1.94, 0.82, 0.115, 0.22, 0.15], hex: GOAT_HORN,
      role: 'head', pivot: [0, 1.48, 0.50] },
    { p: [-0.11, 1.94, 0.82, 0.115, 0.22, 0.15], hex: GOAT_HORN,
      role: 'head', pivot: [0, 1.48, 0.50] },
    
    
    
    
    
    { p: [ 0.115, 2.06, 0.64, 0.11, 0.15, 0.28], hex: GOAT_HORN,
      role: 'head', pivot: [0, 1.48, 0.50] },
    { p: [-0.115, 2.06, 0.64, 0.11, 0.15, 0.28], hex: GOAT_HORN,
      role: 'head', pivot: [0, 1.48, 0.50] },
    
    
    
    
    
    
    
    
    
    { p: [0, 1.34, -0.74, 0.12, 0.14, 0.11], hex: GOAT_DARK },
  ]),
});

























const DOVE_SLATE = 0x3c4450;   
const DOVE_HEAD  = 0x2e3540;   
const DOVE_BAR   = 0xc9cfd8;   
const DOVE_IRID  = 0x2f7a5c;   
const DOVE_VIOL  = 0x6b4a86;   
const DOVE_BEAK  = 0x23272f;
const DOVE_FOOT  = 0xcf4a45;   
const DOVE_EYE   = 0xe08a2a;   
const DOVE_PUPIL = 0x14120f;

export const PIGEON = Object.freeze({
  scale: 0.62,
  
  
  
  
  
  
  cheer: Object.freeze({
    
    
    hopHeight: 0.42,
    
    
    hopHz: 1.7,
    
    
    flapHz: 8.6,
    flipperSwing: 2.35,
  }),
  parts: Object.freeze([
    
    
    
    
    { p: [ 0.09, 0.04, 0.10, 0.13, 0.08, 0.20], hex: DOVE_FOOT },
    { p: [-0.09, 0.04, 0.10, 0.13, 0.08, 0.20], hex: DOVE_FOOT },
    { p: [ 0.09, 0.16, 0.06, 0.07, 0.20, 0.07], hex: DOVE_FOOT },
    { p: [-0.09, 0.16, 0.06, 0.07, 0.20, 0.07], hex: DOVE_FOOT },
    
    { p: [0, 0.44, 0.02,   0.36, 0.42, 0.56], hex: DOVE_SLATE },
    
    
    
    { p: [0, 0.40, 0.26,   0.32, 0.34, 0.22], hex: DOVE_SLATE },
    
    { p: [0, 0.54, -0.28,  0.26, 0.26, 0.24], hex: DOVE_SLATE },
    
    
    
    
    { p: [0, 0.60, -0.56,  0.28, 0.07, 0.34], hex: DOVE_SLATE, tilt: -0.25 },
    
    
    
    
    { p: [0, 0.64, 0.16,   0.26, 0.10, 0.26], hex: DOVE_IRID },
    { p: [0, 0.56, 0.20,   0.24, 0.08, 0.24], hex: DOVE_VIOL },
    
    { p: [0, 0.76, 0.20,   0.24, 0.24, 0.24], hex: DOVE_HEAD },
    
    
    
    
    
    { p: [0, 0.75, 0.35,   0.07, 0.06, 0.14], hex: DOVE_BEAK },
    { p: [0, 0.79, 0.30,   0.09, 0.06, 0.07], hex: DOVE_BAR },
    
    
    
    { p: [ 0.08, 0.79, 0.315, 0.075, 0.075, 0.03], hex: DOVE_EYE },
    { p: [-0.08, 0.79, 0.315, 0.075, 0.075, 0.03], hex: DOVE_EYE },
    { p: [ 0.08, 0.79, 0.328, 0.038, 0.038, 0.03], hex: DOVE_PUPIL },
    { p: [-0.08, 0.79, 0.328, 0.038, 0.038, 0.03], hex: DOVE_PUPIL },
    
    
    
    
    
    { p: [ 0.19, 0.48, -0.02, 0.06, 0.26, 0.48], hex: DOVE_SLATE,
      role: 'flipper', side: 1,  pivot: [ 0.17, 0.62, 0.06] },
    { p: [-0.19, 0.48, -0.02, 0.06, 0.26, 0.48], hex: DOVE_SLATE,
      role: 'flipper', side: -1, pivot: [-0.17, 0.62, 0.06] },
    { p: [ 0.205, 0.44, -0.06, 0.025, 0.05, 0.34], hex: DOVE_BAR,
      role: 'flipper', side: 1,  pivot: [ 0.17, 0.62, 0.06] },
    { p: [-0.205, 0.44, -0.06, 0.025, 0.05, 0.34], hex: DOVE_BAR,
      role: 'flipper', side: -1, pivot: [-0.17, 0.62, 0.06] },
    { p: [ 0.205, 0.53, -0.06, 0.025, 0.05, 0.34], hex: DOVE_BAR,
      role: 'flipper', side: 1,  pivot: [ 0.17, 0.62, 0.06] },
    { p: [-0.205, 0.53, -0.06, 0.025, 0.05, 0.34], hex: DOVE_BAR,
      role: 'flipper', side: -1, pivot: [-0.17, 0.62, 0.06] },
  ]),
});


export const SPECIES = Object.freeze({
  penguin: PENGUIN,
  goose: GOOSE,
  goat: GOAT,
  pigeon: PIGEON,
});

export function speciesFor(kind) {
  return SPECIES[kind] ?? PENGUIN;
}




export const TURN_RATE = 1.1;


export const BOB = Object.freeze({ hz: 0.42, amplitude: 0.035 });




export const LOOK_RANGE = 34;



export const HUDDLE_TILT = 0.13;




















export const CHEER = Object.freeze({
  
  
  duration: 2.8,
  
  
  
  
  
  
  
  
  
  
  
  waveSpeed: 45,
  
  
  flipperSwing: 2.15,
  
  flapHz: 5.2,
  flapJitter: 0.9,
  
  hopHeight: 0.19,
  hopHz: 2.6,
  
  
  
  
  
  
  
  
  
  
  
  rearUp: 0.62,
  
  
  
  foreLegPaw: 1.05,
  
  
  headToss: 0.5,
  
  
  
  
  hindLegBrace: 0.8,
  
  
  turnRate: 3.4,
  
  amplitudeJitter: 0.28,
});




export const CHEER_EVENTS = Object.freeze({
  capture:       1.00,   
  annihilation:  0.85,   
  chicken:       0.75,   
  pickup:        0.45,   
  kill:          0.30,   
});
