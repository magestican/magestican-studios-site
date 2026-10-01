




































export const MUMBLE = Object.freeze({
  f0: 102,            
  f0Seed: 7,          
  declination: 0.82,  
  questionRise: 1.24, 
  sylDur: [0.075, 0.115],
  sylGap: [0.012, 0.03],
  commaPause: 0.13,
  stopPause: 0.24,
  stressGain: 1.22,   
  wobble: 0.045,      
});




export const VOWELS = Object.freeze({
  a: [730, 1090], e: [530, 1840], i: [390, 1990],
  o: [500, 860], u: [320, 800], y: [440, 1720],
});

function mulberry32(a) {
  let s = a >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), 1 | t);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


export function seedOf(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}





function syllabify(word) {
  const out = [];
  let onset = false;
  let nucleus = null;
  for (const ch of word.toLowerCase()) {
    if (VOWELS[ch]) {
      if (nucleus === null) nucleus = ch;
      
    } else if (/[a-z]/.test(ch)) {
      if (nucleus !== null) { out.push({ vowel: nucleus, onset }); nucleus = null; onset = true; } else onset = true;
    }
  }
  if (nucleus !== null) out.push({ vowel: nucleus, onset });
  
  if (!out.length && word.length) out.push({ vowel: 'u', onset: true });
  return out;
}






export function compileMumble(text, seed = seedOf(text)) {
  const rnd = mulberry32(seed);
  const events = [];
  let t = 0.02;

  
  const sentences = text.split(/(?<=[.?!])\s+/).filter((x) => x.trim().length);
  for (const sentence of sentences) {
    const asks = /\?\s*$/.test(sentence);
    const cut = /[-—]\s*$/.test(sentence.trim());
    const words = sentence.split(/\s+/).filter((w) => /[a-z]/i.test(w));
    const sylls = [];
    for (const w of words) {
      const ws = syllabify(w);
      ws.forEach((sy, i) => sylls.push({ ...sy, stress: i === 0, comma: /,$/.test(w) && i === ws.length - 1 }));
    }
    if (!sylls.length) continue;

    const lineF0 = MUMBLE.f0 + (rnd() * 2 - 1) * MUMBLE.f0Seed;
    sylls.forEach((sy, i) => {
      const u = sylls.length > 1 ? i / (sylls.length - 1) : 1;
      
      let f0 = lineF0 * (1 - (1 - MUMBLE.declination) * u);
      if (asks && u > 0.7) f0 = lineF0 * (MUMBLE.declination + (MUMBLE.questionRise - MUMBLE.declination) * ((u - 0.7) / 0.3));
      f0 *= 1 + (rnd() * 2 - 1) * MUMBLE.wobble;

      let dur = MUMBLE.sylDur[0] + rnd() * (MUMBLE.sylDur[1] - MUMBLE.sylDur[0]);
      if (sy.stress) dur *= 1.15;
      
      
      if (cut && i === sylls.length - 1) dur *= 0.45;

      const [f1, f2] = VOWELS[sy.vowel];
      events.push({
        at: t,
        dur,
        f0,
        f1: f1 * (1 + (rnd() * 2 - 1) * 0.05),
        f2: f2 * (1 + (rnd() * 2 - 1) * 0.05),
        amp: sy.stress ? MUMBLE.stressGain : 1,
        burst: !!sy.onset,
      });
      t += dur + MUMBLE.sylGap[0] + rnd() * (MUMBLE.sylGap[1] - MUMBLE.sylGap[0]);
      if (sy.comma) t += MUMBLE.commaPause;
    });
    t += MUMBLE.stopPause;
  }
  return { events, total: t };
}
