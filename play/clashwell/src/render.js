





import { containBox, gemPicture, stagePicture, coverCrop } from './art.js';
import { drawFx, shakeOffset, wellOffset } from './fx.js';
import {
  GEM, INK, LEMON, CLOUD, TANGERINE, STONE_EDGE, STONE_FILL, FRAME, FRAME_SHADE, FRAME_LIGHT, CANDY, WELL, WELL_LINE, ROUNDED,
} from './palette.js';
import { frameThickness } from './layout.js';
import { HEIGHT, WIDTH, STONE, fits } from '../../../web-engine/clashwell/well.js';
import { cellsOf } from '../../../web-engine/clashwell/pieces.js';
import { LIGHT_WINDUP_TICKS, HEAVY_WINDUP_TICKS, PHASE } from '../../../web-engine/clashwell/match.js';


const BAR_LIGHT = '#f2f4fa';
const BAR_DARK = '#0b0f1c';
const FONT = ROUNDED;
const GEM_ART = { 1: 'red', 2: 'blue', 3: 'green', 4: 'gold' };

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
  const picture = gemPicture(colour === STONE ? 'stone' : GEM_ART[colour] ?? GEM_ART[1]);
  if (picture) {
    const { dx, dy, dw, dh } = containBox(picture.naturalWidth, picture.naturalHeight, x + inset, y + inset, s);
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(picture, dx, dy, dw, dh);
  } else if (colour === STONE) {
    ctx.fillStyle = STONE_FILL;
    roundedCell(ctx, x + inset, y + inset, s, s * 0.12);
    ctx.fill();
    ctx.strokeStyle = STONE_EDGE;
    ctx.lineWidth = Math.max(1, size * 0.06);
    ctx.stroke();
    if (size >= 12) {
      ctx.fillStyle = 'rgba(255,255,255,0.16)';
      ctx.fillRect(x + size * 0.17, y + size * 0.14, size * 0.66, size * 0.1);
    }
  } else {
    const gem = GEM[colour] ?? GEM[1];
    ctx.fillStyle = gem.fill;
    roundedCell(ctx, x + inset, y + inset, s, s * 0.22);
    ctx.fill();
    ctx.strokeStyle = gem.edge;
    ctx.lineWidth = Math.max(1, size * 0.07);
    ctx.stroke();
    if (size >= 12) {
      
      ctx.fillStyle = 'rgba(255,255,255,0.28)';
      ctx.beginPath();
      ctx.roundRect(x + size * 0.17, y + size * 0.13, size * 0.66, size * 0.14, size * 0.07);
      ctx.fill();
    }
    if (size >= 8) drawMark(ctx, gem.mark, x, y, size);
  }
  ctx.restore();
}





function drawFrame(ctx, box, cell) {
  const t = frameThickness(cell);
  const r = Math.max(4, t * 1.6);
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineWidth = t + 2;
  ctx.strokeStyle = FRAME;
  ctx.beginPath();
  ctx.roundRect(box.x - t / 2 - 1, box.y - t / 2 - 1, box.w + t + 2, box.h + t + 2, r);
  ctx.stroke();
  ctx.lineWidth = Math.max(1.5, t - 2);
  ctx.strokeStyle = FRAME_LIGHT;
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.strokeStyle = FRAME_SHADE;
  ctx.beginPath();
  ctx.roundRect(box.x - 0.5, box.y - 0.5, box.w + 1, box.h + 1, Math.max(2, r - t));
  ctx.stroke();
  ctx.restore();
}

const cellX = (box, x) => box.x + x * box.cell;
const cellY = (box, y) => box.y + (HEIGHT - 1 - y) * box.cell;

function drawWell(ctx, box, player, live, shattered) {
  ctx.fillStyle = WELL;
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
      
      if (c && !shattered) drawGem(ctx, c, cellX(box, x), cellY(box, y), box.cell);
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
  drawFrame(ctx, box, box.cell);
  if (player.pending > 0) {
    
    const h = Math.min(HEIGHT, player.pending) * box.cell;
    ctx.fillStyle = CANDY;
    ctx.fillRect(box.x + 2, box.y + box.h - h, Math.max(3, box.cell * 0.18), h);
  }
}

function drawNext(ctx, box, player) {
  ctx.fillStyle = WELL;
  ctx.fillRect(box.x, box.y, box.w, box.h);
  drawFrame(ctx, box, box.cell);
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
  ctx.fillStyle = WELL;
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.w, box.h);
  ctx.fill();
  const scene = stagePicture();
  if (scene) {
    const { sx, sy, sw, sh } = coverCrop(scene.naturalWidth, scene.naturalHeight, box.w, box.h);
    ctx.save();
    ctx.clip();
    ctx.drawImage(scene, sx, sy, sw, sh, box.x, box.y, box.w, box.h);
    ctx.restore();
  }
  drawFrame(ctx, box, 16);
  const barH = 26;
  const pad = 10;
  let y = box.y + pad;
  for (const attack of match.attacks) {
    if (y + barH > box.y + box.h - pad) break;
    const total = attack.kind === 'heavy' ? HEAVY_WINDUP_TICKS : LIGHT_WINDUP_TICKS;
    const done = 1 - attack.left / total;
    const w = box.w - pad * 2;
    ctx.fillStyle = INK;
    ctx.fillRect(box.x + pad, y, w, barH);
    
    const closing = attack.left < 24 && Math.floor(attack.left / 4) % 2 === 0;
    const base = attack.kind === 'heavy' ? TANGERINE : LEMON;
    ctx.fillStyle = closing ? CLOUD : base;
    const fill = w * done;
    const fillX = attack.from === 0 ? box.x + pad : box.x + pad + w - fill;
    ctx.fillRect(fillX, y, fill, barH);
    ctx.fillStyle = CLOUD;
    ctx.fillRect(attack.from === 0 ? fillX + fill - 2 : fillX, y, 2, barH);
    ctx.font = `800 ${Math.min(14, box.w / 8)}px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const text = `${attack.kind === 'heavy' ? labels.heavy : labels.light} ${attack.stones}`;
    drawBarLabel(ctx, text, { x: box.x + pad, y, w, h: barH }, fillX, fill);
    y += barH + 8;
  }
}






export function drawBarLabel(ctx, text, bar, fillX, fillW) {
  const passes = [
    { x: bar.x, w: fillX - bar.x, ink: BAR_LIGHT },
    { x: fillX, w: fillW, ink: BAR_DARK },
    { x: fillX + fillW, w: bar.x + bar.w - fillX - fillW, ink: BAR_LIGHT },
  ];
  for (const { x, w, ink } of passes) {
    if (w <= 0) continue;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, bar.y, w, bar.h);
    ctx.clip();
    ctx.fillStyle = ink;
    ctx.fillText(text, bar.x + bar.w / 2, bar.y + bar.h / 2);
    ctx.restore();
  }
}


function drawPlate(ctx, x, y, text, wins, maxW) {
  const h = 28;
  const seal = 6;
  ctx.font = `800 14px ${FONT}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  const textW = ctx.measureText(text).width;
  const seals = wins === null ? 0 : 2;
  const w = Math.min(maxW, textW + 24 + (seals ? 6 + seals * (seal * 2 + 3) : 0));
  ctx.fillStyle = CLOUD;
  ctx.beginPath();
  ctx.roundRect(x + 1, y + 1, w - 2, h - 2, h / 2);
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.fillText(text, x + 12, y + h / 2 + 1, Math.max(10, w - 24 - (seals ? 6 + seals * (seal * 2 + 3) : 0)));
  for (let i = 0; i < seals; i += 1) {
    const cx = x + w - 11 - seal - (seals - 1 - i) * (seal * 2 + 3);
    ctx.beginPath();
    ctx.arc(cx, y + h / 2, seal - 0.5, 0, Math.PI * 2);
    if (i < wins) {
      ctx.fillStyle = CANDY;
      ctx.fill();
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
}

function drawHud(ctx, layout, match, labels) {
  const y = 8;
  for (const seat of [0, 1]) {
    const box = layout.wells[seat];
    
    const big = !layout.wide && box.cell >= layout.wells[1 - seat].cell;
    drawPlate(ctx, box.x, y, labels.seats[seat], Math.min(2, match.wins[seat]), big ? Math.round(box.w * 0.4) : box.w);
  }
  if (!layout.wide) return;
  const text = labels.round.replace('{n}', match.round + 1);
  ctx.font = `800 14px ${FONT}`;
  const w = ctx.measureText(text).width + 20;
  drawPlate(ctx, layout.stage.x + (layout.stage.w - w) / 2, y, text, null, layout.stage.w);
}

function drawBreather(ctx, layout, match, labels) {
  for (const box of layout.wells) {
    ctx.fillStyle = 'rgba(13,38,112,0.62)';
    ctx.fillRect(box.x, box.y, box.w, box.h);
  }
  const box = layout.wells[0].cell >= layout.wells[1].cell ? layout.wells[0] : layout.wells[1];
  ctx.fillStyle = CLOUD;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `900 ${Math.min(34, box.w / 6)}px ${FONT}`;
  ctx.fillText(labels.round.replace('{n}', match.round + 1), box.x + box.w / 2, box.y + box.h * 0.62, box.w - 16);
}


export function drawMatch(ctx, size, layout, match, fx, labels) {
  ctx.clearRect(0, 0, size.width, size.height);
  const shake = shakeOffset(fx, layout);
  ctx.save();
  ctx.translate(shake.x, shake.y);
  drawHud(ctx, layout, match, labels);
  if (layout.stage) drawStage(ctx, layout.stage, match, labels);
  for (const seat of [0, 1]) {
    const nudge = wellOffset(fx, layout, seat);
    ctx.save();
    ctx.translate(nudge.x, nudge.y);
    drawWell(ctx, layout.wells[seat], match.players[seat], match.phase === PHASE.PLAY, fx.ko === seat);
    ctx.restore();
    if (layout.nexts[seat]) drawNext(ctx, layout.nexts[seat], match.players[seat]);
  }
  if (match.phase === PHASE.BREATHER) drawBreather(ctx, layout, match, labels);
  drawFx(ctx, size, layout, fx);
  ctx.restore();
}
