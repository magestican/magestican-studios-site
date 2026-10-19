

import { createAudio } from './audio/audio.js';
import { createFootsteps, cueFor } from './audio/cues.js';
import { readCheats } from './cheats.js';
import { createInput, mountTouchControls } from './input.js';
import { loadLevel } from './level/levels.js';
import { createView } from './render/scene.js';
import { STEP } from './sim/constants.js';
import { createSession, stepSession } from './sim/session.js';
import { createHud } from './ui/hud.js';

const cheats = readCheats(location.search);
document.documentElement.dataset.variant = cheats.variant;
const { level, labels, title } = loadLevel(cheats.level);
let session = createSession(level, cheats.checkpoint);
const input = createInput();
mountTouchControls(document.body, input.touch);
const view = createView(document.getElementById('stage'), level, labels);
const hud = createHud(document.getElementById('hud'), labels, cheats.hud, title);
const audio = createAudio();
const footsteps = createFootsteps();
audio.music('main-theme');

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyR') session = createSession(level, session.checkpoint);
  if (e.code === 'Backquote') hud.toggle();
  if (e.code === 'KeyM') audio.toggleMute();
});

let last = performance.now();
let acc = 0;
const MAX_STEPS = 12; 

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += dt * cheats.slow;
  let steps = 0;
  while (acc >= STEP && steps < MAX_STEPS) {
    stepSession(session, input.sample());
    if (cheats.god && session.dead > 0) session.dead = 1;
    for (const e of session.events) {
      view.onEvent(e);
      hud.onEvent(e, session);
      const cue = cueFor(e);
      if (cue) audio.play(cue);
    }
    acc -= STEP;
    steps++;
  }
  if (steps === MAX_STEPS) acc = 0;
  const step = session.dead > 0 ? null : footsteps.update(session.player, dt * cheats.slow);
  if (step) audio.play(step, { volume: 0.8 });
  view.render(session, acc / STEP, dt);
  hud.update(session, dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.body.classList.add('is-ready');

window.s95 = {
  get session() {
    return session;
  },
  level,
};
