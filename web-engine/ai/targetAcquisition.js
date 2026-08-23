


















import { hasVisionLine, VISION_STEP } from '../physics/lineOfSight.js';







export const EYE_SELF = 1.2;
export const EYE_TARGET = 1.0;

export { VISION_STEP };




export function emptyAcquisition() {
  return { targetId: null };
}




export function canSeeTarget(grid, self, target, opts = {}) {
  const eyeSelf = opts.eyeSelf ?? EYE_SELF;
  const eyeTarget = opts.eyeTarget ?? EYE_TARGET;
  return hasVisionLine(
    grid,
    { x: self.x, y: self.y + eyeSelf, z: self.z },
    { x: target.x, y: target.y + eyeTarget, z: target.z },
    { stepSize: opts.stepSize ?? VISION_STEP },
  );
}

function dist3(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}






















export function acquireTarget(state, {
  grid, self, enemies, seeRange, fireRange,
  eyeSelf = EYE_SELF, eyeTarget = EYE_TARGET, stepSize = VISION_STEP,
}) {
  const prevId = state?.targetId ?? null;
  const inRange = [];
  for (const e of enemies ?? []) {
    if (e.alive === false) continue;
    const d = dist3(self, e.pos);
    if (d < seeRange) inRange.push({ e, d });
  }
  inRange.sort((a, b) => a.d - b.d);

  for (const { e, d } of inRange) {
    if (!canSeeTarget(grid, self, e.pos, { eyeSelf, eyeTarget, stepSize })) continue;
    return {
      state: { targetId: e.peerId },
      target: e,
      distance: d,
      fire: d < fireRange,
      
      
      
      lostTargetId: prevId !== null && prevId !== e.peerId ? prevId : null,
    };
  }

  return {
    state: { targetId: null },
    target: null,
    distance: Infinity,
    fire: false,
    lostTargetId: prevId,
  };
}
