

















export const SHELF = Object.freeze({
  
  
  displayScale: 2.8,
  
  itemWidthM: 0.09,
  
  gapM: 0.025,
  
  marginM: 0.04,
  
  maxTiers: 3,
  
  maxVisible: 12,
});

export const pitchOf = (cfg = SHELF) => cfg.itemWidthM * cfg.displayScale + cfg.gapM;


export function shelfCapacity(anchor, cfg = SHELF) {
  const cols = Math.max(1, Math.floor((anchor.width - 2 * cfg.marginM + cfg.gapM) / pitchOf(cfg) + 1e-9));
  const tiers = [];
  let total = 0;
  for (let t = 0; t < cfg.maxTiers && cols - t >= 1; t++) {
    const n = Math.min(cols - t, cfg.maxVisible - total);
    if (n < 1) break;
    tiers.push(n);
    total += n;
  }
  return { cols, tiers, capacity: total };
}


function middleOut(n) {
  const mid = (n - 1) / 2;
  return Array.from({ length: n }, (_, i) => i).sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid) || a - b);
}





export function shelfSpots(anchor, count, cfg = SHELF, heightM = 0.1) {
  const { tiers } = shelfCapacity(anchor, cfg);
  const pitch = pitchOf(cfg);
  const cos = Math.cos(anchor.rotY || 0), sin = Math.sin(anchor.rotY || 0);
  
  const v = Math.max(0, anchor.depth / 2 - cfg.marginM - (cfg.itemWidthM * cfg.displayScale) / 2);
  const spots = [];
  let left = Math.max(0, count);
  tiers.forEach((n, t) => {
    for (const k of middleOut(n)) {
      if (left <= 0) return;
      const u = (k - (n - 1) / 2) * pitch;
      spots.push({
        x: anchor.x + u * cos + v * sin,
        y: anchor.y + t * heightM * cfg.displayScale,
        z: anchor.z - u * sin + v * cos,
        rotY: anchor.rotY || 0,
        scale: cfg.displayScale,
        tier: t,
      });
      left -= 1;
    }
  });
  return spots;
}


export function shelvesView(shelves, anchors, cfg = SHELF, heightOf = () => 0.1) {
  const out = [];
  for (let i = 0; i < Math.min(shelves.length, anchors.length); i++) {
    const s = shelves[i];
    if (!s) { out.push({ index: i, good: null, count: 0, shown: 0, spots: [] }); continue; }
    const spots = shelfSpots(anchors[i], s.count, cfg, heightOf(s.good));
    out.push({ index: i, good: s.good, count: s.count, shown: spots.length, spots });
  }
  return out;
}


export const shelvesSignature = (view) => view.map((v) => (v.good ? `${v.good}x${v.shown}` : '-')).join('|');


export function toPlacementFrame(p, { x, y = 0, z, rotY = 0 }) {
  const cos = Math.cos(p.rotY || 0), sin = Math.sin(p.rotY || 0);
  return { x: p.x + x * cos + z * sin, y: (p.y || 0) + y, z: p.z - x * sin + z * cos, rotY: (p.rotY || 0) + rotY };
}
