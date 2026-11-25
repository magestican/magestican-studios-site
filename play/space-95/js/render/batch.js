




import * as THREE from 'three';





export function mergeGeometries(geos) {
  const names = Object.keys(geos[0].attributes);
  
  const data = Object.fromEntries(names.map((n) => [n, []]));
  
  const index = [];
  let base = 0;
  for (const g of geos) {
    const count = g.attributes.position.count;
    for (const n of names) {
      const a = g.attributes[n];
      if (!a) throw new Error(`mergeGeometries: a geometry has no '${n}' attribute`);
      for (let i = 0; i < a.count; i++) for (let k = 0; k < a.itemSize; k++) data[n].push(a.array[i * a.itemSize + k]);
    }
    if (g.index) for (let i = 0; i < g.index.count; i++) index.push(base + g.index.array[i]);
    else for (let i = 0; i < count; i++) index.push(base + i);
    base += count;
  }
  const out = new THREE.BufferGeometry();
  for (const n of names) out.setAttribute(n, new THREE.Float32BufferAttribute(data[n], geos[0].attributes[n].itemSize));
  out.setIndex(index);
  out.computeBoundingSphere();
  return out;
}






export function batchStatic(group, cell) {
  const out = new THREE.Group();
  out.name = group.name;
  
  const buckets = new Map();
  const centre = new THREE.Vector3();
  for (const m of [...group.children]) {
    const mesh =  (m);
    if (!mesh.isMesh || mesh.children.length || Array.isArray(mesh.material)) {
      out.add(m);
      continue;
    }
    mesh.updateMatrix();
    const geo = mesh.geometry.clone().applyMatrix4(mesh.matrix);
    mesh.geometry.dispose();
    geo.computeBoundingBox();
     (geo.boundingBox).getCenter(centre);
    const key = `${mesh.material.uuid}:${Math.floor(centre.x / cell)}:${Math.floor(centre.y / cell)}`;
    let b = buckets.get(key);
    if (!b) {
      b = { material: mesh.material, geos: [] };
      buckets.set(key, b);
    }
    b.geos.push(geo);
  }
  for (const { material, geos } of buckets.values()) {
    out.add(new THREE.Mesh(mergeGeometries(geos), material));
    for (const g of geos) g.dispose();
  }
  return out;
}
