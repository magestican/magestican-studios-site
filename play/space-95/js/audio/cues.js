



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
  heaveLaunch: ['breath_launch', 'dew_bounce'],
  inhale: ['ruuma_inhale'],
  sigh: ['ruuma_sigh'],
  shellPop: ['shell_pop', 'enemy_hit_shell'],
  shieldOn: ['shield_on', 'ability_get'],
  shieldBreak: ['shield_break', 'enemy_hit_shell'],
  fling: ['shell_fling', 'kick'],
  glideStart: ['glide_open', 'double_jump'],
  glideEnd: ['glide_close', 'land_soft'],
  windWarn: ['wind_warn', 'secret_glint'],
  mothTakeoff: ['moth_takeoff', 'aphid_hop'],
  slipstream: ['slipstream_chime', 'secret_glint'],
  slipstreamEnd: ['slipstream_end', 'skid'],
  seedGrab: ['seed_grab', 'bark_grab'],
  seedRelease: ['seed_release', 'jump'],
  waspDive: ['wasp_dive', 'pillbug_alert'],
  waspStuck: ['wasp_stuck', 'snail_bonk'],
  waspPullUp: ['wasp_pullup', 'skid'],
  shoePlan: ['shoe_rumble', 'boss_telegraph'],
  shoeLand: ['shoe_boom', 'quake_stomp'],
  footfallFar: ['shoe_far', 'land_hard'],
  shoeGone: ['shoe_door', 'checkpoint_clockin'],
  punt: ['punt_flick', 'bonk'],
  punted: ['punt_flick', 'aphid_hop'],
  flip: ['bug_flip', 'enemy_daze'],
  righted: ['bug_right', 'ladybot_hop'],
  bowl: ['bowl_chime', 'pebble_hit'],
  honeyStuck: ['honey_stick', 'footstep_honey_walk'],
  gloop: ['honey_gloop', 'footstep_honey_run'],
  guardCharge: ['guard_charge', 'shovel_charge'],
  guardStunned: ['guard_stun', 'bonk'],
  helmetBonk: ['helmet_bonk', 'snail_bonk'],
  boing: ['boing', 'dew_bounce'],
  capeTurn: ['cape_swish', 'skid'],
  glitterToss: ['glitter_toss', 'mud_toss'],
  glitterSplat: ['glitter_splat', 'secret_glint'],
  swoopLine: ['wing_buzz', 'boss_telegraph'],
  diveRing: ['wing_roar', 'boss_telegraph'],
  hornBonk: ['helmet_bonk', 'boss_hit'],
  bossEscape: ['duchess_escape', 'boss_defeat'],
  bossCameo: ['duchess_laugh', 'foreman_grumble'],
  dunk: ['dunk_splash', 'land_hard'],
  fishedOut: ['fished_out', 'bolt_beep_happy'],
  raftLand: ['raft_land', 'land_soft'],
  raftSink: ['raft_sink', 'skid'],
  padSink: ['pad_sink', 'skid'],
  ripple: ['ripple', 'dew_bounce'],
  capsize: ['capsize', 'enemy_defeat_pop'],
  rock: ['boat_rock', 'enemy_daze'],
  striderWindup: ['strider_skitter', 'pillbug_alert'],
  skiffWindup: ['heave_ho', 'pillbug_alert'],
  dishCameo: ['mantis_swish', 'foreman_grumble'],
  fruitletDrop: ['snip', 'mantis_swish'],
  fruitletLand: ['fruit_thud', 'land_soft'],
  fruitletBonk: ['fruit_bonk', 'pebble_hit'],
  fruitletCaught: ['mantis_catch', 'mantis_swish'],
  sourBite: ['sour_bite', 'boss_hit'],
  shearLine: ['whetstone', 'boss_telegraph'],
  strikeArc: ['rising_whine', 'boss_telegraph'],
  bladeStuck: ['blade_stuck', 'snail_bonk'],
  pruneCut: ['prune_cut', 'cave_in'],
  prune: ['bough_drop', 'cave_in'],
  twigRing: ['twig_whistle', 'boss_telegraph'],
  twigLand: ['twig_land', 'land_hard'],
  armSnatch: ['mantis_swish', 'kick'],
  tumbleClunk: ['tumble_clunk', 'snail_bonk'],
  dishDrop: ['dish_drop', 'shift_clear'],
  tetherAim: ['hook_tink', 'secret_glint'],
  tetherThrow: ['tether_whirr', 'kick'],
  tetherAttach: ['hook_tink', 'bark_grab'],
  tetherRelease: ['tether_hup', 'jump'],
  tetherBreak: ['tether_snap', 'bonk'],
  tetherBoop: ['bolt_boop', 'bolt_beep_curious'],
  tetherThud: ['tether_thud', 'bonk'],
  keystroke: ['key_clack', 'stomp'],
  cursorLaser: ['laser_pew', 'strike'],
  keyClack: ['key_clack', 'land_soft'],
  slickSlide: ['slick_squeak', 'skid'],
  pitReturn: ['fished_out', 'bolt_beep_happy'],
  dustmitePop: ['dustmite_pop', 'aphid_hop'],
  fanBat: ['fan_thwap', 'bonk'],
  fanStop: ['fan_spin_down', 'enemy_daze'],
  plugYank: ['plug_yank', 'kick'],
  plugDud: ['plug_dud', 'bolt_boop'],
  surge: ['surge_zap', 'strike'],
  surgeHit: ['surge_zap', 'enemy_defeat_pop'],
  packetBoard: ['packet_blip', 'raft_land'],
  pinZap: ['pin_zap', 'hurt_tone'],
  sparkWarn: ['spark_tick', 'boss_telegraph'],
  crewJabWarn: ['spark_tick', 'pillbug_alert'],
  lightsOut: ['power_down', 'boss_defeat'],
  rollLine: ['dust_scrape', 'boss_telegraph'],
  bigRollLine: ['rising_whine', 'boss_telegraph'],
  bunnyRing: ['whoosh', 'boss_telegraph'],
  hatBonk: ['helmet_bonk', 'boss_hit'],
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
  
  pointsThrow: ['points_throw', 'key_clack'],
  pointsPass: ['points_clack', 'key_clack'],
  hollowKnock: ['hollow_knock', 'kick'],
  noPoints: ['bolt_boop'],
  boost: ['windup_boost', 'whoosh'],
  boostEmpty: ['boost_empty', 'plug_dud'],
  curveWarn: ['curve_squeal', 'slick_squeak'],
  bufferStop: ['buffer_stop', 'land_hard'],
  scan: ['scan_beep', 'secret_glint'],
  specimenHide: ['cricket_duck', 'aphid_hop'],
  powerUp: ['power_up', 'ability_get'],
  couple: ['couple_clunk', 'tether_thud'],
  derail: ['derail_crash', 'cave_in'],
  rerail: ['rerail_clunk', 'fished_out'],
  diamondClack: ['diamond_clack', 'key_clack'],
  
  
  securityOn: ['security_click', 'power_up'],
  securityOff: ['security_off', 'power_down'],
  cloudWarn: ['cloud_whoosh', 'wind_warn'],
  cloudCover: ['cloud_hush'],
  moonOut: ['moon_out'],
  lampOn: ['lamp_buzz'],
  lampOff: ['lamp_tick'],
  lanternRaise: ['lantern_raise', 'power_up'],
  lanternLower: ['lantern_lower'],
  dazzled: ['sprite_dazzle', 'enemy_daze'],
  padOpen: ['pad_bloom'],
  padClose: ['pad_fold'],
  budPop: ['bud_pomf', 'dustmite_pop'],
  flockBurst: ['flock_burst', 'whoosh'],
  perch: ['firefly_perch', 'scan_beep'],
  flockJoin: ['flock_join', 'slipstream_chime'],
  flockCall: ['flock_call', 'slipstream_chime'],
  bloomOpening: ['bloom_opening', 'glide_open'],
  bloom: ['night_bloom', 'boss_defeat'],
  finishOpen: ['nav_lamp_beep', 'checkpoint_clockin'],
  spriteFlash: ['sprite_fwip', 'laser_pew'],
  spriteFluster: ['sprite_fluster', 'wing_buzz'],
  spriteBump: ['sprite_bump', 'boing'],
  ghostBlink: ['ghost_blink', 'whoosh'],
  ghostAppear: ['ghost_hum', 'cricket_hum'],
  ivyShown: ['ivy_shimmer'],
  ivyRustle: ['ivy_rustle', 'dust_scrape'],
  thornHit: ['thorn_prick', 'hurt_tone'],
  flapSwing: ['flap_swing', 'whoosh'],
  
  webLand: ['web_thrum'],
  webLaunch: ['web_boing'],
  pluck: ['harp_pluck_1'],
  webDrop: ['web_thrum_soft'],
  lineCut: ['silk_snip', 'snip'],
  auntTelegraph: ['aunt_zzzip', 'whoosh'],
  auntDrop: ['aunt_land', 'boing'],
  auntBounce: ['aunt_bounce', 'boing'],
  snareThrow: ['snare_thwip', 'mud_toss'],
  snarePatch: ['snare_splat', 'honey_gloop'],
  snare: ['snared', 'honey_stick'],
  snareFree: ['snare_free', 'shell_pop'],
  goldClimb: ['gold_aunt_climb', 'secret_glint'],
  snag: ['bolt_snag', 'tether_hup'],
  silkRustle: ['silk_rustle', 'ivy_rustle'],
  dawn: ['dawn_chorus'],
};


const SIGNAL_SOUNDS = {
  'audio:hollow-knock': ['hollow_knock', 'kick'],
  'audio:glint-chime': ['secret_glint'],
  'audio:tiny-jingle': ['secret_glint'],
  'audio:two-tone-buzz': ['wasp_two_tone', 'secret_glint'],
  'audio:cricket-hum': ['cricket_hum', 'secret_glint'],
  'audio:kazoo-fanfare': ['kazoo_fanfare', 'secret_glint'],
  'audio:shanty-whistle': ['shanty_whistle', 'secret_glint'],
  'audio:tumble-clunk': ['tumble_clunk', 'secret_glint'],
  'audio:static-crackle': ['static_crackle', 'secret_glint'],
  'audio:tiny-whee': ['tiny_whee', 'secret_glint'],
  'audio:fiddle-tune': ['fiddle_tune', 'cricket_hum', 'secret_glint'], 
  'audio:curve-squeal': ['curve_squeal', 'slick_squeak'],
  'audio:derail-crash': ['derail_crash', 'cave_in'],
  'audio:ghost-hum': ['ghost_hum', 'cricket_hum'], 
  'audio:watch-tick': ['watch_tick', 'secret_glint'], 
  'audio:harp-twang': ['harp_twang', 'secret_glint'], 
};


export function signalSounds(e, has = () => true) {
  
  return (e.signals ?? []).map((sig) => SIGNAL_SOUNDS[sig]?.find(has)).filter(Boolean);
}


export function cueRate(e) {
  if (e.type === 'fling' && e.n > 1) return 2 ** ((2 * Math.min(6, e.n - 1)) / 12); 
  if (e.type === 'surgeHit' && e.n > 1) return 2 ** ((2 * (e.n - 1)) / 12); 
  if (e.type === 'cursorLaser' && e.n > 1) return 2 ** ((2 * (e.n - 1)) / 12); 
  if (e.type === 'capsize' && e.n > 1) return 2 ** ((2 * (e.n - 1)) / 12); 
  if (e.type === 'bowl' && e.n > 1) return 2 ** ((2 * (e.n - 1)) / 12); 
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
    if (e.web) return null; 
    const f = e.fall ?? 0;
    return f < LAND_SOFT_MAX ? 'land_soft' : f < LAND_RUN_MAX ? 'land_run' : 'land_hard';
  }
  const pick = ( list) => list.find(has) ?? null;
  
  if (e.type === 'fling' && e.sling) return pick(['sling_chime', 'shell_fling']); 
  if (e.type === 'webLand') return pick(e.hub ? ['hub_chord', 'web_thrum'] : (e.v ?? 0) >= 12 ? ['web_thrum'] : ['web_thrum_soft']);
  if (e.type === 'webLaunch') {
    if (!e.pumped && !e.hub) return null; 
    return pick(e.hub || (e.v ?? 0) >= 29 ? ['web_boing_big', 'web_boing'] : e.slant ? ['web_slant_twang', 'web_boing'] : ['web_boing']);
  }
  if (e.type === 'pluck') {
    const k = (Number.parseInt(String(e.web ?? '').replace(/\D/g, ''), 10) || 1) - 1;
    return pick([`harp_pluck_${(k % 3) + 1}`, 'harp_pluck_1']);
  }
  return CUES[e.type]?.find(has) ?? null;
}


export const CUE_VARIANTS = {
  fling: ['sling_chime'],
  webLand: ['hub_chord', 'web_thrum', 'web_thrum_soft'],
  webLaunch: ['web_boing_big', 'web_slant_twang', 'web_boing'],
  pluck: ['harp_pluck_1', 'harp_pluck_2', 'harp_pluck_3'],
};


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
