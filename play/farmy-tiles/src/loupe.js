







































































export const SPAN = 3;
export const SPAN_DOWN = 5;


export const MAX_ZOOM = 2.4;












export const MAX_SHARE = 0.40;


export const PAD = 8;











export const CAPTION = 52;
export const CAPTION_LINES = 2;








export const REACH = 26;

const clamp = (n, low, high) => Math.max(low, Math.min(high, n));


















export function loupeFor({
  pointer, target, grid, width, height, top = 0, span = SPAN, spanDown = SPAN_DOWN,
}) {
  const gap = Math.max(1, Math.round(grid.gap * 0.6));
  
  
  
  const room = width * MAX_SHARE - PAD * 2 - gap * (span - 1);
  const cell = Math.max(grid.cell, Math.min(Math.floor(grid.cell * MAX_ZOOM), Math.floor(room / span)));
  const zoom = cell / grid.cell;

  const w = span * cell + gap * (span - 1) + PAD * 2;
  const h = spanDown * cell + gap * (spanDown - 1) + PAD * 2 + CAPTION;

  
  
  
  
  const firstCol = clamp(target.col - Math.floor(span / 2), 0, Math.max(0, grid.cols - span));
  const firstRow = clamp(target.row - Math.floor(spanDown / 2), 0, Math.max(0, grid.rows - spanDown));

  
  
  
  
  
  
  
  
  
  
  
  
  let side = 'left';
  let x = pointer.x - REACH - w;
  if (x < PAD) {
    side = 'right';
    x = pointer.x + REACH;
  }
  if (x + w > width - PAD) {
    
    
    side = pointer.x > width / 2 ? 'left' : 'right';
    x = side === 'left' ? PAD : Math.max(PAD, width - w - PAD);
  }
  x = clamp(x, PAD, Math.max(PAD, width - w - PAD));

  
  
  const y = clamp(Math.round(pointer.y - h / 2), top + PAD, Math.max(top + PAD, height - h - PAD));

  const cells = [];
  for (let r = 0; r < spanDown; r += 1) {
    for (let c = 0; c < span; c += 1) {
      const row = firstRow + r;
      const col = firstCol + c;
      if (row >= grid.rows || col >= grid.cols) continue;
      cells.push({
        row,
        col,
        x: x + PAD + c * (cell + gap),
        y: y + PAD + r * (cell + gap),
        w: cell,
        h: cell,
        target: row === target.row && col === target.col,
      });
    }
  }

  return {
    box: { x, y, w, h },
    cells,
    caption: { x: x + PAD, y: y + h - CAPTION, w: w - PAD * 2, h: (CAPTION - PAD) / CAPTION_LINES },
    side,
    zoom,
    cell,
  };
}









export function squareUnder(point, grid) {
  const step = grid.cell + grid.gap;
  const col = Math.floor((point.x - grid.x) / step);
  const row = Math.floor((point.y - grid.y) / step);
  if (row < 0 || col < 0 || row >= grid.rows || col >= grid.cols) return null;
  return { row, col };
}
