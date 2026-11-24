






export const PRIMARY = Object.freeze({ title: 'start', end: 'again', night: 'night-again' });

export const primaryFor = (screen) => PRIMARY[screen] ?? null;






export function createPadNav() {
  const was = new Map();
  const on = (b) => !!b && (b.pressed || b.value > 0.5);
  return {
    read(p) {
      const b = p.buttons || []; const a = p.axes || [];
      const ax = a[0] || 0; const ay = a[1] || 0;
      const now = on(b[0]) ? 'confirm' : on(b[1]) ? 'back'
        : on(b[12]) || on(b[14]) || ay < -0.6 || ax < -0.6 ? 'prev'
          : on(b[13]) || on(b[15]) || ay > 0.6 || ax > 0.6 ? 'next' : null;
      const before = was.get(p.index) ?? null;
      was.set(p.index, now);
      return now !== before ? now : null;
    },
  };
}





export function createLeave() {
  let asking = false;
  return {
    get asking() { return asking; },
    get paused() { return asking; },
    press(kind) {
      if (!asking) {
        if (kind === 'escape' || kind === 'quit') { asking = true; return 'ask'; }
        return 'none';
      }
      if (kind === 'leave') { asking = false; return 'leave'; }
      if (kind === 'escape' || kind === 'stay') { asking = false; return 'resume'; }
      return 'none';
    },
    reset() { asking = false; },
  };
}


export function joinNames(names) {
  return names.length <= 1 ? (names[0] || '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}







export function statParts(r, rows = [r]) {
  const parts = [];
  if (rows.some((x) => x.clangsWon > 0)) parts.push(['Clangs', ' won', '', r.clangsWon]);
  parts.push(['', 'Perfect ', 'Vents', r.perfectVents], ['', 'Best ', 'streak', r.bestStreak]);
  return parts;
}







export function tieBreakNote(card, nameOf) {
  if (!card || card.mode === 'team' || card.rows.length < 2) return '';
  const [first] = card.rows;
  const tied = card.rows.filter((r) => r.bells === first.bells);
  if (tied.length < 2 || card.rows.filter((r) => r.place === first.place).length > 1) return '';
  return `Tied on ${first.bells} Bell${first.bells === 1 ? '' : 's'} - ${nameOf(first)} was rung out ${tied.length > 2 ? 'the fewest' : 'fewer'} times.`;
}







export function teamTotalsNote(card) {
  if (!card || card.mode !== 'team' || !card.teams || !card.teams.length) return '';
  return card.teams.map((g) => `Team ${g.team + 1}: ${g.bells} Bell${g.bells === 1 ? '' : 's'}`).join(' - ');
}


export function firstTeams(card) {
  return card && card.mode === 'team' && card.teams ? card.teams.filter((g) => g.place === 0).map((g) => g.team) : [];
}






export function stepsOrder(entries) {
  return [entries[1], entries[0], entries[2]].filter(Boolean);
}
