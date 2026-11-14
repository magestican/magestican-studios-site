









import { LETTERS, DINOS } from './content.js';
import { hintFor } from './rules.js';

export const POINTS = Object.freeze({ block: 10, row: 50, tower: 200 });
export const TOWER_SAVE_KEY = 'abcjam-tower-v1';
export const BOMB_CHANCE = 0.2; 
export const MAX_ROWS = 9; 
const SAFE_ROWS = 2; 

const norm = (ch) => String(ch ?? '').toUpperCase();
const isLetter = (ch) => /^[A-Z]$/.test(norm(ch));


export const levelKind = (level) => (level % 2 === 0 ? 'dinos' : 'letters');

const shuffle = (list, rand) => {
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const letterBlock = (ch) => ({ kind: 'letter', ch, id: ch });
const dinoBlock = (d) => ({ kind: 'dino', ch: d.ch, id: d.id });
const BOMB = Object.freeze({ kind: 'bomb', ch: null, id: 'bomb' });





function takeRow(pool, count) {
  const row = [];
  for (let i = 0; i < pool.length && row.length < count;) {
    if (row.some((b) => b.ch === pool[i].ch)) { i++; continue; }
    row.push(pool.splice(i, 1)[0]);
  }
  return row;
}


export function buildTower(level, { width = 3, rand = Math.random } = {}) {
  level = Math.max(1, Math.floor(level) || 1);
  const kind = levelKind(level);
  let pool;
  let ordered = false;
  if (level === 1) {
    pool = LETTERS.map((l) => letterBlock(l.ch));
    ordered = true;
  } else {
    const rowsWanted = Math.min(MAX_ROWS, 3 + Math.ceil(level / 2));
    const solidsWanted = rowsWanted * (width - 1) + Math.floor(rowsWanted / 2);
    const source = kind === 'dinos' ? DINOS.map(dinoBlock) : LETTERS.map((l) => letterBlock(l.ch));
    pool = [];
    while (pool.length < solidsWanted) pool.push(...shuffle(source, rand));
    pool = pool.slice(0, solidsWanted);
  }
  const rows = [];
  while (pool.length && rows.length < (ordered ? Infinity : MAX_ROWS)) {
    const bombOk = !(level === 1 && rows.length < SAFE_ROWS);
    const bomb = bombOk && width > 1 && rand() < BOMB_CHANCE * width;
    const row = ordered ? pool.splice(0, bomb ? width - 1 : width) : takeRow(pool, bomb ? width - 1 : width);
    if (!row.length) break;
    if (bomb) row.splice(Math.floor(rand() * (row.length + 1)), 0, { ...BOMB });
    rows.push(row);
  }
  return rows;
}


export function createTower(level, opts = {}) {
  const rows = buildTower(level, opts).map((r) => r.map((c) => ({ ...c, gone: false })));
  let rowIndex = 0;
  let misses = 0;
  const live = () => (rows[rowIndex] || []).filter((c) => c.kind !== 'bomb' && !c.gone);

  function pop(i) {
    const row = rows[rowIndex];
    const c = row[i];
    c.gone = true;
    misses = 0;
    const r = { kind: 'right', index: i, row: rowIndex, ch: c.ch, id: c.id, block: c.kind, points: POINTS.block };
    if (!live().length) {
      r.rowDone = true;
      r.points += POINTS.row;
      r.fizzled = row.map((b, j) => (b.kind === 'bomb' && !b.gone ? j : -1)).filter((j) => j >= 0);
      r.fizzled.forEach((j) => { row[j].gone = true; });
      rowIndex += 1;
      if (rowIndex >= rows.length) {
        r.towerDone = true;
        r.points += POINTS.tower;
      }
    }
    return r;
  }

  return {
    get rows() { return rows; },
    get rowIndex() { return rowIndex; },
    get level() { return level; },
    get kind() { return levelKind(level); },
    get finished() { return rowIndex >= rows.length; },
    bottom() { return rows[rowIndex] || []; },
    
    press(ch) {
      if (rowIndex >= rows.length || !isLetter(ch)) return { kind: 'ignored' };
      const row = rows[rowIndex];
      const i = row.findIndex((c) => c.kind !== 'bomb' && !c.gone && c.ch === norm(ch));
      if (i >= 0) return pop(i);
      misses += 1;
      return { kind: 'wrong', want: live()[0]?.ch ?? null, hint: hintFor(misses), points: 0 };
    },
    
    tap(i, row = rowIndex) {
      if (rowIndex >= rows.length || row !== rowIndex) return { kind: 'ignored' };
      const c = rows[rowIndex][i];
      if (!c || c.gone) return { kind: 'ignored' };
      if (c.kind === 'bomb') {
        c.gone = true;
        return { kind: 'bomb', index: i, row: rowIndex, points: 0 };
      }
      return pop(i);
    },
  };
}


export function createRun(storage) {
  let s = { level: 1, points: 0, best: 0 };
  try {
    const raw = storage?.getItem(TOWER_SAVE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      s = {
        level: Math.max(1, Math.floor(p.level) || 1),
        points: Math.max(0, Math.floor(p.points) || 0),
        best: Math.max(0, Math.floor(p.best) || 0),
      };
    }
  } catch {  }
  const save = () => { try { storage?.setItem(TOWER_SAVE_KEY, JSON.stringify(s)); } catch {  } };
  return {
    get level() { return s.level; },
    get points() { return s.points; },
    get best() { return s.best; },
    add(n) {
      s.points += Math.max(0, Math.floor(n) || 0);
      s.best = Math.max(s.best, s.points);
      save();
    },
    nextLevel() { s.level += 1; save(); },
    restart() { s = { level: 1, points: 0, best: s.best }; save(); },
  };
}
