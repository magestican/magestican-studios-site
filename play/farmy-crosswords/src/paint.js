





















import { COLORS, SIZES, FONT_STACK, STATES } from '../../../web-engine/words/style.js';
















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
  
  
  
  
  
  
  
  let s = Math.max(SIZES.min, size);
  let shown = string;
  if (fit) {
    const limit = maxWidth ?? box.w ?? box.width;
    g.font = font(s, weight);
    while (s > floor && g.measureText(shown).width > limit) {
      s -= 1;
      g.font = font(s, weight);
    }
    
    
    
    
    
    
    if (g.measureText(shown).width > limit) {
      
      
      
      
      
      
      
      
      if (shown.length <= 1) {
        while (s > 10 && g.measureText(shown).width > limit) {
          s -= 1;
          g.font = font(s, weight);
        }
      } else {
        while (shown.length > 1 && g.measureText(`${shown}…`).width > limit) {
          shown = shown.slice(0, -1);
        }
        shown = `${shown.trimEnd()}…`;
      }
    }
  }
  g.font = font(s, weight);
  g.fillStyle = colour;
  g.textAlign = align;
  g.textBaseline = baseline;
  const w = box.w ?? box.width;
  const h = box.h ?? box.height;
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











export function tile(g, r, {
  letter = '', state = null, lift = 0, press = 0, scaleX = 1,
  size = null, fill = null, dim = false, cursor = false,
  
  
  
  colour = null,
  
  
  
  floor = SIZES.min,
} = {}) {
  const s = state ? STATES[state] : null;
  const face = fill ?? (s ? COLORS[s.fill] : COLORS.card);
  const inkOn = s ? COLORS[s.on] : COLORS.ink;
  const offset = Math.max(0, SIZES.shadow + lift - press);

  g.save();
  if (scaleX !== 1) {
    const cx = r.x + r.w / 2;
    g.translate(cx, 0);
    g.scale(Math.max(0.02, scaleX), 1);
    g.translate(-cx, 0);
  }
  if (dim) g.globalAlpha = 0.55;
  surface(g, r, { fill: face, offset, dy: press });
  if (letter) {
    
    
    
    
    
    
    
    
    const word = String(letter).length > 1;
    const forMark = s && word ? 30 : 0;
    text(g, letter, { x: r.x, y: r.y + press, w: r.w - forMark, h: r.h }, {
      size: size ?? Math.round(r.h * 0.52),
      colour: colour ?? inkOn,
      fit: true,
      floor,
      maxWidth: r.w - forMark - (word ? 12 : 6),
    });
  }
  if (s) {
    
    
    text(g, s.mark, { x: r.x + r.w - 22, y: r.y + press + 1, w: 18, h: 20 }, {
      size: SIZES.min, colour: inkOn,
    });
  }
  g.restore();
  if (cursor) focusRing(g, { ...r, y: r.y + press });
}









export function focusRing(g, r, colour = COLORS.blue) {
  g.save();
  g.lineWidth = 4;
  g.strokeStyle = colour;
  roundRect(g, r.x - 5, r.y - 5, r.w + 10, r.h + 10, SIZES.radius + 4);
  g.stroke();
  g.restore();
}











export function ribbon(g, points, { width = 22, colour = COLORS.blue, alpha = 0.35 } = {}) {
  if (points.length === 0) return;
  g.save();
  g.globalAlpha = alpha;
  g.strokeStyle = colour;
  g.fillStyle = colour;
  g.lineWidth = width;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  if (points.length === 1) {
    g.beginPath();
    g.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2);
    g.fill();
  } else {
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (const p of points.slice(1)) g.lineTo(p.x, p.y);
    g.stroke();
  }
  g.restore();
}





export function button(g, r, {
  label = '', hover = 0, press = 0, disabled = false, tone = null, size = SIZES.base,
  glow = 0,
} = {}) {
  const fill = tone ? COLORS[tone] : COLORS.card;
  const on = tone ? COLORS.card : (disabled ? COLORS.slate : COLORS.ink);
  
  
  
  
  
  
  
  
  
  
  
  
  if (glow > 0 && !disabled) {
    const spread = 6 + glow * 10;
    g.save();
    g.globalAlpha = 0.16 + glow * 0.2;
    g.fillStyle = fill;
    roundRect(g, r.x - spread, r.y - spread, r.w + spread * 2, r.h + spread * 2,
      SIZES.radius + spread);
    g.fill();
    g.restore();
  }
  surface(g, r, {
    fill,
    offset: disabled ? 0 : Math.max(0, SIZES.shadow + hover - press),
    dy: press,
    alpha: disabled ? 0.6 : 1,
  });
  text(g, label, { x: r.x, y: r.y + press, w: r.w, h: r.h }, {
    
    
    size, colour: on, fit: true, maxWidth: r.w - (String(label).length <= 1 ? 6 : 16),
  });
}


export function clear(g, width, height) {
  g.fillStyle = COLORS.paper;
  g.fillRect(0, 0, width, height);
}


export function scrim(g, width, height, alpha = 0.72) {
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















export function emblem(g, id, r) {
  
  
  
  const side = Math.min(r.w, r.h);
  const unit = side / 3.4;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const cell = (x, y, w, h, fill) => {
    surface(g, { x, y, w, h }, { fill, offset: 0, border: 2, radius: 3 });
  };

  if (id === 'wordle') {
    
    
    const w = unit;
    const gap = 5;
    const left = cx - (w * 1.5 + gap);
    for (const [i, fill] of [COLORS.green, COLORS.gold, COLORS.card].entries()) {
      cell(left + i * (w + gap), cy - w / 2, w, w, fill);
    }
    return;
  }
  if (id === 'bee') {
    
    
    const w = unit * 0.8;
    const gap = 4;
    const step = w + gap;
    cell(cx - step / 2 - w / 2, cy - step - w / 2, w, w, COLORS.card);
    cell(cx + step / 2 - w / 2, cy - step - w / 2, w, w, COLORS.card);
    cell(cx - step - w / 2, cy - w / 2, w, w, COLORS.card);
    cell(cx - w / 2, cy - w / 2, w, w, COLORS.gold);
    cell(cx + step - w / 2, cy - w / 2, w, w, COLORS.card);
    cell(cx - step / 2 - w / 2, cy + step - w / 2, w, w, COLORS.card);
    cell(cx + step / 2 - w / 2, cy + step - w / 2, w, w, COLORS.card);
    return;
  }
  if (id === 'connections') {
    
    const w = unit;
    const gap = 5;
    const fills = [COLORS.green, COLORS.gold, COLORS.blue, COLORS.red];
    for (let i = 0; i < 4; i += 1) {
      cell(cx - w - gap / 2 + (i % 2) * (w + gap),
        cy - w - gap / 2 + Math.floor(i / 2) * (w + gap), w, w, fills[i]);
    }
    return;
  }
  
  const w = unit * 0.78;
  const step = w + 4;
  const path = [[0, 0], [1, 1], [2, 1], [2, 2]];
  const ox = cx - (step * 3 - 4) / 2;
  const oy = cy - (step * 3 - 4) / 2;
  g.save();
  g.globalAlpha = 0.35;
  g.strokeStyle = COLORS.blue;
  g.lineWidth = w * 0.7;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.beginPath();
  path.forEach(([px, py], i) => {
    const x = ox + px * step + w / 2;
    const y = oy + py * step + w / 2;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  });
  g.stroke();
  g.restore();
  for (let y = 0; y < 3; y += 1) {
    for (let x = 0; x < 3; x += 1) {
      const on = path.some(([px, py]) => px === x && py === y);
      cell(ox + x * step, oy + y * step, w, w, on ? COLORS.ink : COLORS.card);
    }
  }
}

















export function boardEmblem(g, id, r) {
  const side = Math.min(r.w, r.h);
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const cell = (x, y, w, h, fill) => surface(g, { x, y, w, h }, {
    fill, offset: 0, border: Math.max(1, Math.round(side / 18)), radius: 2,
  });

  if (id === 'chess') {
    
    
    const w = side / 2.2;
    const ox = cx - w;
    const oy = cy - w;
    for (let y = 0; y < 2; y += 1) {
      for (let x = 0; x < 2; x += 1) {
        cell(ox + x * w, oy + y * w, w, w, (x + y) % 2 ? COLORS.ink : COLORS.card);
      }
    }
    return;
  }

  if (id === 'ludo') {
    
    
    const w = side * 0.86;
    cell(cx - w / 2, cy - w / 2, w, w, COLORS.card);
    const off = w * 0.22;
    const dot = Math.max(1.6, w * 0.11);
    g.save();
    g.fillStyle = COLORS.ink;
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      g.beginPath();
      g.arc(cx + dx * off, cy + dy * off, dot, 0, Math.PI * 2);
      g.fill();
    }
    g.restore();
    return;
  }

  if (id === 'scrabble') {
    
    
    
    
    const w = side * 0.42;
    const step = w * 0.78;
    for (let i = 0; i < 3; i += 1) {
      const x = cx - step - w / 2 + i * step;
      cell(x, cy - w / 2 + (i === 1 ? -w * 0.16 : 0), w, w, COLORS.wood);
    }
    return;
  }

  if (id === 'checkers') {
    
    
    
    
    
    
    
    
    
    
    const rad = side * 0.28;
    const lift = side * 0.13;
    g.save();
    g.lineWidth = Math.max(1.5, side / 14);
    for (const [dx, dy, fill] of [[-rad * 0.45, lift, COLORS.ink],
                                  [rad * 0.45, -lift, COLORS.card]]) {
      g.beginPath();
      g.arc(cx + dx, cy + dy, rad, 0, Math.PI * 2);
      g.fillStyle = fill;
      g.fill();
      g.strokeStyle = COLORS.ink;
      g.stroke();
    }
    g.restore();
  }
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




















export function keyGlyph(g, r, kind, colour = COLORS.ink) {
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  
  
  const s = Math.max(13, Math.min(20, Math.min(r.w, r.h) * 0.42));

  g.save();
  g.strokeStyle = colour;
  g.fillStyle = colour;
  g.lineWidth = Math.max(2, s * 0.16);
  g.lineJoin = 'round';
  g.lineCap = 'round';

  if (kind === 'enter') {
    
    const x0 = cx - s * 0.85;
    const x1 = cx + s * 0.8;
    const yTop = cy - s * 0.65;
    const yBot = cy + s * 0.45;
    g.beginPath();
    g.moveTo(x1, yTop);
    g.lineTo(x1, yBot);
    g.lineTo(x0, yBot);
    g.stroke();
    g.beginPath();
    g.moveTo(x0, yBot);
    g.lineTo(x0 + s * 0.5, yBot - s * 0.42);
    g.lineTo(x0 + s * 0.5, yBot + s * 0.42);
    g.closePath();
    g.fill();
  } else {
    
    const w = s * 1.7;
    const h = s * 1.15;
    const left = cx - w * 0.62;
    const right = cx + w * 0.38;
    g.beginPath();
    g.moveTo(left, cy);
    g.lineTo(left + h * 0.6, cy - h / 2);
    g.lineTo(right, cy - h / 2);
    g.lineTo(right, cy + h / 2);
    g.lineTo(left + h * 0.6, cy + h / 2);
    g.closePath();
    g.stroke();
    const k = h * 0.22;
    const mx = (left + h * 0.6 + right) / 2 + k * 0.2;
    g.beginPath();
    g.moveTo(mx - k, cy - k);
    g.lineTo(mx + k, cy + k);
    g.moveTo(mx + k, cy - k);
    g.lineTo(mx - k, cy + k);
    g.stroke();
  }
  g.restore();
}
























export function playerFace(g, r, { colour = COLORS.blue, seat = 0, ink = COLORS.ink } = {}) {
  const side = Math.min(r.w, r.h);
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const rad = side * 0.42;
  const line = Math.max(1, side / 16);
  const kind = ((Number(seat) % 4) + 4) % 4;

  g.save();
  g.lineWidth = line;
  g.strokeStyle = ink;
  g.lineJoin = 'round';
  g.lineCap = 'round';

  
  
  if (kind === 1) {                       
    for (const s of [-1, 1]) {
      g.beginPath();
      g.arc(cx + s * rad * 0.92, cy, rad * 0.34, 0, Math.PI * 2);
      g.fillStyle = colour; g.fill(); g.stroke();
    }
  } else if (kind === 2) {                
    g.beginPath();
    g.moveTo(cx - rad * 1.25, cy - rad * 0.52);
    g.lineTo(cx + rad * 0.2, cy - rad * 0.52);
    g.lineTo(cx + rad * 0.2, cy - rad * 0.86);
    g.lineTo(cx - rad * 0.5, cy - rad * 1.02);
    g.closePath();
    g.fillStyle = colour; g.fill(); g.stroke();
  } else if (kind === 0) {                
    g.beginPath();
    g.moveTo(cx - rad * 0.28, cy - rad * 0.82);
    g.quadraticCurveTo(cx - rad * 0.1, cy - rad * 1.5, cx + rad * 0.34, cy - rad * 0.9);
    g.closePath();
    g.fillStyle = colour; g.fill(); g.stroke();
  }

  g.beginPath();
  g.arc(cx, cy, rad, 0, Math.PI * 2);
  g.fillStyle = colour;
  g.fill();
  g.stroke();

  if (kind === 3) {                       
    g.beginPath();
    g.arc(cx - rad * 0.36, cy - rad * 0.08, rad * 0.3, 0, Math.PI * 2);
    g.arc(cx + rad * 0.36, cy - rad * 0.08, rad * 0.3, 0, Math.PI * 2);
    g.moveTo(cx - rad * 0.06, cy - rad * 0.08);
    g.lineTo(cx + rad * 0.06, cy - rad * 0.08);
    g.stroke();
  }

  
  
  
  const eye = Math.max(1, rad * 0.14);
  g.fillStyle = ink;
  for (const s of [-1, 1]) {
    g.beginPath();
    g.arc(cx + s * rad * 0.36, cy - rad * 0.1, eye, 0, Math.PI * 2);
    g.fill();
  }
  g.beginPath();
  g.arc(cx, cy + rad * 0.12, rad * 0.42, 0.25 * Math.PI, 0.75 * Math.PI);
  g.stroke();
  g.restore();
}















export function cheerLetter(g, ch, { x, y, size, scale = 1, colour = COLORS.ink, alpha = 1 }) {
  g.save();
  g.globalAlpha = alpha;
  g.font = font(size, 800);
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.translate(x, y);
  g.scale(scale, scale);
  
  
  
  
  
  
  
  
  
  
  
  g.lineJoin = 'round';
  g.lineWidth = Math.max(3, size * 0.16);
  g.strokeStyle = COLORS.ink;
  g.strokeText(ch, 0, 0);
  g.fillStyle = colour;
  g.fillText(ch, 0, 0);
  g.restore();
}


export function sparkle(g, { x, y, size, colour = COLORS.gold, alpha = 1 }) {
  g.save();
  g.globalAlpha = alpha;
  g.fillStyle = colour;
  g.fillRect(x - size / 2, y - size / 2, size, size);
  g.restore();
}







