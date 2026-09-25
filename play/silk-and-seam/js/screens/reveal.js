import { state, save, fillOrders, level } from '../state.js';
import { go, modal, money, starRow, renderHud, $ } from '../ui.js';
import { dressSVG, roomSVG, portraitSVG } from '../art.js';
import { computeTags, matchScore, stars, payout, levelFor, unlockedAt, part, fabric, dye } from '../logic.js';
import { DYES } from '../data.js';
import { sfx } from '../audio.js';

const LINES = {
  5: ['It is perfect. Utterly perfect. I may cry.', 'Everyone will ask who made this. I shall tell them!', 'You have outdone yourself - here, take a little extra.'],
  4: ['Oh, this is lovely. Just what I pictured.', 'Beautiful work. I am very pleased.'],
  3: ['It is... nice. Not quite what I imagined, but nice.', 'Hmm. It will do, I suppose.'],
  2: ['This is not really what I asked for.', 'I am rather disappointed, I must say.'],
  1: ['What is this? I cannot wear this!', 'I asked for something entirely different.'],
};

function dressName(d) {
  const f = fabric(d.fab1), c = dye(d.dye1);
  return `The ${c.name} ${f.name} ${part('skirt', d.skirt).name.replace(' Skirt', '')}`;
}

export default {
  enter(root) {
    const job = state.job;
    if (!job) { go('hub'); return; }
    const d = job.design, o = job.order;
    const tags = computeTags(d);
    const m = matchScore(tags, o);
    const st = stars(m);
    const q = job.quality ?? 0.7;
    const cost = (job.matCost || 0) + (job.trimCost || 0);
    const pay = payout(o, m, q, cost);
    const lines = LINES[st];
    const mood = st >= 4 ? 'happy' : st <= 2 ? 'sad' : 'neutral';
    root.innerHTML = `<div class="reveal">${roomSVG()}
      <div class="dress">${dressSVG(d, { quality: q })}</div>
      <div class="curtain l"></div><div class="curtain r"></div>
      <div class="dress-name">${dressName(d)}<small>for ${o.client} &middot; ${o.occasion}</small></div>
      <div class="verdict paper">
        <div class="who">${portraitSVG(o.look, DYES[(o.look * 3) % DYES.length].hex, mood)}<div><h3 style="margin:0">${o.client}</h3>${starRow(st)}</div></div>
        <blockquote>"${lines[Math.floor(Math.random() * lines.length)]}"</blockquote>
        <table class="bill">
          <tr><td>Craft quality</td><td>${Math.round(q * 100)}%</td></tr>
          <tr><td>Client match</td><td>${Math.round(m * 100)}%</td></tr>
          <tr><td>Dressmaking fee</td><td>${money(pay.fee)}</td></tr>
          <tr><td>Materials repaid <small>(cost ${money(cost)})</small></td><td>${money(pay.materials)}</td></tr>
          ${pay.tip ? `<tr><td>Tip!</td><td>${money(pay.tip)}</td></tr>` : ''}
          <tr class="total"><td>Total</td><td>${money(pay.total)}</td></tr>
          <tr><td>Experience</td><td>+${pay.xp} XP</td></tr>
        </table>
        <div class="modal-btns"><button class="btn gold" id="collect">Collect payment</button></div>
      </div></div>`;
    setTimeout(() => sfx.fanfare(), 900);
    $('#collect', root).onclick = () => {
      const before = levelFor(state.xp);
      state.money += pay.total;
      state.xp += pay.xp;
      state.made++;
      state.gallery.push({ design: d, client: o.client, occasion: o.occasion, stars: st, pay: pay.total, quality: q, name: dressName(d) });
      if (state.gallery.length > 60) state.gallery.shift();
      state.orders = state.orders.filter((x) => x.id !== o.id);
      state.job = null;
      fillOrders(); save();
      sfx.coin(); renderHud();
      const after = level();
      if (after > before) {
        sfx.levelup();
        const un = [];
        for (let l = before + 1; l <= after; l++) un.push(...unlockedAt(l));
        modal(`<h2>Level ${after}!</h2><p>Your atelier's reputation grows. New in your pattern book and at the market:</p><p style="font-size:18px"><b>${un.join(' &middot; ') || 'Better paying clients'}</b></p>`, [{ label: 'Wonderful', kind: 'gold', onClick: () => go('hub') }]);
      } else go('hub');
    };
  },
};
