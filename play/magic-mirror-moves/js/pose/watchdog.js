






export const FIRST_READ_S = 25;

export const STUCK_READ_S = 8;






export function readStuck(read, now) {
  if (read.since == null) return false;
  return now - read.since > (read.runs === 0 ? FIRST_READ_S : STUCK_READ_S);
}
