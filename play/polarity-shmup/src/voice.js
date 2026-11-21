























export const VOICE_MS = Object.freeze({
  'intro-1-1': 9087, 'intro-1-2': 5135, 'intro-2-1': 6256, 'intro-2-2': 3921, 'intro-3-1': 7191, 'intro-3-2': 3366,
  'intro-4-1': 6241, 'intro-4-2': 2851, 'intro-5-1': 8603, 'intro-5-2': 4011,
  'after-1-1': 3630, 'after-1-2': 2531, 'after-1-3': 4133, 'after-2-1': 4012, 'after-2-2': 2793, 'after-3-1': 3244,
  'after-3-2': 7004, 'after-4-1': 4029, 'after-4-2': 7128,
  'ending-sora': 3974, 'ending-rook': 5409, 'ending-mina': 4257, 'ending-tevi': 4856, 'ending-halden': 6220,
  'brief-sora-1': 7814, 'brief-sora-2': 3259, 'brief-sora-3': 6231, 'brief-sora-4': 3062,
  'brief-rook-1': 4478, 'brief-rook-2': 3229, 'brief-rook-3': 7543, 'brief-rook-4': 6223,
  'brief-mina-1': 3952, 'brief-mina-2': 2398, 'brief-mina-3': 4761, 'brief-mina-4': 3357,
  'brief-tevi-1': 5774, 'brief-tevi-2': 4572, 'brief-tevi-3': 5145, 'brief-tevi-4': 4134,});


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
