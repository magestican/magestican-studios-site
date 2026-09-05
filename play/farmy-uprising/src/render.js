



















import * as THREE from 'three';
import { FIELD_MM } from '../../../web-engine/rts/fixed.js';
import { CELLS_PER_SIDE } from '../../../web-engine/rts/maps/mapFormat.js';
import { HERD } from '../../../web-engine/rts/roster.js';
import { facing8, BRADS } from '../../../web-engine/rts/fixed.js';
import { UNITS } from '../../../web-engine/rts/roster.js';
import { unitSpec } from '../../../web-engine/rts/sim/world.js';
import { loadAtlas, rowOf, rowCount, unitScale, fallbackAtlas } from './sprites.js';


const MM = 1000;
const FIELD = FIELD_MM / MM;

const GROUND_PX = 2048;
const MAX_INSTANCES = 4096;








const CLUSTER_MAX = 5;
const CLUSTER = [
  [0, 0], [-0.75, 0.45], [0.75, 0.4], [-0.4, -0.65], [0.5, -0.6],
];

const PALETTE = {
  neutral: '#b9ac86',
  neutralEdge: '#cdc4a8',
  herd: '#5f8f3e',
  herdEdge: '#d8b54a',
  yield: '#7c8087',
  yieldEdge: '#e8701a',
  waterClean: '#2f9e9e',
  waterFoul: ['#2f9e9e', '#4f8f84', '#6b7f6a', '#7a6f4e'],
  keystone: '#a8925f',
  fog: 'rgba(6, 10, 14, 0.72)',
};

export async function createRenderer(canvas, match, viewSeat) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const scene = new THREE.Scene();
  
  scene.background = new THREE.Color('#1d2419');

  
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 4000);
  const view = {
    x: FIELD / 2, y: FIELD / 2,
    
    
    
    
    span: 320,
    minSpan: 130, maxSpan: 620,
    yawSteps: 0,
  };

  function placeCamera() {
    
    
    
    
    
    
    
    
    
    
    
    
    const tilt = (48 * Math.PI) / 180;
    const yaw = (view.yawSteps * Math.PI) / 2;
    const dist = 1200;
    const off = new THREE.Vector3(
      Math.sin(yaw) * Math.sin(tilt) * dist,
      Math.cos(tilt) * dist,
      Math.cos(yaw) * Math.sin(tilt) * dist,
    );
    cam.position.set(view.x + off.x, off.y, view.y + off.z);
    cam.lookAt(view.x, 0, view.y);
    cam.updateProjectionMatrix();
  }

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    const aspect = w / Math.max(1, h);
    cam.left = -view.span * aspect;
    cam.right = view.span * aspect;
    cam.top = view.span;
    cam.bottom = -view.span;
    cam.updateProjectionMatrix();
    placeCamera();
  }

  
  const groundCanvas = document.createElement('canvas');
  groundCanvas.width = GROUND_PX;
  groundCanvas.height = GROUND_PX;
  const gctx = groundCanvas.getContext('2d');
  const groundTex = new THREE.CanvasTexture(groundCanvas);
  groundTex.colorSpace = THREE.SRGBColorSpace;
  groundTex.minFilter = THREE.LinearFilter;
  groundTex.magFilter = THREE.LinearFilter;

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(FIELD, FIELD),
    new THREE.MeshBasicMaterial({ map: groundTex }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(FIELD / 2, 0, FIELD / 2);
  scene.add(ground);

  
  
  
  
  
  
  const surround = new THREE.Mesh(
    new THREE.PlaneGeometry(FIELD * 5, FIELD * 5),
    new THREE.MeshBasicMaterial({ color: new THREE.Color('#2b3524') }),
  );
  surround.rotation.x = -Math.PI / 2;
  surround.position.set(FIELD / 2, -2, FIELD / 2);
  scene.add(surround);

  
  let groundKey = '';

  function paintGround(m, seat) {
    const map = m.w.map;
    const px = GROUND_PX / CELLS_PER_SIDE;
    
    
    for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
      for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
        const sIdx = map.sectorOfCell[cy * CELLS_PER_SIDE + cx];
        const sec = m.w.sectors[sIdx];
        gctx.fillStyle = fillFor(m, sec);
        gctx.fillRect(cx * px, cy * px, px + 1, px + 1);
      }
    }

    
    
    for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
      for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
        const sec = m.w.sectors[map.sectorOfCell[cy * CELLS_PER_SIDE + cx]];
        if (sec.owner === null) continue;
        const isHerd = m.factions[sec.owner] === HERD;
        gctx.fillStyle = 'rgba(255,255,255,0.10)';
        if (isHerd) {
          gctx.fillRect(cx * px + px * 0.3, cy * px + px * 0.3, px * 0.18, px * 0.18);
          gctx.fillRect(cx * px + px * 0.68, cy * px + px * 0.62, px * 0.14, px * 0.14);
        } else {
          gctx.fillRect(cx * px, cy * px, px, 1.5);
          gctx.fillRect(cx * px, cy * px, 1.5, px);
        }
      }
    }

    
    for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
      for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
        const here = map.sectorOfCell[cy * CELLS_PER_SIDE + cx];
        const right = cx + 1 < CELLS_PER_SIDE ? map.sectorOfCell[cy * CELLS_PER_SIDE + cx + 1] : here;
        const down = cy + 1 < CELLS_PER_SIDE ? map.sectorOfCell[(cy + 1) * CELLS_PER_SIDE + cx] : here;
        const sec = m.w.sectors[here];
        gctx.fillStyle = edgeFor(m, sec);
        if (right !== here) gctx.fillRect((cx + 1) * px - 2, cy * px, 4, px);
        if (down !== here) gctx.fillRect(cx * px, (cy + 1) * px - 2, px, 4);
      }
    }

    
    
    const vis = m.presence.visible;
    const sc = m.w.sectors.length;
    for (let cy = 0; cy < CELLS_PER_SIDE; cy += 1) {
      for (let cx = 0; cx < CELLS_PER_SIDE; cx += 1) {
        const sIdx = map.sectorOfCell[cy * CELLS_PER_SIDE + cx];
        if (vis[seat * sc + sIdx]) continue;
        gctx.fillStyle = PALETTE.fog;
        gctx.fillRect(cx * px, cy * px, px + 1, px + 1);
      }
    }
    groundTex.needsUpdate = true;
  }

  function fillFor(m, sec) {
    if (sec.kind === 'water') {
      return PALETTE.waterFoul[Math.min(3, sec.pollution)];
    }
    if (sec.owner === null) return sec.kind === 'keystone' ? PALETTE.keystone : PALETTE.neutral;
    return m.factions[sec.owner] === HERD ? PALETTE.herd : PALETTE.yield;
  }

  function edgeFor(m, sec) {
    if (sec.owner === null) return PALETTE.neutralEdge;
    return m.factions[sec.owner] === HERD ? PALETTE.herdEdge : PALETTE.yieldEdge;
  }

  
  
  
  
  
  let atlasImage;
  let manifest;
  try {
    const loaded = await loadAtlas();
    atlasImage = loaded.image;
    manifest = loaded.manifest;
  } catch (e) {
    const ids = Object.keys(UNITS).sort();
    atlasImage = fallbackAtlas(ids);
    manifest = {
      tile: 64,
      facings: 8,
      rows: Object.fromEntries(ids.map((k, i) => [k, { row: i, worldSize: 2 }])),
    };
    
    console.warn(`Farmy Uprising: sprite atlas missing (${e.message}) - placeholders`);
  }
  const ATLAS_COLS = manifest.facings || 8;
  const ATLAS_ROWS = Math.max(1, rowCount(manifest));

  const atlas = new THREE.Texture(atlasImage);
  atlas.needsUpdate = true;
  atlas.colorSpace = THREE.SRGBColorSpace;
  atlas.minFilter = THREE.LinearMipmapLinearFilter;
  atlas.magFilter = THREE.LinearFilter;

  const unitGeo = new THREE.PlaneGeometry(1, 1);
  
  const tileAttr = new THREE.InstancedBufferAttribute(new Float32Array(MAX_INSTANCES * 2), 2);
  unitGeo.setAttribute('aTile', tileAttr);

  const unitMat = new THREE.MeshBasicMaterial({
    map: atlas, transparent: true, alphaTest: 0.35, depthWrite: false,
  });
  
  
  
  unitMat.onBeforeCompile = (shader) => {
    shader.vertexShader = `attribute vec2 aTile;\nvarying vec2 vTile;\n${shader.vertexShader}`
      .replace('#include <uv_vertex>', '#include <uv_vertex>\n  vTile = aTile;');
    
    
    
    shader.fragmentShader = `varying vec2 vTile;\n${shader.fragmentShader}`
      .replace(
        '#include <map_fragment>',
        `#ifdef USE_MAP
           vec2 tiledUv = vec2(
             (vMapUv.x + vTile.x) / ${ATLAS_COLS}.0,
             1.0 - ((1.0 - vMapUv.y) + vTile.y) / ${ATLAS_ROWS}.0
           );
           vec4 sampledDiffuseColor = texture2D( map, tiledUv );
           diffuseColor *= sampledDiffuseColor;
         #endif`,
      );
  };

  const units = new THREE.InstancedMesh(unitGeo, unitMat, MAX_INSTANCES);
  units.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  units.count = 0;
  units.frustumCulled = false;
  scene.add(units);

  
  const bGeo = new THREE.PlaneGeometry(1, 1);
  const bMat = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.95 });
  const buildings = new THREE.InstancedMesh(bGeo, bMat, 256);
  buildings.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  buildings.count = 0;
  buildings.frustumCulled = false;
  scene.add(buildings);

  const dummy = new THREE.Object3D();
  const colour = new THREE.Color();

  






  function billboardRotation() {
    return -(view.yawSteps * Math.PI) / 2;
  }

  function drawUnits(m, seat) {
    const w = m.w;
    const vis = m.presence.visible;
    const sc = w.sectors.length;
    const yaw = billboardRotation();
    let n = 0;
    for (let i = 0; i < w.u.count && n < MAX_INSTANCES; i += 1) {
      if (!w.u.alive[i] || w.u.owner[i] < 0) continue;
      
      
      
      
      
      const sec = w.u.sector[i];
      if (sec >= 0 && !vis[seat * sc + sec]) continue;

      const spec = unitSpec(w, i);
      const s = unitScale(spec.id, manifest);
      
      
      
      
      
      const face = facing8(w.u.facing[i] + Math.round((view.yawSteps * BRADS) / 4));
      const row = rowOf(manifest, spec.id);

      
      
      
      
      
      
      
      
      
      
      
      
      const drawn = Math.min(w.u.members[i], CLUSTER_MAX);
      for (let k = 0; k < drawn && n < MAX_INSTANCES; k += 1) {
        const off = CLUSTER[k];
        dummy.position.set(
          w.u.x[i] / MM + off[0] * s * 0.42,
          s * 0.5,
          w.u.y[i] / MM + off[1] * s * 0.42,
        );
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(s, s, s);
        dummy.updateMatrix();
        units.setMatrixAt(n, dummy.matrix);
        tileAttr.setXY(n, face, row);
        
        
        
        colour.setHex(w.u.owner[i] === seat ? 0xffffff : 0xffc7b2);
        units.setColorAt(n, colour);
        n += 1;
      }
    }
    units.count = n;
    units.instanceMatrix.needsUpdate = true;
    tileAttr.needsUpdate = true;
    if (units.instanceColor) units.instanceColor.needsUpdate = true;
  }

  function drawBuildings(m, seat) {
    const w = m.w;
    const vis = m.presence.visible;
    const sc = w.sectors.length;
    let n = 0;
    for (let i = 0; i < w.b.count && n < 256; i += 1) {
      if (!w.b.alive[i] || w.b.owner[i] < 0) continue;
      const sec = w.b.sector[i];
      if (sec >= 0 && !vis[seat * sc + sec]) continue;
      const size = w.b.building[i] > 0 ? 14 : 22;
      dummy.position.set(w.b.x[i] / MM, 0.6, w.b.y[i] / MM);
      dummy.rotation.set(-Math.PI / 2, 0, 0);
      dummy.scale.set(size, size, size);
      dummy.updateMatrix();
      buildings.setMatrixAt(n, dummy.matrix);
      const isHerd = m.factions[w.b.owner[i]] === HERD;
      
      
      colour.set(w.b.building[i] > 0 ? '#d8d2bd' : (isHerd ? '#3f6b28' : '#4d5560'));
      buildings.setColorAt(n, colour);
      n += 1;
    }
    buildings.count = n;
    buildings.instanceMatrix.needsUpdate = true;
    if (buildings.instanceColor) buildings.instanceColor.needsUpdate = true;
  }

  
  
  
  
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.62, 0.82, 28),
    new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, side: THREE.DoubleSide }),
  );
  marker.rotation.x = -Math.PI / 2;
  marker.visible = false;
  scene.add(marker);
  let markerUntil = 0;

  function markOrder(xMm, yMm) {
    marker.position.set(xMm / MM, 1.5, yMm / MM);
    marker.visible = true;
    markerUntil = performance.now() + 2000;
  }

  
  function frame(m, seat, now = 0) {
    
    
    let key = '';
    for (let i = 0; i < m.w.sectors.length; i += 1) {
      const s = m.w.sectors[i];
      key += `${s.owner === null ? '-' : s.owner}${s.pollution}`;
    }
    const vis = m.presence.visible;
    const sc = m.w.sectors.length;
    for (let i = 0; i < sc; i += 1) key += vis[seat * sc + i] ? '1' : '0';
    if (key !== groundKey) { groundKey = key; paintGround(m, seat); }

    if (marker.visible) {
      const left = markerUntil - (now || performance.now());
      if (left <= 0) marker.visible = false;
      else {
        
        
        const t = 1 - left / 2000;
        const size = 40 + t * 34;
        marker.scale.set(size, size, size);
        marker.material.opacity = 0.85 * (1 - t);
      }
    }

    drawBuildings(m, seat);
    drawUnits(m, seat);
    renderer.render(scene, cam);
  }

  
  const api = {
    frame,
    resize,
    view,
    panBy(dxPx, dyPx) {
      const h = renderer.domElement.clientHeight || 1;
      const scale = (view.span * 2) / h;
      const yaw = (view.yawSteps * Math.PI) / 2;
      const dx = dxPx * scale;
      const dy = dyPx * scale;
      view.x -= dx * Math.cos(yaw) + dy * Math.sin(yaw);
      view.y -= dy * Math.cos(yaw) - dx * Math.sin(yaw);
      clampView();
      placeCamera();
    },
    zoomBy(factor) {
      view.span = Math.max(view.minSpan, Math.min(view.maxSpan, view.span * factor));
      resize();
    },
    rotate(dir) {
      view.yawSteps = (view.yawSteps + dir + 4) % 4;
      placeCamera();
    },
    centreOn(xMm, yMm) {
      view.x = xMm / MM;
      view.y = yMm / MM;
      clampView();
      placeCamera();
    },
    
    pick(clientX, clientY) {
      const rect = renderer.domElement.getBoundingClientRect();
      const ndc = new THREE.Vector2(
        ((clientX - rect.left) / rect.width) * 2 - 1,
        -((clientY - rect.top) / rect.height) * 2 + 1,
      );
      const ray = new THREE.Raycaster();
      ray.setFromCamera(ndc, cam);
      const hit = ray.intersectObject(ground, false);
      if (hit.length === 0) return null;
      return { x: Math.round(hit[0].point.x * MM), y: Math.round(hit[0].point.z * MM) };
    },
    markOrder,
    








    reset(m, seat) {
      groundKey = '';
      marker.visible = false;
      units.count = 0;
      buildings.count = 0;
      view.span = 320;
      view.yawSteps = 0;
      const sp = m.w.map.spawns.find((s) => s.seat === seat);
      if (sp) { view.x = sp.x / MM; view.y = sp.y / MM; }
      clampView();
      resize();
    },
    dispose() { renderer.dispose(); },
  };

  function clampView() {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    const inset = Math.min(view.span * 0.55, FIELD / 2);
    view.x = Math.max(inset, Math.min(FIELD - inset, view.x));
    view.y = Math.max(inset, Math.min(FIELD - inset, view.y));
  }

  resize();
  const spawn = match.w.map.spawns.find((s) => s.seat === viewSeat);
  if (spawn) api.centreOn(spawn.x, spawn.y);
  return api;
}
