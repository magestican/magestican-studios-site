

import { createAudio } from './audio/audio.js';
import { createFootsteps, cueFor, signalSounds } from './audio/cues.js';
import { SFX } from './audio/sfxManifest.js';
import { readCheats } from './cheats.js';
import { readProgress, recordShift, saveVariant } from './game/progress.js';
import { createInput, mountTouchControls } from './input.js';
import { loadLevel } from './level/levels.js';
import { createView } from './render/scene.js';
import { parseAbilities } from './sim/abilities.js';
import { STEP } from './sim/constants.js';
import { createSession, stepSession } from './sim/session.js';
import { createHud } from './ui/hud.js';
import { createTimesheet } from './ui/timesheet.js';
import { showTitle } from './ui/title.js';

const cheats = readCheats(location.search);
const urlVariant = new URLSearchParams(location.search).get('variant');
document.documentElement.dataset.variant = urlVariant ? cheats.variant : readProgress().variant;
const { level, labels, title } = loadLevel(cheats.level);
const abilities = parseAbilities(cheats.abilities);
let session = createSession(level, cheats.checkpoint, abilities);
if (abilities.has('dash')) for (const el of document.querySelectorAll('.touch-dash, .help-dash')) el.hidden = false;
const input = createInput();
mountTouchControls(document.body, input.touch);
const view = createView(document.getElementById('stage'), level, labels);
const hud = createHud(document.getElementById('hud'), labels, cheats.hud, title);
const audio = createAudio();
const footsteps = createFootsteps();
audio.music('main-theme');
const timesheet = createTimesheet(document.getElementById('timesheet'));
const secretsTotal = (level.entities ?? []).filter((e) => e.kind === 'intel' || e.specimen).length;
if (level.id) {
  
  fetch(`js/level/ghosts/L${String(level.id).padStart(2, '0')}.json`)
    .then((r) => (r.ok ? r.json() : null))
    .then((g) => {
      if (g) level.par = g.par;
    })
    .catch(() => {});
}
const restart = () => {
  session = createSession(level, 0, abilities);
};

window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyR') session = createSession(level, session.checkpoint, abilities);
  if (e.code === 'Backquote') hud.toggle();
  if (e.code === 'KeyM') audio.toggleMute();
});

let last = performance.now();
let acc = 0;
const MAX_STEPS = 12; 


let paused = !!level.id && cheats.checkpoint === 0 && !new URLSearchParams(location.search).has('skip');
if (paused) {
  showTitle(document.getElementById('title'),  (document.documentElement.dataset.variant), (v) => {
    saveVariant(v);
    document.documentElement.dataset.variant = v;
    paused = false;
  });
}

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += dt * cheats.slow;
  let steps = 0;
  if (paused) acc = 0;
  while (acc >= STEP && steps < MAX_STEPS) {
    stepSession(session, input.sample());
    if (cheats.god && session.dead > 0) session.dead = 1;
    for (const e of session.events) {
      view.onEvent(e);
      hud.onEvent(e, session);
      const cue = cueFor(e, (n) => n in SFX);
      if (cue) audio.play(cue);
      if (e.type === 'signal') for (const n of signalSounds(e, (x) => x in SFX)) audio.play(n, { volume: 0.7 });
      if (e.type === 'clear' && level.id) {
        const save = recordShift(level, session);
        timesheet.show(level, session, save, secretsTotal, { onReplay: restart, onNext: null });
      }
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
