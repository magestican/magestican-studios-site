



























































import { COLORS, SIZES, FONT_STACK } from '../../../web-engine/words/style.js';
import {
  PAWN, KNIGHT, BISHOP, ROOK, QUEEN, KING, kindOf, sideOf, WHITE,
} from '../../../web-engine/chess/position.js';


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


export function scrim(g, width, height, alpha = 0.8) {
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
    size, colour: on, fit: true, maxWidth: r.w - (String(label).length <= 1 ? 6 : 16),
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














export function square(g, r, { dark = false }) {
  g.fillStyle = dark ? COLORS.slate : COLORS.card;
  g.fillRect(r.x, r.y, r.w, r.h);
}









export function boardFrame(g, r) {
  g.save();
  g.lineWidth = SIZES.border;
  g.strokeStyle = COLORS.ink;
  g.strokeRect(
    r.x - SIZES.border / 2, r.y - SIZES.border / 2,
    r.w + SIZES.border, r.h + SIZES.border,
  );
  g.restore();
}














export function coordinate(g, r, label, { dark = false, at = 'top' } = {}) {
  const s = Math.max(11, Math.round(r.h * 0.24));
  
  
  
  
  
  const y = at === 'bottom' ? r.y + r.h - s - 3 : r.y + 2;
  const x = at === 'bottom' ? r.x + r.w - 3 : r.x + 3;
  text(g, label, { x: at === 'bottom' ? x - 20 : x, y, w: 20, h: s + 2 }, {
    size: s,
    floor: 11,
    weight: 700,
    align: at === 'bottom' ? 'right' : 'left',
    baseline: 'top',
    colour: dark ? COLORS.card : COLORS.slate,
  });
}









export function highlight(g, r, kind, { dark = false } = {}) {
  
  
  
  
  
  
  
  
  
  
  
  
  
  const edge = dark ? COLORS.card : COLORS.ink;
  g.save();
  if (kind === 'selected') {
    
    
    
    const t = Math.max(4, r.w * 0.1);
    g.lineWidth = t + 4;
    g.strokeStyle = edge;
    g.strokeRect(r.x + (t + 4) / 2, r.y + (t + 4) / 2, r.w - t - 4, r.h - t - 4);
    g.lineWidth = t;
    g.strokeStyle = COLORS.blue;
    g.strokeRect(r.x + t / 2, r.y + t / 2, r.w - t, r.h - t);
  } else if (kind === 'move') {
    
    g.beginPath();
    g.arc(r.x + r.w / 2, r.y + r.h / 2, r.w * 0.17, 0, Math.PI * 2);
    g.fillStyle = COLORS.green;
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = edge;
    g.stroke();
  } else if (kind === 'capture') {
    
    
    
    const t = Math.max(4, r.w * 0.11);
    g.beginPath();
    g.arc(r.x + r.w / 2, r.y + r.h / 2, r.w * 0.42, 0, Math.PI * 2);
    g.lineWidth = t + 4;
    g.strokeStyle = edge;
    g.stroke();
    g.lineWidth = t;
    g.strokeStyle = COLORS.red;
    g.stroke();
  } else if (kind === 'last') {
    
    
    
    
    const s = Math.max(6, r.w * 0.2);
    g.fillStyle = COLORS.gold;
    g.strokeStyle = edge;
    g.lineWidth = 2;
    for (const [cx, cy, dx, dy] of [
      [r.x, r.y, 1, 1], [r.x + r.w, r.y, -1, 1],
      [r.x, r.y + r.h, 1, -1], [r.x + r.w, r.y + r.h, -1, -1],
    ]) {
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + dx * s, cy);
      g.lineTo(cx, cy + dy * s);
      g.closePath();
      g.fill();
      g.stroke();
    }
  } else if (kind === 'check') {
    
    
    
    const t = Math.max(4, r.w * 0.12);
    const pad = r.w * 0.14;
    const path = () => {
      g.beginPath();
      g.moveTo(r.x + pad, r.y + pad);
      g.lineTo(r.x + r.w - pad, r.y + r.h - pad);
      g.moveTo(r.x + r.w - pad, r.y + pad);
      g.lineTo(r.x + pad, r.y + r.h - pad);
    };
    g.lineWidth = t + 4;
    g.strokeStyle = edge;
    path();
    g.stroke();
    g.lineWidth = t;
    g.strokeStyle = COLORS.red;
    path();
    g.stroke();
  } else if (kind === 'cursor') {
    
    
    
    g.lineWidth = 3;
    g.strokeStyle = edge;
    g.setLineDash([6, 4]);
    g.strokeRect(r.x + 1.5, r.y + 1.5, r.w - 3, r.h - 3);
  }
  g.restore();
}

























function drawPiece(g, r, kind, white, lineOverride = null) {
  const body = white ? COLORS.card : COLORS.ink;
  const line = lineOverride ?? (white ? COLORS.ink : COLORS.card);
  const x = r.x;
  const y = r.y;
  const w = r.w;
  const h = r.h;
  const px = (u) => x + w * u;
  const py = (u) => y + h * u;
  const stroke = Math.max(2, w * 0.055);

  g.save();
  g.lineWidth = stroke;
  g.lineJoin = 'round';
  g.lineCap = 'round';
  g.fillStyle = body;
  g.strokeStyle = line;

  const fillStroke = () => { g.fill(); g.stroke(); };

  
  const base = () => {
    g.beginPath();
    g.moveTo(px(0.16), py(0.90));
    g.lineTo(px(0.84), py(0.90));
    g.lineTo(px(0.74), py(0.78));
    g.lineTo(px(0.26), py(0.78));
    g.closePath();
    fillStroke();
  };

  if (kind === PAWN) {
    g.beginPath();
    g.moveTo(px(0.30), py(0.78));
    g.quadraticCurveTo(px(0.34), py(0.56), px(0.42), py(0.48));
    g.lineTo(px(0.58), py(0.48));
    g.quadraticCurveTo(px(0.66), py(0.56), px(0.70), py(0.78));
    g.closePath();
    fillStroke();
    g.beginPath();
    g.arc(px(0.5), py(0.36), w * 0.15, 0, Math.PI * 2);
    fillStroke();
    base();
  } else if (kind === ROOK) {
    g.beginPath();
    g.moveTo(px(0.30), py(0.78));
    g.lineTo(px(0.33), py(0.40));
    g.lineTo(px(0.67), py(0.40));
    g.lineTo(px(0.70), py(0.78));
    g.closePath();
    fillStroke();
    
    g.beginPath();
    g.moveTo(px(0.24), py(0.40));
    g.lineTo(px(0.24), py(0.20));
    g.lineTo(px(0.36), py(0.20));
    g.lineTo(px(0.36), py(0.29));
    g.lineTo(px(0.44), py(0.29));
    g.lineTo(px(0.44), py(0.20));
    g.lineTo(px(0.56), py(0.20));
    g.lineTo(px(0.56), py(0.29));
    g.lineTo(px(0.64), py(0.29));
    g.lineTo(px(0.64), py(0.20));
    g.lineTo(px(0.76), py(0.20));
    g.lineTo(px(0.76), py(0.40));
    g.closePath();
    fillStroke();
    base();
  } else if (kind === BISHOP) {
    g.beginPath();
    g.moveTo(px(0.30), py(0.78));
    g.quadraticCurveTo(px(0.32), py(0.52), px(0.50), py(0.40));
    g.quadraticCurveTo(px(0.68), py(0.52), px(0.70), py(0.78));
    g.closePath();
    fillStroke();
    
    
    g.beginPath();
    g.moveTo(px(0.50), py(0.12));
    g.quadraticCurveTo(px(0.72), py(0.30), px(0.50), py(0.44));
    g.quadraticCurveTo(px(0.28), py(0.30), px(0.50), py(0.12));
    g.closePath();
    fillStroke();
    g.beginPath();
    g.moveTo(px(0.50), py(0.20));
    g.lineTo(px(0.62), py(0.32));
    g.stroke();
    base();
  } else if (kind === KNIGHT) {
    
    
    
    g.beginPath();
    g.moveTo(px(0.28), py(0.78));
    g.lineTo(px(0.26), py(0.56));
    g.lineTo(px(0.16), py(0.46));
    g.lineTo(px(0.24), py(0.40));
    g.lineTo(px(0.30), py(0.44));
    g.lineTo(px(0.38), py(0.26));
    g.lineTo(px(0.44), py(0.12));
    g.lineTo(px(0.52), py(0.22));
    g.lineTo(px(0.60), py(0.12));
    g.lineTo(px(0.68), py(0.26));
    g.lineTo(px(0.76), py(0.50));
    g.lineTo(px(0.74), py(0.78));
    g.closePath();
    fillStroke();
    
    g.beginPath();
    g.arc(px(0.40), py(0.38), Math.max(2.5, w * 0.07), 0, Math.PI * 2);
    g.fillStyle = line;
    g.fill();
    g.fillStyle = body;
    base();
  } else if (kind === QUEEN) {
    g.beginPath();
    g.moveTo(px(0.28), py(0.78));
    g.lineTo(px(0.34), py(0.42));
    g.lineTo(px(0.66), py(0.42));
    g.lineTo(px(0.72), py(0.78));
    g.closePath();
    fillStroke();
    
    
    
    g.beginPath();
    g.moveTo(px(0.24), py(0.42));
    g.lineTo(px(0.18), py(0.16));
    g.lineTo(px(0.34), py(0.32));
    g.lineTo(px(0.50), py(0.12));
    g.lineTo(px(0.66), py(0.32));
    g.lineTo(px(0.82), py(0.16));
    g.lineTo(px(0.76), py(0.42));
    g.closePath();
    fillStroke();
    for (const u of [0.18, 0.50, 0.82]) {
      g.beginPath();
      g.arc(px(u), py(u === 0.5 ? 0.10 : 0.14), w * 0.055, 0, Math.PI * 2);
      fillStroke();
    }
    base();
  } else if (kind === KING) {
    
    
    
    
    
    
    
    
    
    
    
    
    g.beginPath();
    g.moveTo(px(0.28), py(0.78));
    g.lineTo(px(0.34), py(0.48));
    g.lineTo(px(0.66), py(0.48));
    g.lineTo(px(0.72), py(0.78));
    g.closePath();
    fillStroke();
    g.beginPath();
    g.rect(px(0.24), py(0.36), w * 0.52, h * 0.13);
    fillStroke();
    
    
    
    const t = w * 0.14;
    const cx = px(0.5);
    g.beginPath();
    g.moveTo(cx - t / 2, py(0.04));
    g.lineTo(cx + t / 2, py(0.04));
    g.lineTo(cx + t / 2, py(0.13));
    g.lineTo(cx + t * 1.4, py(0.13));
    g.lineTo(cx + t * 1.4, py(0.23));
    g.lineTo(cx + t / 2, py(0.23));
    g.lineTo(cx + t / 2, py(0.36));
    g.lineTo(cx - t / 2, py(0.36));
    g.lineTo(cx - t / 2, py(0.23));
    g.lineTo(cx - t * 1.4, py(0.23));
    g.lineTo(cx - t * 1.4, py(0.13));
    g.lineTo(cx - t / 2, py(0.13));
    g.closePath();
    fillStroke();
  }
  g.restore();
}









export function piece(g, r, code, { lift = 0, alpha = 1, ghost = false, outline = null } = {}) {
  if (!code) return;
  const white = sideOf(code) === WHITE;
  const kind = kindOf(code);
  const inset = r.w * 0.06;
  const box = {
    x: r.x + inset,
    y: r.y + inset - lift,
    w: r.w - inset * 2,
    h: r.h - inset * 2,
  };
  g.save();
  g.globalAlpha = ghost ? 0.4 : alpha;
  if (lift > 0) {
    g.save();
    g.globalAlpha = 0.25;
    g.fillStyle = COLORS.ink;
    g.beginPath();
    g.ellipse(r.x + r.w / 2, r.y + r.h * 0.86, r.w * 0.3, r.h * 0.09, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }
  drawPiece(g, box, kind, white, outline);
  g.restore();
}








export function chip(g, r, code) {
  
  
  piece(g, r, code, { outline: COLORS.ink });
}


export function seatPlate(g, r, {
  name = '', white = true, turn = false, bot = false, hover = 0,
}) {
  surface(g, r, {
    fill: turn ? COLORS.blue : COLORS.card,
    offset: Math.max(0, (turn ? SIZES.shadow : 2) + hover),
  });
  const swatch = { x: r.x + 8, y: r.y + (r.h - 28) / 2, w: 28, h: 28 };
  
  
  
  chip(g, { ...swatch, w: 28, h: 28 }, white ? PAWN : -PAWN);
  text(g, `${name}${bot ? ' (bot)' : ''}`, {
    x: r.x + 44, y: r.y, w: r.w - 52, h: r.h,
  }, {
    size: SIZES.min,
    colour: turn ? COLORS.card : COLORS.ink,
    align: 'left',
    fit: true,
    maxWidth: r.w - 52,
  });
}










export function thinkingBar(g, r, share) {
  surface(g, r, { fill: COLORS.card, offset: 0, border: 2, radius: r.h / 2 });
  const w = Math.max(0, Math.min(1, share)) * (r.w - 6);
  g.save();
  g.fillStyle = COLORS.blue;
  roundRect(g, r.x + 3, r.y + 3, Math.max(4, w), r.h - 6, (r.h - 6) / 2);
  g.fill();
  g.restore();
}
