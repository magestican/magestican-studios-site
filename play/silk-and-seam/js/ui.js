
import { state, save, level } from './state.js';
import { levelProgress, matchScore, stars } from './logic.js';
import { TAGS } from './data.js';
import { sfx, setMuted, unlockAudio } from './audio.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const money = (n) => `£${Math.round(n).toLocaleString('en-GB')}`;

const screens = {};
let current = null;
export function register(name, mod) { screens[name] = mod; }

export function go(name, params) {
  if (current && current.leave) current.leave();
  const root = $('#screen');
  root.innerHTML = '';
  root.className = `screen screen-${name}`;
  current = screens[name];
  current.enter(root, params || {});
  renderHud();
}

export function fitStage() {
  const stage = $('#stage');
  const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
  stage.style.transform = `translate(-50%, -50%) scale(${s})`;
}

export function renderHud() {
  const lp = levelProgress(state.xp);
  $('#hud').innerHTML = `
    <button class="brand" data-go="hub" title="Back to the atelier">Silk <span>&amp;</span> Seam</button>
    <div class="hud-stat coin" title="Money">${money(state.money)}</div>
    <div class="hud-level" title="${lp.span ? `${lp.into} / ${lp.span} XP to next level` : 'Max level'}">
      <span class="lv">Lv ${lp.lvl}</span><span class="xpbar"><i style="width:${(lp.frac * 100).toFixed(1)}%"></i></span>
    </div>
    <button class="hud-btn" data-mute title="Sound on/off">${state.muted ? '🔇' : '🔊'}</button>`;
  $('[data-go=hub]', $('#hud')).onclick = () => { sfx.click(); go('hub'); };
  $('[data-mute]', $('#hud')).onclick = () => { unlockAudio(); setMuted(!state.muted); save(); renderHud(); };
}

export function toast(msg, kind = '') {
  const t = document.createElement('div');
  t.className = `toast ${kind}`;
  t.textContent = msg;
  $('#stage').appendChild(t);
  setTimeout(() => t.classList.add('out'), 1800);
  setTimeout(() => t.remove(), 2300);
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

export function matchLine(tags, order) {
  const m = matchScore(tags, order);
  return `<div class="matchline">Client match ${starRow(stars(m))} <small>${Math.round(m * 100)}%</small></div>`;
}

export function orderSummary(o) {
  return `<ul class="wants">${o.wants.map((w) => `<li class="w">♥ ${w.tag} <small>${w.min}+</small></li>`).join('')}` +
    `${o.avoid.map((a) => `<li class="a">✕ ${a.tag} <small>≤ ${a.max}</small></li>`).join('')}</ul>`;
}

export { level };
