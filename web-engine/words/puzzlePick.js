


































export function dayNumber(now) {
  const start = new Date(2026, 0, 1);
  const here = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((here - start) / 86400000);
}









export function puzzleForDay(count, now = new Date()) {
  if (count <= 0) return 0;
  return ((dayNumber(now) % count) + count) % count;
}











export function saveKey(game, puzzleId) {
  return `farmy-crosswords:v1:${game}:${puzzleId}`;
}


export const LAST_KEY = 'farmy-crosswords:v1:last';








export const GAMES = [
  { id: 'wordle', name: 'Wordle', blurb: 'Six guesses at a five-letter word.' },
  { id: 'bee', name: 'Spelling Bee', blurb: 'Seven letters, one of them compulsory.' },
  { id: 'connections', name: 'Connections', blurb: 'Sixteen words, four secret groups.' },
  { id: 'strands', name: 'Strands', blurb: 'Every letter is part of a word.' },
];
