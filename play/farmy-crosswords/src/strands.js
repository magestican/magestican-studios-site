

























import { COLORS, SIZES, STATES } from '../../../web-engine/words/style.js';
import {
  adjacent, themeWordAt, play, hintCells, wordAt, rowOf, colOf,
  COLS, ROWS, MIN_BONUS_LENGTH, WORDS_PER_HINT,
} from '../../../web-engine/words/strandsRules.js';
import { WORDLE_GUESSES } from '../../../web-engine/words/data/wordleWords.js';
import { STRANDS_PUZZLES } from '../../../web-engine/words/data/strandsPuzzles.js';
import { describeStrands } from '../../../web-engine/words/describe.js';
import { grid, keyboard, rectAt, rectAtLoose, centreOf, flow } from '../../../web-engine/words/layout.js';
import { extendTrail, tapTrail, trailPoints, pulseFront, isDrag } from '../../../web-engine/words/drag.js';
import { progress, lift, sink, shake, hump, DURATION } from '../../../web-engine/words/motion.js';
import * as paint from './paint.js';
import { createSpangramCheer } from './cheer.js';

const KNOWN = new Set(WORDLE_GUESSES);





































const CREDIT_DOT = 12;
const CREDIT_RING = 2;


const CREDIT_PAD = 22;

function creditDot(g, chip, colour) {
  const x = chip.x + 3;
  const y = chip.y + 3;
  const ring = CREDIT_DOT + CREDIT_RING * 2;
  paint.surface(g, { x, y, w: ring, h: ring }, {
    fill: COLORS.card, offset: 0, border: 0, radius: ring / 2,
  });
  paint.surface(g, { x: x + CREDIT_RING, y: y + CREDIT_RING, w: CREDIT_DOT, h: CREDIT_DOT }, {
    fill: COLORS[colour] ?? COLORS.blue, offset: 0, border: 0, radius: CREDIT_DOT / 2,
  });
}

export const count = () => STRANDS_PUZZLES.length;


export const puzzleAt = (index) => STRANDS_PUZZLES[index] ?? null;



export function progressIn(index, saved = {}) {
  const puzzle = STRANDS_PUZZLES[index];
  const words = puzzle?.words?.length ?? 0;
  
  
  
  
  
  
  
  const real = new Set((puzzle?.words ?? []).map((w) => w.w));
  const done = (Array.isArray(saved.found) ? saved.found : []).filter((w) => real.has(w)).length;
  return {
    done, total: words, finished: words > 0 && done >= words,
    label: `${done} of ${words} words`,
  };
}
export const label = (i) => `${i + 1}. ${STRANDS_PUZZLES[i].theme}`;

export function create(app, index) {
  const puzzle = STRANDS_PUZZLES[index];
  const real = new Set(puzzle.words.map((w) => w.w));
  const saved = app.load() ?? {};
  let found = (Array.isArray(saved.found) ? saved.found : []).filter((w) => real.has(w));
  let bonus = Array.isArray(saved.bonus) ? saved.bonus : [];
  let hintsUsed = Number.isInteger(saved.hintsUsed) ? saved.hintsUsed : 0;
  let trail = [];
  let typed = '';
  let lit = [];

  let themeBand = { x: 0, y: 0, width: 0, height: 0 };
  let board = { rects: [] };
  let traceBand = { x: 0, y: 0, width: 0, height: 0 };
  let buttons = { rects: [] };
  let listBox = { x: 0, y: 0, width: 0, height: 0 };
  let wide = false;
  let hover = -1;
  let hoverAt = 0;
  let pressed = -1;
  let pressAt = 0;
  let shakeAt = -1;
  let foundAt = 0;
  let foundPath = [];
  let dragging = null;
  let cursor = 0;
  let area = { x: 0, y: 0, width: 0, height: 0 };

  
  const WIDE = 900;

  function layout(area0) {
    area = area0;
    
    
    
    
    wide = area0.width >= WIDE;
    const listW = wide ? Math.min(300, Math.round(area0.width * 0.28)) : 0;
    const box = { ...area0, width: area0.width - (wide ? listW + 20 : 0) };
    listBox = { x: area0.x + area0.width - listW, y: area0.y + 4, width: listW, height: area0.height - 8 };
    themeBand = { x: box.x, y: box.y + 2, width: box.width, height: 52 };
    const btnH = SIZES.target;
    const bottom = box.y + box.height;
    buttons = keyboard({
      box: { x: box.x, y: bottom - btnH, width: box.width, height: btnH },
      
      
      
      
      
      
      
      rows: [[
        'Clear',
        box.width < 520 ? 'Other' : 'Other word',
        `Hint (${state().hintsAvailable})`,
      ]],
      gap: 10,
      wideUnits: 1,
      maxKey: 190,
    });
    traceBand = { x: box.x, y: bottom - btnH - 52, width: box.width, height: 44 };
    board = grid({
      box: {
        x: box.x,
        y: themeBand.y + themeBand.height + 10,
        width: box.width,
        height: traceBand.y - themeBand.y - themeBand.height - 22,
      },
      cols: COLS,
      rows: ROWS,
      gap: 6,
      maxCell: 76,
      min: 34,
      
      
      
      
      shrinkToFit: true,
    });
  }

  function state() {
    return play(puzzle, found, bonus.length, hintsUsed);
  }

  
  function owners() {
    const map = new Map();
    for (const entry of puzzle.words) {
      if (!found.includes(entry.w)) continue;
      const kind = entry.w === puzzle.spangram ? 'spangram' : 'theme';
      for (const cell of entry.p) map.set(cell, kind);
    }
    return map;
  }

  
  
  
  
  const cheer = createSpangramCheer({ now: () => app.now(), motion: () => app.motion });

  function draw(g, now) {
    const s = state();
    const owner = owners();
    const wobble = shakeAt >= 0 ? shake(progress(now, shakeAt, DURATION.shake, app.motion)) : 0;
    const foundP = progress(now, foundAt, DURATION.found, app.motion);

    paint.surface(g, { x: themeBand.x, y: themeBand.y, w: themeBand.width, h: themeBand.height }, {
      fill: COLORS.card,
    });
    paint.text(g, puzzle.theme, themeBand, {
      size: SIZES.base, colour: COLORS.ink, fit: true, maxWidth: themeBand.width - 24,
    });

    board.rects.forEach((r0, i) => {
      const letter = puzzle.rows[rowOf(i)][colOf(i)];
      const kind = owner.get(i) ?? null;
      const inTrail = trail.includes(i);
      const isHover = i === hover && !kind;
      const up = isHover ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0;
      const r = { ...r0, x: r0.x + (inTrail ? wobble : 0) };
      
      
      const glow = lit.includes(i) && app.motion ? hump((now / 900) % 1) * 2 : (lit.includes(i) ? 2 : 0);
      paint.tile(g, r, {
        letter,
        state: kind,
        fill: kind ? null : (inTrail ? COLORS.ink : COLORS.card),
        lift: up + glow,
        press: inTrail ? 2 : 0,
        size: Math.round(r.h * 0.46),
        cursor: app.keyboardMode && i === cursor,
      });
      if (inTrail && !kind) {
        paint.text(g, letter, { x: r.x, y: r.y + 2, w: r.w, h: r.h }, {
          size: Math.round(r.h * 0.46), colour: COLORS.card,
        });
      }
    });

    
    
    
    
    
    
    if (trail.length) {
      paint.ribbon(g, trailPoints(trail, (i) => centreOf(board.rects[i])), {
        colour: COLORS.blue, width: Math.max(14, board.cell * 0.5), alpha: 0.3,
      });
    }
    
    
    if (foundPath.length && foundP < 1) {
      const front = pulseFront(foundPath, foundP);
      const shown = foundPath.slice(0, Math.max(2, Math.ceil(front)));
      paint.ribbon(g, trailPoints(shown, (i) => centreOf(board.rects[i])), {
        colour: COLORS.gold, width: Math.max(16, board.cell * 0.6), alpha: 0.5,
      });
    }

    
    
    
    
    
    trail.forEach((i) => {
      const r = board.rects[i];
      const letter = puzzle.rows[rowOf(i)][colOf(i)];
      paint.text(g, letter, { x: r.x, y: r.y + 2, w: r.w, h: r.h }, {
        size: Math.round(r.h * 0.46), colour: COLORS.card,
      });
    });

    const tracing = trail.length ? wordAt(puzzle.rows, trail) : typed;
    paint.text(g, tracing || `${s.foundCount} of ${s.total} words found`, traceBand, {
      size: tracing ? SIZES.h2 : SIZES.base,
      weight: tracing ? 700 : 400,
      colour: tracing ? COLORS.ink : COLORS.inkSoft,
      fit: true,
      maxWidth: traceBand.width - 20,
    });

    if (wide) drawFound(g, now);

    buttons.rects.forEach((r, i) => {
      const isHint = r.label.startsWith('Hint');
      const disabled = isHint ? s.hintsAvailable === 0 : (r.label === 'Clear' && !trail.length && !typed);
      paint.button(g, r, {
        label: r.label,
        disabled,
        size: SIZES.min,
        hover: hover === 100 + i && !disabled
          ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0,
        press: pressed === 100 + i
          ? sink(progress(now, pressAt, DURATION.press, app.motion), app.motion) : 0,
      });
    });

    
    
    
    cheer.draw(g, app.width, app.height);
  }

  







  function drawFound(g, now) {
    paint.surface(g, { x: listBox.x, y: listBox.y, w: listBox.width, h: listBox.height }, {
      fill: COLORS.card,
    });
    const s = state();
    paint.text(g, `Found ${s.foundCount} of ${s.total}`,
      { x: listBox.x, y: listBox.y + 10, width: listBox.width, height: 32 },
      { size: SIZES.small, colour: COLORS.ink });
    paint.rule(g, listBox.x + 14, listBox.y + 46, listBox.width - 28);

    const box = {
      x: listBox.x + 14, y: listBox.y + 60, width: listBox.width - 28, height: listBox.height - 130,
    };
    g.font = paint.font(SIZES.small, 700);
    
    
    
    
    
    
    const credits = found.map((w) => app.credit?.('found', w) ?? null);
    const sizes = found.map((w, i) => ({
      
      
      
      
      
      
      w: Math.ceil(g.measureText(w).width) + 56 + (credits[i] ? CREDIT_PAD : 0),
      h: 32,
    }));
    const rects = flow({ box, sizes, gap: 8 }).rects;
    const pop = progress(now, foundAt, DURATION.found, app.motion);

    found.forEach((w, i) => {
      const r = rects[i];
      if (!r || r.y + r.h > box.y + box.height) return;
      const isSpangram = w === puzzle.spangram;
      const newest = w === found[found.length - 1] && pop < 1;
      const grow = newest ? hump(pop) * 3 : 0;
      const rr = { x: r.x - grow, y: r.y - grow, w: r.w + grow * 2, h: r.h + grow * 2 };
      
      
      paint.tile(g, rr, {
        letter: w,
        state: isSpangram ? 'spangram' : 'theme',
        size: SIZES.min,
      });
      if (credits[i]) creditDot(g, rr, credits[i].colour);
    });

    if (!found.length) {
      paint.text(g, 'Words you find appear here.',
        { x: box.x, y: box.y, width: box.width, height: 40 },
        { size: SIZES.min, weight: 400, colour: COLORS.inkSoft, fit: true, maxWidth: box.width });
    }

    
    
    
    
    
    
    paint.text(g, `${bonus.length} other word${bonus.length === 1 ? '' : 's'}, `
      + `${s.towardsHint}/${WORDS_PER_HINT} to a hint`,
      { x: listBox.x + 14, y: listBox.y + listBox.height - 56, width: listBox.width - 28, height: 40 },
      { size: SIZES.min, weight: 400, colour: COLORS.inkSoft, align: 'left',
        fit: true, maxWidth: listBox.width - 28 });
  }

  function lockIn(entry) {
    found = [...found, entry.w];
    foundPath = entry.p;
    foundAt = app.now();
    trail = [];
    typed = '';
    lit = [];
    app.save({ found, bonus, hintsUsed });
    const msg = entry.w === puzzle.spangram
      ? `${entry.w}. That is the spangram.`
      : `Found ${entry.w}.`;
    app.message = msg;
    app.announce(msg);
    app.sound(entry.w === puzzle.spangram ? 'spangram' : 'word');
    if (entry.w === puzzle.spangram) cheer.start();
    app.invalidate();
    if (found.length === puzzle.words.length) { app.sound('win'); app.finished(true); }
  }

  
  function submitBonus() {
    const word = trail.length ? wordAt(puzzle.rows, trail) : typed.toUpperCase();
    trail = [];
    typed = '';
    let msg;
    if (word.length < MIN_BONUS_LENGTH) msg = `${word || 'That'} is too short.`;
    else if (real.has(word)) msg = `${word} is a theme word - trace it on the board.`;
    else if (bonus.includes(word)) msg = `You already found ${word}.`;
    else if (word.length === 5 && !KNOWN.has(word)) msg = `${word} is not in the word list.`;
    else {
      bonus = [...bonus, word];
      app.save({ found, bonus, hintsUsed });
      const togo = WORDS_PER_HINT - (bonus.length % WORDS_PER_HINT);
      msg = bonus.length % WORDS_PER_HINT === 0
        ? `${word}. That earns a hint.`
        : `${word}. ${togo} more for a hint.`;
      app.message = msg;
      app.announce(msg);
      app.invalidate();
      return;
    }
    shakeAt = app.now();
    app.message = msg;
    app.announce(msg);
    app.sound('reject');
    app.invalidate();
  }

  
  function submitTrail() {
    if (trail.length) {
      const hit = themeWordAt(puzzle, trail);
      if (hit && !found.includes(hit.w)) { lockIn(hit); return true; }
      
      
      shakeAt = app.now();
      app.invalidate();
      return false;
    }
    if (typed) {
      
      
      
      
      const hit = puzzle.words.find((e) => e.w === typed.toUpperCase() && !found.includes(e.w));
      if (hit) { lockIn(hit); return true; }
      submitBonus();
      return false;
    }
    return false;
  }

  function useHint() {
    const s = state();
    if (s.hintsAvailable <= 0) return;
    lit = hintCells(puzzle, found);
    hintsUsed += 1;
    app.save({ found, bonus, hintsUsed });
    app.message = 'One word is lit up. The letters are right; the order is yours.';
    app.announce(app.message);
    layout(area);
    app.invalidate();
  }

  function pressButton(i) {
    const name = buttons.rects[i].label;
    
    
    if (name === 'Clear') { trail = []; typed = ''; }
    else if (name.startsWith('Hint')) useHint();
    else submitBonus();
    app.invalidate();
  }

  function hitAt(pt) {
    const cell = rectAt(board.rects, pt.x, pt.y);
    if (cell >= 0) return cell;
    const btn = rectAt(buttons.rects, pt.x, pt.y);
    return btn >= 0 ? 100 + btn : -1;
  }

  return {
    id: 'strands',
    layout,
    reload: (s) => {
      const wasDone = found.length === puzzle.words.length;
      if (Array.isArray(s.found)) {
        if (s.found.length !== found.length) foundAt = app.now();
        found = s.found;
      }
      if (Array.isArray(s.bonus)) bonus = s.bonus;
      if (Number.isInteger(s.hintsUsed)) hintsUsed = s.hintsUsed;
      layout(area);
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      if (!wasDone && found.length === puzzle.words.length) {
        app.sound('win');
        app.finished(true);
      }
    },
    rects: () => [
      ...board.rects.map((r, i) => ({ id: `cell:${i}`, ...r })),
      ...buttons.rects.map((r) => ({ id: `btn:${r.label}`, ...r })),
    ],
    draw,
    pointerDown: (pt) => {
      const hit = hitAt(pt);
      pressed = hit;
      pressAt = app.now();
      if (hit >= 0) app.sound('press');
      if (hit >= 0 && hit < 100) {
        typed = '';
        trail = tapTrail(trail, hit, trail.length ? adjacent(trail[trail.length - 1], hit) : false);
        dragging = { from: pt, drawing: false };
        
        
        if (themeWordAt(puzzle, trail)) submitTrail();
      }
      app.invalidate();
    },
    pointerMove: (pt) => {
      if (dragging) {
        if (!dragging.drawing && !isDrag(dragging.from, pt)) return;
        dragging.drawing = true;
        
        
        const cell = rectAtLoose(board.rects, pt.x, pt.y, -Math.round(board.cell * 0.14));
        if (cell >= 0) {
          const next = extendTrail(trail, cell, {
            adjacent: trail.length ? adjacent(trail[trail.length - 1], cell) : true,
            onBreak: 'ignore',
          });
          if (next !== trail) {
            
            if (next.length > trail.length) app.sound('trail', { index: next.length - 1 });
            trail = next;
            app.invalidate();
          }
        }
        return;
      }
      const hit = hitAt(pt);
      if (hit !== hover) { hover = hit; hoverAt = app.now(); app.invalidate(); }
    },
    pointerLeave: () => { hover = -1; pressed = -1; dragging = null; app.invalidate(); },
    pointerUp: (pt) => {
      const was = pressed;
      const drew = dragging && dragging.drawing;
      dragging = null;
      pressed = -1;
      app.invalidate();
      if (drew) { submitTrail(); return; }
      const hit = hitAt(pt);
      if (hit >= 100 && hit === was) pressButton(hit - 100);
    },
    key: (action) => {
      if (action.type === 'letter') {
        trail = [];
        typed += action.value;
        app.message = '';
        app.invalidate();
        return true;
      }
      if (action.type === 'delete') {
        if (trail.length) trail = trail.slice(0, -1);
        else typed = typed.slice(0, -1);
        app.invalidate();
        return true;
      }
      if (action.type === 'submit') {
        if (app.keyboardMode && !typed) {
          trail = tapTrail(trail, cursor, trail.length ? adjacent(trail[trail.length - 1], cursor) : false);
          if (themeWordAt(puzzle, trail)) submitTrail();
          app.invalidate();
          return true;
        }
        submitTrail();
        return true;
      }
      if (action.type === 'move') {
        const next = cursor + action.dx + action.dy * COLS;
        const sameRow = action.dy !== 0 || rowOf(next) === rowOf(cursor);
        if (next >= 0 && next < COLS * ROWS && sameRow) { cursor = next; app.invalidate(); }
        return true;
      }
      return false;
    },
    describe: () => {
      const base = describeStrands({
        puzzle,
        found,
        bonus,
        hintsUsed,
        trail: trail.length ? [...wordAt(puzzle.rows, trail)] : [...typed],
        index: index + 1,
      });
      
      
      
      
      
      
      const credits = [
        ...found.map((w) => {
          const c = app.credit?.('found', w);
          return c ? `${w}, found by ${c.name}.` : null;
        }),
        ...bonus.map((w) => {
          const c = app.credit?.('bonus', w);
          return c ? `Other word ${w}, found by ${c.name}.` : null;
        }),
      ].filter(Boolean);
      return credits.length ? { ...base, lines: [...base.lines, ...credits] } : base;
    },
    animating: (now) => cheer.running() || (app.motion && (
      (shakeAt >= 0 && now - shakeAt < DURATION.shake)
      || now - foundAt < DURATION.found
      || now - hoverAt < DURATION.hover
      || now - pressAt < DURATION.press
      || lit.length > 0
    )),
    keys: 'Drag across letters that touch to spell a theme word, or type it and press Enter.',
    help: [
      'Every letter on the board belongs to one word about the theme.',
      'Drag across letters that touch - corners count - to spell one.',
      'Drag back over the last letter to rub it out.',
      'You can also type a word and press Enter.',
      'The spangram names the theme and crosses the whole board.',
      `Find ${WORDS_PER_HINT} other words of ${MIN_BONUS_LENGTH} letters or more to earn a hint.`,
    ],
    
    
    
    marks: { theme: STATES.theme.mark, spangram: STATES.spangram.mark },
  };
}
