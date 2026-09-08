















import { MAPS, PLAYABLE_MAP_IDS, DEFAULT_MAP } from '../../../web-engine/rts/maps/index.js';
import { HERD, YIELD } from '../../../web-engine/rts/roster.js';
import { MS_PER_TICK, MATCH_TICKS, TICKS_PER_SECOND } from '../../../web-engine/rts/fixed.js';
import { seedFromString } from '../../../web-engine/rts/rng.js';
import { landSeconds, sharePct } from '../../../web-engine/rts/territory.js';
import { matchPoints, rankTitle } from '../../../web-engine/rts/progression.js';
import { createMatch, stepMatch, placings } from '../../../web-engine/rts/sim/match.js';
import { makeBot, strengthFromLevel } from '../../../web-engine/rts/sim/botBrain.js';
import { applyCommand, resolveSelection, CMD } from '../../../web-engine/rts/sim/commands.js';
import { sectorAt } from '../../../web-engine/rts/maps/mapFormat.js';
import { createNetMatch } from '../../../web-engine/rts/net/netMatch.js';
import { nameFor, joinIdFrom } from '../../../web-engine/words/coop.js';
import { createRenderer } from './render.js';
import { createHud } from './hud.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createVoices } from './voices.js';
import { createNet, openRooms, canPlayTogether } from './net.js';
import { createLobbyPanel } from './lobbyPanel.js';
import { saveMatch, restoreMatch, matchChecksum, checksumFields } from '../../../web-engine/rts/sim/save.js';
import { MAX_UNITS } from '../../../web-engine/rts/sim/world.js';
import { FIELD_MM } from '../../../web-engine/rts/fixed.js';
import { createInterp, alphaOf } from './interp.js';
import { decideTier } from './quality.js';
import {
  storeSave, loadSave, clearSave, hasSave, loadProfile, recordMatch,
  levelProgress,
} from './store.js';

const params = new URLSearchParams(location.search);

















let SEAT = 0;
const $ = (id) => document.getElementById(id);










let chosenFaction = params.get('faction') === 'yield' ? YIELD : HERD;

const mapSelect = $('pick-map');


for (const id of PLAYABLE_MAP_IDS) {
  const opt = document.createElement('option');
  opt.value = id;
  opt.textContent = MAPS[id].name;
  if (id === (MAPS[params.get('map')] ? params.get('map') : DEFAULT_MAP)) opt.selected = true;
  mapSelect.appendChild(opt);
}












let audio = null;
function menuAudio() {
  if (!audio) audio = createAudio();
  return audio;
}
function menuMusic() {
  try { menuAudio().menu(chosenFaction === HERD ? 'herd' : 'yield'); } catch {  }
}

function pickFaction(f, byHand) {
  const changed = chosenFaction !== f;
  chosenFaction = f;
  for (const s of $('pick-faction').querySelectorAll('.side')) {
    s.classList.toggle('on', s.dataset.faction === chosenFaction);
  }
  
  
  
  document.documentElement.dataset.skin = chosenFaction === HERD ? 'herd' : 'yield';
  
  
  if (byHand) {
    try {
      const a = menuAudio();
      a.menu(chosenFaction === HERD ? 'herd' : 'yield');
      if (changed) a.pickCue(chosenFaction === HERD ? 'herd' : 'yield');
    } catch {  }
  }
}
pickFaction(chosenFaction);





menuMusic();
for (const evt of ['pointerdown', 'keydown', 'touchstart']) {
  window.addEventListener(evt, () => { menuMusic(); }, { once: true, passive: true });
}











const HERO_OF = {
  herd: ['flock', 'sounder', 'horseHerd'],
  yield: ['farmhand', 'tractor', 'harvester'],
};
fetch('assets/sprites/hero.json').then((r) => (r.ok ? r.json() : null)).then((hero) => {
  if (!hero || !hero.order) return;
  const n = hero.order.length;
  for (const side of $('pick-faction').querySelectorAll('.side')) {
    const want = HERO_OF[side.dataset.faction] || [];
    want.forEach((id, slot) => {
      const row = hero.order.indexOf(id);
      const el = side.querySelector(`.hero.s${slot}`);
      if (row < 0 || !el) return;
      el.style.backgroundPosition = `50% ${n > 1 ? (row * 100) / (n - 1) : 0}%`;
      el.style.backgroundSize = `auto ${n * 100}%`;
    });
  }
}).catch(() => {  });

$('pick-faction').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  pickFaction(b.dataset.faction === 'yield' ? YIELD : HERD, true);
});

$('btn-play').addEventListener('click', () => { clearSave(); start(); });

$('btn-change').addEventListener('click', () => {
  pickFaction(chosenFaction === HERD ? YIELD : HERD);
  clearSave();
  start();
});








function offerResume() {
  const btn = $('btn-resume');
  const saved = loadSave();
  if (!saved) { btn.hidden = true; return; }
  let restored = null;
  try {
    restored = restoreMatch(saved.blob);
  } catch {
    clearSave();
    btn.hidden = true;
    return;
  }
  const mins = Math.floor(saved.meta.tick / (60 * TICKS_PER_SECOND));
  const secs = Math.floor(saved.meta.tick / TICKS_PER_SECOND) % 60;
  btn.hidden = false;
  btn.textContent = `RESUME  ${mins}:${String(secs).padStart(2, '0')}  -  ${saved.meta.share}% held`;
  btn.onclick = () => { start(restored); };
}
offerResume();


$('btn-again').addEventListener('click', () => { clearSave(); start(); });
$('btn-menu').addEventListener('click', () => {
  $('endcard').classList.remove('show');
  $('menu').classList.add('show');
  
  
  
  offerResume();
  
  
  if (match && view) {
    backdrop = { m: match, acc: 0, t0: performance.now() };
    match = null;
    view.setReveal(true);
    document.documentElement.classList.add('menu');
  }
});





const canvas = $('game');
let match = null;
let view = null;
let hud = null;
let input = null;
















let backdrop = null;
const reduceMotion = typeof matchMedia === 'function'
  && matchMedia('(prefers-reduced-motion: reduce)').matches;

async function ensureView(m, seat) {
  if (!view) {
    view = await createRenderer(canvas, m, seat);
    view.setInterp(interp);
    window.addEventListener('resize', () => view.resize());
  } else {
    view.reset(m, seat);
  }
}

async function startBackdrop() {
  
  if (match || backdrop || params.get('autostart') === '1' || joinIdFrom(location.href)) return;
  
  
  
  
  document.documentElement.classList.add('menu');
  const day = params.get('seed') || new Date().toISOString().slice(0, 10);
  const seats = [
    { faction: HERD, bot: makeBot(0, strengthFromLevel(6)) },
    { faction: YIELD, bot: makeBot(1, strengthFromLevel(6)) },
  ];
  const m = createMatch({ map: MAPS[DEFAULT_MAP], seats, seed: seedFromString(`menu-${day}`) });
  await ensureView(m, 0);
  if (match) return; 
  view.setReveal(true);
  view.view.span = 250;
  view.resize();
  interp.settle(m.w);
  backdrop = { m, acc: 0, t0: performance.now() };
  
  
  document.documentElement.classList.add('menu');
}


function stepBackdrop(now, dt) {
  const b = backdrop;
  b.acc += dt;
  let ran = 0;
  if (b.acc >= MS_PER_TICK * 2) interp.snapshot(b.m.w);
  while (b.acc >= MS_PER_TICK * 2 && ran < 3 && !b.m.over) {
    b.acc -= MS_PER_TICK * 2;
    stepMatch(b.m, applyCommand);
    ran += 1;
  }
  if (ran === 3) b.acc = 0;
  
  
  
  const cx = FIELD_MM / 2;
  const cy = FIELD_MM / 2;
  if (reduceMotion) {
    view.centreOn(cx, cy);
  } else {
    const a = ((now - b.t0) / 120000) * Math.PI * 2;
    view.centreOn(cx + Math.cos(a) * 220000, cy + Math.sin(a * 0.5) * 160000);
  }
  view.frame(b.m, 0, now, alphaOf(b.acc, MS_PER_TICK * 2, ran === 3));
}


function leaveMenu() {
  const menu = $('menu');
  if (reduceMotion) { menu.classList.remove('show'); return; }
  menu.classList.add('leaving');
  setTimeout(() => { menu.classList.remove('show', 'leaving'); }, 420);
}
let voices = null;
let lastSavedTick = -1;
let selection = { kind: 'all', key: null };
let sequence = 0;
let paused = false;
let ended = false;





let net = null;          
let netMatch = null;     
let netPayload = null;   
let lobbyUi = null;
let observing = false;

let pendingFlash = -1;
let stallShown = false;








const DROPPED_BOT_STRENGTH = 60;


function send(cmd) {
  if (!match) return;
  
  
  
  if (observing) return;
  const full = { ...cmd, p: SEAT, seq: sequence };
  sequence += 1;
  
  
  
  
  
  
  
  
  
  if (view && (cmd.c === CMD.MOVE || cmd.c === CMD.ATTACK || cmd.c === CMD.CAPTURE)) {
    const slots = resolveSelection(match, SEAT, selection);
    const target = orderTarget(cmd, slots);
    if (target) view.acknowledge(slots, target.x, target.y);
    if (hud) hud.flashSelection();
  }
  if (netMatch) {
    const packet = netMatch.issue(full);
    pendingFlash = packet.t;
    return;
  }
  applyCommand(match, full);
}








function orderTarget(cmd, slots) {
  if (cmd.c === CMD.MOVE) return { x: cmd.x, y: cmd.y };
  if (!slots.length) return null;
  const w = match.w;
  const i = slots[0];
  let best = null;
  let bestD = Infinity;
  for (const s of w.sectors) {
    if (s.owner === SEAT) continue;
    const d = Math.hypot(s.cx - w.u.x[i], s.cy - w.u.y[i]);
    if (d < bestD) { bestD = d; best = s; }
  }
  return best ? { x: best.cx, y: best.cy } : null;
}









function flashOrder() {
  if (!match || !(match.lastOrderSector >= 0)) return;
  const s = match.w.sectors[match.lastOrderSector];
  view.markOrder(s.cx, s.cy);
  hud.say(`Moving on ${s.kind === 'water' ? 'the water' : 'that ground'}.`);
}









function seatName(seat) {
  const s = netPayload && netPayload.seats[seat];
  return s ? nameFor(s.id) : `Seat ${seat + 1}`;
}


function showStall(seats) {
  stallShown = true;
  $('banner').textContent = `Waiting for ${seats.map(seatName).join(' and ')}`;
  $('banner').classList.add('show');
}

function clearStall() {
  stallShown = false;
  $('banner').classList.remove('show');
}











function handleEvents(events) {
  if (!events || !events.length) return;
  hud.events(events, match);
  audio.events(events, match);
  if (voices) voices.events(events, match, SEAT);
  
  
  
  
  
  
  if (view) view.shots(match, SEAT, events);
}










function tickFlash(tick) {
  if (pendingFlash < 0 || tick < pendingFlash) return;
  pendingFlash = -1;
  flashOrder();
}










async function start(resumed, networked) {
  if (networked) {
    netPayload = networked.payload;
    
    
    
    
    observing = networked.seat < 0;
    SEAT = observing ? 0 : networked.seat;
    match = createMatch({
      map: networked.map,
      
      
      
      
      seats: netPayload.seats.map((x) => ({ faction: x.faction, bot: null })),
      seed: netPayload.seed,
    });
    netMatch = createNetMatch({
      match,
      transport: networked.transport,
      peers: networked.peers,
      localSeat: networked.seat,
      onTick(events, tick) { handleEvents(events); tickFlash(tick); recordTrace(); },
      onStall(seats) { showStall(seats); },
      onDesync(d) {
        
        
        
        
        hud.say(`Out of step at tick ${d.tick}. Resynchronising.`);
        console.warn("[fu] desync", d);
      },
      onResync() { hud.say("Resynchronised."); },
      onDrop(seat) { hud.say(`${seatName(seat)} dropped out. A bot has their farm.`); },
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      botForDroppedSeat: (seat) => makeBot(seat, DROPPED_BOT_STRENGTH),
    });
    
    
    
    
    
    clearSave();
  } else if (resumed) {
    
    
    
    
    
    
    match = resumed;
  } else {
    
    
    
    
    const level = Number($('pick-level').value) || loadProfile().level;
    const mapId = mapSelect.value;
    const seedText = params.get('seed') || `${Date.now()}`;

    const seats = [
      { faction: chosenFaction, bot: null },
      {
        faction: chosenFaction === HERD ? YIELD : HERD,
        
        
        bot: makeBot(1, strengthFromLevel(level)),
      },
    ];
    match = createMatch({ map: MAPS[mapId], seats, seed: seedFromString(seedText) });
  }

  if (!networked) {
    
    
    
    
    
    
    netMatch = null;
    netPayload = null;
    observing = false;
    SEAT = 0;
  }
  pendingFlash = -1;
  stallShown = false;
  lastSavedTick = match.w.tick;
  selection = { kind: 'all', key: null };
  sequence = 0;
  ended = false;
  paused = false;
  acc = 0;

  $('menu').classList.remove('show');
  $('endcard').classList.remove('show');
  $('banner').classList.remove('show');
  $('buildbar').classList.remove('open');

  
  
  
  
  const fromBackdrop = !!backdrop;
  backdrop = null;
  document.documentElement.classList.remove('menu');
  await ensureView(match, SEAT);
  if (view.revealed) view.setReveal(false);
  if (fromBackdrop && !resumed) {
    const { x, y } = view.view;
    view.reset(match, SEAT);
    const sp = match.w.map.spawns.find((s) => s.seat === SEAT);
    if (sp) { view.view.x = x; view.view.y = y; view.glideTo(sp.x, sp.y); }
    leaveMenu();
    $('dock').classList.add('enter');
    $('top').classList.add('enter');
  }

  
  if (!audio) audio = createAudio();
  audio.begin(match, SEAT);

  hud = createHud(match, SEAT, {
    onSelect(sel) {
      selection = sel;
      
      
      
      
      
      if (voices) voices.selected(match, SEAT, sel && sel.key);
    },
    onTrain(unit) { send({ c: CMD.TRAIN, unit }); audio.ui('click'); },
    onBuildPick(building) { input.armBuild(building); hud.say(`Tap where the ${building} should go.`); },
    onToggle(key, value) { send({ c: CMD.TOGGLE, key, value }); },
    
    
    
    
    onAudioLevel(bus, value) { audio.setLevel(bus, value); },
    
    
    
    onFactionColours(custom) { if (view) view.setFactionColours(custom); },
    
    
    
    
    
    onJumpCamera(xMm, yMm) { view.centreOn(xMm, yMm); },
    onAttack() {
      send({ c: CMD.ATTACK, sector: -1, sel: selection });
      flashOrder(); audio.ui('order');
      if (voices) voices.ordered(match, SEAT, 'attack');
    },
    onCapture() {
      send({ c: CMD.CAPTURE, sector: -1, sel: selection });
      flashOrder(); audio.ui('order');
      if (voices) voices.ordered(match, SEAT, 'move');
    },
  });
  
  
  
  
  hud.setSelection(selection);

  
  
  
  
  
  
  
  
  
  
  
  
  
  voices = createVoices(audio, hud);
  voices.matchStart(match);

  if (!input) {
    input = createInput(canvas, view, {
      select(sel) {
        if (sel.kind === 'view') {
          
          
          
          
          sel = { kind: 'ids', ids: unitsOnScreen() };
        }
        selection = sel;
        hud.setSelection(sel);
      },
      command(cmd) {
        if (!match) return;
        if (cmd.c === CMD.BUILD) {
          send({ c: CMD.BUILD, building: cmd.building, sector: sectorAt(match.w.map, cmd.at.x, cmd.at.y) });
          return;
        }
        send({ ...cmd, sel: selection });
        if (cmd.c === CMD.ATTACK || cmd.c === CMD.CAPTURE) flashOrder();
      },
      buildArmed(id) { $('buildbar').classList.toggle('armed', !!id); },
      cursor() {  },
      paint() {  },
      paintDone(cx, cy, r) {
        const world = view.pick(cx * window.innerWidth, cy * window.innerHeight);
        if (!world) return;
        const radius = Math.max(20000, r * 300);
        selection = {
          kind: 'box',
          x0: world.x - radius, x1: world.x + radius,
          y0: world.y - radius, y1: world.y + radius,
        };
        hud.setSelection(selection);
      },
      toggleQuick() { $('quick').classList.toggle('open'); },
      jumpToAction() {
        if (match && match.lastOrderSector >= 0) {
          const s = match.w.sectors[match.lastOrderSector];
          view.centreOn(s.cx, s.cy);
        }
      },
      cycleGroup() {  },
    });
  }
}











function startNet() {
  if (net) return net;
  net = createNet({
    onRoom(v) { lobbyUi.room(v); },
    onStatus(text) { lobbyUi.say(text); },
    onError(text) { lobbyUi.say(text); },
    
    
    
    onStart(info) {
      lobbyUi.close();
      start(null, info);
    },
  });
  return net;
}

lobbyUi = createLobbyPanel({
  onHost(mapId) { startNet().host(mapId); },
  onJoin(code) {
    const outcome = startNet().join(code);
    
    
    
    
    if (outcome && outcome.error) lobbyUi.say(outcome.error);
  },
  onFaction(faction) { if (net) net.chooseFaction(faction); },
  onReady(ready) { if (net) net.setReady(ready); },
  onMap(mapId) { if (net) net.chooseMap(mapId); },
  onStart() { if (net) net.start(); },
  onLeave() {
    if (net) net.leave();
    net = null;
    lobbyUi.room(null);
  },
  onBack() {
    lobbyUi.close();
    $('menu').classList.add('show');
  },
  listRooms: () => openRooms(net && net.id),
});

$('btn-multi').addEventListener('click', () => {
  
  
  
  
  if (!audio) audio = createAudio();
  $('menu').classList.remove('show');
  lobbyUi.open();
  if (!canPlayTogether()) {
    
    
    lobbyUi.say('Multiplayer needs PeerJS and it did not load. Check the network and reload.');
  }
});

$('btn-build').addEventListener('click', () => $('buildbar').classList.toggle('open'));


function unitsOnScreen() {
  const ids = [];
  const w = match.w;
  for (let i = 0; i < w.u.count; i += 1) {
    if (!w.u.alive[i] || w.u.owner[i] !== SEAT) continue;
    
    
    
    const dx = Math.abs(w.u.x[i] / 1000 - view.view.x);
    const dy = Math.abs(w.u.y[i] / 1000 - view.view.y);
    if (dx < view.view.span * 1.4 && dy < view.view.span * 1.4) ids.push(w.u.id[i]);
  }
  return ids;
}










function animateEndCard() {
  
  
  
  
  const rows = [...$('endcard').querySelectorAll('b[data-final]')];
  if (reduceMotion) return;
  
  
  const bars = [...$('end-score').children];
  const finals = bars.map((b) => b.style.flex);
  bars.forEach((b) => { b.style.flex = '1 1 0'; });
  requestAnimationFrame(() => requestAnimationFrame(() => bars.forEach((b, i) => { b.style.flex = finals[i]; })));
  const t0 = performance.now();
  const per = 110;
  const dur = 700;
  for (const b of rows) b.textContent = '';
  const tick = (now) => {
    let live = false;
    rows.forEach((b, i) => {
      const finalText = b.dataset.final;
      const m = finalText.match(/^([+-]?)(\d+)(.*)$/s);
      const start = t0 + 250 + i * per;
      const p = Math.max(0, Math.min(1, (now - start) / dur));
      if (p < 1) live = true;
      if (!m) { b.textContent = p > 0 ? finalText : ''; b.style.opacity = String(p); return; }
      const n = Math.round(Number(m[2]) * (1 - (1 - p) * (1 - p)));
      b.textContent = p > 0 ? `${m[1]}${n}${m[3]}` : '';
    });
    if (live) requestAnimationFrame(tick);
    else rows.forEach((b) => { b.textContent = b.dataset.final; b.style.opacity = ''; });
  };
  requestAnimationFrame(tick);
}

function showEnd() {
  ended = true;
  const order = placings(match);
  const total = match.score[0] + match.score[1];
  const st = match.stats[SEAT];
  const points = matchPoints({
    score: match.score[SEAT],
    totalScore: total,
    placement: order.indexOf(SEAT) + 1,
    sectorsCaptured: st.sectorsCaptured,
    waterHoldTicks: st.waterHoldTicks,
    lowestSharePct: st.lowestSharePct,
  });
  const drawn = match.winner < 0;
  const won = match.winner === SEAT;

  
  
  
  
  
  $('end-title').textContent = drawn
    ? 'Level. Neither side gave ground.'
    : (won
      ? (match.endReason === 'rout' ? 'A rout. The map is yours.' : 'You held the most ground.')
      : (match.endReason === 'rout' ? 'Routed.' : 'They held more ground.'));

  let bars = '';
  for (let p = 0; p < match.playerCount; p += 1) {
    const share = total > 0 ? Math.round((match.score[p] * 100) / total) : 50;
    bars += `<i style="flex:${Math.max(4, share)} 1 0;background:${
      match.factions[p] === HERD ? 'var(--herd)' : 'var(--yield)'}"></i>`;
  }
  $('end-score').innerHTML = bars;

  const rows = [
    ['Land held', `${landSeconds(match.score[SEAT])} pts`],
    ['Share of the map', `${sharePct(match.w.sectors, SEAT)}%`],
    ['Ground taken', st.sectorsCaptured],
    ['Water held', `${Math.floor(st.waterHoldTicks / TICKS_PER_SECOND)}s`],
    [match.factions[SEAT] === HERD ? 'Farms unmade' : 'Stock recovered',
      match.factions[SEAT] === HERD ? st.farmsUnmade : st.stockRecovered],
    ['Match points', points],
  ];

  
  
  
  const banked = recordMatch({ points, won, score: match.score[SEAT] });
  rows.push(['Experience', `+${banked.gained}`]);
  rows.push(['Level', banked.levelledUp
    ? `${banked.profile.level} - levelled up`
    : `${banked.profile.level} (${Math.round(levelProgress(banked.profile) * 100)}% to next)`]);
  rows.push(['Rank', rankTitle(banked.profile.level, match.factions[SEAT])]);
  rows.push(['Played', `${banked.profile.won} won of ${banked.profile.played}`]);

  
  clearSave();
  
  
  
  
  
  const card = $('endcard');
  card.classList.toggle('won', won && !drawn);
  card.classList.toggle('lost', !won && !drawn);
  card.classList.toggle('drawn', drawn);
  const mm = $('minimap');
  const em = $('end-map');
  if (mm && em && mm.width > 0) {
    em.width = mm.width; em.height = mm.height;
    em.getContext('2d').drawImage(mm, 0, 0);
  }
  
  
  
  
  
  
  const landPts = `${landSeconds(match.score[SEAT])}`;
  const land = $('end-land');
  land.dataset.final = landPts;
  land.textContent = landPts;
  $('end-stats').innerHTML = rows.map(([k, v], i) => `<div style="--i:${i}"${k === 'Land held' ? ' class="promoted"' : ''}>${k}<b data-final="${String(v).replace(/"/g, '&quot;')}">${v}</b></div>`).join('');
  $('endcard').classList.add('show');
  animateEndCard();
  if (audio) audio.matchOver(won);
  if (voices) voices.matchOver(match, won, match.endReason === 'rout');
}




















function maybeAutosave() {
  if (!match || match.over) return;
  
  
  if (netMatch) return;
  if (match.w.tick - lastSavedTick < 10 * TICKS_PER_SECOND) return;
  lastSavedTick = match.w.tick;
  storeSave(saveMatch(match), {
    faction: match.factions[SEAT],
    mapId: match.w.map.id,
    tick: match.w.tick,
    share: sharePct(match.w.sectors, SEAT),
  });
}





let acc = 0;
let last = performance.now();


const interp = createInterp(MAX_UNITS);
let snapped = false;
let alphaOverride = null;

















const PERF_RING = 120;
const perfRing = new Float32Array(PERF_RING);
const perfGap = new Float32Array(PERF_RING);
let perfN = 0;
function quantiles(ring, n) {
  const s = Array.from(ring.subarray(0, n)).sort((a, b) => a - b);
  return {
    median: s[Math.floor((n - 1) * 0.5)],
    p95: s[Math.floor((n - 1) * 0.95)],
    mean: s.reduce((t, v) => t + v, 0) / n,
  };
}
function perfStats() {
  const n = Math.min(perfN, PERF_RING);
  if (n === 0) return { n: 0, median: 0, p95: 0, mean: 0, interval: { median: 0, p95: 0, mean: 0 } };
  return { n, ...quantiles(perfRing, n), interval: quantiles(perfGap, n) };
}

function loop(now) {
  requestAnimationFrame(loop);
  const t0 = performance.now();
  const dt = Math.min(250, now - last);
  last = now;
  
  
  
  
  if (!match && backdrop && view) { stepBackdrop(now, dt); return; }
  if (!match || !hud || !view || !audio) return;
  input.tick(dt);

  if (!paused && !match.over) {
    acc += dt;
    
    
    
    let budget = 10;
    
    
    
    
    if (acc >= MS_PER_TICK) interp.snapshot(match.w);
    snapped = false;
    if (netMatch) {
      
      
      
      
      
      let want = 0;
      while (acc >= MS_PER_TICK && want < budget) { acc -= MS_PER_TICK; want += 1; }
      if (want >= budget) { acc = 0; snapped = true; }
      
      
      
      if (want > 0) netMatch.step(want, now);
      
      
      
      if (stallShown && netMatch.stalledSeats.length === 0) clearStall();
    } else {
      while (acc >= MS_PER_TICK && budget > 0) {
        acc -= MS_PER_TICK;
        budget -= 1;
        handleEvents(stepMatch(match, applyCommand));
      }
      if (budget === 0) { acc = 0; snapped = true; }
    }
    hud.update(match, now, view);
    
    
    audio.update(match, SEAT, view.view);

    maybeAutosave();
  }
  if (match.over && !ended) showEnd();
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  view.setSelection(resolveSelection(match, SEAT, selection));
  
  
  const alpha = alphaOverride === null ? alphaOf(acc, MS_PER_TICK, snapped) : alphaOverride;
  view.frame(match, SEAT, now, alpha);
  perfRing[perfN % PERF_RING] = performance.now() - t0;
  perfGap[perfN % PERF_RING] = dt;
  perfN += 1;
  
  
  
  
  
  if (!quality.decided) {
    if (quality.firstFrameAt < 0) quality.firstFrameAt = now;
    const d = decideTier(perfGap, Math.min(perfN, PERF_RING), now - quality.firstFrameAt);
    if (d) {
      quality.decided = true;
      quality.tier = view.setQuality(d.tier);
      quality.median = d.median;
    }
  }
}


const quality = { decided: false, tier: 'high', median: 0, firstFrameAt: -1 };

























const TRACE_FIELD_TICKS = 400;
const trace = { on: false, sums: [], fields: new Map() };

function recordTrace() {
  if (!trace.on || !match) return;
  const t = match.w.tick;
  trace.sums.push([t, matchChecksum(match)]);
  trace.fields.set(t, checksumFields(match));
  if (trace.fields.size > TRACE_FIELD_TICKS) {
    trace.fields.delete(trace.fields.keys().next().value);
  }
}

window.__fu = {
  get match() { return match; },
  get view() { return view; },
  
  
  
  
  
  get gfx() { return view ? view.gfx : null; },
  get tick() { return match ? match.w.tick : -1; },
  
  get backdrop() { return backdrop ? { tick: backdrop.m.w.tick, over: backdrop.m.over } : null; },
  get score() { return match ? [...match.score] : []; },
  get over() { return !!(match && match.over); },
  
  
  
  get audio() { return audio ? audio.debug : null; },
  get voices() { return voices ? voices.state : null; },
  
  
  
  
  
  get net() {
    if (!net) return null;
    return {
      id: net.id, hosting: net.hosting, started: net.started, view: net.view,
    };
  },
  get lockstep() {
    if (!netMatch) return null;
    return {
      seat: SEAT,
      observing,
      tick: match ? match.w.tick : -1,
      
      
      
      checksum: match ? matchChecksum(match) : 0,
      stalled: netMatch.stalledSeats,
      resyncs: netMatch.resyncs,
      lastDesync: netMatch.lockstep.lastDesync,
      peers: netMatch.lockstep.peers,
      dropped: netMatch.lockstep.dropped,
    };
  },
  debug: {
    start,
    







    trace: {
      arm() { trace.on = true; trace.sums.length = 0; trace.fields.clear(); return true; },
      disarm() { trace.on = false; return true; },
      get sums() { return trace.sums; },
      fieldsAt(t) { return trace.fields.get(t) || null; },
      get span() {
        const k = [...trace.fields.keys()];
        return { rows: trace.sums.length, from: k[0] ?? -1, to: k[k.length - 1] ?? -1 };
      },
    },
    lobby: {
      open() { $('btn-multi').click(); },
      host(mapId) { lobbyUi.open(); startNet().host(mapId); },
      join(code) { lobbyUi.open(); return startNet().join(code); },
      faction(f) { return net.chooseFaction(f); },
      ready(r) { return net.setReady(r); },
      go() { return net.start(); },
      rooms: () => openRooms(net && net.id),
    },
    started() { return !!match; },
    pause(on) { paused = !!on; },
    
    perf: perfStats,
    perfReset() { perfN = 0; return true; },
    
    get quality() {
      return { ...quality, applied: view ? view.quality : null };
    },
    
    setQuality(tier) { quality.decided = true; quality.tier = view ? view.setQuality(tier) : tier; return quality.tier; },
    
    
    
    step(n = 1) {
      interp.snapshot(match.w);
      
      
      
      
      for (let i = 0; i < n; i += 1) handleEvents(stepMatch(match, applyCommand));
    },
    setAlpha(a) { alphaOverride = (a === null || a === undefined) ? null : Math.max(0, Math.min(1, a)); return alphaOverride; },
    input() { return input ? input.state : null; },
    runTo(tick) {
      while (match.w.tick < Math.min(tick, MATCH_TICKS) && !match.over) {
        stepMatch(match, applyCommand);
      }
      interp.settle(match.w);
      hud.update(match, performance.now(), view);
      
      
      
      maybeAutosave();
    },
    select(sel) { selection = sel; hud.setSelection(sel); },
    get selection() { return selection; },
    selectionSize() { return resolveSelection(match, SEAT, selection).length; },
    send,
    showEnd,
  },
};

requestAnimationFrame(loop);






for (const id of ['top', 'dock']) {
  const host = $(id);
  if (host) {
    host.addEventListener('pointerdown', (e) => {
      if (e.target && e.target.closest && e.target.closest('button, .chip, select, input[type=range]')) audio.ui('touch');
    });
  }
}



if (params.get('autostart') === '1') start();
else startBackdrop();




const linkRoom = joinIdFrom(location.href);
if (linkRoom) {
  $('menu').classList.remove('show');
  lobbyUi.open();
  const outcome = startNet().join(linkRoom);
  if (outcome && outcome.error) lobbyUi.say(outcome.error);
}
