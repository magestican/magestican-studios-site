

import { el, clear, markOf } from './ui.js';
import {
  checkSelection, boardOrder, play, seededShuffle,
  EXACT, ONE_AWAY, REPEAT, GROUP_SIZE, MAX_MISTAKES,
} from '../../../web-engine/words/connectionsRules.js';
import { BANDS } from '../../../web-engine/words/style.js';
import { CONNECTIONS_PUZZLES } from '../../../web-engine/words/data/connectionsPuzzles.js';

export const count = () => CONNECTIONS_PUZZLES.length;

export const label = (index) => `Set ${index + 1}`;

export function mount(root, ctx) {
  const puzzle = CONNECTIONS_PUZZLES[ctx.index];
  const saved = ctx.load() ?? { selections: [] };
  let selections = Array.isArray(saved.selections) ? saved.selections : [];
  let picked = [];
  let order = boardOrder(puzzle);

  const solvedBox = el('div');
  const board = el('div', { class: 'conn-board', role: 'group', 'aria-label': 'Sixteen words' });
  const mistakes = el('p', { class: 'mistakes' });
  const status = el('p', { class: 'status', role: 'status', 'aria-live': 'polite' });
  const buttons = el('div', { class: 'row-buttons' });

  clear(root);
  root.appendChild(el('h2', { text: 'Farmy Connections' }));
  root.appendChild(el('p', {
    class: 'hint-note',
    text: `Find the four groups of ${GROUP_SIZE}. You can be wrong ${MAX_MISTAKES} times. `
      + 'A guess with three of one group in it will tell you so.',
  }));
  root.appendChild(solvedBox);
  root.appendChild(board);
  root.appendChild(mistakes);
  root.appendChild(status);
  root.appendChild(buttons);

  function submit() {
    const state = play(puzzle, selections);
    if (state.over || picked.length !== GROUP_SIZE) return;
    const result = checkSelection(picked, puzzle.groups, state.previous);
    if (result.kind === REPEAT) { status.textContent = result.message; return; }

    selections = [...selections, [...picked]];
    picked = [];
    ctx.save({ selections });

    const now = play(puzzle, selections);
    if (result.kind === EXACT) status.textContent = `Yes - ${result.group.name}.`;
    else if (result.kind === ONE_AWAY) status.textContent = `One away. ${now.mistakesLeft} left.`;
    else status.textContent = `Not a group. ${now.mistakesLeft} left.`;
    draw();
    if (now.over) ctx.finished(now.won);
  }

  function toggle(word) {
    if (picked.includes(word)) picked = picked.filter((w) => w !== word);
    else if (picked.length < GROUP_SIZE) picked = [...picked, word];
    draw();
  }

  function draw() {
    const state = play(puzzle, selections);
    const solvedGroups = puzzle.groups.filter((g) => state.solved.includes(g.name));
    const solvedWords = new Set(solvedGroups.flatMap((g) => g.words));

    
    
    
    clear(solvedBox);
    const showGroups = state.over && !state.won
      ? puzzle.groups                       
      : solvedGroups;
    for (const g of showGroups) {
      const band = BANDS[puzzle.groups.indexOf(g)];
      solvedBox.appendChild(el('p', { class: `conn-solved is-${band}` }, [
        el('span', { 'aria-hidden': 'true', text: `${markOf(band)} ` }),
        el('span', { text: `${g.name}: ` }),
        el('span', { class: 'words', text: g.words.join(', ') }),
      ]));
    }

    clear(board);
    const done = state.over && !state.won;
    for (const word of order) {
      if (solvedWords.has(word) || done) continue;
      board.appendChild(el('button', {
        type: 'button',
        class: 'conn-tile',
        text: word,
        'aria-pressed': picked.includes(word) ? 'true' : 'false',
        onclick: () => toggle(word),
      }));
    }

    clear(mistakes);
    mistakes.appendChild(el('span', { text: 'Mistakes:' }));
    for (let i = 0; i < MAX_MISTAKES; i += 1) {
      const spent = i < state.mistakes;
      
      
      
      mistakes.appendChild(el('span', {
        class: `pip${spent ? ' is-mistake' : ''}`,
        
        
        text: spent ? markOf('mistake') : '·',
        'aria-label': spent ? 'a mistake used' : 'a mistake left',
      }));
    }

    clear(buttons);
    buttons.appendChild(el('button', {
      type: 'button', text: 'Shuffle', disabled: state.over,
      onclick: () => { order = seededShuffle(order, Date.now() & 0xffff); draw(); },
    }));
    buttons.appendChild(el('button', {
      type: 'button', text: 'Clear', disabled: state.over || picked.length === 0,
      onclick: () => { picked = []; draw(); },
    }));
    buttons.appendChild(el('button', {
      type: 'button', text: 'Submit', disabled: state.over || picked.length !== GROUP_SIZE,
      onclick: submit,
    }));

    if (!status.textContent) {
      status.textContent = state.won
        ? 'All four groups. Well done.'
        : `Pick ${GROUP_SIZE} words that go together.`;
    }
    if (state.won) status.textContent = 'All four groups. Well done.';
    if (state.over && !state.won) status.textContent = 'Out of guesses. Here are the four groups.';
  }

  draw();
  return () => {};
}
