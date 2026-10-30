


export const MAX_PLAYERS = 20;


export const clampPlayers = (n) => (Number.isFinite(n) ? Math.min(MAX_PLAYERS, Math.max(1, Math.floor(n))) : 1);


export const hpScaleFor = (n) => Math.sqrt(clampPlayers(n));


export const bossPlates = (n) => 4 + Math.floor(clampPlayers(n) / 5);
