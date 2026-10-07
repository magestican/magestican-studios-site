







export const TEMPERS = {
  calm: { share: 0.55, wait: 1, wander: 1, hop: 1, notice: 1, chase: 1, word: 'Calm' },
  sleepy: { share: 0.15, wait: 3.2, wander: 0.6, hop: 0.4, notice: 0.75, chase: 0.9, word: 'Sleepy' },
  playful: { share: 0.15, wait: 0.35, wander: 1.5, hop: 2.2, notice: 1, chase: 1, word: 'Playful' },
  bold: { share: 0.15, wait: 0.8, wander: 1.1, hop: 1, notice: 1.25, chase: 1.1, word: 'Bold' },
};
export const TEMPER_IDS =  (Object.keys(TEMPERS));


export function rollTemper(rand) {
  let u = rand();
  for (const id of TEMPER_IDS) { u -= TEMPERS[id].share; if (u < 0) return id; }
  return 'calm';
}


export const temperOf = (d) => {
  const t = d && d.temper;
  return t && Object.prototype.hasOwnProperty.call(TEMPERS, t) ? TEMPERS[ (t)] : TEMPERS.calm;
};
