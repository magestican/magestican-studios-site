












export const VOICE_MS = Object.freeze({
  'intro-1-1': 12961, 'intro-1-2': 5499, 'intro-2-1': 8785, 'intro-3-1': 7688, 'intro-4-1': 8354, 'intro-5-1': 6884,
  'after-1-1': 3249, 'after-1-2': 5760, 'after-2-1': 3213, 'after-2-2': 3746, 'after-3-1': 2752, 'after-3-2': 5120,
  'after-4-1': 4343, 'after-4-2': 4230,
  'ending-sora': 2545, 'ending-rook': 3687, 'ending-mina': 4583, 'ending-tevi': 3821, 'ending-halden': 6634,
});


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
