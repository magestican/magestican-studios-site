















import { MAPS, PLAYABLE_MAP_IDS, DEFAULT_MAP } from '../../../web-engine/rts/maps/index.js';
import { HERD, YIELD } from '../../../web-engine/rts/roster.js';
import { MS_PER_TICK, MATCH_TICKS, TICKS_PER_SECOND } from '../../../web-engine/rts/fixed.js';
import { seedFromString } from '../../../web-engine/rts/rng.js';
import { landSeconds, sharePct } from '../../../web-engine/rts/territory.js';
import { matchPoints, rankTitle } from '../../../web-engine/rts/progression.js';
import { createMatch, stepMatch, placings } from '../../../web-engine/rts/sim/match.js';
import { checksum } from '../../../web-engine/rts/sim/world.js';
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
import { saveMatch, restoreMatch } from '../../../web-engine/rts/sim/save.js';
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

$('pick-faction').addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  chosenFaction = b.dataset.faction === 'yield' ? YIELD : HERD;
  for (const s of $('pick-faction').querySelectorAll('.side')) {
    s.classList.toggle('on', s.dataset.faction === chosenFaction);
  }
});

$('btn-play').addEventListener('click', () => { clearSave(); start(); });








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
$('btn-again').addEventListener('click', () => {
  $('endcard').classList.remove('show');
  $('menu').classList.add('show');
  
  
  
  offerResume();
});





const canvas = $('game');
let match = null;
let view = null;
let hud = null;
let input = null;
let audio = null;
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
  
  
  
  
  
  if (netMatch) {
    const packet = netMatch.issue(full);
    pendingFlash = packet.t;
    return;
  }
  applyCommand(match, full);
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
      onTick(events, tick) { handleEvents(events); tickFlash(tick); },
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

  if (!view) {
    view = await createRenderer(canvas, match, SEAT);
    window.addEventListener('resize', () => view.resize());
  } else {
    view.reset(match, SEAT);
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
  $('end-stats').innerHTML = rows.map(([k, v]) => `<div>${k}<b>${v}</b></div>`).join('');
  $('endcard').classList.add('show');
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

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(250, now - last);
  last = now;
  
  
  
  
  if (!match || !hud || !view || !audio) return;
  input.tick(dt);

  if (!paused && !match.over) {
    acc += dt;
    
    
    
    let budget = 10;
    if (netMatch) {
      
      
      
      
      
      let want = 0;
      while (acc >= MS_PER_TICK && want < budget) { acc -= MS_PER_TICK; want += 1; }
      if (want >= budget) acc = 0;
      
      
      
      if (want > 0) netMatch.step(want, now);
      
      
      
      if (stallShown && netMatch.stalledSeats.length === 0) clearStall();
    } else {
      while (acc >= MS_PER_TICK && budget > 0) {
        acc -= MS_PER_TICK;
        budget -= 1;
        handleEvents(stepMatch(match, applyCommand));
      }
      if (budget === 0) acc = 0;
    }
    hud.update(match, now, view);
    
    
    audio.update(match, SEAT, view.view);

    maybeAutosave();
  }
  if (match.over && !ended) showEnd();
  
  
  
  
  
  
  view.setSelection(selection.kind === 'all' ? null : resolveSelection(match, SEAT, selection));
  view.frame(match, SEAT, now);
}





window.__fu = {
  get match() { return match; },
  get view() { return view; },
  get tick() { return match ? match.w.tick : -1; },
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
      
      
      
      checksum: match ? checksum(match.w) >>> 0 : 0,
      stalled: netMatch.stalledSeats,
      resyncs: netMatch.resyncs,
      lastDesync: netMatch.lockstep.lastDesync,
      peers: netMatch.lockstep.peers,
      dropped: netMatch.lockstep.dropped,
    };
  },
  debug: {
    start,
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
    step(n = 1) { for (let i = 0; i < n; i += 1) stepMatch(match, applyCommand); },
    runTo(tick) {
      while (match.w.tick < Math.min(tick, MATCH_TICKS) && !match.over) {
        stepMatch(match, applyCommand);
      }
      hud.update(match, performance.now(), view);
      
      
      
      maybeAutosave();
    },
    select(sel) { selection = sel; hud.setSelection(sel); },
    selectionSize() { return resolveSelection(match, SEAT, selection).length; },
    send,
    showEnd,
  },
};

requestAnimationFrame(loop);



if (params.get('autostart') === '1') start();




const linkRoom = joinIdFrom(location.href);
if (linkRoom) {
  $('menu').classList.remove('show');
  lobbyUi.open();
  const outcome = startNet().join(linkRoom);
  if (outcome && outcome.error) lobbyUi.say(outcome.error);
}
