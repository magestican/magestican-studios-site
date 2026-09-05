















import { MAPS, MAP_IDS, DEFAULT_MAP } from '../../../web-engine/rts/maps/index.js';
import { HERD, YIELD } from '../../../web-engine/rts/roster.js';
import { MS_PER_TICK, MATCH_TICKS, TICKS_PER_SECOND } from '../../../web-engine/rts/fixed.js';
import { seedFromString } from '../../../web-engine/rts/rng.js';
import { landSeconds, sharePct } from '../../../web-engine/rts/territory.js';
import { matchPoints, xpFromMatch, rankTitle } from '../../../web-engine/rts/progression.js';
import { createMatch, stepMatch, placings } from '../../../web-engine/rts/sim/match.js';
import { makeBot, strengthFromLevel } from '../../../web-engine/rts/sim/botBrain.js';
import { applyCommand, resolveSelection, CMD } from '../../../web-engine/rts/sim/commands.js';
import { sectorAt } from '../../../web-engine/rts/maps/mapFormat.js';
import { createRenderer } from './render.js';
import { createHud } from './hud.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';

const params = new URLSearchParams(location.search);
const SEAT = 0;
const $ = (id) => document.getElementById(id);










let chosenFaction = params.get('faction') === 'yield' ? YIELD : HERD;

const mapSelect = $('pick-map');
for (const id of MAP_IDS) {
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

$('btn-play').addEventListener('click', () => { start(); });
$('btn-again').addEventListener('click', () => {
  $('endcard').classList.remove('show');
  $('menu').classList.add('show');
});





const canvas = $('game');
let match = null;
let view = null;
let hud = null;
let input = null;
let audio = null;
let selection = { kind: 'all', key: null };
let sequence = 0;
let paused = false;
let ended = false;


function send(cmd) {
  if (!match) return;
  const full = { ...cmd, p: SEAT, seq: sequence };
  sequence += 1;
  
  
  
  
  applyCommand(match, full);
}









function flashOrder() {
  if (!match || !(match.lastOrderSector >= 0)) return;
  const s = match.w.sectors[match.lastOrderSector];
  view.markOrder(s.cx, s.cy);
  hud.say(`Moving on ${s.kind === 'water' ? 'the water' : 'that ground'}.`);
}

async function start() {
  const level = Number($('pick-level').value) || 6;
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
    onSelect(sel) { selection = sel; },
    onTrain(unit) { send({ c: CMD.TRAIN, unit }); audio.ui('click'); },
    onBuildPick(building) { input.armBuild(building); hud.say(`Tap where the ${building} should go.`); },
    onToggle(key, value) { send({ c: CMD.TOGGLE, key, value }); },
    onAttack() { send({ c: CMD.ATTACK, sector: -1, sel: selection }); flashOrder(); audio.ui('order'); },
    onCapture() { send({ c: CMD.CAPTURE, sector: -1, sel: selection }); flashOrder(); audio.ui('order'); },
  });

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
  const won = match.winner === SEAT;
  const xp = xpFromMatch(points, won);

  $('end-title').textContent = won
    ? (match.endReason === 'rout' ? 'A rout. The map is yours.' : 'You held the most ground.')
    : (match.endReason === 'rout' ? 'Routed.' : 'They held more ground.');

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
    ['Experience', `+${xp}`],
    ['Rank', rankTitle(3, match.factions[SEAT])],
  ];
  $('end-stats').innerHTML = rows.map(([k, v]) => `<div>${k}<b>${v}</b></div>`).join('');
  $('endcard').classList.add('show');
  if (audio) audio.matchOver(won);
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
    while (acc >= MS_PER_TICK && budget > 0) {
      acc -= MS_PER_TICK;
      budget -= 1;
      const events = stepMatch(match, applyCommand);
      if (events.length) { hud.events(events, match); audio.events(events, match); }
    }
    if (budget === 0) acc = 0;
    hud.update(match, now);
    audio.update(match, SEAT);
  }
  if (match.over && !ended) showEnd();
  view.frame(match, SEAT, now);
}





window.__fu = {
  get match() { return match; },
  get view() { return view; },
  get tick() { return match ? match.w.tick : -1; },
  get score() { return match ? [...match.score] : []; },
  get over() { return !!(match && match.over); },
  debug: {
    start,
    started() { return !!match; },
    pause(on) { paused = !!on; },
    step(n = 1) { for (let i = 0; i < n; i += 1) stepMatch(match, applyCommand); },
    runTo(tick) {
      while (match.w.tick < Math.min(tick, MATCH_TICKS) && !match.over) {
        stepMatch(match, applyCommand);
      }
      hud.update(match, performance.now());
    },
    select(sel) { selection = sel; hud.setSelection(sel); },
    selectionSize() { return resolveSelection(match, SEAT, selection).length; },
    send,
    showEnd,
  },
};

requestAnimationFrame(loop);



if (params.get('autostart') === '1') start();
