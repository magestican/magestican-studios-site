



























































import { COLORS, SIZES, FONT_STACK } from '../../../web-engine/words/style.js';


export function roundRect(g, x, y, w, h, r = SIZES.radius) {
  const rad = Math.max(0, Math.min(r, w / 2, h / 2));
  g.beginPath();
  g.moveTo(x + rad, y);
  g.arcTo(x + w, y, x + w, y + h, rad);
  g.arcTo(x + w, y + h, x, y + h, rad);
  g.arcTo(x, y + h, x, y, rad);
  g.arcTo(x, y, x + w, y, rad);
  g.closePath();
}


export const font = (size, weight = 700) => `${weight} ${Math.round(size)}px ${FONT_STACK}`;












export function text(g, string, box, {
  size = SIZES.base, weight = 700, colour = COLORS.ink,
  align = 'center', baseline = 'middle', fit = false, maxWidth = null,
  floor = SIZES.min,
} = {}) {
  let s = Math.max(floor, size);
  let shown = String(string ?? '');
  const w = box.w ?? box.width;
  const h = box.h ?? box.height;
  if (fit) {
    const limit = maxWidth ?? w;
    g.font = font(s, weight);
    while (s > floor && g.measureText(shown).width > limit) {
      s -= 1;
      g.font = font(s, weight);
    }
    if (g.measureText(shown).width > limit && shown.length > 1) {
      
      
      
      
      while (shown.length > 1 && g.measureText(`${shown}…`).width > limit) {
        shown = shown.slice(0, -1);
      }
      shown = `${shown.trimEnd()}…`;
    }
  }
  g.font = font(s, weight);
  g.fillStyle = colour;
  g.textAlign = align;
  g.textBaseline = baseline;
  const x = align === 'left' ? box.x : (align === 'right' ? box.x + w : box.x + w / 2);
  const y = baseline === 'top' ? box.y : box.y + h / 2;
  g.fillText(shown, Math.round(x), Math.round(y));
  return s;
}


export function surface(g, r, {
  fill = COLORS.card, ink = COLORS.ink, offset = SIZES.shadow,
  border = SIZES.border, radius = SIZES.radius, dx = 0, dy = 0, alpha = 1,
} = {}) {
  const x = r.x + dx;
  const y = r.y + dy;
  g.save();
  g.globalAlpha = alpha;
  if (offset > 0) {
    g.fillStyle = ink;
    roundRect(g, x + offset, y + offset, r.w, r.h, radius);
    g.fill();
  }
  g.fillStyle = fill;
  roundRect(g, x, y, r.w, r.h, radius);
  g.fill();
  if (border > 0) {
    g.lineWidth = border;
    g.strokeStyle = ink;
    roundRect(g, x + border / 2, y + border / 2, r.w - border, r.h - border, radius);
    g.stroke();
  }
  g.restore();
}


export function clear(g, width, height) {
  g.fillStyle = COLORS.paper;
  g.fillRect(0, 0, width, height);
}


export function scrim(g, width, height, alpha = 0.82) {
  g.save();
  g.globalAlpha = alpha;
  g.fillStyle = COLORS.paper;
  g.fillRect(0, 0, width, height);
  g.restore();
}


export function rule(g, x, y, width) {
  g.save();
  g.fillStyle = COLORS.ink;
  g.fillRect(x, y, width, SIZES.border);
  g.restore();
}


export function button(g, r, {
  label = '', hover = 0, press = 0, disabled = false, tone = null, size = SIZES.base,
  icon = null,
} = {}) {
  const fill = tone ? COLORS[tone] : COLORS.card;
  const on = tone ? COLORS.card : (disabled ? COLORS.slate : COLORS.ink);
  surface(g, r, {
    fill,
    offset: disabled ? 0 : Math.max(0, SIZES.shadow + hover - press),
    dy: press,
    alpha: disabled ? 0.6 : 1,
  });
  
  
  const pad = icon && label ? Math.min(26, r.h * 0.6) : 0;
  if (icon === 'people') {
    
    
    
    peopleIcon(g, label
      ? { x: r.x + 6, y: r.y + press, w: pad, h: r.h }
      : { x: r.x, y: r.y + press, w: r.w, h: r.h }, on);
  }
  text(g, label, { x: r.x + pad, y: r.y + press, w: r.w - pad, h: r.h }, {
    size, colour: on, fit: true, maxWidth: r.w - pad - (String(label).length <= 1 ? 6 : 16),
  });
}


export function focusRing(g, r, colour = COLORS.blue) {
  g.save();
  g.lineWidth = 4;
  g.strokeStyle = colour;
  roundRect(g, r.x - 5, r.y - 5, r.w + 10, r.h + 10, SIZES.radius + 4);
  g.stroke();
  g.restore();
}









export function wrap(g, string, maxWidth, { size = SIZES.small, weight = 400 } = {}) {
  g.font = font(size, weight);
  const out = [];
  let line = '';
  for (const word of String(string ?? '').split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && g.measureText(next).width > maxWidth) {
      out.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) out.push(line);
  return out;
}














export function mark(g, kind, cx, cy, size, colour, { hollow = false, weight = 0.16 } = {}) {
  const r = size / 2;
  g.save();
  g.fillStyle = colour;
  g.strokeStyle = colour;
  g.lineWidth = Math.max(2, size * weight);
  g.lineCap = 'round';
  g.beginPath();
  if (kind === 'circle') {
    g.arc(cx, cy, r, 0, Math.PI * 2);
    if (hollow) g.stroke(); else g.fill();
  } else if (kind === 'diamond') {
    g.moveTo(cx, cy - r);
    g.lineTo(cx + r, cy);
    g.lineTo(cx, cy + r);
    g.lineTo(cx - r, cy);
    g.closePath();
    if (hollow) g.stroke(); else g.fill();
  } else if (kind === 'square') {
    g.rect(cx - r, cy - r, r * 2, r * 2);
    if (hollow) g.stroke(); else g.fill();
  } else if (kind === 'cross') {
    g.moveTo(cx - r, cy - r);
    g.lineTo(cx + r, cy + r);
    g.moveTo(cx + r, cy - r);
    g.lineTo(cx - r, cy + r);
    g.stroke();
  } else if (kind === 'triangle') {
    g.moveTo(cx, cy - r);
    g.lineTo(cx + r, cy + r * 0.8);
    g.lineTo(cx - r, cy + r * 0.8);
    g.closePath();
    if (hollow) g.stroke(); else g.fill();
  } else if (kind === 'star') {
    
    
    
    
    
    
    for (let i = 0; i < 10; i += 1) {
      const radius = i % 2 === 0 ? r : r * 0.45;
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
    if (hollow) g.stroke(); else g.fill();
  }
  g.restore();
}














export function boardFrame(g, box, { margin = 0, files = [], ranks = [] } = {}) {
  surface(g, {
    x: box.x - margin, y: box.y - margin, w: box.w + margin * 2, h: box.h + margin * 2,
  }, { fill: COLORS.paper, offset: SIZES.shadow, border: SIZES.border });
  if (margin < 14) return;
  const cell = box.w / 8;
  files.forEach((letter, i) => {
    text(g, letter, { x: box.x + i * cell, y: box.y + box.h, w: cell, h: margin }, {
      size: Math.min(SIZES.min, margin - 2), floor: 11, colour: COLORS.inkSoft,
    });
  });
  ranks.forEach((number, i) => {
    text(g, String(number), { x: box.x - margin, y: box.y + i * cell, w: margin, h: cell }, {
      size: Math.min(SIZES.min, margin - 2), floor: 11, colour: COLORS.inkSoft,
    });
  });
}










export function square(g, r, { dark = false } = {}) {
  g.save();
  g.fillStyle = dark ? COLORS.paper : COLORS.card;
  g.fillRect(r.x, r.y, r.w, r.h);
  if (dark) {
    g.beginPath();
    g.rect(r.x, r.y, r.w, r.h);
    g.clip();
    g.strokeStyle = COLORS.inkSoft;
    g.lineWidth = 2;
    g.globalAlpha = 0.55;
    const pitch = 9;
    for (let d = -r.h; d < r.w + r.h; d += pitch) {
      g.beginPath();
      g.moveTo(r.x + d, r.y);
      g.lineTo(r.x + d + r.h, r.y + r.h);
      g.stroke();
    }
  }
  g.restore();
  
  
  
  g.save();
  g.strokeStyle = COLORS.ink;
  g.lineWidth = 1.5;
  g.strokeRect(r.x + 0.75, r.y + 0.75, r.w - 1.5, r.h - 1.5);
  g.restore();
}









export function piece(g, r, {
  side = 0, king = false, lift = 0, press = 0, ghost = false, doomed = false,
} = {}) {
  
  
  
  
  
  const size = Math.min(r.w, r.h) * 0.64;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2 + press;
  const fill = side === 0 ? COLORS.card : COLORS.ink;
  const on = side === 0 ? COLORS.ink : COLORS.card;
  const drop = Math.max(0, Math.round(size * 0.08) + lift - press);
  const line = Math.max(2.5, size * 0.075);
  g.save();
  if (ghost) g.globalAlpha = 0.4;
  
  
  if (drop > 0) {
    g.fillStyle = COLORS.ink;
    for (const part of parts(cx + drop, cy + drop, size, side)) { part(g); g.fill(); }
    head(g, cx + drop, cy + drop, size);
    g.fill();
  }
  
  
  
  
  
  
  g.lineWidth = line;
  g.strokeStyle = COLORS.ink;
  g.lineJoin = 'round';
  for (const part of parts(cx, cy, size, side)) {
    g.fillStyle = fill;
    part(g);
    g.fill();
    part(g);
    g.stroke();
  }
  g.fillStyle = fill;
  head(g, cx, cy, size);
  g.fill();
  head(g, cx, cy, size);
  g.stroke();
  
  
  
  
  if (size >= 26 && !king) {
    g.fillStyle = on;
    if (side === 1) {
      g.beginPath();
      g.ellipse(cx, cy + size * 0.22, size * 0.26, size * 0.16, 0, 0, Math.PI * 2);
      g.fill();
    }
    const eye = Math.max(2, size * 0.06);
    const eyeY = cy - size * (side === 1 ? 0.12 : 0.03);
    g.fillStyle = on;
    for (const dx of [-1, 1]) {
      g.beginPath();
      g.arc(cx + dx * size * 0.17, eyeY, eye, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.restore();
  if (king) crown(g, cx, cy, size, on);
  if (doomed) {
    
    
    mark(g, 'cross', cx, cy, size * 0.95, COLORS.red, { weight: 0.14 });
  }
}


function head(g, cx, cy, size) {
  g.beginPath();
  g.arc(cx, cy, size / 2, 0, Math.PI * 2);
}









function parts(cx, cy, size, side) {
  const r = size / 2;
  const out = [];
  if (side === 0) {
    
    
    for (const [ax, ay, ar] of [[-0.46, -0.5, 0.3], [0, -0.66, 0.34], [0.46, -0.5, 0.3]]) {
      out.push((g) => {
        g.beginPath();
        g.arc(cx + ax * r, cy + ay * r, ar * r, 0, Math.PI * 2);
      });
    }
    
    for (const dx of [-1, 1]) {
      out.push((g) => {
        g.beginPath();
        g.ellipse(cx + dx * r * 0.98, cy + r * 0.2, r * 0.32, r * 0.19, dx * 0.42, 0, Math.PI * 2);
      });
    }
    return out;
  }
  
  
  
  
  
  
  for (const dx of [-1, 1]) {
    out.push((g) => {
      g.beginPath();
      g.moveTo(cx + dx * r * 0.18, cy - r * 0.88);
      g.quadraticCurveTo(cx + dx * r * 0.72, cy - r * 1.2, cx + dx * r * 1.16, cy - r * 1.42);
      g.quadraticCurveTo(cx + dx * r * 0.86, cy - r * 0.98, cx + dx * r * 0.62, cy - r * 0.72);
      g.closePath();
    });
  }
  
  for (const dx of [-1, 1]) {
    out.push((g) => {
      g.beginPath();
      g.ellipse(cx + dx * r * 1.02, cy + r * 0.02, r * 0.36, r * 0.19, dx * 0.12, 0, Math.PI * 2);
    });
  }
  return out;
}










export function crown(g, cx, cy, size, colour) {
  const r = size / 2;
  g.save();
  g.strokeStyle = colour;
  g.lineWidth = Math.max(2, size * 0.055);
  g.beginPath();
  g.arc(cx, cy, r * 0.72, 0, Math.PI * 2);
  g.stroke();
  const w = r * 0.62;
  const top = cy - r * 0.18;
  const base = cy + r * 0.3;
  g.fillStyle = colour;
  g.beginPath();
  g.moveTo(cx - w, base);
  g.lineTo(cx - w, top);
  g.lineTo(cx - w * 0.5, top + r * 0.26);
  g.lineTo(cx, top - r * 0.14);
  g.lineTo(cx + w * 0.5, top + r * 0.26);
  g.lineTo(cx + w, top);
  g.lineTo(cx + w, base);
  g.closePath();
  g.fill();
  g.restore();
}













export function highlight(g, r, kind) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const size = Math.min(r.w, r.h);
  if (kind === 'selected') {
    g.save();
    g.strokeStyle = COLORS.blue;
    g.lineWidth = 5;
    g.strokeRect(r.x + 2.5, r.y + 2.5, r.w - 5, r.h - 5);
    g.strokeStyle = COLORS.ink;
    g.lineWidth = 4;
    const c = size * 0.26;
    for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const px = sx > 0 ? r.x + 3 : r.x + r.w - 3;
      const py = sy > 0 ? r.y + 3 : r.y + r.h - 3;
      g.beginPath();
      g.moveTo(px + sx * c, py);
      g.lineTo(px, py);
      g.lineTo(px, py + sy * c);
      g.stroke();
    }
    g.restore();
    return;
  }
  
  
  
  
  
  if (kind === 'move') {
    mark(g, 'circle', cx, cy, size * 0.48, COLORS.ink, { hollow: true, weight: 0.28 });
    mark(g, 'circle', cx, cy, size * 0.48, COLORS.blue, { hollow: true, weight: 0.15 });
    return;
  }
  if (kind === 'take') {
    mark(g, 'diamond', cx, cy, size * 0.52, COLORS.ink);
    mark(g, 'diamond', cx, cy, size * 0.42, COLORS.red);
    mark(g, 'diamond', cx, cy, size * 0.2, COLORS.card);
    return;
  }
  if (kind === 'forced') {
    mark(g, 'star', r.x + size * 0.22, r.y + size * 0.22, size * 0.36, COLORS.ink);
    mark(g, 'star', r.x + size * 0.22, r.y + size * 0.22, size * 0.28, COLORS.gold);
    return;
  }
  if (kind === 'last') {
    g.save();
    g.strokeStyle = COLORS.ink;
    g.lineWidth = 3;
    g.setLineDash([6, 5]);
    g.strokeRect(r.x + 3, r.y + 3, r.w - 6, r.h - 6);
    g.restore();
    return;
  }
  if (kind === 'cursor') {
    g.save();
    g.strokeStyle = COLORS.blue;
    g.lineWidth = 4;
    roundRect(g, r.x - 4, r.y - 4, r.w + 8, r.h + 8, SIZES.radius + 3);
    g.stroke();
    g.restore();
  }
}








export function sideChip(g, r, {
  side = 0, name = '', left = 12, kings = 0, toMove = false, bot = false,
}) {
  surface(g, r, {
    fill: COLORS.card, offset: toMove ? SIZES.shadow : 0, border: SIZES.border,
  });
  const pad = 8;
  
  
  
  
  const badge = Math.min(r.h - pad * 2, 38);
  piece(g, {
    x: r.x + pad, y: r.y + (r.h - badge) / 2, w: badge, h: badge,
  }, { side, king: kings > 0 });
  const textBox = {
    x: r.x + pad * 2 + badge, y: r.y, w: r.w - pad * 3 - badge, h: r.h,
  };
  const label = `${name}${bot ? ' (bot)' : ''}: ${left}${kings ? ` (${kings}K)` : ''}`;
  text(g, label, textBox, {
    size: SIZES.min, colour: COLORS.ink, align: 'left', fit: true, maxWidth: textBox.w,
  });
  if (toMove) {
    
    
    mark(g, 'triangle', r.x + r.w - 14, r.y + r.h / 2, 14, COLORS.blue);
  }
}




















export function peopleIcon(g, r, colour = COLORS.ink) {
  const s = Math.min(r.w, r.h);
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const head = s * 0.17;
  g.save();
  g.fillStyle = colour;
  g.strokeStyle = colour;
  g.lineWidth = Math.max(1.5, s * 0.09);
  g.lineCap = 'round';
  
  
  for (const [dx, dy, scale] of [[s * 0.20, -s * 0.06, 0.82], [-s * 0.16, s * 0.04, 1]]) {
    const hx = cx + dx;
    const hy = cy + dy - s * 0.16;
    g.beginPath();
    g.arc(hx, hy, head * scale, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(hx, hy + head * scale * 2.5, head * scale * 1.85, Math.PI * 1.15, Math.PI * 1.85);
    g.stroke();
  }
  g.restore();
}
