






































import { BODY_UV } from '../ps1/ps1Mesh.mjs';
import { HEAD_UV } from '../ps1/ps1Head.mjs';















export const XANDER_UV_MAP = Object.freeze({
  torso: { part: 'torso', chart: BODY_UV.torso },
  pelvis: { part: 'pelvis', chart: BODY_UV.torso },
  trapezius: { part: 'trap', chart: BODY_UV.shoulder },
  upperArm: { part: 'sleeve', chart: BODY_UV.upperArm },
  foreArm: { part: 'skin', chart: BODY_UV.foreArm },
  neck: { part: 'skin', chart: BODY_UV.neck },
  thigh: { part: 'leg', chart: BODY_UV.thigh, v: [0, 0.5] },
  shin: { part: 'leg', chart: BODY_UV.shin, vIn: [0, 0.91], v: [0.5, 1] },
  hand: { part: 'hand', chart: BODY_UV.hand },
  foot: { part: 'boot', chart: BODY_UV.foot },
  footCuff: { part: 'cuff', chart: BODY_UV.foot },
  hair: { part: 'hair', chart: HEAD_UV.hair },
  shoulderBall: { part: 'sleeve', chart: BODY_UV.shoulder, v: [0.02, 0.30] },
  elbowBall: { part: 'skin', chart: BODY_UV.shoulder },
  wristBall: { part: 'skin', chart: BODY_UV.shoulder },
  hipBall: { part: 'pelvis', chart: BODY_UV.shoulder, v: [0.05, 0.45] },
  kneeBall: { part: 'leg', chart: BODY_UV.shoulder, v: [0.44, 0.56] },
});


export function uvKeyOf(name) {
  const m = /^([a-zA-Z]+?)(\d*)(Ball)?$/.exec(name);
  if (!m) return name;
  return m[1] + (m[3] || '');
}


export function unmappedParts(parts, map = XANDER_UV_MAP) {
  return parts.map((p) => p.name).filter((n) => !map[uvKeyOf(n)]);
}








export function remapMeshUvs(name, mesh, rects, map = XANDER_UV_MAP) {
  const key = uvKeyOf(name);
  const spec = map[key];
  if (!spec) throw new Error(`xanderUv: no atlas mapping for part "${name}" (key "${key}")`);
  const rect = rects[spec.part];
  if (!rect) throw new Error(`xanderUv: the atlas has no part "${spec.part}" (for "${name}")`);
  const c = spec.chart; const cw = c[2] - c[0]; const ch = c[3] - c[1];
  const solid = rect.solid || [0.5, 0.5];
  const out = mesh.uvs.slice();
  const I = mesh.indices;
  const u = [0, 0, 0]; const v = [0, 0, 0]; const ids = [0, 0, 0];
  for (let t = 0; t + 2 < I.length; t += 3) {
    for (let k = 0; k < 3; k += 1) {
      ids[k] = I[t + k];
      u[k] = (mesh.uvs[ids[k] * 2] - c[0]) / cw;
      v[k] = (mesh.uvs[ids[k] * 2 + 1] - c[1]) / ch;
    }
    const lo = Math.min(u[0], u[1], u[2]); const hi = Math.max(u[0], u[1], u[2]);
    const flatV = Math.abs(v[0] - v[1]) < 1e-9 && Math.abs(v[1] - v[2]) < 1e-9;
    const distinct = new Set([u[0].toFixed(6), u[1].toFixed(6), u[2].toFixed(6)]).size;
    let collapse = false;
    if (flatV) collapse = true;                                            
    else if (distinct === 2 && hi - lo > 0.5) {                            
      for (let k = 0; k < 3; k += 1) if (u[k] < 0.5) u[k] += 1;
    } else if (hi - lo > 0.5) collapse = true;                             
    for (let k = 0; k < 3; k += 1) {
      let uu = u[k]; let vv = v[k];
      if (spec.vIn) vv = (vv - spec.vIn[0]) / (spec.vIn[1] - spec.vIn[0]);
      if (spec.v) vv = spec.v[0] + vv * (spec.v[1] - spec.v[0]);
      if (collapse) { uu = solid[0]; vv = solid[1]; }
      out[ids[k] * 2] = rect.u0 + uu * (rect.u1 - rect.u0);
      out[ids[k] * 2 + 1] = rect.v0 + vv * (rect.v1 - rect.v0);
    }
  }
  return out;
}






export function atlasUvs(parts, rects, map = XANDER_UV_MAP) {
  return parts.map((p) => ({ ...p, mesh: { ...p.mesh, uvs: remapMeshUvs(p.name, p.mesh, rects, map) } }));
}
