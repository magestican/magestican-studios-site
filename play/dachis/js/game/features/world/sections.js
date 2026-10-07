














const R2 = Math.SQRT1_2;

const DIR_LEN = Math.hypot(1, 1.2, 1);
export const SIN_E = 1.2 / DIR_LEN;           
export const COS_E = Math.SQRT2 / DIR_LEN;    

export const toUV = (x, y) => [(x - y) * R2, (x + y) * R2];
export const fromUV = (u, v) => [(u + v) * R2, (v - u) * R2];
export const screenS = (v, h) => v * SIN_E - h * COS_E;





export const SECTIONS = [
  { id: 'kazan', name: 'Kazan Village — Atop Mt. Kazan', rect: { u: [-6.5, 6.5], v: [33, 46] }, zoom: 8.5, wall: 0 },
  { id: 'slope', name: 'Mt. Kazan — The Winding Path', rect: { u: [-5, 5], v: [46, 56.5] }, zoom: 6.5, wall: 0, connector: true },
  
  
  
  
  { id: 'jungle', name: 'Foothill Jungle', rect: { u: [-9, 19], v: [56.5, 70.5] }, zoom: 8.5, wall: 2.2 },
  { id: 'road', name: 'Whispering Grass Road', rect: { u: [-9, 9], v: [70.5, 87] }, zoom: 8.5, wall: 1.2 },
  { id: 'coast', name: 'Tomo Coast', rect: { u: [9, 23], v: [72, 85] }, zoom: 8.5, wall: 1.6, sea: true, extend: [0, 3.5, 0, 0] },
  { id: 'shrine', name: 'Shrine Village — Temple of the Priest Dachis', rect: { u: [-9, 9], v: [87, 101] }, zoom: 8.5, wall: 2.0 },
  
  
  { id: 'coral', name: 'Coral Deep — The Sunken City', rect: { u: [9.5, 32], v: [85, 102] }, zoom: 8.5, wall: 1.8, chapter: 2, wildTypes: ['Tide', 'Frost', 'Metal'] },
  
  
  { id: 'verdant', name: 'Verdant Wilds — The Old Grove', rect: { u: [-27, -9], v: [57, 75] }, zoom: 8.5, wall: 2.0, chapter: 3, wildTypes: ['Leaf', 'Spirit'] },
];



const OTHER = [];
export function addSections(list) { for (const s of list) if (!sectionById(s.id)) OTHER.push(s); return list; }
export const sectionById = (id) => SECTIONS.find((s) => s.id === id) || OTHER.find((s) => s.id === id) || null;





export const GROWN_FROM = { jungle: { rect: { u: [-9, 9], v: [56.5, 70.5] }, wall: 2.2 }, road: { rect: { u: [-9, 9], v: [70.5, 87] }, wall: 2.0 }, coral: { rect: { u: [9.5, 26], v: [85, 102] }, wall: 1.8 } };
export const BASE_SECTIONS = SECTIONS.filter((s) => !(s.chapter >= 3)).map((s) => (GROWN_FROM[s.id] ? { ...s, ...GROWN_FROM[s.id] } : s));

const inRect = (r, u, v, grow = 0) => u >= r.u[0] - grow && u <= r.u[1] + grow && v >= r.v[0] - grow && v <= r.v[1] + grow;
export function sectionAtUV(u, v, list = SECTIONS) {
  for (const s of list) if (inRect(s.rect, u, v)) return s;
  return null;
}
export const sectionAt = (x, y) => sectionAtUV(...toUV(x, y));

export function edgeDepth(r, u, v) {
  const d = [u - r.u[0], r.u[1] - u, v - r.v[0], r.v[1] - v];
  let k = 0; for (let i = 1; i < 4; i++) if (d[i] < d[k]) k = i;
  return { depth: d[k], edge: ['left', 'right', 'top', 'bottom'][k] };
}

export function nearestSection(x, y, list = SECTIONS) {
  const [u, v] = toUV(x, y);
  let best = null, bd = Infinity;
  for (const s of list) {
    const du = Math.max(s.rect.u[0] - u, 0, u - s.rect.u[1]), dv = Math.max(s.rect.v[0] - v, 0, v - s.rect.v[1]);
    const d = Math.hypot(du, dv);
    if (d < bd) { bd = d; best = s; }
  }
  return { section: best, dist: bd };
}



export const HYST = 0.35;
export function nextSection(curId, x, y, list = SECTIONS) {
  const [u, v] = toUV(x, y), cur = list.find((s) => s.id === curId);
  if (cur && inRect(cur.rect, u, v, HYST)) return cur.id;
  const s = sectionAtUV(u, v, list);
  return s ? s.id : (cur ? cur.id : nearestSection(x, y, list).section.id);
}



export const MARGIN = { side: 1.3, top: 2.0, bottom: 1.1 };


export function sectionWindow(W, sec) {
  let u0 = Infinity, u1 = -Infinity, s0 = Infinity, s1 = -Infinity;
  for (let j = 0; j < W.N; j++) for (let i = 0; i < W.N; i++) {
    if (!W.reach[j * W.N + i]) continue;
    const x = i + 0.5, y = j + 0.5, [u, v] = toUV(x, y);
    if (!inRect(sec.rect, u, v)) continue;
    const s = screenS(v, W.groundAt(x, y));
    u0 = Math.min(u0, u); u1 = Math.max(u1, u); s0 = Math.min(s0, s); s1 = Math.max(s1, s);
  }
  const e = sec.extend || [0, 0, 0, 0];
  return { u: [u0 - MARGIN.side - e[0], u1 + MARGIN.side + e[1]], s: [s0 - MARGIN.top - e[2], s1 + MARGIN.bottom + e[3]] };
}
export function sectionWindows(W, list = SECTIONS) {
  const out = {};
  for (const s of list) out[s.id] = sectionWindow(W, s);
  return out;
}





export function viewFor(win, zoom, aspect) {
  const bw = win.u[1] - win.u[0], bh = win.s[1] - win.s[0];
  const vh = Math.min(aspect >= 1 ? zoom : zoom / aspect, bh, bw / aspect);
  return { vh, vw: vh * aspect };
}

export function clampView(win, view, u, s) {
  const cu = Math.min(Math.max(u, win.u[0] + view.vw / 2), win.u[1] - view.vw / 2);
  const cs = Math.min(Math.max(s, win.s[0] + view.vh / 2), win.s[1] - view.vh / 2);
  return [cu, cs];
}

export function targetFor(u, s, h) {
  const v = (s + h * COS_E) / SIN_E;
  const [x, y] = fromUV(u, v);
  return { x, y, h };
}



export function groundUnder(W, u, s, top = 14) {
  let prev = null;
  for (let h = top; h >= -0.001; h -= 0.05) {
    const v = (s + h * COS_E) / SIN_E, [x, y] = fromUV(u, v);
    const g = Math.max(0, W.heightAt(x, y));
    if (g >= h) return { x, y, h: g, sea: W.heightAt(x, y) < 0 };
    prev = { x, y };
  }
  return { ...prev, h: 0, sea: true };
}


export const uvRot = (du, dv) => { const [x0, y0] = fromUV(0, 40), [x1, y1] = fromUV(du, 40 + dv); return Math.atan2(x1 - x0, y1 - y0); };
