










































export const GRID = 15;


export const TRACK = 52;


export const TEAM_COUNT = 4;
export const TOKENS = 4;


export const ENTRY_STEP = TRACK / TEAM_COUNT;
















export const YARD = -1;
export const LAP = 51;
export const HOME_RUN = 5;
export const HOME = LAP + HOME_RUN;   








const ARC = [
  { x: 6, y: 13 }, { x: 6, y: 12 }, { x: 6, y: 11 }, { x: 6, y: 10 }, { x: 6, y: 9 },
  { x: 5, y: 8 }, { x: 4, y: 8 }, { x: 3, y: 8 }, { x: 2, y: 8 }, { x: 1, y: 8 }, { x: 0, y: 8 },
  { x: 0, y: 7 },
  { x: 0, y: 6 },
];


export function rotateCell({ x, y }, times = 1) {
  let c = { x, y };
  for (let i = 0; i < ((times % 4) + 4) % 4; i += 1) c = { x: GRID - 1 - c.y, y: c.x };
  return c;
}


export function rotatePoint({ x, y }, times = 1) {
  let p = { x, y };
  for (let i = 0; i < ((times % 4) + 4) % 4; i += 1) p = { x: GRID - p.y, y: p.x };
  return p;
}






export const RING = Array.from({ length: TRACK }, (unused, i) => (
  rotateCell(ARC[i % ARC.length], Math.floor(i / ARC.length))
));


export const entryIndex = (t) => t * ENTRY_STEP;








export const SAFE = Object.freeze(
  Array.from({ length: TEAM_COUNT }, (unused, t) => [entryIndex(t), (entryIndex(t) + 8) % TRACK]).flat(),
);

export const isSafe = (square) => SAFE.includes(square);








export function homeRun(t) {
  const base = [13, 12, 11, 10, 9].map((y) => ({ x: 7, y }));
  return base.map((c) => rotateCell(c, t));
}


export const homeCell = (t) => rotateCell({ x: 7, y: 8 }, t);





export function cellFor(team, progress) {
  if (progress <= YARD || progress >= HOME) return null;
  if (progress < LAP) return RING[(entryIndex(team) + progress) % TRACK];
  return homeRun(team)[progress - LAP];
}










export function squareOf(team, progress) {
  if (progress <= YARD || progress >= LAP) return null;
  return (entryIndex(team) + progress) % TRACK;
}








export function yardSlots(t) {
  const base = [
    { x: 1.8, y: 10.8 }, { x: 4.2, y: 10.8 },
    { x: 1.8, y: 13.2 }, { x: 4.2, y: 13.2 },
  ];
  return base.map((p) => rotatePoint(p, t));
}











export function yardBox(t) {
  const a = rotatePoint({ x: 1, y: 10 }, t);
  const b = rotatePoint({ x: 5, y: 14 }, t);
  return {
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  };
}


export function homeSlots(t) {
  const c = homeCell(t);
  return [
    { x: c.x + 0.28, y: c.y + 0.28 }, { x: c.x + 0.72, y: c.y + 0.28 },
    { x: c.x + 0.28, y: c.y + 0.72 }, { x: c.x + 0.72, y: c.y + 0.72 },
  ];
}












export function boardLayout(box) {
  const cell = Math.max(8, Math.floor(Math.min(box.width, box.height) / GRID));
  const size = cell * GRID;
  return {
    cell,
    size,
    x: Math.round(box.x + (box.width - size) / 2),
    y: Math.round(box.y + (box.height - size) / 2),
  };
}


export const cellRect = (L, c) => ({
  x: L.x + c.x * L.cell, y: L.y + c.y * L.cell, w: L.cell, h: L.cell,
});


export const pointPx = (L, p) => ({ x: L.x + p.x * L.cell, y: L.y + p.y * L.cell });


export const boxPx = (L, r) => ({
  x: L.x + r.x * L.cell, y: L.y + r.y * L.cell, w: r.w * L.cell, h: r.h * L.cell,
});













export function tokenSpots(tokens, box) {
  const L = boardLayout(box);
  const out = [];
  
  
  const seen = new Map();
  for (let team = 0; team < tokens.length; team += 1) {
    for (let i = 0; i < tokens[team].length; i += 1) {
      const p = tokens[team][i];
      let centre;
      if (p <= YARD) {
        centre = pointPx(L, yardSlots(team)[i]);
      } else if (p >= HOME) {
        centre = pointPx(L, homeSlots(team)[i]);
      } else {
        const c = cellFor(team, p);
        const key = `${c.x},${c.y}`;
        const nth = seen.get(key) ?? 0;
        seen.set(key, nth + 1);
        const r = cellRect(L, c);
        
        
        const shift = nth * L.cell * 0.18;
        centre = { x: r.x + r.w / 2 - shift * 0.6, y: r.y + r.h / 2 - shift };
      }
      const radius = (p <= YARD || p >= HOME) ? L.cell * 0.36 : L.cell * 0.40;
      out.push({
        team,
        token: i,
        progress: p,
        x: centre.x,
        y: centre.y,
        r: radius,
        
        
        
        
        
        hit: {
          x: centre.x - Math.max(24, radius),
          y: centre.y - Math.max(24, radius),
          w: Math.max(48, radius * 2),
          h: Math.max(48, radius * 2),
        },
      });
    }
  }
  return out;
}






























export function pickToken(spots, { x, y }, canMove = () => false) {
  let best = -1;
  let bestScore = Infinity;
  for (let i = 0; i < spots.length; i += 1) {
    const s = spots[i];
    if (x < s.hit.x || x >= s.hit.x + s.hit.w) continue;
    if (y < s.hit.y || y >= s.hit.y + s.hit.h) continue;
    const dx = x - s.x;
    const dy = y - s.y;
    
    
    const score = (canMove(s) ? 0 : 1e6) + dx * dx + dy * dy;
    if (score < bestScore) { bestScore = score; best = i; }
  }
  return best;
}
