



import { createMatch, step, EVENT } from '../../../web-engine/titan-bash/sim.js';
import { ARENAS } from '../../../web-engine/titan-bash/arenas.js';
import { createBot, botInput } from '../../../web-engine/titan-bash/bot.js';
import { HOUSES, TITANS } from '../../../web-engine/titan-bash/titans.js';
import { TUNING as T, secs, HZ } from '../../../web-engine/titan-bash/tuning.js';
import { initAnalytics } from '../../../web-engine/visits/visits.js';
import { bootDone } from '../../shared/ui/fitScreen.js';
import { KEYMAPS, GAME_KEYS, keyboardInput, padInput, padWantsJoin, cheatsFrom, buildSeats, setupFromCheats, defaultCpuLevel, defaultRookie, seatRookie, isTouchDevice, firstPilot } from './input.js';
import { wirePad } from './touchPad.js';
import { layout, draw, LIP, screenToWorld } from './render.js';
import { createScreenLink, joinCodeFrom, linkFor, canLink, PREFIX } from './net.js';
import { MSG, STATUS_HZ, encodeStatus } from './wire.js';
import { newCodeButton } from '../../../web-engine/net/stickyRoomCode.js';
import { normaliseCode } from '../../../web-engine/words/coop.js';
import { mountDeviceQr } from '../../../web-engine/ui/deviceQr.js';
import { shareLink } from '../../../web-engine/share/shareInvite.js';
import { createGameSfx } from '../../shared/audio/gameSfx.js';
import { SFX, SFX_TAKES, SFX_GAINS, UI, createSoundTracker, MUSIC_TRACKS, musicFor, VOLUME, gainsAt, STING_MS } from './sound.js';
import { createTrackMusic, LEVEL as MUSIC_LEVEL } from '../../shared/audio/trackMusic.js';
import { cleanPick, applyPick, takenHouses, hostPhone, mayStart, newRound } from './lobby.js';
import { createNight, matchOptions, arenaFor, recordRound, nightOver, standings, podium, MODE_NAME } from '../../../web-engine/titan-bash/night.js';
import { createWarmup, warmupStep, lessonFor } from '../../../web-engine/titan-bash/warmup.js';
import { loadTitanSprites, faceUrl } from './titanSprites.js';
import { loadFloors } from './floors.js';
import { createJuice, loadFxArt } from './juice.js';
import { enterClass, ENTER_CLASSES, countdownAt, COUNTDOWN_MS } from './transitions.js';
import { primaryFor, createLeave, createPadNav, joinNames, nightTitle, wellLine, stepsOrder, tieBreakNote, statParts, ptsText, standingScore, rewardParts, fallText, teamTotalsNote, firstTeams, controlsFor, controlsLine, bellsText, goalLine, stallPrompt, lessonPrompt, joinHint, rowTag, yourNightLines, warmNote, legendSide, LEGEND_MS } from './menu.js';
import { T as RT, starsForRound, starsForNight, addStars, equipNewest, loadStars, saveStars, tipFor, rowsFor, paintColor, emblemGlyph } from '../../../web-engine/titan-bash/rewards.js';

const $ = (id) => document.getElementById(id);
const HOUSE = Object.fromEntries(HOUSES.map((h) => [h.id, h]));
const cheats = cheatsFrom(location.search);
const joinCode = joinCodeFrom(location.search);



const sfx = createGameSfx(new URL('../assets/sfx/', import.meta.url), [...SFX], SFX_TAKES, Math.random, gainsAt(SFX, SFX_GAINS));
const ui = createGameSfx(new URL('../assets/ui/', import.meta.url), [...UI], {}, Math.random, gainsAt(UI));
let sounds = createSoundTracker();



const titansReady = loadTitanSprites(new URL('../assets/titans/', import.meta.url));
loadFloors(new URL('../assets/floors/', import.meta.url));
const music = createTrackMusic({ game: 'titan-bash', manifestUrl: new URL('../assets/music/music.json', import.meta.url), trackIds: MUSIC_TRACKS, level: MUSIC_LEVEL * VOLUME });
const musicSaved = (() => { try { return localStorage.getItem('magestican:v1:music'); } catch { return null; } })();
for (const type of ['pointerdown', 'keydown']) {
  addEventListener(type, () => { if (musicSaved !== 'off' && !music.isOn()) music.setOn(true); }, { once: true });
}
addEventListener('keydown', (e) => { if (e.code === 'KeyM') { music.toggle(); musicButton(); } });

function musicButton(on = music.isOn()) {
  $('music-btn').textContent = `Music: ${on ? 'on' : 'off'}`; $('music-btn').setAttribute('aria-pressed', String(on));
}
$('music-btn').addEventListener('click', (e) => {
  
  const want = $('music-btn').getAttribute('aria-pressed') !== 'true';
  music.setOn(want); $('music-btn').textContent = `Music: ${want ? 'on' : 'off'}`; $('music-btn').setAttribute('aria-pressed', String(want));
  ui.play(want ? 'pick' : 'back'); e.stopPropagation();
});
musicButton(musicSaved !== 'off'); 

let quietFocus = false; 
function focusQuietly(id) { quietFocus = true; $(id).focus({ preventScroll: true }); quietFocus = false; }
addEventListener('focusin', (e) => {
  const t = e.target;
  if (!quietFocus && t && t.matches && t.matches(':focus-visible') && /^(BUTTON|SELECT|INPUT|SUMMARY)$/.test(t.tagName)) ui.play('tap');
});

const down = new Set();


const touchFirst = !joinCode && isTouchDevice({
  maxTouchPoints: navigator.maxTouchPoints || 0,
  coarse: typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches,
});
const FIRST = firstPilot({ touch: touchFirst, joinCode }) || 'p1';
const touchPad = touchFirst
  ? wirePad({ zone: $('tp-stick'), knob: $('tp-knob'), fire: $('tp-fire'), boost: $('tp-boost'), ability: $('tp-ability') })
  : null;
if (touchFirst) document.body.classList.add('tb-touch-mode');
$('join-hint').textContent = joinHint(touchFirst); 
const hasTouchSeat = () => !!touchPad && humans.some((h) => h.control === 'touch');
let humans = [{ control: FIRST }];
let match = null; let bots = []; let seats = []; let fx = []; let raf = 0; let acc = 0; let last = 0;

const reducedMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

const fxArt = loadFxArt();
let juice = createJuice(Math.random, { reducedMotion, art: fxArt });

let countMs = Infinity;

function show(id) {
  for (const s of ['title', 'match', 'end', 'night']) $(s).hidden = s !== id;
  
  $(id).classList.remove(...ENTER_CLASSES); void $(id).offsetWidth;
  const enter = enterClass(id, reducedMotion); if (enter) $(id).classList.add(enter);
  if (id !== 'match') { leave.reset(); $('leave-ask').hidden = true; }
  music.setTrack(musicFor(id));
  if (id === 'title') startWarm(); else stopWarm();
  
  const pad = hasTouchSeat() && (id === 'title' || id === 'match');
  $('touch').hidden = !pad; document.body.classList.toggle('tb-touch-on', pad);
  if (!pad && touchPad) touchPad.release();
  qrFollow();
  
  const primary = primaryFor(id);
  if (primary && !joinCode) focusQuietly(primary);
}
const leave = createLeave();
function leaveAsk(kind) {
  const r = leave.press(kind);
  if (r === 'ask') {
    cancelAnimationFrame(raf); $('leave-ask').hidden = false; ui.play('back'); focusQuietly('leave-stay');
  } else if (r === 'resume') {
    $('leave-ask').hidden = true; ui.play('pick'); last = performance.now(); acc = 0;
    if (match && !match.over) raf = requestAnimationFrame(frame);
  } else if (r === 'leave') {
    $('leave-ask').hidden = true; ui.play('back'); cancelAnimationFrame(raf); match = null; show('title');
  }
}


function qrFollow() {
  
  const play = $('title').hidden;
  for (const el of document.querySelectorAll('.device-qr-card, .device-qr-chip')) el.style.display = play ? 'none' : '';
}

function controlLabel(c) {
  if (c === 'touch') return 'Touch pad (this phone)';
  if (c === 'p1') return 'Keys W A S D';
  if (c === 'p2') return 'Keys arrows';
  if (c.startsWith('pad')) return `Gamepad ${Number(c.slice(3)) + 1}`;
  if (c.startsWith('phone')) return `Phone ${Number(c.slice(5)) + 1}${link && link.phones.silent(c, performance.now()) ? ' (reconnecting)' : ''}`;
  return 'CPU pilot';
}

function renderSeats() {
  if (!$('title').hidden) startWarm();
  const list = $('seats'); list.textContent = '';
  for (const s of buildSeats(humans, { ...cheats, rookie: $('opt-rookie').checked })) {
    const li = document.createElement('li'); li.style.setProperty('--house', HOUSE[s.house].colour); 
    const sw = document.createElement('span'); sw.className = 'swatch'; sw.style.background = HOUSE[s.house].colour;
    const txt = document.createElement('span');
    const name = document.createElement('div'); name.className = 'name'; name.textContent = `${HOUSE[s.house].name} - ${s.titan[0].toUpperCase()}${s.titan.slice(1)}`;
    const who = document.createElement('div'); who.className = 'who'; who.textContent = controlLabel(s.control)
      + (s.rookie ? ' - Rookie' : '') + (humans.find((h) => h.control === s.control)?.ready ? ' - Ready' : '') + (hostPhone(humans) === s.control ? ' (host)' : '');
    txt.append(name, who); li.append(sw, txt); list.append(li);
  }
}

function join(control) {
  if (humans.some((h) => h.control === control) || humans.length >= 8) return;
  humans.push({ control }); renderSeats(); ui.play('join');
}


let night = null;
const NIGHTS_KEY = 'magestican:v1:titan-bash:nights';
const nightsPlayed = () => { try { return Number(localStorage.getItem(NIGHTS_KEY)) || 0; } catch { return 0; } };
function nightSettings() {
  return {
    mode: $('opt-mode').value, rounds: Number($('opt-rounds').value),
    teams: Number($('opt-teams').value), arena: $('opt-arena').value,
  };
}

{
  
  $('opt-cpu').value = defaultCpuLevel(nightsPlayed());
  
  $('opt-rookie').checked = defaultRookie(nightsPlayed());
  const s = setupFromCheats(cheats);
  for (const [id, v] of Object.entries(s.values)) $(id).value = v;
  for (const [id, v] of Object.entries(s.checks)) $(id).checked = v;
  $('opt-teams-wrap').hidden = !s.teamsShown;
}

const allNewRoom = () => nightsPlayed() === 0 || (humans.length > 0 && humans.every((h) => seatRookie(h, $('opt-rookie').checked)));
function nightLine() {
  const el = $('night-line');
  if (!el) return;
  el.textContent = night && !nightOver(night) && night.round > 0
    ? `${MODE_NAME[night.mode]}: round ${night.round + 1} of ${night.rounds} next, in ${ARENAS[arenaFor(night)].name}. Changing the setup starts a new Night.`
    : 'A Night is several rounds; places add up to crown the Night Champion.';
}

function start() {
  newRound(humans); sendSeats();
  const fresh = buildSeats(humans, { ...cheats, cpu: $('opt-cpu').value, rookie: $('opt-rookie').checked });
  
  if (!night || nightOver(night) || night.seats.length !== fresh.length) {
    night = createNight({ ...nightSettings(), players: fresh, allNew: allNewRoom() });
  } else {
    fresh.forEach((x, i) => Object.assign(night.seats[i], { house: x.house, titan: x.titan, rookie: x.rookie, control: x.control, cpu: x.cpu }));
  }
  seats = night.seats;
  const seed = cheats.seed ?? ((Date.now() & 0x7fffffff) | 1);
  const opts = matchOptions(night, { seed });
  if (cheats.sleeper) opts.sleeper = true;
  match = createMatch(opts);
  
  bots = seats.map((s, i) => createBot(i, s.cpu || 'pilot', seed));
  if (cheats.heat !== null) for (const t of match.titans) if (!t.cpu) t.heat = cheats.heat;
  if (cheats.storm) match.tick = secs(T.roundTime - T.stormTime);
  if (cheats.sleeper) match.tick = secs(T.roundTime - T.stormTime + T.sleeperWakeAfter - 1);
  fx = []; juice = createJuice(Math.random, { reducedMotion, art: fxArt }); acc = 0; last = performance.now(); sounds = createSoundTracker(); ui.play('start'); countMs = 0;
  globalThis.__titanBash = { get match() { return match; }, get phones() { return link?.phones.list() ?? []; } }; 
  paintLegend();
  show('match'); resize();
  cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
}

function paintLegend() {
  const ul = $('legend'); ul.textContent = '';
  
  const goal = el('li', 'goal'); goal.append(el('b', '', 'Goal'), ` ${goalLine(match?.mode)}`); ul.append(goal);
  for (const s of seats) {
    if (!controlsFor(s.control) || s.control.startsWith('phone')) continue;
    const li = el('li'); li.append(swatch(s.house), el('b', '', HOUSE[s.house].name), ` ${controlsLine(s.control)}`); ul.append(li);
  }
  if (seats.some((s) => s.control.startsWith('phone'))) ul.append(el('li', '', 'Phones: drag the left side to move - tap FIRE, BOOST, ABILITY'));
  ul.hidden = !ul.children.length;
}

const IDLE = Object.freeze({ mx: 0, my: 0, fire: false, boost: false, ability: false });



function inputsFor(m, list = seats, brains = bots, view = L) {
  const pads = navigator.getGamepads ? [...navigator.getGamepads()] : [];
  const human = (inp) => screenToWorld(view, inp);
  return list.map((s, i) => {
    const cpu = () => (brains ? botInput(brains[i], m) : { ...IDLE });
    if (s.control === 'bot') return cpu();
    if (s.control === 'touch') return touchPad ? human(touchPad.read()) : { ...IDLE };
    if (s.control === 'p1' || s.control === 'p2') return human(keyboardInput(KEYMAPS[s.control], down));
    if (s.control.startsWith('phone')) { const v = link?.phones.inputFor(s.control, performance.now()); return v ? human(v) : cpu(); }
    const pad = pads[Number(s.control.slice(3))];
    return pad ? human(padInput(pad)) : { ...IDLE };
  });
}

const nameOf = (m, id) => HOUSE[m.titans[id].house].name;
function addFx(m, events) {
  for (const e of events) {
    if ((e.type === EVENT.HIT || e.type === EVENT.BELL) && seats[e.target]?.control.startsWith('phone')) {
      link?.send(seats[e.target].control, [MSG.EVENT, e.type === EVENT.HIT ? 'hit' : 'bell']);
    }
    if (e.type === EVENT.BELL) {
      const t = m.titans[e.target];
      const text = e.by === null ? fallText(nameOf(m, e.target), e.value) :`${nameOf(m, e.by)} rings ${nameOf(m, e.target)}!`;
      fx.push({ kind: 'banner', text, ttl: 90, colour: e.by === null ? '#fff' : HOUSE[m.titans[e.by].house].colour });
      fx.push({ kind: 'pop', text: 'BELL!', x: t.x, y: t.y, ttl: 60, big: true, colour: '#ffd040' });
    } else if (e.type === EVENT.CLANG) fx.push({ kind: 'pop', text: 'CLANG!', x: e.x, y: e.y, ttl: 50, big: true, colour: '#9fe3ff' });
    else if (e.type === EVENT.PERFECT_VENT) { const t = m.titans[e.id]; fx.push({ kind: 'pop', text: 'PERFECT VENT', x: t.x, y: t.y - 3, ttl: 60, colour: '#6ff3ff' }); }
    else if (e.type === EVENT.STALL) {
      
      const t = m.titans[e.id]; const ctl = seats[e.id]?.control || 'bot';
      const pilot = !!controlsFor(ctl); const ttl = pilot ? secs(T.stallTime) : 40;
      fx.push({ kind: 'pop', text: stallPrompt(ctl), x: t.x, y: t.y - (pilot ? 5.5 : 3), ttl, ttl0: ttl, plate: pilot, colour: '#ff7a5c' });
    }
    
    else if (e.type === EVENT.LUMEN_OVERDRIVE) { const t = m.titans[e.id]; fx.push({ kind: 'banner', text: `${HOUSE[t.house].name} - LUMEN OVERDRIVE!`, ttl: 48, colour: '#8ff6ff' }); }
    else if (e.type === EVENT.LUMEN) { const t = m.titans[e.id]; fx.push({ kind: 'pop', text: `LUMEN ${e.count}/3`, x: t.x, y: t.y - 3, ttl: 40, colour: '#8ff6ff' }); }
    else if (e.type === EVENT.STORM) { fx.push({ kind: 'banner', text: 'STORM HOUR - Bells count double', ttl: 150, colour: '#c9a6ff' }); music.setTrack(musicFor('match', true)); }
    
    else if (e.type === EVENT.SHATTER) fx.push({ kind: 'pop', text: 'SHATTER!', x: e.x, y: e.y, ttl: 45, colour: '#9ff3e6' });
    else if (e.type === EVENT.TIDE_WARN) fx.push({ kind: 'banner', text: 'The tide is coming - get off the glowing bridge!', ttl: 150, colour: '#9fd8ff' });
    else if (e.type === EVENT.TIDE) fx.push({ kind: 'banner', text: 'TIDE!', ttl: 50, colour: '#e6f6ff' });
    else if (e.type === EVENT.WARN) fx.push({ kind: 'banner', text: 'The floor is cracking...', ttl: 120, colour: '#ff7a5c' });
    else if (e.type === EVENT.RISE) fx.push({ kind: 'banner', text: 'THE SLEEPER WAKES - hit its core!', ttl: 120, colour: '#ff5a3c' });
    else if (e.type === EVENT.CORE) fx.push({ kind: 'pop', text: `CORE ${e.hits}/${T.sleeperCoreHits}`, x: m.sleeper.x, y: m.sleeper.y - 3.5, ttl: 40, colour: '#ffb03c' });
    else if (e.type === EVENT.DOWN) fx.push({ kind: 'banner', text: e.by === null ? 'The Sleeper sinks' : `${nameOf(m, e.by)} drives the Sleeper under! +1 Bell`, ttl: 120, colour: '#ffd040' });
  }
  if (fx.filter((f) => f.kind === 'banner').length > 1) {
    const keep = fx.filter((f) => f.kind === 'banner').pop(); fx = fx.filter((f) => f.kind !== 'banner' || f === keep);
  }
}

function frame(now) {
  if (!match) return;
  
  const dt = Math.max(0, Math.min(0.25, (now - last) / 1000)); last = now;
  countMs += dt * 1000;
  
  $('legend').classList.toggle('gone', countMs > COUNTDOWN_MS.step * 3 + COUNTDOWN_MS.go + LEGEND_MS);
  if (countdownAt(countMs, reducedMotion)?.frozen) { paint(); raf = requestAnimationFrame(frame); return; }
  acc += dt;
  let steps = 0;
  while (acc >= 1 / HZ && steps < 5 && !match.over) {
    
    if (juice.holding()) { juice.holdTick(); acc -= 1 / HZ; steps += 1; continue; }
    const events = step(match, inputsFor(match));
    addFx(match, events);
    juice.onEvents(match, events, (t) => HOUSE[t.house]?.colour || '#ffd040'); juice.step();
    for (const name of sounds.tick(match, events)) sfx.play(name);
    acc -= 1 / HZ; steps += 1;
    for (const f of fx) f.ttl -= 1;
    fx = fx.filter((f) => f.ttl > 0);
  }
  paint();
  if (match.over) { results(match); return; }
  raf = requestAnimationFrame(frame);
}

let L = null;
function resize() {
  const c = $('stage'); const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = Math.round(c.clientWidth * dpr); c.height = Math.round(c.clientHeight * dpr);
  
  const lg = $('legend'); const touch = document.body.classList.contains('tb-touch-on');
  lg.classList.remove('over-hud'); 
  const cover = touch && !lg.hidden ? Math.max(0, c.getBoundingClientRect().bottom - lg.getBoundingClientRect().top + 16) : 0;
  L = layout(c.width, c.height, dpr, { arena: match ? match.arena : 'bellRing', reserve: Math.round(cover * dpr), turn: true }); 
  
  
  lg.classList.toggle('over-hud', !!L.rot && touch);
  
  $('match').classList.toggle('turned', !!L.rot);
  
  const side = document.body.classList.contains('tb-touch-on') ? 0 : legendSide((L.ox - L.aw / 2) / dpr - LIP);
  $('legend').classList.toggle('side', side > 0); $('legend').style.width = side ? `${side}px` : '';
  if (match) paint();
}
function paint() {
  const ctx = $('stage').getContext('2d');
  const hs = new Set(seats.map((s, i) => (s.control !== 'bot' ? i : -1)).filter((i) => i >= 0));
  const tag = (c) => (c === 'touch' ? 'You' : c === 'p1' ? 'P1' : c === 'p2' ? 'P2' : c.startsWith('phone') ? `Phone ${Number(c.slice(5)) + 1}` : `Pad ${Number(c.slice(3)) + 1}`);
  const labels = seats.map((s) => (s.control === 'bot' ? null : `${emblemGlyph(wear(s).emblem)} ${HOUSE[s.house].name} (${tag(s.control)})`.trim()));
  draw(ctx, match, fx, L, { humans: hs, labels, paints: seats.map((s) => paintColor(wear(s).paint)), juice, countdown: countdownAt(countMs, reducedMotion) });
}

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text !== undefined) e.textContent = text; return e; };
const swatch = (house) => { const e = el('span', 'swatch'); e.style.background = HOUSE[house].colour; return e; };
const teamName = (n) => `Team ${n + 1}`;





const screenSlot = (c) => c === 'p1' || c === 'p2' || c === 'touch' || c.startsWith('pad');
const store = (() => { try { return localStorage; } catch { return null; } })();
const humanOf = (s) => humans.find((h) => h.control === s.control);

function wear(s) {
  if (!s || s.control === 'bot') return { paint: null, emblem: null };
  if (screenSlot(s.control)) { const r = store ? loadStars(store, s.control) : null; return { paint: r?.paint ?? null, emblem: r?.emblem ?? null }; }
  const h = humanOf(s) || s; return { paint: h.paint ?? null, emblem: h.emblem ?? null };
}

function giveStars(id, n, tip) {
  const s = night.seats[id];
  if (!s || s.control === 'bot' || !(n > 0 || tip)) return null;
  let unlocks = [];
  let tipText = null;
  if (s.control.startsWith('phone')) {
    link?.send(s.control, { t: MSG.REWARD, stars: n, tip });
  } else if (screenSlot(s.control) && store) {
    const res = addStars(loadStars(store, s.control), n);
    saveStars(store, s.control, equipNewest(res.record, res.unlocked));
    unlocks = res.unlocked.map((u) => u.name);
    if (tip) tipText = RT.tip[tip]; 
  }
  
  const parts = rewardParts({ stars: n, unlocks, tip: tipText, newWord: RT.stars.new });
  return parts.length ? { parts, line: parts.map((p) => p.text).join(' - ') } : null;
}

function rewardBlock(parts, colour) {
  const box = el('span', 'stars');
  for (const p of parts) {
    if (p.kind === 'stars') box.append(el('span', 'star-n', p.text));
    else if (p.kind === 'unlock') { const c = el('span', 'unlock', p.text); c.style.borderColor = colour; box.append(c); }
    else box.append(el('span', 'tip', p.text));
  }
  return box;
}

function award(card) {
  const out = new Map();
  for (const r of card.rows) {
    const got = giveStars(r.id, starsForRound(r), tipFor(rowsFor(night, r.id))?.key ?? null);
    if (got) out.set(r.id, got);
  }
  return out;
}


function results(m) {
  cancelAnimationFrame(raf);
  if (!night) night = createNight({ ...nightSettings(), players: seats });
  const card = recordRound(night, m);
  const earned = award(card);
  const w = card.winner;
  $('end-round').textContent = `${MODE_NAME[night.mode]} - round ${night.round} of ${night.rounds} - ${ARENAS[m.arena].name}`;
  
  
  const firsts = card.rows.filter((r) => r.place === 0).map((r) => HOUSE[r.house].name);
  const topTeams = firstTeams(card); 
  $('end-title').textContent = card.mode === 'team'
    ? topTeams.length > 1 ? `${joinNames(topTeams.map(teamName))} share the round!` : `${teamName(w.team)} wins the round!`
    : firsts.length > 1 ? `${joinNames(firsts)} share the round!` : `${HOUSE[w.house].name} wins the round!`;
  const note = card.mode === 'team' ? teamTotalsNote(card) : tieBreakNote(card, (r) => HOUSE[r.house].name);
  $('end-note').textContent = note; $('end-note').hidden = !note;
  const ol = $('podium'); ol.textContent = '';
  const humanCount = seats.filter((s) => s.control !== 'bot').length;
  for (const r of card.rows) {
    
    
    const li = el('li');
    li.dataset.titan = r.frame;
    if (r.place === 0) li.classList.add('win');
    
    
    const nm = el('span', 'who', HOUSE[r.house].name);
    nm.append(el('span', 'frame', ` - ${TITANS[r.frame]?.name || r.frame}`));
    if (card.mode === 'team') nm.append(` - ${teamName(r.team)}`);
    
    const you = rowTag(seats[r.id]?.control, humanCount);
    if (you) { nm.append(' ', el('span', 'you', you)); li.classList.add('mine'); }
    const b = el('span', 'bells', bellsText(r.bells));
    const stats = statsLine(r, card.rows, card.mode);
    const face = el('span', 'tb-face'); face.setAttribute('aria-hidden', 'true'); face.style.borderColor = HOUSE[r.house].colour;
    tintFace(face, r.frame, r.house);
    li.append(el('span', 'place', `${r.place + 1}.`), face, nm, b, el('span', 'pts', `+${r.points}`), stats);
    const got = earned.get(r.id);
    if (got) li.append(rewardBlock(got.parts, HOUSE[r.house].colour));
    ol.append(li);
  }
  paintStandings();
  $('again').textContent = nightOver(night) ? 'Crown the Champion' : 'Next round';
  show('end'); 
}




function statsLine(r, rows, mode) {
  const s = el('span', 'stats');
  statParts(r, rows, mode).forEach(([lead, long, tail, n], i) => {
    if (i) s.append(' - ');
    s.append(lead); if (long) s.append(el('span', 'lg', long)); s.append(el('span', 'k', tail), ` ${n}`);
  });
  return s;
}

function paintStandings() {
  const ol = $('standings'); ol.textContent = '';
  const all = standings(night);
  for (const e of all) {
    const li = el('li');
    li.append(el('span', 'place', `${e.place + 1}.`));
    for (const i of e.members) li.append(swatch(night.seats[i].house));
    const name = night.mode === 'team'
      ? `${teamName(e.team)}: ${e.members.map((i) => HOUSE[night.seats[i].house].name).join(', ')}`
      : HOUSE[night.seats[e.members[0]].house].name;
    li.append(el('span', '', name), el('span', 'score', standingScore(e, all)));
    ol.append(li);
  }
}



function tintFace(face, frame, house, retry = true) {
  const url = faceUrl(frame, HOUSE[house].colour);
  if (url) { face.classList.add('tinted'); face.style.setProperty('--face', `url("${url}")`); }
  else if (retry) titansReady.then(() => tintFace(face, frame, house, false));
}


function showPodium() {
  const p = podium(night);
  $('night-mode').textContent = `${MODE_NAME[night.mode]} - ${night.rounds} rounds`;
  
  $('night-title').textContent = nightTitle(p.champions.map((e) => (night.mode === 'team'
    ? teamName(night.seats[e.members[0]].team) : HOUSE[e.houses[0]].name)), night.mode === 'team');
  $('night-well').textContent = wellLine(p.wells);
  const ol = $('steps'); ol.textContent = '';
  
  for (const e of stepsOrder(p.entries)) {
    const li = el('li');
    const step = Math.min(3, e.place + 1);
    li.className = `p${step}`;
    const who = el('div', 'who');
    
    
    
    if (e.houses.length > 1) who.classList.add('team');
    for (const id of e.members) {
      const seat = night.seats[id];
      const f = el('span', 'tb-face'); f.dataset.titan = seat.titan; f.title = HOUSE[seat.house].name;
      f.style.setProperty('--house', HOUSE[seat.house].colour); tintFace(f, seat.titan, seat.house); who.append(f);
    }
    li.append(who, el('span', 'name', e.houses.map((h) => HOUSE[h].name).join(', ')), el('span', 'score', `${ptsText(e.score)} - ${bellsText(e.bells)}`), el('div', 'block', String(e.place + 1)));
    ol.append(li);
  }
  
  const mine = $('night-you'); mine.textContent = '';
  for (const l of yourNightLines(standings(night), night.seats, night.mode === 'team' ? teamName : null)) {
    const li = el('li'); li.append(el('span', 'you', l.tag), ` ${l.text}`); mine.append(li);
  }
  mine.hidden = !mine.childElementCount;
  try { localStorage.setItem(NIGHTS_KEY, String(nightsPlayed() + 1)); } catch {  }
  
  const lines = [];
  if (!night.starred) for (const e of p.entries) for (const id of e.members) {
    const got = giveStars(id, starsForNight(e.place), null);
    if (got) lines.push(`${HOUSE[night.seats[id].house].name}: ${got.line}`);
  }
  if (!night.starred) $('night-stars').textContent = lines.join('  -  ');
  night.starred = true;
  ui.play('start');
  show('night'); 
  
  music.setTrack('sting');
  clearTimeout(stingTimer);
  stingTimer = setTimeout(() => { if (!$('night').hidden) music.setTrack(musicFor('night')); }, STING_MS);
}
let stingTimer = 0;


window.addEventListener('keydown', (e) => {
  const typing = e.target && /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName);
  if (GAME_KEYS.has(e.code) && (!$('match').hidden || (!$('title').hidden && !typing && e.code !== 'Enter' && e.code !== 'Space'))) e.preventDefault();
  down.add(e.code);
  if (!$('title').hidden && Object.values(KEYMAPS.p2).flat().includes(e.code)) join('p2');
  if (e.code === 'Escape' && match && !$('match').hidden) leaveAsk('escape');
});
window.addEventListener('keyup', (e) => down.delete(e.code));
window.addEventListener('blur', () => down.clear());
window.addEventListener('resize', () => { if (!$('match').hidden) resize(); if (!$('title').hidden && warm) resizeWarm(); });




const padNav = createPadNav();
const BACK = { end: 'to-title', night: 'night-pilots' };
function pollPads() {
  if (navigator.getGamepads) {
    for (const p of navigator.getGamepads()) {
      if (!p) continue;
      const act = padNav.read(p);
      const onTitle = !$('title').hidden;
      if (onTitle && !humans.some((h) => h.control === `pad${p.index}`)) { if (padWantsJoin(p)) join(`pad${p.index}`); continue; }
      if (act) padMenu(act);
    }
  }
  requestAnimationFrame(pollPads);
}
function padMenu(act) {
  const asking = !$('leave-ask').hidden;
  const screen = asking ? $('leave-ask') : ['title', 'end', 'night'].map($).find((s) => !s.hidden);
  if (!screen) return; 
  if (act === 'back') { if (asking) leaveAsk('escape'); else { const id = BACK[screen.id]; if (id) $(id).click(); } return; }
  const items = [...screen.querySelectorAll('button, select, summary, input')].filter((e) => e.offsetParent !== null && !e.disabled);
  const at = items.indexOf(document.activeElement);
  if (act === 'confirm') {
    const t = at >= 0 ? items[at] : null;
    if (t && t.tagName === 'SELECT') { t.selectedIndex = (t.selectedIndex + 1) % t.options.length; t.dispatchEvent(new Event('change')); }
    else if (t) t.click();
    return;
  }
  if (!items.length) return;
  const next = items[(at + (act === 'next' ? 1 : -1) + items.length) % items.length];
  next.focus({ preventScroll: false });
}

$('start').addEventListener('click', start);
$('again').addEventListener('click', () => { if (night && nightOver(night)) showPodium(); else start(); });
$('to-title').addEventListener('click', () => { ui.play('back'); show('title'); renderSeats(); nightLine(); });
$('night-again').addEventListener('click', () => { night = null; start(); });
$('night-pilots').addEventListener('click', () => { ui.play('back'); night = null; show('title'); renderSeats(); nightLine(); });

for (const id of ['opt-mode', 'opt-rounds', 'opt-teams', 'opt-arena', 'opt-cpu', 'opt-rookie']) {
  $(id).addEventListener('change', () => { $('opt-teams-wrap').hidden = $('opt-mode').value !== 'team'; night = null; nightLine(); ui.play('pick'); });
}

$('opt-rookie').addEventListener('change', () => renderSeats());
{ const p = el('p', 'tb-dim'); p.id = 'night-line'; $('night-setup').append(p); nightLine(); }




let warm = null; let warmSeats = []; let warmKey = ''; let warmRaf = 0; let warmLast = 0; let warmAcc = 0; let LW = null;
const warmFingerprint = () => humans.map((h) => `${h.control}:${h.house || ''}:${h.titan || ''}:${seatRookie(h, $('opt-rookie').checked) ? 1 : 0}`).join('|');
function startWarm() {
  if (joinCode) return;
  const key = warmFingerprint();
  if (!warm || key !== warmKey) {
    warmKey = key;
    warmSeats = buildSeats(humans, { ...cheats, bots: 0, rookie: $('opt-rookie').checked });
    warm = createWarmup({ players: warmSeats, seed: 11 });
    
    $('warm-note').textContent = warmNote(warmSeats.map((s) => ({ name: HOUSE[s.house].name, control: s.control })));
  }
  resizeWarm();
  cancelAnimationFrame(warmRaf); warmLast = performance.now(); warmAcc = 0; warmRaf = requestAnimationFrame(warmFrame);
}
function stopWarm() { cancelAnimationFrame(warmRaf); warmRaf = 0; }

const WARM_GUTTER = 8; 
function resizeWarm() {
  const c = $('warm'); const dpr = Math.min(2, window.devicePixelRatio || 1);
  c.width = Math.round(c.clientWidth * dpr); c.height = Math.round(c.clientHeight * dpr);
  LW = layout(c.width, c.height, dpr, { hud: false, gutter: WARM_GUTTER });
}
function warmFrame(now) {
  if ($('title').hidden || !warm) return;
  warmAcc += Math.min(0.25, (now - warmLast) / 1000); warmLast = now;
  let n = 0;
  while (warmAcc >= 1 / HZ && n < 5) {
    const events = warmupStep(warm, inputsFor(warm.match, warmSeats, null, LW));
    for (const name of sounds.tick(warm.match, events)) sfx.play(name);
    warmAcc -= 1 / HZ; n += 1;
  }
  
  const fxw = [];
  warmSeats.forEach((s, i) => {
    const t = warm.match.titans[i]; const l = lessonFor(warm, i);
    
    const text = l && (l.praise || (l.prompt && lessonPrompt(s.control, l.shown, l.prompt)));
    
    
    
    const hh = ARENAS[warm.match.arena]?.h ?? 32;
    const ly = t && t.y > 0 ? -(hh / 2 - 3) : hh / 2 - 3;
    if (t && t.alive && text) fxw.push({ kind: 'pop', text, x: t.x, y: ly, ttl: 60, plate: true, colour: l.praise ? '#ffd040' : '#fff' });
  });
  const labels = warmSeats.map((s) => `${HOUSE[s.house].name}`);
  if (LW) draw($('warm').getContext('2d'), warm.match, fxw, LW, { humans: new Set(warmSeats.map((_, i) => i)), labels });
  warmRaf = requestAnimationFrame(warmFrame);
}
$('quit').addEventListener('click', () => leaveAsk('quit'));
$('leave-stay').addEventListener('click', () => leaveAsk('stay'));
$('leave-go').addEventListener('click', () => leaveAsk('leave'));


let link = null;


function seatInfo(control) {
  const s = buildSeats(humans, cheats).find((x) => x.control === control);
  if (!s) return null;
  const h = humans.find((x) => x.control === control) || {};
  return { house: s.house, titan: s.titan, rookie: !!h.rookie, ready: !!h.ready, host: hostPhone(humans) === control,
    taken: takenHouses(humans, control) };
}


function sendSeats() {
  for (const p of link?.phones.list() ?? []) if (p.peer) link.send(p.control, { t: MSG.SEAT, control: p.control, ...(seatInfo(p.control) || {}) });
}


function onPick(control, msg) {
  if (!$('match').hidden) return;
  const r = applyPick(humans, control, cleanPick(msg));
  if (r.changed) ui.play(msg.ready === true ? 'ready' : 'pick');
  else if (r.refused) ui.play('back');
  sendSeats();
  if (!$('title').hidden) renderSeats();
}
function onStart(control) {
  if (!$('match').hidden || !mayStart(humans, control)) return;
  start();
}


function onPhones(list) {
  const live = new Set(list.map((p) => p.control));
  if ($('match').hidden) humans = humans.filter((h) => !h.control.startsWith('phone') || live.has(h.control));
  for (const p of list) {
    if (!humans.some((h) => h.control === p.control) && humans.length < 8) { humans.push({ control: p.control }); ui.play('join'); }
  }
  sendSeats();
  if (!$('title').hidden) renderSeats();
}

let qrFor = null;
function onCode(code, state) {
  $('room').hidden = false;
  $('room-code').classList.toggle('tb-wait', !code); 
  if (!code) { $('room-code').textContent = state === 'opening' ? 'Opening a room...' : state === 'reopening' ? 'Reopening the room...' : 'Phones cannot join right now.'; return; }
  const url = linkFor(code);
  $('room-code').textContent = code.slice(PREFIX.length).toUpperCase();
  $('room-link').textContent = url.replace(/^https?:\/\//, '');
  
  $('copy-link').onclick = () => shareLink({ link: url, gameName: 'Ringtitans', code: code.slice(PREFIX.length).toUpperCase(), button: $('copy-link') });
  if (qrFor !== code) {
    qrFor = code;
    document.querySelectorAll('.device-qr-card, .device-qr-chip').forEach((el) => el.remove());
    mountDeviceQr({ url, label: 'Scan to join', sublabel: 'Fly a Titan from your phone.' }).then(() => {
      
      const card = document.querySelector('.device-qr-card');
      if (card) { $('room-qr').append(card); $('room').classList.add('tb-has-qr'); }
      qrFollow();
    }, () => {});
  }
}


function sendStatus() {
  if (!link) return;
  for (const p of link.phones.list()) {
    if (!p.peer) continue;
    const warming = !$('title').hidden && warm;
    const list = warming ? warmSeats : seats; const m = warming ? warm.match : match;
    const i = list.findIndex((s) => s.control === p.control);
    const t = m && (warming || !$('match').hidden) && i >= 0 ? m.titans[i] : null;
    const lesson = warming && i >= 0 ? lessonFor(warm, i) : null;
    const info = t ? { house: t.house, titan: t.frame } : seatInfo(p.control) || {};
    link.send(p.control, encodeStatus({
      heat: t ? t.heat : 0, armour: t ? t.armour / t.maxArmour : 1,
      cooldown: t && t.abilityCd > 0 ? Math.min(1, t.abilityCd / secs(TITANS[t.frame]?.abilityCooldown || 6)) : 0,
      bells: t ? t.bells : 0, house: info.house, titan: info.titan,
      state: warming && t ? 'warm' : t ? 'play' : !$('night').hidden ? 'night' : !$('end').hidden ? 'end' : 'title', stalled: !!(t && t.stall > 0),
      lit: lesson ? lesson.lit : null, hint: lesson ? lesson.praise || lesson.prompt : '',
      team: t && m.mode === 'team' ? t.team : -1, 
      ack: p.seq, ackAge: performance.now() - p.heard, 
    }));
  }
}

if (joinCode) {
  
  import('./phone.js').then(({ startPhone }) => startPhone(joinCode));
} else {
  if (canLink()) {
    link = createScreenLink({ onSeats: onPhones, onCode, seatInfo, onPick, onStart });
    link.host();
    newCodeButton($('copy-link'), { onReset: () => { link.newCode(); } }).show(true);
    setInterval(sendStatus, 1000 / STATUS_HZ);
  }
  $('join-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const code = normaliseCode($('join-code').value, PREFIX);
    if (code) location.search = `?join=${encodeURIComponent(code)}`;
    else { $('join-code').setCustomValidity('That is not a Ringtitans code'); $('join-code').reportValidity(); }
  });
  $('join-code').addEventListener('input', () => $('join-code').setCustomValidity(''));
  bootScreen();
}

function bootScreen() {
renderSeats();
if (cheats.state === 'results' || cheats.state === 'podium') {
  
  humans = [];
  night = createNight({ ...nightSettings(), players: buildSeats([], cheats), allNew: false });
  seats = night.seats;
  const rounds = cheats.state === 'podium' ? night.rounds : 1;
  for (let r = 0; r < rounds; r++) {
    const seed = (cheats.seed ?? 7) + r;
    match = createMatch(matchOptions(night, { seed }));
    bots = seats.map((_, n) => createBot(n, 'pilot', seed));
    while (!match.over) step(match, inputsFor(match));
    if (r < rounds - 1) recordRound(night, match);
  }
  
  if (cheats.you !== null && seats[cheats.you]) seats[cheats.you].control = FIRST;
  results(match);
  if (cheats.state === 'podium') showPodium();
  humans = [{ control: FIRST }];
} else show('title');
requestAnimationFrame(pollPads);
}
initAnalytics({ page: 'titan-bash' });
bootDone();


for (const s of ['title', 'end', 'night']) if (!$(s).hidden && !joinCode) focusQuietly(primaryFor(s));
