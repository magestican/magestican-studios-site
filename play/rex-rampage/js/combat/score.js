


const COMBO_MAX = 5;
const KILLS_PER_STEP = 3;




export function createScore() {
  return { points: 0, combo: 1, streak: 0, kills: 0, shots: 0, hitsLanded: 0, damageTaken: 0 };
}


export function onKill(s, base) {
  s.points += base * s.combo;
  s.kills++;
  s.streak++;
  if (s.streak % KILLS_PER_STEP === 0) s.combo = Math.min(COMBO_MAX, s.combo + 1);
}


export function onShots(s, shots, landed) {
  s.shots += shots;
  s.hitsLanded += landed;
}


export function onDamage(s) {
  s.combo = 1;
  s.streak = 0;
  s.damageTaken++;
}


export function applyContinue(s) {
  s.points = Math.round(s.points * 0.9);
}


export function rank(s, totalEnemies) {
  const acc = s.shots ? s.hitsLanded / s.shots : 0.6;
  const kr = totalEnemies ? s.kills / totalEnemies : 0.6;
  if (acc >= 0.8 && kr >= 0.9 && s.damageTaken === 0) return 'S';
  if (acc >= 0.7 && kr >= 0.8) return 'A';
  if (acc >= 0.5 && kr >= 0.6) return 'B';
  if (acc >= 0.4 || kr >= 0.4) return 'C';
  return 'D';
}
