


export const WIDTH = 10;
export const HEIGHT = 20;
export const HIDDEN = 2;
export const STONE = 9;

const LIGHT_STONES = [0, 1, 2, 3, 5];
const CHAIN_STONES = [0, 1, 3, 5, 8, 12];
const MIN_GROUP = 4;

const isColour = (c) => c !== 0 && c !== STONE;

export const emptyWell = () => Array.from({ length: HEIGHT + HIDDEN }, () => new Array(WIDTH).fill(0));

const copyWell = (well) => well.map((row) => [...row]);


export function fits(well, cells) {
  return cells.every(([x, y]) => x >= 0 && x < WIDTH && y >= 0 && (y >= well.length || well[y][x] === 0));
}


export function placeCells(well, cells) {
  const next = copyWell(well);
  for (const [x, y, colour] of cells) if (y < next.length) next[y][x] = colour;
  return next;
}

function clearFullRows(well, cleared) {
  let rows = 0;
  for (let y = 0; y < well.length; y += 1) {
    const row = well[y];
    if (row.every((c) => c !== 0)) {
      row.forEach((c, x) => cleared.push([x, y, c]));
      row.fill(0);
      rows += 1;
    }
  }
  return rows;
}

function popGroups(well, cleared) {
  const seen = well.map((row) => row.map(() => false));
  const doomed = [];
  for (let y = 0; y < well.length; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (seen[y][x] || !isColour(well[y][x])) continue;
      const colour = well[y][x];
      const group = [];
      const open = [[x, y]];
      seen[y][x] = true;
      while (open.length) {
        const [cx, cy] = open.pop();
        group.push([cx, cy]);
        for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]]) {
          if (ny < 0 || ny >= well.length || nx < 0 || nx >= WIDTH) continue;
          if (seen[ny][nx] || well[ny][nx] !== colour) continue;
          seen[ny][nx] = true;
          open.push([nx, ny]);
        }
      }
      if (group.length >= MIN_GROUP) doomed.push(...group);
    }
  }
  let cracked = 0;
  for (const [x, y] of doomed) {
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
      if (well[ny]?.[nx] === STONE) {
        cleared.push([nx, ny, STONE]);
        well[ny][nx] = 0;
        cracked += 1;
      }
    }
  }
  for (const [x, y] of doomed) {
    cleared.push([x, y, well[y][x]]);
    well[y][x] = 0;
  }
  return { popped: doomed.length, cracked };
}


function settle(well) {
  for (let x = 0; x < WIDTH; x += 1) {
    let floor = 0;
    for (let y = 0; y < well.length; y += 1) {
      const c = well[y][x];
      if (c === 0) continue;
      well[y][x] = 0;
      well[floor][x] = c;
      floor += 1;
    }
  }
}







export function resolveLock(start) {
  const well = copyWell(start);
  const steps = [];
  for (;;) {
    const cleared = [];
    const rows = clearFullRows(well, cleared);
    const { popped, cracked } = popGroups(well, cleared);
    if (rows === 0 && popped === 0) break;
    settle(well);
    steps.push({ rows, popped, cracked, cleared });
  }
  return { well, steps };
}


export function attackFrom(steps) {
  if (steps.length === 0) return null;
  const rows = steps.reduce((n, s) => n + s.rows, 0);
  const light = LIGHT_STONES[Math.min(rows, LIGHT_STONES.length - 1)];
  if (!steps.some((s) => s.popped > 0)) return { kind: 'light', stones: light, chain: 0, rows };
  
  const chain = steps.length;
  return { kind: 'heavy', stones: light + CHAIN_STONES[Math.min(chain, CHAIN_STONES.length - 1)], chain, rows };
}


export function addStoneRows(well, count, gapX) {
  const stone = () => Array.from({ length: WIDTH }, (_, x) => (x === gapX ? 0 : STONE));
  const rows = Array.from({ length: count }, stone);
  return [...rows, ...copyWell(well)].slice(0, well.length);
}


export const toppedOut = (well) => well.slice(HEIGHT).some((row) => row.some((c) => c !== 0));
