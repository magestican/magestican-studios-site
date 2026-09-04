

















import { COLORS, SIZES } from '../../../web-engine/words/style.js';
import { grid, rectAt } from '../../../web-engine/words/layout.js';
import { progress, lift, sink, DURATION } from '../../../web-engine/words/motion.js';
import {
  CODE_ALPHABET, normaliseCode, spokenCode, SAYINGS,
} from '../../../web-engine/words/coop.js';
import { VALUES } from '../../../web-engine/words/scrabbleRules.js';
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
        paint.button(g, r, {
          label: r.label,
          tone: r.tone ?? null,
          disabled: !!r.disabled,
          size: columns > 3 ? SIZES.base : SIZES.min,
          hover: i === hover ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0,
          press: i === press ? sink(progress(now, pressAt, DURATION.press, app.motion), app.motion) : 0,
        });
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
      if (action.type === 'submit') {
        const first = rects.find((r) => !r.disabled);
        first?.run?.();
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


export function help(app, { lines, keys, onClose }) {
  return card(app, {
    id: 'help',
    title: () => 'How to play Farmy Scrabble',
    lines: () => [...lines, keys],
    buttons: () => [{ id: 'close', label: 'Close', tone: 'blue', run: onClose }],
    describe: () => ({ status: 'How to play.' }),
  });
}


export function values(app, { onClose }) {
  const row = (letters) => letters.map((l) => `${l} ${VALUES[l]}`).join('   ');
  return card(app, {
    id: 'values',
    title: () => 'Tiles and squares',
    lines: () => [
      row(['A', 'B', 'C', 'D', 'E', 'F', 'G']),
      row(['H', 'I', 'J', 'K', 'L', 'M', 'N']),
      row(['O', 'P', 'Q', 'R', 'S', 'T', 'U']),
      row(['V', 'W', 'X', 'Y', 'Z']),
      'A plain tile with a black dot is a blank. It can be any letter and is worth nothing, on the turn you lay it and for ever after.',
      'Red star: the whole word counts three times. Gold circle: twice.',
      'Blue triangle: that one letter counts three times. Green diamond: twice.',
      'A coloured square only counts on the turn a tile covers it.',
    ],
    buttons: () => [{ id: 'close', label: 'Close', tone: 'blue', run: onClose }],
    describe: () => ({ status: 'The tile values.' }),
  });
}









export function letters(app, { onPick, onCancel }) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  return card(app, {
    id: 'letters',
    columns: 6,
    title: () => 'What is the blank?',
    lines: () => ['Choose a letter, or just type one. A blank is worth nothing whatever you make it.'],
    buttons: () => [
      ...alphabet.map((l) => ({ id: `letter:${l}`, label: l, run: () => onPick(l) })),
      { id: 'cancel', label: 'Cancel', wide: true, run: onCancel },
    ],
    onKey: (action) => {
      if (action.type === 'letter') { onPick(action.value); return true; }
      if (action.type === 'back') { onCancel(); return true; }
      return false;
    },
    describe: () => ({ status: 'Choose a letter for the blank.' }),
  });
}










export function room(app, {
  state, onHost, onJoin, onLeave, onCopy, onClose, onStart,
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
          'Two to four people take turns on one board. Nothing is timed, and nothing is sent to a server - the browsers talk to each other.',
        ];
      }
      const code = spokenCode(state.code);
      return [
        code ? `Your code is ${code.split('').join(' ')}` : 'Opening a room...',
        state.summary,
        state.status,
        ...(typed ? [`Joining: ${typed}`] : ['Type a code to join somebody else instead.']),
        ...state.who.map((w) => `${w.you ? 'You' : w.name}${w.score !== undefined ? ` - ${w.score}` : ''}`),
      ].filter(Boolean);
    },
    buttons: () => (state.active
      ? [
        { id: 'copy', label: state.copied ? 'Link copied' : 'Copy the link', tone: 'blue', run: onCopy },
        ...(state.canStart ? [{ id: 'start', label: 'Start a new game with everybody', tone: 'green', run: onStart }] : []),
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


export function results(app, { state, onAgain, onClose }) {
  return card(app, {
    id: 'results',
    title: () => 'That is the game',
    lines: () => [state.summary, ...state.rows],
    buttons: () => [
      { id: 'again', label: 'Play again', tone: 'green', run: onAgain },
      { id: 'close', label: 'Look at the board', run: onClose },
    ],
    describe: () => ({ status: state.summary }),
  });
}










export function bots(app, { state, onAdd, onRemove, onClose }) {
  return card(app, {
    id: 'bots',
    title: () => 'Bots',
    lines: () => [
      state.summary,
      ...state.rows.map((b) => `${b.name} - ${b.kind}${b.score ? ` - ${b.score} points` : ''}`),
      state.guest
        ? 'Only the person who opened the room can change the bots.'
        : (state.started
          ? 'Adding or removing a bot deals a new game, because everybody’s tiles come out of one bag.'
          : 'One bot plays as well as you do. Any others are there for company.'),
    ],
    buttons: () => [
      {
        id: 'add',
        label: state.canAdd
          ? (state.started ? 'Add a bot and start again' : 'Add a bot')
          : (state.guest ? 'The host chooses the bots' : 'The table is full'),
        tone: state.canAdd ? 'green' : null,
        disabled: !state.canAdd,
        run: onAdd,
      },
      ...(state.rows.length && !state.guest
        ? [{ id: 'remove', label: state.started ? 'Take one away and start again' : 'Take one away', run: onRemove }]
        : []),
      { id: 'close', label: 'Back to the board', run: onClose },
    ],
    describe: () => ({ status: state.summary }),
  });
}


export function menu(app, { items }) {
  return card(app, {
    id: 'menu',
    title: () => 'Farmy Scrabble',
    lines: () => [],
    buttons: () => items,
    describe: () => ({ status: 'The menu.' }),
  });
}
