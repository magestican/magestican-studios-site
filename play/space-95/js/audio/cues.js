



const LAND_SOFT_MAX = 1.0; 
const LAND_RUN_MAX = 3.0; 
const WALK_SPEED = 5; 
const STRIDE = 1.9; 



const CUES = {
  jump: ['jump'],
  mantle: ['mantle', 'land_soft'],
  skid: ['skid'],
  pit: ['hurt_tone'],
  hurt: ['hurt_tone'],
  bonk: ['bonk'],
  corner: ['corner_slide'],
  stomp: ['stomp', 'land_soft'],
  kick: ['kick'],
  pebbleHit: ['pebble_hit', 'kick'],
  dewBounce: ['dew_bounce', 'stomp'],
  seed: ['seed_pickup'],
  grab: ['bark_grab', 'mantle'],
  climbJump: ['jump'],
  lurch: ['ant_lurch', 'skid'],
  ability: ['ability_get', 'intel_found'],
  poke: ['stomp'],
  dig: ['dig_break', 'land_hard'],
  telegraph: ['boss_telegraph', 'pillbug_alert'],
  bossHit: ['boss_hit', 'enemy_hit_shell'],
  bossPhase: ['boss_phase', 'intel_found'],
  bossDefeat: ['boss_defeat', 'shift_clear'],
  rushHour: ['strike'],
  caveIn: ['cave_in', 'skid'],
  buried: ['bury_thump', 'enemy_defeat_pop'],
  strike: ['strike', 'intel_found'], 
  wallJump: ['jump'],
  doubleJump: ['double_jump', 'jump'],
  pound: ['land_hard'],
  defeat: ['enemy_defeat_pop'],
  uncurl: ['pillbug_uncurl'],
  hop: ['ladybot_hop'],
  checkpoint: ['checkpoint_clockin'],
  secret: ['intel_found'],
  clear: ['shift_clear'],
};


const SIGNAL_SOUNDS = {
  'audio:hollow-knock': ['hollow_knock', 'kick'],
  'audio:glint-chime': ['secret_glint'],
  'audio:tiny-jingle': ['secret_glint'],
};


export function signalSounds(e, has = () => true) {
  return e.signals.map((sig) => SIGNAL_SOUNDS[sig]?.find(has)).filter(Boolean);
}


export function cueRate(e) {
  return e.type === 'pebbleHit' && e.hits > 1 ? 2 ** ((2 * (e.hits - 1)) / 12) : 1;
}





export function createLadder(window = 1.2) {
  const last = new Map();
  return ( type,  time) => {
    const prev = last.get(type);
    const step = prev && time - prev.time <= window ? Math.min(prev.step + 1, 6) : 0;
    last.set(type, { time, step });
    return 2 ** ((2 * step) / 12);
  };
}





export function cueFor(e, has = () => true) {
  if (e.type === 'land') {
    const f = e.fall ?? 0;
    return f < LAND_SOFT_MAX ? 'land_soft' : f < LAND_RUN_MAX ? 'land_run' : 'land_hard';
  }
  return CUES[e.type]?.find(has) ?? null;
}


export function createFootsteps(surface = 'dirt') {
  let dist = 0;
  let climbT = 0;
  return {
    
    update(p, dt) {
      if (p.climbing) {
        
        climbT += dt;
        if (Math.abs(p.vy ?? 0) + Math.abs(p.vx) > 0.5 && climbT >= 0.25) {
          climbT = 0;
          return 'bark_climb';
        }
        return null;
      }
      const speed = Math.abs(p.vx);
      if (!p.grounded || speed < 0.5) {
        dist = STRIDE * 0.6; 
        return null;
      }
      dist += speed * dt;
      const stride = speed < WALK_SPEED ? STRIDE * 0.7 : STRIDE;
      if (dist < stride) return null;
      dist -= stride;
      return `footstep_${surface}_${speed < WALK_SPEED ? 'walk' : 'run'}`;
    },
  };
}


export function createPicker(seed = 95) {
  let s = seed >>> 0;
  const last = new Map();
  return ( name,  count) => {
    if (count <= 1) return 0;
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    let i = s % (count - 1);
    const prev = last.get(name);
    if (prev !== undefined && i >= prev) i++;
    else if (prev === undefined) i = s % count;
    last.set(name, i);
    return i;
  };
}
