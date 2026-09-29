







const G = {
  0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001011001111', 4: '101101111001001',
  5: '111100111001111', 6: '111100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001111',
  A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
  F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
  K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
  P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
  U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
  Z: '111001010100111', '!': '010010010000010', '?': '110001010000010', '.': '000000000000010', ',': '000000000010100',
  "'": '010010000000000', '’': '010010000000000', '-': '000000111000000', '+': '000010111010000', ':': '000010000010000',
  '/': '001001010100100', '%': '101001010100101', ' ': '000000000000000',
};



const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((m) => (m + 0.5) / 16 - 0.5);
export function quantise(ctx, w, h, dither = 0.9) {
  const img = ctx.getImageData(0, 0, w, h), d = img.data;
  for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i += 4) {
    const b = BAYER[(x & 3) + (y & 3) * 4] * dither;
    d[i] = Math.round(Math.min(31, Math.max(0, Math.floor(d[i] * 31 / 255 + b + 0.5))) * 255 / 31);
    d[i + 1] = Math.round(Math.min(63, Math.max(0, Math.floor(d[i + 1] * 63 / 255 + b + 0.5))) * 255 / 63);
    d[i + 2] = Math.round(Math.min(31, Math.max(0, Math.floor(d[i + 2] * 31 / 255 + b + 0.5))) * 255 / 31);
  }
  ctx.putImageData(img, 0, 0);
}


export function createPixelLayer({ readback = false } = {}) {
  const low = document.createElement('canvas'), big = document.createElement('canvas');
  const ctx = low.getContext('2d', readback ? { willReadFrequently: true } : undefined), bctx = big.getContext('2d');
  const L = {
    ctx, k: 1, w: 1, h: 1, used: false,
    
    begin(cssW, cssH, lowW, lowH) {
      if (low.width !== lowW || low.height !== lowH) { low.width = lowW; low.height = lowH; }
      L.w = lowW; L.h = lowH; L.k = cssW / lowW; L.used = false;
      ctx.clearRect(0, 0, lowW, lowH); ctx.globalAlpha = 1;
    },
    
    at(x, y) { return [Math.round(x / L.k), Math.round(y / L.k)]; },
    
    alpha(a) { ctx.globalAlpha = Math.max(0, Math.min(1, Math.ceil(a * 4) / 4)); },
    rect(x, y, w, h, color) { ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h); L.used = true; },
    disc(cx, cy, r, color) {
      ctx.fillStyle = color; cx = Math.round(cx); cy = Math.round(cy); r = Math.max(0, Math.round(r));
      for (let dy = -r; dy <= r; dy++) { const hw = Math.floor(Math.sqrt(r * r - dy * dy) + 0.35); ctx.fillRect(cx - hw, cy + dy, hw * 2 + 1, 1); }
      L.used = true;
    },
    
    ring(cx, cy, rx, ry, color, t = 1) {
      ctx.fillStyle = color;
      const n = Math.max(12, Math.ceil(Math.PI * 2 * Math.max(rx, ry)));
      for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; ctx.fillRect(Math.round(cx + Math.cos(a) * rx - t / 2), Math.round(cy + Math.sin(a) * ry - t / 2), t, t); }
      L.used = true;
    },
    line(x0, y0, x1, y1, color, t = 1) {
      ctx.fillStyle = color;
      const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
      for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + (x1 - x0) * i / n - (t - 1) / 2), Math.round(y0 + (y1 - y0) * i / n - (t - 1) / 2), t, t);
      L.used = true;
    },
    textWidth(str, s = 1) { return str.length * 4 * s - s; },
    
    text(str, x, y, color, { s = 1, outline = '#1c1830', shadow = true } = {}) {
      str = String(str).toUpperCase();
      const w = L.textWidth(str, s), x0 = Math.round(x - w / 2), y0 = Math.round(y);
      const glyphs = (col, ox, oy, grow) => {
        ctx.fillStyle = col;
        for (let i = 0; i < str.length; i++) {
          const g = G[str[i]] || G['?'];
          for (let b = 0; b < 15; b++) if (g[b] === '1') ctx.fillRect(x0 + i * 4 * s + (b % 3) * s + ox - grow, y0 + Math.floor(b / 3) * s + oy - grow, s + grow * 2, s + grow * 2);
        }
      };
      if (outline) { if (shadow) glyphs(outline, 1, 1, 1); glyphs(outline, 0, 0, 1); }
      glyphs(color, 0, 0, 0);
      L.used = true;
    },
    
    heart(cx, cy, s, color, edge = '#1c1830') {
      const rows = ['0110110', '1111111', '1111111', '0111110', '0011100', '0001000'];
      const x0 = Math.round(cx - 3.5 * s), y0 = Math.round(cy - 3 * s);
      for (const [col, grow] of [[edge, 1], [color, 0]]) {
        ctx.fillStyle = col;
        rows.forEach((r, j) => { for (let i = 0; i < 7; i++) if (r[i] === '1') ctx.fillRect(x0 + i * s - grow, y0 + j * s - grow, s + grow * 2, s + grow * 2); });
      }
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x0 + s, y0 + s, s, s);
      L.used = true;
    },
    
    quantise(dither) { quantise(ctx, L.w, L.h, dither); L.used = true; },
    
    end(target, cssW, cssH, dpr = 1) {
      ctx.globalAlpha = 1;
      if (!L.used) return;
      const m = Math.max(1, Math.ceil(L.k * dpr));
      if (big.width !== L.w * m || big.height !== L.h * m) { big.width = L.w * m; big.height = L.h * m; }
      bctx.imageSmoothingEnabled = false;
      bctx.clearRect(0, 0, big.width, big.height);
      bctx.drawImage(low, 0, 0, big.width, big.height);
      target.save();
      target.imageSmoothingEnabled = true; target.imageSmoothingQuality = 'high';
      target.drawImage(big, 0, 0, cssW, cssH);
      target.restore();
    },
  };
  return L;
}
