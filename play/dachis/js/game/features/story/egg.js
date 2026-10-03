


export const EGG_LINES = [
  
  'Hibone\'s egg is warm in your pack. (Warm like the radiator in Mom\'s kitchen. The one that bangs.)',
  'Something inside Hibone\'s egg turns over. (Did it just KICK me?)',
  'The egg is hot now, and it hums against your back. (It hums worse than Mr. Ortiz on four.)',
  'A thin crack of light runs across the egg and closes up again. (Hey. Come on. You were almost out.)',
  'The egg knocks against your back. Twice. Then twice again.',
  'Hibone\'s egg glows right through the canvas. (Great. Now I am a night-light.)',
  'Every time you set the egg down, it rolls back toward you.',
  'The egg goes quiet. Very warm, and very quiet. (Okay. Whenever you want. No rush.)',
];

export const eggLine = (n) => EGG_LINES[Math.max(0, Math.min(EGG_LINES.length, n) - 1)];
