












import { emit } from '../../mesh/bevel.mjs';
import { IDENTITY, compose, translate, rotateY } from '../../mesh/meshData.mjs';
import { hex, vc, scaleC } from './shade.mjs';
import { wallPanel, plinth } from './wall.mjs';
import { cornerPost } from './post.mjs';
import { door as doorUnit } from './door.mjs';
import { windowUnit } from './window.mjs';
import { gableRoof } from './roof.mjs';
import { flowerBox } from './flowerBox.mjs';

export function buildingBody(mesh, {
  W, D, wallH, rise, cz = 0, root = IDENTITY, detail = 0, rng, season, pal, snow = null,
  wallColor, trimColor, roofColor, doorColor, knobColor = hex('#e0b44e'), ironColor = hex('#4a4658'), glassColor = hex('#7fb0d8'), woodColor = hex('#a8784e'),
  windows = [], door = null, sideDoor = 0, overhang = 0.34, sag = 0.1, rows = 6,
}) {
  const base = 0.36, wallTop = base + wallH, halfSpan = D / 2, frontZ = cz + D / 2;
  const R = (mm) => compose(root, mm);
  emit(mesh, 'stone', plinth({ width: W, depth: D, height: 0.46, thickness: 0.34, detail, rng: rng.child('plinth') }), { matrix: R(translate(0, 0, cz)), color: vc(hex(pal.stone[1]), { useTag: true, groundAO: 0.15 }) });

  const gable = { eaveY: wallH, ridgeY: wallH + rise };
  const d1 = Math.min(2, detail + 1);
  const walls = [
    { m: translate(0, base, frontZ), width: W, gable: false, d: detail },
    { m: compose(translate(0, base, cz - D / 2), rotateY(Math.PI)), width: W, gable: false, d: d1 },
    { m: compose(translate(W / 2, base, cz), rotateY(Math.PI / 2)), width: D, gable: true, d: d1 },
    { m: compose(translate(-W / 2, base, cz), rotateY(-Math.PI / 2)), width: D, gable: true, d: d1 },
  ];
  walls.forEach((w, i) => {
    const panel = wallPanel({ width: w.width + 0.02, height: wallH, detail: w.d, rng: rng.child(`wall${i}`), gable: w.gable ? gable : null, cols: w.width > 4.5 ? 7 : w.width > 3 ? 6 : 5, bulge: 0.02 });
    emit(mesh, 'plank', panel, { matrix: R(w.m), color: vc(wallColor, { useTag: true, groundAO: 0.15, groundFade: 0.9 }) });
  });

  const postRng = rng.child('posts');
  for (const [x, z] of [[W / 2, frontZ], [-W / 2, frontZ], [W / 2, cz - D / 2], [-W / 2, cz - D / 2]]) {
    const post = cornerPost({ height: wallTop - 0.2, radius: 0.16, detail: z < frontZ ? d1 : detail, rng: postRng });
    emit(mesh, 'wood', post, { matrix: R(translate(x, 0, z)), color: vc(trimColor, { groundAO: 0.25 }) });
  }

  const front = (x, y, z = 0) => R(translate(x, y, frontZ + z));
  if (door) {
    doorUnit(mesh, front(door.x, base, 0.075), { width: 0.98, height: 1.8, detail, rng: rng.child('door'), color: doorColor, frameColor: trimColor, knobColor, ironColor, glassColor, porthole: Boolean(door.porthole) });
  }
  const winRng = rng.child('windows');
  const flowers = rng.child('flowers');
  for (const w of windows) {
    const y = w.y ?? base + 1.22;
    windowUnit(mesh, front(w.x, y, 0.08), { width: w.w, height: w.h, detail, rng: winRng, frameColor: trimColor, glassColor, shutters: w.shutters, shutterColor: doorColor, snowColor: w.box ? null : snow, muntins: 'cross' });
    if (w.box) flowerBox(mesh, front(w.x, y - w.h / 2 - 0.36, 0.1), { width: w.w + 0.3, detail, rng: flowers, season, boxColor: woodColor, leafColor: hex(pal.leaf[2]), snowColor: snow });
  }
  if (detail < 2) {
    for (const sgn of [1, -1]) {
      const onGable = R(compose(translate((sgn * W) / 2, 0, cz), rotateY((sgn * Math.PI) / 2)));
      if (sgn === sideDoor) {
        doorUnit(mesh, compose(onGable, translate(-sgn * D * 0.16, base, 0.075)), { width: 0.92, height: 1.78, detail: d1, rng: rng.child('sideDoor'), color: doorColor, frameColor: trimColor, knobColor, ironColor, glassColor });
      } else {
        windowUnit(mesh, compose(onGable, translate(sgn * 0.2, base + 1.22, 0.08)), { width: 0.7, height: 0.8, detail: 2, rng: winRng, frameColor: trimColor, glassColor, snowColor: snow, muntins: 'cross' });
      }
    }
  }

  const roofM = R(translate(0, wallTop, cz));
  const thickness = 0.26, length = W + 0.75;
  gableRoof(mesh, roofM, { length, halfSpan, rise, thickness, overhang, rows, detail, rng: rng.child('roof'), color: roofColor, ridgeColor: scaleC(roofColor, 0.72), sag, snowColor: snow });
  const len = Math.hypot(halfSpan, rise);
  const run = halfSpan + overhang;
  
  
  const roofTopAt = (x, zl) => {
    const t = (2 * x) / length;
    const droop = sag * Math.max(0, 1 - t * t) + sag * 0.9 * t * t * Math.min(1.2, Math.abs(zl) / run);
    return wallTop + rise * (1 - Math.abs(zl) / halfSpan) + (thickness * len) / halfSpan - droop;
  };
  return { base, wallTop, frontZ, halfSpan, roofM, roofTopAt, ridgeY: roofTopAt(0, 0), length };
}
