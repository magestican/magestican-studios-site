


















import { UNITS, BUILDINGS, HERD } from '../../../web-engine/rts/roster.js';
import { TICKS_PER_SECOND, MATCH_TICKS } from '../../../web-engine/rts/fixed.js';
import { sharePct, landSeconds } from '../../../web-engine/rts/territory.js';
import { unitSpec, isGatherer, isArmy, STATE } from '../../../web-engine/rts/sim/world.js';
import { whyCannotTrain } from '../../../web-engine/rts/sim/production.js';
import { whyCannotBuild } from '../../../web-engine/rts/sim/buildings.js';

const $ = (id) => document.getElementById(id);
const clock = (ticks) => {
  const left = Math.max(0, MATCH_TICKS - ticks);
  const s = Math.floor(left / TICKS_PER_SECOND);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

export function createHud(match, seat, actions) {
  const el = {
    feed: $('feed'), water: $('water'), clock: $('clock'),
    bar: $('scorebar'), share: $('share'),
    rail: $('rail'), buildBar: $('buildbar'),
    ticker: $('ticker'), banner: $('banner'),
    quick: $('quick'),
  };

  
  let selection = { kind: 'none', key: null };

  
  
  
  
  
  
  
  function groupsFor(m) {
    const w = m.w;
    const byKind = new Map();
    for (let i = 0; i < w.u.count; i += 1) {
      if (!w.u.alive[i] || w.u.owner[i] !== seat) continue;
      const spec = unitSpec(w, i);
      let g = byKind.get(spec.id);
      if (!g) {
        g = { id: spec.id, name: spec.name, units: 0, members: 0, hurt: 0 };
        byKind.set(spec.id, g);
      }
      g.units += 1;
      g.members += w.u.members[i];
      if (w.u.members[i] < spec.packSize) g.hurt += 1;
    }
    
    return [...byKind.values()].sort((a, b) => a.id.localeCompare(b.id));
  }

  function renderRail(m) {
    const groups = groupsFor(m);
    const chips = [
      { key: 'all', label: 'ALL', n: groups.reduce((a, g) => a + g.units, 0) },
      { key: 'army', label: 'ARMY', n: countWhere(m, isArmy) },
      { key: 'gather', label: 'GATHER', n: countWhere(m, isGatherer) },
      { key: 'view', label: 'VIEW', n: -1 },
    ];
    let html = '';
    for (const c of chips) {
      const on = selection.kind === c.key ? ' on' : '';
      html += `<button class="chip${on}" data-kind="${c.key}">${c.label}`
        + `${c.n >= 0 ? `<b>${c.n}</b>` : ''}</button>`;
    }
    html += '<span class="railsep"></span>';
    for (const g of groups) {
      const on = selection.kind === 'group' && selection.key === g.id ? ' on' : '';
      
      
      
      html += `<button class="chip grp${on}" data-kind="group" data-id="${g.id}">`
        + `${g.name}<b>${g.members}</b>${g.hurt ? '<i class="hurt"></i>' : ''}</button>`;
    }
    el.rail.innerHTML = html;
  }

  function countWhere(m, pred) {
    const w = m.w;
    let n = 0;
    for (let i = 0; i < w.u.count; i += 1) {
      if (w.u.alive[i] && w.u.owner[i] === seat && pred(unitSpec(w, i))) n += 1;
    }
    return n;
  }

  
  function renderBuildBar(m) {
    const faction = m.factions[seat];
    const units = Object.keys(UNITS).filter((id) => UNITS[id].faction === faction).sort();
    const builds = Object.keys(BUILDINGS).filter((id) => BUILDINGS[id].faction === faction).sort();
    let html = '<div class="buildrow">';
    for (const id of units) {
      const why = whyCannotTrain(m.w, m.banks, seat, id);
      const spec = UNITS[id];
      html += `<button class="bbtn${why ? ' off' : ''}" data-train="${id}" title="${why || ''}">`
        + `${spec.name}<b>${spec.cost.feed}${spec.cost.water ? `/${spec.cost.water}` : ''}</b></button>`;
    }
    html += '</div><div class="buildrow">';
    for (const id of builds) {
      const spec = BUILDINGS[id];
      html += `<button class="bbtn bld" data-build="${id}">`
        + `${spec.name}<b>${spec.cost.feed}${spec.cost.water ? `/${spec.cost.water}` : ''}</b></button>`;
    }
    html += '</div>';
    el.buildBar.innerHTML = html;
  }

  
  
  
  
  
  
  
  const AUDIO_BUSES = [
    ['voice', 'Voices'],
    ['sfx', 'Effects'],
    ['music', 'Music'],
  ];
  const audioLevels = { music: 0.5, sfx: 0.75, voice: 1 };

  const TOGGLES = [
    ['autoRally', 'Auto-rally', 'new fighters walk to the front'],
    ['autoGather', 'Auto-gather', 'new workers find ground to work'],
    ['autoEngage', 'Auto-engage', 'idle fighters defend where they stand'],
    ['autoRetreat', 'Auto-retreat', 'broken packs pull back to a Haven'],
    ['autoRebuild', 'Auto-rebuild', 'walls and towers are replaced'],
  ];

  function renderQuick(m) {
    const a = m.automation[seat];
    let html = '<h3>Quick menu</h3>';
    for (const [key, label, why] of TOGGLES) {
      html += `<label class="tgl"><input type="checkbox" data-toggle="${key}"`
        + `${a[key] ? ' checked' : ''}><span>${label}</span><em>${why}</em></label>`;
    }
    
    
    
    
    
    html += '<h3>Sound</h3>';
    for (const [bus, label] of AUDIO_BUSES) {
      const v = Math.round((audioLevels[bus] ?? 1) * 100);
      html += `<label class="lvl"><span>${label}</span>`
        + `<input type="range" min="0" max="100" value="${v}" data-bus="${bus}">`
        + `<em data-busval="${bus}">${v}%</em></label>`;
    }
    el.quick.innerHTML = html;
  }

  
  el.rail.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    selection = { kind: b.dataset.kind, key: b.dataset.id || null };
    actions.onSelect(selection);
    renderRail(match);
  });

  el.buildBar.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.train) actions.onTrain(b.dataset.train);
    else if (b.dataset.build) actions.onBuildPick(b.dataset.build);
  });

  el.quick.addEventListener('change', (e) => {
    const t = e.target.dataset.toggle;
    if (t) actions.onToggle(t, e.target.checked);
  });

  
  
  
  el.quick.addEventListener('input', (e) => {
    const bus = e.target.dataset.bus;
    if (!bus) return;
    const v = Number(e.target.value) / 100;
    audioLevels[bus] = v;
    const out = el.quick.querySelector(`[data-busval="${bus}"]`);
    if (out) out.textContent = `${Math.round(v * 100)}%`;
    if (actions.onAudioLevel) actions.onAudioLevel(bus, v);
  });

  $('btn-attack').addEventListener('click', () => actions.onAttack());
  $('btn-capture').addEventListener('click', () => actions.onCapture());
  $('btn-quick').addEventListener('click', () => el.quick.classList.toggle('open'));

  
  
  
  
  
  const lines = [];
  function say(text) {
    lines.push(text);
    while (lines.length > 3) lines.shift();
    el.ticker.innerHTML = lines.map((l) => `<span>${l}</span>`).join('');
  }

  let lastRail = 0;
  let lastBuild = 0;

  function update(m, now) {
    const bank = m.banks[seat].display();
    el.feed.textContent = bank.feed;
    el.water.textContent = bank.water;
    el.clock.textContent = clock(m.w.tick);

    
    
    
    let total = 0;
    for (let p = 0; p < m.playerCount; p += 1) total += m.score[p];
    let html = '';
    for (let p = 0; p < m.playerCount; p += 1) {
      const w = total > 0 ? Math.round((m.score[p] * 100) / total) : (100 / m.playerCount);
      const cls = m.factions[p] === HERD ? 'herd' : 'yield';
      html += `<i class="${cls}${p === seat ? ' me' : ''}" style="width:${w}%"></i>`;
    }
    el.bar.innerHTML = html;
    el.share.textContent = `${sharePct(m.w.sectors, seat)}% held  ·  ${landSeconds(m.score[seat])} pts`;

    
    
    
    if (now - lastRail > 500) { lastRail = now; renderRail(m); }
    if (now - lastBuild > 500) { lastBuild = now; renderBuildBar(m); }
  }

  function events(evs, m) {
    for (const ev of evs) {
      if (ev.type === 'captured' && ev.to === seat) say('Ground taken.');
      else if (ev.type === 'lost' && ev.from === seat) say('We are losing ground.');
      else if (ev.type === 'faded' && ev.from === seat) say('Ground has gone quiet. It needs a Haven.');
      else if (ev.type === 'buildingDone' && ev.owner === seat) say(`${BUILDINGS[ev.building].name} is standing.`);
      else if (ev.type === 'stockRecovered' && ev.owner === seat) say('They have taken one of us away.');
      else if (ev.type === 'stockRecovered' && ev.by === seat) say('Stock recovered.');
      else if (ev.type === 'waterPolluted') say('The water is turning.');
      else if (ev.type === 'waterCleaned') say('The water is clearing.');
      else if (ev.type === 'matchOver') {
        el.banner.textContent = ev.winner === seat ? 'You held the most ground.' : 'They held more ground.';
        el.banner.classList.add('show');
      }
    }
  }

  renderQuick(match);
  renderRail(match);
  renderBuildBar(match);

  return { update, events, say, get selection() { return selection; }, setSelection(s) { selection = s; } };
}
