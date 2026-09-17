
























import { nextStep } from 'moon/play/guide.mjs';
import { MARKER, arrived, distanceLabel, markerAt } from 'moon/play/marker.mjs';
import { TIP_SECONDS, loadSeen, markSeen, nextTip } from 'moon/play/tips.mjs';
import { centreBand } from 'moon/play/hudBudget.mjs';















export const GOAL_SECONDS = 9;















export const THINK_S = 0.25;

export function createGuideUi({ goal, markers, tip, placeOf, ndcOf, storage = null }) {
  const chev = document.createElement('div');
  chev.className = 'chev';
  chev.hidden = true;
  const arrow = document.createElement('div');
  arrow.className = 'arrow';
  
  
  
  arrow.textContent = String.fromCharCode(0x25B6);
  chev.append(arrow);
  markers.append(chev);

  let dismissed = null;
  let shownId = null;
  let step = null;      
  let thoughtAt = -1e9; 
  let thoughtOn = null; 
  let seen = loadSeen(storage);
  let tipShown = null;
  let tipUntil = 0;
  let lineId = null;   
  let lineLeft = 0;    
  const stats = { step: null, line: null, place: null, distanceM: null, chevron: false, tip: null, dismissals: 0, tipsSeen: [...seen] };

  
  
  const rethink = () => { thoughtAt = -1e9; };

  
  goal.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!shownId) return;
    dismissed = shownId;
    stats.dismissals += 1;
    draw(null, null, 0);
    rethink();
  });
  tip.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); hideTip(); });

  
  
  function say(step, dt, far = null) {
    if (!step) { lineId = null; lineLeft = 0; goal.hidden = true; stats.line = null; return; }
    if (step.id !== lineId) { lineId = step.id; lineLeft = GOAL_SECONDS; }
    if (lineLeft > 0) {
      
      
      
      
      const text = far === null ? step.text : `${step.text}  ${far}`;
      if (goal.textContent !== text) goal.textContent = text;
      goal.hidden = false;
      
      
      
      lineLeft -= Math.min(dt, 0.1);
      if (lineLeft <= 0) goal.hidden = true;
    }
    stats.line = goal.hidden ? null : lineId;
  }

  function draw(step, distanceM, dt) {
    shownId = step ? step.id : null;
    stats.step = step ? step.id : null;
    stats.place = step && step.place ? step.place.type : null;
    stats.distanceM = distanceM;
    say(step, dt, distanceM === null ? null : distanceLabel(distanceM));
    if (!step) { chev.hidden = true; stats.chevron = false; }
  }

  function hideTip() {
    tip.hidden = true;
    if (tipShown) {
      
      
      seen = markSeen(storage, seen, tipShown);
      stats.tipsSeen = [...seen];
      tipShown = null;
    }
  }

  








  function update({ world, t, planet, player, nowS, dt = 0, view, tipState }) {
    
    
    
    
    
    
    if (tipState && tipState.busy) {
      goal.hidden = true;
      chev.hidden = true;
      lineId = null;
      
      
      
      
      
      stats.line = null;
      stats.step = null;
      stats.place = null;
      stats.distanceM = null;
      stats.chevron = false;
      shownId = null;
      if (tipShown && nowS >= tipUntil) hideTip();
      return;
    }
    
    if (tipShown && nowS >= tipUntil) hideTip();
    if (!tipShown) {
      const next = nextTip(tipState, seen);
      if (next) {
        tipShown = next.id;
        tipUntil = nowS + TIP_SECONDS;
        tip.textContent = next.text;
        tip.hidden = false;
      }
    }
    stats.tip = tipShown;

    
    
    
    if (planet !== thoughtOn || nowS - thoughtAt >= THINK_S) {
      step = nextStep(world, t, { planet });
      thoughtAt = nowS;
      thoughtOn = planet;
      
      
      
      
      if (dismissed && (!step || step.id !== dismissed)) dismissed = null;
    }
    const shown = step && step.id === dismissed ? null : step;
    if (!shown) { draw(null, null, dt); return; }

    
    const point = shown.place ? placeOf(shown.place) : null;
    if (!point) { draw(shown, null, dt); chev.hidden = true; stats.chevron = false; return; }
    const metres = Math.hypot(point.x - player.x, point.z - player.z);
    draw(shown, metres, dt);
    if (arrived(metres)) { chev.hidden = true; stats.chevron = false; return; }
    const ndc = ndcOf(point.x, point.y, point.z);
    const m = markerAt({
      x: ndc.x, y: ndc.y, behind: ndc.behind,
      width: view.width, height: view.height, inset: MARKER.insetPx,
      
      
      band: centreBand({ w: view.width, h: view.height }),
      
      
      
      
      
      clearPx: 20,
    });
    
    
    if (m.onScreen) { chev.hidden = true; stats.chevron = false; return; }
    chev.hidden = false;
    chev.style.transform = `translate(${m.x}px, ${m.y}px) rotate(${m.angleRad}rad)`;
    stats.chevron = true;
  }

  return { update, hideTip, rethink, stats, get dismissed() { return dismissed; } };
}
