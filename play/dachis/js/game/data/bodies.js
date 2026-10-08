




import { planIndex } from './species.js';

export const BODY_WORD = {
  round: 'Round', quadruped: 'Four-legged', fish: 'Fish', bird: 'Bird', serpent: 'Serpent', bug: 'Beetle',
  biped: 'Two-legged', plant: 'Plant', ghost: 'Ghost', crab: 'Crab', jelly: 'Jellyfish', strider: 'Stilt-walker',
  turtle: 'Turtle', bat: 'Bat', snail: 'Snail', frog: 'Frog', octopus: 'Octopus', ray: 'Ray',
};

export const VARIANT_WORD = {
  crab: [null, 'Fiddler crab'], jelly: [null, 'Box jelly'], turtle: [null, 'Softshell'], octopus: [null, 'Squid'],
  frog: [null, 'Toad'], ray: [null, 'Manta'], fish: [null, 'Pufferfish'], bug: [null, 'Stag beetle'], bird: [null, null, 'Owl'],
};

export function bodyWord(sp) {
  const plan = sp.look && sp.look.plan;
  if (!plan || sp.boss || !Object.prototype.hasOwnProperty.call(BODY_WORD, plan)) return null;
  const v = sp.stage >= 2 && Object.prototype.hasOwnProperty.call(VARIANT_WORD, plan) ? VARIANT_WORD[ (plan)][planIndex(sp)] : null;
  return v || BODY_WORD[ (plan)];
}
