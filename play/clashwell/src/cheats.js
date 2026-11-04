


import { PHASE, fireAttack, BREATHER_TICKS } from '../../../web-engine/clashwell/match.js';
import { HEIGHT, WIDTH, STONE } from '../../../web-engine/clashwell/well.js';
import { cellsOf } from '../../../web-engine/clashwell/pieces.js';

export const CHEATS = Object.freeze(['tall', 'windup', 'pending', 'breather', 'over', 'squeeze', 'clash', 'ko']);

function stack(player, rows) {
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if ((x + y) % 7 === 3) continue;
      player.well[y][x] = y < 2 ? STONE : ((x * 3 + y * 5) % 4) + 1;
    }
  }
}

export function applyCheat(match, name) {
  const [a, b] = match.players;
  switch (name) {
    case 'tall':
      stack(a, 14);
      stack(b, 9);
      break;
    case 'windup':
      stack(a, 5);
      stack(b, 5);
      fireAttack(match, 1, { kind: 'heavy', stones: 5 });
      fireAttack(match, 1, { kind: 'light', stones: 2 });
      break;
    case 'pending':
      stack(a, 6);
      a.pending = 3;
      break;
    case 'breather':
      stack(a, 12);
      match.wins = [1, 0];
      match.phase = PHASE.BREATHER;
      match.breather = BREATHER_TICKS;
      match.round = 1;
      break;
    case 'over':
      stack(b, 18);
      match.wins = [2, 1];
      match.winner = 0;
      match.phase = PHASE.OVER;
      match.round = 2;
      break;
    case 'squeeze':
      stack(a, 8);
      stack(b, 8);
      match.roundTick = 119 * 60;
      break;
    case 'clash': {
      
      fireAttack(match, 1, { kind: 'heavy', stones: 5 });
      const cells = cellsOf(a.piece);
      const low = Math.min(...cells.map(([, y]) => y));
      const holes = cells.filter(([, y]) => y === low).map(([x]) => x);
      for (let x = 0; x < WIDTH; x += 1) if (!holes.includes(x)) a.well[0][x] = STONE;
      break;
    }
    case 'ko':
      
      stack(b, HEIGHT - 1);
      break;
    default:
  }
  return match;
}
