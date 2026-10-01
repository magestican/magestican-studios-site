



















export const COUNT_MS = 3600;
const BEAT = 900;







export function countAt(ms) {
  if (ms < 0 || ms >= COUNT_MS) return null;
  const beat = Math.floor(ms / BEAT);
  return ['3', '2', '1', 'GO'][beat] ?? null;
}


export function beatShare(ms) {
  if (ms < 0 || ms >= COUNT_MS) return 1;
  return (ms % BEAT) / BEAT;
}


export function counting(ms) {
  return ms >= 0 && ms < COUNT_MS;
}











export function canStart({ hosting = false, peers = [] } = {}) {
  return !!hosting && peers.length > 1;
}


export function startLabel({ hosting = false, peers = [], counting: busy = false } = {}) {
  if (busy) return 'Starting...';
  if (peers.length < 2) return 'Waiting for a player';
  return hosting ? 'Start' : 'Host will start';
}

















export function freshPuzzle(count, solvedByEach = [], pick = (n) => Math.floor(Math.random() * n)) {
  const used = new Set();
  for (const list of solvedByEach) for (const i of list ?? []) used.add(i);
  const free = [];
  for (let i = 0; i < count; i += 1) if (!used.has(i)) free.push(i);
  
  
  
  const from = free.length ? free : Array.from({ length: count }, (_, i) => i);
  if (!from.length) return null;
  const at = Math.min(from.length - 1, Math.max(0, Math.floor(pick(from.length))));
  return from[at];
}









export function freshScores(peers = []) {
  const out = {};
  for (const id of peers) out[id] = 0;
  return out;
}






























export const SESSION_MINUTES = Object.freeze([10, 15, 30]);










export function remainingMs({
  startedAt = null, minutes = 10, now = 0, pausedMs = 0, pausedAt = null,
} = {}) {
  if (startedAt === null) return minutes * 60000;
  const frozen = pausedAt === null ? 0 : Math.max(0, now - pausedAt);
  const spent = Math.max(0, now - startedAt - pausedMs - frozen);
  return Math.max(0, minutes * 60000 - spent);
}


export function sessionOver(args) {
  return args?.startedAt !== null && args?.startedAt !== undefined && remainingMs(args) <= 0;
}







export function clockText(ms) {
  const left = Math.max(0, Math.ceil(ms / 1000));
  if (left < 60) return `${left}s`;
  return `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`;
}








export function clockUrgent(ms) {
  return ms > 0 && ms <= 30000;
}


















export function sessionButton({
  hosting = false, peers = [], started = false, paused = false, counting: busy = false,
} = {}) {
  if (busy) return { id: 'start', label: 'Starting...', enabled: false };
  if (paused) {
    return hosting
      ? { id: 'resume', label: 'Resume', enabled: peers.length > 1 }
      : { id: 'resume', label: 'Waiting for the host', enabled: false };
  }
  if (started) return { id: 'running', label: null, enabled: false };
  if (peers.length < 2) return { id: 'start', label: 'Waiting for a player', enabled: false };
  return hosting
    ? { id: 'start', label: 'Start', enabled: true }
    : { id: 'start', label: 'Host will start', enabled: false };
}
