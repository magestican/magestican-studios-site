










export const GAITS = {
  frog: { speed: 1.9, burst: [0.436, 0.4], hop: true }, 
  bird: { speed: 1.7, burst: [0.26, 0.42] },
  crab: { speed: 2.0, burst: [0.35, 0.45] },
  octopus: { speed: 1.5, burst: [0.5, 0.35] },
  snail: { speed: 0.45 },
  turtle: { speed: 0.6 },
  jelly: { speed: 0.7 },
  ghost: { speed: 0.85 },
  strider: { speed: 1.35 },
  bat: { speed: 1.4 },
  ray: { speed: 1.2 },
  serpent: { speed: 0.9 },
};
const WALK = { speed: 1 };

export const gaitOf = (plan) => (plan && Object.prototype.hasOwnProperty.call(GAITS, plan) ? GAITS[plan] : WALK);


export const averageSpeed = (g) => g.speed * (g.burst ? g.burst[0] / (g.burst[0] + g.burst[1]) : 1);


export function gaitPhase(g, t, dt) {
  if (!g.burst) return { move: true, start: false };
  const [mv, rs] = g.burst, p = t % (mv + rs);
  return { move: p < mv, start: p < dt };
}
