






export const BODIES = {
  adult: {
    head: 0.13,
    neck: 0.03,
    torso: 0.3,
    thigh: 0.245,
    shin: 0.245,
    ankle: 0.04,
    shoulders: 0.25,
    hips: 0.17,
    upperArm: 0.17,
    forearm: 0.15,
    hand: 0.07,
  },
  child: {
    head: 0.19,
    neck: 0.02,
    torso: 0.31,
    thigh: 0.2,
    shin: 0.2,
    ankle: 0.04,
    shoulders: 0.24,
    hips: 0.17,
    upperArm: 0.15,
    forearm: 0.13,
    hand: 0.06,
  },
};

const rad = (d) => (d * Math.PI) / 180;




















export function makePose(a = {}, bodyName = 'adult', place = { cx: 320, ground: 440, stature: 380 }) {
  const b = typeof bodyName === 'string' ? BODIES[bodyName] : bodyName;
  const H = place.stature;
  const w = 1 - 0.85 * (a.yaw ?? 0); 
  const lift = (a.lift ?? 0) * H;
  const drop = (a.drop ?? 0) * H;
  const ankleY = place.ground - b.ankle * H - lift;
  const legLen = (b.thigh + b.shin) * H;
  const spread = rad(a.legSpread ?? 4);
  const hipY = ankleY - Math.cos(spread) * legLen + drop;
  const shoulderY = hipY - b.torso * H;
  const noseY = shoulderY - (b.neck + b.head * 0.45) * H;
  const cx = place.cx;
  const sx = (b.shoulders / 2) * H * w;
  const hx = (b.hips / 2) * H * w;
  const P = (x, y) => ({ x, y, score: 0.95 });

  const pose = {
    nose: P(cx, noseY),
    left_eye: P(cx + b.head * 0.15 * H * w, noseY - 0.02 * H),
    right_eye: P(cx - b.head * 0.15 * H * w, noseY - 0.02 * H),
    left_ear: P(cx + b.head * 0.38 * H * w, noseY - 0.005 * H),
    right_ear: P(cx - b.head * 0.38 * H * w, noseY - 0.005 * H),
    
    left_shoulder: P(cx + sx, shoulderY),
    right_shoulder: P(cx - sx, shoulderY),
    left_hip: P(cx + hx, hipY),
    right_hip: P(cx - hx, hipY),
  };

  
  for (const [side, sign] of [
    ['left', 1],
    ['right', -1],
  ]) {
    const hip = pose[`${side}_hip`];
    const ax = hip.x + sign * Math.sin(spread) * legLen;
    const ay = ankleY;
    const dx = ax - hip.x;
    const dy = ay - hip.y;
    const d = Math.hypot(dx, dy);
    const half = d / 2;
    const thigh = b.thigh * H;
    const out = thigh > half ? Math.sqrt(thigh * thigh - half * half) : 0;
    pose[`${side}_knee`] = P(hip.x + dx / 2 + sign * out, hip.y + dy / 2);
    pose[`${side}_ankle`] = P(ax, ay);
    pose[`${side}_foot_index`] = P(ax + sign * 0.02 * H, ay + b.ankle * H * 0.8);
  }

  
  for (const [side, sign, ang, bend, over] of [
    ['left', 1, a.armL ?? 12, a.elbowL ?? 8, a.wristL],
    ['right', -1, a.armR ?? 12, a.elbowR ?? 8, a.wristR],
  ]) {
    const sh = pose[`${side}_shoulder`];
    if (over) {
      const wx = cx + sign * over.x * H;
      const wy = noseY + over.y * H;
      pose[`${side}_elbow`] = P(sh.x + sign * b.upperArm * H * 0.75, (sh.y + wy) / 2 + 0.03 * H);
      pose[`${side}_wrist`] = P(wx, wy);
      pose[`${side}_index`] = P(wx, wy - b.hand * H * 0.6);
      continue;
    }
    const t1 = rad(ang);
    const ex = sh.x + sign * Math.sin(t1) * b.upperArm * H * w;
    const ey = sh.y + Math.cos(t1) * b.upperArm * H;
    const t2 = rad(ang + bend);
    const wx = ex + sign * Math.sin(t2) * b.forearm * H * w;
    const wy = ey + Math.cos(t2) * b.forearm * H;
    pose[`${side}_elbow`] = P(ex, ey);
    pose[`${side}_wrist`] = P(wx, wy);
    pose[`${side}_index`] = P(wx + sign * Math.sin(t2) * b.hand * H * w, wy + Math.cos(t2) * b.hand * H);
  }
  return pose;
}



const ease = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const bump = (s, start, len) => ease((s - start) / (len * 0.3)) * (1 - ease((s - start - len * 0.7) / (len * 0.3)));


export const CLIPS = {
  idle: (s) => ({ armL: 12 + 3 * Math.sin(s * 2), armR: 12 + 3 * Math.sin(s * 2 + 1) }),
  arms_up: (s) => {
    const k = bump(s, 0.2, 1.6);
    return { armL: 12 + 160 * k, armR: 12 + 160 * k, elbowL: 8 - 8 * k, elbowR: 8 - 8 * k };
  },
  star: (s) => {
    const k = bump(s, 0.2, 1.4);
    return { armL: 12 + 100 * k, armR: 12 + 100 * k, legSpread: 4 + 18 * k, lift: 0.03 * k };
  },
  flap: (s) => {
    const k = bump(s, 0.1, 2.2);
    const f = 0.5 + 0.5 * Math.sin(s * Math.PI * 4);
    return { armL: 20 + k * (40 + 80 * f), armR: 20 + k * (40 + 80 * f) };
  },
  jump: (s) => {
    const k = Math.max(0, Math.sin(Math.min(1, Math.max(0, (s - 0.3) / 0.5)) * Math.PI));
    return { lift: 0.12 * k, armL: 20 + 40 * k, armR: 20 + 40 * k };
  },
  squat: (s) => {
    const k = bump(s, 0.2, 1.6);
    return { drop: 0.16 * k, armL: 12 + 60 * k, armR: 12 + 60 * k };
  },
  twirl: (s) => {
    const k = Math.min(1, Math.max(0, (s - 0.2) / 1.4));
    return { yaw: Math.abs(Math.sin(k * Math.PI)), armL: 30, armR: 30 };
  },
  wand: (s) => {
    const k = bump(s, 0.2, 1.6);
    return { armR: 12 + 78 * k, elbowR: 8 - 8 * k };
  },
  boo: (s) => {
    if (s < 0.3) return {};
    if (s < 1.0) return { wristL: { x: 0.04, y: 0.02 }, wristR: { x: 0.04, y: 0.02 } };
    const k = bump(s, 1.0, 1.2);
    return { armL: 12 + 110 * k, armR: 12 + 110 * k, elbowL: 0, elbowR: 0 };
  },
  crown: (s) => (s > 0.2 && s < 1.8 ? { wristL: { x: 0.035, y: -0.09 }, wristR: { x: 0.035, y: -0.09 } } : {}),
};




export function demoPose(t, ask, place, body = 'child') {
  const sway = { ...place, cx: place.cx + Math.sin(t * 0.7) * place.stature * 0.02 };
  const react = 0.6;
  if (ask && ask.since >= react && CLIPS[ask.move]) return makePose(CLIPS[ask.move](ask.since - react), body, sway);
  return makePose(CLIPS.idle(t), body, sway);
}
