










































import { COLORS, SIZES } from '../../../web-engine/words/style.js';
import { grid, rectAt, centreOf } from '../../../web-engine/words/layout.js';
import { progress, lift, sink, shake, DURATION } from '../../../web-engine/words/motion.js';
import {
  SIZE, EMPTY, sideOf, isKing, rowOf, colOf, idx, playable,
} from '../../../web-engine/checkers/checkersRules.js';
import { sideOfSeat } from '../../../web-engine/checkers/checkersMatch.js';
import {
  squareName, FILES, RANKS, describeMatch,
} from '../../../web-engine/checkers/checkersDescribe.js';
import * as paint from './paint.js';


const PLAYING = [];
for (let row = 0; row < SIZE; row += 1) {
  for (let col = 0; col < SIZE; col += 1) if (playable(row, col)) PLAYING.push(idx(row, col));
}


const REACH = 14;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));














export function moveCursor(index, { dx, dy }) {
  const row = rowOf(index);
  const col = colOf(index);
  if (dy) {
    const r = clamp(row + dy, 0, SIZE - 1);
    if (r === row) return index;
    const left = col - 1;
    const c = left >= 0 && playable(r, left) ? left : clamp(col + 1, 0, SIZE - 1);
    return playable(r, c) ? idx(r, c) : index;
  }
  const at = PLAYING.indexOf(index);
  if (at < 0) return PLAYING[0];
  return PLAYING[clamp(at + dx, 0, PLAYING.length - 1)];
}

export function create(app) {
  
  let squares = [];
  let boardBox = { x: 0, y: 0, w: 0, h: 0 };
  let margin = 0;
  let chips = [];
  let buttons = [];
  let statusBox = { x: 0, y: 0, w: 0, h: 0 };

  
  let chain = [];
  let hover = -1;
  let hoverAt = 0;
  let press = -1;
  let pressAt = 0;
  let refusedAt = -1;
  let refusedFrom = 0;
  let cursor = idx(SIZE - 1, 0);
  let buttonHover = -1;
  let buttonHoverAt = 0;
  let flipped = false;

  const state = () => app.state();

  
  function chainMoves() {
    if (!chain.length) return [];
    return state().legal.filter((m) => chain.every((sq, i) => m.path[i] === sq));
  }

  
  function options() {
    const out = new Map();
    for (const m of chainMoves()) {
      const next = m.path[chain.length];
      if (next === undefined) continue;
      const took = m.captured.length > (chain.length - 1);
      out.set(next, {
        square: next,
        take: took,
        
        
        
        victim: took ? m.captured[chain.length - 1] : null,
        done: m.path.length === chain.length + 1,
        move: m,
      });
    }
    return out;
  }

  
  function pickable() {
    const s = state();
    if (!app.myTurn()) return new Set();
    return new Set(s.legal.map((m) => m.from));
  }

  function refuse(at, message) {
    refusedAt = at;
    refusedFrom = app.now();
    app.message = message;
    app.announce(message);
    app.invalidate();
  }

  
  function advance(square) {
    const option = options().get(square);
    if (!option) return false;
    chain = [...chain, square];
    if (!option.done) {
      const line = `Took ${squareName(option.victim)}. The jump goes on - choose where next.`;
      app.message = line;
      app.announce(line);
      app.invalidate();
      return true;
    }
    const move = option.move;
    chain = [];
    const error = app.act({
      kind: 'move', from: move.from, to: move.to, path: [...move.path],
    });
    if (error) refuse(move.from, error);
    app.invalidate();
    return true;
  }

  
  function select(square) {
    const s = state();
    const ch = s.board[square];
    if (ch === EMPTY) { chain = []; app.invalidate(); return; }
    if (sideOf(ch) !== s.turn) {
      
      
      
      
      
      
      refuse(square, app.mySide() === sideOf(ch)
        ? 'Those are yours, but it is not your turn yet.'
        : 'That is not one of your pieces.');
      return;
    }
    if (!app.myTurn()) {
      refuse(square, app.turnMessage());
      return;
    }
    if (!pickable().has(square)) {
      
      
      
      refuse(square, s.mustCapture
        ? 'A take is on offer, so a take is the only move.'
        : 'That piece has nowhere to go.');
      return;
    }
    chain = [square];
    const where = describeOptionsLine(square);
    app.message = where;
    app.announce(where);
    app.invalidate();
  }

  function describeOptionsLine(square) {
    const list = [...options().keys()].map(squareName);
    const s = state();
    const verb = s.mustCapture ? 'take to' : 'move to';
    return `${squareName(square)} picked up. You can ${verb} ${list.join(' or ')}.`;
  }

  
  function pressSquare(square) {
    if (square < 0) { chain = []; app.invalidate(); return; }
    if (chain.length && chain[chain.length - 1] === square) {
      
      
      
      chain = chain.length > 1 ? chain.slice(0, -1) : [];
      app.message = chain.length ? describeOptionsLine(chain[chain.length - 1]) : 'Put back.';
      app.announce(app.message);
      app.invalidate();
      return;
    }
    if (advance(square)) return;
    if (chain.length > 1) {
      
      
      refuse(square, 'The jump is not finished. Take again, or press the piece to put it back.');
      return;
    }
    select(square);
  }

  






  function targetAt(pt) {
    const live = new Set([...pickable(), ...options().keys(), ...chain]);
    let best = -1;
    let bestD = Infinity;
    for (let i = 0; i < squares.length; i += 1) {
      if (!live.has(i)) continue;
      const r = squares[i];
      if (pt.x < r.x - REACH || pt.x > r.x + r.w + REACH) continue;
      if (pt.y < r.y - REACH || pt.y > r.y + r.h + REACH) continue;
      const c = centreOf(r);
      const d = (pt.x - c.x) ** 2 + (pt.y - c.y) ** 2;
      if (d < bestD) { bestD = d; best = i; }
    }
    if (best >= 0) return best;
    
    
    return rectAt(squares, pt.x, pt.y);
  }

  function layout(box) {
    const s = state();
    const narrow = box.width < 520;
    const chipH = 44;
    const statusH = narrow ? 66 : 48;
    const rowH = SIZES.target;
    const gap = 10;
    const spare = box.height - chipH - statusH - rowH - gap * 3;
    const outer = Math.max(200, Math.min(box.width, spare));
    
    
    
    margin = outer >= 470 ? 24 : 0;
    
    
    
    
    const total = chipH + gap + outer + gap + statusH + gap + rowH;
    const top = box.y + Math.max(0, Math.floor((box.height - total) / 2));

    const laid = grid({
      box: {
        x: box.x + (box.width - outer) / 2 + margin,
        y: top + chipH + gap + margin,
        width: outer - margin * 2,
        height: outer - margin * 2,
      },
      cols: SIZE,
      rows: SIZE,
      gap: 0,
      min: 24,
      maxCell: 78,
    });
    
    
    
    
    
    
    
    
    flipped = app.viewFlipped();
    squares = flipped ? laid.rects.slice().reverse() : laid.rects;
    boardBox = { x: laid.x, y: laid.y, w: laid.width, h: laid.height };

    const chipW = Math.min(280, (box.width - gap) / 2);
    const chipLeft = box.x + (box.width - (chipW * 2 + gap)) / 2;
    chips = [0, 1].map((seat) => ({
      x: chipLeft + seat * (chipW + gap), y: top, w: chipW, h: chipH, seat,
    }));

    statusBox = {
      x: box.x, y: boardBox.y + boardBox.h + margin + gap, w: box.width, h: statusH,
    };

    
    
    
    
    const labels = [
      { id: 'undo', label: 'Undo', disabled: !app.canUndo() },
      { id: 'moves', label: narrow ? 'Moves' : `Moves (${s.history.length})` },
      
      
      
      { id: 'bot', label: narrow ? (app.hasBot() ? 'Bot on' : 'Bot') : app.botLabel(), disabled: app.inRoom() },
    ];
    const rowWidth = Math.min(box.width, 560);
    const each = (rowWidth - gap * (labels.length - 1)) / labels.length;
    buttons = labels.map((b, i) => ({
      ...b,
      x: box.x + (box.width - rowWidth) / 2 + i * (each + gap),
      y: statusBox.y + statusH + gap,
      w: each,
      h: rowH,
    }));
  }

  function draw(g, now) {
    const s = state();
    const opts = options();
    const live = pickable();
    const selected = chain.length ? chain[chain.length - 1] : -1;
    const wobble = refusedAt >= 0
      ? shake(progress(now, refusedFrom, DURATION.shake, app.motion), 5)
      : 0;

    chips.forEach((c) => {
      const side = sideOfSeat(c.seat);
      paint.sideChip(g, c, {
        side,
        name: app.seatName(c.seat),
        left: s.counts[side].total,
        kings: s.counts[side].kings,
        toMove: !s.over && s.turn === side,
        bot: app.isBotSeat(c.seat),
      });
    });

    paint.boardFrame(g, boardBox, {
      margin,
      
      files: margin ? (flipped ? [...FILES].reverse() : FILES) : [],
      ranks: margin ? (flipped ? [...RANKS].reverse() : RANKS) : [],
    });

    squares.forEach((r, i) => {
      paint.square(g, r, { dark: playable(rowOf(i), colOf(i)) });
    });

    
    
    if (s.last) {
      paint.highlight(g, squares[s.last.from], 'last');
      paint.highlight(g, squares[s.last.to], 'last');
    }

    
    
    if (s.mustCapture && app.myTurn() && !chain.length) {
      for (const at of s.forced) paint.highlight(g, squares[at], 'forced');
    }

    if (selected >= 0) paint.highlight(g, squares[selected], 'selected');

    squares.forEach((r, i) => {
      const ch = s.board[i];
      if (ch === EMPTY) return;
      const doomed = [...opts.values()].some((o) => o.victim === i);
      const isSel = i === selected;
      const shift = i === refusedAt ? wobble : 0;
      paint.piece(g, { ...r, x: r.x + shift }, {
        side: sideOf(ch),
        king: isKing(ch),
        doomed,
        lift: isSel ? 3 : (i === hover && live.has(i)
          ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0),
        press: i === press ? sink(progress(now, pressAt, DURATION.press, app.motion), app.motion) : 0,
      });
    });

    
    
    for (const o of opts.values()) {
      paint.highlight(g, squares[o.square], o.take ? 'take' : 'move');
    }

    if (app.keyboardMode) paint.highlight(g, squares[cursor], 'cursor');

    const lines = app.wrap(app.message || app.turnMessage(), statusBox.w - 24, {
      size: SIZES.min, weight: 400,
    }).slice(0, statusBox.h > 56 ? 2 : 1);
    lines.forEach((line, i) => {
      paint.text(g, line, {
        x: statusBox.x + 12, y: statusBox.y + i * 24, w: statusBox.w - 24, h: 24,
      }, { size: SIZES.min, weight: 400, colour: COLORS.ink, align: 'left' });
    });

    buttons.forEach((b, i) => {
      paint.button(g, b, {
        label: b.label,
        disabled: b.disabled,
        tone: b.id === 'bot' && app.hasBot() ? 'green' : null,
        size: SIZES.min,
        hover: i === buttonHover
          ? lift(progress(now, buttonHoverAt, DURATION.hover, app.motion), app.motion) : 0,
      });
    });
  }

  function runButton(id) {
    if (id === 'undo') app.undo();
    else if (id === 'moves') app.openPanel('moves');
    else if (id === 'bot') app.openPanel('bot');
  }

  return {
    id: 'board',
    keys: 'Arrow keys move the marker between the playing squares. Enter picks a piece up and puts it down. Escape puts it back.',
    help: [
      'Farmy Checkers is English draughts. Twelve sheep against twelve cows, on the hatched squares.',
      'The sheep move first. A piece moves one square diagonally forward; a king, crowned when it reaches the far row, moves and takes in all four directions.',
      'IF YOU CAN TAKE, YOU MUST. A piece that has to jump wears a gold star, and a jump that can go on must go on - keep pressing the squares until the chain ends.',
      'A hollow ring is somewhere you may move. A solid red diamond is a take, and the piece it would take is crossed out.',
      'You win by taking every piece, or by leaving the other side with no move at all. It is a draw if the same position comes up three times, or after forty moves each with nothing taken and no piece advanced.',
      'A king carries a crown and a second ring. It is never told apart by shade alone.',
    ],
    layout,
    draw,
    reload() {
      
      
      
      chain = [];
      refusedAt = -1;
    },
    pointerMove(pt) {
      const b = rectAt(buttons, pt.x, pt.y);
      if (b !== buttonHover) { buttonHover = b; buttonHoverAt = app.now(); app.invalidate(); }
      const i = b >= 0 ? -1 : targetAt(pt);
      if (i !== hover) { hover = i; hoverAt = app.now(); app.invalidate(); }
    },
    pointerDown(pt) {
      if (rectAt(buttons, pt.x, pt.y) >= 0) return;
      press = targetAt(pt);
      pressAt = app.now();
      app.invalidate();
    },
    pointerUp(pt) {
      const b = rectAt(buttons, pt.x, pt.y);
      press = -1;
      if (b >= 0) {
        if (!buttons[b].disabled) runButton(buttons[b].id);
        app.invalidate();
        return;
      }
      
      
      
      const at = targetAt(pt);
      if (at >= 0 && chain.length && chain[0] === at && chain.length === 1) {
        
        
        app.invalidate();
        return;
      }
      pressSquare(at);
    },
    pointerLeave() { hover = -1; press = -1; app.invalidate(); },
    key(action) {
      if (action.type === 'move') {
        cursor = moveCursor(cursor, action);
        
        
        
        
        
        
        app.message = `${squareName(cursor)}, ${describeAt(cursor)}.`;
        app.announce(app.message);
        app.invalidate();
        return true;
      }
      if (action.type === 'submit') { pressSquare(cursor); return true; }
      if (action.type === 'delete' || action.type === 'back') {
        chain = [];
        app.invalidate();
        return true;
      }
      return false;
    },
    describe() {
      const s = state();
      const d = describeMatch(s, {
        me: app.me,
        nameOf: app.nameOf,
        selected: chain.length ? chain[chain.length - 1] : null,
        message: app.message,
      });
      return {
        ...d,
        lines: [
          ...d.lines,
          ...(app.hasBot() ? [app.botLine()] : []),
          `Marker on ${squareName(cursor)}.`,
          ...buttons.map((b) => `Button: ${b.label}${b.disabled ? ' (not available)' : ''}`),
        ],
      };
    },
    rects: () => [
      ...squares.map((r, i) => ({ id: `sq:${squareName(i)}`, x: r.x, y: r.y, w: r.w, h: r.h })),
      ...buttons.map((b) => ({ id: `btn:${b.id}`, x: b.x, y: b.y, w: b.w, h: b.h })),
      ...chips.map((c) => ({ id: `chip:${c.seat}`, x: c.x, y: c.y, w: c.w, h: c.h })),
    ],
    animating: (now) => app.motion && (
      now - hoverAt < DURATION.hover
      || now - pressAt < DURATION.press
      || now - buttonHoverAt < DURATION.hover
      || (refusedAt >= 0 && now - refusedFrom < DURATION.shake)
    ),
    
    chain: () => [...chain],
  };

  function describeAt(square) {
    const ch = state().board[square];
    if (ch === EMPTY) return 'empty';
    return `${sideOf(ch) === 0 ? 'sheep' : 'cow'}${isKing(ch) ? ' king' : ''}`;
  }
}

export { PLAYING };
