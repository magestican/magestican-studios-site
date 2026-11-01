




export const SPRITE_FILL = 0.92;




const DINO = ['idle', 'walk', 'attack', 'hurt'];
const PERSON = ['idle', 'walk', 'hurt', 'down'];

const FACES_LEFT = ['hurt'];
export const SPRITES = {
  raptor: {
    sheet: 'raptor',
    side: 3.6,
    frames: ['idle', 'run', 'attack', 'hurt'],
    flipped: FACES_LEFT,
    poses: { idle: 'idle', move: 'run', attack: 'attack', hurt: 'hurt', dead: 'hurt' },
  },
  rex: {
    sheet: 't-rex',
    side: 11,
    frames: DINO,
    flipped: FACES_LEFT,
    poses: { idle: 'idle', move: 'walk', attack: 'attack', hurt: 'hurt', dead: 'hurt' },
  },
  merc: { sheet: 'merc', side: 2, frames: PERSON, poses: { idle: 'idle', move: 'walk', attack: 'idle', hurt: 'hurt', dead: 'down' } },
  varga: { sheet: 'varga', side: 2.1, frames: PERSON, poses: { idle: 'idle', move: 'walk', attack: 'idle', hurt: 'hurt', dead: 'down' } },
};


export const BOSS_SPRITE = {
  sheet: 'iron-jaw',
  side: 13,
  frames: DINO,
  flipped: FACES_LEFT,
  poses: { idle: 'idle', move: 'walk', attack: 'attack', hurt: 'hurt' },
};





export function cellUV(sprite, pose) {
  const n = sprite.frames.length;
  const i = Math.max(0, sprite.frames.indexOf(pose));
  return sprite.flipped?.includes(pose) ? { repeat: -1 / n, offset: (i + 1) / n } : { repeat: 1 / n, offset: i / n };
}

const MOVING = new Set(['approach', 'enter', 'leave', 'retreat', 'incoming']);


export function spriteFiles() {
  return [...new Set([...Object.values(SPRITES), BOSS_SPRITE].map((s) => `sprites/${s.sheet}/sheet.png`))];
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
