
























export const MAX_MS = 200;


export const DURATION = {
  hover: 90,      
  press: 70,      
  reveal: 160,    
  found: 180,     
  shake: 180,     
  fade: 140,      
};










export function progress(now, start, ms, motion = true) {
  if (!motion) return 1;
  if (!Number.isFinite(start) || ms <= 0) return 1;
  return Math.max(0, Math.min(1, (now - start) / ms));
}


export const easeOut = (t) => 1 - (1 - t) ** 3;


export const easeIn = (t) => t * t * t;


export const hump = (t) => Math.sin(Math.PI * Math.max(0, Math.min(1, t)));













export function shake(p, amplitude = 6) {
  if (p >= 1) return 0;
  return Math.sin(p * Math.PI * 6) * amplitude * (1 - p);
}









export function lift(p, motion = true) {
  return motion ? easeOut(p) * 3 : 3;
}





export function sink(p, motion = true) {
  return motion ? easeOut(p) * 3 : 3;
}











export function stagger(rowProgress, index, count, overlap = 0.55) {
  const step = (1 - overlap) / Math.max(1, count - 1);
  const start = index * step;
  const span = overlap;
  return Math.max(0, Math.min(1, (rowProgress - start) / span));
}






export function flipScale(p) {
  return Math.abs(Math.cos(p * Math.PI));
}


export const flipTurned = (p) => p >= 0.5;
