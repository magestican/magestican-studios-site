




import { HOUSES, TITANS } from '../../../web-engine/titan-bash/titans.js';
import { stickFrom } from './input.js';
import { INPUT_HZ, MSG, encodeInput, decodeStatus, createLatencyLog, phoneEndLine, phoneNameLine } from './wire.js';
import { createPhoneLink } from './net.js';
import { T as RT, PAINTS, EMBLEMS, addStars, equip, loadStars, saveStars, nextUnlock } from '../../../web-engine/titan-bash/rewards.js';

const PROFILE_KEY = 'magestican:v1:titan-bash:profile'; 
const readProfile = () => { try { return JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}') || {}; } catch { return {}; } };
const writeProfile = (p) => { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch {  } };
const store = (() => { try { return localStorage; } catch { return null; } })();

const $ = (id) => document.getElementById(id);


const capture = (el, e) => { try { el.setPointerCapture(e.pointerId); } catch {  } };
const HOUSE = Object.fromEntries(HOUSES.map((h) => [h.id, h]));

export function startPhone(code) {
  document.body.classList.add('tb-phone-mode');
  for (const s of ['title', 'match', 'end']) $(s).hidden = true;
  $('phone').hidden = false;
  const say = (text) => { $('ph-state').textContent = text; $('ph-state').hidden = !text; };
  say(`Joining ${code.toUpperCase()}...`);

  const held = { fire: false, boost: false, ability: false };
  let stick = { mx: 0, my: 0 }; let aim = null; let seq = 0; let lastStatus = 0;
  const latency = createLatencyLog();

  const link = createPhoneLink(code, {
    onSeat(m) {
      const first = !seat;
      seat = m;
      
      if (first) {
        const prof = readProfile();
        const want = { paint: stars.paint, emblem: stars.emblem };
        if (typeof prof.rookie === 'boolean' && prof.rookie !== !!m.rookie) want.rookie = prof.rookie;
        pick(want);
      }
      const h = HOUSE[m.house];
      if (h) paintHouse(h, m.titan);
      paintPick();
    },
    onStatus(raw) {
      const s = decodeStatus(raw); if (!s) return;
      lastStatus = performance.now();
      latency.ack(s.ack, s.ackAge);
      const h = HOUSE[s.house]; if (h) paintHouse(h, s.titan, s.team);
      $('ph-heat').style.width = `${s.heat}%`;
      $('ph-heat').classList.toggle('hot', s.heat >= 75);
      $('ph-armour').style.width = `${Math.round(s.armour * 100)}%`;
      $('ph-armour').classList.toggle('low', s.armour <= 0.35); 
      $('ph-bells').textContent = `${s.bells} Bells`;
      $('ph-ability').style.setProperty('--cd', `${Math.round(s.cooldown * 360)}deg`);
      $('ph-boost').textContent = s.stalled ? 'Vent' : 'Boost';
      
      for (const [id, key] of [['ph-fire', 'fire'], ['ph-boost', 'boost'], ['ph-ability', 'ability']]) $(id).classList.toggle('dim', !s.lit[key]);
      if (s.state !== state) { state = s.state; if (state !== 'warm') pickOpen = false; paintPick(); }
      if (state === 'warm' && !pickOpen) say(s.hint || 'Warm up: drive your Titan. The host starts when everyone is in.');
    },
    onReward(msg) {
      const n = Math.max(0, Math.floor(Number(msg.stars) || 0));
      const res = addStars(stars, n);
      stars = res.record; if (store) saveStars(store, 'phone', stars);
      fresh = res.unlocked.map((u) => u.name);
      tip = typeof msg.tip === 'string' && RT.tip[msg.tip] ? RT.tip[msg.tip] : null;
      paintStars();
    },
    
    onEvent() {},
    onState(state) {
      if (state === 'joining') say(`Joining ${code.toUpperCase()}...`);
      else if (state === 'full') say('That room has eight pilots already.');
      else if (state === 'closed') say('The screen closed the room.');
      else if (state.startsWith('failed')) say('Could not reach that room. Check the code on the big screen.');
    },
  });

  
  let seat = null; let state = 'title'; let pickOpen = false;
  let stars = store ? loadStars(store, 'phone') : loadStars({ getItem: () => null }); let fresh = []; let tip = null;
  const cap = (w) => w[0].toUpperCase() + w.slice(1);
  const pick = (p) => link.send({ t: MSG.PICK, ...p });
  const houseBtn = new Map(); const titanBtn = new Map();
  for (const h of HOUSES) {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = h.name; b.style.background = h.colour;
    b.addEventListener('click', () => pick({ house: h.id })); $('ph-houses').append(b); houseBtn.set(h.id, b);
  }
  for (const id of Object.keys(TITANS)) {
    
    const b = document.createElement('button'); b.type = 'button'; b.dataset.titan = id;
    const face = document.createElement('span'); face.className = 'ph-face'; face.setAttribute('aria-hidden', 'true');
    const word = document.createElement('span'); word.textContent = cap(id); b.append(face, word);
    b.addEventListener('click', () => pick({ titan: id })); $('ph-titans').append(b); titanBtn.set(id, b);
  }
  function paintPick() {
    
    const picking = !!seat && (state === 'warm' ? pickOpen : state !== 'play');
    $('ph-pick').hidden = !picking;
    document.querySelector('.ph-pad').hidden = picking;
    $('ph-toggle').hidden = state !== 'warm';
    $('ph-toggle').textContent = pickOpen ? 'Back to the warm-up' : 'Pick House and Titan';
    if (state === 'play' || (state === 'warm' && !pickOpen)) { if (state === 'play') say(''); return; }
    if (!seat) return;
    
    
    
    const taken = new Set(seat.taken || []);
    for (const h of HOUSES) {
      const b = houseBtn.get(h.id);
      b.setAttribute('aria-pressed', String(h.id === seat.house)); b.disabled = taken.has(h.id);
    }
    for (const [id, b] of titanBtn) b.setAttribute('aria-pressed', String(id === seat.titan));
    $('ph-rookie').checked = !!seat.rookie;
    $('ph-ready').setAttribute('aria-pressed', String(!!seat.ready));
    $('ph-ready').textContent = seat.ready ? 'Ready!' : 'Ready';
    $('ph-start').hidden = !seat.host;
    say(phoneEndLine(state)
      || (seat.host ? 'You are the host: press Start when everyone is in.' : 'Pick, press Ready, then the host starts.'));
  }
  $('ph-toggle').addEventListener('click', () => { pickOpen = !pickOpen; paintPick(); });
  $('ph-rookie').addEventListener('change', (e) => { writeProfile({ ...readProfile(), rookie: e.target.checked }); pick({ rookie: e.target.checked }); });

  
  $('ph-paint-label').textContent = RT.stars.paint; $('ph-emblem-label').textContent = RT.stars.emblem;
  const option = (value, text) => { const o = document.createElement('option'); o.value = value; o.textContent = text; return o; };
  function paintStars() {
    $('ph-star-count').textContent = `${RT.stars.earned}: ${stars.count}`;
    $('ph-star-new').hidden = !fresh.length; $('ph-star-new').textContent = fresh.length ? `${RT.stars.new}: ${fresh.join(', ')}` : '';
    const nx = nextUnlock(stars.count);
    $('ph-star-next').textContent = nx ? `${RT.stars.next}: ${nx.name} (${nx.need} more)` : '';
    $('ph-tip').hidden = !tip; $('ph-tip').textContent = tip || '';
    const ps = $('ph-paint'); ps.textContent = ''; ps.append(option('', RT.stars.housePaint));
    for (const p of PAINTS) if (stars.paints.includes(p.id)) ps.append(option(p.id, p.name));
    ps.value = stars.paint || '';
    const es = $('ph-emblem'); es.textContent = ''; es.append(option('', RT.stars.noEmblem));
    for (const e of EMBLEMS) if (stars.emblems.includes(e.id)) es.append(option(e.id, `${e.glyph} ${e.name}`));
    es.value = stars.emblem || '';
  }
  for (const kind of ['paint', 'emblem']) {
    $(`ph-${kind}`).addEventListener('change', (e) => {
      stars = equip(stars, kind, e.target.value || null); if (store) saveStars(store, 'phone', stars);
      pick({ [kind]: stars[kind] });
    });
  }
  paintStars();
  $('ph-ready').addEventListener('click', () => pick({ ready: !seat?.ready }));
  $('ph-start').addEventListener('click', () => link.send({ t: MSG.START }));

  function paintHouse(h, titan, team = 0) {
    
    
    $('ph-strip').style.backgroundColor = h.colour;
    $('ph-name').textContent = phoneNameLine(h.name, titan, team);
  }

  
  const zone = $('ph-stick'); const knob = $('ph-knob'); let sid = null; let ox = 0; let oy = 0;
  const R = () => Math.max(40, Math.min(80, zone.clientWidth * 0.22));
  zone.addEventListener('pointerdown', (e) => {
    if (sid !== null) return; sid = e.pointerId;
    const r = zone.getBoundingClientRect(); ox = e.clientX - r.left; oy = e.clientY - r.top;
    capture(zone, e);
    knob.hidden = false; knob.style.left = `${ox}px`; knob.style.top = `${oy}px`; e.preventDefault();
  });
  zone.addEventListener('pointermove', (e) => {
    if (e.pointerId !== sid) return;
    const r = zone.getBoundingClientRect();
    stick = stickFrom(ox, oy, e.clientX - r.left, e.clientY - r.top, R());
    knob.style.transform = `translate(calc(-50% + ${stick.mx * R()}px), calc(-50% + ${stick.my * R()}px))`;
  });
  const endStick = (e) => { if (e.pointerId !== sid) return; sid = null; stick = { mx: 0, my: 0 }; knob.hidden = true; knob.style.transform = ''; };
  zone.addEventListener('pointerup', endStick); zone.addEventListener('pointercancel', endStick);

  
  for (const [id, key] of [['ph-fire', 'fire'], ['ph-boost', 'boost'], ['ph-ability', 'ability']]) {
    const b = $(id); let fx = 0; let fy = 0;
    b.addEventListener('pointerdown', (e) => {
      held[key] = true; b.classList.add('down'); fx = e.clientX; fy = e.clientY; capture(b, e); e.preventDefault();
    });
    if (key === 'fire') {
      b.addEventListener('pointermove', (e) => {
        if (!held.fire) return;
        const a = stickFrom(fx, fy, e.clientX, e.clientY, 60);
        aim = Math.hypot(a.mx, a.my) > 0.4 ? { ax: a.mx, ay: a.my } : null;
      });
    }
    const up = () => { held[key] = false; b.classList.remove('down'); if (key === 'fire') aim = null; };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
  }
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  
  setInterval(() => {
    seq += 1;
    latency.sent(seq);
    link.send(encodeInput({ ...stick, ...held, ...(aim || {}) }, seq));
    if (lastStatus && performance.now() - lastStatus > 2500) say('Reconnecting... a CPU pilot is flying your Titan.');
  }, 1000 / INPUT_HZ);
  addEventListener('pagehide', () => link.leave());

  
  
  const showLag = new URLSearchParams(location.search).has('lag');
  setInterval(() => {
    const p95 = latency.p95(); if (p95 === null) return;
    const line = `link p95 rtt ${Math.round(p95)} ms (~${Math.round(p95 / 2 + 17)} ms input-to-screen), n=${latency.count()}`;
    console.info(`[titan-bash] ${line}`);
    if (showLag && state === 'play') say(line);
  }, 10000);
}
