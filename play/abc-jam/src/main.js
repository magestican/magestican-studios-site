










import { LETTERS, LETTER, WORD_STEPS, letterPhrase, colourFor } from './content.js';
import {
  TIMING, createParade, jamPress, pickRound, createSpeller, createRain,
  loadProgress, saveProgress, addSticker, PARTY_AFTER,
} from './rules.js';
import { SFX_NAMES } from './sfx.js';
import { createGameSfx } from '../../shared/audio/gameSfx.js';
import { createTrackMusic } from '../../shared/audio/trackMusic.js';
import { wireMusicButton } from '../../shared/ui/musicButton.js';
import { bootDone } from '../../shared/ui/fitScreen.js';
import { initAnalytics, trackEvent } from '../../../web-engine/visits/visits.js';

const GAME_ID = 'abc-jam';



const HAS_MUSIC = true;
const music = createTrackMusic({
  game: GAME_ID, trackIds: ['main'],
  manifestUrl: new URL('../assets/music/music.json', import.meta.url),
});

const $ = (id) => document.getElementById(id);
const store = (() => { try { return globalThis.localStorage; } catch { return null; } })();
const sfx = createGameSfx(new URL('../assets/sfx/', import.meta.url), SFX_NAMES);
const play = (name) => { try { sfx.play(name); } catch {  } };

try { initAnalytics({ page: GAME_ID }); } catch {  }

let progress = loadProgress(store);
const save = () => saveProgress(store, progress);


const synth = globalThis.speechSynthesis || null;
let voice = null;
function pickVoice() {
  if (!synth) return;
  const all = synth.getVoices() || [];
  const en = all.filter((v) => /^en(-|_|$)/i.test(v.lang));
  
  voice = en.find((v) => /female|samantha|zira|aria|jenny|google us english|karen|moira/i.test(v.name))
    || en.find((v) => v.localService) || en[0] || null;
}
pickVoice();
try { synth?.addEventListener?.('voiceschanged', pickVoice); } catch {  }

let lastSaid = '';
function say(text, { interrupt = true } = {}) {
  if (!synth || !text) return;
  lastSaid = text;
  try {
    if (interrupt) synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85;
    u.pitch = 1.2;
    u.lang = 'en-US';
    if (voice) u.voice = voice;
    
    music.duck?.(0.32, 1200);
    synth.speak(u);
  } catch {  }
}
const sayName = (ch) => LETTER[ch]?.say || ch;


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
    s.textContent = i % 2 ? '⭐' : '✨';
    const ang = (i / n) * Math.PI * 2;
    s.style.left = `${x * 100}%`;
    s.style.top = `${y * 100}%`;
    s.style.setProperty('--dx', `${Math.cos(ang) * 110}px`);
    s.style.setProperty('--dy', `${Math.sin(ang) * 110}px`);
    fx.appendChild(s);
    setTimeout(() => s.remove(), 1100);
  }
}

function stickerToast(label) {
  const t = document.createElement('div');
  t.className = 'aj-toast';
  t.innerHTML = `<span aria-hidden="true">🌟</span><b></b>`;
  t.querySelector('b').textContent = label;
  fx.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

function party(text = 'Hooray!') {
  play('party');
  confetti(90, { x: 0.5, y: 0.3 });
  later(() => confetti(60, { x: 0.25, y: 0.5 }), 400);
  later(() => confetti(60, { x: 0.75, y: 0.5 }), 800);
  document.body.classList.add('aj-partying');
  later(() => document.body.classList.remove('aj-partying'), TIMING.partyMs);
  say(text);
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
  $('kb-toggle').textContent = kbLayout === 'qwerty' ? 'ABC' : 'QWERTY';
  $('kb-toggle').setAttribute('aria-label', kbLayout === 'qwerty' ? 'Keys in ABC order' : 'Keys like a real keyboard');
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
  return document.querySelectorAll(`#kb .aj-key[data-ch="${ch}"], #bubbles .aj-bubble[data-ch="${ch}"]`);
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
  const useBubbles = narrow && mode !== 'rain';
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
  ({ parade: paradePress, jam: jamPressed, words: wordPress, rain: rainPress })[mode]?.(c);
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key === 'Escape' && mode) { e.preventDefault(); goHome(); return; }
  if (e.repeat) return;
  if (/^[a-z]$/i.test(e.key) && mode) { e.preventDefault(); press(e.key); }
});
document.addEventListener('click', (e) => {
  const k = e.target.closest?.('.aj-key, .aj-bubble, .aj-balloon');
  if (k?.dataset.ch) press(k.dataset.ch);
});


function renderProgress(items, at) {
  const p = $('progress');
  p.innerHTML = '';
  items.forEach((label, i) => {
    const d = document.createElement('span');
    d.className = 'aj-dot' + (i < at ? ' is-done' : '') + (i === at ? ' is-now' : '');
    d.textContent = label;
    if (i < at) d.style.setProperty('--c', colourFor(String(label)[0] || 'A'));
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
  card.querySelector('.aj-pic').textContent = l.pic;
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
  say(`${sayName(l.ch)}! ${letterPhrase(l.ch)}.`);
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
  say(sayName(r.letter));
  if (addSticker(progress, 'letter', r.sticker)) later(() => { play('star'); stickerToast(r.letter); }, 450);
  progress.furthest = r.finished ? 0 : parade.index;
  save();
  if (r.finished) { later(paradeFinale, 700); return; }
  const gap = r.party ? TIMING.partyMs : TIMING.letterGapMs;
  if (r.party) later(() => party(`Hooray! ${sayName(r.letter)}! You did it!`), 500);
  later(() => { busy = false; showParadeLetter(); }, gap + (r.party ? 500 : 0));
}


function paradeFinale() {
  const st = $('stage');
  st.className = 'aj-stage aj-stage-finale';
  st.innerHTML = '<div class="aj-march"></div><div class="aj-finale-pic" aria-hidden="true">🏆</div>';
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
  later(() => party('Hooray! You sang the whole alphabet!'), LETTERS.length * 280);
  later(() => { busy = false; goHome(); }, LETTERS.length * 280 + TIMING.partyMs + 1200);
}
const sfxNoteFor = (ch) => jamPress(ch).note;


function onWrong(r) {
  play('oops');
  showHint(r.hint, r.want);
  bump(document.querySelector('.aj-card, .aj-slots'), 'aj-wobble');
  if (r.hint === 'bounce' || r.hint === 'point') {
    later(() => { play('hint'); say(`Find ${sayName(r.want)}!`); }, 250);
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
  $('progress').innerHTML = '<span class="aj-jam-label" aria-hidden="true">🎹 🎵 🎶</span>';
  const st = $('stage');
  st.className = 'aj-stage aj-stage-jam';
  st.innerHTML = '<div class="aj-jam-hint" aria-hidden="true">👆 ⌨️</div>';
  say('Free jam! Press any letter!');
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
  el.querySelector('i').textContent = l.pic;
  st.appendChild(el);
  stars(5, el);
  
  const all = st.querySelectorAll('.aj-jam-letter');
  const live = [...all].filter((x) => !x.classList.contains('aj-away'));
  if (live.length > cols * 2 - 1) { const old = live[0]; old.classList.add('aj-away'); setTimeout(() => old.remove(), 600); }
  say(`${sayName(r.letter)}. ${l.word}!`);
  jamCount += 1;
  if (jamCount % 15 === 0) party('Wow! What a song!');
  if (isNarrow()) setChoices(jamChoices());
}


let speller = null;
let stepId = 'three';

function showSteps() {
  leaveMode();
  show('steps');
  const list = $('step-list');
  list.innerHTML = '';
  const sample = { three: ['cat', '🐱'], four: ['fish', '🐟'], five: ['apple', '🍎'] };
  WORD_STEPS.forEach((s, i) => {
    const [w, pic] = sample[s.id] || s.words[0];
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'aj-step';
    b.style.setProperty('--c', ['#38b000', '#00a6ed', '#7b5cff'][i % 3]);
    const done = s.words.filter(([x]) => progress.words.includes(x)).length;
    b.innerHTML = '<span class="aj-step-pic" aria-hidden="true"></span><span class="aj-step-word"></span>'
      + '<span class="aj-step-dots" aria-hidden="true"></span><span class="aj-step-count"></span>';
    b.querySelector('.aj-step-pic').textContent = pic;
    b.querySelector('.aj-step-word').textContent = w.toUpperCase();
    b.querySelector('.aj-step-dots').textContent = '●'.repeat(s.size);
    b.querySelector('.aj-step-count').textContent = `⭐ ${done} / ${s.words.length}`;
    b.setAttribute('aria-label', `${s.size} letter words`);
    b.addEventListener('click', () => { play('tap'); startWords(s.id); });
    list.appendChild(b);
  });
  say('Pick your words!');
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
  st.querySelector('.aj-word-pic').textContent = cur.pic;
  const slots = st.querySelector('.aj-slots');
  [...cur.word.toUpperCase()].forEach((c, i) => {
    const s = document.createElement('span');
    s.className = 'aj-slot' + (i === 0 ? ' is-now' : '');
    s.textContent = c;
    s.dataset.c = colourFor(c);
    slots.appendChild(s);
  });
  renderProgress(Array.from({ length: speller.total }, (_, i) => (i < speller.wordIndex ? '⭐' : '•')), speller.wordIndex);
  play('whoosh');
  prompt(speller.want());
  say(`${cur.word}. Let's spell ${cur.word}!`);
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
    say(sayName(r.letter));
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
    say(`${[...r.wordDone].join(', ')}. ${r.wordDone}!`);
  }, 350);
  if (addSticker(progress, 'word', r.sticker)) { save(); later(() => { play('star'); stickerToast(r.wordDone.toUpperCase()); }, 1200); }
  if (r.roundDone) {
    later(() => party('Hooray! You built all the words!'), TIMING.wordGapMs);
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
  $('progress').innerHTML = '<span class="aj-rain-count" id="rain-count">🎈 0</span>';
  const st = $('stage');
  st.className = 'aj-stage aj-stage-rain';
  st.innerHTML = '<div class="aj-sky"></div>';
  say(isNarrow() ? 'Pop the balloons! Tap them!' : 'Pop the balloons! Press their letters!');
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
        el.setAttribute('aria-label', `Balloon ${b.ch}`);
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
  say(sayName(r.letter));
  const cnt = $('rain-count');
  if (cnt) { cnt.textContent = `🎈 ${rain.popped}`; bump(cnt, 'aj-jump'); }
  progress.pops += 1;
  if (r.sticker) { progress.stars += 1; play('star'); stickerToast(`🎈 ${rain.popped}`); confetti(50); }
  save();
}
const rainPop = { els: null };


function showStickers() {
  leaveMode();
  show('stickers');
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
    s.querySelector('i').textContent = got ? l.pic : '❔';
    s.setAttribute('aria-label', got ? letterPhrase(l.ch) : `${l.ch} - not yet`);
    s.addEventListener('click', () => {
      bump(s, 'aj-jump');
      if (got) { play(jamPress(l.ch).note); say(`${sayName(l.ch)}! ${letterPhrase(l.ch)}.`); } else play('tap');
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
      s.querySelector('i').textContent = got ? pic : '❔';
      s.querySelector('b').textContent = got ? w.toUpperCase() : '•'.repeat(w.length);
      s.setAttribute('aria-label', got ? w : 'not yet');
      s.addEventListener('click', () => { bump(s, 'aj-jump'); if (got) { play('word'); say(w); } else play('tap'); });
      W.appendChild(s);
    }
  }
  const total = progress.letters.length + progress.words.length;
  $('book-count').textContent = `🌟 ${total}  ·  🎈 ${progress.pops}`;
  say(total ? `You have ${total} stickers!` : 'Play to fill your sticker book!');
}


$('start').addEventListener('click', () => { play('tap'); startParade(); });
for (const t of document.querySelectorAll('.aj-tile')) {
  t.addEventListener('click', () => {
    play('tap');
    const go = t.dataset.go;
    if (go === 'jam') startJam();
    else if (go === 'words') showSteps();
    else if (go === 'rain') startRain();
    else if (go === 'stickers') showStickers();
  });
}
$('home').addEventListener('click', () => goHome());
for (const h of document.querySelectorAll('[data-home]')) h.addEventListener('click', () => goHome());
$('say-again').addEventListener('click', () => { play('tap'); if (lastSaid) say(lastSaid); });
$('kb-toggle').addEventListener('click', () => {
  kbLayout = kbLayout === 'abc' ? 'qwerty' : 'abc';
  try { store?.setItem('abcjam-kb', kbLayout); } catch {  }
  play('tap');
  buildKeyboard();
});

if (HAS_MUSIC) {
  $('music-btn').hidden = false;
  wireMusicButton({ music });
}


globalThis.__abcJam = { get mode() { return mode; }, get busy() { return busy; }, get wanted() { return wanted; }, PARTY_AFTER };

goHome({ quiet: true });
bootDone();
