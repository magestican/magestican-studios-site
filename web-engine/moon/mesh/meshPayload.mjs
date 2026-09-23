
















































export const PAYLOAD_VERSION = 2;




const ATTRIBUTES = Object.freeze([
  { key: 'position', per: 3, required: true },
  { key: 'normal', per: 3, required: true },
  { key: 'color', per: 3, required: true },
  { key: 'uv', per: 2, required: true },
  { key: 'skinIndex', per: 4, required: false },
  { key: 'skinWeight', per: 4, required: false },
  { key: 'sway', per: 1, required: false },
  { key: 'ripple', per: 1, required: false },
]);





export function toPayload(meshData) {
  const arrays = meshData.toArrays();
  return {
    v: PAYLOAD_VERSION,
    name: arrays.name,
    triangles: arrays.triangles,
    
    
    
    bounds: meshData.bounds(),
    
    
    
    
    rig: meshData.rig,
    groups: arrays.groups,
    
    
    
    morphs: arrays.morphs || {},
  };
}


function payloadArrays(payload) {
  const out = [];
  for (const g of payload.groups) {
    for (const val of Object.values(g)) if (val && val.BYTES_PER_ELEMENT) out.push(val);
  }
  for (const m of Object.values(payload.morphs || {})) {
    if (m && m.deltas && m.deltas.BYTES_PER_ELEMENT) out.push(m.deltas);
    if (m && m.colorDeltas && m.colorDeltas.BYTES_PER_ELEMENT) out.push(m.colorDeltas);
  }
  return out;
}






export function payloadBuffers(payload) {
  const out = [];
  for (const val of payloadArrays(payload)) {
    if (val.buffer instanceof ArrayBuffer && !out.includes(val.buffer)) out.push(val.buffer);
  }
  return out;
}


export function payloadBytes(payload) {
  let bytes = 0;
  for (const val of payloadArrays(payload)) bytes += val.byteLength;
  return bytes;
}





export function fromPayload(payload) {
  const arrays = { name: payload.name, triangles: payload.triangles, groups: payload.groups, morphs: payload.morphs };
  const bounds = payload.bounds;
  return {
    name: payload.name,
    rig: payload.rig,
    triangleCount: payload.triangles,
    fromCache: true,
    toArrays: () => arrays,
    bounds: () => ({ min: bounds.min.slice(), max: bounds.max.slice() }),
    validate: () => validatePayload(payload),
  };
}











export function validatePayload(payload) {
  const problems = [];
  const where = payload && payload.name ? payload.name : 'payload';
  if (!payload || payload.v !== PAYLOAD_VERSION) return [`${where}: payload version ${payload && payload.v} is not ${PAYLOAD_VERSION}`];
  if (!Array.isArray(payload.groups) || payload.groups.length === 0) return [`${where}: no groups`];
  if (!payload.bounds || !Array.isArray(payload.bounds.min) || !Array.isArray(payload.bounds.max)) problems.push(`${where}: no bounds`);

  const bones = payload.rig && Array.isArray(payload.rig.bones) ? payload.rig.bones.length : 0;
  let skinned = 0;
  let triangles = 0;

  for (const g of payload.groups) {
    const at = `${where}/${g.material}`;
    if (!g.position || !g.position.BYTES_PER_ELEMENT) { problems.push(`${at}: no positions`); continue; }
    const vcount = g.position.length / 3;
    if (!Number.isInteger(vcount) || vcount === 0) { problems.push(`${at}: ${g.position.length} position values is not whole vertices`); continue; }

    for (const { key, per, required } of ATTRIBUTES) {
      const a = g[key];
      if (!a) { if (required) problems.push(`${at}: no ${key}`); continue; }
      if (a.length !== vcount * per) problems.push(`${at}: ${key} has ${a.length} values for ${vcount} vertices, expected ${vcount * per}`);
    }

    if (!g.index || !g.index.BYTES_PER_ELEMENT) { problems.push(`${at}: no indices`); continue; }
    if (g.index.length % 3) problems.push(`${at}: ${g.index.length} indices is not whole triangles`);
    triangles += g.index.length / 3;
    for (let i = 0; i < g.index.length; i++) {
      const idx = g.index[i];
      if (idx >= vcount) { problems.push(`${at}: index ${idx} past ${vcount} vertices`); break; }
    }

    
    
    
    
    for (let i = 0; i < g.position.length; i++) {
      if (!Number.isFinite(g.position[i])) { problems.push(`${at}: position ${i} is ${g.position[i]}`); break; }
    }

    if (g.skinIndex || g.skinWeight) {
      skinned += 1;
      if (!g.skinIndex || !g.skinWeight) { problems.push(`${at}: one of skinIndex/skinWeight without the other`); continue; }
      if (!bones) { problems.push(`${at}: skin attributes without a rig`); continue; }
      for (let v = 0; v < vcount; v++) {
        let sum = 0;
        let bad = false;
        for (let k = v * 4; k < v * 4 + 4; k++) {
          const w = g.skinWeight[k], i = g.skinIndex[k];
          if (!Number.isFinite(w) || w < 0) { problems.push(`${at}: skin weight ${w} at vertex ${v}`); bad = true; break; }
          if (!Number.isInteger(i) || i < 0 || i >= bones) { problems.push(`${at}: skin index ${i} out of range at vertex ${v}`); bad = true; break; }
          sum += w;
        }
        if (bad) break;
        if (Math.abs(sum - 1) > 1e-3) { problems.push(`${at}: skin weights sum to ${sum} at vertex ${v}`); break; }
      }
    }
  }

  
  
  
  const morphs = payload.morphs;
  if (!morphs || typeof morphs !== 'object' || Array.isArray(morphs)) problems.push(`${where}: no morphs object`);
  else {
    const vcounts = new Map(payload.groups.map((g) => [g.material, g.position && g.position.length / 3]));
    for (const [name, m] of Object.entries(morphs)) {
      const at = `${where}: morph '${name}'`;
      if (!m || !vcounts.has(m.group)) { problems.push(`${at} names no group (${m && m.group})`); continue; }
      const want = vcounts.get(m.group) * 3;
      for (const key of ['deltas', 'colorDeltas']) {
        const a = m[key];
        if (!a) { if (key === 'deltas') problems.push(`${at}: no deltas`); continue; }
        if (!a.BYTES_PER_ELEMENT || a.length !== want) { problems.push(`${at}: ${key} has ${a.length} values, expected ${want}`); continue; }
        for (let i = 0; i < a.length; i++) {
          if (!Number.isFinite(a[i])) { problems.push(`${at}: ${key} ${i} is ${a[i]}`); break; }
        }
      }
    }
  }

  if (triangles !== payload.triangles) problems.push(`${where}: ${triangles} triangles in the groups, ${payload.triangles} recorded`);

  
  
  
  
  if (bones && skinned !== payload.groups.length) problems.push(`${where}: rigged, but ${skinned} of ${payload.groups.length} groups carry skin attributes`);
  if (!bones && skinned) problems.push(`${where}: skinned groups but no rig`);

  return problems;
}
