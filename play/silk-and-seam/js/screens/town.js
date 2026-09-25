



import { state, save, level } from '../state.js';
import { go, modal, money, toast, renderHud, checkAchievements, $ } from '../ui.js';
import { portraitSVG } from '../art.js';
import { DYES } from '../data.js';
import { sfx } from '../audio.js';
import { trim } from '../logic.js';
import {
  PLACES, PEOPLE, GOSSIP, APPROACHES, REQUEST_KINDS, TALKS_PER_DAY, person, gossip,
  townDay, talksLeft, cannotTalk, spendTalk, startTalk, talkStep, talkOutcome, recordTalk, needOf,
  requestReady, requestOrder, answerRequest, knownTemper, standing, reactionOf,
} from '../town.js';

let view = { place: null, talk: null };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const look = (p, mood) => portraitSVG(p.look, DYES[(p.look * 3) % DYES.length].hex, mood);
const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];


function streetSVG(pl) {
  const P = pl || { id: 'map', sky: '#f0cf9a', wall: '#a86d48' };
  const w = P.wall;
  const houses = [...Array(9)].map((_, i) => {
    const x = i * 150 - 30, h = 250 + ((i * 73) % 120), top = 520 - h;
    const c = i % 3 === 0 ? w : i % 3 === 1 ? shadeHex(w, 0.18) : shadeHex(w, -0.15);
    const roof = P.id === 'crescent' ? `<rect x="${x - 6}" y="${top - 14}" width="162" height="16" fill="#e9dcc6"/>` : `<path d="M${x - 8},${top} L${x + 75},${top - 60} L${x + 158},${top} Z" fill="${shadeHex(c, -0.35)}"/>`;
    const wins = [0, 1, 2].map((r) => [0, 1].map((k) => `<rect x="${x + 28 + k * 62}" y="${top + 30 + r * 70}" width="36" height="46" rx="${P.id === 'lantern' ? 18 : 3}" fill="#f7e2a6" fill-opacity="${0.55 + ((i + r + k) % 3) * 0.15}" stroke="${shadeHex(c, -0.4)}" stroke-width="4"/>`).join('')).join('');
    return `<rect x="${x}" y="${top}" width="150" height="${h}" fill="${c}"/>${roof}${wins}<rect x="${x + 55}" y="${470}" width="40" height="50" fill="${shadeHex(c, -0.45)}"/>`;
  }).join('');
  let deco = '';
  if (P.id === 'lantern') deco = `<path d="M0,150 Q320,210 640,150 T1280,150" stroke="#3a2a22" stroke-width="2" fill="none"/>` + [...Array(12)].map((_, i) => { const x = 50 + i * 106, y = 162 + Math.sin(i * 1.1) * 18; return `<ellipse cx="${x}" cy="${y + 20}" rx="18" ry="22" fill="#d8322f"/><rect x="${x - 9}" y="${y - 4}" width="18" height="6" fill="#e8b84a"/><path d="M${x},${y + 42} v14" stroke="#e8b84a" stroke-width="2"/>`; }).join('');
  if (P.id === 'spice') deco = [0, 1].map((r) => `<path d="M0,${140 + r * 50} Q320,${200 + r * 50} 640,${140 + r * 50} T1280,${140 + r * 50}" stroke="#4c6a2a" stroke-width="2" fill="none"/>` + [...Array(40)].map((_, i) => { const t = i / 39, x = t * 1280, y = 140 + r * 50 + 30 * Math.sin(t * Math.PI * 4); return `<circle cx="${x.toFixed(0)}" cy="${(y + 14).toFixed(0)}" r="9" fill="${i % 2 ? '#f29a1f' : '#f5c43a'}"/>`; }).join('')).join('');
  if (P.id === 'square') deco = `<rect x="590" y="60" width="100" height="330" fill="#b8926a"/><circle cx="640" cy="130" r="36" fill="#f6ecd4" stroke="#6b4a2f" stroke-width="6"/><path d="M640,130 V104 M640,130 L658,140" stroke="#3a2a22" stroke-width="4"/>` +
    `<path d="M0,210 Q320,270 640,210 T1280,210" stroke="#6b4a2f" stroke-width="2" fill="none"/>` + [...Array(24)].map((_, i) => { const x = 20 + i * 54, y = 214 + 22 * Math.sin((i / 23) * Math.PI * 2 + Math.PI * 0.2); return `<path d="M${x},${y.toFixed(0)} l12,24 l12,-24 Z" fill="${['#d25a6e', '#e8c46a', '#6aa0c8', '#7fb069'][i % 4]}"/>`; }).join('');
  if (P.id === 'harbour') deco = `<rect y="470" width="1280" height="250" fill="#5f8fa0"/>` + [...Array(10)].map((_, i) => `<path d="M${i * 140},${520 + (i % 2) * 20} q35,-10 70,0 t70,0" stroke="#d9ecf0" stroke-opacity=".6" stroke-width="3" fill="none"/>`).join('') +
    [180, 560, 980].map((x) => `<path d="M${x - 80},470 L${x + 90},470 L${x + 60},500 L${x - 60},500 Z" fill="#6b4a2f"/><path d="M${x},470 V250" stroke="#4a3322" stroke-width="6"/><path d="M${x + 4},270 L${x + 90},450 L${x + 4},450 Z" fill="#f2ead8"/>`).join('');
  if (P.id === 'crescent') deco = `<path d="M470,300 Q640,130 810,300 Z" fill="#d9ccb4"/><rect x="460" y="300" width="360" height="30" fill="#e9dcc6"/>` + [...Array(7)].map((_, i) => `<rect x="${480 + i * 50}" y="330" width="18" height="160" fill="#efe4d0"/>`).join('') + `<rect x="450" y="490" width="380" height="30" fill="#e2d4bc"/><circle cx="640" cy="248" r="16" fill="#e8c46a"/>`;
  return `<svg class="town-bg" viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="tsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shadeHex(P.sky, 0.25)}"/><stop offset="1" stop-color="${P.sky}"/></linearGradient></defs>` +
    
    `<rect width="1280" height="720" fill="url(#tsky)"/>${P.id === 'harbour' ? `<g transform="translate(0,-40)">${houses}</g>` : houses}${deco}${P.id === 'harbour' ? '' : '<rect y="520" width="1280" height="200" fill="#8a7a68"/>'}` +
    (P.id === 'harbour' ? '' : [...Array(26)].map((_, i) => `<path d="M${i * 52},${540 + (i % 3) * 36} h40" stroke="#6f6152" stroke-width="3"/>`).join('')) + `</svg>`;
}
function shadeHex(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v) => Math.max(0, Math.min(255, Math.round(amt >= 0 ? v + (255 - v) * amt : v * (1 + amt))));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => ch(v).toString(16).padStart(2, '0')).join('')}`;
}


function bar() {
  const t = state.town, left = talksLeft(t, state.made);
  return `<div class="town-bar">
    <span class="tb-talks" title="Conversations left until you finish another commission">${[...Array(TALKS_PER_DAY)].map((_, i) => `<i class="${i < left ? 'on' : ''}"></i>`).join('')} ${left ? `${left} talk${left === 1 ? '' : 's'} left today` : 'The day is done - finish a commission'}</span>
    <span class="tb-notice" title="Notice: word of mouth from free work. Each point counts as ${3} reputation at the Crescent's doors">Notice <b>${t.notice || 0}</b> &middot; standing <b>${standing(state.rep, t.notice)}</b></span>
    <button class="btn small" data-notes>&#128220; Gossip notebook <b>${(t.known || []).length}/${GOSSIP.length}</b></button>
  </div>`;
}

function status(p) {
  const t = state.town;
  const why = cannotTalk(p, t, { made: state.made, rep: state.rep });
  if (why === 'closed') return { cls: 'closed', text: `Does not receive unknown ateliers <small>(standing ${standing(state.rep, t.notice)} / ${p.minStanding})</small>` };
  if (why === 'talked') return { cls: 'done', text: 'You spoke today' };
  if (why === 'tired') return { cls: 'done', text: 'It is getting late - finish a commission and come back' };
  const ready = requestReady(p, t, { made: state.made, orders: state.orders, job: state.job });
  const mem = t.people?.[p.id];
  return { cls: 'open', text: !mem?.met ? 'You have not met' : ready ? 'Might have work for you' : p.requests.length ? 'Nothing for you just now - but talk anyway' : 'Always has gossip' };
}

function temperChips(id) {
  const k = knownTemper(state.town.known, id);
  if (!k.likes.length && !k.dislikes.length) return '';
  return `<div class="temper">${k.likes.map((a) => `<span class="lk">&#9829; ${APPROACHES[a]}</span>`).join('')}${k.dislikes.map((a) => `<span class="dk">&#10005; ${APPROACHES[a]}</span>`).join('')}</div>`;
}


function mapView() {
  return `<div class="town-in"><h1>Thimblebury</h1><p class="town-sub">Your shop is on Thimble Lane. Out there are people from every corner of the world - and every one of them wears clothes.</p>${bar()}
    <div class="places">${PLACES.map((pl) => {
      const folk = PEOPLE.filter((p) => p.place === pl.id);
      const ready = folk.some((p) => !cannotTalk(p, state.town, { made: state.made, rep: state.rep }) && requestReady(p, state.town, { made: state.made, orders: state.orders, job: state.job }));
      return `<button class="place paper" data-p="${pl.id}" style="--sky:${pl.sky};--wall:${pl.wall}"><span class="pl-sky"></span><b>${pl.name}</b><small>${pl.blurb}</small>
        <span class="faces">${folk.map((p) => `<span class="face${cannotTalk(p, state.town, { made: state.made, rep: state.rep }) === 'closed' ? ' shut' : ''}">${look(p)}</span>`).join('')}</span>${ready ? '<span class="pl-work">work to be had</span>' : ''}</button>`;
    }).join('')}</div></div>`;
}

function placeView(pl) {
  const folk = PEOPLE.filter((p) => p.place === pl.id);
  return `<div class="town-in"><div class="town-head"><button class="btn small" data-back="map">&larr; The town</button><h1>${pl.name}</h1></div><p class="town-sub">${pl.blurb}</p>${bar()}
    <div class="folk">${folk.map((p) => {
      const s = status(p);
      return `<button class="townsfolk paper ${s.cls}" data-who="${p.id}"${s.cls === 'open' ? '' : ' disabled'}>${look(p)}<span class="tf-txt"><b>${p.name}</b><small>${p.role}</small><em>${s.text}</em>${temperChips(p.id)}</span></button>`;
    }).join('')}</div></div>`;
}

function talkView() {
  const tk = view.talk, p = person(tk.id);
  const need = needOf(p);
  const mood = tk.last === 'liked' ? 'happy' : tk.last === 'disliked' ? 'sad' : 'neutral';
  const warmth = `<div class="warmth" title="How warmly she feels towards you - reach ${need} for her to trust you with work">${[...Array(need)].map((_, i) => `<i class="${i < tk.rapport ? 'on' : ''}"></i>`).join('')}<small>${tk.rapport >= need ? 'she likes you' : 'warmth'}</small></div>`;
  let body;
  if (tk.stage === 'topic') {
    const topic = p.topics[tk.round];
    const order = [0, 1, 2].map((i) => (i + state.made + tk.round + p.id.length) % 3);
    body = `<p class="said">${tk.round === 0 ? `${esc(p.hello)} ` : ''}${esc(topic.say)}</p>
      <div class="replies">${order.map((i) => `<button class="btn reply" data-r="${i}">&ldquo;${esc(topic.replies[i].t)}&rdquo;</button>`).join('')}</div>`;
  } else if (tk.stage === 'react') {
    const heard = tk.newHeard ? gossip(tk.newHeard) : null;
    body = `<p class="said react ${tk.last}">${esc(tk.reactLine)}</p>${heard ? `<div class="heard">&#128220; <b>You hear:</b> ${esc(heard.text)}</div>` : ''}
      <div class="replies"><button class="btn gold" data-next>${tk.done ? 'Finish the conversation' : 'Go on'}</button></div>`;
  } else body = outcomeHTML(p, tk);
  return `<div class="town-in talk-wrap"><div class="talk paper"><div class="talk-who">${look(p, mood)}<div><h2>${p.name}</h2><small>${p.role}</small>${warmth}${temperChips(p.id)}</div></div>${body}</div></div>`;
}

function outcomeHTML(p, tk) {
  const out = tk.outcome;
  const parting = out.parting ? `<div class="heard">&#128220; <b>Before you go:</b> ${esc(gossip(out.parting).text)}</div>` : '';
  if (out.request) {
    const k = REQUEST_KINDS[out.request.kind];
    const o = tk.preview;
    return `<p class="said">${esc(out.request.line)}</p>${parting}
      <div class="offer ${out.request.kind}"><span class="kind-badge">${k.badge}</span><b>${k.name}</b> for <i>${esc(o.client)}</i> &middot; ${esc(o.occasion)}
        <div class="offer-terms">${o.charity ? `No fee - you give the materials. <b>Reputation +3</b> and <b>notice</b> that opens doors${o.gift ? `, and a keepsake: ${o.gift.n} &times; ${trim(o.gift.id)?.name || o.gift.id}` : ''}.` : `Fee <b>${money(o.fee)}</b> &middot; materials up to <b>${money(o.budget)}</b>${o.gift ? ` &middot; plus ${o.gift.n} &times; ${trim(o.gift.id)?.name || o.gift.id}` : ''}`}</div></div>
      <div class="replies"><button class="btn gold" data-accept>${o.charity ? 'Make it for her' : 'Accept - put it on my desk'}</button><button class="btn small ghost" data-refuse>Not now</button></div>`;
  }
  let line;
  if (!out.good) line = `${esc(p.bye)} <span class="aside">She did not warm to you. The gossip notebook may tell you what she likes.</span>`;
  else if (!p.requests.length) line = esc(p.bye);
  else {
    const mem = state.town.people?.[p.id] || {};
    const onDesk = state.orders.some((o) => o.townPerson === p.id) || state.job?.order?.townPerson === p.id;
    const full = state.orders.filter((o) => o.town).length >= 3;
    const wait = mem.lastReq != null ? mem.lastReq + 4 - state.made : 0;
    line = `${esc(p.bye)} <span class="aside">${onDesk ? 'Her request is still on your desk.' : full ? 'Your desk is full of town requests - finish one first.' : wait > 0 ? `She liked you. She may have more work in ${wait} commission${wait === 1 ? '' : 's'}.` : 'She liked you.'}</span>`;
  }
  return `<p class="said">${line}</p>${parting}<div class="replies"><button class="btn gold" data-back="place">Back to ${PLACES.find((x) => x.id === p.place).name}</button></div>`;
}

function notebook() {
  const t = state.town;
  const who = PEOPLE.filter((p) => knownTemper(t.known, p.id).likes.length || knownTemper(t.known, p.id).dislikes.length);
  const heard = GOSSIP.filter((g) => (t.known || []).includes(g.id));
  modal(`<h2>&#128220; Gossip notebook</h2><div class="notebook">
    <h3>What you know about people</h3>${who.length ? who.map((p) => `<div class="nb-who"><b>${p.name}</b>${temperChips(p.id)}</div>`).join('') : '<p><i>Nothing yet. Ask people questions - they love to talk about each other.</i></p>'}
    <h3>Heard in town <small>${heard.length} of ${GOSSIP.length}</small></h3>${heard.length ? heard.map((g) => `<p class="nb-g">${esc(g.text)} <small>- ${person(g.from).name}</small></p>`).join('') : '<p><i>You have not heard anything yet.</i></p>'}
  </div>`, [{ label: 'Close', kind: 'gold' }]);
}


function render(root) {
  state.town = townDay(state.town, state.made);
  const pl = view.place && PLACES.find((x) => x.id === view.place);
  root.innerHTML = `<div class="town">${streetSVG(view.talk ? PLACES.find((x) => x.id === person(view.talk.id).place) : pl)}${view.talk ? talkView() : pl ? placeView(pl) : mapView()}</div>`;
  root.scrollTop = 0;
  wire(root);
}

function wire(root) {
  const on = (sel, fn) => root.querySelectorAll(sel).forEach((el) => { el.onclick = () => fn(el); });
  on('[data-notes]', () => { sfx.page(); notebook(); });
  on('[data-p]', (el) => { sfx.page(); view = { place: el.dataset.p, talk: null }; render(root); });
  on('[data-back]', (el) => { sfx.page(); view = el.dataset.back === 'map' ? { place: null, talk: null } : { place: view.place, talk: null }; render(root); });
  on('[data-who]', (el) => {
    const p = person(el.dataset.who);
    if (cannotTalk(p, state.town, { made: state.made, rep: state.rep })) return;
    sfx.click();
    state.town = spendTalk(state.town, p.id, state.made);
    save();
    view = { place: p.place, talk: { ...startTalk(p, state.town), stage: 'topic' } };
    render(root);
  });
  on('[data-r]', (el) => {
    const tk = view.talk, p = person(tk.id);
    const before = tk.heard.length;
    const next = talkStep(tk, p, +el.dataset.r);
    const kind = next.last;
    const known = state.town.known || [];
    const fresh = next.heard.length > before && !known.includes(next.heard[next.heard.length - 1]) ? next.heard[next.heard.length - 1] : null;
    if (kind === 'liked') sfx.pin(); else if (kind === 'disliked') sfx.error(); else sfx.click();
    view.talk = { ...next, stage: 'react', reactLine: pick(p.react[kind], state.made + tk.round), newHeard: fresh };
    render(root);
  });
  on('[data-next]', () => {
    const tk = view.talk, p = person(tk.id);
    sfx.page();
    if (!tk.done) { view.talk = { ...tk, stage: 'topic' }; render(root); return; }
    const outcome = talkOutcome(tk, p, state.town, { made: state.made, orders: state.orders, job: state.job });
    state.town = recordTalk(state.town, tk, outcome, state.made);
    const preview = outcome.request ? requestOrder(p, outcome.request, level(), Math.random) : null;
    save();
    checkAchievements();
    if (outcome.good) sfx.sparkle();
    view.talk = { ...tk, stage: 'end', outcome, preview };
    render(root);
  });
  on('[data-accept]', () => {
    const tk = view.talk, p = person(tk.id);
    state.orders.unshift(tk.preview);   
    state.town = answerRequest(state.town, p.id, state.made, true);
    save(); sfx.coin(); renderHud();
    toast(tk.preview.charity ? `You will make ${tk.preview.client}'s dress. It is on your desk.` : `A new commission from ${tk.preview.client} is on your desk`, 'good', 2400);
    view = { place: p.place, talk: null };
    render(root);
  });
  on('[data-refuse]', () => {
    const tk = view.talk, p = person(tk.id);
    state.town = answerRequest(state.town, p.id, state.made, false);
    save(); sfx.click();
    view = { place: p.place, talk: null };
    render(root);
  });
}

export default {
  enter(root, params = {}) {
    view = { place: params.place || null, talk: null };
    render(root);
  },
  leave() { view.talk = null; },
};


window.__town = () => ({ view: { ...view, talk: view.talk && { id: view.talk.id, round: view.talk.round, rapport: view.talk.rapport, stage: view.talk.stage } }, town: state.town, reactionOf: (id, a) => reactionOf(person(id), a) });
