


const HAND_SCORE = 0.3;
const BODY_SCORE = 0.4;




const ok = (j, min) => !!j && j.score >= min && Number.isFinite(j.x) && Number.isFinite(j.y);
const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function torsoOf(pose) {
  const ls = pose.left_shoulder;
  const rs = pose.right_shoulder;
  if (!ok(ls, HAND_SCORE) || !ok(rs, HAND_SCORE)) return 0;
  const lh = pose.left_hip;
  const rh = pose.right_hip;
  if (ok(lh, HAND_SCORE) && ok(rh, HAND_SCORE)) {
    const s = mid(ls, rs);
    const h = mid(lh, rh);
    return Math.hypot(s.x - h.x, s.y - h.y);
  }
  return 2.2 * Math.hypot(ls.x - rs.x, ls.y - rs.y);
}


function hand(pose, side, torso) {
  const w = pose[`${side}_wrist`];
  const e = pose[`${side}_elbow`];
  const s = pose[`${side}_shoulder`];
  const none = { raised: false, up: false, wrist: null, elbow: null };
  if (!torso || !ok(w, HAND_SCORE) || !ok(e, HAND_SCORE) || !ok(s, HAND_SCORE)) return none;
  const raised = w.y < e.y && w.y < s.y + 0.2 * torso;
  if (!raised) return none;
  const nose = pose.nose;
  const up = ok(nose, HAND_SCORE) && w.y < nose.y - 0.35 * torso && Math.abs(w.x - e.x) < 0.25 * torso;
  return { raised, up, wrist: { x: w.x, y: w.y }, elbow: { x: e.x, y: e.y } };
}





export function readHands(pose) {
  const torso = torsoOf(pose);
  const body = ok(pose.nose, BODY_SCORE) && ok(pose.left_shoulder, BODY_SCORE) && ok(pose.right_shoulder, BODY_SCORE);
  return { left: hand(pose, 'left', torso), right: hand(pose, 'right', torso), body, torso };
}
