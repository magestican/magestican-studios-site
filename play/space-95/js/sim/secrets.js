





import { STEP } from './constants.js';

const SIGNAL_RANGE = 6; 
const REARM_RANGE = 9; 
const VISUAL_PULSE = 1.6; 


export function stepSecretSignals(s) {
  const p = s.player;
  for (const e of s.entities) {
    if (!e.alive || !e.signals) continue;
    const d = Math.hypot(e.x - p.x, e.y - p.y);
    if (e.sigArmed === false && d > REARM_RANGE) e.sigArmed = true;
    if (d <= SIGNAL_RANGE && e.sigArmed !== false) {
      e.sigArmed = false;
      e.sigPulse = 0;
      s.events.push({ type: 'signal', id: e.id, signals: e.signals, x: e.x, y: e.y });
    } else if (d <= SIGNAL_RANGE) {
      e.sigPulse = (e.sigPulse ?? 0) + STEP;
      if (e.sigPulse >= VISUAL_PULSE) {
        e.sigPulse = 0;
        const visual = e.signals.filter((x) => x.startsWith('visual:'));
        if (visual.length) s.events.push({ type: 'signal', id: e.id, signals: visual, x: e.x, y: e.y, repeat: true });
      }
    }
  }
}
