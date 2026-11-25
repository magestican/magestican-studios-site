




import { drawPortrait } from '../joPortrait.js';
import { keyAction, padActions, stickDir, tapAction } from './input.js';
import { step } from './machine.js';
import { viewOf } from './view.js';

const esc = ( s) =>
  String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c] ?? c);


function itemHtml( it,  i) {
  const cls = `${it.focused ? ' is-focus' : ''}${it.locked ? ' is-locked' : ''}`;
  const at = `type="button" data-i="${i}"${it.focused ? ' aria-current="true"' : ''}`;
  if (it.kind === 'node') {
    const dots = [0, 1, 2].map((k) => `<i class="${k < it.intel ? 'is-on' : ''}"></i>`).join('');
    const say = `Shift ${it.n}: ${it.label}, ${it.state}${it.medal ? ', under par' : ''}`;
    return `<button ${at} class="m-node is-${it.state}${cls}" aria-label="${esc(say)}"${it.locked ? ' aria-disabled="true"' : ''}><b>${it.n}</b><span class="m-node-name">${esc(it.label)}</span><span class="m-dots" aria-hidden="true">${dots}</span>${it.medal ? '<span class="m-medal" aria-hidden="true">PAR</span>' : ''}</button>`;
  }
  if (it.kind === 'slider')
    return `<button ${at} class="m-btn m-opt m-slider${cls}" aria-label="${esc(`${it.label} ${it.detail}`)}"><span>${esc(it.label)}</span><span class="m-bar" aria-hidden="true"><i style="--v:${it.value / it.max}"></i></span><small>${esc(it.detail)}</small></button>`;
  if (it.kind === 'pick')
    return `<button ${at} role="radio" aria-checked="${it.checked}" class="m-pick${cls}"><span class="m-av" data-variant="${i === 0 ? 'woman' : 'man'}"></span><strong>${esc(it.label)}</strong></button>`;
  const opt = it.kind === 'toggle' || it.kind === 'cycle' ? ' m-opt' : '';
  return `<button ${at} class="m-btn${opt}${cls}"><span>${esc(it.label)}</span>${it.detail ? `<small>${esc(it.detail)}</small>` : ''}</button>`;
}

const rowsHtml = ( rows, cls = 'm-rows') =>
  rows?.length ? `<dl class="${cls}">${rows.map((r) => `<div><dt>${esc(r.label)}</dt><dd>${esc(r.value)}</dd></div>`).join('')}</dl>` : '';

function paperHtml( v) {
  const heading = v.screen === 'title' ? '<h1 class="m-logo">SPACE <span>95</span></h1>' : `<h2 class="m-heading">${esc(v.heading)}</h2>`;
  const lobby =
    v.screen === 'lobby'
      ? `<form class="m-join" data-act="join"><label for="m-code">Room code</label><span class="m-join-row"><input id="m-code" name="code" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="40" placeholder="s95-abcde" /><button type="submit" class="m-btn">Join</button></span><span class="m-err" role="alert" hidden>That code is 5 letters, like s95-abcde.</span></form>`
      : '';
  return `<div class="m-paper m-${v.screen}" role="dialog" aria-label="${esc(v.heading)}">
    <div class="m-clip" aria-hidden="true"></div>
    <p class="m-kicker">${esc(v.kicker)}</p>
    ${heading}
    ${v.sub ? `<p class="m-sub">${esc(v.sub)}</p>` : ''}
    ${v.lede ? `<p class="m-lede">${esc(v.lede)}</p>` : ''}
    ${rowsHtml(v.rows)}
    ${v.stamp ? `<p class="m-stamp" aria-label="Stamp: ${esc(v.stamp)}">${esc(v.stamp)}</p>` : ''}
    ${v.countdown !== undefined ? `<p class="m-count" aria-live="polite">Starts in <b>${v.countdown}</b></p>` : ''}
    <div class="m-items${v.screen === 'map' ? ' m-map' : ''}">${v.items.map(itemHtml).join('')}</div>
    ${lobby}
    ${v.panel ? `<div class="m-panel"><h3>${esc(v.panel.heading)}</h3>${rowsHtml(v.panel.rows, 'm-rows m-keys')}</div>` : ''}
  </div>`;
}






export function createMenuShell(root, { menu, data, onOut, join = () => false }) {
  let state = menu;
  let drawn = '';
  let pads =  ([]);
  let stick =  (null);
  let last = 0;
  let raf = 0;
  const hidden = () => state.screen === 'play' || state.screen === 'boot';

  const draw = ( transition) => {
    root.hidden = hidden();
    document.body.classList.toggle('is-menu', !root.hidden);
    if (root.hidden) {
      root.replaceChildren();
      drawn = '';
      return;
    }
    const html = paperHtml(viewOf(state, data()));
    if (html === drawn) return;
    drawn = html;
    const old = root.querySelector('.m-paper');
    const tpl = document.createElement('template');
    tpl.innerHTML = html;
    const paper =  (tpl.content.firstElementChild);
    if (transition && old) {
      old.classList.add(transition.kind === 'fade' ? 'is-fade-out' : 'is-leave');
      old.setAttribute('aria-hidden', 'true');
      for (const b of old.querySelectorAll('button')) b.tabIndex = -1;
      setTimeout(() => old.remove(), transition.leaveMs);
      paper.classList.add(transition.kind === 'fade' ? 'is-fade-in' : 'is-enter');
      root.append(paper);
    } else if (old) old.replaceWith(paper);
    else {
      if (transition) paper.classList.add(transition.kind === 'fade' ? 'is-fade-in' : 'is-enter');
      root.append(paper);
    }
    for (const slot of paper.querySelectorAll('.m-av'))
      drawPortrait( (slot),  (slot).dataset.variant);
    const f =  (paper.querySelector('[aria-current="true"]'));
    f?.focus({ preventScroll: true });
    f?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  };

  const dispatch = ( a) => {
    const r = step(state, a);
    state = r.state;
    let transition = null;
    for (const o of r.out) {
      if (o.transition) transition = o.transition;
      onOut(o, state);
    }
    draw(transition);
    if (r.out.some((o) => o.coop === 'join'))  (root.querySelector('#m-code'))?.focus();
    loop();
  };

  const onKey = ( e) => {
    if (hidden()) return;
    if (e.target instanceof HTMLInputElement && e.code !== 'Escape') return; 
    const a = keyAction(e.code);
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    dispatch(a);
  };
  window.addEventListener('keydown', onKey, true);
  root.addEventListener('click', (e) => {
    const b =  ( (e.target).closest('[data-i]'));
    if (b && !b.closest('.is-leave, .is-fade-out')) dispatch(tapAction(Number(b.dataset.i)));
  });
  root.addEventListener('submit', (e) => {
    e.preventDefault();
    const form =  (e.target);
    const ok = join(String(new FormData(form).get('code') ?? ''));
    const err =  (form.querySelector('.m-err'));
    if (err) err.hidden = ok;
  });

  
  const tick = ( now) => {
    raf = 0;
    if (hidden()) return;
    const dt = last ? Math.min(100, now - last) : 0;
    last = now;
    const pad = typeof navigator.getGamepads === 'function' ? [...navigator.getGamepads()].find(Boolean) : null;
    if (pad) {
      for (const a of padActions(pad.buttons, pads)) dispatch(a);
      pads = pad.buttons.map((b) => ({ pressed: b.pressed }));
      const dir = stickDir(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
      if (dir && dir !== stick) dispatch({ type: 'move', dir });
      stick = dir;
    }
    if (state.screen === 'clockin' && dt > 0) {
      const before = viewOf(state, data()).countdown;
      const r = step(state, { type: 'tick', ms: dt });
      if (r.out.length || r.state.screen !== state.screen) {
        state = r.state;
        let transition = null;
        for (const o of r.out) {
          if (o.transition) transition = o.transition;
          onOut(o, state);
        }
        draw(transition);
      } else {
        state = r.state;
        if (viewOf(state, data()).countdown !== before) draw(null);
      }
    }
    loop();
  };
  const loop = () => {
    if (!raf && !hidden()) {
      if (!last) last = 0;
      raf = requestAnimationFrame(tick);
    }
    if (hidden()) last = 0;
  };

  return {
    get state() {
      return state;
    },
    get open() {
      return !hidden();
    },
    dispatch,
    
    redraw: () => draw(null),
  };
}
