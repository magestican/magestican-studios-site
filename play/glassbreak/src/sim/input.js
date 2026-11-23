











export const X_MAX = 4095;
export const F_PRESENT = 1 << 14, F_LAUNCH = 1 << 15, F_FIRE = 1 << 16, F_NEXT = 1 << 17;


export const IDLE = 0;

export function pack({ x = 2048, tint = 0, launch = false, fire = false, next = false } = {}) {
  const tx = Math.max(0, Math.min(X_MAX, x | 0));
  const tn = Math.max(0, Math.min(2, tint | 0));
  return (tx | (tn << 12) | F_PRESENT | (launch ? F_LAUNCH : 0) | (fire ? F_FIRE : 0) | (next ? F_NEXT : 0)) >>> 0;
}

export function unpack(v) {
  return {
    x: v & 0xfff,
    tint: Math.min(2, (v >>> 12) & 3),
    present: (v & F_PRESENT) !== 0,
    launch: (v & F_LAUNCH) !== 0,
    fire: (v & F_FIRE) !== 0,
    next: (v & F_NEXT) !== 0,
  };
}
