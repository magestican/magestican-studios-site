




















export const GROUP_SIZE = 4;


export const MAX_MISTAKES = 4;





























































export const DOMAINS = Object.freeze([
  'farm',      
  'food',      
  'nature',    
  'body',      
  'home',      
  'music',     
  'sport',     
  'screen',    
  'tech',      
  'travel',    
  'work',      
  'clothes',   
  'myth',      
  'science',   
  'wordplay',  
  'language',  
]);

const DOMAIN_SET = new Set(DOMAINS);


export const isDomain = (d) => DOMAIN_SET.has(d);












export function domainProblems(puzzle) {
  const out = [];
  const groups = puzzle.groups ?? [];
  const seen = new Map();
  for (const g of groups) {
    if (!g.domain) { out.push(`group "${g.name}" has no domain`); continue; }
    if (!isDomain(g.domain)) {
      out.push(`group "${g.name}" has domain "${g.domain}", which is not in DOMAINS`);
      continue;
    }
    if (seen.has(g.domain)) {
      out.push(`"${seen.get(g.domain)}" and "${g.name}" are both ${g.domain} - a set needs four different subjects`);
    }
    seen.set(g.domain, g.name);
  }
  return out;
}


export const EXACT = 'exact';
export const ONE_AWAY = 'one-away';
export const WRONG = 'wrong';
export const REPEAT = 'repeat';









export function checkSelection(selection, groups, previous = []) {
  const picked = selection.map((w) => String(w).toUpperCase());
  const key = [...picked].sort().join('|');

  
  
  
  
  
  if (previous.some((p) => [...p].map((w) => w.toUpperCase()).sort().join('|') === key)) {
    return { kind: REPEAT, group: null, near: null, message: 'You already tried that four.' };
  }

  for (const group of groups) {
    const inGroup = group.words.filter((w) => picked.includes(w.toUpperCase()));
    if (inGroup.length === group.words.length && picked.length === group.words.length) {
      return { kind: EXACT, group, near: null, message: group.name };
    }
  }

  
  
  
  let near = null;
  for (const group of groups) {
    const hits = group.words.filter((w) => picked.includes(w.toUpperCase())).length;
    if (hits === group.words.length - 1) near = group;
  }
  if (near) return { kind: ONE_AWAY, group: null, near, message: 'One away.' };

  return { kind: WRONG, group: null, near: null, message: 'Not a group.' };
}













export function seededShuffle(items, seed) {
  let s = (seed >>> 0) || 1;
  const rand = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}


export function boardOrder(puzzle) {
  const all = puzzle.groups.flatMap((g) => g.words.map((w) => w.toUpperCase()));
  return seededShuffle(all, puzzle.id * 2654435761);
}










export function play(puzzle, selections) {
  const solved = [];
  const previous = [];
  let mistakes = 0;
  for (const sel of selections) {
    const result = checkSelection(sel, puzzle.groups, previous);
    if (result.kind === REPEAT) continue;
    previous.push(sel);
    if (result.kind === EXACT) solved.push(result.group.name);
    else mistakes += 1;
    if (mistakes >= MAX_MISTAKES) break;
  }
  const won = solved.length === puzzle.groups.length;
  const lost = !won && mistakes >= MAX_MISTAKES;
  return {
    solved,
    mistakes,
    mistakesLeft: Math.max(0, MAX_MISTAKES - mistakes),
    previous,
    won,
    lost,
    over: won || lost,
    
    
    remaining: puzzle.groups.filter((g) => !solved.includes(g.name)),
  };
}
