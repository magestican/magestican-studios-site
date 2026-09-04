






import { COLORS, SIZES } from '../../../web-engine/words/style.js';
import { rectAt } from '../../../web-engine/words/layout.js';
import { progress, lift, DURATION } from '../../../web-engine/words/motion.js';
import {
  CODE_ALPHABET, CODE_LENGTH, normaliseCode, spokenCode, SAYINGS,
} from '../../../web-engine/words/coop.js';
import * as paint from './paint.js';
import { panelBox } from './overlay.js';




















export function room(app, {
  state, onHost, onJoin, onLeave, onCopy, onMode,
}) {
  let box = panelBox(app, !!state.active);
  let buttons = [];
  let hover = -1;
  let hoverAt = 0;
  let typed = '';
  let note = '';

  const complete = () => !!normaliseCode(typed);

  function layout() {
    box = panelBox(app, !!state.active);
    const w = Math.min(300, box.w - 44);
    const x = box.x + (box.w - w) / 2;
    const bottom = box.y + box.h - 20;
    const h = SIZES.target;
    
    
    
    
    
    
    
    
    
    buttons = state.active
      ? [
        
        
        
        
        
        
        { id: 'together', label: 'Together', x, y: box.y + 54, w: w / 2 - 4, h: h - 6 },
        { id: 'race', label: 'Race', x: x + w / 2 + 4, y: box.y + 54, w: w / 2 - 4, h: h - 6 },
        { id: 'copy', label: 'Copy the link', x, y: bottom - h * 3 - 24, w, h },
        { id: 'leave', label: 'Leave the room', x, y: bottom - h * 2 - 12, w, h },
        { id: 'close', label: 'Close', x, y: bottom - h, w, h },
      ]
      : [
        { id: 'host', label: 'Open a room', x, y: bottom - h * 3 - 24, w, h },
        { id: 'join', label: 'Join that room', x, y: bottom - h * 2 - 12, w, h },
        { id: 'close', label: 'Close', x, y: bottom - h, w, h },
      ];
  }

  
  function codeBox(g, y, text, caption, tone) {
    const rect = { x: box.x + 24, y, w: box.w - 48, h: 60 };
    paint.surface(g, rect, { fill: COLORS.paper, offset: 0 });
    paint.text(g, text, rect, {
      size: SIZES.h2, colour: tone ?? COLORS.ink, fit: true, maxWidth: rect.w - 20,
    });
    paint.text(g, caption, { x: box.x + 24, y: y + 64, width: box.w - 48, height: 24 },
      { size: SIZES.min, weight: 400, colour: COLORS.inkSoft, align: 'left',
        fit: true, maxWidth: box.w - 48 });
  }

  function draw(g, now) {
    paint.scrim(g, app.width, app.height);
    paint.surface(g, { x: box.x, y: box.y, w: box.w, h: box.h }, { fill: COLORS.card });
    paint.text(g, state.active ? 'Playing together' : 'Play together',
      { x: box.x, y: box.y + 16, width: box.w, height: 38 },
      { size: SIZES.h2, colour: COLORS.ink });

    
    
    
    
    
    const pad = 24;
    const width = box.w - pad * 2;
    const paragraphs = state.active
      ? [
        state.summary,
        state.mode === 'race'
          ? 'Racing: your own board, first to finish. Still no clock.'
          : 'Anybody with the link or the code joins this puzzle. You find the words between you.',
      ]
      : [
        'Open a room and send the link, or type in a code you were given.',
        'You then work the same puzzle together. Nothing is timed and nobody is racing.',
      ];

    
    
    
    
    
    
    
    
    const stack = buttons.filter((b) => b.y > box.y + box.h / 2);
    const limit = (stack.length ? Math.min(...stack.map((b) => b.y)) : box.y + box.h - 20) - 16;
    
    
    
    const codeTop = state.active
      ? Math.min(box.y + 150, Math.max(box.y + 110, limit - 250))
      : limit - 96;

    let y = box.y + (state.active ? 54 + SIZES.target + 4 : 62);
    for (const paragraph of paragraphs) {
      for (const line of paint.wrap(g, paragraph, width, { size: SIZES.min })) {
        if (y + 26 > codeTop - 8) break;
        paint.text(g, line, { x: box.x + pad, y, width, height: 26 },
          { size: SIZES.min, weight: 400, colour: COLORS.ink, align: 'left' });
        y += 26;
      }
      y += 12;
    }

    if (state.active) {
      
      
      
      
      codeBox(g, codeTop,
        state.code ? spokenCode(state.code) : '_ _ _ _ _ _',
        state.code
          ? (state.copied ? 'Link copied.' : 'Room code - read it out, or send the link')
          : 'Opening a room...',
        state.code ? COLORS.ink : COLORS.inkSoft);
      if (state.who.length) {
        
        
        
        
        
        
        
        paint.rule(g, box.x + pad, codeTop + 96, width);
        state.who.forEach((entry, i) => {
          const row = codeTop + 106 + i * 46;
          if (row + 42 > limit) return;
          const dot = { x: box.x + pad, y: row + 2, w: 22, h: 22 };
          paint.surface(g, dot, { fill: COLORS[entry.colour] ?? COLORS.slate, offset: 0 });
          paint.text(g, entry.you ? `${entry.name} (you)` : entry.name,
            { x: box.x + pad + 34, y: row, width: width - 34, height: 26 },
            { size: SIZES.min, weight: 700, colour: COLORS.ink, align: 'left',
              fit: true, maxWidth: width - 34 });
          paint.text(g, entry.where ?? '',
            { x: box.x + pad + 34, y: row + 22, width: width - 34, height: 22 },
            { size: SIZES.min, weight: 400, colour: COLORS.inkSoft, align: 'left',
              fit: true, maxWidth: width - 34 });
        });
      }
    } else {
      
      
      
      
      
      const slots = typed.padEnd(CODE_LENGTH, '_').split('').join(' ');
      codeBox(g, codeTop, slots,
        note || (complete() ? 'Press Enter, or Join that room.' : 'Type the code somebody gave you'),
        typed ? COLORS.ink : COLORS.inkSoft);
    }

    buttons.forEach((b, i) => {
      const off = b.id === 'join' && !complete();
      paint.button(g, b, {
        label: b.label,
        size: SIZES.min,
        tone: b.id === 'host' ? 'green'
          : ((b.id === 'together' && state.mode !== 'race') || (b.id === 'race' && state.mode === 'race') ? 'blue' : null),
        disabled: off,
        hover: hover === i && !off
          ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0,
      });
    });
  }

  
  function typeChar(ch) {
    if (state.active || typed.length >= CODE_LENGTH) return true;
    if (!CODE_ALPHABET.includes(ch)) {
      
      
      
      
      note = `${ch} is never in a code. Try again.`;
      app.invalidate();
      return true;
    }
    note = '';
    typed += ch;
    app.sound('press');
    app.invalidate();
    return true;
  }

  return {
    overlay: true,
    layout,
    draw,
    
    
    
    
    rects: () => buttons.map((b) => ({ ...b, id: `btn:${b.id}` })),
    pointerMove: (pt) => {
      const i = pt ? rectAt(buttons, pt.x, pt.y) : -1;
      if (i !== hover) { hover = i; hoverAt = app.now(); app.invalidate(); }
    },
    pointerLeave: () => { hover = -1; app.invalidate(); },
    pointerDown: () => {},
    pointerUp: (pt) => {
      const i = rectAt(buttons, pt.x, pt.y);
      if (i < 0) return;
      const id = buttons[i].id;
      if (id === 'together') { onMode?.('together'); return; }
      if (id === 'race') { onMode?.('race'); return; }
      if (id === 'host') onHost();
      else if (id === 'leave') onLeave();
      else if (id === 'copy') onCopy();
      else if (id === 'join') { if (complete()) onJoin(normaliseCode(typed)); }
      else app.closeOverlay();
    },
    key: (action) => {
      if (action.type === 'letter' || action.type === 'choose') return typeChar(action.value);
      if (action.type === 'delete') {
        if (state.active) return false;
        typed = typed.slice(0, -1);
        note = '';
        app.invalidate();
        return true;
      }
      if (action.type === 'submit') {
        if (!state.active && complete()) { onJoin(normaliseCode(typed)); return true; }
        app.closeOverlay();
        return true;
      }
      return false;
    },
    describe: () => ({
      title: state.active ? 'Playing together' : 'Play together',
      status: state.active
        ? [state.summary, state.code ? `The room code is ${spokenCode(state.code)}.` : 'Opening a room.']
          .join('. ').replace('.. ', '. ')
        : 'Open a room and send somebody the link, or type in a code you have been given.',
      lines: state.active
        ? [...state.who.map((w) => (w.you ? `${w.name}, you` : w.name)), state.status]
          .filter(Boolean)
        : [
          typed ? `Code so far: ${typed.split('').join(' ')}.` : 'No code typed yet.',
          note || 'Nothing is timed and nobody is racing.',
        ],
    }),
    animating: (now) => app.motion && now - hoverAt < DURATION.hover,
  };
}











export function more(app, { items }) {
  let box = panelBox(app, false);
  let buttons = [];
  let hover = -1;
  let hoverAt = 0;

  function layout() {
    box = panelBox(app, false);
    const w = Math.min(320, box.w - 44);
    const x = box.x + (box.w - w) / 2;
    const h = SIZES.target + 6;
    const top = box.y + 76;
    buttons = items.map((it, i) => ({ ...it, x, y: top + i * (h + 12), w, h }));
  }

  function draw(g, now) {
    paint.scrim(g, app.width, app.height);
    paint.surface(g, { x: box.x, y: box.y, w: box.w, h: box.h }, { fill: COLORS.card });
    paint.text(g, 'Menu', { x: box.x, y: box.y + 18, width: box.w, height: 38 },
      { size: SIZES.h2, colour: COLORS.ink });
    buttons.forEach((b, i) => {
      paint.button(g, b, {
        label: b.label,
        hover: hover === i ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0,
      });
    });
  }

  return {
    overlay: true,
    layout,
    draw,
    rects: () => buttons.map((b) => ({ ...b, id: `btn:${b.id}` })),
    pointerMove: (pt) => {
      const i = pt ? rectAt(buttons, pt.x, pt.y) : -1;
      if (i !== hover) { hover = i; hoverAt = app.now(); app.invalidate(); }
    },
    pointerLeave: () => { hover = -1; app.invalidate(); },
    pointerDown: () => {},
    pointerUp: (pt) => {
      const i = rectAt(buttons, pt.x, pt.y);
      if (i >= 0) buttons[i].run();
    },
    key: (action) => {
      if (action.type === 'submit') { app.closeOverlay(); return true; }
      return false;
    },
    describe: () => ({
      title: 'Menu',
      status: 'Choose an option, or press Escape to close.',
      lines: items.map((i) => i.label),
    }),
    animating: (now) => app.motion && now - hoverAt < DURATION.hover,
  };
}

















export function results(app, { state, onNext, onGames, onClose }) {
  let box = panelBox(app, false);
  let buttons = [];
  let hover = -1;
  let hoverAt = 0;

  function layout() {
    box = panelBox(app, false);
    const w = Math.min(320, box.w - 44);
    const x = box.x + (box.w - w) / 2;
    const bottom = box.y + box.h - 20;
    const h = SIZES.target;
    buttons = [
      { id: 'next', label: `Puzzle ${state.next}`, x, y: bottom - h * 3 - 24, w, h },
      { id: 'games', label: 'Choose another game', x, y: bottom - h * 2 - 12, w, h },
      { id: 'close', label: 'Stay on this board', x, y: bottom - h, w, h },
    ];
  }

  function draw(g, now) {
    paint.scrim(g, app.width, app.height);
    paint.surface(g, { x: box.x, y: box.y, w: box.w, h: box.h }, { fill: COLORS.card });

    const pad = 24;
    const width = box.w - pad * 2;
    const rows = state.rows ?? [];
    const winner = state.winner;

    paint.text(g, state.won ? 'Solved' : 'That is the lot',
      { x: box.x, y: box.y + 16, width: box.w, height: 38 },
      { size: SIZES.h2, colour: COLORS.ink });

    const headline = rows.length && winner
      ? (winner.you ? 'You finished first.' : `${winner.name} finished first.`)
      : `${state.game}. ${state.score}.`;
    paint.text(g, headline, { x: box.x + pad, y: box.y + 62, width, height: 26 },
      { size: SIZES.min, weight: 400, colour: COLORS.ink, align: 'left', fit: true, maxWidth: width });

    const limit = buttons[0].y - 16;
    let y = box.y + 100;
    if (rows.length) {
      paint.rule(g, box.x + pad, y - 8, width);
      for (const row of rows) {
        if (y + 30 > limit) break;
        const dot = { x: box.x + pad, y: y + 3, w: 20, h: 20 };
        paint.surface(g, dot, { fill: COLORS[row.colour] ?? COLORS.slate, offset: 0 });
        paint.text(g, row.you ? `${row.name} (you)` : row.name,
          { x: box.x + pad + 30, y, width: width * 0.5, height: 26 },
          { size: SIZES.min, weight: 700, colour: COLORS.ink, align: 'left',
            fit: true, maxWidth: width * 0.5 });
        
        
        paint.text(g, row.comparable ? (row.label ?? row.where) : 'On another puzzle',
          { x: box.x + pad + width * 0.5, y, width: width * 0.5, height: 26 },
          { size: SIZES.min, weight: 400, colour: COLORS.inkSoft, align: 'right',
            fit: true, maxWidth: width * 0.5 });
        y += 30;
      }
    }

    buttons.forEach((b, i) => {
      paint.button(g, b, {
        label: b.label,
        size: SIZES.min,
        tone: b.id === 'next' ? 'green' : null,
        hover: hover === i ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0,
      });
    });
  }

  return {
    overlay: true,
    layout,
    draw,
    rects: () => buttons.map((b) => ({ ...b, id: `btn:${b.id}` })),
    pointerMove: (pt) => {
      const i = pt ? rectAt(buttons, pt.x, pt.y) : -1;
      if (i !== hover) { hover = i; hoverAt = app.now(); app.invalidate(); }
    },
    pointerLeave: () => { hover = -1; app.invalidate(); },
    pointerDown: () => {},
    pointerUp: (pt) => {
      const i = rectAt(buttons, pt.x, pt.y);
      if (i < 0) return;
      const id = buttons[i].id;
      if (id === 'next') onNext();
      else if (id === 'games') onGames();
      else onClose();
    },
    key: (action) => {
      if (action.type === 'submit') { onNext(); return true; }
      return false;
    },
    describe: () => ({
      title: state.won ? 'Solved' : 'Puzzle over',
      status: (state.rows ?? []).length && state.winner
        ? `${state.winner.you ? 'You' : state.winner.name} finished first.`
        : `${state.game}. ${state.score}.`,
      lines: [
        ...(state.rows ?? []).map((r) => `${r.you ? `${r.name}, you` : r.name}: ${r.comparable ? (r.label ?? r.where) : 'on another puzzle'}.`),
        `Press Enter for puzzle ${state.next}, or choose another game.`,
      ],
    }),
    animating: (now) => app.motion && now - hoverAt < DURATION.hover,
  };
}








export function say(app, { onSay }) {
  let box = panelBox(app, false);
  let buttons = [];
  let hover = -1;
  let hoverAt = 0;

  function layout() {
    box = panelBox(app, false);
    const w = Math.min(320, box.w - 44);
    const x = box.x + (box.w - w) / 2;
    const h = SIZES.target;
    const top = box.y + 66;
    buttons = SAYINGS.map((s, i) => ({ id: s.id, label: s.text, x, y: top + i * (h + 8), w, h }));
    buttons.push({ id: 'close', label: 'Close', x, y: box.y + box.h - 20 - h, w, h });
  }

  function draw(g, now) {
    paint.scrim(g, app.width, app.height);
    paint.surface(g, { x: box.x, y: box.y, w: box.w, h: box.h }, { fill: COLORS.card });
    paint.text(g, 'Say something', { x: box.x, y: box.y + 14, width: box.w, height: 38 },
      { size: SIZES.h2, colour: COLORS.ink });
    const floor = box.y + box.h - 20 - SIZES.target - 10;
    buttons.forEach((b, i) => {
      if (b.id !== 'close' && b.y + b.h > floor) return;
      paint.button(g, b, {
        label: b.label,
        size: SIZES.min,
        hover: hover === i ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0,
      });
    });
  }

  return {
    overlay: true,
    layout,
    draw,
    rects: () => buttons.map((b) => ({ ...b, id: `btn:${b.id}` })),
    pointerMove: (pt) => {
      const i = pt ? rectAt(buttons, pt.x, pt.y) : -1;
      if (i !== hover) { hover = i; hoverAt = app.now(); app.invalidate(); }
    },
    pointerLeave: () => { hover = -1; app.invalidate(); },
    pointerDown: () => {},
    pointerUp: (pt) => {
      const i = rectAt(buttons, pt.x, pt.y);
      if (i < 0) return;
      if (buttons[i].id === 'close') app.closeOverlay();
      else onSay(buttons[i].id);
    },
    key: (action) => {
      if (action.type === 'submit') { app.closeOverlay(); return true; }
      return false;
    },
    describe: () => ({
      title: 'Say something',
      status: 'Choose one to send it to everybody in the room.',
      lines: SAYINGS.map((s) => s.text),
    }),
    animating: (now) => app.motion && now - hoverAt < DURATION.hover,
  };
}











export function length(app, { minutes, onPick }) {
  let box = panelBox(app, false);
  let buttons = [];
  let hover = -1;
  let hoverAt = 0;

  function layout() {
    box = panelBox(app, false);
    const w = Math.min(300, box.w - 44);
    const x = box.x + (box.w - w) / 2;
    const h = SIZES.target + 4;
    const top = box.y + 120;
    buttons = minutes.map((m, i) => ({
      id: `m${m}`, minutes: m, label: `${m} minutes`, x, y: top + i * (h + 12), w, h,
    }));
    buttons.push({
      id: 'close', label: 'Not yet', x, y: box.y + box.h - 20 - h, w, h,
    });
  }

  function draw(g, now) {
    paint.scrim(g, app.width, app.height);
    paint.surface(g, { x: box.x, y: box.y, w: box.w, h: box.h }, { fill: COLORS.card });
    paint.text(g, 'How long?', { x: box.x, y: box.y + 18, width: box.w, height: 40 },
      { size: SIZES.h2, colour: COLORS.ink });
    const pad = 24;
    const width = box.w - pad * 2;
    let y = box.y + 64;
    for (const line of paint.wrap(g, 'Everybody gets a fresh puzzle and starts on nothing. The clock stops if somebody drops out.', width, { size: SIZES.min })) {
      if (y + 24 > box.y + 118) break;
      paint.text(g, line, { x: box.x + pad, y, width, height: 24 },
        { size: SIZES.min, weight: 400, colour: COLORS.ink, align: 'left' });
      y += 24;
    }
    buttons.forEach((b, i) => {
      paint.button(g, b, {
        label: b.label,
        size: SIZES.min,
        tone: b.id === 'm10' ? 'green' : null,
        hover: hover === i ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0,
      });
    });
  }

  return {
    overlay: true,
    layout,
    draw,
    rects: () => buttons.map((b) => ({ ...b, id: `btn:${b.id}` })),
    pointerMove: (pt) => {
      const i = pt ? rectAt(buttons, pt.x, pt.y) : -1;
      if (i !== hover) { hover = i; hoverAt = app.now(); app.invalidate(); }
    },
    pointerLeave: () => { hover = -1; app.invalidate(); },
    pointerDown: () => {},
    pointerUp: (pt) => {
      const i = rectAt(buttons, pt.x, pt.y);
      if (i < 0) return;
      if (buttons[i].id === 'close') app.closeOverlay();
      else onPick(buttons[i].minutes);
    },
    key: (action) => {
      if (action.type === 'submit') { onPick(buttons[0].minutes); return true; }
      
      if (action.type === 'choose') {
        const wanted = minutes.find((m) => String(m).startsWith(action.value));
        if (wanted) { onPick(wanted); return true; }
      }
      return false;
    },
    describe: () => ({
      title: 'How long?',
      status: 'Choose how long the session runs. Everybody starts on nothing.',
      lines: minutes.map((m) => `${m} minutes`),
    }),
    animating: (now) => app.motion && now - hoverAt < DURATION.hover,
  };
}
