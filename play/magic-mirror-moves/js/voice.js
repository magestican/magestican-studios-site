






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


export function wordToCostume(transcript) {
  const words = String(transcript ?? '')
    .toLowerCase()
    .match(/[a-z]+/g);
  if (!words) return null;
  for (let i = words.length - 1; i >= 0; i--) if (Object.hasOwn(WORDS, words[i])) return WORDS[words[i]];
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





export async function startVoice(win, onCostume) {
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
    const id = wordToCostume(text);
    if (id) onCostume(id);
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
