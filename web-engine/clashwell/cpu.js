






import { WIDTH, HEIGHT, STONE, fits, placeCells, resolveLock, attackFrom } from './well.js';
import { cellsOf } from './pieces.js';

export const LEVELS = Object.freeze({ easy: 0.2, medium: 0.5, hard: 0.9 });

const ADAPTIVE_START = 0.3;


const STEP_UP = 0.05;
const STEP_DOWN = 0.09;

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.min(1, Math.max(0, v));

export function createCpu({ level = 'adaptive', skill, seed = 1 } = {}) {
  const adaptive = level === 'adaptive' && skill === undefined;
  return {
    adaptive,
    skill: skill ?? (adaptive ? ADAPTIVE_START : LEVELS[level]),
    rng: seed | 0,
    dealt: -1,
    plan: null,
    wait: 0,
    tries: 0,
  };
}


export function afterRound(cpu, humanWon) {
  if (!cpu.adaptive) return;
  cpu.skill = clamp01(cpu.skill + (humanWon ? STEP_UP : -STEP_DOWN));
}

function random(cpu) {
  cpu.rng = (cpu.rng + 0x6D2B79F5) | 0;
  let t = Math.imul(cpu.rng ^ (cpu.rng >>> 15), 1 | cpu.rng);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

function shapeOfWell(well) {
  let holes = 0;
  let bump = 0;
  let top = 0;
  let last = null;
  for (let x = 0; x < WIDTH; x += 1) {
    let h = 0;
    for (let y = well.length - 1; y >= 0; y -= 1) {
      if (well[y][x] !== 0) {
        h = y + 1;
        break;
      }
    }
    for (let y = 0; y < h; y += 1) if (well[y][x] === 0) holes += 1;
    if (last !== null) bump += Math.abs(h - last);
    last = h;
    top = Math.max(top, h);
  }
  return { holes, bump, top };
}

function sameColourNeighbours(well, cells) {
  let n = 0;
  for (const [x, y, colour] of cells) {
    for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y - 1]]) {
      if (well[ny]?.[nx] === colour && colour !== STONE) n += 1;
    }
  }
  return n;
}

function scorePlacement(well, cells, danger, answering) {
  const { well: after, steps } = resolveLock(placeCells(well, cells));
  const attack = attackFrom(steps);
  const { holes, bump, top } = shapeOfWell(after);
  const stones = attack ? attack.stones : 0;
  return stones * (answering ? 9 : 5)
    + sameColourNeighbours(well, cells) * 1.2
    - holes * 3.5
    - bump * 0.45
    - top * (danger ? 1.6 : 0.5);
}


function placements(well, piece, danger, answering) {
  const out = [];
  for (let rot = 0; rot < 4; rot += 1) {
    for (let x = -3; x < WIDTH; x += 1) {
      let probe = { ...piece, rot, x };
      if (!fits(well, cellsOf(probe))) continue;
      while (fits(well, cellsOf({ ...probe, y: probe.y - 1 }))) probe = { ...probe, y: probe.y - 1 };
      out.push({ rot, x, score: scorePlacement(well, cellsOf(probe), danger, answering) });
    }
  }
  return out.sort((a, b) => b.score - a.score);
}

function choose(cpu, options) {
  const slip = lerp(0.6, 0.02, cpu.skill);
  if (random(cpu) >= slip || options.length === 1) return options[0];
  
  const reach = Math.min(options.length, Math.round(lerp(14, 4, cpu.skill)));
  return options[Math.floor(random(cpu) * reach)];
}


export function cpuKeys(cpu, match, seat) {
  const me = match.players[seat];
  if (!me.piece) return [];
  if (me.dealt !== cpu.dealt) {
    cpu.dealt = me.dealt;
    const rivalWindingUp = match.attacks.some((a) => a.from !== seat);
    const danger = shapeOfWell(me.well).top > HEIGHT * 0.55;
    
    const answering = rivalWindingUp && cpu.skill > 0.45;
    const options = placements(me.well, me.piece, danger, answering);
    cpu.plan = options.length ? choose(cpu, options) : null;
    cpu.wait = Math.round(lerp(90, 12, cpu.skill));
    cpu.tries = 0;
  }
  if (!cpu.plan) return [];
  if (cpu.wait > 0) {
    cpu.wait -= 1;
    return [];
  }
  cpu.wait = Math.round(lerp(20, 4, cpu.skill));
  cpu.tries += 1;
  if (cpu.tries > 12) return ['hard']; 
  if (me.piece.rot !== cpu.plan.rot) return ['cw'];
  if (me.piece.x > cpu.plan.x) return ['left'];
  if (me.piece.x < cpu.plan.x) return ['right'];
  return ['hard'];
}
