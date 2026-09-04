








































import { COLORS, SIZES } from '../../../web-engine/words/style.js';
import { grid, keyboard, rectAt, rectAtLoose } from '../../../web-engine/words/layout.js';
import { progress, lift, sink, shake, DURATION } from '../../../web-engine/words/motion.js';
import { isDrag, DRAG_SLOP } from '../../../web-engine/words/drag.js';
import {
  SIZE, BLANK, VALUES, premiumCharAt, judge, idx, onBoard, RACK_SIZE,
} from '../../../web-engine/words/scrabbleRules.js';
import { ACTIONS, canExchange, seatOf } from '../../../web-engine/words/scrabbleMatch.js';
import {
  describeMatch, describeSquare, coordOf, describeTurn,
} from '../../../web-engine/words/scrabbleDescribe.js';
import { initialsOf } from '../../../web-engine/words/coop.js';
import * as paint from './paint.js';


const NARROW = 640;


const WIDE_ROWS = [['Play', 'Undo', 'Mix', 'Swap', 'Pass']];
const NARROW_ROWS = [['Play', 'Undo'], ['Mix', 'Swap', 'Pass']];

export function create(app) {
  
  let pending = [];
  
  let slots = [];
  
  let seenStamp = '';
  let cursor = { row: 7, col: 7 };
  let axis = 'across';
  let chosen = -1;          
  let swapping = null;      
  let dragging = null;      
  let downAt = null;        
  let hoverRack = -1;
  let hoverButton = -1;
  let hoverAt = 0;
  let pressButton = -1;
  let pressAt = 0;
  let shakeAt = -1;         

  let boardGrid = { rects: [], cell: 24 };
  let rackGrid = { rects: [], cell: 48 };
  let buttons = { rects: [] };
  let scoreBand = { x: 0, y: 0, width: 0, height: 0 };
  let statusBand = { x: 0, y: 0, width: 0, height: 0 };

  const state = () => app.state();
  const mySeat = () => seatOf(state(), app.me);

  











  const stamp = (s) => `${s.seed}:${s.seats.length}:${s.history.length}`;

  







  function syncRack(force = false) {
    const s = state();
    const seat = mySeat();
    if (!force && stamp(s) === seenStamp) return;
    seenStamp = stamp(s);
    pending = [];
    chosen = -1;
    swapping = null;
    slots = seat >= 0 ? s.racks[seat].map((letter) => ({ letter })) : [];
  }

  function layout(area) {
    const narrow = app.width < NARROW;
    const gap = narrow ? 10 : 14;
    const rows = narrow ? NARROW_ROWS : WIDE_ROWS;
    
    
    
    const buttonsHeight = rows.length * SIZES.target + (rows.length - 1) * 8;
    const rackHeight = narrow ? 56 : 66;
    const statusHeight = narrow ? 56 : 44;
    const scoresHeight = 36;

    scoreBand = { x: area.x, y: area.y, width: area.width, height: scoresHeight };
    const bottom = area.y + area.height;
    const buttonsTop = bottom - buttonsHeight;
    const rackTop = buttonsTop - gap - rackHeight;
    const statusTop = rackTop - gap - statusHeight;

    buttons = keyboard({
      box: { x: area.x, y: buttonsTop, width: area.width, height: buttonsHeight },
      rows,
      gap: 8,
      wideUnits: 1.6,
      maxKey: narrow ? 999 : 84,
    });
    rackGrid = grid({
      box: { x: area.x, y: rackTop, width: area.width, height: rackHeight },
      cols: RACK_SIZE,
      rows: 1,
      gap: narrow ? 5 : 8,
      maxCell: 62,
      min: 40,
      centreY: true,
    });
    boardGrid = grid({
      box: {
        x: area.x,
        y: scoreBand.y + scoresHeight + 6,
        width: area.width,
        height: statusTop - (scoreBand.y + scoresHeight) - 12,
      },
      cols: SIZE,
      rows: SIZE,
      gap: narrow ? 2 : 3,
      
      
      min: 18,
      maxCell: 46,
      centreY: true,
    });
    
    
    
    
    
    statusBand = {
      x: area.x,
      y: Math.min(statusTop, boardGrid.bottom + 10),
      width: area.width,
      height: statusHeight,
    };
  }

  
  
  

  
  function shown() {
    const s = state();
    const out = s.board.slice();
    for (const p of pending) out[idx(p.row, p.col)] = { letter: p.letter, blank: p.blank, pending: true };
    return out;
  }

  const pendingAt = (row, col) => pending.find((p) => p.row === row && p.col === col) ?? null;

  
  function verdict() {
    if (!pending.length) return null;
    return judge(state().board, pending.map(({ row, col, letter, blank }) => ({ row, col, letter, blank })),
      app.isWord);
  }

  
  
  

  
  function advance() {
    const board = shown();
    let { row, col } = cursor;
    do {
      if (axis === 'across') col += 1; else row += 1;
    } while (onBoard(row, col) && board[idx(row, col)]);
    if (onBoard(row, col)) cursor = { row, col };
  }

  





  function lay(slot, row, col, letter = null) {
    const tile = slots[slot];
    if (!tile || !onBoard(row, col)) return;
    if (state().board[idx(row, col)] || pendingAt(row, col)) return;
    if (tile.letter === BLANK && !letter) {
      app.chooseLetter((ch) => { lay(slot, row, col, ch); });
      return;
    }
    const ch = (letter ?? tile.letter).toUpperCase();
    slots = slots.map((t, i) => (i === slot ? null : t));
    pending = [...pending, { row, col, letter: ch, blank: tile.letter === BLANK, slot }];
    chosen = -1;
    cursor = { row, col };
    advance();
    app.invalidate();
  }

  
  function pickUp(row, col) {
    const p = pendingAt(row, col);
    if (!p) return false;
    pending = pending.filter((x) => x !== p);
    slots = slots.map((t, i) => (i === p.slot ? { letter: p.blank ? BLANK : p.letter } : t));
    cursor = { row, col };
    app.invalidate();
    return true;
  }

  








  function typeLetter(ch) {
    if (!app.myTurn()) { refuse(describeTurn(state(), { me: app.me, nameOf: app.nameOf })); return; }
    if (swapping) { toggleSwapByLetter(ch); return; }
    const exact = slots.findIndex((t) => t && t.letter === ch);
    if (exact >= 0) { lay(exact, cursor.row, cursor.col); return; }
    const blank = slots.findIndex((t) => t && t.letter === BLANK);
    if (blank >= 0) {
      lay(blank, cursor.row, cursor.col, ch);
      app.announce(`Using your blank as ${ch}.`);
      return;
    }
    refuse(`No ${ch} on your rack.`);
  }

  
  function backspace() {
    if (swapping) return;
    const last = pending[pending.length - 1];
    if (!last) return;
    pickUp(last.row, last.col);
  }

  function refuse(why) {
    shakeAt = app.now();
    app.message = why;
    app.announce(why);
    app.invalidate();
  }

  
  
  

  function play() {
    if (swapping) { commitSwap(); return; }
    if (!app.myTurn()) { refuse(describeTurn(state(), { me: app.me, nameOf: app.nameOf })); return; }
    if (!pending.length) { refuse('Put some tiles on the board first.'); return; }
    const error = app.act({
      kind: ACTIONS.PLAY,
      seat: mySeat(),
      placed: pending.map(({ row, col, letter, blank }) => ({ row, col, letter, blank })),
    });
    if (error) { refuse(error); return; }
    
    
    
    syncRack(true);
    app.invalidate();
  }

  function undo() {
    if (swapping) { swapping = null; app.message = ''; app.invalidate(); return; }
    while (pending.length) pickUp(pending[0].row, pending[0].col);
    app.message = '';
    app.invalidate();
  }

  







  function mix() {
    const next = slots.slice();
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    slots = next;
    
    
    
    
    
    const holes = next.map((t, i) => (t === null ? i : -1)).filter((i) => i >= 0);
    pending = pending.map((p, k) => ({ ...p, slot: holes[k] ?? p.slot }));
    app.invalidate();
  }

  function startSwap() {
    if (!app.myTurn()) { refuse(describeTurn(state(), { me: app.me, nameOf: app.nameOf })); return; }
    if (!canExchange(state())) {
      refuse(`There are only ${state().bag.length} tiles left, so no more swapping.`);
      return;
    }
    undo();
    swapping = new Set();
    app.message = 'Tap the tiles you want to change, then press Swap again.';
    app.announce(app.message);
    app.invalidate();
  }

  function toggleSwap(slot) {
    if (!swapping || !slots[slot]) return;
    if (swapping.has(slot)) swapping.delete(slot); else swapping.add(slot);
    app.invalidate();
  }

  const toggleSwapByLetter = (ch) => {
    const at = slots.findIndex((t, i) => t && t.letter === ch && !swapping.has(i));
    if (at >= 0) toggleSwap(at);
  };

  function commitSwap() {
    const tiles = [...swapping].map((i) => slots[i]?.letter).filter(Boolean);
    if (!tiles.length) { refuse('Choose the tiles you want to swap.'); return; }
    const error = app.act({ kind: ACTIONS.EXCHANGE, seat: mySeat(), tiles });
    if (error) { refuse(error); return; }
    swapping = null;
    syncRack(true);
    app.invalidate();
  }

  function pass() {
    if (!app.myTurn()) { refuse(describeTurn(state(), { me: app.me, nameOf: app.nameOf })); return; }
    undo();
    const error = app.act({ kind: ACTIONS.PASS, seat: mySeat() });
    if (error) { refuse(error); return; }
    syncRack(true);
    app.invalidate();
  }

  const RUN = { Play: play, Undo: undo, Mix: mix, Swap: () => (swapping ? commitSwap() : startSwap()), Pass: pass };

  
  
  

  function drawScores(g) {
    const s = state();
    const room = scoreBand.width;
    
    
    
    const chipW = Math.min(58, Math.max(44, (room - 120) / Math.max(1, s.seats.length)));
    let x = scoreBand.x;
    s.seats.forEach((id, seat) => {
      const you = id === app.me;
      const r = { x, y: scoreBand.y + 2, w: chipW, h: 30 };
      paint.chip(g, r, {
        initials: you ? 'You' : initialsOf(app.nameOf(id)),
        colour: app.colourOf(id),
        you: seat === s.turn && !s.over,
      });
      
      
      
      paint.text(g, String(s.scores[seat]), { x: x + chipW + 12, y: scoreBand.y + 2, w: 56, h: 30 }, {
        size: SIZES.base, colour: COLORS.ink, align: 'left', fit: true, maxWidth: 56,
      });
      x += chipW + 76;
    });
    paint.text(g, `Bag ${s.bag.length}`, {
      x: scoreBand.x, y: scoreBand.y + 2, width: scoreBand.width, height: 30,
    }, { size: SIZES.min, colour: COLORS.inkSoft, align: 'right' });
  }

  function drawBoard(g, now) {
    const s = state();
    const board = shown();
    const wobble = shakeAt >= 0 ? shake(progress(now, shakeAt, DURATION.shake, app.motion)) : 0;
    const freshSquares = new Set((s.last?.placed ?? []).map((p) => idx(p.row, p.col)));
    for (let i = 0; i < boardGrid.rects.length; i += 1) {
      const r = boardGrid.rects[i];
      const row = Math.floor(i / SIZE);
      const col = i % SIZE;
      const tile = board[i];
      const isPending = !!(tile && tile.pending);
      paint.square(g, { ...r, x: r.x + (isPending ? wobble : 0) }, {
        premium: premiumCharAt(row, col),
        tile: tile ? { letter: tile.letter, blank: tile.blank, value: VALUES[tile.letter] ?? 0 } : null,
        pending: isPending,
        fresh: !isPending && freshSquares.has(i),
        cursor: app.myTurn() && !swapping && cursor.row === row && cursor.col === col,
        cursorAxis: axis,
      });
    }
  }

  function drawStatus(g) {
    const v = verdict();
    const s = state();
    let line = app.message;
    if (!line && v) line = v.ok ? `${v.words.map((w) => w.word).join(' + ')} — ${v.score} points` : v.reason;
    if (!line) line = describeTurn(s, { me: app.me, nameOf: app.nameOf });
    const colour = v && !v.ok && pending.length ? COLORS.red : COLORS.ink;
    
    
    
    
    const lines = paint.wrap(g, line, statusBand.width - 8, { size: SIZES.base, weight: 700 }).slice(0, 2);
    lines.forEach((text, i) => {
      paint.text(g, text, {
        x: statusBand.x, y: statusBand.y + i * 26, width: statusBand.width, height: 26,
      }, { size: SIZES.base, colour, align: 'left', fit: true, maxWidth: statusBand.width });
    });
    
    
    
    if (lines.length < 2 && !swapping) {
      paint.text(g, describeSquare(s.board, cursor.row, cursor.col), {
        x: statusBand.x, y: statusBand.y + 26, width: statusBand.width, height: 24,
      }, { size: SIZES.min, colour: COLORS.inkSoft, align: 'left', fit: true, maxWidth: statusBand.width });
    }
  }

  function drawRack(g, now) {
    rackGrid.rects.forEach((r, i) => {
      const tile = slots[i];
      if (!tile) {
        
        
        
        g.save();
        g.globalAlpha = 0.45;
        paint.surface(g, r, { fill: COLORS.paper, offset: 0, border: 2 });
        g.restore();
        return;
      }
      const up = i === hoverRack ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0;
      paint.rackTile(g, r, {
        ch: tile.letter === BLANK ? '' : tile.letter,
        value: tile.letter === BLANK ? null : VALUES[tile.letter],
        blank: tile.letter === BLANK,
        lift: up,
        chosen: i === chosen,
        marked: !!swapping && swapping.has(i),
      });
    });
  }

  function drawButtons(g, now) {
    const s = state();
    buttons.rects.forEach((r, i) => {
      const label = r.label;
      const disabled = s.over
        || (!app.myTurn() && label !== 'Mix' && label !== 'Undo')
        || (label === 'Swap' && !canExchange(s) && !swapping);
      const up = i === hoverButton ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0;
      const down = i === pressButton ? sink(progress(now, pressAt, DURATION.press, app.motion), app.motion) : 0;
      paint.button(g, r, {
        label: swapping && label === 'Swap' ? 'Swap!' : label,
        hover: up,
        press: down,
        disabled,
        
        
        tone: label === 'Play' && !disabled && pending.length ? 'green' : null,
      });
    });
  }

  function draw(g, now) {
    drawScores(g);
    drawBoard(g, now);
    drawStatus(g);
    drawRack(g, now);
    drawButtons(g, now);
    if (dragging) {
      
      
      const size = rackGrid.cell;
      const tile = slots[dragging.slot];
      if (tile) {
        paint.rackTile(g, { x: dragging.x - size / 2, y: dragging.y - size - 8, w: size, h: size }, {
          ch: tile.letter === BLANK ? '' : tile.letter,
          value: tile.letter === BLANK ? null : VALUES[tile.letter],
          blank: tile.letter === BLANK,
          lift: 4,
        });
      }
    }
  }

  
  
  

  const squareIndexAt = (pt) => rectAtLoose(boardGrid.rects, pt.x, pt.y, 1);

  function pointerDown(pt) {
    syncRack();
    downAt = pt;
    const rack = rectAt(rackGrid.rects, pt.x, pt.y);
    if (rack >= 0 && slots[rack]) { dragging = null; app.invalidate(); return; }
    const button = rectAt(buttons.rects, pt.x, pt.y);
    if (button >= 0) { pressButton = button; pressAt = app.now(); app.invalidate(); }
  }

  function pointerMove(pt) {
    const rack = rectAt(rackGrid.rects, pt.x, pt.y);
    const button = rectAt(buttons.rects, pt.x, pt.y);
    if (rack !== hoverRack || button !== hoverButton) {
      hoverRack = rack;
      hoverButton = button;
      hoverAt = app.now();
      app.invalidate();
    }
    if (!downAt) return;
    const from = rectAt(rackGrid.rects, downAt.x, downAt.y);
    if (from >= 0 && slots[from] && (dragging || isDrag(downAt, pt, DRAG_SLOP))) {
      dragging = { slot: from, x: pt.x, y: pt.y };
      app.invalidate();
    }
  }

  function pointerUp(pt) {
    const wasDragging = dragging;
    const from = downAt;
    dragging = null;
    downAt = null;
    const button = rectAt(buttons.rects, pt.x, pt.y);
    const wasPressed = pressButton;
    pressButton = -1;

    if (wasDragging) {
      const square = squareIndexAt(pt);
      if (square >= 0) lay(wasDragging.slot, Math.floor(square / SIZE), square % SIZE);
      app.invalidate();
      return;
    }
    if (button >= 0 && button === wasPressed) {
      const label = buttons.rects[button].label;
      (RUN[label] ?? (() => {}))();
      return;
    }
    const rack = rectAt(rackGrid.rects, pt.x, pt.y);
    if (rack >= 0 && from && rectAt(rackGrid.rects, from.x, from.y) === rack) {
      if (swapping) toggleSwap(rack);
      else if (slots[rack]) chosen = chosen === rack ? -1 : rack;
      app.invalidate();
      return;
    }
    const square = squareIndexAt(pt);
    if (square >= 0) {
      const row = Math.floor(square / SIZE);
      const col = square % SIZE;
      if (pickUp(row, col)) return;
      if (chosen >= 0 && slots[chosen]) { lay(chosen, row, col); return; }
      
      
      
      if (cursor.row === row && cursor.col === col) {
        axis = axis === 'across' ? 'down' : 'across';
        app.announce(`Typing ${axis} from ${coordOf(row, col)}.`);
      } else {
        cursor = { row, col };
      }
      app.message = '';
      app.invalidate();
    }
  }

  function pointerLeave() {
    hoverRack = -1;
    hoverButton = -1;
    dragging = null;
    downAt = null;
    app.invalidate();
  }

  
  
  

  function key(action) {
    syncRack();
    if (action.type === 'letter') { typeLetter(action.value); return true; }
    if (action.type === 'delete') { backspace(); return true; }
    if (action.type === 'submit') { play(); return true; }
    if (action.type === 'move') {
      app.keyboardMode = true;
      const row = Math.max(0, Math.min(SIZE - 1, cursor.row + action.dy));
      const col = Math.max(0, Math.min(SIZE - 1, cursor.col + action.dx));
      
      
      
      if (action.dx) axis = 'across';
      if (action.dy) axis = 'down';
      cursor = { row, col };
      app.message = '';
      app.invalidate();
      return true;
    }
    return false;
  }

  

  return {
    id: 'board',
    layout,
    draw,
    pointerDown,
    pointerMove,
    pointerUp,
    pointerLeave,
    key,
    
    reload: () => { syncRack(); app.invalidate(); },
    
    pending: () => pending,
    rects: () => [
      ...boardGrid.rects.map((r, i) => ({ id: `sq:${Math.floor(i / SIZE)}:${i % SIZE}`, ...r })),
      ...rackGrid.rects.map((r, i) => ({ id: `rack:${i}`, ...r })),
      ...buttons.rects.map((r) => ({ id: `btn:${r.label}`, ...r })),
    ],
    describe: () => describeMatch(state(), {
      me: app.me,
      nameOf: app.nameOf,
      pending,
      verdict: verdict(),
      cursor,
      message: app.message,
    }),
    animating: (now) => app.motion && (
      (shakeAt >= 0 && now - shakeAt < DURATION.shake)
      || now - hoverAt < DURATION.hover
      || now - pressAt < DURATION.press
    ),
    keys: 'Arrow keys move the cursor. Type letters to lay tiles, Backspace takes one back, Enter plays the word.',
    
    
    
    
    
    
    
    help: [
      'Make words on the board, like the box game.',
      'Type where the blue ring is, drag a tile from your rack, or tap a tile and then tap a square.',
      'Tap the square you are on again to turn the word from across to down.',
      'Your first word goes through the star in the middle. After that every word must touch one already there.',
      'Play scores the word. Undo takes your tiles back, Mix shuffles your rack, Swap changes tiles, Pass gives up the turn.',
      'Use all seven tiles in one go for fifty extra points. There is no clock - take as long as you like.',
    ],
  };
}
