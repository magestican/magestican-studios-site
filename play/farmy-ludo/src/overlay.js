

















import { COLORS, SIZES } from '../../../web-engine/words/style.js';
import { rectAt } from '../../../web-engine/words/layout.js';
import { DURATION, easeOut, lift, progress } from '../../../web-engine/words/motion.js';
import { CODE_LENGTH, spokenCode } from '../../../web-engine/words/coop.js';
import { SAYINGS } from '../../../web-engine/board/ludoRoom.js';
import * as paint from './paint.js';

const PAD = 20;
const ROW = 56;          
const LINE = 27;











function makePanel(app, {
  id, title, body = () => [], buttons = () => [], extra = 0,
  drawExtra = null, onKey = null, onClose = null, mirror = () => [],
}) {
  
  
  
  
  
  const extraOf = () => (typeof extra === 'function' ? extra() : extra);
  let card = { x: 0, y: 0, w: 0, h: 0 };
  let rows = [];
  let lines = [];
  let hover = -1;
  let hoverAt = 0;
  let pressed = -1;
  let extraBox = { x: 0, y: 0, w: 0, h: 0 };
  const born = app.now();

  function layout() {
    const w = Math.min(560, app.width - 24);
    const inner = w - PAD * 2;
    lines = body(inner);
    const list = buttons();
    const room = extraOf();
    const needed = 52 + lines.length * LINE + room + list.length * (ROW + 10) + PAD * 2;
    const h = Math.min(app.height - 24, needed);
    card = {
      x: Math.round((app.width - w) / 2),
      y: Math.round((app.height - h) / 2),
      w,
      h,
    };
    let y = card.y + PAD + 52 + lines.length * LINE;
    extraBox = { x: card.x + PAD, y, w: inner, h: room };
    y += room;
    rows = list.map((b, i) => ({
      ...b,
      
      
      
      
      id: `panel:${b.id}`,
      x: card.x + PAD,
      y: y + i * (ROW + 10),
      w: inner,
      h: ROW,
    }));
  }

  function draw(g, now) {
    const p = progress(now, born, DURATION.fade, app.motion);
    paint.scrim(g, app.width, app.height, 0.86 * easeOut(p));
    paint.surface(g, card, { fill: COLORS.card, offset: SIZES.shadow + 2, radius: 12 });
    paint.text(g, title, { x: card.x + PAD, y: card.y + PAD, w: card.w - PAD * 2, h: 40 },
      { size: SIZES.h2, align: 'left', fit: true, maxWidth: card.w - PAD * 2 });
    lines.forEach((line, i) => {
      
      
      
      
      
      
      paint.text(g, line,
        { x: card.x + PAD, y: card.y + PAD + 50 + i * LINE, w: card.w - PAD * 2, h: LINE },
        {
          size: SIZES.min, weight: 400, colour: COLORS.inkSoft, align: 'left',
          fit: true, maxWidth: card.w - PAD * 2,
        });
    });
    if (drawExtra) drawExtra(g, extraBox, now);
    rows.forEach((b, i) => {
      paint.button(g, b, {
        label: b.label,
        tone: b.tone ?? null,
        disabled: !!b.disabled,
        hover: i === hover ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0,
        press: i === pressed ? 2 : 0,
      });
    });
  }

  return {
    id,
    layout,
    draw,
    animating: (now) => now - born < DURATION.fade,
    rects: () => rows.map((b) => ({ id: b.id, x: b.x, y: b.y, w: b.w, h: b.h })),
    describe: () => ({
      title: `Farmy Ludo - ${title}`,
      status: '',
      lines: [...lines, ...mirror(), ...rows.map((b) => `Button: ${b.label}`)],
    }),
    pointerDown(pt) { pressed = rectAt(rows, pt.x, pt.y); app.invalidate(); },
    pointerMove(pt) {
      const at = rectAt(rows, pt.x, pt.y);
      if (at !== hover) { hover = at; hoverAt = app.now(); app.invalidate(); }
    },
    pointerUp(pt) {
      const at = rectAt(rows, pt.x, pt.y);
      pressed = -1;
      if (at >= 0 && !rows[at].disabled) rows[at].run();
      else if (at < 0 && !inside(card, pt) && onClose) onClose();
      app.invalidate();
    },
    pointerLeave() { hover = -1; pressed = -1; app.invalidate(); },
    key(action) {
      if (onKey && onKey(action)) return;
      if (action.type === 'back') { if (onClose) onClose(); return; }
      if (action.type === 'move') {
        const usable = rows.filter((b) => !b.disabled);
        if (!usable.length) return;
        const here = hover < 0 ? -1 : usable.indexOf(rows[hover]);
        const next = (here + action.value + usable.length + 1) % usable.length;
        hover = rows.indexOf(usable[next]);
        hoverAt = app.now();
        app.invalidate();
        return;
      }
      if (action.type === 'enter' && hover >= 0 && !rows[hover].disabled) rows[hover].run();
    },
    
    relayout: layout,
  };
}

const inside = (r, pt) => pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h;


export function help(app, { onClose }) {
  return makePanel(app, {
    id: 'help',
    title: 'How to play Farmy Ludo',
    onClose,
    body: (w) => [
      'Four farm teams race four pieces each round the board and home.',
      'You need a SIX to bring a piece out of its yard.',
      'A six gives you another roll. Three sixes in a row loses the turn.',
      'Land on a single opponent and it goes back to its yard.',
      'Two pieces on one square make a block. Nothing may land on it.',
      'A square with a star on it is safe - nothing is taken there.',
      'You need the exact number to go home. Four home wins.',
      'Nothing is on a clock. There is no timer anywhere in this game.',
      'Each team is a SHAPE as well as a colour: round sheep, three-sided geese, '
      + 'square pigs, diamond cows. You never need the colour.',
      app.keys,
    ].flatMap((line) => paint.wrap(app.g, line, w)),
    buttons: () => [{ id: 'close', label: 'Close', run: onClose }],
  });
}


export function menu(app, { items, onClose }) {
  return makePanel(app, {
    id: 'menu',
    title: 'Farmy Ludo',
    onClose,
    body: () => [],
    buttons: () => [...items, { id: 'close', label: 'Close', run: onClose }],
  });
}


export function say(app, { onSay, onClose }) {
  return makePanel(app, {
    id: 'say',
    title: 'Say something',
    onClose,
    body: (w) => paint.wrap(app.g,
      'Nobody types anything at anybody in this game. These are the phrases.', w),
    buttons: () => [
      ...SAYINGS.map((s) => ({ id: s.id, label: s.text, run: () => onSay(s.id) })),
      { id: 'close', label: 'Close', run: onClose },
    ],
  });
}











export function room(app, {
  state, onHost, onJoin, onCopy, onLeave, onClose,
}) {
  let typed = '';
  const CODE_H = 74;
  const WHO_H = 30;

  const panel = makePanel(app, {
    id: 'room',
    title: 'Play together',
    onClose,
    extra: () => (state.active ? CODE_H + 10 + WHO_H * 4 : CODE_H + 10 + WHO_H),
    body: (w) => (state.active
      ? paint.wrap(app.g, 'Read the code out, or send the link. Everybody plays on the same board, '
        + 'in the same room. Empty seats are played by the computer.', w)
      : paint.wrap(app.g, 'Open a room and send the link - or type a code somebody has read out to '
        + 'you. There is nothing to install and no account. You can type the code here, '
        + 'straight at this panel. O is never in a code, and neither is I, L, S, Z, B, Q, '
        + 'zero, one, two, five or eight.', w)),
    drawExtra(g, box) {
      if (state.active) {
        const code = spokenCode(state.code ?? '');
        paint.surface(g, { x: box.x, y: box.y, w: box.w, h: CODE_H },
          { fill: COLORS.paper, offset: 0 });
        paint.text(g, code || 'opening...', { x: box.x, y: box.y, w: box.w, h: CODE_H },
          { size: 44, colour: COLORS.blue, fit: true, maxWidth: box.w - 24 });
        state.who.slice(0, 4).forEach((r, i) => {
          paint.text(g, r.line, { x: box.x, y: box.y + CODE_H + 10 + i * WHO_H, w: box.w, h: WHO_H },
            { size: SIZES.min, weight: 400, colour: COLORS.ink, align: 'left' });
        });
        return;
      }
      
      
      const cw = Math.min(58, (box.w - 5 * 8) / CODE_LENGTH);
      const left = box.x + (box.w - (cw * CODE_LENGTH + 8 * (CODE_LENGTH - 1))) / 2;
      for (let i = 0; i < CODE_LENGTH; i += 1) {
        const r = { x: left + i * (cw + 8), y: box.y, w: cw, h: CODE_H };
        paint.surface(g, r, { fill: COLORS.paper, offset: 0 });
        paint.text(g, typed[i] ?? '', r, { size: 34, colour: COLORS.ink });
        if (i === typed.length) paint.focusRing(g, r, COLORS.blue, 3);
      }
      paint.text(g, 'Type the six characters. Case does not matter.',
        { x: box.x, y: box.y + CODE_H + 10, w: box.w, h: WHO_H },
        { size: SIZES.min, weight: 400, colour: COLORS.inkSoft, fit: true, maxWidth: box.w - 8 });
    },
    mirror: () => (state.active
      ? [`Room code: ${spokenCode(state.code ?? '') || 'still opening'}.`,
        ...state.who.map((r) => r.line)]
      : [`Code so far: ${typed || 'nothing typed'}.`]),
    buttons: () => (state.active
      ? [
        { id: 'copy', label: state.copied ? 'Link copied' : 'Copy the link', run: onCopy },
        { id: 'leave', label: 'Leave the room', run: onLeave },
        { id: 'close', label: 'Back to the board', run: onClose },
      ]
      : [
        { id: 'host', label: 'Open a room', tone: 'blue', run: onHost },
        {
          id: 'join',
          label: typed.length === CODE_LENGTH ? `Join ${typed}` : 'Join with a code',
          disabled: typed.length !== CODE_LENGTH,
          run: () => onJoin(typed),
        },
        { id: 'close', label: 'Not now', run: onClose },
      ]),
    onKey(action) {
      if (state.active) return false;
      if (action.type === 'letter' && typed.length < CODE_LENGTH) {
        typed += action.value;
        panel.relayout();
        app.invalidate();
        return true;
      }
      if (action.type === 'rub') {
        typed = typed.slice(0, -1);
        panel.relayout();
        app.invalidate();
        return true;
      }
      if (action.type === 'enter' && typed.length === CODE_LENGTH) { onJoin(typed); return true; }
      return false;
    },
  });
  
  
  panel.typing = () => !state.active;
  return panel;
}


export function results(app, { state, onAgain, onClose }) {
  return makePanel(app, {
    id: 'results',
    title: `${state.winnerName} win`,
    onClose,
    body: (w) => [
      ...paint.wrap(app.g, state.blurb, w),
      '',
      
      
      
      
      ...state.rows.flatMap((r) => paint.wrap(app.g, r.line, w)),
    ],
    buttons: () => [
      { id: 'again', label: 'Play again', tone: 'blue', run: onAgain },
      { id: 'close', label: 'Look at the board', run: onClose },
    ],
    mirror: () => state.rows.map((r) => r.line),
  });
}
