





























import { COLORS, FONT_STACK, SIZES, STATES } from '../../../web-engine/words/style.js';
import {
  GRID, YARD, boardLayout, boxPx, cellRect, homeCell, homeRun, isSafe,
  RING, entryIndex, yardBox, yardSlots,
} from '../../../web-engine/board/ludoBoard.js';
import { TEAMS } from '../../../web-engine/board/ludoTeams.js';

const ink = (key) => COLORS[key] ?? key;


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
  align = 'center', baseline = 'middle', fit = false, maxWidth = null, floor = SIZES.min,
} = {}) {
  let s = Math.max(SIZES.min, size);
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
    if (g.measureText(shown).width > limit) {
      
      
      
      
      if (shown.length <= 1) {
        while (s > 10 && g.measureText(shown).width > limit) { s -= 1; g.font = font(s, weight); }
      } else {
        while (shown.length > 1 && g.measureText(`${shown}…`).width > limit) shown = shown.slice(0, -1);
        shown = `${shown.trimEnd()}…`;
      }
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










export function wrap(g, string, maxWidth, { size = SIZES.small, weight = 400 } = {}) {
  g.font = font(Math.max(SIZES.min, size), weight);
  const out = [];
  let line = '';
  for (const word of String(string ?? '').split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && g.measureText(next).width > maxWidth) { out.push(line); line = word; } else line = next;
  }
  if (line) out.push(line);
  return out;
}


export function surface(g, r, {
  fill = COLORS.card, edge = COLORS.ink, offset = SIZES.shadow,
  border = SIZES.border, radius = SIZES.radius, dx = 0, dy = 0, alpha = 1,
} = {}) {
  const x = r.x + dx;
  const y = r.y + dy;
  g.save();
  g.globalAlpha = alpha;
  if (offset > 0) {
    g.fillStyle = COLORS.ink;
    roundRect(g, x + offset, y + offset, r.w, r.h, radius);
    g.fill();
  }
  g.fillStyle = fill;
  roundRect(g, x, y, r.w, r.h, radius);
  g.fill();
  if (border > 0) {
    g.lineWidth = border;
    g.strokeStyle = edge;
    roundRect(g, x + border / 2, y + border / 2, r.w - border, r.h - border, radius);
    g.stroke();
  }
  g.restore();
}


export function focusRing(g, r, colour = COLORS.blue, grow = 5) {
  g.save();
  g.lineWidth = 4;
  g.strokeStyle = colour;
  roundRect(g, r.x - grow, r.y - grow, r.w + grow * 2, r.h + grow * 2, SIZES.radius + grow);
  g.stroke();
  g.restore();
}


export function button(g, r, {
  label = '', hover = 0, press = 0, disabled = false, tone = null, size = SIZES.base,
} = {}) {
  const fill = tone ? ink(tone) : COLORS.card;
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














export function shapePath(g, shape, cx, cy, r) {
  g.beginPath();
  if (shape === 'circle') {
    g.arc(cx, cy, r, 0, Math.PI * 2);
  } else if (shape === 'square') {
    
    
    const s = r * 0.86;
    g.rect(cx - s, cy - s, s * 2, s * 2);
  } else if (shape === 'diamond') {
    g.moveTo(cx, cy - r);
    g.lineTo(cx + r, cy);
    g.lineTo(cx, cy + r);
    g.lineTo(cx - r, cy);
  } else {
    
    
    const k = r * 1.12;
    g.moveTo(cx, cy - k + r * 0.16);
    g.lineTo(cx + k * 0.92, cy + k * 0.72 + r * 0.16);
    g.lineTo(cx - k * 0.92, cy + k * 0.72 + r * 0.16);
  }
  g.closePath();
}








export function token(g, spot, {
  lift = 0, legal = false, chosen = false, dim = false, moving = false,
} = {}) {
  const team = TEAMS[spot.team];
  const r = spot.r;
  const drop = Math.max(0, 3 + lift);
  g.save();
  if (dim) g.globalAlpha = 0.4;
  g.fillStyle = COLORS.ink;
  shapePath(g, team.shape, spot.x + drop * 0.7, spot.y + drop, r);
  g.fill();
  g.fillStyle = ink(team.colour);
  shapePath(g, team.shape, spot.x, spot.y, r);
  g.fill();
  g.lineWidth = Math.max(2, r * 0.16);
  g.strokeStyle = COLORS.ink;
  shapePath(g, team.shape, spot.x, spot.y, r);
  g.stroke();
  g.restore();

  
  
  
  if (r >= 15 && !dim) {
    text(g, String(spot.token + 1), { x: spot.x - r, y: spot.y - r + (team.shape === 'triangle' ? r * 0.35 : 0), w: r * 2, h: r * 2 }, {
      size: SIZES.min, colour: COLORS.card,
    });
  }

  
  
  
  
  if (legal || chosen) {
    g.save();
    g.lineWidth = chosen ? 5 : 4;
    g.strokeStyle = COLORS.blue;
    if (!chosen && !moving) g.setLineDash([Math.max(4, r * 0.5), Math.max(3, r * 0.35)]);
    g.beginPath();
    g.arc(spot.x, spot.y, r + 6, 0, Math.PI * 2);
    g.stroke();
    g.restore();
  }
}


export function ghost(g, shape, x, y, r) {
  g.save();
  g.globalAlpha = 0.9;
  g.lineWidth = 3;
  g.strokeStyle = COLORS.blue;
  g.setLineDash([6, 5]);
  shapePath(g, shape, x, y, r);
  g.stroke();
  g.restore();
}






function star(g, cx, cy, r, colour = COLORS.ink) {
  g.save();
  g.fillStyle = colour;
  g.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const rad = i % 2 ? r * 0.44 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
  }
  g.closePath();
  g.fill();
  g.restore();
}










export function board(g, box, { tokens = null } = {}) {
  const L = boardLayout(box);

  
  surface(g, { x: L.x - 6, y: L.y - 6, w: L.size + 12, h: L.size + 12 },
    { fill: COLORS.card, offset: SIZES.shadow + 2, radius: 10 });

  
  
  
  for (let t = 0; t < TEAMS.length; t += 1) {
    const team = TEAMS[t];
    const pen4 = yardBox(t);
    
    
    const box6 = boxPx(L, { x: pen4.x - 1, y: pen4.y - 1, w: pen4.w + 2, h: pen4.h + 2 });
    surface(g, { x: box6.x, y: box6.y, w: box6.w, h: box6.h },
      { fill: ink(team.colour), offset: 0, radius: 8 });
    const pen = boxPx(L, pen4);
    surface(g, { x: pen.x, y: pen.y, w: pen.w, h: pen.h },
      { fill: COLORS.card, offset: 0, radius: 8 });
    
    
    
    
    
    yardSlots(t).forEach((slot, i) => {
      
      
      
      if (tokens && tokens[t][i] <= YARD) return;
      const p = { x: L.x + slot.x * L.cell, y: L.y + slot.y * L.cell };
      g.save();
      g.lineWidth = 2;
      g.strokeStyle = COLORS.slate;
      g.setLineDash([5, 4]);
      g.beginPath();
      g.arc(p.x, p.y, L.cell * 0.3, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    });
    
    
    
    const band = { x: box6.x, y: box6.y, w: box6.w, h: L.cell };
    text(g, team.name.toUpperCase(), band,
      { size: Math.max(SIZES.min, L.cell * 0.5), colour: COLORS.card, fit: true, maxWidth: box6.w - 12 });
  }

  
  for (let i = 0; i < RING.length; i += 1) {
    const r = cellRect(L, RING[i]);
    const owner = TEAMS.findIndex((unused, t) => entryIndex(t) === i);
    surface(g, { x: r.x, y: r.y, w: r.w, h: r.h }, {
      fill: owner >= 0 ? ink(TEAMS[owner].colour) : COLORS.card,
      offset: 0,
      border: 2,
      radius: 4,
    });
    if (isSafe(i)) {
      
      
      star(g, r.x + r.w / 2, r.y + r.h / 2, r.w * 0.28,
        owner >= 0 ? COLORS.card : COLORS.slate);
    }
  }

  
  
  for (let t = 0; t < TEAMS.length; t += 1) {
    for (const c of homeRun(t)) {
      const r = cellRect(L, c);
      surface(g, { x: r.x, y: r.y, w: r.w, h: r.h },
        { fill: ink(TEAMS[t].colour), offset: 0, border: 2, radius: 4 });
      text(g, STATES[TEAMS[t].state].mark, { x: r.x, y: r.y, w: r.w, h: r.h },
        { size: SIZES.min, colour: COLORS.card });
    }
  }

  
  
  const mid = { x: L.x + 7.5 * L.cell, y: L.y + 7.5 * L.cell };
  const half = 1.5 * L.cell;
  const corners = [
    [{ x: -half, y: half }, { x: half, y: half }],      
    [{ x: -half, y: -half }, { x: -half, y: half }],    
    [{ x: -half, y: -half }, { x: half, y: -half }],    
    [{ x: half, y: -half }, { x: half, y: half }],      
  ];
  corners.forEach(([a, b], t) => {
    g.save();
    g.beginPath();
    g.moveTo(mid.x, mid.y);
    g.lineTo(mid.x + a.x, mid.y + a.y);
    g.lineTo(mid.x + b.x, mid.y + b.y);
    g.closePath();
    g.fillStyle = ink(TEAMS[t].colour);
    g.fill();
    g.lineWidth = 3;
    g.strokeStyle = COLORS.ink;
    g.stroke();
    g.restore();
    const home = cellRect(L, homeCell(t));
    text(g, STATES[TEAMS[t].state].mark, home, { size: SIZES.min, colour: COLORS.card });
  });

  
  g.save();
  g.lineWidth = SIZES.border;
  g.strokeStyle = COLORS.ink;
  roundRect(g, L.x - 6, L.y - 6, L.size + 12, L.size + 12, 10);
  g.stroke();
  g.restore();
  return L;
}





const PIPS = {
  1: [[0.5, 0.5]],
  2: [[0.28, 0.28], [0.72, 0.72]],
  3: [[0.26, 0.26], [0.5, 0.5], [0.74, 0.74]],
  4: [[0.28, 0.28], [0.72, 0.28], [0.28, 0.72], [0.72, 0.72]],
  5: [[0.26, 0.26], [0.74, 0.26], [0.5, 0.5], [0.26, 0.74], [0.74, 0.74]],
  6: [[0.28, 0.24], [0.72, 0.24], [0.28, 0.5], [0.72, 0.5], [0.28, 0.76], [0.72, 0.76]],
};














export function die(g, r, { face = null, tumble = 1, hover = 0, press = 0, hint = null } = {}) {
  const shown = face === null ? null
    : (tumble >= 1 ? face : ((Math.floor(tumble * 24) * 5 + 1) % 6) + 1);
  surface(g, r, {
    fill: COLORS.card,
    offset: Math.max(0, SIZES.shadow + hover - press),
    dy: press,
    radius: 10,
  });
  if (shown === null) {
    text(g, hint ?? 'ROLL', { x: r.x, y: r.y + press, w: r.w, h: r.h },
      { size: SIZES.h2, colour: COLORS.ink, fit: true, maxWidth: r.w - 14 });
    return;
  }
  const pip = Math.max(4, r.w * 0.1);
  g.save();
  g.fillStyle = COLORS.ink;
  for (const [px, py] of PIPS[shown]) {
    g.beginPath();
    g.arc(r.x + px * r.w, r.y + press + py * r.h, pip, 0, Math.PI * 2);
    g.fill();
  }
  g.restore();
}








export function seat(g, r, {
  team, who, done = 0, total = 4, active = false, finished = false, compact = false,
}) {
  const t = TEAMS[team];
  surface(g, r, {
    fill: active ? COLORS.card : COLORS.paper,
    offset: active ? SIZES.shadow : 0,
    border: SIZES.border,
    edge: active ? COLORS.blue : COLORS.ink,
  });
  const pad = compact ? 8 : 12;
  const size = Math.min(r.h * 0.32, compact ? 15 : 18);
  shapePath(g, t.shape, r.x + pad + size, r.y + r.h / 2, size);
  g.fillStyle = ink(t.colour);
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = COLORS.ink;
  shapePath(g, t.shape, r.x + pad + size, r.y + r.h / 2, size);
  g.stroke();

  const left = r.x + pad + size * 2 + (compact ? 8 : 12);
  const width = r.w - (left - r.x) - pad;

  
  
  
  
  
  
  
  if (compact) {
    text(g, `${active ? '▸ ' : ''}${t.name}`, { x: left, y: r.y + 5, w: width - 44, h: r.h / 2 - 4 },
      { size: SIZES.min, colour: COLORS.ink, align: 'left', fit: true, maxWidth: width - 44 });
    text(g, finished ? 'HOME' : `${done}/${total}`,
      { x: left, y: r.y + 5, w: width, h: r.h / 2 - 4 },
      { size: SIZES.min, weight: 400, colour: COLORS.inkSoft, align: 'right', fit: true, maxWidth: 44 });
    text(g, who, { x: left, y: r.y + r.h / 2 - 2, w: width, h: r.h / 2 },
      { size: SIZES.min, weight: 400, colour: active ? COLORS.blue : COLORS.inkSoft, align: 'left', fit: true, maxWidth: width });
    return;
  }
  text(g, `${t.name}: ${who}`,
    { x: left, y: r.y + 6, w: width, h: r.h / 2 - 4 },
    { size: SIZES.min, colour: COLORS.ink, align: 'left', fit: true, maxWidth: width });
  const tail = finished ? 'FINISHED' : `${done} of ${total} home${active ? ' - to play' : ''}`;
  text(g, tail, { x: left, y: r.y + r.h / 2 - 2, w: width, h: r.h / 2 },
    { size: SIZES.min, weight: 400, colour: active ? COLORS.blue : COLORS.inkSoft, align: 'left', fit: true, maxWidth: width });
}


export const BOARD_CELLS = GRID;
