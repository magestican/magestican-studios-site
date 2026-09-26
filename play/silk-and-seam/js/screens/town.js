





import { state, save, level } from '../state.js';
import { go, modal, money, toast, renderHud, checkAchievements, touchedRecently, isMobile, $ } from '../ui.js';
import { portraitSVG } from '../art.js';
import { DYES } from '../data.js';
import { sfx } from '../audio.js';
import { trim } from '../logic.js';
import { townMapSVG, interiorSVG, LAYOUT, MAP_W, MAP_H } from '../townmap.js';
import { sceneState, isNight } from '../scene.js';
import { setScene } from '../audio.js';
import {
  PLACES, PEOPLE, BUILDINGS, GOSSIP, APPROACHES, REQUEST_KINDS, TALKS_PER_DAY, person, gossip, building, buildingOf,
  townDay, talksLeft, cannotTalk, spendTalk, startTalk, talkStep, talkOutcome, recordTalk, needOf, topicsOf,
  conversationsOf, talksWith,
  requestReady, requestOrder, answerRequest, knownTemper, standing, reactionOf, REQUEST_COOLDOWN, MAX_TOWN_LETTERS,
} from '../town.js';

let view = { b: null, talk: null };
let card = null;          
let mapScroll = null;     
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const look = (p, mood) => portraitSVG(p.look, DYES[(p.look * 3) % DYES.length].hex, mood);
const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];

const pr = (p) => (p.he ? { s: 'he', S: 'He', o: 'him', p: 'his', P: 'His' } : { s: 'she', S: 'She', o: 'her', p: 'her', P: 'Her' });
const ctx = () => ({ made: state.made, rep: state.rep, orders: state.orders, job: state.job, lvl: level() });


function personStatus(p) {
  const t = state.town;
  const why = cannotTalk(p, t, ctx());
  if (why === 'closed') return { key: 'closed', text: `Does not receive unknown ateliers <small>(standing ${standing(state.rep, t.notice)} / ${p.minStanding})</small>` };
  if (why === 'talked') return { key: 'done', text: 'You spoke today' };
  if (why === 'tired') return { key: 'done', text: 'It is getting late - finish a commission and come back' };
  const ready = requestReady(p, t, ctx());
  const mem = t.people?.[p.id];
  
  const fresh = mem?.met && talksWith(t, p.id) < conversationsOf(p).length;
  return { key: ready ? 'work' : 'talk', text: !mem?.met ? (ready ? `A stranger - ${pr(p).s} may have work` : 'A stranger') : ready ? (fresh ? `Has news - and might have work for you` : 'Might have work for you') : fresh ? `Has something new to tell you` : p.requests.length ? 'Nothing for you just now - but talk anyway' : 'Always has gossip' };
}
function buildingStatus(b) {
  if (b.home) return 'home';
  const s = b.people.map((id) => personStatus(person(id)).key);
  return s.includes('work') ? 'work' : s.includes('talk') ? 'talk' : s.every((k) => k === 'closed') ? 'closed' : 'done';
}
const STATUS_LINE = { work: 'Work to be had', talk: 'Someone to talk to', done: 'Visited today', closed: 'The door is shut to you - for now', home: 'Home' };

function temperChips(id) {
  const k = knownTemper(state.town.known, id);
  if (!k.likes.length && !k.dislikes.length) return '';
  return `<div class="temper">${k.likes.map((a) => `<span class="lk">&#9829; ${APPROACHES[a]}</span>`).join('')}${k.dislikes.map((a) => `<span class="dk">&#10005; ${APPROACHES[a]}</span>`).join('')}</div>`;
}

function bar() {
  const t = state.town, left = talksLeft(t, state.made);
  return `<div class="town-bar">
    <span class="tb-talks" title="Conversations left until you finish another commission">${[...Array(TALKS_PER_DAY)].map((_, i) => `<i class="${i < left ? 'on' : ''}"></i>`).join('')} ${left ? `${left} talk${left === 1 ? '' : 's'} left today` : 'The day is done - finish a commission'}</span>
    <span class="tb-notice" title="Notice: word of mouth from free work. Each point counts as 3 reputation at the Crescent's doors">Notice <b>${t.notice || 0}</b> &middot; standing <b>${standing(state.rep, t.notice)}</b></span>
    <button class="btn small" data-notes>&#128220; Notebook <b>${(t.known || []).length}/${GOSSIP.length}</b></button>
    <button class="btn small tb-light" data-light title="${isNight() ? 'Bring back the day' : 'Let the night fall - the lamps come on'}">${isNight() ? '&#9728; Day' : '&#9790; Night'}</button>
  </div>`;
}


function mapView() {
  return `<div class="town-map-view"><div class="tm-wrap"><div class="tm-canvas">${townMapSVG(BUILDINGS, buildingStatus, { night: isNight() })}</div></div>
    <div class="tm-top"><h1>Thimblebury</h1>${bar()}</div>
    <div class="tm-legend"><span class="lg-work">! work</span><span>&hellip; talk</span><span>&#10003; visited</span><span class="lg-shut">&#128274; shut</span></div>
    <div class="tm-card paper" hidden></div></div>`;
}
function cardHTML(b) {
  const st = buildingStatus(b);
  const folk = b.people.map(person);
  return `<div class="tc-head"><b>${b.name}</b><span class="tc-st ${st}">${STATUS_LINE[st]}</span></div><p>${esc(b.hint)}</p>` +
    (folk.length ? `<div class="tc-folk">${folk.map((p) => { const s = personStatus(p); return `<div class="tc-p ${s.key}">${look(p)}<span><b>${p.name}</b><small>${s.text}</small></span></div>`; }).join('')}</div>` : '') +
    `<button class="btn gold small" data-enter="${b.id}">${b.home ? 'Back to your atelier' : 'Step inside'}</button><small class="tc-click">${b.home ? 'Click to go home' : 'Click the building to step inside'}</small>`;
}



function showCard(root, id, touch = false) {
  const el = $('.tm-card', root), b = building(id);
  if (!el || !b) return;
  card = id;
  el.innerHTML = cardHTML(b);
  el.classList.toggle('touch', touch);
  el.hidden = false;
  root.querySelectorAll('.tm-b.sel').forEach((n) => n.classList.remove('sel'));
  root.querySelector(`.tm-b[data-b="${id}"]`)?.classList.add('sel');
  el.querySelector('[data-enter]').onclick = () => enter(root, id);
}
function hideCard(root) {
  card = null;
  const el = $('.tm-card', root);
  if (el) el.hidden = true;
  root.querySelectorAll('.tm-b.sel').forEach((n) => n.classList.remove('sel'));
}
function enter(root, id) {
  const b = building(id);
  if (b.home) { sfx.page(); go('hub'); return; }
  sfx.page();
  const wrap = $('.tm-wrap', root);
  if (wrap) mapScroll = wrap.scrollLeft;
  view = { b: id, talk: null };
  card = null;
  render(root);
}


function insideView(b) {
  const folk = b.people.map(person);
  return `<div class="town-inside"><div class="ti-bg">${interiorSVG(b.id)}</div>
    <div class="ti-head"><button class="btn small" data-back="map">&larr; Back to the street</button><h1>${b.name}</h1></div>
    ${bar()}<p class="ti-hint">${esc(b.hint)}</p>
    <div class="ti-folk">${folk.map((p) => {
      const s = personStatus(p);
      const open = s.key === 'work' || s.key === 'talk';
      return `<button class="ti-person ${s.key}" data-who="${p.id}"${open ? '' : ' disabled'}><span class="ti-portrait">${look(p, s.key === 'work' ? 'happy' : 'neutral')}</span>
        <span class="ti-plate paper"><b>${p.name}</b><small>${p.role}</small><em>${s.text}</em>${temperChips(p.id)}${open ? '<span class="ti-go">Talk</span>' : ''}</span></button>`;
    }).join('')}</div></div>`;
}

function talkView() {
  const tk = view.talk, p = person(tk.id);
  const need = needOf(p);
  const mood = tk.last === 'liked' ? 'happy' : tk.last === 'disliked' ? 'sad' : 'neutral';
  const warmth = `<div class="warmth" title="How warmly ${pr(p).s} feels towards you - reach ${need} for ${pr(p).o} to trust you with work">${[...Array(need)].map((_, i) => `<i class="${i < tk.rapport ? 'on' : ''}"></i>`).join('')}<small>${tk.rapport >= need ? `${pr(p).s} likes you` : 'warmth'}</small></div>`;
  let body;
  if (tk.stage === 'topic') {
    const topic = topicsOf(p, tk)[tk.round];
    const order = [0, 1, 2].map((i) => (i + state.made + tk.round + p.id.length) % 3);
    
    const hello = tk.set ? p.again || p.hello : p.hello;
    body = `<p class="said">${tk.round === 0 ? `${esc(hello)} ` : ''}${esc(topic.say)}</p>
      <div class="replies">${order.map((i) => `<button class="btn reply" data-r="${i}">&ldquo;${esc(topic.replies[i].t)}&rdquo;</button>`).join('')}</div>`;
  } else if (tk.stage === 'react') {
    const heard = tk.newHeard ? gossip(tk.newHeard) : null;
    body = `<p class="said react ${tk.last}">${esc(tk.reactLine)}</p>${heard ? `<div class="heard">&#128220; <b>You hear:</b> ${esc(heard.text)}</div>` : ''}
      <div class="replies"><button class="btn gold" data-next>${tk.done ? 'Finish the conversation' : 'Go on'}</button></div>`;
  } else body = outcomeHTML(p, tk);
  return `<div class="town-inside"><div class="ti-bg">${interiorSVG(buildingOf(p.id).id)}</div><div class="talk-wrap"><div class="talk paper"><div class="talk-who">${look(p, mood)}<div><h2>${p.name}</h2><small>${p.role}</small>${warmth}${temperChips(p.id)}</div></div>${body}</div></div></div>`;
}

function outcomeHTML(p, tk) {
  const out = tk.outcome;
  const parting = out.parting ? `<div class="heard">&#128220; <b>Before you go:</b> ${esc(gossip(out.parting).text)}</div>` : '';
  const giftName = (g) => `${g.n} &times; ${trim(g.id)?.name || g.id}`;
  if (out.request) {
    const k = REQUEST_KINDS[out.request.kind];
    const o = tk.preview;
    return `<p class="said">${esc(out.request.line)}</p>${parting}
      <div class="offer ${out.request.kind}"><span class="kind-badge">${k.badge}</span><b>${k.name}</b> for <i>${esc(o.client)}</i> &middot; ${esc(o.occasion)}
        <div class="offer-terms">${o.charity ? `No fee - you give the materials. <b>Reputation +3</b> and <b>notice</b> that opens doors${o.gift ? `, and a keepsake: ${giftName(o.gift)}` : ''}.` : `Fee <b>${money(o.fee)}</b> &middot; materials up to <b>${money(o.budget)}</b>${o.gift ? ` &middot; plus ${giftName(o.gift)}` : ''}`}</div></div>
      <div class="replies"><button class="btn gold" data-accept>${o.charity ? 'Make it for her' : 'Accept - put it on my desk'}</button><button class="btn small ghost" data-refuse>Not now</button></div>`;
  }
  let line;
  if (!out.good) line = `${esc(p.bye)} <span class="aside">${pr(p).S} did not warm to you. The notebook may tell you what ${pr(p).s} likes.</span>`;
  else if (!p.requests.length) line = esc(p.bye);
  else {
    const mem = state.town.people?.[p.id] || {};
    const onDesk = state.orders.some((o) => o.townPerson === p.id) || state.job?.order?.townPerson === p.id;
    const full = state.orders.filter((o) => o.town).length >= MAX_TOWN_LETTERS;
    const wait = mem.lastReq != null ? mem.lastReq + REQUEST_COOLDOWN - state.made : 0;
    line = `${esc(p.bye)} <span class="aside">${onDesk ? `${pr(p).P} request is still on your desk.` : full ? 'Your desk is full of town requests - finish one first.' : wait > 0 ? `${pr(p).S} liked you. ${pr(p).S} may have more work in ${wait} commission${wait === 1 ? '' : 's'}.` : `${pr(p).S} liked you.`}</span>`;
  }
  return `<p class="said">${line}</p>${parting}<div class="replies"><button class="btn gold" data-back="inside">Back to ${esc(buildingOf(p.id).name)}</button><button class="btn small ghost" data-back="map">Out to the street</button></div>`;
}

function notebook() {
  const t = state.town;
  const who = PEOPLE.filter((p) => knownTemper(t.known, p.id).likes.length || knownTemper(t.known, p.id).dislikes.length);
  const heard = GOSSIP.filter((g) => (t.known || []).includes(g.id));
  modal(`<h2>&#128220; Gossip notebook</h2><div class="notebook">
    <h3>What you know about people</h3>${who.length ? who.map((p) => `<div class="nb-who"><b>${p.name}</b> <small>${buildingOf(p.id).name}</small>${temperChips(p.id)}</div>`).join('') : '<p><i>Nothing yet. Ask people questions - they love to talk about each other.</i></p>'}
    <h3>Heard in town <small>${heard.length} of ${GOSSIP.length}</small></h3>${heard.length ? heard.map((g) => `<p class="nb-g">${esc(g.text)} <small>- ${person(g.from).name}</small></p>`).join('') : '<p><i>You have not heard anything yet.</i></p>'}
  </div>`, [{ label: 'Close', kind: 'gold' }]);
}


function render(root) {
  state.town = townDay(state.town, state.made);
  const b = view.b && building(view.b);
  root.innerHTML = `<div class="town${isNight() ? ' night' : ''}">${view.talk ? talkView() : b ? insideView(b) : mapView()}</div>`;
  root.scrollTop = 0;
  wire(root);
  if (!b && !view.talk) {
    
    const wrap = $('.tm-wrap', root);
    if (wrap && wrap.scrollWidth > wrap.clientWidth) wrap.scrollLeft = mapScroll ?? (wrap.scrollWidth - wrap.clientWidth) * 0.5;
  }
}

function wire(root) {
  const on = (sel, fn) => root.querySelectorAll(sel).forEach((el) => { el.onclick = (e) => fn(el, e); });
  on('[data-notes]', () => { sfx.page(); notebook(); });
  
  on('[data-light]', () => {
    const night = !isNight();
    sceneState().night = night;
    save();
    night ? sfx.toNight() : sfx.toDay();
    if (night) setTimeout(() => sfx.lampOn(), 450);
    setScene({ night });
    const wrap = $('.tm-wrap', root);
    if (wrap) mapScroll = wrap.scrollLeft;
    render(root);
  });
  on('[data-back]', (el) => {
    sfx.page();
    const back = el.dataset.back;
    view = back === 'map' ? { b: null, talk: null } : { b: view.talk ? buildingOf(view.talk.id).id : view.b, talk: null };
    render(root);
  });
  
  root.querySelectorAll('.tm-b').forEach((g) => {
    const id = g.dataset.b;
    g.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') showCard(root, id); });
    let ptr = null;   
    g.addEventListener('pointerdown', (e) => { ptr = e.pointerType; });
    g.addEventListener('click', () => {
      const touch = ptr ? ptr !== 'mouse' : (touchedRecently() || isMobile());
      ptr = null;
      if (touch && card !== id) { sfx.click(); showCard(root, id, true); return; }
      enter(root, id);
    });
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); enter(root, id); } });
    
    g.addEventListener('focus', () => { if (g.matches(':focus-visible')) showCard(root, id); });
  });
  const view_ = $('.town-map-view', root);
  if (view_) view_.addEventListener('pointerdown', (e) => { if (!e.target.closest('.tm-b, .tm-card')) hideCard(root); });
  const mapEl = $('.tm-canvas', root);
  if (mapEl) mapEl.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !e.relatedTarget?.closest?.('.tm-card')) hideCard(root); });
  on('[data-who]', (el) => {
    const p = person(el.dataset.who);
    if (cannotTalk(p, state.town, ctx())) return;
    sfx.click();
    state.town = spendTalk(state.town, p.id, state.made);
    save();
    view = { b: buildingOf(p.id).id, talk: { ...startTalk(p, state.town), stage: 'topic' } };
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
    const outcome = talkOutcome(tk, p, state.town, ctx());
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
    view = { b: buildingOf(p.id).id, talk: null };
    render(root);
  });
  on('[data-refuse]', () => {
    const tk = view.talk, p = person(tk.id);
    state.town = answerRequest(state.town, p.id, state.made, false);
    save(); sfx.click();
    view = { b: buildingOf(p.id).id, talk: null };
    render(root);
  });
}

export default {
  enter(root, params = {}) {
    view = { b: params.b || null, talk: null };
    card = null;
    render(root);
  },
  leave() { view.talk = null; card = null; },
};


window.__town = () => ({ view: { b: view.b, card, talk: view.talk && { id: view.talk.id, round: view.talk.round, rapport: view.talk.rapport, stage: view.talk.stage } }, town: state.town, reactionOf: (id, a) => reactionOf(person(id), a), map: { w: MAP_W, h: MAP_H, layout: LAYOUT } });
