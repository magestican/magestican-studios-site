

import { el, clear } from './ui.js';
import {
  scoreWord, isPangram, rejectReason, maxScore, rankFor, MIN_LENGTH,
} from '../../../web-engine/words/beeRules.js';
import { BEE_PUZZLES } from '../../../web-engine/words/data/beePuzzles.js';

export const count = () => BEE_PUZZLES.length;

export const label = (index) => `Hive ${index + 1} - centre ${BEE_PUZZLES[index].centre}`;

export function mount(root, ctx) {
  const puzzle = BEE_PUZZLES[ctx.index];
  const saved = ctx.load() ?? { found: [] };
  const valid = new Set(puzzle.answers);
  let found = (Array.isArray(saved.found) ? saved.found : []).filter((w) => valid.has(w));
  let typed = '';
  
  
  
  let outer = puzzle.letters.filter((c) => c !== puzzle.centre);

  const entry = el('div', {
    class: 'bee-entry', role: 'textbox', 'aria-readonly': 'true',
    'aria-label': 'The word you are building',
  });
  const hive = el('div', { class: 'hive' });
  const status = el('p', { class: 'status', role: 'status', 'aria-live': 'polite' });
  const rank = el('div', { class: 'rank-bar' });
  const list = el('ul', { class: 'found-list', 'aria-label': 'Words you have found' });

  clear(root);
  root.appendChild(el('h2', { text: 'Farmy Spelling Bee' }));
  root.appendChild(el('p', {
    class: 'hint-note',
    text: `Make words of ${MIN_LENGTH} letters or more. Every word must use the middle letter, `
      + `${puzzle.centre}. Letters can be used more than once. Using all seven is a pangram.`,
  }));
  root.appendChild(entry);
  root.appendChild(hive);
  root.appendChild(el('div', { class: 'bee-buttons' }, [
    el('button', { type: 'button', text: 'Delete', onclick: () => { typed = typed.slice(0, -1); draw(); } }),
    el('button', {
      type: 'button',
      text: 'Shuffle',
      
      
      onclick: () => { outer = shuffleOnce(outer); draw(); },
    }),
    el('button', { type: 'button', text: 'Enter', onclick: submit }),
  ]));
  root.appendChild(status);
  root.appendChild(rank);
  root.appendChild(list);

  
  
  function shuffleOnce(letters) {
    const out = [...letters];
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function submit() {
    const word = typed.toUpperCase();
    const why = rejectReason(word, puzzle, new Set(found));
    if (why) { status.textContent = why; typed = ''; draw(); return; }
    found = [...found, word].sort();
    typed = '';
    ctx.save({ found });
    const points = scoreWord(word, puzzle.letters);
    status.textContent = isPangram(word, puzzle.letters)
      ? `${word} - PANGRAM! ${points} points.`
      : `${word} - ${points} ${points === 1 ? 'point' : 'points'}.`;
    draw();
    if (found.length === puzzle.answers.length) ctx.finished(true);
  }

  function draw() {
    entry.textContent = typed || '…';

    clear(hive);
    
    
    
    
    
    
    
    
    
    
    
    
    const slots = [outer[0], outer[1], outer[2], outer[3], puzzle.centre, outer[4], null, outer[5], null];
    slots.forEach((letter, i) => {
      if (!letter) { hive.appendChild(el('span', { 'aria-hidden': 'true' })); return; }
      const isCentre = i === 4;
      hive.appendChild(el('button', {
        type: 'button',
        class: `cell-letter${isCentre ? ' cell-centre' : ''}`,
        text: letter,
        'aria-label': isCentre ? `${letter}, the compulsory middle letter` : letter,
        onclick: () => { typed += letter; draw(); },
      }));
    });

    const score = found.reduce((t, w) => t + scoreWord(w, puzzle.letters), 0);
    const r = rankFor(score, puzzle);
    const pct = r.max === 0 ? 0 : Math.round((score / r.max) * 100);
    clear(rank);
    rank.appendChild(el('strong', { text: r.name }));
    rank.appendChild(el('span', { class: 'rank-track' }, [
      el('span', { class: 'rank-fill', style: `width: ${pct}%` }),
    ]));
    
    
    
    rank.appendChild(el('span', {
      text: r.next
        ? `${score} points · ${r.toNext} to ${r.next}`
        : `${score} points · every word found`,
    }));

    clear(list);
    list.appendChild(el('li', {
      text: `${found.length} of ${puzzle.answers.length}`,
      'aria-label': `You have found ${found.length} of ${puzzle.answers.length} words`,
    }));
    for (const w of found) {
      const pangram = isPangram(w, puzzle.letters);
      list.appendChild(el('li', {
        class: pangram ? 'pangram' : null,
        
        
        text: pangram ? `${w} ★` : w,
        'aria-label': pangram ? `${w}, pangram` : w,
      }));
    }
    if (!status.textContent) {
      status.textContent = `${found.length} found, ${maxScore(puzzle)} points on the board.`;
    }
  }

  const onKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key.toUpperCase();
    if (k === 'BACKSPACE') { e.preventDefault(); typed = typed.slice(0, -1); draw(); return; }
    if (k === 'ENTER') { e.preventDefault(); submit(); return; }
    if (/^[A-Z]$/.test(k)) { e.preventDefault(); typed += k; draw(); }
  };
  document.addEventListener('keydown', onKey);

  draw();
  return () => document.removeEventListener('keydown', onKey);
}
