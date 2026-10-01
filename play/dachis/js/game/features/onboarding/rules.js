





export const NAMES = {
  boy: ['Ace', 'Rex', 'Zack', 'Kai', 'Dex', 'Jett', 'Cody', 'Remy', 'Duke', 'Marcus', 'Tony', 'Slater', 'Nico', 'Theo'],
  girl: ['Jazz', 'Nikki', 'Tasha', 'Jade', 'Skye', 'Roxy', 'Raven', 'Gina', 'Mia', 'Kelly', 'Brandi', 'Lexi', 'Toni', 'Dee'],
};

export function rollName(gender, rnd = Math.random, prev = '') {
  const list = NAMES[gender] || NAMES.boy, pool = list.filter((n) => n !== prev);
  return pool[Math.min(pool.length - 1, Math.floor(rnd() * pool.length))];
}



export const INTRO_KEY = 'dachis.intro';
export function introProgress({ scene, li, name, gender }) {
  return { v: 1, scene: Math.max(0, scene | 0), li: Math.max(0, li | 0), name: String(name || '').slice(0, 14), gender: gender === 'girl' ? 'girl' : 'boy' };
}


export function resumable(p, sceneCount) {
  if (!p || p.v !== 1 || !Number.isInteger(p.scene) || !Number.isInteger(p.li) || !p.name) return null;
  if (p.scene < 0 || p.scene >= sceneCount || p.li < 0) return null;
  if (p.scene === 0 && p.li === 0) return null;
  return { scene: p.scene, li: p.li, name: p.name, gender: p.gender === 'girl' ? 'girl' : 'boy' };
}



export const ATTRACT = [
  { id: 'studio', s: 2.6 }, { id: 'logo', s: 3.2 }, { id: 'premise', s: 3.6 },
  { id: 'friends', s: 3.6 }, { id: 'fight', s: 3.2 }, { id: 'island', s: 3.4 }, { id: 'start', s: 0 },
];
export function attractAt(t) {
  let acc = 0;
  for (let i = 0; i < ATTRACT.length - 1; i++) { acc += ATTRACT[i].s; if (t < acc) return { panel: i, id: ATTRACT[i].id, done: false }; }
  return { panel: ATTRACT.length - 1, id: 'start', done: true };
}






export const INTRO_ZOOM = { from: 0.3, hold: 0.9, pull: 2.6 };
export function introZoomK(t, z = INTRO_ZOOM) {
  const k = Math.max(0, Math.min(1, (t - z.hold) / z.pull)), e = k * k * (3 - 2 * k);
  return z.from + (1 - z.from) * e;
}




export function lineKind(line) {
  if (!line) return 'say';
  if (line.kind === 'say' || line.kind === 'think' || line.kind === 'narrate') return line.kind;
  if (!line.who) return 'narrate';
  const t = String(line.text || '').trim();
  return t.startsWith('(') && t.endsWith(')') ? 'think' : 'say';
}

export function lineText(line) {
  const t = String((line && line.text) || '');
  return lineKind(line) === 'think' ? t.trim().replace(/^\(\s*/, '').replace(/\s*\)$/, '') : t;
}
