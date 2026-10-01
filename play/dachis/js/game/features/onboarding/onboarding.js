










import { G, S } from '../../state.js';
import { rollName, INTRO_KEY, introProgress, resumable } from './rules.js';

const $ = (id) => document.getElementById(id);
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {  } },
  del(k) { try { localStorage.removeItem(k); } catch {  } },
};


const TAP_KEY = 'dachis.tapLearned', LEARN_AFTER = 3;
let taps = Number(store.get(TAP_KEY)) || 0;
export const tapHint = {
  learned() { if (taps < LEARN_AFTER) { taps++; store.set(TAP_KEY, taps); } },
  
  update() {
    const el = $('tapHint');
    if (!el) return;
    const show = taps < LEARN_AFTER && S.dialog.active && !S.dialog.choosing && S.dialog.cur && S.dialog.shown >= S.dialog.cur.text.length;
    el.classList.toggle('hidden', !show);
    if (show) {
      const b = document.body.classList, txt = b.contains('input-pad') ? 'PRESS A' : b.contains('input-keys') ? 'PRESS SPACE' : 'TAP ANYWHERE';
      if (el.dataset.txt !== txt) { el.dataset.txt = txt; el.querySelector('b').textContent = txt; }
    }
  },
};


export function installTapAnywhere() {
  addEventListener('pointerdown', (e) => {
    if (!S.dialog.active || G.mode === 'title') return;
    if (e.target.closest && e.target.closest('button, input, select, a, #choices, #menu, #bigMap')) return;
    S.dialog.advance();
  });
}


export function setupNames() {
  const input = $('nameInput'), dice = $('diceBtn');
  const fill = () => { input.value = rollName(G.gender, Math.random, input.value); };
  fill();
  dice.onclick = () => { fill(); dice.classList.remove('rolled'); void dice.offsetWidth; dice.classList.add('rolled'); };
  
  let typed = false;
  input.addEventListener('input', () => { typed = input.value.trim().length > 0; });
  for (const b of document.querySelectorAll('.gbtn')) b.addEventListener('click', () => { if (!typed) fill(); });
}


export function startWithWipe(btn, go) {
  if (document.body.classList.contains('starting')) return;
  document.body.classList.add('starting');
  btn.classList.add('pressed');
  const wipe = $('startWipe');
  wipe.classList.remove('hidden'); void wipe.offsetWidth; wipe.classList.add('on');
  setTimeout(() => {
    go();
    setTimeout(() => { wipe.classList.remove('on'); wipe.classList.add('off'); }, 250);
    setTimeout(() => { wipe.classList.add('hidden'); wipe.classList.remove('off'); document.body.classList.remove('starting'); btn.classList.remove('pressed'); }, 900);
  }, 650);
}




let youT = -1;
export const youTag = {
  start() { youT = 0; const el = $('youTag'); el.querySelector('b').textContent = "THAT'S YOU, " + String(G.name || '').toUpperCase() + '!'; el.classList.remove('hidden'); },
  update(dt) {
    if (youT < 0) return;
    youT += dt;
    const el = $('youTag');
    if (youT > 5.5 || G.mode !== 'world') { el.classList.add('hidden'); youT = -1; return; }
    const p = G.player, [x, y] = S.stage.toScreen(p.x, p.y, S.W.groundAt(p.x, p.y) + 1.5);
    el.style.left = Math.round(x) + 'px'; el.style.top = Math.round(y) + 'px';
    el.style.opacity = youT > 4.8 ? String(Math.max(0, (5.5 - youT) / 0.7)) : '1';
  },
};


export const intro = {
  save(scene, li) { store.set(INTRO_KEY, introProgress({ scene, li, name: G.name, gender: G.gender })); },
  clear() { store.del(INTRO_KEY); },
  saved(sceneCount) { return resumable(store.get(INTRO_KEY), sceneCount); },
};



export function showResume(scenes, onResume) {
  const p = intro.saved(scenes.length), btn = $('resumeBtn');
  if (!p) { btn.classList.add('hidden'); return null; }
  btn.classList.remove('hidden');
  const cv = $('resumeFrame'), ctx = cv.getContext('2d');
  const paint = () => {
    try {
      ctx.save(); ctx.fillStyle = '#1a1430'; ctx.fillRect(0, 0, cv.width, cv.height);
      const sc = scenes[p.scene], k = cv.width / 640;
      ctx.scale(k, k); sc.draw(ctx, 640, 360, 2.5, p.li); ctx.restore();
    } catch (e) { ctx.restore(); }
  };
  paint(); setTimeout(paint, 1500); 
  btn.onclick = () => onResume(p);
  return p;
}
