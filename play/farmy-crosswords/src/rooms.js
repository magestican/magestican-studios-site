






import { COLORS, SIZES } from '../../../web-engine/words/style.js';
import { rectAt } from '../../../web-engine/words/layout.js';
import { progress, lift, DURATION } from '../../../web-engine/words/motion.js';
import {
  CODE_ALPHABET, CODE_LENGTH, normaliseCode, spokenCode,
} from '../../../web-engine/words/coop.js';
import * as paint from './paint.js';
import { panelBox } from './overlay.js';




















export function room(app, {
  state, onHost, onJoin, onLeave, onCopy,
}) {
  let box = panelBox(app, false);
  let buttons = [];
  let hover = -1;
  let hoverAt = 0;
  let typed = '';
  let note = '';

  const complete = () => !!normaliseCode(typed);

  function layout() {
    box = panelBox(app, false);
    const w = Math.min(300, box.w - 44);
    const x = box.x + (box.w - w) / 2;
    const bottom = box.y + box.h - 20;
    const h = SIZES.target;
    buttons = state.active
      ? [
        { id: 'copy', label: 'Copy the link', x, y: bottom - h * 2 - 12, w, h },
        { id: 'leave', label: 'Leave the room', x, y: bottom - h, w, h },
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
        'Anybody with the link or the code joins this puzzle. You find the words between you.',
      ]
      : [
        'Open a room and send the link, or type in a code you were given.',
        'You then work the same puzzle together. Nothing is timed and nobody is racing.',
      ];

    
    
    
    
    const limit = (buttons[0]?.y ?? box.y + box.h - 20) - 16;
    const codeTop = state.active
      ? Math.min(box.y + 190, limit - 200)
      : limit - 96;

    let y = box.y + 62;
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
          const row = codeTop + 108 + i * 34;
          if (row + 30 > limit) return;
          const dot = { x: box.x + pad, y: row + 4, w: 22, h: 22 };
          paint.surface(g, dot, { fill: COLORS[entry.colour], offset: 0 });
          paint.text(g, entry.you ? `${entry.name} (you)` : entry.name,
            { x: box.x + pad + 34, y: row, width: width - 34, height: 30 },
            { size: SIZES.min, weight: 400, colour: COLORS.ink, align: 'left',
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
        tone: b.id === 'host' ? 'green' : null,
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
