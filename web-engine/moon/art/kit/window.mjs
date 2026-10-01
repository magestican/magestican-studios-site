





import { Shape, sweep, surface, roundedRectProfile, circleProfile, emit } from '../../mesh/bevel.mjs';
import { compose, translate, rotateY } from '../../mesh/meshData.mjs';
import { pillow } from './door.mjs';
import { vc } from './shade.mjs';

export function windowUnit(mesh, m, {
  width = 0.8, height = 0.9, kind = 'rect', muntins = 'cross', detail = 0, rng,
  frameColor, glassColor, sill = true, shutters = false, shutterColor, snowColor = null,
}) {
  const d0 = detail === 0;
  const loop = kind === 'round'
    ? circleProfile((width + 0.1) / 2, d0 ? 10 : detail === 1 ? 8 : 6)
    : roundedRectProfile(width + 0.1, height + 0.1, 0.12, d0 ? 1 : 0);
  const frameProfile = roundedRectProfile(0.1, 0.12, 0.035, d0 ? 1 : 0).map(([x, y]) => [x + 0.04, y]);
  emit(mesh, 'wood', sweep({ profile: frameProfile, path: loop.map(([x, y]) => [x, y, 0]), closed: true, up: [0, 0, 1], uvScale: 1.2 }), { matrix: m, color: vc(frameColor) });

  const panesX = muntins === 'none' ? 1 : 2, panesY = muntins === 'cross' ? 2 : 1;
  if (kind === 'round') {
    const g = new Shape();
    const r = width / 2;
    const ring = circleProfile(r, 8).map(([x, y]) => g.add([x, y, 0.02], [(x / width + 0.5) * panesX, (y / width + 0.5) * panesY]));
    const c = g.add([0, 0, 0.012], [0.5 * panesX, 0.5 * panesY]);
    for (let k = 0; k < 8; k++) g.tri(ring[k], ring[(k + 1) % 8], c);
    emit(mesh, 'glass', g, { matrix: m, color: glassColor });
  } else {
    const g = surface({
      us: [-0.5, 0, 0.5], vs: [-0.5, 0, 0.5],
      at: (u, v) => [u * width, v * height, 0.022 - 0.01 * (1 - 4 * u * u) * (1 - 4 * v * v)],
      uv: (u, v) => [(u + 0.5) * panesX, (v + 0.5) * panesY],
    });
    emit(mesh, 'glass', g, { matrix: m, color: glassColor });
  }

  if (detail < 2 && muntins !== 'none') {
    const bar = roundedRectProfile(0.035, 0.045, 0.01, 0).map(([x, y]) => [x + 0.035, y]);
    const halfH = kind === 'round' ? width / 2 : height / 2, halfW = width / 2;
    emit(mesh, 'wood', sweep({ profile: bar, path: [[0, -halfH - 0.02, 0], [0, halfH + 0.02, 0]], up: [0, 0, 1], caps: 'none' }), { matrix: m, color: vc(frameColor) });
    if (muntins === 'cross') emit(mesh, 'wood', sweep({ profile: bar, path: [[-halfW - 0.02, 0, 0], [halfW + 0.02, 0, 0]], up: [0, 0, 1], caps: 'none' }), { matrix: m, color: vc(frameColor) });
  }

  const sillY = -height / 2 - 0.09;
  if (sill && kind !== 'round') {
    const sw = width / 2 + 0.11;
    const sillShape = sweep({
      profile: roundedRectProfile(0.075, 0.18, 0.032, d0 ? 1 : 0).map(([x, y]) => [x, y + 0.07]),
      path: d0 ? [[-sw, sillY, 0], [0, sillY - 0.008, 0], [sw, sillY + rng.rangeF(-0.01, 0.01), 0]] : [[-sw, sillY, 0], [sw, sillY, 0]],
      up: [0, 1, 0], caps: detail === 2 ? 'flat' : 'round', capRings: [], capSegments: 1, capLength: 0.04,
    });
    emit(mesh, 'wood', sillShape, { matrix: m, color: vc(frameColor) });
    if (snowColor) {
      const snow = sweep({
        profile: circleProfile(0.085, d0 ? 7 : 5, 0, 0.04).map(([x, y]) => [y * 0.9 + 0.05, x + 0.075]),
        path: [[-sw + 0.03, sillY + 0.02, 0], [0, sillY + 0.03, 0], [sw - 0.05, sillY + 0.015, 0]],
        up: [0, 1, 0], caps: 'round', capSegments: 1, capLength: 0.05, scales: (t) => 0.85 + 0.3 * Math.sin(Math.PI * t),
      });
      emit(mesh, 'snow', snow, { matrix: m, color: vc(snowColor, { groundAO: 0, underside: 0.2 }) });
    }
  }

  if (shutters && detail < 2 && kind !== 'round') {
    const sw = width * 0.5, sh = height + 0.08;
    const outline = (d) => roundedRectProfile(sw - 2 * d, sh - 2 * d, 0.05, d0 ? 1 : 0);
    const panel = pillow({ outline, insets: d0 ? [0, 0.04] : [0], zs: [0.0, 0.035], centre: [0, 0], centreZ: 0.045, uv: ([x, y]) => [y / 0.88, x / 0.88 + 0.5] });
    for (const side of [-1, 1]) {
      const open = side < 0 ? rng.rangeF(0.05, 0.25) : rng.rangeF(0.35, 0.7);
      const hinge = translate(side * (width / 2 + 0.08), 0, 0.02);
      
      const local = compose(hinge, compose(rotateY(-side * open), translate(side * (sw / 2 + 0.01), rng.rangeF(-0.02, 0.02), 0)));
      emit(mesh, 'plank', panel, { matrix: compose(m, local), color: vc(shutterColor, { useTag: true }) });
    }
  }
}
