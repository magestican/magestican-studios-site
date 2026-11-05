






import { levelsOf } from './levels.js';
import { fill } from './strings.js';
import { MAX_PLAYERS, STALE_MS, orderedRows, agedRows } from './roomRoster.js';

const SEATS = [...levelsOf('favourites'), ...levelsOf('fossils').slice(0, 3)];
export const seatLevel = (seat) => SEATS[seat];


export const rowFill = (row) => (row.state === 'dig' && row.total > 0 ? Math.round(((row.total - row.left) / row.total) * 100) : 0);


export function rowWords(S, row, mine) {
  const name = S.names[seatLevel(row.seat).id];
  let words;
  if (row.state === 'dig') words = fill(S.rowDig, { name, n: rowFill(row) });
  else if (row.state === 'freed') {
    
    words = fill(S.rowFreed, { name, grade: S.grades[row.grade] ?? '' }).replace(/[\s,،、，]+$/u, '');
  } else if (row.state === 'fallen') words = fill(S.rowFallen, { name });
  else words = fill(S.rowWait, { name });
  return mine ? fill(S.rowMine, { row: words }) : words;
}





export function dugStatus(game, round, onBench) {
  if (!game || !onBench) return { state: 'wait', round, left: 1, total: 1, cracks: 0 };
  const now = { round, left: game.block.rockLeft, total: game.rockStart, cracks: game.cracks };
  if (game.state === 'play') return { state: 'dig', ...now };
  if (game.state === 'freed' || game.result === 'won') return { state: 'freed', ...now, grade: game.grade() };
  return { state: 'fallen', ...now };
}


export function fakeRoom(wanted) {
  const n = Math.min(MAX_PLAYERS, Math.max(1, Math.trunc(wanted) || 1));
  const kinds = [
    { state: 'dig', left: 130, total: 200 },
    { state: 'freed', grade: 'mint' },
    { state: 'freed', grade: 'fine' },
    { state: 'freed', grade: 'worn' },
    { state: 'fallen' },
    { state: 'wait' },
    { state: 'dig', left: 20, total: 200, age: STALE_MS + 1000 },
  ];
  const rows = [];
  for (let seat = 0; seat < n; seat++) {
    const kind = kinds[seat % kinds.length];
    
    const left = kind.state === 'dig' ? Math.max(5, kind.left - seat * 9) : 0;
    const age = kind.age ?? 0;
    rows.push({ seat, round: 1, total: 200, grade: null, cracks: seat % 3, ...kind, left, age, stale: age >= STALE_MS });
  }
  return { you: 0, round: { n: 1, level: seatLevel(0).id }, rows };
}

const TICK = '<svg viewBox="0 0 16 10" aria-hidden="true"><path d="M2 5 L6 9 L14 1" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>';
const CROSS = '<svg viewBox="0 0 16 10" aria-hidden="true"><path d="M4 1 L12 9 M12 1 L4 9" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>';

export function createRoomUi({ S, silhouette, box }) {
  
  const nodes = new Map();
  const note = document.createElement('p');
  note.className = 'rivals-note';
  note.hidden = true;

  
  function seatIcon(seat) {
    const icon = silhouette(seatLevel(seat), true);
    icon.setAttribute('aria-hidden', 'true');
    return icon;
  }

  function node(seat) {
    let el = nodes.get(seat);
    if (el) return el;
    el = document.createElement('div');
    el.className = 'rival';
    el.setAttribute('role', 'listitem');
    const name = document.createElement('span');
    name.className = 'nm';
    name.textContent = S.names[seatLevel(seat).id];
    const bar = document.createElement('span');
    bar.className = 'rival-bar';
    bar.innerHTML = '<i></i><span class="rival-mark"></span>';
    el.append(seatIcon(seat), name, bar);
    el.dataset.state = '';
    nodes.set(seat, el);
    return el;
  }

  
  function drawBox(room, ms, closed) {
    if (!room) return;
    const rows = orderedRows(agedRows(room.rows, ms));
    const seen = new Set();
    rows.forEach((row, at) => {
      const el = node(row.seat);
      seen.add(row.seat);
      const mine = row.seat === room.you;
      if (el.dataset.state !== row.state) {
        el.dataset.state = row.state;
        
        el.querySelector('.rival-mark').innerHTML = row.state === 'freed' ? TICK : row.state === 'fallen' ? CROSS : '';
      }
      el.querySelector('.rival-bar i').style.width = `${rowFill(row)}%`;
      el.classList.toggle('stale', !!row.stale);
      el.classList.toggle('me', mine);
      el.setAttribute('aria-label', rowWords(S, row, mine));
      if (box.children[at] !== el) box.insertBefore(el, box.children[at] ?? null);
    });
    for (const [seat, el] of nodes) {
      if (!seen.has(seat)) { el.remove(); nodes.delete(seat); }
    }
    note.textContent = S.roomHostGone;
    note.hidden = !closed;
    box.append(note);
  }

  function clearBox() {
    for (const el of nodes.values()) el.remove();
    nodes.clear();
    note.remove();
  }

  
  function drawSeats(host, rows) {
    const want = rows.map((r) => r.seat).sort((a, b) => a - b).join();
    if (host.dataset.seats === want) return;
    host.dataset.seats = want;
    host.replaceChildren(...want.split(',').filter(Boolean).map((s) => {
      const icon = seatIcon(Number(s));
      icon.classList.add('seat-icon');
      return icon;
    }));
  }

  return { drawBox, clearBox, drawSeats, seatIcon };
}
