



import { speciesById, statsOf, TYPES, ATTR_COLOR, attrOf } from '../../data/species.js';
import { shinyTag } from '../../art/shinyMark.js';

let root = null, onSkip = null;
function build() {
  root = document.createElement('div'); root.id = 'scoutCard'; root.className = 'hidden';
  root.addEventListener('pointerdown', (e) => { e.stopPropagation(); if (onSkip) onSkip(); });
  
  addEventListener('keydown', () => { if (onSkip && !root.classList.contains('hidden')) onSkip(); }, true);
  document.body.appendChild(root);
}

export function showScout(f, skip) {
  if (!root) build();
  onSkip = skip;
  const s = speciesById(f.d.sp), st = statsOf(f.d), a = attrOf(f.d), hp = Math.max(0, Math.round(f.d.hp));
  const pct = Math.max(0, Math.min(100, (hp / st.maxHp) * 100));
  const types = s.types.map((t) => `<i style="background:${TYPES[t]}">${t}</i>`).join('');
  root.innerHTML = `<div class="scBox${s.boss ? ' boss' : ''}">
      <div class="scTag">${s.boss ? 'BOSS' : f.d.corrupt ? 'CORRUPTED' : f.d.shiny === 'gold' ? 'GOLD SHINY!' : f.d.shiny ? 'SHINY!' : 'WILD DACHI'}</div>
      <div class="scName"><b>${s.name}</b>${shinyTag(f.d)} <span class="lv">Lv ${f.d.lvl}</span></div>
      <div class="scRow"><span class="scLabel">Type</span><span class="scTypes">${types}</span>${a ? `<b class="attr" style="background:${ATTR_COLOR[a]}">${a.toUpperCase()}</b>` : ''}</div>
      <div class="scRow"><span class="scLabel">HP</span><span class="scBar"><b style="width:${pct.toFixed(1)}%"></b></span><span class="scHp">${hp} / ${st.maxHp}</span></div>
      <div class="scHint">Tap to start</div>
    </div>`;
  root.classList.remove('hidden');
}

export function hideScout() { if (root) root.classList.add('hidden'); onSkip = null; }
