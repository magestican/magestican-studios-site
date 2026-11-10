








export const EVENT = 'fossick:app';


export const FELT = Object.freeze(new Set(['dig', 'snap', 'crack', 'collapse', 'freed']));

let target = typeof window === 'undefined' ? null : window;
let backHandler = null;


export function setTarget(t) { target = t; }


export function tell(name, detail = {}) {
  if (!target) return;
  try { target.dispatchEvent(new CustomEvent(EVENT, { detail: { name, ...detail } })); } catch {  }
}


export function tellFelt(events) {
  for (const e of events) if (FELT.has(e.type)) tell('hit', { type: e.type });
}


export function onBack(fn) { backHandler = fn; }


if (target) target.fossickBack = () => (backHandler ? backHandler() !== false : false);
