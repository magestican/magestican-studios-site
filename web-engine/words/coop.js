



































export const MSG = Object.freeze({
  HELLO: 'fc-hello',   
  MOVE: 'fc-move',     
  SAY: 'fc-say',       
  WHERE: 'fc-where',   
  START: 'fc-start',   
  RESUME: 'fc-resume', 
});


export const puzzleKey = (game, index) => `${game}:${index}`;








export const KINDS = Object.freeze({
  wordle: ['guess'],
  bee: ['word'],
  connections: ['selection'],
  strands: ['found', 'bonus', 'hint'],
});












export function orderMoves(moves) {
  return [...moves].sort((a, b) => (a.seq - b.seq) || (a.by < b.by ? -1 : a.by > b.by ? 1 : 0));
}


export function nextSeq(moves) {
  return moves.reduce((n, m) => Math.max(n, m.seq), 0) + 1;
}


export function makeMove({ by, seq, kind, value, key }) {
  return { id: `${by}#${seq}`, by, seq, kind, value, key };
}














export function mergeMoves(mine, theirs, key) {
  const byId = new Map();
  for (const m of [...mine, ...theirs]) {
    if (!m || typeof m.id !== 'string') continue;
    if (key && m.key !== key) continue;
    if (!byId.has(m.id)) byId.set(m.id, m);
  }
  return orderMoves([...byId.values()]);
}







export function stateFromMoves(game, moves) {
  const ordered = orderMoves(moves);
  const of = (kind) => ordered.filter((m) => m.kind === kind);

  if (game === 'wordle') {
    return { guesses: dedupe(of('guess').map((m) => m.value)) };
  }
  if (game === 'bee') {
    return { found: [...new Set(of('word').map((m) => m.value))].sort() };
  }
  if (game === 'connections') {
    return { selections: of('selection').map((m) => m.value) };
  }
  if (game === 'strands') {
    return {
      found: [...new Set(of('found').map((m) => m.value))],
      bonus: [...new Set(of('bonus').map((m) => m.value))],
      
      
      hintsUsed: of('hint').length,
    };
  }
  return {};
}


function dedupe(list) {
  const seen = new Set();
  return list.filter((v) => (seen.has(v) ? false : (seen.add(v), true)));
}









export function movesFromState(game, before, after, { by, seq, key }) {
  const out = [];
  const add = (kind, value) => {
    out.push(makeMove({ by, seq: seq + out.length, kind, value, key }));
  };
  const newIn = (a = [], b = []) => b.filter((v) => !a.includes(v));

  if (game === 'wordle') {
    for (const g of (after.guesses ?? []).slice((before?.guesses ?? []).length)) add('guess', g);
  } else if (game === 'bee') {
    for (const w of newIn(before?.found, after.found)) add('word', w);
  } else if (game === 'connections') {
    for (const s of (after.selections ?? []).slice((before?.selections ?? []).length)) add('selection', s);
  } else if (game === 'strands') {
    for (const w of newIn(before?.found, after.found)) add('found', w);
    for (const w of newIn(before?.bonus, after.bonus)) add('bonus', w);
    const spent = (after.hintsUsed ?? 0) - (before?.hintsUsed ?? 0);
    for (let i = 0; i < spent; i += 1) add('hint', 1);
  }
  return out;
}

















const ANIMALS = ['Sheep', 'Goose', 'Piglet', 'Donkey', 'Duck', 'Goat', 'Pony', 'Hen',
  'Calf', 'Lamb', 'Drake', 'Ram', 'Sow', 'Foal', 'Gander', 'Bullock'];
const ADJECTIVES = ['Green', 'Gold', 'Blue', 'Red', 'Quick', 'Quiet', 'Bright', 'Bold'];


export function hashId(id) {
  let h = 2166136261;
  for (let i = 0; i < String(id).length; i += 1) {
    h ^= String(id).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function nameFor(peerId) {
  const h = hashId(peerId);
  return `${ADJECTIVES[h % ADJECTIVES.length]} ${ANIMALS[(h >>> 8) % ANIMALS.length]}`;
}


export const PEER_COLOURS = ['blue', 'green', 'gold', 'red'];

export function colourFor(peerId, order = []) {
  
  
  
  const at = order.indexOf(peerId);
  if (at >= 0) return PEER_COLOURS[at % PEER_COLOURS.length];
  return PEER_COLOURS[hashId(peerId) % PEER_COLOURS.length];
}








export function creditFor(moves, kind, value) {
  const m = orderMoves(moves).find((x) => x.kind === kind && x.value === value);
  return m ? m.by : null;
}


export function describeRoom({ peers = [], me = null } = {}) {
  const others = peers.filter((p) => p !== me);
  if (!others.length) return 'Waiting for somebody to join';
  if (others.length === 1) return `Playing with ${nameFor(others[0])}`;
  return `Playing with ${others.length} others`;
}



















export const CODE_ALPHABET = 'ACDEFGHJKMNPRTUVWXY34679';
export const CODE_LENGTH = 6;


export const ROOM_PREFIX = 'fcx-';




















export const GAME_PREFIX = Object.freeze({
  crosswords: 'fcx-',
  chess: 'fch-',
  ludo: 'flu-',
  scrabble: 'fsc-',
});


export function gameOfCode(text) {
  const raw = String(text ?? '').toUpperCase().replace(/[\s._-]/g, '');
  for (const [game, prefix] of Object.entries(GAME_PREFIX)) {
    const bare = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (raw.startsWith(bare)) return game;
  }
  return null;
}







export function roomCode(random = Math.random, prefix = ROOM_PREFIX) {
  let out = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    const at = Math.floor(random() * CODE_ALPHABET.length);
    out += CODE_ALPHABET[Math.min(CODE_ALPHABET.length - 1, Math.max(0, at))];
  }
  return prefix + out;
}










export function normaliseCode(text, prefix = ROOM_PREFIX) {
  const raw = String(text ?? '').toUpperCase().replace(/[\s._-]/g, '');
  
  
  
  const belongsTo = gameOfCode(raw);
  const mine = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (belongsTo && GAME_PREFIX[belongsTo].toUpperCase().replace(/[^A-Z0-9]/g, '') !== mine) return null;
  const body = raw.startsWith(mine) ? raw.slice(mine.length) : raw;
  if (body.length !== CODE_LENGTH) return null;
  for (const ch of body) if (!CODE_ALPHABET.includes(ch)) return null;
  return prefix + body;
}


export function spokenCode(id) {
  const s = String(id ?? '');
  return s.startsWith(ROOM_PREFIX) ? s.slice(ROOM_PREFIX.length) : s;
}






export function joinIdFrom(href) {
  try {
    return new URL(href).searchParams.get('join');
  } catch {
    return null;
  }
}









export function shareLinkFor(href, id, { game, index } = {}) {
  const url = new URL(href);
  url.searchParams.set('join', id);
  if (game) url.searchParams.set('g', game);
  if (Number.isInteger(index)) url.searchParams.set('p', String(index + 1));
  url.hash = '';
  return url.toString();
}


export function puzzleFrom(href) {
  try {
    const url = new URL(href);
    const game = url.searchParams.get('g');
    const p = Number(url.searchParams.get('p'));
    return {
      game: game && KINDS[game] ? game : null,
      index: Number.isInteger(p) && p >= 1 ? p - 1 : null,
    };
  } catch {
    return { game: null, index: null };
  }
}



















export const MODES = Object.freeze({ TOGETHER: 'together', RACE: 'race' });

export const isRace = (mode) => mode === MODES.RACE;









export function movesForBoard(moves, { mode, me }) {
  if (!isRace(mode)) return moves;
  return moves.filter((m) => m.by === me);
}


export function progressOf(game, moves, peers = []) {
  return peers.map((by) => {
    const mine = moves.filter((m) => m.by === by);
    const state = stateFromMoves(game, mine);
    return { by, name: nameFor(by), done: countDone(game, state) };
  });
}


export function countDone(game, state) {
  if (game === 'wordle') return (state.guesses ?? []).length;
  if (game === 'bee') return (state.found ?? []).length;
  if (game === 'connections') return (state.selections ?? []).length;
  if (game === 'strands') return (state.found ?? []).length;
  return 0;
}









export function creditForGroup(moves, words) {
  const want = [...words].map(String).sort().join('|');
  const m = orderMoves(moves).find((x) => x.kind === 'selection'
    && Array.isArray(x.value)
    && [...x.value].map(String).sort().join('|') === want);
  return m ? m.by : null;
}




















export const SAYINGS = Object.freeze([
  { id: 'nice', text: 'Nice one!' },
  { id: 'stuck', text: "I'm stuck" },
  { id: 'go', text: 'Your turn' },
  { id: 'wait', text: 'Hang on' },
  { id: 'look', text: 'Look at the middle' },
  { id: 'bye', text: 'I have to go' },
]);


export function sayingText(id) {
  const found = SAYINGS.find((s) => s.id === id);
  return found ? found.text : null;
}


export function describeSaying({ by, id, me } = {}) {
  const text = sayingText(id);
  if (!text) return null;
  return `${by === me ? 'You' : nameFor(by)}: ${text}`;
}


export function describeFind({ by, value, me } = {}) {
  if (!by || by === me) return null;
  return `${nameFor(by)} found ${value}.`;
}






export const GAME_NAMES = Object.freeze({
  wordle: 'Wordle',
  bee: 'Spelling Bee',
  connections: 'Connections',
  strands: 'Strands',
});










export function whereOf({ game, index, done, total } = {}) {
  const name = GAME_NAMES[game];
  if (!name) return 'Not in a puzzle yet';
  const puzzle = Number.isInteger(index) ? `${name}, puzzle ${index + 1}` : name;
  if (!Number.isInteger(total) || total <= 0) return puzzle;
  return `${puzzle} - ${done ?? 0} of ${total}`;
}













export function scoreboard(list = [], { me = null, game = null, index = null } = {}) {
  const rows = list.map((w, i) => {
    const total = Number.isInteger(w.total) && w.total > 0 ? w.total : null;
    const done = Math.max(0, w.done ?? 0);
    const sameBoard = w.game === game && w.index === index;
    return {
      by: w.by,
      name: nameFor(w.by),
      colour: colourFor(w.by, list.map((x) => x.by)),
      you: w.by === me,
      game: w.game ?? null,
      index: Number.isInteger(w.index) ? w.index : null,
      done,
      total,
      share: total ? done / total : 0,
      finished: !!total && done >= total,
      comparable: !!(game && sameBoard),
      where: whereOf(w),
      seat: i,
    };
  });
  return rows.sort((a, b) => (b.share - a.share) || (a.seat - b.seat));
}








export function winnerOf(rows = []) {
  const racing = rows.filter((r) => r.comparable);
  const done = racing.filter((r) => r.finished);
  if (!done.length) return null;
  return done[0];
}


















export const NAME_MAX = 14;









export function cleanName(text) {
  const name = String(text ?? '')
    .replace(/[^A-Za-z \-']/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, NAME_MAX);
  return name.length >= 2 ? name : null;
}


export function displayName(peerId, names = {}) {
  return cleanName(names?.[peerId]) ?? nameFor(peerId);
}










export function initialsOf(name) {
  const parts = String(name ?? '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}








export function chipsFor(rows = []) {
  return rows.map((r) => ({
    by: r.by,
    colour: r.colour,
    initials: initialsOf(r.name),
    score: r.comparable && r.total ? `${r.done}/${r.total}` : '',
    you: !!r.you,
    finished: !!r.finished,
  }));
}
