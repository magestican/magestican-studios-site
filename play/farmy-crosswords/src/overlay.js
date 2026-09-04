















import { COLORS, SIZES, STATES } from '../../../web-engine/words/style.js';
import { grid, rectAt, stack } from '../../../web-engine/words/layout.js';
import { progress, lift, DURATION } from '../../../web-engine/words/motion.js';
import * as paint from './paint.js';


function panelBox(app, wide) {
  const w = Math.min(wide ? 640 : 560, app.width - 32);
  const h = Math.min(wide ? 620 : 520, app.height - 32);
  return { x: Math.round((app.width - w) / 2), y: Math.round((app.height - h) / 2), w, h };
}









export function picker(app, { count, label, current, today, onPick }) {
  let box = panelBox(app, true);
  let cells = { rects: [] };
  let closeRect = { x: 0, y: 0, w: 0, h: 0 };
  let todayRect = { x: 0, y: 0, w: 0, h: 0 };
  let hover = -1;
  let hoverAt = 0;
  let typedNumber = '';

  function layout() {
    box = panelBox(app, true);
    const pad = 20;
    const head = box.y + 62;
    todayRect = { x: box.x + pad, y: head, w: 150, h: SIZES.target };
    closeRect = { x: box.x + box.w - pad - 120, y: head, w: 120, h: SIZES.target };
    const cols = Math.max(6, Math.min(10, Math.floor((box.w - pad * 2) / 62)));
    const rows = Math.ceil(count / cols);
    cells = grid({
      box: {
        x: box.x + pad,
        y: head + SIZES.target + 16,
        width: box.w - pad * 2,
        height: box.h - (head - box.y) - SIZES.target - 90,
      },
      cols,
      rows,
      gap: 6,
      maxCell: 62,
      min: 40,
    });
    cells.rects = cells.rects.slice(0, count);
    cells.cols = cols;
  }

  function draw(g, now) {
    paint.scrim(g, app.width, app.height);
    paint.surface(g, { x: box.x, y: box.y, w: box.w, h: box.h }, { fill: COLORS.card });
    paint.text(g, 'Choose a puzzle', { x: box.x, y: box.y + 14, width: box.w, height: 40 },
      { size: SIZES.h2, colour: COLORS.ink });

    paint.button(g, todayRect, {
      label: "Today's",
      tone: current === today ? null : 'blue',
      disabled: current === today,
      hover: hover === -2 ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0,
    });
    paint.button(g, closeRect, {
      label: 'Close',
      hover: hover === -3 ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0,
    });

    cells.rects.forEach((r, i) => {
      const isNow = i === current;
      const isToday = i === today;
      paint.tile(g, r, {
        letter: String(i + 1),
        fill: isNow ? COLORS.ink : COLORS.card,
        lift: i === hover ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0,
        size: SIZES.min,
      });
      if (isNow) {
        paint.text(g, String(i + 1), r, { size: SIZES.min, colour: COLORS.card });
      } else if (isToday) {
        
        
        g.fillStyle = COLORS.blue;
        g.beginPath();
        g.arc(r.x + r.w / 2, r.y + r.h - 8, 3.5, 0, Math.PI * 2);
        g.fill();
      }
    });

    const name = hover >= 0 ? label(hover) : label(current);
    paint.text(g, name, { x: box.x + 16, y: box.y + box.h - 44, width: box.w - 32, height: 30 },
      { size: SIZES.small, weight: 400, colour: COLORS.inkSoft, fit: true, maxWidth: box.w - 32 });
  }

  function hitAt(pt) {
    if (rectAt([todayRect], pt.x, pt.y) === 0) return -2;
    if (rectAt([closeRect], pt.x, pt.y) === 0) return -3;
    return rectAt(cells.rects, pt.x, pt.y);
  }

  return {
    overlay: true,
    layout,
    draw,
    rects: () => [
      { id: "btn:Today's", ...todayRect },
      { id: 'btn:Close', ...closeRect },
      ...cells.rects.map((r, i) => ({ id: `num:${i + 1}`, ...r })),
    ],
    pointerMove: (pt) => {
      const i = pt ? hitAt(pt) : -1;
      if (i !== hover) { hover = i; hoverAt = app.now(); app.invalidate(); }
    },
    pointerLeave: () => { hover = -1; app.invalidate(); },
    pointerDown: () => {},
    pointerUp: (pt) => {
      const i = hitAt(pt);
      if (i === -3) { app.closeOverlay(); return; }
      if (i === -2) { onPick(today); return; }
      if (i >= 0) onPick(i);
    },
    key: (action) => {
      if (action.type === 'choose') {
        
        
        typedNumber += action.value;
        const n = Number(typedNumber);
        if (n * 10 > count || typedNumber.length >= 3) {
          if (n >= 1 && n <= count) onPick(n - 1);
          typedNumber = '';
        } else if (n >= 1 && n <= count) {
          hover = n - 1;
          app.invalidate();
        }
        return true;
      }
      if (action.type === 'move') {
        const at = hover >= 0 ? hover : current;
        const next = at + action.dx + action.dy * cells.cols;
        if (next >= 0 && next < count) { hover = next; app.invalidate(); }
        return true;
      }
      if (action.type === 'submit') { onPick(hover >= 0 ? hover : current); return true; }
      return false;
    },
    describe: () => ({
      title: 'Choose a puzzle',
      status: `${count} puzzles. Type a number, or use the arrow keys and Enter.`,
      lines: [`Currently on ${label(current)}.`, `Today's is ${label(today)}.`],
    }),
    animating: (now) => app.motion && now - hoverAt < DURATION.hover,
  };
}


export function help(app, { title, lines, keys }) {
  let box = panelBox(app, false);
  let closeRect = { x: 0, y: 0, w: 0, h: 0 };
  let bands = [];
  let hover = -1;
  let hoverAt = 0;

  function layout() {
    box = panelBox(app, false);
    closeRect = {
      x: box.x + box.w / 2 - 70, y: box.y + box.h - SIZES.target - 18, w: 140, h: SIZES.target,
    };
    bands = stack(
      { x: box.x + 22, y: box.y + 70, width: box.w - 44, height: box.h - 150 },
      lines.map(() => 46),
      6,
    ).bands;
  }

  function draw(g, now) {
    paint.scrim(g, app.width, app.height);
    paint.surface(g, { x: box.x, y: box.y, w: box.w, h: box.h }, { fill: COLORS.card });
    paint.text(g, title, { x: box.x, y: box.y + 16, width: box.w, height: 40 },
      { size: SIZES.h2, colour: COLORS.ink });
    lines.forEach((line, i) => {
      const band = bands[i];
      if (!band) return;
      paint.text(g, line, { x: band.x, y: band.y, width: band.width, height: band.height }, {
        size: SIZES.small, weight: 400, colour: COLORS.ink, align: 'left',
        fit: true, maxWidth: band.width,
      });
    });
    if (keys) {
      paint.text(g, keys, {
        x: box.x + 22, y: closeRect.y - 44, width: box.w - 44, height: 34,
      }, {
        size: SIZES.min, weight: 400, colour: COLORS.inkSoft, align: 'left',
        fit: true, maxWidth: box.w - 44,
      });
    }
    paint.button(g, closeRect, {
      label: 'Close',
      hover: hover === 0 ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0,
    });
  }

  return {
    overlay: true,
    layout,
    draw,
    rects: () => [{ id: 'btn:Close', ...closeRect }],
    pointerMove: (pt) => {
      const i = pt ? rectAt([closeRect], pt.x, pt.y) : -1;
      if (i !== hover) { hover = i; hoverAt = app.now(); app.invalidate(); }
    },
    pointerLeave: () => { hover = -1; app.invalidate(); },
    pointerDown: () => {},
    pointerUp: (pt) => { if (rectAt([closeRect], pt.x, pt.y) === 0) app.closeOverlay(); },
    key: (action) => {
      if (action.type === 'submit') { app.closeOverlay(); return true; }
      return false;
    },
    describe: () => ({
      title,
      status: 'Help. Press Escape or Enter to close.',
      lines: keys ? [...lines, keys] : lines,
    }),
    animating: (now) => app.motion && now - hoverAt < DURATION.hover,
  };
}


export const KEY_LINES = [
  `${STATES.right.mark} green: the right letter in the right place.`,
  `${STATES.moved.mark} gold: the right letter somewhere else.`,
  `${STATES.absent.mark} grey: not in the word.`,
];
