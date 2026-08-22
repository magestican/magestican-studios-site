


















export function emptyTally() { return new Map(); }

function row(tally, id) {
  let r = tally.get(id);
  if (!r) { r = { kills: 0, deaths: 0 }; tally.set(id, r); }
  return r;
}







export function tallyKill(tally, killerId, victimId) {
  if (victimId) row(tally, victimId).deaths += 1;
  if (killerId && killerId !== victimId) row(tally, killerId).kills += 1;
  return tally;
}

export function tallyOf(tally, id) {
  const r = tally.get(id);
  return { kills: r?.kills ?? 0, deaths: r?.deaths ?? 0 };
}












export function sortRows(rows) {
  return [...rows].sort((a, b) =>
    (b.kills - a.kills)
    || (a.deaths - b.deaths)
    || String(a.name).localeCompare(String(b.name)));
}








export function scoreboardRows({ players = [], tally = emptyTally(), myId = null } = {}) {
  const out = { red: [], blue: [] };
  for (const p of players) {
    if (!p || (p.team !== 'red' && p.team !== 'blue')) continue;
    const { kills, deaths } = tallyOf(tally, p.id);
    out[p.team].push({
      id: p.id,
      name: p.name || String(p.id).slice(0, 6),
      team: p.team,
      bot: !!p.bot,
      kills,
      deaths,
      isMe: p.id === myId,
    });
  }
  out.red = sortRows(out.red);
  out.blue = sortRows(out.blue);
  return out;
}

export function teamTotals(rows = []) {
  return rows.reduce((acc, r) => ({
    kills: acc.kills + r.kills, deaths: acc.deaths + r.deaths,
  }), { kills: 0, deaths: 0 });
}












export function matchOutcome({ scores = { red: 0, blue: 0 }, myTeam = null } = {}) {
  const red = scores.red ?? 0;
  const blue = scores.blue ?? 0;
  const winner = red === blue ? null : (red > blue ? 'red' : 'blue');
  const outcome = winner === null ? 'draw' : (winner === myTeam ? 'win' : 'lose');
  return { winner, loser: winner === null ? null : (winner === 'red' ? 'blue' : 'red'),
           outcome, red, blue };
}





export const RESULT_COPY = Object.freeze({
  win:  { title: 'VICTORY',       sub: 'Your team took the round.',           accent: '#ffd76a' },
  lose: { title: 'DEFEAT',        sub: 'They took the round. Rematch?',        accent: '#ff8a7a' },
  draw: { title: 'DEAD HEAT',     sub: 'Nobody took the round.',               accent: '#cfe3ff' },
});

export function resultCopy({ scores, myTeam, anagramDue = false } = {}) {
  const r = matchOutcome({ scores, myTeam });
  const base = RESULT_COPY[r.outcome];
  
  
  
  const sub = anagramDue
    ? (r.outcome === 'win'
        ? 'They get ten seconds to steal it…'
        : (r.outcome === 'lose' ? 'Ten seconds to steal it back…'
                                : 'Ten seconds to break the tie…'))
    : base.sub;
  return { ...r, title: base.title, sub, accent: base.accent };
}













export function captureFanfare({
  scoringTeam, myTeam, capturedColor, capturerName = 'Somebody',
  isMe = false, scores = { red: 0, blue: 0 }, winScore = null,
} = {}) {
  const mine = scoringTeam === myTeam;
  const points = scores[scoringTeam] ?? 0;
  
  
  
  const matchPoint = winScore != null && points === winScore - 1;
  const flag = capturedColor === 'neutral' ? 'the flag' : `the ${capturedColor} flag`;
  return {
    tone: mine ? 'scored' : 'conceded',
    team: scoringTeam,
    matchPoint,
    
    phrase: mine ? 'CAPTURE' : 'CONCEDED',
    title: mine ? (isMe ? 'YOU SCORED!' : 'YOUR TEAM SCORES')
                : `${String(scoringTeam).toUpperCase()} SCORES`,
    subtitle: mine ? `${capturerName} ran ${flag} home`
                   : `${capturerName} ran ${flag} home — take it back`,
    matchPointLine: matchPoint
      ? (mine ? 'MATCH POINT — one more wins it'
              : 'MATCH POINT — one more and they win')
      : null,
  };
}
