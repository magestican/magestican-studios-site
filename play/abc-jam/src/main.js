










import { LETTERS, LETTER, WORD_STEPS, DINOS, DINO, letterPhrase, colourFor } from './content.js';
import {
  TIMING, createParade, jamPress, pickRound, createSpeller, createRain,
  loadProgress, saveProgress, addSticker, PARTY_AFTER, createResetConfirm, resetProgress,
  PRIZES, prizesFor, newPrizes, nextGoal, meters, createDinoEggs, createDinoMatch, FOUND_PRIZE, hintFor,
} from './rules.js';
import { PUZZLES, createPuzzle, pieceShape, PIC_W, PIC_H, dropFor, nearness } from './puzzle.js';
import { SFX_NAMES } from './sfx.js';
import { T, fill } from './strings.js';
import { createGameSfx } from '../../shared/audio/gameSfx.js';
import { createTrackMusic, MUSIC_KEY } from '../../shared/audio/trackMusic.js';
import { wireMusicButton } from '../../shared/ui/musicButton.js';
import { bootDone } from '../../shared/ui/fitScreen.js';
import { silentWavDataUrl } from '../../shared/audio/iosUnlock.js';
import { gameMuted } from '../../../web-engine/brand/uiSound.js';
import { uiSoundOn } from '../../../web-engine/brand/uiSoundPref.js';
import { createVoice } from './voice.js';
import { VOICE_KEY, VOICE_DIRS, DEFAULT_VOICE, pickVoice } from './voicePick.js';
import { createTower, createRun, CORE_SPAN, FLOOR_H } from './tower.js';
import { loose, step } from './fall.js';
import { id as vid, FIXED, countId } from './voiceLines.js';
import { initAnalytics, trackEvent } from '../../../web-engine/visits/visits.js';

const GAME_ID = 'abc-jam';






const HAS_MUSIC = true;
const MUSIC_LEVEL = 0.21;
const music = createTrackMusic({
  game: GAME_ID, trackIds: ['main'], level: MUSIC_LEVEL,
  manifestUrl: new URL('../assets/music/music.json', import.meta.url),
});

const $ = (id) => document.getElementById(id);
const store = (() => { try { return globalThis.localStorage; } catch { return null; } })();
const sfx = createGameSfx(new URL('../assets/sfx/', import.meta.url), SFX_NAMES);
const play = (name) => { try { sfx.play(name); } catch {  } };

try { initAnalytics({ page: GAME_ID }); } catch {  }

let progress = loadProgress(store);

let prizesHad = prizesFor(progress);
const save = () => { saveProgress(store, progress); checkPrizes(); };







const voices = {};
const voiceFor = (name) => {
  if (voices[name]) return voices[name];
  const v = (voices[name] = createVoice({
    baseUrl: new URL(VOICE_DIRS[name], import.meta.url),
    
    version: new URL(import.meta.url).searchParams.get('v') || '',
    muted: () => !uiSoundOn() || gameMuted(),
    onLine: (ms) => music.duck?.(0.3, ms + 300),
  }));
  
  
  v.prefetch(LETTERS.map((l) => vid.phrase(l.ch)));
  v.prefetch(DINOS.map((d) => vid.dinoFor(d.id)));
  return v;
};
let voiceName = (() => { try { return pickVoice(store?.getItem(VOICE_KEY)); } catch { return DEFAULT_VOICE; } })();
let voice = voiceFor(voiceName);
const say = (lineId) => voice.say(lineId);


let timers = [];
const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
function clearTimers() { timers.forEach(clearTimeout); timers = []; }


const fx = $('fx');
const reduceMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const CONFETTI = ['#ff4f6d', '#ff8c1a', '#f5b700', '#38b000', '#00a6ed', '#7b5cff', '#e040fb'];

function confetti(n = 40, { x = 0.5, y = 0.4 } = {}) {
  if (reduceMotion) n = Math.min(n, 8);
  for (let i = 0; i < n; i++) {
    const p = document.createElement('span');
    p.className = 'aj-confetti';
    const ang = Math.random() * Math.PI * 2;
    const dist = 120 + Math.random() * 320;
    p.style.left = `${x * 100}%`;
    p.style.top = `${y * 100}%`;
    p.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(ang) * dist + 200}px`);
    p.style.setProperty('--r', `${Math.random() * 720 - 360}deg`);
    p.style.background = CONFETTI[i % CONFETTI.length];
    p.style.animationDelay = `${Math.random() * 120}ms`;
    fx.appendChild(p);
    setTimeout(() => p.remove(), 1800);
  }
}

function stars(n = 6, at = null) {
  const r = at?.getBoundingClientRect?.();
  const W = globalThis.innerWidth || 1;
  const H = globalThis.innerHeight || 1;
  const x = r ? (r.left + r.width / 2) / W : 0.5;
  const y = r ? (r.top + r.height / 2) / H : 0.4;
  for (let i = 0; i < n; i++) {
    const s = document.createElement('span');
    s.className = 'aj-star';
    s.innerHTML = iconHtml(i % 2 ? 'star' : 'sparkle');
    const ang = (i / n) * Math.PI * 2;
    s.style.left = `${x * 100}%`;
    s.style.top = `${y * 100}%`;
    s.style.setProperty('--dx', `${Math.cos(ang) * 110}px`);
    s.style.setProperty('--dy', `${Math.sin(ang) * 110}px`);
    fx.appendChild(s);
    setTimeout(() => s.remove(), 1100);
  }
}





const ICONS = new URL('../assets/icons/abc-jam/svg/sticker/', import.meta.url);
const iconSrc = (id) => new URL(`${id}.svg`, ICONS).href;
const iconHtml = (id) => `<img class="aj-ic" src="${iconSrc(id)}" alt="" draggable="false">`;
function setPic(el, id) { el.innerHTML = iconHtml(id); }

function stickerToast(label, id = 'balloon', src = null) {
  const t = document.createElement('div');
  t.className = 'aj-toast';
  t.innerHTML = `<span aria-hidden="true">${iconHtml('star')}</span>${src ? '<img class="aj-ic aj-toast-pic" alt="" draggable="false">' : iconHtml(id)}<b></b>`;
  if (src) t.querySelector('.aj-toast-pic').src = src;
  t.querySelector('b').textContent = label;
  fx.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

function party(line = FIXED.hooray) {
  play('party');
  confetti(90, { x: 0.5, y: 0.3 });
  later(() => confetti(60, { x: 0.25, y: 0.5 }), 400);
  later(() => confetti(60, { x: 0.75, y: 0.5 }), 800);
  document.body.classList.add('aj-partying');
  later(() => document.body.classList.remove('aj-partying'), TIMING.partyMs);
  say(line);
}

function bump(el, cls) {
  if (!el) return;
  el.classList.remove(cls);
  void el.offsetWidth; 
  el.classList.add(cls);
}


let mode = null; 
let busy = false; 
let stopLoop = null;

function show(id) {
  for (const s of document.querySelectorAll('.aj-screen')) s.hidden = s.id !== id;
  document.body.dataset.screen = id;
  globalThis.scrollTo?.(0, 0);
}

function leaveMode() {
  clearTimers();
  if (stopLoop) { stopLoop(); stopLoop = null; }
  mode = null;
  busy = false;
  try { synth?.cancel(); } catch {  }
  document.body.classList.remove('aj-partying', 'aj-finale');
  $('stage').innerHTML = '';
  $('stage').className = 'aj-stage';
}

function goHome({ quiet = false } = {}) {
  leaveMode();
  
  if (!quiet) play('tap');
  $('start-letter').textContent = LETTERS[progress.furthest]?.ch || 'A';
  $('start-letter').style.color = colourFor($('start-letter').textContent);
  renderHub();
  show('hub');
}


const narrowMq = globalThis.matchMedia?.('(max-width: 719px)');
const isNarrow = () => !!narrowMq?.matches;
const ABC_ROWS = ['ABCDEFG', 'HIJKLMN', 'OPQRSTU', 'VWXYZ'];
const QWERTY_ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
let kbLayout = (() => { try { return store?.getItem('abcjam-kb') === 'qwerty' ? 'qwerty' : 'abc'; } catch { return 'abc'; } })();
let wanted = null; 
let choices = []; 

function buildKeyboard() {
  const kb = $('kb');
  kb.innerHTML = '';
  for (const row of kbLayout === 'qwerty' ? QWERTY_ROWS : ABC_ROWS) {
    const r = document.createElement('div');
    r.className = 'aj-kb-row';
    for (const ch of row) {
      const k = document.createElement('button');
      k.type = 'button';
      k.className = 'aj-key';
      k.dataset.ch = ch;
      k.textContent = ch;
      k.style.setProperty('--c', colourFor(ch));
      r.appendChild(k);
    }
    kb.appendChild(r);
  }
  $('kb-toggle').textContent = kbLayout === 'qwerty' ? T.kbToAbc : T.kbToKeys;
  $('kb-toggle').setAttribute('aria-label', kbLayout === 'qwerty' ? T.kbToAbcSpoken : T.kbToKeysSpoken);
  markWanted();
}

function decoys(want, n = 3) {
  const pool = LETTERS.map((l) => l.ch).filter((c) => c !== want);
  const out = [];
  while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out;
}

function setChoices(list) {
  choices = list;
  const b = $('bubbles');
  b.innerHTML = '';
  for (const ch of list) {
    const k = document.createElement('button');
    k.type = 'button';
    k.className = 'aj-bubble';
    k.dataset.ch = ch;
    k.textContent = ch;
    k.style.setProperty('--c', colourFor(ch));
    b.appendChild(k);
  }
  markWanted();
}


function prompt(want) {
  wanted = want;
  clearHints();
  if (want) {
    const list = [want, ...decoys(want)];
    for (let i = list.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [list[i], list[j]] = [list[j], list[i]]; }
    setChoices(list);
  }
  markWanted();
}

function inputKeys(ch) {
  return document.querySelectorAll(`#kb .aj-key[data-ch="${ch}"], #bubbles .aj-bubble[data-ch="${ch}"], .aj-dino-choice[data-ch="${ch}"], .aj-tblock.is-live[data-ch="${ch}"], .aj-pz-piece:not(.is-home)[data-ch="${ch}"]`);
}
function markWanted() {
  for (const k of document.querySelectorAll('.aj-key, .aj-bubble')) k.classList.toggle('is-wanted', !!wanted && k.dataset.ch === wanted);
}
function clearHints() {
  for (const k of document.querySelectorAll('.hint-glow, .hint-bounce, .hint-point')) k.classList.remove('hint-glow', 'hint-bounce', 'hint-point');
}
function showHint(hint, want) {
  clearHints();
  const cls = { glow: ['hint-glow'], bounce: ['hint-glow', 'hint-bounce'], point: ['hint-glow', 'hint-bounce', 'hint-point'] }[hint] || [];
  for (const k of inputKeys(want)) k.classList.add(...cls);
}

function layoutInput() {
  const narrow = isNarrow();
  
  
  const useBubbles = narrow && mode !== 'rain' && mode !== 'match' && mode !== 'tower' && mode !== 'puzzle';
  $('bubbles').hidden = !useBubbles || !mode;
  $('kb').hidden = narrow || !mode || mode === 'puzzle';
  $('kb-toggle').hidden = narrow || !mode || mode === 'puzzle';
  document.body.classList.toggle('aj-narrow', narrow);
}
narrowMq?.addEventListener?.('change', () => { layoutInput(); if (mode === 'jam') setChoices(jamChoices()); });

function flashKey(ch) {
  for (const k of inputKeys(ch)) bump(k, 'is-hit');
}


function press(ch) {
  
  
  if (busy && mode === 'puzzle') { pzWaitCue(String(ch).toUpperCase()); return; }
  if (!mode || busy) return;
  const c = String(ch).toUpperCase();
  if (!/^[A-Z]$/.test(c)) return;
  flashKey(c);
  ({ parade: paradePress, jam: jamPressed, words: wordPress, rain: rainPress, eggs: eggsPress, match: matchPress, tower: towerPress, puzzle: puzzlePress })[mode]?.(c);
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Escape' && mode) { e.preventDefault(); goHome(); return; }
  if (e.repeat) return;
  if (/^[a-z]$/i.test(e.key) && mode) { e.preventDefault(); press(e.key); }
});
document.addEventListener('click', (e) => {
  const k = e.target.closest?.('.aj-key, .aj-bubble, .aj-balloon, .aj-dino-choice, .aj-pz-piece');
  
  if (k?.classList.contains('aj-pz-piece') && performance.now() - pzDragEndedAt < 500) return;
  if (k?.dataset.ch) press(k.dataset.ch);
});


function renderProgress(items, at) {
  const p = $('progress');
  p.innerHTML = '';
  items.forEach((label, i) => {
    const d = document.createElement('span');
    d.className = 'aj-dot' + (i < at ? ' is-done' : '') + (i === at ? ' is-now' : '');
    
    if (label && typeof label === 'object') setPic(d, label.icon); else d.textContent = label;
    if (i < at) d.style.setProperty('--c', colourFor(typeof label === 'string' ? label[0] || 'A' : 'A'));
    p.appendChild(d);
  });
  p.querySelector('.is-now')?.scrollIntoView?.({ block: 'nearest', inline: 'center' });
}


let parade = null;

function startParade() {
  leaveMode();
  mode = 'parade';
  parade = createParade(progress.furthest);
  trackEvent?.('game_start', { game: GAME_ID, level: 'parade' });
  show('play');
  layoutInput();
  buildKeyboard();
  showParadeLetter();
}

function showParadeLetter() {
  const l = parade.current();
  renderProgress(LETTERS.map((x) => x.ch), parade.index);
  const st = $('stage');
  st.className = 'aj-stage aj-stage-parade';
  st.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'aj-card aj-enter';
  card.style.setProperty('--c', colourFor(l.ch));
  card.innerHTML = '<div class="aj-big"><span class="aj-up"></span><span class="aj-low"></span></div>'
    + '<div class="aj-pic" aria-hidden="true"></div><div class="aj-word"></div>';
  card.querySelector('.aj-up').textContent = l.ch;
  card.querySelector('.aj-low').textContent = l.ch.toLowerCase();
  setPic(card.querySelector('.aj-pic'), l.pic);
  const w = card.querySelector('.aj-word');
  
  const at = l.ends ? l.word.toUpperCase().lastIndexOf(l.ch) : l.word.toUpperCase().indexOf(l.ch);
  [...l.word].forEach((c, i) => {
    const s = document.createElement('span');
    s.textContent = c;
    if (i === at) s.className = 'is-key';
    w.appendChild(s);
  });
  st.appendChild(card);
  play('whoosh');
  prompt(l.ch);
  say(vid.phrase(l.ch));
}

function paradePress(c) {
  const r = parade.press(c);
  if (r.kind === 'wrong') { onWrong(r); return; }
  if (r.kind !== 'right') return;
  busy = true;
  clearHints();
  play(r.note);
  play('pop');
  const card = document.querySelector('.aj-card');
  card?.classList.add('aj-pop');
  stars(8, card);
  
  
  if (addSticker(progress, 'letter', r.sticker)) later(() => { play('star'); stickerToast(r.letter); }, 450);
  progress.furthest = r.finished ? 0 : parade.index;
  save();
  if (r.finished) { later(paradeFinale, 700); return; }
  const gap = r.party ? TIMING.partyMs : TIMING.letterGapMs;
  if (r.party) later(() => party(vid.party(r.letter)), 500);
  later(() => { busy = false; showParadeLetter(); }, gap + (r.party ? 500 : 0));
}


function paradeFinale() {
  const st = $('stage');
  st.className = 'aj-stage aj-stage-finale';
  st.innerHTML = '<div class="aj-march"></div><div class="aj-finale-pic" aria-hidden="true">' + iconHtml('trophy') + '</div>';
  const m = st.querySelector('.aj-march');
  LETTERS.forEach((l, i) => {
    const s = document.createElement('span');
    s.textContent = l.ch;
    s.style.setProperty('--c', colourFor(l.ch));
    s.style.animationDelay = `${i * 90}ms`;
    m.appendChild(s);
  });
  renderProgress(LETTERS.map((x) => x.ch), LETTERS.length);
  wanted = null; markWanted();
  document.body.classList.add('aj-finale'); 
  
  LETTERS.forEach((l, i) => later(() => play(sfxNoteFor(l.ch)), i * 280));
  later(() => party(FIXED.alphabetDone), LETTERS.length * 280);
  later(() => { busy = false; goHome(); }, LETTERS.length * 280 + TIMING.partyMs + 1200);
}
const sfxNoteFor = (ch) => jamPress(ch).note;


function onWrong(r) {
  play('oops');
  showHint(r.hint, r.want);
  bump(document.querySelector('.aj-card, .aj-slots'), 'aj-wobble'); 
  if (r.hint === 'bounce' || r.hint === 'point') {
    later(() => { play('hint'); say(vid.find(r.want)); }, 250);
  }
}


let jamCount = 0;
function jamChoices() {
  return decoys('', 4);
}

function startJam() {
  leaveMode();
  mode = 'jam';
  jamCount = 0;
  wanted = null;
  trackEvent?.('game_start', { game: GAME_ID, level: 'jam' });
  show('play');
  layoutInput();
  buildKeyboard();
  setChoices(jamChoices());
  $('progress').innerHTML = `<span class="aj-jam-label" aria-hidden="true">${iconHtml('piano')} ${iconHtml('notes')}</span>`;
  const st = $('stage');
  st.className = 'aj-stage aj-stage-jam';
  st.innerHTML = `<div class="aj-jam-hint" aria-hidden="true">${iconHtml('hand_up')} ${iconHtml('keyboard')}</div>`;
  say(FIXED.jamStart);
}

function jamPressed(c) {
  const r = jamPress(c);
  if (r.kind !== 'right') return;
  play(r.note);
  const st = $('stage');
  st.querySelector('.aj-jam-hint')?.remove();
  const l = LETTER[r.letter];
  const el = document.createElement('div');
  el.className = 'aj-jam-letter';
  el.style.setProperty('--c', colourFor(r.letter));
  
  
  const cols = isNarrow() ? 3 : 5;
  const slot = jamCount % (cols * 2);
  el.style.left = `${((slot % cols) + 0.5) * (100 / cols) + (Math.random() * 4 - 2)}%`;
  el.style.top = `${(Math.floor(slot / cols)) * 50 + 3 + Math.random() * 4}%`;
  el.style.setProperty('--tilt', `${Math.random() * 30 - 15}deg`);
  el.innerHTML = '<b></b><i aria-hidden="true"></i>';
  el.querySelector('b').textContent = r.letter;
  setPic(el.querySelector('i'), l.pic);
  st.appendChild(el);
  stars(5, el);
  
  const all = st.querySelectorAll('.aj-jam-letter');
  const live = [...all].filter((x) => !x.classList.contains('aj-away'));
  if (live.length > cols * 2 - 1) { const old = live[0]; old.classList.add('aj-away'); setTimeout(() => old.remove(), 600); }
  say(vid.phrase(r.letter));
  jamCount += 1;
  if (jamCount % 15 === 0) party(FIXED.jamParty);
  if (isNarrow()) setChoices(jamChoices());
}


let speller = null;
let stepId = 'three';

function showSteps() {
  leaveMode();
  show('steps');
  const list = $('step-list');
  list.innerHTML = '';
  const goal = nextGoal(progress);
  const sample = { three: ['cat', 'cat'], four: ['fish', 'fish'], five: ['apple', 'apple'] };
  WORD_STEPS.forEach((s, i) => {
    const [w, pic] = sample[s.id] || s.words[0];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'aj-step';
    b.style.setProperty('--c', ['#38b000', '#00a6ed', '#7b5cff'][i % 3]);
    const done = s.words.filter(([x]) => progress.words.includes(x)).length;
    b.innerHTML = '<span class="aj-step-pic" aria-hidden="true"></span><span class="aj-step-word"></span>'
      + '<span class="aj-step-dots" aria-hidden="true"></span><span class="aj-step-count"></span>';
    setPic(b.querySelector('.aj-step-pic'), pic);
    b.querySelector('.aj-step-word').textContent = w.toUpperCase();
    b.querySelector('.aj-step-dots').textContent = '●'.repeat(s.size);
    b.querySelector('.aj-step-count').innerHTML = `${iconHtml('star')} ${done} / ${s.words.length}`;
    b.setAttribute('aria-label', fill(T.stepWords, { n: s.size }));
    if (goal.go === 'words' && goal.step === s.id) b.classList.add('aj-next');
    b.addEventListener('click', () => { play('tap'); startWords(s.id); });
    list.appendChild(b);
  });
  say(FIXED.pickWords);
}

function startWords(id) {
  leaveMode();
  mode = 'words';
  stepId = id;
  speller = createSpeller(pickRound(id));
  trackEvent?.('game_start', { game: GAME_ID, level: `words-${id}` });
  show('play');
  layoutInput();
  buildKeyboard();
  showWord();
}

function showWord() {
  const cur = speller.current();
  const st = $('stage');
  st.className = 'aj-stage aj-stage-words';
  st.innerHTML = '<div class="aj-pic aj-word-pic aj-enter" aria-hidden="true"></div><div class="aj-slots"></div>';
  setPic(st.querySelector('.aj-word-pic'), cur.pic);
  const slots = st.querySelector('.aj-slots');
  [...cur.word.toUpperCase()].forEach((c, i) => {
    const s = document.createElement('span');
    s.className = 'aj-slot' + (i === 0 ? ' is-now' : '');
    s.textContent = c;
    s.dataset.c = colourFor(c);
    slots.appendChild(s);
  });
  renderProgress(Array.from({ length: speller.total }, (_, i) => (i < speller.wordIndex ? { icon: 'star' } : '•')), speller.wordIndex);
  play('whoosh');
  prompt(speller.want());
  say(vid.spell(cur.word));
}

function wordPress(c) {
  const r = speller.press(c);
  if (r.kind === 'wrong') { onWrong(r); return; }
  if (r.kind !== 'right') return;
  clearHints();
  play(r.note);
  const slots = document.querySelectorAll('.aj-slot');
  const s = slots[r.slot];
  if (s) { s.classList.remove('is-now'); s.classList.add('is-done'); s.style.setProperty('--c', s.dataset.c); bump(s, 'aj-jump'); }
  slots[r.slot + 1]?.classList.add('is-now');
  if (!r.wordDone) {
    say(vid.name(r.letter));
    prompt(speller.want());
    return;
  }
  
  
  busy = true;
  wanted = null; markWanted();
  later(() => {
    play('word');
    document.querySelector('.aj-slots')?.classList.add('aj-wave');
    document.querySelector('.aj-word-pic')?.classList.add('aj-dance');
    confetti(60);
    stars(10, document.querySelector('.aj-word-pic'));
    say(vid.spelled(r.wordDone));
  }, 350);
  if (addSticker(progress, 'word', r.sticker)) { save(); later(() => { play('star'); stickerToast(r.wordDone.toUpperCase()); }, 1200); }
  if (r.roundDone) {
    later(() => party(FIXED.wordsDone), TIMING.wordGapMs);
    later(() => { busy = false; showSteps(); }, TIMING.wordGapMs + TIMING.partyMs + 600);
    return;
  }
  later(() => { busy = false; showWord(); }, TIMING.wordGapMs);
}


let rain = null;

function startRain() {
  leaveMode();
  mode = 'rain';
  
  const met = LETTERS.slice(0, Math.max(6, progress.furthest + 1, progress.letters.length)).map((l) => l.ch);
  rain = createRain({ letters: met });
  trackEvent?.('game_start', { game: GAME_ID, level: 'rain' });
  show('play');
  layoutInput();
  buildKeyboard();
  wanted = null; markWanted();
  $('progress').innerHTML = `<span class="aj-rain-count">${iconHtml('balloon')} <span id="rain-count">0</span></span>`;
  const st = $('stage');
  st.className = 'aj-stage aj-stage-rain';
  st.innerHTML = '<div class="aj-sky"></div>';
  say(isNarrow() ? FIXED.rainTap : FIXED.rainKeys);
  const els = new Map();
  let last = performance.now();
  let raf = 0;
  const frame = (now) => {
    const dt = Math.min(100, now - last);
    last = now;
    const looped = rain.tick(dt);
    if (looped.length) play('whoosh');
    const sky = st.querySelector('.aj-sky');
    const live = new Set();
    for (const b of rain.balloons) {
      live.add(b.id);
      let el = els.get(b.id);
      if (!el) {
        el = document.createElement('button');
        el.type = 'button';
        el.className = 'aj-balloon';
        el.dataset.ch = b.ch;
        el.style.setProperty('--c', colourFor(b.ch));
        el.innerHTML = `<b>${b.ch}</b><i aria-hidden="true"></i>`;
        el.setAttribute('aria-label', fill(T.balloon, { letter: b.ch }));
        sky.appendChild(el);
        els.set(b.id, el);
      }
      el.style.left = `${b.x * 100}%`;
      
      el.style.bottom = `calc(${b.y.toFixed(4)} * (100% + 170px) - 170px)`;
      el.style.setProperty('--sway', `${Math.sin(now / 600 + b.id) * 10}px`);
    }
    for (const [id, el] of els) if (!live.has(id)) { els.delete(id); if (!el.classList.contains('aj-burst')) el.remove(); }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  stopLoop = () => cancelAnimationFrame(raf);
  rainPop.els = els;
}

function rainPress(c) {
  const r = rain.press(c);
  if (r.kind === 'miss') { play('hint'); return; }
  if (r.kind !== 'pop') return;
  play(r.note);
  play('pop');
  const el = rainPop.els?.get(r.id);
  if (el) {
    rainPop.els.delete(r.id);
    el.classList.add('aj-burst');
    stars(6, el);
    setTimeout(() => el.remove(), 500);
  }
  
  voice.sayNext(vid.name(r.letter));
  const cnt = $('rain-count');
  if (cnt) { cnt.textContent = String(rain.popped); bump(cnt.parentElement, 'aj-jump'); }
  progress.pops += 1;
  if (r.sticker) { progress.stars += 1; play('star'); stickerToast(String(rain.popped), 'balloon'); confetti(50); }
  save();
}
const rainPop = { els: null };




let eggs = null;

function startEggs() {
  leaveMode();
  mode = 'eggs';
  eggs = createDinoEggs();
  trackEvent?.('game_start', { game: GAME_ID, level: 'dino-eggs' });
  show('play');
  layoutInput();
  buildKeyboard();
  showEgg();
}


function nameLine(d) {
  const w = document.createElement('div');
  w.className = 'aj-word aj-dino-name';
  [...d.name].forEach((c, i) => {
    const s = document.createElement('span');
    s.textContent = c;
    if (i === 0) s.className = 'is-key';
    w.appendChild(s);
  });
  return w;
}

function showEgg() {
  const d = eggs.current();
  renderProgress(DINOS.map((x, i) => (i < eggs.index ? { icon: x.pic } : { icon: 'dino_egg' })), eggs.index);
  const st = $('stage');
  st.className = 'aj-stage aj-stage-parade aj-stage-eggs';
  st.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'aj-card aj-egg-card aj-enter';
  card.style.setProperty('--c', colourFor(d.ch));
  card.innerHTML = '<div class="aj-big"><span class="aj-up"></span><span class="aj-low"></span></div>'
    + '<div class="aj-pic aj-egg" aria-hidden="true"></div>';
  card.querySelector('.aj-up').textContent = d.ch;
  card.querySelector('.aj-low').textContent = d.ch.toLowerCase();
  setPic(card.querySelector('.aj-pic'), 'dino_egg');
  card.appendChild(nameLine(d));
  st.appendChild(card);
  play('whoosh');
  prompt(d.ch);
  say(vid.dinoFor(d.id));
}

function eggsPress(c) {
  const r = eggs.press(c);
  if (r.kind === 'wrong') { onWrong(r); return; }
  if (r.kind !== 'right') return;
  const d = DINO[r.dino];
  clearHints();
  busy = true;
  wanted = null; markWanted();
  play(r.note);
  
  const pic = document.querySelector('.aj-egg');
  if (pic) {
    bump(pic, 'aj-wobble');
    later(() => {
      setPic(pic, d.pic);
      pic.classList.add('aj-hatch', 'aj-dance');
      play('word');
      confetti(50);
      stars(8, pic);
      say(vid.dinoHello(d.id));
    }, 450);
  }
  if (addSticker(progress, 'dino', r.sticker)) { save(); later(() => { play('star'); stickerToast(d.name, d.pic); }, 1500); }
  if (r.roundDone) {
    later(() => party(FIXED.eggsDone), TIMING.wordGapMs);
    later(() => { busy = false; goHome(); }, TIMING.wordGapMs + TIMING.partyMs + 600);
    return;
  }
  later(() => { busy = false; showEgg(); }, TIMING.wordGapMs);
}




let match = null;

function startMatch() {
  leaveMode();
  mode = 'match';
  match = createDinoMatch();
  trackEvent?.('game_start', { game: GAME_ID, level: 'dino-match' });
  show('play');
  layoutInput();
  buildKeyboard();
  showMatch();
}

function showMatch() {
  const q = match.current();
  renderProgress(Array.from({ length: match.total }, (_, i) => (i < match.index ? { icon: 'star' } : '•')), match.index);
  const st = $('stage');
  st.className = 'aj-stage aj-stage-match';
  st.innerHTML = '';
  st.appendChild(nameLine(q.want));
  const row = document.createElement('div');
  row.className = 'aj-dino-choices aj-enter';
  for (const d of q.choices) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'aj-dino-choice';
    b.dataset.ch = d.ch;
    b.style.setProperty('--c', colourFor(d.ch));
    b.setAttribute('aria-label', d.name);
    b.innerHTML = '<i aria-hidden="true"></i><b aria-hidden="true"></b>';
    setPic(b.querySelector('i'), d.pic);
    b.querySelector('b').textContent = d.ch;
    row.appendChild(b);
  }
  st.appendChild(row);
  wanted = null;
  clearHints();
  markWanted();
  play('whoosh');
  say(vid.dinoWhere(q.want.id));
}

function matchPress(c) {
  const r = match.press(c);
  if (r.kind === 'wrong') {
    play('oops');
    showHint(r.hint, r.want);
    for (const b of document.querySelectorAll(`.aj-dino-choice[data-ch="${c}"]`)) bump(b, 'aj-wobble');
    
    if (r.hint === 'bounce' || r.hint === 'point') later(() => { play('hint'); say(vid.dinoWhere(r.dino)); }, 250);
    return;
  }
  if (r.kind !== 'right') return;
  clearHints();
  busy = true;
  play(r.note);
  const pick = document.querySelector(`.aj-dino-choice[data-ch="${r.letter}"]`);
  for (const b of document.querySelectorAll('.aj-dino-choice')) if (b !== pick) b.classList.add('is-out');
  if (pick) { pick.classList.add('is-right', 'aj-dance'); stars(8, pick); }
  confetti(40);
  say(vid.dinoYes(r.dino));
  progress.found += 1;
  save();
  if (r.roundDone) {
    later(() => party(FIXED.matchDone), TIMING.wordGapMs);
    later(() => { busy = false; goHome(); }, TIMING.wordGapMs + TIMING.partyMs + 600);
    return;
  }
  later(() => { busy = false; showMatch(); }, TIMING.wordGapMs);
}










let tower = null;
let towerRun = null;
let towerU = 64; 
let towerBodies = []; 
let towerRaf = 0;
const BOOM = ['#ff4f6d', '#ff8c1a', '#f5b700', '#ffd166'];
const TOWER_X0 = -1.5; 
const TOWER_SPAN = CORE_SPAN + 3; 
const TOWER_BELOW = 1.2; 

function startTower({ restart = false } = {}) {
  leaveMode();
  mode = 'tower';
  towerRun = towerRun || createRun(store);
  if (restart) towerRun.restart();
  tower = createTower(towerRun.level);
  towerBodies = [];
  trackEvent?.('game_start', { game: GAME_ID, level: `tower-${towerRun.level}` });
  show('play');
  layoutInput();
  buildKeyboard();
  renderTower({ enter: true });
  play('whoosh');
}

function towerHud() {
  const hud = document.createElement('div');
  hud.className = 'aj-tower-hud';
  hud.innerHTML = '<b class="aj-tower-level"></b><span class="aj-tower-points"></span><span class="aj-tower-best"></span>'
    + '<button class="aj-tower-again" type="button"></button>';
  hud.querySelector('.aj-tower-level').textContent = fill(T.towerLevel, { n: towerRun.level });
  hud.querySelector('.aj-tower-points').textContent = fill(T.towerPoints, { n: towerRun.points });
  hud.querySelector('.aj-tower-best').textContent = fill(T.towerBest, { n: towerRun.best });
  const again = hud.querySelector('.aj-tower-again');
  again.textContent = T.towerAgain;
  again.addEventListener('click', () => { unlockVoice(); play('tap'); startTower({ restart: true }); });
  return hud;
}


const towerPos = (x, y) => ({ left: (x - TOWER_X0) * towerU, bottom: y * towerU });

function towerCubeFace(el, c) {
  if (c.kind === 'bomb') {
    el.setAttribute('aria-label', T.towerBomb);
    el.innerHTML = '<i aria-hidden="true"></i>';
    setPic(el.querySelector('i'), 'bomb');
    return;
  }
  el.dataset.ch = c.ch;
  el.style.setProperty('--c', colourFor(c.ch));
  el.setAttribute('aria-label', c.kind === 'dino' ? DINO[c.id].name : c.ch);
  el.innerHTML = '<b aria-hidden="true"></b><i aria-hidden="true"></i>';
  el.querySelector('b').textContent = c.ch;
  setPic(el.querySelector('i'), c.kind === 'dino' ? DINO[c.id].pic : LETTER[c.ch].pic);
}

function towerBlock(c, i, floorNo) {
  const b = document.createElement('button');
  b.type = 'button';
  const live = floorNo === tower.floorIndex && !c.gone;
  b.className = `aj-tblock is-${c.kind} on-${c.side}` + (c.gone ? ' is-gone' : '') + (live ? ' is-live' : '');
  b.dataset.i = String(i);
  b.dataset.floor = String(floorNo);
  if (!live) b.tabIndex = -1;
  const p = towerPos(c.x, c.y);
  b.style.left = `${p.left}px`;
  b.style.bottom = `${p.bottom}px`;
  towerCubeFace(b, c);
  return b;
}


const towerCam = () => Math.max(-0.6, Math.min(tower.floorIndex, tower.floors.length - 1) * FLOOR_H - TOWER_BELOW);

function towerCamera({ instant = false } = {}) {
  const world = document.querySelector('.aj-tworld');
  const sky = document.querySelector('.aj-tsky');
  if (!world) return;
  const cam = towerCam();
  world.classList.toggle('no-move', instant || reduceMotion);
  sky?.classList.toggle('no-move', instant || reduceMotion);
  world.style.transform = `translateY(${cam * towerU}px)`;
  
  if (sky) sky.style.transform = `translateY(${(cam * towerU) / 3}px)`;
}

function renderTower({ enter = false } = {}) {
  renderProgress([], 0);
  const st = $('stage');
  st.className = 'aj-stage aj-stage-tower' + (tower.kind === 'dinos' ? ' is-dinos' : '');
  st.innerHTML = '';
  st.appendChild(towerHud());
  const view = document.createElement('div');
  view.className = 'aj-tview' + (enter ? ' aj-enter' : '');
  st.appendChild(view);
  
  const r = { width: view.offsetWidth, height: view.offsetHeight };
  
  towerU = Math.max(40, Math.floor(Math.min(r.width / TOWER_SPAN, r.height / (FLOOR_H + TOWER_BELOW + 0.8), 120)));
  view.style.setProperty('--u', `${towerU}px`);
  const sky = document.createElement('div');
  sky.className = 'aj-tsky';
  sky.style.height = `${(tower.height / 3 + FLOOR_H * 2) * towerU + r.height}px`;
  view.appendChild(sky);
  const world = document.createElement('div');
  world.className = 'aj-tworld';
  world.style.width = `${TOWER_SPAN * towerU}px`;
  const ground = document.createElement('div');
  ground.className = 'aj-tground';
  world.appendChild(ground);
  
  for (let y = 0; y < tower.height; y++) {
    for (let x = tower.core[y].x0; x < tower.core[y].x1; x++) {
      const c = document.createElement('span');
      c.className = 'aj-tcore';
      const p = towerPos(x, y);
      c.style.left = `${p.left}px`;
      c.style.bottom = `${p.bottom}px`;
      world.appendChild(c);
    }
  }
  const top = document.createElement('span');
  top.className = 'aj-ttop';
  const crown = tower.core[tower.height - 1];
  const tp = towerPos((crown.x0 + crown.x1) / 2 - 0.5, tower.height);
  top.style.left = `${tp.left}px`;
  top.style.bottom = `${tp.bottom}px`;
  setPic(top, 'star');
  world.appendChild(top);
  tower.floors.forEach((fl, f) => fl.forEach((c, i) => { if (!c.gone) world.appendChild(towerBlock(c, i, f)); }));
  for (const t of towerBodies) world.appendChild(t.el); 
  view.appendChild(world);
  towerCamera({ instant: true });
  wanted = null;
  clearHints();
  markWanted();
}


function towerLive() {
  for (const b of document.querySelectorAll('.aj-tblock')) {
    const live = Number(b.dataset.floor) === tower.floorIndex && !b.classList.contains('is-gone');
    b.classList.toggle('is-live', live);
    b.tabIndex = live ? 0 : -1;
  }
}


function towerDrop(el, c) {
  if (!el) return;
  el.classList.add('is-gone');
  el.tabIndex = -1;
  if (reduceMotion) return;
  const world = document.querySelector('.aj-tworld');
  if (!world) return;
  const f = document.createElement('span');
  f.className = `aj-tblock aj-tfall is-${c.kind}`;
  towerCubeFace(f, c);
  f.removeAttribute('aria-label');
  f.setAttribute('aria-hidden', 'true');
  world.appendChild(f);
  const away = c.side === 'left' ? -1 : c.side === 'right' ? 1 : (c.x + 0.5 < (tower.core[Math.floor(c.y)].x0 + tower.core[Math.floor(c.y)].x1) / 2 ? -1 : 1);
  const body = loose(c.x + 0.5, c.y + 0.5, { away, front: c.side === 'front' });
  towerBodies.push({ body, el: f });
  towerDraw();
  if (!towerRaf) {
    let last = performance.now();
    const tick = (now) => {
      if (mode !== 'tower') { towerRaf = 0; return; }
      step(towerBodies.map((t) => t.body), Math.min(0.05, (now - last) / 1000), {
        core: towerRects(),
        walls: { x0: TOWER_X0, x1: TOWER_X0 + TOWER_SPAN },
      });
      last = now;
      towerDraw();
      towerRaf = towerBodies.some((t) => !t.body.rest) ? requestAnimationFrame(tick) : 0;
    };
    towerRaf = requestAnimationFrame(tick);
  }
}


const towerRects = () => tower.core.map((r, y) => ({ x0: r.x0, x1: r.x1, y0: y, y1: y + 1 }));

function towerDraw() {
  for (const { body, el } of towerBodies) {
    const p = towerPos(body.x - 0.5, body.y - 0.5);
    el.style.left = `${p.left}px`;
    el.style.bottom = `${p.bottom}px`;
    el.style.transform = `rotate(${-body.a}rad)`;
  }
}

function towerBoom(el) {
  const r = el?.getBoundingClientRect?.();
  const W = globalThis.innerWidth || 1;
  const H = globalThis.innerHeight || 1;
  const at = r ? { x: (r.left + r.width / 2) / W, y: (r.top + r.height / 2) / H } : { x: 0.5, y: 0.6 };
  for (let i = 0; i < (reduceMotion ? 6 : 28); i++) {
    const p = document.createElement('span');
    p.className = 'aj-confetti aj-spark';
    const ang = Math.random() * Math.PI * 2;
    const dist = 60 + Math.random() * 160;
    p.style.left = `${at.x * 100}%`;
    p.style.top = `${at.y * 100}%`;
    p.style.setProperty('--dx', `${Math.cos(ang) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(ang) * dist}px`);
    p.style.setProperty('--r', `${Math.random() * 360}deg`);
    p.style.background = BOOM[i % BOOM.length];
    fx.appendChild(p);
    setTimeout(() => p.remove(), 1800);
  }
  stars(6, el);
  if (!reduceMotion) bump($('stage'), 'aj-shake');
}

function towerPoints(n, el) {
  if (!n) return;
  towerRun.add(n);
  const p = document.querySelector('.aj-tower-points');
  if (p) { p.textContent = fill(T.towerPoints, { n: towerRun.points }); bump(p, 'aj-jump'); }
  const b = document.querySelector('.aj-tower-best');
  if (b) b.textContent = fill(T.towerBest, { n: towerRun.best });
  const r = el?.getBoundingClientRect?.();
  if (!r) return;
  const f = document.createElement('span');
  f.className = 'aj-plus';
  f.textContent = `+${n}`;
  f.style.left = `${r.left + r.width / 2}px`;
  f.style.top = `${r.top}px`;
  fx.appendChild(f);
  setTimeout(() => f.remove(), 1200);
}

const towerEl = (floor, i) => document.querySelector(`.aj-tblock[data-floor="${floor}"][data-i="${i}"]`);

function towerResult(r, el) {
  if (r.kind === 'ignored') return;
  if (r.kind === 'wrong') { onWrong(r); return; }
  if (r.kind === 'bomb') {
    
    
    play('boom');
    later(() => play('oops'), 450);
    later(() => { say(FIXED.towerOops); }, 1100);
    towerBoom(el);
    if (el) { el.classList.add('is-gone'); el.tabIndex = -1; }
    return; 
  }
  clearHints();
  play(sfxNoteFor(r.ch));
  play('knock'); 
  if (el) stars(5, el);
  towerPoints(r.points, el);
  towerDrop(el, tower.floors[r.floor][r.index]);
  if (r.block === 'dino') say(vid.dinoFor(r.id)); else say(vid.name(r.ch));
  if (!r.floorDone) return;
  busy = true;
  
  for (const j of r.fizzled || []) towerDrop(towerEl(r.floor, j), tower.floors[r.floor][j]);
  if (r.towerDone) {
    later(() => { play('word'); party(FIXED.towerDone); }, 700);
    later(() => document.querySelector('.aj-tview')?.classList.add('aj-fade'), 700 + TIMING.partyMs - 900);
    later(() => {
      towerRun.nextLevel();
      tower = createTower(towerRun.level);
      towerBodies = [];
      trackEvent?.('game_start', { game: GAME_ID, level: `tower-${towerRun.level}` });
      busy = false;
      renderTower({ enter: true });
      play('whoosh');
    }, 700 + TIMING.partyMs + 400);
    return;
  }
  
  later(() => { play('thud'); towerLive(); towerCamera(); }, 600);
  later(() => { busy = false; }, TIMING.letterGapMs);
}


globalThis.addEventListener?.('resize', () => {
  if (mode !== 'tower' || busy || !tower) return;
  renderTower();
  towerDraw();
});

function towerPress(c) {
  const r = tower.press(c);
  towerResult(r, r.kind === 'right' ? towerEl(r.floor, r.index) : null);
}

document.addEventListener('click', (e) => {
  const b = e.target.closest?.('.aj-tblock');
  if (!b || mode !== 'tower' || busy || !b.dataset.floor) return;
  const r = tower.tap(Number(b.dataset.i), Number(b.dataset.floor));
  if (r.kind !== 'ignored') flashKey(b.dataset.ch || '');
  towerResult(r, b);
});









const PZ_PICS = new URL('../assets/puzzles/abc-puzzles/svg/sticker/', import.meta.url);
const pzSrc = (p) => new URL(`${p.icon}.svg`, PZ_PICS).href;
const SVGNS = 'http://www.w3.org/2000/svg';
let pz = null; 
let pzSeq = 0; 

const svgEl = (tag, attrs = {}) => {
  const n = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
  return n;
};


function pieceArt(p, slot, { letter = true, big = false } = {}) {
  const s = pieceShape(p, slot);
  const g = svgEl('g', { class: 'aj-pz-art' });
  const cid = `pzc${++pzSeq}`;
  const clip = svgEl('clipPath', { id: cid });
  clip.appendChild(svgEl('path', { d: s.d }));
  g.appendChild(clip);
  const pic = svgEl('g', { 'clip-path': `url(#${cid})` });
  pic.appendChild(svgEl('image', { href: pzSrc(p), x: 0, y: 0, width: PIC_W, height: PIC_H, preserveAspectRatio: 'none' }));
  g.appendChild(pic);
  g.appendChild(svgEl('path', { d: s.d, class: 'aj-pz-rim' }));
  if (letter) {
    const ch = p.letters[slot];
    const size = Math.min(s.cell.w, s.cell.h) * (big ? 0.72 : 0.58); 
    const txt = svgEl('text', {
      x: s.cell.x + s.cell.w / 2, y: s.cell.y + s.cell.h / 2 + size * 0.36, 'font-size': size, class: 'aj-pz-letter', fill: colourFor(ch),
    });
    txt.textContent = ch;
    g.appendChild(txt);
  }
  return { g, shape: s };
}

function showPuzzles() {
  leaveMode();
  show('puzzles');
  const list = $('pz-list');
  list.innerHTML = '';
  const firstUndone = PUZZLES.find((p) => !progress.puzzles.includes(p.id));
  PUZZLES.forEach((p) => {
    const done = progress.puzzles.includes(p.id);
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'aj-pz-tile' + (done ? ' is-done' : '');
    b.style.setProperty('--c', colourFor(p.letters[0]));
    b.innerHTML = '<span class="aj-pz-thumb" aria-hidden="true"><img alt="" draggable="false"></span>'
      + '<span class="aj-pz-abc" aria-hidden="true"></span><span class="aj-pz-name"></span>';
    b.querySelector('img').src = pzSrc(p);
    const abc = b.querySelector('.aj-pz-abc');
    for (const ch of p.letters) {
      const l = document.createElement('b');
      l.textContent = ch;
      l.style.color = colourFor(ch);
      abc.appendChild(l);
    }
    b.querySelector('.aj-pz-name').textContent = T.puzzleNames[p.id];
    if (done) b.querySelector('.aj-pz-thumb').insertAdjacentHTML('beforeend', `<span class="aj-pz-star">${iconHtml('star')}</span>`);
    if (p === firstUndone && nextGoal(progress).go === 'puzzles') b.classList.add('aj-next');
    b.addEventListener('click', () => { unlockVoice(); play('tap'); startPuzzle(p.id); });
    list.appendChild(b);
  });
}

function startPuzzle(id) {
  leaveMode();
  mode = 'puzzle';
  pz = createPuzzle(id);
  trackEvent?.('game_start', { game: GAME_ID, level: `puzzle-${id}` });
  show('play');
  layoutInput();
  buildKeyboard();
  renderPuzzle();
  later(() => pzAsk(), 500);
}

function renderPuzzle() {
  const p = pz.puzzle;
  const st = $('stage');
  st.className = 'aj-stage aj-stage-puzzle';
  st.innerHTML = '';
  
  
  const board = svgEl('svg', { viewBox: `-1.5 -1.5 ${PIC_W + 3} ${PIC_H + 3}`, class: 'aj-pz-board', role: 'img', 'aria-label': T.puzzleNames[p.id] });
  board.appendChild(svgEl('rect', { x: -1.5, y: -1.5, width: PIC_W + 3, height: PIC_H + 3, rx: 4, class: 'aj-pz-frame' }));
  board.appendChild(svgEl('image', { href: pzSrc(p), x: 0, y: 0, width: PIC_W, height: PIC_H, preserveAspectRatio: 'none', class: 'aj-pz-ghost' }));
  const slots = svgEl('g', { class: 'aj-pz-slots' });
  p.letters.forEach((ch, slot) => {
    const s = pieceShape(p, slot);
    const g = svgEl('g', { class: 'aj-pz-slot', 'data-slot': slot });
    g.appendChild(svgEl('path', { d: s.d, class: 'aj-pz-hole' }));
    const size = Math.min(s.cell.w, s.cell.h) * 0.5;
    const t = svgEl('text', { x: s.cell.x + s.cell.w / 2, y: s.cell.y + s.cell.h / 2 + size * 0.36, 'font-size': size, class: 'aj-pz-faint' });
    t.textContent = ch;
    g.appendChild(t);
    slots.appendChild(g);
  });
  board.appendChild(slots);
  board.appendChild(svgEl('g', { class: 'aj-pz-placed' }));
  board.appendChild(svgEl('image', { href: pzSrc(p), x: 0, y: 0, width: PIC_W, height: PIC_H, preserveAspectRatio: 'none', class: 'aj-pz-whole' }));
  const wrap = document.createElement('div');
  wrap.className = 'aj-pz-boardwrap';
  wrap.appendChild(board);
  st.appendChild(wrap);
  
  
  const tray = document.createElement('div');
  tray.className = `aj-pz-tray aj-pz-n${p.letters.length}`;
  const order = p.letters.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  if (order.every((v, i) => v === i)) order.reverse(); 
  for (const slot of order) {
    const ch = p.letters[slot];
    const { g, shape } = pieceArt(p, slot, { big: true });
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'aj-pz-piece';
    b.dataset.ch = ch;
    b.dataset.slot = slot;
    b.setAttribute('aria-label', fill(T.puzzlePiece, { letter: ch }));
    const svg = svgEl('svg', { viewBox: `${shape.box.x} ${shape.box.y} ${shape.box.w} ${shape.box.h}`, 'aria-hidden': 'true' });
    svg.appendChild(g);
    b.appendChild(svg);
    b.style.setProperty('--tilt', `${(Math.random() * 10 - 5).toFixed(1)}deg`);
    tray.appendChild(b);
  }
  st.appendChild(tray);
  pzMarkNext();
}

function pzMarkNext() {
  const next = pz.next();
  renderProgress(pz.puzzle.letters, pz.placed().length);
  const at = pz.placed().length;
  for (const g of document.querySelectorAll('.aj-pz-slot')) g.classList.toggle('is-next', Number(g.dataset.slot) === at && !!next);
}

function pzAsk() {
  const next = pz?.next();
  if (!next) return;
  wanted = next;
  clearHints();
  markWanted();
  say(vid.find(next));
}

function puzzlePress(c, { dragged = null } = {}) {
  const r = pz.place(c);
  if (!r.ok) {
    if (r.done) return;
    onWrong({ hint: hintFor(r.misses), want: r.want });
    const tried = document.querySelector(`.aj-pz-piece[data-ch="${c}"]`);
    if (tried) bump(tried, 'aj-wobble');
    return;
  }
  clearHints();
  busy = true;
  wanted = null; markWanted();
  const p = pz.puzzle;
  const piece = document.querySelector(`.aj-pz-piece[data-slot="${r.slot}"]`);
  const board = document.querySelector('.aj-pz-board');
  const land = () => {
    if (mode !== 'puzzle' || !pz || pz.puzzle !== p) return; 
    piece?.classList.add('is-home');
    const { g } = pieceArt(p, r.slot);
    g.classList.add('aj-pz-click');
    board.querySelector('.aj-pz-placed').appendChild(g);
    board.querySelector(`.aj-pz-slot[data-slot="${r.slot}"]`)?.classList.add('is-filled');
    play(jamPress(r.ch).note);
    say(vid.name(r.ch));
    stars(5, board.querySelector(`.aj-pz-slot[data-slot="${r.slot}"]`));
    pzMarkNext();
    if (r.done) { pzFinish(); return; }
    later(() => { busy = false; pzAsk(); }, TIMING.letterGapMs);
  };
  if (dragged) { navigator.vibrate?.(18); pzFly(piece, board, r.slot, land, dragged); return; }
  play('whoosh');
  pzFly(piece, board, r.slot, land);
}






function pzFly(piece, board, slot, done, from = null) {
  if (!piece || !board || reduceMotion || !piece.animate) { piece?.style.removeProperty('transform'); done(); return; }
  const s = pieceShape(pz.puzzle, slot);
  piece.style.removeProperty('transform'); 
  const pr = piece.querySelector('svg').getBoundingClientRect();
  const br = board.getBoundingClientRect();
  const vb = board.viewBox.baseVal;
  const k = br.width / vb.width; 
  const tx = br.left + (s.box.x + s.box.w / 2 - vb.x) * k;
  const ty = br.top + (s.box.y + s.box.h / 2 - vb.y) * k;
  const dx = tx - (pr.left + pr.width / 2);
  const dy = ty - (pr.top + pr.height / 2);
  const scale = (s.box.w * k) / pr.width;
  piece.classList.add('is-flying');
  if (from) {
    const snap = piece.animate([
      { transform: from },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale * 1.08}) rotate(0deg)`, offset: 0.7 },
      { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(0deg)` },
    ], { duration: 240, easing: 'cubic-bezier(.2, .9, .3, 1)', fill: 'forwards' });
    snap.onfinish = done;
    return;
  }
  const anim = piece.animate([
    { transform: 'translate(0, 0) scale(1) rotate(var(--tilt, 0deg))' },
    { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) scale(${(1 + scale) / 2 * 1.15}) rotate(0deg)`, offset: 0.55 },
    { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(0deg)` },
  ], { duration: 650, easing: 'cubic-bezier(.3, .1, .3, 1)', fill: 'forwards' });
  anim.onfinish = done;
}








const DRAG_START = 10; 
const DRAG_LIFT = 1.15;
let pzDrag = null;
let pzDragEndedAt = -Infinity;


function pzBoardPoint(x, y) {
  const board = document.querySelector('.aj-pz-board');
  if (!board) return null;
  const br = board.getBoundingClientRect();
  const vb = board.viewBox.baseVal;
  const k = br.width / vb.width;
  return { x: vb.x + (x - br.left) / k, y: vb.y + (y - br.top) / k };
}


function pzSlotScreen(slot) {
  const board = document.querySelector('.aj-pz-board');
  const br = board.getBoundingClientRect();
  const vb = board.viewBox.baseVal;
  const k = br.width / vb.width;
  const c = pieceShape(pz.puzzle, slot).cell;
  return { x: br.left + (c.x + c.w / 2 - vb.x) * k, y: br.top + (c.y + c.h / 2 - vb.y) * k };
}


function pzWaitCue(c) {
  const piece = document.querySelector(`.aj-pz-piece:not(.is-home)[data-ch="${c}"]`);
  if (piece) bump(piece, 'aj-pz-wait');
}


function pzFloatBack(piece, then) {
  const from = piece.style.transform;
  piece.style.removeProperty('transform');
  piece.classList.remove('is-dragging');
  if (reduceMotion || !piece.animate || !from) { then?.(); return; }
  piece.classList.add('is-returning');
  const a = piece.animate([{ transform: from }, { transform: 'translate(0, 0) scale(1) rotate(var(--tilt, 0deg))' }],
    { duration: 420, easing: 'cubic-bezier(.3, 1.35, .5, 1)' });
  a.onfinish = () => { piece.classList.remove('is-returning'); then?.(); };
}

function pzDragClear() {
  for (const g of document.querySelectorAll('.aj-pz-slot')) { g.classList.remove('is-warm', 'is-snap'); g.style.removeProperty('--near'); }
  document.body.classList.remove('aj-pz-dragging');
}

document.addEventListener('pointerdown', (e) => {
  if (mode !== 'puzzle' || !pz || e.button > 0 || pzDrag) return;
  const piece = e.target.closest?.('.aj-pz-piece:not(.is-home):not(.is-flying)');
  if (!piece) return;
  const r = piece.getBoundingClientRect();
  
  
  
  const board = document.querySelector('.aj-pz-board');
  const sw = piece.querySelector('svg').getBoundingClientRect().width;
  const s = pieceShape(pz.puzzle, Number(piece.dataset.slot));
  const fit = board && sw ? (s.box.w * board.getBoundingClientRect().width / board.viewBox.baseVal.width) / sw : DRAG_LIFT;
  pzDrag = { piece, id: e.pointerId, x0: e.clientX, y0: e.clientY, cx: r.left + r.width / 2 - e.clientX, cy: r.top + r.height / 2 - e.clientY, on: false, snap: false, near: 0, fit };
});

document.addEventListener('pointermove', (e) => {
  const d = pzDrag;
  if (!d || e.pointerId !== d.id) return;
  const dx = e.clientX - d.x0;
  const dy = e.clientY - d.y0;
  if (!d.on) {
    if (Math.hypot(dx, dy) < DRAG_START) return;
    d.on = true;
    try { d.piece.setPointerCapture?.(e.pointerId); } catch {  }
    d.piece.classList.add('is-dragging');
    document.body.classList.add('aj-pz-dragging');
    clearHints();
    play('pop');
  }
  e.preventDefault();
  const slot = Number(d.piece.dataset.slot);
  const want = busy ? null : pz.placed().length;
  const centre = { x: e.clientX + d.cx, y: e.clientY + d.cy };
  const pt = pzBoardPoint(centre.x, centre.y);
  let mx = dx;
  let my = dy;
  const g = document.querySelector(`.aj-pz-slot[data-slot="${slot}"]`);
  if (slot === want && g) {
    const near = nearness(pz.puzzle, slot, pt);
    d.near = near;
    const snap = dropFor(pz.puzzle, slot, want, pt) === 'home';
    g.style.setProperty('--near', near.toFixed(2));
    g.classList.toggle('is-warm', near > 0.3);
    g.classList.toggle('is-snap', snap);
    if (snap) { 
      const s = pzSlotScreen(slot);
      mx += (s.x - centre.x) * 0.35;
      my += (s.y - centre.y) * 0.35;
    }
    if (snap && !d.snap) { play('tap'); navigator.vibrate?.(8); }
    d.snap = snap;
  } else d.near = 0;
  const k = DRAG_LIFT + (d.fit * 1.04 - DRAG_LIFT) * d.near; 
  d.piece.style.transform = `translate(${mx.toFixed(1)}px, ${my.toFixed(1)}px) scale(${k.toFixed(3)}) rotate(0deg)`;
});

function pzDragEnd(e, cancelled) {
  const d = pzDrag;
  if (!d || e.pointerId !== d.id) return;
  pzDrag = null;
  if (!d.on) return; 
  pzDragEndedAt = performance.now();
  pzDragClear();
  const slot = Number(d.piece.dataset.slot);
  const want = busy || !pz ? null : pz.placed().length;
  const pt = cancelled ? null : pzBoardPoint(e.clientX + d.cx, e.clientY + d.cy);
  const what = mode === 'puzzle' && pz ? dropFor(pz.puzzle, slot, want, pt) : 'back';
  if (what === 'home') {
    d.piece.classList.remove('is-dragging');
    puzzlePress(d.piece.dataset.ch, { dragged: d.piece.style.transform });
    return;
  }
  
  pzFloatBack(d.piece, what === 'wrong' ? () => { if (mode === 'puzzle' && !busy) puzzlePress(d.piece.dataset.ch); } : null);
  if (what === 'back' && busy) pzWaitCue(d.piece.dataset.ch);
}
document.addEventListener('pointerup', (e) => pzDragEnd(e, false));
document.addEventListener('pointercancel', (e) => pzDragEnd(e, true));

function pzFinish() {
  const p = pz.puzzle;
  const board = document.querySelector('.aj-pz-board');
  
  later(() => {
    board?.classList.add('is-done');
    document.querySelector('.aj-pz-tray')?.classList.add('is-done');
    play('word');
    stars(10, board);
  }, 700);
  
  later(() => party(vid.puzzleMade(p.id)), 1500);
  if (addSticker(progress, 'puzzle', p.id)) {
    save();
    later(() => { play('star'); stickerToast(T.puzzleNames[p.id], null, pzSrc(p)); }, 1500 + TIMING.partyMs);
  }
  later(() => { busy = false; showPuzzles(); }, 1500 + TIMING.partyMs + TIMING.wordGapMs);
}

function showStickers() {
  leaveMode();
  show('stickers');
  renderPrizes();
  const L = $('book-letters');
  L.innerHTML = '';
  for (const l of LETTERS) {
    const got = progress.letters.includes(l.ch);
    const s = document.createElement('button');
    s.type = 'button';
    s.className = 'aj-sticker' + (got ? ' is-got' : '');
    s.style.setProperty('--c', colourFor(l.ch));
    s.innerHTML = '<b></b><i aria-hidden="true"></i>';
    s.querySelector('b').textContent = l.ch;
    setPic(s.querySelector('i'), got ? l.pic : 'mystery');
    s.setAttribute('aria-label', got ? letterPhrase(l.ch) : fill(T.letterNotYet, { letter: l.ch }));
    s.addEventListener('click', () => {
      bump(s, 'aj-jump');
      if (got) { play(jamPress(l.ch).note); say(vid.phrase(l.ch)); } else play('tap');
    });
    L.appendChild(s);
  }
  const W = $('book-words');
  W.innerHTML = '';
  for (const step of WORD_STEPS) {
    for (const [w, pic] of step.words) {
      const got = progress.words.includes(w);
      const s = document.createElement('button');
      s.type = 'button';
      s.className = 'aj-sticker aj-sticker-word' + (got ? ' is-got' : '');
      s.style.setProperty('--c', colourFor(w[0]));
      s.innerHTML = '<i aria-hidden="true"></i><b></b>';
      setPic(s.querySelector('i'), got ? pic : 'mystery');
      s.querySelector('b').textContent = got ? w.toUpperCase() : '•'.repeat(w.length);
      s.setAttribute('aria-label', got ? w : T.wordNotYet);
      s.addEventListener('click', () => { bump(s, 'aj-jump'); if (got) { play('word'); say(vid.word(w)); } else play('tap'); });
      W.appendChild(s);
    }
  }
  const Dn = $('book-dinos');
  Dn.innerHTML = '';
  for (const d of DINOS) {
    const got = progress.dinos.includes(d.id);
    const s = document.createElement('button');
    s.type = 'button';
    s.className = 'aj-sticker aj-sticker-word' + (got ? ' is-got' : '');
    s.style.setProperty('--c', colourFor(d.ch));
    s.innerHTML = '<i aria-hidden="true"></i><b></b>';
    setPic(s.querySelector('i'), got ? d.pic : 'dino_egg');
    s.querySelector('b').textContent = got ? d.name : d.ch;
    s.setAttribute('aria-label', got ? d.name : T.wordNotYet);
    s.addEventListener('click', () => { bump(s, 'aj-jump'); if (got) { play('word'); say(vid.dinoHello(d.id)); } else play('tap'); });
    Dn.appendChild(s);
  }
  const Pz = $('book-puzzles');
  Pz.innerHTML = '';
  for (const p of PUZZLES) {
    const got = progress.puzzles.includes(p.id);
    const s = document.createElement('button');
    s.type = 'button';
    s.className = 'aj-sticker aj-sticker-word aj-sticker-puzzle' + (got ? ' is-got' : '');
    s.style.setProperty('--c', colourFor(p.letters[0]));
    s.innerHTML = '<i aria-hidden="true"></i><b></b>';
    if (got) s.querySelector('i').innerHTML = '<img class="aj-ic aj-pz-sticker" alt="" draggable="false">';
    else setPic(s.querySelector('i'), 'mystery');
    if (got) s.querySelector('img').src = pzSrc(p);
    s.querySelector('b').textContent = got ? T.puzzleNames[p.id] : `${p.letters[0]}-${p.letters[p.letters.length - 1]}`;
    s.setAttribute('aria-label', got ? T.puzzleNames[p.id] : T.wordNotYet);
    s.addEventListener('click', () => { bump(s, 'aj-jump'); if (got) { play('word'); say(FIXED.hooray); } else play('tap'); });
    Pz.appendChild(s);
  }
  const total = progress.letters.length + progress.words.length + progress.dinos.length + progress.puzzles.length;
  $('book-count').innerHTML = `${iconHtml('star')} ${total}  ·  ${iconHtml('balloon')} ${progress.pops}`;
  say(countId(total));
}




function prizeLabel(z) {
  if (z.id === 'alphabet') return T.prizeAlphabet;
  if (z.id === 'book') return T.prizeBook;
  if (z.id === 'dinos') return T.prizeDinos;
  if (z.id === 'puzzles') return T.prizePuzzles;
  if (z.id === 'dinos-found') return fill(T.prizeFound, { n: z.n });
  if (z.size) return fill(T.stepWords, { n: z.size });
  return fill(T.prizeBalloons, { n: z.n });
}

function renderHub() {
  const m = meters(progress);
  const goal = nextGoal(progress);
  const total = { parade: LETTERS.length, words: WORD_STEPS.reduce((n, s) => n + s.words.length, 0), eggs: DINOS.length, match: FOUND_PRIZE, puzzles: PUZZLES.length };
  const got = { parade: progress.letters.length, words: progress.words.length, eggs: progress.dinos.length, match: progress.found, puzzles: progress.puzzles.length };
  const targets = {
    parade: $('start'),
    jam: document.querySelector('.aj-tile[data-go="jam"]'),
    words: document.querySelector('.aj-tile[data-go="words"]'),
    rain: document.querySelector('.aj-tile[data-go="rain"]'),
    stickers: document.querySelector('.aj-tile[data-go="stickers"]'),
    eggs: document.querySelector('.aj-tile[data-go="eggs"]'),
    match: document.querySelector('.aj-tile[data-go="match"]'),
    puzzles: document.querySelector('.aj-tile[data-go="puzzles"]'),
  };
  for (const [k, el] of Object.entries(targets)) {
    if (!el) continue;
    el.classList.toggle('aj-next', goal.go === k);
    if (!(k in m)) continue;
    let bar = el.querySelector('.aj-meter');
    if (!bar) {
      bar = document.createElement('span');
      bar.className = 'aj-meter';
      bar.innerHTML = '<i></i>';
      el.appendChild(bar);
    }
    bar.querySelector('i').style.width = `${Math.round(m[k] * 100)}%`;
    bar.classList.toggle('is-full', m[k] >= 1);
    
    if (k in total) { bar.setAttribute('role', 'img'); bar.setAttribute('aria-label', fill(T.progressOf, { n: got[k], total: total[k] })); } else bar.setAttribute('aria-hidden', 'true');
  }
}

function renderPrizes() {
  const P = $('book-prizes');
  if (!P) return;
  P.innerHTML = '';
  const have = new Set(prizesFor(progress));
  PRIZES.forEach((z, i) => {
    const got = have.has(z.id);
    const s = document.createElement('button');
    s.type = 'button';
    s.className = 'aj-sticker aj-sticker-prize' + (got ? ' is-got' : '');
    s.style.setProperty('--c', ['#f5b700', '#ff8c1a', '#00a6ed', '#7b5cff', '#ff4f6d', '#38b000', '#e040fb', '#ff5e8a'][i % 8]);
    s.innerHTML = '<i aria-hidden="true"></i>';
    setPic(s.querySelector('i'), z.pic);
    s.setAttribute('aria-label', got ? prizeLabel(z) : T.wordNotYet);
    s.addEventListener('click', () => { bump(s, 'aj-jump'); if (got) { play('star'); say(FIXED.hooray); } else play('tap'); });
    P.appendChild(s);
  });
}




function checkPrizes() {
  const fresh = newPrizes(prizesHad, progress);
  prizesHad = prizesFor(progress);
  fresh.forEach((id, i) => {
    const z = PRIZES.find((x) => x.id === id);
    const celebrate = (tries = 0) => {
      const busyNow = document.body.classList.contains('aj-finale') || document.body.classList.contains('aj-partying');
      if (busyNow && tries < 15) { setTimeout(() => celebrate(tries + 1), 1000); return; }
      play('party');
      confetti(80, { x: 0.5, y: 0.35 });
      stickerToast(T.prizeWon, z.pic);
      voice.sayNext(FIXED.hooray);
      if (document.body.dataset.screen === 'hub') renderHub();
    };
    setTimeout(celebrate, 2500 + i * 3000);
  });
}




const unlockVoice = () => { try { voice.unlock(silentWavDataUrl()); } catch {  } };
$('start').addEventListener('click', () => { unlockVoice(); play('tap'); startParade(); });
for (const t of document.querySelectorAll('.aj-tile')) {
  t.addEventListener('click', () => {
    unlockVoice();
    play('tap');
    const go = t.dataset.go;
    if (go === 'jam') startJam();
    else if (go === 'words') showSteps();
    else if (go === 'rain') startRain();
    else if (go === 'stickers') showStickers();
    else if (go === 'eggs') startEggs();
    else if (go === 'match') startMatch();
    else if (go === 'tower') startTower();
    else if (go === 'puzzles') showPuzzles();
  });
}


const resetConfirm = createResetConfirm({ windowMs: 4000 });
let resetTimer = 0;
const resetBtn = $('reset');
resetBtn.textContent = T.resetAsk;
resetBtn.addEventListener('click', () => {
  clearTimeout(resetTimer);
  if (resetConfirm.press() === 'ask') {
    play('hint');
    resetBtn.textContent = T.resetSure;
    resetBtn.classList.add('is-sure');
    resetTimer = setTimeout(() => {
      resetConfirm.cancel();
      resetBtn.textContent = T.resetAsk;
      resetBtn.classList.remove('is-sure');
    }, 4000);
    return;
  }
  progress = resetProgress(store);
  prizesHad = prizesFor(progress);
  resetBtn.textContent = T.resetAsk;
  resetBtn.classList.remove('is-sure');
  play('whoosh');
  showStickers();
});
$('home').addEventListener('click', () => goHome());
for (const h of document.querySelectorAll('[data-home]')) h.addEventListener('click', () => goHome());
$('say-again').addEventListener('click', () => { unlockVoice(); play('tap'); if (voice.last) say(voice.last); });
$('kb-toggle').addEventListener('click', () => {
  kbLayout = kbLayout === 'abc' ? 'qwerty' : 'abc';
  try { store?.setItem('abcjam-kb', kbLayout); } catch {  }
  play('tap');
  buildKeyboard();
});

function showVoice() {
  for (const b of document.querySelectorAll('[data-voice]')) b.setAttribute('aria-pressed', String(b.dataset.voice === voiceName));
}
for (const b of document.querySelectorAll('[data-voice]')) {
  b.addEventListener('click', () => {
    voiceName = pickVoice(b.dataset.voice);
    try { store?.setItem(VOICE_KEY, voiceName); } catch {  }
    voice = voiceFor(voiceName);
    showVoice();
    unlockVoice();
    play('tap');
    say(FIXED.hooray); 
  });
}
showVoice();

if (HAS_MUSIC) {
  $('music-btn').hidden = false;
  
  
  
  const musicDefaultOn = Object.create(music);
  musicDefaultOn.wasOn = () => {
    try { return globalThis.localStorage?.getItem(MUSIC_KEY) !== 'off'; } catch { return true; }
  };
  wireMusicButton({ music: musicDefaultOn });
}


globalThis.__abcJam = { get mode() { return mode; }, get busy() { return busy; }, get wanted() { return wanted; }, PARTY_AFTER };

goHome({ quiet: true });
bootDone();
