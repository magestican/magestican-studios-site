














import { PU_HALO, PU_PRISM, PU_WING } from './sim/sim.js';

export const PICK_LOOK = Object.freeze({
  disc: [120, 240, 190],   
  rim: [18, 92, 72],       
  glyph: [14, 52, 44],     
  radius: 12,              
  rimWidth: 2.5,
  pulseHz: 1.6, pulseAmp: 0.1,
});


export const PICK_CUE = Object.freeze({ [PU_WING]: 'pickWing', [PU_PRISM]: 'pickPrism', [PU_HALO]: 'pickHalo' });
export const POWER_END_CUE = 'powerEnd';


export const PICK_GLYPH = Object.freeze({ [PU_WING]: 'chevrons', [PU_PRISM]: 'diamond', [PU_HALO]: 'ring' });


export function hueOf([r, g, b]) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (d === 0) return null;
  let h;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}


export const hueGap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };


export const pickPulse = (t) => 1 + PICK_LOOK.pulseAmp * Math.sin(t * Math.PI * 2 * PICK_LOOK.pulseHz);





export function powersEnded(prev, p) {
  let n = 0;
  if (prev.wing > 0 && p.wing === 0) n++;
  if (prev.halo > 0 && p.halo === 0) n++;
  return n;
}
