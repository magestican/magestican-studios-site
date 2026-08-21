// The game-mode roster — PURE DATA and PURE FUNCTIONS. No THREE, no DOM.
//
// Team Bondage had one mode, capture-the-flag, and like the one map it had
// stopped being a mode and become "the rules". WIN_SCORE was a constant in
// game.js, the score only ever moved on a flag capture, and the anagram
// tiebreaker fired off that same constant.
//
// The four modes below all share the same skeleton — two teams, a score each,
// first to the target, ice-drift movement, the same weapons — and differ in
// exactly one thing: WHAT PUTS A POINT ON THE BOARD. So that is the only thing
// this file describes.
//
//   scoring: 'captures'  a point per enemy flag returned to your stand
//   scoring: 'kills'     a point per kill
//   scoring: 'hold'      a point per second your team alone holds the centre
//
// Everything a mode changes at runtime follows from `scoring`, which keeps the
// branches in game.js down to three and means adding a fifth mode is a data
// change plus one scoring rule.

export const DEFAULT_MODE = 'ctf';

export const MODES = Object.freeze({

  ctf: {
    id: 'ctf',
    name: 'Capture the Flag',
    short: 'CTF',
    emoji: '🚩',
    blurb: 'Take the enemy flag back to your own stand. First to 5.',
    scoring: 'captures',
    winScore: 5,
    flags: 'both',        // a flag in each base
    anagram: true,        // the losing team gets its 10-second steal
    scoreLabel: 'FLAGS',
    // What the HUD's objective line says while you are playing.
    hint: 'Grab the enemy flag — bring it home to score',
  },

  tdm: {
    id: 'tdm',
    name: 'Team Deathmatch',
    short: 'TDM',
    emoji: '💥',
    blurb: 'No flags, no objective, no excuses. First team to 30 kills.',
    scoring: 'kills',
    // 30, not 5. A kill is worth far less than a capture and happens far more
    // often, so a shared target would end a TDM round in under a minute.
    winScore: 30,
    flags: 'none',
    anagram: true,
    scoreLabel: 'KILLS',
    hint: 'Kill the other team. That is the whole plan',
  },

  koth: {
    id: 'koth',
    name: 'King of the Hill',
    short: 'KOTH',
    emoji: '👑',
    blurb: 'Hold the centre. You only score while your team is up there '
         + 'ALONE — one enemy on the hill stops the clock for everyone.',
    scoring: 'hold',
    winScore: 90,          // seconds of sole possession
    flags: 'none',
    anagram: true,
    scoreLabel: 'SECONDS',
    hint: 'Stand on the centre — and be the only team up there',
    // How close to the centre counts as "on the hill". Generous, because the
    // whole map slides and a tight ring would be unholdable on ice.
    hillRadius: 6.5,
  },

  oneflag: {
    id: 'oneflag',
    name: 'One Flag',
    short: '1FLAG',
    emoji: '🏴',
    blurb: 'A single neutral flag in the middle. Carry it into the ENEMY '
         + 'base. Everyone wants the same thing, so everyone is in one fight.',
    scoring: 'captures',
    // Lower than CTF: with one flag there is only ever one fight on the map,
    // so rounds are slower and 5 would drag.
    winScore: 3,
    flags: 'neutral',      // one flag, at the centre
    anagram: true,
    scoreLabel: 'RUNS',
    hint: 'One flag, in the middle. Take it to THEIR base',
  },
});

export const MODE_IDS = Object.freeze(Object.keys(MODES));

export function getMode(id) {
  return MODES[id] ?? MODES[DEFAULT_MODE];
}

// ---------------------------------------------------------------------------
// The scoring rules
// ---------------------------------------------------------------------------

// Does a kill put a point on the board in this mode? Kept as a function rather
// than read inline so the self-kill rule lives in one place: a player who
// blows themselves up with a rocket must not score for their own team, and
// killing a team-mate must not either.
export function killScores(mode, killerTeam, victimTeam) {
  if (mode.scoring !== 'kills') return null;
  if (!killerTeam || !victimTeam) return null;
  if (killerTeam === victimTeam) return null;   // suicide or team-kill
  return killerTeam;
}

// Who, if anyone, is scoring the hill this tick?
//
// The rule that makes KOTH a fight rather than a camp: you score only while
// your team is on the hill and the other team is NOT. One defender walking up
// there stops the clock, so the holding team has to keep clearing it rather
// than sitting in a corner of it.
export function hillOwner(mode, occupants) {
  if (mode.scoring !== 'hold') return null;
  const red = occupants.filter((o) => o === 'red').length;
  const blue = occupants.filter((o) => o === 'blue').length;
  if (red > 0 && blue === 0) return 'red';
  if (blue > 0 && red === 0) return 'blue';
  return null;   // empty, or contested
}

// Is a position on the hill? Flat distance only — the centre feature is a
// couple of voxels tall on most maps and standing on top of it should not be
// worth more than standing against it.
export function onHill(mode, pos, centre) {
  if (!pos || !centre) return false;
  const r = mode.hillRadius ?? 6.5;
  return Math.hypot(pos.x - centre.x, pos.z - centre.z) <= r;
}

// Has anybody won? Returns 'red' | 'blue' | null.
export function winner(mode, scores) {
  const target = mode.winScore;
  if (scores.red >= target && scores.red > scores.blue) return 'red';
  if (scores.blue >= target && scores.blue > scores.red) return 'blue';
  return null;
}

// Should the anagram tiebreaker fire? The losing team's 10-second steal only
// makes sense once somebody has actually reached the target and there is a
// clear loser to offer it to.
export function anagramDue(mode, scores) {
  if (!mode.anagram) return false;
  return winner(mode, scores) !== null;
}
