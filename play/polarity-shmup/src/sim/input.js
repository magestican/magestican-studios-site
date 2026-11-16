









export const MOVE_MAX = 64;
export const F_IRIS = 1, F_BOMB = 2, F_FOCUS = 4, F_PRESENT = 8;
export const BYTES = 3;


export const IDLE = 0;

const clamp = (v) => (v < -MOVE_MAX ? -MOVE_MAX : v > MOVE_MAX ? MOVE_MAX : v | 0);


export function pack({ x = 0, y = 0, iris = false, bomb = false, focus = false } = {}) {
  return ((clamp(x) & 0xff) | ((clamp(y) & 0xff) << 8) | ((F_PRESENT | (iris ? F_IRIS : 0) | (bomb ? F_BOMB : 0) |
    (focus ? F_FOCUS : 0)) << 16)) >>> 0;
}

export function unpack(v) {
  const f = (v >>> 16) & 0xff;
  return {
    x: ((v & 0xff) << 24) >> 24,
    y: (((v >>> 8) & 0xff) << 24) >> 24,
    iris: (f & F_IRIS) !== 0,
    bomb: (f & F_BOMB) !== 0,
    focus: (f & F_FOCUS) !== 0,
    present: (f & F_PRESENT) !== 0,
  };
}


export function toBytes(list) {
  const out = new Uint8Array(list.length * BYTES);
  list.forEach((v, i) => { out[i * 3] = v & 0xff; out[i * 3 + 1] = (v >>> 8) & 0xff; out[i * 3 + 2] = (v >>> 16) & 0xff; });
  return out;
}

export function fromBytes(bytes) {
  const out = [];
  for (let i = 0; i + 2 < bytes.length; i += 3) out.push((bytes[i] | (bytes[i + 1] << 8) | (bytes[i + 2] << 16)) >>> 0);
  return out;
}
