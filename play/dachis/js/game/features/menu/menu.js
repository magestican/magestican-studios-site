

import { toast } from '../../../engine/ui/dialog.js';
import { mountSoundToggle } from '../../../vendor/arbelo/ui/muteButton.js';
import { G, S, saveGame, deleteSave } from '../../state.js';
import { SPECIES, speciesById, statsOf, TYPES, capsFor, attrOf } from '../../data/species.js';
import { attrBadge } from '../battle/battleHud.js';
import { KIND_LABEL } from '../battle/techniques.js';
import { xpToNext, giveXp } from '../battle/rules.js';
import { dachiCanvas } from '../../art/portraitRender.js';
import { ITEMS } from '../pickups/pickups.js';
import { checkEvolutions } from '../party/evolution.js';
import { refreshHud } from '../hud/hud.js';
import { music } from '../../music.js';

const $ = id => document.getElementById(id);
let tab = 'party', selUid = null, wired = false;
const chips = types => types.map(t => `<i style="background:${TYPES[t]}">${t}</i>`).join('');
const sprite = (id, px, opts) => { const cv = dachiCanvas(id, opts || {}, px); cv.style.width = cv.style.height = px + 'px'; return cv; };

export function openMenu(which) {
  if (G.mode !== 'world' || S.dialog.active) return;
  if (!wired) {
    wired = true;
    document.querySelectorAll('.tab').forEach(t => { t.onclick = () => render(t.dataset.tab); });
    $('menuClose').onclick = closeMenu;
  }
  G.mode = 'menu'; $('menu').classList.remove('hidden'); render(which || tab);
}
export function closeMenu() { $('menu').classList.add('hidden'); if (G.mode === 'menu') G.mode = 'world'; refreshHud(); }
export const menuOpen = () => G.mode === 'menu';

function render(t) {
  tab = t;
  document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x.dataset.tab === t));
  const body = $('menuBody'); body.innerHTML = '';
  ({ party, dex, items, system })[t](body);
}

function party(body) {
  body.insertAdjacentHTML('beforeend', `<p class="hint">Dachi Den — ${G.box.length} friend${G.box.length === 1 ? '' : 's'} (no limit). Pick one, then make it companion 1, 2 or 3.</p>`);
  const wrap = document.createElement('div'); wrap.className = 'den'; body.appendChild(wrap);
  const detail = document.createElement('div'); detail.className = 'detail'; body.appendChild(detail);
  const sorted = G.box.slice().sort((a, b) => (G.party.includes(b) - G.party.includes(a)) || b.lvl - a.lvl);
  for (const d of sorted) {
    const s = speciesById(d.sp), pi = G.party.indexOf(d);
    const c = document.createElement('button'); c.className = 'denCell tappable' + (d.uid === selUid ? ' sel' : '');
    c.appendChild(sprite(d.sp, 64));
    c.insertAdjacentHTML('beforeend', `<div>${s.name}</div><small>Lv ${d.lvl}${pi >= 0 ? ' · #' + (pi + 1) : ''}</small>`);
    c.onclick = () => { selUid = d.uid; render('party'); };
    wrap.appendChild(c);
  }
  const d = G.box.find(x => x.uid === selUid) || G.party[0];
  if (!d) { detail.innerHTML = '<p>No dachis yet. Your guardian will find you on the road...</p>'; return; }
  const s = speciesById(d.sp), st = statsOf(d);
  detail.appendChild(sprite(d.sp, 128));
  const info = document.createElement('div');
  const evo = s.evolvesTo ? `Evolves into <b>${G.dex.seen[s.evolvesTo] ? speciesById(s.evolvesTo).name : '???'}</b> at Lv ${s.evolveAt}` : 'Final form';
  info.innerHTML = `<h3>${s.id > 200 ? '★' : '#' + String(s.id).padStart(3, '0')} ${s.name} <span class="lv">Lv ${d.lvl} / ${capsFor(G.cycle).maxLevel}</span></h3>
    <div class="types">${attrBadge(attrOf(d))} ${chips(s.types)} <span class="rarity r-${s.rarity}">${s.rarity}</span></div>
    <p>HP ${d.hp}/${st.maxHp} · ATK ${st.atk} · DEF ${st.def} · SPD ${st.spd}</p>
    <p>XP ${d.xp} / ${d.lvl >= capsFor(G.cycle).maxLevel ? 'MAX' : xpToNext(d.lvl)} · ${evo}</p>
    <ol class="moves">${s.moves.map(m => `<li><b style="color:${TYPES[m.type]}">${m.name}</b> — ${m.type} ${KIND_LABEL[m.kind] || m.kind}${m.power ? ', power ' + m.power : ''}, ${m.cd}s recharge</li>`).join('')}</ol>
    <p class="blurb">${s.blurb}</p>`;
  const row = document.createElement('div'); row.className = 'row';
  for (let i = 0; i < 3; i++) {
    const b = document.createElement('button'); b.className = 'tappable'; b.textContent = `Companion ${i + 1}`;
    b.onclick = () => {
      const cur = G.party.indexOf(d);
      if (cur >= 0) { [G.party[cur], G.party[i]] = [G.party[i], G.party[cur]]; G.party = G.party.filter(Boolean); }
      else if (i < G.party.length) G.party[i] = d; else G.party.push(d);
      saveGame(); render('party');
    };
    row.appendChild(b);
  }
  if (G.party.includes(d) && G.party.length > 1) { const b = document.createElement('button'); b.textContent = 'Rest in Den'; b.onclick = () => { G.party.splice(G.party.indexOf(d), 1); saveGame(); render('party'); }; row.appendChild(b); }
  if (G.items.candy > 0 && d.lvl < capsFor(G.cycle).maxLevel) { const b = document.createElement('button'); b.className = 'tappable'; b.textContent = `Train: Spirit Candy (${G.items.candy})`; b.onclick = () => { G.items.candy--; giveXp(d, Math.max(40, xpToNext(d.lvl)), G.cycle); saveGame(); render('party'); }; row.appendChild(b); }
  if (d.noEvolve && s.evolveAt && d.lvl >= s.evolveAt) { const b = document.createElement('button'); b.className = 'gold tappable'; b.textContent = 'Evolve now'; b.onclick = () => { d.noEvolve = false; closeMenu(); checkEvolutions(); }; row.appendChild(b); }
  info.appendChild(row); detail.appendChild(info);
}

function dex(body) {
  const caught = SPECIES.filter(s => G.dex.caught[s.id]).length, seen = SPECIES.filter(s => G.dex.seen[s.id]).length;
  body.insertAdjacentHTML('beforeend', `<p class="hint">Dachidex — seen ${seen} / ${SPECIES.length} · befriended ${caught} / ${SPECIES.length}</p>`);
  
  body.insertAdjacentHTML('beforeend', `<p class="hint attrChart">${attrBadge('vaccine')} beats ${attrBadge('virus')} · ${attrBadge('virus')} beats ${attrBadge('program')} · ${attrBadge('program')} is neutral (x1.5 on an advantage, on top of the element)</p>`);
  const grid = document.createElement('div'); grid.className = 'dex'; body.appendChild(grid);
  for (const s of SPECIES) {
    const c = document.createElement('div'); c.className = 'dexCell' + (G.dex.caught[s.id] ? ' caught' : '');
    if (G.dex.seen[s.id]) c.appendChild(sprite(s.id, 48, { silhouette: !G.dex.caught[s.id] }));
    else { const cv = document.createElement('canvas'); cv.width = cv.height = 48; c.appendChild(cv); }
    c.insertAdjacentHTML('beforeend', `<small>#${String(s.id).padStart(3, '0')}</small><div>${G.dex.seen[s.id] ? s.name : '???'}</div>${G.dex.seen[s.id] ? attrBadge(s.attribute) : ''}`);
    grid.appendChild(c);
  }
}

function items(body) {
  const list = document.createElement('div'); list.className = 'items';
  for (const [k, it] of Object.entries(ITEMS)) list.insertAdjacentHTML('beforeend', `<div class="item"><span class="ico">${it.icon}</span><div><b>${it.name} x${G.items[k] || 0}</b><p>${it.text}</p></div></div>`);
  if (G.items.charm) list.insertAdjacentHTML('beforeend', '<div class="item"><span class="ico">⚘</span><div><b>Kumabo’s Lucky Charm</b><p>A tiny warm bolt tied with a pink ribbon. Kumabo gave it to you after your initiation.</p></div></div>');
  if (G.items.egg) list.insertAdjacentHTML('beforeend', '<div class="item"><span class="ico">\u{1F95A}</span><div><b>Guardian Egg</b><p>Hibone’s egg. It is warm, and it feels like it is listening.</p></div></div>');
  list.insertAdjacentHTML('beforeend', '<div class="item"><span class="ico">♡</span><div><b>Bond Ritual · always ready</b><p>Tap a wild dachi below 25% HP during battle and trace the pattern.</p></div></div>');
  body.appendChild(list);
  const b = document.createElement('button'); b.className = 'tappable'; b.textContent = `Berry Tonic on every companion (${G.items.tonic} left)`;
  b.onclick = () => {
    if (G.items.tonic <= 0) return toast('No Berry Tonics left.');
    G.items.tonic--; G.party.forEach(d => { const m = statsOf(d).maxHp; d.hp = Math.min(m, d.hp + Math.floor(m / 2)); });
    saveGame(); render('items');
  };
  body.appendChild(b);
}

function system(body) {
  body.insertAdjacentHTML('beforeend', `<div class="controls"><h3>Controls</h3>
    <p><b>Keyboard:</b> WASD / arrows walk · Shift run · E or Space action / talk / pick up · Esc or M this menu</p>
    <p><b>Battle:</b> 1 2 3 shout specials · 4 5 6 stance · F finisher · G parry (as a hit lands: counter / reflect) · C befriend (tap the weak dachi) · T tonic · Q switch · R run</p>
    <p><b>Gamepad:</b> left stick walk · A action · Start menu · X Y RB specials · B parry · RT befriend · LT tonic · LB switch · Back run. Ritual: X Y B or flick a stick left / up / right.</p>
    <p><b>Touch:</b> drag anywhere on the left to walk · tap people, items and glowing things · in the ritual, drag your finger through the nodes.</p>
    <p>Playthrough ${G.cycle}: levels go up to ${capsFor(G.cycle).maxLevel}; damage is capped at ${capsFor(G.cycle).maxDamage}. New Game+ raises both (twice).</p></div>`);
  const row = document.createElement('div'); row.className = 'row'; body.appendChild(row);
  mountSoundToggle({ host: row, isMuted: () => S.sfx.muted, setMuted: m => S.sfx.setMuted(m), className: 'tappable' });
  const mus = document.createElement('button'); mus.className = 'tappable';
  const label = () => { mus.textContent = 'Music: ' + (music.lofi.isOn() ? 'on' : 'off'); };
  mus.onclick = () => { music.lofi.toggle(); label(); }; label();
  const save = document.createElement('button'); save.className = 'tappable'; save.textContent = 'Save game'; save.onclick = () => { saveGame(); toast('Game saved.'); };
  const del = document.createElement('button'); del.className = 'danger'; del.textContent = 'Delete save & restart';
  del.onclick = () => { if (confirm('Delete your save and start over?')) { deleteSave(); location.reload(); } };
  row.append(mus, save, del);
}
