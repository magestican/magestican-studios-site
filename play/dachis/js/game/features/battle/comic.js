








export const HIT_WORDS = {
  big: ['KA-BOOM!', 'KRA-KOOM!', 'SKA-DOOM!'],
  crit: ['KRAK!', 'KA-POW!', 'THWAK!'],
  super: ['WHAM!', 'POW!', 'BAM!', 'ZAK!'],
};

export function hitWord({ big = false, crit = false, eff = 1, n = 0 } = {}) {
  const list = big ? HIT_WORDS.big : crit ? HIT_WORDS.crit : eff > 1 ? HIT_WORDS.super : null;
  return list ? list[((n % list.length) + list.length) % list.length] : null;
}



export const COMIC_PX = {
  hit: { px: 64, bigPx: 84, min: 34, font: 'Bangers' },
  num: { px: 34, bigPx: 44, min: 22, font: 'Bangers' },
  callout: { px: 26, bigPx: 40, min: 17, font: 'Bangers' },
  label: { px: 19, bigPx: 19, min: 14, font: 'Permanent Marker' },
};
export const COMIC_REF_W = 1280;

export function comicPx(kind, { big = false, viewW = COMIC_REF_W, viewH = 800 } = {}) {
  const c = COMIC_PX[kind] || COMIC_PX.label;
  
  const k = Math.min(1, Math.min(viewW / COMIC_REF_W, viewH / 800) * (viewH < 500 ? 1 : 1.25));
  return Math.max(c.min, Math.round((big ? c.bigPx : c.px) * k));
}

export const COMIC_TILT = { hit: -0.2, num: 0.1, callout: -0.04, label: 0.06 };

export function tiltedBox(w, h, a) {
  const c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
  return { w: w * c + h * s, h: w * s + h * c };
}



export function blobFor(tall, z = 0) {
  const up = Math.max(0, Math.min(1, z / 1.5));
  return { r: Math.max(0.12, tall * 0.42 * (1 - up * 0.5)), alpha: 1 - up * 0.6 };
}




export const LUNGE = { lean: 0.32, stretch: 0.14, recoil: 0.24 };
export function lungePose(lunge = 0, hurt = 0) {
  const l = Math.max(0, Math.min(1, lunge)), h = Math.max(0, Math.min(1, hurt / 0.25));
  return {
    lean: LUNGE.lean * l - LUNGE.recoil * h * (1 - l),
    sx: 1 + LUNGE.stretch * l,
    sy: 1 - LUNGE.stretch * 0.7 * l + 0.06 * h * (1 - l),
  };
}
