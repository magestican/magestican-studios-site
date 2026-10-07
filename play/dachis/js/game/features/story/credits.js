



import { G } from '../../state.js';
import { speciesById } from '../../data/species.js';
import { creditRows } from './creditsRoll.js';

const ROLL_S = 36, SKIP_AFTER_S = 2;
let root = null;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);


export function rollCredits({ onPlus, onTitle }) {
  if (root) root.remove();
  const friends = G.box.map((d) => speciesById(d.sp)).filter(Boolean).map((s) => s.name);
  root = document.createElement('div'); root.id = 'credits';
  root.innerHTML = `<div class="crRoll">${creditRows({ name: G.name, friends }).map((r) =>
    `<div class="cr-${r.k}">${esc(r.t)}</div>`).join('')}</div>
    <div class="crEnd hidden"><div class="crTheEnd">THE END</div>
      <button class="big tappable crPlus" type="button">New Game+</button>
      <button class="tappable crTitle" type="button">Back to the title</button></div>`;
  document.body.appendChild(root);
  const prev = G.mode; G.mode = 'credits';
  const roll = root.querySelector('.crRoll'), end = root.querySelector('.crEnd');
  roll.style.animationDuration = ROLL_S + 's';
  const t0 = performance.now();
  let shown = false;
  const showEnd = () => {
    if (shown) return; shown = true;
    roll.classList.add('done'); end.classList.remove('hidden');
  };
  roll.addEventListener('animationend', showEnd);
  const skip = (e) => { if (!shown && performance.now() - t0 > SKIP_AFTER_S * 1000) { e.stopPropagation(); showEnd(); } };
  root.addEventListener('pointerdown', skip);
  const onKey = (e) => { if (root && root.isConnected && !shown) skip(e); };
  addEventListener('keydown', onKey, true);
  const close = (fn) => () => { removeEventListener('keydown', onKey, true); root.remove(); root = null; G.mode = prev; fn(); };
  root.querySelector('.crPlus').onclick = close(onPlus);
  root.querySelector('.crTitle').onclick = close(onTitle);
  return { skip: showEnd };
}
