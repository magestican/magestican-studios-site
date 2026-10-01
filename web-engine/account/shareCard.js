


















































import { dailyChallenge, GAME_NAMES, GAME_IDS, isGameId } from './dailyChallenge.js';
import { dayNumberToKey } from './dayKey.js';


const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';






const CODE_LEN = 7;








export function seedCode(seed) {
  const n = Number(seed);
  if (!Number.isFinite(n)) return null;
  let v = Math.abs(Math.floor(n)) >>> 0;
  let out = '';
  for (let i = 0; i < CODE_LEN; i++) {
    out = ALPHABET[v % 32] + out;
    v = Math.floor(v / 32);
  }
  return `${out.slice(0, 3)}-${out.slice(3)}`;
}









export function seedFromCode(code) {
  if (typeof code !== 'string') return null;
  const clean = code.toUpperCase().replace(/[\s-]/g, '')
    .replace(/O/g, '0').replace(/[IL]/g, '1');
  if (clean.length !== CODE_LEN) return null;
  let v = 0;
  for (const ch of clean) {
    const i = ALPHABET.indexOf(ch);
    if (i < 0) return null;
    v = v * 32 + i;
  }
  return v >>> 0;
}


export function dailySeedCode(utcDay, gameId) {
  const c = dailyChallenge(utcDay, gameId);
  return c ? seedCode(c.seed) : null;
}






























const GAME_PATHS = Object.freeze({
  'team-bonding': 'farmyshoot',
});

export function seedLink(gameId, code) {
  if (!isGameId(gameId) || typeof code !== 'string' || !code) return null;
  const path = GAME_PATHS[gameId] || gameId;
  return `/play/${path}/?seed=${encodeURIComponent(code)}`;
}






const FILLED = '\u{1F7E9}';   
const EMPTY = '⬜';      


export function bar(fraction, width = 5) {
  const w = Math.max(1, Math.floor(width));
  const f = Math.min(1, Math.max(0, Number(fraction) || 0));
  const on = Math.round(f * w);
  return FILLED.repeat(on) + EMPTY.repeat(w - on);
}






















export function shareCard(parts = {}) {
  const { day = null, board = null, streak = null, season = null,
    origin = 'magesticanstudios.com' } = parts;

  const lines = [];
  const date = dayNumberToKey(day);
  lines.push(date ? `Magestican daily - ${date}` : 'Magestican daily');

  for (const entry of board?.tasks ?? []) {
    const p = entry.progress ?? {};
    lines.push(`${bar(p.fraction)} ${label(entry.task)}`);
  }
  if (board && board.tasks?.length) {
    lines.push(board.complete
      ? `Day complete - ${board.doneCount} of ${board.tasks.length} tasks`
      : `${board.doneCount} of ${board.tasks.length} tasks`);
  }

  const days = Math.max(0, Math.floor(Number(streak?.current) || 0));
  
  
  
  if (days >= 2) lines.push(`${days} days in a row`);

  if (season && season.tier > 0) lines.push(`${season.name} tier ${season.tier}/${season.tiers}`);

  lines.push(origin);
  return lines.join('\n');
}











const SLOT_LABEL = Object.freeze({ warmup: 'Warm-up', main: 'Main', wildcard: 'Wildcard' });

function label(task) {
  if (!task) return '';
  if (task.gameId && GAME_NAMES[task.gameId]) return GAME_NAMES[task.gameId];
  if (task.kind === 'game-pair' && task.pair?.length === 2) {
    return task.pair.map((id) => GAME_NAMES[id] ?? id).join(' + ');
  }
  return SLOT_LABEL[task.slot] ?? task.slot ?? '';
}





export function seedInvite(utcDay, gameId, origin = 'magesticanstudios.com') {
  if (!isGameId(gameId)) return null;
  const code = dailySeedCode(utcDay, gameId);
  const link = seedLink(gameId, code);
  if (!code || !link) return null;
  return {
    code,
    link,
    text: `Same ${GAME_NAMES[gameId]} run, code ${code} - ${origin}${link}`,
  };
}


export function seedCodesFor(utcDay) {
  return GAME_IDS
    .map((id) => ({ id, name: GAME_NAMES[id], code: dailySeedCode(utcDay, id) }))
    .filter((e) => e.code !== null);
}
