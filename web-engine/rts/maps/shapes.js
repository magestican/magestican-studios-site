
















































































import { isqrt, sin4096, cos4096, BRADS } from '../fixed.js';








export function hash(a, b, c) {
  let h = (a ^ 0x9e3779b9) >>> 0;
  h = Math.imul(h ^ (b >>> 0), 0x85ebca6b) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0;
  h = Math.imul(h ^ (c >>> 0), 0xc2b2ae35) >>> 0;
  h = (h ^ (h >>> 16)) >>> 0;
  return h >>> 0;
}


export function seedOf(text) {
  let h = 0x811c9dc5;
  const s = String(text);
  for (let i = 0; i < s.length; i += 1) h = Math.imul(h ^ s.charCodeAt(i), 0x01000193) >>> 0;
  return h >>> 0;
}


const ONE = 1024;















export function smooth1024(t) {
  const u = t < 0 ? 0 : (t > ONE - 1 ? ONE - 1 : t);
  return Math.trunc((u * u * (3 * ONE - 2 * u)) / (ONE * ONE));
}

















export function noiseMm(seed, x, y, waveMm, ampMm) {
  if (ampMm <= 0) return 0;
  const gx = Math.floor(x / waveMm);
  const gy = Math.floor(y / waveMm);
  const sx = smooth1024(Math.trunc(((x - gx * waveMm) * ONE) / waveMm));
  const sy = smooth1024(Math.trunc(((y - gy * waveMm) * ONE) / waveMm));
  const span = ampMm * 2 + 1;
  const at = (ix, iy) => (hash(seed, ix + 0x4000, iy + 0x4000) % span) - ampMm;
  const a = at(gx, gy);
  const b = at(gx + 1, gy);
  const c = at(gx, gy + 1);
  const d = at(gx + 1, gy + 1);
  const top = a + Math.trunc(((b - a) * sx) / ONE);
  const bot = c + Math.trunc(((d - c) * sx) / ONE);
  return top + Math.trunc(((bot - top) * sy) / ONE);
}












export const WARP_FINE_WAVE_PCT = 37;
export const WARP_FINE_AMP_PCT = 40;

export function warpMm(seed, x, y, waveMm, ampMm) {
  const fineWave = Math.trunc((waveMm * WARP_FINE_WAVE_PCT) / 100);
  const fineAmp = Math.trunc((ampMm * WARP_FINE_AMP_PCT) / 100);
  return noiseMm(seed, x, y, waveMm, ampMm)
    + noiseMm(seed ^ 0x5bd1e995, x, y, fineWave, fineAmp);
}















export function disc(cxMm, cyMm, rMm) {
  return {
    kind: 'disc',
    f(x, y) {
      const dx = x - cxMm;
      const dy = y - cyMm;
      return rMm - isqrt(dx * dx + dy * dy);
    },
  };
}








export function ellipse(cxMm, cyMm, rxMm, ryMm, rotBrad = 0) {
  const co = cos4096(rotBrad);
  const si = sin4096(rotBrad);
  return {
    kind: 'ellipse',
    f(x, y) {
      const dx = x - cxMm;
      const dy = y - cyMm;
      
      
      const u = Math.trunc((dx * co + dy * si) / 4096);
      const v = Math.trunc(((dy * co - dx * si) * rxMm) / (4096 * ryMm));
      return rxMm - isqrt(u * u + v * v);
    },
  };
}










export function halfPlane(axMm, ayMm, bxMm, byMm) {
  const dx = bxMm - axMm;
  const dy = byMm - ayMm;
  const len = isqrt(dx * dx + dy * dy);
  if (len === 0) throw new Error('halfPlane: the two points are the same');
  return {
    kind: 'halfPlane',
    f(x, y) {
      return Math.trunc((dx * (y - ayMm) - dy * (x - axMm)) / len);
    },
  };
}


export function stripe(axMm, ayMm, bxMm, byMm, halfWidthMm) {
  const h = halfPlane(axMm, ayMm, bxMm, byMm);
  return {
    kind: 'stripe',
    f(x, y) {
      const d = h.f(x, y);
      return halfWidthMm - (d < 0 ? -d : d);
    },
  };
}










export function poly(points) {
  if (points.length < 3) throw new Error('poly: needs at least three points');
  let area2 = 0;
  for (let i = 0; i < points.length; i += 1) {
    const [ax, ay] = points[i];
    const [bx, by] = points[(i + 1) % points.length];
    area2 += ax * by - bx * ay;
  }
  const pts = area2 < 0 ? [...points].reverse() : points;
  const edges = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    return halfPlane(p[0], p[1], q[0], q[1]);
  });
  return {
    kind: 'poly',
    f(x, y) {
      let m = edges[0].f(x, y);
      for (let i = 1; i < edges.length; i += 1) {
        const v = edges[i].f(x, y);
        if (v < m) m = v;
      }
      return m;
    },
  };
}


export function triangle(p0, p1, p2) {
  return { ...poly([p0, p1, p2]), kind: 'triangle' };
}















export function pie(cxMm, cyMm, rMm, fromBrad, toBrad) {
  const span = ((toBrad - fromBrad) % BRADS + BRADS) % BRADS;
  const body = disc(cxMm, cyMm, rMm);
  const ray = (brad) => {
    const px = cxMm + Math.trunc((cos4096(brad) * rMm) / 4096);
    const py = cyMm + Math.trunc((sin4096(brad) * rMm) / 4096);
    return [px, py];
  };
  const [fx, fy] = ray(fromBrad);
  const [tx, ty] = ray(toBrad);
  
  
  const a = halfPlane(cxMm, cyMm, fx, fy);
  const b = halfPlane(tx, ty, cxMm, cyMm);
  const wide = span > BRADS / 2;
  return {
    kind: 'pie',
    f(x, y) {
      const d = body.f(x, y);
      const va = a.f(x, y);
      const vb = b.f(x, y);
      const cut = wide ? (va > vb ? va : vb) : (va < vb ? va : vb);
      return d < cut ? d : cut;
    },
  };
}








export function band(points, halfWidthMm) {
  if (points.length < 2) throw new Error('band: needs at least two points');
  return {
    kind: 'band',
    f(x, y) {
      let best = -1;
      for (let i = 0; i + 1 < points.length; i += 1) {
        const [ax, ay] = points[i];
        const [bx, by] = points[i + 1];
        const dx = bx - ax;
        const dy = by - ay;
        const len2 = dx * dx + dy * dy;
        let px = ax;
        let py = ay;
        if (len2 > 0) {
          
          
          
          let t = Math.trunc((((x - ax) * dx + (y - ay) * dy) * ONE) / len2);
          if (t < 0) t = 0;
          if (t > ONE) t = ONE;
          px = ax + Math.trunc((dx * t) / ONE);
          py = ay + Math.trunc((dy * t) / ONE);
        }
        const ex = x - px;
        const ey = y - py;
        const d = isqrt(ex * ex + ey * ey);
        if (best < 0 || d < best) best = d;
      }
      return halfWidthMm - best;
    },
  };
}


export function everywhere(valueMm = 1) {
  return { kind: 'everywhere', f() { return valueMm; } };
}















export const MIRRORED = Object.freeze({ kind: 'mirrored', f() { return -0x40000000; } });




export function union(...regions) {
  return {
    kind: 'union',
    f(x, y) {
      let m = regions[0].f(x, y);
      for (let i = 1; i < regions.length; i += 1) {
        const v = regions[i].f(x, y);
        if (v > m) m = v;
      }
      return m;
    },
  };
}


export function intersect(...regions) {
  return {
    kind: 'intersect',
    f(x, y) {
      let m = regions[0].f(x, y);
      for (let i = 1; i < regions.length; i += 1) {
        const v = regions[i].f(x, y);
        if (v < m) m = v;
      }
      return m;
    },
  };
}


export function without(a, b) {
  return {
    kind: 'without',
    f(x, y) {
      const va = a.f(x, y);
      const vb = -b.f(x, y);
      return va < vb ? va : vb;
    },
  };
}


export function grow(region, mm) {
  return { kind: 'grow', f(x, y) { return region.f(x, y) + mm; } };
}













export function organic(region, { seed, ampMm = 26_000, waveMm = 210_000 }) {
  const s = seed >>> 0;
  return {
    kind: 'organic',
    f(x, y) { return region.f(x, y) + warpMm(s, x, y, waveMm, ampMm); },
  };
}











export const weight = grow;





















export function rasterise(regions, n, cellMm) {
  if (regions.length === 0) throw new Error('rasterise: no regions');
  if (regions.length > 255) throw new Error('rasterise: more than 255 regions');
  const out = new Uint8Array(n * n);
  const half = Math.trunc(cellMm / 2);
  for (let cy = 0; cy < n; cy += 1) {
    const y = cy * cellMm + half;
    for (let cx = 0; cx < n; cx += 1) {
      const x = cx * cellMm + half;
      let best = regions[0].f(x, y);
      let win = 0;
      for (let i = 1; i < regions.length; i += 1) {
        const v = regions[i].f(x, y);
        if (v > best) { best = v; win = i; }
      }
      out[cy * n + cx] = win;
    }
  }
  return out;
}

























export function rotate180(cells, n, partnerOf) {
  if (n % 2 !== 0) throw new Error('rotate180: an odd grid has a self-partnered row');
  for (let cy = n / 2; cy < n; cy += 1) {
    for (let cx = 0; cx < n; cx += 1) {
      const src = cells[(n - 1 - cy) * n + (n - 1 - cx)];
      const p = partnerOf[src];
      if (p === undefined) throw new Error(`rotate180: region ${src} has no partner`);
      cells[cy * n + cx] = p;
    }
  }
  return cells;
}






export function cellCounts(cells, regionCount) {
  const out = new Array(regionCount).fill(0);
  for (let i = 0; i < cells.length; i += 1) out[cells[i]] += 1;
  return out;
}






















export function pieces(cells, n, region) {
  const seen = new Uint8Array(n * n);
  const out = [];
  const stack = [];
  for (let start = 0; start < n * n; start += 1) {
    if (cells[start] !== region || seen[start]) continue;
    let size = 0;
    
    
    
    
    
    
    const around = new Map();
    seen[start] = 1;
    stack.push(start);
    while (stack.length > 0) {
      const i = stack.pop();
      size += 1;
      const cx = i % n;
      const cy = Math.trunc(i / n);
      const look = (jx, jy) => {
        if (jx < 0 || jy < 0 || jx >= n || jy >= n) return;
        const j = jy * n + jx;
        if (cells[j] !== region) { around.set(cells[j], (around.get(cells[j]) || 0) + 1); return; }
        if (seen[j]) return;
        seen[j] = 1;
        stack.push(j);
      };
      look(cx - 1, cy);
      look(cx + 1, cy);
      look(cx, cy - 1);
      look(cx, cy + 1);
    }
    out.push({
      size,
      
      
      cx: start % n,
      cy: Math.trunc(start / n),
      
      
      around: [...around.keys()]
        .sort((a, b) => (around.get(b) - around.get(a)) || (a - b))
        .map((r) => ({ region: r, edges: around.get(r) })),
    });
  }
  return out;
}


export function pieceCount(cells, n, region) {
  return pieces(cells, n, region).length;
}








export const MAX_SPECK_CELLS = 12;

































export function absorbSpecks(cells, n, regionCount, maxSpeck = MAX_SPECK_CELLS) {
  let moved = 0;
  for (let round = 0; round < 6; round += 1) {
    let movedThisRound = 0;
    for (let r = 0; r < regionCount; r += 1) {
      const parts = pieces(cells, n, r);
      if (parts.length < 2) continue;
      
      let keep = 0;
      for (let i = 1; i < parts.length; i += 1) {
        
        
        if (parts[i].size > parts[keep].size) keep = i;
      }
      for (let i = 0; i < parts.length; i += 1) {
        if (i === keep || parts[i].size > maxSpeck) continue;
        
        
        
        
        const member = [];
        const seen = new Set();
        const stack = [parts[i].cy * n + parts[i].cx];
        seen.add(stack[0]);
        while (stack.length > 0) {
          const idx = stack.pop();
          member.push(idx);
          const cx = idx % n;
          const cy = Math.trunc(idx / n);
          const look = (jx, jy) => {
            if (jx < 0 || jy < 0 || jx >= n || jy >= n) return;
            const j = jy * n + jx;
            if (cells[j] !== r || seen.has(j)) return;
            seen.add(j);
            stack.push(j);
          };
          look(cx - 1, cy); look(cx + 1, cy); look(cx, cy - 1); look(cx, cy + 1);
        }
        
        const touch = new Map();
        for (const idx of member) {
          const cx = idx % n;
          const cy = Math.trunc(idx / n);
          const look = (jx, jy) => {
            if (jx < 0 || jy < 0 || jx >= n || jy >= n) return;
            const other = cells[jy * n + jx];
            if (other === r) return;
            touch.set(other, (touch.get(other) || 0) + 1);
          };
          look(cx - 1, cy); look(cx + 1, cy); look(cx, cy - 1); look(cx, cy + 1);
        }
        if (touch.size === 0) continue;          
        let best = -1;
        let bestCount = -1;
        for (const other of [...touch.keys()].sort((a, b) => a - b)) {
          const c = touch.get(other);
          if (c > bestCount) { bestCount = c; best = other; }
        }
        for (const idx of member) cells[idx] = best;
        moved += member.length;
        movedThisRound += member.length;
      }
    }
    if (movedThisRound === 0) break;
  }
  return moved;
}
