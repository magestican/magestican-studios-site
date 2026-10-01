


















import { COLORS, SIZES } from '../../../web-engine/words/style.js';
import { grid, rectAt } from '../../../web-engine/words/layout.js';
import { progress, lift, sink, DURATION } from '../../../web-engine/words/motion.js';
import {
  CODE_ALPHABET, normaliseCode, spokenCode, SAYINGS,
} from '../../../web-engine/words/coop.js';
import { QUEEN, ROOK, BISHOP, KNIGHT } from '../../../web-engine/chess/position.js';
import * as paint from './paint.js';


function card(app, {
  title,
  lines = () => [],
  buttons = () => [],
  columns = 1,
  onKey = () => false,
  describe = () => ({ status: '', lines: [] }),
  id = 'panel',
}) {
  let box = { x: 0, y: 0, w: 0, h: 0 };
  let rects = [];
  let hover = -1;
  let hoverAt = 0;
  let press = -1;
  let pressAt = 0;
  let current = [];
  
  let body = [];

  function layout() {
    current = buttons();
    const gridItems = current.filter((b) => !b.wide);
    const wideItems = current.filter((b) => b.wide);
    const width = Math.min(560, app.width - 32);
    const rows = Math.ceil(gridItems.length / columns);
    
    
    
    
    
    body = [];
    for (const line of lines()) {
      for (const wrapped of app.wrap(line, width - 32, { size: SIZES.small, weight: 400 })) {
        body.push(wrapped);
      }
      body.push('');
    }
    if (body.length) body.pop();
    const bodyHeight = body.reduce((n, l) => n + (l ? 26 : 10), 0);
    const buttonsHeight = rows * SIZES.target + (rows - 1) * 8
      + wideItems.length * (SIZES.target + 8);
    const height = Math.min(app.height - 24, 70 + bodyHeight + buttonsHeight + 20);
    box = {
      x: Math.round((app.width - width) / 2),
      y: Math.round((app.height - height) / 2),
      w: width,
      h: height,
    };
    const gridHeight = rows * SIZES.target + (rows - 1) * 8;
    const gridTop = box.y + box.h - buttonsHeight - 16;
    const laid = grid({
      box: { x: box.x + 16, y: gridTop, width: box.w - 32, height: gridHeight },
      cols: columns,
      rows,
      gap: 8,
      min: SIZES.target,
      maxCell: columns > 3 ? 64 : 999,
    });
    rects = laid.rects.slice(0, gridItems.length).map((r, i) => ({ ...r, ...gridItems[i] }));
    if (columns === 1) {
      rects = rects.map((r) => ({ ...r, x: box.x + 16, w: box.w - 32 }));
    }
    let y = gridTop + gridHeight + (rows ? 8 : 0);
    for (const item of wideItems) {
      rects.push({ x: box.x + 16, y, w: box.w - 32, h: SIZES.target, ...item });
      y += SIZES.target + 8;
    }
  }

  return {
    id,
    layout,
    draw(g, now) {
      paint.scrim(g, app.width, app.height);
      paint.surface(g, box, { fill: COLORS.card });
      paint.text(g, title(), { x: box.x + 16, y: box.y + 12, w: box.w - 32, h: 40 }, {
        size: SIZES.h2, colour: COLORS.ink, fit: true, maxWidth: box.w - 32,
      });
      let y = box.y + 56;
      const bottom = rects.length ? rects[0].y - 8 : box.y + box.h - 12;
      for (const wrapped of body) {
        if (!wrapped) { y += 10; continue; }
        if (y + 24 > bottom) break;
        paint.text(g, wrapped, { x: box.x + 16, y, w: box.w - 32, h: 24 }, {
          size: SIZES.small, weight: 400, colour: COLORS.ink, align: 'left',
        });
        y += 26;
      }
      rects.forEach((r, i) => {
        const pressed = i === press ? sink(progress(now, pressAt, DURATION.press, app.motion), app.motion) : 0;
        paint.button(g, r, {
          label: r.label,
          tone: r.tone ?? null,
          disabled: !!r.disabled,
          size: SIZES.min,
          hover: i === hover ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0,
          press: pressed,
        });
        
        
        
        
        if (r.piece) {
          const s = Math.min(r.h - 8, 40);
          paint.chip(g, { x: r.x + 8, y: r.y + (r.h - s) / 2 + pressed, w: s, h: s }, r.piece);
        }
      });
    },
    pointerMove(pt) {
      const i = rectAt(rects, pt.x, pt.y);
      if (i !== hover) { hover = i; hoverAt = app.now(); app.invalidate(); }
    },
    pointerDown(pt) {
      press = rectAt(rects, pt.x, pt.y);
      pressAt = app.now();
      app.invalidate();
    },
    pointerUp(pt) {
      const i = rectAt(rects, pt.x, pt.y);
      const was = press;
      press = -1;
      app.invalidate();
      if (i >= 0 && i === was && !rects[i].disabled) rects[i].run?.();
    },
    pointerLeave() { hover = -1; press = -1; app.invalidate(); },
    key(action) {
      if (onKey(action)) { layout(); app.invalidate(); return true; }
      if (action.type === 'move') {
        const usable = rects.filter((r) => !r.disabled);
        if (!usable.length) return true;
        const at = usable.indexOf(rects[hover]);
        const next = Math.max(0, Math.min(usable.length - 1, (at < 0 ? 0 : at) + (action.dy || action.dx || 0)));
        hover = rects.indexOf(usable[next]);
        hoverAt = app.now();
        app.invalidate();
        return true;
      }
      if (action.type === 'submit') {
        const chosen = hover >= 0 && !rects[hover]?.disabled ? rects[hover] : rects.find((r) => !r.disabled);
        chosen?.run?.();
        return true;
      }
      return false;
    },
    rects: () => rects.map((r) => ({ id: `panel:${r.id}`, x: r.x, y: r.y, w: r.w, h: r.h })),
    describe: () => {
      const d = describe();
      return {
        title: title(),
        status: d.status ?? '',
        lines: [...lines(), ...(d.lines ?? []), ...rects.map((r) => `Button: ${r.label}`)],
      };
    },
    animating: (now) => app.motion && (now - hoverAt < DURATION.hover || now - pressAt < DURATION.press),
    
    refresh: layout,
  };
}


export function help(app, { onClose }) {
  return card(app, {
    id: 'help',
    title: () => 'How to play Farmy Chess',
    lines: () => [
      'Press a piece to pick it up. Every square it may go to is marked: a green dot for an empty square, a red ring round a piece you can take.',
      'Press the square you want. If a move is not allowed, the game says why in words rather than doing nothing.',
      'The gold corners show the move that was just played. A red cross over a king means it is in check.',
      'White pieces are drawn hollow with a heavy outline; black pieces are solid. That is on purpose, so the two sides are told apart by shape and not only by colour.',
      'A pawn that reaches the far end becomes a queen, a rook, a bishop or a knight - you choose.',
      'Nothing here is timed. Take a week over a move if you like.',
      'Arrow keys move a marker around the board and Enter picks a piece up or puts it down. Press U to take a move back, and ? for this.',
    ],
    buttons: () => [{ id: 'close', label: 'Close', tone: 'blue', run: onClose }],
    describe: () => ({ status: 'How to play.' }),
  });
}










export function promotion(app, { onPick, onCancel, white = true }) {
  const sign = white ? 1 : -1;
  return card(app, {
    id: 'promotion',
    title: () => 'Your pawn has got to the end',
    lines: () => ['Choose what it becomes. A queen nearly always - the others are here because they are sometimes right.'],
    buttons: () => [
      { id: 'promo:q', label: 'Queen', piece: QUEEN * sign, tone: 'blue', run: () => onPick('q') },
      { id: 'promo:r', label: 'Rook', piece: ROOK * sign, run: () => onPick('r') },
      { id: 'promo:b', label: 'Bishop', piece: BISHOP * sign, run: () => onPick('b') },
      { id: 'promo:n', label: 'Knight', piece: KNIGHT * sign, run: () => onPick('n') },
      { id: 'cancel', label: 'Put the pawn back', wide: true, run: onCancel },
    ],
    onKey: (action) => {
      if (action.type === 'letter') {
        const at = { Q: 'q', R: 'r', B: 'b', N: 'n' }[String(action.value).toUpperCase()];
        if (at) { onPick(at); return true; }
      }
      if (action.type === 'back') { onCancel(); return true; }
      return false;
    },
    describe: () => ({ status: 'Choose what your pawn becomes: queen, rook, bishop or knight.' }),
  });
}








export function sides(app, { state, onChoose, onClose }) {
  return card(app, {
    id: 'sides',
    title: () => 'Start a game',
    lines: () => [
      state.botLine,
      'Choosing a side starts a new game.',
    ],
    buttons: () => [
      { id: 'side:white', label: 'Play a bot, you are White', tone: 'green', run: () => onChoose({ bot: true, white: true }) },
      { id: 'side:black', label: 'Play a bot, you are Black', run: () => onChoose({ bot: true, white: false }) },
      { id: 'side:two', label: 'Two people at this screen', run: () => onChoose({ bot: false, white: true }) },
      { id: 'close', label: 'Not now', run: onClose },
    ],
    describe: () => ({ status: 'Choose a side, and whether to play the bot.' }),
  });
}










export function room(app, {
  state, onHost, onJoin, onLeave, onCopy, onClose,
}) {
  let typed = '';
  const typeChar = (ch) => {
    if (ch === '' || !CODE_ALPHABET.includes(ch)) {
      
      
      
      app.announce(`${ch} is never in a code.`);
      return true;
    }
    typed = (typed + ch).slice(0, 6);
    return true;
  };
  return card(app, {
    id: 'room',
    title: () => (state.active ? 'Playing together' : 'Play with somebody'),
    lines: () => {
      if (!state.active) {
        return [
          'Open a room and send the link, or read the six-character code down the telephone.',
          'Two people take turns on one board. Nothing is timed, and nothing is sent to a server - the browsers talk to each other.',
          'Whoever joins takes the empty chair, or takes over from the bot if the bot has it.',
        ];
      }
      const code = spokenCode(state.code);
      return [
        code ? `Your code is ${code.split('').join(' ')}` : 'Opening a room...',
        state.summary,
        state.status,
        ...(typed ? [`Joining: ${typed}`] : ['Type a code to join somebody else instead.']),
        ...state.who,
      ].filter(Boolean);
    },
    buttons: () => (state.active
      ? [
        { id: 'copy', label: state.copied ? 'Link copied' : 'Copy the link', tone: 'blue', run: onCopy },
        ...(typed.length === 6 ? [{ id: 'join', label: `Join ${typed}`, run: () => onJoin(normaliseCode(typed)) }] : []),
        { id: 'leave', label: 'Leave the room', run: onLeave },
        { id: 'close', label: 'Back to the board', run: onClose },
      ]
      : [
        { id: 'host', label: 'Open a room', tone: 'green', run: onHost },
        ...(typed.length === 6 ? [{ id: 'join', label: `Join ${typed}`, tone: 'blue', run: () => onJoin(normaliseCode(typed)) }] : []),
        { id: 'close', label: 'Not now', run: onClose },
      ]),
    onKey: (action) => {
      if (action.type === 'letter' || action.type === 'choose') return typeChar(String(action.value).toUpperCase());
      if (action.type === 'delete') { typed = typed.slice(0, -1); return true; }
      return false;
    },
    describe: () => ({
      status: state.active
        ? `Room open. The code is ${spokenCode(state.code).split('').join(' ')}.`
        : 'Open a room, or type a code to join one.',
    }),
  });
}


export function say(app, { onSay, onClose }) {
  return card(app, {
    id: 'say',
    title: () => 'Say something',
    lines: () => ['One tap. There is no typing and nothing to spell.'],
    buttons: () => [
      ...SAYINGS.map((s) => ({ id: `say:${s.id}`, label: s.text, run: () => onSay(s.id) })),
      { id: 'close', label: 'Close', run: onClose },
    ],
    describe: () => ({ status: 'Say something to the room.' }),
  });
}


export function results(app, { state, onAgain, onSwap, onClose }) {
  return card(app, {
    id: 'results',
    title: () => 'That is the game',
    lines: () => [state.summary, state.detail].filter(Boolean),
    buttons: () => [
      { id: 'again', label: 'Play again', tone: 'green', run: onAgain },
      { id: 'swap', label: 'Play again, other colour', run: onSwap },
      { id: 'close', label: 'Look at the board', run: onClose },
    ],
    describe: () => ({ status: state.summary }),
  });
}


export function menu(app, { items }) {
  return card(app, {
    id: 'menu',
    title: () => 'Farmy Chess',
    lines: () => [],
    buttons: () => items,
    describe: () => ({ status: 'The menu.' }),
  });
}


export function moves(app, { state, onClose }) {
  return card(app, {
    id: 'moves',
    title: () => 'The moves so far',
    lines: () => (state.rows.length ? state.rows : ['Nothing has been played yet.']),
    buttons: () => [{ id: 'close', label: 'Close', tone: 'blue', run: onClose }],
    describe: () => ({ status: 'The move list.' }),
  });
}
