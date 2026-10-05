




import { G } from '../../state.js';
import { B, orderParry, orderStance } from './battle.js';
import { ringCentre, ringSlots, pickSlot, ringOpens, HOLD_MS, SLOT } from './ringRules.js';

const $ = (id) => document.getElementById(id);

const IDS = ['stAttack', 'stGuard', 'stAway', 'swapBtn', 'runBtn', 'tonicBtn', 'befriendBtn', 'parryBtn'];
let press = null, ring = null;

const touchMode = () => document.body.classList.contains('input-touch');
const canRing = () => touchMode() && G.mode === 'battle' && B && B.state === 'fight' && !B.ritual && !B.script;
const usable = (b) => b && !b.disabled && !b.classList.contains('hidden');

function open() {
  if (!press || ring || !canRing()) return;
  const el = $('orderRing'), [cx, cy] = ringCentre(press.x, press.y, innerWidth, innerHeight);
  const btns = IDS.map($), slots = ringSlots(btns.length);
  el.innerHTML = `<i class="ringHub" style="left:${cx}px;top:${cy}px"></i>` + btns.map((b, k) => {
    const [dx, dy] = slots[k], st = ['on', 'ready', 'cue', 'glow'].filter((c) => b.classList.contains(c)).join(' ');
    return `<div class="ringSlot ${st}${usable(b) ? '' : ' off'}" data-k="${k}" style="left:${cx + dx - SLOT.w / 2}px;top:${cy + dy - SLOT.h / 2}px;width:${SLOT.w}px;height:${SLOT.h}px"><span>${b.innerHTML}</span></div>`;
  }).join('');
  el.classList.remove('hidden');
  ring = { cx, cy, btns, k: -1 };
}
function point(x, y) {
  const k = pickSlot(x - ring.cx, y - ring.cy, ring.btns.length);
  if (k === ring.k) return;
  ring.k = k;
  for (const s of $('orderRing').children) s.classList.toggle('pick', s.dataset.k === String(k));
}
function close() {
  if (press) clearTimeout(press.timer);
  press = null; ring = null;
  $('orderRing').classList.add('hidden');
}
function fire(b) {
  if (!usable(b)) return;
  if (b.id === 'parryBtn') orderParry(); 
  else b.click();
}

export function installOrderRing(zone) {
  
  zone.addEventListener('pointerdown', (e) => {
    if (e.defaultPrevented || press || !canRing()) return;
    press = { id: e.pointerId, x: e.clientX, y: e.clientY, t: performance.now(), timer: setTimeout(open, HOLD_MS) };
  });
  addEventListener('pointermove', (e) => {
    if (!press || e.pointerId !== press.id) return;
    if (!ring && ringOpens(performance.now() - press.t, Math.hypot(e.clientX - press.x, e.clientY - press.y))) open();
    if (ring) { e.preventDefault(); point(e.clientX, e.clientY); }
  }, { passive: false });
  addEventListener('pointerup', (e) => {
    if (!press || e.pointerId !== press.id) return;
    const pick = ring && ring.k >= 0 ? ring.btns[ring.k] : null, tap = !ring;
    close();
    if (pick) fire(pick);
    else if (tap && B && B.stance === 'guard') orderStance('guard'); 
  });
  addEventListener('pointercancel', (e) => { if (press && e.pointerId === press.id) close(); });
}

export function updateOrderRing() { if ((press || ring) && !canRing()) close(); }
