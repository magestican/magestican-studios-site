

































































































export const VOTE_SECONDS = 15;





export const VOTE_PHASE = 'voting';



export const VOTE_RESULT_MS = 2600;

















export function isRoundOver(state) {
  return state === 'ended' || state === VOTE_PHASE;
}










export function emptyVotes() { return new Map(); }










export function castVote(votes, voterId, ballot = {}, { mapOptions = [], modeOptions = [] } = {}) {
  if (!votes || !voterId) return votes;
  const map  = mapOptions.includes(ballot.map)   ? ballot.map   : null;
  const mode = modeOptions.includes(ballot.mode) ? ballot.mode  : null;
  
  
  
  if (map == null && mode == null) { votes.delete(voterId); return votes; }
  const prev = votes.get(voterId) || { map: null, mode: null };
  votes.set(voterId, {
    map:  map  == null ? prev.map  : map,
    mode: mode == null ? prev.mode : mode,
  });
  return votes;
}

export function clearVote(votes, voterId) {
  votes?.delete(voterId);
  return votes;
}





export function voterCount(votes) { return votes ? votes.size : 0; }





export function canVote(meta) { return !!meta && !meta.bot; }




export function eligibleVoters(metas) {
  let n = 0;
  for (const m of metas || []) if (canVote(m)) n++;
  return n;
}








export function tally(votes, axis, options = []) {
  const counts = {};
  for (const id of options) counts[id] = 0;
  for (const ballot of (votes ? votes.values() : [])) {
    const id = ballot?.[axis];
    if (id != null && Object.prototype.hasOwnProperty.call(counts, id)) counts[id] += 1;
  }
  return counts;
}

export function totalVotes(counts) {
  let n = 0;
  for (const id in counts) n += counts[id];
  return n;
}





export function leaders(counts, options = []) {
  let best = 0;
  for (const id of options) if ((counts[id] ?? 0) > best) best = counts[id];
  if (best === 0) return [];
  return options.filter((id) => (counts[id] ?? 0) === best);
}












export function decide({ options = [], counts = {}, roll = null } = {}) {
  if (!options.length) return { id: null, reason: 'empty', tied: [], counts };
  const draw = (pool) => {
    if (pool.length === 1) return pool[0];
    
    
    if (typeof roll !== 'function') return pool[0];
    const i = roll(pool.length);
    return pool[Number.isInteger(i) && i >= 0 && i < pool.length ? i : 0];
  };
  const top = leaders(counts, options);
  if (top.length === 0) {
    
    
    
    return { id: draw(options), reason: 'empty', tied: [], counts };
  }
  if (top.length === 1) return { id: top[0], reason: 'votes', tied: [], counts };
  return { id: draw(top), reason: 'tie', tied: top, counts };
}







export function resolveVote({
  votes = null, mapOptions = [], modeOptions = [], roll = null,
} = {}) {
  const mapCounts  = tally(votes, 'map', mapOptions);
  const modeCounts = tally(votes, 'mode', modeOptions);
  return {
    map:  decide({ options: mapOptions,  counts: mapCounts,  roll }),
    mode: decide({ options: modeOptions, counts: modeCounts, roll }),
    voters: voterCount(votes),
  };
}















export function voteDeadline(now = Date.now(), seconds = VOTE_SECONDS) {
  return now + seconds * 1000;
}


export function remainingSeconds(endsAt, now = Date.now()) {
  return Math.max(0, Math.ceil(((endsAt || 0) - now) / 1000));
}

export function isExpired(endsAt, now = Date.now()) {
  return remainingSeconds(endsAt, now) <= 0;
}





















export function rebaseDeadline(stamp, now = Date.now(), maxMs = VOTE_SECONDS * 1000) {
  const remain = (Number.isFinite(stamp) ? stamp : 0) - now;
  if (!(remain > 0)) return now;                 
  return now + Math.min(remain, maxMs);
}









export function resultLine(decision, label = 'map') {
  if (!decision || decision.id == null) return `No ${label} chosen.`;
  const n = decision.counts?.[decision.id] ?? 0;
  if (decision.reason === 'empty') return `Nobody voted — ${label} picked at random.`;
  if (decision.reason === 'tie') {
    return `${decision.tied.length}-way tie on ${n} vote${n === 1 ? '' : 's'} — `
         + `${label} drawn from the tie.`;
  }
  return `Won the ${label} vote with ${n} vote${n === 1 ? '' : 's'}.`;
}






export function rows(counts, options = [], total = null) {
  const sum = total == null ? totalVotes(counts) : total;
  return options.map((id) => ({
    id,
    votes: counts[id] ?? 0,
    
    
    share: sum > 0 ? (counts[id] ?? 0) / sum : 0,
  }));
}
