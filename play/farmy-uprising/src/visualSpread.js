












































export const MAX_PUSH = 0.85;


export const PASSES = 6;


const STIFF = 0.32;


const SPRING_PER_SEC = 6.0;









const TOUCH = 0.92;










export function createVisualSpread() {
  
  const offsets = new Map();
  
  let seen = new Set();

  




  function step(bodies, dt) {
    const n = bodies.length;
    seen = new Set();

    
    
    
    
    const px = new Float64Array(n);
    const py = new Float64Array(n);
    const dx = new Float64Array(n);
    const dy = new Float64Array(n);
    for (let i = 0; i < n; i += 1) {
      const o = offsets.get(bodies[i].id);
      px[i] = bodies[i].x + (o ? o[0] : 0);
      py[i] = bodies[i].y + (o ? o[1] : 0);
      seen.add(bodies[i].id);
    }

    
    
    
    let widest = 1;
    for (let i = 0; i < n; i += 1) if (bodies[i].r > widest) widest = bodies[i].r;
    const cell = widest * 2;

    for (let pass = 0; pass < PASSES; pass += 1) {
      const grid = new Map();
      for (let i = 0; i < n; i += 1) {
        const key = `${Math.floor(px[i] / cell)},${Math.floor(py[i] / cell)}`;
        let b = grid.get(key);
        if (!b) { b = []; grid.set(key, b); }
        b.push(i);
      }
      for (let i = 0; i < n; i += 1) { dx[i] = 0; dy[i] = 0; }

      for (let i = 0; i < n; i += 1) {
        const gx = Math.floor(px[i] / cell);
        const gy = Math.floor(py[i] / cell);
        for (let ox = -1; ox <= 1; ox += 1) {
          for (let oy = -1; oy <= 1; oy += 1) {
            const b = grid.get(`${gx + ox},${gy + oy}`);
            if (!b) continue;
            for (let k = 0; k < b.length; k += 1) {
              const j = b[k];
              if (j <= i) continue;
              const want = (bodies[i].r + bodies[j].r) * TOUCH;
              let ax = px[j] - px[i];
              let ay = py[j] - py[i];
              let d = Math.hypot(ax, ay);
              if (d >= want) continue;
              if (d < 1e-6) {
                
                
                
                
                
                
                const a = ((bodies[i].id * 2654435761) % 6283) / 1000;
                ax = Math.cos(a); ay = Math.sin(a); d = 1;
              }
              const push = ((want - d) / d) * STIFF * 0.5;
              dx[i] -= ax * push; dy[i] -= ay * push;
              dx[j] += ax * push; dy[j] += ay * push;
            }
          }
        }
      }
      for (let i = 0; i < n; i += 1) { px[i] += dx[i]; py[i] += dy[i]; }
    }

    
    const decay = Math.exp(-SPRING_PER_SEC * Math.max(0, dt));
    for (let i = 0; i < n; i += 1) {
      let ox = px[i] - bodies[i].x;
      let oy = py[i] - bodies[i].y;
      const cap = bodies[i].r * MAX_PUSH;
      const len = Math.hypot(ox, oy);
      if (len > cap && len > 0) { ox = (ox / len) * cap; oy = (oy / len) * cap; }
      
      
      
      if (dx[i] === 0 && dy[i] === 0) { ox *= decay; oy *= decay; }
      if (Math.abs(ox) < 0.01 && Math.abs(oy) < 0.01) offsets.delete(bodies[i].id);
      else offsets.set(bodies[i].id, [ox, oy]);
    }

    
    
    
    for (const id of [...offsets.keys()]) if (!seen.has(id)) offsets.delete(id);
  }

  return {
    step,
    
    offsetOf(id) { return offsets.get(id) || ZERO; },
    get tracked() { return offsets.size; },
    reset() { offsets.clear(); },
  };
}

const ZERO = Object.freeze([0, 0]);
