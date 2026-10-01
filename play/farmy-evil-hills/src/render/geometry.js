








import * as THREE from 'three';









export function partsToGeometry(parts, colourOf, targetHeight, measureAgainst, keepUv) {
  let lo = Infinity; let hi = -Infinity;
  
  
  
  
  for (const p of (measureAgainst || parts)) {
    for (let i = 2; i < p.mesh.positions.length; i += 3) {
      if (p.mesh.positions[i] < lo) lo = p.mesh.positions[i];
      if (p.mesh.positions[i] > hi) hi = p.mesh.positions[i];
    }
  }
  const s = (hi - lo) > 1e-6 ? targetHeight / (hi - lo) : 1;

  const pos = []; const col = []; const idx = [];
  
  
  
  const seen = new Map();
  const colourAt = (hex) => {
    let c = seen.get(hex);
    if (!c) { c = new THREE.Color(hex); seen.set(hex, c); }
    return c;
  };
  
  
  
  
  
  
  const ranges = [];
  for (const p of parts) {
    const base = pos.length / 3;
    ranges.push({ name: p.name, start: base, count: p.mesh.positions.length / 3 });
    
    
    
    
    
    
    
    
    
    
    const per = colourOf(p.name);
    const fn = typeof per === 'function' ? per : null;
    const flat = fn ? null : colourAt(per);
    for (let i = 0; i < p.mesh.positions.length; i += 3) {
      const bx = p.mesh.positions[i];
      const by = p.mesh.positions[i + 1];
      const bz = (p.mesh.positions[i + 2] - lo) / ((hi - lo) || 1);
      pos.push(
        bx * s,
        by * s,
        (p.mesh.positions[i + 2] - lo) * s,   
      );
      const c = fn ? colourAt(fn(bx, by, bz)) : flat;
      col.push(c.r, c.g, c.b);
    }
    for (const i of p.mesh.indices) idx.push(base + i);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aColor', new THREE.Float32BufferAttribute(col, 3));
  
  
  if (keepUv) {
    const uvs = [];
    for (const p of parts) {
      const src = p.mesh.uvs || [];
      for (let i = 0; i < (p.mesh.positions.length / 3) * 2; i += 1) uvs.push(src[i] ?? 0);
    }
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  } else {
    g.setAttribute('uv', new THREE.Float32BufferAttribute(new Array((pos.length / 3) * 2).fill(0), 2));
  }
  g.setIndex(idx);
  g.computeVertexNormals();
  g.userData.parts = ranges;
  return g;
}
