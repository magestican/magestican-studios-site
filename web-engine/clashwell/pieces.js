


export const COLOURS = 4;
export const CELLS = 4;


const BOX = {
  I: [[0, 2], [1, 2], [2, 2], [3, 2]],
  O: [[1, 1], [2, 1], [1, 2], [2, 2]],
  T: [[0, 1], [1, 1], [2, 1], [1, 2]],
  S: [[0, 1], [1, 1], [1, 2], [2, 2]],
  Z: [[1, 1], [2, 1], [0, 2], [1, 2]],
  J: [[0, 1], [1, 1], [2, 1], [0, 2]],
  L: [[0, 1], [1, 1], [2, 1], [2, 2]],
};
export const SHAPES = Object.freeze(Object.keys(BOX));


const SPAN = { I: 4, O: 4, T: 3, S: 3, Z: 3, J: 3, L: 3 };


function advance(state) {
  const s = (state + 0x6D2B79F5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return { state: s, value: (t ^ (t >>> 14)) >>> 0 };
}

export const createBag = (seed) => ({ state: seed | 0, queue: [] });

function roll(bag, n) {
  const { state, value } = advance(bag.state);
  bag.state = state;
  return value % n;
}


export function nextPiece(old) {
  const bag = { state: old.state, queue: [...old.queue] };
  if (bag.queue.length === 0) {
    bag.queue = [...SHAPES];
    for (let i = bag.queue.length - 1; i > 0; i -= 1) {
      const j = roll(bag, i + 1);
      [bag.queue[i], bag.queue[j]] = [bag.queue[j], bag.queue[i]];
    }
  }
  const shape = bag.queue.shift();
  const a = 1 + roll(bag, COLOURS);
  const b = 1 + ((a - 1 + 1 + roll(bag, COLOURS - 1)) % COLOURS);
  return { piece: { shape, colours: [a, a, b, b], rot: 0, x: 3, y: 18 }, bag };
}

function turn([x, y], span, rot) {
  const m = span - 1;
  
  switch (rot & 3) {
    case 1: return [y, m - x];
    case 2: return [m - x, m - y];
    case 3: return [m - y, x];
    default: return [x, y];
  }
}


export function cellsOf(piece) {
  const span = SPAN[piece.shape];
  return BOX[piece.shape].map((cell, i) => {
    const [cx, cy] = turn(cell, span, piece.rot);
    return [piece.x + cx, piece.y + cy, piece.colours[i]];
  });
}

export const rotated = (piece, dir) => ({ ...piece, rot: (piece.rot + dir + 4) & 3 });
