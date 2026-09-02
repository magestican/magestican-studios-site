





























export const INNER_RADIUS = 1.5;



















export function scatterStreaks(count, { radius = 26, inner = INNER_RADIUS, rng }) {
  if (!(count > 0)) return new Float32Array(0);
  if (!(radius > inner)) throw new Error(`rain radius ${radius} is not outside inner ${inner}`);
  const out = new Float32Array(count * 3);
  const r2 = radius * radius;
  const i2 = inner * inner;
  for (let i = 0; i < count; i += 1) {
    const theta = rng.next() * Math.PI * 2;
    const r = Math.sqrt(i2 + rng.next() * (r2 - i2));
    out[i * 3] = Math.cos(theta) * r;
    out[i * 3 + 1] = rng.next();
    out[i * 3 + 2] = Math.sin(theta) * r;
  }
  return out;
}





















export function leanFor(vx, vz, fall, maxLean = 0.75) {
  if (!(fall > 0)) return { x: 0, z: 0 };
  let x = -vx / fall;
  let z = -vz / fall;
  const mag = Math.hypot(x, z);
  if (mag > maxLean) {
    x = (x / mag) * maxLean;
    z = (z / mag) * maxLean;
  }
  return { x, z };
}









export function fallHeight(phase, time, speed, height) {
  if (!(height > 0)) return 0;
  const t = (phase - (time * speed) / height) % 1;
  return (t < 0 ? t + 1 : t) * height;
}
