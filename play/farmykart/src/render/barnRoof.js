
















export const UNIT_TRI = Object.freeze({ width: Math.sqrt(3), height: 1.5, base: -0.5 });







export function gableRoof(w, d, h) {
  const width = w + 1.2; 
  const rise = w * 0.45;
  const length = d + 1.2;
  return {
    width, rise, length,
    
    scale: [width / UNIT_TRI.width, rise / UNIT_TRI.height, length],
    
    y: h - UNIT_TRI.base * (rise / UNIT_TRI.height),
  };
}
