



const deep = (o) => { for (const v of Object.values(o)) if (v && typeof v === 'object') deep(v); return Object.freeze(o); };

export const TOKENS = deep({
  "colour": {
    "paper": "#f6f1e6",
    "paperLit": "#fffdf6",
    "paperWarm": "#fffbf1",
    "paperDeep": "#ece5d5",
    "card": "#fffbf2",
    "ink": "#1c1a17",
    "inkSoft": "#4a463f",
    "inkFaint": "#4f4a41",
    "rule": "#d9d2c1",
    "gold": "#f4c95d",
    "goldDeep": "#d9a92f",
    "amber": "#ffb03a",
    "barn": "#b73a2a",
    "barnText": "#8f2a1a",
    "sky": "#7cb0ff",
    "grass": "#5f8b3f",
    "night": "#14120f",
    "live": "#2f8a4a",
    "idle": "#9b9285",
    "highlight": "#fdf0c9",
    "locked": "#4a5261"
  },
  "tier": {
    "common": "#9aa4b5",
    "uncommon": "#5fd08a",
    "rare": "#59a6ff",
    "legendary": "#ffb03a"
  },
  "radius": {
    "chip": 12,
    "site": 14,
    "sheet": 20,
    "pill": 999
  },
  "space": [
    4,
    8,
    12,
    16,
    24,
    32,
    48
  ],
  "font": {
    "serif": "Georgia, \"Iowan Old Style\", \"Palatino Linotype\", Palatino, serif",
    "sans": "system-ui, -apple-system, \"Segoe UI\", \"Helvetica Neue\", Roboto, Arial, sans-serif"
  },
  "motion": {
    "tap": 120,
    "sheet": 220,
    "celebrate": 600
  }
});

export const COLOUR = TOKENS.colour;
export const FONT = TOKENS.font;
export const MOTION = TOKENS.motion;


export function alpha(hex, a) {
  const n = parseInt(String(hex).slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
