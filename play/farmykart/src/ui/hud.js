
















import { formatTime, ordinal } from 'arbelo/raceProgress';
import { ITEMS } from 'arbelo/items';
import { drawItemIcon } from '../render/itemMesh.js';
import { DRIFT_TIER_COLOURS, hex, PALETTE } from '../palette.js';
import { drawGhostItemBox } from './emptyItemSlot.js';
import { rouletteFace } from './itemSpin.js';



















const ITEM_CANVAS_PX = 168;










const ROULETTE_FACES = [...new Set(Object.values(ITEMS).map((i) => i.icon))];

export function createHud(root) {
  const el = {
    position: root.querySelector('#hud-position'),
    positionSuffix: root.querySelector('#hud-position-suffix'),
    positionOf: root.querySelector('#hud-position-of'),
    lap: root.querySelector('#hud-lap'),
    lapTotal: root.querySelector('#hud-lap-total'),
    
    
    
    
    score: root.querySelector('#hud-score'),
    scoreSeal: root.querySelector('#hud-score-seal'),
    scoreGain: root.querySelector('#hud-score-gain'),
    timeCard: root.querySelector('#hud-timecard'),
    clockMain: root.querySelector('#hud-clock-main'),
    clockFrac: root.querySelector('#hud-clock-frac'),
    lapBar: root.querySelector('#hud-lapbar-fill'),
    lastLap: root.querySelector('#hud-lastlap'),
    bestLap: root.querySelector('#hud-bestlap'),
    delta: root.querySelector('#hud-delta'),
    speed: root.querySelector('#hud-speed'),
    itemCanvas: root.querySelector('#hud-item-canvas'),
    itemSlot: root.querySelector('#hud-item'),
    itemCount: root.querySelector('#hud-item-count'),
    banner: root.querySelector('#hud-banner'),
    wrongWay: root.querySelector('#hud-wrongway'),
    boostRing: root.querySelector('#hud-boost-ring'),
    standings: root.querySelector('#hud-standings'),
  };
  
  
  
  
  if (el.itemCanvas) {
    el.itemCanvas.width = ITEM_CANVAS_PX;
    el.itemCanvas.height = ITEM_CANVAS_PX;
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
  }
  const ctx = el.itemCanvas ? el.itemCanvas.getContext('2d') : null;
  return {
    el,
    ctx,
    
    
    
    lastItem: undefined,
    
    
    
    
    rollStartedAt: 0,
    lastPosition: null,
    lastLap: null,
    lastScore: null,
    
    
    
    lastClock: '',
    lastBest: null,
    prevBest: null,
    lastSplit: null,
    bestUntil: 0,
    bannerUntil: 0,
    _standingsHtml: '',
  };
}


function replay(el, className) {
  if (!el) return;
  el.classList.remove(className);
  
  
  
  
  void el.offsetWidth;
  el.classList.add(className);
}


function deltaText(seconds) {
  const sign = seconds > 0 ? '+' : '-';
  return `${sign}${Math.abs(seconds).toFixed(2)}`;
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
    const before = hud.lastScore;
    hud.lastScore = view.lapScore;
    const now = Math.max(0, Math.floor(Number(view.lapScore) || 0));
    el.score.textContent = String(now);
    
    
    
    
    
    
    
    if (before != null && now > before) {
      replay(el.scoreSeal, 'won');
      if (el.scoreGain) {
        el.scoreGain.textContent = `+${now - before}`;
        replay(el.scoreGain, 'fly');
      }
    }
  }
  
  
  
  
  
  
  
  
  const clock = formatTime(view.time);
  if (clock !== hud.lastClock) {
    hud.lastClock = clock;
    const dot = clock.lastIndexOf('.');
    if (el.clockMain) el.clockMain.textContent = dot < 0 ? clock : clock.slice(0, dot);
    if (el.clockFrac) el.clockFrac.textContent = dot < 0 ? '' : clock.slice(dot);
  }
  
  
  
  if (el.lapBar && view.raceFraction != null) {
    const pct = `${(Math.max(0, Math.min(1, view.raceFraction)) * 100).toFixed(1)}%`;
    if (el.lapBar.style.width !== pct) el.lapBar.style.width = pct;
  }
  if (el.lastLap) el.lastLap.textContent = view.lastLapTime != null ? formatTime(view.lastLapTime) : '--:--.--';
  if (el.bestLap) el.bestLap.textContent = view.bestLap != null ? formatTime(view.bestLap) : '--:--.--';

  
  
  
  
  
  
  
  
  
  
  
  
  if (view.bestLap !== hud.lastBest) {
    hud.prevBest = hud.lastBest;
    hud.lastBest = view.bestLap;
    if (el.timeCard && view.bestLap != null) {
      el.timeCard.classList.add('hasbest');
      
      
      if (hud.prevBest != null) {
        replay(el.timeCard, 'best');
        hud.bestUntil = performance.now() + 2600;
        if (el.delta) {
          el.delta.textContent = deltaText(view.bestLap - hud.prevBest);
          el.delta.className = 'delta up show';
          hud.lastSplit = null;
        }
      }
    }
  }
  if (el.timeCard && hud.bestUntil && performance.now() > hud.bestUntil) {
    hud.bestUntil = 0;
    el.timeCard.classList.remove('best');
    hud.lastSplit = null;
  }
  
  
  
  if (el.delta && !hud.bestUntil) {
    const gap = view.lastLapTime != null && view.bestLap != null
      ? view.lastLapTime - view.bestLap : null;
    const key = gap == null ? 'none' : gap.toFixed(2);
    if (key !== hud.lastSplit) {
      hud.lastSplit = key;
      if (gap == null) {
        el.delta.className = 'delta';
      } else if (gap < 0.005) {
        
        
        el.delta.textContent = 'BEST';
        el.delta.className = 'delta up show';
      } else {
        el.delta.textContent = deltaText(gap);
        el.delta.className = 'delta down show';
      }
    }
  }
  if (el.speed) el.speed.textContent = String(Math.round(Math.max(0, view.speed) * 3.6));

  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const rolling = !!view.itemRolling;
  if (rolling && !hud.rollStartedAt) hud.rollStartedAt = performance.now();
  if (!rolling) hud.rollStartedAt = 0;
  const face = rolling
    ? rouletteFace(performance.now() - hud.rollStartedAt, ROULETTE_FACES)
    : (view.item ?? null);
  if (hud.ctx) {
    const key = face ?? 'empty';
    if (key !== hud.lastItem) {
      hud.lastItem = key;
      const size = hud.el.itemCanvas.width;
      if (face) drawItemIcon(hud.ctx, face, size);
      else drawGhostItemBox(hud.ctx, size);
    }
  }
  if (el.itemCount) {
    const show = view.itemUses > 1 ? `x${view.itemUses}` : '';
    if (el.itemCount.textContent !== show) el.itemCount.textContent = show;
  }
  if (el.itemSlot) {
    
    
    
    
    const empty = !view.item && !rolling;
    el.itemSlot.classList.toggle('empty', empty);
    
    
    el.itemSlot.classList.toggle('rolling', rolling);
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
    
    
    
    
    
    const on = !!view.wrongWay || !!view.recovering;
    if (el.wrongWay.classList.contains('show') !== on) el.wrongWay.classList.toggle('show', on);
    if (on) {
      const text = view.recovering ? 'Turning you round' : 'Wrong way';
      if (el.wrongWay.textContent !== text) el.wrongWay.textContent = text;
      el.wrongWay.classList.toggle('rescuing', !!view.recovering);
    }
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
