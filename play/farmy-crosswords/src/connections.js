










import { COLORS, SIZES } from '../../../web-engine/words/style.js';
import {
  checkSelection, boardOrder, play, seededShuffle,
  EXACT, ONE_AWAY, REPEAT, GROUP_SIZE, MAX_MISTAKES,
} from '../../../web-engine/words/connectionsRules.js';
import { BANDS, STATES } from '../../../web-engine/words/style.js';
import { CONNECTIONS_PUZZLES } from '../../../web-engine/words/data/connectionsPuzzles.js';
import { describeConnections } from '../../../web-engine/words/describe.js';
import { grid, keyboard, rectAt, rectAtLoose } from '../../../web-engine/words/layout.js';
import { isDrag } from '../../../web-engine/words/drag.js';
import { progress, lift, sink, shake, hump, DURATION } from '../../../web-engine/words/motion.js';
import * as paint from './paint.js';

export const count = () => CONNECTIONS_PUZZLES.length;
export const label = (i) => `Set ${i + 1}`;

export function create(app, index) {
  const puzzle = CONNECTIONS_PUZZLES[index];
  const saved = app.load() ?? {};
  let selections = Array.isArray(saved.selections) ? saved.selections : [];
  let picked = [];
  let order = boardOrder(puzzle);

  let banners = [];
  let board = { rects: [] };
  let words = [];              
  let buttons = { rects: [] };
  let pipRects = [];
  let hover = -1;
  let hoverAt = 0;
  let pressed = -1;
  let pressAt = 0;
  let shakeAt = -1;
  let solveAt = 0;
  let sweep = null;
  let cursor = 0;
  let area = { x: 0, y: 0, width: 0, height: 0 };

  const state = () => play(puzzle, selections);

  function visibleWords() {
    const s = state();
    if (s.over && !s.won) return [];
    const solved = new Set(puzzle.groups
      .filter((g) => s.solved.includes(g.name))
      .flatMap((g) => g.words));
    return order.filter((w) => !solved.has(w));
  }

  function shownGroups() {
    const s = state();
    return s.over && !s.won
      ? puzzle.groups                              
      : puzzle.groups.filter((g) => s.solved.includes(g.name));
  }

  function layout(box) {
    area = box;
    const groups = shownGroups();
    const bannerH = 56;
    banners = groups.map((g, i) => ({
      x: box.x, y: box.y + i * (bannerH + 8), w: box.width, h: bannerH, group: g,
    }));
    const afterBanners = box.y + groups.length * (bannerH + 8);

    const btnH = SIZES.target;
    const pipsH = 40;
    const bottom = box.y + box.height;
    buttons = keyboard({
      box: { x: box.x, y: bottom - btnH, width: box.width, height: btnH },
      rows: [['Shuffle', 'Clear', 'Submit']],
      gap: 10,
      wideUnits: 1,
      maxKey: 150,
    });
    const pipsY = bottom - btnH - pipsH;
    pipRects = Array.from({ length: MAX_MISTAKES }, (_, i) => ({
      x: box.x + 110 + i * 34, y: pipsY + 4, w: 28, h: 28,
    }));

    words = visibleWords();
    const rows = Math.max(1, Math.ceil(words.length / 4));
    board = grid({
      box: { x: box.x, y: afterBanners + 4, width: box.width, height: pipsY - afterBanners - 12 },
      cols: 4,
      rows,
      gap: 8,
      maxCell: 130,
      min: 56,
      centreY: true,
    });
    board.rects = board.rects.slice(0, words.length);
  }

  function draw(g, now) {
    const s = state();
    const wobble = shakeAt >= 0 ? shake(progress(now, shakeAt, DURATION.shake, app.motion)) : 0;
    const solveP = progress(now, solveAt, DURATION.found, app.motion);

    banners.forEach((b, i) => {
      const band = BANDS[puzzle.groups.indexOf(b.group)];
      
      
      const pop = i === banners.length - 1 && solveP < 1 ? hump(solveP) * 4 : 0;
      const r = { x: b.x - pop, y: b.y - pop, w: b.w + pop * 2, h: b.h + pop * 2 };
      paint.surface(g, r, { fill: COLORS[STATES[band].fill], offset: SIZES.shadow });
      paint.text(g, `${STATES[band].mark}  ${b.group.name}`,
        { x: r.x + 16, y: r.y, w: r.w * 0.42, h: r.h },
        { size: SIZES.small, colour: COLORS.card, align: 'left', fit: true, maxWidth: r.w * 0.42 });
      paint.text(g, b.group.words.join(', '),
        { x: r.x + r.w * 0.44, y: r.y, w: r.w * 0.54, h: r.h },
        { size: SIZES.small, weight: 400, colour: COLORS.card, align: 'left', fit: true, maxWidth: r.w * 0.54 });
    });

    board.rects.forEach((r0, i) => {
      const word = words[i];
      const isPicked = picked.includes(word);
      const isHover = i === hover;
      const up = isHover && !isPicked
        ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0;
      const down = isPicked ? SIZES.shadow : 0;
      const r = { ...r0, x: r0.x + (isPicked ? wobble : 0) };
      paint.tile(g, r, {
        letter: word,
        fill: isPicked ? COLORS.ink : COLORS.card,
        lift: up,
        press: down,
        size: SIZES.min,
        cursor: app.keyboardMode && i === cursor,
      });
      if (isPicked) {
        
        
        paint.text(g, word, { x: r.x, y: r.y + down, w: r.w, h: r.h }, {
          size: SIZES.min, colour: COLORS.card, fit: true, maxWidth: r.w - 10,
        });
      }
    });

    paint.text(g, 'Mistakes', { x: area.x, y: pipRects[0].y - 4, w: 100, h: 34 },
      { size: SIZES.small, weight: 400, colour: COLORS.inkSoft, align: 'left' });
    pipRects.forEach((r, i) => {
      const spent = i < s.mistakes;
      paint.surface(g, r, { fill: spent ? COLORS[STATES.mistake.fill] : COLORS.card, offset: 0 });
      if (spent) {
        paint.text(g, STATES.mistake.mark, r, { size: SIZES.min, colour: COLORS.card });
      }
    });

    buttons.rects.forEach((r, i) => {
      const disabled = r.label === 'Submit'
        ? (s.over || picked.length !== GROUP_SIZE)
        : (r.label === 'Clear' ? picked.length === 0 : s.over);
      paint.button(g, r, {
        label: r.label,
        disabled,
        tone: r.label === 'Submit' && !disabled ? 'green' : null,
        hover: hover === 100 + i && !disabled
          ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0,
        press: pressed === 100 + i
          ? sink(progress(now, pressAt, DURATION.press, app.motion), app.motion) : 0,
      });
    });
  }

  function toggle(word) {
    if (picked.includes(word)) picked = picked.filter((w) => w !== word);
    else if (picked.length < GROUP_SIZE) picked = [...picked, word];
    app.invalidate();
  }

  function submit() {
    const s = state();
    if (s.over || picked.length !== GROUP_SIZE) return;
    const result = checkSelection(picked, puzzle.groups, s.previous);
    if (result.kind === REPEAT) {
      app.sound('reject');
      shakeAt = app.now();
      app.message = result.message;
      app.announce(result.message);
      app.invalidate();
      return;
    }
    selections = [...selections, [...picked]];
    app.save({ selections });
    const now = play(puzzle, selections);
    if (result.kind === EXACT) {
      picked = [];
      solveAt = app.now();
      app.message = result.group.name;
      app.announce(`Yes. ${result.group.name}.`);
      app.sound('word');
    } else {
      app.sound('reject');
      shakeAt = app.now();
      app.message = result.kind === ONE_AWAY
        ? `One away. ${now.mistakesLeft} left.`
        : `Not a group. ${now.mistakesLeft} left.`;
      app.announce(app.message);
    }
    layout(area);
    app.invalidate();
    if (now.over) { if (now.won) app.sound('win'); app.finished(now.won); }
  }

  function pressButton(i) {
    const name = buttons.rects[i].label;
    if (name === 'Shuffle') { order = seededShuffle(order, (app.now() & 0xffff) || 1); layout(area); }
    else if (name === 'Clear') picked = [];
    else submit();
    app.invalidate();
  }

  function hitAt(pt) {
    const tile = rectAt(board.rects, pt.x, pt.y);
    if (tile >= 0) return tile;
    const btn = rectAt(buttons.rects, pt.x, pt.y);
    return btn >= 0 ? 100 + btn : -1;
  }

  return {
    id: 'connections',
    layout,
    rects: () => [
      ...board.rects.map((r, i) => ({ id: `tile:${words[i]}`, ...r })),
      ...buttons.rects.map((r) => ({ id: `btn:${r.label}`, ...r })),
    ],
    draw,
    pointerDown: (pt) => {
      const hit = hitAt(pt);
      pressed = hit;
      pressAt = app.now();
      if (hit >= 0) app.sound('press');
      if (hit >= 0 && hit < 100) sweep = { from: pt, drawing: false, touched: new Set([hit]) };
      app.invalidate();
    },
    pointerMove: (pt) => {
      if (sweep) {
        if (!sweep.drawing) {
          if (!isDrag(sweep.from, pt)) return;
          sweep.drawing = true;
          
          
          
          const first = [...sweep.touched][0];
          if (!picked.includes(words[first])) toggle(words[first]);
        }
        const i = rectAtLoose(board.rects, pt.x, pt.y, 6);
        if (i >= 0 && !sweep.touched.has(i)) {
          sweep.touched.add(i);
          if (!picked.includes(words[i])) {
            app.sound('trail', { index: picked.length });
            toggle(words[i]);
          }
        }
        return;
      }
      const hit = hitAt(pt);
      if (hit !== hover) { hover = hit; hoverAt = app.now(); app.invalidate(); }
    },
    pointerLeave: () => { hover = -1; pressed = -1; sweep = null; app.invalidate(); },
    pointerUp: (pt) => {
      const was = pressed;
      const drew = sweep && sweep.drawing;
      sweep = null;
      pressed = -1;
      app.invalidate();
      
      
      
      
      
      
      
      
      if (drew) return;
      const hit = hitAt(pt);
      if (hit < 0 || hit !== was) return;
      if (hit >= 100) pressButton(hit - 100);
      else toggle(words[hit]);
    },
    key: (action) => {
      if (action.type === 'submit') {
        if (app.keyboardMode && picked.length !== GROUP_SIZE) { toggle(words[cursor]); return true; }
        submit();
        return true;
      }
      if (action.type === 'delete') { picked = []; app.invalidate(); return true; }
      if (action.type === 'move') {
        const cols = 4;
        const next = cursor + action.dx + action.dy * cols;
        if (next >= 0 && next < words.length) { cursor = next; app.invalidate(); }
        return true;
      }
      return false;
    },
    describe: () => describeConnections({
      puzzle, state: state(), board: order, picked, index: index + 1,
    }),
    animating: (now) => app.motion && (
      (shakeAt >= 0 && now - shakeAt < DURATION.shake)
      || now - solveAt < DURATION.found
      || now - hoverAt < DURATION.hover
      || now - pressAt < DURATION.press
    ),
    keys: 'Drag across four words that go together, or click them and press Enter.',
    help: [
      'Sixteen words hide four groups of four.',
      'Drag across four words to select them, or click them one at a time.',
      'You can be wrong four times.',
      'A guess holding three of one group is told so.',
      'Each group has a colour and a shape: circle, triangle, square, diamond, easiest first.',
    ],
  };
}
