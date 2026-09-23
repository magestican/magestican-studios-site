



























import { compileMumble, seedOf } from './mumble.mjs';
import { PERSONALITIES } from '../play/personality.mjs';
import { VOICE_CUES } from '../audio/cues.mjs';

export const F0_MIN = 120;
export const F0_MAX = 480;
export const MAX_S_PER_CHAR = 0.09;

export const INTERJECTION_GAP_S = 0.09;




const m = (o) => Object.freeze(o);
export const MOOD_VOICE = Object.freeze({
  neutral: m({}),
  happy: m({ f0: 1.06, tempo: 0.92, lilt: 0.03 }),
  concern: m({ f0: 0.96, declination: -0.04, sylGap: 1.3 }),
  interest: m({ questionRise: 1.15, f0: 1.03 }),
  amazement: m({ f0: 1.12, exclaimLift: 1.1, onsetGain: 1.3 }),
  anger: m({ f0: 0.94, stressGain: 1.2, tempo: 0.85, gain: 1.15 }),
  frustration: m({ declination: -0.08 }),
  sad: m({ f0: 0.93, tempo: 1.15 }),
  sleepy: m({ tempo: 1.25, gain: 0.85 }),
});
export const MOODS = Object.freeze(Object.keys(MOOD_VOICE));

export const INTERJECTIONS = Object.freeze(['laugh', 'gasp', 'sigh', 'grumble', 'hum']);



export const MOOD_INTERJECTION = Object.freeze({
  happy: 'laugh',
  amazement: 'gasp',
  frustration: 'sigh',
  sad: 'sigh',
  sleepy: 'sigh',
  anger: 'grumble',
  interest: 'hum',
});




const LAUGH_TEXT = Object.freeze({
  giggle: 'Hee-hee!', huff: 'Heh.', titter: 'Tee-hee.', sigh: 'Ah-ha...',
  snort: 'Hah!', chuckle: 'Heh-heh.', warm: 'Ha-ha.',
});
export const INTERJECTION_SHAPE = Object.freeze({
  laugh: m({ text: 'Ha-ha!', f0: 1.08, tempo: 0.8, glide: 0.06 }),
  gasp: m({ text: 'Oh!', f0: 1.15, tempo: 0.9, glide: 0.1, onsetGain: 1.4 }),
  sigh: m({ text: 'Haah...', f0: 0.92, tempo: 1.6, glide: -0.08, onsetGain: 1.5 }),
  grumble: m({ text: 'Hrm, hmph.', f0: 0.86, tempo: 1.1, glide: -0.04 }),
  hum: m({ text: 'Hmm?', f0: 1.0, tempo: 1.5, glide: 0.04 }),
});

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
const scale2 = (r, k) => Object.freeze([r[0] * k, r[1] * k]);

function apply(base, mod, { pitch = 1, pace = 1 } = {}) {
  const tempo = (mod.tempo ?? 1) / pace;
  const onsetGain = mod.onsetGain ?? 1;
  const v = {
    ...base,
    f0: clamp(base.f0 * (mod.f0 ?? 1) * pitch, F0_MIN, F0_MAX),
    declination: clamp(base.declination + (mod.declination ?? 0), 0.78, 1),
    lilt: base.lilt + (mod.lilt ?? 0),
    glide: base.glide + (mod.glide ?? 0),
    questionRise: base.questionRise * (mod.questionRise ?? 1),
    exclaimLift: base.exclaimLift * (mod.exclaimLift ?? 1),
    stressGain: base.stressGain * (mod.stressGain ?? 1),
    sylDur: scale2(base.sylDur, tempo),
    sylGap: scale2(base.sylGap, tempo * (mod.sylGap ?? 1)),
    commaPause: base.commaPause * tempo,
    stopPause: base.stopPause * tempo,
    maxSPerChar: Math.min(MAX_S_PER_CHAR, base.maxSPerChar * tempo),
    onset: Object.freeze({ ...base.onset, gain: base.onset.gain * onsetGain }),
    gain: base.gain * (mod.gain ?? 1),
  };
  return Object.freeze(v);
}


export function voiceFor(base, { mood = 'neutral', personality = null } = {}) {
  const mod = MOOD_VOICE[mood] || MOOD_VOICE.neutral;
  const p = personality ? PERSONALITIES[personality] : null;
  return apply(base, mod, p ? { pitch: p.pitch, pace: p.pace } : undefined);
}


export function interjectionFor(mood, previousMood = null) {
  if (!mood || mood === previousMood) return null;
  return MOOD_INTERJECTION[mood] || null;
}


export const cueOfInterjection = (kind) => Object.keys(VOICE_CUES).find((id) => VOICE_CUES[id] === kind) || null;


export function compileInterjection(kind, voice, { personality = null } = {}) {
  const shape = INTERJECTION_SHAPE[kind];
  if (!shape) throw new Error(`no interjection '${kind}' (${INTERJECTIONS.join(', ')})`);
  const laugh = personality && PERSONALITIES[personality] ? PERSONALITIES[personality].laugh : null;
  const text = kind === 'laugh' && LAUGH_TEXT[laugh] ? LAUGH_TEXT[laugh] : shape.text;
  const v = apply(voice, shape);
  const c = compileMumble(text, v, seedOf(`${voice.id || ''}|${kind}|${text}`));
  return {
    text,
    total: c.total,
    events: c.events.map((e) => ({ ...e, from: 0, to: 0, interjection: kind })),
  };
}






export function compileLine(text, base, { mood = 'neutral', personality = null, interjection = null } = {}) {
  const voice = voiceFor(base, { mood, personality });
  const line = compileMumble(text, voice, seedOf(`${base.id || ''}|${text}`));
  if (!interjection) return { ...line, voice, mood, interjection: null, lead: 0 };
  const i = compileInterjection(interjection, voice, { personality });
  const lead = i.total + INTERJECTION_GAP_S;
  return {
    events: [...i.events, ...line.events.map((e) => ({ ...e, at: e.at + lead }))],
    total: line.total + lead,
    speed: line.speed,
    voice,
    mood,
    interjection,
    lead,
  };
}
