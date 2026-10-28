





import { hipCentre, shoulderCentre, torsoLength } from './pose/framing.js';
import { seen } from './pose/pose.js';


export const COSTUMES = {
  wizard: { pieces: ['wizard_robe', 'wizard_hat', 'wizard_wand'], fire: 'flame', signature: 'flame' },
  princess: { pieces: ['gown', 'crown', 'star_wand'], fire: 'sparkle', signature: 'petal' },
  ghost: { pieces: ['ghost_sheet', 'ghost_hood'], fire: 'mini_ghost', signature: 'mini_ghost' },
  fairy: { pieces: ['fairy_wings', 'flower_crown', 'star_wand'], fire: 'sparkle', signature: 'fairy' },
  dragon: { pieces: ['dragon_tail', 'dragon_wings', 'dragon_horns'], fire: 'flame', signature: 'flame' },
};

const LAYER = { back: 0, body: 1, head: 2, hand: 3 };
const SVG_PER_GRID = 2; 
const HEAD_TOP = 0.85; 

const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);






export function landmarks(pose) {
  
  const L = {};
  const torso = torsoLength(pose);
  const sc = shoulderCentre(pose);
  const hc = hipCentre(pose);
  const measures = { head_w: 0, shoulder_w: 0, hip_w: 0, torso: torso ?? 0 };

  
  let torsoAngle = 0;
  if (torso && sc && hc) {
    const d = { x: (hc.x - sc.x) / torso, y: (hc.y - sc.y) / torso };
    torsoAngle = Math.atan2(-d.x, d.y);
    
    measures.shoulder_w = Math.max(dist(pose.left_shoulder, pose.right_shoulder), 0.5 * torso);
    measures.hip_w = Math.max(dist(pose.left_hip, pose.right_hip), 0.35 * torso);
    const along = (k) => ({ x: sc.x + d.x * k * torso, y: sc.y + d.y * k * torso, angle: torsoAngle });
    L.neck = { ...sc, angle: torsoAngle };
    L.chest = along(0.3);
    L.waist = along(0.75);
    L.hip = { ...hc, angle: torsoAngle };
  }

  
  const pair =
    seen(pose.left_ear) && seen(pose.right_ear)
      ? ['left_ear', 'right_ear', 1]
      : seen(pose.left_eye) && seen(pose.right_eye)
        ? ['left_eye', 'right_eye', 2.6]
        : null;
  if (pair) {
    const [a, b] = [pose[pair[0]], pose[pair[1]]].sort((p, q) => p.x - q.x);
    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    measures.head_w = dist(a, b) * pair[2];
    const c = mid(a, b);
    const up = { x: Math.sin(angle), y: -Math.cos(angle) };
    L.head_top = { x: c.x + up.x * HEAD_TOP * measures.head_w, y: c.y + up.y * HEAD_TOP * measures.head_w, angle };
    if (seen(pose.nose)) L.face = { x: pose.nose.x, y: pose.nose.y, angle };
  }

  
  for (const side of ['left', 'right']) {
    const w = pose[`${side}_wrist`];
    const e = pose[`${side}_elbow`];
    if (!seen(w) || !seen(e)) continue;
    const tip = seen(pose[`${side}_index`]) ? pose[`${side}_index`] : w;
    L[`hand_${side}`] = { x: w.x, y: w.y, angle: Math.atan2(tip.x - e.x, -(tip.y - e.y)) };
  }
  return { ...L, measures };
}









export function placePiece(icon, pose, opts = {}) {
  const L = opts.L ?? landmarks(pose);
  const key = icon.on === 'hand' ? `hand_${opts.hand ?? 'right'}` : icon.on;
  const at = L[key];
  const measure = L.measures[icon.measure];
  if (!at || !measure) return null;
  const width = measure * icon.scale;
  const s = width / (icon.span * SVG_PER_GRID);
  return {
    id: icon.id,
    x: at.x,
    y: at.y,
    angle: at.angle,
    s,
    width,
    ax: icon.anchor[0] * SVG_PER_GRID,
    ay: icon.anchor[1] * SVG_PER_GRID,
    size: icon.width ?? 128,
  };
}





export function placeCostume(costume, pose, set, hand = 'right') {
  const L = landmarks(pose);
  const byId = new Map(set.icons.map((i) => [i.id, i]));
  return COSTUMES[costume].pieces
    .map((id) => byId.get(id))
    .sort((a, b) => LAYER[a.group] - LAYER[b.group])
    .map((icon) => placePiece(icon, pose, { hand, L }))
    .filter(Boolean);
}







export function torsoOccluder(pose) {
  const T = torsoLength(pose);
  if (!T) return [];
  const sc = shoulderCentre(pose);
  const hc = hipCentre(pose);
  const up = { x: (sc.x - hc.x) / T, y: (sc.y - hc.y) / T };
  
  const across = (a, b, min) => {
    const half = Math.max(dist(a, b), min) * 0.5 * 1.15;
    return [-up.y * half, up.x * half];
  };
  const [sx, sy] = across(pose.left_shoulder, pose.right_shoulder, 0.5 * T);
  const [hx, hy] = across(pose.left_hip, pose.right_hip, 0.4 * T);
  const top = { x: sc.x + up.x * 0.1 * T, y: sc.y + up.y * 0.1 * T };
  return [
    { x: top.x + sx, y: top.y + sy },
    { x: top.x - sx, y: top.y - sy },
    { x: hc.x - hx, y: hc.y - hy },
    { x: hc.x + hx, y: hc.y + hy },
  ];
}




function drawPieces(ctx, placed, images) {
  for (const p of placed) {
    const img = images.get(p.id);
    if (!img) continue;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);
    ctx.drawImage(img, -p.ax * p.s, -p.ay * p.s, p.size * p.s, p.size * p.s);
    ctx.restore();
  }
}

const LIMBS = [
  ['left_shoulder', 'left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow', 'right_wrist'],
  ['left_hip', 'left_knee', 'left_ankle'],
  ['right_hip', 'right_knee', 'right_ankle'],
];










export function drawCostume(ctx, scratch, placed, images, back, pose) {
  const behind = placed.filter((p) => back.has(p.id));
  const front = placed.filter((p) => !back.has(p.id));
  const T = torsoLength(pose);
  if (behind.length && T) {
    const c = scratch.canvas;
    scratch.setTransform(1, 0, 0, 1, 0, 0);
    scratch.clearRect(0, 0, c.width, c.height);
    scratch.setTransform(ctx.getTransform());
    drawPieces(scratch, behind, images);
    scratch.globalCompositeOperation = 'destination-out';
    const body = torsoOccluder(pose);
    scratch.beginPath();
    for (const [i, q] of body.entries()) (i ? scratch.lineTo : scratch.moveTo).call(scratch, q.x, q.y);
    scratch.closePath();
    scratch.fill();
    scratch.lineCap = 'round';
    scratch.lineJoin = 'round';
    scratch.lineWidth = 0.28 * T;
    scratch.beginPath();
    for (const limb of LIMBS) {
      const pts = limb.map((n) => pose[n]).filter((j) => seen(j));
      if (pts.length < 2) continue;
      scratch.moveTo(pts[0].x, pts[0].y);
      for (const q of pts.slice(1)) scratch.lineTo(q.x, q.y);
    }
    scratch.stroke();
    scratch.globalCompositeOperation = 'source-over';
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(c, 0, 0);
    ctx.restore();
  } else drawPieces(ctx, behind, images);
  drawPieces(ctx, front, images);
}






export function drawMannequin(ctx, pose, colour = '#ffd9b8') {
  const T = torsoLength(pose);
  if (!T) return;
  const body = torsoOccluder(pose);
  ctx.save();
  ctx.fillStyle = colour;
  ctx.strokeStyle = colour;
  ctx.lineJoin = 'round';
  ctx.lineWidth = T * 0.12;
  ctx.beginPath();
  for (const [i, q] of body.entries()) (i ? ctx.lineTo : ctx.moveTo).call(ctx, q.x, q.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
  drawFigure(ctx, pose, { colour, width: T * 0.28, head: headCircle(pose) }); 
}


function headCircle(pose) {
  const L = landmarks(pose);
  if (!L.head_top || !seen(pose.nose)) return null;
  const up = { x: Math.sin(L.head_top.angle), y: -Math.cos(L.head_top.angle) };
  const chin = { x: pose.nose.x - up.x * 0.3 * L.measures.head_w, y: pose.nose.y - up.y * 0.3 * L.measures.head_w };
  return { ...mid(L.head_top, chin), r: dist(L.head_top, chin) / 2 };
}

const BONES = [
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
  ['left_shoulder', 'right_shoulder'],
  ['left_hip', 'right_hip'],
];






export function drawFigure(ctx, pose, style) {
  ctx.save();
  ctx.strokeStyle = style.colour ?? '#ffd9b8';
  ctx.fillStyle = style.colour ?? '#ffd9b8';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.lineWidth = style.width;
  const sc = shoulderCentre(pose);
  const hc = hipCentre(pose);
  ctx.beginPath();
  if (sc && hc) {
    ctx.moveTo(sc.x, sc.y);
    ctx.lineTo(hc.x, hc.y);
  }
  for (const [a, b] of BONES) {
    if (!seen(pose[a]) || !seen(pose[b])) continue;
    ctx.moveTo(pose[a].x, pose[a].y);
    ctx.lineTo(pose[b].x, pose[b].y);
  }
  if (sc && seen(pose.nose)) {
    ctx.moveTo(sc.x, sc.y);
    ctx.lineTo(pose.nose.x, pose.nose.y);
  }
  ctx.stroke();
  const head =
    style.head ??
    (seen(pose.nose) ? { x: pose.nose.x, y: pose.nose.y - (style.headR ?? style.width) * 0.2, r: style.headR ?? style.width * 1.4 } : null);
  if (head) {
    ctx.beginPath();
    ctx.arc(head.x, head.y, head.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
