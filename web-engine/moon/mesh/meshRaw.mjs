


















import { MeshData } from './meshData.mjs';

export function toRaw(md) {
  if (md.rig) throw new Error(`${md.name}: toRaw carries static meshes only (it has a rig)`);
  if (Object.keys(md.morphs || {}).length) throw new Error(`${md.name}: toRaw carries static meshes only (it has morphs)`);
  if ((md.movingParts || []).length) throw new Error(`${md.name}: toRaw carries static meshes only (it has moving parts)`);
  const groups = [];
  for (const g of md.groups.values()) {
    const fields = [];
    for (const [k, v] of Object.entries(g)) {
      if (k === 'material') continue;
      if (!Array.isArray(v)) throw new Error(`${md.name}: group ${g.material} field ${k} is not an array`);
      fields.push([k, Float64Array.from(v)]);
    }
    groups.push({ material: g.material, fields });
  }
  return { raw: 1, name: md.name, groups };
}


export function rawBuffers(raw) {
  const out = [];
  for (const g of raw.groups) for (const [, a] of g.fields) out.push(a.buffer);
  return out;
}

export function fromRaw(raw) {
  if (!raw || raw.raw !== 1) throw new Error('fromRaw: not a raw mesh');
  const md = new MeshData(raw.name);
  for (const { material, fields } of raw.groups) {
    const g = { material };
    for (const [k, a] of fields) g[k] = Array.from(a);
    md.groups.set(material, g);
  }
  return md;
}
