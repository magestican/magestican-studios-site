







export const BOSS_FLASH_MS = 90;

export const BOSS_KICK = 0.035;











export function createBossWatch() {
  let lastHp = null, lastMax = null, lastFlash = -Infinity;
  return {
    update(boss, now) {
      if (!boss || !boss.on || !(boss.max > 0)) {
        lastHp = null; lastMax = null;
        return { on: false, frac: 0, hit: false, dealt: 0, flash: false };
      }
      const fresh = lastHp === null || lastMax !== boss.max;
      const dealt = fresh ? 0 : Math.max(0, lastHp - boss.hp);
      lastHp = boss.hp; lastMax = boss.max;
      const hit = dealt > 0;
      const flash = hit && now - lastFlash >= BOSS_FLASH_MS;
      if (flash) lastFlash = now;
      const frac = Math.min(1, Math.max(0, boss.hp / boss.max));
      return { on: true, frac, hit, dealt, flash };
    },
  };
}





export function bossImpact(bossX, bossZ, halfW, halfH, shipX) {
  const x = Math.min(bossX + halfW * 0.9, Math.max(bossX - halfW * 0.9, shipX));
  return { x, z: bossZ + halfH * 0.8 };
}
