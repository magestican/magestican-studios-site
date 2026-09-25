import { state, save, fillOrders } from '../state.js';
import { go, modal, money, orderSummary } from '../ui.js';
import { portraitSVG } from '../art.js';
import { defaultDesign } from '../logic.js';
import { DYES } from '../data.js';
import { sfx } from '../audio.js';

const OPENERS = ['Dearest dressmaker,', 'To the new atelier on Thimble Lane,', 'Good day!', 'Dear Madam,', 'Hello there,'];

function letterText(o, i) {
  const want = o.wants.map((w) => w.tag.toLowerCase());
  const list = want.length > 1 ? `${want.slice(0, -1).join(', ')} and ${want[want.length - 1]}` : want[0];
  const avoid = o.avoid.map((a) => a.tag.toLowerCase()).join(' or ');
  return `${OPENERS[i % OPENERS.length]} I require a dress for <i>${o.occasion}</i>. I should like it to feel <b>${list}</b>` +
    `${avoid ? `, and please, nothing too ${avoid}` : ''}. I shall cover materials within reason.`;
}

export default {
  enter(root) {
    fillOrders();
    root.innerHTML = `<div class="desk"><h1>Commissions</h1><div class="letters">${state.orders.map((o, i) => `
      <div class="letter paper">
        <div class="seal">❦</div>
        <div class="who">${portraitSVG(o.look, DYES[(o.look * 3) % DYES.length].hex)}<div><h3>${o.client}</h3><small>for ${o.occasion}</small></div></div>
        <p>${letterText(o, i)}</p>
        ${orderSummary(o)}
        <div class="terms"><span>Fee <b>${money(o.fee)}</b></span><span>Materials up to <b>${money(o.budget)}</b></span></div>
        <button class="btn gold" data-i="${i}">${state.job?.order.id === o.id ? 'Continue' : 'Accept commission'}</button>
      </div>`).join('')}</div></div>`;
    root.querySelectorAll('[data-i]').forEach((b) => {
      b.onclick = () => {
        const o = state.orders[+b.dataset.i];
        const start = () => {
          sfx.page();
          state.job = { order: o, design: defaultDesign(), step: 'sketch' };
          save();
          go('sketch');
        };
        if (state.job && state.job.order.id === o.id) { go(state.job.step); return; }
        if (state.job && state.job.step !== 'sketch') {
          modal('<h2>Abandon current dress?</h2><p>The fabric already cut for it will be lost.</p>', [
            { label: 'Keep working', onClick: () => go(state.job.step) },
            { label: 'Abandon it', onClick: start },
          ]);
        } else start();
      };
    });
  },
};
