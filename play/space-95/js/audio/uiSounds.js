





export const UI_SOUNDS = Object.freeze({
  'ui.move': { name: 'ui_move', volume: 0.35 },
  'ui.confirm': { name: 'ui_confirm', volume: 0.6 },
  'ui.back': { name: 'ui_back', volume: 0.6 },
  'ui.error': { name: 'ui_error', volume: 0.6 },
  'ui.pause': { name: 'ui_pause', volume: 0.6 },
  'ui.clockIn': { name: 'ui_clockin', volume: 0.6 },
  'ui.stamp': { name: 'ui_stamp', volume: 0.6 },
  'ui.shiftStart': { name: 'sting_clockin', volume: 0.8 },
});


export const UI_SOUND_NAMES = Object.values(UI_SOUNDS).map((u) => u.name);







export const takesToLoad = (name, files) => (name.startsWith('sting_') ? files.slice(0, 1) : files);






export function uiSound(cue, has) {
  const u =  (UI_SOUNDS)[cue];
  return u && has(u.name) ? u : null;
}
