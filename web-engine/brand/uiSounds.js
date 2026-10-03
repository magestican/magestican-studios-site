






























export const SAMPLE_RATE = 44100;


export const PEAK_UI = 0.251;
export const PEAK_REWARD = 0.501;


export const UI_SOUND_NAMES = Object.freeze([
  'tap', 'back', 'toggleOn', 'toggleOff', 'tick', 'open', 'sheet',
  'xp', 'levelUp', 'badge', 'trophy', 'share', 'error',
]);

export const REWARD_NAMES = Object.freeze(['xp', 'levelUp', 'badge', 'trophy', 'share']);


export const UI_DURATION_MS = Object.freeze({
  tick: 25, tap: 45, back: 60, toggleOn: 70, toggleOff: 70,
  open: 220, sheet: 220, xp: 180, badge: 600, levelUp: 1100, trophy: 1500,
  share: 320, 
  error: 180, 
});


export const KIT_SOURCE = Object.freeze({
  tool: 'Magestican DJ',
  commit: '1f61eb2',
  brief: 'demos/kits/magestican-ui.yaml',
});


export const UI_SOUNDS = Object.freeze(Object.fromEntries(UI_SOUND_NAMES.map((name) => [name, Object.freeze({
  name,
  ms: UI_DURATION_MS[name],
  peak: REWARD_NAMES.includes(name) ? PEAK_REWARD : PEAK_UI,
  file: `./sfx/${name}.wav`,
})])));




