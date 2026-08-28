
















import { formatTime, ordinal } from 'arbelo/raceProgress';
import { drawItemIcon } from '../render/itemMesh.js';
import { DRIFT_TIER_COLOURS, hex, PALETTE } from '../palette.js';

export function createHud(root) {
  const el = {
    position: root.querySelector('#hud-position'),
    positionSuffix: root.querySelector('#hud-position-suffix'),
    positionOf: root.querySelector('#hud-position-of'),
    lap: root.querySelector('#hud-lap'),
    lapTotal: root.querySelector('#hud-lap-total'),
    
    
    
    
    score: root.querySelector('#hud-score'),
    clock: root.querySelector('#hud-clock'),
    lastLap: root.querySelector('#hud-lastlap'),
    bestLap: root.querySelector('#hud-bestlap'),
    speed: root.querySelector('#hud-speed'),
    itemCanvas: root.querySelector('#hud-item-canvas'),
    itemSlot: root.querySelector('#hud-item'),
    itemCount: root.querySelector('#hud-item-count'),
    banner: root.querySelector('#hud-banner'),
    wrongWay: root.querySelector('#hud-wrongway'),
    boostRing: root.querySelector('#hud-boost-ring'),
    standings: root.querySelector('#hud-standings'),
  };
  const ctx = el.itemCanvas ? el.itemCanvas.getContext('2d') : null;
  return {
    el,
    ctx,
    lastItem: undefined,
    lastPosition: null,
    lastLap: null,
    lastScore: null,
    bannerUntil: 0,
    _standingsHtml: '',
  };
}










export function updateHud(hud, view) {
  const el = hud.el;

  if (view.position !== hud.lastPosition) {
    const previous = hud.lastPosition;
    hud.lastPosition = view.position;
    if (el.position) el.position.textContent = String(view.position);
    if (el.positionSuffix) el.positionSuffix.textContent = ordinal(view.position).replace(String(view.position), '');
    
    
    
    
    if (el.position && previous != null) {
      el.position.classList.remove('bump', 'gained', 'lost');
      void el.position.offsetWidth;
      el.position.classList.add('bump', view.position < previous ? 'gained' : 'lost');
    }
  }
  if (el.positionOf && view.fieldSize) {
    const of = `OF ${view.fieldSize}`;
    if (el.positionOf.textContent !== of) el.positionOf.textContent = of;
  }
  const lapShown = Math.min(view.lap + 1, view.laps);
  if (lapShown !== hud.lastLap) {
    hud.lastLap = lapShown;
    if (el.lap) el.lap.textContent = String(lapShown);
    if (el.lapTotal) el.lapTotal.textContent = String(view.laps);
  }
  
  
  
  
  
  
  
  
  
  
  
  
  
  if (el.score && view.lapScore !== hud.lastScore) {
    hud.lastScore = view.lapScore;
    el.score.textContent = String(Math.max(0, Math.floor(Number(view.lapScore) || 0)));
  }
  if (el.clock) el.clock.textContent = formatTime(view.time);
  if (el.lastLap) el.lastLap.textContent = view.lastLapTime != null ? formatTime(view.lastLapTime) : '--:--.--';
  if (el.bestLap) el.bestLap.textContent = view.bestLap != null ? formatTime(view.bestLap) : '--:--.--';
  if (el.speed) el.speed.textContent = String(Math.round(Math.max(0, view.speed) * 3.6));

  
  
  if (hud.ctx && view.item !== hud.lastItem) {
    hud.lastItem = view.item;
    const size = hud.el.itemCanvas.width;
    if (view.item) drawItemIcon(hud.ctx, view.item, size);
    else hud.ctx.clearRect(0, 0, size, size);
  }
  if (el.itemCount) {
    const show = view.itemUses > 1 ? `x${view.itemUses}` : '';
    if (el.itemCount.textContent !== show) el.itemCount.textContent = show;
  }
  if (el.itemSlot) {
    const empty = !view.item;
    el.itemSlot.classList.toggle('empty', empty);
    
    
    el.itemSlot.classList.toggle('rolling', !!view.itemRolling);
  }

  
  
  
  
  if (el.boostRing) {
    const tier = view.driftTier ?? 0;
    
    
    
    
    
    if (view.launch) {
      const { charge, zone } = view.launch;
      el.boostRing.style.opacity = charge > 0.02 ? '1' : '0';
      el.boostRing.style.borderColor = zone === 'over' ? hex(PALETTE.barnRed)
        : zone === 'good' ? hex(PALETTE.gold)
          : hex(PALETTE.ceiling);
      
      
      el.boostRing.style.transform = `scale(${1 + charge * 0.22})`;
    } else if (view.drifting) {
      el.boostRing.style.opacity = '1';
      el.boostRing.style.borderColor = hex(DRIFT_TIER_COLOURS[Math.min(3, tier)]);
      el.boostRing.style.transform = `scale(${1 + tier * 0.06})`;
    } else if (el.boostRing.style.opacity !== '0') {
      el.boostRing.style.opacity = '0';
      el.boostRing.style.transform = 'scale(1)';
    }
  }

  if (el.wrongWay) {
    const on = !!view.wrongWay;
    if (el.wrongWay.classList.contains('show') !== on) el.wrongWay.classList.toggle('show', on);
  }

  if (el.standings && view.standings) {
    const html = view.standings.map((r) => (
      `<li class="${r.isPlayer ? 'me' : ''}">`
      + `<span class="pos">${r.position}</span>`
      + `<span class="dot" style="background:${hex(r.tint)}"></span>`
      + `<span class="name">${r.name}</span>`
      + `<span class="gap">${r.gap}</span>`
      + '</li>'
    )).join('');
    if (html !== hud._standingsHtml) {
      hud._standingsHtml = html;
      el.standings.innerHTML = html;
    }
  }
}





export function showBanner(hud, text, { kind = 'info', seconds = 1.6 } = {}) {
  const el = hud.el.banner;
  if (!el) return;
  el.textContent = text;
  el.className = `banner show ${kind}`;
  hud.bannerUntil = performance.now() + seconds * 1000;
}

export function tickBanner(hud) {
  const el = hud.el.banner;
  if (!el) return;
  if (hud.bannerUntil && performance.now() > hud.bannerUntil) {
    el.className = 'banner';
    hud.bannerUntil = 0;
  }
}










export function gapText(metres) {
  if (metres == null) return '';
  const m = Math.abs(metres);
  if (m < 1) return '--';
  if (m > 999) return `${(m / 1000).toFixed(1)}km`;
  return `${Math.round(m)}m`;
}
