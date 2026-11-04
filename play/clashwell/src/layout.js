



import { WIDTH, HEIGHT } from '../../../web-engine/clashwell/well.js';

export const GUTTER = 16;
const GAP = 12;
const HUD = 44;
const CONTROLS = 84;
const NEXT_CELLS = 3;

const wellBox = (x, y, cell) => ({ x, y, cell, w: cell * WIDTH, h: cell * HEIGHT });

function tall(width, height, mine) {
  const usable = width - GUTTER * 2 - GAP;
  
  const byWidth = Math.floor(usable / (WIDTH * 1.42));
  const byHeight = Math.floor((height - HUD - GAP) / HEIGHT);
  const cell = Math.max(10, Math.min(byWidth, byHeight));
  const rivalCell = Math.max(5, Math.floor(cell * 0.42));
  const own = wellBox(GUTTER, HUD, cell);
  const sideX = GUTTER + own.w + GAP;
  const sideW = Math.max(rivalCell * WIDTH, width - GUTTER - sideX);
  const nextCell = Math.min(Math.floor(sideW / 5), Math.floor(cell * 0.55));
  const next = { x: sideX, y: HUD, w: sideW, h: nextCell * NEXT_CELLS * 2 + 16, cell: nextCell };
  const rivalY = next.y + next.h + GAP;
  const rival = wellBox(sideX, rivalY, rivalCell);
  const stageY = rival.y + rival.h + GAP;
  const stageH = HUD + own.h - stageY;
  const stage = stageH >= 40 ? { x: sideX, y: stageY, w: sideW, h: stageH } : null;
  const wells = mine === 1 ? [rival, own] : [own, rival];
  const nexts = mine === 1 ? [null, next] : [next, null];
  
  
  return { wells, nexts, stage, height: HUD + own.h + GAP, controls: CONTROLS, wide: false, barRight: width - sideX + GAP };
}

function wide(width, height) {
  const byHeight = Math.floor((height - HUD - GAP) / HEIGHT);
  const stageMin = 220;
  const nextW = 92;
  const byWidth = Math.floor((width - GUTTER * 2 - stageMin - (nextW + GAP) * 2 - GAP * 2) / (WIDTH * 2));
  const cell = Math.max(10, Math.min(byHeight, byWidth, 36));
  const wellW = cell * WIDTH;
  const total = wellW * 2 + (nextW + GAP) * 2 + GAP * 2;
  const stageW = Math.min(Math.max(stageMin, width - GUTTER * 2 - total), 420);
  const left = Math.max(GUTTER, Math.floor((width - total - stageW) / 2));
  const nextH = Math.floor(nextW / 4) * NEXT_CELLS * 2 + 16;
  const next0 = { x: left, y: HUD, w: nextW, h: nextH, cell: Math.floor(nextW / 5) };
  const well0 = wellBox(left + nextW + GAP, HUD, cell);
  const stage = { x: well0.x + wellW + GAP, y: HUD, w: stageW, h: well0.h };
  const well1 = wellBox(stage.x + stageW + GAP, HUD, cell);
  const next1 = { x: well1.x + wellW + GAP, y: HUD, w: nextW, h: nextH, cell: Math.floor(nextW / 5) };
  return { wells: [well0, well1], nexts: [next0, next1], stage, height: HUD + well0.h + GAP, controls: 0, wide: true, barRight: GUTTER };
}


export function layoutMatch(width, height, { touch = false, mine = 0 } = {}) {
  const usable = touch ? height - CONTROLS : height;
  return width >= 900 ? { ...wide(width, usable), controls: touch ? CONTROLS : 0 } : tall(width, usable, mine);
}
