















import { COLORS, SIZES, STATES } from '../../../web-engine/words/style.js';
import { grid, rectAt } from '../../../web-engine/words/layout.js';
import { DRAG_SLOP } from '../../../web-engine/words/drag.js';
import { progress, lift, DURATION } from '../../../web-engine/words/motion.js';
import {
  BAND_PIPS, PIP_SLOTS, ratingsFor, curveOrder, distribution,
} from '../../../web-engine/words/difficulty.js';
import * as paint from './paint.js';
import { velocityOf, glide, gliding, isFlick } from '../../../web-engine/words/momentum.js';


export function panelBox(app, wide) {
  const w = Math.min(wide ? 640 : 560, app.width - 32);
  const h = Math.min(wide ? 620 : 520, app.height - 32);
  return { x: Math.round((app.width - w) / 2), y: Math.round((app.height - h) / 2), w, h };
}


























function drawPips(g, r, band, onInk) {
  const spec = BAND_PIPS[band];
  if (!spec) return;
  
  
  
  
  
  
  
  
  
  
  
  
  const radius = 3.2;
  const pitch = 9.5;
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h - 9;
  const left = cx - ((PIP_SLOTS - 1) * pitch) / 2;
  const colour = onInk ? COLORS.card : COLORS[spec.fill];
  g.save();
  
  
  
  g.lineWidth = 1.6;
  g.strokeStyle = colour;
  g.fillStyle = colour;
  for (let i = 0; i < PIP_SLOTS; i += 1) {
    g.beginPath();
    g.arc(left + i * pitch, cy, radius, 0, Math.PI * 2);
    if (i < spec.pips) g.fill(); else g.stroke();
  }
  g.restore();
}










function drawTodayMark(g, r) {
  const cx = r.x + r.w / 2;
  const top = r.y + 7;
  g.save();
  g.fillStyle = COLORS.blue;
  g.beginPath();
  g.moveTo(cx - 5, top);
  g.lineTo(cx + 5, top);
  g.lineTo(cx, top + 8);
  g.closePath();
  g.fill();
  g.restore();
}




























export function picker(app, {
  count, label, current, today, onPick, game = null,
}) {
  let box = panelBox(app, true);
  let cells = { rects: [] };
  
















  let scroll = 0;
  let placed = false;
  let gridH = 0;
  let viewH = 0;
  let dragFrom = null;
  
  
  
  let samples = [];
  let flick = 0;
  let flickAt = 0;
  let flickFrom = 0;
  let closeRect = { x: 0, y: 0, w: 0, h: 0 };
  let todayRect = { x: 0, y: 0, w: 0, h: 0 };
  
  
  
  let hover = -1;
  let hoverAt = 0;
  let typedNumber = '';

  
  
  
  const ratings = (() => {
    if (!game) return null;
    try {
      const list = ratingsFor(game);
      return list.length === count ? list : null;
    } catch { return null; }
  })();
  const order = ratings ? curveOrder(ratings) : Array.from({ length: count }, (_, i) => i);
  const slotAt = new Map(order.map((puzzle, slot) => [puzzle, slot]));
  const puzzleAt = (slot) => (slot >= 0 && slot < order.length ? order[slot] : -1);
  const bandOf = (puzzle) => (ratings && ratings[puzzle] ? ratings[puzzle].band : null);
  const bandWord = (puzzle) => {
    const band = bandOf(puzzle);
    return band ? BAND_PIPS[band].label : '';
  };

  const PAD = 20;
  const HEAD = 62;
  const WHY_LINE = 24;
  
  
  
  
  
  
  const WHY_ROWS = 3;
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  const FOOT_GAP = 18;
  const FOOT = FOOT_GAP + 28 + WHY_LINE * WHY_ROWS + 16;

  













  function place() {
    const base = panelBox(app, true);
    const gap = 6;
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const inner = base.w - PAD * 2;
    const fitAt = (size) => Math.max(1, Math.floor((inner + gap) / (size + gap)));
    const cols = Math.max(4, Math.min(fitAt(40), Math.max(6, fitAt(52))));
    const rows = Math.ceil(count / cols);
    const cell = Math.max(40, Math.min(62, Math.floor((inner - gap * (cols - 1)) / cols)));
    const need = HEAD + SIZES.target + 16 + (rows * cell + gap * (rows - 1)) + FOOT;
    const h = Math.min(app.height - 32, Math.max(base.h, need));
    box = { ...base, y: Math.round((app.height - h) / 2), h };
    gridH = rows * cell + gap * (rows - 1);
    viewH = h - HEAD - SIZES.target - 16 - FOOT;
    scroll = clampScroll(scroll);
    
    
    
    
    if (!placed) {
      placed = true;
      const slot = slotAt.get(current);
      if (slot !== undefined) revealSlot(slot, cell, gap, cols);
    }
    return { cols, rows, gap };
  }

  function clampScroll(want) {
    return Math.max(0, Math.min(Math.max(0, gridH - viewH), want));
  }

  
  function revealSlot(slot, cell, gap, cols) {
    const row = Math.floor(slot / cols);
    const top = row * (cell + gap);
    if (top < scroll) scroll = clampScroll(top - 6);
    else if (top + cell > scroll + viewH) scroll = clampScroll(top + cell - viewH + 6);
  }

  const scrollable = () => gridH > viewH + 1;

  
  function reveal(i) {
    const r = cells.rects[i];
    if (!r || !scrollable()) return;
    const top = r.y - (box.y + HEAD + SIZES.target + 16);
    if (top - scroll < 0) scroll = clampScroll(top - scroll + scroll - 6);
    else if (top + r.h - scroll > viewH) scroll = clampScroll(top + r.h - viewH + 6);
  }

  function layout() {
    const { cols, rows, gap } = place();
    const head = box.y + HEAD;
    todayRect = { x: box.x + PAD, y: head, w: 150, h: SIZES.target };
    closeRect = { x: box.x + box.w - PAD - 120, y: head, w: 120, h: SIZES.target };
    cells = grid({
      box: {
        x: box.x + PAD,
        y: head + SIZES.target + 16,
        width: box.w - PAD * 2,
        height: box.h - HEAD - SIZES.target - 16 - FOOT,
      },
      cols,
      rows,
      gap,
      maxCell: 62,
      min: 40,
    });
    cells.rects = cells.rects.slice(0, count);
    cells.cols = cols;
  }

  
  function stepFlick(now) {
    if (!flick) return;
    const t = now - flickAt;
    if (!gliding(flick, t)) { flick = 0; return; }
    const want = clampScroll(flickFrom + glide(flick, t));
    if (want !== scroll) scroll = want;
    else flick = 0;
  }

  function draw(g, now) {
    stepFlick(now);
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

    
    
    const viewTop = box.y + HEAD + SIZES.target + 16;
    g.save();
    g.beginPath();
    g.rect(box.x, viewTop - 4, box.w, viewH + 8);
    g.clip();
    g.translate(0, -scroll);

    cells.rects.forEach((r, slot) => {
      const puzzle = puzzleAt(slot);
      const isNow = puzzle === current;
      const isToday = puzzle === today;
      paint.tile(g, r, {
        letter: String(puzzle + 1),
        fill: isNow ? COLORS.ink : COLORS.card,
        lift: slot === hover ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0,
        size: SIZES.min,
      });
      if (isNow) paint.text(g, String(puzzle + 1), r, { size: SIZES.min, colour: COLORS.card });
      if (isToday) drawTodayMark(g, r);
      const band = bandOf(puzzle);
      if (band) drawPips(g, r, band, isNow);
    });

    g.restore();

    
    
    
    if (scrollable()) {
      const trackH = viewH - 8;
      const thumbH = Math.max(34, trackH * (viewH / gridH));
      const at = (scroll / Math.max(1, gridH - viewH)) * (trackH - thumbH);
      paint.surface(g, {
        x: box.x + box.w - 10, y: viewTop + 4 + at, w: 5, h: thumbH,
      }, { fill: COLORS.slate, offset: 0 });
    }

    
    
    
    
    
    
    
    
    const shown = hover >= 0 ? puzzleAt(hover) : current;
    const band = bandOf(shown);
    const name = band ? `${label(shown)} - ${BAND_PIPS[band].label}` : label(shown);
    const width = box.w - 32;
    const nameY = box.y + box.h - FOOT + FOOT_GAP;
    paint.text(g, name, { x: box.x + 16, y: nameY, width, height: 28 },
      { size: SIZES.small, colour: COLORS.ink, fit: true, maxWidth: width });
    if (ratings) {
      paint.wrap(g, ratings[shown].why, width, { size: SIZES.min })
        .slice(0, WHY_ROWS)
        .forEach((row, i) => {
          paint.text(g, row,
            { x: box.x + 16, y: nameY + 30 + i * WHY_LINE, width, height: WHY_LINE },
            { size: SIZES.min, weight: 400, colour: COLORS.inkSoft });
        });
    }
  }

  
  const shift = (r) => ({ ...r, y: r.y - scroll });

  function hitAt(pt) {
    if (rectAt([todayRect], pt.x, pt.y) === 0) return -2;
    if (rectAt([closeRect], pt.x, pt.y) === 0) return -3;
    
    
    const viewTop = box.y + HEAD + SIZES.target + 16;
    if (pt.y < viewTop - 4 || pt.y > viewTop + viewH + 4) return -1;
    return rectAt(cells.rects.map(shift), pt.x, pt.y);
  }

  function scrollBy(dy) {
    const was = scroll;
    scroll = clampScroll(scroll + dy);
    if (scroll !== was) app.invalidate();
    return scroll !== was;
  }

  return {
    overlay: true,
    layout,
    draw,
    rects: () => [
      { id: "btn:Today's", ...todayRect },
      { id: 'btn:Close', ...closeRect },
      
      
      
      
      ...cells.rects.map(shift).map((r, slot) => ({ id: `num:${puzzleAt(slot) + 1}`, ...r })),
    ],
    wheel: (dy) => scrollBy(dy),
    pointerMove: (pt) => {
      if (dragFrom && scrollable()) {
        samples.push({ y: pt.y, at: app.now() });
        if (samples.length > 12) samples.shift();
        const want = dragFrom.scroll - (pt.y - dragFrom.y);
        if (want !== scroll) { scroll = clampScroll(want); app.invalidate(); }
        return;
      }
      const i = pt ? hitAt(pt) : -1;
      if (i !== hover) { hover = i; hoverAt = app.now(); app.invalidate(); }
    },
    pointerLeave: () => { hover = -1; dragFrom = null; samples = []; app.invalidate(); },
    pointerDown: (pt) => {
      
      
      dragFrom = { y: pt.y, scroll };
      flick = 0;
      samples = [{ y: pt.y, at: app.now() }];
    },
    pointerUp: (pt) => {
      
      
      
      const moved = dragFrom ? Math.abs(pt.y - dragFrom.y) : 0;
      const wasDragging = !!dragFrom;
      dragFrom = null;
      samples.push({ y: pt.y, at: app.now() });
      const v = -velocityOf(samples);
      samples = [];
      if (wasDragging && moved > DRAG_SLOP && scrollable() && isFlick(v)) {
        flick = v;
        flickAt = app.now();
        flickFrom = scroll;
        app.invalidate();
      }
      if (moved > DRAG_SLOP) return;
      const i = hitAt(pt);
      if (i === -3) { app.closeOverlay(); return; }
      if (i === -2) { onPick(today); return; }
      if (i >= 0) onPick(puzzleAt(i));
    },
    key: (action) => {
      if (action.type === 'choose') {
        
        
        
        
        
        typedNumber += action.value;
        const n = Number(typedNumber);
        if (n * 10 > count || typedNumber.length >= 3) {
          if (n >= 1 && n <= count) onPick(n - 1);
          typedNumber = '';
        } else if (n >= 1 && n <= count) {
          hover = slotAt.get(n - 1) ?? -1;
          app.invalidate();
        }
        return true;
      }
      if (action.type === 'move') {
        
        
        const at = hover >= 0 ? hover : (slotAt.get(current) ?? 0);
        const next = at + action.dx + action.dy * cells.cols;
        if (next >= 0 && next < count) { hover = next; reveal(next); app.invalidate(); }
        return true;
      }
      if (action.type === 'submit') {
        onPick(hover >= 0 ? puzzleAt(hover) : current);
        return true;
      }
      return false;
    },
    describe: () => {
      
      
      
      const shown = hover >= 0 ? puzzleAt(hover) : current;
      const lines = [
        `Currently on ${label(current)}${bandWord(current) ? `, ${bandWord(current)}` : ''}.`,
        `Today's is ${label(today)}${bandWord(today) ? `, ${bandWord(today)}` : ''}.`,
      ];
      if (ratings) {
        const d = distribution(ratings);
        lines.push(`Listed easiest first: ${d.easy} easy, ${d.medium} medium, ${d.hard} hard.`);
        lines.push(`Position ${(slotAt.get(shown) ?? 0) + 1} of ${count} is ${label(shown)}`
          + `, ${bandWord(shown)}: ${ratings[shown].why}`);
      }
      return {
        title: 'Choose a puzzle',
        status: ratings
          ? `${count} puzzles, easiest first. Each is marked easy, medium or hard.`
            + ' Type a number, or use the arrow keys and Enter.'
          : `${count} puzzles. Type a number, or use the arrow keys and Enter.`,
        lines,
      };
    },
    animating: (now) => gliding(flick, now - flickAt)
      || (app.motion && now - hoverAt < DURATION.hover),
  };
}




















export function help(app, { title, lines, keys }) {
  let box = panelBox(app, false);
  let closeRect = { x: 0, y: 0, w: 0, h: 0 };
  let hover = -1;
  let hoverAt = 0;

  
  
  const HEAD = 62;
  const FOOT = 12 + SIZES.target + 18;

  














  function place(contentH = null) {
    const base = panelBox(app, false);
    const need = contentH == null ? app.height - 32 : contentH + HEAD + FOOT;
    const h = Math.max(240, Math.min(app.height - 32, need));
    box = { ...base, y: Math.round((app.height - h) / 2), h };
    closeRect = {
      x: box.x + box.w / 2 - 70, y: box.y + h - SIZES.target - 18, w: 140, h: SIZES.target,
    };
  }

  function layout() { place(); }

  function draw(g, now) {
    const pad = 22;
    
    
    
    const width = panelBox(app, false).w - pad * 2;

    
    
    
    
    
    const blocks = lines.map((line) => ({
      rows: paint.wrap(g, line, width, { size: SIZES.small }),
      colour: COLORS.ink,
      lead: 1,
    }));
    if (keys) {
      blocks.push({
        rows: paint.wrap(g, keys, width, { size: SIZES.min }),
        colour: COLORS.inkSoft,
        lead: 1.8,
      });
    }

    
    
    
    
    const rows = blocks.reduce((n, b) => n + b.rows.length, 0);
    const leads = blocks.reduce((n, b) => n + b.lead, 0) - (blocks[0]?.lead ?? 0);
    let lineH = 26;
    let gap = 12;
    place(rows * lineH + leads * gap);
    const top = box.y + HEAD;
    
    
    
    const limit = closeRect.y - 12;
    const room = limit - top;
    while (rows * lineH + leads * gap > room && (gap > 4 || lineH > 22)) {
      if (gap > 4) gap -= 1; else lineH -= 1;
    }

    paint.scrim(g, app.width, app.height);
    paint.surface(g, { x: box.x, y: box.y, w: box.w, h: box.h }, { fill: COLORS.card });
    paint.text(g, title, { x: box.x, y: box.y + 16, width: box.w, height: 40 },
      { size: SIZES.h2, colour: COLORS.ink });

    let y = top;
    let first = true;
    for (const block of blocks) {
      if (!first) y += gap * block.lead;
      first = false;
      for (const row of block.rows) {
        
        
        if (y + lineH > limit) break;
        paint.text(g, row, { x: box.x + pad, y, width, height: lineH },
          { size: SIZES.small, weight: 400, colour: block.colour, align: 'left' });
        y += lineH;
      }
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

















export function hints(app, { title, grid }) {
  let box = panelBox(app, true);
  let closeRect = { x: 0, y: 0, w: 0, h: 0 };
  let hover = -1;
  let hoverAt = 0;

  function layout() {
    box = panelBox(app, true);
    closeRect = {
      x: box.x + box.w / 2 - 70, y: box.y + box.h - SIZES.target - 16, w: 140, h: SIZES.target,
    };
  }

  function draw(g, now) {
    paint.scrim(g, app.width, app.height);
    paint.surface(g, { x: box.x, y: box.y, w: box.w, h: box.h }, { fill: COLORS.card });
    paint.text(g, title, { x: box.x, y: box.y + 14, width: box.w, height: 38 },
      { size: SIZES.h2, colour: COLORS.ink, fit: true, maxWidth: box.w - 40 });

    const pad = 22;
    const width = box.w - pad * 2;
    const left = box.x + pad;
    const summary = grid.remaining === 0
      ? 'Every word found.'
      : `${grid.remaining} word${grid.remaining === 1 ? '' : 's'} left of ${grid.total}`
        + `, including ${grid.pangrams.total - grid.pangrams.found} pangram`
        + `${grid.pangrams.total - grid.pangrams.found === 1 ? '' : 's'}.`;
    
    
    
    
    const summaryRows = paint.wrap(g, summary, width, { size: SIZES.small });
    summaryRows.forEach((row, i) => {
      paint.text(g, row, { x: left, y: box.y + 56 + i * 24, width, height: 24 },
        { size: SIZES.small, weight: 400, colour: COLORS.inkSoft, align: 'left' });
    });

    
    
    
    
    
    
    
    const top = box.y + 56 + summaryRows.length * 24 + 50;
    const colW = Math.min(54, Math.floor((width - 70) / Math.max(1, grid.lengths.length + 1)));
    const rowH = 34;

    paint.text(g, 'Length', { x: left, y: top - 30, w: 64, h: 26 },
      { size: SIZES.min, weight: 400, colour: COLORS.inkSoft, align: 'left' });
    grid.lengths.forEach((n, i) => {
      paint.text(g, String(n), { x: left + 70 + i * colW, y: top - 30, w: colW, h: 26 },
        { size: SIZES.min, colour: COLORS.ink });
    });
    paint.text(g, 'All', { x: left + 70 + grid.lengths.length * colW, y: top - 30, w: colW, h: 26 },
      { size: SIZES.min, colour: COLORS.inkSoft });
    paint.rule(g, left, top - 8, width);

    
    
    
    
    
    
    
    
    
    
    
    const pairRows = [];
    if (grid.pairs.length) {
      g.font = paint.font(SIZES.min, 400);
      let line = '';
      for (const p of grid.pairs) {
        const item = `${p.pair} ${p.count}`;
        const next = line ? `${line}   ${item}` : item;
        if (line && g.measureText(next).width > width) {
          pairRows.push(line);
          line = item;
        } else {
          line = next;
        }
      }
      if (line) pairRows.push(line);
    } else {
      pairRows.push(...paint.wrap(g, 'Nothing left to find.', width, { size: SIZES.min }));
    }
    const pairsTop = closeRect.y - 16 - pairRows.length * 24;

    grid.rows.forEach((row, r) => {
      const y = top + r * rowH;
      
      
      
      if (y + rowH > pairsTop - 26) return;
      paint.text(g, row.letter, { x: left, y, w: 64, h: rowH },
        { size: SIZES.small, colour: COLORS.ink, align: 'left' });
      row.counts.forEach((n, i) => {
        paint.text(g, n === 0 ? '-' : String(n), { x: left + 70 + i * colW, y, w: colW, h: rowH },
          { size: SIZES.small, weight: n === 0 ? 400 : 700, colour: n === 0 ? COLORS.inkSoft : COLORS.ink });
      });
      paint.text(g, String(row.total),
        { x: left + 70 + grid.lengths.length * colW, y, w: colW, h: rowH },
        { size: SIZES.small, weight: 400, colour: COLORS.inkSoft });
    });

    paint.rule(g, left, pairsTop - 12, width);
    pairRows.forEach((row, i) => {
      paint.text(g, row, { x: left, y: pairsTop + i * 24, width, height: 24 },
        { size: SIZES.min, weight: 400, colour: COLORS.ink, align: 'left' });
    });

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
      status: grid.remaining === 0
        ? 'Every word found.'
        : `${grid.remaining} words left of ${grid.total}.`,
      lines: [
        ...grid.rows.map((row) => `${row.letter}: ${row.total} left - `
          + grid.lengths.map((n, i) => `${row.counts[i]} of ${n} letters`)
            .filter((_, i) => row.counts[i] > 0).join(', ')),
        grid.pairs.length
          ? `Starting pairs: ${grid.pairs.map((p) => `${p.pair} ${p.count}`).join(', ')}.`
          : 'Nothing left to find.',
        `Pangrams: ${grid.pangrams.found} of ${grid.pangrams.total} found.`,
      ],
    }),
    animating: (now) => app.motion && now - hoverAt < DURATION.hover,
  };
}
