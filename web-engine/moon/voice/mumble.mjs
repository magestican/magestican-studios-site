

































export const VOWELS = Object.freeze({
  a: [730, 1090], e: [530, 1840], i: [390, 1990],
  o: [500, 860], u: [320, 800], y: [440, 1720],
});



const DIGIT_VOWEL = 'iuuioaieea';


export const VOICE_FIELDS = Object.freeze([
  'f0', 'f0Seed', 'declination', 'questionRise', 'exclaimLift', 'lilt', 'glide', 'formant',
  'sylDur', 'sylGap', 'commaPause', 'stopPause', 'stressGain', 'stressDur', 'wobble', 'maxSPerChar',
]);


export const LEAD_S = 0.02;

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

const isVowel = (ch) => Object.hasOwn(VOWELS, ch);






export function syllabify(word, offset = 0) {
  const lower = word.toLowerCase();
  const out = [];
  const digits = [...lower].map((ch, i) => ({ ch, i })).filter(({ ch }) => ch >= '0' && ch <= '9');
  if (digits.length && !/[a-z]/.test(lower)) {
    
    const shown = digits.slice(0, 4);
    shown.forEach(({ ch, i }, k) => {
      const next = k + 1 < shown.length ? shown[k + 1].i : word.length;
      out.push({ vowel: DIGIT_VOWEL[Number(ch)], onset: true, from: offset + (k === 0 ? 0 : i), to: offset + next });
    });
    return out;
  }
  
  
  let onset = false, nucleus = null, from = 0;
  for (let i = 0; i < lower.length; i += 1) {
    const ch = lower[i];
    if (isVowel(ch)) {
      if (nucleus === null) nucleus = ch;
      
    } else if (/[a-z]/.test(ch)) {
      if (nucleus !== null) { out.push({ vowel: nucleus, onset, from }); nucleus = null; from = i; }
      onset = true;
    }
  }
  if (nucleus !== null) out.push({ vowel: nucleus, onset, from });
  
  if (!out.length && /[a-z]/.test(lower)) out.push({ vowel: 'u', onset: true, from: 0 });
  
  return out.map((sy, k) => ({ ...sy, from: offset + sy.from, to: offset + (k + 1 < out.length ? out[k + 1].from : word.length) }));
}


function sentencesOf(text) {
  const sentences = [];
  let words = [];
  for (const m of text.matchAll(/\S+/g)) {
    words.push({ word: m[0], at: m.index });
    if (/[.?!]["')\]]*$/.test(m[0])) { sentences.push(words); words = []; }
  }
  if (words.length) sentences.push(words);
  return sentences;
}





export function compileMumble(text, voice, seed = seedOf(`${voice.id || ''}|${text}`)) {
  const rnd = mulberry32(seed);
  const events = [];
  let t = LEAD_S;
  const liltPhase = rnd() * Math.PI * 2;
  let sylIndex = 0;

  for (const words of sentencesOf(text)) {
    const last = words[words.length - 1].word;
    const asks = /\?["')\]]*$/.test(last);
    const exclaims = /!["')\]]*$/.test(last);
    const cut = /[-—]$/.test(last);
    const sylls = [];
    for (const { word, at } of words) {
      const ws = syllabify(word, at);
      ws.forEach((sy, i) => sylls.push({ ...sy, stress: i === 0, comma: /[,;:]["')\]]*$/.test(word) && i === ws.length - 1 }));
    }
    if (!sylls.length) continue;

    const lineF0 = voice.f0 * (exclaims ? voice.exclaimLift : 1) + (rnd() * 2 - 1) * voice.f0Seed;
    sylls.forEach((sy, i) => {
      const u = sylls.length > 1 ? i / (sylls.length - 1) : 1;
      let f0 = lineF0 * (1 - (1 - voice.declination) * u);
      if (asks && u > 0.7) f0 = lineF0 * (voice.declination + (voice.questionRise - voice.declination) * ((u - 0.7) / 0.3));
      f0 *= 1 + voice.lilt * Math.sin(liltPhase + sylIndex * 1.9);
      f0 *= 1 + (rnd() * 2 - 1) * voice.wobble;
      sylIndex += 1;

      let dur = voice.sylDur[0] + rnd() * (voice.sylDur[1] - voice.sylDur[0]);
      if (sy.stress) dur *= voice.stressDur;
      if (cut && i === sylls.length - 1) dur *= 0.45;

      const [f1, f2] = VOWELS[sy.vowel];
      
      const glide = asks && i === sylls.length - 1 ? Math.max(voice.glide, 0.08) : voice.glide;
      events.push({
        at: t,
        dur,
        f0,
        f0End: f0 * (1 + glide),
        f1: f1 * voice.formant * (1 + (rnd() * 2 - 1) * 0.05),
        f2: f2 * voice.formant * (1 + (rnd() * 2 - 1) * 0.05),
        amp: sy.stress ? voice.stressGain : 1,
        burst: Boolean(sy.onset),
        from: sy.from,
        to: sy.to,
      });
      t += dur + voice.sylGap[0] + rnd() * (voice.sylGap[1] - voice.sylGap[0]);
      if (sy.comma) t += voice.commaPause;
    });
    t += voice.stopPause;
  }

  
  const cap = LEAD_S + Math.max(1, text.length) * voice.maxSPerChar;
  const speed = t > cap ? (cap - LEAD_S) / (t - LEAD_S) : 1;
  if (speed < 1) {
    for (const e of events) {
      e.at = LEAD_S + (e.at - LEAD_S) * speed;
      e.dur *= speed;
    }
    t = cap;
  }
  return { events, total: t, speed };
}


export function revealAt(compiled, length, tS) {
  const { events, total } = compiled;
  if (!events.length || tS >= total) return length;
  let shown = 0;
  for (const e of events) {
    if (tS < e.at) break;
    const u = Math.min(1, (tS - e.at) / Math.max(1e-6, e.dur));
    shown = Math.max(shown, Math.floor(e.from + (e.to - e.from) * u));
  }
  
  const lastEvent = events[events.length - 1];
  if (tS >= lastEvent.at + lastEvent.dur) shown = length;
  return Math.min(length, shown);
}


export function activityAt(compiled, tS) {
  for (const e of compiled.events) {
    if (tS < e.at) return 0;
    if (tS < e.at + e.dur) return Math.min(1, e.amp / 1.3) * Math.sin((Math.PI * (tS - e.at)) / e.dur);
  }
  return 0;
}
