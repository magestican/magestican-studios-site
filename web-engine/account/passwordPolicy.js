














































export const MIN_LENGTH = 12;


export const MAX_LENGTH = 256;









const COMMON = Object.freeze([
  'password', 'passw0rd', 'letmein', 'welcome', 'iloveyou', 'admin',
  'qwerty', 'qwertyuiop', 'azerty', 'abc123', 'monkey', 'dragon',
  'football', 'baseball', 'superman', 'batman', 'trustno1', 'sunshine',
  'princess', 'starwars', 'whatever', 'freedom', 'shadow', 'master',
  'changeme', 'secret', 'default', 'temporary', 'password1', 'p@ssword',
  
  
  'magestican', 'farmykart', 'teambonding', 'zelakas', 'arbelo',
]);


const RUNS = Object.freeze([
  '0123456789', 'abcdefghijklmnopqrstuvwxyz',
  'qwertyuiop', 'asdfghjkl', 'zxcvbnm',
]);

const lower = (s) => String(s ?? '').toLowerCase();


const core = (s) => lower(s).replace(/[^a-z]/g, '');





const unleet = (s) => lower(s)
  .replace(/[@4]/g, 'a').replace(/[3]/g, 'e').replace(/[1!|]/g, 'i')
  .replace(/[0]/g, 'o').replace(/[5$]/g, 's').replace(/[7]/g, 't');


function usesContext(password, context) {
  const p = unleet(password);
  for (const raw of context) {
    const bits = lower(raw).split(/[^a-z0-9]+/).filter((b) => b.length >= 4);
    for (const bit of bits) {
      if (p.includes(unleet(bit))) return bit;
    }
  }
  return null;
}

function hasRun(password) {
  const p = lower(password);
  for (const run of RUNS) {
    for (let i = 0; i + 4 <= run.length; i += 1) {
      const seq = run.slice(i, i + 4);
      if (p.includes(seq)) return seq;
      const back = seq.split('').reverse().join('');
      if (p.includes(back)) return back;
    }
  }
  return null;
}


function hasRepeat(password) {
  return /(.)\1{3,}/.test(String(password ?? '')) ;
}







function variety(password) {
  const p = String(password ?? '');
  let n = 0;
  if (/[a-z]/.test(p)) n += 1;
  if (/[A-Z]/.test(p)) n += 1;
  if (/[0-9]/.test(p)) n += 1;
  if (/[^A-Za-z0-9]/.test(p)) n += 1;
  return n;
}








export function strength(password, context = []) {
  if (typeof password !== 'string') return 0;
  const p = password;
  if (!p) return 0;
  if (usesContext(p, context) || COMMON.some((c) => unleet(p).includes(c))) return 0;

  let score = 0;
  if (p.length >= 8) score += 1;
  if (p.length >= 12) score += 1;
  if (p.length >= 16) score += 1;
  if (p.length >= 24) score += 1;
  if (variety(p) >= 3) score += 1;
  if (hasRun(p) || hasRepeat(p)) score -= 1;

  return Math.max(0, Math.min(4, score));
}

export const STRENGTH_WORDS = Object.freeze([
  'Too weak', 'Weak', 'Fair', 'Strong', 'Very strong',
]);













export function checkPassword(password, { email = '' } = {}) {
  
  
  
  
  
  
  if (typeof password !== 'string') {
    return { ok: false, reason: 'not-a-string', message: 'Choose a password.', score: 0 };
  }
  const p = password;
  const context = [email, 'magestican', 'magestican studios', 'farmy kart',
    'team bonding', 'zelakas', 'fighter'].filter(Boolean);
  const score = strength(p, context);
  const verdict = (ok, reason, message) => ({ ok, reason, message, score });

  if (!p) return verdict(false, 'empty', 'Choose a password.');
  if (p.length < MIN_LENGTH) {
    return verdict(false, 'too-short',
      `Use at least ${MIN_LENGTH} characters. A few ordinary words in a row is easier to `
      + 'remember than a short jumble, and much harder to guess.');
  }
  if (p.length > MAX_LENGTH) {
    return verdict(false, 'too-long', `Keep it under ${MAX_LENGTH} characters.`);
  }
  
  
  
  if (p !== p.trim()) {
    return verdict(false, 'edge-space', 'Remove the space at the start or end.');
  }
  
  
  
  
  const contextHit = usesContext(p, context);
  if (contextHit) {
    return verdict(false, 'context',
      `That is built out of "${contextHit}". Anyone who knows your email or what site `
      + 'this is would try it first.');
  }
  const commonHit = COMMON.find((c) => unleet(p).includes(c));
  if (commonHit) {
    return verdict(false, 'common',
      `That contains "${commonHit}", which is one of the first things anyone guesses. `
      + 'Pick something with no common word in it.');
  }
  const run = hasRun(p);
  if (run) {
    return verdict(false, 'sequence',
      `"${run}" is a run of keys in order, which adds nothing. Break it up.`);
  }
  if (hasRepeat(p)) {
    return verdict(false, 'repeat', 'One character repeated four times adds nothing. Break it up.');
  }
  if (score < 2) {
    return verdict(false, 'weak', 'Add a few more characters, or another word.');
  }
  return verdict(true, null, STRENGTH_WORDS[score] ?? 'Strong');
}









export function checkEmail(email) {
  const e = String(email ?? '').trim();
  if (!e) return { ok: false, message: 'Enter your email address.' };
  if (e.length > 254) return { ok: false, message: 'That email address is too long.' };
  if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(e)) {
    return { ok: false, message: 'That does not look like an email address.' };
  }
  return { ok: true, message: '' };
}
