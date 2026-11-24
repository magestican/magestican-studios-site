






const MAX = 600;






export const HOLD = { slam: 3, counter: 3, drop: 4, bell: 7 };
export const HOLD_CAP = 8;
export const HOLD_GAP = 20;


const IMPACT = { slam: 2, counter: 2, bell: 4 };

export function createJuice(rng = Math.random, { reducedMotion = false } = {}) {
  const j = { particles: [], rings: [], hold: 0, sinceHold: HOLD_GAP, impact: null, flash: new Map() };
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
  };
  j.draw = (ctx, X, Y, s) => {
    ctx.save();
    for (const p of j.particles) {
      const a = p.life / p.max;
      if (p.kind === 'spark') {
        ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
        ctx.strokeStyle = p.colour; ctx.lineWidth = Math.max(1.5, p.size * s * a); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(X(p.x), Y(p.y)); ctx.lineTo(X(p.x - p.vx * 3), Y(p.y - p.vy * 3)); ctx.stroke();
      } else {
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a * 0.6; ctx.fillStyle = p.colour;
        ctx.beginPath(); ctx.arc(X(p.x), Y(p.y), p.size * s * (1.6 - a), 0, Math.PI * 2); ctx.fill();
      }
    }
    
    if (j.impact) {
      const k = j.impact.life / j.impact.max; const R = s * (j.impact.max >= 4 ? 16 : 8);
      const g = ctx.createRadialGradient(X(j.impact.x), Y(j.impact.y), 0, X(j.impact.x), Y(j.impact.y), R);
      g.addColorStop(0, j.impact.colour); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.55 * k; ctx.fillStyle = g;
      ctx.fillRect(X(j.impact.x) - R, Y(j.impact.y) - R, R * 2, R * 2);
    }
    ctx.globalCompositeOperation = 'lighter';
    for (const r of j.rings) {
      const k = 1 - r.life / r.max;
      ctx.globalAlpha = (1 - k) * 0.8; ctx.strokeStyle = r.colour; ctx.lineWidth = Math.max(2, s * 0.35 * (1 - k));
      ctx.beginPath(); ctx.ellipse(X(r.x), Y(r.y), r.r * k * s, r.r * k * s * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  };
  return j;
}
