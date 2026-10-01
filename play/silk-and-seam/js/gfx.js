








import * as THREE from './vendor/three.module.min.js';
import { pickTier, TIER_FX, isSoftwareGL, frameStats, MOODS } from './gfxrules.js';
import { createPost } from './post3d.js';

const KEY = 'silkseam.gfx';
let R = null, post = null, caps = null, tier = null, fx = null, override = 'auto', lost = false;
const views = new Set(), restoreHooks = new Set();
const stat = { renders: 0, lost: 0, restored: 0, renderMs: [], frames: [], setup: {} };

export const mark = (k, ms) => { stat.setup[k] = Math.round(ms); };
const keep = (a, x, n = 240) => { a.push(x); if (a.length > n) a.shift(); };



function capsOf(gl) {
  const out = { webgl2: !!gl, maxTexture: 0, software: false, gpu: '', deviceMemory: navigator.deviceMemory || 0,
    coarse: !!window.matchMedia?.('(pointer: coarse)').matches };
  if (!gl) return out;
  out.maxTexture = gl.getParameter(gl.MAX_TEXTURE_SIZE);
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');    
  out.gpu = String(gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER) || '');
  out.software = isSoftwareGL(out.gpu);
  return out;
}



function kernel(p) {
  for (let i = 3; i < p.length; i += 3) {
    const dx = p[i] - p[i - 3], dy = p[i + 1] - p[i - 2], dz = p[i + 2] - p[i - 1];
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1, k = (d - 1) / d * 0.5;
    p[i] -= dx * k; p[i + 1] -= dy * k; p[i + 2] -= dz * k; p[i - 3] += dx * k; p[i - 2] += dy * k; p[i - 1] += dz * k;
  }
}
export function cachedScore() {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (c && c.ua === navigator.userAgent && Number.isFinite(c.score)) return c.score;
  } catch {  }
  return null;
}
export async function bench() {
  const c = cachedScore();
  if (c != null) return c;
  const p = new Float32Array(3 * 2048);
  for (let i = 0; i < p.length; i++) p[i] = Math.sin(i * 12.9898) * 3;
  let passes = 0, spent = 0;
  for (let s = 0; s < 10; s++) {
    await new Promise((r) => setTimeout(r, 0));
    const t0 = performance.now();
    while (performance.now() - t0 < 30) { kernel(p); passes++; }
    spent += performance.now() - t0;
  }
  const score = Math.round(passes / spent * 10) / 10;
  try { localStorage.setItem(KEY, JSON.stringify({ ua: navigator.userAgent, score })); } catch {  }
  return score;
}

function applyTier() {
  fx = TIER_FX[tier] || TIER_FX.low;
  if (!R) return;
  R.shadowMap.type = fx.softShadow ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
  R.shadowMap.needsUpdate = true;
  views.forEach((v) => { v.tierSeen = null; v.invalidate(); });
}

let ready = null;

export function init(settingsQuality = 'auto') {
  override = settingsQuality;
  if (ready) return ready;
  ready = (async () => {
    let t = performance.now();
    const canvas = document.createElement('canvas');
    try {
      R = window.WebGL2RenderingContext ? new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }) : null;
    } catch { R = null; }
    caps = capsOf(R?.getContext());
    mark('renderer', performance.now() - t); t = performance.now();
    if (!caps.webgl2) { R = null; tier = 'off'; return tier; }
    
    
    
    caps.score = cachedScore();
    if (caps.score == null) bench().then((s) => { caps.score = s; mark('bench', performance.now() - t); setQuality(override); });
    tier = pickTier(caps, override);
    R.outputColorSpace = THREE.SRGBColorSpace;
    R.toneMapping = THREE.ACESFilmicToneMapping;
    R.shadowMap.enabled = true;
    R.setPixelRatio(1);
    post = createPost(R);
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); lost = true; stat.lost++; });
    canvas.addEventListener('webglcontextrestored', () => {
      lost = false; stat.restored++;
      post.reset();
      restoreHooks.forEach((f) => { try { f(R); } catch (err) { console.warn(err); } });
      views.forEach((v) => { v.tierSeen = null; v.invalidate(); });
    });
    applyTier();
    return tier;
  })();
  return ready;
}

export const renderer = () => R;
export const currentTier = () => tier;
export const tierFx = () => fx;
export const onRestore = (f) => { restoreHooks.add(f); return () => restoreHooks.delete(f); };


export function setQuality(q = 'auto') {
  override = q;
  if (!caps || !caps.webgl2) return tier;
  const was = tier;
  tier = pickTier(caps, override);
  if (tier === was) return tier;
  applyTier();
  restoreHooks.forEach((f) => { try { f(R); } catch (err) { console.warn(err); } });   
  return tier;
}


function tierShadows(scene) {
  scene.traverse((o) => {
    if (!o.isLight || !o.castShadow || !o.shadow) return;
    if (o.shadow.mapSize.x !== fx.shadow) { o.shadow.mapSize.set(fx.shadow, fx.shadow); o.shadow.map?.dispose(); o.shadow.map = null; }
  });
}

function draw(v) {
  if (!R || lost || !v.alive) return;
  const el = v.canvas, w = el.clientWidth || el.width || 1, h = el.clientHeight || el.height || 1;
  const pr = Math.min(window.devicePixelRatio || 1, fx.pixelRatio);
  const W = Math.max(1, Math.round(w * pr)), H = Math.max(1, Math.round(h * pr));
  if (v.tierSeen !== tier) { tierShadows(v.scene); v.tierSeen = tier; }
  const t0 = performance.now();
  if (R.domElement.width !== W || R.domElement.height !== H) R.setSize(W, H, false);
  const cam = v.camera;
  if (cam.isPerspectiveCamera && Math.abs(cam.aspect - w / h) > 1e-4) { cam.aspect = w / h; cam.updateProjectionMatrix(); }
  v.before?.();
  const mood = MOODS[v.opts.mood] || MOODS.day;
  if (fx.post) post.render(v.scene, cam, W, H, fx, mood.grade, v.opts);
  else { R.toneMappingExposure = mood.grade.exposure; R.setRenderTarget(null); R.render(v.scene, cam); }
  if (el.width !== W || el.height !== H) { el.width = W; el.height = H; }
  v.ctx.clearRect(0, 0, W, H);
  v.ctx.drawImage(R.domElement, 0, 0);
  keep(stat.renderMs, performance.now() - t0);
  if (!stat.renders) mark('firstRender', performance.now() - t0);
  stat.renders++;
}

let raf = 0, last = 0, spinning = 0;
function loop(now) {
  raf = 0;
  if (spinning > 0) { if (last) keep(stat.frames, now - last); last = now; spinning--; }
  else last = 0;
  const dt = spinning ? 1 / 60 : 0;
  views.forEach((v) => {
    if (spinning) v.tick?.(dt);
    if (v.dirty || spinning) { v.dirty = false; draw(v); }
  });
  if (spinning > 0 || [...views].some((v) => v.dirty)) raf = requestAnimationFrame(loop);
}
const schedule = () => { if (!raf) raf = requestAnimationFrame(loop); };


export function mount(canvas, scene, camera, opts = {}) {
  if (!R) throw new Error('gfx.init() has not produced a renderer (tier off)');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('the view canvas already holds another context');
  const v = {
    canvas, ctx, scene, camera, opts: { mood: 'day', ...opts }, dirty: true, alive: true, tierSeen: null, tick: null, before: null,
    invalidate() { v.dirty = true; schedule(); },
    render() { v.dirty = false; draw(v); },
    unmount() { v.alive = false; views.delete(v); },
  };
  views.add(v);
  schedule();
  return v;
}


window.__gfx = () => ({
  tier, override, caps, fx, lost, views: views.size, contexts: R ? 1 : 0, renders: stat.renders,
  lostCount: stat.lost, restored: stat.restored, setup: stat.setup, render: frameStats(stat.renderMs), frames: frameStats(stat.frames),
});
window.__gfx.spin = (n = 120) => new Promise((res) => {
  stat.frames.length = 0; stat.renderMs.length = 0; spinning = n; last = 0; schedule();
  const wait = () => (spinning > 0 ? setTimeout(wait, 50) : res(window.__gfx()));
  wait();
});
window.__gfx.loseContext = async () => {
  const ext = R?.getContext().getExtension('WEBGL_lose_context');
  if (!ext) return { ok: false, why: 'no WEBGL_lose_context' };
  const before = stat.renders;
  ext.loseContext();
  await new Promise((r) => setTimeout(r, 100));
  const wasLost = lost;
  ext.restoreContext();
  await new Promise((r) => setTimeout(r, 300));
  views.forEach((v) => v.invalidate());
  await new Promise((r) => setTimeout(r, 300));
  return { ok: wasLost && !lost && stat.renders > before, wasLost, lost, restored: stat.restored, renders: stat.renders - before };
};
