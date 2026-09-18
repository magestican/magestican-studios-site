































import { MeshData } from '../mesh/meshData.mjs';
import { sweep, circleProfile, emit } from '../mesh/bevel.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { SEASONS, linear } from '../palette/seasons.mjs';

export const TIER = 'dressing';



export const SPAN_M = 0.24;




export const WING_COLOURS = Object.freeze({
  spring: Object.freeze(['#ffd8e8', '#cfe4ff', '#fff2b8']),
  summer: Object.freeze(['#ffd45c', '#ffa473', '#a9dcff']),
  autumn: Object.freeze(['#f5a24a', '#f08a5d', '#f4d585']),
  winter: Object.freeze(['#e9f2ff', '#cfe0f2', '#fbfdff']),
});


export function wingColours(season) {
  const hexes = WING_COLOURS[season];
  if (!hexes) throw new Error(`unknown season '${season}'`);
  return hexes.map(linear);
}





const LODS = [
  { sides: 7, rings: 7, caps: 2, radial: 13, wingRings: 2, antennaSides: 4 },
  { sides: 6, rings: 6, caps: 1, radial: 11, wingRings: 2, antennaSides: 3 },
  { sides: 5, rings: 5, caps: 1, radial: 8, wingRings: 1, antennaSides: 0 },
];


const BODY = [
  [0.00, 0.0052], [0.18, 0.0110], [0.38, 0.0098], [0.55, 0.0074],
  [0.72, 0.0145], [0.88, 0.0096], [1.00, 0.0106],
];
const Z_TAIL = -0.060, Z_HEAD = 0.046;




const WING = [
  [78, 0.030], [54, 0.070], [30, 0.101], [10, 0.118], [-6, 0.106],
  [-26, 0.092], [-50, 0.081], [-78, 0.062], [-106, 0.026],
];
const PHI0 = WING[0][0], PHI1 = WING[WING.length - 1][0];

const smoothstep = (u) => { const t = Math.min(1, Math.max(0, u)); return t * t * (3 - 2 * t); };
const norm3 = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };


function along(table, t) {
  if (t <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    if (t <= table[i][0]) {
      const [a, ra] = table[i - 1], [b, rb] = table[i];
      return ra + (rb - ra) * smoothstep((t - a) / (b - a));
    }
  }
  return table[table.length - 1][1];
}


function wingRadius(phi, jitter) {
  if (phi >= WING[0][0]) return WING[0][1] * jitter[0];
  for (let i = 1; i < WING.length; i++) {
    if (phi >= WING[i][0]) {
      const a = WING[i - 1][0], ra = WING[i - 1][1] * jitter[i - 1];
      const b = WING[i][0], rb = WING[i][1] * jitter[i];
      return ra + (rb - ra) * smoothstep((phi - a) / (b - a));
    }
  }
  return WING[WING.length - 1][1] * jitter[WING.length - 1];
}








function wingInto(mesh, { side, rng, lod, tint, edge }) {
  const L = LODS[lod];
  const jitter = WING.map(() => rng.rangeF(0.93, 1.07));
  const camber = rng.rangeF(0.008, 0.013);
  const hub = [side * 0.006, 0.0, 0.004];
  
  const spotPhi = rng.rangeF(-4, 40), spotF = rng.rangeF(0.56, 0.78), spotR = rng.rangeF(0.16, 0.26);

  const shade = (phi, f) => {
    
    
    let v = 0.55 + 0.45 * smoothstep((f - 0.12) / 0.38);
    if (f > 0.84) v *= 0.68;
    const d = Math.hypot((phi - spotPhi) / 60, f - spotF);
    if (d < spotR) v *= 0.45 + 0.55 * smoothstep((d / spotR - 0.45) / 0.55);
    return v;
  };
  const colourAt = (phi, f) => {
    const v = shade(phi, f);
    const t = Math.min(1, Math.max(0, (f - 0.6) / 0.4));
    return [0, 1, 2].map((k) => (tint[k] + (edge[k] - tint[k]) * t) * v);
  };

  const hubIdx = mesh.vertex('petal', hub, [0, 1, 0], colourAt(0, 0), [0.5, 0.5]);
  const grid = [];
  for (let k = 1; k <= L.wingRings; k++) {
    const f = k / L.wingRings;
    const row = [];
    for (let i = 0; i < L.radial; i++) {
      const phi = PHI0 + (PHI1 - PHI0) * (i / (L.radial - 1));
      const r = wingRadius(phi, jitter) * f;
      const a = (phi * Math.PI) / 180;
      const x = hub[0] + side * r * Math.cos(a);
      const z = hub[2] + r * Math.sin(a);
      const y = hub[1] + camber * Math.sin(Math.PI * f);
      const n = norm3([(x - hub[0]) * 2.2, 1, (z - hub[2]) * 2.2]);
      row.push(mesh.vertex('petal', [x, y, z], n, colourAt(phi, f), [0.5 + x * 3, 0.5 + z * 3]));
    }
    grid.push(row);
  }
  
  
  const front = side > 0;
  const tri = (a, b, c) => (front ? mesh.tri('petal', a, b, c) : mesh.tri('petal', a, c, b));
  for (let i = 0; i + 1 < L.radial; i++) tri(hubIdx, grid[0][i + 1], grid[0][i]);
  for (let k = 0; k + 1 < grid.length; k++) {
    for (let i = 0; i + 1 < L.radial; i++) {
      tri(grid[k][i], grid[k][i + 1], grid[k + 1][i + 1]);
      tri(grid[k][i], grid[k + 1][i + 1], grid[k + 1][i]);
    }
  }
  return mesh;
}


function bodyInto(mesh, { rng, lod, tint }) {
  const L = LODS[lod];
  const droop = rng.rangeF(0.004, 0.008);
  const fat = rng.rangeF(0.94, 1.08);
  const path = [];
  for (let i = 0; i < L.rings; i++) {
    const t = i / (L.rings - 1);
    path.push([0, -droop * (1 - t) ** 1.6, Z_TAIL + (Z_HEAD - Z_TAIL) * t]);
  }
  const radius = (i) => along(BODY, i / (L.rings - 1)) * fat;
  const thoraxTop = along(BODY, 0.72) * fat;
  const body = sweep({
    profile: circleProfile(1, L.sides),
    path,
    scales: (_, i) => radius(i),
    caps: 'round',
    capSegments: L.caps,
    capLength: 0.006,
  });
  
  
  emit(mesh, 'fur', body, {
    matrix: [1, 0, 0, 0, 0, 1, 0, -thoraxTop, 0, 0, 1, 0],
    color: (p) => {
      const z = p[2];
      const band = z < 0.002 ? 0.62 + 0.38 * (Math.sin(z * 190) > 0 ? 1 : 0) : 1;
      const v = 0.34 * band + (z > 0.03 ? 0.1 : 0);
      return [tint[0] * v, tint[1] * v, tint[2] * v];
    },
  });
  if (!L.antennaSides) return mesh;
  for (const side of [1, -1]) {
    const reach = rng.rangeF(0.030, 0.040);
    const out = rng.rangeF(0.013, 0.022) * side;
    const rise = rng.rangeF(0.024, 0.034);
    const stalk = sweep({
      profile: circleProfile(1, L.antennaSides),
      path: [
        [side * 0.004, 0.004 - thoraxTop, 0.042],
        [out * 0.55, 0.004 + rise * 0.55 - thoraxTop, 0.042 + reach * 0.55],
        [out, 0.004 + rise - thoraxTop, 0.042 + reach],
      ],
      scales: (t) => 0.0016 + 0.0020 * t * t,
      caps: ['none', 'round'],
      capSegments: 1,
      capLength: 0.0032,
    });
    emit(mesh, 'fur', stalk, { color: [tint[0] * 0.3, tint[1] * 0.3, tint[2] * 0.3] });
  }
  return mesh;
}

function rngFor(seed, season) {
  const s = SEASONS.indexOf(season);
  if (s < 0) throw new Error(`unknown season '${season}'`);
  return new SeededRng(((seed >>> 0) * 7919 + s * 1301 + 29) >>> 0 || 1);
}







export function parts({ seed = 1, season = 'summer', lod = 0, tint = [1, 1, 1], edge = tint } = {}) {
  if (!LODS[lod]) throw new Error(`unknown lod ${lod}`);
  const rng = rngFor(seed, season);
  const body = bodyInto(new MeshData(`insect-body-${seed}`), { rng: rng.child('body'), lod, tint });
  
  
  const wingR = wingInto(new MeshData(`insect-wing-r-${seed}`), { side: 1, rng: rng.child('wing-right'), lod, tint, edge });
  const wingL = wingInto(new MeshData(`insect-wing-l-${seed}`), { side: -1, rng: rng.child('wing-left'), lod, tint, edge });
  return { body, wingR, wingL };
}





export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  
  
  
  
  const [main, second, third] = wingColours(season);
  const pick = rngFor(seed, season).child('wear');
  const tint = pick.chance(0.5) ? main : second;
  const mesh = new MeshData(`insect-${seed}-${season}-${lod}`);
  const p = parts({ seed, season, lod, tint, edge: third });
  const lift = -Math.min(p.body.bounds().min[1], p.wingR.bounds().min[1], p.wingL.bounds().min[1]);
  const up = [1, 0, 0, 0, 0, 1, 0, lift, 0, 0, 1, 0];
  mesh.append(p.body, up);
  mesh.append(p.wingR, up);
  mesh.append(p.wingL, up);
  return mesh;
}
