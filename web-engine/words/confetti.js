
























export const CONFETTI_MS = 2600;








export const CONFETTI_COLOURS = Object.freeze(['green', 'gold', 'blue', 'red']);









function noise(seed, salt) {
  const x = Math.sin(seed * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}








export function pieces(count = 60, seed = 1) {
  const out = [];
  for (let i = 0; i < count; i += 1) {
    const left = i % 2 === 0;
    const spread = noise(seed, i);
    const power = 0.55 + noise(seed, i + 500) * 0.5;
    out.push({
      
      
      x0: left ? 0.06 : 0.94,
      y0: 1.02,
      
      
      vx: (left ? 1 : -1) * (0.30 + spread * 0.62) * power,
      vy: -(1.55 + noise(seed, i + 900) * 0.75) * power,
      spin: (noise(seed, i + 1300) - 0.5) * 9,
      turn: noise(seed, i + 1700) * Math.PI,
      size: 6 + noise(seed, i + 2100) * 7,
      colour: CONFETTI_COLOURS[i % CONFETTI_COLOURS.length],
      
      
      strip: noise(seed, i + 2500) > 0.5,
    });
  }
  return out;
}


const G = 2.05;







export function at(piece, ms) {
  const t = Math.max(0, ms) / 1000;
  return {
    x: piece.x0 + piece.vx * t,
    y: piece.y0 + piece.vy * t + 0.5 * G * t * t,
    angle: piece.turn + piece.spin * t,
    
    
    
    alpha: Math.max(0, Math.min(1, (CONFETTI_MS - ms) / (CONFETTI_MS / 3))),
  };
}


export function alive(piece, ms) {
  if (ms >= CONFETTI_MS) return false;
  const p = at(piece, ms);
  
  
  return !(p.y > 1.15 && piece.vy + G * (ms / 1000) > 0);
}


export function done(ms) {
  return ms >= CONFETTI_MS;
}
