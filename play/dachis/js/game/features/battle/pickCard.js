




import { speciesById, statsOf } from '../../data/species.js';
import { typeChips } from './battleHud.js';
import { shinyTag } from '../../art/shinyMark.js';
import { sizeBadge } from '../../data/sizes.js';
import { formBadge } from '../../data/forms.js';

let root = null, onPick = null, count = 0;
function build() {
  root = document.createElement('div'); root.id = 'pickCard'; root.className = 'hidden';
  root.addEventListener('pointerdown', (e) => e.stopPropagation()); 
  addEventListener('keydown', (e) => {
    if (!onPick || root.classList.contains('hidden')) return;
    const k = Number(e.key);
    if (k >= 1 && k <= count) { e.preventDefault(); e.stopPropagation(); onPick(k - 1); }
  }, true);
  document.body.appendChild(root);
}


export function showPick(fainted, list, foeTypes, pick) {
  if (!root) build();
  onPick = pick; count = list.length;
  root.innerHTML = `<div class="pkBox">
      <div class="pkTag">${speciesById(fainted.sp).name} fainted!</div>
      <div class="pkHead">Who goes in next?</div>
      <div class="pkList"></div>
    </div>`;
  const ul = root.querySelector('.pkList');
  list.forEach(({ d }, n) => {
    const s = speciesById(d.sp), max = statsOf(d).maxHp, pct = Math.max(0, Math.min(100, (d.hp / max) * 100));
    const b = document.createElement('button'); b.className = 'pkOne tappable'; b.dataset.key = String(n + 1);
    b.innerHTML = `<span class="pkName">${s.name}${shinyTag(d)}${sizeBadge(d)}${formBadge(d)} <span class="lv">Lv ${d.lvl}</span></span>
      <span class="pkTypes">${typeChips(s.types, foeTypes)}</span>
      <span class="pkHp"><span class="pkBar"><b style="width:${pct.toFixed(1)}%"></b></span>${Math.ceil(d.hp)} / ${max}</span>`;
    b.onclick = () => { if (onPick) onPick(n); };
    ul.appendChild(b);
  });
  root.classList.remove('hidden');
}


export function pickCompanion(n) { if (onPick && n < count) onPick(n); }
export function hidePick() { if (root) root.classList.add('hidden'); onPick = null; }
