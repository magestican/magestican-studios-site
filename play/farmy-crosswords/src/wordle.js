











import { COLORS, SIZES } from '../../../web-engine/words/style.js';
import {
  keyboardState, rejectReason, play, verdict, MAX_GUESSES, WORD_LENGTH,
  hintFor, describeHint, HINTS_ALLOWED,
} from '../../../web-engine/words/wordleRules.js';
import { WORDLE_ANSWERS, WORDLE_GUESSES } from '../../../web-engine/words/data/wordleWords.js';
import { describeWordle, summariseGuess, lettersKnown } from '../../../web-engine/words/describe.js';
import { grid, keyboard, rectAt } from '../../../web-engine/words/layout.js';
import {
  progress, lift, sink, shake, stagger, flipScale, flipTurned, DURATION,
} from '../../../web-engine/words/motion.js';
import * as paint from './paint.js';

const ALLOWED = new Set(WORDLE_GUESSES);

const KEYS = [
  'QWERTYUIOP'.split(''),
  'ASDFGHJKL'.split(''),
  ['ENTER', ...'ZXCVBNM'.split(''), 'DEL'],
];

export const count = () => WORDLE_ANSWERS.length;


export const puzzleAt = (index) => WORDLE_ANSWERS[index] ?? null;















export function progressIn(index, saved = {}) {
  const guesses = Array.isArray(saved.guesses) ? saved.guesses : [];
  const answer = (WORDLE_ANSWERS[index] ?? '').toUpperCase();
  const won = guesses.some((g) => String(g).toUpperCase() === answer);
  const out = guesses.length >= MAX_GUESSES;
  return {
    done: won ? 1 : 0,
    total: 1,
    finished: won || out,
    label: won
      ? `Solved in ${guesses.length}`
      : (out ? 'Out of guesses' : `${guesses.length} of ${MAX_GUESSES} guesses`),
  };
}
export const label = (i) => `Puzzle ${i + 1}`;

export function create(app, index) {
  const answer = WORDLE_ANSWERS[index];
  const saved = app.load() ?? {};
  let guesses = (Array.isArray(saved.guesses) ? saved.guesses : []).filter((w) => ALLOWED.has(w));
  let typed = '';
  
  
  
  
  let given = Array.isArray(saved.given) ? saved.given.filter((h) => h && Number.isInteger(h.index)) : [];
  let buttons = { rects: [] };
  
  
  let hintHasRow = true;
  let board = { rects: [], cell: 48 };
  let keys = { rects: [] };
  let statusBand = { x: 0, y: 0, width: 0, height: 0 };
  let hover = -1;
  let hoverAt = 0;
  let press = -1;
  let pressAt = 0;
  let revealRow = -1;      
  let revealAt = 0;
  let shakeAt = -1;        
  let cursor = 0;          

  const hintsLeft = () => Math.max(0, HINTS_ALLOWED - given.length);
  const hintLabel = () => `Hint (${hintsLeft()})`;

  







  function useHint() {
    const s = state();
    if (s.over) return;
    const hint = hintFor(answer, guesses, given);
    if (!hint) {
      const why = hintsLeft() ? 'Every letter is already known.' : 'No hints left.';
      app.message = why;
      app.announce(why);
      app.invalidate();
      return;
    }
    given = [...given, hint];
    app.save({ guesses, given });
    const said = describeHint(hint);
    app.message = said;
    app.announce(said);
    app.sound('hint');
    
    app.relayout?.();
    app.invalidate();
  }

  function layout(area) {
    
    
    
    
    const kbHeight = Math.min(216, Math.max(3 * SIZES.target + 12, area.height * 0.34));
    const kbTop = area.y + area.height - kbHeight;
    keys = keyboard({
      box: { x: area.x, y: kbTop, width: area.width, height: kbHeight }, rows: KEYS, gap: 6,
    });
    
    
    
    
    
    
    
    
    
    const btnH = SIZES.target;
    const bandH = 66;
    const bandDrop = 74;

    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const boardNeeds = MAX_GUESSES * SIZES.tile + (MAX_GUESSES - 1) * 8;
    const roomWithButton = (kbTop - btnH - 8 - bandDrop) - (area.y + 4) - 12;
    hintHasRow = roomWithButton >= boardNeeds;

    buttons = hintHasRow
      ? keyboard({
        box: { x: area.x, y: kbTop - btnH - 8, width: area.width, height: btnH },
        rows: [[hintLabel()]],
        gap: 10,
        wideUnits: 1,
        maxKey: 200,
      })
      : { rects: [], height: 0 };

    const bandBottom = hintHasRow ? buttons.rects[0].y : kbTop - 8;
    statusBand = { x: area.x, y: bandBottom - bandDrop, width: area.width, height: bandH };
    board = grid({
      box: { x: area.x, y: area.y + 4, width: area.width, height: statusBand.y - area.y - 12 },
      cols: WORD_LENGTH,
      rows: MAX_GUESSES,
      gap: 8,
      maxCell: 68,
      min: 40,
      
      
      
      centreY: true,
      
      
      
      
      shrinkToFit: true,
    });
  }

  function state() {
    return play(answer, guesses);
  }

  function draw(g, now) {
    const s = state();
    const rowShake = shakeAt >= 0 ? shake(progress(now, shakeAt, DURATION.shake, app.motion)) : 0;
    const revealP = revealRow >= 0
      ? progress(now, revealAt, DURATION.reveal * 2.2, app.motion)
      : 1;

    for (let row = 0; row < MAX_GUESSES; row += 1) {
      const done = s.rows[row];
      const pending = row === s.rows.length ? typed : '';
      const shaking = row === s.rows.length && shakeAt >= 0 ? rowShake : 0;
      for (let i = 0; i < WORD_LENGTH; i += 1) {
        const r = board.rects[row * WORD_LENGTH + i];
        const rect = { ...r, x: r.x + shaking };
        if (done) {
          const turning = row === revealRow;
          const p = turning ? stagger(revealP, i, WORD_LENGTH) : 1;
          paint.tile(g, rect, {
            letter: done.guess[i],
            
            
            
            state: flipTurned(p) ? done.marks[i] : null,
            scaleX: turning ? flipScale(p) : 1,
          });
        } else {
          
          
          
          
          
          
          
          
          
          
          
          const active = row === s.rows.length;
          const bought = active ? given.find((h) => h.index === i) : null;
          const letter = pending[i] ?? '';
          paint.tile(g, rect, letter
            ? { letter }
            : { letter: bought ? bought.letter : '', colour: bought ? COLORS.slate : undefined });
        }
      }
    }

    
    
    
    
    
    const said = s.over
      ? verdict(s, answer)
      : (app.message || lettersKnown(s.rows) || verdict(s, answer));
    const lines = paint.wrap(g, said, statusBand.width - 20, { size: SIZES.base, weight: 700 })
      .slice(0, 2);
    
    
    
    
    const bandTop = statusBand.y + Math.max(0, (statusBand.height - lines.length * 32) / 2);
    lines.forEach((line, i) => {
      paint.text(g, line, {
        x: statusBand.x, y: bandTop + i * 32, width: statusBand.width, height: 30,
      }, { size: SIZES.base, colour: s.lost ? COLORS.red : COLORS.ink, fit: true, maxWidth: statusBand.width - 20 });
    });

    buttons.rects.forEach((r, i) => {
      const isHover = i === hover - keys.rects.length;
      paint.button(g, r, {
        label: r.label,
        size: SIZES.min,
        disabled: s.over || hintsLeft() === 0,
        hover: isHover ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0,
      });
    });

    const kb = keyboardState(s.rows);
    keys.rects.forEach((r, i) => {
      const mark = kb.get(r.label);
      const isHover = i === hover;
      const isPress = i === press;
      const up = isHover ? lift(progress(now, hoverAt, DURATION.hover, app.motion), app.motion) : 0;
      const down = isPress ? sink(progress(now, pressAt, DURATION.press, app.motion), app.motion) : 0;
      
      
      
      const glyph = r.label === 'ENTER' ? 'enter' : (r.label === 'DEL' ? 'delete' : null);
      if (mark) {
        paint.tile(g, r, {
          letter: r.label, state: mark, lift: up, press: down,
          size: r.label.length > 1 ? SIZES.min : SIZES.base,
          cursor: app.keyboardMode && i === cursor,
        });
      } else {
        paint.button(g, r, {
          label: glyph ? '' : r.label, hover: up, press: down,
          size: r.label.length > 1 ? SIZES.min : SIZES.base,
          disabled: s.over,
        });
        if (glyph) {
          paint.keyGlyph(g, { ...r, y: r.y + down }, glyph, s.over ? COLORS.slate : COLORS.ink);
        }
        if (app.keyboardMode && i === cursor) paint.focusRing(g, r);
      }
    });
  }

  function type(letter) {
    const s = state();
    if (s.over) return;
    if (typed.length < WORD_LENGTH) { typed += letter; app.message = ''; app.sound('type'); app.invalidate(); }
  }

  function backspace() {
    if (state().over) return;
    typed = typed.slice(0, -1);
    app.sound('type');
    app.invalidate();
  }

  function submit() {
    const s = state();
    if (s.over) return;
    const why = rejectReason(typed, ALLOWED);
    if (why) {
      
      
      app.sound('reject');
      shakeAt = app.now();
      app.message = why;
      app.announce(why);
      app.invalidate();
      return;
    }
    guesses = [...guesses, typed.toUpperCase()];
    revealRow = guesses.length - 1;
    revealAt = app.now();
    shakeAt = -1;
    typed = '';
    app.save({ guesses });
    const now = play(answer, guesses);
    const learned = summariseGuess(guesses[guesses.length - 1], now.rows[revealRow].marks);
    
    
    
    
    
    
    
    
    
    
    const spoken = now.over ? `${learned} ${verdict(now, answer)}` : learned;
    app.message = now.over ? verdict(now, answer) : '';
    app.announce(spoken);
    app.sound(now.won ? 'win' : 'word');
    app.invalidate();
    if (now.over) app.finished(now.won);
  }

  






  const pressables = () => [...keys.rects, ...buttons.rects];

  function pressKeyAt(i) {
    const r = pressables()[i];
    if (!r) return;
    if (r.label === 'ENTER') submit();
    else if (r.label === 'DEL') backspace();
    else if (r.label.startsWith('Hint')) useHint();
    else type(r.label);
  }

  return {
    id: 'wordle',
    layout,
    







    hint: {
      label: () => hintLabel(),
      onBoard: () => hintHasRow,
      disabled: () => state().over || hintsLeft() === 0,
      run: () => useHint(),
    },
    
    
    
    
    
    
    
    reload: (s) => {
      const before = play(answer, guesses);
      guesses = Array.isArray(s.guesses) ? s.guesses : guesses;
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      const after = play(answer, guesses);
      if (!before.over && after.over) {
        if (after.won) app.sound('win');
        app.finished(after.won);
      }
    },
    rects: () => [
      ...board.rects.map((r, i) => ({ id: `tile:${Math.floor(i / WORD_LENGTH)}:${i % WORD_LENGTH}`, ...r })),
      ...keys.rects.map((r) => ({ id: `key:${r.label}`, ...r })),
      ...buttons.rects.map((r) => ({ id: 'btn:hint', ...r })),
    ],
    draw,
    pointerMove: (pt) => {
      const i = pt ? rectAt(pressables(), pt.x, pt.y) : -1;
      if (i !== hover) { hover = i; hoverAt = app.now(); app.invalidate(); }
    },
    pointerLeave: () => { hover = -1; press = -1; app.invalidate(); },
    pointerDown: (pt) => {
      press = rectAt(pressables(), pt.x, pt.y);
      pressAt = app.now();
      if (press >= 0) app.sound('press');
      app.invalidate();
    },
    pointerUp: (pt) => {
      const i = rectAt(pressables(), pt.x, pt.y);
      const was = press;
      press = -1;
      app.invalidate();
      if (i >= 0 && i === was) pressKeyAt(i);
    },
    key: (action) => {
      if (action.type === 'letter') { type(action.value); return true; }
      if (action.type === 'delete') { backspace(); return true; }
      if (action.type === 'submit') {
        if (app.keyboardMode && typed.length < WORD_LENGTH) { pressKeyAt(cursor); return true; }
        submit();
        return true;
      }
      if (action.type === 'move') {
        const row = keys.rects.filter((r) => r.y === keys.rects[cursor].y);
        const rowIndex = keys.rects.indexOf(row[0]);
        let next = cursor + action.dx;
        if (action.dy) {
          const rows = [...new Set(keys.rects.map((r) => r.y))];
          const at = rows.indexOf(keys.rects[cursor].y) + action.dy;
          if (at < 0 || at >= rows.length) return true;
          const target = keys.rects.filter((r) => r.y === rows[at]);
          const offset = Math.min(cursor - rowIndex, target.length - 1);
          next = keys.rects.indexOf(target[offset]);
        }
        cursor = Math.max(0, Math.min(keys.rects.length - 1, next));
        app.invalidate();
        return true;
      }
      return false;
    },
    describe: () => describeWordle({ answer, guesses, typed, given, puzzle: index + 1 }),
    animating: (now) => app.motion && (
      (revealRow >= 0 && now - revealAt < DURATION.reveal * 2.4)
      || (shakeAt >= 0 && now - shakeAt < DURATION.shake)
      || now - hoverAt < DURATION.hover
      || now - pressAt < DURATION.press
    ),
    keys: 'Type a five letter word and press Enter. Backspace deletes.',
    help: [
      'Guess the five-letter word in six tries.',
      'A green tile with a square is the right letter in the right place.',
      'A gold tile with a diamond is the right letter somewhere else.',
      'A grey tile with a cross is a letter that is not in the word.',
      'Hint buys the next letter you do not know. Two a puzzle, and each one costs points.',
      'There is no clock, and no streak to lose.',
    ],
  };
}
