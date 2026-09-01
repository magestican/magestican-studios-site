



















































import { pageContexts } from './contextBudget.js';





const released = new WeakSet();











export function freshCanvas(old) {
  const next = old.cloneNode(false);
  old.replaceWith(next);
  return next;
}





















export function takeCanvas(id, canvasEl, budget = pageContexts) {
  const canvas = freshCanvas(canvasEl);
  budget.enterExclusive(id);
  return canvas;
}












export function holdContext(id, release, budget = pageContexts) {
  budget.acquire(id, release);
}













export function releaseRenderer(id, renderer, opts = {}, budget = pageContexts) {
  if (!renderer || released.has(renderer)) return false;
  released.add(renderer);
  
  if (opts.before) opts.before();
  renderer.dispose();
  renderer.forceContextLoss();
  
  
  
  budget.release(id);
  return true;
}


export function isReleased(renderer) {
  return released.has(renderer);
}
