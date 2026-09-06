































import { FIELD_MM } from '../../../web-engine/rts/fixed.js';
import { CELLS_PER_SIDE } from '../../../web-engine/rts/maps/mapFormat.js';
import { HERD } from '../../../web-engine/rts/roster.js';












const COL = {
  
















  unknownLand: '#212824',
  unknownWater: '#15383e',
  unknownKeystone: '#31291a',
  neutral: '#6c6248',
  keystone: '#c8a94e',
  herd: '#79c04a',
  yieldd: '#b9c0c8',
  water: '#28b6c4',
  waterFoul: '#7a6f3e',
  mine: '#f2ffd8',
  theirs: '#ff5a3c',
  frame: '#3fb8a6',
  camera: '#9ff2e4',
  flash: '#ffe9a8',
};


function rgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

const RGB = Object.fromEntries(Object.entries(COL).map(([k, v]) => [k, rgb(v)]));










export function createMinimap({ canvas, match, seat, onJump }) {
  const ctx = canvas.getContext('2d');

  
  
  
  
  
  
  
  
  
  
  const grid = document.createElement('canvas');
  grid.width = CELLS_PER_SIDE;
  grid.height = CELLS_PER_SIDE;
  const gctx = grid.getContext('2d');
  const img = gctx.createImageData(CELLS_PER_SIDE, CELLS_PER_SIDE);

  const sectorCount = match.w.sectors.length;

  








  const seen = new Uint8Array(sectorCount);
  const rememberedOwner = new Int8Array(sectorCount).fill(-1);
  const rememberedFoul = new Uint8Array(sectorCount);

  
  const bounds = [];
  for (let i = 0; i < sectorCount; i += 1) {
    bounds.push({ x0: CELLS_PER_SIDE, y0: CELLS_PER_SIDE, x1: -1, y1: -1 });
  }
  {
    const soc = match.w.map.sectorOfCell;
    for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
      for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
        const b = bounds[soc[cy * CELLS_PER_SIDE + cx]];
        if (!b) continue;
        if (cx < b.x0) b.x0 = cx;
        if (cy < b.y0) b.y0 = cy;
        if (cx > b.x1) b.x1 = cx;
        if (cy > b.y1) b.y1 = cy;
      }
    }
  }

  
  const flashUntil = new Map();
  const lastOwner = new Int8Array(sectorCount).fill(-2);

  let rasterAt = -1e9;
  let cssW = 0;
  let cssH = 0;
  let dead = false;
  








  let cameraRect = null;

  function ownerColour(m, s) {
    if (s.kind === 'water') return s.pollution > 1 ? RGB.waterFoul : RGB.water;
    if (s.owner === null || s.owner < 0) {
      return s.kind === 'keystone' ? RGB.keystone : RGB.neutral;
    }
    return m.factions[s.owner] === HERD ? RGB.herd : RGB.yieldd;
  }

  








  function paintRaster(m) {
    const soc = m.w.map.sectorOfCell;
    const vis = m.presence.visible;
    const base = seat * sectorCount;
    const d = img.data;

    
    
    
    for (let s = 0; s < sectorCount; s += 1) {
      const sec = m.w.sectors[s];
      if (vis[base + s] || sec.owner === seat) {
        seen[s] = 1;
        rememberedOwner[s] = sec.owner === null ? -1 : sec.owner;
        rememberedFoul[s] = sec.pollution;
      }
      if (lastOwner[s] === -2) {
        lastOwner[s] = sec.owner === null ? -1 : sec.owner;
      }
    }

    const N = CELLS_PER_SIDE;
    for (let cy = 0; cy < N; cy += 1) {
      for (let cx = 0; cx < N; cx += 1) {
        const cell = cy * N + cx;
        const s = soc[cell];
        const o = cell * 4;
        const sec = m.w.sectors[s];
        const lit = vis[base + s] || sec.owner === seat;

        let c;
        let k;
        if (!seen[s]) {
          
          
          c = sec.kind === 'water' ? RGB.unknownWater
            : (sec.kind === 'keystone' ? RGB.unknownKeystone : RGB.unknownLand);
          k = 1;
        } else {
          
          
          const shown = lit
            ? sec
            : { kind: sec.kind, owner: rememberedOwner[s] < 0 ? null : rememberedOwner[s],
              pollution: rememberedFoul[s] };
          c = ownerColour(m, shown);
          
          
          
          
          k = lit ? 1 : 0.55;
        }

        
        
        
        
        
        
        
        
        
        
        
        
        const edge = (cx + 1 < N && soc[cell + 1] !== s)
          || (cx > 0 && soc[cell - 1] !== s)
          || (cy + 1 < N && soc[cell + N] !== s)
          || (cy > 0 && soc[cell - N] !== s);
        if (edge) k *= 0.6;

        d[o] = c[0] * k; d[o + 1] = c[1] * k; d[o + 2] = c[2] * k;
        d[o + 3] = 255;
      }
    }
    gctx.putImageData(img, 0, 0);
  }

  
  function noteFlips(m, now) {
    for (let s = 0; s < sectorCount; s += 1) {
      const o = m.w.sectors[s].owner === null ? -1 : m.w.sectors[s].owner;
      if (lastOwner[s] !== -2 && o !== lastOwner[s]) flashUntil.set(s, now + 1400);
      lastOwner[s] = o;
    }
  }

  function fitCanvas() {
    const r = canvas.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));
    if (w === cssW && h === cssH) return;
    cssW = w; cssH = h;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  











  function update(m, s, view) {
    if (dead) return;
    if (s !== seat) throw new Error(`minimap is bound to seat ${seat}, asked for ${s}`);
    fitCanvas();
    const now = performance.now();
    const v = view && view.view ? view.view : view;

    noteFlips(m, now);
    if (now - rasterAt > 125) { rasterAt = now; paintRaster(m); }

    const W = cssW;
    const H = cssH;
    const px = W / CELLS_PER_SIDE;

    ctx.clearRect(0, 0, W, H);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(grid, 0, 0, W, H);

    
    
    
    
    if (flashUntil.size) {
      ctx.lineWidth = 1.5;
      for (const [sec, until] of [...flashUntil]) {
        if (until <= now) { flashUntil.delete(sec); continue; }
        const b = bounds[sec];
        if (!b || b.x1 < 0) continue;
        ctx.globalAlpha = Math.min(1, (until - now) / 700);
        ctx.strokeStyle = COL.flash;
        ctx.strokeRect(b.x0 * px + 0.5, b.y0 * px + 0.5,
          (b.x1 - b.x0 + 1) * px - 1, (b.y1 - b.y0 + 1) * px - 1);
      }
      ctx.globalAlpha = 1;
    }

    
    
    
    
    
    
    const vis = m.presence.visible;
    const base = s * sectorCount;
    const w = m.w;
    const blip = Math.max(2, px * 1.35);
    const half = blip / 2;

    ctx.fillStyle = COL.theirs;
    for (let i = 0; i < w.u.count; i += 1) {
      if (!w.u.alive[i] || w.u.owner[i] === s || w.u.owner[i] < 0) continue;
      const sec = w.u.sector[i];
      if (sec < 0 || !vis[base + sec]) continue;
      ctx.fillRect((w.u.x[i] / FIELD_MM) * W - half, (w.u.y[i] / FIELD_MM) * H - half, blip, blip);
    }
    ctx.fillStyle = COL.mine;
    for (let i = 0; i < w.u.count; i += 1) {
      if (!w.u.alive[i] || w.u.owner[i] !== s) continue;
      ctx.fillRect((w.u.x[i] / FIELD_MM) * W - half, (w.u.y[i] / FIELD_MM) * H - half, blip, blip);
    }

    
    
    const bs = Math.max(3, px * 2.1);
    for (let i = 0; i < w.b.count; i += 1) {
      if (!w.b.alive[i]) continue;
      const own = w.b.owner[i];
      const sec = w.b.sector[i];
      if (own !== s && (sec < 0 || !vis[base + sec])) continue;
      ctx.fillStyle = own === s ? COL.mine : COL.theirs;
      ctx.fillRect((w.b.x[i] / FIELD_MM) * W - bs / 2, (w.b.y[i] / FIELD_MM) * H - bs / 2, bs, bs);
      ctx.strokeStyle = 'rgba(4,10,12,.8)';
      ctx.lineWidth = 1;
      ctx.strokeRect((w.b.x[i] / FIELD_MM) * W - bs / 2, (w.b.y[i] / FIELD_MM) * H - bs / 2, bs, bs);
    }

    
    cameraRect = null;
    if (v && v.span > 0) {
      
      
      
      const field = FIELD_MM / 1000;
      const aspect = (window.innerWidth || 1) / Math.max(1, window.innerHeight || 1);
      let hw = v.span * aspect;
      let hh = v.span;
      
      
      
      if ((v.yawSteps || 0) % 2 === 1) { const t = hw; hw = hh; hh = t; }
      const rx = ((v.x - hw) / field) * W;
      const ry = ((v.y - hh) / field) * H;
      const rw = Math.max(4, (hw * 2 / field) * W);
      const rh = Math.max(4, (hh * 2 / field) * H);
      ctx.strokeStyle = COL.camera;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(Math.round(rx) + 0.5, Math.round(ry) + 0.5, rw, rh);
      cameraRect = { x: rx, y: ry, w: rw, h: rh };
    }
  }

  
  
  
  
  
  
  let dragging = false;

  function jumpTo(e) {
    const r = canvas.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) return;
    const fx = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const fy = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));
    if (onJump) onJump(Math.round(fx * FIELD_MM), Math.round(fy * FIELD_MM));
  }

  function onDown(e) {
    dragging = true;
    try { canvas.setPointerCapture(e.pointerId); } catch {  }
    jumpTo(e);
    e.preventDefault();
    e.stopPropagation();
  }
  function onMove(e) { if (dragging) { jumpTo(e); e.preventDefault(); } }
  function onUp(e) {
    dragging = false;
    try { canvas.releasePointerCapture(e.pointerId); } catch {  }
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  function destroy() {
    dead = true;
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerup', onUp);
    canvas.removeEventListener('pointercancel', onUp);
  }

  return {
    update,
    destroy,
    
    debug: {
      get seen() { return seen.reduce((a, b) => a + b, 0); },
      get flashing() { return flashUntil.size; },
      get size() { return [cssW, cssH]; },
      get cameraRect() { return cameraRect; },
      









      colours(step = 3) {
        if (!cssW || !cssH) return 0;
        const d = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const set = new Set();
        for (let i = 0; i < d.length; i += 4 * step) {
          set.add((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]);
        }
        return set.size;
      },
    },
  };
}
