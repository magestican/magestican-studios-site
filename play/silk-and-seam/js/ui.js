
import { state, save, level } from './state.js';
import { levelProgress, clientMatch, sameAsLast, stars, tagText, reducedMotion, needsNote, repTier, newAchievements, shopValue } from './logic.js';
import { TAGS, AUNT, ACHIEVEMENTS } from './data.js';
import { sfx, setMuted, unlockAudio, applyVolume } from './audio.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const money = (n) => `£${Math.round(n).toLocaleString('en-GB')}`;

const screens = {};
let current = null, currentName = '';
export function register(name, mod) { screens[name] = mod; }


const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
export const calm = () => reducedMotion(state.settings?.motion, mq?.matches);
export function applyMotion() { document.body.classList.toggle('calm', calm()); }
mq?.addEventListener?.('change', applyMotion);


const STEP_TITLE = { sketch: 'Sketch Book', cut: 'Cutting Table', sew: 'Sewing Machine', embellish: 'Embellishing', reveal: 'The Reveal' };
function pageTurn(from) {
  $$('.leaf').forEach((l) => l.remove());
  const leaf = document.createElement('div');
  leaf.className = 'leaf paper';
  leaf.innerHTML = `<div class="leaf-in"><h2>${STEP_TITLE[from]}</h2><div class="leaf-rule"></div><p>done &#10003;</p></div>`;
  $('#stage').appendChild(leaf);
  sfx.page();
  const end = () => leaf.remove();
  leaf.addEventListener('animationend', end);
  setTimeout(end, 1200);
}

export function go(name, params) {
  if (current && current.leave) current.leave();
  const from = currentName;
  const root = $('#screen');
  root.innerHTML = '';
  root.className = `screen screen-${name}`;
  current = screens[name];
  currentName = name;
  hideTip();
  current.enter(root, params || {});
  renderHud();
  if (from !== name && STEP_TITLE[from] && STEP_TITLE[name] && !calm()) pageTurn(from);
}


export function letter(html, label, onClose) {
  const w = modal(`<div class="letter-head">From the desk of <i>Marguerite Delacroix</i></div>${html}<div class="letter-sign">- Aunt Marguerite</div>`, [{ label, kind: 'gold', onClick: onClose }]);
  $('.modal', w).classList.add('aunt-letter');
  return w;
}

export function auntNote(step) {
  if (!needsNote(state.notes, step)) return;
  state.notes = { ...(state.notes || {}), [step]: true };
  save();
  letter(`<h2>${AUNT[step].title}</h2><p class="letter-body">${AUNT[step].body}</p>`, 'Thank you, Auntie');
}


const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
export const tipData = (name, tags, note = '') => `${name}||${tagText(tags)}${note ? `||${note}` : ''}`;
export const tip = (name, tags, note = '') => ` data-tip="${esc(tipData(name, tags, note))}"`;
let tipEl = null, tipFor = null;
function stageScale() { return $('#stage').getBoundingClientRect().width / 1280; }
function showTip(el, x, y) {
  if (!tipEl) { tipEl = document.createElement('div'); tipEl.className = 'tip'; $('#stage').appendChild(tipEl); }
  if (!tipEl.isConnected) $('#stage').appendChild(tipEl);
  const [name, tags, note] = el.dataset.tip.split('||');
  tipEl.innerHTML = `<b>${name}</b><span>${tags}</span>${note ? `<small>${note}</small>` : ''}`;
  tipFor = el;
  const sr = $('#stage').getBoundingClientRect(), sc = stageScale();
  let px = (x - sr.left) / sc + 16, py = (y - sr.top) / sc + 18;
  tipEl.style.display = 'block';
  const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  if (px + w > 1270) px = Math.max(10, px - w - 28);
  if (py + h > 710) py = Math.max(60, py - h - 30);
  tipEl.style.left = `${px}px`; tipEl.style.top = `${py}px`;
}
export function hideTip() { if (tipEl) tipEl.style.display = 'none'; tipFor = null; }


let lastTouch = 0, pressTimer = 0, pressShown = false, pressAt = null;
export const touchedRecently = () => performance.now() - lastTouch < 800;
document.addEventListener('pointerover', (e) => {
  if (e.pointerType === 'touch') return;
  const el = e.target.closest?.('[data-tip]');
  if (el) showTip(el, e.clientX, e.clientY); else if (tipFor) hideTip();
});
document.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') {
    if (pressAt && Math.hypot(e.clientX - pressAt.x, e.clientY - pressAt.y) > 12) { clearTimeout(pressTimer); pressAt = null; }
    return;
  }
  if (tipFor && tipFor.isConnected) showTip(tipFor, e.clientX, e.clientY);
});
document.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'touch') return;
  lastTouch = performance.now();
  clearTimeout(pressTimer); pressShown = false;
  if (tipFor) hideTip();
  const el = e.target.closest?.('[data-tip]');
  if (!el) return;
  pressAt = { x: e.clientX, y: e.clientY };
  pressTimer = setTimeout(() => { pressShown = true; showTip(el, pressAt.x, pressAt.y - 40); }, 450);
}, true);
const endPress = (e) => { if (e.pointerType === 'touch') { lastTouch = performance.now(); clearTimeout(pressTimer); pressAt = null; } };
document.addEventListener('pointerup', endPress, true);
document.addEventListener('pointercancel', endPress, true);
document.addEventListener('click', (e) => { if (pressShown) { pressShown = false; e.stopPropagation(); e.preventDefault(); } }, true);
document.addEventListener('contextmenu', (e) => { if (touchedRecently()) e.preventDefault(); }, true);
document.addEventListener('focusin', (e) => {
  const el = e.target.closest?.('[data-tip]');
  if (el && el.matches(':focus-visible')) { const r = el.getBoundingClientRect(); showTip(el, r.left + r.width * 0.6, r.bottom - 10); }
});

document.addEventListener('focusout', () => { if (!touchedRecently()) hideTip(); });


export function openSettings() {
  const s = state.settings;
  const pct = (v) => Math.round(v * 100);
  const w = modal(`<h2>Settings</h2><div class="settings">
    <label>Master volume <input type="range" min="0" max="100" value="${pct(s.master)}" data-k="master"><output>${pct(s.master)}%</output></label>
    <label>Effects <small>(snips, chimes)</small> <input type="range" min="0" max="100" value="${pct(s.sfx)}" data-k="sfx"><output>${pct(s.sfx)}%</output></label>
    <div class="motion-row">Motion <span class="seg">${[['auto', 'Follow system'], ['on', 'Reduced'], ['off', 'Full']].map(([k, l]) => `<button class="chip ${s.motion === k ? 'on' : ''}" data-m="${k}">${l}</button>`).join('')}</span></div>
    <p class="hint">${mq ? `Your system currently ${mq.matches ? 'asks for' : 'does not ask for'} reduced motion.` : ''}</p></div>`, [{ label: 'Done', kind: 'gold' }]);
  $$('input[type=range]', w).forEach((inp) => {
    inp.oninput = () => { unlockAudio(); s[inp.dataset.k] = inp.value / 100; inp.nextElementSibling.textContent = `${inp.value}%`; applyVolume(); save(); };
    inp.onchange = () => sfx.snip();
  });
  $$('[data-m]', w).forEach((b) => {
    b.onclick = () => { s.motion = b.dataset.m; save(); applyMotion(); sfx.click(); $$('[data-m]', w).forEach((x) => x.classList.toggle('on', x === b)); };
  });
}

export function fitStage() {
  const stage = $('#stage');
  const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  stage.style.transform = `translate(-50%, -50%) scale(${s})`;
}

export function renderHud() {
  const lp = levelProgress(state.xp);
  const rt = repTier(state.rep || 0);
  $('#hud').innerHTML = `
    <button class="brand" data-go="hub" title="Back to the atelier">Silk <span>&amp;</span> Seam</button>
    <div class="hud-stat coin" title="Money">${money(state.money)}</div>
    <div class="hud-stat rep"${tip(`Reputation ${state.rep || 0}`, {}, `${rt.name}${rt.next !== null ? ` &middot; ${rt.next - (state.rep || 0)} more for ${rt.nextName}` : ''} &middot; stars earn reputation; premium clients write to a well-known atelier`)}><span class="rep-ico">&#10087;</span>${state.rep || 0}<small>${rt.name}</small></div>
    <div class="hud-level" title="${lp.span ? `${lp.into} / ${lp.span} XP to next level` : 'Max level'}">
      <span class="lv">Lv ${lp.lvl}</span><span class="xpbar"><i style="width:${(lp.frac * 100).toFixed(1)}%"></i></span>
    </div>
    <button class="hud-btn" data-mute title="Sound on/off">${state.muted ? '🔇' : '🔊'}</button>
    <button class="hud-btn gear" data-settings title="Settings" aria-label="Settings"><svg viewBox="0 0 24 24" width="24" height="24"><path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6zm8.4 5.1-1.9-.3a6.8 6.8 0 0 1-.7 1.7l1.1 1.6-1.6 1.6-1.6-1.1c-.5.3-1.1.6-1.7.7l-.3 1.9h-2.3l-.3-1.9a6.8 6.8 0 0 1-1.7-.7l-1.6 1.1-1.6-1.6 1.1-1.6c-.3-.5-.6-1.1-.7-1.7l-1.9-.3v-2.3l1.9-.3c.1-.6.4-1.2.7-1.7L5.7 6.8l1.6-1.6 1.6 1.1c.5-.3 1.1-.6 1.7-.7l.3-1.9h2.3l.3 1.9c.6.1 1.2.4 1.7.7l1.6-1.1 1.6 1.6-1.1 1.6c.3.5.6 1.1.7 1.7l1.9.3z" fill="#e6c46a" stroke="#6b4a1c" stroke-width=".8"/></svg></button>`;
  $('[data-go=hub]', $('#hud')).onclick = () => { sfx.click(); go('hub'); };
  $('[data-settings]', $('#hud')).onclick = () => { unlockAudio(); sfx.click(); openSettings(); };
  $('[data-mute]', $('#hud')).onclick = () => { unlockAudio(); setMuted(!state.muted); save(); renderHud(); };
}

export function toast(msg, kind = '', ms = 1800) {
  const t = document.createElement('div');
  t.className = `toast ${kind}`;
  t.textContent = msg;
  
  const n = $$('.toast:not(.out)').length;
  if (n) t.style.top = `${80 + n * 52}px`;
  $('#stage').appendChild(t);
  setTimeout(() => t.classList.add('out'), ms);
  setTimeout(() => t.remove(), ms + 500);
}



export function checkAchievements() {
  const got = newAchievements(state);
  if (!got.length) return [];
  state.achievements = { ...(state.achievements || {}) };
  got.forEach((id, i) => {
    state.achievements[id] = true;
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    setTimeout(() => { toast(`Achievement: ${a.name}`, 'ach', 2600); sfx.sparkle?.(); }, 300 + i * 700);
  });
  save();
  return got;
}
export function openAchievements() {
  const have = state.achievements || {};
  const n = ACHIEVEMENTS.filter((a) => have[a.id]).length;
  const w = modal(`<h2>Achievements <small>${n} / ${ACHIEVEMENTS.length}</small></h2><div class="ach-list">${ACHIEVEMENTS.map((a) => `
    <div class="ach ${have[a.id] ? 'got' : ''}"><span class="medal">${have[a.id] ? '&#9733;' : '&#9734;'}</span><div><b>${a.name}</b><small>${a.desc}</small></div></div>`).join('')}</div>`, [{ label: 'Close', kind: 'gold' }]);
  $('.modal', w).classList.add('ach-modal');
  return w;
}

export function modal(html, buttons) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-wrap';
  wrap.innerHTML = `<div class="modal paper">${html}<div class="modal-btns"></div></div>`;
  const row = $('.modal-btns', wrap);
  for (const b of buttons) {
    const el = document.createElement('button');
    el.className = `btn ${b.kind || ''}`;
    el.textContent = b.label;
    el.onclick = () => { sfx.click(); wrap.remove(); b.onClick && b.onClick(); };
    row.appendChild(el);
  }
  $('#stage').appendChild(wrap);
  return wrap;
}

export function starRow(n, max = 5) {
  return `<span class="stars">${'★'.repeat(n)}<span class="off">${'★'.repeat(max - n)}</span></span>`;
}



export function tagBars(tags, order, { only = false } = {}) {
  const wants = Object.fromEntries((order?.wants || []).map((w) => [w.tag, w.min]));
  const avoid = Object.fromEntries((order?.avoid || []).map((a) => [a.tag, a.max]));
  const list = only ? TAGS.filter((t) => t in wants || t in avoid) : TAGS;
  return `<div class="tagbars">${list.map((t) => {
    const v = tags[t];
    const w = wants[t], a = avoid[t];
    let cls = '';
    if (w !== undefined) cls = v >= w ? 'met' : 'want';
    if (a !== undefined) cls = v > a ? 'bad' : 'avoid';
    return `<div class="tagrow ${cls}"><span class="tn">${t}${w !== undefined ? ' <b>♥</b>' : ''}${a !== undefined ? ' <b>✕</b>' : ''}</span>` +
      `<span class="track">${a !== undefined ? `<em class="nozone" style="left:${a * 10}%"></em>` : ''}<i style="width:${v * 10}%"></i>` +
      `${w !== undefined ? `<u style="left:${w * 10}%"></u>` : ''}</span></div>`;
  }).join('')}</div>`;
}

export function matchLine(tags, order, design, quality = 0.85) {
  
  if (order?.window) return `<div class="matchline">Window value <b>${money(shopValue(design, quality))}</b> <small>at ${Math.round(quality * 100)}% craft</small></div>`;
  const m = clientMatch(tags, order, design);
  const same = design && sameAsLast(order, design) ? `<div class="repeat-warn">Same bodice and skirt as her last dress - she asked for something different</div>` : '';
  return `<div class="matchline">Client match ${starRow(stars(m))} <small>${Math.round(m * 100)}%</small></div>${same}`;
}

export function orderSummary(o) {
  return `<ul class="wants">${o.wants.map((w) => `<li class="w">♥ ${w.tag} <small>${w.min}+</small></li>`).join('')}` +
    `${o.avoid.map((a) => `<li class="a">✕ ${a.tag} <small>≤ ${a.max}</small></li>`).join('')}` +
    `${o.repeat?.differ ? `<li class="a">✕ Not the same bodice and skirt as last time</li>` : ''}</ul>`;
}

export { level };
