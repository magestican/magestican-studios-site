import { state, save, fillOrders, level } from '../state.js';
import { go, modal, money, starRow, renderHud, auntNote, calm, toast, checkAchievements, $ } from '../ui.js';
import { dressSVG, roomSVG, portraitSVG } from '../art.js';
import { recordServed, noticeFor } from '../town.js';
import { computeTags, clientMatch, sameAsLast, rememberClient, stars, payout, levelFor, unlockedAt, part, fabric, trim, dye, repAfter, repTier, recordDress, windowLeft, placeInWindow, shopValue } from '../logic.js';
import { WINDOW_WAIT } from '../data.js';
import { DYES } from '../data.js';
import { sfx } from '../audio.js';
import { sceneHTML, mountScene } from '../scene.js';

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
    if (job.order.window) { windowReveal(root, job); return; }
    const d = job.design, o = job.order;
    const tags = computeTags(d);
    const m = clientMatch(tags, o, d);
    const st = stars(m);
    const q = job.quality ?? 0.7;
    const cost = (job.matCost || 0) + (job.trimCost || 0);
    const pay = payout(o, m, q, cost);
    
    const lines = o.charity ? (st >= 4 ? ['I have never had anything so lovely. I don\'t know how to thank you.', 'Everyone is going to ask where it came from. I will tell them all.']
      : st >= 3 ? ['It is lovely. Thank you - truly.', 'I shall wear it until it falls apart.'] : ['It is... thank you. It was kind of you to try.', 'Thank you. I know you did it for nothing.']) : LINES[st];
    const rep = o.repeat;
    
    const repLine = !rep ? '' : sameAsLast(o, d) ? ' And yet... it is the very same cut as last time.'
      : rep.mood === 'happy' && st >= 3 ? ' You have never once let me down.' : rep.mood === 'unhappy' && st >= 4 ? ' You have quite redeemed yourself!' : '';
    const mood = st >= 4 ? 'happy' : st <= 2 ? 'sad' : 'neutral';
    const repDelta = repAfter(state.rep, st, o) - (state.rep || 0);
    root.innerHTML = `<div class="reveal">${roomSVG()}
      <div class="dress"><div class="cam"><div class="rv-scene">${sceneHTML(dressSVG(d, { quality: q }))}</div></div></div>
      <div class="curtain l"></div><div class="curtain r"></div>
      <div class="dress-name">${dressName(d)}<small>for ${o.client} &middot; ${o.occasion}</small></div>
      <div class="verdict paper">
        <div class="who">${portraitSVG(o.look, DYES[(o.look * 3) % DYES.length].hex, mood)}<div><h3 style="margin:0">${o.client}</h3>${starRow(st)}</div></div>
        <blockquote>"${lines[Math.floor(Math.random() * lines.length)]}${repLine}"</blockquote>
        <table class="bill">
          <tr><td>Craft quality</td><td>${Math.round(q * 100)}%</td></tr>
          <tr><td>Client match</td><td>${Math.round(m * 100)}%</td></tr>
          <tr><td>Dressmaking fee</td><td>${money(pay.fee)}</td></tr>
          <tr><td>Materials repaid <small>(cost ${money(cost)})</small></td><td>${money(pay.materials)}</td></tr>
          ${pay.tip - pay.loyal ? `<tr><td>Tip!</td><td>${money(pay.tip - pay.loyal)}</td></tr>` : ''}
          ${pay.loyal ? `<tr><td>Loyal client tip</td><td>${money(pay.loyal)}</td></tr>` : ''}
          <tr class="total"><td>Total</td><td>${money(pay.total)}</td></tr>
          <tr><td>Experience</td><td>+${pay.xp} XP</td></tr>
          <tr><td>Reputation</td><td>${repDelta >= 0 ? '+' : ''}${repDelta}</td></tr>
          ${o.charity ? `<tr><td>Notice <small>(word of mouth - opens doors in town)</small></td><td>+${noticeFor(st)}</td></tr>` : ''}
          ${o.gift ? `<tr><td>A keepsake <small>(in your trims)</small></td><td>${o.gift.n} &times; ${trim(o.gift.id)?.name || o.gift.id}</td></tr>` : ''}
        </table>
        <div class="modal-btns"><button class="btn gold" id="collect">Collect payment</button></div>
      </div></div>`;
    setTimeout(() => sfx.fanfare(), 900);
    mountReveal(root, d);
    
    
    const rv = $('.reveal', root);
    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const note = () => { if ($('#collect', root)) auntNote('reveal'); };
    if (calm()) { rv.classList.add('skip'); later(note, 400); } else {
      rv.addEventListener('pointerdown', () => { if (!rv.classList.contains('skip')) { rv.classList.add('skip'); timers.forEach(clearTimeout); later(note, 500); } });
      later(note, 4700);
    }
    
    const svg = $('.cam .sc-dress svg', root);
    if (svg) {
      const pts = [];
      for (const el of svg.querySelectorAll('.twinkle')) {
        try { const b = el.getBBox(); const p = { x: b.x + b.width / 2, y: b.y + b.height / 2 }; if (!pts.some((o) => Math.hypot(o.x - p.x, o.y - p.y) < 22)) pts.push(p); } catch (e) {  }
      }
      const shiny = [fabric(d.fab1), fabric(d.fab2)].some((f) => f && ['sheen', 'sparkle', 'brocade'].includes(f.tex));
      if (shiny) for (let i = 0; i < 5; i++) pts.push({ x: 160 + ((i * 37) % 80), y: 270 + i * 48 });
      const star = (x, y, r) => `M${x},${y - r} Q${x + r * 0.14},${y - r * 0.14} ${x + r},${y} Q${x + r * 0.14},${y + r * 0.14} ${x},${y + r} Q${x - r * 0.14},${y + r * 0.14} ${x - r},${y} Q${x - r * 0.14},${y - r * 0.14} ${x},${y - r} Z`;
      const glints = pts.slice(0, 9).map((p, i) => `<path class="glint" style="animation-delay:${(1.6 + ((p.y - 60) / 560) * 2.4 + (i % 3) * 0.9).toFixed(2)}s" d="${star(Math.round(p.x), Math.round(p.y), 9 + (i % 3) * 3)}" fill="#fffdf4"/>`).join('');
      if (glints) {
        svg.insertAdjacentHTML('beforeend', `<g class="glints">${glints}</g>`);
        later(() => sfx.sparkle(), calm() ? 600 : 2600);
      }
    }
    $('#collect', root).onclick = () => {
      const before = levelFor(state.xp);
      state.money += pay.total;
      state.xp += pay.xp;
      state.made++;
      const repBefore = repTier(state.rep).index;
      state.rep = repAfter(state.rep, st, o);
      
      if (o.town) state.town = recordServed(state.town, o, st);
      if (o.gift) state.trims[o.gift.id] = (state.trims[o.gift.id] || 0) + o.gift.n;
      if (o.charity) setTimeout(() => toast(`Word gets round about ${o.client}'s dress. Doors open in town.`, 'good', 2800), 400);
      state.stats = recordDress(state.stats, st, d.bodice);
      state.gallery.push({ design: d, client: o.client, occasion: o.occasion, stars: st, pay: pay.total, quality: q, name: dressName(d) });
      if (state.gallery.length > 60) state.gallery.shift();
      state.clients = rememberClient(state.clients, o.client, { stars: st, dress: dressName(d), bodice: d.bodice, skirt: d.skirt });
      state.orders = state.orders.filter((x) => x.id !== o.id);
      state.job = null;
      sellFromWindow();
      fillOrders(); save();
      sfx.coin(); renderHud();
      if (repTier(state.rep).index > repBefore) setTimeout(() => toast(`Your atelier is now the ${repTier(state.rep).name}!`, 'good', 2600), 200);
      checkAchievements();
      const after = level();
      if (after > before) {
        sfx.levelup();
        const un = [];
        for (let l = before + 1; l <= after; l++) un.push(...unlockedAt(l));
        modal(`<h2>Level ${after}!</h2><p>Your atelier's reputation grows. New in your pattern book and at the market:</p><p style="font-size:18px"><b>${un.join(' &middot; ') || 'Better paying clients'}</b></p>`, [{ label: 'Wonderful', kind: 'gold', onClick: () => go('hub') }]);
      } else go('hub');
    };
  },
  leave() { scene?.leave(); scene = null; },
};



let scene = null;
function mountReveal(root, design) {
  scene?.leave();
  scene = mountScene($('.rv-scene', root), { design, screen: $('.reveal', root) });
  setTimeout(() => scene?.puff(), 700);
}



function sellFromWindow() {
  const w = state.window;
  if (!w || windowLeft(w, state.made) > 0) return;
  state.money += w.value;
  state.stats = { ...state.stats, windowSold: (state.stats?.windowSold || 0) + 1 };
  state.gallery.push({ design: w.design, client: 'a walk-in buyer', occasion: 'the shop window', stars: 0, pay: w.value, quality: w.quality, name: w.name || dressName(w.design), window: true });
  if (state.gallery.length > 60) state.gallery.shift();
  state.window = null;
  setTimeout(() => toast(`A walk-in buyer bought ${w.name || 'your window dress'} for ${money(w.value)}!`, 'good', 3000), 400);
}

function windowReveal(root, job) {
  const d = job.design, q = job.quality ?? 0.7;
  const value = shopValue(d, q);
  const cost = (job.matCost || 0) + (job.trimCost || 0);
  const xp = Math.round(10 + value * 0.15);
  const name = dressName(d);
  root.innerHTML = `<div class="reveal skip">${roomSVG()}
    <div class="dress"><div class="cam"><div class="rv-scene">${sceneHTML(dressSVG(d, { quality: q }))}</div></div></div>
    <div class="dress-name">${name}<small>for the shop window</small></div>
    <div class="verdict paper"><h3 style="margin:0 0 6px">Dressing the window</h3>
      <blockquote>"Passers-by are already slowing down to look. A buyer will come in before long."</blockquote>
      <table class="bill">
        <tr><td>Craft quality</td><td>${Math.round(q * 100)}%</td></tr>
        <tr><td>Materials used</td><td>${money(cost)}</td></tr>
        <tr class="total"><td>Window price</td><td>${money(value)}</td></tr>
        <tr><td>Sells after</td><td>${WINDOW_WAIT} more commissions</td></tr>
        <tr><td>Experience</td><td>+${xp} XP</td></tr>
      </table>
      <div class="modal-btns"><button class="btn gold" id="collect">Put it in the window</button></div>
    </div></div>`;
  setTimeout(() => sfx.fanfare(), 300);
  mountReveal(root, d);
  $('#collect', root).onclick = () => {
    const before = levelFor(state.xp);
    state.xp += xp;
    state.window = placeInWindow(d, q, state.made, name);
    state.stats = recordDress(state.stats, 0, d.bodice);
    state.job = null;
    save(); sfx.coin(); renderHud();
    checkAchievements();
    const after = level();
    if (after > before) {
      sfx.levelup();
      const un = [];
      for (let l = before + 1; l <= after; l++) un.push(...unlockedAt(l));
      modal(`<h2>Level ${after}!</h2><p>New in your pattern book and at the market:</p><p style="font-size:18px"><b>${un.join(' &middot; ') || 'Better paying clients'}</b></p>`, [{ label: 'Wonderful', kind: 'gold', onClick: () => go('hub') }]);
    } else go('hub');
  };
}
