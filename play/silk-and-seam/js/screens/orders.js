import { state, save, fillOrders } from '../state.js';
import { go, modal, money, orderSummary, countPlay } from '../ui.js';
import { portraitSVG } from '../art.js';
import { defaultDesign, seasonFor, seasonLeft, part, bodyShape } from '../logic.js';
import { DYES, SEASONS, SEASON_BONUS } from '../data.js';


const GARMENT_LINE = {
  saree: 'It must be a <b>saree</b> - six yards, pleated just so, with the pallu over my shoulder.',
  phasin: 'I would like a <b>pha sin</b>, the long wrapped skirt, with a proper woven border at the hem.',
  sabai: 'Please make it with a <b>sabai</b> across the shoulder, the way my mother wore hers.',
};
import { sfx } from '../audio.js';

const OPENERS = ['Dearest dressmaker,', 'To the new atelier on Thimble Lane,', 'Good day!', 'Dear Madam,', 'Hello there,'];

function letterText(o, i) {
  const want = o.wants.map((w) => w.tag.toLowerCase());
  const list = want.length > 1 ? `${want.slice(0, -1).join(', ')} and ${want[want.length - 1]}` : want[0];
  const avoid = o.avoid.map((a) => a.tag.toLowerCase()).join(' or ');
  const season = o.season && SEASONS.find((x) => x.id === o.season);
  
  const rep = o.repeat;
  const back = !rep ? '' : rep.mood === 'happy' ? ` You made my <i>${rep.dress}</i>, and I have not stopped being complimented on it - I would trust no one else.`
    : rep.mood === 'unhappy' ? ` I confess <i>${rep.dress}</i> was not a success, so this time I should like something <b>quite different</b>.`
      : ` It is me again - <i>${rep.dress}</i> served well enough.`;
  
  const opener = OPENERS[i % OPENERS.length];
  
  const sl = season ? (!back && opener.endsWith(',') ? season.line[0].toLowerCase() + season.line.slice(1) : season.line) : '';
  return `${opener}${back}${sl ? ` ${sl}` : ''} I require a dress for <i>${o.occasion}</i>. I should like it to feel <b>${list}</b>` +
    `${avoid ? `, and please, nothing too ${avoid}` : ''}.${o.garment && GARMENT_LINE[o.garment.id] ? ` ${GARMENT_LINE[o.garment.id]}` : ''} I shall cover materials within reason.`;
}


function seasonBanner() {
  const s = seasonFor(state.made), left = seasonLeft(state.made);
  return `<div class="season-banner season-${s.id}"><span class="icon">${s.icon}</span> <b>${s.name}</b> &middot; the ${s.event} season &middot; event letters pay ${Math.round(SEASON_BONUS * 100)}% more <small>(${left} commission${left === 1 ? '' : 's'} until the season turns)</small></div>`;
}

export default {
  enter(root) {
    fillOrders();
    root.innerHTML = `<div class="desk"><h1>Commissions</h1>${seasonBanner()}<div class="letters">${state.orders.map((o, i) => `
      <div class="letter paper${o.season ? ` season-${o.season}` : ''}${o.premium ? ' premium' : ''}">${o.premium ? '<div class="premium-badge">&#9830; Premium client</div>' : ''}
        <div class="seal">${o.season ? SEASONS.find((x) => x.id === o.season).icon : '❦'}</div>${o.repeat ? `<div class="returning ${o.repeat.mood}">Returning client ${'&#9733;'.repeat(o.repeat.stars)}</div>` : ''}
        <div class="who">${portraitSVG(o.look, DYES[(o.look * 3) % DYES.length].hex)}<div><h3>${o.client}</h3><small>for ${o.occasion}${o.body ? ` &middot; ${bodyShape(o.body).name.toLowerCase()} figure` : ''}</small></div></div>
        <p>${letterText(o, i)}</p>
        ${orderSummary(o)}
        <div class="terms"><span>Fee <b>${money(o.fee)}</b>${o.bonus ? ` <small class="bonus">incl. ${money(o.bonus)} ${SEASONS.find((x) => x.id === o.season).event} bonus</small>` : ''}${o.premiumBonus ? ` <small class="bonus">incl. ${money(o.premiumBonus)} premium</small>` : ''}</span><span>Materials up to <b>${money(o.budget)}</b></span></div>
        <button class="btn gold" data-i="${i}">${state.job?.order.id === o.id ? 'Continue' : 'Accept commission'}</button>
      </div>`).join('')}</div></div>`;
    root.querySelectorAll('[data-i]').forEach((b) => {
      b.onclick = () => {
        const o = state.orders[+b.dataset.i];
        const start = () => {
          sfx.page();
          const design = defaultDesign();
          design.body = o.body || 'classic';
          
          if (o.garment && part(o.garment.slot, o.garment.id)) design[o.garment.slot] = o.garment.id;
          if (o.garment?.id === 'saree' && part('bodice', 'choli')) design.bodice = 'choli';
          state.job = { order: o, design, step: 'sketch' };
          countPlay();
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
