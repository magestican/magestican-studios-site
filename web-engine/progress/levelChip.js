




















import { loadProfile, PROFILE_KEY } from '../account/profile.js';
import { snapshotOf, SNAPSHOT_KEY } from './snapshot.js';
import { chipModel } from './youModel.js';
import { installProgressToast, PROGRESS_EVENT } from './toast.js';
import { mountShareGame } from '../share/shareGame.js';
import { COLOUR, FONT, alpha } from '../brand/tokens.js';

const STYLE_ID = 'mg-level-chip-style';




export const CHIP_SEEN_KEY = 'arbelo.account.badges.v1';

function storageOf() {
  try { return globalThis.localStorage ?? null; } catch { return null; }
}





export function liveSnapshot(storage = storageOf(), nowMs = Date.now()) {
  try {
    if (!storage || storage.getItem(PROFILE_KEY) === null) return null;
    let seen = {};
    try { seen = JSON.parse(storage.getItem(CHIP_SEEN_KEY) || '{}') ?? {}; } catch { seen = {}; }
    const snap = snapshotOf(loadProfile(storage), nowMs, { seen });
    try { storage.setItem(SNAPSHOT_KEY, JSON.stringify(snap)); } catch {  }
    return snap;
  } catch {
    return null;
  }
}

function injectStyle(doc) {
  if (doc.getElementById(STYLE_ID)) return;
  const st = doc.createElement('style');
  st.id = STYLE_ID;
  st.textContent = `
.mg-level-chip{display:inline-flex;align-items:center;gap:6px;padding:3px 10px 3px 3px;border-radius:999px;
  background:${COLOUR.ink};color:${COLOUR.card} !important;text-decoration:none !important;font:700 13px/1 ${FONT.sans};
  border:1px solid ${alpha(COLOUR.card, 0.18)};white-space:nowrap;vertical-align:middle;flex:0 0 auto}
.mg-level-chip:focus-visible{outline:2px solid ${COLOUR.amber};outline-offset:2px}
.mg-level-chip svg{flex:none;display:block}
`;
  (doc.head ?? doc.documentElement).appendChild(st);
}

function ringSvg(doc, fraction) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = doc.createElementNS(NS, 'svg');
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const r = 10;
  const c = 2 * Math.PI * r;
  const track = doc.createElementNS(NS, 'circle');
  track.setAttribute('cx', '12'); track.setAttribute('cy', '12'); track.setAttribute('r', String(r));
  track.setAttribute('fill', COLOUR.paper); track.setAttribute('stroke', alpha(COLOUR.card, 0.25)); track.setAttribute('stroke-width', '2.5');
  const arc = doc.createElementNS(NS, 'circle');
  arc.setAttribute('cx', '12'); arc.setAttribute('cy', '12'); arc.setAttribute('r', String(r));
  arc.setAttribute('fill', 'none'); arc.setAttribute('stroke', COLOUR.amber); arc.setAttribute('stroke-width', '2.5');
  arc.setAttribute('stroke-linecap', 'round');
  arc.setAttribute('stroke-dasharray', `${(c * fraction).toFixed(2)} ${c.toFixed(2)}`);
  arc.setAttribute('transform', 'rotate(-90 12 12)');
  const star = doc.createElementNS(NS, 'text');
  star.setAttribute('x', '12'); star.setAttribute('y', '16'); star.setAttribute('text-anchor', 'middle');
  star.setAttribute('font-size', '11'); star.setAttribute('fill', COLOUR.ink);
  star.textContent = '★';
  svg.append(track, arc, star);
  return svg;
}








export function mountLevelChip(host, opts = {}) {
  try {
    const doc = host?.ownerDocument ?? globalThis.document;
    if (!host || !doc) return null;
    if (opts?.toast !== false) installProgressToast(doc);
    
    
    if (opts?.share) mountShareGame(host, String(opts.share));
    let chip = null;
    const paint = () => {
      const model = chipModel(liveSnapshot());
      if (!model) { chip?.remove(); chip = null; return; }
      injectStyle(doc);
      if (!chip) {
        chip = doc.createElement('a');
        chip.className = 'mg-level-chip';
        host.appendChild(chip);
      }
      chip.href = opts?.href || model.href;
      chip.setAttribute('aria-label', model.aria);
      chip.title = model.aria;
      const label = doc.createElement('span');
      label.textContent = model.label;
      chip.replaceChildren(ringSvg(doc, model.fraction), label);
    };
    paint();
    doc.addEventListener(PROGRESS_EVENT, () => { try { paint(); } catch {  } });
    return chip;
  } catch {
    return null;
  }
}
