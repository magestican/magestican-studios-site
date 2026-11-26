












export const CUTIN = Object.freeze({ life: 36, reducedLife: 30, gap: 240, slide: 6 });

export const POP_TICKS = 7;



export const FACES_DELIVERED = Object.freeze([]);
export const FACE_DIR = new URL('../assets/faces/', import.meta.url);


export function cutinFor(m, e, colourOf, nameOf) {
  let t = null; let call = '';
  if (e.type === 'bell' && e.by != null) { t = m.titans[e.by]; call = 'BELL!'; }
  else if (e.type === 'lumenOverdrive' && e.id != null) { t = m.titans[e.id]; call = 'OVERDRIVE!'; }
  if (!t) return null;
  return { id: t.id ?? (e.by ?? e.id), frame: t.frame, colour: colourOf(t), name: nameOf(t), call };
}

export function createCutins({ reducedMotion = false } = {}) {
  let cur = null; let since = CUTIN.gap;
  const c = {};
  c.onEvents = (m, events, colourOf, nameOf) => {
    for (const e of events) {
      if (cur || since < CUTIN.gap) return;
      const s = cutinFor(m, e, colourOf, nameOf);
      if (!s) continue;
      const max = reducedMotion ? CUTIN.reducedLife : CUTIN.life;
      cur = { ...s, life: max, max, reduced: reducedMotion, seed: (s.id * 977 + since) % 1000 };
    }
  };
  
  c.tick = () => {
    if (cur) { cur.life -= 1; if (cur.life <= 0) { cur = null; since = 0; } } else since += 1;
  };
  c.holding = () => !!cur;
  c.current = () => cur;
  return c;
}

const easeOut = (t) => 1 - (1 - t) * (1 - t) * (1 - t);
const easeIn = (t) => t * t * t;





export function bandAt(age, max, W, H, reduced = false) {
  const h = Math.round(Math.min(H * 0.4, Math.max(H * 0.2, Math.min(H * 0.3, W * 0.5))));
  const slant = Math.round(h * 0.22);
  if (reduced) return { dx: 0, h, slant };
  const n = CUTIN.slide;
  let dx = 0;
  if (age < n) dx = -W * (1 - easeOut(age / n));
  else if (age > max - n - 1) dx = W * easeIn(Math.min(1, (age - (max - n - 1)) / n));
  return { dx: Math.round(dx), h, slant };
}


export function popScale(age, reduced = false) {
  if (reduced || age >= POP_TICKS) return 1;
  if (age <= 3) return 0.45 + (1.3 - 0.45) * (age / 3);
  return 1.3 - 0.3 * ((age - 3) / (POP_TICKS - 3));
}





export function drawCutin(ctx, cur, W, H, cy, face, font) {
  if (!cur) return;
  const age = cur.max - cur.life;
  const { dx, h, slant } = bandAt(age, cur.max, W, H, cur.reduced);
  const top = cy - h / 2; const bot = cy + h / 2;
  const fade = cur.reduced ? Math.min(1, cur.life / 6, (age + 1) / 4) : 1;
  ctx.save();
  ctx.globalAlpha = fade;
  
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 0, W, H);
  ctx.translate(dx, 0);
  const band = () => { ctx.beginPath(); ctx.moveTo(-W, top + slant); ctx.lineTo(W * 2, top - slant); ctx.lineTo(W * 2, bot - slant); ctx.lineTo(-W, bot + slant); ctx.closePath(); };
  
  const g = ctx.createLinearGradient(0, 0, W, 0);
  g.addColorStop(0, '#06080d'); g.addColorStop(0.45, '#0b1020'); g.addColorStop(1, cur.colour);
  band(); ctx.fillStyle = g; ctx.fill();
  ctx.save(); band(); ctx.clip();
  
  let r = cur.seed + 1;
  const rnd = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    const y = top - slant + rnd() * (h + slant * 2); const len = W * (0.15 + rnd() * 0.35);
    const x = ((rnd() * W * 1.6 + (cur.reduced ? 0 : age * W * 0.06)) % (W * 1.6)) - W * 0.3;
    ctx.globalAlpha = fade * (0.12 + rnd() * 0.25); ctx.fillStyle = i % 3 ? '#ffffff' : cur.colour;
    ctx.fillRect(x, y, len, Math.max(1, h * (0.004 + rnd() * 0.01)));
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = fade;
  
  if (face && face.img) {
    const fh = h * 1.35; const fw = fh * (face.sw / face.sh);
    const fx = W * 0.97 - fw - (cur.reduced ? 0 : (age - CUTIN.slide) * h * 0.004);
    ctx.drawImage(face.img, face.sx, face.sy, face.sw, face.sh, fx, cy - fh * 0.42, fw, fh);
  }
  ctx.restore();
  
  ctx.lineWidth = Math.max(3, h * 0.03); ctx.strokeStyle = cur.colour;
  for (const [a, b] of [[top + slant, top - slant], [bot + slant, bot - slant]]) { ctx.beginPath(); ctx.moveTo(-W, a); ctx.lineTo(W * 2, b); ctx.stroke(); }
  ctx.lineWidth = Math.max(1, h * 0.008); ctx.strokeStyle = '#ffffff';
  for (const [a, b] of [[top + slant, top - slant], [bot + slant, bot - slant]]) { ctx.beginPath(); ctx.moveTo(-W, a); ctx.lineTo(W * 2, b); ctx.stroke(); }
  
  ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
  let px = Math.round(h * 0.42);
  ctx.font = `800 ${px}px ${font}`;
  const room = W * 0.58 - h * 0.25;
  const w = ctx.measureText(cur.call).width; if (w > room) { px = Math.max(12, Math.floor(px * room / w)); ctx.font = `800 ${px}px ${font}`; }
  const tx = h * 0.25; const ty = cy + px * 0.18;
  ctx.save(); ctx.translate(tx, ty); ctx.rotate(-Math.atan2(slant * 2, W * 3));
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(4, px * 0.14); ctx.strokeStyle = '#000';
  ctx.fillStyle = '#ffffff'; ctx.strokeText(cur.call, 0, 0); ctx.fillText(cur.call, 0, 0);
  const npx = Math.max(12, Math.round(px * 0.38)); ctx.font = `700 ${npx}px ${font}`;
  ctx.lineWidth = Math.max(3, npx * 0.16); ctx.fillStyle = cur.colour;
  ctx.strokeText(cur.name, px * 0.04, npx * 1.15); ctx.fillText(cur.name, px * 0.04, npx * 1.15);
  ctx.restore();
  ctx.restore();
}


export function loadFaceArt(base = FACE_DIR, delivered = FACES_DELIVERED) {
  const art = {};
  if (typeof Image === 'undefined') return art;
  for (const f of delivered) {
    const img = new Image(); img.src = new URL(`${f}.png`, base).href;
    img.decode().then(() => { art[f] = img; }, () => {});
  }
  return art;
}
