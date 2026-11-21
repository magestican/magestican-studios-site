




























export const VOICE_MS = Object.freeze({
  'intro-1-1': 8933, 'intro-1-2': 5735, 'intro-2-1': 9681, 'intro-2-2': 5083, 'intro-3-1': 8312, 'intro-3-2': 3966,
  'intro-4-1': 7466, 'intro-4-2': 3451, 'intro-5-1': 12151, 'intro-5-2': 4611,
  'after-1-1': 4230, 'after-1-2': 3446, 'after-1-3': 4917, 'after-2-1': 4714, 'after-2-2': 3393, 'after-3-1': 3844,
  'after-3-2': 6742, 'after-4-1': 4512, 'after-4-2': 8192,
  'ending-sora': 4527, 'ending-rook': 6352, 'ending-mina': 6203, 'ending-tevi': 4917, 'ending-halden': 7304,
  'brief-sora-1': 10635, 'brief-sora-2': 3859, 'brief-sora-3': 7937, 'brief-sora-4': 3662,
  'brief-rook-1': 5803, 'brief-rook-2': 3829, 'brief-rook-3': 8942, 'brief-rook-4': 6823,
  'brief-mina-1': 6576, 'brief-mina-2': 2980, 'brief-mina-3': 5651, 'brief-mina-4': 3418,
  'brief-tevi-1': 7112, 'brief-tevi-2': 5172, 'brief-tevi-3': 5949, 'brief-tevi-4': 4734,});


export const VOICE_GAP_MS = 500;


export const VOICED_LANGS = Object.freeze(['en']);
export const voiced = (lang) => VOICED_LANGS.includes(String(lang || 'en').slice(0, 2).toLowerCase());


export function voiceClip(who, id) {
  return Object.prototype.hasOwnProperty.call(VOICE_MS, id) ? `assets/voice/${who}/${id}.m4a` : null;
}


export const introIds = (stage, beats) => beats.map((b, i) => ({ who: b.id, id: `intro-${stage + 1}-${i + 1}` }));
export const afterIds = (stage, beats) => beats.map((b, i) => ({ who: b.id, id: `after-${stage + 1}-${i + 1}` }));
export const endingIds = (cards) => cards.map((e) => ({ who: e.id, id: `ending-${e.id}` }));

export const briefingIds = (pilot, beats) => beats.map((b, i) => ({ who: b.id, id: `brief-${pilot}-${i + 1}` }));





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
