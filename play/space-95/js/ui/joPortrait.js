


import { v } from '../site/assetUrl.js';


const PORTRAIT_SHEETS = { woman: 'assets/art/jo/', man: 'assets/art/jo/' };





export function portraitRect(f, w, h) {
  const s = (h * 0.96) / f.h;
  const dw = f.w * s;
  const dh = f.h * s;
  return { x: (w - dw) / 2, y: h - dh, w: dw, h: dh };
}


const cache = new Map();
const load = (dir) => {
  if (!cache.has(dir))
    cache.set(
      dir,
      fetch(v(`${dir}jo.sprites.json`))
        .then((r) => r.json())
        .then((sheet) =>
          Promise.all(
            sheet.atlases.map(
              (a) =>
                new Promise((ok, bad) => {
                  const img = new Image();
                  img.onload = () => ok(img);
                  img.onerror = bad;
                  img.src = v(`${dir}${a}`);
                }),
            ),
          ).then((imgs) => ({ sheet, imgs })),
        ),
    );
  return cache.get(dir);
};


export function drawPortrait(slot, variant) {
  const dir = PORTRAIT_SHEETS[variant] ?? PORTRAIT_SHEETS.woman;
  load(dir)
    .then(({ sheet, imgs }) => {
      const f = sheet.clips.idle?.frames[0];
      if (!f) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const c = document.createElement('canvas');
      const w = slot.clientWidth || 76;
      const h = slot.clientHeight || 84;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      const g = c.getContext('2d');
      if (!g) return;
      const r = portraitRect(f, c.width, c.height);
      g.drawImage(imgs[f.atlas], f.x, f.y, f.w, f.h, r.x, r.y, r.w, r.h);
      slot.replaceChildren(c);
    })
    .catch(() => {});
}
