
























import { formatPoints } from 'arbelo/raceScore';
import { ordinal } from 'arbelo/raceProgress';
import { hex, PALETTE } from '../palette.js';


function el(doc, tag, cls, text) {
  const node = doc.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = String(text);
  return node;
}








export function renderPodium(root, model, announcement) {
  if (!root) return;
  const doc = root.ownerDocument;
  root.textContent = '';
  if (!model || !model.winner) return;

  
  
  const head = el(doc, 'div', 'podium-announce', announcement);
  head.classList.add(model.playerWon ? 'win' : (model.playerOnPodium ? 'podium' : 'lost'));
  root.appendChild(head);

  const steps = el(doc, 'div', 'podium-steps');
  for (const step of model.steps) {
    
    
    
    
    const box = el(doc, 'div', `podium-step place-${step.place}`);
    if (step.isPlayer) box.classList.add('me');

    box.appendChild(el(doc, 'div', 'podium-place', ordinal(step.place)));

    const swatch = el(doc, 'span', 'podium-dot');
    
    
    
    swatch.style.background = hex(step.row.tint ?? PALETTE.ceiling);
    box.appendChild(swatch);

    box.appendChild(el(doc, 'div', 'podium-name', step.row.name ?? ''));
    box.appendChild(el(doc, 'div', 'podium-points', formatPoints(step.row.points)));
    if (step.row.fastestLap) box.appendChild(el(doc, 'div', 'podium-fl', 'Fastest lap'));
    steps.appendChild(box);
  }
  root.appendChild(steps);
}








export function renderCupLine(node, { races, points, position = null }) {
  if (!node) return;
  if (!races || races < 2) { node.textContent = ''; return; }
  const place = position ? ` · ${ordinal(position)} in the cup` : '';
  node.textContent = `Cup: ${races} races · ${formatPoints(points)}${place}`;
}









export function renderNextUp(node, track) {
  if (!node) return;
  node.textContent = track ? `Next up: ${track.name}` : '';
}
