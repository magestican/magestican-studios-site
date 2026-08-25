


















import { LINE, FX, moodFigure } from './palette.js';
import { drawHand, roughEllipse } from './handdrawn.js';
import { buildSkeleton } from './rig.js';

const V = (x, y) => [x, y];


function boneQuad(a, b, wa, wb) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  return [
    V(a[0] + nx * wa, a[1] + ny * wa),
    V(b[0] + nx * wb, b[1] + ny * wb),
    V(b[0] - nx * wb, b[1] - ny * wb),
    V(a[0] - nx * wa, a[1] - ny * wa),
  ];
}


function shadeBand(quad, tone, part) {
  const [p0, p1, p2, p3] = quad;
  const mid01 = V((p0[0] + p3[0]) / 2, (p0[1] + p3[1]) / 2);
  const mid12 = V((p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2);
  return { t: 'poly', part, fill: tone.shade, line: null, pts: [mid01, mid12, p2, p3] };
}

export function buildFighter(spec) {
  const fig = { ...moodFigure(spec.mood), ...(spec.figure || {}) };
  const sk = buildSkeleton({ ...spec, figure: fig });
  const kit = spec.kit;
  const { f, h, head } = sk;
  const out = [];
  const W = sk.widths;

  const limb = (bone, wa, wb, tone, part) => {
    const q = boneQuad(bone[0], bone[1], wa, wb);
    out.push({ t: 'poly', part, fill: tone.base, line: LINE, pts: q });
    out.push(shadeBand(q, tone, part + 'Shade'));
  };

  
  for (const leg of sk.legs.filter((l) => l.side === 'far')) drawLeg(leg, true);
  for (const arm of sk.arms.filter((a) => a.side === 'far')) drawArm(arm, true);

  
  
  
  
  const P = (x, y) => sk.rot([x, y]);
  const L = sk.local;
  const shW = L.shoulderW;
  const hipW = L.hipW;
  const cx0 = L.chest[0];
  const chestY = L.chest[1];
  const hipY = L.hips[1];
  const hemY = hipY + h * 0.085;

  
  
  out.push({
    t: 'poly', part: 'jacket', fill: kit.jacket.base, line: LINE,
    pts: [
      P(cx0 - shW * 0.52, chestY - h * 0.012),
      P(cx0 + shW * 0.52, chestY - h * 0.012),
      P(cx0 + shW * 0.46, hipY),
      P(cx0 + hipW * 0.86, hemY),
      P(cx0 - hipW * 0.86, hemY),
      P(cx0 - shW * 0.46, hipY),
    ],
  });
  
  out.push({
    t: 'poly', part: 'jacketShade', fill: kit.jacket.shade, line: null,
    pts: [
      P(cx0 - shW * 0.52, chestY - h * 0.012),
      P(cx0 - shW * 0.12, chestY - h * 0.012),
      P(cx0 - hipW * 0.30, hemY),
      P(cx0 - hipW * 0.86, hemY),
      P(cx0 - shW * 0.46, hipY),
    ],
  });
  
  out.push({
    t: 'poly', part: 'shirt', fill: kit.shirt.base, line: null,
    pts: [
      P(cx0 - shW * 0.16, chestY),
      P(cx0 + shW * 0.16, chestY),
      P(cx0 + shW * 0.13, hipY + h * 0.01),
      P(cx0 - shW * 0.13, hipY + h * 0.01),
    ],
  });
  
  for (const s of [-1, 1]) {
    out.push({
      t: 'poly', part: 'lapel', fill: kit.jacket.lit, line: LINE,
      pts: [
        P(cx0 + s * shW * 0.50, chestY - h * 0.012),
        P(cx0 + s * shW * 0.10, chestY - h * 0.010),
        P(cx0 + s * shW * 0.16, chestY + h * 0.085),
        P(cx0 + s * shW * 0.44, chestY + h * 0.030),
      ],
    });
  }
  
  out.push({
    t: 'poly', part: 'belt', fill: kit.trim.base, line: LINE,
    pts: [
      P(cx0 - shW * 0.44, hipY - h * 0.022),
      P(cx0 + shW * 0.44, hipY - h * 0.022),
      P(cx0 + shW * 0.43, hipY + h * 0.012),
      P(cx0 - shW * 0.43, hipY + h * 0.012),
    ],
  });
  out.push({
    t: 'rect', part: 'buckle', fill: kit.trim.lit, line: LINE,
    x: sk.chest[0] - h * 0.018, y: hipY - h * 0.020, w: h * 0.036, h: h * 0.030,
  });

  
  for (const leg of sk.legs.filter((l) => l.side === 'near')) drawLeg(leg, false);
  for (const arm of sk.arms.filter((a) => a.side === 'near')) drawArm(arm, false);

  
  drawHead();

  return out;

  

  function drawLeg(leg, isFar) {
    const tone = isFar ? darker(kit.trousers) : kit.trousers;
    limb([leg.root, leg.knee], W.thigh, W.shin * 1.02, tone, 'thigh');
    limb([leg.knee, leg.ankle], W.shin, W.shin * 0.78, tone, 'shin');
    
    const bt = isFar ? darker(kit.boot) : kit.boot;
    const [ax, ay] = leg.ankle;
    const toe = f;
    out.push({
      t: 'poly', part: 'boot', fill: bt.base, line: LINE,
      pts: [
        V(ax - W.shin * 0.95, ay - h * 0.030),
        V(ax + W.shin * 0.95, ay - h * 0.030),
        V(ax + W.shin * 0.85, ay + h * 0.018),
        V(ax + toe * h * 0.055, ay + h * 0.022),
        V(ax - toe * h * 0.012, ay + h * 0.028),
        V(ax - W.shin * 1.05, ay + h * 0.020),
      ],
    });
    
    
    out.push({
      t: 'poly', part: 'sole', fill: bt.deep, line: LINE,
      pts: [
        V(ax - W.shin * 1.05, ay + h * 0.020),
        V(ax - toe * h * 0.012, ay + h * 0.028),
        V(ax + toe * h * 0.058, ay + h * 0.030),
        V(ax + toe * h * 0.056, ay + h * 0.040),
        V(ax - W.shin * 1.05, ay + h * 0.038),
      ],
    });
    
    out.push({
      t: 'rect', part: 'heel', fill: bt.deep, line: LINE,
      x: ax - W.shin * 1.05, y: ay + h * 0.030, w: W.shin * 0.6, h: h * 0.022,
    });
  }

  function drawArm(arm, isFar) {
    const sleeve = isFar ? darker(kit.jacket) : kit.jacket;
    const skin = isFar ? darker(kit.skin) : kit.skin;
    
    
    limb([arm.root, arm.elbow], W.upperArm * 1.25, W.upperArm * 1.05, sleeve, 'sleeve');
    
    out.push({
      t: 'poly', part: 'cuff', fill: (isFar ? darker(kit.trim) : kit.trim).base, line: LINE,
      pts: boneQuad(arm.elbow, lerpPt(arm.elbow, arm.hand, 0.22), W.upperArm * 1.1, W.foreArm * 1.05),
    });
    limb([lerpPt(arm.elbow, arm.hand, 0.20), arm.hand], W.foreArm, W.foreArm * 0.85, skin, 'forearm');
    drawHand(arm.hand, arm.elbow, skin, isFar);
  }

  function drawHand(p, from, skin, isFar) {
    const dx = p[0] - from[0];
    const dy = p[1] - from[1];
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const r = W.foreArm * 1.15;
    
    
    out.push({
      t: 'poly', part: 'hand', fill: skin.base, line: LINE,
      pts: [
        V(p[0] - uy * r, p[1] + ux * r),
        V(p[0] + ux * r * 1.25 - uy * r * 0.7, p[1] + uy * r * 1.25 + ux * r * 0.7),
        V(p[0] + ux * r * 1.35, p[1] + uy * r * 1.35),
        V(p[0] + ux * r * 1.25 + uy * r * 0.7, p[1] + uy * r * 1.25 - ux * r * 0.7),
        V(p[0] + uy * r, p[1] - ux * r),
      ],
    });
    if (!isFar) {
      out.push({
        t: 'poly', part: 'thumb', fill: skin.shade, line: null,
        pts: [
          V(p[0] + ux * r * 0.15 - uy * r * 0.75, p[1] + uy * r * 0.15 + ux * r * 0.75),
          V(p[0] + ux * r * 1.05 - uy * r * 0.35, p[1] + uy * r * 1.05 + ux * r * 0.35),
          V(p[0] + ux * r * 0.95 + uy * r * 0.05, p[1] + uy * r * 0.95 - ux * r * 0.05),
          V(p[0] + ux * r * 0.05 - uy * r * 0.35, p[1] + uy * r * 0.05 + ux * r * 0.35),
        ],
      });
    }
  }

  function drawHead() {
    
    
    const hx = L.head[0];
    const hy = L.head[1];
    const hw = head.w * 0.5;
    const hh = head.h * 0.5;

    
    out.push({
      t: 'poly', part: 'neck', fill: kit.skin.shade, line: LINE,
      pts: [
        P(L.neck[0] - hw * 0.30, hy + hh * 0.55),
        P(L.neck[0] + hw * 0.30, hy + hh * 0.55),
        P(cx0 + hw * 0.34, sk.chest[1] - h * 0.006),
        P(cx0 - hw * 0.34, sk.chest[1] - h * 0.006),
      ],
    });

    
    
    out.push({
      t: 'poly', part: 'face', fill: kit.skin.base, line: LINE,
      pts: [
        P(hx - hw * 0.96, hy - hh * 0.42),
        P(hx - hw * 0.86, hy + hh * 0.18),
        P(hx - hw * 0.40, hy + hh * 0.86),
        P(hx + f * hw * 0.10, hy + hh * 1.00),
        P(hx + hw * 0.46, hy + hh * 0.82),
        P(hx + hw * 0.88, hy + hh * 0.14),
        P(hx + hw * 0.96, hy - hh * 0.44),
        P(hx, hy - hh * 0.98),
      ],
    });
    
    out.push({
      t: 'poly', part: 'faceShade', fill: kit.skin.shade, line: null,
      pts: [
        P(hx - hw * 0.96, hy - hh * 0.42),
        P(hx - hw * 0.34, hy - hh * 0.50),
        P(hx - hw * 0.26, hy + hh * 0.70),
        P(hx - hw * 0.40, hy + hh * 0.86),
        P(hx - hw * 0.86, hy + hh * 0.18),
      ],
    });

    
    
    
    out.push({
      t: 'poly', part: 'hairBack', fill: kit.hair.shade, line: LINE,
      pts: [
        P(hx - hw * 1.26, hy + hh * 0.92),
        P(hx - hw * 1.18, hy - hh * 0.46),
        P(hx - hw * 0.52, hy - hh * 1.30),
        P(hx + hw * 0.46, hy - hh * 1.32),
        P(hx + hw * 1.18, hy - hh * 0.44),
        P(hx + hw * 1.28, hy + hh * 0.94),
        P(hx + hw * 0.92, hy + hh * 0.34),
        P(hx - hw * 0.92, hy + hh * 0.34),
      ],
    });
    const fringe = [
      P(hx - hw * 1.12, hy + hh * 0.06),
      P(hx - hw * 1.06, hy - hh * 0.70),
      P(hx - hw * 0.44, hy - hh * 1.24),
      P(hx + hw * 0.44, hy - hh * 1.26),
      P(hx + hw * 1.08, hy - hh * 0.64),
      P(hx + hw * 1.12, hy + hh * 0.04),
    ];
    const clumps = 5;
    for (let k = 0; k <= clumps; k += 1) {
      const t = k / clumps;
      const x = hx + hw * (1.10 - 2.20 * t);
      fringe.push(V(x + hw * 0.13, hy + hh * (k % 2 ? 0.44 : 0.16)));
      fringe.push(V(x - hw * 0.08, hy - hh * 0.34));
    }
    out.push({ t: 'poly', part: 'hairFringe', fill: kit.hair.base, line: LINE, pts: fringe });
    out.push({
      t: 'poly', part: 'hairLit', fill: kit.hair.lit, line: null,
      pts: [
        P(hx - hw * 0.80, hy - hh * 0.86),
        P(hx - hw * 0.10, hy - hh * 1.16),
        P(hx + hw * 0.58, hy - hh * 0.98),
        P(hx + hw * 0.46, hy - hh * 0.70),
        P(hx - hw * 0.14, hy - hh * 0.88),
        P(hx - hw * 0.72, hy - hh * 0.64),
      ],
    });

    
    
    const eyeW = head.w * 0.34 * (fig.eyeScale || 1);
    const eyeH = eyeW * 1.15;
    const eyeY = hy + hh * 0.16;
    const gap = eyeW * 0.79;
    const look = spec.lookAt === undefined ? f : Math.sign(spec.lookAt - head.cx) || f;
    for (const s of [-1, 1]) {
      const ex = hx + s * (gap + eyeW) * 0.5 + f * hw * 0.05;
      out.push({ t: 'ellipse', part: 'sclera', cx: ex, cy: eyeY, rx: eyeW * 0.5, ry: eyeH * 0.5, fill: '#fffaf0', line: null });
      const irisR = eyeH * 0.5 * 0.70;
      const ix = ex + look * eyeW * 0.11;
      out.push({ t: 'ellipse', part: 'iris', cx: ix, cy: eyeY + eyeH * 0.03, rx: irisR * 0.80, ry: irisR, fill: kit.iris.base, line: null });
      out.push({ t: 'ellipse', part: 'pupil', cx: ix, cy: eyeY + eyeH * 0.06, rx: irisR * 0.40, ry: irisR * 0.52, fill: kit.iris.deep, line: null });
      out.push({ t: 'ellipse', part: 'highlight', cx: ix - irisR * 0.44, cy: eyeY - irisR * 0.44, rx: irisR * 0.40, ry: irisR * 0.40, fill: '#ffffff', line: null });
      out.push({ t: 'ellipse', part: 'highlight', cx: ix + irisR * 0.42, cy: eyeY + irisR * 0.48, rx: irisR * 0.16, ry: irisR * 0.16, fill: '#ffffff', line: null });
      
      out.push({
        t: 'poly', part: 'upperLid', fill: LINE, line: null,
        pts: [
          P(ex - eyeW * 0.52, eyeY - eyeH * 0.30),
          P(ex + eyeW * 0.52, eyeY - eyeH * 0.44),
          P(ex + eyeW * 0.52, eyeY - eyeH * 0.62),
          P(ex - eyeW * 0.52, eyeY - eyeH * 0.50),
        ],
      });
      out.push({
        t: 'poly', part: 'brow', fill: kit.hair.shade, line: null,
        pts: [
          P(ex - eyeW * 0.46, eyeY - eyeH * 0.86),
          P(ex + eyeW * 0.46, eyeY - eyeH * 1.00),
          P(ex + eyeW * 0.46, eyeY - eyeH * 0.84),
          P(ex - eyeW * 0.46, eyeY - eyeH * 0.72),
        ],
      });
    }
    
    out.push({
      t: 'poly', part: 'nose', fill: kit.skin.deep, line: null,
      pts: [
        P(hx + f * hw * 0.16, hy + hh * 0.42),
        P(hx + f * hw * 0.30, hy + hh * 0.52),
        P(hx + f * hw * 0.14, hy + hh * 0.52),
      ],
    });
    out.push({
      t: 'rect', part: 'mouth', fill: LINE, line: null,
      x: hx + f * hw * 0.06, y: hy + hh * 0.68, w: hw * 0.26, h: Math.max(1, hh * 0.06),
    });
  }
}

function darker(tone) {
  return { lit: tone.base, base: tone.shade, shade: tone.deep, deep: tone.deep };
}

function lerpPt(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}








export function drawFighter(ctx, shapes, lineW = 1) {
  for (const s of shapes) {
    if (s.t === 'poly') {
      drawHand(ctx, s.pts, { fill: s.fill, line: s.line, ink: lineW * 1.25, amp: 1.0 });
    } else if (s.t === 'ellipse') {
      const pts = roughEllipse(s.cx, s.cy, Math.max(0.5, s.rx), Math.max(0.5, s.ry), {
        seed: ((s.cx * 13 + s.cy * 7) | 0) >>> 0,
      });
      
      
      const inked = s.line && Math.min(s.rx, s.ry) > 2.5 ? s.line : null;
      drawHand(ctx, pts, { fill: s.fill, line: inked, ink: lineW, amp: 0.7 });
    } else if (s.t === 'rect') {
      const pts = [[s.x, s.y], [s.x + s.w, s.y], [s.x + s.w, s.y + s.h], [s.x, s.y + s.h]];
      drawHand(ctx, pts, { fill: s.fill, line: s.line, ink: lineW, amp: 0.8 });
    }
  }
}

export { FX };
