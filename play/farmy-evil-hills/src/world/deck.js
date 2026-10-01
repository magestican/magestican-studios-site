









import * as THREE from 'three';
import { WALL_H, hash2 } from '../constants.js';
import { grimeTexture, panel, texturedMaterial } from './textures.js';
import { quadGeo, boxGeo, cylGeo, readyGeometry } from './kit.js';






import { inwardYaw } from '../../../../web-engine/horror/facing.mjs';













































export function buildDeck(scene, level, opts = {}) {
  const kit = opts.kit || null;
  const strips = [];
  const ceilingPieces = [];   
  const signs = [];

  
  let walls; let floors; let ceils; let endMat; let safeMat; let safeFloor;
  const mats = new Map();
  const matFor = (tex) => {
    if (!mats.has(tex)) mats.set(tex, texturedMaterial(tex));
    return mats.get(tex);
  };
  if (kit) {
    walls = [kit.mat.wallA, kit.mat.wallB, kit.mat.wallC, kit.mat.wallA];
    floors = [kit.mat.floor, kit.mat.floor, kit.mat.floorAlt];
    ceils = [kit.mat.ceiling];
    endMat = kit.mat.wallA;
    safeMat = kit.mat.wallC;
    safeFloor = kit.mat.floorAlt;
  } else {
    walls = [
      grimeTexture({ base: 0x9aa48c, seams: true, rivets: true, mud: 5, blood: 4, hay: 0 }),
      grimeTexture({ base: 0x939d86, seams: true, rivets: false, mud: 9, blood: 2, hay: 0 }),
      grimeTexture({ base: 0xa1ab92, seams: true, rivets: true, mud: 3, blood: 8, hay: 0 }),
      grimeTexture({ base: 0x8f9982, seams: true, rivets: true, mud: 7, blood: 1, hay: 0 }),
    ].map(matFor);
    floors = [
      grimeTexture({ base: 0x6f7562, seams: true, rivets: false, mud: 13, blood: 6, hay: 22 }),
      grimeTexture({ base: 0x6a705e, seams: true, rivets: false, mud: 8, blood: 11, hay: 34 }),
      grimeTexture({ base: 0x737a66, seams: true, rivets: true, mud: 17, blood: 3, hay: 14 }),
    ].map(matFor);
    ceils = [
      grimeTexture({ base: 0x555c48, seams: true, rivets: true, mud: 3, blood: 2, hay: 0 }),
      grimeTexture({ base: 0x4f5644, seams: true, rivets: true, mud: 1, blood: 5, hay: 0 }),
    ].map(matFor);
    endMat = matFor(grimeTexture({ base: 0x5e6552, seams: true, rivets: true, mud: 5, blood: 5, hay: 0 }));
    
    
    
    safeMat = matFor(grimeTexture({ base: 0x7f8a94, seams: true, rivets: true, mud: 2, blood: 0, hay: 4 }));
    safeFloor = safeMat;
  }

  
  
  
  const SUB = 0.8;
  let bucket = null;
  const buckets = [];
  const section = (name) => { bucket = { name, byMat: new Map() }; buckets.push(bucket); };
  const tmp = new THREE.Object3D();
  let salt = 0;
  const add = (w, h, mat, tile, fn) => {
    salt += 1;
    const off = hash2(salt * 3.7, 5.5);
    const sw = Math.max(1, Math.round(w / SUB));
    const sh = Math.max(1, Math.round(h / SUB));
    const g = new THREE.PlaneGeometry(w, h, sw, sh).toNonIndexed();
    const uv = g.attributes.uv;
    for (let k = 0; k < uv.count; k += 1) uv.setXY(k, uv.getX(k) * (w / tile) + off * 3.1, uv.getY(k) * (h / tile));
    tmp.position.set(0, 0, 0); tmp.rotation.set(0, 0, 0); tmp.scale.set(1, 1, 1);
    fn(tmp);
    tmp.updateMatrix();
    g.applyMatrix4(tmp.matrix);
    if (!bucket.byMat.has(mat)) bucket.byMat.set(mat, []);
    bucket.byMat.get(mat).push(g);
    return g;
  };
  const flush = () => {
    const out = [];
    for (const b of buckets) {
      for (const [mat, list] of b.byMat) {
        let n = 0;
        for (const g of list) n += g.attributes.position.count;
        const pos = new Float32Array(n * 3); const nrm = new Float32Array(n * 3); const uv = new Float32Array(n * 2);
        let at = 0;
        for (const g of list) {
          const c = g.attributes.position.count;
          pos.set(g.attributes.position.array, at * 3);
          nrm.set(g.attributes.normal.array, at * 3);
          uv.set(g.attributes.uv.array, at * 2);
          at += c;
          g.dispose();
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
        geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
        geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
        geo.setAttribute('aColor', new THREE.Float32BufferAttribute(new Float32Array(n * 3).fill(1), 3));
        const m = new THREE.Mesh(geo, mat);
        m.userData.section = b.name;
        scene.add(m);
        out.push(m);
      }
    }
    return out;
  };
  const pick = (arr, i, s2) => arr[Math.floor(hash2(i * 7.3 + s2, 2.1) * arr.length) % arr.length];

  const W = level.width;
  const H = level.height;
  const HALFW = W / 2;
  const SEG = 3.2;                 

  
  const doors = level.rooms.map((m) => ({ x: m.door.x, z: m.door.z, w: m.door.w }));
  const inDoor = (x, z) => doors.some((d) => Math.abs(x - d.x) < W * 0.6 && Math.abs(z - d.z) < d.w);

  
  level.runs.forEach((run, i) => {
    section(`run${i}`);
    const len = Math.hypot(run.x1 - run.x0, run.z1 - run.z0);
    const dx = (run.x1 - run.x0) / len;
    const dz = (run.z1 - run.z0) / len;
    const px = -dz; const pz = dx;                 
    
    
    const t0 = i === 0 ? -HALFW : HALFW;
    const t1 = i === level.runs.length - 1 ? len + HALFW : len - HALFW;
    const span = t1 - t0;
    if (!(span > 0.1)) return;
    const yaw = Math.atan2(dx, dz);              

    const count = Math.max(1, Math.round(span / SEG));
    for (let k = 0; k < count; k += 1) {
      const a = t0 + (k / count) * span;
      const b = t0 + ((k + 1) / count) * span;
      const mid = (a + b) / 2;
      const segLen = b - a;
      const cx = run.x0 + dx * mid;
      const cz = run.z0 + dz * mid;

      add(W, segLen, pick(floors, i * 9 + k, 0.1), 2.2, (m) => {
        m.rotation.x = -Math.PI / 2; m.rotation.z = -yaw; m.position.set(cx, 0, cz);
      });
      add(W, segLen, pick(ceils, i * 9 + k, 0.4), 2.2, (m) => {
        m.rotation.x = Math.PI / 2; m.rotation.z = yaw; m.position.set(cx, H, cz);
      });

      for (const sgn of [-1, 1]) {
        const wx = cx + px * HALFW * sgn;
        const wz = cz + pz * HALFW * sgn;
        if (inDoor(wx, wz)) continue;              
        add(segLen, WALL_H, pick(walls, i * 9 + k, sgn > 0 ? 0.9 : 0.2), 2.2, (m) => {
          m.rotation.y = inwardYaw(px * sgn, pz * sgn);
          m.position.set(wx, WALL_H / 2, wz);
        });
      }
    }

    if (kit) {
      
      
      const pipeAt = (lat, y, r) => {
        const g = cylGeo(r, r, span, 8, 0.5);
        g.rotateX(Math.PI / 2);          
        g.rotateY(yaw);                  
        g.translate(run.x0 + dx * (t0 + span / 2) + px * lat, y, run.z0 + dz * (t0 + span / 2) + pz * lat);
        const m = new THREE.Mesh(g, kit.mat.pipe);
        m.userData.section = `run${i}`;
        scene.add(m);
        return m;
      };
      pipeAt(HALFW - 0.17, H - 0.17, 0.09);
      pipeAt(-(HALFW - 0.17), H - 0.17, 0.09);
      pipeAt(HALFW - 0.09, H - 0.42, 0.045);
      
      for (let t = 4.5; t < len - 3; t += 9.7) {
        const side = hash2(t + i * 3.3, 4.4) > 0.5 ? 1 : -1;
        const gx = run.x0 + dx * t + px * side * (HALFW - 0.02);
        const gz = run.z0 + dz * t + pz * side * (HALFW - 0.02);
        if (inDoor(gx, gz)) continue;
        const gm = new THREE.Mesh(quadGeo(0.62, 0.4, 0.6, { stretch: true }), kit.mat.grille);
        gm.position.set(gx, 0.28, gz);
        gm.rotation.y = inwardYaw(px * side, pz * side);
        scene.add(gm);
      }
    }
  });

  
  for (let i = 0; i < level.runs.length - 1; i += 1) {
    section(`junction${i}`);
    const a = level.runs[i]; const b = level.runs[i + 1];
    const jx = a.x1; const jz = a.z1;
    add(W, W, pick(floors, i, 3.3), 2.2, (m) => { m.rotation.x = -Math.PI / 2; m.position.set(jx, 0, jz); });
    add(W, W, pick(ceils, i, 4.4), 2.2, (m) => { m.rotation.x = Math.PI / 2; m.position.set(jx, H, jz); });

    
    
    
    const alen = Math.hypot(a.x1 - a.x0, a.z1 - a.z0);
    const blen = Math.hypot(b.x1 - b.x0, b.z1 - b.z0);
    const inDir = { x: (a.x1 - a.x0) / alen, z: (a.z1 - a.z0) / alen };   
    const outDir = { x: (b.x1 - b.x0) / blen, z: (b.z1 - b.z0) / blen };  
    const sides = [
      { x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 },
    ];
    for (const sd of sides) {
      const open = (sd.x * outDir.x + sd.z * outDir.z) > 0.5     
        || (sd.x * -inDir.x + sd.z * -inDir.z) > 0.5;            
      if (open) continue;
      add(W, WALL_H, pick(walls, i, 5.5), 2.2, (m) => {
        m.rotation.y = Math.atan2(sd.x, sd.z) + Math.PI;
        m.position.set(jx + sd.x * HALFW, WALL_H / 2, jz + sd.z * HALFW);
      });
      if (kit) {
        
        
        const st = new THREE.Mesh(quadGeo(W - 0.1, 0.22, 0.7), kit.mat.stripes);
        st.position.set(jx + sd.x * (HALFW - 0.015), 0.13, jz + sd.z * (HALFW - 0.015));
        st.rotation.y = Math.atan2(sd.x, sd.z) + Math.PI;
        scene.add(st);
        
        if ((sd.x * inDir.x + sd.z * inDir.z) > 0.5) {
          const sg = new THREE.Mesh(quadGeo(0.7, 0.7, 1, { stretch: true }), kit.sign);
          sg.position.set(jx + sd.x * (HALFW - 0.02), 1.75, jz + sd.z * (HALFW - 0.02));
          sg.rotation.y = Math.atan2(sd.x, sd.z) + Math.PI;
          scene.add(sg);
          signs.push(sg);
        }
      }
    }
  }

  
  level.rooms.forEach((m, ri) => {
    section(`room${ri}`);
    const rw = m.x1 - m.x0; const rd = m.z1 - m.z0;
    const cx = (m.x0 + m.x1) / 2; const cz = (m.z0 + m.z1) / 2;
    const tex = m.kind === 'safe' ? safeMat : pick(walls, 3 + ri, 6.6);
    add(rw, rd, m.kind === 'safe' ? safeFloor : pick(floors, 2, 7.7), 2.6,
      (p2) => { p2.rotation.x = -Math.PI / 2; p2.position.set(cx, 0, cz); });
    add(rw, rd, pick(ceils, 1, 8.8), 2.6,
      (p2) => { p2.rotation.x = Math.PI / 2; p2.position.set(cx, H, cz); });

    
    add(rw, WALL_H, tex, 2.6, (p2) => { p2.position.set(cx, WALL_H / 2, m.z0); p2.rotation.y = 0; });
    add(rw, WALL_H, tex, 2.6, (p2) => { p2.position.set(cx, WALL_H / 2, m.z1); p2.rotation.y = Math.PI; });
    const far = m.side > 0 ? m.x1 : m.x0;
    add(rd, WALL_H, tex, 2.6, (p2) => {
      p2.position.set(far, WALL_H / 2, cz);
      p2.rotation.y = m.side > 0 ? -Math.PI / 2 : Math.PI / 2;
    });
    
    const near = m.door.x;
    const gap = m.door.w / 2;
    for (const [za, zb] of [[m.z0, m.door.z - gap], [m.door.z + gap, m.z1]]) {
      const h2 = zb - za;
      if (h2 < 0.2) continue;
      add(h2, WALL_H, tex, 2.6, (p2) => {
        p2.position.set(near, WALL_H / 2, (za + zb) / 2);
        p2.rotation.y = m.side > 0 ? Math.PI / 2 : -Math.PI / 2;
      });
    }
    if (kit) {
      
      
      
      const leaf = new THREE.Mesh(quadGeo(m.door.w * 0.5, WALL_H - 0.35, 1, { stretch: true }), kit.mat.doorLeaf);
      const hinge = new THREE.Group();
      hinge.position.set(near + m.side * 0.05, (WALL_H - 0.35) / 2, m.door.z + gap);
      leaf.position.set(0, 0, -m.door.w * 0.25);
      hinge.add(leaf);
      hinge.rotation.y = -m.side * 1.745;   
      scene.add(hinge);
      
      const lintel = new THREE.Mesh(boxGeo(0.12, 0.12, m.door.w + 0.3, 0.4), kit.mat.steel);
      lintel.position.set(near, WALL_H - 0.3, m.door.z);
      scene.add(lintel);
      for (const zs of [-1, 1]) {
        const jamb = new THREE.Mesh(boxGeo(0.12, WALL_H - 0.3, 0.12, 0.4), kit.mat.steel);
        jamb.position.set(near, (WALL_H - 0.3) / 2, m.door.z + zs * (gap + 0.06));
        scene.add(jamb);
      }
    }
  });

  
  
  
  
  
  
  
  section('ends');
  const capAt = (x, z, yaw) => {
    const bay = (level.bays || []).find((b) => x > b.x0 - 0.05 && x < b.x1 + 0.05 && z > b.z0 - 0.05 && z < b.z1 + 0.05);
    if (!bay) {
      add(W, H, endMat, 2.2, (mm) => { mm.position.set(x, H / 2, z); mm.rotation.y = yaw; });
      return;
    }
    const f = bay.car.face || { x: 0, z: -1 };
    const half = f.x !== 0 ? (bay.z1 - bay.z0) / 2 : (bay.x1 - bay.x0) / 2;
    const flank = HALFW - half;
    if (flank < 0.15) return;
    const ax = f.x !== 0 ? 0 : 1; const az = f.x !== 0 ? 1 : 0;
    for (const sgn of [-1, 1]) {
      const c = half + flank / 2;
      add(flank, H, endMat, 2.2, (mm) => { mm.position.set(x + ax * sgn * c, H / 2, z + az * sgn * c); mm.rotation.y = yaw; });
    }
  };
  const first = level.runs[0];
  capAt(first.x0, first.z0 - HALFW, 0);
  const last = level.runs[level.runs.length - 1];
  capAt(last.x1, last.z1 + HALFW, Math.PI);
  if (kit) {
    
    const len0 = Math.hypot(first.x1 - first.x0, first.z1 - first.z0);
    const dx = (first.x1 - first.x0) / len0; const dz = (first.z1 - first.z0) / len0;
    const px = -dz; const pz = dx;
    for (const sgn of [-1, 1]) {
      const sx = first.x0 + dx * 2.2 + px * sgn * (HALFW - 0.02);
      const sz = first.z0 + dz * 2.2 + pz * sgn * (HALFW - 0.02);
      if (inDoor(sx, sz)) continue;
      const sg = new THREE.Mesh(quadGeo(0.7, 0.7, 1, { stretch: true }), kit.sign);
      sg.position.set(sx, 1.75, sz);
      sg.rotation.y = inwardYaw(px * sgn, pz * sgn);
      scene.add(sg);
      signs.push(sg);
    }
  }

  const surfaces = flush();

  
  
  
  if (!kit) {
    const stripTex = grimeTexture({ base: 0xe8f0c8, seams: false, rivets: false, mud: 1, blood: 0, hay: 0 });
    for (const run of level.runs) {
      const len = Math.hypot(run.x1 - run.x0, run.z1 - run.z0);
      const dx = (run.x1 - run.x0) / len; const dz = (run.z1 - run.z0) / len;
      for (let t = 2; t < len - 1; t += 7) {
        const lm = texturedMaterial(stripTex);
        lm.transparent = true;
        const x = run.x0 + dx * t; const z = run.z0 + dz * t;
        const strip = panel(0.5, 1.6, 1.6, {
          mat: lm,
          apply: (m) => {
            m.rotation.x = Math.PI / 2;
            m.rotation.z = Math.atan2(dx, dz);
            m.position.set(x, H - 0.02, z);
          },
        });
        scene.add(strip);
        strips.push({ mesh: strip, mat: lm, phase: hash2(x * 3.1 + z, 7.7) * 10, next: 3 + hash2(z, 2.2) * 12 });
      }
    }
  }
  return { strips, ceilingPieces, surfaces, signs };
}


export { readyGeometry };






export function pushOutOfPillars(list, p, pad) {
  for (const q of list) {
    const dx = p.x - q.x; const dz = p.z - q.z;
    const d = Math.hypot(dx, dz);
    const min = q.r + pad;
    if (d < min && d > 1e-6) {
      return { x: q.x + (dx / d) * min, z: q.z + (dz / d) * min };
    }
  }
  return p;
}
