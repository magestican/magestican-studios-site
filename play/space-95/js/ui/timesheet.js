


import { endingTier, intelPercent } from '../sim/intel.js';
import { reviewFor } from './review.js';


export function createTimesheet(root) {
  root.hidden = true;
  return {
    



    show(level, s, save, secretsTotal, { onReplay, onNext, onTitle, news = null }) {
      
      const newsHtml = news
        ? `${news.newBest ? '<p class="sheet-news-best sheet-gold">New best time!</p>' : ''}${news.prizes
            .map(
              (p) =>
                `<p class="sheet-news-row sheet-prize"><span class="sheet-k">New prize</span><strong>${p.name}</strong><span>${p.desc}</span></p>`,
            )
            .join(
              '',
            )}${news.goal ? `<p class="sheet-news-row"><span class="sheet-k">Next goal</span><strong>${news.goal.text}</strong></p>` : ''}`
        : '';
      const best = save.bestTimes[level.id - 1];
      const par = level.par;
      const underPar = par && !s.partial && s.clearTime <= par;
      
      const review = level.id === 20 ? reviewFor(endingTier(save)) : null;
      root.innerHTML = `
        <div class="sheet" role="dialog" aria-label="Shift timesheet">
          <p class="sheet-k">Space 95 Survey Co. - Timesheet</p>
          <h2>Shift ${level.id}: ${level.name}</h2>
          <dl class="sheet-rows">
            <div><dt>Time on shift</dt><dd>${s.clearTime.toFixed(1)} s</dd></div>
            ${par ? `<div><dt>Par</dt><dd>${par.toFixed(0)} s${underPar ? ' <span class="sheet-gold">under par!</span>' : ''}</dd></div>` : ''}
            ${best ? `<div><dt>Best</dt><dd>${best.toFixed(1)} s</dd></div>` : ''}
            <div><dt>Intel filed</dt><dd>${s.found.size} / ${secretsTotal}</dd></div>
            ${level.stamps ? `<div><dt>Callbacks</dt><dd>${s.stamped?.length ?? 0} / ${level.stamps.length}</dd></div>` : ''}
            <div><dt>Survey complete</dt><dd>${intelPercent(save).toFixed(1)} %</dd></div>
          </dl>
          ${newsHtml ? `<section class="sheet-news" aria-label="This shift">${newsHtml}</section>` : ''}
          ${review ? `<section class="sheet-review" aria-label="Performance review"><p class="sheet-k">HQ performance review</p><h3>${review.title}</h3><p>${review.line}</p></section>` : ''}
          <div class="sheet-actions">
            <button type="button" data-act="replay">Clock in again</button>
            ${onNext ? '<button type="button" data-act="next" class="is-primary">Next shift</button>' : ''}
            ${onTitle ? '<button type="button" data-act="title" class="is-primary">Back to title</button>' : ''}
          </div>
        </div>`;
      root.hidden = false;
      root.querySelector('[data-act="replay"]')?.addEventListener('click', () => {
        root.hidden = true;
        onReplay();
      });
      root.querySelector('[data-act="next"]')?.addEventListener('click', () => onNext?.());
      root.querySelector('[data-act="title"]')?.addEventListener('click', () => onTitle?.());
      root.querySelector('button')?.focus();
    },
    hide() {
      root.hidden = true;
    },
  };
}
