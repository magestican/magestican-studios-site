








import { v } from '../site/assetUrl.js';
import { reviewFor } from './review.js';

const PICTURE = {
  meets: 'assets/art/biome/ending/ending-meets/plate.webp',
  exceeds: 'assets/art/biome/ending/ending-exceeds/plate.webp',
  'employee-of-the-year': 'assets/art/biome/ending/ending-eoty/plate.webp',
};

const NO_TIER = {
  title: 'Ship repaired',
  line: "The ship is fixed. The survey isn't: the other shifts still need your timesheet before HQ can review you.",
};

export const ENDING_BEATS = { tick: 0.9, stamp: 1.6, picture: 2.6, review: 8 };
const SEEN = (tier) => `space95.ending.${tier ?? 'none'}`;


export const endingFor = (tier) => ({ picture: PICTURE[tier ?? 'meets'], review: reviewFor(tier) ?? NO_TIER });

function seen(tier) {
  try {
    return localStorage.getItem(SEEN(tier)) === '1';
  } catch {
    return false;
  }
}
function markSeen(tier) {
  try {
    localStorage.setItem(SEEN(tier), '1');
  } catch {
    
  }
}





export function createEnding(root, audio) {
  root.hidden = true;
  return {
    




    play(tier, checklist, onDone) {
      const { picture, review } = endingFor(tier);
      const skippable = seen(tier);
      const boxes = checklist
        .map(
          (label, i) =>
            `<li class="end-box${i < checklist.length - 1 ? ' is-ticked' : ''}" data-box="${i}"><span class="end-tick" aria-hidden="true"></span>${label}</li>`,
        )
        .join('');
      root.innerHTML = `
        <div class="end" role="dialog" aria-label="The end of the survey">
          <div class="end-picture" style="background-image:url('${v(picture)}')"></div>
          <section class="end-card end-stamp" aria-label="Launch checklist">
            <p class="sheet-k">Bolt's launch checklist</p>
            <ul class="end-boxes">${boxes}</ul>
            <p class="end-rubber" aria-hidden="true">SHIFT COMPLETE</p>
          </section>
          <section class="end-card end-review" aria-label="Performance review">
            <p class="sheet-k">HQ performance review</p>
            <h2>${review.title}</h2>
            <p>${review.line}</p>
            <div class="sheet-actions"><button type="button" class="is-primary" data-act="done">Continue</button></div>
          </section>
        </div>`;
      root.hidden = false;
      const end =  (root.querySelector('.end'));
      const timers = [];
      const at = (s, fn) => timers.push(setTimeout(fn, s * 1000));
      const showReview = () => {
        for (const t of timers) clearTimeout(t);
        end.classList.add('is-picture', 'is-review');
        markSeen(tier);
        root.querySelector('[data-act="done"]')?.focus();
      };
      at(ENDING_BEATS.tick, () => {
        root.querySelector(`[data-box="${checklist.length - 1}"]`)?.classList.add('is-ticked');
        audio.play('box_tick');
      });
      at(ENDING_BEATS.stamp, () => end.classList.add('is-stamped'));
      at(ENDING_BEATS.picture, () => {
        end.classList.add('is-picture');
        audio.musicFirst(['main-theme']);
      });
      at(ENDING_BEATS.review, showReview);
      const skip = (ev) => {
        if (end.classList.contains('is-review')) return;
        if (!skippable) return;
        ev.preventDefault();
        showReview();
      };
      end.addEventListener('pointerdown', skip);
      const onKey = (ev) => skip(ev);
      window.addEventListener('keydown', onKey);
      root.querySelector('[data-act="done"]')?.addEventListener('click', () => {
        window.removeEventListener('keydown', onKey);
        root.hidden = true;
        onDone();
      });
    },
  };
}
