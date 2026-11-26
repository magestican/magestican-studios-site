
export const KIT_SIZE = 0.3;
const STEP = 0.8;
const JOIN = 1.1;
const COLORS = {
  double: 0x2fe0d0,
  pound: 0xff8a3d,
  dash: 0xffd34d,
  glide: 0x7ee05a,
  wall: 0xc78bff,
  tether: 0xff5fa2,
  lantern: 0xfff6b0,
  drill: 0x5aa8ff,
};
export const kitColor = (grant) => COLORS[grant] ?? 0x2fe0d0;

export function kitLayout(entities) {
  const out = new Map();
  const all = entities.filter((e) => e.kind === 'ability').sort((a, b) => a.y - b.y || a.x - b.x);
  let run = [];
  const flush = () => {
    const mid = run.reduce((s, e) => s + e.x, 0) / run.length;
    const n = run.length - 1;
    const step = n ? Math.min(STEP, (3.8 + run[n].x - run[0].x) / n) : 0;
    for (const [i, e] of run.entries()) out.set(e.id, { dx: n ? mid + (i - n / 2) * step - e.x : 0 });
    run = [];
  };
  for (const e of all) {
    const last = run[run.length - 1];
    if (last && (Math.abs(e.y - last.y) >= 0.6 || e.x - last.x >= JOIN)) flush();
    run.push(e);
  }
  if (run.length) flush();
  return out;
}
