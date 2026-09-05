







































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









export const PREMIUMS = {
  T: { colour: 'red', shape: 'star', short: 'TW', name: 'triple word' },
  D: { colour: 'gold', shape: 'circle', short: 'DW', name: 'double word' },
  t: { colour: 'blue', shape: 'triangle', short: 'TL', name: 'triple letter' },
  d: { colour: 'green', shape: 'diamond', short: 'DL', name: 'double letter' },
  '*': { colour: 'gold', shape: 'star', short: '', name: 'the star' },
};


export function mark(g, kind, cx, cy, size, colour) {
  const r = size / 2;
  g.save();
  g.fillStyle = colour;
  g.strokeStyle = colour;
  g.lineWidth = Math.max(1.5, size * 0.14);
  g.beginPath();
  if (kind === 'circle') {
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.fill();
  } else if (kind === 'diamond') {
    g.moveTo(cx, cy - r);
    g.lineTo(cx + r, cy);
    g.lineTo(cx, cy + r);
    g.lineTo(cx - r, cy);
    g.closePath();
    g.fill();
  } else if (kind === 'triangle') {
    g.moveTo(cx, cy - r);
    g.lineTo(cx + r, cy + r * 0.8);
    g.lineTo(cx - r, cy + r * 0.8);
    g.closePath();
    g.fill();
  } else {
    
    
    
    for (let i = 0; i < 10; i += 1) {
      const radius = i % 2 === 0 ? r : r * 0.45;
      const angle = (Math.PI / 5) * i - Math.PI / 2;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      if (i === 0) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
    g.fill();
  }
  g.restore();
}







export function square(g, r, {
  premium = '.', tile = null, pending = false, fresh = false, cursor = false,
  cursorAxis = null, dim = false,
} = {}) {
  const border = r.w >= 30 ? 2 : 1;
  if (!tile) {
    const p = PREMIUMS[premium];
    const fill = p ? COLORS[p.colour] : COLORS.card;
    surface(g, r, { fill, offset: 0, border, radius: Math.min(SIZES.radius, r.w / 4) });
    if (p) {
      
      
      
      const room = r.w >= 40 && p.short;
      if (room) {
        text(g, p.short, r, { size: Math.min(SIZES.min, r.w * 0.4), colour: COLORS.card, floor: 12, fit: true, maxWidth: r.w - 4 });
      } else {
        mark(g, p.shape, r.x + r.w / 2, r.y + r.h / 2, Math.max(8, r.w * 0.44), COLORS.card);
      }
    }
  } else {
    
    
    
    
    
    
    
    
    const radius = Math.min(SIZES.radius, r.w / 4);
    if (pending) {
      surface(g, r, {
        fill: COLORS.gold, offset: Math.min(3, r.w * 0.1), border, radius, alpha: dim ? 0.75 : 1,
      });
    } else {
      surface(g, r, { fill: COLORS.card, offset: 0, border, radius, alpha: dim ? 0.75 : 1 });
      woodFace(g, { x: r.x + border, y: r.y + border, w: r.w - border * 2, h: r.h - border * 2 },
        { radius: Math.max(0, radius - border), alpha: dim ? 0.75 : 1 });
    }
    letter(g, r, tile.letter, {
      value: tile.blank ? null : tile.value,
      colour: pending ? COLORS.card : COLORS.ink,
    });
    if (fresh) {
      
      
      g.save();
      g.lineWidth = 2;
      g.strokeStyle = COLORS.blue;
      roundRect(g, r.x + 2, r.y + 2, r.w - 4, r.h - 4, Math.min(SIZES.radius, r.w / 4));
      g.stroke();
      g.restore();
    }
  }
  if (cursor) cursorRing(g, r, cursorAxis);
}
































export function woodFace(g, r, { radius = SIZES.radius, alpha = 1 } = {}) {
  g.save();
  g.globalAlpha = alpha;

  g.fillStyle = COLORS.wood;
  roundRect(g, r.x, r.y, r.w, r.h, radius);
  g.fill();

  
  g.clip();
  const inset = Math.max(1.5, r.w * 0.055);
  g.lineWidth = inset;
  g.lineCap = 'butt';

  g.strokeStyle = COLORS.woodLit;
  g.beginPath();
  g.moveTo(r.x, r.y + r.h);
  g.lineTo(r.x, r.y);
  g.lineTo(r.x + r.w, r.y);
  g.stroke();

  g.strokeStyle = COLORS.woodShade;
  g.beginPath();
  g.moveTo(r.x + r.w, r.y);
  g.lineTo(r.x + r.w, r.y + r.h);
  g.lineTo(r.x, r.y + r.h);
  g.stroke();

  
  
  
  
  if (r.w >= 30) {
    g.globalAlpha = alpha * 0.32;
    g.strokeStyle = COLORS.woodShade;
    g.lineWidth = 1;
    
    
    for (const at of [0.22, 0.37, 0.68, 0.81]) {
      const y = Math.round(r.y + r.h * at) + 0.5;
      g.beginPath();
      g.moveTo(r.x + r.w * 0.08, y);
      g.lineTo(r.x + r.w * 0.92, y);
      g.stroke();
    }
  }
  g.restore();
}









export function letter(g, r, ch, { value = null, colour = COLORS.ink } = {}) {
  
  
  
  
  
  const room = value !== null && value !== undefined && r.w >= 26;
  text(g, ch, r, {
    size: Math.round(r.h * (room ? 0.56 : 0.66)),
    colour,
    fit: true,
    floor: 12,
    maxWidth: r.w - 4,
  });
  if (room) {
    text(g, String(value), { x: r.x + r.w - 14, y: r.y + r.h - 14, w: 12, h: 12 }, {
      size: Math.max(9, Math.round(r.h * 0.26)),
      weight: 700,
      colour,
      floor: 9,
    });
  }
}








export function rackTile(g, r, {
  ch = '', value = null, lift = 0, press = 0, chosen = false, marked = false, blank = false,
} = {}) {
  const offset = Math.max(0, SIZES.shadow + lift - press);
  surface(g, r, {
    fill: chosen ? COLORS.blue : COLORS.card,
    offset,
    dy: press,
    radius: SIZES.radius,
  });
  
  
  
  
  if (!chosen) {
    woodFace(g, { x: r.x + 2, y: r.y + press + 2, w: r.w - 4, h: r.h - 4 },
      { radius: Math.max(0, SIZES.radius - 2) });
  }
  const on = chosen ? COLORS.card : COLORS.ink;
  const box = { x: r.x, y: r.y + press, w: r.w, h: r.h };
  if (blank && !ch) {
    
    
    
    mark(g, 'circle', box.x + box.w / 2, box.y + box.h / 2, box.w * 0.3, on);
  } else {
    letter(g, box, ch, { value, colour: on });
  }
  if (marked) {
    
    
    g.save();
    g.lineWidth = 4;
    g.strokeStyle = COLORS.red;
    roundRect(g, box.x + 2, box.y + 2, box.w - 4, box.h - 4, SIZES.radius);
    g.stroke();
    g.restore();
  }
}










export function cursorRing(g, r, axis = 'across') {
  g.save();
  g.lineWidth = 4;
  g.strokeStyle = COLORS.blue;
  roundRect(g, r.x - 4, r.y - 4, r.w + 8, r.h + 8, SIZES.radius + 3);
  g.stroke();
  g.fillStyle = COLORS.blue;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const s = Math.max(5, r.w * 0.22);
  g.beginPath();
  if (axis === 'down') {
    g.moveTo(cx - s, r.y + r.h + 6);
    g.lineTo(cx + s, r.y + r.h + 6);
    g.lineTo(cx, r.y + r.h + 6 + s);
  } else {
    g.moveTo(r.x + r.w + 6, cy - s);
    g.lineTo(r.x + r.w + 6, cy + s);
    g.lineTo(r.x + r.w + 6 + s, cy);
  }
  g.closePath();
  g.fill();
  g.restore();
}


export function focusRing(g, r, colour = COLORS.blue) {
  g.save();
  g.lineWidth = 4;
  g.strokeStyle = colour;
  roundRect(g, r.x - 5, r.y - 5, r.w + 10, r.h + 10, SIZES.radius + 4);
  g.stroke();
  g.restore();
}














export function button(g, r, {
  label = '', hover = 0, press = 0, disabled = false, tone = null, size = SIZES.base,
  pad = 16,
} = {}) {
  const fill = tone ? COLORS[tone] : COLORS.card;
  const on = tone ? COLORS.card : (disabled ? COLORS.slate : COLORS.ink);
  surface(g, r, {
    fill,
    offset: disabled ? 0 : Math.max(0, SIZES.shadow + hover - press),
    dy: press,
    alpha: disabled ? 0.6 : 1,
  });
  text(g, label, { x: r.x, y: r.y + press, w: r.w, h: r.h }, {
    size, colour: on, fit: true, maxWidth: r.w - (String(label).length <= 1 ? 6 : pad),
  });
}



























export function keyGlyph(g, r, kind, { colour = COLORS.ink } = {}) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const s = Math.max(12, Math.min(19, Math.min(r.w, r.h) * 0.44));
  const pen = Math.max(2.5, s * 0.17);

  g.save();
  g.strokeStyle = colour;
  g.fillStyle = colour;
  g.lineWidth = pen;
  g.lineJoin = 'round';
  g.lineCap = 'round';

  if (kind === 'enter') {
    
    
    
    const right = cx + s * 0.72;
    const left = cx - s * 0.62;
    const top = cy - s * 0.72;
    const base = cy + s * 0.4;
    const head = s * 0.46;
    g.beginPath();
    g.moveTo(right, top);
    g.lineTo(right, base);
    
    g.lineTo(left + head * 0.8, base);
    g.stroke();
    g.beginPath();
    g.moveTo(left, base);
    g.lineTo(left + head, base - head);
    g.lineTo(left + head, base + head);
    g.closePath();
    g.fill();
  } else {
    
    const h = s * 1.12;
    const nose = cx - s * 1.0;
    const tail = cx + s * 0.72;
    const shoulder = nose + h * 0.58;
    g.beginPath();
    g.moveTo(nose, cy);
    g.lineTo(shoulder, cy - h / 2);
    g.lineTo(tail, cy - h / 2);
    g.lineTo(tail, cy + h / 2);
    g.lineTo(shoulder, cy + h / 2);
    g.closePath();
    g.stroke();
    const k = h * 0.21;
    const mx = (shoulder + tail) / 2 + k * 0.3;
    g.beginPath();
    g.moveTo(mx - k, cy - k);
    g.lineTo(mx + k, cy + k);
    g.moveTo(mx + k, cy - k);
    g.lineTo(mx - k, cy + k);
    g.stroke();
  }
  g.restore();
}


export function clear(g, width, height) {
  g.fillStyle = COLORS.paper;
  g.fillRect(0, 0, width, height);
}


export function scrim(g, width, height, alpha = 0.78) {
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














export function loupeFrame(g, box, { at, side = 'left' }) {
  surface(g, box, { fill: COLORS.card, offset: SIZES.shadow, border: SIZES.border });
  if (!at) return;
  g.save();
  g.fillStyle = COLORS.ink;
  
  const edge = side === 'left' ? box.x + box.w : box.x;
  const dir = side === 'left' ? 1 : -1;
  const cy = Math.max(box.y + 14, Math.min(box.y + box.h - 14, at.y));
  g.beginPath();
  g.moveTo(edge, cy - 9);
  g.lineTo(edge, cy + 9);
  g.lineTo(edge + dir * 12, cy);
  g.closePath();
  g.fill();
  g.restore();
}








export function chip(g, r, { initials = '', colour = 'blue', you = false, bot = false }) {
  
  
  
  
  
  
  
  surface(g, r, {
    fill: COLORS[colour] ?? COLORS.blue,
    offset: 0,
    border: 2,
    radius: bot ? 3 : r.h / 2,
  });
  text(g, initials, r, { size: SIZES.min, colour: COLORS.card, fit: true, maxWidth: r.w - 6, floor: 12 });
  if (you) focusRing(g, r, COLORS.ink);
}
