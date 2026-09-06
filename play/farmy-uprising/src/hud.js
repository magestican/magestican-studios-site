





































import { UNITS, BUILDINGS, HERD } from '../../../web-engine/rts/roster.js';
import { TICKS_PER_SECOND, MATCH_TICKS } from '../../../web-engine/rts/fixed.js';
import { sharePct, landSeconds } from '../../../web-engine/rts/territory.js';
import { unitSpec, isGatherer, isArmy, STATE } from '../../../web-engine/rts/sim/world.js';
import { resolveSelection } from '../../../web-engine/rts/sim/commands.js';
import { whyCannotTrain } from '../../../web-engine/rts/sim/production.js';
import { loadAtlas } from './sprites.js';
import { loadBuildingAtlas } from './buildingSprites.js';
import { loadPortraits, portraitRow } from './portraits.js';
import { createMinimap } from './minimap.js';

const $ = (id) => document.getElementById(id);
const clock = (ticks) => {
  const left = Math.max(0, MATCH_TICKS - ticks);
  const s = Math.floor(left / TICKS_PER_SECOND);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};



















const ICON_FACING = 2;


const DOING = {
  [STATE.IDLE]: 'HOLDING',
  [STATE.MOVING]: 'ON THE MOVE',
  [STATE.ATTACKING]: 'FIGHTING',
  [STATE.GATHERING]: 'WORKING',
  [STATE.LOADING]: 'LOADING',
  [STATE.DEAD]: 'GONE',
};

export function createHud(match, seat, actions) {
  const el = {
    feed: $('feed'), water: $('water'), clock: $('clock'),
    bar: $('scorebar'), share: $('share'),
    rail: $('rail'), buildBar: $('buildbar'),
    ticker: $('ticker'), banner: $('banner'),
    quick: $('quick'), status: $('status'), minimap: $('minimap'),
    income: $('income'),
  };

  
  let selection = { kind: 'none', key: null };

  
  
  
  
  
  
  
  
  
  
  
  
  
  let atlas = null;
  let buildingAtlas = null;
  let portraits = null;
  const iconCache = new Map();

  loadAtlas().then((a) => {
    atlas = a;
    iconCache.clear();
    buildKey = '';          
    drawPortrait();
  }).catch(() => {  });

  
  
  
  
  
  
  
  
  
  loadBuildingAtlas().then((a) => {
    buildingAtlas = a;
    iconCache.clear();
    buildKey = '';
    drawPortrait();
  }).catch(() => {  });

  
  
  
  
  
  loadPortraits().then((p) => {
    portraits = p;
    drawPortrait();
  }).catch(() => {  });

  











  function iconFor(id, px) {
    const key = `${id}@${px}`;
    const hit = iconCache.get(key);
    if (hit) return hit;
    const c = document.createElement('canvas');
    c.width = px;
    c.height = px;
    const g = c.getContext('2d');
    const row = atlas && atlas.manifest.rows[id];
    const brow = buildingAtlas && buildingAtlas.manifest.rows[id];
    if (row) {
      const tile = atlas.manifest.tile;
      const facings = atlas.manifest.facings || 8;
      g.drawImage(atlas.image,
        Math.min(ICON_FACING, facings - 1) * tile, row.row * tile, tile, tile,
        0, 0, px, px);
    } else if (brow) {
      const tile = buildingAtlas.manifest.tile;
      g.drawImage(buildingAtlas.image, 0, brow.row * tile, tile, tile, 0, 0, px, px);
    } else {
      const spec = UNITS[id] || BUILDINGS[id];
      
      
      
      
      const words = spec ? String(spec.name).split(' ').filter(Boolean) : [];
      const initials = (words.length > 1
        ? words.map((wd) => wd[0]).join('')
        : String(words[0] || id).slice(0, 2)).slice(0, 3).toUpperCase();
      g.fillStyle = 'rgba(63,184,166,.10)';
      g.fillRect(0, 0, px, px);
      g.strokeStyle = spec && spec.faction === HERD ? '#79c04a' : '#b9c0c8';
      g.lineWidth = Math.max(1, px / 16);
      g.strokeRect(px * 0.16, px * 0.16, px * 0.68, px * 0.68);
      g.fillStyle = '#8ff2e0';
      g.font = `700 ${Math.round(px * 0.32)}px ui-monospace,Consolas,monospace`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(initials, px / 2, px / 2 + px * 0.02);
    }
    iconCache.set(key, c);
    return c;
  }

  










  let iconsDrawnWith = { units: false, buildings: false };
  function paintIcons(root) {
    for (const c of root.querySelectorAll('canvas[data-icon]')) {
      c.getContext('2d').drawImage(iconFor(c.dataset.icon, c.width), 0, 0);
    }
    iconsDrawnWith = { units: !!atlas, buildings: !!buildingAtlas };
  }

  
  
  
  
  
  
  
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

  
  
  
  
  
  
  
  
  
  
  
  
  
  let buildKey = '';

  function renderBuildBar(m) {
    const faction = m.factions[seat];
    const units = Object.keys(UNITS).filter((id) => UNITS[id].faction === faction).sort();
    const builds = Object.keys(BUILDINGS).filter((id) => BUILDINGS[id].faction === faction).sort();

    const trainWhy = units.map((id) => whyCannotTrain(m.w, m.banks, seat, id) || '');
    
    
    
    
    
    
    const bank = m.banks[seat].display();
    const buildWhy = builds.map((id) => {
      const spec = BUILDINGS[id];
      return bank.feed < spec.cost.feed || bank.water < (spec.cost.water || 0) ? 'cost' : '';
    });

    const key = `${units.join()}|${trainWhy.map((w) => (w ? 1 : 0)).join()}`
      + `|${builds.join()}|${buildWhy.map((w) => (w ? 1 : 0)).join()}`
      + `|${atlas ? 1 : 0}${buildingAtlas ? 1 : 0}`;
    if (key === buildKey) return;
    buildKey = key;

    
    
    
    
    
    
    
    
    const cost = (spec) => `${spec.cost.feed}${spec.cost.water ? `/${spec.cost.water}` : ''}`;
    let html = '<section class="bpanel buildpanel" data-label="TRAIN"><div class="buildrow">';
    units.forEach((id, i) => {
      const spec = UNITS[id];
      html += `<button class="bbtn${trainWhy[i] ? ' off' : ''}" data-train="${id}"`
        + ` title="${trainWhy[i] || spec.name}">`
        + `<canvas data-icon="${id}" width="64" height="64"></canvas>`
        + `<span>${spec.name}</span><b>${cost(spec)}</b></button>`;
    });
    html += '</div></section><section class="bpanel buildpanel" data-label="BUILD">'
      + '<div class="buildrow">';
    builds.forEach((id, i) => {
      const spec = BUILDINGS[id];
      html += `<button class="bbtn bld${buildWhy[i] ? ' off' : ''}" data-build="${id}"`
        + ` title="${spec.name}">`
        + `<canvas data-icon="${id}" width="64" height="64"></canvas>`
        + `<span>${spec.name}</span><b>${cost(spec)}</b></button>`;
    });
    html += '</div></section>';
    el.buildBar.innerHTML = html;
    paintIcons(el.buildBar);
    updateRowCues();
  }

  














  function updateRowCues() {
    for (const r of el.buildBar.querySelectorAll('.buildrow')) {
      const max = r.scrollWidth - r.clientWidth;
      r.classList.toggle('more-r', max > 1 && r.scrollLeft < max - 1);
      r.classList.toggle('more-l', max > 1 && r.scrollLeft > 1);
    }
  }

  
  
  
  
  el.buildBar.addEventListener('scroll', updateRowCues, true);
  window.addEventListener('resize', updateRowCues);

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const INCOME_WINDOW_TICKS = 3 * TICKS_PER_SECOND;
  let incomeMark = null;

  function renderIncome(m) {
    if (!el.income) return;
    const bank = m.banks[seat];
    const tick = m.w.tick;
    if (!incomeMark || tick < incomeMark.tick || tick - incomeMark.tick > INCOME_WINDOW_TICKS) {
      incomeMark = { tick, feed: bank.earnedFeed, water: bank.earnedWater, feedRate: 0, waterRate: 0 };
    }
    const dt = tick - incomeMark.tick;
    if (dt >= TICKS_PER_SECOND) {
      
      
      
      incomeMark.feedRate = ((bank.earnedFeed - incomeMark.feed) * TICKS_PER_SECOND) / (dt * 1000);
      incomeMark.waterRate = ((bank.earnedWater - incomeMark.water) * TICKS_PER_SECOND) / (dt * 1000);
    }
    const f = incomeMark.feedRate.toFixed(1);
    const w = incomeMark.waterRate.toFixed(1);
    const next = `<span class="f">FEED <b>+${f}</b>/s</span><span class="w">WATER <b>+${w}</b>/s</span>`;
    
    
    
    if (el.income.dataset.v !== next) {
      el.income.dataset.v = next;
      el.income.innerHTML = next;
    }
  }

  
  
  
  
  
  
  
  
  
  
  el.status.innerHTML = '<div class="st-head">'
    + '<canvas class="st-por" width="64" height="64"></canvas>'
    + '<div class="st-txt"><div class="st-name"></div><div class="st-doing"></div></div>'
    + '</div><div class="st-bar"><i style="width:100%"></i></div>'
    + '<div class="st-nums"></div>';
  const st = {
    por: el.status.querySelector('.st-por'),
    name: el.status.querySelector('.st-name'),
    doing: el.status.querySelector('.st-doing'),
    bar: el.status.querySelector('.st-bar'),
    fill: el.status.querySelector('.st-bar i'),
    nums: el.status.querySelector('.st-nums'),
  };
  let portraitId = null;

  












  function drawPortrait() {
    if (!portraitId || !st.por) return;
    const g = st.por.getContext('2d');
    const px = st.por.width;
    g.clearRect(0, 0, px, px);
    const row = portraits ? portraitRow(portraits.manifest, portraitId) : -1;
    if (row >= 0) {
      const tile = portraits.manifest.tile;
      g.drawImage(portraits.image, 0, row * tile, tile, tile, 0, 0, px, px);
      return;
    }
    g.drawImage(iconFor(portraitId, px), 0, 0);
  }

  









  function focusUnit(m) {
    const w = m.w;
    const rankOf = (i) => {
      if (w.u.state[i] === STATE.ATTACKING) return 3;
      if (w.u.state[i] === STATE.MOVING) return 2;
      if (w.u.state[i] === STATE.GATHERING) return 1;
      return 0;
    };
    let best = -1;
    let bestRank = -1;
    const picked = resolveSelection(m, seat, selection);
    if (picked.length) {
      for (const i of picked) {
        const r = rankOf(i);
        if (r > bestRank) { bestRank = r; best = i; }
      }
      return best;
    }
    for (let i = 0; i < w.u.count; i += 1) {
      if (!w.u.alive[i] || w.u.owner[i] !== seat) continue;
      const r = rankOf(i);
      if (r > bestRank) { bestRank = r; best = i; }
    }
    return best;
  }

  function renderStatus(m) {
    const i = focusUnit(m);
    if (i < 0) {
      st.name.textContent = 'NO FORCES';
      st.doing.textContent = 'TRAIN SOMETHING';
      st.nums.innerHTML = '';
      st.fill.style.width = '0%';
      return;
    }
    const w = m.w;
    const spec = unitSpec(w, i);
    if (portraitId !== spec.id) { portraitId = spec.id; drawPortrait(); }

    
    
    
    
    
    const total = Math.max(0, (w.u.members[i] - 1) * spec.hp + w.u.hp[i]);
    
    
    
    
    
    
    
    const max = Math.max(w.u.members[i], spec.packSize) * spec.hp;
    const pct = max > 0 ? Math.round((total * 100) / max) : 0;
    st.name.textContent = spec.name.toUpperCase();
    st.doing.textContent = DOING[w.u.state[i]] || 'HOLDING';
    st.fill.style.width = `${Math.max(0, Math.min(100, pct))}%`;
    st.bar.classList.toggle('low', pct < 40);
    st.nums.innerHTML = `<span>HP <b>${total}</b>/${max}</span>`
      + `<span>DMG <b>${spec.damage}</b></span>`
      + `<span>PACK <b>${w.u.members[i]}</b></span>`;
  }

  
  
  
  
  
  
  if (el.minimap && el.minimap.__fuMinimap) el.minimap.__fuMinimap.destroy();
  const minimap = el.minimap ? createMinimap({
    canvas: el.minimap,
    match,
    seat,
    onJump(xMm, yMm) {
      if (actions.onJumpCamera) actions.onJumpCamera(xMm, yMm);
    },
  }) : null;
  if (el.minimap) el.minimap.__fuMinimap = minimap;

  
















  let viewBridged = false;
  function viewFor(passed) {
    if (passed) return passed;
    viewBridged = true;
    return null;
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
    renderStatus(match);
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
  let lastStatus = 0;

  function update(m, now, view) {
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
    el.share.textContent = `${sharePct(m.w.sectors, seat)}% HELD  ·  ${landSeconds(m.score[seat])} PTS`;
    renderIncome(m);

    
    
    
    
    if (minimap) minimap.update(m, seat, viewFor(view));

    
    
    
    
    
    if (now - lastRail > 500) { lastRail = now; renderRail(m); }
    if (now - lastBuild > 500) { lastBuild = now; renderBuildBar(m); }
    if (now - lastStatus > 250) { lastStatus = now; renderStatus(m); }
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
  renderStatus(match);

  const api = {
    update,
    events,
    say,
    get selection() { return selection; },
    setSelection(s) { selection = s; renderStatus(match); },
    minimap,
    
    
    
    debug: {
      get viewBridged() { return viewBridged; },
      get atlasReady() { return !!atlas; },
      get buildingAtlasReady() { return !!buildingAtlas; },
      get portraitsReady() { return !!portraits; },
      
      get iconsDrawnWith() { return iconsDrawnWith; },
      get portraitId() { return portraitId; },
      get tile() { return atlas ? atlas.manifest.tile : 0; },
      get minimap() { return minimap ? minimap.debug : null; },
      get focusName() { return st.name.textContent; },
    },
  };

  
  
  
  
  
  
  
  
  
  if (typeof window !== 'undefined') {
    window.__fu = window.__fu || {};
    window.__fu.hud = api;
  }

  return api;
}
