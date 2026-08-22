// Match roster rules — PURE. Who is in the match, how bots fill the empty
// seats, and which bot steps aside when a human arrives.
//
// This is extracted from game.js so the rules can be tested without a browser,
// a network, or a running match. The rules themselves are Bryan's, 2026-08-21:
// "up to 16 players, with up to 15 bots in a match, and each person who jumps
// in the match, then replacing a bot until there's 16 real players."

export const MATCH_CAP = 16;
export const MAX_BOTS = MATCH_CAP - 1;   // the host is always one of the sixteen

// How many bots SHOULD exist given the humans present and the host's setting.
// Bots never take a seat a human could use, and never push the match over cap.
export function desiredBots(humans, requested) {
  const room = Math.max(0, MATCH_CAP - humans);
  return Math.min(room, Math.max(0, requested), MAX_BOTS);
}

// Which bot gives up its seat when `joinerTeam` arrives.
//
// Prefers a bot on the JOINER'S OWN team, so the swap is team-neutral: taking
// one off the other side would hand the joiner's team a spare body every time
// somebody connects, which is the opposite of what a backfill is for. If their
// own side has no bots, take one from whichever team is larger.
//
//   bots: [{ id, team }]
//   counts: { red, blue }  — total bodies per team INCLUDING the joiner
export function pickBotToDisplace(bots, joinerTeam, counts) {
  if (!bots || !bots.length) return null;
  const own = bots.filter((b) => b.team === joinerTeam);
  if (own.length) return own[0].id;
  const biggest = (counts?.red ?? 0) >= (counts?.blue ?? 0) ? 'red' : 'blue';
  return (bots.find((b) => b.team === biggest) ?? bots[0]).id;
}

// Is there room for another body of any kind?
export function hasRoom(humans, bots) {
  return humans + bots < MATCH_CAP;
}

// The full roster decision for one join event. Returns what the host should do.
export function onHumanJoin({ humans, bots, joinerTeam, counts }) {
  // `humans` already includes the joiner.
  if (humans + bots <= MATCH_CAP) return { displace: null, full: humans >= MATCH_CAP };
  return {
    displace: pickBotToDisplace(bots.list ?? [], joinerTeam, counts),
    full: humans >= MATCH_CAP,
  };
}
