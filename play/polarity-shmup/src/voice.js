



















export const VOICE_MS = Object.freeze({});


export const VOICE_GAP_MS = 500;


export const VOICED_LANGS = Object.freeze(['en']);
export const voiced = (lang) => VOICED_LANGS.includes(String(lang || 'en').slice(0, 2).toLowerCase());


export function voiceClip(who, id) {
  return Object.prototype.hasOwnProperty.call(VOICE_MS, id) ? `assets/voice/${who}/${id}.m4a` : null;
}


export const introIds = (stage, beats) => beats.map((b, i) => ({ who: b.id, id: `intro-${stage + 1}-${i + 1}` }));
export const afterIds = (stage, beats) => beats.map((b, i) => ({ who: b.id, id: `after-${stage + 1}-${i + 1}` }));
export const endingIds = (cards) => cards.map((e) => ({ who: e.id, id: `ending-${e.id}` }));





export function voicePlan(lines, lang = 'en') {
  if (!voiced(lang)) return [];
  let at = 0;
  const plan = [];
  for (const { who, id } of lines) {
    const file = voiceClip(who, id);
    if (!file) continue;
    plan.push({ at, ms: VOICE_MS[id], file });
    at += VOICE_MS[id] + VOICE_GAP_MS;
  }
  return plan;
}


export const planEnd = (plan) => (plan.length ? plan[plan.length - 1].at + plan[plan.length - 1].ms : 0);
