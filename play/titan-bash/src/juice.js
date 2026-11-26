






const MAX = 600;






export const HOLD = { slam: 3, counter: 3, drop: 4, bell: 7 };
export const HOLD_CAP = 8;
export const HOLD_GAP = 20;


const IMPACT = { slam: 2, counter: 2, bell: 4 };





export const FX_MAX_LIFE = 42;
export const FX = Object.freeze({
  muzzle: { life: 6, size: 2.4, grow: 0 },
  beam: { life: 9, size: 10, grow: 0 },
  explosion: { life: 26, size: 7, grow: 0.5 },
  clang: { life: 14, size: 4.5, grow: 0.3 },
  ringout: { life: 36, size: 18, grow: 0.6 },
});

export const FX_REDUCED_ALPHA = 0.5;

export function createJuice(rng = Math.random, { reducedMotion = false, art = null, tint = tintCanvas } = {}) {
  const j = { particles: [], rings: [], fx: [], art, hold: 0, sinceHold: HOLD_GAP, impact: null, flash: new Map() };
  const tinted = new Map();
  
  const paint = (key, x, y, colour, rot = 0) => {
    if (reducedMotion && key === 'ringout') return;
    if (j.fx.length < 60) j.fx.push({ key, x, y, colour, rot, life: FX[key].life, max: FX[key].life });
  };
  const freeze = (type) => {
    const n = HOLD[type];
    if (!n) return;
    if (type !== 'bell' && (j.hold > 0 || j.sinceHold < HOLD_GAP)) return;
    j.hold = Math.min(HOLD_CAP, Math.max(j.hold, n)); j.sinceHold = 0;
  };
  const impact = (type, x, y, colour, id) => {
    const n = IMPACT[type];
    if (!n || reducedMotion) return;
    if (!j.impact || n >= j.impact.life) j.impact = { x, y, colour, life: n, max: n };
    if (id != null) j.flash.set(id, Math.max(j.flash.get(id) || 0, n + 2));
  };
  
  j.holding = () => j.hold > 0;
  j.holdTick = () => { j.hold = Math.max(0, j.hold - 1); fade(); };
  j.flashing = (id) => (j.flash.get(id) || 0) > 0;
  const fade = () => {
    if (j.impact && --j.impact.life <= 0) j.impact = null;
    for (const [id, n] of j.flash) if (n <= 1) j.flash.delete(id); else j.flash.set(id, n - 1);
  };
  const burst = (x, y, n, { speed = 12, life = 30, colour = '#fff', size = 0.25, drag = 0.9, kind = 'spark', up = 0 } = {}) => {
    for (let i = 0; i < n && j.particles.length < MAX; i++) {
      const a = rng() * Math.PI * 2; const v = speed * (0.35 + rng() * 0.65) / 60;
      j.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - up / 60, life, max: life, colour, size, drag, kind });
    }
  };
  const ring = (x, y, r, life, colour) => { if (j.rings.length < 40) j.rings.push({ x, y, r, life, max: life, colour }); };
  j.onEvents = (m, events, colourOf) => {
    for (const e of events) {
      const tg = e.target != null ? m.titans[e.target] : e.id != null ? m.titans[e.id] : null;
      freeze(e.type);
      if (tg) impact(e.type, tg.x, tg.y - 1, e.type === 'bell' ? '#fff2b0' : '#ffffff', tg.id ?? (e.target ?? e.id));
      if (e.type === 'fire' && tg) {
        const c = colourOf(tg); const f = tg.facing || 0;
        const mx = tg.x + Math.cos(f) * 1.4; const my = tg.y - 1 + Math.sin(f) * 1.4;
        paint('muzzle', mx, my, c);
        if (tg.frame === 'lancer') paint('beam', mx + Math.cos(f) * FX.beam.size / 2, my + Math.sin(f) * FX.beam.size / 2, c, f);
      } else if (e.type === 'blast') paint('explosion', e.x, e.y - 0.5, e.by != null && m.titans[e.by] ? colourOf(m.titans[e.by]) : '#ffb040');
      else if (e.type === 'clang') paint('clang', e.x, e.y - 1, '#9fe3ff');
      else if (e.type === 'bell' && tg) paint('ringout', tg.x, tg.y - 1, e.by != null && m.titans[e.by] ? colourOf(m.titans[e.by]) : '#ffd040');
      if (e.type === 'hit' && tg) burst(tg.x, tg.y - 1, 6, { speed: 10, life: 18, colour: '#ffe2a8', size: 0.18 });
      else if (e.type === 'slam' && tg) { burst(tg.x, tg.y, 14, { speed: 16, life: 24, colour: '#fff3c4' }); ring(tg.x, tg.y, 3, 18, '#ffffff'); }
      else if (e.type === 'clang') { burst(e.x, e.y, 18, { speed: 20, life: 26, colour: '#9fe3ff', size: 0.22 }); ring(e.x, e.y, 4, 20, '#9fe3ff'); }
      else if (e.type === 'bell' && tg) {
        const c = e.by != null && m.titans[e.by] ? colourOf(m.titans[e.by]) : '#ffd040';
        burst(tg.x, tg.y - 1, 40, { speed: 26, life: 48, colour: '#ffd040', size: 0.3 });
        burst(tg.x, tg.y - 1, 24, { speed: 14, life: 60, colour: c, size: 0.35 });
        ring(tg.x, tg.y, 9, 36, '#ffd040');
      } else if (e.type === 'dash' && tg) burst(tg.x, tg.y + 0.6, 8, { speed: 5, life: 22, colour: 'rgba(200,210,230,0.7)', size: 0.5, kind: 'dust', drag: 0.86 });
      else if ((e.type === 'stall' || e.type === 'roughVent') && tg) burst(tg.x, tg.y - 1.5, 16, { speed: 4, life: 50, colour: 'rgba(235,240,250,0.6)', size: 0.6, kind: 'dust', drag: 0.95, up: 3 });
      else if (e.type === 'perfectVent' && tg) { burst(tg.x, tg.y - 1, 20, { speed: 12, life: 30, colour: '#8ff6ff' }); ring(tg.x, tg.y, 3.5, 22, '#8ff6ff'); }
      else if (e.type === 'shatter') burst(e.x, e.y, 22, { speed: 18, life: 34, colour: '#9ff3e6', size: 0.28 });
      else if (e.type === 'drop' && tg) { burst(tg.x, tg.y + 0.5, 18, { speed: 9, life: 30, colour: 'rgba(210,200,180,0.7)', size: 0.6, kind: 'dust', drag: 0.88 }); ring(tg.x, tg.y, 5, 24, '#ffffff'); }
      else if (e.type === 'lumenOverdrive' && tg) { burst(tg.x, tg.y - 1, 30, { speed: 18, life: 40, colour: '#78e6ff' }); ring(tg.x, tg.y, 6, 30, '#78e6ff'); }
    }
  };
  j.step = () => {
    j.sinceHold += 1; fade();
    for (const p of j.particles) { p.x += p.vx; p.y += p.vy; p.vx *= p.drag; p.vy *= p.drag; p.life -= 1; }
    j.particles = j.particles.filter((p) => p.life > 0);
    for (const r of j.rings) r.life -= 1;
    j.rings = j.rings.filter((r) => r.life > 0);
    for (const f of j.fx) f.life -= 1;
    j.fx = j.fx.filter((f) => f.life > 0);
  };
  
  
  j.drawFx = (ctx, X, Y, s, P) => {
    if (!j.art) return;
    const pt = P || ((x, y) => [X(x), Y(y)]);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const f of j.fx) {
      const img = j.art[f.key];
      if (!img || !img.width) continue;
      const k = f.life / f.max; const spec = FX[f.key];
      const w = spec.size * s * (1 + spec.grow * (1 - k)); const h = w * (img.height / img.width);
      const a = Math.pow(k, 0.6) * (reducedMotion ? FX_REDUCED_ALPHA : 1);
      const id = `${f.key}|${f.colour}`;
      if (!tinted.has(id)) tinted.set(id, tint(img, f.colour));
      const [fxp, fyp] = pt(f.x, f.y);
      const [ex, ey] = f.rot ? pt(f.x + Math.cos(f.rot), f.y + Math.sin(f.rot)) : [0, 0];
      const ang = f.rot ? Math.atan2(ey - fyp, ex - fxp) : 0;
      ctx.translate(fxp, fyp); if (ang) ctx.rotate(ang);
      ctx.globalAlpha = a; ctx.drawImage(tinted.get(id), -w / 2, -h / 2, w, h);
      ctx.globalAlpha = a * 0.55; ctx.drawImage(img, -w / 2, -h / 2, w, h);
      if (ang) ctx.rotate(-ang);
      ctx.translate(-fxp, -fyp);
    }
    ctx.restore();
  };
  j.draw = (ctx, X, Y, s, P) => {
    j.drawFx(ctx, X, Y, s, P);
    const pt = P || ((x, y) => [X(x), Y(y)]);
    ctx.save();
    for (const p of j.particles) {
      const a = p.life / p.max;
      if (p.kind === 'spark') {
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
        ctx.strokeStyle = p.colour; ctx.lineWidth = Math.max(1.5, p.size * s * a); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(...pt(p.x, p.y)); ctx.lineTo(...pt(p.x - p.vx * 3, p.y - p.vy * 3)); ctx.stroke();
      } else {
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a * 0.6; ctx.fillStyle = p.colour;
        ctx.beginPath(); ctx.arc(...pt(p.x, p.y), p.size * s * (1.6 - a), 0, Math.PI * 2); ctx.fill();
      }
    }
    
    if (j.impact) {
      const k = j.impact.life / j.impact.max; const R = s * (j.impact.max >= 4 ? 16 : 8);
      const [ix, iy] = pt(j.impact.x, j.impact.y);
      const g = ctx.createRadialGradient(ix, iy, 0, ix, iy, R);
      g.addColorStop(0, j.impact.colour); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55 * k; ctx.fillStyle = g;
      ctx.fillRect(ix - R, iy - R, R * 2, R * 2);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const r of j.rings) {
      const k = 1 - r.life / r.max;
      ctx.globalAlpha = (1 - k) * 0.8; ctx.strokeStyle = r.colour; ctx.lineWidth = Math.max(2, s * 0.35 * (1 - k));
      ctx.beginPath(); ctx.ellipse(...pt(r.x, r.y), r.r * k * s, r.r * k * s * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  };
  return j;
}




export const FX_DELIVERED = Object.freeze(['muzzle', 'beam', 'explosion', 'clang', 'ringout']);



export function loadFxArt(base = new URL('../assets/vfx/', import.meta.url), delivered = FX_DELIVERED) {
  const art = {};
  if (typeof Image === 'undefined') return art;
  for (const key of delivered) {
    if (!FX[key]) continue;
    const img = new Image(); img.src = new URL(`${key}.webp`, base).href;
    img.decode().then(() => { art[key] = img; }, () => {});
  }
  return art;
}



function tintCanvas(img, colour) {
  if (typeof document === 'undefined') return img;
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0); g.globalCompositeOperation = 'multiply'; g.fillStyle = colour; g.fillRect(0, 0, c.width, c.height);
  return c;
}
