








export const DEPTHS = Object.freeze([
  Object.freeze({ id: 'shallows', name: 'Shallows', quota: 8, tickMs: 190, rampMs: 4, minTickMs: 150,
    edges: 'wall', jellies: 0, dark: 0, shoalEvery: 3,
    palette: { water: 0x075a74, deep: 0x01202f, glow: 0x7ff6ff, mote: 0xffd35a, shoal: 0x7dffcf } }),
  Object.freeze({ id: 'kelp', name: 'Kelp Forest', quota: 10, tickMs: 175, rampMs: 4, minTickMs: 135,
    edges: 'wrap', jellies: 0, dark: 0.25, shoalEvery: 3,
    palette: { water: 0x0b5d4a, deep: 0x021c17, glow: 0x9dff7a, mote: 0xfff07a, shoal: 0x5affe0 } }),
  Object.freeze({ id: 'reef', name: 'Glass Reef', quota: 12, tickMs: 165, rampMs: 3, minTickMs: 125,
    edges: 'wall', jellies: 3, dark: 0.4, shoalEvery: 3,
    palette: { water: 0x3a2a7a, deep: 0x0c0624, glow: 0xff8ad8, mote: 0xffc65a, shoal: 0x8aa8ff } }),
  Object.freeze({ id: 'abyss', name: 'The Abyss', quota: 12, tickMs: 165, rampMs: 3, minTickMs: 125,
    edges: 'wrap', jellies: 2, dark: 1, shoalEvery: 3,
    palette: { water: 0x0a0a2a, deep: 0x000004, glow: 0x6ab8ff, mote: 0xffe3a0, shoal: 0xb08cff } }),
  Object.freeze({ id: 'trench', name: 'The Trench', quota: 14, tickMs: 155, rampMs: 3, minTickMs: 120,
    edges: 'wall', jellies: 4, dark: 0.7, shoalEvery: 2,
    palette: { water: 0x4a0a1e, deep: 0x080003, glow: 0xff6a4a, mote: 0xfff2b0, shoal: 0xff9a3a } }),
]);


export const CLASSIC = Object.freeze({ id: 'classic', name: 'Classic', quota: Infinity, tickMs: 180, rampMs: 2,
  minTickMs: 120, edges: 'wrap', jellies: 0, dark: 0, shoalEvery: 4,
  palette: { water: 0x0d4a6a, deep: 0x01131f, glow: 0x9af0ff, mote: 0xffd35a, shoal: 0x7dffcf } });


export const GENTLE_FACTOR = 1.4;


export const HUMAN_FLOOR_MS = 120;
