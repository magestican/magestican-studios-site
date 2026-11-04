




export const SPRITE_FILL = 0.92;




const DINO = ['idle', 'walk', 'attack', 'hurt'];
const PERSON = ['idle', 'walk', 'hurt', 'down'];


export const SPRITES = {
  raptor: {
    sheet: 'raptor',
    side: 3.6,
    frames: ['idle', 'run', 'attack', 'hurt'],
    flipped: ['attack'],
    poses: { idle: 'idle', move: 'run', attack: 'attack', hurt: 'hurt', dead: 'hurt' },
  },
  rex: {
    sheet: 't-rex',
    side: 11,
    frames: DINO,
    flipped: ['walk', 'attack'],
    poses: { idle: 'idle', move: 'walk', attack: 'attack', hurt: 'hurt', dead: 'hurt' },
  },
  
  trike: { sheet: 'trike', side: 5, frames: DINO, poses: { idle: 'idle', move: 'walk', attack: 'attack', hurt: 'hurt', dead: 'hurt' } },
  
  compy: { sheet: 'compy', side: 1.5, frames: DINO, poses: { idle: 'idle', move: 'walk', attack: 'attack', hurt: 'hurt', dead: 'hurt' } },
  dilo: { sheet: 'dilo', side: 4, frames: DINO, poses: { idle: 'idle', move: 'walk', attack: 'attack', hurt: 'hurt', dead: 'hurt' } },
  spino: { sheet: 'spino', side: 8.5, frames: DINO, poses: { idle: 'idle', move: 'walk', attack: 'attack', hurt: 'hurt', dead: 'hurt' } },
  
  pteranodon: {
    sheet: 'pteranodon',
    side: 3.5,
    centred: true,
    hang: 200,
    frames: DINO,
    poses: { idle: 'idle', move: 'walk', attack: 'attack', hurt: 'hurt', dead: 'hurt' },
  },
  ankylo: { sheet: 'ankylo', side: 5, frames: DINO, poses: { idle: 'idle', move: 'walk', attack: 'attack', hurt: 'hurt', dead: 'hurt' } },
  
  hostage: { sheet: 'hostage', side: 1.9, frames: ['idle'], poses: onePose('idle') },
  merc: { sheet: 'merc', side: 2, frames: PERSON, poses: { idle: 'idle', move: 'walk', attack: 'idle', hurt: 'hurt', dead: 'down' } },
  varga: { sheet: 'varga', side: 2.1, frames: PERSON, poses: { idle: 'idle', move: 'walk', attack: 'idle', hurt: 'hurt', dead: 'down' } },
  
  plate: { sheet: 'iron-plate', side: 1.4, frames: ['plate'], poses: onePose('plate') },
  jaw: { sheet: 'iron-rig', side: 3, frames: ['rig'], poses: onePose('rig') },
  
  rocket: { sheet: 'rocket', side: 1.4, frames: ['rocket'], poses: onePose('rocket') },
  
  
  gunboat: { sheet: 'gunboat', side: 9, base: 204, frames: ['gunboat'], poses: onePose('gunboat') },
  heli: { sheet: 'heli', side: 14, centred: true, frames: ['heli'], poses: onePose('heli') },
};


export function spriteLift(s) {
  return s.base === undefined ? (s.side * SPRITE_FILL) / 2 : (s.side * (s.base - CELL / 2)) / CELL;
}


export function spriteHang(s) {
  return s.hang === undefined ? 0 : (s.side * (s.hang - CELL / 2)) / CELL;
}


function onePose(frame) {
  return { idle: frame, move: frame, attack: frame, hurt: frame, dead: frame };
}


export const BOSS_SPRITE = {
  sheet: 'iron-jaw',
  side: 13,
  frames: DINO,
  flipped: ['hurt'],
  poses: { idle: 'idle', move: 'walk', attack: 'attack', hurt: 'hurt' },
};


export const BOSS_DOWN = { sheet: 'iron-jaw-down', side: 13, frames: ['down'], poses: { dead: 'down' } };


export const GANTRY = { sheet: 'gantry', side: 7.3, frames: ['gantry'], poses: { idle: 'gantry' }, deck: [128, 62] };

const CELL = 256;







export const BOSS_ANCHORS = {
  idle: { head: [196, 172], jaw: [205, 195], feet: [132, 148] },
  walk: { head: [214, 168], jaw: [212, 185], feet: [150, 157] },
  attack: { head: [200, 130], jaw: [205, 150], feet: [126, 147] },
  hurt: { head: [50, 178], jaw: [40, 190], feet: [90, 150] },
  down: { head: [216, 180], jaw: [222, 200], feet: [156, 186] },
};


export const RIDER_LIFT = (SPRITES.varga.side * SPRITE_FILL) / 2;





export function bossAnchor(pose, which) {
  const { side, flipped } = BOSS_SPRITE;
  const [px, py] = BOSS_ANCHORS[pose][which];
  const x = (px / CELL - 0.5) * side;
  return { x: flipped.includes(pose) ? -x : x, y: (1 - py / CELL) * side - (side * (1 - SPRITE_FILL)) / 2 };
}





export function bossPose(boss) {
  const { poses } = BOSS_SPRITE;
  const { state, staggered } = boss.charge;
  if (boss.down) return BOSS_DOWN.poses.dead;
  if (state === 'warn') return poses.attack;
  if (state === 'back' && staggered) return poses.hurt;
  if (state === 'closing' || state === 'back') return poses.move;
  return Math.sin(boss.t * 1.5) > 0.6 ? poses.attack : poses.idle;
}


export function gantryPlaneY() {
  return (GANTRY.deck[1] / CELL - 0.5) * GANTRY.side;
}





export function cellUV(sprite, pose) {
  const n = sprite.frames.length;
  const i = Math.max(0, sprite.frames.indexOf(pose));
  return sprite.flipped?.includes(pose) ? { repeat: -1 / n, offset: (i + 1) / n } : { repeat: 1 / n, offset: i / n };
}





export function tipsOver(sprite) {
  return !sprite.frames.includes('down');
}

const MOVING = new Set(['approach', 'enter', 'leave', 'retreat', 'incoming']);


export function spriteFiles() {
  return [...new Set([...Object.values(SPRITES), BOSS_SPRITE, BOSS_DOWN, GANTRY].map((s) => `sprites/${s.sheet}/sheet.png`))];
}





export function spritePose(kind, e, hurtT) {
  const s = SPRITES[kind];
  if (!s) return null;
  if (e.dead || e.state === 'dead') return s.poses.dead;
  if (hurtT > 0) return s.poses.hurt;
  if (e.state === 'telegraph' || e.warn) return s.poses.attack;
  if (MOVING.has(e.state ?? '')) return s.poses.move;
  return s.poses.idle;
}
