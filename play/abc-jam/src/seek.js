















export const PAGE_W = 96;
export const PAGE_H = 64;










export const PAGES = Object.freeze([
  page('comic_garden', 8.0,
    { A: [23, 29, [15, 28, 2.7]], B: [61, 46, [47, 47, 8.7]], C: [89, 53, [78, 54, 6]] }, { R: [30, 12], S: [74, 16] }),
  page('comic_farm', 7.6,
    { D: [40, 51, [30, 46, 6.5]], E: [9, 53, [16, 52.5, 2.7]], F: [81, 57, [74, 59, 2.7]] },
    { B: [10, 9], P: [66, 40], Q: [36, 34] }),
  page('comic_fair', 7.2,
    { G: [25, 38, [18, 38, 3]], H: [58, 37, [52, 37.5, 2.7]], I: [71, 37, [78, 38, 3]] },
    { C: [8, 22], O: [46, 22], L: [76, 56] }),
  page('comic_zoo', 6.8,
    { J: [58, 45, [63, 50, 2.7]], K: [78, 57, [84, 59, 2.4]], L: [13, 34, [24, 34, 7.1]] },
    { T: [24, 12], I: [90, 50], F: [48, 55], Y: [86, 15] }),
  page('comic_night', 6.6,
    { M: [8, 12, [20, 12, 8.2]], N: [56, 31, [50, 31, 2.2]], O: [81, 56, [70, 56, 7.1]] },
    { W: [8, 50], U: [46, 18], Q: [76, 21], C: [36, 56] }),
  page('comic_castle', 6.4,
    
    { P: [5, 51, [10, 58, 4.4]], Q: [66, 46, [56, 44, 6.5]], R: [54, 15, [47, 21, 4.5]] },
    { B: [20, 56], O: [64, 57], F: [30, 30], K: [78, 12], E: [68, 24] }),
  page('comic_beach', 6.2,
    { S: [60, 10, [48, 10, 8]], T: [27, 48, [34, 52, 4.9]], U: [91, 57, [84, 58, 3.3]], V: [75, 47, [68, 51, 2.7]] },
    { Z: [28, 58], N: [56, 57], Y: [5, 40], A: [80, 32], W: [30, 13] }),
  page('comic_parade', 6.0,
    { W: [25, 42, [16, 42, 5.4]], X: [63, 46, [54, 46, 5.4]], Y: [89, 49, [88, 56, 3.3]], Z: [40, 31, [38, 42, 6.5]] },
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
      item: m.find ? Object.freeze({ x: m.at[2][0], y: m.at[2][1], r: m.at[2][2] }) : null,
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






export const needsMap = (pageW, viewW) => pageW > viewW + 1;


export function mapFrame(pan, i, pageW, gap, viewW) {
  const w = Math.min(1, viewW / pageW);
  const x = Math.max(0, Math.min(1 - w, (pan - i * (pageW + gap)) / pageW));
  return { x, w };
}


export const mapPan = (f, i, pageW, gap, viewW) =>
  panTo(i * (pageW + gap) + Math.max(0, Math.min(1, f)) * pageW, i, pageW, gap, viewW);





export const HUNT_HINT_MS = Object.freeze([12000, 24000, 36000]);
const HINT_STEPS = ['none', 'glow', 'show', 'point'];
export function huntHint(idleMs, misses) {
  const byTime = HUNT_HINT_MS.filter((t) => idleMs >= t).length;
  const byMiss = misses >= 3 ? 2 : 0;
  return HINT_STEPS[Math.max(byTime, byMiss)];
}
