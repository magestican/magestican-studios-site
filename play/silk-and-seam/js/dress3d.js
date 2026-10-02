







import { DRAFTED } from './patterns.js';
import { state } from './state.js';
import { formOf, UNDER_OF } from './form3d.js';
import { drapeKey, DRAPE_VERSION } from './gfxrules.js';

let current = null;
const supported = () => {
  try { return !!window.WebGL2RenderingContext && !!document.createElement('canvas').getContext('webgl2'); } catch { return false; }
};
export const drapeable = (d) => !!d && DRAFTED.bodice.includes(d.bodice) && DRAFTED.skirt.includes(d.skirt)
  && (d.collar === 'none' || !d.collar || DRAFTED.collar.includes(d.collar)) && (d.sleeve === 'none' || !d.sleeve || DRAFTED.sleeve.includes(d.sleeve));
const svgOnly = () => new URLSearchParams(location.search).has('svg');
const quality = () => state.settings?.quality || 'auto';


let worker = null, seq = 0;
const waiting = new Map();
function drapeWorker() {
  if (worker === false) return null;
  if (!worker) {
    try {
      worker = new Worker(new URL('./drape.worker.js', import.meta.url), { type: 'module' });
      worker.onmessage = (e) => {
        const w = waiting.get(e.data.id);
        if (!w) return;
        waiting.delete(e.data.id);
        if (e.data.error) w.reject(new Error(e.data.error)); else w.resolve(e.data.baked);
      };
      
      worker.onerror = (e) => { e.preventDefault?.(); for (const w of waiting.values()) w.reject(new Error('drape worker failed')); waiting.clear(); worker.terminate(); worker = false; };
    } catch { worker = false; }
  }
  return worker || null;
}
const inWorker = (w, msg) => new Promise((resolve, reject) => { const id = ++seq; waiting.set(id, { resolve, reject }); w.postMessage({ id, ...msg }); });


const KEEP = 30;
let dbp = null;
function db() {
  if (!dbp) dbp = new Promise((res) => {
    try {
      const r = indexedDB.open('silkseam.drapes', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('drapes');
      r.onsuccess = () => res(r.result);
      r.onerror = () => res(null);
    } catch { res(null); }
  });
  return dbp;
}
async function idbGet(key) {
  const d = await db();
  if (!d) return null;
  return new Promise((res) => {
    try { const q = d.transaction('drapes').objectStore('drapes').get(key); q.onsuccess = () => res(q.result || null); q.onerror = () => res(null); } catch { res(null); }
  });
}
async function idbPut(key, b) {
  const d = await db();
  if (!d) return;
  try {
    const { source, ...rest } = b;
    const st = d.transaction('drapes', 'readwrite').objectStore('drapes');
    st.put({ ...rest, t: Date.now() }, key);
    const ages = [];
    st.openCursor().onsuccess = (e) => {
      const cur = e.target.result;
      if (cur) {
        if (!String(cur.key).startsWith(`${DRAPE_VERSION}|`)) cur.delete(); else ages.push([cur.value.t || 0, cur.key]);
        cur.continue();
      } else if (ages.length > KEEP) ages.sort((a, b2) => a[0] - b2[0]).slice(0, ages.length - KEEP).forEach(([, k]) => st.delete(k));
    };
  } catch {  }
}


const mem = new Map();
export function drapeFor(design, body, tier) {
  const key = drapeKey(design, body, tier);
  if (mem.has(key)) return mem.get(key).then((b) => ({ ...b, source: 'memory' }));
  const p = (async () => {
    const hit = await idbGet(key);
    if (hit && hit.n) return { ...hit, source: 'idb' };
    const msg = { design: { bodice: design.bodice, skirt: design.skirt, collar: design.collar || 'none', sleeve: design.sleeve || 'none', seed: design.seed, fab1: design.fab1, fab2: design.fab2 }, body, tier };
    let b = null;
    const w = drapeWorker();
    if (w) try { b = { ...(await inWorker(w, msg)), source: 'worker' }; } catch (err) { console.warn('drape worker unavailable, draping here', err); }
    if (!b) {
      const { drape, bake } = await import('./drape.js');
      b = { ...bake(drape(msg.design, body, { tier })), source: 'main' };
    }
    idbPut(key, b);
    return b;
  })();
  mem.set(key, p);
  if (mem.size > 6) mem.delete(mem.keys().next().value);
  p.catch(() => mem.delete(key));
  return p;
}


const maps = new Map();
export function mapsFor(fab, dye, size) {
  const key = `${fab}|${dye}|${size}`;
  if (maps.has(key)) return maps.get(key);
  const p = (async () => {
    const w = drapeWorker();
    if (w) try { return await inWorker(w, { maps: { fab, dye, size } }); } catch {  }
    const { fabricMaps } = await import('./fabrics.js');
    return fabricMaps(fab, dye, size);
  })();
  maps.set(key, p);
  if (maps.size > 8) maps.delete(maps.keys().next().value);
  p.catch(() => maps.delete(key));
  return p;
}

const designMaps = (specs, size) => Promise.all([1, 2].map((s) => mapsFor(specs[s].id, specs[s].hex, size)));







export function warm(design = null) {
  if (!supported() || svgOnly()) return;
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 1200));
  idle(() => import('./render3d.js').then(() => import('./gfx.js')).then((g) => g.init(quality())).then((tier) => {
    if (tier !== 'off' && drapeable(design)) {
      drapeFor(design, design.body || 'classic', tier).catch(() => {});
      import('./fabric3d.js').then((f) => designMaps(f.specsOf(design), f.mapSize(tier))).catch(() => {});   
    }
  }).catch(() => {}), { timeout: 4000 });
}



export async function upgradeDress(host, design) {
  if (!host || !drapeable(design) || !supported() || svgOnly()) return false;
  try {
    const t0 = performance.now(), body = design.body || 'classic';
    const { createViewer } = await import('./render3d.js');
    const tier = await (await import('./gfx.js')).init(quality());
    if (tier === 'off') return false;
    const pending = drapeFor(design, body, tier);        
    const fab3d = await import('./fabric3d.js'), specs = fab3d.specsOf(design);
    const textured = designMaps(specs, fab3d.mapSize(tier));   
    await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));   
    if (!host.isConnected) return false;
    if (current) { current.dispose(); current = null; }
    const canvas = document.createElement('canvas');
    canvas.className = 'sc-3d';
    canvas.setAttribute('aria-label', 'The finished dress on the form');
    canvas.style.visibility = 'hidden';                   
    host.appendChild(canvas);
    const night = !!host.closest('.night');
    const v = await createViewer(canvas, { night, quality: quality(), dof: true });
    v.setForm(formOf(body, UNDER_OF[design.skirt] || null));
    const t1 = performance.now();
    const b = await pending;
    const waited = performance.now() - t1;
    if (!host.isConnected) { v.dispose(); canvas.remove(); return false; }
    
    const look = { at: performance.now() - t0, mapsMs: null, textured: false };
    v.setGarment(b, { 1: fab3d.flatMaterial(specs[1], tier), 2: fab3d.flatMaterial(specs[2], tier) });
    v.view({ yaw: 0.25, target: 118, dist: 640 });
    v.render();
    canvas.style.visibility = '';
    host.classList.add('is-3d');
    let alive = true;
    current = { dispose: () => { alive = false; v.dispose(); canvas.remove(); host.classList.remove('is-3d'); } };
    textured.then(([m1, m2]) => {
      if (!alive) return;
      v.setLook({ 1: fab3d.fabricMaterial(specs[1], m1, tier, v.renderer), 2: fab3d.fabricMaterial(specs[2], m2, tier, v.renderer) });
      v.render();
      look.textured = true; look.mapsMs = Math.round(performance.now() - t0); look.maps = [m1.hash, m2.hash];
    }).catch((err) => console.warn('fabric maps unavailable, keeping the flat fabrics', err));
    
    let down = null, yaw = 0.25;
    canvas.addEventListener('pointerdown', (e) => { down = e.clientX; canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener('pointerup', () => { down = null; });
    canvas.addEventListener('pointermove', (e) => { if (down == null) return; yaw += (e.clientX - down) * 0.01; down = e.clientX; v.view({ yaw }); });
    window.__dress3d = { n: b.n, settleMs: b.settleMs, workerMs: b.ms ?? null, hash: b.hash, scale: b.scale, source: b.source, tier, waitedMs: Math.round(waited), shownMs: Math.round(performance.now() - t0), fabrics: [specs[1].id, specs[2].id], look };
    return true;
  } catch (err) {
    console.warn('3D dress unavailable, keeping the drawing', err);
    host.classList.remove('is-3d');
    host.querySelector('canvas.sc-3d')?.remove();
    return false;
  }
}
