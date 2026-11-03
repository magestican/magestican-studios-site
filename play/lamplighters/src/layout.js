







export const MIN_FONT_PX = 11;
const MAX_FONT_PX = 22;
export const PAGE_GUTTER_PX = 16;
const MAX_CELL_PX = 72;

export const AIM_BELOW_PX = 26;

const CREWS_BESIDE_FROM_PX = 900;
const CREW_PANEL_PX = 200;
const CREW_GAP_PX = 24;






const PHONE_CHROME_PX = 254;
const DESK_CHROME_PX = 184;

export const BOARD_SLAB_PX = 6;

const DIGIT_EM = 0.62;
const NUMBER_GAP_EM = 0.45;
const LINE_EM = 1.2;
const CLUE_PAD_PX = 8;

const digits = (n) => String(n).length;


export function clueRowWidth(rowClues, fontPx) {
  let widest = 0;
  for (const clue of rowClues) {
    const nums = clue.length ? clue : [0];
    const em = nums.reduce((sum, n) => sum + digits(n) * DIGIT_EM, 0) + (nums.length - 1) * NUMBER_GAP_EM;
    widest = Math.max(widest, em);
  }
  return Math.ceil(widest * fontPx) + CLUE_PAD_PX;
}


export function clueColHeight(colClues, fontPx) {
  const tallest = colClues.reduce((most, clue) => Math.max(most, Math.max(clue.length, 1)), 0);
  return Math.ceil(tallest * LINE_EM * fontPx) + CLUE_PAD_PX;
}


export function availableBoard(viewW, viewH) {
  const crewsBeside = viewW >= CREWS_BESIDE_FROM_PX;
  const sides = crewsBeside ? 2 * (CREW_PANEL_PX + CREW_GAP_PX) : 0;
  return {
    crewsBeside,
    width: Math.max(0, viewW - 2 * PAGE_GUTTER_PX - sides - 2 * BOARD_SLAB_PX),
    height: Math.max(0, viewH - (crewsBeside ? DESK_CHROME_PX : PHONE_CHROME_PX) - 2 * BOARD_SLAB_PX),
  };
}


const CUT_ROW_PX = 56;

const BLOCK_MAX_ASPECT = 1.4;






export const BLOCK_HINT_ROW_PX = 42;


export function layoutBlock(viewW, viewH) {
  const area = availableBoard(viewW, viewH);
  const height = Math.max(0, area.height - CUT_ROW_PX - (area.crewsBeside ? 0 : BLOCK_HINT_ROW_PX));
  return { crewsBeside: area.crewsBeside, height, width: Math.min(area.width, Math.round(height * BLOCK_MAX_ASPECT)) };
}


export function layoutBoard({ rows, cols, rowClues, colClues }, width, height) {
  let chosen = null;
  for (let fontPx = MAX_FONT_PX; fontPx >= MIN_FONT_PX; fontPx -= 1) {
    const gutterW = clueRowWidth(rowClues, fontPx);
    const gutterH = clueColHeight(colClues, fontPx);
    const cell = Math.min(
      MAX_CELL_PX,
      Math.max(1, Math.floor(Math.min((width - gutterW) / cols, (height - gutterH) / rows))),
    );
    chosen = { fontPx, gutterW, gutterH, cell };
    
    if (fontPx * LINE_EM <= cell + 1) break;
  }
  const { fontPx, gutterW, gutterH, cell } = chosen;
  return {
    fontPx,
    gutterW,
    gutterH,
    cell,
    aim: cell < AIM_BELOW_PX,
    totalWidth: gutterW + cell * cols,
    totalHeight: gutterH + cell * rows,
  };
}
