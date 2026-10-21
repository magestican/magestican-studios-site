


import { endingTier, intelPercent } from '../sim/intel.js';
import { reviewFor } from './review.js';


export function createTimesheet(root) {
  root.hidden = true;
  return {
    



    show(level, s, save, secretsTotal, { onReplay, onNext }) {
      const best = save.bestTimes[level.id - 1];
      const par = level.par;
      const underPar = par && !s.partial && s.time <= par;
      
      const review = level.id === 20 ? reviewFor(endingTier(save)) : null;
      root.innerHTML = `
        <div class="sheet" role="dialog" aria-label="Shift timesheet">
          <p class="sheet-k">Space 95 Survey Co. - Timesheet</p>
          <h2>Shift ${level.id}: ${level.name}</h2>
          <dl class="sheet-rows">
            <div><dt>Time on shift</dt><dd>${s.time.toFixed(1)} s</dd></div>
            ${par ? `<div><dt>Par</dt><dd>${par.toFixed(0)} s${underPar ? ' <span class="sheet-gold">under par!</span>' : ''}</dd></div>` : ''}
            ${best ? `<div><dt>Best</dt><dd>${best.toFixed(1)} s</dd></div>` : ''}
            <div><dt>Intel filed</dt><dd>${s.found.size} / ${secretsTotal}</dd></div>
            ${level.stamps ? `<div><dt>Callbacks</dt><dd>${s.stamped?.length ?? 0} / ${level.stamps.length}</dd></div>` : ''}
            <div><dt>Survey complete</dt><dd>${intelPercent(save).toFixed(1)} %</dd></div>
          </dl>
          ${review ? `<section class="sheet-review" aria-label="Performance review"><p class="sheet-k">HQ performance review</p><h3>${review.title}</h3><p>${review.line}</p></section>` : ''}
          <div class="sheet-actions">
            <button type="button" data-act="replay">Clock in again</button>
            ${onNext ? '<button type="button" data-act="next" class="is-primary">Next shift</button>' : ''}
          </div>
        </div>`;
      root.hidden = false;
      root.querySelector('[data-act="replay"]')?.addEventListener('click', () => {
        root.hidden = true;
        onReplay();
      });
      root.querySelector('[data-act="next"]')?.addEventListener('click', () => onNext?.());
      root.querySelector('button')?.focus();
    },
    hide() {
      root.hidden = true;
    },
  };
}
