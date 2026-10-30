


export const DIFFICULTY = {
  easy: { id: 'easy', hearts: 10, telegraph: 1.4, volume: 1.35, autoReload: true, refill: true, continues: Infinity, rexBite: 1 },
  normal: { id: 'normal', hearts: 6, telegraph: 1.0, volume: 1.15, autoReload: false, refill: false, continues: 3, rexBite: 2 },
  hard: { id: 'hard', hearts: 4, telegraph: 0.7, volume: 1.0, autoReload: false, refill: false, continues: 3, rexBite: 2 },
};





export function createLife(d) {
  return { hearts: d.hearts, continuesLeft: d.continues, over: false };
}


export function hurt(life, amount, d) {
  if (life.over) return { continued: false };
  life.hearts = Math.max(0, life.hearts - amount);
  if (life.hearts > 0) return { continued: false };
  if (life.continuesLeft > 0) {
    life.continuesLeft--;
    life.hearts = d.hearts;
    return { continued: true };
  }
  life.over = true;
  return { continued: false };
}


export function checkpoint(life, d) {
  if (d.refill) life.hearts = d.hearts;
}
