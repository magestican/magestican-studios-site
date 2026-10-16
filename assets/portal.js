








import { loadLibrary, updateLibrary, defaultStorage, LIBRARY_EVENT } from '/web-engine/library/libraryStore.js';
import { LIBRARY_KEY, setFav, favourites } from '/web-engine/library/libraryModel.js';
import { matches, shelvesFor } from '/web-engine/library/shelves.js';
import { localDayNumber } from '/web-engine/account/dayKey.js';





const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const storage = defaultStorage();
const today = () => localDayNumber(Date.now());
const str = (k) => $(`#portal-strings [data-k="${k}"]`)?.textContent ?? '';
const tiles = $$('.tile');
const byId = new Map(tiles.map((t) => [t.dataset.game, t]));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');


const rtf = (() => {
  try { return new Intl.RelativeTimeFormat(document.documentElement.lang || 'en', { numeric: 'auto' }); } catch { return null; }
})();
const ago = (days) => (rtf ? rtf.format(-days, 'day') : (days ? `${days}d` : str('today')));

const partsOf = (id) => {
  const t = byId.get(id);
  if (!t) return null;
  const img = t.querySelector('.game-art img');
  return {
    play: t.querySelector('a.art-play')?.getAttribute('href') ?? '#',
    
    src: (img?.getAttribute('srcset') ?? '').split(',')[0].trim().split(/\s+/)[0] || img?.getAttribute('src') || '',
    name: t.querySelector('h3')?.textContent?.trim() ?? '',
  };
};

function mini(id) {
  const p = partsOf(id);
  if (!p) return '';
  return `<a class="mini" href="${esc(p.play)}"><img src="${esc(p.src)}" width="160" height="90" loading="lazy" decoding="async" alt=""><span>${esc(p.name)}</span></a>`;
}

function renderShelves() {
  const box = $('#shelves');
  if (!box) return;
  const s = shelvesFor(loadLibrary(storage), [...byId.keys()], today());
  const out = [];
  if (s.cont) {
    const p = partsOf(s.cont.id);
    out.push(`<a class="continue" href="${esc(p.play)}"><img src="${esc(p.src)}" width="160" height="90" alt="">`
      + `<span class="continue-copy"><span class="continue-k">${esc(str('continue'))}</span><strong>${esc(p.name)}</strong>`
      + `<span class="continue-when">${esc(ago(s.cont.days))}</span></span>`
      + `<span class="cta cta-primary">${esc(str('resume'))}</span></a>`);
  }
  if (s.favs.length) out.push(`<h2 class="shelf-h">${esc(str('favourites'))}</h2><div class="rail">${s.favs.map(mini).join('')}</div>`);
  if (s.recent.length) out.push(`<h2 class="shelf-h">${esc(str('recent'))}</h2><div class="rail">${s.recent.map(mini).join('')}</div>`);
  box.innerHTML = out.join('');
  document.documentElement.classList.toggle('has-library', out.length > 0);
}

const favSet = () => new Set(favourites(loadLibrary(storage)));

function paintHearts() {
  const f = favSet();
  for (const t of tiles) {
    const b = t.querySelector('.heart');
    if (!b) continue;
    b.hidden = false;
    b.setAttribute('aria-pressed', String(f.has(t.dataset.game)));
  }
}

let chip = 'all';
function applyFilter() {
  const q = $('#game-search')?.value ?? '';
  const f = favSet();
  let shown = 0;
  for (const t of tiles) {
    const ok = matches({
      id: t.dataset.game, alt: t.dataset.name ?? '', text: t.textContent ?? '',
      chips: (t.dataset.chips ?? '').split(' '),
    }, q, chip, f);
    t.hidden = !ok;
    if (ok) shown += 1;
  }
  
  document.documentElement.classList.toggle('is-filtering', chip !== 'all' || q.trim() !== '');
  const nm = $('.no-match');
  if (nm) {
    nm.hidden = shown > 0;
    nm.textContent = chip === 'fav' ? str('favEmpty') : str('nomatch');
  }
}

function wireChips() {
  const row = $('.chips');
  if (row) {
    row.hidden = false;
    row.addEventListener('click', (e) => {
      const b = e.target.closest('.chip');
      if (!b) return;
      chip = b.dataset.chip;
      for (const c of $$('.chip', row)) c.setAttribute('aria-pressed', String(c === b));
      applyFilter();
      if (chip !== 'all') $('#games')?.scrollIntoView({ block: 'start' });
    });
  }
  const s = $('#game-search');
  if (s) {
    s.hidden = false;
    s.addEventListener('input', applyFilter);
  }
}



function syncSoon() {
  try {
    const p = JSON.parse(localStorage.getItem('arbelo.account.v1') || 'null');
    if (!p || !p.uid) return;
    import('/web-engine/account/account.js').then((m) => m.syncLibrarySoon()).catch(() => {});
  } catch {  }
}

function wireHearts() {
  document.addEventListener('click', (e) => {
    const b = e.target.closest('.tile .heart');
    if (!b) return;
    const id = b.closest('.tile').dataset.game;
    const on = b.getAttribute('aria-pressed') !== 'true';
    updateLibrary(storage, (l) => setFav(l, id, on, today()));
    syncSoon();
  });
}

function wireBanner() {
  const track = $('.feature-track');
  const dots = $('.feature-dots');
  if (!track || !dots) return;
  const slides = $$('.slide', track);
  if (slides.length < 2) return;
  dots.innerHTML = slides.map((s, i) => `<button type="button" data-i="${i}"><span class="vh">${i + 1}</span></button>`).join('');
  dots.hidden = false;
  let timer = null;
  const stop = () => { if (timer) clearInterval(timer); timer = null; };
  const go = (i) => track.scrollTo({ left: slides[i].offsetLeft - slides[0].offsetLeft, behavior: 'smooth' });
  const current = () => Math.round(track.scrollLeft / Math.max(1, slides[1].offsetLeft - slides[0].offsetLeft));
  const mark = () => {
    const i = current();
    $$('button', dots).forEach((b, j) => b.setAttribute('aria-current', String(j === i)));
  };
  dots.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b) { stop(); go(Number(b.dataset.i)); }
  });
  track.addEventListener('scroll', mark, { passive: true });
  mark();
  
  
  
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && track.scrollWidth > track.clientWidth + 4) {
    timer = setInterval(() => go((current() + 1) % slides.length), 7000);
    for (const ev of ['pointerdown', 'pointerenter', 'focusin', 'wheel', 'touchstart']) {
      track.addEventListener(ev, stop, { once: true, passive: true });
    }
  }
}

try {
  renderShelves();
  paintHearts();
  wireChips();
  wireHearts();
  wireBanner();
  window.addEventListener(LIBRARY_EVENT, () => { renderShelves(); paintHearts(); applyFilter(); });
  window.addEventListener('storage', (e) => {
    if (e.key === LIBRARY_KEY) { renderShelves(); paintHearts(); applyFilter(); }
  });
} catch {  }
