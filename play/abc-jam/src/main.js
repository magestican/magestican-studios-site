










import { LETTERS, LETTER, WORD_STEPS, DINOS, DINO, letterPhrase, colourFor } from './content.js';
import {
  TIMING, createParade, jamPress, pickRound, createSpeller, createRain,
  loadProgress, saveProgress, addSticker, PARTY_AFTER, createResetConfirm, resetProgress,
  PRIZES, prizesFor, newPrizes, nextGoal, meters, createDinoEggs, createDinoMatch, FOUND_PRIZE,
} from './rules.js';
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
import { createTower, createRun } from './tower.js';
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




const voice = createVoice({
  baseUrl: new URL('../assets/voice/', import.meta.url),
  
  version: new URL(import.meta.url).searchParams.get('v') || '',
  muted: () => !uiSoundOn() || gameMuted(),
  onLine: (ms) => music.duck?.(0.3, ms + 300),
});
const say = (lineId) => voice.say(lineId);
voice.prefetch(LETTERS.map((l) => vid.phrase(l.ch)));
voice.prefetch(DINOS.map((d) => vid.dinoFor(d.id)));


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

function stickerToast(label, id = 'balloon') {
  const t = document.createElement('div');
  t.className = 'aj-toast';
  t.innerHTML = `<span aria-hidden="true">${iconHtml('star')}</span>${iconHtml(id)}<b></b>`;
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
  return document.querySelectorAll(`#kb .aj-key[data-ch="${ch}"], #bubbles .aj-bubble[data-ch="${ch}"], .aj-dino-choice[data-ch="${ch}"], .aj-trow.is-bottom .aj-tblock[data-ch="${ch}"]`);
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
  
  const useBubbles = narrow && mode !== 'rain' && mode !== 'match' && mode !== 'tower';
  $('bubbles').hidden = !useBubbles || !mode;
  $('kb').hidden = narrow || !mode;
  $('kb-toggle').hidden = narrow || !mode;
  document.body.classList.toggle('aj-narrow', narrow);
}
narrowMq?.addEventListener?.('change', () => { layoutInput(); if (mode === 'jam') setChoices(jamChoices()); });

function flashKey(ch) {
  for (const k of inputKeys(ch)) bump(k, 'is-hit');
}


function press(ch) {
  if (!mode || busy) return;
  const c = String(ch).toUpperCase();
  if (!/^[A-Z]$/.test(c)) return;
  flashKey(c);
  ({ parade: paradePress, jam: jamPressed, words: wordPress, rain: rainPress, eggs: eggsPress, match: matchPress, tower: towerPress })[mode]?.(c);
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Escape' && mode) { e.preventDefault(); goHome(); return; }
  if (e.repeat) return;
  if (/^[a-z]$/i.test(e.key) && mode) { e.preventDefault(); press(e.key); }
});
document.addEventListener('click', (e) => {
  const k = e.target.closest?.('.aj-key, .aj-bubble, .aj-balloon, .aj-dino-choice');
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
const TOWER_SHOW_ROWS = 5; 
const BOOM = ['#ff4f6d', '#ff8c1a', '#f5b700', '#ffd166'];

function startTower({ restart = false } = {}) {
  leaveMode();
  mode = 'tower';
  towerRun = towerRun || createRun(store);
  if (restart) towerRun.restart();
  tower = createTower(towerRun.level);
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

function towerBlock(c, i, rowNo, isBottom) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `aj-tblock is-${c.kind}` + (c.gone ? ' is-gone' : '') + (isBottom ? ' is-bottom' : '');
  b.dataset.i = String(i);
  b.dataset.row = String(rowNo);
  if (!isBottom || c.gone) b.tabIndex = -1;
  if (c.kind === 'bomb') {
    b.setAttribute('aria-label', T.towerBomb);
    b.innerHTML = '<i aria-hidden="true"></i>';
    setPic(b.querySelector('i'), 'bomb');
  } else {
    b.dataset.ch = c.ch;
    b.style.setProperty('--c', colourFor(c.ch));
    b.setAttribute('aria-label', c.kind === 'dino' ? DINO[c.id].name : c.ch);
    b.innerHTML = '<b aria-hidden="true"></b><i aria-hidden="true"></i>';
    b.querySelector('b').textContent = c.ch;
    setPic(b.querySelector('i'), c.kind === 'dino' ? DINO[c.id].pic : LETTER[c.ch].pic);
  }
  return b;
}

function renderTower({ enter = false, settle = false } = {}) {
  renderProgress([], 0);
  const st = $('stage');
  st.className = 'aj-stage aj-stage-tower' + (tower.kind === 'dinos' ? ' is-dinos' : '');
  st.innerHTML = '';
  st.appendChild(towerHud());
  const col = document.createElement('div');
  col.className = 'aj-tower' + (enter ? ' aj-enter' : '') + (settle ? ' aj-settle' : '');
  const from = tower.rowIndex;
  const to = Math.min(tower.rows.length, from + TOWER_SHOW_ROWS);
  
  for (let r = from; r < to; r++) {
    const row = document.createElement('div');
    row.className = 'aj-trow' + (r === from ? ' is-bottom' : '');
    tower.rows[r].forEach((c, i) => row.appendChild(towerBlock(c, i, r, r === from)));
    col.appendChild(row);
  }
  st.appendChild(col);
  wanted = null;
  clearHints();
  markWanted();
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

function towerResult(r, el) {
  if (r.kind === 'ignored') return;
  if (r.kind === 'wrong') { onWrong(r); return; }
  if (r.kind === 'bomb') {
    
    
    play('boom');
    later(() => play('oops'), 450);
    if (el) { el.classList.add('is-gone', 'aj-boom'); el.tabIndex = -1; }
    towerBoom(el);
    return; 
  }
  clearHints();
  play(sfxNoteFor(r.ch));
  play('knock'); 
  if (el) { el.classList.add('is-gone', 'aj-pop'); el.tabIndex = -1; stars(5, el); }
  if (r.block === 'dino') say(vid.dinoFor(r.id)); else say(vid.name(r.ch));
  towerPoints(r.points, el);
  if (!r.rowDone) return;
  busy = true;
  for (const j of r.fizzled || []) document.querySelector(`.aj-trow.is-bottom .aj-tblock[data-i="${j}"]`)?.classList.add('is-gone', 'aj-fizzle');
  if (r.towerDone) {
    later(() => { play('word'); party(FIXED.hooray); }, 700);
    later(() => document.querySelector('.aj-tower')?.classList.add('aj-fade'), 700 + TIMING.partyMs - 900);
    later(() => {
      towerRun.nextLevel();
      tower = createTower(towerRun.level);
      trackEvent?.('game_start', { game: GAME_ID, level: `tower-${towerRun.level}` });
      busy = false;
      renderTower({ enter: true });
      play('whoosh');
    }, 700 + TIMING.partyMs + 400);
    return;
  }
  
  later(() => { play('thud'); renderTower({ settle: true }); }, 600);
  later(() => { busy = false; }, TIMING.letterGapMs);
}

function towerPress(c) {
  const r = tower.press(c);
  towerResult(r, r.kind === 'right' ? document.querySelector(`.aj-trow.is-bottom .aj-tblock[data-i="${r.index}"]`) : null);
}

document.addEventListener('click', (e) => {
  const b = e.target.closest?.('.aj-tblock');
  if (!b || mode !== 'tower' || busy) return;
  const r = tower.tap(Number(b.dataset.i), Number(b.dataset.row));
  if (r.kind !== 'ignored') flashKey(b.dataset.ch || '');
  towerResult(r, b);
});


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
  const total = progress.letters.length + progress.words.length + progress.dinos.length;
  $('book-count').innerHTML = `${iconHtml('star')} ${total}  ·  ${iconHtml('balloon')} ${progress.pops}`;
  say(countId(total));
}




function prizeLabel(z) {
  if (z.id === 'alphabet') return T.prizeAlphabet;
  if (z.id === 'book') return T.prizeBook;
  if (z.id === 'dinos') return T.prizeDinos;
  if (z.id === 'dinos-found') return fill(T.prizeFound, { n: z.n });
  if (z.size) return fill(T.stepWords, { n: z.size });
  return fill(T.prizeBalloons, { n: z.n });
}

function renderHub() {
  const m = meters(progress);
  const goal = nextGoal(progress);
  const total = { parade: LETTERS.length, words: WORD_STEPS.reduce((n, s) => n + s.words.length, 0), eggs: DINOS.length, match: FOUND_PRIZE };
  const got = { parade: progress.letters.length, words: progress.words.length, eggs: progress.dinos.length, match: progress.found };
  const targets = {
    parade: $('start'),
    jam: document.querySelector('.aj-tile[data-go="jam"]'),
    words: document.querySelector('.aj-tile[data-go="words"]'),
    rain: document.querySelector('.aj-tile[data-go="rain"]'),
    stickers: document.querySelector('.aj-tile[data-go="stickers"]'),
    eggs: document.querySelector('.aj-tile[data-go="eggs"]'),
    match: document.querySelector('.aj-tile[data-go="match"]'),
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
