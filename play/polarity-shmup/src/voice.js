




























export const VOICE_MS = Object.freeze({
  'intro-1-1': 7943, 'intro-1-2': 6439, 'intro-2-1': 7098, 'intro-2-2': 5083, 'intro-3-1': 7731, 'intro-3-2': 3966,
  'intro-4-1': 7185, 'intro-4-2': 3451, 'intro-5-1': 8843, 'intro-5-2': 4693,
  'after-1-1': 4230, 'after-1-2': 3446, 'after-1-3': 4888, 'after-2-1': 4714, 'after-2-2': 3848, 'after-3-1': 3844,
  'after-3-2': 7728, 'after-4-1': 5342, 'after-4-2': 7332,
  'ending-sora': 4966, 'ending-rook': 6352, 'ending-mina': 6203, 'ending-tevi': 4917, 'ending-halden': 6298,
  'brief-sora-1': 8129, 'brief-sora-2': 4350, 'brief-sora-3': 6834, 'brief-sora-4': 3991,
  'brief-rook-1': 5354, 'brief-rook-2': 3829, 'brief-rook-3': 7785, 'brief-rook-4': 6823,
  'brief-mina-1': 4930, 'brief-mina-2': 2980, 'brief-mina-3': 5142, 'brief-mina-4': 3418,
  'brief-tevi-1': 6664, 'brief-tevi-2': 5172, 'brief-tevi-3': 4931, 'brief-tevi-4': 4734,});


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
