



import { loadLibrary, updateLibrary, defaultStorage } from '/web-engine/library/libraryStore.js';
import { setFav, favourites } from '/web-engine/library/libraryModel.js';
import { historyLine } from '/web-engine/library/shelves.js';
import { gameIdForPage } from '/web-engine/library/libraryIds.js';
import { localDayNumber } from '/web-engine/account/dayKey.js';

try {
  const storage = defaultStorage();
  const bar = document.querySelector('.play-bar[data-page]');
  const id = gameIdForPage(bar?.dataset.page);
  const str = (k) => document.querySelector(`#landing-strings [data-k="${k}"]`)?.textContent ?? '';
  const today = () => localDayNumber(Date.now());

  const line = document.querySelector('.your-line[data-page]');
  const h = id ? historyLine(loadLibrary(storage), id, today()) : null;
  if (line && h) {
    let when = '';
    try { when = new Intl.RelativeTimeFormat(document.documentElement.lang || 'en', { numeric: 'auto' }).format(-h.days, 'day'); } catch { when = ''; }
    const parts = [`${str('last')}: ${when}`];
    if (h.matches > 0) parts.push(`${h.matches} ${str('matches')}`);
    if (h.wins > 0) parts.push(`${h.wins} ${str('wins')}`);
    line.textContent = parts.join(' · ');
    line.hidden = false;
  }

  const heart = bar?.querySelector('.heart');
  if (heart && id) {
    const paint = () => heart.setAttribute('aria-pressed', String(favourites(loadLibrary(storage)).includes(id)));
    paint();
    heart.hidden = false;
    heart.addEventListener('click', () => {
      const on = heart.getAttribute('aria-pressed') !== 'true';
      updateLibrary(storage, (l) => setFav(l, id, on, today()));
      paint();
      
      try {
        const p = JSON.parse(localStorage.getItem('arbelo.account.v1') || 'null');
        if (p && p.uid) import('/web-engine/account/account.js').then((m) => m.syncLibrarySoon()).catch(() => {});
      } catch {  }
    });
  }
} catch {  }
