

import { createAudio } from './audio/audio.js';
import { createFootsteps, createGallop, createLadder, cueFor, cueRate, signalSounds } from './audio/cues.js';
import { SFX } from './audio/sfxManifest.js';
import { levelMusic as musicOf, SURFACE, shiftSounds } from './audio/shiftSounds.js';
import { readCheats } from './cheats.js';
import { createBoltVoice } from './game/bolt.js';
import { mergeIntoProgress, readProgress, recordShift, saveVariant } from './game/progress.js';
import { createInput, mountTouchControls } from './input.js';
import { SHIFT_IDS, SHIFT_NAMES } from './level/shiftList.js';
import { loadLevel } from './level/shiftLoader.js';
import { preloadCritterSprites } from './render/critterSprite.js';
import { joSpriteLoaded } from './render/joSprite.js';
import { createView } from './render/scene.js';
import { parseAbilities } from './sim/abilities.js';
import { STEP } from './sim/constants.js';
import { placePlane } from './sim/plane.js';
import { createSession, stepSession } from './sim/session.js';
import { fullResume } from './sim/stamps.js';
import { placeTrain } from './sim/train.js';
import { site } from './site/adapter.js';
import { v } from './site/assetUrl.js';
import { createHud } from './ui/hud.js';
import { KEY_ICON, LEVER_ICON } from './ui/icons.js';
import { createPause } from './ui/pause.js';
import { createRescuePrompt } from './ui/rescue.js';
import { createTimesheet } from './ui/timesheet.js';
import { showTitle } from './ui/title.js';

const cheats = readCheats(location.search);

site
  .savedOnSite()
  .then((remote) => remote && mergeIntoProgress(remote))
  .catch(() => {});
const urlVariant = new URLSearchParams(location.search).get('variant');
document.documentElement.dataset.variant = urlVariant ? cheats.variant : readProgress().variant;
const { level, labels, title } = await loadLevel(cheats.level); 

const abilities = parseAbilities(cheats.abilities || (level.id ? '' : 'all'));
let session = createSession(level, cheats.checkpoint, abilities);
const train = level.mode === 'train';

if (train && (cheats.rail !== null || cheats.x !== null || cheats.points)) {
  placeTrain(session, { rail: cheats.rail, s: cheats.s, x: cheats.x, y: cheats.y, points: cheats.points });
  if (cheats.rail !== null || cheats.x !== null) {
    session.partial = true;
    
    for (const d of level.entities ?? []) if (d.kind === 'ability') abilities.add(d.grant);
  }
} else if (level.mode === 'plane' && cheats.x !== null) {
  
  placePlane(session, cheats.x, cheats.y ?? 30, cheats.heading);
  session.partial = true;
  for (const d of level.entities ?? []) if (d.kind === 'ability') abilities.add(d.grant);
} else if (cheats.x !== null) placeAt(session, cheats.x, cheats.y);
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
      
      const f = y !== null && w.floorAt ? w.floorAt({ x, y, w: s.player.w, h: s.player.h }, x) : null;
      s.player.x = s.player.px = x;
      s.player.y = s.player.py = f && f.y > (r + 1) * T ? f.y : (r + 1) * T;
      s.partial = true;
      return;
    }
  }
}


if (train) {
  const help = document.getElementById('help');
  if (help)
    help.innerHTML = `<span><kbd>Space</kbd> throw points</span><span><kbd>&darr;</kbd> brake</span><span class="help-dash" hidden><kbd>Shift</kbd> boost</span><span class="help-tether" hidden><kbd>K</kbd> Bolt's arm</span><span><kbd>R</kbd> retry</span><span><kbd>M</kbd> sound</span><span><kbd>Esc</kbd> pause</span>`;
  const jumpBtn = document.querySelector('[data-touch="jump"]');
  const dashBtn = document.querySelector('[data-touch="dash"]');
  if (jumpBtn) jumpBtn.innerHTML = `${LEVER_ICON}<span class="touch-label">Points</span>`;
  if (dashBtn) dashBtn.innerHTML = `${KEY_ICON}<span class="touch-label">Boost</span>`;
  document.body.classList.add('is-train');
}

if (level.mode === 'plane') {
  const help = document.getElementById('help');
  if (help)
    help.innerHTML = `<span><kbd>&larr;</kbd><kbd>&uarr;</kbd><kbd>&rarr;</kbd><kbd>&darr;</kbd> steer</span><span><kbd>Space</kbd> loop</span><span class="help-dash" hidden><kbd>Shift</kbd> roll</span><span><kbd>R</kbd> retry</span><span><kbd>M</kbd> sound</span><span><kbd>Esc</kbd> pause</span>`;
  const jumpBtn = document.querySelector('[data-touch="jump"]');
  const dashBtn = document.querySelector('[data-touch="dash"]');
  if (jumpBtn) jumpBtn.innerHTML = '<span class="touch-label">Loop</span>';
  if (dashBtn) dashBtn.innerHTML = '<span class="touch-label">Roll</span>';
}
if (abilities.has('dash')) for (const el of document.querySelectorAll('.touch-dash, .help-dash')) el.hidden = false;
if (abilities.has('tether')) for (const el of document.querySelectorAll('.touch-tether, .help-tether')) el.hidden = false;
const input = createInput();
mountTouchControls(document.body, input.touch);
const view = createView(document.getElementById('stage'), level, labels);
const hud = createHud(document.getElementById('hud'), labels, cheats.hud, title);
const rescuePrompt = createRescuePrompt(document.body); 

if (train) hud.update(session, 1 / 60);

const audio = createAudio(undefined, {
  sounds: shiftSounds(level),
  after: Promise.all([joSpriteLoaded, preloadCritterSprites(level.entities ?? [])]),
});
const footsteps = createFootsteps(SURFACE[level.id] ?? 'dirt');
const gallop = level.ride ? createGallop() : null; 
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
const levelMusic = musicOf(level);
audio.musicFirst(levelMusic);
const timesheet = createTimesheet(document.getElementById('timesheet'));
const secretsTotal = (level.entities ?? []).filter((e) => e.kind === 'intel' || e.specimen).length;
if (SHIFT_IDS.includes(level.id)) {
  
  fetch(v(`js/level/ghosts/L${String(level.id).padStart(2, '0')}.json`))
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


let paused =
  !!level.id && cheats.checkpoint === 0 && cheats.x === null && cheats.rail === null && !new URLSearchParams(location.search).has('skip');
if (paused) {
  document.body.classList.add('is-title');
  const save = readProgress();
  
  const shifts = SHIFT_IDS.map((id) => ({
    id,
    name: SHIFT_NAMES[id],
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
      
      
      const cue = cueFor(e, audio.has);
      const best = cueFor(e, (n) => n in SFX);
      if (best && best !== cue) audio.want(best);
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
        if (fullResume(level, session)) site.count('fullResume'); 
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
  const step = session.dead > 0 || train ? null : footsteps.update(session.player, dt * cheats.slow);
  if (step && step in SFX) audio.play(step, { volume: 0.8 });
  const paws = gallop?.update(session.dead === 0 && !session.cleared, dt * cheats.slow);
  if (paws && paws in SFX) audio.play(paws, { volume: 0.7 });
  if (boltHide > 0) boltHide -= dt;
  if (boltHide <= 0 && !boltEl.hidden) {
    boltEl.hidden = true;
    view.boltMood('happy');
  }
  view.render(session, acc / STEP, dt);
  hud.update(session, dt);
  rescuePrompt.update(session);
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
