


export const EGG_LINES = [
  'In your pack, Hibone\'s egg is warm - warm as a stone left in the sun.',
  'Hibone\'s egg is warmer now. For a moment you feel something inside it turn over.',
  'The egg is hot to the touch, and it hums when you hold it close.',
  'A hairline crack of light runs across the egg, then fades. Not yet.',
  'The egg beats against your back like a second heart.',
  'Hibone\'s egg glows through the canvas of your pack.',
  'The egg rocks on its own. Whatever is inside is nearly ready.',
  'The egg is quiet and very warm. It is waiting for the Spire.',
];

export const eggLine = (n) => EGG_LINES[Math.max(0, Math.min(EGG_LINES.length, n) - 1)];
