






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
  
  if (r.falls > 0) parts.push(['Fell out', '', '', r.falls]);
  return parts;
}


export function fallText(name, value) {
  return value < 0 ? `${name} fell out! ${value} Bell` : `${name} fell out!`;
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






export const CONTROLS = Object.freeze({
  p1: Object.freeze({ move: 'W A S D', fire: 'J', boost: 'K', ability: 'L', verb: 'Press' }),
  p2: Object.freeze({ move: 'Arrow keys', fire: '1', boost: '2', ability: '3', verb: 'Press' }),
  pad: Object.freeze({ move: 'Left stick', fire: 'A', boost: 'B', ability: 'X', verb: 'Press' }),
  phone: Object.freeze({ move: 'Drag the left side', fire: 'FIRE', boost: 'BOOST', ability: 'ABILITY', verb: 'Tap' }),
  
  touch: Object.freeze({ move: 'Drag the Move pad', fire: 'FIRE', boost: 'BOOST', ability: 'ABILITY', verb: 'Tap' }),
});

export const LEGEND_MS = 20000;








export const LEGEND_SIDE_MIN = 220;
export function legendSide(arenaLeft) {
  const w = Math.floor(arenaLeft - 32);
  return w >= LEGEND_SIDE_MIN ? w : 0;
}


export function controlsFor(control = '') {
  if (control === 'p1' || control === 'p2') return CONTROLS[control];
  if (control.startsWith('pad')) return CONTROLS.pad;
  if (control.startsWith('phone')) return CONTROLS.phone;
  if (control === 'touch') return CONTROLS.touch;
  return null;
}







export const GOAL = Object.freeze({
  brawl: 'Empty a rival\'s Armour or knock them off the edge to ring their Bell. Most Bells wins.',
  team: 'Empty a rival\'s Armour or knock them off the edge to ring their Bell. Your team\'s Bells add up.',
});
export function goalLine(mode) { return GOAL[mode] || GOAL.brawl; }






export function stallPrompt(control) {
  const c = controlsFor(control);
  return c ? `STALL - ${c.verb} ${c.boost} to vent!` : 'STALL';
}


export function bellsText(n) { return `${n} Bell${n === 1 ? '' : 's'}`; }


export function controlsLine(control) {
  const c = controlsFor(control);
  if (c && c.verb === 'Tap') return `${c.move} (stick) to move - tap ${c.fire}, ${c.boost}, ${c.ability}`;
  return c ? `${c.move} move - ${c.fire} fire - ${c.boost} boost - ${c.ability} ability` : '';
}









export const WARM_GOAL = 'Warm up: drive your Titan and shoot a target.';
export const WARM_GOAL_SHORT = 'Warm up: drive and shoot a target!';
export function warmNote(seats = []) {
  const shown = seats.filter((s) => controlsFor(s.control));
  const lines = shown.filter((s) => s.control !== 'touch').map((s) => `${s.name}: ${controlsLine(s.control)}`);
  if (!lines.length && shown.length) return WARM_GOAL_SHORT;
  return `${WARM_GOAL}${lines.length ? ` ${lines.join('. ')}.` : ''}`;
}

const LESSON = { fire: (k) => `${k} to FIRE at a target!`, boost: (k) => `${k} to BOOST and dash!`, ability: (k) => `${k} for your ABILITY!` };

export function lessonPrompt(control, stage, fallback = '') {
  const c = controlsFor(control);
  return c && LESSON[stage] ? `${c.verb} ${LESSON[stage](c[stage])}` : fallback;
}






export function rowTag(control = 'bot', humans = 1) {
  if (!control || control === 'bot') return null;
  if (humans <= 1 || control === 'touch') return 'You';
  if (control === 'p1') return 'P1';
  if (control === 'p2') return 'P2';
  if (control.startsWith('phone')) return `Phone ${Number(control.slice(5)) + 1}`;
  if (control.startsWith('pad')) return `Pad ${Number(control.slice(3)) + 1}`;
  return null;
}
