












import { LETTERS, LETTER, WORD_STEPS } from './content.js';
import { T, fill, count } from './strings.js';

const L = (ch) => `{letter:${ch}}`;

export const WORDS = Object.freeze(WORD_STEPS.flatMap((s) => s.words.map(([w]) => w)));

export const MAX_STICKERS = LETTERS.length + WORDS.length;

export const id = Object.freeze({
  name: (ch) => `name-${String(ch).toLowerCase()}`,
  phrase: (ch) => `phrase-${String(ch).toLowerCase()}`,
  find: (ch) => `find-${String(ch).toLowerCase()}`,
  party: (ch) => `party-${String(ch).toLowerCase()}`,
  spell: (w) => `spell-${w}`,
  spelled: (w) => `spelled-${w}`,
  word: (w) => `word-${w}`,
  count: (n) => `count-${n}`,
});


export const FIXED = Object.freeze({
  jamStart: 'jam-start', pickWords: 'pick-words', rainTap: 'rain-tap', rainKeys: 'rain-keys',
  bookEmpty: 'book-empty', hooray: 'hooray', alphabetDone: 'alphabet-done', jamParty: 'jam-party',
  wordsDone: 'words-done',
});

const cap = (w) => w[0].toUpperCase() + w.slice(1);




const NAME_TEXT = { E: `${L('E')}!`, O: 'Oh.' };
export const nameText = (ch) => NAME_TEXT[ch] || `${L(ch)}.`;

function build() {
  const out = [];
  for (const l of LETTERS) {
    out.push({ id: id.name(l.ch), text: nameText(l.ch) });
    out.push({ id: id.phrase(l.ch), text: `${fill(l.ends ? T.letterEnds : T.letterFor, { letter: L(l.ch), word: l.word })}.` });
    out.push({ id: id.find(l.ch), text: fill(T.find, { letter: L(l.ch) }) });
    out.push({ id: id.party(l.ch), text: fill(T.letterParty, { letter: L(l.ch) }) });
  }
  for (const w of WORDS) {
    out.push({ id: id.spell(w), text: fill(T.spell, { word: w }) });
    
    out.push({ id: id.spelled(w), text: `${[...w].map((c) => L(c.toUpperCase())).join(', ')}. ${cap(w)}!` });
    out.push({ id: id.word(w), text: `${cap(w)}.` });
  }
  for (const [k, v] of Object.entries(FIXED)) out.push({ id: v, text: T[k] });
  for (let n = 1; n <= MAX_STICKERS; n++) out.push({ id: id.count(n), text: count(T.bookCount, n) });
  return Object.freeze(out.map(Object.freeze));
}

export const LINES = build();
export const LINE_IDS = Object.freeze(new Set(LINES.map((x) => x.id)));


export const countId = (n) => (n > 0 ? id.count(Math.min(n, MAX_STICKERS)) : FIXED.bookEmpty);

export const hasLetter = (ch) => Boolean(LETTER[String(ch).toUpperCase()]);
