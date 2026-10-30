





export const EYE_TO_GROUND = 1.6;
const SHOULDER_M = 4;
const DEFAULT_SLOPE_M = 18;
const STEP_M = 4;

const OUTER = [1, 3, 6, 10, 14, 18, 24, 34, 50, 80];

const smooth = (t) => t * t * (3 - 2 * t);

const SPAN_BLEND_M = 30;






export function floorOf(terrain, side, d = 0) {
  const key = side < 0 ? 'left' : 'right';
  const base = typeof terrain[key] === 'number' ? terrain[key] : terrain.floor;
  for (const sp of terrain.spans ?? []) {
    if (typeof sp[key] !== 'number' || d < sp.from - SPAN_BLEND_M || d > sp.to + SPAN_BLEND_M) continue;
    const w = Math.min(1, (d - (sp.from - SPAN_BLEND_M)) / SPAN_BLEND_M, (sp.to + SPAN_BLEND_M - d) / SPAN_BLEND_M);
    return base + (sp[key] - base) * smooth(Math.max(0, w));
  }
  return base;
}





export function heightAt(g, off, terrain, half, d = 0) {
  
  if (terrain.air) return floorOf(terrain, off || 1, d);
  const a = Math.abs(off) - half - SHOULDER_M;
  if (a <= 0) return g;
  const t = smooth(Math.min(1, a / (terrain.slope ?? DEFAULT_SLOPE_M)));
  return g + (floorOf(terrain, off, d) - g) * t;
}

export const DEFAULT_HALF_M = 4;


export function groundBeside(stage, d, off) {
  const { pos } = stage.rail.at(d);
  const g = pos.y - EYE_TO_GROUND;
  return stage.terrain ? heightAt(g, off, stage.terrain, stage.terrain.half ?? DEFAULT_HALF_M, d) : g;
}





export function terrainStrip(rail, terrain, half, tile = 8) {
  const cols = [
    ...OUTER.map((o) => -(half + SHOULDER_M + o)).reverse(),
    -(half + SHOULDER_M),
    0,
    half + SHOULDER_M,
    ...OUTER.map((o) => half + SHOULDER_M + o),
  ];
  const rows = [];
  for (let d = 0; d <= rail.length; d += STEP_M) rows.push({ ...rail.at(d), d });
  const position = new Float32Array(rows.length * cols.length * 3);
  const uv = new Float32Array(rows.length * cols.length * 2);
  rows.forEach(({ pos, tangent, d }, r) => {
    const l = Math.hypot(tangent.x, tangent.z) || 1;
    const rx = -tangent.z / l;
    const rz = tangent.x / l;
    const g = pos.y - EYE_TO_GROUND;
    cols.forEach((off, c) => {
      const x = pos.x + rx * off;
      const z = pos.z + rz * off;
      const i = r * cols.length + c;
      position.set([x, heightAt(g, off, terrain, half, d) - 0.03, z], i * 3);
      uv.set([x / tile, z / tile], i * 2);
    });
  });
  const index = [];
  const w = cols.length;
  for (let r = 0; r < rows.length - 1; r++)
    for (let c = 0; c < w - 1; c++) {
      const a = r * w + c;
      index.push(a, a + 1, a + w, a + 1, a + w + 1, a + w); 
    }
  return { position, uv, index };
}
