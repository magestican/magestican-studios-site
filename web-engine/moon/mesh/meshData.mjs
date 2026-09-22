


















export const MATERIALS = Object.freeze([
  'bark', 'leaf', 'blossom', 'fruit', 'snow',
  'fur', 'eye', 'cloth',
  'wood', 'plank', 'roof', 'stone', 'metal',
  'glass', 'lamp-glow', 'fire',
  'grass', 'soil', 'petal',
  
  
  
  'bottle', 'gold', 'gem', 'paper',
  
  
  
  'canvas', 'copper',
  
  
  'skin',
  
  
  
  'water',
]);























export const NO_SHADOW_MATERIALS = Object.freeze(['glass', 'lamp-glow', 'fire', 'water']);

export class MeshData {
  constructor(name) {
    this.name = name;
    this.groups = new Map();
    this.rig = null;
  }

  group(material) {
    if (!MATERIALS.includes(material)) throw new Error(`unknown material '${material}' in ${this.name}`);
    let g = this.groups.get(material);
    if (!g) {
      g = { material, positions: [], normals: [], colors: [], uvs: [], indices: [] };
      this.groups.set(material, g);
    }
    return g;
  }

  
  
  
  
  
  
  
  
  
  
  
  
  
  vertex(material, p, n, c = [1, 1, 1], uv = [0, 0], ripple = 0) {
    const g = this.group(material);
    const i = g.positions.length / 3;
    if (ripple || g.ripples) {
      const out = (g.ripples ||= new Array(i).fill(0));
      out.push(ripple);
    }
    g.positions.push(p[0], p[1], p[2]);
    g.normals.push(n[0], n[1], n[2]);
    g.colors.push(c[0], c[1], c[2]);
    g.uvs.push(uv[0], uv[1]);
    return i;
  }

  tri(material, a, b, c) {
    this.group(material).indices.push(a, b, c);
  }

  
  
  append(other, m = IDENTITY) {
    const nm = normalMatrix(m);
    for (const src of other.groups.values()) {
      const g = this.group(src.material);
      const base = g.positions.length / 3;
      for (let i = 0; i < src.positions.length; i += 3) {
        const x = src.positions[i], y = src.positions[i + 1], z = src.positions[i + 2];
        g.positions.push(
          m[0] * x + m[1] * y + m[2] * z + m[3],
          m[4] * x + m[5] * y + m[6] * z + m[7],
          m[8] * x + m[9] * y + m[10] * z + m[11],
        );
        const nx = src.normals[i], ny = src.normals[i + 1], nz = src.normals[i + 2];
        const tx = nm[0] * nx + nm[1] * ny + nm[2] * nz;
        const ty = nm[3] * nx + nm[4] * ny + nm[5] * nz;
        const tz = nm[6] * nx + nm[7] * ny + nm[8] * nz;
        const len = Math.hypot(tx, ty, tz) || 1;
        g.normals.push(tx / len, ty / len, tz / len);
      }
      g.colors.push(...src.colors);
      g.uvs.push(...src.uvs);
      for (const idx of src.indices) g.indices.push(base + idx);
      
      
      
      
      
      if (src.sways || g.sways) {
        const out = (g.sways ||= new Array(base).fill(0));
        if (src.sways) for (const v of src.sways) out.push(v);
        else for (let i = 0; i < src.positions.length / 3; i++) out.push(0);
      }
      
      
      
      
      if (src.ripples || g.ripples) {
        const out = (g.ripples ||= new Array(base).fill(0));
        if (src.ripples) for (const v of src.ripples) out.push(v);
        else for (let i = 0; i < src.positions.length / 3; i++) out.push(0);
      }
      
      
      
      for (const key of ['skinIndices', 'skinWeights']) {
        if (!src[key]) continue;
        const out = (g[key] ||= []);
        for (const v of src[key]) out.push(v);
      }
    }
    return this;
  }

  
  
  
  
  
  
  
  
  
  
  
  sway({ perMetre = 0.02, power = 1.5 } = {}) {
    const { min, max } = this.bounds();
    const height = max[1] - min[1];
    if (!(height > 0)) return this;
    const amp = perMetre * height;
    for (const g of this.groups.values()) {
      const out = new Array(g.positions.length / 3);
      for (let i = 0, j = 0; i < g.positions.length; i += 3, j++) {
        const t = Math.min(1, Math.max(0, (g.positions[i + 1] - min[1]) / height));
        out[j] = Math.round(amp * t ** power * 1e5) / 1e5;
      }
      g.sways = out;
    }
    return this;
  }

  get triangleCount() {
    let t = 0;
    for (const g of this.groups.values()) t += g.indices.length / 3;
    return t;
  }

  get vertexCount() {
    let v = 0;
    for (const g of this.groups.values()) v += g.positions.length / 3;
    return v;
  }

  bounds() {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (const g of this.groups.values()) {
      for (let i = 0; i < g.positions.length; i += 3) {
        for (let k = 0; k < 3; k++) {
          const v = g.positions[i + k];
          if (v < min[k]) min[k] = v;
          if (v > max[k]) max[k] = v;
        }
      }
    }
    return { min, max };
  }

  
  validate() {
    const problems = [];
    for (const g of this.groups.values()) {
      const where = `${this.name}/${g.material}`;
      const vcount = g.positions.length / 3;
      if (g.normals.length !== g.positions.length || g.colors.length !== g.positions.length || g.uvs.length !== vcount * 2
        || (g.sways && g.sways.length !== vcount) || (g.ripples && g.ripples.length !== vcount)) {
        problems.push(`${where}: attribute lengths disagree`);
      }
      if (g.indices.length % 3 !== 0) problems.push(`${where}: index count not a multiple of 3`);
      for (const arr of [g.positions, g.normals, g.colors, g.uvs]) {
        if (arr.some((v) => !Number.isFinite(v))) { problems.push(`${where}: non-finite attribute`); break; }
      }
      if (g.indices.some((i) => i < 0 || i >= vcount || !Number.isInteger(i))) problems.push(`${where}: index out of range`);
      for (let i = 0; i < g.normals.length; i += 3) {
        const len = Math.hypot(g.normals[i], g.normals[i + 1], g.normals[i + 2]);
        if (Math.abs(len - 1) > 0.01) { problems.push(`${where}: normal not unit length at vertex ${i / 3}`); break; }
      }
      for (let i = 0; i < g.indices.length; i += 3) {
        const a = g.indices[i], b = g.indices[i + 1], c = g.indices[i + 2];
        if (a === b || b === c || a === c) { problems.push(`${where}: degenerate triangle at ${i / 3}`); break; }
      }
      if (g.skinIndices || g.skinWeights) problems.push(...this.#skinProblems(g, where, vcount));
      else if (this.rig) problems.push(`${where}: no skin attributes on a rigged mesh`);
    }
    if (this.rig) {
      const bones = this.rig.bones || [];
      if (!bones.length) problems.push(`${this.name}: rig has no bones`);
      bones.forEach((b, i) => {
        
        if (!(b.parent === -1 || (Number.isInteger(b.parent) && b.parent >= 0 && b.parent < i))) problems.push(`${this.name}: bone ${b.name} has parent ${b.parent}`);
        if (!Array.isArray(b.head) || b.head.length !== 3 || !b.head.every(Number.isFinite)) problems.push(`${this.name}: bone ${b.name} has no finite head`);
      });
    }
    return problems;
  }

  
  
  #skinProblems(g, where, vcount) {
    const si = g.skinIndices, sw = g.skinWeights;
    if (!si || !sw || si.length !== vcount * 4 || sw.length !== vcount * 4) return [`${where}: skin attribute lengths disagree`];
    const bones = this.rig && this.rig.bones ? this.rig.bones.length : 0;
    if (!bones) return [`${where}: skin attributes without a rig`];
    const problems = [];
    for (let v = 0; v < vcount; v++) {
      let sum = 0;
      for (let k = v * 4; k < v * 4 + 4; k++) {
        const w = sw[k], i = si[k];
        if (!Number.isFinite(w) || w < 0) { problems.push(`${where}: skin weight ${w} at vertex ${v}`); return problems; }
        if (!Number.isInteger(i) || i < 0 || i >= bones) { problems.push(`${where}: skin index ${i} out of range at vertex ${v}`); return problems; }
        sum += w;
      }
      if (Math.abs(sum - 1) > 1e-3) { problems.push(`${where}: skin weights sum to ${sum} at vertex ${v}`); return problems; }
    }
    return problems;
  }

  toArrays() {
    return {
      name: this.name,
      triangles: this.triangleCount,
      groups: [...this.groups.values()].map((g) => {
        const out = {
          material: g.material,
          position: Float32Array.from(g.positions),
          normal: Float32Array.from(g.normals),
          color: Float32Array.from(g.colors),
          uv: Float32Array.from(g.uvs),
          index: Uint32Array.from(g.indices),
        };
        
        if (g.skinIndices) out.skinIndex = Uint16Array.from(g.skinIndices);
        if (g.skinWeights) out.skinWeight = Float32Array.from(g.skinWeights);
        
        
        if (g.sways) out.sway = Float32Array.from(g.sways);
        
        if (g.ripples) out.ripple = Float32Array.from(g.ripples);
        return out;
      }),
    };
  }
}

export const IDENTITY = Object.freeze([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0]);

export function translate(x, y, z) {
  return [1, 0, 0, x, 0, 1, 0, y, 0, 0, 1, z];
}

export function scale(sx, sy = sx, sz = sx) {
  return [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0];
}

export function rotateY(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [c, 0, s, 0, 0, 1, 0, 0, -s, 0, c, 0];
}

export function rotateX(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [1, 0, 0, 0, 0, c, -s, 0, 0, s, c, 0];
}

export function rotateZ(a) {
  const c = Math.cos(a), s = Math.sin(a);
  return [c, -s, 0, 0, s, c, 0, 0, 0, 0, 1, 0];
}


export function compose(a, b) {
  const r = new Array(12);
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      let v = 0;
      for (let k = 0; k < 3; k++) v += a[row * 4 + k] * b[k * 4 + col];
      if (col === 3) v += a[row * 4 + 3];
      r[row * 4 + col] = v;
    }
  }
  return r;
}

function normalMatrix(m) {
  const a = m[0], b = m[1], c = m[2];
  const d = m[4], e = m[5], f = m[6];
  const g = m[8], h = m[9], i = m[10];
  const A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g;
  const det = a * A + b * B + c * C || 1;
  
  return [
    A / det, B / det, C / det,
    -(b * i - c * h) / det, (a * i - c * g) / det, -(a * h - b * g) / det,
    (b * f - c * e) / det, -(a * f - c * d) / det, (a * e - b * d) / det,
  ];
}
