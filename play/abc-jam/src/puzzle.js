
















export const PUZZLE_SAVE_KEY = 'abcjam-puzzles-v1';

export const PUZZLES = Object.freeze([
  { id: 'unicorn', icon: 'puzzle_unicorn', letters: ['A', 'B', 'C', 'D'], cols: 2, rows: 2, friends: ['unicorn'] },
  { id: 'dino', icon: 'puzzle_dino', letters: ['E', 'F', 'G', 'H'], cols: 2, rows: 2, friends: ['dino'] },
  { id: 'princess', icon: 'puzzle_princess', letters: ['I', 'J', 'K', 'L', 'M', 'N'], cols: 3, rows: 2, friends: ['princess'] },
  { id: 'dino_family', icon: 'puzzle_dino_family', letters: ['O', 'P', 'Q', 'R', 'S', 'T'], cols: 3, rows: 2, friends: ['dino'] },
  { id: 'party', icon: 'puzzle_party', letters: ['U', 'V', 'W', 'X', 'Y', 'Z'], cols: 3, rows: 2, friends: ['princess', 'unicorn', 'dino'] },
].map((p) => Object.freeze({ ...p, letters: Object.freeze(p.letters), friends: Object.freeze(p.friends) })));

export const PUZZLE = Object.freeze(Object.fromEntries(PUZZLES.map((p) => [p.id, p])));

const norm = (ch) => String(ch ?? '').toUpperCase();



const edgeSign = (id, n) => {
  let h = 2166136261;
  for (const c of `${id}:${n}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) % 2 === 0 ? 1 : -1;
};





export function pieceEdges(p) {
  const { cols, rows, id } = p;
  const hz = (r, c) => edgeSign(id, `h${r}.${c}`); 
  const vt = (r, c) => edgeSign(id, `v${r}.${c}`); 
  const out = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out.push({
        top: r === 0 ? 0 : -vt(r - 1, c),
        right: c === cols - 1 ? 0 : hz(r, c),
        bottom: r === rows - 1 ? 0 : vt(r, c),
        left: c === 0 ? 0 : -hz(r, c - 1),
      });
    }
  }
  return out;
}


export function createPuzzle(id) {
  const p = PUZZLE[id];
  if (!p) throw new Error(`unknown puzzle: ${id}`);
  let n = 0; 
  let misses = 0; 
  return {
    puzzle: p,
    next: () => (n < p.letters.length ? p.letters[n] : null),
    placed: () => p.letters.slice(0, n),
    done: () => n === p.letters.length,
    slotXY: (slot) => ({ col: slot % p.cols, row: Math.floor(slot / p.cols) }),
    place(ch) {
      const want = n < p.letters.length ? p.letters[n] : null;
      if (want === null) return { ok: false, want, done: true, misses };
      if (norm(ch) !== want) { misses += 1; return { ok: false, want, done: false, misses }; }
      const slot = n;
      n += 1;
      misses = 0;
      return { ok: true, slot, ch: want, done: n === p.letters.length };
    },
  };
}


export const PIC_W = 96;
export const PIC_H = 64;



const KNOB = [
  [[0.40, 0.0], [0.43, 0.30], [0.38, 0.55]],
  [[0.32, 0.90], [0.42, 1.0], [0.50, 1.0]],
  [[0.58, 1.0], [0.68, 0.90], [0.62, 0.55]],
  [[0.57, 0.30], [0.60, 0.0], [0.64, 0.0]],
];
const f2 = (n) => Number(n.toFixed(2));





export function pieceShape(p, slot) {
  const cw = PIC_W / p.cols;
  const ch = PIC_H / p.rows;
  const t = 0.3 * Math.min(cw, ch); 
  const col = slot % p.cols;
  const row = Math.floor(slot / p.cols);
  const x0 = col * cw;
  const y0 = row * ch;
  const e = pieceEdges(p)[slot];
  const corners = [[x0, y0], [x0 + cw, y0], [x0 + cw, y0 + ch], [x0, y0 + ch]];
  const signs = [e.top, e.right, e.bottom, e.left];
  let d = `M${f2(x0)} ${f2(y0)}`;
  const pts = [];
  for (let i = 0; i < 4; i++) {
    const [ax, ay] = corners[i];
    const [bx, by] = corners[(i + 1) % 4];
    const s = signs[i];
    const dx = bx - ax;
    const dy = by - ay;
    const len = Math.hypot(dx, dy);
    const nx = (dy / len) * s * t; 
    const ny = (-dx / len) * s * t;
    const at = ([u, v]) => { const x = ax + dx * u + nx * v; const y = ay + dy * u + ny * v; pts.push([x, y]); return `${f2(x)} ${f2(y)}`; };
    if (s !== 0) {
      d += ` L${at([0.36, 0])}`;
      for (const seg of KNOB) d += ` C${seg.map(at).join(' ')}`;
    }
    d += ` L${at([1, 0])}`;
  }
  d += ' Z';
  const pad = t * 1.08;
  return { d, cell: { x: x0, y: y0, w: cw, h: ch }, box: { x: x0 - pad, y: y0 - pad, w: cw + 2 * pad, h: ch + 2 * pad }, tab: t, pts };
}
