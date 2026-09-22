






























import { CRAFTABLES } from '../economy/craftables.mjs';




export const GLOW_HEIGHT_M = Object.freeze({
  firePit: 0.45,
  postLantern: 1.55,
  lampPost: 2.2,
  
  
  
  
  
  torch: 1.3,
});









const FIRE_KINDS = Object.freeze(['firePit', 'torch']);


export function artKindOf(item) {
  const spec = CRAFTABLES[item];
  return spec && spec.art && spec.art.kind ? spec.art.kind : null;
}


export function isLightItem(item) {
  const spec = CRAFTABLES[item];
  return Boolean(spec && spec.light);
}


export function lightKindOf(item) {
  return FIRE_KINDS.includes(artKindOf(item)) ? 'fire' : 'lamp';
}





const planetOf = (p) => (Number.isInteger(p.planet) ? p.planet : 0);








export function placedLightSources(placed = [], { planet = 0, heightAt = () => 0 } = {}) {
  const out = [];
  for (const p of placed) {
    if (!p || !p.spot || planetOf(p) !== planet) continue;
    if (!isLightItem(p.item)) continue;
    const lift = GLOW_HEIGHT_M[artKindOf(p.item)];
    const { x, z } = p.spot;
    out.push({
      x, z,
      y: heightAt(x, z) + (Number.isFinite(lift) ? lift : GLOW_HEIGHT_M.postLantern),
      kind: lightKindOf(p.item),
      id: p.id,
      item: p.item,
    });
  }
  return out;
}








export function placedLightCount(placed = [], planet = 0) {
  let n = 0;
  for (const p of placed) {
    if (!p || !p.spot || planetOf(p) !== planet) continue;
    if (isLightItem(p.item)) n += 1;
  }
  return n;
}
