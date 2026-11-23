







export const SFX = Object.freeze(['step', 'dash', 'boost', 'fireLance', 'fireBulwark', 'fireWisp', 'fireMortar', 'hit',
  'slam', 'clang', 'stall', 'ventRough', 'ventPerfect', 'bell', 'chute', 'dropPod', 'lumen', 'ability']);
export const SFX_TAKES = Object.freeze({ step: 3, dash: 2, fireLance: 2, fireBulwark: 2, fireWisp: 2, fireMortar: 2, hit: 3, slam: 2 });
export const SFX_GAINS = Object.freeze({ step: 0.35, boost: 0.5, fireWisp: 0.8, hit: 0.85 });
export const UI = Object.freeze(['tap', 'join', 'ready', 'pick', 'back', 'count', 'start']);





export const MUSIC_TRACKS = Object.freeze(['lobby', 'battle', 'storm']);

export const musicFor = (screen, storm = false) => (screen !== 'match' ? 'lobby' : storm ? 'storm' : 'battle');

export const MAX_PER_TICK = 4;
export const STEP_EVERY = 27; 


const RANK = { bell: 0, clang: 1, chute: 2, slam: 3, dropPod: 4, ventPerfect: 5, stall: 6, ability: 7, hit: 8,
  ventRough: 9, dash: 10, fireLance: 11, fireBulwark: 11, fireWisp: 11, fireMortar: 11, boost: 12, lumen: 13, step: 14 };

const FIRE = { lancer: 'fireLance', bulwark: 'fireBulwark', wisp: 'fireWisp', mortar: 'fireMortar' };

function eventSound(e, m) {
  switch (e.type) {
    case 'bell': return ['bell', 'chute'];
    case 'clang': return ['clang'];
    case 'slam': case 'counter': return ['slam'];
    case 'hit': case 'blocked': case 'reflect': return ['hit'];
    case 'stall': return ['stall'];
    case 'perfectVent': return ['ventPerfect'];
    case 'roughVent': return ['ventRough'];
    case 'drop': return ['dropPod'];
    case 'lumen': return ['lumen'];
    case 'lumenOverdrive': return ['lumen', 'ventPerfect'];
    
    
    case 'sleeperWarn': return ['dropPod'];
    case 'sleeperRise': return ['clang', 'dropPod'];
    case 'sleeperSweep': return ['slam'];
    case 'sleeperCore': return ['hit'];
    case 'sleeperDown': return ['bell'];
    
    case 'shatter': return ['clang'];
    case 'tideWarn': return ['dropPod'];
    case 'tide': return ['slam'];
    case 'dash': return ['dash'];
    case 'ability': return ['ability'];
    case 'fire': return [FIRE[m.titans[e.id]?.frame] || 'fireLance'];
    default: return [];
  }
}


export function createSoundTracker() {
  const lastStep = new Map(); const wasRunning = new Map();
  return {
    
    tick(m, events) {
      const out = new Set();
      for (const e of events) for (const s of eventSound(e, m)) out.add(s);
      for (const t of m.titans) {
        if (!t.alive) { wasRunning.set(t.id, false); continue; }
        if (t.running && !wasRunning.get(t.id)) out.add('boost');
        wasRunning.set(t.id, !!t.running);
        const moving = Math.hypot(t.vx, t.vy) > 0.5;
        if (moving && m.tick - (lastStep.get(t.id) ?? -1e9) >= STEP_EVERY) { out.add('step'); lastStep.set(t.id, m.tick); }
      }
      return [...out].sort((a, b) => RANK[a] - RANK[b]).slice(0, MAX_PER_TICK);
    },
  };
}
