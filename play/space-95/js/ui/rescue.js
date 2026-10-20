



import { RESCUE_WINDOW } from '../sim/rescue.js';

const touchy = () => matchMedia('(pointer: coarse)').matches;


export function createRescuePrompt(parent) {
  const el = document.createElement('div');
  el.className = 'rescue';
  el.hidden = true;
  el.setAttribute('role', 'status');
  el.innerHTML = `<strong>Bolt can pull you back!</strong>
    <span data-el="how"></span>
    <span class="rescue-bar"><i data-el="bar"></i></span>`;
  parent.appendChild(el);
  const how = el.querySelector('[data-el="how"]');
  const bar = el.querySelector('[data-el="bar"]');
  return {
    
    update(s) {
      const offer = s.rescue;
      el.hidden = !offer;
      if (!offer) return;
      how.textContent = touchy() ? 'Hold JUMP and DASH together' : 'Hold JUMP + DASH (Space + Shift)';
      const left = Math.max(0, offer.until - s.time);
      bar.style.width = `${(100 * left) / RESCUE_WINDOW}%`;
    },
  };
}
