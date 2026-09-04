





























import { COLORS, SIZES } from '../../../web-engine/words/style.js';
import { rectAt } from '../../../web-engine/words/layout.js';
import { progress, lift, shake, DURATION } from '../../../web-engine/words/motion.js';
import {
  EMPTY, WHITE, NAMES, squareName, kindOf, sideOf, fileOf, rankOf,
} from '../../../web-engine/chess/position.js';
import { moveKey } from '../../../web-engine/chess/moves.js';
import { refuse } from '../../../web-engine/chess/outcome.js';
import { describeGame } from '../../../web-engine/chess/chessDescribe.js';
import * as paint from './paint.js';


const WIDE = 900;

const COLUMN = 300;














const MIN_CELL = 40;

export function create(app) {
  let box = { x: 0, y: 0, width: 0, height: 0 };
  
  let squares = [];
  let cell = 0;
  let boardBox = { x: 0, y: 0, w: 0, h: 0 };
  let controls = [];
  let plates = [];
  let listBox = null;
  let statusBox = { x: 0, y: 0, w: 0, h: 0 };
  let thinkBox = null;

  let selected = -1;
  let cursor = -1;
  let hoverSquare = -1;
  let hoverControl = -1;
  let hoverAt = 0;
  let dragging = false;
  let dragAt = null;
  let shakeAt = 0;

  const state = () => app.state();

  







  const flipped = () => app.orientation() === 'black';

  
  const placeOf = (sq) => (flipped()
    ? { col: 7 - fileOf(sq), row: 7 - rankOf(sq) }
    : { col: fileOf(sq), row: rankOf(sq) });

  function layout(next) {
    box = next;
    const wide = app.width >= WIDE;
    const pad = app.width < 520 ? 1 : 12;
    const columnW = wide ? COLUMN : 0;
    const availW = box.width - columnW - (wide ? 16 : 0) - pad * 2;
    
    const belowH = wide ? 56 : 112;
    const availH = box.height - belowH - pad;
    cell = Math.max(MIN_CELL, Math.floor(Math.min(availW, availH) / 8));
    const size = cell * 8;
    const left = Math.round(box.x + pad + Math.max(0, (availW - size) / 2));
    const top = Math.round(box.y + Math.max(0, (availH - size) / 2));
    boardBox = { x: left, y: top, w: size, h: size };

    squares = new Array(64);
    for (let sq = 0; sq < 64; sq += 1) {
      const { col, row } = placeOf(sq);
      squares[sq] = { x: left + col * cell, y: top + row * cell, w: cell, h: cell, sq };
    }

    statusBox = { x: box.x + pad, y: boardBox.y + size + 8, w: box.width - pad * 2, h: 40 };
    if (wide) statusBox = { ...statusBox, w: availW };

    
    
    
    
    
    
    
    
    const controlDefs = [
      { id: 'undo', label: wide ? 'Take a move back' : 'Take back' },
      { id: 'resign', label: 'Give up' },
      ...(wide ? [] : [{ id: 'moves', label: 'Moves' }]),
    ];
    controls = [];
    if (wide) {
      let y = box.y + 8 + 2 * (SIZES.target + 8) + 8;
      if (app.thinking() !== null) {
        thinkBox = { x: box.x + box.width - COLUMN, y, w: COLUMN, h: 14 };
        y += 26;
      } else {
        thinkBox = null;
      }
      listBox = {
        x: box.x + box.width - COLUMN,
        y,
        w: COLUMN,
        h: Math.max(80, box.y + box.height - y - (controlDefs.length * (SIZES.target + 8)) - 8),
      };
      let cy = listBox.y + listBox.h + 8;
      for (const c of controlDefs) {
        controls.push({ ...c, x: listBox.x, y: cy, w: COLUMN, h: SIZES.target });
        cy += SIZES.target + 8;
      }
      plates = [
        { x: box.x + box.width - COLUMN, y: box.y + 8, w: COLUMN, h: SIZES.target, seat: flipped() ? 0 : 1 },
        { x: box.x + box.width - COLUMN, y: box.y + 8 + SIZES.target + 8, w: COLUMN, h: SIZES.target, seat: flipped() ? 1 : 0 },
      ];
    } else {
      listBox = null;
      const gap = 8;
      const w = Math.floor((box.width - pad * 2 - gap * (controlDefs.length - 1)) / controlDefs.length);
      let cx = box.x + pad;
      const cy = statusBox.y + statusBox.h + 6;
      for (const c of controlDefs) {
        controls.push({ ...c, x: cx, y: cy, w, h: SIZES.target });
        cx += w + gap;
      }
      
      
      
      
      plates = [];
      thinkBox = app.thinking() !== null
        ? { x: box.x + pad, y: Math.max(box.y, boardBox.y - 18), w: box.width - pad * 2, h: 12 }
        : null;
    }
  }

  
  
  

  const squareAtPoint = (pt) => {
    const i = rectAt(squares, pt.x, pt.y);
    return i >= 0 ? squares[i].sq : -1;
  };

  const movesFromSelected = () => (selected < 0
    ? []
    : state().legal.filter((m) => m.from === selected));

  
  function tryMove(to) {
    const d = state();
    const options = movesFromSelected().filter((m) => m.to === to);
    if (!options.length) {
      
      
      
      const why = refuse(d.pos, selected, to);
      if (why) app.announce(why);
      shakeAt = app.now();
      return false;
    }
    if (options.length > 1 && options.every((m) => m.promo)) {
      
      
      
      const from = selected;
      app.choosePromotion(sideOf(d.pos.board[from]) === WHITE, (letter) => {
        selected = -1;
        app.play(`${squareName(from)}${squareName(to)}${letter}`);
      });
      return true;
    }
    const key = moveKey(options[0]);
    selected = -1;
    const error = app.play(key);
    if (error) shakeAt = app.now();
    return !error;
  }

  
  function pickUp(sq) {
    const d = state();
    const piece = d.pos.board[sq];
    if (piece === EMPTY) return false;
    if (sideOf(piece) !== d.turn) {
      app.announce(`${NAMES[kindOf(piece)]} on ${squareName(sq)} is not yours to move.`);
      return false;
    }
    if (!app.myTurn()) {
      app.announce(app.notYourTurn());
      return false;
    }
    selected = sq;
    cursor = sq;
    return true;
  }

  return {
    id: 'board',
    keys: 'Arrow keys move the marker. Enter picks a piece up and puts it down. U takes a move back. ? for help.',
    layout,
    reload() { selected = -1; },
    clearSelection() { selected = -1; },

    draw(g, now) {
      const d = state();
      
      
      
      
      const nudge = shake(progress(now, shakeAt, DURATION.shake, app.motion), 5);

      
      
      g.save();
      g.translate(nudge, 0);
      paint.boardFrame(g, boardBox);

      const legal = movesFromSelected();
      const targets = new Map(legal.map((m) => [m.to, m]));
      const checkSquare = d.check ? kingOf(d.pos, d.turn) : -1;

      for (let sq = 0; sq < 64; sq += 1) {
        const r = squares[sq];
        const dark = (fileOf(sq) + rankOf(sq)) % 2 === 1;
        paint.square(g, r, { dark });
        if (sq === d.lastFrom || sq === d.lastTo) paint.highlight(g, r, 'last', { dark });
        if (sq === checkSquare) paint.highlight(g, r, 'check', { dark });
        const { col, row } = placeOf(sq);
        
        
        
        
        if (row === 7) paint.coordinate(g, r, 'abcdefgh'[fileOf(sq)], { dark, at: 'bottom' });
        if (col === 0) paint.coordinate(g, r, String(8 - rankOf(sq)), { dark, at: 'top' });
      }

      const isDarkSquare = (sq) => (fileOf(sq) + rankOf(sq)) % 2 === 1;
      for (const [to, m] of targets) {
        paint.highlight(g, squares[to], m.captured ? 'capture' : 'move', { dark: isDarkSquare(to) });
      }
      if (selected >= 0) {
        paint.highlight(g, squares[selected], 'selected', { dark: isDarkSquare(selected) });
      }
      if (app.keyboardMode && cursor >= 0) {
        paint.highlight(g, squares[cursor], 'cursor', { dark: isDarkSquare(cursor) });
      }

      for (let sq = 0; sq < 64; sq += 1) {
        const code = d.pos.board[sq];
        if (!code) continue;
        if (dragging && sq === selected) continue;   
        const hovered = sq === hoverSquare && sideOf(code) === d.turn && app.myTurn();
        const rise = hovered
          ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion)
          : 0;
        paint.piece(g, squares[sq], code, { lift: sq === selected ? 3 : rise });
      }
      if (dragging && selected >= 0 && dragAt) {
        const code = d.pos.board[selected];
        paint.piece(g, {
          x: dragAt.x - cell / 2, y: dragAt.y - cell / 2, w: cell, h: cell,
        }, code, { lift: 6 });
      }
      g.restore();

      
      for (const p of plates) {
        const id = d.seats[p.seat];
        paint.seatPlate(g, p, {
          name: app.seatLabel(p.seat),
          white: p.seat === 0,
          turn: !d.over && d.turnId === id,
          bot: app.isBotSeat(id),
        });
      }
      if (thinkBox) paint.thinkingBar(g, thinkBox, app.thinking() ?? 0);
      if (listBox) drawList(g, d);

      paint.text(g, app.status(), statusBox, {
        size: SIZES.min, weight: 400, colour: COLORS.ink, align: 'left',
        fit: true, maxWidth: statusBox.w,
      });

      controls.forEach((c, i) => {
        paint.button(g, c, {
          label: c.label,
          size: SIZES.min,
          disabled: !!app.controlDisabled(c.id),
          hover: i === hoverControl
            ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion)
            : 0,
        });
      });
    },

    pointerDown(pt) {
      const control = rectAt(controls, pt.x, pt.y);
      if (control >= 0) return;                  
      const sq = squareAtPoint(pt);
      if (sq < 0) return;
      if (selected >= 0 && sq !== selected) {
        
        
        
        const mine = sideOf(state().pos.board[sq]) === state().turn;
        if (!mine) { tryMove(sq); app.invalidate(); return; }
      }
      if (pickUp(sq)) {
        dragging = true;
        dragAt = pt;
      } else {
        selected = -1;
      }
      app.invalidate();
    },

    pointerMove(pt) {
      const control = rectAt(controls, pt.x, pt.y);
      if (control !== hoverControl) { hoverControl = control; hoverAt = app.now(); app.invalidate(); }
      if (dragging) { dragAt = pt; app.invalidate(); return; }
      const sq = squareAtPoint(pt);
      if (sq !== hoverSquare) { hoverSquare = sq; hoverAt = app.now(); app.invalidate(); }
    },

    pointerUp(pt) {
      const control = rectAt(controls, pt.x, pt.y);
      if (control >= 0 && !app.controlDisabled(controls[control].id)) {
        app.control(controls[control].id);
        dragging = false;
        return;
      }
      const sq = squareAtPoint(pt);
      if (dragging) {
        dragging = false;
        dragAt = null;
        
        
        
        if (sq >= 0 && sq !== selected) tryMove(sq);
      }
      app.invalidate();
    },

    pointerLeave() {
      hoverSquare = -1;
      hoverControl = -1;
      if (dragging) { dragging = false; dragAt = null; }
      app.invalidate();
    },

    






    key(action) {
      const d = state();
      if (action.type === 'move') {
        if (cursor < 0) cursor = flipped() ? 3 : 60;
        const { col, row } = placeOf(cursor);
        const nextCol = Math.max(0, Math.min(7, col + (action.dx ?? 0)));
        const nextRow = Math.max(0, Math.min(7, row + (action.dy ?? 0)));
        cursor = flipped()
          ? (7 - nextRow) * 8 + (7 - nextCol)
          : nextRow * 8 + nextCol;
        app.invalidate();
        return true;
      }
      if (action.type === 'submit') {
        if (cursor < 0) return true;
        if (selected >= 0 && cursor !== selected) tryMove(cursor);
        else if (!pickUp(cursor)) selected = -1;
        app.invalidate();
        return true;
      }
      if (action.type === 'delete') { selected = -1; app.invalidate(); return true; }
      if (action.type === 'letter' && String(action.value).toUpperCase() === 'U') {
        app.control('undo');
        return true;
      }
      return false;
    },

    describe() {
      return describeGame({
        derived: state(),
        me: app.me,
        names: app.names(),
        selected,
        cursor: app.keyboardMode ? cursor : -1,
        message: app.message,
        bot: app.botLine(),
      });
    },

    animating: (now) => app.motion && (now - hoverAt < DURATION.hover || now - shakeAt < DURATION.shake),

    






    rects: () => [
      ...squares.map((r) => ({ id: `sq:${squareName(r.sq)}`, x: r.x, y: r.y, w: r.w, h: r.h })),
      ...controls.map((c) => ({ id: `control:${c.id}`, x: c.x, y: c.y, w: c.w, h: c.h })),
    ],
    get selected() { return selected; },
    get cursor() { return cursor; },
  };

  
  function drawList(g, d) {
    paint.surface(g, { ...listBox, w: listBox.w, h: listBox.h }, { fill: COLORS.card, offset: 0 });
    const rows = d.list.map((r) => `${r.number}. ${r.white}${r.black ? `   ${r.black}` : ''}`);
    const lineH = 26;
    const fits = Math.max(1, Math.floor((listBox.h - 92) / lineH));
    paint.text(g, 'Moves', { x: listBox.x + 12, y: listBox.y + 8, w: listBox.w - 24, h: 26 }, {
      size: SIZES.min, colour: COLORS.inkSoft, align: 'left',
    });
    
    
    const shown = rows.slice(-fits);
    shown.forEach((row, i) => {
      paint.text(g, row, {
        x: listBox.x + 12, y: listBox.y + 36 + i * lineH, w: listBox.w - 24, h: lineH,
      }, {
        size: SIZES.min, weight: 400, colour: COLORS.ink, align: 'left',
        fit: true, maxWidth: listBox.w - 24,
      });
    });
    
    
    
    
    
    
    const trayY = listBox.y + listBox.h - 34;
    paint.rule(g, listBox.x + 12, trayY - 10, listBox.w - 24);
    const tray = (list, x, mirrored) => {
      list.slice(0, 6).forEach((kind, i) => {
        paint.chip(g, { x: x + i * 24, y: trayY, w: 26, h: 26 }, mirrored ? -kind : kind);
      });
    };
    
    
    
    tray(d.captured.white, listBox.x + 12, true);
    tray(d.captured.black, listBox.x + listBox.w / 2, false);
  }
}


function kingOf(pos, side) {
  const want = side === WHITE ? 6 : -6;
  for (let i = 0; i < 64; i += 1) if (pos.board[i] === want) return i;
  return -1;
}
