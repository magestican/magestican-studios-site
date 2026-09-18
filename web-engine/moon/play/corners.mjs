




















































export const CORNERS = Object.freeze(['tools', 'pockets']);


export const CLOSED = Object.freeze({ open: null });




















export const TRAY = Object.freeze({ topPx: 112, cols: 3, rowPx: 49, chromePx: 16, maxRows: 3 });


export function trayHeight(n, cfg = TRAY) {
  const rows = Math.min(Math.ceil(Math.max(0, n) / cfg.cols), cfg.maxRows);
  return rows === 0 ? 0 : rows * cfg.rowPx + cfg.chromePx;
}


export const trayBottom = (n, cfg = TRAY) => cfg.topPx + trayHeight(n, cfg);





export function badgeCount(counts) {
  let total = 0;
  for (const n of Object.values(counts || {})) if (Number.isFinite(n) && n > 0) total += n;
  return total;
}





export function pocketRows(counts) {
  return Object.entries(counts || {})
    .filter(([, n]) => Number.isFinite(n) && n > 0)
    .sort((a, b) => (b[1] - a[1]) || (a[0] < b[0] ? -1 : 1))
    .map(([good, n]) => Object.freeze({ good, n }));
}


export function topGood(counts) {
  const rows = pocketRows(counts);
  return rows.length ? rows[0].good : null;
}













export function glyphTool(tools, { active = null, chosen = null, last = null } = {}) {
  const list = tools || [];
  for (const t of [chosen, active, last]) if (t && list.includes(t)) return t;
  return list.length ? list[0] : null;
}





export function toggleCorner(state, which) {
  if (!CORNERS.includes(which)) throw new Error(`no corner '${which}'`);
  const open = state && state.open;
  return open === which ? CLOSED : Object.freeze({ open: which });
}


export const closeCorners = (state) => (state && state.open ? CLOSED : (state || CLOSED));


export const cornerIsOpen = (state, which) => Boolean(state && state.open === which);
