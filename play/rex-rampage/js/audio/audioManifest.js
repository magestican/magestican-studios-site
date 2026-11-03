



export const MUSIC = {
  menu: 'menu',
  s0_dropzone: 'jungle',
  s1_jungle: 'jungle',
  s2_visitor: 'visitor',
  s3_river: 'river',
  s4_volcano: 'volcano',
  s5_boss: 'boss',
  stage_clear: 'victory',
};


export const SFX = {
  gun_shot: 4,
  gun_empty: 3,
  reload: 2,
  hit: 4,
  enemy_down: 3,
  explosion: 3,
  rock_break: 3,
  roar_raptor: 4,
  roar_trex: 3,
  player_hurt: 3,
  plate_break: 3,
  hostage_saved: 1,
  ui_click: 1,
  ui_confirm: 1,
  countdown: 1,
  low_ammo: 1,
  heli_pass: 1,
};


export const MIX = { music: 0.45, sfx: 0.9 };





export const BUDGET = { musicFileBytes: 2_000_000, sfxSetBytes: 1_500_000, perStageBytes: 3_000_000, voicesPerSound: 4 };


const BIG = new Set(['rex', 'spino', 'ankylo']);
const SMALL = new Set(['raptor', 'compy', 'dilo', 'pteranodon']);
const MACHINES = new Set(['heli', 'gunboat', 'shell']);


export function stageCue( stage) {
  return stage.events?.find((e) => e.do === 'music')?.cue ?? null;
}


export function sfxFiles(name, ext) {
  const n = SFX[name];
  if (!n) return [];
  if (n === 1) return [`audio/sfx/${name}/${name}.${ext}`];
  return Array.from({ length: n }, (_, i) => `audio/sfx/${name}/${name}_${String(i + 1).padStart(2, '0')}.${ext}`);
}


export function musicFile(cue, ext) {
  const f = MUSIC[cue];
  return f ? `audio/music/${f}.${ext}` : null;
}








export function soundsFor(events, before, after) {
  
  const sfx = [];
  let music = null;
  for (const ev of events) {
    switch (ev.type) {
      case 'shot':
        sfx.push('gun_shot', 'hit');
        break;
      case 'kill':
        if (ev.kind === 'rock') sfx.push('rock_break');
        else if (MACHINES.has(ev.kind)) sfx.push('explosion');
        else if (ev.kind !== 'barrel') sfx.push('enemy_down'); 
        break;
      case 'explode':
        sfx.push('explosion');
        break;
      case 'spawn':
        if (SMALL.has(ev.kind)) sfx.push('roar_raptor');
        else if (BIG.has(ev.kind)) sfx.push('roar_trex');
        else if (ev.kind === 'heli') sfx.push('heli_pass');
        break;
      case 'boss':
      case 'bite':
        sfx.push('roar_trex');
        break;
      case 'boss_phase':
      case 'stagger':
        sfx.push('plate_break');
        break;
      case 'hurt':
        sfx.push('player_hurt');
        break;
      case 'rescued':
        sfx.push('hostage_saved');
        break;
      case 'checkpoint':
        sfx.push('countdown');
        break;
      case 'vehicle':
        if (ev.to === 'heli') sfx.push('heli_pass');
        break;
      case 'music':
        music = ev.cue;
        break;
      case 'end':
        music = 'stage_clear';
        break;
    }
  }
  for (const side of  (['left', 'right'])) {
    const b = before[side];
    const a = after[side];
    if (!a || !b) continue;
    if (a.ammo > b.ammo) sfx.push('reload');
    else if (a.ammo === 0 && b.ammo > 0) sfx.push('gun_empty', 'low_ammo');
  }
  return { sfx, music };
}
