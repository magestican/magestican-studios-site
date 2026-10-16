




import { loadLibrary, defaultStorage, LIBRARY_EVENT } from '/web-engine/library/libraryStore.js';
import { yourGamesLists } from '/web-engine/library/shelves.js';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

try {
  const section = document.getElementById('your-games');
  const list = section?.querySelector('.your-games-list');
  const empty = section?.querySelector('.your-games-empty');
  const cat = JSON.parse(document.getElementById('portal-catalogue')?.textContent || '[]');
  const byId = new Map(cat.map((g) => [g.id, g]));
  let tab = 'recent';

  const draw = () => {
    const lists = yourGamesLists(loadLibrary(defaultStorage()), cat.map((g) => g.id));
    const rows = lists[tab] ?? [];
    list.innerHTML = rows.map(({ id, hours }) => {
      const g = byId.get(id);
      const sub = tab === 'most' && hours > 0 ? `<small>${hours} h</small>` : '';
      return `<a class="mini" href="${esc(g.playUrl)}"><img src="./${esc(g.cover960)}" width="160" height="90" loading="lazy" decoding="async" alt=""><span>${esc(g.name)}</span>${sub}</a>`;
    }).join('');
    empty.hidden = rows.length > 0;
  };

  if (section && list && cat.length) {
    section.hidden = false;
    section.querySelector('.your-games-tabs').addEventListener('click', (e) => {
      const b = e.target.closest('[data-tab]');
      if (!b) return;
      tab = b.dataset.tab;
      for (const t of section.querySelectorAll('[data-tab]')) t.setAttribute('aria-selected', String(t === b));
      draw();
    });
    window.addEventListener(LIBRARY_EVENT, draw);
    draw();
  }
} catch {  }
