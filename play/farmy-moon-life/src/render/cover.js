




import * as THREE from 'three';
import { generate } from 'moon/art/groundCover.mjs';
import { scatterCover, scatterPathEdge } from 'moon/world/coverScatter.mjs';
import { seasonPalette, linear } from 'moon/palette/seasons.mjs';
import { cozyMaterial } from './material.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));




export async function createGroundCover({ season, count, seed = 1, layout }) {
  
  
  
  
  
  
  
  
  
  
  
  
  const lawn = scatterCover({ season, count, seed, layout });
  lawn.forEach((it, i) => { it.lawnIndex = i; });
  const items = [...lawn, ...scatterPathEdge({ season, seed, layout })];
  const group = new THREE.Group();
  group.name = 'ground-cover';
  const ref = linear(seasonPalette(season).grass[1]);
  const buckets = new Map();
  for (const it of items) {
    const key = `${it.kind}|${it.variant}`;
    if (!buckets.has(key)) buckets.set(key, []);
    const list = buckets.get(key);
    it.ord = list.length;
    list.push(it);
  }
  
  for (const [key, list] of buckets) {
    buckets.set(key, [...list.filter((it) => it.lawnIndex === undefined), ...list.filter((it) => it.lawnIndex !== undefined)]);
  }
  const parts = [];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), sc = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0), col = new THREE.Color();
  let triangles = 0;
  const problems = [];
  for (const [key, list] of buckets) {
    const [kind, variant] = key.split('|');
    const data = generate({ seed: Number(variant) + 1, season, kind, lod: 0 });
    problems.push(...data.validate());
    for (const g of data.toArrays().groups) {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.BufferAttribute(g.position, 3));
      geometry.setAttribute('normal', new THREE.BufferAttribute(g.normal, 3));
      geometry.setAttribute('color', new THREE.BufferAttribute(g.color, 3));
      geometry.setAttribute('uv', new THREE.BufferAttribute(g.uv, 2));
      if (g.sway) geometry.setAttribute('fmlSway', new THREE.BufferAttribute(g.sway, 1));
      if (g.ripple) geometry.setAttribute('fmlRipple', new THREE.BufferAttribute(g.ripple, 1));
      geometry.setIndex(new THREE.BufferAttribute(g.index, 1));
      const material = await cozyMaterial(g.material);
      const mesh = new THREE.InstancedMesh(geometry, material, list.length);
      list.forEach((it, slot) => {
        const i = it.ord;
        q.setFromAxisAngle(up, it.rotY);
        pos.set(it.x, it.y, it.z);
        sc.setScalar(it.scale);
        m4.compose(pos, q, sc);
        mesh.setMatrixAt(slot, m4);
        const jitter = 0.94 + ((i * 7919) % 13) / 100;
        
        
        if (g.material === 'grass' || g.material === 'snow') {
          col.setRGB(clamp(it.tint[0] / ref[0], 0.6, 1.4) * jitter, clamp(it.tint[1] / ref[1], 0.6, 1.4) * jitter, clamp(it.tint[2] / ref[2], 0.6, 1.4) * jitter, THREE.LinearSRGBColorSpace);
        } else {
          col.setRGB(jitter, jitter, jitter, THREE.LinearSRGBColorSpace);
        }
        mesh.setColorAt(slot, col);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.frustumCulled = false;
      mesh.receiveShadow = true;
      mesh.castShadow = false;
      mesh.name = `cover/${key}/${g.material}`;
      group.add(mesh);
      const perInstance = g.index.length / 3;
      triangles += perInstance * list.length;
      parts.push({
        mesh,
        list,
        perInstance,
        edgeCount: list.filter((it) => it.lawnIndex === undefined).length,
        lawnIndices: list.filter((it) => it.lawnIndex !== undefined).map((it) => it.lawnIndex),
      });
    }
  }
  let drawn = triangles;
  const reheight = (heightAt) => {
    
    
    
    
    
    for (const part of parts) {
      part.list.forEach((it, slot) => {
        it.y = heightAt(it.x, it.z);
        q.setFromAxisAngle(up, it.rotY);
        pos.set(it.x, it.y, it.z);
        sc.setScalar(it.scale);
        m4.compose(pos, q, sc);
        part.mesh.setMatrixAt(slot, m4);
      });
      part.mesh.instanceMatrix.needsUpdate = true;
    }
  };
  return {
    group,
    triangles,
    count: items.length,
    problems,
    reheight,
    
    get drawnTriangles() { return drawn; },
    










    setDensity(fraction) {
      const f = Math.max(0, Math.min(1, fraction));
      const target = Math.round(lawn.length * f);
      let total = 0;
      for (const part of parts) {
        let n = part.edgeCount;
        for (const index of part.lawnIndices) if (index < target) n += 1;
        part.mesh.count = n;
        total += part.perInstance * n;
      }
      drawn = total;
      return total;
    },
  };
}
