

import { createAudio } from './audio/audio.js';
import { createFootsteps, createLadder, cueFor, cueRate, signalSounds } from './audio/cues.js';
import { SFX } from './audio/sfxManifest.js';
import { readCheats } from './cheats.js';
import { createBoltVoice } from './game/bolt.js';
import { mergeIntoProgress, readProgress, recordShift, saveVariant } from './game/progress.js';
import { createInput, mountTouchControls } from './input.js';
import { buildShift, loadLevel, SHIFT_IDS } from './level/levels.js';
import { createView } from './render/scene.js';
import { parseAbilities } from './sim/abilities.js';
import { STEP } from './sim/constants.js';
import { createSession, stepSession } from './sim/session.js';
import { site } from './site/adapter.js';
import { createHud } from './ui/hud.js';
import { createPause } from './ui/pause.js';
import { createTimesheet } from './ui/timesheet.js';
import { showTitle } from './ui/title.js';

const cheats = readCheats(location.search);

site
  .savedOnSite()
  .then((remote) => remote && mergeIntoProgress(remote))
  .catch(() => {});
const urlVariant = new URLSearchParams(location.search).get('variant');
document.documentElement.dataset.variant = urlVariant ? cheats.variant : readProgress().variant;
const { level, labels, title } = loadLevel(cheats.level);

const abilities = parseAbilities(cheats.abilities || (level.id ? '' : 'all'));
let session = createSession(level, cheats.checkpoint, abilities);
if (cheats.x !== null) placeAt(session, cheats.x, cheats.y);
if (cheats.bossPhase !== null)
  for (const b of session.entities)
    if (b.kind === 'boss')
      Object.assign(b, {
        phase: Math.min(cheats.bossPhase, b.phases.length - 1),
        hp: b.phases[Math.min(cheats.bossPhase, b.phases.length - 1)].hp,
      });


function placeAt(s, x, y) {
  const w = s.world;
  const T = w.tile;
  const c = Math.floor(x / T);
  for (let r = Math.min(w.height - 1, y === null ? w.height - 1 : Math.floor(y / T)); r >= 0; r--) {
    if (w.solid(c, r) || w.oneWay(c, r)) {
      s.player.x = s.player.px = x;
      s.player.y = s.player.py = (r + 1) * T;
      s.partial = true;
      return;
    }
  }
}
if (abilities.has('dash')) for (const el of document.querySelectorAll('.touch-dash, .help-dash')) el.hidden = false;
if (abilities.has('tether')) for (const el of document.querySelectorAll('.touch-tether, .help-tether')) el.hidden = false;
const input = createInput();
mountTouchControls(document.body, input.touch);
const view = createView(document.getElementById('stage'), level, labels);
const hud = createHud(document.getElementById('hud'), labels, cheats.hud, title);
const audio = createAudio();

const SURFACE = {
  1: 'grass_blade',
  2: 'bark',
  3: 'dirt',
  4: 'dirt',
  5: 'leaf',
  6: 'grass_blade',
  7: 'grass_blade',
  8: 'honey',
  9: 'leaf',
  10: 'bark',
  11: 'plastic',
}; 
const footsteps = createFootsteps(SURFACE[level.id] ?? 'dirt');
const ladder = createLadder();
const boltVoice = createBoltVoice();
const boltEl = document.getElementById('bolt');
let boltHide = 0;
const boltSay = (line) => {
  if (!line) return;
  boltEl.innerHTML = `<strong>Bolt</strong><span>${line.text}</span>`;
  boltEl.hidden = false;
  
  if (window.matchMedia('(max-width: 600px)').matches) {
    const hud = document.getElementById('hud');
    if (hud) boltEl.style.top = `${Math.round(hud.getBoundingClientRect().bottom + 12)}px`;
  } else boltEl.style.top = '';
  boltHide = 3.2;
  view.boltMood(line.mood);
  if (line.beep && line.beep in SFX) audio.play(line.beep, { volume: 0.7 });
};

const MUSIC = {
  1: 'orchard',
  2: 'canopy',
  3: 'orchard',
  4: 'underground',
  5: 'stripecat',
  6: 'windward',
  7: 'long-way-home',
  8: 'honeycomb',
  9: 'puddle-sea',
  10: 'gardener',
  11: 'desk',
};
const levelMusic = [MUSIC[level.id], 'main-theme'].filter(Boolean);
audio.musicFirst(levelMusic);
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

const pause = createPause(document.getElementById('pause'), {
  onResume: () => {},
  onRestartBeacon: () => {
    session = createSession(level, session.checkpoint, abilities);
  },
  onRestartShift: () => {
    session = createSession(level, 0, abilities);
  },
  onVariant: (v) => {
    saveVariant(v);
    document.documentElement.dataset.variant = v;
  },
  onSound: () => audio.toggleMute(),
  getState: () => ({ variant: document.documentElement.dataset.variant, muted: audio.muted }),
});

document.getElementById('pause-btn')?.addEventListener('click', () => {
  if (!paused) pause.toggle();
});

window.addEventListener('keydown', (e) => {
  if ((e.code === 'Escape' || e.code === 'KeyP') && !paused) pause.toggle();
  if (pause.open) return;
  if (e.code === 'KeyR') session = createSession(level, session.checkpoint, abilities);
  if (e.code === 'Backquote') hud.toggle();
  if (e.code === 'KeyM') audio.toggleMute();
});

let last = performance.now();
let acc = 0;
const MAX_STEPS = 12; 


let paused = !!level.id && cheats.checkpoint === 0 && cheats.x === null && !new URLSearchParams(location.search).has('skip');
if (paused) {
  document.body.classList.add('is-title');
  const save = readProgress();
  
  const shifts = SHIFT_IDS.map((id) => ({
    id,
    name: buildShift(id).name,
    unlocked: id === 1 || save.cleared[id - 2],
    current: id === level.id,
  }));
  const goShift = (id) => {
    location.search = `?level=${id}`;
  };
  showTitle(
    document.getElementById('title'),
     (document.documentElement.dataset.variant),
    (v) => {
      saveVariant(v);
      document.documentElement.dataset.variant = v;
      paused = false;
      document.body.classList.remove('is-title');
      boltSay(boltVoice.start());
    },
    shifts,
    goShift,
  );
}

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  acc += dt * cheats.slow;
  let steps = 0;
  if (paused || pause.open) acc = 0;
  while (acc >= STEP && steps < MAX_STEPS) {
    stepSession(session, input.sample());
    if (cheats.god && session.dead > 0) session.dead = 1;
    for (const e of session.events) {
      view.onEvent(e);
      hud.onEvent(e, session);
      const cue = cueFor(e, (n) => n in SFX);
      const chained = e.type === 'dewBounce' || e.type === 'seed' ? ladder(e.type, session.time) : 1;
      if (cue) audio.play(cue, { rate: cueRate(e) * chained });
      if (e.type === 'signal') for (const n of signalSounds(e, (x) => x in SFX)) audio.play(n, { volume: 0.7 });
      boltSay(boltVoice.onEvent(e, STEP));
      
      
      if (e.type === 'ability' && (e.grant === 'dash' || e.grant === 'tether'))
        for (const el of document.querySelectorAll(`.touch-${e.grant}, .help-${e.grant}`)) el.hidden = false;
      
      if (e.type === 'bossIntro') audio.musicFirst(['boss-mini', ...levelMusic]);
      if (e.type === 'bossDefeat' || e.type === 'bossEscape') audio.musicFirst(levelMusic);
      
      if (e.type === 'defeat' && e.how === 'pebble') site.count('pebbleKills');
      if (e.type === 'secret' && e.secret === 'specimen') site.seen('specimens', String(e.id));
      if (e.type === 'bossDefeat') site.seen([10, 20].includes(level.id) ? 'bigBosses' : 'miniBosses', String(e.id));
      
      if (e.type === 'gameOver' && level.id) {
        const save = recordShift(level, { ...session, cleared: false });
        site.shiftEnd({ save, level: level.id, cleared: false, seconds: session.time, underPar: false, coop: false });
      }
      if (e.type === 'clear' && level.id) {
        const save = recordShift(level, session);
        const next = SHIFT_IDS.includes(level.id + 1) ? () => (location.search = `?level=${level.id + 1}&skip=1`) : null;
        site.shiftEnd({
          save,
          level: level.id,
          cleared: true,
          seconds: session.time,
          underPar: !session.partial && !!level.par && session.time <= level.par,
          coop: false,
        });
        timesheet.show(level, session, save, secretsTotal, { onReplay: restart, onNext: next });
      }
    }
    acc -= STEP;
    steps++;
  }
  if (steps === MAX_STEPS) acc = 0;
  const step = session.dead > 0 ? null : footsteps.update(session.player, dt * cheats.slow);
  if (step && step in SFX) audio.play(step, { volume: 0.8 });
  if (boltHide > 0) boltHide -= dt;
  if (boltHide <= 0 && !boltEl.hidden) {
    boltEl.hidden = true;
    view.boltMood('happy');
  }
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
