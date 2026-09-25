import { state, save, resetGame, fillOrders } from '../state.js';
import { go, modal, $ } from '../ui.js';
import { roomSVG, dressSVG } from '../art.js';
import { sfx } from '../audio.js';

const STEP_NAMES = { sketch: 'Sketch book', cut: 'Cutting table', sew: 'Sewing machine', embellish: 'Embellishing', reveal: 'The reveal' };

export default {
  enter(root) {
    fillOrders(); save();
    const last = state.gallery[state.gallery.length - 1];
    const job = state.job;
    const shown = job && job.step !== 'sketch' ? job.design : last?.design;
    root.innerHTML = `<div class="hub-room">${roomSVG()}</div>
      <div class="hub-dress">${shown ? dressSVG(shown, { quality: job ? 1 : last.quality }) : dressSVG({}, { formOnly: true })}</div>
      <div class="hub-menu">
        ${job ? `<button class="plaque hot" data-a="job"><b>Continue commission</b><small>${job.order.client} &middot; ${STEP_NAMES[job.step]}</small></button>` : ''}
        <button class="plaque${job ? '' : ' hot'}" data-a="orders"><b>Commissions</b><small>${state.orders.length} letters waiting on the desk</small></button>
        <button class="plaque" data-a="market"><b>Fabric Market</b><small>Bolts, lace, pearls &amp; ribbon</small></button>
        <button class="plaque" data-a="gallery"><b>Gallery</b><small>${state.gallery.length} dress${state.gallery.length === 1 ? '' : 'es'} made</small></button>
      </div>
      <div class="hub-sign paper"><h3>The Atelier</h3>${last ? `Your last piece, for <i>${last.client}</i>, earned ${'★'.repeat(last.stars)}.` : 'Your great-aunt left you her dress shop, a sewing machine and a few bolts of cotton. Time to make a name for yourself.'}</div>
      <button class="hub-reset">reset save</button>`;
    root.querySelector('[data-a=orders]').onclick = () => { sfx.page(); go(job ? 'orders' : 'orders'); };
    root.querySelector('[data-a=market]').onclick = () => { sfx.page(); go('market'); };
    root.querySelector('[data-a=gallery]').onclick = () => { sfx.page(); go('gallery'); };
    if (job) root.querySelector('[data-a=job]').onclick = () => { sfx.page(); go(job.step); };
    $('.hub-reset', root).onclick = () => modal('<h2>Start over?</h2><p>This erases your money, fabric and gallery.</p>', [
      { label: 'Keep playing' },
      { label: 'Erase everything', onClick: () => { resetGame(); go('hub'); } },
    ]);
    if (!state.seenIntro) {
      state.seenIntro = true; save();
      modal(`<h2>Welcome to Silk &amp; Seam</h2><p style="font-size:18px;line-height:1.55;text-align:left">
        Clients send letters asking for a dress with a certain <b>feel</b> - cute, elegant, gothic...<br>
        1. <b>Sketch</b> it: pick a bodice, collar, sleeves, skirt, fabrics and dyes. Watch the tag meters reach the gold marks.<br>
        2. <b>Cut</b> the pattern pieces by tracing them with your scissors.<br>
        3. <b>Sew</b> the seams: steer the fabric under the needle, <span class="keys"><kbd>W</kbd><kbd>S</kbd></span> for speed.<br>
        4. <b>Embellish</b> with lace, pearls and bows, then <b>reveal</b> it and get paid.<br>
        Spend your earnings on finer fabric and level up to unlock grander gowns.</p>`, [{ label: 'Open the shop', kind: 'gold' }]);
    }
  },
};
