











const WORDS = {
  wizard: 'wizard',
  witch: 'wizard',
  magic: 'wizard',
  princess: 'princess',
  prince: 'princess',
  ghost: 'ghost',
  fairy: 'fairy',
  dragon: 'dragon',
  queen: 'ice_queen',
  frozen: 'ice_queen',
  astronaut: 'astronaut',
  spaceman: 'astronaut',
  rocket: 'astronaut',
  robot: 'robot',
  pirate: 'pirate',
  mermaid: 'mermaid',
  superhero: 'superhero',
};

const LANG = 'en-US';







const PHRASES = [
  [['two', '2'], ['players', 'player'], { kind: 'players', value: 2 }],
  [['one', '1'], ['player', 'players'], { kind: 'players', value: 1 }],
  [['sound', 'music'], ['off'], { kind: 'sound', value: false }],
  [['sound', 'music'], ['on'], { kind: 'sound', value: true }],
  [['free'], ['play'], { kind: 'mode', value: 'mirror' }],
  [['score', 'scoring'], ['points', 'point'], { kind: 'mode', value: 'show' }],
  [['ice'], ['queen'], { kind: 'costume', value: 'ice_queen' }],
  [['super'], ['hero'], { kind: 'costume', value: 'superhero' }],
];

const SINGLES = { quiet: { kind: 'sound', value: false }, mute: { kind: 'sound', value: false } };







const DECOYS = [
  'hello',
  'hey',
  'yes',
  'no',
  'okay',
  'go',
  'look',
  'come',
  'mum',
  'mummy',
  'dad',
  'daddy',
  'wow',
  'wait',
  'stop',
  'again',
  'here',
  'mine',
  'nice',
  'good',
  'my',
  'turn',
  'jump',
  'time',
];


const CARRIERS = new Set(['i', 'want', 'two', 'be', 'a', 'an', 'me', 'make', 'now', 'please']);


export const VOCABULARY = [
  ...new Set([...Object.keys(WORDS), ...PHRASES.flatMap(([a, b]) => [...a, ...b]), ...Object.keys(SINGLES), ...CARRIERS, ...DECOYS]),
].filter((w) => /^[a-z]+$/.test(w));


export const MIN_WORD_CONF = 0.8;






export function believedCommand(words) {
  const list = words ?? [];
  const end = list.at(-1)?.word === 'please' ? list.length - 1 : list.length;
  const last = list[end - 1];
  const prev = list[end - 2];
  if (!last) return null;
  const phrase = prev ? PHRASES.find(([a, b]) => a.includes(prev.word) && b.includes(last.word)) : null;
  const cmd = phrase ? phrase[2] : heardCommand(last.word);
  if (!cmd) return null;
  const start = end - (phrase ? 2 : 1);
  if (list.slice(start, end).some((w) => !(w.conf >= MIN_WORD_CONF))) return null;
  const before = list.slice(0, start);
  if (before.some((w) => w.word !== '[unk]' && !CARRIERS.has(w.word))) return null;
  return before.filter((w) => w.word === '[unk]').length <= 1 ? cmd : null;
}


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







export function believedTranscript(transcript, confidence) {
  if (confidence > 0 && confidence < 0.5) return null;
  const words =
    String(transcript ?? '')
      .toLowerCase()
      .match(/[a-z0-9]+/g) ?? [];
  if (words.at(-1) === 'please') words.pop();
  if (!words.length || words.length > 6) return null;
  const cmd = heardCommand(words.join(' '));
  const tail = words.length > 1 ? heardCommand(words.slice(-2).join(' ')) : null;
  return cmd && (JSON.stringify(heardCommand(words.at(-1))) === JSON.stringify(cmd) || JSON.stringify(tail) === JSON.stringify(cmd))
    ? cmd
    : null;
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
  
  r.interimResults = false;
  let on = true;
  r.onresult = ( e) => {
    const res = e.results[e.results.length - 1];
    if (!res?.isFinal) return;
    const cmd = believedTranscript(res[0]?.transcript, res[0]?.confidence);
    if (cmd) onCommand(cmd);
  };
  r.onend = () => {
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
