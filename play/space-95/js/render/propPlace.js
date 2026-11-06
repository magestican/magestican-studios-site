




export const LAYER_Z = {
  back: [-6, -2], 
  ground: [-1.0, -0.4], 
  hang: [-1.0, -0.4], 
  air: [-1.0, -0.4], 
  front: [1.6, 3.2], 
};

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const stands = (w, c, r) => w.solid(c, r) || w.oneWay(c, r);


function surfaces(w, c, clear) {
  const out = [];
  for (let r = w.height - 1; r >= 0; r--) {
    if (!stands(w, c, r)) continue;
    let open = true;
    for (let k = 1; k <= clear && open; k++) open = !stands(w, c, r + k);
    if (open) out.push(r);
  }
  return out;
}


function ceilings(w, c, clear) {
  const out = [];
  for (let r = w.height - 1; r >= clear; r--) {
    if (!stands(w, c, r)) continue;
    let open = true;
    for (let k = 1; k <= clear && open; k++) open = !stands(w, c, r - k);
    if (open) out.push(r);
  }
  return out;
}


function backedBySolid(w, c, top, rows, span) {
  for (let k = -span; k <= span; k++) {
    const col = Math.max(0, Math.min(w.width - 1, c + k));
    if (stands(w, col, top + 1)) return false;
    for (let r = top; r > top - rows; r--) if (r >= 0 && !w.solid(col, r)) return false;
  }
  return true;
}


function allAlong(w, list) {
  const cells = [];
  for (let c = 0; c < w.width; c++) for (const r of list(c)) cells.push([c, r]);
  return cells.sort((a, b) => b[1] - a[1] || a[0] - b[0]);
}







export function placeProps(world, items, seed) {
  const out = [];
  const t = world.tile;
  items.forEach((item, i) => {
    const r = rng(seed + i * 7919);
    const clear = Math.ceil(item.h / t);
    const [z0, z1] = LAYER_Z[item.layer];
    const list =
      item.layer === 'hang'
        ? (c) => ceilings(world, c, clear)
        : item.layer === 'air'
          ? (c) => surfaces(world, c, clear + 2)
          : (c) => surfaces(world, c, item.layer === 'ground' ? clear : 1);
    let next = r() * item.every;
    let walked = 0;
    for (const [c, row] of allAlong(world, list)) {
      walked += t;
      if (walked < next) continue;
      const h = item.h * (0.85 + r() * 0.3);
      const inst = { name: item.name, layer: item.layer, x: (c + r()) * t, z: z0 + r() * (z1 - z0), h, phase: r() };
      if (item.layer === 'front') {
        
        if (!backedBySolid(world, c, row, Math.ceil(h / t), Math.ceil(item.h / t) + 2)) continue;
        out.push({ ...inst, y: (row + 1) * t - h, pivot: 'bottom' });
      } else if (item.layer === 'hang') out.push({ ...inst, y: row * t, pivot: 'top' });
      else if (item.layer === 'air') out.push({ ...inst, y: (row + 2 + r() * clear) * t, pivot: 'center' });
      else out.push({ ...inst, y: (row + 1) * t, pivot: 'bottom' });
      walked = 0;
      next = item.every * (0.7 + r() * 0.6);
    }
  });
  return out;
}


export function sampleClip(clip, t) {
  const { fps, frames, fields, rows } = clip.track;
  const at = (((t * fps) % frames) + frames) % frames;
  const a = rows[Math.floor(at)];
  const b = rows[(Math.floor(at) + 1) % frames];
  const k = at - Math.floor(at);
  
  const out = {};
  fields.forEach((f, i) => {
    
    out[f] = Math.floor(at) === frames - 1 ? a[i] : a[i] + (b[i] - a[i]) * k;
  });
  return out;
}
