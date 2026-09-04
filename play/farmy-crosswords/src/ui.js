











import { STATES } from '../../../web-engine/words/style.js';


export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of [].concat(children)) if (c) node.appendChild(c);
  return node;
}


export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
}









export function applyState(node, stateKey, spoken) {
  const state = STATES[stateKey];
  if (!state) throw new Error(`applyState: no state called ${stateKey} in style.js`);
  node.classList.add(`is-${stateKey}`);
  node.appendChild(el('span', { class: 'mark', 'aria-hidden': 'true', text: state.mark }));
  node.setAttribute('aria-label', spoken ? `${spoken}, ${state.label}` : state.label);
  return node;
}


export const markOf = (stateKey) => STATES[stateKey].mark;


export const labelOf = (stateKey) => STATES[stateKey].label;







export function legend(states, wording = {}) {
  return el('p', { class: 'legend' }, states.map((key) => el('span', {}, [
    el('span', { class: `swatch is-${key}`, 'aria-hidden': 'true', text: STATES[key].mark }),
    el('span', { text: wording[key] ?? STATES[key].label }),
  ])));
}
