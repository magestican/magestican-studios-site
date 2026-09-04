









import { el, clear, applyState, legend } from './ui.js';
import {
  adjacent, themeWordAt, play, hintCells, wordAt, rowOf, colOf,
  COLS, ROWS, MIN_BONUS_LENGTH, WORDS_PER_HINT,
} from '../../../web-engine/words/strandsRules.js';
import { WORDLE_GUESSES } from '../../../web-engine/words/data/wordleWords.js';
import { STRANDS_PUZZLES } from '../../../web-engine/words/data/strandsPuzzles.js';







const KNOWN = new Set(WORDLE_GUESSES);

export const count = () => STRANDS_PUZZLES.length;

export const label = (index) => `${index + 1}. ${STRANDS_PUZZLES[index].theme}`;

export function mount(root, ctx) {
  const puzzle = STRANDS_PUZZLES[ctx.index];
  const saved = ctx.load() ?? {};
  const real = new Set(puzzle.words.map((w) => w.w));
  let found = (Array.isArray(saved.found) ? saved.found : []).filter((w) => real.has(w));
  let bonus = Array.isArray(saved.bonus) ? saved.bonus : [];
  let hintsUsed = Number.isInteger(saved.hintsUsed) ? saved.hintsUsed : 0;
  let picked = [];
  let lit = [];

  const board = el('div', { class: 'strands-board', role: 'group', 'aria-label': 'The letter grid' });
  const trace = el('p', { class: 'strands-trace', role: 'status', 'aria-live': 'polite' });
  const status = el('p', { class: 'status', role: 'status', 'aria-live': 'polite' });
  const buttons = el('div', { class: 'row-buttons' });
  const foundList = el('ul', { class: 'found-list', 'aria-label': 'Words you have found' });

  clear(root);
  root.appendChild(el('h2', { text: 'Farmy Strands' }));
  root.appendChild(el('p', { class: 'strands-theme card', text: `Today's theme: ${puzzle.theme}` }));
  root.appendChild(el('p', {
    class: 'hint-note',
    text: 'Tap letters that touch each other, including corner to corner, to spell a word about '
      + `the theme. Every letter on the board belongs to one. Find ${WORDS_PER_HINT} other words `
      + `of ${MIN_BONUS_LENGTH} letters or more to earn a hint.`,
  }));
  root.appendChild(board);
  root.appendChild(trace);
  root.appendChild(buttons);
  root.appendChild(status);
  root.appendChild(foundList);
  root.appendChild(legend(['theme', 'spangram'], {
    theme: 'a word about the theme',
    spangram: 'the spangram - it names the theme and crosses the whole board',
  }));

  function tap(index) {
    const at = picked.indexOf(index);
    if (at !== -1) { picked = picked.slice(0, at); draw(); return; }   
    if (picked.length && !adjacent(picked[picked.length - 1], index)) {
      
      
      
      picked = [index];
      draw();
      return;
    }
    picked = [...picked, index];
    const hit = themeWordAt(puzzle, picked);
    if (hit && !found.includes(hit.w)) {
      found = [...found, hit.w];
      picked = [];
      lit = [];
      ctx.save({ found, bonus, hintsUsed });
      status.textContent = hit.w === puzzle.spangram
        ? `${hit.w} - that is the spangram.`
        : `Found ${hit.w}.`;
      draw();
      if (found.length === puzzle.words.length) ctx.finished(true);
      return;
    }
    draw();
  }

  function submitBonus() {
    const word = wordAt(puzzle.rows, picked);
    picked = [];
    if (word.length < MIN_BONUS_LENGTH) {
      status.textContent = `${word || 'That'} is too short - ${MIN_BONUS_LENGTH} letters or more.`;
    } else if (real.has(word)) {
      status.textContent = `${word} is a theme word - trace it again to lock it in.`;
    } else if (bonus.includes(word)) {
      status.textContent = `You already found ${word}.`;
    } else if (word.length === 5 && !KNOWN.has(word)) {
      status.textContent = `${word} is not in the word list.`;
    } else {
      bonus = [...bonus, word];
      ctx.save({ found, bonus, hintsUsed });
      const togo = WORDS_PER_HINT - (bonus.length % WORDS_PER_HINT);
      status.textContent = bonus.length % WORDS_PER_HINT === 0
        ? `${word}. That earns a hint.`
        : `${word}. ${togo} more for a hint.`;
    }
    draw();
  }

  function useHint() {
    const state = play(puzzle, found, bonus.length, hintsUsed);
    if (state.hintsAvailable <= 0) return;
    lit = hintCells(puzzle, found);
    hintsUsed += 1;
    ctx.save({ found, bonus, hintsUsed });
    status.textContent = 'One word is lit up. The letters are right; the order is yours.';
    draw();
  }

  function draw() {
    const state = play(puzzle, found, bonus.length, hintsUsed);
    const owner = new Map();
    for (const entry of puzzle.words) {
      if (!found.includes(entry.w)) continue;
      for (const cell of entry.p) owner.set(cell, entry.w === puzzle.spangram ? 'spangram' : 'theme');
    }

    clear(board);
    for (let i = 0; i < ROWS * COLS; i += 1) {
      const letter = puzzle.rows[rowOf(i)][colOf(i)];
      const cell = el('button', {
        type: 'button',
        class: 'strands-cell',
        text: letter,
        'aria-label': `${letter}, row ${rowOf(i) + 1} column ${colOf(i) + 1}`,
        onclick: () => tap(i),
      });
      const state2 = owner.get(i);
      if (state2) applyState(cell, state2, letter);
      else if (picked.includes(i)) cell.classList.add('picked');
      else if (lit.includes(i)) cell.classList.add('lit');
      board.appendChild(cell);
    }

    trace.textContent = picked.length ? wordAt(puzzle.rows, picked) : '…';

    clear(buttons);
    buttons.appendChild(el('button', {
      type: 'button', text: 'Clear', disabled: picked.length === 0,
      onclick: () => { picked = []; draw(); },
    }));
    buttons.appendChild(el('button', {
      type: 'button', text: 'Not a theme word', disabled: picked.length === 0,
      onclick: submitBonus,
    }));
    buttons.appendChild(el('button', {
      type: 'button',
      text: `Hint (${state.hintsAvailable})`,
      disabled: state.hintsAvailable === 0 || state.won,
      onclick: useHint,
    }));

    clear(foundList);
    foundList.appendChild(el('li', { text: `${state.foundCount} of ${state.total} theme words` }));
    for (const w of found) {
      foundList.appendChild(el('li', {
        class: w === puzzle.spangram ? 'pangram' : null,
        text: w === puzzle.spangram ? `${w} ★` : w,
        'aria-label': w === puzzle.spangram ? `${w}, the spangram` : w,
      }));
    }
    if (bonus.length) {
      foundList.appendChild(el('li', {
        text: `${bonus.length} other ${bonus.length === 1 ? 'word' : 'words'} · `
          + `${state.towardsHint}/${WORDS_PER_HINT} towards a hint`,
      }));
    }

    if (!status.textContent) status.textContent = 'Tap the letters of a word about the theme.';
    if (state.won) status.textContent = 'Every word found. That is the lot.';
  }

  draw();
  return () => {};
}
