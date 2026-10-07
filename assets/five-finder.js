








const GUESS_LIST = '/web-engine/words/data/wordleWords.js';

const $ = (id) => document.getElementById(id);
const form = $('five-finder');
if (form) {
  const common = [...document.querySelectorAll('pre.five-list[data-letter]')]
    .flatMap((p) => p.textContent.trim().split(/\s+/));
  let every = null;
  const letters = (s) => s.toUpperCase().replace(/[^A-Z]/g, '');
  const run = async () => {
    let words = common;
    if ($('ff-all').checked) {
      if (!every) {
        try { every = (await import(GUESS_LIST)).WORDLE_GUESSES; } catch { every = common; }
      }
      words = every;
    }
    const start = letters($('ff-start').value);
    const end = letters($('ff-end').value);
    const has = letters($('ff-has').value);
    const not = letters($('ff-not').value);
    const raw = $('ff-pat').value.toUpperCase().slice(0, 5);
    const pat = raw.trim()
      ? new RegExp('^' + raw.padEnd(5, '_').split('').map((c) => (/[A-Z]/.test(c) ? c : '.')).join('') + '$')
      : null;
    const hits = words.filter((w) => w.startsWith(start) && w.endsWith(end)
      && [...has].every((c) => w.includes(c)) && ![...not].some((c) => w.includes(c))
      && (!pat || pat.test(w)));
    $('ff-n').textContent = String(hits.length);
    $('ff-out').textContent = hits.slice(0, 300).join(' ');
    $('ff-more').hidden = hits.length <= 300;
  };
  form.addEventListener('input', run);
  form.addEventListener('submit', (e) => e.preventDefault());
  run();
}
