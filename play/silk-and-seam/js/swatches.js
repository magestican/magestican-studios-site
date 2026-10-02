








import { swatchSVG, pinkedPath } from './art.js';
import { SWATCH, swatchKey } from './swatch.js';
import { state } from './state.js';
import { dye as dyeOf } from './logic.js';

const SCALE = 2;                       
const stat = { asked: 0, painted: 0, cached: 0, drawn: 0, failed: 0, ms: [], firstMs: null, worker: null };
window.__swatches = () => ({ ...stat, ms: stat.ms.slice(-30), kept: bitmaps.size });


let worker = null, seq = 0;
const waiting = new Map();
function swatchWorker() {
  if (worker === false) return null;
  if (!worker) {
    try {
      worker = new Worker(new URL('./swatch.worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = (e) => {
        const w = waiting.get(e.data.id);
        if (!w) return;
        waiting.delete(e.data.id);
        if (e.data.error) w.reject(new Error(e.data.error)); else w.resolve(e.data);
      };
      worker.onerror = (e) => { e.preventDefault?.(); for (const w of waiting.values()) w.reject(new Error('swatch worker failed')); waiting.clear(); worker.terminate(); worker = false; stat.worker = false; };
      stat.worker = true;
    } catch { worker = false; stat.worker = false; }
  }
  return worker || null;
}


const bitmaps = new Map();             
const ready = new Map();               
const KEEP = 90;
export function paint(fab, dye, opts) {
  const key = swatchKey(fab, dye, opts);
  if (bitmaps.has(key)) return bitmaps.get(key);
  const w = swatchWorker();
  if (!w) return Promise.reject(new Error('no swatch worker'));
  stat.asked++;
  const t0 = performance.now();
  const p = new Promise((resolve, reject) => { const id = ++seq; waiting.set(id, { resolve, reject }); w.postMessage({ id, fab, dye, opts }); })
    .then(async (r) => {
      const img = new ImageData(new Uint8ClampedArray(r.px.buffer), r.w, r.h);
      const pic = window.createImageBitmap ? await createImageBitmap(img) : img;
      stat.painted++; stat.ms.push(r.ms);
      if (stat.firstMs == null) stat.firstMs = Math.round(performance.now() - t0);
      ready.set(key, pic);
      return pic;
    });
  bitmaps.set(key, p);
  if (bitmaps.size > KEEP) { const k0 = bitmaps.keys().next().value; bitmaps.delete(k0); ready.get(k0)?.close?.(); ready.delete(k0); }
  p.catch(() => { bitmaps.delete(key); stat.failed++; });
  return p;
}








const realOn = () => !new URLSearchParams(location.search).has('svgswatch') && typeof Worker === 'function' && worker !== false;
export function swatchHTML(fab, dye, w = 90, h = 70, kind = 'card') {
  const inner = realOn()
    ? `<canvas class="swatch-svg fsw-c" width="${(w + 4) * SCALE}" height="${(h + 6) * SCALE}" role="img" aria-label="${fab} swatch"></canvas>`
    : swatchSVG(fab, dye, w, h);
  return `<span class="fsw" data-sw-fab="${fab}" data-sw-dye="${dye}" data-sw-w="${w}" data-sw-h="${h}" data-sw-kind="${kind}">${inner}</span>`;
}

function drawn(span) {
  if (!span.isConnected || span.dataset.swDone || !span.querySelector('canvas')) return;
  span.innerHTML = swatchSVG(span.dataset.swFab, span.dataset.swDye, +span.dataset.swW, +span.dataset.swH);
}
const optsOf = (w, h, kind) => ({ w: w * SCALE, h: h * SCALE, ...(SWATCH[kind] || SWATCH.card) });



function drawPiece(cv, pic, w, h, hex) {
  const x = cv.getContext('2d');
  if (!x) return false;
  x.setTransform(SCALE, 0, 0, SCALE, 2 * SCALE, 2 * SCALE);
  x.clearRect(-2, -2, w + 4, h + 6);
  const edge = new Path2D(pinkedPath(w, h));
  x.save(); x.translate(0, 2); x.fillStyle = 'rgba(40,24,12,0.28)'; x.fill(edge); x.restore();
  x.save(); x.clip(edge);
  if (pic) x.drawImage(pic, 0, 0, w, h); else { x.fillStyle = hex; x.globalAlpha = 0.55; x.fillRect(0, 0, w, h); }
  x.restore();
  x.strokeStyle = 'rgba(60,40,20,0.25)'; x.lineWidth = 0.6; x.stroke(edge);
  return true;
}
function place(span, pic) {
  if (!span.isConnected || span.dataset.swDone) return;
  const cv = span.querySelector('canvas.fsw-c');
  if (!cv || !drawPiece(cv, pic, +span.dataset.swW, +span.dataset.swH)) { drawn(span); return; }
  span.dataset.swDone = '1';
  stat.drawn++;
}



export function upgrade(root) {
  if (!root || !realOn()) return;
  for (const span of root.querySelectorAll('.fsw:not([data-sw-done]):not([data-sw-asked])')) {
    const { swFab: fab, swDye: dye, swW, swH, swKind } = span.dataset;
    const opts = optsOf(+swW, +swH, swKind), key = swatchKey(fab, dye, opts);
    if (ready.has(key)) { stat.cached++; place(span, ready.get(key)); continue; }
    const cv = span.querySelector('canvas.fsw-c');
    if (!cv || !drawPiece(cv, null, +swW, +swH, dyeOf(dye)?.hex || '#ccc')) { drawn(span); continue; }
    span.dataset.swAsked = '1';
    paint(fab, dye, opts).then((pic) => place(span, pic)).catch(() => drawn(span));
  }
}


const supported3d = () => {
  try { return !!window.WebGL2RenderingContext && !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
};



export function want3d(quality = state.settings?.quality || 'auto') {
  if (new URLSearchParams(location.search).has('svg')) return false;
  if (window.__gfx) { const t = window.__gfx().tier; if (t) return t === 'mid' || t === 'high'; }
  if (quality === 'low') return false;
  if (quality === 'auto' && window.matchMedia?.('(pointer: coarse)').matches) return false;
  
  if (quality === 'auto' && seenTier() === 'low') return false;
  return supported3d();
}
const TIER_KEY = 'silkseam.lamptier';
const seenTier = () => { try { return localStorage.getItem(TIER_KEY); } catch { return null; } };
const learnTier = (t) => { try { localStorage.setItem(TIER_KEY, t); } catch {  } };

let lampOpen = null;
export function openLamp(fab, dye, { name = fab, dyeName = dye, note = '' } = {}) {
  closeLamp();
  const ov = document.createElement('div');
  ov.className = 'modal-wrap lamp-ov';
  ov.innerHTML = `<div class="modal paper lamp-box" role="dialog" aria-modal="true" aria-label="${name} under a daylight lamp">
    <button class="lamp-x btn small ghost" aria-label="Close">&times;</button>
    <h3>${name} <small>${dyeName} &middot; under a daylight lamp</small></h3>
    <div class="lamp-row"><div class="lamp-sw">${swatchHTML(fab, dye, 160, 120, 'lamp')}<small>12 cm of cloth</small></div>
    <div class="lamp-3d" hidden><canvas class="lamp-bolt" aria-label="The bolt of ${name} - drag to turn it"></canvas><small>Drag to turn the bolt</small></div></div>
    ${note ? `<p class="lamp-note">${note}</p>` : ''}</div>`;
  const close = () => closeLamp();
  ov.addEventListener('click', (e) => { if (e.target === ov) close(); });
  ov.querySelector('.lamp-x').onclick = close;
  const key = (e) => { if (e.key === 'Escape') { close(); e.preventDefault(); } };
  document.addEventListener('keydown', key);
  (document.getElementById('stage') || document.body).appendChild(ov);
  ov.querySelector('.lamp-x').focus();
  upgrade(ov);
  const st = { ov, key, bolt: null, mode: '2d' };
  lampOpen = st;
  window.__lamp = () => ({ open: !!lampOpen && lampOpen === st, fab, dye, mode: st.mode, bolt: st.bolt?.info || null });
  if (want3d()) {
    import('./bolt3d.js').then((b) => b.showBolt(ov.querySelector('.lamp-bolt'), fab, dye, state.settings?.quality || 'auto')).then((bolt) => {
      if (state.settings?.quality === 'auto' || !state.settings?.quality) learnTier(bolt ? bolt.info.tier : 'low');
      if (lampOpen !== st) { bolt?.dispose(); return; }
      if (!bolt) return;
      st.bolt = bolt; st.mode = '3d';
      ov.querySelector('.lamp-3d').hidden = false;
      bolt.render();
    }).catch((err) => console.warn('the 3D bolt is unavailable, keeping the swatch', err));
  }
  return st;
}
export function closeLamp() {
  if (!lampOpen) return;
  lampOpen.bolt?.dispose();
  document.removeEventListener('keydown', lampOpen.key);
  lampOpen.ov.remove();
  lampOpen = null;
}
