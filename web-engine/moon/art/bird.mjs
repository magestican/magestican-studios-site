































import { MeshData, IDENTITY, compose, translate, rotateY, rotateZ } from '../mesh/meshData.mjs';
import { sweep, lathe, emit, circleProfile, transform } from '../mesh/bevel.mjs';
import { SeededRng } from '../../rng/seededRng.js';
import { hex, vc, mixC } from './kit/shade.mjs';

export const TIER = 'dressing';


export const BIRD_HEIGHT_M = 0.35;
export const BIRD_LENGTH_M = 0.42;




export const SPECIES = Object.freeze([
  { name: 'robin', back: '#8d9bb8', breast: '#f2936d', cheek: '#ffe6cf', beak: '#3f3a46', crest: 0, tail: 1 },
  { name: 'bluebird', back: '#6fa8d8', breast: '#ffd9a8', cheek: '#cfe8f7', beak: '#33313f', crest: 0.5, tail: 1.1 },
  { name: 'finch', back: '#d9c05a', breast: '#fff0b8', cheek: '#fff8e0', beak: '#c98b4a', crest: 0, tail: 0.85 },
  { name: 'wren', back: '#b58a63', breast: '#f3ddc0', cheek: '#ffeeda', beak: '#5a4636', crest: 0, tail: 1.35 },
  { name: 'tit', back: '#9fc48a', breast: '#fff5d6', cheek: '#ffffff', beak: '#3a3a44', crest: 0.8, tail: 0.9 },
]);

const INK = hex('#1d1b2e');
const HIGHLIGHT = hex('#fff8ec');


export function species(seed = 1) {
  const n = SPECIES.length;
  return SPECIES[((((seed | 0) - 1) % n) + n) % n];
}











const LODS = [
  { sides: 8, rings: 6, eye: 4, bodySegs: 5, crest: true, feet: true, legSegs: 3, tailSegs: 3, wingSides: 6, wingCaps: 'round' },
  { sides: 6, rings: 4, eye: 3, bodySegs: 5, crest: true, feet: true, legSegs: 3, tailSegs: 2, wingSides: 5, wingCaps: 'round' },
  { sides: 4, rings: 2, eye: 0, bodySegs: 3, crest: false, feet: false, legSegs: 2, tailSegs: 1, wingSides: 4, wingCaps: 'none' },
];




const fluffFor = (season) => (season === 'winter' ? 1.1 : season === 'autumn' ? 1.03 : 1);










export function parts({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const L = LODS[Math.max(0, Math.min(2, lod | 0))];
  const sp = species(seed);
  const rng = new SeededRng((seed | 0) * 9721 + 43).child('bird');
  const fluff = fluffFor(season);
  
  const plump = rng.rangeF(0.96, 1.06) * fluff;

  const back = hex(sp.back), breast = hex(sp.breast), cheek = hex(sp.cheek), beakC = hex(sp.beak);

  const bodyR = 0.082 * plump;
  const bodyY = 0.172;
  const headR = 0.065 * (0.98 + (fluff - 1) * 0.6);
  const headC = [0, 0.272, 0.062];

  const body = new MeshData(`bird-${sp.name}-body`);

  
  
  const path = L.bodySegs === 5
    ? [
      [0, bodyY - 0.012, -0.112],
      [0, bodyY - 0.004, -0.062],
      [0, bodyY, -0.012],
      [0, bodyY + 0.004, 0.042],
      [0, bodyY + 0.012, 0.086],
    ]
    : [[0, bodyY - 0.012, -0.112], [0, bodyY, -0.012], [0, bodyY + 0.012, 0.086]];
  const scales = L.bodySegs === 5 ? [0.34, 0.82, 1, 0.94, 0.62] : [0.34, 1, 0.62];
  const shell = sweep({
    profile: circleProfile(bodyR, L.sides, Math.PI / L.sides, bodyR * 0.94),
    path,
    up: [0, 1, 0],
    caps: 'round',
    capSegments: L.sides > 4 ? 1 : 0,
    capLength: bodyR * 0.7,
    scales: (t, i) => scales[i],
  });
  
  
  const bodyPaint = (base) => vc(base, { groundAO: 0.18, groundFade: 0.12, underside: 0.3, mottle: 0.05, seed });
  emit(body, 'petal', shell, {
    matrix: IDENTITY,
    color: (p, n) => {
      const under = clamp01((bodyY + bodyR * 0.5 - p[1]) / (bodyR * 1.25));
      const front = clamp01((p[2] + 0.06) / 0.14);
      return bodyPaint(mixC(back, breast, Math.min(1, under * 0.75 + front * 0.45)))(p, n);
    },
  });

  
  
  const headPts = [];
  for (let k = 0; k <= L.rings; k++) {
    const a = Math.PI * (k / L.rings);
    headPts.push([Math.sin(a) * headR, headC[1] - Math.cos(a) * headR * 1.04]);
  }
  const head = transform(lathe({ points: headPts, sides: L.sides, phase: 0.5 }), translate(headC[0], 0, headC[2]));
  emit(body, 'petal', head, {
    matrix: IDENTITY,
    color: (p, n) => {
      const side = clamp01(Math.abs(p[0]) / (headR * 0.8));
      const low = clamp01((headC[1] + headR * 0.2 - p[1]) / (headR * 1.1));
      return vc(mixC(back, cheek, Math.min(1, side * 0.55 + low * 0.6)), { groundAO: 0, underside: 0.28, mottle: 0.04, seed })(p, n);
    },
  });

  
  const beak = sweep({
    profile: circleProfile(0.021, Math.max(4, L.sides - 2), 0, 0.016),
    path: [[0, headC[1] - 0.004, headC[2] + headR * 0.7], [0, headC[1] - 0.014, headC[2] + headR * 0.7 + 0.056]],
    up: [0, 1, 0],
    caps: 'none',
    scales: (t) => 1 - t * 0.88,
  });
  emit(body, 'petal', beak, { matrix: IDENTITY, color: vc(beakC, { groundAO: 0, underside: 0.2, mottle: 0 }) });

  
  
  const EYE_R = 0.0165;
  for (const sx of [-1, 1]) {
    const at = [sx * headR * 0.74, headC[1] + headR * 0.2, headC[2] + headR * 0.5];
    const ink = vc(INK, { groundAO: 0, underside: 0.1, mottle: 0 });
    if (L.eye === 0) {
      eyeDisc(body, at, [sx * 0.62, 0.12, 0.78], EYE_R);
      continue;
    }
    const eyePts = [];
    for (let k = 0; k <= L.eye; k++) {
      const a = Math.PI * (k / L.eye);
      eyePts.push([Math.sin(a) * EYE_R, -Math.cos(a) * EYE_R]);
    }
    const eye = transform(lathe({ points: eyePts, sides: Math.max(4, L.eye + 2) }), translate(at[0], at[1], at[2]));
    emit(body, 'eye', eye, {
      matrix: IDENTITY,
      color: (p, n) => ((p[1] > at[1] + 0.005 && p[2] > at[2] - 0.001) ? HIGHLIGHT : ink(p, n)),
    });
  }

  
  const fan = sp.tail;
  const tailPath = [[0, bodyY - 0.014, -0.116]];
  for (let k = 1; k <= L.tailSegs; k++) {
    const t = k / L.tailSegs;
    tailPath.push([0, bodyY - 0.014 + t * 0.056 * fan, -0.116 - t * 0.124 * fan]);
  }
  const tail = sweep({
    profile: circleProfile(0.054, Math.max(4, L.sides - 2), 0, 0.011),
    path: tailPath,
    up: [0, 1, 0],
    caps: 'none',
    scales: (t) => 0.55 + t * 0.75,
  });
  emit(body, 'petal', tail, { matrix: IDENTITY, color: vc(mixC(back, INK, 0.25), { groundAO: 0, underside: 0.3, mottle: 0.05, seed }) });

  
  if (L.crest && sp.crest > 0) {
    const h = 0.052 * sp.crest;
    const crest = sweep({
      profile: circleProfile(0.017, 4, 0, 0.007),
      path: [[0, headC[1] + headR * 0.8, headC[2] - 0.004], [0, headC[1] + headR * 0.86 + h, headC[2] - 0.03 - h * 0.5]],
      up: [0, 1, 0],
      caps: 'none',
      scales: (t) => 1 - t * 0.7,
    });
    emit(body, 'petal', crest, { matrix: IDENTITY, color: vc(mixC(back, INK, 0.15), { groundAO: 0, underside: 0.2, mottle: 0 }) });
  }

  
  
  
  const legPaint = vc(beakC, { groundAO: 0.25, groundFade: 0.06, underside: 0.2, mottle: 0 });
  for (const sx of [-1, 1]) {
    const x = sx * 0.036;
    const legPath = L.legSegs === 3
      ? [[x, 0.004, 0.012], [x, 0.05, 0.008], [x, bodyY - bodyR * 0.55, -0.004]]
      : [[x, 0.004, 0.012], [x, bodyY - bodyR * 0.55, -0.004]];
    const leg = sweep({
      profile: circleProfile(0.0105, L.legSegs === 3 ? 4 : 3, 0, 0.0105),
      path: legPath,
      up: [0, 0, 1],
      caps: 'none',
      scales: (t) => 1 - t * 0.15,
    });
    emit(body, 'petal', leg, { matrix: IDENTITY, color: legPaint });
    if (!L.feet) continue;
    const foot = sweep({
      profile: circleProfile(0.009, 4, 0, 0.006),
      path: [[x, 0.006, -0.026], [x, 0.004, 0.006], [x, 0.004, 0.038]],
      up: [0, 1, 0],
      caps: 'none',
      scales: 1,
    });
    emit(body, 'petal', foot, { matrix: IDENTITY, color: legPaint });
  }

  
  
  
  const wing = new MeshData(`bird-${sp.name}-wing`);
  const span = 0.155, chord = 0.086;
  const wingShape = sweep({
    profile: circleProfile(chord / 2, L.wingSides, Math.PI / 2, 0.013),
    path: [[0, 0, 0], [span * 0.45, 0.004, 0], [span * 0.82, 0.002, 0], [span, -0.007, 0]],
    up: [0, 0, 1],
    caps: L.wingCaps,
    capSegments: 0,
    capLength: 0.013,
    scales: (t) => 1 - 0.55 * t * t,
  });
  emit(wing, 'petal', wingShape, {
    matrix: IDENTITY,
    color: (p, n) => {
      
      
      const tip = clamp01((p[0] - span * 0.4) / (span * 0.6));
      return vc(mixC(back, INK, 0.12 + tip * 0.3), { groundAO: 0, underside: 0.35, mottle: 0.05, seed })(p, n);
    },
  });

  return { body, wing, shoulder: [0.054 * plump, bodyY + 0.024, 0.006], species: sp };
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));






function eyeDisc(mesh, at, n, r) {
  const len = Math.hypot(n[0], n[1], n[2]) || 1;
  const d = [n[0] / len, n[1] / len, n[2] / len];
  
  const upish = Math.abs(d[1]) > 0.9 ? [1, 0, 0] : [0, 1, 0];
  const bx = [
    upish[1] * d[2] - upish[2] * d[1],
    upish[2] * d[0] - upish[0] * d[2],
    upish[0] * d[1] - upish[1] * d[0],
  ];
  const bl = Math.hypot(bx[0], bx[1], bx[2]) || 1;
  const u = [bx[0] / bl, bx[1] / bl, bx[2] / bl];
  const v = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
  const c = [at[0] + d[0] * r * 0.55, at[1] + d[1] * r * 0.55, at[2] + d[2] * r * 0.55];
  const corner = (su, sv) => [c[0] + u[0] * r * su + v[0] * r * sv, c[1] + u[1] * r * su + v[1] * r * sv, c[2] + u[2] * r * su + v[2] * r * sv];
  const a = mesh.vertex('eye', corner(-1, -1), d, INK);
  const b = mesh.vertex('eye', corner(1, -1), d, INK);
  const cc = mesh.vertex('eye', corner(1, 1), d, INK);
  const e = mesh.vertex('eye', corner(-1, 1), d, INK);
  mesh.tri('eye', a, b, cc);
  mesh.tri('eye', a, cc, e);
}





export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const p = parts({ seed, season, lod });
  const mesh = new MeshData(`bird-${seed}-${season}-lod${lod}`);
  mesh.append(p.body, IDENTITY);
  const [sx, sy, sz] = p.shoulder;
  
  for (const side of [-1, 1]) {
    const at = compose(
      translate(side * sx, sy, sz),
      compose(rotateY(side > 0 ? -1.94 : Math.PI + 1.94), rotateZ(side > 0 ? -0.22 : 0.22)),
    );
    mesh.append(p.wing, at);
  }
  return mesh;
}
