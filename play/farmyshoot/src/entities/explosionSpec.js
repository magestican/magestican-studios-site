

































































export const EX_PALETTE = {
  hot:       0xf6f1e6,   
  gold:      0xf4c95d,   
  ember:     0xe0873a,   
  red:       0xb73a2a,   
  
  
  
  
  
  
  
  
  
  smoke:     0x5c4838,   
  smokeLite: 0x8a6e4e,   
                         
  char:      0x4a3a2c,   
  scorch:    0x3a3128,   
};
















export const EX_KINDS = {
  
  
  slingshot: {
    radius: 6.0,
    puffs: 10, chunks: 26, sparks: 16,
    ringTo: 3.6,        
    shake: 0.85,
    truthfulRing: false,
  },
  
  
  
  hazard: {
    radius: 2.2,
    puffs: 4, chunks: 12, sparks: 6,
    ringTo: 1.0,        
    shake: 0.30,
    truthfulRing: true,
  },
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  rocket: {
    radius: 3.0,
    puffs: 6, chunks: 16, sparks: 10,
    ringTo: 1.0,        
    shake: 0.55,
    truthfulRing: true,
  },
};














export const EX_LAYERS = ['flash', 'fireball', 'shockwave', 'smoke', 'debris', 'sparks', 'scorch'];





export const EX_GEOMETRIES = ['ico', 'box', 'ring', 'disc'];





export const EX_ORDER = {
  scorch: 0, shockwave: 1, smoke: 2, debris: 3, fireball: 4, sparks: 5, flash: 6,
};




































export function planExplosion({ kind = 'slingshot', radius, colors = {}, rng = Math.random } = {}) {
  const k = EX_KINDS[kind];
  if (!k) throw new Error(`unknown explosion kind: ${kind}`);
  const R = radius == null ? k.radius : radius;
  if (!(R > 0)) throw new Error(`explosion radius must be positive, got ${R}`);

  const flash  = colors.flash  ?? EX_PALETTE.hot;
  const core   = colors.core   ?? EX_PALETTE.gold;
  const shell  = colors.shell  ?? EX_PALETTE.red;
  const ejecta = colors.ejecta ?? EX_PALETTE.gold;

  const parts = [];
  const part = (p) => { parts.push({ order: EX_ORDER[p.layer], ...p }); };

  
  
  
  part({
    layer: 'flash', geo: 'ico', color: flash, opacity: 0.95, additive: true,
    life: 0.09, from: R * 0.3, to: R * 0.85, fade: 'linear', tumble: true,
  });

  
  
  
  
  part({
    layer: 'fireball', geo: 'ico', color: flash, colorTo: core, opacity: 0.95,
    lit: true, life: 0.30, from: R * 0.22, to: R * 0.95, spin: 1.6, tumble: true,
  });
  
  
  
  
  part({
    layer: 'fireball', geo: 'ico', color: colors.ember ?? EX_PALETTE.ember,
    colorTo: shell, opacity: 0.9,
    lit: true, life: 0.55, from: R * 0.42, to: R * 1.8, spin: -1.1, tumble: true,
  });

  
  
  
  
  
  
  part({
    layer: 'fireball', geo: 'ico', color: colors.ember ?? EX_PALETTE.ember,
    colorTo: shell, opacity: 0.7,
    lit: true, life: 0.5, from: R * 0.3, to: R * 1.35, spin: 2.2, tumble: true,
    at: [R * 0.35, R * 0.3, -R * 0.25],
  });

  
  part({
    layer: 'shockwave', geo: 'ring', color: core, opacity: 0.9,
    life: 0.45, from: R * 0.3, to: R * k.ringTo, ground: true, lift: 0.06,
  });

  
  
  
  
  for (let i = 0; i < k.puffs; i++) {
    const a = (i / k.puffs) * Math.PI * 2 + rng() * 0.6;
    const out = R * (0.6 + rng() * 0.5);
    part({
      layer: 'smoke', geo: 'ico',
      color: i % 2 ? EX_PALETTE.smoke : EX_PALETTE.smokeLite,
      colorTo: EX_PALETTE.smoke,
      
      
      
      opacity: 0.78, lit: true, tumble: true,
      delay: 0.10 + rng() * 0.12,
      life: 1.0 + rng() * 0.5,
      from: R * 0.14, to: R * 0.38,
      at: [Math.cos(a) * out, R * 0.15 + rng() * R * 0.2, Math.sin(a) * out],
      vel: [Math.cos(a) * R * 0.35, 1.3 + rng(), Math.sin(a) * R * 0.35],
      drag: 1.6, spin: 0.5,
    });
  }

  
  
  for (let i = 0; i < k.chunks; i++) {
    const a = (i / k.chunks) * Math.PI * 2 + rng() * 0.5;
    const speed = R * (1.1 + rng() * 1.3);
    part({
      layer: 'debris', geo: 'box',
      
      
      
      color: i % 3 === 0 ? ejecta : EX_PALETTE.char, opacity: 1, lit: true,
      life: 0.9 + rng() * 0.5,
      from: 0.09 + rng() * 0.09, to: 0.07,
      vel: [Math.cos(a) * speed, 3 + rng() * 4, Math.sin(a) * speed],
      gravity: 14, spin: 6, bounce: true, tumble: true,
    });
  }

  
  
  for (let i = 0; i < k.sparks; i++) {
    const dx = rng() - 0.5, dy = rng() * 0.9, dz = rng() - 0.5;
    const len = Math.hypot(dx, dy, dz) || 1;
    const s = R * (2.2 + rng() * 2);
    part({
      layer: 'sparks', geo: 'box', color: ejecta, opacity: 1, additive: true,
      life: 0.22 + rng() * 0.18,
      from: 0.085, to: 0.02,
      vel: [(dx / len) * s, (dy / len) * s, (dz / len) * s], gravity: 6,
    });
  }

  
  
  
  
  part({
    layer: 'scorch', geo: 'disc', color: EX_PALETTE.scorch, opacity: 0.4,
    life: 3.4, from: R * 0.35, to: R * 0.5, ground: true, lift: 0.03, hold: 0.5,
  });

  return parts;
}



export function shakeFor(kind) {
  return (EX_KINDS[kind] || EX_KINDS.hazard).shake;
}








export const SHAKE_REACH = 7.0;






















export function shakeAtDistance(kind, distance, reach = SHAKE_REACH) {
  const k = EX_KINDS[kind] || EX_KINDS.hazard;
  if (!Number.isFinite(distance) || distance < 0) return k.shake;
  const max = k.radius * reach;
  if (max <= 0 || distance >= max) return 0;
  return k.shake * (1 - distance / max);
}















export const KICK_METRES = 0.35;





export const KICK_ROLL = 0.18;









































export function nearFade(distance, radius) {
  if (!Number.isFinite(distance) || !Number.isFinite(radius) || radius <= 0) return 1;
  if (distance >= radius) return 1;
  return Math.max(0, distance / radius);
}










export const FADE_LAYERS = Object.freeze(['flash', 'fireball', 'smoke']);





export function blastReach(plan) {
  return plan.reduce((m, p) => Math.max(m, p.to), 0);
}
