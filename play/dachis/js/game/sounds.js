
export const SOUNDS = {
  blip: ({ tone }) => tone(660, 0.04, 'square', 0.02),
  
  
  
  slap: ({ tone, noise }) => { noise(0.05, 0.09, 2200); tone(780, 0.06, 'square', 0.05, -380); tone(240, 0.28, 'sine', 0.06, 260, 0.05); tone(480, 0.22, 'triangle', 0.025, 180, 0.07); },
  pencil: ({ noise }) => { noise(0.05, 0.03, 5200); noise(0.04, 0.025, 6400, 0.06); },
  thinkIn: ({ tone }) => { tone(988, 0.18, 'sine', 0.025, 220); tone(1480, 0.2, 'sine', 0.015, 160, 0.08); },
  narrateIn: ({ noise, tone }) => { noise(0.16, 0.035, 1800); tone(330, 0.2, 'triangle', 0.015, -60, 0.04); },
  bossSting: ({ tone, noise }) => { tone(55, 0.9, 'sawtooth', 0.09, -12); tone(58.3, 0.9, 'sawtooth', 0.07, -14); tone(1244, 0.5, 'sine', 0.03, -700, 0.05); tone(1318, 0.5, 'sine', 0.025, -760, 0.05); noise(0.6, 0.05, 160); },
  
  voice: ({ tone }) => tone(330 + Math.random() * 150, 0.035, 'triangle', 0.016),
  thought: ({ tone }) => tone(880 + Math.random() * 120, 0.03, 'sine', 0.008),
  step: ({ noise }) => noise(0.04, 0.015, 900),
  
  
  stepSoft: ({ noise }) => noise(0.035, 0.008 + Math.random() * 0.003, 500 + Math.random() * 120),
  stepGrass: ({ noise }) => { noise(0.09, 0.012, 3200 + Math.random() * 600); noise(0.06, 0.007, 1900, 0.03); },
  stepSand: ({ noise }) => noise(0.07, 0.011, 2400 + Math.random() * 300),
  stepDirt: ({ noise }) => noise(0.05, 0.01, 1100 + Math.random() * 200),
  stepStone: ({ tone, noise }) => { tone(1500 + Math.random() * 200, 0.025, 'triangle', 0.006); noise(0.03, 0.008, 2600); },
  hit: ({ tone, noise }) => { tone(180, 0.12, 'sawtooth', 0.05, -120); noise(0.08, 0.04, 700); },
  crit: ({ tone, noise }) => { tone(120, 0.25, 'sawtooth', 0.07, -80); tone(900, 0.1, 'square', 0.03); noise(0.15, 0.06, 500); },
  dash: ({ tone }) => tone(300, 0.2, 'triangle', 0.06, 500),
  bolt: ({ tone }) => tone(800, 0.15, 'square', 0.04, -500),
  burst: ({ tone, noise }) => { tone(90, 0.4, 'sawtooth', 0.07, 200); noise(0.3, 0.05, 300); },
  heal: ({ tone }) => { tone(520, 0.15, 'sine', 0.05, 300); tone(780, 0.2, 'sine', 0.04, 300, 0.1); },
  guard: ({ tone }) => tone(400, 0.2, 'triangle', 0.05),
  rage: ({ tone }) => tone(140, 0.3, 'sawtooth', 0.06, 100),
  
  beam: ({ tone }) => { tone(1200, 0.5, 'sawtooth', 0.035, -300); tone(600, 0.5, 'square', 0.02, -150); },
  flurry: ({ tone, noise }) => { for (let i = 0; i < 4; i++) noise(0.04, 0.04, 1400, i * 0.14); },
  slam: ({ tone, noise }) => { tone(260, 0.3, 'triangle', 0.05, 400); tone(70, 0.4, 'sawtooth', 0.07, -30, 0.6); noise(0.3, 0.06, 250, 0.6); },
  trap: ({ tone }) => { tone(700, 0.06, 'square', 0.03); tone(500, 0.08, 'square', 0.03, 0, 0.08); },
  drain: ({ tone }) => tone(900, 0.3, 'sine', 0.05, -600),
  hex: ({ tone }) => { tone(500, 0.25, 'triangle', 0.04, 250); tone(520, 0.25, 'triangle', 0.03, -250, 0.05); },
  shield: ({ tone }) => { tone(660, 0.25, 'sine', 0.05, 200); tone(990, 0.2, 'sine', 0.03, 0, 0.1); },
  parry: ({ tone, noise }) => { tone(1760, 0.12, 'square', 0.05, -400); tone(2640, 0.18, 'sine', 0.04); noise(0.05, 0.05, 3000); },
  start: ({ tone }) => { tone(440, 0.1, 'square', 0.04); tone(660, 0.1, 'square', 0.04, 0, 0.1); tone(880, 0.18, 'square', 0.04, 0, 0.2); },
  win: ({ tone }) => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'square', 0.04, 0, i * 0.11)),
  lose: ({ tone }) => [400, 300, 200].forEach((f, i) => tone(f, 0.25, 'triangle', 0.05, 0, i * 0.18)),
  pickup: ({ tone }) => [880, 1175, 1568].forEach((f, i) => tone(f, 0.1, 'square', 0.035, 0, i * 0.07)),
  heart: ({ tone }) => tone(500, 0.3, 'sine', 0.05, 400),
  wobble: ({ tone }) => tone(220, 0.08, 'square', 0.04),
  node: ({ tone }) => tone(990, 0.08, 'sine', 0.05),
  perfect: ({ tone }) => { tone(1320, 0.1, 'sine', 0.05); tone(1760, 0.12, 'sine', 0.04, 0, 0.05); },
  miss: ({ tone }) => tone(160, 0.18, 'square', 0.04, -60),
  befriended: ({ tone }) => [659, 784, 988, 1318, 1568].forEach((f, i) => tone(f, 0.2, 'triangle', 0.05, 0, i * 0.1)),
  evolve: ({ tone }) => [392, 523, 659, 784, 1046, 1318].forEach((f, i) => tone(f, 0.2, 'triangle', 0.05, 0, i * 0.14)),
  
  
  tellScrape: (k) => { SOUNDS.stepStone(k); SOUNDS.stepStone(k); },
  tellPing: (k) => SOUNDS.blip(k),
  tellSweet: (k) => SOUNDS.hex(k),
  tellFists: (k) => SOUNDS.guard(k),
  tellClick: (k) => SOUNDS.blip(k),
  lanternCatch: (k) => SOUNDS.pickup(k),
};
