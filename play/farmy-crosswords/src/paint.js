





















import { COLORS, SIZES, FONT_STACK, STATES } from '../../../web-engine/words/style.js';


export function roundRect(g, x, y, w, h, r = SIZES.radius) {
  const rad = Math.min(r, w / 2, h / 2);
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
} = {}) {
  
  
  
  
  
  
  
  let s = Math.max(SIZES.min, size);
  let shown = string;
  if (fit) {
    const limit = maxWidth ?? box.w ?? box.width;
    g.font = font(s, weight);
    while (s > SIZES.min && g.measureText(shown).width > limit) {
      s -= 1;
      g.font = font(s, weight);
    }
    
    
    
    
    
    if (g.measureText(shown).width > limit) {
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
    text(g, letter, { x: r.x, y: r.y + press, w: r.w, h: r.h }, {
      size: size ?? Math.round(r.h * 0.52),
      colour: inkOn,
      fit: true,
      maxWidth: r.w - 12,
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
    size, colour: on, fit: true, maxWidth: r.w - 16,
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
