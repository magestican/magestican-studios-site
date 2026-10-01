



















import { HOME, LAP, YARD } from './ludoBoard.js';
import { TEAMS, teamAt, teamLabel } from './ludoTeams.js';
import { progressOf, standings } from './ludoRules.js';












export const defaultWho = (seat) => (seat.kind === 'bot' ? 'the computer' : (seat.name ?? 'a player'));


export function seatLine(state, team, who = defaultWho) {
  const seat = state.seats[team];
  const { done } = progressOf(state.tokens[team]);
  const turn = state.turn === team && state.awaiting !== 'over' ? ', to play' : '';
  return `${teamLabel(team)}: ${who(seat)}. ${done} of 4 home${turn}.`;
}


export function tokenLine(team, progress) {
  if (progress <= YARD) return 'in the yard';
  if (progress >= HOME) return 'home';
  if (progress >= LAP) return `${progress - LAP + 1} of 5 up the home column`;
  return `square ${progress + 1} of 51`;
}









export function boardLines(state) {
  return TEAMS.map((unused, team) => {
    const where = state.tokens[team].map((p, i) => `token ${i + 1} ${tokenLine(team, p)}`);
    return `${teamAt(team).name}: ${where.join('; ')}.`;
  });
}


export function moveLines(state) {
  if (state.awaiting !== 'move' || !state.moves.length) return [];
  const team = teamAt(state.turn).name;
  return state.moves.map((m) => {
    const bits = [`Token ${m.token + 1}, ${tokenLine(state.turn, m.from)} to ${tokenLine(state.turn, m.to)}`];
    if (m.enters) bits.push('leaving the yard');
    if (m.finishes) bits.push('and home');
    if (m.captures.length) {
      bits.push(`sending ${teamAt(m.captures[0].team).one} back to its yard`);
    } else if (m.safe) {
      bits.push('onto a safe square');
    }
    return `${team}: ${bits.join(', ')}.`;
  });
}









export function describeEvent(event, state) {
  if (!event) return '';
  const name = (t) => teamAt(t).name;
  if (event.kind === 'retry') {
    
    
    
    
    const left = event.left === 1 ? 'one more go' : `${event.left} more goes`;
    return `${name(event.team)} rolled ${event.die} and is still in the yard. `
      + `Rolling again - ${left}.`;
  }
  if (event.kind === 'pass') {
    
    
    
    return `${name(event.team)} rolled ${event.die} and cannot move. Passed.`;
  }
  if (event.kind === 'forfeit') {
    return `${name(event.team)} rolled a third six in a row and loses the turn.`;
  }
  if (event.kind === 'roll') {
    return `${name(event.team)} rolled ${event.die}. ${state.moves.length} move${state.moves.length === 1 ? '' : 's'} available.`;
  }
  if (event.kind === 'refused') {
    return 'That token cannot make this move.';
  }
  if (event.kind === 'move') {
    const bits = [`${name(event.team)} moved token ${event.token + 1}`];
    if (event.enters) bits.push('out of the yard');
    if (event.captures?.length) bits.push(`and sent ${teamAt(event.captures[0].team).one} home`);
    if (event.finishes) bits.push('all the way home');
    if (event.won !== null && event.won !== undefined) return `${bits.join(' ')}. ${name(event.won)} win.`;
    if (event.again) bits.push('and rolls again');
    return `${bits.join(' ')}.`;
  }
  return '';
}


export function statusOf(state, who = defaultWho) {
  if (state.awaiting === 'over') {
    return `${teamAt(state.winner).name} win. ${standings(state).map((r) => `${teamAt(r.team).name} ${r.done} home`).join(', ')}.`;
  }
  const seat = state.seats[state.turn];
  if (state.awaiting === 'roll') return `${teamAt(state.turn).name} to roll (${who(seat)}).`;
  
  
  
  
  const blocked = blockedGateLine(state, state.die);
  const tail = blocked ? ` ${blocked}` : '';
  return `${teamAt(state.turn).name} rolled ${state.die}. Choose a token (${who(seat)}).${tail}`;
}





export function describe(state, { message = '', room = '', who = defaultWho } = {}) {
  return {
    title: 'Farmy Ludo',
    status: message || statusOf(state, who),
    lines: [
      ...(room ? [room] : []),
      ...TEAMS.map((unused, t) => seatLine(state, t, who)),
      ...boardLines(state),
      ...moveLines(state),
    ],
  };
}

























export function moveLabel(move, short = false) {
  if (!move) return '';
  
  
  
  
  
  
  
  
  
  
  
  if (move.captures?.length) {
    return short ? 'Take' : `Take ${teamAt(move.captures[0].team).one}`;
  }
  if (move.enters) return short ? 'Out' : 'Bring one out';
  if (move.finishes) return short ? 'Home' : 'Get one home';
  if (move.safe) return short ? 'Safe' : 'Move to safety';
  return short ? 'Fwd' : 'Move forward';
}
















export function blockedGateLine(state, die) {
  if (!state || die !== 6) return '';
  if (state.awaiting !== 'move') return '';
  const mine = state.tokens?.[state.turn] ?? [];
  const waiting = mine.some((at) => at < 0);
  if (!waiting) return '';
  if ((state.moves ?? []).some((m) => m.enters)) return '';
  return 'Your gate is blocked by two of your own counters. Move one of them first.';
}










export function moveRank(move) {
  if (!move) return 0;
  if (move.captures?.length) return 4;
  if (move.finishes) return 3;
  if (move.enters) return 2;
  if (move.safe) return 1;
  return 0;
}




















export function moveChoices(state) {
  if (state.awaiting !== 'move' || !state.moves?.length) return [];
  const entries = [];
  let seenYard = false;
  state.moves.forEach((move, index) => {
    if (move.enters) {
      if (seenYard) return;
      seenYard = true;
    }
    entries.push({
      index,
      move,
      label: moveLabel(move),
      short: moveLabel(move, true),
      rank: moveRank(move),
    });
  });

  const count = new Map();
  for (const e of entries) count.set(e.label, (count.get(e.label) ?? 0) + 1);
  for (const e of entries) {
    if (count.get(e.label) > 1 && !e.move.enters) {
      e.label = `${e.label} ${e.move.from + 1}`;
      e.short = `${e.short} ${e.move.from + 1}`;
    }
  }

  
  
  
  return entries.sort((a, b) => b.rank - a.rank || a.index - b.index);
}
