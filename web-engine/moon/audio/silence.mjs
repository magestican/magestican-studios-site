


































export const DEVICE_LINE = 'Hearing nothing? On an iPhone the side switch silences web pages too - flick it off silent.';

const SILENCES = Object.freeze({
  muted: Object.freeze({
    short: 'Sound is off',
    line: 'Sound is off. Tap Sound on to bring it back.',
  }),
  down: Object.freeze({
    short: 'Sound is turned down',
    line: 'Every level is at zero. Raise one of the sliders to hear anything.',
  }),
  locked: Object.freeze({
    short: 'Tap to start the sound',
    line: 'Your browser holds sound back until the page is touched. Tap anywhere and it will start.',
  }),
  interrupted: Object.freeze({
    short: 'Sound stopped - tap to bring it back',
    line: 'The sound stopped when this page went into the background. Tap anywhere to bring it back.',
  }),
});

export const SILENCE_REASONS = Object.freeze(Object.keys(SILENCES));








export function silenceOf({ muted = false, unlocked = false, ctxState = 'none', master = 1 } = {}) {
  const reason = muted ? 'muted'
    : !(master > 0) ? 'down'
      : !unlocked || ctxState === 'none' ? 'locked'
        : ctxState !== 'running' ? 'interrupted'
          : null;
  if (!reason) return { silent: false, reason: null, short: 'Sound is on', line: DEVICE_LINE };
  return { silent: true, reason, ...SILENCES[reason] };
}
