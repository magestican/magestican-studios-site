




import { G } from '../../state.js';
import { icon } from '../../../engine/ui/icons.js';
import { speciesById, statsOf, TYPES, ATTR_COLOR, attrOf } from '../../data/species.js';
import { B, orderSpecial, orderStance, orderFinisher, orderParry, parryReady, finisherReady, startRitual, useTonic, cycleSwap, tryRun, canRitual } from './battle.js';
import { KIND_LABEL } from './techniques.js';
import { shinyTag } from '../../art/shinyMark.js';
import { sizeBadge } from '../../data/sizes.js';
import { formBadge } from '../../data/forms.js';
import { hpFraction, CAPTURE_HP, maxMp, mpCost, finisherOf, bondOf, typeEdge } from './rules.js';

const $ = id => document.getElementById(id);

const stripes = (a, b) => `repeating-linear-gradient(-60deg, ${a} 0 8px, ${b} 8px 12px)`;
export const hpColor = f => (f > 0.5 ? stripes('#2fd27a', '#8ff0b4') : f > 0.25 ? stripes('#ffd21a', '#fff09a') : stripes('#ff2a3a', '#ff8a94'));

export const typeChips = (types, foeTypes) => types.map(t => `<i class="${foeTypes ? 'edge-' + typeEdge(t, foeTypes) : ''}" style="background:${TYPES[t]}">${t}</i>`).join('');

export const attrBadge = a => (a ? `<b class="attr" style="background:${ATTR_COLOR[a]}" title="Vaccine beats virus, virus beats program, program is neutral">${a.toUpperCase()}</b>` : '');

let wired = false, btnKey = '';
function wire() {
  if (wired) return; wired = true;
  $('befriendBtn').onclick = () => startRitual();
  $('tonicBtn').onclick = () => useTonic();
  $('swapBtn').onclick = () => cycleSwap();
  $('runBtn').onclick = () => tryRun();
  $('stAttack').onclick = () => orderStance('attack');
  $('stGuard').onclick = () => orderStance('guard');
  $('stAway').onclick = () => orderStance('away');
  
  $('parryBtn').onpointerdown = e => { e.preventDefault(); orderParry(); };
}
function bars(f, pre) {
  const hf = hpFraction(f.d), mx = maxMp(f.d);
  $(pre + 'Hp').style.width = 100 * hf + '%'; $(pre + 'Hp').style.background = hpColor(hf);
  $(pre + 'HpTxt').textContent = `HP ${f.d.hp} / ${statsOf(f.d).maxHp}`;
  $(pre + 'Mp').style.width = 100 * f.mp / mx + '%';
  $(pre + 'MpTxt').textContent = `MP ${Math.floor(f.mp)} / ${mx}`;
  $(pre + 'Fin').style.width = 100 * f.fin + '%';
  $(pre + 'Fin').parentElement.classList.toggle('full', f.fin >= 1);
}




let liftN = 0;
function liftUtilityRow() {
  if (liftN-- > 0) return; liftN = 12;
  const bb = $('battleBtns'), cb = $('cmdBar');
  if (getComputedStyle(bb).flexDirection !== 'row') { bb.style.bottom = ''; return; }
  bb.style.bottom = (innerHeight - cb.getBoundingClientRect().top + 10) + 'px';
}

export function updateBattleHud() {
  $('battleHud').classList.toggle('hidden', !B);
  document.body.classList.toggle('battling', !!B);
  if (!B) { btnKey = ''; return; }
  wire();
  liftUtilityRow();
  const e = B.enemy, es = speciesById(e.d.sp), f = hpFraction(e.d);
  const nameHtml = `${e.d.corrupt ? '<span class="corrupt">CORRUPTED</span> ' : ''}${es.name}${shinyTag(e.d)}${sizeBadge(e.d)}${formBadge(e.d)} <span class="lv">Lv ${e.d.lvl}</span> ${attrBadge(attrOf(e.d))} ${typeChips(es.types)} ${G.dex.caught[es.id] ? '<span class="owned" title="Already befriended">' + icon('heart') + '</span>' : ''} <span class="rarity r-${es.rarity}">${es.rarity}</span>`;
  if ($('enemyName').dataset.h !== nameHtml) { $('enemyName').innerHTML = nameHtml; $('enemyName').dataset.h = nameHtml; }
  bars(e, 'enemy');
  const low = f < CAPTURE_HP && e.d.hp > 0 && !B.script;
  $('capTag').classList.toggle('hidden', !low || !!B.ritual);
  const a = B.ally, s = speciesById(a.d.sp);
  const bond = bondOf(a.d);
  const allyHtml = `${s.name}${shinyTag(a.d)} <span class="lv">Lv ${a.d.lvl}</span> ${attrBadge(attrOf(a.d))} <span class="myTypes">${typeChips(s.types, es.types)}</span> <span class="bond${bond < 50 ? ' low' : ''}" title="Bond: below 50 it may hesitate on your orders">${icon('heart')} ${bond}</span>`;
  if ($('allyName').dataset.h !== allyHtml) { $('allyName').innerHTML = allyHtml; $('allyName').dataset.h = allyHtml; }
  bars(a, 'ally');
  const key = a.d.uid + ':' + a.d.sp;
  const fin = finisherOf(a.d);
  if (key !== btnKey) {
    btnKey = key;
    const bar = $('specials'); bar.innerHTML = '';
    const pads = ['X', 'Y', 'RB'];
    s.moves.forEach((m, k) => {
      const b = document.createElement('button'); b.className = 'special tappable'; b.style.setProperty('--tc', TYPES[m.type]);
      b.dataset.key = String(k + 1); b.dataset.pad = pads[k];
      b.innerHTML = `<div class="mn">${m.name}</div><div class="mk"><b class="mpc">${mpCost(m, a.d.lvl)} MP</b> · ${m.type} <span>${KIND_LABEL[m.kind] || m.kind}</span>${m.power ? ' ' + m.power : ''}</div><div class="cdv"></div>`;
      b.onclick = () => orderSpecial(k);
      bar.appendChild(b);
    });
    const fb = document.createElement('button'); fb.className = 'special finisher tappable'; fb.id = 'finBtn';
    fb.style.setProperty('--tc', TYPES[fin.type]); fb.dataset.key = 'F'; fb.dataset.pad = 'A';
    fb.innerHTML = `<div class="mn">${icon('star')} ${fin.name}</div><div class="mk">finishing move</div><div class="cdv"></div>`;
    fb.onclick = () => orderFinisher();
    bar.appendChild(fb);
  }
  
  const guide = B.script === 'guardian' ? [0, 1, 2].find(k => !B.used.has(k)) ?? [0, 1, 2].find(k => a.cds[k] <= 0) : -1;
  const kids = [...$('specials').children];
  kids.slice(0, 3).forEach((b, k) => {
    const m = s.moves[k], cd = a.cds[k], mx = m.cd, mpOk = B.script || a.mp >= mpCost(m, a.d.lvl);
    b.querySelector('.cdv').style.height = (100 * cd / mx) + '%';
    b.classList.toggle('ready', cd <= 0 && mpOk && !B.ritual);
    b.classList.toggle('nomp', !mpOk);
    
    b.classList.toggle('guide', (k === guide || B.enemy.open > 0) && cd <= 0 && mpOk);
  });
  const fb = kids[3];
  if (fb) {
    fb.classList.toggle('hidden', !!B.script);
    fb.classList.toggle('ready', finisherReady());
    fb.querySelector('.cdv').style.height = (100 * (1 - a.fin)) + '%';
  }
  $('stances').classList.toggle('hidden', !!B.script);
  $('parryBtn').classList.toggle('hidden', !!B.ritual);
  for (const [id, st] of [['stAttack', 'attack'], ['stGuard', 'guard'], ['stAway', 'away']]) $(id).classList.toggle('on', B.stance === st);
  
  $('parryBtn').classList.toggle('ready', parryReady());
  $('parryBtn').classList.toggle('cue', parryReady() && a.threat < 0.55);
  $('battleBtns').classList.toggle('hidden', !!B.script);
  const ritualOk = canRitual();
  $('befriendBtn').classList.toggle('glow', low && !B.ritual);
  $('befriendBtn').disabled = !ritualOk;
  $('befriendBtn').innerHTML = `${icon('heart')} ${low ? 'Befriend!' : 'Heart Seal'} <small>${low ? 'ritual' : 'x' + G.items.seal}</small>`;
  $('tonicBtn').innerHTML = `${icon('cup')} Tonic <small>x${G.items.tonic}</small>`;
  $('runBtn').innerHTML = B.ritual ? icon('close') + ' Stop ritual' : icon('back') + ' Run';
}
