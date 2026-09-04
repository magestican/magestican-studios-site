

import { el, clear, applyState, legend } from './ui.js';
import {
  keyboardState, rejectReason, play, verdict, MAX_GUESSES, WORD_LENGTH,
} from '../../../web-engine/words/wordleRules.js';
import { WORDLE_ANSWERS, WORDLE_GUESSES } from '../../../web-engine/words/data/wordleWords.js';

const ALLOWED = new Set(WORDLE_GUESSES);




const KEYS = [
  'QWERTYUIOP'.split(''),
  'ASDFGHJKL'.split(''),
  ['ENTER', ...'ZXCVBNM'.split(''), 'DELETE'],
];

export const count = () => WORDLE_ANSWERS.length;

export function label(index) {
  return `Puzzle ${index + 1}`;
}

export function mount(root, ctx) {
  const answer = WORDLE_ANSWERS[ctx.index];
  const saved = ctx.load() ?? { guesses: [] };
  let guesses = Array.isArray(saved.guesses) ? saved.guesses.filter((g) => ALLOWED.has(g)) : [];
  let typed = '';

  const board = el('div', { class: 'wordle-board', role: 'group', 'aria-label': 'Your guesses' });
  const keyboard = el('div', { class: 'keyboard' });
  const status = el('p', { class: 'status', role: 'status', 'aria-live': 'polite' });

  clear(root);
  root.appendChild(el('h2', { text: 'Farmy Wordle' }));
  root.appendChild(el('p', {
    class: 'hint-note',
    text: `Guess the ${WORD_LENGTH}-letter word. You have ${MAX_GUESSES} tries. There is no clock.`,
  }));
  root.appendChild(board);
  root.appendChild(status);
  root.appendChild(keyboard);
  root.appendChild(legend(['right', 'moved', 'absent'], {
    right: 'right letter, right place',
    moved: 'right letter, somewhere else',
    absent: 'not in the word',
  }));

  function press(key) {
    const state = play(answer, guesses);
    if (state.over) return;
    if (key === 'DELETE') { typed = typed.slice(0, -1); draw(); return; }
    if (key === 'ENTER') {
      const why = rejectReason(typed, ALLOWED);
      if (why) { say(why); return; }
      guesses = [...guesses, typed.toUpperCase()];
      typed = '';
      ctx.save({ guesses });
      draw();
      const now = play(answer, guesses);
      if (now.over) ctx.finished(now.won);
      return;
    }
    if (/^[A-Z]$/.test(key) && typed.length < WORD_LENGTH) { typed += key; draw(); }
  }

  function say(text) {
    status.textContent = text;
  }

  function draw() {
    const state = play(answer, guesses);

    clear(board);
    for (let row = 0; row < MAX_GUESSES; row += 1) {
      const done = state.rows[row];
      const pending = row === state.rows.length ? typed : '';
      for (let i = 0; i < WORD_LENGTH; i += 1) {
        const letter = done ? done.guess[i] : (pending[i] ?? '');
        const tile = el('div', { class: 'wordle-tile', text: letter });
        if (done) applyState(tile, done.marks[i], letter);
        else tile.setAttribute('aria-label', letter ? letter : 'empty');
        board.appendChild(tile);
      }
    }

    
    
    const keyState = keyboardState(state.rows);
    clear(keyboard);
    for (const rowKeys of KEYS) {
      const row = el('div', { class: 'keyrow' });
      for (const k of rowKeys) {
        const wide = k.length > 1;
        const key = el('button', {
          type: 'button',
          class: `key${wide ? ' wide' : ''}`,
          text: k,
          onclick: () => press(k),
        });
        const mark = keyState.get(k);
        
        
        
        if (mark) applyState(key, mark, k);
        if (state.over) key.disabled = true;
        row.appendChild(key);
      }
      keyboard.appendChild(row);
    }

    say(verdict(state, answer));
  }

  const onKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toUpperCase();
    if (k === 'BACKSPACE') { e.preventDefault(); press('DELETE'); return; }
    if (k === 'ENTER') { e.preventDefault(); press('ENTER'); return; }
    if (/^[A-Z]$/.test(k)) { e.preventDefault(); press(k); }
  };
  document.addEventListener('keydown', onKey);

  draw();
  return () => document.removeEventListener('keydown', onKey);
}
