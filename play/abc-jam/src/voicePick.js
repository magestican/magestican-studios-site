






export const VOICE_KEY = 'abcjam-voice';
export const DEFAULT_VOICE = 'teacher';
export const VOICE_DIRS = Object.freeze({ teacher: '../assets/voice/', wizard: '../assets/voice-wizard/' });

export const pickVoice = (raw) => (Object.hasOwn(VOICE_DIRS, raw) ? raw : DEFAULT_VOICE);
