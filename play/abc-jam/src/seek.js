















export const PAGE_W = 96;
export const PAGE_H = 64;




export const PAGES = Object.freeze([
  page('comic_garden', 8.0, { A: [84, 47], B: [9, 40], C: [57, 30] }, { R: [30, 12], S: [74, 16] }),
  page('comic_farm', 7.6, { D: [25, 56], E: [52, 24], F: [90, 30] }, { B: [10, 9], P: [70, 58], Q: [36, 40] }),
  page('comic_fair', 7.2, { G: [28, 30], H: [60, 57], I: [88, 28] }, { C: [8, 22], O: [46, 22], L: [76, 56] }),
  page('comic_zoo', 6.8, { J: [10, 57], K: [70, 28], L: [44, 22] }, { T: [24, 12], I: [88, 57], F: [56, 55], Y: [86, 15] }),
  page('comic_night', 6.6, { M: [60, 47], N: [30, 25], O: [90, 47] }, { W: [8, 50], U: [46, 18], Q: [76, 21], C: [36, 56] }),
  page('comic_castle', 6.4, { P: [8, 30], Q: [46, 40], R: [92, 40] },
    { B: [20, 56], O: [64, 57], F: [40, 13], K: [78, 12], E: [58, 27] }),
  page('comic_beach', 6.2, { S: [14, 26], T: [42, 46], U: [66, 22], V: [86, 44] },
    { Z: [28, 57], N: [56, 57], Y: [5, 46], A: [78, 57], W: [30, 13] }),
  page('comic_parade', 6.0, { W: [40, 32], X: [8, 30], Y: [66, 52], Z: [88, 34] },
    { M: [48, 21], V: [20, 56], K: [76, 14], N: [52, 56], H: [6, 52] }),
]);

function page(pic, size, find, decoys) {
  const tilt = [-14, 9, -6, 16, -10, 5, -16, 12, -4];
  const all = [...Object.entries(find).map(([ch, at]) => ({ ch, at, find: true })),
    ...Object.entries(decoys).map(([ch, at]) => ({ ch, at, find: false }))];
  return Object.freeze({
    pic,
    size,
    letters: Object.freeze(Object.keys(find)),
    marks: Object.freeze(all.map((m, i) => Object.freeze({ id: i, ch: m.ch, x: m.at[0], y: m.at[1], find: m.find,
      tilt: tilt[i % tilt.length] }))),
  });
}


export const ALL_LETTERS = Object.freeze(PAGES.flatMap((p) => p.letters));








export function createHunt(start = 0) {
  let at = Math.max(0, Math.min(PAGES.length - 1, start | 0));
  let got = 0; 
  let misses = 0; 
  const found = new Set();
  return {
    get pageIndex() { return at; },
    get page() { return PAGES[at]; },
    get wanted() { return PAGES[at].letters[got] ?? null; },
    get found() { return got; },
    get misses() { return misses; },
    isFound: (id) => found.has(id),
    tap(id) {
      const m = PAGES[at].marks.find((x) => x.id === id);
      if (!m || found.has(id)) return { kind: 'none' };
      if (!m.find || m.ch !== this.wanted) { misses++; return { kind: 'other', ch: m.ch }; }
      found.add(id);
      got++;
      misses = 0;
      const pageDone = got === PAGES[at].letters.length;
      return { kind: 'found', ch: m.ch, pageDone, stripDone: pageDone && at === PAGES.length - 1 };
    },
    
    wantedMark() { return PAGES[at].marks.find((m) => m.find && m.ch === this.wanted) ?? null; },
    next() {
      if (got < PAGES[at].letters.length || at >= PAGES.length - 1) return false;
      at++;
      got = 0;
      misses = 0;
      found.clear();
      return true;
    },
  };
}


export const startPage = (pagesDone) => ((pagesDone | 0) >= PAGES.length ? 0 : Math.max(0, pagesDone | 0));







export function panRange(i, pageW, gap, viewW) {
  const x0 = i * (pageW + gap);
  if (pageW <= viewW) { const c = x0 - (viewW - pageW) / 2; return [c, c]; }
  return [x0, x0 + pageW - viewW];
}

export const clampPan = (x, [lo, hi]) => Math.max(lo, Math.min(hi, x));


export const panTo = (px, i, pageW, gap, viewW) => clampPan(px - viewW / 2, panRange(i, pageW, gap, viewW));





export const HUNT_HINT_MS = Object.freeze([12000, 24000, 36000]);
const HINT_STEPS = ['none', 'glow', 'show', 'point'];
export function huntHint(idleMs, misses) {
  const byTime = HUNT_HINT_MS.filter((t) => idleMs >= t).length;
  const byMiss = misses >= 3 ? 2 : 0;
  return HINT_STEPS[Math.max(byTime, byMiss)];
}
