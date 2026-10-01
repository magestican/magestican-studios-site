






import { ATTRACT, attractAt } from './rules.js';

const $ = (id) => document.getElementById(id);
const IDLE_S = 45;
let t0 = 0, raf = 0, on = false, idle = null, painter = null;

function show(i) {
  for (const el of document.querySelectorAll('#attract .panel')) el.classList.toggle('show', Number(el.dataset.i) === i);
}
function frame() {
  if (!on) return;
  const t = (performance.now() - t0) / 1000, a = attractAt(t);
  show(a.panel);
  $('attract').classList.toggle('end', a.done);
  raf = requestAnimationFrame(frame);
}
function paintStickers() { 
  const cvs = [...document.querySelectorAll('#attract canvas[data-p]')];
  cvs.forEach((cv, i) => setTimeout(() => painter && painter(cv, cv.dataset.p), 200 + i * 900));
}
function armIdle() {
  clearTimeout(idle);
  idle = setTimeout(() => { if (!$('title').classList.contains('hidden') && !document.body.classList.contains('starting')) attract.play(); }, IDLE_S * 1000);
}

export const attract = {
  
  init(paintPortrait) {
    painter = paintPortrait;
    $('attractSkip').onclick = (e) => { e.stopPropagation(); attract.stop(); };
    $('attract').addEventListener('pointerdown', () => { if ($('attract').classList.contains('end')) attract.stop(); });
    addEventListener('keydown', (e) => { if (on && (e.code === 'Enter' || e.code === 'Space' || e.code === 'Escape')) attract.stop(); });
    for (const ev of ['pointerdown', 'keydown']) addEventListener(ev, () => { if (!on) armIdle(); }, true);
    attract.play();
  },
  play() {
    on = true; t0 = performance.now();
    document.body.classList.add('attracting');
    $('attract').classList.remove('hidden', 'end');
    paintStickers();
    cancelAnimationFrame(raf); frame();
  },
  stop() {
    if (!on) return;
    on = false; cancelAnimationFrame(raf);
    $('attract').classList.add('hidden');
    document.body.classList.remove('attracting');
    armIdle();
  },
  get playing() { return on; },
  total: ATTRACT.reduce((s, p) => s + p.s, 0),
};
