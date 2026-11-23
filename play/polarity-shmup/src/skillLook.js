





import { LANCE, SEEDMINE, TURNCOAT } from './sim/abilities.js';


export const TELL_CUE = Object.freeze({ [TURNCOAT]: 'turnTell', [LANCE]: 'lanceTell' });

export const SKILL_SOUNDS = Object.freeze(['turnTell', 'lanceTell', 'podBloom', 'afterburn']);





export function tellLook(tell, pol, r) {
  if (!tell) return null;
  const p = 1 - tell.left / tell.len; 
  if (tell.skill === TURNCOAT) return { kind: 'ring', pol: 1 - pol, radius: r * (3 - 1.8 * p), opacity: 0.35 + 0.6 * p };
  if (tell.skill === SEEDMINE) return { kind: 'ring', pol, radius: r * (3.2 - 2 * p), opacity: 0.3 + 0.5 * p };
  if (tell.skill === LANCE) return { kind: 'lance', pol, width: 3 + 5 * p, opacity: 0.12 + 0.6 * p };
  return null;
}






export function createTellVoice(minLeft = 6) {
  const heard = new Map();
  return {
    offer(id, tell, age) {
      if (!tell || !TELL_CUE[tell.skill]) return null;
      const key = age - (tell.len - tell.left);
      if (heard.get(id) === key) return null;
      heard.set(id, key);
      return tell.left >= minLeft ? TELL_CUE[tell.skill] : null;
    },
    forget(id) { heard.delete(id); },
    get size() { return heard.size; },
  };
}
