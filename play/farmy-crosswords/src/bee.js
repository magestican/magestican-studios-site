











import { COLORS, SIZES } from '../../../web-engine/words/style.js';
import {
  scoreWord, isPangram, rejectReason, rankFor, MIN_LENGTH,
} from '../../../web-engine/words/beeRules.js';
import { BEE_PUZZLES } from '../../../web-engine/words/data/beePuzzles.js';
import { describeBee } from '../../../web-engine/words/describe.js';
import {
  hive, keyboard, rectAt, rectAtLoose, flow, centreOf,
} from '../../../web-engine/words/layout.js';
import { trailPoints, isDrag } from '../../../web-engine/words/drag.js';
import { progress, lift, sink, shake, DURATION } from '../../../web-engine/words/motion.js';
import * as paint from './paint.js';

export const count = () => BEE_PUZZLES.length;
export const label = (i) => `Hive ${i + 1}, middle ${BEE_PUZZLES[i].centre}`;

export function create(app, index) {
  const puzzle = BEE_PUZZLES[index];
  const valid = new Set(puzzle.answers);
  const saved = app.load() ?? {};
  let found = (Array.isArray(saved.found) ? saved.found : []).filter((w) => valid.has(w));
  let typed = '';
  let outer = puzzle.letters.filter((c) => c !== puzzle.centre);

  let cells = [];              
  let letters = [];            
  let buttons = { rects: [] };
  let entry = { x: 0, y: 0, width: 0, height: 0 };
  let rankBand = { x: 0, y: 0, width: 0, height: 0 };
  let listBox = { x: 0, y: 0, width: 0, height: 0 };
  let pills = [];

  let hover = -1;
  let hoverAt = 0;
  let pressed = -1;
  let pressAt = 0;
  let shakeAt = -1;
  let stroke = null;           
  let cursor = 0;

  function letterOrder() {
    
    return [puzzle.centre, ...outer];
  }

  function layout(area) {
    
    
    
    
    
    entry = { x: area.x, y: area.y + 4, width: area.width, height: 56 };
    const btnH = SIZES.target;
    const rankH = 40;
    const listH = Math.min(160, Math.max(76, area.height * 0.2));
    const bottom = area.y + area.height;
    const listTop = bottom - listH;
    const rankTop = listTop - rankH - 10;
    const btnTop = rankTop - btnH - 14;
    const hiveTop = entry.y + entry.height + 12;
    const hiveH = Math.max(190, btnTop - hiveTop - 14);
    
    
    const gap = 10;
    const cell = Math.max(52, Math.min(104, Math.floor(Math.min(hiveH, area.width) / 3.4) - gap));
    cells = hive({ cx: area.x + area.width / 2, cy: hiveTop + hiveH / 2, cell, gap });
    letters = letterOrder();

    buttons = keyboard({
      box: { x: area.x, y: btnTop, width: Math.min(area.width, 520), height: btnH },
      rows: [['Delete', 'Shuffle', 'Enter']],
      gap: 10,
      wideUnits: 1,
      maxKey: 160,
    });
    
    
    const shift = Math.round((area.width - Math.min(area.width, 520)) / 2);
    buttons.rects = buttons.rects.map((r) => ({ ...r, x: r.x + shift }));

    rankBand = { x: area.x, y: rankTop, width: area.width, height: rankH };
    listBox = { x: area.x, y: listTop, width: area.width, height: listH };
  }

  function score() {
    return found.reduce((t, w) => t + scoreWord(w, puzzle.letters), 0);
  }

  function draw(g, now) {
    const wobble = shakeAt >= 0 ? shake(progress(now, shakeAt, DURATION.shake, app.motion)) : 0;

    
    
    paint.surface(g, { x: entry.x + wobble, y: entry.y, w: entry.width, h: entry.height }, {
      fill: COLORS.card, offset: 0,
    });
    paint.text(g, typed || 'Type or drag a word',
      { x: entry.x + wobble, y: entry.y, width: entry.width, height: entry.height }, {
        size: typed ? SIZES.h2 : SIZES.base,
        weight: typed ? 700 : 400,
        colour: typed ? COLORS.ink : COLORS.inkSoft,
        fit: true,
        maxWidth: entry.width - 24,
      });

    cells.forEach((r, i) => {
      const isHover = i === hover;
      const isPress = i === pressed || (stroke && stroke.path[stroke.path.length - 1] === i);
      const up = isHover ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0;
      const down = isPress ? sink(progress(now, pressAt, DURATION.press, app.motion), app.motion) : 0;
      paint.tile(g, r, {
        letter: letters[i],
        
        
        fill: i === 0 ? COLORS.gold : COLORS.card,
        state: null,
        lift: up,
        press: down,
        size: Math.round(r.h * 0.5),
        cursor: app.keyboardMode && i === cursor,
      });
      if (i === 0) {
        
        
        paint.text(g, letters[0], { x: r.x, y: r.y + down, w: r.w, h: r.h }, {
          size: Math.round(r.h * 0.5), colour: COLORS.card,
        });
      }
    });

    
    
    if (stroke && stroke.path.length) {
      paint.ribbon(g, trailPoints(stroke.path, (i) => centreOf(cells[i])), {
        colour: COLORS.blue, width: Math.max(16, cells[0].w * 0.42), alpha: 0.3,
      });
    }

    buttons.rects.forEach((r, i) => {
      const isHover = hover === 100 + i;
      const isPress = pressed === 100 + i;
      paint.button(g, r, {
        label: r.label,
        hover: isHover ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0,
        press: isPress ? sink(progress(now, pressAt, DURATION.press, app.motion), app.motion) : 0,
      });
    });

    const s = score();
    const rank = rankFor(s, puzzle);
    const trackW = Math.min(240, rankBand.width * 0.35);
    const trackX = rankBand.x + rankBand.width - trackW;
    paint.text(g, `${rank.name} - found ${found.length} of ${puzzle.answers.length}`,
      { x: rankBand.x, y: rankBand.y, width: rankBand.width - trackW - 12, height: rankBand.height },
      { size: SIZES.small, colour: COLORS.ink, align: 'left', fit: true, maxWidth: rankBand.width - trackW - 20 });
    paint.surface(g, { x: trackX, y: rankBand.y + 6, w: trackW, h: 22 }, { offset: 0, border: SIZES.border });
    const fillW = Math.round((trackW - 6) * (rank.max ? s / rank.max : 0));
    if (fillW > 0) {
      g.fillStyle = COLORS.green;
      paint.roundRect(g, trackX + 3, rankBand.y + 9, fillW, 16, 3);
      g.fill();
    }
    
    
    paint.text(g, rank.next ? `${s} points, ${rank.toNext} to ${rank.next}` : `${s} points, every word found`,
      { x: rankBand.x, y: rankBand.y, width: rankBand.width - trackW - 12, height: rankBand.height },
      { size: SIZES.small, weight: 400, colour: COLORS.inkSoft, align: 'right' });

    
    g.font = paint.font(SIZES.small, 700);
    const sizes = found.map((w) => ({ w: Math.ceil(g.measureText(w).width) + 20, h: 30 }));
    pills = flow({ box: listBox, sizes, gap: 8 }).rects;
    found.forEach((w, i) => {
      const r = pills[i];
      if (!r || r.y + r.h > listBox.y + listBox.height) return;
      const pangram = isPangram(w, puzzle.letters);
      paint.surface(g, r, { fill: pangram ? COLORS.gold : COLORS.card, offset: 0 });
      paint.text(g, w, r, {
        size: SIZES.small, colour: pangram ? COLORS.card : COLORS.ink, fit: true, maxWidth: r.w - 8,
      });
    });
  }

  function submit() {
    const word = typed.toUpperCase();
    const why = rejectReason(word, puzzle, new Set(found));
    typed = '';
    if (why) {
      shakeAt = app.now();
      app.message = why;
      app.announce(why);
      app.invalidate();
      return;
    }
    found = [...found, word].sort();
    app.save({ found });
    const points = scoreWord(word, puzzle.letters);
    const msg = isPangram(word, puzzle.letters)
      ? `${word}. Pangram, ${points} points.`
      : `${word}, ${points} ${points === 1 ? 'point' : 'points'}.`;
    app.message = msg;
    app.announce(msg);
    app.invalidate();
    if (found.length === puzzle.answers.length) app.finished(true);
  }

  function pressButton(i) {
    const name = buttons.rects[i].label;
    if (name === 'Delete') typed = typed.slice(0, -1);
    else if (name === 'Shuffle') {
      for (let k = outer.length - 1; k > 0; k -= 1) {
        const j = Math.floor(Math.random() * (k + 1));
        [outer[k], outer[j]] = [outer[j], outer[k]];
      }
      letters = letterOrder();
    } else submit();
    app.invalidate();
  }

  function hitAt(pt) {
    const cell = rectAt(cells, pt.x, pt.y);
    if (cell >= 0) return cell;
    const btn = rectAt(buttons.rects, pt.x, pt.y);
    return btn >= 0 ? 100 + btn : -1;
  }

  return {
    id: 'bee',
    layout,
    rects: () => [
      ...cells.map((r, i) => ({ id: `key:${letters[i]}`, ...r })),
      ...buttons.rects.map((r) => ({ id: `btn:${r.label}`, ...r })),
    ],
    draw,
    pointerDown: (pt) => {
      const hit = hitAt(pt);
      pressed = hit;
      pressAt = app.now();
      if (hit >= 0 && hit < 100) {
        typed += letters[hit];
        app.message = '';
        stroke = { from: pt, path: [hit], lastCell: hit, drawing: false };
      }
      app.invalidate();
    },
    pointerMove: (pt) => {
      if (stroke) {
        if (!stroke.drawing && !isDrag(stroke.from, pt)) return;
        stroke.drawing = true;
        
        
        const cell = rectAtLoose(cells, pt.x, pt.y, 10);
        
        
        
        if (cell >= 0 && cell !== stroke.lastCell) {
          typed += letters[cell];
          stroke.lastCell = cell;
          stroke.path = [...stroke.path, cell];
          app.invalidate();
        }
        return;
      }
      const hit = hitAt(pt);
      if (hit !== hover) { hover = hit; hoverAt = app.now(); app.invalidate(); }
    },
    pointerLeave: () => { hover = -1; pressed = -1; stroke = null; app.invalidate(); },
    pointerUp: (pt) => {
      const was = pressed;
      const drawing = stroke && stroke.drawing;
      stroke = null;
      pressed = -1;
      app.invalidate();
      
      
      if (drawing) { submit(); return; }
      const hit = hitAt(pt);
      if (hit >= 100 && hit === was) pressButton(hit - 100);
    },
    key: (action) => {
      if (action.type === 'letter') { typed += action.value; app.message = ''; app.invalidate(); return true; }
      if (action.type === 'delete') { typed = typed.slice(0, -1); app.invalidate(); return true; }
      if (action.type === 'submit') {
        if (app.keyboardMode && !typed) { typed += letters[cursor]; app.invalidate(); return true; }
        submit();
        return true;
      }
      if (action.type === 'move') {
        
        
        if (action.dx) cursor = cursor === 0 ? 1 : (((cursor - 1 + action.dx + 6) % 6) + 1);
        else cursor = cursor === 0 ? 1 : 0;
        app.invalidate();
        return true;
      }
      return false;
    },
    describe: () => describeBee({ puzzle, found, typed, index: index + 1 }),
    animating: (now) => app.motion && (
      (shakeAt >= 0 && now - shakeAt < DURATION.shake)
      || now - hoverAt < DURATION.hover
      || now - pressAt < DURATION.press
    ),
    keys: `Type a word and press Enter, or drag across the letters. Every word needs the middle letter, ${puzzle.centre}.`,
    help: [
      `Make words of ${MIN_LENGTH} letters or more from the seven letters.`,
      `Every word must use the middle letter, ${puzzle.centre}.`,
      'Letters can be used more than once.',
      'A word using all seven letters is a pangram and is worth seven extra points.',
      'Drag across the letters to spell a word, or just type it.',
    ],
  };
}
