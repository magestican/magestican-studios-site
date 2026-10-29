






const WORDS = {
  wizard: 'wizard',
  wizards: 'wizard',
  witch: 'wizard',
  witches: 'wizard',
  magic: 'wizard',
  princess: 'princess',
  prince: 'princess',
  ghost: 'ghost',
  ghosts: 'ghost',
  boo: 'ghost',
  fairy: 'fairy',
  fairies: 'fairy',
  dragon: 'dragon',
  dragons: 'dragon',
  ice: 'ice_queen',
  queen: 'ice_queen',
  frozen: 'ice_queen',
  snow: 'ice_queen',
  astronaut: 'astronaut',
  space: 'astronaut',
  spaceman: 'astronaut',
  rocket: 'astronaut',
  robot: 'robot',
  robots: 'robot',
  robo: 'robot',
};

const LANG = 'en-US';







const PHRASES = [
  [['two', '2', 'to', 'too'], ['players'], { kind: 'players', value: 2 }],
  [['two', '2'], ['player'], { kind: 'players', value: 2 }],
  [['one', '1'], ['player', 'players'], { kind: 'players', value: 1 }],
  [['sound', 'music'], ['off'], { kind: 'sound', value: false }],
  [['sound', 'music'], ['on'], { kind: 'sound', value: true }],
  [['free'], ['play'], { kind: 'mode', value: 'mirror' }],
  [['score', 'scoring'], ['points', 'point'], { kind: 'mode', value: 'show' }],
];

const SINGLES = { quiet: { kind: 'sound', value: false }, mute: { kind: 'sound', value: false } };




export const VOCABULARY = [
  ...new Set([...Object.keys(WORDS), ...PHRASES.flatMap(([a, b]) => [...a, ...b]), ...Object.keys(SINGLES)]),
].filter((w) => /^[a-z]+$/.test(w));


export function heardCommand(transcript) {
  const words = String(transcript ?? '')
    .toLowerCase()
    .match(/[a-z0-9]+/g);
  if (!words) return null;
  for (let i = words.length - 1; i >= 0; i--) {
    const w = words[i];
    if (i > 0) {
      const hit = PHRASES.find(([a, b]) => b.includes(w) && a.includes(words[i - 1]));
      if (hit) return hit[2];
    }
    if (Object.hasOwn(SINGLES, w)) return SINGLES[w];
    if (Object.hasOwn(WORDS, w)) return { kind: 'costume', value: WORDS[w] };
  }
  return null;
}


export async function voiceSupport(win) {
  const SR = win.SpeechRecognition;
  if (typeof SR !== 'function' || typeof SR.available !== 'function' || !('processLocally' in SR.prototype)) return 'none';
  try {
    const state = await SR.available({ langs: [LANG], processLocally: true });
    if (state === 'available') return 'ready';
    if ((state === 'downloadable' || state === 'downloading') && typeof SR.install === 'function') return 'install';
  } catch {
    
  }
  return 'none';
}





export async function startVoice(win, onCommand) {
  const support = await voiceSupport(win);
  if (support === 'none') throw new Error('no on-device speech recognition');
  const SR = win.SpeechRecognition;
  
  if (support === 'install' && !(await SR.install({ langs: [LANG], processLocally: true })))
    throw new Error('on-device speech could not be installed');
  const r = new SR();
  r.processLocally = true;
  if (r.processLocally !== true) throw new Error('on-device speech refused');
  r.lang = LANG;
  r.continuous = true;
  r.interimResults = true;
  let on = true;
  let lastText = '';
  r.onresult = ( e) => {
    const res = e.results[e.results.length - 1];
    const text = res?.[0]?.transcript ?? '';
    if (text === lastText) return;
    lastText = text;
    const cmd = heardCommand(text);
    if (cmd) onCommand(cmd);
  };
  r.onend = () => {
    lastText = '';
    if (on) r.start();
  };
  r.onerror = ( e) => {
    
    if (e?.error === 'not-allowed' || e?.error === 'service-not-allowed' || e?.error === 'language-not-supported') on = false;
  };
  r.start();
  return () => {
    on = false;
    r.abort();
  };
}
