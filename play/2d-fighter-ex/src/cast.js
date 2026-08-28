



















export const CAST = Object.freeze([
  { id: 'renji', name: 'RENJI', role: 'the lead' },
  { id: 'kira', name: 'KIRA', role: 'the rival' },
  { id: 'momo', name: 'MOMO', role: 'the bright one' },
  { id: 'tetsu', name: 'TETSU', role: 'the heavy' },
  { id: 'yuki', name: 'YUKI', role: 'the stoic' },
  { id: 'ami', name: 'AMI', role: 'the mechanic' },
]);

export const CAST_IDS = Object.freeze(CAST.map((c) => c.id));



export const DEFAULT_A = 'renji';
export const DEFAULT_B = 'kira';


export const atlasFile = (id) => `fighter-${id}.png`;








export function castId(value, fallback) {
  return CAST_IDS.includes(value) ? value : fallback;
}

export const castOf = (id) => CAST.find((c) => c.id === id) || null;
