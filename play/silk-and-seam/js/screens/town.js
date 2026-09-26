











import { state, save, level } from '../state.js';
import { go, modal, money, toast, renderHud, checkAchievements, touchedRecently, isMobile, $ } from '../ui.js';
import { portraitSVG } from '../art.js';
import { DYES } from '../data.js';
import { sfx, setScene, speak, stopSpeaking } from '../audio.js';
import { trim } from '../logic.js';
import { townMapSVG, interiorSVG, legendIcon, LAYOUT, MAP_W, MAP_H } from '../townmap.js';
import { sceneState, isNight } from '../scene.js';
import {
  PEOPLE, BUILDINGS, GOSSIP, APPROACHES, REQUEST_KINDS, TALKS_PER_DAY, CONFLICTS, person, gossip, building,
  townDay, talksLeft, cannotTalk, spendTalk, startTalk, talkStep, talkOutcome, recordTalk, needOf, topicsOf, helloOf,
  conversationsOf, talksWith, whereIs, peopleIn, emotionOf, moodOf, canMediate, mediate, complaintOf, clueSource,
  isMended, isSeen, requestReady, requestOrder, answerRequest, knownTemper, standing, reactionOf, REQUEST_COOLDOWN, MAX_TOWN_LETTERS,
} from '../town.js';

let view = { b: null, talk: null };
let card = null;          
let mapScroll = null;     
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const look = (p, mood) => portraitSVG(p.look, DYES[(p.look * 3) % DYES.length].hex, mood);
const pick = (arr, seed) => arr[Math.abs(seed) % arr.length];

const pr = (p) => (p.he ? { s: 'he', S: 'He', o: 'him', p: 'his', P: 'His' } : { s: 'she', S: 'She', o: 'her', p: 'her', P: 'Her' });
const ctx = () => ({ made: state.made, rep: state.rep, orders: state.orders, job: state.job, lvl: level(), night: isNight() });
const where = (p) => whereIs(p, isNight());


const EMOTE = {
  love: '<path d="M12,20 C4,14 2,9 5,6 C8,3 11,5 12,8 C13,5 16,3 19,6 C22,9 20,14 12,20 Z" fill="#e0485e"/>',
  laugh: '<text x="12" y="16" text-anchor="middle" font-family="Georgia,serif" font-weight="bold" font-size="11" fill="#b8742e">ha!</text>',
  joy: '<path d="M12,2 L14.5,9 L22,9 L16,13.5 L18.5,21 L12,16.5 L5.5,21 L8,13.5 L2,9 L9.5,9 Z" fill="#f2c14e" stroke="#b28a35"/>',
  hmm: '<circle cx="6" cy="13" r="2" fill="#6b4a2f"/><circle cx="12" cy="13" r="2" fill="#6b4a2f"/><circle cx="18" cy="13" r="2" fill="#6b4a2f"/>',
  angry: '<path d="M5,5 Q10,9 9,12 M19,5 Q14,9 15,12 M5,19 Q10,15 9,12 M19,19 Q14,15 15,12" stroke="#d0312d" stroke-width="2.6" fill="none" stroke-linecap="round"/>',
  hurt: '<path d="M12,3 C15,9 18,12 18,15 A6,6 0 0 1 6,15 C6,12 9,9 12,3 Z" fill="#7fb6e0" stroke="#4a7fa8"/>',
  cold: '<path d="M4,12 H20 M12,4 V20 M6.5,6.5 L17.5,17.5 M17.5,6.5 L6.5,17.5" stroke="#7a9ab8" stroke-width="2" stroke-linecap="round"/>',
};
const emoteHTML = (e) => (e && EMOTE[e] ? `<span class="emote em-${e}" aria-hidden="true"><svg viewBox="0 0 24 24">${EMOTE[e]}</svg></span>` : '');


function personStatus(p) {
  const t = state.town, night = isNight();
  const why = cannotTalk(p, t, ctx());
  if (why === 'asleep') return { key: 'sleep', text: 'Asleep - the shutters are down till morning' };
  if (why === 'closed') return { key: 'closed', text: `Does not receive unknown ateliers <small>(standing ${standing(state.rep, t.notice)} / ${p.minStanding})</small>` };
  if (why === 'talked') return { key: 'done', text: 'You spoke today' };
  if (why === 'tired') return { key: 'done', text: 'It is getting late - finish a commission and come back' };
  if (canMediate(p, t, state.made)) return { key: 'mend', text: `You know enough to make peace - talk to ${pr(p).o}` };
  const ready = requestReady(p, t, ctx());
  const mem = t.people?.[p.id];
  
  const fresh = night && p.nightChat ? !mem?.nightHeard : mem?.met && talksWith(t, p.id) < conversationsOf(p).length;
  const news = night && p.nightChat && !mem?.nightHeard ? 'Out late - with things to say only at night' : 'Has something new to tell you';
  return { key: ready ? 'work' : 'talk', text: !mem?.met ? (ready ? `A stranger - ${pr(p).s} may have work` : 'A stranger') : ready ? (fresh ? `${news} - and might have work` : 'Might have work for you') : fresh ? news : p.requests.length ? 'Nothing for you just now - but talk anyway' : 'Always has gossip' };
}
function buildingStatus(b) {
  if (b.home) return 'home';
  const here = peopleIn(b, isNight());
  if (!here.length) return 'sleep';
  const s = here.map((id) => personStatus(person(id)).key);
  return s.includes('mend') ? 'mend' : s.includes('work') ? 'work' : s.includes('talk') ? 'talk' : s.every((k) => k === 'sleep') ? 'sleep' : s.every((k) => k === 'closed') ? 'closed' : 'done';
}
const STATUS_LINE = { mend: 'A quarrel you could mend', work: 'Work to be had', talk: 'Someone to talk to', done: 'Visited today', closed: 'The door is shut to you - for now', sleep: 'Dark for the night', home: 'Home' };

function temperChips(id) {
  const k = knownTemper(state.town.known, id);
  if (!k.likes.length && !k.dislikes.length) return '';
  return `<div class="temper">${k.likes.map((a) => `<span class="lk">&#9829; ${APPROACHES[a]}</span>`).join('')}${k.dislikes.map((a) => `<span class="dk">&#10005; ${APPROACHES[a]}</span>`).join('')}</div>`;
}

function bar() {
  const t = state.town, left = talksLeft(t, state.made);
  const open = CONFLICTS.filter((c) => isSeen(t, c.id) && !isMended(t, c.id)).length;
  return `<div class="town-bar">
    <span class="tb-talks" title="Conversations left until you finish another commission">${[...Array(TALKS_PER_DAY)].map((_, i) => `<i class="${i < left ? 'on' : ''}"></i>`).join('')} ${left ? `${left} talk${left === 1 ? '' : 's'} left today` : 'The day is done - finish a commission'}</span>
    <span class="tb-notice" title="Notice: word of mouth from free work and mended quarrels. Each point counts as 3 reputation at the Crescent's doors">Notice <b>${t.notice || 0}</b> &middot; standing <b>${standing(state.rep, t.notice)}</b></span>
    <button class="btn small" data-notes>&#128220; Notebook <b>${(t.known || []).length}/${GOSSIP.length}</b>${open ? ` <span class="tb-trouble" title="Quarrels in town you have heard of">&#9889;${open}</span>` : ''}</button>
    <button class="btn small tb-light" data-light title="${isNight() ? 'Bring back the day' : 'Let the night fall - the lamps come on, and the night owls come out'}">${isNight() ? '&#9728; Day' : '&#9790; Night'}</button>
  </div>`;
}


function mapView() {
  return `<div class="town-map-view"><div class="tm-wrap"><div class="tm-canvas">${townMapSVG(BUILDINGS, buildingStatus, { night: isNight() })}</div></div>
    <div class="tm-top"><h1>Thimblebury</h1>${bar()}</div>
    <div class="tm-legend">${[['mend', 'mend', 'lg-mend'], ['work', 'work', 'lg-work'], ['talk', 'talk'], ['done', 'visited'], ['closed', 'shut', 'lg-shut'], ...(isNight() ? [['sleep', 'asleep', 'lg-sleep']] : [])].map(([st, w, c]) => `<span${c ? ` class="${c}"` : ''}>${legendIcon(st)}${w}</span>`).join('')}</div>
    <div class="tm-card paper" hidden></div></div>`;
}
function cardHTML(b) {
  const st = buildingStatus(b), night = isNight();
  const folk = peopleIn(b, night).map(person);
  
  const out = night ? b.people.map(person).filter((p) => p.nightAt && p.nightAt !== b.id) : [];
  const visitors = folk.filter((p) => !b.people.includes(p.id));
  return `<div class="tc-head"><b>${b.name}</b><span class="tc-st ${st}">${STATUS_LINE[st]}</span></div><p>${esc(b.hint)}</p>` +
    (out.length ? `<p class="tc-away">${out.map((p) => `${p.name} is out - at ${building(p.nightAt).name} tonight.`).join(' ')}</p>` : '') +
    (visitors.length ? `<p class="tc-away">In tonight: ${visitors.map((p) => p.name).join(', ')}.</p>` : '') +
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
  const night = isNight();
  const folk = peopleIn(b, night).map(person);
  const out = night ? b.people.map(person).filter((p) => p.nightAt && p.nightAt !== b.id) : [];
  const empty = !folk.length ? `<p class="ti-empty paper">${out.length ? out.map((p) => `${esc(p.name)} has gone out - ${pr(p).s} is at ${esc(building(p.nightAt).name)} tonight.`).join(' ') : 'Nobody here at this hour.'}</p>` : '';
  return `<div class="town-inside"><div class="ti-bg">${interiorSVG(b.id)}</div>
    <div class="ti-head"><button class="btn small" data-back="map">&larr; Back to the street</button><h1>${b.name}</h1></div>
    ${bar()}<p class="ti-hint">${esc(b.hint)}</p>${empty}
    <div class="ti-folk">${folk.map((p) => {
      const s = personStatus(p);
      const open = s.key === 'work' || s.key === 'talk' || s.key === 'mend';
      const mood = s.key === 'sleep' ? 'sad' : s.key === 'work' || s.key === 'mend' ? 'happy' : 'neutral';
      return `<button class="ti-person ${s.key}" data-who="${p.id}"${open ? '' : ' disabled'}><span class="ti-portrait">${look(p, mood)}${s.key === 'sleep' ? '<span class="ti-zz">zZ</span>' : ''}</span>
        <span class="ti-plate paper"><b>${p.name}</b><small>${p.role}</small><em>${s.text}</em>${temperChips(p.id)}${open ? `<span class="ti-go">${s.key === 'mend' ? 'Make peace' : 'Talk'}</span>` : ''}</span></button>`;
    }).join('')}</div></div>`;
}

function talkView() {
  const tk = view.talk, p = person(tk.id);
  const need = needOf(p);
  const warmth = `<div class="warmth" title="How warmly ${pr(p).s} feels towards you - reach ${need} for ${pr(p).o} to trust you with work">${[...Array(need)].map((_, i) => `<i class="${i < tk.rapport ? 'on' : ''}"></i>`).join('')}<small>${tk.rapport >= need ? `${pr(p).s} likes you` : 'warmth'}</small></div>`;
  let body;
  if (tk.stage === 'topic') {
    const topic = topicsOf(p, tk)[tk.round];
    const order = [0, 1, 2].map((i) => (i + state.made + tk.round + p.id.length) % 3);
    body = `<p class="said">${tk.round === 0 ? `${esc(helloOf(p, tk))} ` : ''}${tk.round === 0 && tk.complaint ? `<span class="complaint">${esc(tk.complaint)}</span> ` : ''}${esc(topic.say)}</p>
      <div class="replies">${order.map((i) => `<button class="btn reply" data-r="${i}">&ldquo;${esc(topic.replies[i].t)}&rdquo;</button>`).join('')}</div>`;
  } else if (tk.stage === 'react') {
    const heard = tk.newHeard ? gossip(tk.newHeard) : null;
    body = `<p class="said react ${tk.last}">${esc(tk.reactLine)}</p>${heard ? `<div class="heard">&#128220; <b>You hear:</b> ${esc(heard.text)}</div>` : ''}
      <div class="replies"><button class="btn gold" data-next>${tk.done ? 'Finish the conversation' : 'Go on'}</button></div>`;
  } else if (tk.stage === 'mediate') {
    const c = CONFLICTS.find((x) => x.id === tk.mediate);
    const other = person(c.a === p.id ? c.b : c.a);
    const order = [0, 1, 2].map((i) => (i + state.made + p.id.length) % 3);
    body = `<div class="mediate"><b>&#9774; ${esc(c.title)}</b><p>You know the truth of ${pr(p).p} quarrel with ${esc(other.name)}:</p>${c.clues.map((g) => `<p class="nb-g">${esc(gossip(g).text)}</p>`).join('')}<p>How will you tell ${pr(p).o}?</p></div>
      <div class="replies">${order.map((i) => `<button class="btn reply" data-tell="${i}">&ldquo;${esc(c.tell[i].t)}&rdquo;</button>`).join('')}<button class="btn small ghost" data-tell="skip">Say nothing - not today</button></div>`;
  } else if (tk.stage === 'mediated') {
    body = `<p class="said react ${tk.last}">${esc(tk.reactLine)}</p>${tk.mended ? `<div class="heard mended">&#9774; <b>Mended.</b> Word gets round: notice +2. ${pr(p).S} and ${esc(person(tk.mendedWith).name)} may both have new work for you.</div>` : `<div class="heard">${pr(p).S} will not hear it today. Try another day - and mind how ${pr(p).s} likes to be spoken to.</div>`}
      <div class="replies"><button class="btn gold" data-next>Go on</button></div>`;
  } else body = outcomeHTML(p, tk);
  const bg = interiorSVG(where(p).id);
  return `<div class="town-inside"><div class="ti-bg">${bg}</div><div class="talk-wrap"><div class="talk paper"><div class="talk-who"><span class="talk-face em-${tk.emotion || 'hmm'}">${look(p, moodOf(tk.emotion))}${emoteHTML(tk.emoteNow && tk.emotion)}</span><div><h2>${p.name}</h2><small>${p.role}</small>${warmth}${temperChips(p.id)}</div></div>${body}</div></div></div>`;
}

function outcomeHTML(p, tk) {
  const out = tk.outcome;
  const parting = out.parting ? `<div class="heard">&#128220; <b>Before you go:</b> ${esc(gossip(out.parting).text)}</div>` : '';
  const giftName = (g) => `${g.n} &times; ${trim(g.id)?.name || g.id}`;
  if (out.request) {
    const k = REQUEST_KINDS[out.request.kind];
    const o = tk.preview;
    return `<p class="said">${esc(out.request.line)}</p>${parting}
      <div class="offer ${out.request.kind}"><span class="kind-badge">${k.badge}</span>${out.request.after ? '<span class="kind-badge mend-badge">&#9774; Peace made</span>' : ''}${out.request.when === 'night' ? '<span class="kind-badge night-badge">&#9790; Night work</span>' : ''}<b>${k.name}</b> for <i>${esc(o.client)}</i> &middot; ${esc(o.occasion)}
        <div class="offer-terms">${o.charity ? `No fee - you give the materials. <b>Reputation +3</b> and <b>notice</b> that opens doors${o.gift ? `, and a keepsake: ${giftName(o.gift)}` : ''}.` : `Fee <b>${money(o.fee)}</b> &middot; materials up to <b>${money(o.budget)}</b>${o.gift ? ` &middot; plus ${giftName(o.gift)}` : ''}`}</div></div>
      <div class="replies"><button class="btn gold" data-accept>${o.charity ? `Make it for ${pr(p).o}` : 'Accept - put it on my desk'}</button><button class="btn small ghost" data-refuse>Not now</button></div>`;
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
  return `<p class="said">${line}</p>${parting}<div class="replies"><button class="btn gold" data-back="inside">Back to ${esc(where(p).name)}</button><button class="btn small ghost" data-back="map">Out to the street</button></div>`;
}

function notebook() {
  const t = state.town;
  const who = PEOPLE.filter((p) => knownTemper(t.known, p.id).likes.length || knownTemper(t.known, p.id).dislikes.length);
  const heard = GOSSIP.filter((g) => (t.known || []).includes(g.id));
  const seen = CONFLICTS.filter((c) => isSeen(t, c.id));
  const trouble = seen.map((c) => {
    const med = person(c.mediator);
    if (isMended(t, c.id)) return `<div class="nb-trouble mended"><b>&#9774; ${esc(c.title)}</b> <small>mended</small></div>`;
    const clues = c.clues.map((g) => {
      if ((t.known || []).includes(g)) return `<li class="got">&#10003; ${esc(gossip(g).text)}</li>`;
      const src = clueSource(g), holder = person(src.who);
      return `<li>&#10067; Something ${esc(holder.name)} knows${src.night ? ' - and only says after dark' : ''}.</li>`;
    }).join('');
    const ready = c.clues.every((g) => (t.known || []).includes(g));
    return `<div class="nb-trouble"><b>&#9889; ${esc(c.title)}</b> <small>${esc(person(c.a).name)} and ${esc(person(c.b).name)}</small><p>${esc(c.blurb)}</p><ul>${clues}</ul>` +
      `<p class="nb-next">${ready ? `You know enough. Talk to <b>${esc(med.name)}</b> and tell ${pr(med).o} - the way ${pr(med).s} likes.` : `When you know both, <b>${esc(med.name)}</b> is the one to tell.`}</p></div>`;
  }).join('');
  modal(`<h2>&#128220; Gossip notebook</h2><div class="notebook">
    <h3>Troubles in town <small>${seen.filter((c) => isMended(t, c.id)).length} of ${CONFLICTS.length} mended</small></h3>${seen.length ? trouble : '<p><i>No quarrels you know of. People will tell you their troubles once they know you.</i></p>'}
    <h3>What you know about people</h3>${who.length ? who.map((p) => `<div class="nb-who"><b>${p.name}</b> <small>${where(p).name}</small>${temperChips(p.id)}</div>`).join('') : '<p><i>Nothing yet. Ask people questions - they love to talk about each other.</i></p>'}
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
  
  const tk = view.talk;
  if (tk?.voiceLine) { speak(person(tk.id).voice, tk.voiceLine, tk.emotion); tk.voiceLine = null; }
}


function voiced(p, tk) {
  if (tk.stage === 'topic') return `${tk.round === 0 ? `${helloOf(p, tk)} ${tk.complaint || ''} ` : ''}${topicsOf(p, tk)[tk.round].say}`;
  if (tk.stage === 'end') return tk.outcome.request ? tk.outcome.request.line : p.bye;
  return tk.reactLine;
}
function show(root, talk) {
  const p = person(talk.id);
  view.talk = { ...talk, voiceLine: voiced(p, talk) };
  render(root);
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
    stopSpeaking();
    const back = el.dataset.back;
    view = back === 'map' ? { b: null, talk: null } : { b: view.talk ? where(person(view.talk.id)).id : view.b, talk: null };
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
    const complaint = complaintOf(p, state.town);
    state.town = spendTalk(state.town, p.id, state.made);
    save();
    view = { b: where(p).id, talk: null };
    show(root, { ...startTalk(p, state.town, { night: isNight() }), stage: 'topic', emotion: complaint ? p.voice?.temper || 'cold' : 'hmm', complaint });
  });
  on('[data-r]', (el) => {
    const tk = view.talk, p = person(tk.id);
    const before = tk.heard.length;
    const i = +el.dataset.r;
    const approach = topicsOf(p, tk)[tk.round].replies[i].a;
    const next = talkStep(tk, p, i);
    const kind = next.last;
    const known = state.town.known || [];
    const fresh = next.heard.length > before && !known.includes(next.heard[next.heard.length - 1]) ? next.heard[next.heard.length - 1] : null;
    if (kind === 'liked') sfx.pin(); else if (kind === 'disliked') sfx.error(); else sfx.click();
    show(root, { ...next, stage: 'react', reactLine: pick(p.react[kind], state.made + tk.round), newHeard: fresh, emotion: emotionOf(p, kind, approach), emoteNow: true });
  });
  
  const finish = (tk) => {
    const p = person(tk.id);
    const outcome = talkOutcome(tk, p, state.town, ctx());
    state.town = recordTalk(state.town, tk, outcome, state.made);
    const preview = outcome.request ? requestOrder(p, outcome.request, level(), Math.random) : null;
    save();
    checkAchievements();
    if (outcome.good) sfx.sparkle();
    show(root, { ...tk, stage: 'end', outcome, preview, emotion: outcome.good ? (outcome.request ? 'joy' : 'love') : tk.emotion, emoteNow: !!outcome.request });
  };
  on('[data-next]', () => {
    const tk = view.talk, p = person(tk.id);
    sfx.page();
    if (!tk.done) { show(root, { ...tk, stage: 'topic', emoteNow: false }); return; }
    
    const c = !tk.mediated && canMediate(p, state.town, state.made);
    if (c) { view.talk = { ...tk, stage: 'mediate', mediate: c.id, emoteNow: false }; render(root); return; }
    finish(tk);
  });
  on('[data-tell]', (el) => {
    const tk = view.talk, p = person(tk.id);
    const c = CONFLICTS.find((x) => x.id === tk.mediate);
    if (el.dataset.tell === 'skip') { sfx.click(); finish({ ...tk, mediated: true }); return; }
    const res = mediate(state.town, c, p, +el.dataset.tell, tk.rapport, state.made);
    state.town = res.town;
    save();
    if (res.ok) { sfx.fanfare(); renderHud(); checkAchievements(); } else sfx.error();
    show(root, { ...tk, stage: 'mediated', mediated: true, mended: res.ok, mendedWith: c.a === p.id ? c.b : c.a, last: res.ok ? 'liked' : 'disliked', reactLine: res.ok ? c.ok : c.fail, emotion: res.ok ? 'joy' : emotionOf(p, 'disliked'), emoteNow: true });
  });
  on('[data-accept]', () => {
    const tk = view.talk, p = person(tk.id);
    stopSpeaking();
    state.orders.unshift(tk.preview);   
    state.town = answerRequest(state.town, p.id, state.made, true, tk.outcome.request);
    save(); sfx.coin(); renderHud();
    toast(tk.preview.charity ? `You will make ${tk.preview.client}'s dress. It is on your desk.` : `A new commission from ${tk.preview.client} is on your desk`, 'good', 2400);
    view = { b: where(p).id, talk: null };
    render(root);
  });
  on('[data-refuse]', () => {
    const tk = view.talk, p = person(tk.id);
    stopSpeaking();
    state.town = answerRequest(state.town, p.id, state.made, false);
    save(); sfx.click();
    view = { b: where(p).id, talk: null };
    render(root);
  });
}

export default {
  enter(root, params = {}) {
    view = { b: params.b || null, talk: null };
    card = null;
    render(root);
  },
  leave() { stopSpeaking(); view.talk = null; card = null; },
};


window.__town = () => ({ view: { b: view.b, card, talk: view.talk && { id: view.talk.id, set: view.talk.set, round: view.talk.round, rapport: view.talk.rapport, stage: view.talk.stage, emotion: view.talk.emotion } }, town: state.town, reactionOf: (id, a) => reactionOf(person(id), a), map: { w: MAP_W, h: MAP_H, layout: LAYOUT } });
