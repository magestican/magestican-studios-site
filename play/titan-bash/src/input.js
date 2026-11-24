



import { HOUSES, TITANS } from '../../../web-engine/titan-bash/titans.js';

export const KEYMAPS = Object.freeze({
  p1: { up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], fire: ['KeyJ'], boost: ['KeyK'], ability: ['KeyL'] },
  p2: { up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'],
    fire: ['Digit1', 'Numpad1'], boost: ['Digit2', 'Numpad2'], ability: ['Digit3', 'Numpad3'] },
});


export const GAME_KEYS = new Set(Object.values(KEYMAPS).flatMap((m) => Object.values(m).flat()));

const any = (down, codes) => codes.some((c) => down.has(c));

export function keyboardInput(map, down) {
  return {
    mx: (any(down, map.right) ? 1 : 0) - (any(down, map.left) ? 1 : 0),
    my: (any(down, map.down) ? 1 : 0) - (any(down, map.up) ? 1 : 0),
    fire: any(down, map.fire), boost: any(down, map.boost), ability: any(down, map.ability),
  };
}

export const DEAD_ZONE = 0.2;
const dz = (v) => (Math.abs(v) < DEAD_ZONE ? 0 : v);
const pressed = (b) => !!b && (b.pressed || b.value > 0.5);


export function padInput(pad) {
  const a = pad.axes || []; const b = pad.buttons || [];
  const out = {
    mx: dz(a[0] || 0), my: dz(a[1] || 0),
    fire: pressed(b[0]), boost: pressed(b[1]) || pressed(b[7]), ability: pressed(b[2]),
  };
  const rx = a[2] || 0; const ry = a[3] || 0;
  if (Math.hypot(rx, ry) > 0.5) { out.ax = rx; out.ay = ry; }
  return out;
}

export const padWantsJoin = (pad) => pressed((pad.buttons || [])[0]);



export function cheatsFrom(search) {
  const q = new URLSearchParams(search || '');
  const int = (k) => (q.has(k) && Number.isFinite(Number(q.get(k))) ? Math.trunc(Number(q.get(k))) : null);
  const titan = q.get('titan');
  return {
    bots: int('bots') === null ? null : Math.max(0, Math.min(7, int('bots'))),
    titan: titan && TITANS[titan] ? titan : null,
    heat: int('heat') === null ? null : Math.max(0, Math.min(99, int('heat'))),
    storm: q.get('storm') === '1',
    sleeper: q.get('sleeper') === '1', 
    seed: int('seed'),
    state: ['results', 'podium'].includes(q.get('state')) ? q.get('state') : null,
    mode: q.get('mode') === 'team' ? 'team' : null,
    teams: [2, 3, 4].includes(int('teams')) ? int('teams') : null,
    rounds: [3, 4, 5].includes(int('rounds')) ? int('rounds') : null,
    arena: ['rotate', 'bellRing', 'shatterfield', 'tidewall'].includes(q.get('arena')) ? q.get('arena') : null,
    cpu: ['cadet', 'pilot', 'ace'].includes(q.get('cpu')) ? q.get('cpu') : null,
  };
}





export function setupFromCheats(cheats = {}) {
  const values = {};
  if (cheats.mode) values['opt-mode'] = cheats.mode;
  if (cheats.rounds) values['opt-rounds'] = String(cheats.rounds);
  if (cheats.teams) values['opt-teams'] = String(cheats.teams);
  if (cheats.arena) values['opt-arena'] = cheats.arena;
  if (cheats.cpu) values['opt-cpu'] = cpuLevelOf(cheats.cpu);
  return { values, teamsShown: cheats.mode === 'team' };
}







export const CPU_LEVELS = Object.freeze(['cadet', 'pilot', 'ace']);
export const cpuLevelOf = (v) => (CPU_LEVELS.includes(v) ? v : 'pilot');
export const defaultCpuLevel = (nightsPlayed) => (nightsPlayed > 0 ? 'pilot' : 'cadet');



export function buildSeats(humans, cheats = {}) {
  const seats = [];
  const total = Math.min(8, humans.length + (cheats.bots ?? Math.max(0, 8 - humans.length)));
  
  
  const used = new Set();
  const picked = humans.slice(0, total).map((h) => {
    const p = h && h.house && !used.has(h.house) ? HOUSES.find((x) => x.id === h.house) : null;
    if (p) used.add(p.id);
    return p;
  });
  for (let i = 0; i < total; i++) {
    const house = picked[i] || HOUSES.find((x) => !used.has(x.id));
    used.add(house.id);
    const h = humans[i];
    const titan = h ? (h.titan || (i === 0 && cheats.titan) || house.titan) : house.titan;
    seats.push({ house: house.id, titan, cpu: h ? null : cpuLevelOf(cheats.cpu), control: h ? h.control : 'bot', rookie: !!(h && h.rookie),
      paint: (h && h.paint) || null, emblem: (h && h.emblem) || null });
  }
  return seats;
}



export const STICK_DEAD = 0.15;
export function stickFrom(ox, oy, px, py, radius) {
  const dx = px - ox; const dy = py - oy; const d = Math.hypot(dx, dy);
  if (!(radius > 0) || d < radius * STICK_DEAD) return { mx: 0, my: 0 };
  const k = Math.min(1, d / radius) / d;
  return { mx: dx * k, my: dy * k };
}






export function isTouchDevice({ maxTouchPoints = 0, coarse = false } = {}) { return maxTouchPoints > 0 && !!coarse; }
export function firstPilot({ touch = false, joinCode = null } = {}) {
  if (joinCode) return null;
  return touch ? 'touch' : 'p1';
}
