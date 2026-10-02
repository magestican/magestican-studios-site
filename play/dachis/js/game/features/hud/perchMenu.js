


import { G } from '../../state.js';
import { destinations } from '../world/travel.js';
import { regionById } from '../world/regions.js';

const $ = (id) => document.getElementById(id);
let picks = [], onPick = null;
export const perchMenuOpen = () => !$('perchMenu').classList.contains('hidden');

export function openPerchMenu(fromId, fly, opts, note = '') {
  const list = destinations(G.flags, fromId, opts);
  if (!list.some((d) => !d.here)) return false;
  G.mode = 'menu'; onPick = fly; picks = [];
  $('perchNote').textContent = (note ? note + ' ' : '') + 'Fly to a perch you have visited.';
  const box = $('perchList'); box.innerHTML = '';
  for (const d of list) {
    const b = document.createElement('button');
    b.className = 'perchBtn tappable' + (d.here ? ' here' : '');
    const where = regionById(d.region);
    b.innerHTML = `<b>${d.name}</b><small>${d.here ? 'You are here' : where ? where.name : ''}</small>`;
    if (d.here) b.disabled = true;
    else { picks.push(d.id); b.dataset.key = String(picks.length); b.onclick = () => pickPerch(picks.indexOf(d.id)); }
    box.appendChild(b);
  }
  $('perchMenu').classList.remove('hidden');
  return true;
}
export function closePerchMenu() {
  $('perchMenu').classList.add('hidden');
  if (G.mode === 'menu') G.mode = 'world';
}
export function pickPerch(k) {
  const id = picks[k];
  if (!id) return;
  const fly = onPick;
  closePerchMenu();
  fly(id);
}
export function installPerchMenu() { $('perchStay').onclick = closePerchMenu; }
