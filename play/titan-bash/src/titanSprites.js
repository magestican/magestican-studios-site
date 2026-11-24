





export const POSES = ['idle', 'walk_a', 'walk_b', 'attack', 'ability', 'stall', 'down'];



export function poseFor(t, tick, fireCooldownTicks) {
  if (t.rattled > 0) return 'down';
  if (t.stall > 0) return 'stall';
  if (t.lunge > 0 || (fireCooldownTicks > 0 && t.fireCd > fireCooldownTicks * 0.65)) return 'attack';
  if (t.aegis > 0 || t.dash > 0) return 'ability';
  if (Math.hypot(t.vx || 0, t.vy || 0) > 0.5) return ((tick >> 3) & 1) ? 'walk_b' : 'walk_a';
  return 'idle';
}

export function hexRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b); const mn = Math.min(r, g, b); const l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn; const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}
function hslRgb(h, s, l) {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s; const p = 2 * l - q;
  const f = (t) => { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}




export function recolour(data, [tr, tg, tb]) {
  const [th, ts, tl] = rgbHsl(tr, tg, tb);
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 8) continue;
    const [, s, l] = rgbHsl(data[i], data[i + 1], data[i + 2]);
    if (s < 0.3 || l < 0.12 || l > 0.92) continue;
    const nl = Math.min(0.9, Math.max(0.08, l + (tl - 0.5) * 0.8));
    const [r, g, b] = hslRgb(th, Math.max(ts, 0.45), nl);
    data[i] = r; data[i + 1] = g; data[i + 2] = b;
  }
  return data;
}


const sheets = {}; const tinted = new Map();



export const SHEETS = Object.freeze(['bulwark', 'mortar', 'lancer', 'wisp']);
export function loadTitanSprites(baseUrl, frames = SHEETS) {
  return Promise.all(frames.map(async (f) => {
    try {
      const dir = new URL(`${f}_sprites/`, baseUrl);
      const meta = await (await fetch(new URL('sheet.json', dir))).json();
      const img = new Image(); img.src = new URL('sheet.png', dir).href; await img.decode();
      sheets[f] = { img, meta, byName: Object.fromEntries(meta.frames.map((fr) => [fr.name, fr])) };
    } catch {  }
  }));
}
export function spriteFor(frame, colour) {
  const sh = sheets[frame]; if (!sh) return null;
  const key = `${frame}|${colour}`;
  if (!tinted.has(key)) {
    const c = document.createElement('canvas'); c.width = sh.img.naturalWidth; c.height = sh.img.naturalHeight;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(sh.img, 0, 0);
    const px = g.getImageData(0, 0, c.width, c.height); recolour(px.data, hexRgb(colour)); g.putImageData(px, 0, 0);
    tinted.set(key, { canvas: c, byName: sh.byName });
  }
  return tinted.get(key);
}
