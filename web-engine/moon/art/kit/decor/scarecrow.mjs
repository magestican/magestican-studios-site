






































import { MeshData, IDENTITY, compose, translate, rotateY, rotateZ } from '../../../mesh/meshData.mjs';
import { emit, sweep, blob, lathe, superellipseProfile } from '../../../mesh/bevel.mjs';
import { SeededRng } from '../../../../rng/seededRng.js';
import { seasonPalette } from '../../../palette/seasons.mjs';
import { hex, vc, vary, mixC, paintVertex } from '../shade.mjs';
import { rod } from '../rod.mjs';









export function hatProfile(brim, crown, tall) {
  return [
    [0.0, 0],
    [crown * 0.72, 0.004],
    [brim * 0.78, 0.012],
    [brim, 0.028],
    [brim * 0.86, 0.042],
    [crown * 1.04, 0.05],
    [crown, 0.05 + tall * 0.34],
    [crown * 0.93, 0.05 + tall * 0.74],
    [crown * 0.58, 0.05 + tall],
    [0.0, 0.05 + tall * 1.08],
  ];
}

export const TIER = 'dressing';
export const LODS = [0, 1, 2];

const STYLES = [
  {
    H: 1.62, postW: 0.075, hem: 0.4, waist: 0.58, collar: 0.79,
    chest: 0.16, depth: 0.11, arm: [0.44, 0.35], armDrop: [0.02, 0.13], hat: { brim: 0.23, crown: 0.115, tall: 0.1 },
    cloth: '#e7d8b6', trim: '#a8825c', head: '#ead9b2', post: '#9c7248', tufts: [4, 2],
  },
  {
    H: 1.42, postW: 0.088, hem: 0.36, waist: 0.55, collar: 0.78,
    chest: 0.18, depth: 0.125, arm: [0.33, 0.4], armDrop: [0.15, 0.2], hat: { brim: 0.155, crown: 0.125, tall: 0.05 },
    cloth: '#a9b6c6', trim: '#c98b7a', head: '#e3d3ab', post: '#8a6a4a', tufts: [2, 3],
  },
  {
    H: 1.84, postW: 0.062, hem: 0.28, waist: 0.52, collar: 0.8,
    chest: 0.145, depth: 0.1, arm: [0.48, 0.38], armDrop: [0.06, 0.02], hat: { brim: 0.185, crown: 0.09, tall: 0.17 },
    cloth: '#c4826a', trim: '#6f6a74', head: '#dfcfa6', post: '#6f5c46', tufts: [3, 1],
  },
];

export function generate({ seed = 1, season = 'summer', lod = 0 } = {}) {
  const detail = Math.max(0, Math.min(2, lod | 0));
  const rng = new SeededRng(seed).child('scarecrow');
  const st = seed >= 1 && seed <= 3 ? STYLES[seed - 1] : { ...rng.pick(STYLES), H: rng.rangeF(1.42, 1.84) };
  const pal = seasonPalette(season);
  const mesh = new MeshData(`scarecrow-${seed}-${season}-lod${detail}`);
  const m = compose(IDENTITY, rotateY(rng.rangeF(-0.08, 0.08)));
  const H = st.H;
  const lean = rng.rangeF(-0.055, 0.055), drift = rng.rangeF(-0.035, 0.035);
  const at = (f) => [lean * f * f, H * f, drift * f * f];
  const cloth = hex(st.cloth);
  const trim = hex(st.trim);

  
  
  
  emit(mesh, 'wood', rod({
    path: detail === 2 ? [[0, -0.04, 0], at(st.waist)] : [[0, -0.04, 0], at(st.waist), at(st.collar + 0.03)],
    w: st.postW, h: st.postW * 0.9, detail, up: [0, 0, 1],
    caps: detail === 2 ? 'none' : ['none', 'round'], capLength: 0.03, scales: (t) => 1 - 0.2 * t,
  }), { matrix: m, color: (p, n) => paintVertex(hex(st.post), p, n, { groundAO: 0.45, groundFade: 0.55, mottle: 0.08, seed: 23 }) });

  
  
  const shoulderY = H * st.collar - 0.03;
  const tipZ = rng.rangeF(-0.03, 0.03);
  const armEnds = [
    [-st.arm[0], shoulderY - st.armDrop[0] * st.arm[0], tipZ * 1.4],
    [st.arm[1], shoulderY - st.armDrop[1] * st.arm[1], -tipZ],
  ];
  emit(mesh, 'wood', rod({
    path: detail === 2 ? [armEnds[0], armEnds[1]] : [armEnds[0], [lean * 0.5, shoulderY + 0.012, drift * 0.5], armEnds[1]],
    w: 0.05, h: 0.038, detail, up: [0, 1, 0], caps: 'round', capLength: 0.02,
  }), { matrix: m, color: (p, n) => paintVertex(mixC(hex(st.post), trim, 0.2), p, n, { groundAO: 0.12, groundFade: 0.4, underside: 0.4, mottle: 0.07, seed: 29 }) });

  
  
  
  
  
  
  
  
  const count = detail === 0 ? 10 : detail === 1 ? 6 : 4;
  const flare = rng.rangeF(1.04, 1.16);
  const headR = st.chest * rng.rangeF(0.78, 0.92);
  const collarAt = [lean * 0.7, H * st.collar, drift * 0.7];
  const neckAt = [lean * 0.8, H * st.collar + headR * 0.22, drift * 0.8];
  const headMid = [lean * 0.85, H * st.collar + headR * 1.0, drift * 0.85];
  const smockScales = detail === 2
    ? [flare, 0.82, 1.0, 0.5, 0.95]
    : null;
  const smock = sweep({
    profile: superellipseProfile(st.depth, st.chest, 3.2, count),
    path: detail === 2 ? [at(st.hem), at(st.waist), collarAt, neckAt, headMid] : [at(st.hem), at(st.waist), collarAt],
    up: [0, 0, 1], caps: 'round', capSegments: 1, capLength: st.depth * (detail === 2 ? 0.9 : 0.5),
    scales: smockScales
      ? (t, i) => smockScales[Math.max(0, Math.min(smockScales.length - 1, i))]
      : (t) => (t < 0.5 ? flare - (flare - 0.82) * (t / 0.5) : 0.82 + 0.3 * ((t - 0.5) / 0.5)),
  });
  emit(mesh, 'cloth', smock, {
    matrix: m,
    color: (p, n) => paintVertex(vary(rng, cloth, 0.04), p, n, { groundAO: 0.2, groundFade: 0.6, underside: 0.4, mottle: 0.09, seed: 31 }),
  });

  
  
  if (detail < 2) {
    armEnds.forEach((end, k) => {
      const side = k === 0 ? -1 : 1;
      const cuff = [end[0] + side * 0.05, end[1] - 0.06 - 0.05 * k, end[2] + rng.rangeF(-0.05, 0.05)];
      emit(mesh, 'cloth', rod({
        path: [[side * st.chest * 0.55, shoulderY - 0.02, drift * 0.4], [(end[0] + side * st.chest * 0.5) * 0.5, (end[1] + shoulderY) * 0.5, end[2] * 0.6], cuff],
        w: 0.072 - 0.006 * k, detail: detail === 0 ? 0 : 1, up: [0, 1, 0], caps: ['none', 'round'], capLength: 0.02,
        scales: (t) => 1 - 0.22 * t,
      }), { matrix: m, color: (p, n) => paintVertex(vary(rng, mixC(cloth, trim, 0.12 * k), 0.04), p, n, { groundAO: 0.1, groundFade: 0.4, underside: 0.45, mottle: 0.08, seed: 37 + k }) });

      
      const tufts = detail === 0 ? st.tufts[k] : Math.max(1, st.tufts[k] - 1);
      for (let i = 0; i < tufts; i++) {
        const a = rng.rangeF(0, Math.PI * 2);
        const len = rng.rangeF(0.05, 0.1);
        emit(mesh, 'grass', rod({
          path: [cuff, [cuff[0] + side * len * 0.6, cuff[1] - len * 0.7, cuff[2] + Math.sin(a) * len * 0.5]],
          w: 0.012, detail: 2, up: [0, 1, 0], caps: 'none',
        }), { matrix: m, color: vc(hex('#d8be80'), { groundAO: 0, underside: 0.35 }) });
      }
    });
  }

  
  
  const headAt = compose(m, compose(
    translate(lean * 0.85 + rng.rangeF(-0.02, 0.02), H * st.collar + headR * 0.92, drift * 0.85 + rng.rangeF(-0.02, 0.02)),
    compose(rotateZ(rng.rangeF(-0.16, 0.16)), rotateY(rng.rangeF(-0.4, 0.4))),
  ));
  if (detail < 2) {
    emit(mesh, 'cloth', blob({
      radii: [headR * 1.06, headR * 1.12, headR * 0.9], subdiv: 1,
      seed: rng.rangeI(1, 1e6), lump: 0.19, lumpFreq: 1.6,
    }), { matrix: headAt, color: (p, n) => paintVertex(vary(rng, hex(st.head), 0.05), p, n, { groundAO: 0, underside: 0.4, mottle: 0.1, seed: 41 }) });
  }

  
  if (detail === 0) {
    const y = H * st.collar + headR * 0.1;
    const r = headR * 0.78;
    const slip = rng.rangeF(-0.02, 0.02);
    emit(mesh, 'cloth', sweep({
      profile: superellipseProfile(0.011, 0.011, 2, 4),
      path: [[lean * 0.85, y, drift * 0.85 + r], [lean * 0.85 + r, y + slip, drift * 0.85], [lean * 0.85, y, drift * 0.85 - r], [lean * 0.85 - r, y - slip, drift * 0.85]],
      up: [0, 1, 0], caps: 'none', closed: true,
    }), { matrix: m, color: vc(hex('#b5a07a'), { groundAO: 0, underside: 0.3 }) });
  }

  
  const sides = detail === 0 ? 10 : detail === 1 ? 7 : 5;
  const wave = rng.rangeF(0.05, 0.11);
  const hatPhase = rng.rangeF(0, Math.PI * 2);
  const hatAt = compose(headAt, compose(
    translate(rng.rangeF(-0.02, 0.02), headR * (st.hat.tall > 0.14 ? 0.62 : 0.78), -headR * (st.hat.tall > 0.14 ? 0.3 : 0.06)),
    compose(rotateZ(rng.rangeF(-0.2, 0.2)), rotateY(hatPhase)),
  ));
  emit(mesh, 'cloth', lathe({
    points: detail === 2
      
      ? [[0, 0], [st.hat.brim, 0.03], [st.hat.crown * 1.02, 0.05], [st.hat.crown * 0.72, 0.05 + st.hat.tall * 0.8], [0, 0.05 + st.hat.tall * 1.06]]
      : hatProfile(st.hat.brim, st.hat.crown, st.hat.tall),
    sides,
    radiusFn: (th, j, r) => r * (1 + (j <= 4 ? wave * Math.sin(th * 3 + hatPhase) : wave * 0.25 * Math.cos(th * 2))),
  }), { matrix: hatAt, color: (p, n) => paintVertex(vary(rng, mixC(trim, cloth, 0.25), 0.05), p, n, { groundAO: 0, underside: 0.5, mottle: 0.08, seed: 43 }) });

  if (season === 'winter' && detail < 2) {
    
    emit(mesh, 'snow', lathe({
      points: [[st.hat.crown * 1.02, 0.045], [st.hat.brim * 0.72, 0.05], [st.hat.brim * 0.99, 0.036], [st.hat.brim * 0.9, 0.032]],
      sides: detail === 0 ? 9 : 7,
      radiusFn: (th, j, r) => r * (1 + 0.07 * Math.sin(th * 3 + hatPhase + 0.7)),
    }), { matrix: hatAt, color: vc(hex(pal.snow[0]), { groundAO: 0, underside: 0.2 }) });
    const low = st.armDrop[0] * st.arm[0] > st.armDrop[1] * st.arm[1] ? 0 : 1;
    const end = armEnds[low];
    emit(mesh, 'snow', sweep({
      profile: superellipseProfile(0.022, 0.03, 3, detail === 0 ? 7 : 5),
      path: [[lean * 0.5, shoulderY + 0.03, drift * 0.5], [(end[0] + lean) * 0.5, (end[1] + shoulderY) * 0.5 + 0.03, end[2] * 0.5], [end[0] * 0.92, end[1] + 0.03, end[2] * 0.9]],
      up: [0, 1, 0], caps: 'none',
      scales: (t) => 0.7 + 0.4 * Math.sin(Math.PI * Math.min(1, Math.max(0, t))),
    }), { matrix: m, color: vc(hex(pal.snow[1] || pal.snow[0]), { groundAO: 0, underside: 0.2 }) });
  }
  return mesh;
}
