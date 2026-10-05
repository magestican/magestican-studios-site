














export const PACK_VERSION = 1;

export const PACK_SOURCES = [
  'js/game/art/scenery/kit.js', 'js/game/art/scenery/huts.js', 'js/game/art/scenery/rocks.js', 'js/game/art/scenery/steps.js',
  'js/game/art/scenery/torches.js', 'js/game/art/scenery/fences.js', 'js/game/art/scenery/flowerBeds.js', 'js/game/art/scenery/spring.js',
  'js/game/art/scenery/lavaCrater.js', 'js/game/art/scenery/growth.js', 'js/game/art/scenery/temple.js', 'js/game/art/scenery/doorProps.js', 'js/game/art/scenery/life.js', 'js/game/art/scenery/crystals.js', 'js/game/art/scenery/lair.js', 'js/game/art/scenery/magma.js',
  'js/vendor/fml/moon/mesh/sdf.js', 'js/vendor/fml/moon/mesh/meshData.js', 'js/vendor/fml/moon/noise.js',
];


export function hashSources(texts) {
  let h = 2166136261;
  for (const t of texts) {
    const s = t.replace(/\r/g, '');
    for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
    h = Math.imul(h ^ 10, 16777619);
  }
  return (h >>> 0).toString(16);
}


export function packForms(forms, hash) {
  const header = { version: PACK_VERSION, hash, forms: [] };
  let at = 0;
  const blocks = [];
  for (const [name, a] of forms) {
    const f = { name, triangles: a.triangles, groups: [] };
    for (const g of a.groups) {
      const v = g.position.length / 3, i = g.index.length;
      f.groups.push({ material: g.material, v, i, at });
      blocks.push([at, g]);
      at += (v * 11 + i) * 4;
    }
    header.forms.push(f);
  }
  const json = new TextEncoder().encode(JSON.stringify(header));
  const start = Math.ceil((4 + json.length) / 4) * 4;
  const buf = new ArrayBuffer(start + at), u8 = new Uint8Array(buf);
  new DataView(buf).setUint32(0, json.length, true);
  u8.set(json, 4);
  for (const [off, g] of blocks) {
    const v = g.position.length / 3;
    let o = start + off;
    for (const [arr, n] of [[g.position, v * 3], [g.normal, v * 3], [g.color, v * 3], [g.uv, v * 2]]) {
      new Float32Array(buf, o, n).set(arr); o += n * 4;
    }
    new Uint32Array(buf, o, g.index.length).set(g.index);
  }
  return u8;
}


export function unpackForms(buffer) {
  const dv = new DataView(buffer), len = dv.getUint32(0, true);
  const header = JSON.parse(new TextDecoder().decode(new Uint8Array(buffer, 4, len)));
  if (header.version !== PACK_VERSION) return { hash: header.hash, forms: [] };
  const start = Math.ceil((4 + len) / 4) * 4;
  const forms = header.forms.map((f) => [f.name, {
    name: f.name, triangles: f.triangles,
    groups: f.groups.map((g) => {
      let o = start + g.at;
      const take = (n) => { const a = new Float32Array(buffer, o, n); o += n * 4; return a; };
      const position = take(g.v * 3), normal = take(g.v * 3), color = take(g.v * 3), uv = take(g.v * 2);
      return { material: g.material, position, normal, color, uv, index: new Uint32Array(buffer, o, g.i) };
    }),
  }]);
  return { hash: header.hash, forms };
}
