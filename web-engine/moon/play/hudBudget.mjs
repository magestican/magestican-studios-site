


































export const HUD_BUDGET = Object.freeze({ screenPct: 10, centrePct: 0 });























































































export const HUD_CEILING = Object.freeze({
  portrait: Object.freeze({
    play: Object.freeze({ screenPct: 9.9, centrePct: 0 }),
    guiding: Object.freeze({ screenPct: 12.5, centrePct: 0 }),
    card: Object.freeze({ screenPct: 32.0, centrePct: 67.6 }),
  }),
  landscape: Object.freeze({
    play: Object.freeze({ screenPct: 9.5, centrePct: 0 }),
    guiding: Object.freeze({ screenPct: 12.5, centrePct: 0 }),
    card: Object.freeze({ screenPct: 32.0, centrePct: 55.9 }),
  }),
});


export const orientationOf = ({ w, h }) => (w >= h ? 'landscape' : 'portrait');












export function centreBand({ w, h }) {
  if (w >= h) return { left: w / 3, right: (w * 2) / 3, top: 0, bottom: h };
  return { left: 0, right: w, top: h / 3, bottom: (h * 2) / 3 };
}


export function clipTo(rect, box) {
  if (!rect || !box) return null;
  const left = Math.max(rect.left, box.left);
  const right = Math.min(rect.right, box.right);
  const top = Math.max(rect.top, box.top);
  const bottom = Math.min(rect.bottom, box.bottom);
  if (!(right > left) || !(bottom > top)) return null;
  return { left, top, right, bottom };
}









export function unionArea(rects) {
  const rs = (rects || []).filter((r) => r && r.right > r.left && r.bottom > r.top);
  if (rs.length === 0) return 0;
  const xs = [...new Set(rs.flatMap((r) => [r.left, r.right]))].sort((a, b) => a - b);
  let total = 0;
  for (let i = 0; i + 1 < xs.length; i += 1) {
    const x0 = xs[i], x1 = xs[i + 1];
    const w = x1 - x0;
    if (!(w > 0)) continue;
    const spans = rs.filter((r) => r.left <= x0 && r.right >= x1)
      .map((r) => [r.top, r.bottom])
      .sort((a, b) => a[0] - b[0]);
    let covered = 0, cur = null;
    for (const [top, bottom] of spans) {
      if (!cur) cur = [top, bottom];
      else if (top <= cur[1]) cur[1] = Math.max(cur[1], bottom);
      else { covered += cur[1] - cur[0]; cur = [top, bottom]; }
    }
    if (cur) covered += cur[1] - cur[0];
    total += covered * w;
  }
  return total;
}

const round1 = (n) => Math.round(n * 10) / 10;








export function hudShare(rects, vp) {
  const screen = { left: 0, top: 0, right: vp.w, bottom: vp.h };
  const band = centreBand(vp);
  const onScreen = (rects || []).map((r) => clipTo(r, screen)).filter(Boolean);
  const inBand = onScreen.map((r) => clipTo(r, band)).filter(Boolean);
  const screenPx = unionArea(onScreen);
  const centrePx = unionArea(inBand);
  const screenArea = vp.w * vp.h;
  const bandArea = (band.right - band.left) * (band.bottom - band.top);
  return {
    screenPx,
    centrePx,
    screenPct: round1(screenArea > 0 ? (screenPx / screenArea) * 100 : 0),
    centrePct: round1(bandArea > 0 ? (centrePx / bandArea) * 100 : 0),
    count: onScreen.length,
  };
}









export function overLimit(share, limit, what = 'the HUD') {
  const out = [];
  if (share.screenPct > limit.screenPct) {
    out.push(`${what} covers ${share.screenPct} % of the screen, over ${limit.screenPct} %`);
  }
  if (share.centrePct > limit.centrePct) {
    out.push(`${what} covers ${share.centrePct} % of the centre band, over ${limit.centrePct} %`);
  }
  return out;
}










export const HUD_RECTS_JS = `(() => {
  const SKIP = new Set(['worldui']);
  const painted = (cs, el) => {
    if (cs.backgroundImage !== 'none') return true;
    const bg = cs.backgroundColor || '';
    const m = bg.match(/rgba?\\(([^)]+)\\)/);
    if (m) { const p = m[1].split(',').map(Number); if (p.length < 4 || p[3] > 0) return true; }
    for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
      if (parseFloat(cs['border' + side + 'Width']) > 0 && cs['border' + side + 'Style'] !== 'none') return true;
    }
    if (cs.boxShadow && cs.boxShadow !== 'none') return true;
    for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) return true;
    return false;
  };
  const out = [];
  const visit = (el) => {
    if (el.id && SKIP.has(el.id)) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) === 0) return;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) { for (const c of el.children) visit(c); return; }
    if (painted(cs, el)) { out.push({ id: el.id || el.className || el.tagName.toLowerCase(), left: r.left, top: r.top, right: r.right, bottom: r.bottom }); return; }
    for (const c of el.children) visit(c);
  };
  const walk = (el) => {
    if (el.id && SKIP.has(el.id)) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none') return;
    if (cs.position === 'fixed') { visit(el); return; }
    for (const c of el.children) walk(c);
  };
  walk(document.body);
  return out;
})()`;
