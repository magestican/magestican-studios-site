










import { U } from '../../engine/core/util.js';

export const SIZE_CLASSES =  (['tiny', 'small', 'medium', 'large', 'huge']);
export const CLASS_SCALE = { tiny: 0.78, small: 0.89, medium: 1, large: 1.15, huge: 1.32 };
const PLAN_LEAN = { bug: -1, plant: -0.5, ghost: -0.4, bird: -0.4, round: 0, fish: 0, biped: 0.4, quadruped: 0.5, serpent: 1 };


export function familySizeClass(fam, plan) {
  const r = U.rng(U.hash('dachi-size-' + fam));
  const x = r() * 4 - 2 + (PLAN_LEAN[ (plan)] || 0);
  return SIZE_CLASSES[Math.max(0, Math.min(4, Math.round(x) + 2))];
}



export function kindScale(sp) {
  const c = (sp && sp.sizeClass && CLASS_SCALE[ (sp.sizeClass)]) || 1;
  return (sp && sp.stage === 1) ? 1 + (c - 1) * 0.5 : c;
}

export const TINY_BELOW = 0.9, HUGE_ABOVE = 1.12;


export function rollSize(rand) {
  const u = rand(), v = rand();
  const s = u < 0.06 ? 0.8 + v * 0.08 : u >= 0.94 ? 1.14 + v * 0.1 : 0.94 + v * 0.12;
  return Math.round(s * 100) / 100;
}

export const ownSize = (d) => (d && typeof d.size === 'number' && d.size > 0 ? d.size : 1);


export function sizeTag(d) {
  const s = ownSize(d);
  return s < TINY_BELOW ? 'Tiny' : s > HUGE_ABOVE ? 'Huge' : null;
}


export function sizeBadge(d) {
  const t = sizeTag(d);
  return t ? `<span class="sizeTag ${t.toLowerCase()}">${t}</span>` : '';
}
export const CLASS_WORD = { tiny: 'Tiny', small: 'Small', medium: 'Medium', large: 'Large', huge: 'Huge' };


export const sizeMult = (sp, d) => kindScale(sp) * ownSize(d);
