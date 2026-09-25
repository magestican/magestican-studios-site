import { state, save, resetGame, fillOrders } from '../state.js';
import { go, modal, letter, money, openAchievements, countPlay, $ } from '../ui.js';
import { roomSVG, dressSVG } from '../art.js';
import { defaultDesign, windowLeft } from '../logic.js';
import { sfx } from '../audio.js';
import { AUNT, ACHIEVEMENTS } from '../data.js';

const STEP_NAMES = { sketch: 'Sketch book', cut: 'Cutting table', sew: 'Sewing machine', embellish: 'Embellishing', reveal: 'The reveal' };



export function windowOrder() {
  return { id: `window-${Date.now().toString(36)}`, window: true, client: 'The shop window', occasion: 'walk-in buyers', look: 0, wants: [], avoid: [], fee: 0, budget: 0 };
}

function windowPanel() {
  const w = state.window, job = state.job;
  if (w) {
    const left = windowLeft(w, state.made);
    return `<div class="hub-window has">${dressSVG(w.design, { quality: w.quality })}<div class="win-cap"><b>${w.name || 'In the window'}</b>priced at ${money(w.value)} &middot; ${left ? `a buyer should come in ${left} commission${left === 1 ? '' : 's'}` : 'sells with your next commission'}</div></div>`;
  }
  const busy = job && job.order.window;
  return `<div class="hub-window empty"><div class="win-glass"></div><div class="win-cap"><b>The shop window is empty</b>Design any dress you like - no client, no brief. A walk-in buyer pays its market value.</div>
    ${busy ? '' : `<button class="btn gold small" data-a="window"${job ? ' disabled title="Finish the commission on the table first"' : ''}>Dress the window</button>`}</div>`;
}

export default {
  enter(root) {
    fillOrders(); save();
    const last = state.gallery[state.gallery.length - 1];
    const job = state.job;
    const shown = job && job.step !== 'sketch' ? job.design : last?.design;
    const nAch = ACHIEVEMENTS.filter((a) => state.achievements?.[a.id]).length;
    const nScrap = Object.values(state.scraps || {}).reduce((a, b) => a + b, 0);
    root.innerHTML = `<div class="hub-room">${roomSVG()}</div>
      <div class="hub-dress">${shown ? dressSVG(shown, { quality: job ? 1 : last.quality }) : dressSVG({}, { formOnly: true })}</div>
      <div class="hub-menu">
        ${job ? `<button class="plaque hot" data-a="job"><b>Continue ${job.order.window ? 'window dress' : 'commission'}</b><small>${job.order.client} &middot; ${STEP_NAMES[job.step]}</small></button>` : ''}
        <button class="plaque${job ? '' : ' hot'}" data-a="orders"><b>Commissions</b><small>${state.orders.length} letters waiting on the desk</small></button>
        <button class="plaque" data-a="market"><b>Fabric Market</b><small>Bolts, trims, sales &amp; workshop tools</small></button>
        <button class="plaque" data-a="gallery"><b>Gallery &amp; Workbench</b><small>${state.gallery.length} dress${state.gallery.length === 1 ? '' : 'es'} made${nScrap >= 0.2 ? ` &middot; ${nScrap.toFixed(1)} m of scraps` : ''}</small></button>
      </div>
      ${windowPanel()}
      <div class="hub-sign paper"><h3>The Atelier</h3>${last ? `Your last piece, for <i>${last.client}</i>, earned ${'★'.repeat(last.stars)}.` : 'Your great-aunt left you her dress shop, a sewing machine and a few bolts of cotton. Time to make a name for yourself.'}
        <button class="btn small ghost ach-btn" data-a="ach">&#9733; Achievements ${nAch}/${ACHIEVEMENTS.length}</button></div>
      <button class="hub-reset">reset save</button>`;
    root.querySelector('[data-a=orders]').onclick = () => { sfx.page(); go('orders'); };
    root.querySelector('[data-a=market]').onclick = () => { sfx.page(); go('market'); };
    root.querySelector('[data-a=gallery]').onclick = () => { sfx.page(); go('gallery'); };
    root.querySelector('[data-a=ach]').onclick = () => { sfx.click(); openAchievements(); };
    const win = root.querySelector('[data-a=window]');
    if (win) {
      win.onclick = () => {
        if (state.job) return;
        sfx.page();
        state.job = { order: windowOrder(), design: defaultDesign(), step: 'sketch' };
        countPlay();
        save(); go('sketch');
      };
    }
    if (job) root.querySelector('[data-a=job]').onclick = () => { sfx.page(); go(job.step); };
    $('.hub-reset', root).onclick = () => modal('<h2>Start over?</h2><p>This erases your money, fabric and gallery.</p>', [
      { label: 'Keep playing' },
      { label: 'Erase everything', onClick: () => { resetGame(); go('hub'); } },
    ]);
    if (!state.seenIntro) {
      
      state.seenIntro = true; save();
      letter(`<h2>${AUNT.intro.title}</h2><p class="letter-body">${AUNT.intro.body}</p>
        <ol class="letter-steps"><li><b>Sketch</b> the design</li><li><b>Cut</b> the pieces</li><li><b>Sew</b> the seams</li><li><b>Embellish</b></li><li><b>Reveal</b> &amp; get paid</li></ol>`, 'Open the shop');
    }
  },
};
