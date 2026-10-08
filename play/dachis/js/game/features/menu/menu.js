


import { toast } from '../../../engine/ui/dialog.js';
import { icon } from '../../../engine/ui/icons.js';
import { mountSoundToggle } from '../../../vendor/arbelo/ui/muteButton.js';
import { mountLangPicker } from './langPicker.js';
import { tr } from '../../i18n/i18n.js';
import { G, S, saveGame, deleteSave, hasSave, savedBox } from '../../state.js';
import { SPECIES, speciesById, statsOf, TYPES, capsFor, attrOf, BODY_PLANS } from '../../data/species.js';
import { shapeKinds } from '../achievements/achievements.js';
import { attrBadge } from '../battle/battleHud.js';
import { KIND_LABEL } from '../battle/techniques.js';
import { moveRank, rankMult } from '../battle/moveTiers.js';
import { xpToNext, giveXp } from '../battle/rules.js';
import { dachiCanvas } from '../../art/portraitRender.js';
import { shinyTag, shinySprite } from '../../art/shinyMark.js';
import { sizeBadge, CLASS_WORD } from '../../data/sizes.js';
import { formBadge, formDots, formsBefriended } from '../../data/forms.js';
import { temperOf } from '../../data/temper.js';
import { bodyWord } from '../../data/bodies.js';

import { BOSS_PATTERNS } from '../battle/bossPattern.js';
import { ITEMS } from '../pickups/pickups.js';
import { checkEvolutions } from '../party/evolution.js';
import { refreshHud } from '../hud/hud.js';
import { music } from '../../music.js';
import { fmt } from '../clock/clock.js';
import { questState } from '../quest/quests.js';
import { COLLECTIBLES, KINDS, tally, found, foundHats, hatGeoOf, whereToLook } from '../../data/collectibles.js';
import { caughtCount } from '../../state.js';
import { regionById } from '../world/regions.js';

const $ = id => document.getElementById(id);
let tab = 'party', selUid = null, wired = false;
const chips = types => types.map(t => `<i style="background:${TYPES[t]}">${t}</i>`).join('');
const sprite = (id, px, opts) => { const cv = dachiCanvas(id, opts || {}, px); cv.style.width = cv.style.height = px + 'px'; return cv; };

export function openMenu(which) {
  if (G.mode !== 'world' || S.dialog.active) return;
  if (!wired) {
    wired = true;
    document.querySelectorAll('.menuHead .tab').forEach(t => { t.onclick = () => render(t.dataset.tab); });
    $('menuClose').onclick = closeMenu;
  }
  G.mode = 'menu'; $('menu').classList.remove('hidden'); render(which || tab);
}
export function closeMenu() { if (music.listening()) music.listen(null); $('menu').classList.add('hidden'); if (G.mode === 'menu') G.mode = 'world'; refreshHud(); }
export const menuOpen = () => G.mode === 'menu';

function render(t) {
  tab = t;
  document.querySelectorAll('.menuHead .tab').forEach(x => x.classList.toggle('on', x.dataset.tab === t));
  const body = $('menuBody'); body.innerHTML = '';
  ({ party, dex, items, journal, collection, system })[t](body);
}

function party(body) {
  
  const den = G.box.length === 1 ? 'Dachi Den — 1 friend (no limit). Pick one, then make it companion 1, 2 or 3.'
    : `Dachi Den — ${G.box.length} friends (no limit). Pick one, then make it companion 1, 2 or 3.`;
  body.insertAdjacentHTML('beforeend', `<p class="hint">${den}</p>`);
  const wrap = document.createElement('div'); wrap.className = 'den'; body.appendChild(wrap);
  const detail = document.createElement('div'); detail.className = 'detail'; body.appendChild(detail);
  const sorted = G.box.slice().sort((a, b) => (G.party.includes(b) - G.party.includes(a)) || b.lvl - a.lvl);
  for (const d of sorted) {
    const s = speciesById(d.sp), pi = G.party.indexOf(d);
    const c = document.createElement('button'); c.className = 'denCell tappable' + (d.uid === selUid ? ' sel' : '');
    c.appendChild(shinySprite(sprite(d.sp, 64, { hat: hatGeoOf(d.hat), form: d.form }), d));
    c.insertAdjacentHTML('beforeend', `<div>${s.name}${shinyTag(d)}</div><small>Lv ${d.lvl}${pi >= 0 ? ' · #' + (pi + 1) : ''}</small>`);
    c.onclick = () => { selUid = d.uid; render('party'); };
    wrap.appendChild(c);
  }
  const d = G.box.find(x => x.uid === selUid) || G.party[0];
  if (!d) { detail.innerHTML = '<p>No dachis yet. Your guardian will find you on the road...</p>'; return; }
  const s = speciesById(d.sp), st = statsOf(d);
  detail.appendChild(shinySprite(sprite(d.sp, 128, { hat: hatGeoOf(d.hat), form: d.form }), d));
  const info = document.createElement('div');
  const sizeClassChip = s.sizeClass ? ` <span class="sizeClass">Size: ${CLASS_WORD[s.sizeClass]}</span>` : ''; 
  const bw = bodyWord(s), bodyChip = bw ? ` <span class="sizeClass">Body: ${bw}</span>` : ''; 
  const evo = s.evolvesTo ? `Evolves into <b>${G.dex.seen[s.evolvesTo] ? speciesById(s.evolvesTo).name : '???'}</b> at Lv ${s.evolveAt}` : 'Final form';
  const rk = moveRank(d.lvl), rkHtml = rk ? '<b class="rk">' + '+'.repeat(rk) + '</b>' : ''; 
  info.innerHTML = `<h3>${s.id > 200 ? icon('star') : '#' + String(s.id).padStart(3, '0')} ${s.name}${shinyTag(d)}${sizeBadge(d)}${formBadge(d)} <span class="lv">Lv ${d.lvl} / ${capsFor(G.cycle).maxLevel}</span></h3>
    <div class="types">${attrBadge(attrOf(d))} ${chips(s.types)} <span class="rarity r-${s.rarity}">${s.rarity}</span>${sizeClassChip}${bodyChip}</div>
    <p class="temper">${temperOf(d).word}</p>
    <p>HP ${d.hp}/${st.maxHp} · ATK ${st.atk} · DEF ${st.def} · SPD ${st.spd}</p>
    <p>XP ${d.xp} / ${d.lvl >= capsFor(G.cycle).maxLevel ? 'MAX' : xpToNext(d.lvl)} · ${evo}</p>
    <ol class="moves">${s.moves.map(m => `<li><b style="color:${TYPES[m.type]}">${m.name}</b>${rkHtml} — ${m.type} ${KIND_LABEL[m.kind] || m.kind}${m.power ? ', power ' + Math.round(m.power * rankMult(d.lvl)) : ''}, ${m.cd}s recharge</li>`).join('')}</ol>
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
  info.appendChild(row);
  
  const hats = foundHats(G.flags);
  if (hats.length) {
    const hr = document.createElement('div'); hr.className = 'row hats'; hr.insertAdjacentHTML('beforeend', '<b>Hat</b>');
    for (const h of [null, ...hats]) {
      const b = document.createElement('button'); b.className = 'tappable' + ((d.hat || null) === (h && h.id) ? ' gold' : '');
      b.textContent = h ? h.name : 'None';
      b.onclick = () => { if (h) d.hat = h.id; else delete d.hat; saveGame(); render('party'); };
      hr.appendChild(b);
    }
    info.appendChild(hr);
  }
  detail.appendChild(info);
}

function dex(body) {
  const caught = SPECIES.filter(s => G.dex.caught[s.id]).length, seen = SPECIES.filter(s => G.dex.seen[s.id]).length;
  body.insertAdjacentHTML('beforeend', `<p class="hint">Dachidex — seen ${seen} / ${SPECIES.length} · befriended ${caught} / ${SPECIES.length}</p>`);
  const nForms = formsBefriended(G.dex); 
  if (nForms) body.insertAdjacentHTML('beforeend', `<p class="hint">Regional forms befriended: ${nForms}</p>`);
  const nShapes = shapeKinds(G.dex); 
  if (nShapes) body.insertAdjacentHTML('beforeend', `<p class="hint">Grown body shapes: ${nShapes} of ${BODY_PLANS.length}</p>`);
  
  body.insertAdjacentHTML('beforeend', `<p class="hint attrChart">${attrBadge('vaccine')} beats ${attrBadge('virus')} · ${attrBadge('virus')} beats ${attrBadge('program')} · ${attrBadge('program')} is neutral (x1.5 on an advantage, on top of the element)</p>`);
  const grid = document.createElement('div'); grid.className = 'dex'; body.appendChild(grid);
  for (const s of SPECIES) {
    const c = document.createElement('div'); c.className = 'dexCell' + (G.dex.caught[s.id] ? ' caught' : '');
    if (G.dex.seen[s.id]) c.appendChild(sprite(s.id, 48, { silhouette: !G.dex.caught[s.id] }));
    else { const cv = document.createElement('canvas'); cv.width = cv.height = 48; c.appendChild(cv); }
    c.insertAdjacentHTML('beforeend', `<small>#${String(s.id).padStart(3, '0')}</small><div>${G.dex.seen[s.id] ? s.name : '???'}</div>${G.dex.seen[s.id] ? attrBadge(s.attribute) : ''}${formDots(G.dex, s.id)}`);
    grid.appendChild(c);
  }
}

function items(body) {
  const list = document.createElement('div'); list.className = 'items';
  for (const [k, it] of Object.entries(ITEMS)) list.insertAdjacentHTML('beforeend', `<div class="item"><span class="ico">${icon(it.icon)}</span><div><b>${it.name} x${G.items[k] || 0}</b><p>${it.text}</p></div></div>`);
  if (G.items.charm) list.insertAdjacentHTML('beforeend', '<div class="item"><span class="ico">' + icon('flower') + '</span><div><b>Kumabo’s Lucky Charm</b><p>A tiny warm bolt tied with a pink ribbon. Kumabo gave it to you after your initiation.</p></div></div>');
  if (G.items.egg) list.insertAdjacentHTML('beforeend', '<div class="item"><span class="ico">' + icon('egg') + '</span><div><b>Guardian Egg</b><p>Hibone’s egg. It is warm, and it feels like it is listening.</p></div></div>');
  list.insertAdjacentHTML('beforeend', '<div class="item"><span class="ico">' + icon('heartOutline') + '</span><div><b>Bond Ritual · always ready</b><p>Tap a wild dachi below 25% HP during battle and trace the pattern.</p></div></div>');
  body.appendChild(list);
  const b = document.createElement('button'); b.className = 'tappable'; b.textContent = `Berry Tonic on every companion (${G.items.tonic} left)`;
  b.onclick = () => {
    if (G.items.tonic <= 0) return toast('No Berry Tonics left.');
    G.items.tonic--; G.party.forEach(d => { const m = statsOf(d).maxHp; d.hp = Math.min(m, d.hp + Math.floor(m / 2)); });
    saveGame(); render('items');
  };
  body.appendChild(b);
}


const KIND_ICON = { relic: 'star', shell: 'play', hat: 'flower', stone: 'egg' };
function journal(body) {
  const j = questState(G.flags, { caught: caughtCount(), total: SPECIES.length });
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  let h = `<div class="journal"><h3>Main quest: ${esc(j.main.name)}</h3><div class="item quest main"><span class="ico">${icon('star')}</span><div><b>${esc(j.main.text)}</b></div></div>`;
  h += '<h3>Side quests</h3>';
  if (!j.side.length) h += '<p class="hint">Villagers with a problem will ask for your help. Talk to everyone!</p>';
  for (const q of j.side) {
    h += `<div class="item quest ${q.status}"><span class="ico">${icon(q.status === 'done' ? 'heart' : 'heartOutline')}</span><div><b>${esc(q.name)}${q.status === 'done' ? ' · done' : ''}</b>`;
    h += q.steps.map((s) => `<p class="stepDone">${esc(s)}</p>`).join('');
    if (q.status === 'active') h += `<p class="stepNow">${esc(q.text)}</p>`;
    h += '</div></div>';
  }
  
  const notes = Object.keys(G.flags.tells || {}).filter((b) => BOSS_PATTERNS[b]);
  if (notes.length) h += '<h3>Boss notes</h3>' + notes.map((b) => `<div class="item quest${G.flags['boss_' + b] ? ' done' : ''}"><span class="ico">${icon('star')}</span><div><p>${esc(BOSS_PATTERNS[b].note)}</p></div></div>`).join('');
  const R = regionById(G.region) || regionById('kazan-isle'), t = tally(G.flags, R.id);
  h += `<h3>Collection: ${esc(R.name)}</h3><div class="tally">${Object.entries(KINDS).map(([k, v]) => `<span>${icon(KIND_ICON[k])} ${v.name} ${t[k].found} / ${t[k].total}</span>`).join('')}</div>`;
  const got = COLLECTIBLES.filter((c) => found(G.flags, c.id));
  if (!got.length) h += '<p class="hint">Stand on a hidden spot: a "!" shows over your head. Relics, Echo Shells, Hats and Memory Stones hide all over the island.</p>';
  for (const c of got) h += `<div class="item"><span class="ico">${icon(KIND_ICON[c.kind])}</span><div><b>${esc(c.name)}</b> <small>${KINDS[c.kind].one}</small><p>${esc(c.text)}</p></div></div>`;
  body.insertAdjacentHTML('beforeend', h + '</div>');
}



function collection(body) {
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  const seen = (r) => r === 'kazan-isle' || (G.flags.regions && G.flags.regions[r]);
  const wornBy = (id) => { const w = G.box.filter((d) => d.hat === id).map((d) => speciesById(d.sp).name); return w.length ? `<p class="stepNow">Worn by ${esc(w.join(', '))}</p>` : ''; };
  const rows = COLLECTIBLES.filter((c) => seen(c.region)), all = tally(G.flags);
  const wrap = document.createElement('div'); wrap.className = 'journal collection'; body.appendChild(wrap);
  for (const [k, v] of Object.entries(KINDS)) {
    const list = rows.filter((c) => c.kind === k), got = list.filter((c) => found(G.flags, c.id)).length;
    wrap.insertAdjacentHTML('beforeend', `<h3 id="col-${k}">${icon(KIND_ICON[k])} ${v.name} <small>${got} / ${list.length}${all[k].total > list.length ? ' (more on islands you have not seen)' : ''}</small></h3>`);
    if (k === 'hat' && got) wrap.insertAdjacentHTML('beforeend', '<p class="hint">Put a hat on a dachi: Dachi Den, pick one, then Hat.</p>');
    for (const c of list) {
      const has = found(G.flags, c.id), it = document.createElement('div');
      it.className = 'item' + (has ? '' : ' unfound');
      it.innerHTML = has
        ? `<span class="ico">${icon(KIND_ICON[k])}</span><div><b>${esc(c.name)}</b> <small>${esc((regionById(c.region) || {}).name || '')}</small><p>${esc(c.text)}</p>${k === 'hat' ? wornBy(c.id) : ''}</div>`
        : `<span class="ico">?</span><div><b>???</b><p>${esc(whereToLook(c))}</p></div>`;
      if (has && k === 'shell') {
        const b = document.createElement('button'), on = music.listening() === c.cue;
        b.className = 'tappable play' + (on ? ' gold' : ''); b.textContent = on ? 'Stop' : 'Play';
        b.onclick = () => { music.listen(on ? null : c.cue); render('collection'); };
        it.appendChild(b);
      }
      wrap.appendChild(it);
    }
  }
}

function system(body) {
  body.insertAdjacentHTML('beforeend', `<div class="controls"><h3>Controls</h3>
    <p><b>Keyboard:</b> WASD / arrows walk · Shift run · E or Space action / talk / pick up · Esc or M this menu</p>
    <p><b>Battle:</b> 1 2 3 shout specials · 4 5 6 stance · F finisher · G parry (as a hit lands: counter / reflect) · C befriend (tap the weak dachi) · T tonic · Q switch · R run</p>
    <p><b>Gamepad:</b> left stick walk · A action · Start menu · X Y RB specials · B parry · RT befriend · LT tonic · LB switch · Back run. Ritual: X Y B or flick a stick left / up / right.</p>
    <p><b>Touch:</b> drag anywhere on the left to walk · tap people, items and glowing things · in the ritual, drag your finger through the nodes.</p>
    <p>Playthrough ${G.cycle}: levels go up to ${capsFor(G.cycle).maxLevel}; damage is capped at ${capsFor(G.cycle).maxDamage}. New Game+ raises both (twice).</p></div>
    <div class="controls clock"><h3>Time played: ${fmt(G.clock.total)}</h3>
    <p>Exploring ${fmt(G.clock.mode.world)} · Battles ${fmt(G.clock.mode.battle + G.clock.mode.ritual)} · Talking ${fmt(G.clock.mode.dialog)} · Story ${fmt(G.clock.mode.cutscene)} · Menus ${fmt(G.clock.mode.menu)}</p>
    <p>${Object.entries(G.clock.chapter).map(([c, s]) => 'Chapter ' + c.slice(1) + ' ' + fmt(s)).join(' · ') || 'Chapter 1 0:00'}</p></div>`);
  const row = document.createElement('div'); row.className = 'row'; body.appendChild(row);
  mountSoundToggle({ host: row, isMuted: () => S.sfx.muted, setMuted: m => S.sfx.setMuted(m), className: 'tappable' });
  const mus = document.createElement('button'); mus.className = 'tappable';
  const label = () => { mus.textContent = 'Music: ' + (music.lofi.isOn() ? 'on' : 'off'); };
  mus.onclick = () => { music.lofi.toggle(); label(); }; label();
  const save = document.createElement('button'); save.className = 'tappable'; save.textContent = 'Save game'; save.onclick = () => { saveGame(); toast('Game saved.'); };
  const del = document.createElement('button'); del.className = 'danger'; del.textContent = 'Delete save & restart';
  del.onclick = () => { if (confirmReset()) { deleteSave(); location.reload(); } };
  row.append(mus, save, del);
  const lang = document.createElement('div'); lang.className = 'row'; body.appendChild(lang);
  mountLangPicker(lang, { className: 'inMenu' });
}


export function shinyWarning(box) {
  const sh = box.filter((d) => d && d.shiny);
  if (!sh.length) return '';
  const names = sh.map((d) => tr((d.shiny === 'gold' ? 'GOLD ' : 'WHITE ') + speciesById(d.sp).name)).join(', ');
  return sh.length === 1 ? 'WARNING: this save holds a shiny dachi ({0}). It will be lost forever.'.replace('{0}', names)
    : 'WARNING: this save holds {0} shiny dachis ({1}). They will be lost forever.'.replace('{0}', sh.length).replace('{1}', names);
}
export function confirmReset() {
  const warn = shinyWarning(G.box);
  if (!confirm('Delete your save and start over?')) return false;
  return !warn || confirm(warn);
}

export function confirmNewGame() {
  if (!hasSave()) return true;
  if (!confirm('Start a new game? Your current save will be replaced.')) return false;
  const warn = shinyWarning(savedBox());
  return !warn || confirm(warn);
}
