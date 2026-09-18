







































import * as THREE from 'three';
import { MeshData, compose, translate, rotateY } from 'moon/mesh/meshData.mjs';
import { generate as generateSign, anchors as signAnchors, boundaryRun } from 'moon/art/parcelSign.mjs';
import { PARCELS, parcelAt } from 'moon/world/parcels.mjs';
import { landMask, notMine } from 'moon/play/landEdge.mjs';
import { FOCUS, PATH_HALF_WIDTH, heightAt, pathDistance } from 'moon/world/moonLayout.mjs';
import { penetration } from 'moon/world/collision.mjs';
import { setLandMask } from '../render/ground.js';
import { toObject3D } from '../render/toMesh.js';

export const LAND_DRAW = Object.freeze({
  
  farLodM: 24,
  
  
  stakeSpacingM: 2.4,
  insetM: 0.45,
  pathClearM: PATH_HALF_WIDTH + 0.3,
  maxPushM: 2.4,
  obstacleClearM: 0.15,
  
  popS: 0.55,
});


export const signSeed = (id) => id + 1;


export function signPlacement(id) {
  const s = PARCELS[id].sign;
  return { x: s.x, y: heightAt(s.x, s.z), z: s.z, rotY: s.rotY, seed: signSeed(id) };
}


function signToWorld(p, lx, ly, lz) {
  const c = Math.cos(p.rotY), s = Math.sin(p.rotY);
  return { x: p.x + lx * c + lz * s, y: p.y + ly, z: p.z - lx * s + lz * c };
}






export function stakePoints(id, { obstacles = [], cfg = LAND_DRAW } = {}) {
  const outline = PARCELS[id].outline;
  const M = outline.length;
  let perimeter = 0;
  for (let k = 0; k < M; k++) perimeter += Math.hypot(outline[(k + 1) % M][0] - outline[k][0], outline[(k + 1) % M][1] - outline[k][1]);
  const count = Math.max(4, Math.round(perimeter / cfg.stakeSpacingM));
  const step = perimeter / count;
  const out = [];
  let k = 0, along = 0;
  for (let i = 0; i < count; i++) {
    const target = i * step;
    while (along + Math.hypot(outline[(k + 1) % M][0] - outline[k][0], outline[(k + 1) % M][1] - outline[k][1]) < target && k < M - 1) {
      along += Math.hypot(outline[(k + 1) % M][0] - outline[k][0], outline[(k + 1) % M][1] - outline[k][1]);
      k++;
    }
    const a = outline[k], b = outline[(k + 1) % M];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const t = Math.min(1, (target - along) / len);
    const px = a[0] + (b[0] - a[0]) * t, pz = a[1] + (b[1] - a[1]) * t;
    
    let nx = -(b[1] - a[1]) / len, nz = (b[0] - a[0]) / len;
    if (parcelAt(px + nx * 0.3, pz + nz * 0.3) !== id) { nx = -nx; nz = -nz; }
    let placed = null;
    for (let push = cfg.insetM; push <= cfg.maxPushM + 1e-9; push += 0.2) {
      const x = px + nx * push, z = pz + nz * push;
      if (parcelAt(x, z) !== id) break;
      if (pathDistance(x, z) < cfg.pathClearM) continue;
      if (obstacles.some((ob) => penetration(ob, x, z, cfg.obstacleClearM).depth > 0)) continue;
      placed = { x, z };
      break;
    }
    out.push(placed);
  }
  return out;
}

const disposeTree = (obj) => obj.traverse((o) => { if (o.isMesh) o.geometry.dispose(); });
const meshCount = (obj) => { let n = 0; if (obj) obj.traverse((o) => { if (o.isMesh) n++; }); return n; };

export function createLandDraw({ scene, season = 'summer', obstacles = [], onProblems = () => {} }) {
  const root = new THREE.Group();
  root.name = 'land';
  scene.add(root);
  const cache = new Map();
  const pops = [];
  let signsObj = null, outlineObj = null, shown = [], owned = [], triangles = 0, outlineTriangles = 0, rebuilds = 0;
  let wanted = '', drawn = '', queued = null, running = null, highlighted = null, highlightToken = 0;
  
  
  
  let edgeIds = [], edgeTexels = 0;

  const lodFor = (p) => (Math.hypot(p.x - FOCUS.x, p.z - FOCUS.z) > LAND_DRAW.farLodM ? 1 : 0);

  function signData(seed, lod) {
    const key = `${seed}|${lod}`;
    let data = cache.get(key);
    if (!data) {
      data = generateSign({ seed, season, lod });
      onProblems(data.validate());
      cache.set(key, data);
    }
    return data;
  }

  async function buildSigns(ids) {
    const data = new MeshData('parcel-signs');
    for (const id of ids) {
      const p = signPlacement(id);
      data.append(signData(p.seed, lodFor(p)), compose(translate(p.x, p.y, p.z), rotateY(p.rotY)));
    }
    const obj = data.triangleCount ? await toObject3D(data) : new THREE.Group();
    obj.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
    if (signsObj) { root.remove(signsObj); disposeTree(signsObj); }
    signsObj = obj;
    root.add(obj);
    triangles = data.triangleCount;
    rebuilds += 1;
  }

  





















  async function buildEdges(ownedIds) {
    const ids = notMine(ownedIds);
    const mask = landMask(ownedIds);
    setLandMask(mask);
    edgeIds = ids;
    edgeTexels = mask.size * mask.size;
  }

  async function popSign(id) {
    const p = signPlacement(id);
    const entry = { startS: null, obj: null, group: new THREE.Group() };
    entry.group.position.set(p.x, p.y, p.z);
    entry.group.rotation.y = p.rotY;
    pops.push(entry);
    const obj = await toObject3D(signData(p.seed, 0));
    obj.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
    entry.group.add(obj);
    root.add(entry.group);
    entry.obj = obj;
  }

  



  function show(ownedIds, forSaleIds) {
    const next = [...forSaleIds].sort((a, b) => a - b);
    const gone = shown.filter((id) => !next.includes(id) && ownedIds.includes(id));
    for (const id of gone) popSign(id);
    shown = next;
    owned = [...ownedIds];
    wanted = next.join(',');
    queued = next;
    if (!running) {
      running = (async () => {
        while (queued) {
          const ids = queued;
          queued = null;
          await buildSigns(ids);
          
          
          
          
          await buildEdges(owned);
          drawn = ids.join(',');
        }
      })().finally(() => { running = null; });
    }
    return running;
  }

  
  async function highlight(id) {
    if (id === highlighted) return;
    highlighted = id;
    const token = ++highlightToken;
    let obj = new THREE.Group();
    let tris = 0;
    if (id !== null && id !== undefined && PARCELS[id]) {
      const pts = stakePoints(id, { obstacles });
      const data = new MeshData(`parcel-outline-${id}`);
      const lod = (p) => (Math.hypot(p.x - FOCUS.x, p.z - FOCUS.z) > LAND_DRAW.farLodM ? 1 : 0);
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        if (!a) continue;
        const b = pts[(i + 1) % pts.length];
        const near = b && Math.hypot(b.x - a.x, b.z - a.z) <= LAND_DRAW.stakeSpacingM * 1.8;
        boundaryRun(data, [a.x, heightAt(a.x, a.z), a.z], near ? [b.x, heightAt(b.x, b.z), b.z] : null, { seed: id + 1, season, lod: lod(a), index: i });
      }
      onProblems(data.validate());
      if (data.triangleCount) obj = await toObject3D(data, { castShadow: false });
      tris = data.triangleCount;
    }
    if (token !== highlightToken) { disposeTree(obj); return; }
    obj.traverse((o) => { if (o.isMesh) o.frustumCulled = false; });
    if (outlineObj) { root.remove(outlineObj); disposeTree(outlineObj); }
    outlineObj = obj;
    outlineTriangles = tris;
    root.add(obj);
  }

  function update(nowS) {
    for (let i = pops.length - 1; i >= 0; i--) {
      const f = pops[i];
      if (!f.obj) continue;
      if (f.startS === null) f.startS = nowS;
      const t = Math.min(1, (nowS - f.startS) / LAND_DRAW.popS);
      const swell = t < 0.25 ? 1 + 0.2 * (t / 0.25) : 1.2 * (1 - ((t - 0.25) / 0.75) ** 2);
      f.obj.scale.setScalar(Math.max(0.001, swell));
      f.obj.position.y = 0.35 * Math.sin(Math.PI * Math.min(1, t * 1.3));
      f.obj.rotation.y = 0.9 * t * t;
      if (t >= 1) {
        root.remove(f.group);
        disposeTree(f.obj);
        pops.splice(i, 1);
      }
    }
  }

  
  function labelPoints() {
    return shown.map((id) => {
      const p = signPlacement(id);
      const { label } = signAnchors({ seed: p.seed });
      const centre = signToWorld(p, label.x, label.y, label.z);
      const right = signToWorld(p, label.x + label.width / 2, label.y, label.z);
      return { id, x: centre.x, y: centre.y, z: centre.z, halfWidth: { x: right.x - centre.x, z: right.z - centre.z } };
    });
  }

  function dispose() {
    for (const f of pops) if (f.obj) disposeTree(f.obj);
    if (signsObj) disposeTree(signsObj);
    if (outlineObj) disposeTree(outlineObj);
    scene.remove(root);
  }

  return {
    root, show, highlight, update, labelPoints, dispose,
    get shown() { return shown.slice(); },
    get owned() { return owned.slice(); },
    get highlighted() { return highlighted; },
    get stats() {
      return {
        signs: shown.length, triangles, highlightTriangles: outlineTriangles, rebuilds,
        
        edges: edgeIds.length, edgeIds: edgeIds.slice(), edgeTexels,
        drawCalls: meshCount(signsObj) + meshCount(outlineObj) + pops.reduce((n, f) => n + meshCount(f.obj), 0),
        popping: pops.length, ready: wanted === drawn && !running,
      };
    },
  };
}
