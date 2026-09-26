




import { drape } from './drape.js';
import { DRAFTED } from './patterns.js';
import { DYES } from './data.js';

let current = null;
const supported = () => {
  try { return !!window.WebGL2RenderingContext && !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
};
export const drapeable = (d) => !!d && DRAFTED.bodice.includes(d.bodice) && DRAFTED.skirt.includes(d.skirt)
  && (d.collar === 'none' || !d.collar || DRAFTED.collar.includes(d.collar)) && (d.sleeve === 'none' || !d.sleeve || DRAFTED.sleeve.includes(d.sleeve));



export async function upgradeDress(host, design) {
  if (!host || !drapeable(design) || !supported() || new URLSearchParams(location.search).has('svg')) return false;
  try {
    const { createViewer } = await import('./render3d.js');
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));   
    if (!host.isConnected) return false;
    if (current) { current.dispose(); current = null; }
    const g = drape(design, design.body || 'classic');
    const canvas = document.createElement('canvas');
    canvas.className = 'sc-3d';
    canvas.setAttribute('aria-label', 'The finished dress on the form');
    host.appendChild(canvas);
    const night = !!host.closest('.night');
    const v = createViewer(canvas, { night });
    v.setForm(g.form);
    v.setGarment(g, (DYES.find((x) => x.id === design.dye1) || DYES[0]).hex);
    v.view({ yaw: 0.25, target: 118, dist: 640 });
    v.render();
    host.classList.add('is-3d');
    current = { dispose: () => { v.dispose(); canvas.remove(); host.classList.remove('is-3d'); } };
    
    let down = null, yaw = 0.25;
    canvas.addEventListener('pointerdown', (e) => { down = e.clientX; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointerup', () => { down = null; });
    canvas.addEventListener('pointermove', (e) => { if (down == null) return; yaw += (e.clientX - down) * 0.01; down = e.clientX; v.view({ yaw }); v.render(); });
    window.__dress3d = { n: g.cloth.n, settleMs: Math.round(g.settleMs), hash: g.hash };
    return true;
  } catch (err) {
    console.warn('3D dress unavailable, keeping the drawing', err);
    host.classList.remove('is-3d');
    host.querySelector('canvas.sc-3d')?.remove();
    return false;
  }
}
