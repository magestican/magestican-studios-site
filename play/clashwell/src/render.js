





import { HEIGHT, WIDTH, STONE, fits } from '../../../web-engine/clashwell/well.js';
import { cellsOf } from '../../../web-engine/clashwell/pieces.js';
import { LIGHT_WINDUP_TICKS, HEAVY_WINDUP_TICKS, PHASE } from '../../../web-engine/clashwell/match.js';

const GEM = {
  1: { fill: '#e5484d', edge: '#7a1216', mark: 'circle' },
  2: { fill: '#3b82f6', edge: '#10306e', mark: 'diamond' },
  3: { fill: '#30b56b', edge: '#0b5230', mark: 'bar' },
  4: { fill: '#f5b73d', edge: '#7a4f05', mark: 'cross' },
};
const INK = '#f2f4fa';
const DIM = '#9aa6c0';
const WELL_BG = '#141a2c';
const WELL_LINE = '#2a3350';

function drawMark(ctx, mark, x, y, size) {
  const m = size / 2;
  const r = size * 0.2;
  ctx.fillStyle = 'rgba(255,255,255,0.78)';
  ctx.strokeStyle = 'rgba(255,255,255,0.78)';
  ctx.lineWidth = Math.max(1.5, size * 0.11);
  ctx.beginPath();
  if (mark === 'circle') {
    ctx.arc(x + m, y + m, r, 0, Math.PI * 2);
    ctx.fill();
  } else if (mark === 'diamond') {
    ctx.moveTo(x + m, y + m - r * 1.3);
    ctx.lineTo(x + m + r * 1.3, y + m);
    ctx.lineTo(x + m, y + m + r * 1.3);
    ctx.lineTo(x + m - r * 1.3, y + m);
    ctx.closePath();
    ctx.fill();
  } else if (mark === 'bar') {
    ctx.moveTo(x + m - r * 1.3, y + m);
    ctx.lineTo(x + m + r * 1.3, y + m);
    ctx.stroke();
  } else {
    ctx.moveTo(x + m - r, y + m - r);
    ctx.lineTo(x + m + r, y + m + r);
    ctx.moveTo(x + m + r, y + m - r);
    ctx.lineTo(x + m - r, y + m + r);
    ctx.stroke();
  }
}

function roundedCell(ctx, x, y, size, radius) {
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
}

function drawGem(ctx, colour, x, y, size, alpha = 1) {
  const inset = Math.max(0.5, size * 0.05);
  const s = size - inset * 2;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (colour === STONE) {
    ctx.fillStyle = '#59627c';
    roundedCell(ctx, x + inset, y + inset, s, s * 0.12);
    ctx.fill();
    ctx.strokeStyle = '#2b3147';
    ctx.lineWidth = Math.max(1, size * 0.06);
    ctx.stroke();
  } else {
    const gem = GEM[colour] ?? GEM[1];
    ctx.fillStyle = gem.fill;
    roundedCell(ctx, x + inset, y + inset, s, s * 0.22);
    ctx.fill();
    ctx.strokeStyle = gem.edge;
    ctx.lineWidth = Math.max(1, size * 0.07);
    ctx.stroke();
    if (size >= 8) drawMark(ctx, gem.mark, x, y, size);
  }
  ctx.restore();
}

const cellX = (box, x) => box.x + x * box.cell;
const cellY = (box, y) => box.y + (HEIGHT - 1 - y) * box.cell;

function drawWell(ctx, box, player, live) {
  ctx.fillStyle = WELL_BG;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = WELL_LINE;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 1; x < WIDTH; x += 1) {
    ctx.moveTo(cellX(box, x) + 0.5, box.y);
    ctx.lineTo(cellX(box, x) + 0.5, box.y + box.h);
  }
  for (let y = 1; y < HEIGHT; y += 1) {
    ctx.moveTo(box.x, box.y + y * box.cell + 0.5);
    ctx.lineTo(box.x + box.w, box.y + y * box.cell + 0.5);
  }
  ctx.stroke();
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const c = player.well[y][x];
      if (c) drawGem(ctx, c, cellX(box, x), cellY(box, y), box.cell);
    }
  }
  if (live && player.piece) {
    let drop = 0;
    const cells = cellsOf(player.piece);
    while (fits(player.well, cells.map(([x, y]) => [x, y - drop - 1]))) drop += 1;
    for (const [x, y, c] of cells) {
      if (y - drop < HEIGHT) drawGem(ctx, c, cellX(box, x), cellY(box, y - drop), box.cell, 0.22);
    }
    for (const [x, y, c] of cells) {
      if (y < HEIGHT) drawGem(ctx, c, cellX(box, x), cellY(box, y), box.cell);
    }
  }
  ctx.strokeStyle = '#4a5680';
  ctx.lineWidth = 2;
  ctx.strokeRect(box.x - 1, box.y - 1, box.w + 2, box.h + 2);
  if (player.pending > 0) {
    
    const h = Math.min(HEIGHT, player.pending) * box.cell;
    ctx.fillStyle = '#ff5c5c';
    ctx.fillRect(box.x + 2, box.y + box.h - h, Math.max(3, box.cell * 0.18), h);
  }
}

function drawNext(ctx, box, player) {
  ctx.fillStyle = WELL_BG;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  ctx.strokeStyle = WELL_LINE;
  ctx.lineWidth = 1;
  ctx.strokeRect(box.x + 0.5, box.y + 0.5, box.w - 1, box.h - 1);
  const pieces = player.nextPieces.slice(0, 2);
  const rowH = (box.h - 16) / 2;
  pieces.forEach((piece, i) => {
    const cells = cellsOf({ ...piece, x: 0, y: 0, rot: 0 });
    const xs = cells.map((c) => c[0]);
    const ys = cells.map((c) => c[1]);
    const [minX, maxX, minY, maxY] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const cell = Math.min(box.cell, Math.floor((rowH - 4) / (maxY - minY + 1)));
    const left = box.x + (box.w - (maxX - minX + 1) * cell) / 2;
    const top = box.y + 8 + i * rowH + (rowH - (maxY - minY + 1) * cell) / 2;
    for (const [x, y, c] of cells) drawGem(ctx, c, left + (x - minX) * cell, top + (maxY - y) * cell, cell);
  });
}


function drawStage(ctx, box, match, labels) {
  ctx.fillStyle = '#1a2138';
  ctx.beginPath();
  ctx.roundRect(box.x, box.y, box.w, box.h, 8);
  ctx.fill();
  const barH = 26;
  const pad = 10;
  let y = box.y + pad;
  for (const attack of match.attacks) {
    if (y + barH > box.y + box.h - pad) break;
    const total = attack.kind === 'heavy' ? HEAVY_WINDUP_TICKS : LIGHT_WINDUP_TICKS;
    const done = 1 - attack.left / total;
    const w = box.w - pad * 2;
    ctx.fillStyle = '#2a3350';
    ctx.fillRect(box.x + pad, y, w, barH);
    ctx.fillStyle = attack.kind === 'heavy' ? '#f5803d' : '#f5c93d';
    const fill = w * done;
    ctx.fillRect(attack.from === 0 ? box.x + pad : box.x + pad + w - fill, y, fill, barH);
    ctx.fillStyle = '#0b0f1c';
    ctx.font = `700 ${Math.min(14, box.w / 8)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = done > 0.5 ? '#0b0f1c' : INK;
    ctx.fillText(`${attack.kind === 'heavy' ? labels.heavy : labels.light} ${attack.stones}`, box.x + box.w / 2, y + barH / 2);
    y += barH + 8;
  }
}

function drawHud(ctx, width, layout, match, labels) {
  ctx.textBaseline = 'middle';
  ctx.font = '600 14px system-ui, sans-serif';
  const y = 22;
  for (const seat of [0, 1]) {
    const box = layout.wells[seat];
    const pips = '●'.repeat(match.wins[seat]) + '○'.repeat(Math.max(0, 2 - match.wins[seat]));
    ctx.textAlign = 'left';
    ctx.fillStyle = INK;
    const label = `${labels.seats[seat]}  ${pips}`;
    ctx.fillText(label, box.x, y, box.w);
  }
  ctx.textAlign = 'right';
  ctx.fillStyle = DIM;
  if (!layout.wide) return;
  ctx.textAlign = 'center';
  ctx.fillText(labels.round.replace('{n}', match.round + 1), layout.stage.x + layout.stage.w / 2, y);
}

function drawEffects(ctx, layout, effects) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const effect of effects) {
    const box = effect.seat === null ? (layout.stage ?? layout.wells[0]) : layout.wells[effect.seat];
    const life = effect.left / effect.total;
    ctx.save();
    ctx.globalAlpha = Math.min(1, life * 2);
    const size = effect.big ? Math.min(44, box.w / 4.5) : Math.min(26, box.w / 6);
    ctx.font = `800 ${size}px system-ui, sans-serif`;
    ctx.lineWidth = Math.max(3, size / 7);
    ctx.strokeStyle = '#0b0f1c';
    ctx.fillStyle = effect.colour ?? INK;
    const y = box.y + box.h * 0.32 - (1 - life) * 24;
    ctx.strokeText(effect.text, box.x + box.w / 2, y, box.w);
    ctx.fillText(effect.text, box.x + box.w / 2, y, box.w);
    ctx.restore();
  }
}

function drawBreather(ctx, layout, match, labels) {
  for (const box of layout.wells) {
    ctx.fillStyle = 'rgba(11,15,28,0.6)';
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }
  const box = layout.wells[0].cell >= layout.wells[1].cell ? layout.wells[0] : layout.wells[1];
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${Math.min(34, box.w / 6)}px system-ui, sans-serif`;
  ctx.fillText(labels.round.replace('{n}', match.round + 1), box.x + box.w / 2, box.y + box.h * 0.45, box.w - 16);
}


export function drawMatch(ctx, size, layout, match, effects, labels) {
  ctx.clearRect(0, 0, size.width, size.height);
  drawHud(ctx, size.width, layout, match, labels);
  for (const seat of [0, 1]) {
    drawWell(ctx, layout.wells[seat], match.players[seat], match.phase === PHASE.PLAY);
    if (layout.nexts[seat]) drawNext(ctx, layout.nexts[seat], match.players[seat]);
  }
  if (layout.stage) drawStage(ctx, layout.stage, match, labels);
  if (match.phase === PHASE.BREATHER) drawBreather(ctx, layout, match, labels);
  drawEffects(ctx, layout, effects);
}
