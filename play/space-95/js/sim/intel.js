





const LEVELS = 20;
const SECRETS_PER_LEVEL = 3;
const SECRET_KINDS = ['cache', 'deed', 'specimen']; 
const LEVEL_TENTHS = 35;
const SECRET_TENTHS = 5;
const EXCEEDS_SECRETS = 40;

export function emptySave() {
  return {
    version: 1,
    variant: 'woman', 
    cleared: new Array(LEVELS).fill(false),
    secrets: new Array(LEVELS * SECRETS_PER_LEVEL).fill(false),
    bestTimes: new Array(LEVELS).fill(null), 
    lives: 5,
    hearts: 3,
  };
}




export function secretIndex(level, kind) {
  const k = SECRET_KINDS.indexOf(kind);
  if (level < 1 || level > LEVELS || k < 0) throw new Error(`no secret ${kind} on level ${level}`);
  return (level - 1) * SECRETS_PER_LEVEL + k;
}


function intelTenths(s) {
  const levels = s.cleared.filter(Boolean).length;
  const secrets = s.secrets.filter(Boolean).length;
  return levels * LEVEL_TENTHS + secrets * SECRET_TENTHS;
}


export const intelPercent = (s) => intelTenths(s) / 10;


export function endingTier(s) {
  if (!s.cleared.every(Boolean)) return null;
  const secrets = s.secrets.filter(Boolean).length;
  if (secrets === LEVELS * SECRETS_PER_LEVEL) return 'employee-of-the-year';
  if (secrets >= EXCEEDS_SECRETS) return 'exceeds';
  return 'meets';
}






export function gameOver(s) {
  return { ...s, lives: 5 };
}


export function loadSave(raw) {
  const fresh = emptySave();
  if (!raw || typeof raw !== 'object' || raw.version !== 1) return fresh;
  const bools = (a, n) => (Array.isArray(a) && a.length === n ? a.map(Boolean) : new Array(n).fill(false));
  return {
    ...fresh,
    variant: raw.variant === 'man' ? 'man' : 'woman',
    cleared: bools(raw.cleared, LEVELS),
    secrets: bools(raw.secrets, LEVELS * SECRETS_PER_LEVEL),
    bestTimes:
      Array.isArray(raw.bestTimes) && raw.bestTimes.length === LEVELS
        ? raw.bestTimes.map((t) => (Number.isFinite(t) && t > 0 ? t : null))
        : fresh.bestTimes,
    lives: Number.isInteger(raw.lives) && raw.lives > 0 ? raw.lives : fresh.lives,
    hearts: Number.isInteger(raw.hearts) && raw.hearts >= 3 && raw.hearts <= 6 ? raw.hearts : fresh.hearts,
  };
}






export function mergeSaves(a, b) {
  return {
    ...a,
    cleared: a.cleared.map((v, i) => v || b.cleared[i]),
    secrets: a.secrets.map((v, i) => v || b.secrets[i]),
    bestTimes: a.bestTimes.map((t, i) => {
      const u = b.bestTimes[i];
      return t === null ? u : u === null ? t : Math.min(t, u);
    }),
    hearts: Math.max(a.hearts, b.hearts),
  };
}
