




export const ALPHA_IN = 50, ALPHA_SIZE = 1.42, ALPHA_LEVELS = 4;

export const rollAlpha = (stage, rand) => stage >= 2 && rand() < 1 / ALPHA_IN;

export const isAlpha = (d) => !!(d && d.alpha);


export const battleSizeCap = (d) => (isAlpha(d) ? 1.5 : 1.35);
