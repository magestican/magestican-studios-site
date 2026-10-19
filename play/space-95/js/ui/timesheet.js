


import { intelPercent } from '../sim/intel.js';


export function createTimesheet(root) {
  root.hidden = true;
  return {
    



    show(level, s, save, secretsTotal, { onReplay, onNext }) {
      const best = save.bestTimes[level.id - 1];
      const par = level.par;
      const underPar = par && !s.partial && s.time <= par;
      root.innerHTML = `
        <div class="sheet" role="dialog" aria-label="Shift timesheet">
          <p class="sheet-k">Space 95 Survey Co. - Timesheet</p>
          <h2>Shift ${level.id}: ${level.name}</h2>
          <dl class="sheet-rows">
            <div><dt>Time on shift</dt><dd>${s.time.toFixed(1)} s</dd></div>
            ${par ? `<div><dt>Par</dt><dd>${par.toFixed(0)} s${underPar ? ' <span class="sheet-gold">under par!</span>' : ''}</dd></div>` : ''}
            ${best ? `<div><dt>Best</dt><dd>${best.toFixed(1)} s</dd></div>` : ''}
            <div><dt>Intel filed</dt><dd>${s.found.size} / ${secretsTotal}</dd></div>
            <div><dt>Survey complete</dt><dd>${intelPercent(save).toFixed(1)} %</dd></div>
          </dl>
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
